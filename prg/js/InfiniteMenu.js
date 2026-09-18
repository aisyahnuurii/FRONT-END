/* InfiniteMenu.js — Vanilla JS port dari React Bits InfiniteMenu
   Dependencies: gl-matrix (local file) */
// Tambahkan di awal InfiniteMenu.js setelah deklarasi
if (typeof vec2.clone === 'undefined') {
  vec2.clone = function(a) {
    return vec2.fromValues(a[0], a[1]);
  };
}
if (typeof vec3.clone === 'undefined') {
  vec3.clone = function(a) {
    return vec3.fromValues(a[0], a[1], a[2]);
  };
}
if (typeof mat4.clone === 'undefined') {
  mat4.clone = function(a) {
    var out = new Float32Array(16);
    out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
    out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
    out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    return out;
  };
}


const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;
out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;
void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}`;

const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;
void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    float scale = max(imageAspect / containerAspect, containerAspect / imageAspect);
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}`;

class Face { constructor(a,b,c){ this.a=a; this.b=b; this.c=c; } }

class Vertex {
  constructor(x,y,z){
    this.position = vec3.fromValues(x,y,z);
    this.normal = vec3.create();
    this.uv = vec2.create();
  }
}

class Geometry {
  constructor(){ this.vertices=[]; this.faces=[]; }
  addVertex(...args){
    for(let i=0;i<args.length;i+=3) this.vertices.push(new Vertex(args[i],args[i+1],args[i+2]));
    return this;
  }
  addFace(...args){
    for(let i=0;i<args.length;i+=3) this.faces.push(new Face(args[i],args[i+1],args[i+2]));
    return this;
  }
  get lastVertex(){ return this.vertices[this.vertices.length-1]; }
  subdivide(divisions=1){
    const cache={}; let f=this.faces;
    for(let div=0; div<divisions; ++div){
      const newFaces = new Array(f.length*4);
      f.forEach((face,ndx)=>{
        const mAB=this.getMidPoint(face.a,face.b,cache);
        const mBC=this.getMidPoint(face.b,face.c,cache);
        const mCA=this.getMidPoint(face.c,face.a,cache);
        const i=ndx*4;
        newFaces[i+0]=new Face(face.a,mAB,mCA);
        newFaces[i+1]=new Face(face.b,mBC,mAB);
        newFaces[i+2]=new Face(face.c,mCA,mBC);
        newFaces[i+3]=new Face(mAB,mBC,mCA);
      });
      f=newFaces;
    }
    this.faces=f; return this;
  }
  spherize(radius=1){
    this.vertices.forEach(v=>{
      vec3.normalize(v.normal,v.position);
      vec3.scale(v.position,v.normal,radius);
    });
    return this;
  }
  get data(){ return { vertices:this.vertexData, indices:this.indexData, normals:this.normalData, uvs:this.uvData }; }
  get vertexData(){ return new Float32Array(this.vertices.flatMap(v=>Array.from(v.position))); }
  get normalData(){ return new Float32Array(this.vertices.flatMap(v=>Array.from(v.normal))); }
  get uvData(){ return new Float32Array(this.vertices.flatMap(v=>Array.from(v.uv))); }
  get indexData(){ return new Uint16Array(this.faces.flatMap(f=>[f.a,f.b,f.c])); }
  getMidPoint(a,b,cache){
    const key = a<b ? `k_${b}_${a}` : `k_${a}_${b}`;
    if(Object.prototype.hasOwnProperty.call(cache,key)) return cache[key];
    const va=this.vertices[a].position, vb=this.vertices[b].position;
    const ndx=this.vertices.length;
    cache[key]=ndx;
    this.addVertex((va[0]+vb[0])*.5,(va[1]+vb[1])*.5,(va[2]+vb[2])*.5);
    return ndx;
  }
}

