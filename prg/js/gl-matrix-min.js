// js/gl-matrix-min.js 
(function() {
  var glMatrix = {};
  
  // Konfigurasi dasar
  glMatrix.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
  glMatrix.EPSILON = 0.000001;
  glMatrix.RANDOM = Math.random;
  glMatrix.toRadian = function(degrees) {
    return degrees * Math.PI / 180;
  };
  
  // mat4 
  glMatrix.mat4 = {
    create: function() {
      var out = new glMatrix.ARRAY_TYPE(16);
      out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
      out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
      return out;
    },
    identity: function(out) {
      out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
      out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
      return out;
    },
    clone: function(a) {
      var out = new glMatrix.ARRAY_TYPE(16);
      out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
      out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
      out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
      out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      return out;
    },
    copy: function(out, a) {
      out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
      out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
      out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
      out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
      return out;
    },
    multiply: function(out, a, b) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
      out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      return out;
    },
    mul: function(out, a, b) { return this.multiply(out, a, b); },
    fromTranslation: function(out, v) {
      out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
      out[12] = v[0]; out[13] = v[1]; out[14] = v[2]; out[15] = 1;
      return out;
    },
    fromScaling: function(out, v) {
      out[0] = v[0]; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = v[1]; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = v[2]; out[11] = 0;
      out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
      return out;
    },
    targetTo: function(out, eye, target, up) {
      var eyex = eye[0], eyey = eye[1], eyez = eye[2];
      var upx = up[0], upy = up[1], upz = up[2];
      var zx = eyex - target[0], zy = eyey - target[1], zz = eyez - target[2];
      var len = Math.sqrt(zx*zx + zy*zy + zz*zz);
      if (len > 0) { zx /= len; zy /= len; zz /= len; }
      var xx = upy * zz - upz * zy;
      var xy = upz * zx - upx * zz;
      var xz = upx * zy - upy * zx;
      len = Math.sqrt(xx*xx + xy*xy + xz*xz);
      if (len > 0) { xx /= len; xy /= len; xz /= len; }
      var yx = zy * xz - zz * xy;
      var yy = zz * xx - zx * xz;
      var yz = zx * xy - zy * xx;
      out[0] = xx; out[1] = xy; out[2] = xz; out[3] = 0;
      out[4] = yx; out[5] = yy; out[6] = yz; out[7] = 0;
      out[8] = zx; out[9] = zy; out[10] = zz; out[11] = 0;
      out[12] = eyex; out[13] = eyey; out[14] = eyez; out[15] = 1;
      return out;
    },
    invert: function(out, a) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      var b00 = a00 * a11 - a01 * a10;
      var b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10;
      var b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11;
      var b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30;
      var b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30;
      var b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31;
      var b11 = a22 * a33 - a23 * a32;
      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if (!det) return null;
      det = 1.0 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    },
    perspective: function(out, fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2);
      var nf = 1 / (near - far);
      out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
      out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
      out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
      out[12] = 0; out[13] = 0; out[14] = (2 * far * near) * nf; out[15] = 0;
      return out;
    }
  };
  
  //  vec3 
  glMatrix.vec3 = {
    create: function() {
      var out = new glMatrix.ARRAY_TYPE(3);
      out[0] = 0; out[1] = 0; out[2] = 0;
      return out;
    },
    clone: function(a) {
      var out = new glMatrix.ARRAY_TYPE(3);
      out[0] = a[0]; out[1] = a[1]; out[2] = a[2];
      return out;
    },
    fromValues: function(x, y, z) {
      var out = new glMatrix.ARRAY_TYPE(3);
      out[0] = x; out[1] = y; out[2] = z;
      return out;
    },
    copy: function(out, a) {
      out[0] = a[0]; out[1] = a[1]; out[2] = a[2];
      return out;
    },
    set: function(out, x, y, z) {
      out[0] = x; out[1] = y; out[2] = z;
      return out;
    },
    normalize: function(out, a) {
      var x = a[0], y = a[1], z = a[2];
      var len = Math.sqrt(x*x + y*y + z*z);
      if (len > 0) {
        len = 1 / len;
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
      }
      return out;
    },
    cross: function(out, a, b) {
      var ax = a[0], ay = a[1], az = a[2];
      var bx = b[0], by = b[1], bz = b[2];
      out[0] = ay * bz - az * by;
      out[1] = az * bx - ax * bz;
      out[2] = ax * by - ay * bx;
      return out;
    },
    dot: function(a, b) {
      return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    },
    scale: function(out, a, s) {
      out[0] = a[0] * s;
      out[1] = a[1] * s;
      out[2] = a[2] * s;
      return out;
    },
    negate: function(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      out[2] = -a[2];
      return out;
    },
    transformQuat: function(out, a, q) {
      var x = a[0], y = a[1], z = a[2];
      var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
      var ix = qw * x + qy * z - qz * y;
      var iy = qw * y + qz * x - qx * z;
      var iz = qw * z + qx * y - qy * x;
      var iw = -qx * x - qy * y - qz * z;
      out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
      return out;
    },
    squaredDistance: function(a, b) {
      var x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2];
      return x*x + y*y + z*z;
    }
  };
  
  //  vec2 
  glMatrix.vec2 = {
    create: function() {
      var out = new glMatrix.ARRAY_TYPE(2);
      out[0] = 0; out[1] = 0;
      return out;
    },
    clone: function(a) {
      var out = new glMatrix.ARRAY_TYPE(2);
      out[0] = a[0]; out[1] = a[1];
      return out;
    },
    fromValues: function(x, y) {
      var out = new glMatrix.ARRAY_TYPE(2);
      out[0] = x; out[1] = y;
      return out;
    },
    copy: function(out, a) {
      out[0] = a[0]; out[1] = a[1];
      return out;
    },
    set: function(out, x, y) {
      out[0] = x; out[1] = y;
      return out;
    },
    scale: function(out, a, s) {
      out[0] = a[0] * s;
      out[1] = a[1] * s;
      return out;
    },
    sub: function(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      return out;
    },
    add: function(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      return out;
    },
    sqrLen: function(a) {
      var x = a[0], y = a[1];
      return x*x + y*y;
    }
  };
  
  // quat 
  glMatrix.quat = {
    create: function() {
      var out = new glMatrix.ARRAY_TYPE(4);
      out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1;
      return out;
    },
    clone: function(a) {
      var out = new glMatrix.ARRAY_TYPE(4);
      out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
      return out;
    },
    fromValues: function(x, y, z, w) {
      var out = new glMatrix.ARRAY_TYPE(4);
      out[0] = x; out[1] = y; out[2] = z; out[3] = w;
      return out;
    },
    setAxisAngle: function(out, axis, rad) {
      rad = rad * 0.5;
      var s = Math.sin(rad);
      out[0] = s * axis[0];
      out[1] = s * axis[1];
      out[2] = s * axis[2];
      out[3] = Math.cos(rad);
      return out;
    },
    multiply: function(out, a, b) {
      var ax = a[0], ay = a[1], az = a[2], aw = a[3];
      var bx = b[0], by = b[1], bz = b[2], bw = b[3];
      out[0] = ax * bw + aw * bx + ay * bz - az * by;
      out[1] = ay * bw + aw * by + az * bx - ax * bz;
      out[2] = az * bw + aw * bz + ax * by - ay * bx;
      out[3] = aw * bw - ax * bx - ay * by - az * bz;
      return out;
    },
    slerp: function(out, a, b, t) {
      var ax = a[0], ay = a[1], az = a[2], aw = a[3];
      var bx = b[0], by = b[1], bz = b[2], bw = b[3];
      var cosom = ax * bx + ay * by + az * bz + aw * bw;
      if (cosom < 0) {
        cosom = -cosom;
        bx = -bx; by = -by; bz = -bz; bw = -bw;
      }
      var scale0, scale1;
      if (cosom > 0.999999) {
        scale0 = 1 - t;
        scale1 = t;
      } else {
        var omega = Math.acos(cosom);
        var sinom = Math.sin(omega);
        scale0 = Math.sin((1 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      }
      out[0] = scale0 * ax + scale1 * bx;
      out[1] = scale0 * ay + scale1 * by;
      out[2] = scale0 * az + scale1 * bz;
      out[3] = scale0 * aw + scale1 * bw;
      return out;
    },
    normalize: function(out, a) {
      var x = a[0], y = a[1], z = a[2], w = a[3];
      var len = Math.sqrt(x*x + y*y + z*z + w*w);
      if (len > 0) {
        len = 1 / len;
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;
        out[3] = w * len;
      }
      return out;
    },
    conjugate: function(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      out[2] = -a[2];
      out[3] = a[3];
      return out;
    }
  };
  
  // Export ke global
  window.glMatrix = glMatrix;
  window.mat4 = glMatrix.mat4;
  window.vec3 = glMatrix.vec3;
  window.vec2 = glMatrix.vec2;
  window.quat = glMatrix.quat;
  
  console.log('gl-matrix siap pakai!');
})();