class IcosahedronGeometry extends Geometry {
  constructor(){
    super();
    const t = Math.sqrt(5)*.5+.5;
    this.addVertex(-1,t,0, 1,t,0, -1,-t,0, 1,-t,0, 0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t, t,0,-1, t,0,1, -t,0,-1, -t,0,1)
      .addFace(0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2, 10,7,6, 7,1,8, 3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1);
  }
}

class DiscGeometry extends Geometry {
  constructor(steps=4,radius=1){
    super(); steps=Math.max(4,steps);
    const alpha=(2*Math.PI)/steps;
    this.addVertex(0,0,0);
    this.lastVertex.uv[0]=.5; this.lastVertex.uv[1]=.5;
    for(let i=0;i<steps;++i){
      const x=Math.cos(alpha*i), y=Math.sin(alpha*i);
      this.addVertex(radius*x,radius*y,0);
      this.lastVertex.uv[0]=x*.5+.5; this.lastVertex.uv[1]=y*.5+.5;
      if(i>0) this.addFace(0,i,i+1);
    }
    this.addFace(0,steps,1);
  }
}

function createShader(gl,type,source){
  const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
  if(gl.getShaderParameter(s,gl.COMPILE_STATUS)) return s;
  console.error(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null;
}

function createProgram(gl,sources,attribs){
  const p=gl.createProgram();
  [gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].forEach((t,i)=>{
    const s=createShader(gl,t,sources[i]); if(s) gl.attachShader(p,s);
  });
  if(attribs) for(const k in attribs) gl.bindAttribLocation(p,attribs[k],k);
  gl.linkProgram(p);
  if(gl.getProgramParameter(p,gl.LINK_STATUS)) return p;
  console.error(gl.getProgramInfoLog(p)); gl.deleteProgram(p); return null;
}

function makeVertexArray(gl,bufLocNumElmPairs,indices){
  const va=gl.createVertexArray(); gl.bindVertexArray(va);
  for(const [buf,loc,num] of bufLocNumElmPairs){
    if(loc===-1) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,num,gl.FLOAT,false,0,0);
  }
  if(indices){
    const ib=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  }
  gl.bindVertexArray(null); return va;
}

function resizeCanvasToDisplaySize(canvas){
  const dpr=Math.min(2,window.devicePixelRatio);
  const w=Math.round(canvas.clientWidth*dpr), h=Math.round(canvas.clientHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; return true; }
  return false;
}

function makeBuffer(gl,sizeOrData,usage){
  const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,sizeOrData,usage); gl.bindBuffer(gl.ARRAY_BUFFER,null);
  return b;
}

function createAndSetupTexture(gl,min,mag,ws,wt){
  const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,ws);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wt);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,min);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,mag);
  return t;
}

class ArcballControl {
  isPointerDown=false;
  orientation=quat.create(); pointerRotation=quat.create();
  rotationVelocity=0; rotationAxis=vec3.fromValues(1,0,0);
  snapDirection=vec3.fromValues(0,0,-1); snapTargetDirection;
  EPSILON=0.1; IDENTITY_QUAT=quat.create();
  constructor(canvas,cb){
    this.canvas=canvas; this.updateCallback=cb||(()=>null);
    this.pointerPos=vec2.create(); this.previousPointerPos=vec2.create();
    this._rotationVelocity=0; this._combinedQuat=quat.create();
    canvas.addEventListener('pointerdown',e=>{
      vec2.set(this.pointerPos,e.clientX,e.clientY);
      vec2.copy(this.previousPointerPos,this.pointerPos);
      this.isPointerDown=true;
    });
    canvas.addEventListener('pointerup',()=>this.isPointerDown=false);
    canvas.addEventListener('pointerleave',()=>this.isPointerDown=false);
    canvas.addEventListener('pointermove',e=>{
      if(this.isPointerDown) vec2.set(this.pointerPos,e.clientX,e.clientY);
    });
    canvas.style.touchAction='none';
  }
  update(deltaTime,target=16){
    const ts=deltaTime/target+0.00001; let af=ts; let snap=quat.create();
    if(this.isPointerDown){
      const I=0.3*ts, AA=5/ts;
      const mid=vec2.sub(vec2.create(),this.pointerPos,this.previousPointerPos);
      vec2.scale(mid,mid,I);
      if(vec2.sqrLen(mid)>this.EPSILON){
        vec2.add(mid,this.previousPointerPos,mid);
        const p=this.#project(mid), q=this.#project(this.previousPointerPos);
        const a=vec3.normalize(vec3.create(),p), b=vec3.normalize(vec3.create(),q);
        vec2.copy(this.previousPointerPos,mid);
        af*=AA; this.quatFromVectors(a,b,this.pointerRotation,af);
      } else quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,I);
    } else {
      const I=0.1*ts;
      quat.slerp(this.pointerRotation,this.pointerRotation,this.IDENTITY_QUAT,I);
      if(this.snapTargetDirection){
        const SI=0.2, a=this.snapTargetDirection, b=this.snapDirection;
        const sd=vec3.squaredDistance(a,b), df=Math.max(0.1,1-sd*10);
        af*=SI*df; this.quatFromVectors(a,b,snap,af);
      }
    }
    const cq=quat.multiply(quat.create(),snap,this.pointerRotation);
    this.orientation=quat.multiply(quat.create(),cq,this.orientation);
    quat.normalize(this.orientation,this.orientation);
    const RAI=0.8*ts;
    quat.slerp(this._combinedQuat,this._combinedQuat,cq,RAI);
    quat.normalize(this._combinedQuat,this._combinedQuat);
    const rad=Math.acos(this._combinedQuat[3])*2, s=Math.sin(rad/2);
    let rv=0;
    if(s>0.000001){
      rv=rad/(2*Math.PI);
      this.rotationAxis[0]=this._combinedQuat[0]/s;
      this.rotationAxis[1]=this._combinedQuat[1]/s;
      this.rotationAxis[2]=this._combinedQuat[2]/s;
    }
    const RVI=0.5*ts;
    this._rotationVelocity+=(rv-this._rotationVelocity)*RVI;
    this.rotationVelocity=this._rotationVelocity/ts;
    this.updateCallback(deltaTime);
  }
  quatFromVectors(a,b,out,af=1){
    const axis=vec3.normalize(vec3.create(),vec3.cross(vec3.create(),a,b));
    const d=Math.max(-1,Math.min(1,vec3.dot(a,b)));
    quat.setAxisAngle(out,axis,Math.acos(d)*af);
    return {q:out,axis,angle:Math.acos(d)*af};
  }
  #project(pos){
    const r=2, w=this.canvas.clientWidth, h=this.canvas.clientHeight;
    const s=Math.max(w,h)-1;
    const x=(2*pos[0]-w-1)/s, y=(2*pos[1]-h-1)/s;
    let z=0; const xySq=x*x+y*y, rSq=r*r;
    if(xySq<=rSq/2) z=Math.sqrt(rSq-xySq); else z=rSq/Math.sqrt(xySq);
    return vec3.fromValues(-x,y,z);
  }
}

class InfiniteGridMenu {
  TARGET_FRAME_DURATION=1000/60; SPHERE_RADIUS=2;
  #time=0; #deltaTime=0; #deltaFrames=0; #frames=0;
  camera={
    matrix:mat4.create(), near:0.1, far:40, fov:Math.PI/4, aspect:1,
    position:vec3.fromValues(0,0,3), up:vec3.fromValues(0,1,0),
    matrices:{ view:mat4.create(), projection:mat4.create(), inversProjection:mat4.create() }
  };
  smoothRotationVelocity=0; scaleFactor=1.0; movementActive=false;
  constructor(canvas,items,onActive,onMovement,onInit=null,scale=1.0){
    this.canvas=canvas; this.items=items||[];
    this.onActiveItemChange=onActive||(()=>{});
    this.onMovementChange=onMovement||(()=>{});
    this.scaleFactor=scale; this.camera.position[2]=3*scale;
    this.#init(onInit);
  }
  resize(){
    this.viewportSize=vec2.set(this.viewportSize||vec2.create(),this.canvas.clientWidth,this.canvas.clientHeight);
    const gl=this.gl; const need=resizeCanvasToDisplaySize(gl.canvas);
    if(need) gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
    this.#updateProjectionMatrix(gl);
  }
  run(time=0){
    this.#deltaTime=Math.min(32,time-this.#time); this.#time=time;
    this.#deltaFrames=this.#deltaTime/this.TARGET_FRAME_DURATION;
    this.#frames+=this.#deltaFrames;
    this.#animate(this.#deltaTime); this.#render();
    requestAnimationFrame(t=>this.run(t));
  }
  #init(onInit){
    this.gl=this.canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:false});
    const gl=this.gl; if(!gl) throw new Error('No WebGL 2!');
    this.viewportSize=vec2.fromValues(this.canvas.clientWidth,this.canvas.clientHeight);
    this.drawBufferSize=vec2.clone(this.viewportSize);
    this.discProgram=createProgram(gl,[discVertShaderSource,discFragShaderSource],{
      aModelPosition:0, aModelNormal:1, aModelUvs:2, aInstanceMatrix:3
    });
    this.discLocations={
      aModelPosition:gl.getAttribLocation(this.discProgram,'aModelPosition'),
      aModelUvs:gl.getAttribLocation(this.discProgram,'aModelUvs'),
      aInstanceMatrix:gl.getAttribLocation(this.discProgram,'aInstanceMatrix'),
      uWorldMatrix:gl.getUniformLocation(this.discProgram,'uWorldMatrix'),
      uViewMatrix:gl.getUniformLocation(this.discProgram,'uViewMatrix'),
      uProjectionMatrix:gl.getUniformLocation(this.discProgram,'uProjectionMatrix'),
      uCameraPosition:gl.getUniformLocation(this.discProgram,'uCameraPosition'),
      uScaleFactor:gl.getUniformLocation(this.discProgram,'uScaleFactor'),
      uRotationAxisVelocity:gl.getUniformLocation(this.discProgram,'uRotationAxisVelocity'),
      uTex:gl.getUniformLocation(this.discProgram,'uTex'),
      uFrames:gl.getUniformLocation(this.discProgram,'uFrames'),
      uItemCount:gl.getUniformLocation(this.discProgram,'uItemCount'),
      uAtlasSize:gl.getUniformLocation(this.discProgram,'uAtlasSize')
    };
    this.discGeo=new DiscGeometry(56,1);
    this.discBuffers=this.discGeo.data;
    this.discVAO=makeVertexArray(gl,[
      [makeBuffer(gl,this.discBuffers.vertices,gl.STATIC_DRAW),this.discLocations.aModelPosition,3],
      [makeBuffer(gl,this.discBuffers.uvs,gl.STATIC_DRAW),this.discLocations.aModelUvs,2]
    ],this.discBuffers.indices);
    this.icoGeo=new IcosahedronGeometry();
    this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
    this.instancePositions=this.icoGeo.vertices.map(v=>v.position);
    this.DISC_INSTANCE_COUNT=this.icoGeo.vertices.length;
    this.#initDiscInstances(this.DISC_INSTANCE_COUNT);
    this.worldMatrix=mat4.create();
    this.#initTexture();
    this.control=new ArcballControl(this.canvas,dt=>this.#onControlUpdate(dt));
    this.#updateCameraMatrix(); this.#updateProjectionMatrix(gl); this.resize();
    if(onInit) onInit(this);
  }
  #initTexture(){
  const gl = this.gl;
  this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
  const count = Math.max(1, this.items.length);
  this.atlasSize = Math.ceil(Math.sqrt(count));
  const cvs = document.createElement('canvas'), ctx = cvs.getContext('2d'), cell = 512;
  cvs.width = this.atlasSize * cell; cvs.height = this.atlasSize * cell;
  
  // Fill background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  
  let loadedCount = 0;
  const totalImages = this.items.length;
  
  // Fungsi untuk upload ke GPU
  const uploadTexture = () => {
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cvs);
    gl.generateMipmap(gl.TEXTURE_2D);
    console.log('✅ Texture atlas berhasil diupload ke GPU!');
  };
  
  // Jika tidak ada gambar, langsung upload
  if (totalImages === 0) {
    uploadTexture();
    return;
  }
  
  this.items.forEach((item, index) => {
    const x = (index % this.atlasSize) * cell;
    const y = Math.floor(index / this.atlasSize) * cell;
    
    // Jika image adalah '#' atau kosong, buat placeholder
    if (!item.image || item.image === '#') {
      const colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x + 20, y + 20, cell - 40, cell - 40);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.title || `Foto ${index+1}`, x + cell/2, y + cell/2 - 20);
      ctx.font = '48px sans-serif';
      ctx.fillText('🖼️', x + cell/2, y + cell/2 + 50);
      
      loadedCount++;
      if (loadedCount === totalImages) uploadTexture();
      return;
    }
    
    // Load gambar
    const img = new Image();
    
    // Set crossOrigin hanya untuk URL online
    if (item.image.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = function() {
      try {
        // Gambar ke canvas
        ctx.drawImage(img, x, y, cell, cell);
        console.log(` Gambar ${index+1} berhasil dimuat: ${item.image}`);
      } catch (e) {
        console.warn(` Error menggambar gambar ${index+1}:`, e);
        // Fallback ke placeholder
        const colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x + 20, y + 20, cell - 40, cell - 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(' Error', x + cell/2, y + cell/2);
      }
      
      loadedCount++;
      if (loadedCount === totalImages) uploadTexture();
    };
    
    img.onerror = function() {
      console.warn(` Gagal memuat gambar ${index+1}: ${item.image}`);
      // Gambar placeholder
      const colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x + 20, y + 20, cell - 40, cell - 40);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(' Gagal', x + cell/2, y + cell/2 - 20);
      ctx.font = '48px sans-serif';
      ctx.fillText('🖼️', x + cell/2, y + cell/2 + 50);
      
      loadedCount++;
      if (loadedCount === totalImages) uploadTexture();
    };
    
    img.src = item.image;
  });
}
  #initDiscInstances(count){
    const gl=this.gl;
    this.discInstances={ matricesArray:new Float32Array(count*16), matrices:[], buffer:gl.createBuffer() };
    for(let i=0;i<count;++i){
      const arr=new Float32Array(this.discInstances.matricesArray.buffer,i*16*4,16);
      arr.set(mat4.create()); this.discInstances.matrices.push(arr);
    }
    gl.bindVertexArray(this.discVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.discInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,this.discInstances.matricesArray.byteLength,gl.DYNAMIC_DRAW);
    for(let j=0;j<4;++j){
      const loc=this.discLocations.aInstanceMatrix+j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc,4,gl.FLOAT,false,64,j*16);
      gl.vertexAttribDivisor(loc,1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,null); gl.bindVertexArray(null);
  }
  #animate(deltaTime){
    const gl=this.gl; this.control.update(deltaTime,this.TARGET_FRAME_DURATION);
    const positions=this.instancePositions.map(p=>vec3.transformQuat(vec3.create(),p,this.control.orientation));
    const scale=0.25, SI=0.6;
    positions.forEach((p,ndx)=>{
      const s=(Math.abs(p[2])/this.SPHERE_RADIUS)*SI+(1-SI);
      const fs=s*scale; const m=mat4.create();
      mat4.multiply(m,m,mat4.fromTranslation(mat4.create(),vec3.negate(vec3.create(),p)));
      mat4.multiply(m,m,mat4.targetTo(mat4.create(),[0,0,0],p,[0,1,0]));
      mat4.multiply(m,m,mat4.fromScaling(mat4.create(),[fs,fs,fs]));
      mat4.multiply(m,m,mat4.fromTranslation(mat4.create(),[0,0,-this.SPHERE_RADIUS]));
      mat4.copy(this.discInstances.matrices[ndx],m);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER,this.discInstances.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,this.discInstances.matricesArray);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    this.smoothRotationVelocity=this.control.rotationVelocity;
  }
  #render(){
    const gl=this.gl; gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.discLocations.uWorldMatrix,false,this.worldMatrix);
    gl.uniformMatrix4fv(this.discLocations.uViewMatrix,false,this.camera.matrices.view);
    gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix,false,this.camera.matrices.projection);
    gl.uniform3f(this.discLocations.uCameraPosition,this.camera.position[0],this.camera.position[1],this.camera.position[2]);
    gl.uniform4f(this.discLocations.uRotationAxisVelocity,
      this.control.rotationAxis[0],this.control.rotationAxis[1],this.control.rotationAxis[2],
      this.smoothRotationVelocity*1.1);
    gl.uniform1i(this.discLocations.uItemCount,this.items.length);
    gl.uniform1i(this.discLocations.uAtlasSize,this.atlasSize);
    gl.uniform1f(this.discLocations.uFrames,this.#frames);
    gl.uniform1f(this.discLocations.uScaleFactor,this.scaleFactor);
    gl.uniform1i(this.discLocations.uTex,0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this.tex);
    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(gl.TRIANGLES,this.discBuffers.indices.length,gl.UNSIGNED_SHORT,0,this.DISC_INSTANCE_COUNT);
  }
  #updateCameraMatrix(){
    mat4.targetTo(this.camera.matrix,this.camera.position,[0,0,0],this.camera.up);
    mat4.invert(this.camera.matrices.view,this.camera.matrix);
  }
  #updateProjectionMatrix(gl){
    this.camera.aspect=gl.canvas.clientWidth/gl.canvas.clientHeight;
    const h=this.SPHERE_RADIUS*0.35, d=this.camera.position[2];
    this.camera.fov = this.camera.aspect>1 ? 2*Math.atan(h/d) : 2*Math.atan(h/this.camera.aspect/d);
    mat4.perspective(this.camera.matrices.projection,this.camera.fov,this.camera.aspect,this.camera.near,this.camera.far);
    mat4.invert(this.camera.matrices.inversProjection,this.camera.matrices.projection);
  }
  #onControlUpdate(deltaTime){
    const ts=deltaTime/this.TARGET_FRAME_DURATION+0.0001;
    let damping=5/ts; let targetZ=3*this.scaleFactor;
    const isMoving=this.control.isPointerDown||Math.abs(this.smoothRotationVelocity)>0.01;
    if(isMoving!==this.movementActive){
      this.movementActive=isMoving; this.onMovementChange(isMoving);
    }
    if(!this.control.isPointerDown){
      const idx=this.#findNearestVertexIndex();
      const itemIdx=idx%Math.max(1,this.items.length);
      this.onActiveItemChange(itemIdx);
      const snap=vec3.normalize(vec3.create(),this.#getVertexWorldPosition(idx));
      this.control.snapTargetDirection=snap;
    } else {
      targetZ+=this.control.rotationVelocity*80+2.5; damping=7/ts;
    }
    this.camera.position[2]+=(targetZ-this.camera.position[2])/damping;
    this.#updateCameraMatrix();
  }
  #findNearestVertexIndex(){
    const n=this.control.snapDirection;
    const inv=quat.conjugate(quat.create(),this.control.orientation);
    const nt=vec3.transformQuat(vec3.create(),n,inv);
    let maxD=-1, idx;
    for(let i=0;i<this.instancePositions.length;++i){
      const d=vec3.dot(nt,this.instancePositions[i]);
      if(d>maxD){ maxD=d; idx=i; }
    }
    return idx;
  }
  #getVertexWorldPosition(i){
    return vec3.transformQuat(vec3.create(),this.instancePositions[i],this.control.orientation);
  }
}

window.InfiniteGridMenu = InfiniteGridMenu;