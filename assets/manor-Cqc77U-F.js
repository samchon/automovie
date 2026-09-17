var Kc=Object.defineProperty;var Zc=(n,e,t)=>e in n?Kc(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var Ri=(n,e,t)=>Zc(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ko="186",Jc=0,va=1,Qc=2,es=1,Yl=2,ur=3,ai=0,sn=1,Cn=2,Xn=0,dr=1,Ma=2,ya=3,Sa=4,jc=5,Wi=100,eu=101,tu=102,nu=103,iu=104,ru=200,su=201,ou=202,au=203,$l=204,Kl=205,lu=206,cu=207,uu=208,fu=209,hu=210,du=211,pu=212,mu=213,gu=214,ro=0,so=1,oo=2,gr=3,ao=4,lo=5,co=6,uo=7,Zl=0,xu=1,_u=2,In=0,Jl=1,Ql=2,jl=3,Zo=4,ec=5,tc=6,nc=7,ba="attached",vu="detached",ic=300,Si=301,Ji=302,_s=303,vs=304,ds=306,os=1e3,Pn=1001,as=1002,Ht=1003,Mu=1004,fr=1005,Yt=1006,Ms=1007,si=1008,un=1009,rc=1010,sc=1011,xr=1012,Jo=1013,Dn=1014,gn=1015,Un=1016,Qo=1017,jo=1018,_r=1020,oc=35902,ac=35899,lc=1021,cc=1022,xn=1023,$n=1026,_i=1027,ea=1028,ta=1029,bi=1030,na=1031,ia=1033,ts=33776,ns=33777,is=33778,rs=33779,fo=35840,ho=35841,po=35842,mo=35843,go=36196,xo=37492,_o=37496,vo=37488,Mo=37489,ls=37490,yo=37491,So=37808,bo=37809,Eo=37810,wo=37811,To=37812,Ao=37813,Ro=37814,Co=37815,Po=37816,Lo=37817,Io=37818,Do=37819,Uo=37820,No=37821,Fo=36492,Oo=36494,Bo=36495,zo=36283,ko=36284,cs=36285,Go=36286,yu=3200,Ho=0,Su=1,Vn="",cn="srgb",us="srgb-linear",fs="linear",It="srgb",ys=7680,bu=519,Eu=512,wu=513,Tu=514,ra=515,Au=516,Ru=517,sa=518,Cu=519,Pu=35044,Ea="300 es",Ln=2e3,vr=2001;function Lu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Mr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Iu(){const n=Mr("canvas");return n.style.display="block",n}const wa={};function Ta(...n){const e="THREE."+n.shift();console.log(e,...n)}function uc(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function lt(...n){n=uc(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Ct(...n){n=uc(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function $i(...n){const e=n.join(" ");e in wa||(wa[e]=!0,lt(...n))}function Du(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const Uu={[ro]:so,[oo]:co,[ao]:uo,[gr]:lo,[so]:ro,[co]:oo,[uo]:ao,[lo]:gr};class Ei{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}}const Zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Aa=1234567;const pr=Math.PI/180,yr=180/Math.PI;function wi(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Zt[n&255]+Zt[n>>8&255]+Zt[n>>16&255]+Zt[n>>24&255]+"-"+Zt[e&255]+Zt[e>>8&255]+"-"+Zt[e>>16&15|64]+Zt[e>>24&255]+"-"+Zt[t&63|128]+Zt[t>>8&255]+"-"+Zt[t>>16&255]+Zt[t>>24&255]+Zt[i&255]+Zt[i>>8&255]+Zt[i>>16&255]+Zt[i>>24&255]).toLowerCase()}function bt(n,e,t){return Math.max(e,Math.min(t,n))}function oa(n,e){return(n%e+e)%e}function Nu(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Fu(n,e,t){return n!==e?(t-n)/(e-n):0}function mr(n,e,t){return(1-t)*n+t*e}function Ou(n,e,t,i){return mr(n,e,1-Math.exp(-t*i))}function Bu(n,e=1){return e-Math.abs(oa(n,e*2)-e)}function zu(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function ku(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Gu(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Hu(n,e){return n+Math.random()*(e-n)}function Vu(n){return n*(.5-Math.random())}function Wu(n){n!==void 0&&(Aa=n);let e=Aa+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Xu(n){return n*pr}function qu(n){return n*yr}function Yu(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function $u(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Ku(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Zu(n,e,t,i,r){const s=Math.cos,o=Math.sin,a=s(t/2),l=o(t/2),c=s((e+i)/2),u=o((e+i)/2),h=s((e-i)/2),f=o((e-i)/2),p=s((i-e)/2),v=o((i-e)/2);switch(r){case"XYX":n.set(a*u,l*h,l*f,a*c);break;case"YZY":n.set(l*f,a*u,l*h,a*c);break;case"ZXZ":n.set(l*h,l*f,a*u,a*c);break;case"XZX":n.set(a*u,l*v,l*p,a*c);break;case"YXY":n.set(l*p,a*u,l*v,a*c);break;case"ZYZ":n.set(l*v,l*p,a*u,a*c);break;default:lt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Xi(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function tn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const xi={DEG2RAD:pr,RAD2DEG:yr,generateUUID:wi,clamp:bt,euclideanModulo:oa,mapLinear:Nu,inverseLerp:Fu,lerp:mr,damp:Ou,pingpong:Bu,smoothstep:zu,smootherstep:ku,randInt:Gu,randFloat:Hu,randFloatSpread:Vu,seededRandom:Wu,degToRad:Xu,radToDeg:qu,isPowerOfTwo:Yu,ceilPowerOfTwo:$u,floorPowerOfTwo:Ku,setQuaternionFromProperEuler:Zu,normalize:tn,denormalize:Xi},pa=class pa{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=bt(this.x,e.x,t.x),this.y=bt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=bt(this.x,e,t),this.y=bt(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(bt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(bt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};pa.prototype.isVector2=!0;let wt=pa,Qt=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3],f=s[o+0],p=s[o+1],v=s[o+2],b=s[o+3];if(h!==b||l!==f||c!==p||u!==v){let _=l*f+c*p+u*v+h*b;_<0&&(f=-f,p=-p,v=-v,b=-b,_=-_);let m=1-a;if(_<.9995){const I=Math.acos(_),ne=Math.sin(I);m=Math.sin(m*I)/ne,a=Math.sin(a*I)/ne,l=l*m+f*a,c=c*m+p*a,u=u*m+v*a,h=h*m+b*a}else{l=l*m+f*a,c=c*m+p*a,u=u*m+v*a,h=h*m+b*a;const I=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=I,c*=I,u*=I,h*=I}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,s,o){const a=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=s[o],f=s[o+1],p=s[o+2],v=s[o+3];return e[t]=a*v+u*h+l*p-c*f,e[t+1]=l*v+u*f+c*h-a*p,e[t+2]=c*v+u*p+a*f-l*h,e[t+3]=u*v-a*h-l*f-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(r/2),h=a(s/2),f=l(i/2),p=l(r/2),v=l(s/2);switch(o){case"XYZ":this._x=f*u*h+c*p*v,this._y=c*p*h-f*u*v,this._z=c*u*v+f*p*h,this._w=c*u*h-f*p*v;break;case"YXZ":this._x=f*u*h+c*p*v,this._y=c*p*h-f*u*v,this._z=c*u*v-f*p*h,this._w=c*u*h+f*p*v;break;case"ZXY":this._x=f*u*h-c*p*v,this._y=c*p*h+f*u*v,this._z=c*u*v+f*p*h,this._w=c*u*h-f*p*v;break;case"ZYX":this._x=f*u*h-c*p*v,this._y=c*p*h+f*u*v,this._z=c*u*v-f*p*h,this._w=c*u*h+f*p*v;break;case"YZX":this._x=f*u*h+c*p*v,this._y=c*p*h+f*u*v,this._z=c*u*v-f*p*h,this._w=c*u*h-f*p*v;break;case"XZY":this._x=f*u*h-c*p*v,this._y=c*p*h-f*u*v,this._z=c*u*v+f*p*h,this._w=c*u*h+f*p*v;break;default:lt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],f=i+a+h;if(f>0){const p=.5/Math.sqrt(f+1);this._w=.25/p,this._x=(u-l)*p,this._y=(s-c)*p,this._z=(o-r)*p}else if(i>a&&i>h){const p=2*Math.sqrt(1+i-a-h);this._w=(u-l)/p,this._x=.25*p,this._y=(r+o)/p,this._z=(s+c)/p}else if(a>h){const p=2*Math.sqrt(1+a-i-h);this._w=(s-c)/p,this._x=(r+o)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+h-i-a);this._w=(o-r)/p,this._x=(s+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(bt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-i*c,this._z=s*u+o*c+i*l-r*a,this._w=o*u-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,s=-s,o=-o,a=-a);let l=1-t;if(a<.9995){const c=Math.acos(a),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var Zi;let fe=(Zi=class{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ra.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ra.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*r-a*i),u=2*(a*t-s*r),h=2*(s*i-o*t);return this.x=t+l*c+o*h-a*u,this.y=i+l*u+a*c-s*h,this.z=r+l*h+s*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=bt(this.x,e.x,t.x),this.y=bt(this.y,e.y,t.y),this.z=bt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=bt(this.x,e,t),this.y=bt(this.y,e,t),this.z=bt(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(bt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,l=t.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ss.copy(this).projectOnVector(e),this.sub(Ss)}reflect(e){return this.sub(Ss.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(bt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Zi.prototype.isVector3=!0,Zi);const Ss=new fe,Ra=new Qt,ma=class ma{constructor(e,t,i,r,s,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c)}set(e,t,i,r,s,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],h=i[7],f=i[2],p=i[5],v=i[8],b=r[0],_=r[3],m=r[6],I=r[1],ne=r[4],A=r[7],P=r[2],C=r[5],W=r[8];return s[0]=o*b+a*I+l*P,s[3]=o*_+a*ne+l*C,s[6]=o*m+a*A+l*W,s[1]=c*b+u*I+h*P,s[4]=c*_+u*ne+h*C,s[7]=c*m+u*A+h*W,s[2]=f*b+p*I+v*P,s[5]=f*_+p*ne+v*C,s[8]=f*m+p*A+v*W,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*s*u+i*a*l+r*s*c-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,f=a*l-u*s,p=c*s-o*l,v=t*h+i*f+r*p;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const b=1/v;return e[0]=h*b,e[1]=(r*c-u*i)*b,e[2]=(a*i-r*o)*b,e[3]=f*b,e[4]=(u*t-r*l)*b,e[5]=(r*s-a*t)*b,e[6]=p*b,e[7]=(i*l-c*t)*b,e[8]=(o*t-i*s)*b,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-r*c,r*l,-r*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return $i("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(bs.makeScale(e,t)),this}rotate(e){return $i("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(bs.makeRotation(-e)),this}translate(e,t){return $i("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(bs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};ma.prototype.isMatrix3=!0;let xt=ma;const bs=new xt,Ca=new xt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Pa=new xt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ju(){const n={enabled:!0,workingColorSpace:us,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===It&&(r.r=qn(r.r),r.g=qn(r.g),r.b=qn(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===It&&(r.r=Ki(r.r),r.g=Ki(r.g),r.b=Ki(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Vn?fs:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return $i("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return $i("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[us]:{primaries:e,whitePoint:i,transfer:fs,toXYZ:Ca,fromXYZ:Pa,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:cn},outputColorSpaceConfig:{drawingBufferColorSpace:cn}},[cn]:{primaries:e,whitePoint:i,transfer:It,toXYZ:Ca,fromXYZ:Pa,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:cn}}}),n}const Et=Ju();function qn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ki(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Ci;class Qu{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ci===void 0&&(Ci=Mr("canvas")),Ci.width=e.width,Ci.height=e.height;const r=Ci.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Ci}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Mr("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=qn(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(qn(t[i]/255)*255):t[i]=qn(t[i]);return{data:t,width:e.width,height:e.height}}else return lt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let ju=0;class aa{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ju++}),this.uuid=wi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(Es(r[o].image)):s.push(Es(r[o]))}else s=Es(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Es(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Qu.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(lt("Texture: Unable to serialize Texture."),{})}let ef=0;const ws=new fe;class jt extends Ei{constructor(e=jt.DEFAULT_IMAGE,t=jt.DEFAULT_MAPPING,i=Pn,r=Pn,s=Yt,o=si,a=xn,l=un,c=jt.DEFAULT_ANISOTROPY,u=Vn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ef++}),this.uuid=wi(),this.name="",this.source=new aa(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new wt(0,0),this.repeat=new wt(1,1),this.center=new wt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new xt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ws).x}get height(){return this.source.getSize(ws).y}get depth(){return this.source.getSize(ws).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){lt(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){lt(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ic)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case os:e.x=e.x-Math.floor(e.x);break;case Pn:e.x=e.x<0?0:1;break;case as:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case os:e.y=e.y-Math.floor(e.y);break;case Pn:e.y=e.y<0?0:1;break;case as:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}jt.DEFAULT_IMAGE=null;jt.DEFAULT_MAPPING=ic;jt.DEFAULT_ANISOTROPY=1;const ga=class ga{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],u=l[4],h=l[8],f=l[1],p=l[5],v=l[9],b=l[2],_=l[6],m=l[10];if(Math.abs(u-f)<.01&&Math.abs(h-b)<.01&&Math.abs(v-_)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+b)<.1&&Math.abs(v+_)<.1&&Math.abs(c+p+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const ne=(c+1)/2,A=(p+1)/2,P=(m+1)/2,C=(u+f)/4,W=(h+b)/4,S=(v+_)/4;return ne>A&&ne>P?ne<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(ne),r=C/i,s=W/i):A>P?A<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(A),i=C/r,s=S/r):P<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(P),i=W/s,r=S/s),this.set(i,r,s,t),this}let I=Math.sqrt((_-v)*(_-v)+(h-b)*(h-b)+(f-u)*(f-u));return Math.abs(I)<.001&&(I=1),this.x=(_-v)/I,this.y=(h-b)/I,this.z=(f-u)/I,this.w=Math.acos((c+p+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=bt(this.x,e.x,t.x),this.y=bt(this.y,e.y,t.y),this.z=bt(this.z,e.z,t.z),this.w=bt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=bt(this.x,e,t),this.y=bt(this.y,e,t),this.z=bt(this.z,e,t),this.w=bt(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(bt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};ga.prototype.isVector4=!0;let Ut=ga;class tf extends Ei{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Yt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Ut(0,0,e,t),this.scissorTest=!1,this.viewport=new Ut(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new jt(r),o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Yt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new aa(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class bn extends tf{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class fc extends jt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Pn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class nf extends jt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Pn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}var yi;let yt=(yi=class{constructor(e,t,i,r,s,o,a,l,c,u,h,f,p,v,b,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c,u,h,f,p,v,b,_)}set(e,t,i,r,s,o,a,l,c,u,h,f,p,v,b,_){const m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=u,m[10]=h,m[14]=f,m[3]=p,m[7]=v,m[11]=b,m[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new yi().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Pi.setFromMatrixColumn(e,0).length(),s=1/Pi.setFromMatrixColumn(e,1).length(),o=1/Pi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const f=o*u,p=o*h,v=a*u,b=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=p+v*c,t[5]=f-b*c,t[9]=-a*l,t[2]=b-f*c,t[6]=v+p*c,t[10]=o*l}else if(e.order==="YXZ"){const f=l*u,p=l*h,v=c*u,b=c*h;t[0]=f+b*a,t[4]=v*a-p,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=p*a-v,t[6]=b+f*a,t[10]=o*l}else if(e.order==="ZXY"){const f=l*u,p=l*h,v=c*u,b=c*h;t[0]=f-b*a,t[4]=-o*h,t[8]=v+p*a,t[1]=p+v*a,t[5]=o*u,t[9]=b-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const f=o*u,p=o*h,v=a*u,b=a*h;t[0]=l*u,t[4]=v*c-p,t[8]=f*c+b,t[1]=l*h,t[5]=b*c+f,t[9]=p*c-v,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const f=o*l,p=o*c,v=a*l,b=a*c;t[0]=l*u,t[4]=b-f*h,t[8]=v*h+p,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=p*h+v,t[10]=f-b*h}else if(e.order==="XZY"){const f=o*l,p=o*c,v=a*l,b=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=f*h+b,t[5]=o*u,t[9]=p*h-v,t[2]=v*h-p,t[6]=a*u,t[10]=b*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(rf,e,sf)}lookAt(e,t,i){const r=this.elements;return an.subVectors(e,t),an.lengthSq()===0&&(an.z=1),an.normalize(),jn.crossVectors(i,an),jn.lengthSq()===0&&(Math.abs(i.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),jn.crossVectors(i,an)),jn.normalize(),wr.crossVectors(an,jn),r[0]=jn.x,r[4]=wr.x,r[8]=an.x,r[1]=jn.y,r[5]=wr.y,r[9]=an.y,r[2]=jn.z,r[6]=wr.z,r[10]=an.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],h=i[5],f=i[9],p=i[13],v=i[2],b=i[6],_=i[10],m=i[14],I=i[3],ne=i[7],A=i[11],P=i[15],C=r[0],W=r[4],S=r[8],N=r[12],J=r[1],se=r[5],_e=r[9],me=r[13],w=r[2],G=r[6],g=r[10],z=r[14],re=r[3],K=r[7],R=r[11],T=r[15];return s[0]=o*C+a*J+l*w+c*re,s[4]=o*W+a*se+l*G+c*K,s[8]=o*S+a*_e+l*g+c*R,s[12]=o*N+a*me+l*z+c*T,s[1]=u*C+h*J+f*w+p*re,s[5]=u*W+h*se+f*G+p*K,s[9]=u*S+h*_e+f*g+p*R,s[13]=u*N+h*me+f*z+p*T,s[2]=v*C+b*J+_*w+m*re,s[6]=v*W+b*se+_*G+m*K,s[10]=v*S+b*_e+_*g+m*R,s[14]=v*N+b*me+_*z+m*T,s[3]=I*C+ne*J+A*w+P*re,s[7]=I*W+ne*se+A*G+P*K,s[11]=I*S+ne*_e+A*g+P*R,s[15]=I*N+ne*me+A*z+P*T,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],f=e[10],p=e[14],v=e[3],b=e[7],_=e[11],m=e[15],I=l*p-c*f,ne=a*p-c*h,A=a*f-l*h,P=o*p-c*u,C=o*f-l*u,W=o*h-a*u;return t*(b*I-_*ne+m*A)-i*(v*I-_*P+m*C)+r*(v*ne-b*P+m*W)-s*(v*A-b*C+_*W)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],o=e[5],a=e[9],l=e[2],c=e[6],u=e[10];return t*(o*u-a*c)-i*(s*u-a*l)+r*(s*c-o*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],f=e[10],p=e[11],v=e[12],b=e[13],_=e[14],m=e[15],I=t*a-i*o,ne=t*l-r*o,A=t*c-s*o,P=i*l-r*a,C=i*c-s*a,W=r*c-s*l,S=u*b-h*v,N=u*_-f*v,J=u*m-p*v,se=h*_-f*b,_e=h*m-p*b,me=f*m-p*_,w=I*me-ne*_e+A*se+P*J-C*N+W*S;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const G=1/w;return e[0]=(a*me-l*_e+c*se)*G,e[1]=(r*_e-i*me-s*se)*G,e[2]=(b*W-_*C+m*P)*G,e[3]=(f*C-h*W-p*P)*G,e[4]=(l*J-o*me-c*N)*G,e[5]=(t*me-r*J+s*N)*G,e[6]=(_*A-v*W-m*ne)*G,e[7]=(u*W-f*A+p*ne)*G,e[8]=(o*_e-a*J+c*S)*G,e[9]=(i*J-t*_e-s*S)*G,e[10]=(v*C-b*A+m*I)*G,e[11]=(h*A-u*C-p*I)*G,e[12]=(a*N-o*se-l*S)*G,e[13]=(t*se-i*N+r*S)*G,e[14]=(b*ne-v*P-_*I)*G,e[15]=(u*P-h*ne+f*I)*G,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,l=e.z,c=s*o,u=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+i,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,o=t._y,a=t._z,l=t._w,c=s+s,u=o+o,h=a+a,f=s*c,p=s*u,v=s*h,b=o*u,_=o*h,m=a*h,I=l*c,ne=l*u,A=l*h,P=i.x,C=i.y,W=i.z;return r[0]=(1-(b+m))*P,r[1]=(p+A)*P,r[2]=(v-ne)*P,r[3]=0,r[4]=(p-A)*C,r[5]=(1-(f+m))*C,r[6]=(_+I)*C,r[7]=0,r[8]=(v+ne)*W,r[9]=(_-I)*W,r[10]=(1-(f+b))*W,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let o=Pi.set(r[0],r[1],r[2]).length();const a=Pi.set(r[4],r[5],r[6]).length(),l=Pi.set(r[8],r[9],r[10]).length();s<0&&(o=-o),vn.copy(this);const c=1/o,u=1/a,h=1/l;return vn.elements[0]*=c,vn.elements[1]*=c,vn.elements[2]*=c,vn.elements[4]*=u,vn.elements[5]*=u,vn.elements[6]*=u,vn.elements[8]*=h,vn.elements[9]*=h,vn.elements[10]*=h,t.setFromRotationMatrix(vn),i.x=o,i.y=a,i.z=l,this}makePerspective(e,t,i,r,s,o,a=Ln,l=!1){const c=this.elements,u=2*s/(t-e),h=2*s/(i-r),f=(t+e)/(t-e),p=(i+r)/(i-r);let v,b;if(l)v=s/(o-s),b=o*s/(o-s);else if(a===Ln)v=-(o+s)/(o-s),b=-2*o*s/(o-s);else if(a===vr)v=-o/(o-s),b=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=h,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=v,c[14]=b,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=Ln,l=!1){const c=this.elements,u=2/(t-e),h=2/(i-r),f=-(t+e)/(t-e),p=-(i+r)/(i-r);let v,b;if(l)v=1/(o-s),b=o/(o-s);else if(a===Ln)v=-2/(o-s),b=-(o+s)/(o-s);else if(a===vr)v=-1/(o-s),b=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=h,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=v,c[14]=b,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},yi.prototype.isMatrix4=!0,yi);const Pi=new fe,vn=new yt,rf=new fe(0,0,0),sf=new fe(1,1,1),jn=new fe,wr=new fe,an=new fe,La=new yt,Ia=new Qt;class Kn{constructor(e=0,t=0,i=0,r=Kn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],u=r[9],h=r[2],f=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(bt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-bt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(bt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-bt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(bt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-bt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:lt("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return La.makeRotationFromQuaternion(e),this.setFromRotationMatrix(La,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ia.setFromEuler(this),this.setFromQuaternion(Ia,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Kn.DEFAULT_ORDER="XYZ";class hc{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let of=0;const Da=new fe,Li=new Qt,Bn=new yt,Tr=new fe,er=new fe,af=new fe,lf=new Qt,Ua=new fe(1,0,0),Na=new fe(0,1,0),Fa=new fe(0,0,1),Oa={type:"added"},cf={type:"removed"},Ii={type:"childadded",child:null},Ts={type:"childremoved",child:null};class $t extends Ei{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=wi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=$t.DEFAULT_UP.clone();const e=new fe,t=new Kn,i=new Qt,r=new fe(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new yt},normalMatrix:{value:new xt}}),this.matrix=new yt,this.matrixWorld=new yt,this.matrixAutoUpdate=$t.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=$t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Li.setFromAxisAngle(e,t),this.quaternion.multiply(Li),this}rotateOnWorldAxis(e,t){return Li.setFromAxisAngle(e,t),this.quaternion.premultiply(Li),this}rotateX(e){return this.rotateOnAxis(Ua,e)}rotateY(e){return this.rotateOnAxis(Na,e)}rotateZ(e){return this.rotateOnAxis(Fa,e)}translateOnAxis(e,t){return Da.copy(e).applyQuaternion(this.quaternion),this.position.add(Da.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ua,e)}translateY(e){return this.translateOnAxis(Na,e)}translateZ(e){return this.translateOnAxis(Fa,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Bn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Tr.copy(e):Tr.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),er.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Bn.lookAt(er,Tr,this.up):Bn.lookAt(Tr,er,this.up),this.quaternion.setFromRotationMatrix(Bn),r&&(Bn.extractRotation(r.matrixWorld),Li.setFromRotationMatrix(Bn),this.quaternion.premultiply(Li.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ct("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Oa),Ii.child=e,this.dispatchEvent(Ii),Ii.child=null):Ct("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(cf),Ts.child=e,this.dispatchEvent(Ts),Ts.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Bn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Bn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Bn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Oa),Ii.child=e,this.dispatchEvent(Ii),Ii.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(er,e,af),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(er,lf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(e.materials,this.material[l]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),f=o(e.skeletons),p=o(e.animations),v=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),f.length>0&&(i.skeletons=f),p.length>0&&(i.animations=p),v.length>0&&(i.nodes=v)}return i.object=r,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}$t.DEFAULT_UP=new fe(0,1,0);$t.DEFAULT_MATRIX_AUTO_UPDATE=!0;$t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class vi extends $t{constructor(){super(),this.isGroup=!0,this.type="Group"}}const uf={type:"move"};class As{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new vi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new vi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new fe,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new fe),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new vi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new fe,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new fe,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const b of e.hand.values()){const _=t.getJointPose(b,i),m=this._getHandJoint(c,b);_!==null&&(m.matrix.fromArray(_.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=_.radius),m.visible=_!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],f=u.position.distanceTo(h.position),p=.02,v=.005;c.inputState.pinching&&f>p+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=p-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(uf)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new vi;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const dc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ei={h:0,s:0,l:0},Ar={h:0,s:0,l:0};function Rs(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class dt{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=cn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Et.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Et.workingColorSpace){return this.r=e,this.g=t,this.b=i,Et.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Et.workingColorSpace){if(e=oa(e,1),t=bt(t,0,1),i=bt(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=Rs(o,s,e+1/3),this.g=Rs(o,s,e),this.b=Rs(o,s,e-1/3)}return Et.colorSpaceToWorking(this,r),this}setStyle(e,t=cn){function i(s){s!==void 0&&parseFloat(s)<1&&lt("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:lt("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);lt("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=cn){const i=dc[e.toLowerCase()];return i!==void 0?this.setHex(i,t):lt("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=qn(e.r),this.g=qn(e.g),this.b=qn(e.b),this}copyLinearToSRGB(e){return this.r=Ki(e.r),this.g=Ki(e.g),this.b=Ki(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=cn){return Et.workingToColorSpace(Jt.copy(this),e),Math.round(bt(Jt.r*255,0,255))*65536+Math.round(bt(Jt.g*255,0,255))*256+Math.round(bt(Jt.b*255,0,255))}getHexString(e=cn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Et.workingColorSpace){Et.workingToColorSpace(Jt.copy(this),t);const i=Jt.r,r=Jt.g,s=Jt.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case i:l=(r-s)/h+(r<s?6:0);break;case r:l=(s-i)/h+2;break;case s:l=(i-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Et.workingColorSpace){return Et.workingToColorSpace(Jt.copy(this),t),e.r=Jt.r,e.g=Jt.g,e.b=Jt.b,e}getStyle(e=cn){Et.workingToColorSpace(Jt.copy(this),e);const t=Jt.r,i=Jt.g,r=Jt.b;return e!==cn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ei),this.setHSL(ei.h+e,ei.s+t,ei.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ei),e.getHSL(Ar);const i=mr(ei.h,Ar.h,t),r=mr(ei.s,Ar.s,t),s=mr(ei.l,Ar.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Jt=new dt;dt.NAMES=dc;class ff extends $t{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Kn,this.environmentIntensity=1,this.environmentRotation=new Kn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Mn=new fe,zn=new fe,Cs=new fe,kn=new fe,Di=new fe,Ui=new fe,Ba=new fe,Ps=new fe,Ls=new fe,Is=new fe,Ds=new Ut,Us=new Ut,Ns=new Ut;class Sn{constructor(e=new fe,t=new fe,i=new fe){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Mn.subVectors(e,t),r.cross(Mn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Mn.subVectors(r,t),zn.subVectors(i,t),Cs.subVectors(e,t);const o=Mn.dot(Mn),a=Mn.dot(zn),l=Mn.dot(Cs),c=zn.dot(zn),u=zn.dot(Cs),h=o*c-a*a;if(h===0)return s.set(0,0,0),null;const f=1/h,p=(c*l-a*u)*f,v=(o*u-a*l)*f;return s.set(1-p-v,v,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getInterpolation(e,t,i,r,s,o,a,l){return this.getBarycoord(e,t,i,r,kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,kn.x),l.addScaledVector(o,kn.y),l.addScaledVector(a,kn.z),l)}static getInterpolatedAttribute(e,t,i,r,s,o){return Ds.setScalar(0),Us.setScalar(0),Ns.setScalar(0),Ds.fromBufferAttribute(e,t),Us.fromBufferAttribute(e,i),Ns.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(Ds,s.x),o.addScaledVector(Us,s.y),o.addScaledVector(Ns,s.z),o}static isFrontFacing(e,t,i,r){return Mn.subVectors(i,t),zn.subVectors(e,t),Mn.cross(zn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Mn.subVectors(this.c,this.b),zn.subVectors(this.a,this.b),Mn.cross(zn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Sn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Sn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return Sn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return Sn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Sn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let o,a;Di.subVectors(r,i),Ui.subVectors(s,i),Ps.subVectors(e,i);const l=Di.dot(Ps),c=Ui.dot(Ps);if(l<=0&&c<=0)return t.copy(i);Ls.subVectors(e,r);const u=Di.dot(Ls),h=Ui.dot(Ls);if(u>=0&&h<=u)return t.copy(r);const f=l*h-u*c;if(f<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(Di,o);Is.subVectors(e,s);const p=Di.dot(Is),v=Ui.dot(Is);if(v>=0&&p<=v)return t.copy(s);const b=p*c-l*v;if(b<=0&&c>=0&&v<=0)return a=c/(c-v),t.copy(i).addScaledVector(Ui,a);const _=u*v-p*h;if(_<=0&&h-u>=0&&p-v>=0)return Ba.subVectors(s,r),a=(h-u)/(h-u+(p-v)),t.copy(r).addScaledVector(Ba,a);const m=1/(_+b+f);return o=b*m,a=f*m,t.copy(i).addScaledVector(Di,o).addScaledVector(Ui,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Nn{constructor(e=new fe(1/0,1/0,1/0),t=new fe(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(yn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(yn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=yn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,yn):yn.fromBufferAttribute(s,o),yn.applyMatrix4(e.matrixWorld),this.expandByPoint(yn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Rr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Rr.copy(i.boundingBox)),Rr.applyMatrix4(e.matrixWorld),this.union(Rr)}const r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,yn),yn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(tr),Cr.subVectors(this.max,tr),Ni.subVectors(e.a,tr),Fi.subVectors(e.b,tr),Oi.subVectors(e.c,tr),ti.subVectors(Fi,Ni),ni.subVectors(Oi,Fi),ci.subVectors(Ni,Oi);let t=[0,-ti.z,ti.y,0,-ni.z,ni.y,0,-ci.z,ci.y,ti.z,0,-ti.x,ni.z,0,-ni.x,ci.z,0,-ci.x,-ti.y,ti.x,0,-ni.y,ni.x,0,-ci.y,ci.x,0];return!Fs(t,Ni,Fi,Oi,Cr)||(t=[1,0,0,0,1,0,0,0,1],!Fs(t,Ni,Fi,Oi,Cr))?!1:(Pr.crossVectors(ti,ni),t=[Pr.x,Pr.y,Pr.z],Fs(t,Ni,Fi,Oi,Cr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,yn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(yn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Gn=[new fe,new fe,new fe,new fe,new fe,new fe,new fe,new fe],yn=new fe,Rr=new Nn,Ni=new fe,Fi=new fe,Oi=new fe,ti=new fe,ni=new fe,ci=new fe,tr=new fe,Cr=new fe,Pr=new fe,ui=new fe;function Fs(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){ui.fromArray(n,s);const a=r.x*Math.abs(ui.x)+r.y*Math.abs(ui.y)+r.z*Math.abs(ui.z),l=e.dot(ui),c=t.dot(ui),u=i.dot(ui);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Gt=new fe,Lr=new wt;let hf=0;class fn extends Ei{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:hf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Pu,this.updateRanges=[],this.gpuType=gn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Lr.fromBufferAttribute(this,t),Lr.applyMatrix3(e),this.setXY(t,Lr.x,Lr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Gt.fromBufferAttribute(this,t),Gt.applyMatrix3(e),this.setXYZ(t,Gt.x,Gt.y,Gt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Gt.fromBufferAttribute(this,t),Gt.applyMatrix4(e),this.setXYZ(t,Gt.x,Gt.y,Gt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Gt.fromBufferAttribute(this,t),Gt.applyNormalMatrix(e),this.setXYZ(t,Gt.x,Gt.y,Gt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Gt.fromBufferAttribute(this,t),Gt.transformDirection(e),this.setXYZ(t,Gt.x,Gt.y,Gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Xi(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=tn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Xi(t,this.array)),t}setX(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Xi(t,this.array)),t}setY(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Xi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Xi(t,this.array)),t}setW(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array),r=tn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array),r=tn(r,this.array),s=tn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class la extends fn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class pc extends fn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class qt extends fn{constructor(e,t,i){super(new Float32Array(e),t,i)}}const df=new Nn,nr=new fe,Os=new fe;class li{constructor(e=new fe,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):df.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;nr.subVectors(e,this.center);const t=nr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(nr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Os.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(nr.copy(e.center).add(Os)),this.expandByPoint(nr.copy(e.center).sub(Os))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let pf=0;const dn=new yt,Bs=new $t,Bi=new fe,ln=new Nn,ir=new Nn,Xt=new fe;class _n extends Ei{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:pf++}),this.uuid=wi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Lu(e)?pc:la)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new xt().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return dn.makeRotationFromQuaternion(e),this.applyMatrix4(dn),this}rotateX(e){return dn.makeRotationX(e),this.applyMatrix4(dn),this}rotateY(e){return dn.makeRotationY(e),this.applyMatrix4(dn),this}rotateZ(e){return dn.makeRotationZ(e),this.applyMatrix4(dn),this}translate(e,t,i){return dn.makeTranslation(e,t,i),this.applyMatrix4(dn),this}scale(e,t,i){return dn.makeScale(e,t,i),this.applyMatrix4(dn),this}lookAt(e){return Bs.lookAt(e),Bs.updateMatrix(),this.applyMatrix4(Bs.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Bi).negate(),this.translate(Bi.x,Bi.y,Bi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new qt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&lt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Nn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ct("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new fe(-1/0,-1/0,-1/0),new fe(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];ln.setFromBufferAttribute(s),this.morphTargetsRelative?(Xt.addVectors(this.boundingBox.min,ln.min),this.boundingBox.expandByPoint(Xt),Xt.addVectors(this.boundingBox.max,ln.max),this.boundingBox.expandByPoint(Xt)):(this.boundingBox.expandByPoint(ln.min),this.boundingBox.expandByPoint(ln.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ct('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new li);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ct("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new fe,1/0);return}if(e){const i=this.boundingSphere.center;if(ln.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];ir.setFromBufferAttribute(a),this.morphTargetsRelative?(Xt.addVectors(ln.min,ir.min),ln.expandByPoint(Xt),Xt.addVectors(ln.max,ir.max),ln.expandByPoint(Xt)):(ln.expandByPoint(ir.min),ln.expandByPoint(ir.max))}ln.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)Xt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Xt));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Xt.fromBufferAttribute(a,c),l&&(Bi.fromBufferAttribute(e,c),Xt.add(Bi)),r=Math.max(r,i.distanceToSquared(Xt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Ct('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ct("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new fn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));const a=[],l=[];for(let S=0;S<i.count;S++)a[S]=new fe,l[S]=new fe;const c=new fe,u=new fe,h=new fe,f=new wt,p=new wt,v=new wt,b=new fe,_=new fe;function m(S,N,J){c.fromBufferAttribute(i,S),u.fromBufferAttribute(i,N),h.fromBufferAttribute(i,J),f.fromBufferAttribute(s,S),p.fromBufferAttribute(s,N),v.fromBufferAttribute(s,J),u.sub(c),h.sub(c),p.sub(f),v.sub(f);const se=1/(p.x*v.y-v.x*p.y);isFinite(se)&&(b.copy(u).multiplyScalar(v.y).addScaledVector(h,-p.y).multiplyScalar(se),_.copy(h).multiplyScalar(p.x).addScaledVector(u,-v.x).multiplyScalar(se),a[S].add(b),a[N].add(b),a[J].add(b),l[S].add(_),l[N].add(_),l[J].add(_))}let I=this.groups;I.length===0&&(I=[{start:0,count:e.count}]);for(let S=0,N=I.length;S<N;++S){const J=I[S],se=J.start,_e=J.count;for(let me=se,w=se+_e;me<w;me+=3)m(e.getX(me+0),e.getX(me+1),e.getX(me+2))}const ne=new fe,A=new fe,P=new fe,C=new fe;function W(S){P.fromBufferAttribute(r,S),C.copy(P);const N=a[S];ne.copy(N),ne.sub(P.multiplyScalar(P.dot(N))).normalize(),A.crossVectors(C,N);const se=A.dot(l[S])<0?-1:1;o.setXYZW(S,ne.x,ne.y,ne.z,se)}for(let S=0,N=I.length;S<N;++S){const J=I[S],se=J.start,_e=J.count;for(let me=se,w=se+_e;me<w;me+=3)W(e.getX(me+0)),W(e.getX(me+1)),W(e.getX(me+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new fn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,p=i.count;f<p;f++)i.setXYZ(f,0,0,0);const r=new fe,s=new fe,o=new fe,a=new fe,l=new fe,c=new fe,u=new fe,h=new fe;if(e)for(let f=0,p=e.count;f<p;f+=3){const v=e.getX(f+0),b=e.getX(f+1),_=e.getX(f+2);r.fromBufferAttribute(t,v),s.fromBufferAttribute(t,b),o.fromBufferAttribute(t,_),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),a.fromBufferAttribute(i,v),l.fromBufferAttribute(i,b),c.fromBufferAttribute(i,_),a.add(u),l.add(u),c.add(u),i.setXYZ(v,a.x,a.y,a.z),i.setXYZ(b,l.x,l.y,l.z),i.setXYZ(_,c.x,c.y,c.z)}else for(let f=0,p=t.count;f<p;f+=3)r.fromBufferAttribute(t,f+0),s.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),i.setXYZ(f+0,u.x,u.y,u.z),i.setXYZ(f+1,u.x,u.y,u.z),i.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Xt.fromBufferAttribute(e,t),Xt.normalize(),e.setXYZ(t,Xt.x,Xt.y,Xt.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,h=a.normalized,f=new c.constructor(l.length*u);let p=0,v=0;for(let b=0,_=l.length;b<_;b++){a.isInterleavedBufferAttribute?p=l[b]*a.data.stride+a.offset:p=l[b]*u;for(let m=0;m<u;m++)f[v++]=c[p++]}return new fn(f,u,h)}if(this.index===null)return lt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new _n,i=this.index.array,r=this.attributes;for(const a in r){const l=r[a],c=e(l,i);t.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,h=c.length;u<h;u++){const f=c[u],p=e(f,i);l.push(p)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,f=c.length;h<f;h++){const p=c[h];u.push(p.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],h=s[c];for(let f=0,p=h.length;f<p;f++)u.push(h[f].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const zs=new fe,mf=new fe,gf=new xt;class pn{constructor(e=new fe(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=zs.subVectors(i,t).cross(mf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(zs),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const o=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(r,o)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||gf.getNormalMatrix(e),r=this.coplanarPoint(zs).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let xf=0;class br extends Ei{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:xf++}),this.uuid=wi(),this.name="",this.type="Material",this.blending=dr,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=$l,this.blendDst=Kl,this.blendEquation=Wi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new dt(0,0,0),this.blendAlpha=0,this.depthFunc=gr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=bu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ys,this.stencilZFail=ys,this.stencilZPass=ys,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){lt(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){lt(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(t){const s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new dt().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new pn().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new wt().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new wt().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Hn=new fe,ks=new fe,Ir=new fe,Dr=new fe;class mc{constructor(e=new fe,t=new fe(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Hn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Hn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Hn.copy(this.origin).addScaledVector(this.direction,t),Hn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){ks.copy(e).add(t).multiplyScalar(.5),Ir.copy(t).sub(e).normalize(),Dr.copy(this.origin).sub(ks);const s=e.distanceTo(t)*.5,o=-this.direction.dot(Ir),a=Dr.dot(this.direction),l=-Dr.dot(Ir),c=Dr.lengthSq(),u=Math.abs(1-o*o);let h,f,p,v;if(u>0)if(h=o*l-a,f=o*a-l,v=s*u,h>=0)if(f>=-v)if(f<=v){const b=1/u;h*=b,f*=b,p=h*(h+o*f+2*a)+f*(o*h+f+2*l)+c}else f=s,h=Math.max(0,-(o*f+a)),p=-h*h+f*(f+2*l)+c;else f=-s,h=Math.max(0,-(o*f+a)),p=-h*h+f*(f+2*l)+c;else f<=-v?(h=Math.max(0,-(-o*s+a)),f=h>0?-s:Math.min(Math.max(-s,-l),s),p=-h*h+f*(f+2*l)+c):f<=v?(h=0,f=Math.min(Math.max(-s,-l),s),p=f*(f+2*l)+c):(h=Math.max(0,-(o*s+a)),f=h>0?s:Math.min(Math.max(-s,-l),s),p=-h*h+f*(f+2*l)+c);else f=o>0?-s:s,h=Math.max(0,-(o*f+a)),p=-h*h+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(ks).addScaledVector(Ir,f),p}intersectSphere(e,t){if(e.radius<0)return null;Hn.subVectors(e.center,this.origin);const i=Hn.dot(this.direction),r=Hn.dot(Hn)-i*i,s=e.radius*e.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),u>=0?(s=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(s=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),h>=0?(a=(e.min.z-f.z)*h,l=(e.max.z-f.z)*h):(a=(e.max.z-f.z)*h,l=(e.min.z-f.z)*h),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Hn)!==null}intersectTriangle(e,t,i,r,s){const o=this.origin,a=this.direction,l=a.x,c=a.y,u=a.z,h=e.x-o.x,f=e.y-o.y,p=e.z-o.z,v=t.x-o.x,b=t.y-o.y,_=t.z-o.z,m=i.x-o.x,I=i.y-o.y,ne=i.z-o.z,A=Math.abs(l),P=Math.abs(c),C=Math.abs(u);let W,S,N,J,se,_e,me,w,G,g,z,re;if(A>=P&&A>=C?(N=l,_e=h,G=v,re=m,l>=0?(W=c,S=u,J=f,se=p,me=b,w=_,g=I,z=ne):(W=u,S=c,J=p,se=f,me=_,w=b,g=ne,z=I)):P>=C?(N=c,_e=f,G=b,re=I,c>=0?(W=u,S=l,J=p,se=h,me=_,w=v,g=ne,z=m):(W=l,S=u,J=h,se=p,me=v,w=_,g=m,z=ne)):(N=u,_e=p,G=_,re=ne,u>=0?(W=l,S=c,J=h,se=f,me=v,w=b,g=m,z=I):(W=c,S=l,J=f,se=h,me=b,w=v,g=I,z=m)),N===0)return null;const K=W/N,R=S/N,T=1/N,F=J-K*_e,Q=se-R*_e,k=me-K*G,Y=w-R*G,$=g-K*re,D=z-R*re,O=$*Y-D*k,j=F*D-Q*$,X=k*Q-Y*F;if(r){if(O<0||j<0||X<0)return null}else if((O<0||j<0||X<0)&&(O>0||j>0||X>0))return null;const V=O+j+X;if(V===0)return null;const le=T*(O*_e+j*G+X*re);return(V>0?le<0:le>0)?null:this.at(le/V,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class gc extends br{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new dt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Kn,this.combine=Zl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const za=new yt,fi=new mc,Ur=new li,ka=new fe,Nr=new fe,Fr=new fe,Or=new fe,Gs=new fe,Br=new fe,Ga=new fe,zr=new fe;class on extends $t{constructor(e=new _n,t=new gc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const a=this.morphTargetInfluences;if(s&&a){Br.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],h=s[l];u!==0&&(Gs.fromBufferAttribute(h,e),o?Br.addScaledVector(Gs,u):Br.addScaledVector(Gs.sub(t),u))}t.add(Br)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ur.copy(i.boundingSphere),Ur.applyMatrix4(s),fi.copy(e.ray).recast(e.near),!(Ur.containsPoint(fi.origin)===!1&&(fi.intersectSphere(Ur,ka)===null||fi.origin.distanceToSquared(ka)>(e.far-e.near)**2))&&(za.copy(s).invert(),fi.copy(e.ray).applyMatrix4(za),!(i.boundingBox!==null&&fi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,fi)))}_computeIntersections(e,t,i){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,f=s.groups,p=s.drawRange;if(a!==null)if(Array.isArray(o))for(let v=0,b=f.length;v<b;v++){const _=f[v],m=o[_.materialIndex],I=Math.max(_.start,p.start),ne=Math.min(a.count,Math.min(_.start+_.count,p.start+p.count));for(let A=I,P=ne;A<P;A+=3){const C=a.getX(A),W=a.getX(A+1),S=a.getX(A+2);r=kr(this,m,e,i,c,u,h,C,W,S),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{const v=Math.max(0,p.start),b=Math.min(a.count,p.start+p.count);for(let _=v,m=b;_<m;_+=3){const I=a.getX(_),ne=a.getX(_+1),A=a.getX(_+2);r=kr(this,o,e,i,c,u,h,I,ne,A),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let v=0,b=f.length;v<b;v++){const _=f[v],m=o[_.materialIndex],I=Math.max(_.start,p.start),ne=Math.min(l.count,Math.min(_.start+_.count,p.start+p.count));for(let A=I,P=ne;A<P;A+=3){const C=A,W=A+1,S=A+2;r=kr(this,m,e,i,c,u,h,C,W,S),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{const v=Math.max(0,p.start),b=Math.min(l.count,p.start+p.count);for(let _=v,m=b;_<m;_+=3){const I=_,ne=_+1,A=_+2;r=kr(this,o,e,i,c,u,h,I,ne,A),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}}}function _f(n,e,t,i,r,s,o,a){let l;if(e.side===sn?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,e.side===ai,a),l===null)return null;zr.copy(a),zr.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(zr);return c<t.near||c>t.far?null:{distance:c,point:zr.clone(),object:n}}function kr(n,e,t,i,r,s,o,a,l,c){n.getVertexPosition(a,Nr),n.getVertexPosition(l,Fr),n.getVertexPosition(c,Or);const u=_f(n,e,t,i,Nr,Fr,Or,Ga);if(u){const h=new fe;Sn.getBarycoord(Ga,Nr,Fr,Or,h),r&&(u.uv=Sn.getInterpolatedAttribute(r,a,l,c,h,new wt)),s&&(u.uv1=Sn.getInterpolatedAttribute(s,a,l,c,h,new wt)),o&&(u.normal=Sn.getInterpolatedAttribute(o,a,l,c,h,new fe),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const f={a,b:l,c,normal:new fe,materialIndex:0};Sn.getNormal(Nr,Fr,Or,f.normal),u.face=f,u.barycoord=h}return u}const rr=new Ut,Ha=new Ut,Va=new Ut,vf=new Ut,Wa=new yt,Gr=new fe,Hs=new li,Xa=new yt,Vs=new mc;class Vo extends on{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=ba,this.bindMatrix=new yt,this.bindMatrixInverse=new yt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Nn),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Gr),this.boundingBox.expandByPoint(Gr)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new li),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Gr),this.boundingSphere.expandByPoint(Gr)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Hs.copy(this.boundingSphere),Hs.applyMatrix4(r),e.ray.intersectsSphere(Hs)!==!1&&(Xa.copy(r).invert(),Vs.copy(e.ray).applyMatrix4(Xa),!(this.boundingBox!==null&&Vs.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Vs)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new Ut,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);const s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===ba?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===vu?this.bindMatrixInverse.copy(this.bindMatrix).invert():lt("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const i=this.skeleton,r=this.geometry;Ha.fromBufferAttribute(r.attributes.skinIndex,e),Va.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(rr.copy(t),t.set(0,0,0,0)):(rr.set(...t,1),t.set(0,0,0)),rr.applyMatrix4(this.bindMatrix);for(let s=0;s<4;s++){const o=Va.getComponent(s);if(o!==0){const a=Ha.getComponent(s);Wa.multiplyMatrices(i.bones[a].matrixWorld,i.boneInverses[a]),t.addScaledVector(vf.copy(rr).applyMatrix4(Wa),o)}}return t.isVector4&&(t.w=rr.w),t.applyMatrix4(this.bindMatrixInverse)}}class xc extends $t{constructor(){super(),this.isBone=!0,this.type="Bone"}}class ca extends jt{constructor(e=null,t=1,i=1,r,s,o,a,l,c=Ht,u=Ht,h,f){super(null,o,a,l,c,u,r,s,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const qa=new yt,Mf=new yt;class ua{constructor(e=[],t=[]){this.uuid=wi(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){lt("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new yt)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const i=new yt;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){const e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let s=0,o=e.length;s<o;s++){const a=e[s]?e[s].matrixWorld:Mf;qa.multiplyMatrices(a,t[s]),qa.toArray(i,s*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new ua(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const i=new ca(t,e,e,xn,gn);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){const r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){const s=e.bones[i];let o=t[s];o===void 0&&(lt("Skeleton: No bone found with UUID:",s),o=new xc),this.bones.push(o),this.boneInverses.push(new yt().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,i=this.boneInverses;for(let r=0,s=t.length;r<s;r++){const o=t[r];e.bones.push(o.uuid);const a=i[r];e.boneInverses.push(a.toArray())}return e}}class Wo extends fn{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const zi=new yt,Ya=new yt,Hr=[],$a=new Nn,yf=new yt,sr=new on,or=new li;class Sf extends on{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Wo(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,yf)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Nn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,zi),$a.copy(e.boundingBox).applyMatrix4(zi),this.boundingBox.union($a)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new li),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,zi),or.copy(e.boundingSphere).applyMatrix4(zi),this.boundingSphere.union(or)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,o=e*s+1;for(let a=0;a<i.length;a++)i[a]=r[o+a]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(sr.geometry=this.geometry,sr.material=this.material,sr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),or.copy(this.boundingSphere),or.applyMatrix4(i),e.ray.intersectsSphere(or)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,zi),Ya.multiplyMatrices(i,zi),sr.matrixWorld=Ya,sr.raycast(e,Hr);for(let o=0,a=Hr.length;o<a;o++){const l=Hr[o];l.instanceId=s,l.object=this,t.push(l)}Hr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Wo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new ca(new Float32Array(r*this.count),r,this.count,ea,gn));const s=this.morphTexture.source.data.data;let o=0;for(let c=0;c<i.length;c++)o+=i[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=r*e;return s[l]=a,s.set(i,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const hi=new li,bf=new wt(.5,.5),Vr=new fe;class ps{constructor(e=new pn,t=new pn,i=new pn,r=new pn,s=new pn,o=new pn){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Ln,i=!1){const r=this.planes,s=e.elements,o=s[0],a=s[1],l=s[2],c=s[3],u=s[4],h=s[5],f=s[6],p=s[7],v=s[8],b=s[9],_=s[10],m=s[11],I=s[12],ne=s[13],A=s[14],P=s[15];if(r[0].setComponents(c-o,p-u,m-v,P-I).normalize(),r[1].setComponents(c+o,p+u,m+v,P+I).normalize(),r[2].setComponents(c+a,p+h,m+b,P+ne).normalize(),r[3].setComponents(c-a,p-h,m-b,P-ne).normalize(),i)r[4].setComponents(l,f,_,A).normalize(),r[5].setComponents(c-l,p-f,m-_,P-A).normalize();else if(r[4].setComponents(c-l,p-f,m-_,P-A).normalize(),t===Ln)r[5].setComponents(c+l,p+f,m+_,P+A).normalize();else if(t===vr)r[5].setComponents(l,f,_,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),hi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),hi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(hi)}intersectsSprite(e){hi.center.set(0,0,0);const t=bf.distanceTo(e.center);return hi.radius=.7071067811865476+t,hi.applyMatrix4(e.matrixWorld),this.intersectsSphere(hi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Vr.x=r.normal.x>0?e.max.x:e.min.x,Vr.y=r.normal.y>0?e.max.y:e.min.y,Vr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Vr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class _c extends jt{constructor(e=[],t=Si,i,r,s,o,a,l,c,u){super(e,t,i,r,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Sr extends jt{constructor(e,t,i=Dn,r,s,o,a=Ht,l=Ht,c,u=$n,h=1){if(u!==$n&&u!==_i)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:t,depth:h};super(f,r,s,o,a,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new aa(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class Ef extends Sr{constructor(e,t=Dn,i=Si,r,s,o=Ht,a=Ht,l,c=$n){const u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,i,r,s,o,a,l,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class vc extends jt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Er extends _n{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],h=[];let f=0,p=0;v("z","y","x",-1,-1,i,t,e,o,s,0),v("z","y","x",1,-1,i,t,-e,o,s,1),v("x","z","y",1,1,e,i,t,r,o,2),v("x","z","y",1,-1,e,i,-t,r,o,3),v("x","y","z",1,-1,e,t,i,r,s,4),v("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new qt(c,3)),this.setAttribute("normal",new qt(u,3)),this.setAttribute("uv",new qt(h,2));function v(b,_,m,I,ne,A,P,C,W,S,N){const J=A/W,se=P/S,_e=A/2,me=P/2,w=C/2,G=W+1,g=S+1;let z=0,re=0;const K=new fe;for(let R=0;R<g;R++){const T=R*se-me;for(let F=0;F<G;F++){const Q=F*J-_e;K[b]=Q*I,K[_]=T*ne,K[m]=w,c.push(K.x,K.y,K.z),K[b]=0,K[_]=0,K[m]=C>0?1:-1,u.push(K.x,K.y,K.z),h.push(F/W),h.push(1-R/S),z+=1}}for(let R=0;R<S;R++)for(let T=0;T<W;T++){const F=f+T+G*R,Q=f+T+G*(R+1),k=f+(T+1)+G*(R+1),Y=f+(T+1)+G*R;l.push(F,Q,Y),l.push(Q,k,Y),re+=6}a.addGroup(p,re,N),p+=re,f+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Er(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class ms extends _n{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,o=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,u=l+1,h=e/a,f=t/l,p=[],v=[],b=[],_=[];for(let m=0;m<u;m++){const I=m*f-o;for(let ne=0;ne<c;ne++){const A=ne*h-s;v.push(A,-I,0),b.push(0,0,1),_.push(ne/a),_.push(1-m/l)}}for(let m=0;m<l;m++)for(let I=0;I<a;I++){const ne=I+c*m,A=I+c*(m+1),P=I+1+c*(m+1),C=I+1+c*m;p.push(ne,A,C),p.push(A,P,C)}this.setIndex(p),this.setAttribute("position",new qt(v,3)),this.setAttribute("normal",new qt(b,3)),this.setAttribute("uv",new qt(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ms(e.width,e.height,e.widthSegments,e.heightSegments)}}function Qi(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(Ka(r))r.isRenderTargetTexture?(lt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Ka(r[0])){const s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function nn(n){const e={};for(let t=0;t<n.length;t++){const i=Qi(n[t]);for(const r in i)e[r]=i[r]}return e}function Ka(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function wf(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Mc(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Et.workingColorSpace}const Tf={clone:Qi,merge:nn};var Af=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Rf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Fn extends br{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Af,this.fragmentShader=Rf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Qi(e.uniforms),this.uniformsGroups=wf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new dt().setHex(r.value);break;case"v2":this.uniforms[i].value=new wt().fromArray(r.value);break;case"v3":this.uniforms[i].value=new fe().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Ut().fromArray(r.value);break;case"m3":this.uniforms[i].value=new xt().fromArray(r.value);break;case"m4":this.uniforms[i].value=new yt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Cf extends Fn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class yc extends br{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new dt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new dt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ho,this.normalScale=new wt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Kn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Pf extends yc{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new wt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return bt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new dt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new dt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new dt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class Lf extends br{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=yu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class If extends br{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Ws={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Za(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Za(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Za(n){try{const e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class Df{constructor(e,t,i){const r=this;let s=!1,o=0,a=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,s===!1&&r.onStart!==void 0&&r.onStart(u,o,a),s=!0},this.itemEnd=function(u){o++,r.onProgress!==void 0&&r.onProgress(u,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){const h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,f=c.length;h<f;h+=2){const p=c[h],v=c[h+1];if(p.global&&(p.lastIndex=0),p.test(u))return v}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Uf=new Df;class fa{constructor(e){this.manager=e!==void 0?e:Uf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}fa.DEFAULT_MATERIAL_NAME="__DEFAULT";const ki=new WeakMap;class Nf extends fa{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,o=Ws.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(o),s.manager.itemEnd(e)},0);else{let h=ki.get(o);h===void 0&&(h=[],ki.set(o,h)),h.push({onLoad:t,onError:r})}return o}const a=Mr("img");function l(){u(),t&&t(this);const h=ki.get(this)||[];for(let f=0;f<h.length;f++){const p=h[f];p.onLoad&&p.onLoad(this)}ki.delete(this),s.manager.itemEnd(e)}function c(h){u(),r&&r(h),Ws.remove(`image:${e}`);const f=ki.get(this)||[];for(let p=0;p<f.length;p++){const v=f[p];v.onError&&v.onError(h)}ki.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),Ws.add(`image:${e}`,a),s.manager.itemStart(e),a.src=e,a}}class Ff extends fa{constructor(e){super(e)}load(e,t,i,r){const s=new jt,o=new Nf(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){s.image=a,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}}class Sc extends $t{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new dt(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class Of extends Sc{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy($t.DEFAULT_UP),this.updateMatrix(),this.groundColor=new dt(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const Xs=new yt,Ja=new fe,Qa=new fe;class Bf{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new wt(512,512),this.mapType=un,this.map=null,this.mapPass=null,this.matrix=new yt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ps,this._frameExtents=new wt(1,1),this._viewportCount=1,this._viewports=[new Ut(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera;Ja.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ja),Qa.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Qa),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){Xs.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Xs,e.coordinateSystem,e.reversedDepth);const s=this._frameExtents,o=r?r.z/s.x:1,a=r?r.w/s.y:1,l=r?r.x/s.x:0,c=r?r.y/s.y:0;e.coordinateSystem===vr||e.reversedDepth?t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(Xs)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Wr=new fe,Xr=new Qt,wn=new fe;class bc extends $t{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new yt,this.projectionMatrix=new yt,this.projectionMatrixInverse=new yt,this.coordinateSystem=Ln,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Wr,Xr,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,wn.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Wr,Xr,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const ii=new fe,ja=new wt,el=new wt;class mn extends bc{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=yr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(pr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return yr*2*Math.atan(Math.tan(pr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ii.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ii.x,ii.y).multiplyScalar(-e/ii.z),ii.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ii.x,ii.y).multiplyScalar(-e/ii.z)}getViewSize(e,t){return this.getViewBounds(e,ja,el),t.subVectors(el,ja)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(pr*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,t-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class ha extends bc{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,o=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class zf extends Bf{constructor(){super(new ha(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class tl extends Sc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy($t.DEFAULT_UP),this.updateMatrix(),this.target=new $t,this.shadow=new zf}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}const Gi=-90,Hi=1;class kf extends $t{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new mn(Gi,Hi,e,t);r.layers=this.layers,this.add(r);const s=new mn(Gi,Hi,e,t);s.layers=this.layers,this.add(s);const o=new mn(Gi,Hi,e,t);o.layers=this.layers,this.add(o);const a=new mn(Gi,Hi,e,t);a.layers=this.layers,this.add(a);const l=new mn(Gi,Hi,e,t);l.layers=this.layers,this.add(l);const c=new mn(Gi,Hi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,l]=t;for(const c of t)this.remove(c);if(e===Ln)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===vr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,h=e.getRenderTarget(),f=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const b=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let _=!1;e.isWebGLRenderer===!0?_=e.state.buffers.depth.getReversed():_=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=b,e.setRenderTarget(i,5,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,f,p),e.xr.enabled=v,i.texture.needsPMREMUpdate=!0}}class Gf extends mn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const xa=class xa{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};xa.prototype.isMatrix2=!0;let nl=xa;function il(n,e,t,i){const r=Hf(i);switch(t){case lc:return n*e;case ea:return n*e/r.components*r.byteLength;case ta:return n*e/r.components*r.byteLength;case bi:return n*e*2/r.components*r.byteLength;case na:return n*e*2/r.components*r.byteLength;case cc:return n*e*3/r.components*r.byteLength;case xn:return n*e*4/r.components*r.byteLength;case ia:return n*e*4/r.components*r.byteLength;case ts:case ns:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case is:case rs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ho:case mo:return Math.max(n,16)*Math.max(e,8)/4;case fo:case po:return Math.max(n,8)*Math.max(e,8)/2;case go:case xo:case vo:case Mo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case _o:case ls:case yo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case So:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case bo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Eo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case wo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case To:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Ao:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Ro:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Co:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Po:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Lo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Io:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Do:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Uo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case No:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Fo:case Oo:case Bo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case zo:case ko:return Math.ceil(n/4)*Math.ceil(e/4)*8;case cs:case Go:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Hf(n){switch(n){case un:case rc:return{byteLength:1,components:1};case xr:case sc:case Un:return{byteLength:2,components:1};case Qo:case jo:return{byteLength:2,components:4};case Dn:case Jo:case gn:return{byteLength:4,components:1};case oc:case ac:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ko}}));typeof window<"u"&&(window.__THREE__?lt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ko);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ec(){let n=null,e=!1,t=null,i=null;function r(s,o){i=n.requestAnimationFrame(r),t(s,o)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Vf(n){const e=new WeakMap;function t(a,l){const c=a.array,u=a.usage,h=c.byteLength,f=n.createBuffer();n.bindBuffer(l,f),n.bufferData(l,c,u),a.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,l,c){const u=l.array,h=l.updateRanges;if(n.bindBuffer(c,a),h.length===0)n.bufferSubData(c,0,u);else{h.sort((p,v)=>p.start-v.start);let f=0;for(let p=1;p<h.length;p++){const v=h[f],b=h[p];b.start<=v.start+v.count+1?v.count=Math.max(v.count,b.start+b.count-v.start):(++f,h[f]=b)}h.length=f+1;for(let p=0,v=h.length;p<v;p++){const b=h[p];n.bufferSubData(c,b.start*u.BYTES_PER_ELEMENT,u,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:s,update:o}}var Wf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Xf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,qf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Yf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$f=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Kf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Zf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Jf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Qf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,jf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,eh=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,th=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,nh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ih=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,rh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,sh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,oh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ah=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,lh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ch=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,uh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,fh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,hh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,dh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ph=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,mh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,gh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_h=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Mh="gl_FragColor = linearToOutputTexel( gl_FragColor );",yh=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Sh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,bh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Eh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,wh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Th=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ah=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rh=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ch=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ph=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ih=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Dh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Uh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Nh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Fh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Oh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Bh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,zh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,kh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Gh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Hh=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Vh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Wh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Xh=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qh=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Yh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,$h=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kh=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zh=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ed=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,td=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,id=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,sd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,od=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ad=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ld=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,cd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,ud=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,dd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,md=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_d=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,vd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Md=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,yd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,bd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ed=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,wd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Td=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Ad=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Rd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Cd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Pd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ld=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Id=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Dd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ud=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Nd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Fd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Od=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,zd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,kd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Vd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Wd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Xd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Yd=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$d=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kd=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Jd=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Qd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,jd=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,ep=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,tp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,np=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ip=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,rp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,sp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,op=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ap=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,cp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,up=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,hp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_p=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,vp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Mt={alphahash_fragment:Wf,alphahash_pars_fragment:Xf,alphamap_fragment:qf,alphamap_pars_fragment:Yf,alphatest_fragment:$f,alphatest_pars_fragment:Kf,aomap_fragment:Zf,aomap_pars_fragment:Jf,batching_pars_vertex:Qf,batching_vertex:jf,begin_vertex:eh,beginnormal_vertex:th,bsdfs:nh,iridescence_fragment:ih,bumpmap_pars_fragment:rh,clipping_planes_fragment:sh,clipping_planes_pars_fragment:oh,clipping_planes_pars_vertex:ah,clipping_planes_vertex:lh,color_fragment:ch,color_pars_fragment:uh,color_pars_vertex:fh,color_vertex:hh,common:dh,cube_uv_reflection_fragment:ph,defaultnormal_vertex:mh,displacementmap_pars_vertex:gh,displacementmap_vertex:xh,emissivemap_fragment:_h,emissivemap_pars_fragment:vh,colorspace_fragment:Mh,colorspace_pars_fragment:yh,envmap_fragment:Sh,envmap_common_pars_fragment:bh,envmap_pars_fragment:Eh,envmap_pars_vertex:wh,envmap_physical_pars_fragment:Fh,envmap_vertex:Th,fog_vertex:Ah,fog_pars_vertex:Rh,fog_fragment:Ch,fog_pars_fragment:Ph,gradientmap_pars_fragment:Lh,lightmap_pars_fragment:Ih,lights_lambert_fragment:Dh,lights_lambert_pars_fragment:Uh,lights_pars_begin:Nh,lights_toon_fragment:Oh,lights_toon_pars_fragment:Bh,lights_phong_fragment:zh,lights_phong_pars_fragment:kh,lights_physical_fragment:Gh,lights_physical_pars_fragment:Hh,lights_fragment_begin:Vh,lights_fragment_maps:Wh,lights_fragment_end:Xh,lightprobes_pars_fragment:qh,logdepthbuf_fragment:Yh,logdepthbuf_pars_fragment:$h,logdepthbuf_pars_vertex:Kh,logdepthbuf_vertex:Zh,map_fragment:Jh,map_pars_fragment:Qh,map_particle_fragment:jh,map_particle_pars_fragment:ed,metalnessmap_fragment:td,metalnessmap_pars_fragment:nd,morphinstance_vertex:id,morphcolor_vertex:rd,morphnormal_vertex:sd,morphtarget_pars_vertex:od,morphtarget_vertex:ad,normal_fragment_begin:ld,normal_fragment_maps:cd,normal_pars_fragment:ud,normal_pars_vertex:fd,normal_vertex:hd,normalmap_pars_fragment:dd,clearcoat_normal_fragment_begin:pd,clearcoat_normal_fragment_maps:md,clearcoat_pars_fragment:gd,iridescence_pars_fragment:xd,opaque_fragment:_d,packing:vd,premultiplied_alpha_fragment:Md,project_vertex:yd,dithering_fragment:Sd,dithering_pars_fragment:bd,roughnessmap_fragment:Ed,roughnessmap_pars_fragment:wd,shadowmap_pars_fragment:Td,shadowmap_pars_vertex:Ad,shadowmap_vertex:Rd,shadowmask_pars_fragment:Cd,skinbase_vertex:Pd,skinning_pars_vertex:Ld,skinning_vertex:Id,skinnormal_vertex:Dd,specularmap_fragment:Ud,specularmap_pars_fragment:Nd,tonemapping_fragment:Fd,tonemapping_pars_fragment:Od,transmission_fragment:Bd,transmission_pars_fragment:zd,uv_pars_fragment:kd,uv_pars_vertex:Gd,uv_vertex:Hd,worldpos_vertex:Vd,background_vert:Wd,background_frag:Xd,backgroundCube_vert:qd,backgroundCube_frag:Yd,cube_vert:$d,cube_frag:Kd,depth_vert:Zd,depth_frag:Jd,distance_vert:Qd,distance_frag:jd,equirect_vert:ep,equirect_frag:tp,linedashed_vert:np,linedashed_frag:ip,meshbasic_vert:rp,meshbasic_frag:sp,meshlambert_vert:op,meshlambert_frag:ap,meshmatcap_vert:lp,meshmatcap_frag:cp,meshnormal_vert:up,meshnormal_frag:fp,meshphong_vert:hp,meshphong_frag:dp,meshphysical_vert:pp,meshphysical_frag:mp,meshtoon_vert:gp,meshtoon_frag:xp,points_vert:_p,points_frag:vp,shadow_vert:Mp,shadow_frag:yp,sprite_vert:Sp,sprite_frag:bp},He={common:{diffuse:{value:new dt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new xt},alphaMap:{value:null},alphaMapTransform:{value:new xt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new xt}},envmap:{envMap:{value:null},envMapRotation:{value:new xt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new xt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new xt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new xt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new xt},normalScale:{value:new wt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new xt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new xt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new xt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new xt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new dt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new fe},probesMax:{value:new fe},probesResolution:{value:new fe}},points:{diffuse:{value:new dt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new xt},alphaTest:{value:0},uvTransform:{value:new xt}},sprite:{diffuse:{value:new dt(16777215)},opacity:{value:1},center:{value:new wt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new xt},alphaMap:{value:null},alphaMapTransform:{value:new xt},alphaTest:{value:0}}},Rn={basic:{uniforms:nn([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.fog]),vertexShader:Mt.meshbasic_vert,fragmentShader:Mt.meshbasic_frag},lambert:{uniforms:nn([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.fog,He.lights,{emissive:{value:new dt(0)},envMapIntensity:{value:1}}]),vertexShader:Mt.meshlambert_vert,fragmentShader:Mt.meshlambert_frag},phong:{uniforms:nn([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.fog,He.lights,{emissive:{value:new dt(0)},specular:{value:new dt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Mt.meshphong_vert,fragmentShader:Mt.meshphong_frag},standard:{uniforms:nn([He.common,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.roughnessmap,He.metalnessmap,He.fog,He.lights,{emissive:{value:new dt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Mt.meshphysical_vert,fragmentShader:Mt.meshphysical_frag},toon:{uniforms:nn([He.common,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.gradientmap,He.fog,He.lights,{emissive:{value:new dt(0)}}]),vertexShader:Mt.meshtoon_vert,fragmentShader:Mt.meshtoon_frag},matcap:{uniforms:nn([He.common,He.bumpmap,He.normalmap,He.displacementmap,He.fog,{matcap:{value:null}}]),vertexShader:Mt.meshmatcap_vert,fragmentShader:Mt.meshmatcap_frag},points:{uniforms:nn([He.points,He.fog]),vertexShader:Mt.points_vert,fragmentShader:Mt.points_frag},dashed:{uniforms:nn([He.common,He.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Mt.linedashed_vert,fragmentShader:Mt.linedashed_frag},depth:{uniforms:nn([He.common,He.displacementmap]),vertexShader:Mt.depth_vert,fragmentShader:Mt.depth_frag},normal:{uniforms:nn([He.common,He.bumpmap,He.normalmap,He.displacementmap,{opacity:{value:1}}]),vertexShader:Mt.meshnormal_vert,fragmentShader:Mt.meshnormal_frag},sprite:{uniforms:nn([He.sprite,He.fog]),vertexShader:Mt.sprite_vert,fragmentShader:Mt.sprite_frag},background:{uniforms:{uvTransform:{value:new xt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Mt.background_vert,fragmentShader:Mt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new xt}},vertexShader:Mt.backgroundCube_vert,fragmentShader:Mt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Mt.cube_vert,fragmentShader:Mt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Mt.equirect_vert,fragmentShader:Mt.equirect_frag},distance:{uniforms:nn([He.common,He.displacementmap,{referencePosition:{value:new fe},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Mt.distance_vert,fragmentShader:Mt.distance_frag},shadow:{uniforms:nn([He.lights,He.fog,{color:{value:new dt(0)},opacity:{value:1}}]),vertexShader:Mt.shadow_vert,fragmentShader:Mt.shadow_frag}};Rn.physical={uniforms:nn([Rn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new xt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new xt},clearcoatNormalScale:{value:new wt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new xt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new xt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new xt},sheen:{value:0},sheenColor:{value:new dt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new xt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new xt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new xt},transmissionSamplerSize:{value:new wt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new xt},attenuationDistance:{value:0},attenuationColor:{value:new dt(0)},specularColor:{value:new dt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new xt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new xt},anisotropyVector:{value:new wt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new xt}}]),vertexShader:Mt.meshphysical_vert,fragmentShader:Mt.meshphysical_frag};const qr={r:0,b:0,g:0},Ep=new yt,wc=new xt;wc.set(-1,0,0,0,1,0,0,0,1);function wp(n,e,t,i,r,s){const o=new dt(0);let a=r===!0?0:1,l,c,u=null,h=0,f=null;function p(I){let ne=I.isScene===!0?I.background:null;if(ne&&ne.isTexture){const A=I.backgroundBlurriness>0;ne=e.get(ne,A)}return ne}function v(I){let ne=!1;const A=p(I);A===null?_(o,a):A&&A.isColor&&(_(A,1),ne=!0);const P=n.xr.getEnvironmentBlendMode();P==="additive"?t.buffers.color.setClear(0,0,0,1,s):P==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||ne)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function b(I,ne){const A=p(ne);A&&(A.isCubeTexture||A.mapping===ds)?(c===void 0&&(c=new on(new Er(1,1,1),new Fn({name:"BackgroundCubeMaterial",uniforms:Qi(Rn.backgroundCube.uniforms),vertexShader:Rn.backgroundCube.vertexShader,fragmentShader:Rn.backgroundCube.fragmentShader,side:sn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(P,C,W){this.matrixWorld.copyPosition(W.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=A,c.material.uniforms.backgroundBlurriness.value=ne.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=ne.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Ep.makeRotationFromEuler(ne.backgroundRotation)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(wc),c.material.toneMapped=Et.getTransfer(A.colorSpace)!==It,(u!==A||h!==A.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,u=A,h=A.version,f=n.toneMapping),c.layers.enableAll(),I.unshift(c,c.geometry,c.material,0,0,null)):A&&A.isTexture&&(l===void 0&&(l=new on(new ms(2,2),new Fn({name:"BackgroundMaterial",uniforms:Qi(Rn.background.uniforms),vertexShader:Rn.background.vertexShader,fragmentShader:Rn.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=A,l.material.uniforms.backgroundIntensity.value=ne.backgroundIntensity,l.material.toneMapped=Et.getTransfer(A.colorSpace)!==It,A.matrixAutoUpdate===!0&&A.updateMatrix(),l.material.uniforms.uvTransform.value.copy(A.matrix),(u!==A||h!==A.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,u=A,h=A.version,f=n.toneMapping),l.layers.enableAll(),I.unshift(l,l.geometry,l.material,0,0,null))}function _(I,ne){I.getRGB(qr,Mc(n)),t.buffers.color.setClear(qr.r,qr.g,qr.b,ne,s)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(I,ne=1){o.set(I),a=ne,_(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(I){a=I,_(o,a)},render:v,addToRenderList:b,dispose:m}}function Tp(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=f(null);let s=r,o=!1;function a(se,_e,me,w,G){let g=!1;const z=h(se,w,me,_e);s!==z&&(s=z,c(s.object)),g=p(se,w,me,G),g&&v(se,w,me,G),G!==null&&e.update(G,n.ELEMENT_ARRAY_BUFFER),(g||o)&&(o=!1,A(se,_e,me,w),G!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function l(){return n.createVertexArray()}function c(se){return n.bindVertexArray(se)}function u(se){return n.deleteVertexArray(se)}function h(se,_e,me,w){const G=w.wireframe===!0;let g=i[_e.id];g===void 0&&(g={},i[_e.id]=g);const z=se.isInstancedMesh===!0?se.id:0;let re=g[z];re===void 0&&(re={},g[z]=re);let K=re[me.id];K===void 0&&(K={},re[me.id]=K);let R=K[G];return R===void 0&&(R=f(l()),K[G]=R),R}function f(se){const _e=[],me=[],w=[];for(let G=0;G<t;G++)_e[G]=0,me[G]=0,w[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:_e,enabledAttributes:me,attributeDivisors:w,object:se,attributes:{},index:null}}function p(se,_e,me,w){const G=s.attributes,g=_e.attributes;let z=0;const re=me.getAttributes();for(const K in re)if(re[K].location>=0){const T=G[K];let F=g[K];if(F===void 0&&(K==="instanceMatrix"&&se.instanceMatrix&&(F=se.instanceMatrix),K==="instanceColor"&&se.instanceColor&&(F=se.instanceColor)),T===void 0||T.attribute!==F||F&&T.data!==F.data)return!0;z++}return s.attributesNum!==z||s.index!==w}function v(se,_e,me,w){const G={},g=_e.attributes;let z=0;const re=me.getAttributes();for(const K in re)if(re[K].location>=0){let T=g[K];T===void 0&&(K==="instanceMatrix"&&se.instanceMatrix&&(T=se.instanceMatrix),K==="instanceColor"&&se.instanceColor&&(T=se.instanceColor));const F={};F.attribute=T,T&&T.data&&(F.data=T.data),G[K]=F,z++}s.attributes=G,s.attributesNum=z,s.index=w}function b(){const se=s.newAttributes;for(let _e=0,me=se.length;_e<me;_e++)se[_e]=0}function _(se){m(se,0)}function m(se,_e){const me=s.newAttributes,w=s.enabledAttributes,G=s.attributeDivisors;me[se]=1,w[se]===0&&(n.enableVertexAttribArray(se),w[se]=1),G[se]!==_e&&(n.vertexAttribDivisor(se,_e),G[se]=_e)}function I(){const se=s.newAttributes,_e=s.enabledAttributes;for(let me=0,w=_e.length;me<w;me++)_e[me]!==se[me]&&(n.disableVertexAttribArray(me),_e[me]=0)}function ne(se,_e,me,w,G,g,z){z===!0?n.vertexAttribIPointer(se,_e,me,G,g):n.vertexAttribPointer(se,_e,me,w,G,g)}function A(se,_e,me,w){b();const G=w.attributes,g=me.getAttributes(),z=_e.defaultAttributeValues;for(const re in g){const K=g[re];if(K.location>=0){let R=G[re];if(R===void 0&&(re==="instanceMatrix"&&se.instanceMatrix&&(R=se.instanceMatrix),re==="instanceColor"&&se.instanceColor&&(R=se.instanceColor)),R!==void 0){const T=R.normalized,F=R.itemSize,Q=e.get(R);if(Q===void 0)continue;const k=Q.buffer,Y=Q.type,$=Q.bytesPerElement,D=Y===n.INT||Y===n.UNSIGNED_INT||R.gpuType===Jo;if(R.isInterleavedBufferAttribute){const O=R.data,j=O.stride,X=R.offset;if(O.isInstancedInterleavedBuffer){for(let V=0;V<K.locationSize;V++)m(K.location+V,O.meshPerAttribute);se.isInstancedMesh!==!0&&w._maxInstanceCount===void 0&&(w._maxInstanceCount=O.meshPerAttribute*O.count)}else for(let V=0;V<K.locationSize;V++)_(K.location+V);n.bindBuffer(n.ARRAY_BUFFER,k);for(let V=0;V<K.locationSize;V++)ne(K.location+V,F/K.locationSize,Y,T,j*$,(X+F/K.locationSize*V)*$,D)}else{if(R.isInstancedBufferAttribute){for(let O=0;O<K.locationSize;O++)m(K.location+O,R.meshPerAttribute);se.isInstancedMesh!==!0&&w._maxInstanceCount===void 0&&(w._maxInstanceCount=R.meshPerAttribute*R.count)}else for(let O=0;O<K.locationSize;O++)_(K.location+O);n.bindBuffer(n.ARRAY_BUFFER,k);for(let O=0;O<K.locationSize;O++)ne(K.location+O,F/K.locationSize,Y,T,F*$,F/K.locationSize*O*$,D)}}else if(z!==void 0){const T=z[re];if(T!==void 0)switch(T.length){case 2:n.vertexAttrib2fv(K.location,T);break;case 3:n.vertexAttrib3fv(K.location,T);break;case 4:n.vertexAttrib4fv(K.location,T);break;default:n.vertexAttrib1fv(K.location,T)}}}}I()}function P(){N();for(const se in i){const _e=i[se];for(const me in _e){const w=_e[me];for(const G in w){const g=w[G];for(const z in g)u(g[z].object),delete g[z];delete w[G]}}delete i[se]}}function C(se){if(i[se.id]===void 0)return;const _e=i[se.id];for(const me in _e){const w=_e[me];for(const G in w){const g=w[G];for(const z in g)u(g[z].object),delete g[z];delete w[G]}}delete i[se.id]}function W(se){for(const _e in i){const me=i[_e];for(const w in me){const G=me[w];if(G[se.id]===void 0)continue;const g=G[se.id];for(const z in g)u(g[z].object),delete g[z];delete G[se.id]}}}function S(se){for(const _e in i){const me=i[_e],w=se.isInstancedMesh===!0?se.id:0,G=me[w];if(G!==void 0){for(const g in G){const z=G[g];for(const re in z)u(z[re].object),delete z[re];delete G[g]}delete me[w],Object.keys(me).length===0&&delete i[_e]}}}function N(){J(),o=!0,s!==r&&(s=r,c(s.object))}function J(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:N,resetDefaultState:J,dispose:P,releaseStatesOfGeometry:C,releaseStatesOfObject:S,releaseStatesOfProgram:W,initAttributes:b,enableAttribute:_,disableUnusedAttributes:I}}function Ap(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function o(l,c,u){u!==0&&(n.drawArraysInstanced(i,l,c,u),t.update(c,i,u))}function a(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,u);let f=0;for(let p=0;p<u;p++)f+=c[p];t.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function Rp(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const W=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(W.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(W){return!(W!==xn&&i.convert(W)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(W){const S=W===Un&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(W!==un&&W!==gn&&!S&&i.convert(W)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(W){if(W==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";W="mediump"}return W==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(lt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&f===!1&&lt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=n.getParameter(n.MAX_TEXTURE_SIZE),_=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),I=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),ne=n.getParameter(n.MAX_VARYING_VECTORS),A=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),P=n.getParameter(n.MAX_SAMPLES),C=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:v,maxTextureSize:b,maxCubemapSize:_,maxAttributes:m,maxVertexUniforms:I,maxVaryings:ne,maxFragmentUniforms:A,maxSamples:P,samples:C}}function Cp(n){const e=this;let t=null,i=0,r=!1,s=!1;const o=new pn,a=new xt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f){const p=h.length!==0||f||i!==0||r;return r=f,i=h.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,f){t=u(h,f,0)},this.setState=function(h,f,p){const v=h.clippingPlanes,b=h.clipIntersection,_=h.clipShadows,m=n.get(h);if(!r||v===null||v.length===0||s&&!_)s?u(null):c();else{const I=s?0:i,ne=I*4;let A=m.clippingState||null;l.value=A,A=u(v,f,ne,p);for(let P=0;P!==ne;++P)A[P]=t[P];m.clippingState=A,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=I}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,f,p,v){const b=h!==null?h.length:0;let _=null;if(b!==0){if(_=l.value,v!==!0||_===null){const m=p+b*4,I=f.matrixWorldInverse;a.getNormalMatrix(I),(_===null||_.length<m)&&(_=new Float32Array(m));for(let ne=0,A=p;ne!==b;++ne,A+=4)o.copy(h[ne]).applyMatrix4(I,a),o.normal.toArray(_,A),_[A+3]=o.constant}l.value=_,l.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,_}}const Yi=4,Pp=6,Lp=20,Ip=256,ar=new ha,rl=new dt;let qs=null,Ys=0,$s=0,Ks=!1;const Dp=new fe,di=new fe;class sl{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:o=256,position:a=Dp}=s;qs=this._renderer.getRenderTarget(),Ys=this._renderer.getActiveCubeFace(),$s=this._renderer.getActiveMipmapLevel(),Ks=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ll(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=al(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(qs,Ys,$s),this._renderer.xr.enabled=Ks,e.scissorTest=!1,Vi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Si||e.mapping===Ji?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),qs=this._renderer.getRenderTarget(),Ys=this._renderer.getActiveCubeFace(),$s=this._renderer.getActiveMipmapLevel(),Ks=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Yt,minFilter:Yt,generateMipmaps:!1,type:Un,format:xn,colorSpace:us,depthBuffer:!1},r=ol(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ol(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Up(s)),this._blurMaterial=Fp(s,e,t),this._ggxMaterial=Np(s,e,t)}return r}_compileMaterial(e){const t=new on(new _n,e);this._renderer.compile(t,ar)}_sceneToCubeUV(e,t,i,r,s){const l=new mn(90,1,t,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,f=h.autoClear,p=h.toneMapping;h.getClearColor(rl),h.toneMapping=In,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new on(new Er,new gc({name:"PMREM.Background",side:sn,depthWrite:!1,depthTest:!1})));const b=this._backgroundBox,_=b.material;let m=!1;const I=e.background;I?I.isColor&&(_.color.copy(I),e.background=null,m=!0):(_.color.copy(rl),m=!0);for(let ne=0;ne<6;ne++){const A=ne%3;A===0?(l.up.set(0,c[ne],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[ne],s.y,s.z)):A===1?(l.up.set(0,0,c[ne]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[ne],s.z)):(l.up.set(0,c[ne],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[ne]));const P=this._cubeSize;Vi(r,A*P,ne>2?P:0,P,P),h.setRenderTarget(r),m&&h.render(b,l),h.render(e,l)}h.toneMapping=p,h.autoClear=f,e.background=I}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===Si||e.mapping===Ji;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ll()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=al());const s=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;const a=s.uniforms;a.envMap.value=e;const l=this._cubeSize;Vi(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,ar)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;const l=o.uniforms,c=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-u*u),f=c*1.25,p=h*f,{_lodMax:v}=this,b=this._sizeLods[i],_=3*b*(i>v-Yi?i-v+Yi:0),m=4*(this._cubeSize-b);l.envMap.value=e.texture,l.roughness.value=p,l.mipInt.value=v-t,Vi(s,_,m,3*b,2*b),r.setRenderTarget(s),r.render(a,ar),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=v-i,Vi(e,_,m,3*b,2*b),r.setRenderTarget(e),r.render(a,ar)}_blur(e,t,i,r){const s=this._pingPongRenderTarget,o=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,i,o),this._blurPass(s,e,i,i,o)}_blurPass(e,t,i,r,s){const o=this._renderer,a=this._blurMaterial,l=this._lodMeshes[r];l.material=a;const c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-i;const u=this._sizeLods[r],h=3*u*(r>this._lodMax-Yi?r-this._lodMax+Yi:0),f=4*(this._cubeSize-u);Vi(t,h,f,3*u,2*u),o.setRenderTarget(t),o.render(l,ar)}}function Up(n){const e=[],t=[];let i=n;const r=n-Yi+1+Pp;for(let s=0;s<r;s++){const o=Math.pow(2,i);e.push(o);const a=1/(o-2),l=-a,c=1+a,u=[l,l,c,l,c,c,l,l,c,c,l,c],h=6,f=6,p=3,v=new Float32Array(p*f*h),b=new Float32Array(p*f*h);for(let m=0;m<h;m++){const I=m%3*2/3-1,ne=m>2?0:-1,A=[I,ne,0,I+2/3,ne,0,I+2/3,ne+1,0,I,ne,0,I+2/3,ne+1,0,I,ne+1,0];v.set(A,p*f*m);for(let P=0;P<f;P++){const C=u[P*2]*2-1,W=u[P*2+1]*2-1;m===0?di.set(1,W,C):m===1?di.set(-C,1,-W):m===2?di.set(-C,W,1):m===3?di.set(-1,W,-C):m===4?di.set(-C,-1,W):di.set(C,W,-1),di.toArray(b,(m*f+P)*p)}}const _=new _n;_.setAttribute("position",new fn(v,p)),_.setAttribute("outputDirection",new fn(b,p)),t.push(new on(_,null)),i>Yi&&i--}return{lodMeshes:t,sizeLods:e}}function ol(n,e,t){const i=new bn(n,e,t);return i.texture.mapping=ds,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Vi(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Np(n,e,t){return new Fn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Ip,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function Fp(n,e,t){return new Fn({name:"SphericalGaussianBlur",defines:{SAMPLES:Lp,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function al(){return new Fn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function ll(){return new Fn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function gs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Tc extends bn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new _c(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Er(5,5,5),s=new Fn({name:"CubemapFromEquirect",uniforms:Qi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:sn,blending:Xn});s.uniforms.tEquirect.value=t;const o=new on(r,s),a=t.minFilter;return t.minFilter===si&&(t.minFilter=Yt),new kf(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}}function Op(n){let e=new WeakMap,t=new WeakMap,i=null;function r(f,p=!1){return f==null?null:p?o(f):s(f)}function s(f){if(f&&f.isTexture){const p=f.mapping;if(p===_s||p===vs)if(e.has(f)){const v=e.get(f).texture;return a(v,f.mapping)}else{const v=f.image;if(v&&v.height>0){const b=new Tc(v.height);return b.fromEquirectangularTexture(n,f),e.set(f,b),f.addEventListener("dispose",c),a(b.texture,f.mapping)}else return null}}return f}function o(f){if(f&&f.isTexture){const p=f.mapping,v=p===_s||p===vs,b=p===Si||p===Ji;if(v||b){let _=t.get(f);const m=_!==void 0?_.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==m)return i===null&&(i=new sl(n)),_=v?i.fromEquirectangular(f,_):i.fromCubemap(f,_),_.texture.pmremVersion=f.pmremVersion,t.set(f,_),_.texture;if(_!==void 0)return _.texture;{const I=f.image;return v&&I&&I.height>0||b&&I&&l(I)?(i===null&&(i=new sl(n)),_=v?i.fromEquirectangular(f):i.fromCubemap(f),_.texture.pmremVersion=f.pmremVersion,t.set(f,_),f.addEventListener("dispose",u),_.texture):null}}}return f}function a(f,p){return p===_s?f.mapping=Si:p===vs&&(f.mapping=Ji),f}function l(f){let p=0;const v=6;for(let b=0;b<v;b++)f[b]!==void 0&&p++;return p===v}function c(f){const p=f.target;p.removeEventListener("dispose",c);const v=e.get(p);v!==void 0&&(e.delete(p),v.dispose())}function u(f){const p=f.target;p.removeEventListener("dispose",u);const v=t.get(p);v!==void 0&&(t.delete(p),v.dispose())}function h(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:h}}function Bp(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&$i("WebGLRenderer: "+i+" extension not supported."),r}}}function zp(n,e,t,i){const r={},s=new WeakMap;function o(h){const f=h.target;f.index!==null&&e.remove(f.index);for(const v in f.attributes)e.remove(f.attributes[v]);f.removeEventListener("dispose",o),delete r[f.id];const p=s.get(f);p&&(e.remove(p),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(h,f){return r[f.id]===!0||(f.addEventListener("dispose",o),r[f.id]=!0,t.memory.geometries++),f}function l(h){const f=h.attributes;for(const p in f)e.update(f[p],n.ARRAY_BUFFER)}function c(h){const f=[],p=h.index,v=h.attributes.position;let b=0;if(v===void 0)return;if(p!==null){const I=p.array;b=p.version;for(let ne=0,A=I.length;ne<A;ne+=3){const P=I[ne+0],C=I[ne+1],W=I[ne+2];f.push(P,C,C,W,W,P)}}else{const I=v.array;b=v.version;for(let ne=0,A=I.length/3-1;ne<A;ne+=3){const P=ne+0,C=ne+1,W=ne+2;f.push(P,C,C,W,W,P)}}const _=new(v.count>=65535?pc:la)(f,1);_.version=b;const m=s.get(h);m&&e.remove(m),s.set(h,_)}function u(h){const f=s.get(h);if(f){const p=h.index;p!==null&&f.version<p.version&&c(h)}else c(h);return s.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function kp(n,e,t){let i;function r(h){i=h}let s,o;function a(h){s=h.type,o=h.bytesPerElement}function l(h,f){n.drawElements(i,f,s,h*o),t.update(f,i,1)}function c(h,f,p){p!==0&&(n.drawElementsInstanced(i,f,s,h*o,p),t.update(f,i,p))}function u(h,f,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,h,0,p);let b=0;for(let _=0;_<p;_++)b+=f[_];t.update(b,i,1)}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function Gp(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:Ct("WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Hp(n,e,t){const i=new WeakMap,r=new Ut;function s(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let f=i.get(a);if(f===void 0||f.count!==h){let N=function(){W.dispose(),i.delete(a),a.removeEventListener("dispose",N)};f!==void 0&&f.texture.dispose();const p=a.morphAttributes.position!==void 0,v=a.morphAttributes.normal!==void 0,b=a.morphAttributes.color!==void 0,_=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],I=a.morphAttributes.color||[];let ne=0;p===!0&&(ne=1),v===!0&&(ne=2),b===!0&&(ne=3);let A=a.attributes.position.count*ne,P=1;A>e.maxTextureSize&&(P=Math.ceil(A/e.maxTextureSize),A=e.maxTextureSize);const C=new Float32Array(A*P*4*h),W=new fc(C,A,P,h);W.type=gn,W.needsUpdate=!0;const S=ne*4;for(let J=0;J<h;J++){const se=_[J],_e=m[J],me=I[J],w=A*P*4*J;for(let G=0;G<se.count;G++){const g=G*S;p===!0&&(r.fromBufferAttribute(se,G),C[w+g+0]=r.x,C[w+g+1]=r.y,C[w+g+2]=r.z,C[w+g+3]=0),v===!0&&(r.fromBufferAttribute(_e,G),C[w+g+4]=r.x,C[w+g+5]=r.y,C[w+g+6]=r.z,C[w+g+7]=0),b===!0&&(r.fromBufferAttribute(me,G),C[w+g+8]=r.x,C[w+g+9]=r.y,C[w+g+10]=r.z,C[w+g+11]=me.itemSize===4?r.w:1)}}f={count:h,texture:W,size:new wt(A,P)},i.set(a,f),a.addEventListener("dispose",N)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let p=0;for(let b=0;b<c.length;b++)p+=c[b];const v=a.morphTargetsRelative?1:1-p;l.getUniforms().setValue(n,"morphTargetBaseInfluence",v),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:s}}function Vp(n,e,t,i,r){let s=new WeakMap;function o(c){const u=r.render.frame,h=c.geometry,f=e.get(c,h);if(s.get(f)!==u&&(e.update(f),s.set(f,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==u&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,u))),c.isSkinnedMesh){const p=c.skeleton;s.get(p)!==u&&(p.update(),s.set(p,u))}return f}function a(){s=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}const Wp={[Jl]:"LINEAR_TONE_MAPPING",[Ql]:"REINHARD_TONE_MAPPING",[jl]:"CINEON_TONE_MAPPING",[Zo]:"ACES_FILMIC_TONE_MAPPING",[tc]:"AGX_TONE_MAPPING",[nc]:"NEUTRAL_TONE_MAPPING",[ec]:"CUSTOM_TONE_MAPPING"};function Xp(n,e,t,i,r,s){const o=new bn(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let a=null,l=null;const c=new _n;c.setAttribute("position",new qt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new qt([0,2,0,0,2,0],2));const u=new Cf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new on(c,u),f=new ha(-1,1,1,-1,0,1);let p=null,v=null,b=!1,_,m=null,I=[],ne=!1;this.setSize=function(A,P){o.setSize(A,P),a!==null&&a.setSize(A,P),l!==null&&l.setSize(A,P);for(let C=0;C<I.length;C++){const W=I[C];W.setSize&&W.setSize(A,P)}},this.setEffects=function(A){I=A,ne=I.length>0&&I[0].isRenderPass===!0;const P=o.width,C=o.height;I.length>0&&a===null&&(a=new bn(P,C,{type:Un,depthBuffer:!1,stencilBuffer:!1}),l=new bn(P,C,{type:Un,depthBuffer:!1,stencilBuffer:!1}));for(let W=0;W<I.length;W++){const S=I[W];S.setSize&&S.setSize(P,C)}},this.begin=function(A,P){if(b||A.toneMapping===In&&I.length===0)return!1;if(m=P,P!==null){const C=P.width,W=P.height;(o.width!==C||o.height!==W)&&this.setSize(C,W)}return ne===!1&&A.setRenderTarget(o),_=A.toneMapping,A.toneMapping=In,!0},this.hasRenderPass=function(){return ne},this.end=function(A,P){A.toneMapping=_,b=!0;let C=o,W=a;for(let S=0;S<I.length;S++){const N=I[S];N.enabled!==!1&&(N.render(A,W,C,P),N.needsSwap!==!1&&(C=W,W=W===a?l:a))}if(p!==A.outputColorSpace||v!==A.toneMapping){p=A.outputColorSpace,v=A.toneMapping,u.defines={},Et.getTransfer(p)===It&&(u.defines.SRGB_TRANSFER="");const S=Wp[v];S&&(u.defines[S]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=C.texture,A.setRenderTarget(m),A.render(h,f),m=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}const Ac=new jt,Xo=new Sr(1,1),Rc=new fc,Cc=new nf,Pc=new _c,cl=[],ul=[],fl=new Float32Array(16),hl=new Float32Array(9),dl=new Float32Array(4);function ji(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=cl[r];if(s===void 0&&(s=new Float32Array(r),cl[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function Vt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Wt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function xs(n,e){let t=ul[e];t===void 0&&(t=new Int32Array(e),ul[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function qp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Yp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Vt(t,e))return;n.uniform2fv(this.addr,e),Wt(t,e)}}function $p(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Vt(t,e))return;n.uniform3fv(this.addr,e),Wt(t,e)}}function Kp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Vt(t,e))return;n.uniform4fv(this.addr,e),Wt(t,e)}}function Zp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Vt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Wt(t,e)}else{if(Vt(t,i))return;dl.set(i),n.uniformMatrix2fv(this.addr,!1,dl),Wt(t,i)}}function Jp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Vt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Wt(t,e)}else{if(Vt(t,i))return;hl.set(i),n.uniformMatrix3fv(this.addr,!1,hl),Wt(t,i)}}function Qp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Vt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Wt(t,e)}else{if(Vt(t,i))return;fl.set(i),n.uniformMatrix4fv(this.addr,!1,fl),Wt(t,i)}}function jp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function e0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Vt(t,e))return;n.uniform2iv(this.addr,e),Wt(t,e)}}function t0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Vt(t,e))return;n.uniform3iv(this.addr,e),Wt(t,e)}}function n0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Vt(t,e))return;n.uniform4iv(this.addr,e),Wt(t,e)}}function i0(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function r0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Vt(t,e))return;n.uniform2uiv(this.addr,e),Wt(t,e)}}function s0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Vt(t,e))return;n.uniform3uiv(this.addr,e),Wt(t,e)}}function o0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Vt(t,e))return;n.uniform4uiv(this.addr,e),Wt(t,e)}}function a0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Xo.compareFunction=t.isReversedDepthBuffer()?sa:ra,s=Xo):s=Ac,t.setTexture2D(e||s,r)}function l0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Cc,r)}function c0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Pc,r)}function u0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Rc,r)}function f0(n){switch(n){case 5126:return qp;case 35664:return Yp;case 35665:return $p;case 35666:return Kp;case 35674:return Zp;case 35675:return Jp;case 35676:return Qp;case 5124:case 35670:return jp;case 35667:case 35671:return e0;case 35668:case 35672:return t0;case 35669:case 35673:return n0;case 5125:return i0;case 36294:return r0;case 36295:return s0;case 36296:return o0;case 35678:case 36198:case 36298:case 36306:case 35682:return a0;case 35679:case 36299:case 36307:return l0;case 35680:case 36300:case 36308:case 36293:return c0;case 36289:case 36303:case 36311:case 36292:return u0}}function h0(n,e){n.uniform1fv(this.addr,e)}function d0(n,e){const t=ji(e,this.size,2);n.uniform2fv(this.addr,t)}function p0(n,e){const t=ji(e,this.size,3);n.uniform3fv(this.addr,t)}function m0(n,e){const t=ji(e,this.size,4);n.uniform4fv(this.addr,t)}function g0(n,e){const t=ji(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function x0(n,e){const t=ji(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function _0(n,e){const t=ji(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function v0(n,e){n.uniform1iv(this.addr,e)}function M0(n,e){n.uniform2iv(this.addr,e)}function y0(n,e){n.uniform3iv(this.addr,e)}function S0(n,e){n.uniform4iv(this.addr,e)}function b0(n,e){n.uniform1uiv(this.addr,e)}function E0(n,e){n.uniform2uiv(this.addr,e)}function w0(n,e){n.uniform3uiv(this.addr,e)}function T0(n,e){n.uniform4uiv(this.addr,e)}function A0(n,e,t){const i=this.cache,r=e.length,s=xs(t,r);Vt(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));let o;this.type===n.SAMPLER_2D_SHADOW?o=Xo:o=Ac;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||o,s[a])}function R0(n,e,t){const i=this.cache,r=e.length,s=xs(t,r);Vt(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||Cc,s[o])}function C0(n,e,t){const i=this.cache,r=e.length,s=xs(t,r);Vt(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||Pc,s[o])}function P0(n,e,t){const i=this.cache,r=e.length,s=xs(t,r);Vt(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||Rc,s[o])}function L0(n){switch(n){case 5126:return h0;case 35664:return d0;case 35665:return p0;case 35666:return m0;case 35674:return g0;case 35675:return x0;case 35676:return _0;case 5124:case 35670:return v0;case 35667:case 35671:return M0;case 35668:case 35672:return y0;case 35669:case 35673:return S0;case 5125:return b0;case 36294:return E0;case 36295:return w0;case 36296:return T0;case 35678:case 36198:case 36298:case 36306:case 35682:return A0;case 35679:case 36299:case 36307:return R0;case 35680:case 36300:case 36308:case 36293:return C0;case 36289:case 36303:case 36311:case 36292:return P0}}class I0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=f0(t.type)}}class D0{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=L0(t.type)}}class U0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(e,t[a.id],i)}}}const Zs=/(\w+)(\])?(\[|\.)?/g;function pl(n,e){n.seq.push(e),n.map[e.id]=e}function N0(n,e,t){const i=n.name,r=i.length;for(Zs.lastIndex=0;;){const s=Zs.exec(i),o=Zs.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){pl(t,c===void 0?new I0(a,n,e):new D0(a,n,e));break}else{let h=t.map[a];h===void 0&&(h=new U0(a),pl(t,h)),t=h}}}class ss{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const a=e.getActiveUniform(t,o),l=e.getUniformLocation(t,a.name);N0(a,l,this)}const r=[],s=[];for(const o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(o):s.push(o);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){const a=t[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function ml(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const F0=37297;let O0=0;function B0(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}const gl=new xt;function z0(n){Et._getMatrix(gl,Et.workingColorSpace,n);const e=`mat3( ${gl.elements.map(t=>t.toFixed(4))} )`;switch(Et.getTransfer(n)){case fs:return[e,"LinearTransferOETF"];case It:return[e,"sRGBTransferOETF"];default:return lt("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function xl(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+B0(n.getShaderSource(e),a)}else return s}function k0(n,e){const t=z0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const G0={[Jl]:"Linear",[Ql]:"Reinhard",[jl]:"Cineon",[Zo]:"ACESFilmic",[tc]:"AgX",[nc]:"Neutral",[ec]:"Custom"};function H0(n,e){const t=G0[e];return t===void 0?(lt("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Yr=new fe;function V0(){Et.getLuminanceCoefficients(Yr);const n=Yr.x.toFixed(4),e=Yr.y.toFixed(4),t=Yr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function W0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(hr).join(`
`)}function X0(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function q0(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function hr(n){return n!==""}function _l(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function vl(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Y0=/^[ \t]*#include +<([\w\d./]+)>/gm;function qo(n){return n.replace(Y0,K0)}const $0=new Map;function K0(n,e){let t=Mt[e];if(t===void 0){const i=$0.get(e);if(i!==void 0)t=Mt[i],lt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return qo(t)}const Z0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ml(n){return n.replace(Z0,J0)}function J0(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function yl(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Q0={[es]:"SHADOWMAP_TYPE_PCF",[ur]:"SHADOWMAP_TYPE_VSM"};function j0(n){return Q0[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const em={[Si]:"ENVMAP_TYPE_CUBE",[Ji]:"ENVMAP_TYPE_CUBE",[ds]:"ENVMAP_TYPE_CUBE_UV"};function tm(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":em[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const nm={[Ji]:"ENVMAP_MODE_REFRACTION"};function im(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":nm[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const rm={[Zl]:"ENVMAP_BLENDING_MULTIPLY",[xu]:"ENVMAP_BLENDING_MIX",[_u]:"ENVMAP_BLENDING_ADD"};function sm(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":rm[n.combine]||"ENVMAP_BLENDING_NONE"}function om(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function am(n,e,t,i){const r=n.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=j0(t),c=tm(t),u=im(t),h=sm(t),f=om(t),p=W0(t),v=X0(s),b=r.createProgram();let _,m,I=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(hr).join(`
`),_.length>0&&(_+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(hr).join(`
`),m.length>0&&(m+=`
`)):(_=[yl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(hr).join(`
`),m=[yl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==In?"#define TONE_MAPPING":"",t.toneMapping!==In?Mt.tonemapping_pars_fragment:"",t.toneMapping!==In?H0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Mt.colorspace_pars_fragment,k0("linearToOutputTexel",t.outputColorSpace),V0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(hr).join(`
`)),o=qo(o),o=_l(o,t),o=vl(o,t),a=qo(a),a=_l(a,t),a=vl(a,t),o=Ml(o),a=Ml(a),t.isRawShaderMaterial!==!0&&(I=`#version 300 es
`,_=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,m=["#define varying in",t.glslVersion===Ea?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ea?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const ne=I+_+o,A=I+m+a,P=ml(r,r.VERTEX_SHADER,ne),C=ml(r,r.FRAGMENT_SHADER,A);r.attachShader(b,P),r.attachShader(b,C),t.index0AttributeName!==void 0?r.bindAttribLocation(b,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(b,0,"position"),r.linkProgram(b);function W(se){if(n.debug.checkShaderErrors){const _e=r.getProgramInfoLog(b)||"",me=r.getShaderInfoLog(P)||"",w=r.getShaderInfoLog(C)||"",G=_e.trim(),g=me.trim(),z=w.trim();let re=!0,K=!0;if(r.getProgramParameter(b,r.LINK_STATUS)===!1)if(re=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,b,P,C);else{const R=xl(r,P,"vertex"),T=xl(r,C,"fragment");Ct("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(b,r.VALIDATE_STATUS)+`

Material Name: `+se.name+`
Material Type: `+se.type+`

Program Info Log: `+G+`
`+R+`
`+T)}else G!==""?lt("WebGLProgram: Program Info Log:",G):(g===""||z==="")&&(K=!1);K&&(se.diagnostics={runnable:re,programLog:G,vertexShader:{log:g,prefix:_},fragmentShader:{log:z,prefix:m}})}r.deleteShader(P),r.deleteShader(C),S=new ss(r,b),N=q0(r,b)}let S;this.getUniforms=function(){return S===void 0&&W(this),S};let N;this.getAttributes=function(){return N===void 0&&W(this),N};let J=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return J===!1&&(J=r.getProgramParameter(b,F0)),J},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=O0++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=P,this.fragmentShader=C,this}let lm=0;class cm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new um(e),t.set(e,i)),i}}class um{constructor(e){this.id=lm++,this.code=e,this.usedTimes=0}}function fm(n){return n===bi||n===ls||n===cs}function hm(n,e,t,i,r,s){const o=new hc,a=new cm,l=new Set,c=[],u=new Map,h=i.logarithmicDepthBuffer;let f=i.precision;const p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(S){return l.add(S),S===0?"uv":`uv${S}`}function b(S,N,J,se,_e,me){const w=se.fog,G=_e.geometry,g=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?se.environment:null,z=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,re=e.get(S.envMap||g,z),K=re&&re.mapping===ds?re.image.height:null,R=p[S.type];S.precision!==null&&(f=i.getMaxPrecision(S.precision),f!==S.precision&&lt("WebGLProgram.getParameters:",S.precision,"not supported, using",f,"instead."));const T=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,F=T!==void 0?T.length:0;let Q=0;G.morphAttributes.position!==void 0&&(Q=1),G.morphAttributes.normal!==void 0&&(Q=2),G.morphAttributes.color!==void 0&&(Q=3);let k,Y,$,D;if(R){const Te=Rn[R];k=Te.vertexShader,Y=Te.fragmentShader}else{k=S.vertexShader,Y=S.fragmentShader;const Te=a.getVertexShaderStage(S),Ce=a.getFragmentShaderStage(S);a.update(S,Te,Ce),$=Te.id,D=Ce.id}const O=n.getRenderTarget(),j=n.state.buffers.depth.getReversed(),X=_e.isInstancedMesh===!0,V=_e.isBatchedMesh===!0,le=!!S.map,Se=!!S.matcap,H=!!re,ve=!!S.aoMap,we=!!S.lightMap,Le=!!S.bumpMap&&S.wireframe===!1,Me=!!S.normalMap,Ue=!!S.displacementMap,Ye=!!S.emissiveMap,$e=!!S.metalnessMap,rt=!!S.roughnessMap,Z=S.anisotropy>0,pt=S.clearcoat>0,Ae=S.dispersion>0,L=S.retroreflectivity>0,x=S.iridescence>0,ce=S.sheen>0,ge=S.transmission>0,ye=Z&&!!S.anisotropyMap,Re=pt&&!!S.clearcoatMap,Be=pt&&!!S.clearcoatNormalMap,be=pt&&!!S.clearcoatRoughnessMap,Ee=x&&!!S.iridescenceMap,Fe=x&&!!S.iridescenceThicknessMap,nt=ce&&!!S.sheenColorMap,ke=ce&&!!S.sheenRoughnessMap,Ge=!!S.specularMap,d=!!S.specularColorMap,y=!!S.specularIntensityMap,U=ge&&!!S.transmissionMap,E=ge&&!!S.thicknessMap,B=!!S.gradientMap,q=!!S.alphaMap,oe=S.alphaTest>0,he=!!S.alphaHash,ee=!!S.extensions;let de=In;S.toneMapped&&(O===null||O.isXRRenderTarget===!0)&&(de=n.toneMapping);const pe={shaderID:R,shaderType:S.type,shaderName:S.name,vertexShader:k,fragmentShader:Y,defines:S.defines,customVertexShaderID:$,customFragmentShaderID:D,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:f,batching:V,batchingColor:V&&_e._colorsTexture!==null,instancing:X,instancingColor:X&&_e.instanceColor!==null,instancingMorph:X&&_e.morphTexture!==null,outputColorSpace:O===null?n.outputColorSpace:O.isXRRenderTarget===!0?O.texture.colorSpace:Et.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:le,matcap:Se,envMap:H,envMapMode:H&&re.mapping,envMapCubeUVHeight:K,aoMap:ve,lightMap:we,bumpMap:Le,normalMap:Me,displacementMap:Ue,emissiveMap:Ye,normalMapObjectSpace:Me&&S.normalMapType===Su,normalMapTangentSpace:Me&&S.normalMapType===Ho,packedNormalMap:Me&&S.normalMapType===Ho&&fm(S.normalMap.format),metalnessMap:$e,roughnessMap:rt,anisotropy:Z,anisotropyMap:ye,clearcoat:pt,clearcoatMap:Re,clearcoatNormalMap:Be,clearcoatRoughnessMap:be,dispersion:Ae,retroreflection:L,iridescence:x,iridescenceMap:Ee,iridescenceThicknessMap:Fe,sheen:ce,sheenColorMap:nt,sheenRoughnessMap:ke,specularMap:Ge,specularColorMap:d,specularIntensityMap:y,transmission:ge,transmissionMap:U,thicknessMap:E,gradientMap:B,opaque:S.transparent===!1&&S.blending===dr&&S.alphaToCoverage===!1,alphaMap:q,alphaTest:oe,alphaHash:he,combine:S.combine,mapUv:le&&v(S.map.channel),aoMapUv:ve&&v(S.aoMap.channel),lightMapUv:we&&v(S.lightMap.channel),bumpMapUv:Le&&v(S.bumpMap.channel),normalMapUv:Me&&v(S.normalMap.channel),displacementMapUv:Ue&&v(S.displacementMap.channel),emissiveMapUv:Ye&&v(S.emissiveMap.channel),metalnessMapUv:$e&&v(S.metalnessMap.channel),roughnessMapUv:rt&&v(S.roughnessMap.channel),anisotropyMapUv:ye&&v(S.anisotropyMap.channel),clearcoatMapUv:Re&&v(S.clearcoatMap.channel),clearcoatNormalMapUv:Be&&v(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&v(S.clearcoatRoughnessMap.channel),iridescenceMapUv:Ee&&v(S.iridescenceMap.channel),iridescenceThicknessMapUv:Fe&&v(S.iridescenceThicknessMap.channel),sheenColorMapUv:nt&&v(S.sheenColorMap.channel),sheenRoughnessMapUv:ke&&v(S.sheenRoughnessMap.channel),specularMapUv:Ge&&v(S.specularMap.channel),specularColorMapUv:d&&v(S.specularColorMap.channel),specularIntensityMapUv:y&&v(S.specularIntensityMap.channel),transmissionMapUv:U&&v(S.transmissionMap.channel),thicknessMapUv:E&&v(S.thicknessMap.channel),alphaMapUv:q&&v(S.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(Me||Z),vertexNormals:!!G.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:_e.isPoints===!0&&!!G.attributes.uv&&(le||q),fog:!!w,useFog:S.fog===!0,fogExp2:!!w&&w.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||G.attributes.normal===void 0&&Me===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:j,skinning:_e.isSkinnedMesh===!0,hasPositionAttribute:G.attributes.position!==void 0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:F,morphTextureStride:Q,numSunLights:N.sun.length,numDirLights:N.directional.length,numPointLights:N.point.length,numSpotLights:N.spot.length,numSpotLightMaps:N.spotLightMap.length,numRectAreaLights:N.rectArea.length,numHemiLights:N.hemi.length,numSunLightShadows:N.sunShadowMap.length,numDirLightShadows:N.directionalShadowMap.length,numPointLightShadows:N.pointShadowMap.length,numSpotLightShadows:N.spotShadowMap.length,numSpotLightShadowsWithMaps:N.numSpotLightShadowsWithMaps,numLightProbes:N.numLightProbes,numLightProbeGrids:me.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&J.length>0,shadowMapType:n.shadowMap.type,toneMapping:de,decodeVideoTexture:le&&S.map.isVideoTexture===!0&&Et.getTransfer(S.map.colorSpace)===It,decodeVideoTextureEmissive:Ye&&S.emissiveMap.isVideoTexture===!0&&Et.getTransfer(S.emissiveMap.colorSpace)===It,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Cn,flipSided:S.side===sn,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ee&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ee&&S.extensions.multiDraw===!0||V)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return pe.vertexUv1s=l.has(1),pe.vertexUv2s=l.has(2),pe.vertexUv3s=l.has(3),l.clear(),pe}function _(S){const N=[];if(S.shaderID?N.push(S.shaderID):(N.push(S.customVertexShaderID),N.push(S.customFragmentShaderID)),S.defines!==void 0)for(const J in S.defines)N.push(J),N.push(S.defines[J]);return S.isRawShaderMaterial===!1&&(m(N,S),I(N,S),N.push(n.outputColorSpace)),N.push(S.customProgramCacheKey),N.join()}function m(S,N){S.push(N.precision),S.push(N.outputColorSpace),S.push(N.envMapMode),S.push(N.envMapCubeUVHeight),S.push(N.mapUv),S.push(N.alphaMapUv),S.push(N.lightMapUv),S.push(N.aoMapUv),S.push(N.bumpMapUv),S.push(N.normalMapUv),S.push(N.displacementMapUv),S.push(N.emissiveMapUv),S.push(N.metalnessMapUv),S.push(N.roughnessMapUv),S.push(N.anisotropyMapUv),S.push(N.clearcoatMapUv),S.push(N.clearcoatNormalMapUv),S.push(N.clearcoatRoughnessMapUv),S.push(N.iridescenceMapUv),S.push(N.iridescenceThicknessMapUv),S.push(N.sheenColorMapUv),S.push(N.sheenRoughnessMapUv),S.push(N.specularMapUv),S.push(N.specularColorMapUv),S.push(N.specularIntensityMapUv),S.push(N.transmissionMapUv),S.push(N.thicknessMapUv),S.push(N.combine),S.push(N.fogExp2),S.push(N.sizeAttenuation),S.push(N.morphTargetsCount),S.push(N.morphAttributeCount),S.push(N.numSunLights),S.push(N.numDirLights),S.push(N.numPointLights),S.push(N.numSpotLights),S.push(N.numSpotLightMaps),S.push(N.numHemiLights),S.push(N.numRectAreaLights),S.push(N.numSunLightShadows),S.push(N.numDirLightShadows),S.push(N.numPointLightShadows),S.push(N.numSpotLightShadows),S.push(N.numSpotLightShadowsWithMaps),S.push(N.numLightProbes),S.push(N.shadowMapType),S.push(N.toneMapping),S.push(N.numClippingPlanes),S.push(N.numClipIntersection),S.push(N.depthPacking)}function I(S,N){o.disableAll(),N.instancing&&o.enable(0),N.instancingColor&&o.enable(1),N.instancingMorph&&o.enable(2),N.matcap&&o.enable(3),N.envMap&&o.enable(4),N.normalMapObjectSpace&&o.enable(5),N.normalMapTangentSpace&&o.enable(6),N.clearcoat&&o.enable(7),N.iridescence&&o.enable(8),N.alphaTest&&o.enable(9),N.vertexColors&&o.enable(10),N.vertexAlphas&&o.enable(11),N.vertexUv1s&&o.enable(12),N.vertexUv2s&&o.enable(13),N.vertexUv3s&&o.enable(14),N.vertexTangents&&o.enable(15),N.anisotropy&&o.enable(16),N.alphaHash&&o.enable(17),N.batching&&o.enable(18),N.dispersion&&o.enable(19),N.retroreflection&&o.enable(24),N.batchingColor&&o.enable(20),N.gradientMap&&o.enable(21),N.packedNormalMap&&o.enable(22),N.vertexNormals&&o.enable(23),S.push(o.mask),o.disableAll(),N.fog&&o.enable(0),N.useFog&&o.enable(1),N.flatShading&&o.enable(2),N.logarithmicDepthBuffer&&o.enable(3),N.reversedDepthBuffer&&o.enable(4),N.skinning&&o.enable(5),N.morphTargets&&o.enable(6),N.morphNormals&&o.enable(7),N.morphColors&&o.enable(8),N.premultipliedAlpha&&o.enable(9),N.shadowMapEnabled&&o.enable(10),N.doubleSided&&o.enable(11),N.flipSided&&o.enable(12),N.useDepthPacking&&o.enable(13),N.dithering&&o.enable(14),N.transmission&&o.enable(15),N.sheen&&o.enable(16),N.opaque&&o.enable(17),N.pointsUvs&&o.enable(18),N.decodeVideoTexture&&o.enable(19),N.decodeVideoTextureEmissive&&o.enable(20),N.alphaToCoverage&&o.enable(21),N.numLightProbeGrids>0&&o.enable(22),N.hasPositionAttribute&&o.enable(23),S.push(o.mask)}function ne(S){const N=p[S.type];let J;if(N){const se=Rn[N];J=Tf.clone(se.uniforms)}else J=S.uniforms;return J}function A(S,N){let J=u.get(N);return J!==void 0?++J.usedTimes:(J=new am(n,N,S,r),c.push(J),u.set(N,J)),J}function P(S){if(--S.usedTimes===0){const N=c.indexOf(S);c[N]=c[c.length-1],c.pop(),u.delete(S.cacheKey),S.destroy()}}function C(S){a.remove(S)}function W(){a.dispose()}return{getParameters:b,getProgramCacheKey:_,getUniforms:ne,acquireProgram:A,releaseProgram:P,releaseShaderCache:C,programs:c,dispose:W}}function dm(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,l){n.get(o)[a]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function pm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Sl(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function bl(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(f){let p=0;return f.isInstancedMesh&&(p+=2),f.isSkinnedMesh&&(p+=1),p}function a(f,p,v,b,_,m){let I=n[e];return I===void 0?(I={id:f.id,object:f,geometry:p,material:v,materialVariant:o(f),groupOrder:b,renderOrder:f.renderOrder,z:_,group:m},n[e]=I):(I.id=f.id,I.object=f,I.geometry=p,I.material=v,I.materialVariant=o(f),I.groupOrder=b,I.renderOrder=f.renderOrder,I.z=_,I.group=m),e++,I}function l(f,p,v,b,_,m,I){I.reversedDepth===!0&&(_=-_);const ne=a(f,p,v,b,_,m);v.transmission>0?i.push(ne):v.transparent===!0?r.push(ne):t.push(ne)}function c(f,p,v,b,_,m){const I=a(f,p,v,b,_,m);v.transmission>0?i.unshift(I):v.transparent===!0?r.unshift(I):t.unshift(I)}function u(f,p){t.length>1&&t.sort(f||pm),i.length>1&&i.sort(p||Sl),r.length>1&&r.sort(p||Sl)}function h(){for(let f=e,p=n.length;f<p;f++){const v=n[f];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:h,sort:u}}function mm(){let n=new WeakMap;function e(i,r){const s=n.get(i);let o;return s===void 0?(o=new bl,n.set(i,[o])):r>=s.length?(o=new bl,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function gm(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new fe,color:new dt};break;case"SpotLight":t={position:new fe,direction:new fe,color:new dt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new fe,color:new dt,distance:0,decay:0};break;case"HemisphereLight":t={direction:new fe,skyColor:new dt,groundColor:new dt};break;case"RectAreaLight":t={color:new dt,position:new fe,halfWidth:new fe,halfHeight:new fe};break}return n[e.id]=t,t}}}function xm(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new wt};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new wt};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new wt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let _m=0;function vm(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Mm(n){const e=new gm,t=xm(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new fe);const r=new fe,s=new yt,o=new yt;function a(c){let u=0,h=0,f=0;for(let _e=0;_e<9;_e++)i.probe[_e].set(0,0,0);let p=0,v=0,b=0,_=0,m=0,I=0,ne=0,A=0,P=0,C=0,W=0,S=0,N=0,J=0;c.sort(vm);for(let _e=0,me=c.length;_e<me;_e++){const w=c[_e],G=w.color,g=w.intensity,z=w.distance;let re=null;if(w.shadow&&w.shadow.map&&(w.shadow.map.texture.format===bi?re=w.shadow.map.texture:re=w.shadow.map.depthTexture||w.shadow.map.texture),w.isAmbientLight)u+=G.r*g,h+=G.g*g,f+=G.b*g;else if(w.isLightProbe){for(let K=0;K<9;K++)i.probe[K].addScaledVector(w.sh.coefficients[K],g);J++}else if(w.isSunLight){const K=e.get(w);if(K.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){const R=w.shadow,T=t.get(w);T.shadowIntensity=R.intensity,T.shadowBias=R.bias,T.shadowNormalBias=R.normalBias,T.shadowRadius=R.radius,T.shadowMapSize.copy(R.mapSize).multiply(R.getFrameExtents()),i.sunShadow[v]=T,i.sunShadowMap[v]=re;const F=R.getViewportCount();for(let Q=0;Q<F;Q++)i.sunShadowMatrix[b+Q]=R.getMatrix(Q),i.sunShadowCascade[b+Q]=R._cascadeData[Q];b+=F,v++}i.sun[p]=K,p++}else if(w.isDirectionalLight){const K=e.get(w);if(K.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){const R=w.shadow,T=t.get(w);T.shadowIntensity=R.intensity,T.shadowBias=R.bias,T.shadowNormalBias=R.normalBias,T.shadowRadius=R.radius,T.shadowMapSize=R.mapSize,i.directionalShadow[_]=T,i.directionalShadowMap[_]=re,i.directionalShadowMatrix[_]=w.shadow.matrix,P++}i.directional[_]=K,_++}else if(w.isSpotLight){const K=e.get(w);K.position.setFromMatrixPosition(w.matrixWorld),K.color.copy(G).multiplyScalar(g),K.distance=z,K.coneCos=Math.cos(w.angle),K.penumbraCos=Math.cos(w.angle*(1-w.penumbra)),K.decay=w.decay,i.spot[I]=K;const R=w.shadow;if(w.map&&(i.spotLightMap[S]=w.map,S++,R.updateMatrices(w),w.castShadow&&N++),i.spotLightMatrix[I]=R.matrix,w.castShadow){const T=t.get(w);T.shadowIntensity=R.intensity,T.shadowBias=R.bias,T.shadowNormalBias=R.normalBias,T.shadowRadius=R.radius,T.shadowMapSize=R.mapSize,i.spotShadow[I]=T,i.spotShadowMap[I]=re,W++}I++}else if(w.isRectAreaLight){const K=e.get(w);K.color.copy(G).multiplyScalar(g),K.halfWidth.set(w.width*.5,0,0),K.halfHeight.set(0,w.height*.5,0),i.rectArea[ne]=K,ne++}else if(w.isPointLight){const K=e.get(w);if(K.color.copy(w.color).multiplyScalar(w.intensity),K.distance=w.distance,K.decay=w.decay,w.castShadow){const R=w.shadow,T=t.get(w);T.shadowIntensity=R.intensity,T.shadowBias=R.bias,T.shadowNormalBias=R.normalBias,T.shadowRadius=R.radius,T.shadowMapSize=R.mapSize,T.shadowCameraNear=R.camera.near,T.shadowCameraFar=R.camera.far,i.pointShadow[m]=T,i.pointShadowMap[m]=re,i.pointShadowMatrix[m]=w.shadow.matrix,C++}i.point[m]=K,m++}else if(w.isHemisphereLight){const K=e.get(w);K.skyColor.copy(w.color).multiplyScalar(g),K.groundColor.copy(w.groundColor).multiplyScalar(g),i.hemi[A]=K,A++}}ne>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=He.LTC_FLOAT_1,i.rectAreaLTC2=He.LTC_FLOAT_2):(i.rectAreaLTC1=He.LTC_HALF_1,i.rectAreaLTC2=He.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=f;const se=i.hash;(se.sunLength!==p||se.directionalLength!==_||se.pointLength!==m||se.spotLength!==I||se.rectAreaLength!==ne||se.hemiLength!==A||se.numSunShadows!==v||se.numDirectionalShadows!==P||se.numPointShadows!==C||se.numSpotShadows!==W||se.numSpotMaps!==S||se.numLightProbes!==J)&&(i.sun.length=p,i.directional.length=_,i.spot.length=I,i.rectArea.length=ne,i.point.length=m,i.hemi.length=A,i.sunShadow.length=v,i.sunShadowMap.length=v,i.sunShadowMatrix.length=b,i.sunShadowCascade.length=b,i.directionalShadow.length=P,i.directionalShadowMap.length=P,i.directionalShadowMatrix.length=P,i.pointShadow.length=C,i.pointShadowMap.length=C,i.pointShadowMatrix.length=C,i.spotShadow.length=W,i.spotShadowMap.length=W,i.spotLightMatrix.length=W+S-N,i.spotLightMap.length=S,i.numSpotLightShadowsWithMaps=N,i.numLightProbes=J,se.sunLength=p,se.directionalLength=_,se.pointLength=m,se.spotLength=I,se.rectAreaLength=ne,se.hemiLength=A,se.numSunShadows=v,se.numDirectionalShadows=P,se.numPointShadows=C,se.numSpotShadows=W,se.numSpotMaps=S,se.numLightProbes=J,i.version=_m++)}function l(c,u){let h=0,f=0,p=0,v=0,b=0,_=0;const m=u.matrixWorldInverse;for(let I=0,ne=c.length;I<ne;I++){const A=c[I];if(A.isSunLight){const P=i.sun[h];P.direction.setFromMatrixPosition(A.matrixWorld),P.direction.transformDirection(m),h++}else if(A.isDirectionalLight){const P=i.directional[f];P.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),P.direction.sub(r),P.direction.transformDirection(m),f++}else if(A.isSpotLight){const P=i.spot[v];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(m),P.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),P.direction.sub(r),P.direction.transformDirection(m),v++}else if(A.isRectAreaLight){const P=i.rectArea[b];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(m),o.identity(),s.copy(A.matrixWorld),s.premultiply(m),o.extractRotation(s),P.halfWidth.set(A.width*.5,0,0),P.halfHeight.set(0,A.height*.5,0),P.halfWidth.applyMatrix4(o),P.halfHeight.applyMatrix4(o),b++}else if(A.isPointLight){const P=i.point[p];P.position.setFromMatrixPosition(A.matrixWorld),P.position.applyMatrix4(m),p++}else if(A.isHemisphereLight){const P=i.hemi[_];P.direction.setFromMatrixPosition(A.matrixWorld),P.direction.transformDirection(m),_++}}}return{setup:a,setupView:l,state:i}}function El(n){const e=new Mm(n),t=[],i=[],r=[];function s(f){h.camera=f,t.length=0,i.length=0,r.length=0}function o(f){t.push(f)}function a(f){i.push(f)}function l(f){r.push(f)}function c(){e.setup(t)}function u(f){e.setupView(t,f)}const h={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:h,setupLights:c,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function ym(n){let e=new WeakMap;function t(r,s=0){const o=e.get(r);let a;return o===void 0?(a=new El(n),e.set(r,[a])):s>=o.length?(a=new El(n),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:t,dispose:i}}const Sm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Em=[new fe(1,0,0),new fe(-1,0,0),new fe(0,1,0),new fe(0,-1,0),new fe(0,0,1),new fe(0,0,-1)],wm=[new fe(0,-1,0),new fe(0,-1,0),new fe(0,0,1),new fe(0,0,-1),new fe(0,-1,0),new fe(0,-1,0)],wl=new yt,lr=new fe,Js=new fe;function Tm(n,e,t){let i=new ps;const r=new wt,s=new wt,o=new Ut,a=new Lf,l=new If,c={},u=t.maxTextureSize,h={[ai]:sn,[sn]:ai,[Cn]:Cn},f=new Fn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new wt},radius:{value:4}},vertexShader:Sm,fragmentShader:bm}),p=f.clone();p.defines.HORIZONTAL_PASS=1;const v=new _n;v.setAttribute("position",new fn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const b=new on(v,f),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=es;let m=this.type;this.render=function(C,W,S){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||C.length===0)return;this.type===Yl&&(lt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=es);const N=n.getRenderTarget(),J=n.getActiveCubeFace(),se=n.getActiveMipmapLevel(),_e=n.state;_e.setBlending(Xn),_e.buffers.depth.getReversed()===!0?_e.buffers.color.setClear(0,0,0,0):_e.buffers.color.setClear(1,1,1,1),_e.buffers.depth.setTest(!0),_e.setScissorTest(!1);const me=m!==this.type;me&&W.traverse(function(w){w.material&&(Array.isArray(w.material)?w.material.forEach(G=>G.needsUpdate=!0):w.material.needsUpdate=!0)});for(let w=0,G=C.length;w<G;w++){const g=C[w],z=g.shadow;if(z===void 0){lt("WebGLShadowMap:",g,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;r.copy(z.mapSize);const re=z.getFrameExtents();r.multiply(re),s.copy(z.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/re.x),r.x=s.x*re.x,z.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/re.y),r.y=s.y*re.y,z.mapSize.y=s.y));const K=n.state.buffers.depth.getReversed();if(z.camera._reversedDepth=K,z.map===null||me===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===ur){if(g.isPointLight){lt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new bn(r.x,r.y,{format:bi,type:Un,minFilter:Yt,magFilter:Yt,generateMipmaps:!1}),z.map.texture.name=g.name+".shadowMap",z.map.depthTexture=new Sr(r.x,r.y,gn),z.map.depthTexture.name=g.name+".shadowMapDepth",z.map.depthTexture.format=$n,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Ht,z.map.depthTexture.magFilter=Ht}else g.isPointLight?(z.map=new Tc(r.x),z.map.depthTexture=new Ef(r.x,Dn)):(z.map=new bn(r.x,r.y),z.map.depthTexture=new Sr(r.x,r.y,Dn)),z.map.depthTexture.name=g.name+".shadowMap",z.map.depthTexture.format=$n,this.type===es?(z.map.depthTexture.compareFunction=K?sa:ra,z.map.depthTexture.minFilter=Yt,z.map.depthTexture.magFilter=Yt):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Ht,z.map.depthTexture.magFilter=Ht);z.camera.updateProjectionMatrix()}z.map.isWebGLCubeRenderTarget!==!0&&(z.map.width!==r.x||z.map.height!==r.y)&&z.map.setSize(r.x,r.y);const R=z.map.isWebGLCubeRenderTarget?6:z.getViewportCount();g.isPointLight!==!0&&z.updateMatrices(g,S);for(let T=0;T<R;T++){const F=z.getCamera(T);if(g.isPointLight){const Q=z.camera,k=z.matrix,Y=g.distance||Q.far;Y!==Q.far&&(Q.far=Y,Q.updateProjectionMatrix()),lr.setFromMatrixPosition(g.matrixWorld),Q.position.copy(lr),Js.copy(Q.position),Js.add(Em[T]),Q.up.copy(wm[T]),Q.lookAt(Js),Q.updateMatrixWorld(),k.makeTranslation(-lr.x,-lr.y,-lr.z),wl.multiplyMatrices(Q.projectionMatrix,Q.matrixWorldInverse),z._frustum.setFromProjectionMatrix(wl,Q.coordinateSystem,Q.reversedDepth)}if(z.map.isWebGLCubeRenderTarget)n.setRenderTarget(z.map,T),n.clear();else{T===0&&(n.setRenderTarget(z.map),n.clear());const Q=z.getViewport(T);o.set(s.x*Q.x,s.y*Q.y,s.x*Q.z,s.y*Q.w),_e.viewport(o)}i=z.getFrustum(T),A(W,S,F,g,this.type)}z.isPointLightShadow!==!0&&this.type===ur&&I(z,S),z.needsUpdate=!1}m=this.type,_.needsUpdate=!1,n.setRenderTarget(N,J,se)};function I(C,W){const S=e.update(b);f.defines.VSM_SAMPLES!==C.blurSamples&&(f.defines.VSM_SAMPLES=C.blurSamples,p.defines.VSM_SAMPLES=C.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),C.mapPass===null?C.mapPass=new bn(r.x,r.y,{format:bi,type:Un}):(C.mapPass.width!==C.map.width||C.mapPass.height!==C.map.height)&&C.mapPass.setSize(C.map.width,C.map.height),f.uniforms.shadow_pass.value=C.map.depthTexture,f.uniforms.resolution.value.set(C.map.width,C.map.height),f.uniforms.radius.value=C.radius,n.setRenderTarget(C.mapPass),n.clear(),n.renderBufferDirect(W,null,S,f,b,null),p.uniforms.shadow_pass.value=C.mapPass.texture,p.uniforms.resolution.value.set(C.map.width,C.map.height),p.uniforms.radius.value=C.radius,n.setRenderTarget(C.map),n.clear(),n.renderBufferDirect(W,null,S,p,b,null)}function ne(C,W,S,N){let J=null;const se=S.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(se!==void 0)J=se;else if(J=S.isPointLight===!0?l:a,n.localClippingEnabled&&W.clipShadows===!0&&Array.isArray(W.clippingPlanes)&&W.clippingPlanes.length!==0||W.displacementMap&&W.displacementScale!==0||W.alphaMap&&W.alphaTest>0||W.map&&W.alphaTest>0||W.alphaToCoverage===!0){const _e=J.uuid,me=W.uuid;let w=c[_e];w===void 0&&(w={},c[_e]=w);let G=w[me];G===void 0&&(G=J.clone(),w[me]=G,W.addEventListener("dispose",P)),J=G}if(J.visible=W.visible,J.wireframe=W.wireframe,N===ur?J.side=W.shadowSide!==null?W.shadowSide:W.side:J.side=W.shadowSide!==null?W.shadowSide:h[W.side],J.alphaMap=W.alphaMap,J.alphaTest=W.alphaToCoverage===!0?.5:W.alphaTest,J.map=W.map,J.clipShadows=W.clipShadows,J.clippingPlanes=W.clippingPlanes,J.clipIntersection=W.clipIntersection,J.displacementMap=W.displacementMap,J.displacementScale=W.displacementScale,J.displacementBias=W.displacementBias,J.wireframeLinewidth=W.wireframeLinewidth,J.linewidth=W.linewidth,S.isPointLight===!0&&J.isMeshDistanceMaterial===!0){const _e=n.properties.get(J);_e.light=S}return J}function A(C,W,S,N,J){if(C.visible===!1)return;if(C.layers.test(W.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&J===ur)&&(!C.frustumCulled||C.intersectsFrustum(i))){C.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,C.matrixWorld);const me=e.update(C),w=C.material;if(Array.isArray(w)){const G=me.groups;for(let g=0,z=G.length;g<z;g++){const re=G[g],K=w[re.materialIndex];if(K&&K.visible){const R=ne(C,K,N,J);C.onBeforeShadow(n,C,W,S,me,R,re),n.renderBufferDirect(S,null,me,R,C,re),C.onAfterShadow(n,C,W,S,me,R,re)}}}else if(w.visible){const G=ne(C,w,N,J);C.onBeforeShadow(n,C,W,S,me,G,null),n.renderBufferDirect(S,null,me,G,C,null),C.onAfterShadow(n,C,W,S,me,G,null)}}const _e=C.children;for(let me=0,w=_e.length;me<w;me++)A(_e[me],W,S,N,J)}function P(C){C.target.removeEventListener("dispose",P);for(const S in c){const N=c[S],J=C.target.uuid;J in N&&(N[J].dispose(),delete N[J])}}}function Am(n,e){function t(){let E=!1;const B=new Ut;let q=null;const oe=new Ut(0,0,0,0);return{setMask:function(he){q!==he&&!E&&(n.colorMask(he,he,he,he),q=he)},setLocked:function(he){E=he},setClear:function(he,ee,de,pe,Te){Te===!0&&(he*=pe,ee*=pe,de*=pe),B.set(he,ee,de,pe),oe.equals(B)===!1&&(n.clearColor(he,ee,de,pe),oe.copy(B))},reset:function(){E=!1,q=null,oe.set(-1,0,0,0)}}}function i(){let E=!1,B=!1,q=null,oe=null,he=null;return{setReversed:function(ee){if(B!==ee){const de=e.get("EXT_clip_control");ee?de.clipControlEXT(de.LOWER_LEFT_EXT,de.ZERO_TO_ONE_EXT):de.clipControlEXT(de.LOWER_LEFT_EXT,de.NEGATIVE_ONE_TO_ONE_EXT),B=ee;const pe=he;he=null,this.setClear(pe)}},getReversed:function(){return B},setTest:function(ee){ee?O(n.DEPTH_TEST):j(n.DEPTH_TEST)},setMask:function(ee){q!==ee&&!E&&(n.depthMask(ee),q=ee)},setFunc:function(ee){if(B&&(ee=Uu[ee]),oe!==ee){switch(ee){case ro:n.depthFunc(n.NEVER);break;case so:n.depthFunc(n.ALWAYS);break;case oo:n.depthFunc(n.LESS);break;case gr:n.depthFunc(n.LEQUAL);break;case ao:n.depthFunc(n.EQUAL);break;case lo:n.depthFunc(n.GEQUAL);break;case co:n.depthFunc(n.GREATER);break;case uo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}oe=ee}},setLocked:function(ee){E=ee},setClear:function(ee){he!==ee&&(he=ee,B&&(ee=1-ee),n.clearDepth(ee))},reset:function(){E=!1,q=null,oe=null,he=null,B=!1}}}function r(){let E=!1,B=null,q=null,oe=null,he=null,ee=null,de=null,pe=null,Te=null;return{setTest:function(Ce){E||(Ce?O(n.STENCIL_TEST):j(n.STENCIL_TEST))},setMask:function(Ce){B!==Ce&&!E&&(n.stencilMask(Ce),B=Ce)},setFunc:function(Ce,it,Ke){(q!==Ce||oe!==it||he!==Ke)&&(n.stencilFunc(Ce,it,Ke),q=Ce,oe=it,he=Ke)},setOp:function(Ce,it,Ke){(ee!==Ce||de!==it||pe!==Ke)&&(n.stencilOp(Ce,it,Ke),ee=Ce,de=it,pe=Ke)},setLocked:function(Ce){E=Ce},setClear:function(Ce){Te!==Ce&&(n.clearStencil(Ce),Te=Ce)},reset:function(){E=!1,B=null,q=null,oe=null,he=null,ee=null,de=null,pe=null,Te=null}}}const s=new t,o=new i,a=new r,l=new WeakMap,c=new WeakMap;let u={},h={},f={},p=new WeakMap,v=[],b=null,_=!1,m=null,I=null,ne=null,A=null,P=null,C=null,W=null,S=new dt(0,0,0),N=0,J=!1,se=null,_e=null,me=null,w=null,G=null;const g=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,re=0;const K=n.getParameter(n.VERSION);K.indexOf("WebGL")!==-1?(re=parseFloat(/^WebGL (\d)/.exec(K)[1]),z=re>=1):K.indexOf("OpenGL ES")!==-1&&(re=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),z=re>=2);let R=null,T={};const F=n.getParameter(n.SCISSOR_BOX),Q=n.getParameter(n.VIEWPORT),k=new Ut().fromArray(F),Y=new Ut().fromArray(Q);function $(E,B,q,oe){const he=new Uint8Array(4),ee=n.createTexture();n.bindTexture(E,ee),n.texParameteri(E,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(E,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let de=0;de<q;de++)E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY?n.texImage3D(B,0,n.RGBA,1,1,oe,0,n.RGBA,n.UNSIGNED_BYTE,he):n.texImage2D(B+de,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,he);return ee}const D={};D[n.TEXTURE_2D]=$(n.TEXTURE_2D,n.TEXTURE_2D,1),D[n.TEXTURE_CUBE_MAP]=$(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),D[n.TEXTURE_2D_ARRAY]=$(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),D[n.TEXTURE_3D]=$(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),O(n.DEPTH_TEST),o.setFunc(gr),Le(!1),Me(va),O(n.CULL_FACE),ve(Xn);function O(E){u[E]!==!0&&(n.enable(E),u[E]=!0)}function j(E){u[E]!==!1&&(n.disable(E),u[E]=!1)}function X(E,B){return f[E]!==B?(n.bindFramebuffer(E,B),f[E]=B,E===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=B),E===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=B),!0):!1}function V(E,B){let q=v,oe=!1;if(E){q=p.get(B),q===void 0&&(q=[],p.set(B,q));const he=E.textures;if(q.length!==he.length||q[0]!==n.COLOR_ATTACHMENT0){for(let ee=0,de=he.length;ee<de;ee++)q[ee]=n.COLOR_ATTACHMENT0+ee;q.length=he.length,oe=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,oe=!0);oe&&n.drawBuffers(q)}function le(E){return b!==E?(n.useProgram(E),b=E,!0):!1}const Se={[Wi]:n.FUNC_ADD,[eu]:n.FUNC_SUBTRACT,[tu]:n.FUNC_REVERSE_SUBTRACT};Se[nu]=n.MIN,Se[iu]=n.MAX;const H={[ru]:n.ZERO,[su]:n.ONE,[ou]:n.SRC_COLOR,[$l]:n.SRC_ALPHA,[hu]:n.SRC_ALPHA_SATURATE,[uu]:n.DST_COLOR,[lu]:n.DST_ALPHA,[au]:n.ONE_MINUS_SRC_COLOR,[Kl]:n.ONE_MINUS_SRC_ALPHA,[fu]:n.ONE_MINUS_DST_COLOR,[cu]:n.ONE_MINUS_DST_ALPHA,[du]:n.CONSTANT_COLOR,[pu]:n.ONE_MINUS_CONSTANT_COLOR,[mu]:n.CONSTANT_ALPHA,[gu]:n.ONE_MINUS_CONSTANT_ALPHA};function ve(E,B,q,oe,he,ee,de,pe,Te,Ce){if(E===Xn){_===!0&&(j(n.BLEND),_=!1);return}if(_===!1&&(O(n.BLEND),_=!0),E!==jc){if(E!==m||Ce!==J){if((I!==Wi||P!==Wi)&&(n.blendEquation(n.FUNC_ADD),I=Wi,P=Wi),Ce)switch(E){case dr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ma:n.blendFunc(n.ONE,n.ONE);break;case ya:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Sa:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Ct("WebGLState: Invalid blending: ",E);break}else switch(E){case dr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ma:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case ya:Ct("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Sa:Ct("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ct("WebGLState: Invalid blending: ",E);break}ne=null,A=null,C=null,W=null,S.set(0,0,0),N=0,m=E,J=Ce}return}he=he||B,ee=ee||q,de=de||oe,(B!==I||he!==P)&&(n.blendEquationSeparate(Se[B],Se[he]),I=B,P=he),(q!==ne||oe!==A||ee!==C||de!==W)&&(n.blendFuncSeparate(H[q],H[oe],H[ee],H[de]),ne=q,A=oe,C=ee,W=de),(pe.equals(S)===!1||Te!==N)&&(n.blendColor(pe.r,pe.g,pe.b,Te),S.copy(pe),N=Te),m=E,J=!1}function we(E,B){E.side===Cn?j(n.CULL_FACE):O(n.CULL_FACE);let q=E.side===sn;B&&(q=!q),Le(q),E.blending===dr&&E.transparent===!1?ve(Xn):ve(E.blending,E.blendEquation,E.blendSrc,E.blendDst,E.blendEquationAlpha,E.blendSrcAlpha,E.blendDstAlpha,E.blendColor,E.blendAlpha,E.premultipliedAlpha),o.setFunc(E.depthFunc),o.setTest(E.depthTest),o.setMask(E.depthWrite),s.setMask(E.colorWrite);const oe=E.stencilWrite;a.setTest(oe),oe&&(a.setMask(E.stencilWriteMask),a.setFunc(E.stencilFunc,E.stencilRef,E.stencilFuncMask),a.setOp(E.stencilFail,E.stencilZFail,E.stencilZPass)),Ye(E.polygonOffset,E.polygonOffsetFactor,E.polygonOffsetUnits),E.alphaToCoverage===!0?O(n.SAMPLE_ALPHA_TO_COVERAGE):j(n.SAMPLE_ALPHA_TO_COVERAGE)}function Le(E){se!==E&&(E?n.frontFace(n.CW):n.frontFace(n.CCW),se=E)}function Me(E){E!==Jc?(O(n.CULL_FACE),E!==_e&&(E===va?n.cullFace(n.BACK):E===Qc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):j(n.CULL_FACE),_e=E}function Ue(E){E!==me&&(z&&n.lineWidth(E),me=E)}function Ye(E,B,q){E?(O(n.POLYGON_OFFSET_FILL),(w!==B||G!==q)&&(w=B,G=q,o.getReversed()&&(B=-B),n.polygonOffset(B,q))):j(n.POLYGON_OFFSET_FILL)}function $e(E){E?O(n.SCISSOR_TEST):j(n.SCISSOR_TEST)}function rt(E){E===void 0&&(E=n.TEXTURE0+g-1),R!==E&&(n.activeTexture(E),R=E)}function Z(E,B,q){q===void 0&&(R===null?q=n.TEXTURE0+g-1:q=R);let oe=T[q];oe===void 0&&(oe={type:void 0,texture:void 0},T[q]=oe),(oe.type!==E||oe.texture!==B)&&(R!==q&&(n.activeTexture(q),R=q),n.bindTexture(E,B||D[E]),oe.type=E,oe.texture=B)}function pt(){const E=T[R];E!==void 0&&E.type!==void 0&&(n.bindTexture(E.type,null),E.type=void 0,E.texture=void 0)}function Ae(){try{n.compressedTexImage2D(...arguments)}catch(E){Ct("WebGLState:",E)}}function L(){try{n.compressedTexImage3D(...arguments)}catch(E){Ct("WebGLState:",E)}}function x(){try{n.texSubImage2D(...arguments)}catch(E){Ct("WebGLState:",E)}}function ce(){try{n.texSubImage3D(...arguments)}catch(E){Ct("WebGLState:",E)}}function ge(){try{n.compressedTexSubImage2D(...arguments)}catch(E){Ct("WebGLState:",E)}}function ye(){try{n.compressedTexSubImage3D(...arguments)}catch(E){Ct("WebGLState:",E)}}function Re(){try{n.texStorage2D(...arguments)}catch(E){Ct("WebGLState:",E)}}function Be(){try{n.texStorage3D(...arguments)}catch(E){Ct("WebGLState:",E)}}function be(){try{n.texImage2D(...arguments)}catch(E){Ct("WebGLState:",E)}}function Ee(){try{n.texImage3D(...arguments)}catch(E){Ct("WebGLState:",E)}}function Fe(E){return h[E]!==void 0?h[E]:n.getParameter(E)}function nt(E,B){h[E]!==B&&(n.pixelStorei(E,B),h[E]=B)}function ke(E){k.equals(E)===!1&&(n.scissor(E.x,E.y,E.z,E.w),k.copy(E))}function Ge(E){Y.equals(E)===!1&&(n.viewport(E.x,E.y,E.z,E.w),Y.copy(E))}function d(E,B){let q=c.get(B);q===void 0&&(q=new WeakMap,c.set(B,q));let oe=q.get(E);oe===void 0&&(oe=n.getUniformBlockIndex(B,E.name),q.set(E,oe))}function y(E,B){const oe=c.get(B).get(E);l.get(B)!==oe&&(n.uniformBlockBinding(B,oe,E.__bindingPointIndex),l.set(B,oe))}function U(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},h={},R=null,T={},f={},p=new WeakMap,v=[],b=null,_=!1,m=null,I=null,ne=null,A=null,P=null,C=null,W=null,S=new dt(0,0,0),N=0,J=!1,se=null,_e=null,me=null,w=null,G=null,k.set(0,0,n.canvas.width,n.canvas.height),Y.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:O,disable:j,bindFramebuffer:X,drawBuffers:V,useProgram:le,setBlending:ve,setMaterial:we,setFlipSided:Le,setCullFace:Me,setLineWidth:Ue,setPolygonOffset:Ye,setScissorTest:$e,activeTexture:rt,bindTexture:Z,unbindTexture:pt,compressedTexImage2D:Ae,compressedTexImage3D:L,texImage2D:be,texImage3D:Ee,pixelStorei:nt,getParameter:Fe,updateUBOMapping:d,uniformBlockBinding:y,texStorage2D:Re,texStorage3D:Be,texSubImage2D:x,texSubImage3D:ce,compressedTexSubImage2D:ge,compressedTexSubImage3D:ye,scissor:ke,viewport:Ge,reset:U}}function Rm(n,e,t,i,r,s,o){const a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new wt,u=new WeakMap,h=new Set;let f;const p=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(L,x){return v?new OffscreenCanvas(L,x):Mr("canvas")}function _(L,x,ce){let ge=1;const ye=Ae(L);if((ye.width>ce||ye.height>ce)&&(ge=ce/Math.max(ye.width,ye.height)),ge<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const Re=Math.floor(ge*ye.width),Be=Math.floor(ge*ye.height);f===void 0&&(f=b(Re,Be));const be=x?b(Re,Be):f;return be.width=Re,be.height=Be,be.getContext("2d").drawImage(L,0,0,Re,Be),lt("WebGLRenderer: Texture has been resized from ("+ye.width+"x"+ye.height+") to ("+Re+"x"+Be+")."),be}else return"data"in L&&lt("WebGLRenderer: Image in DataTexture is too big ("+ye.width+"x"+ye.height+")."),L;return L}function m(L){return L.generateMipmaps}function I(L){n.generateMipmap(L)}function ne(L){return L.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?n.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function A(L,x,ce,ge,ye,Re=!1){if(L!==null){if(n[L]!==void 0)return n[L];lt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let Be;ge&&(Be=e.get("EXT_texture_norm16"),Be||lt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let be=x;if(x===n.RED&&(ce===n.FLOAT&&(be=n.R32F),ce===n.HALF_FLOAT&&(be=n.R16F),ce===n.UNSIGNED_BYTE&&(be=n.R8),ce===n.UNSIGNED_SHORT&&Be&&(be=Be.R16_EXT),ce===n.SHORT&&Be&&(be=Be.R16_SNORM_EXT)),x===n.RED_INTEGER&&(ce===n.UNSIGNED_BYTE&&(be=n.R8UI),ce===n.UNSIGNED_SHORT&&(be=n.R16UI),ce===n.UNSIGNED_INT&&(be=n.R32UI),ce===n.BYTE&&(be=n.R8I),ce===n.SHORT&&(be=n.R16I),ce===n.INT&&(be=n.R32I)),x===n.RG&&(ce===n.FLOAT&&(be=n.RG32F),ce===n.HALF_FLOAT&&(be=n.RG16F),ce===n.UNSIGNED_BYTE&&(be=n.RG8),ce===n.UNSIGNED_SHORT&&Be&&(be=Be.RG16_EXT),ce===n.SHORT&&Be&&(be=Be.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(ce===n.UNSIGNED_BYTE&&(be=n.RG8UI),ce===n.UNSIGNED_SHORT&&(be=n.RG16UI),ce===n.UNSIGNED_INT&&(be=n.RG32UI),ce===n.BYTE&&(be=n.RG8I),ce===n.SHORT&&(be=n.RG16I),ce===n.INT&&(be=n.RG32I)),x===n.RGB_INTEGER&&(ce===n.UNSIGNED_BYTE&&(be=n.RGB8UI),ce===n.UNSIGNED_SHORT&&(be=n.RGB16UI),ce===n.UNSIGNED_INT&&(be=n.RGB32UI),ce===n.BYTE&&(be=n.RGB8I),ce===n.SHORT&&(be=n.RGB16I),ce===n.INT&&(be=n.RGB32I)),x===n.RGBA_INTEGER&&(ce===n.UNSIGNED_BYTE&&(be=n.RGBA8UI),ce===n.UNSIGNED_SHORT&&(be=n.RGBA16UI),ce===n.UNSIGNED_INT&&(be=n.RGBA32UI),ce===n.BYTE&&(be=n.RGBA8I),ce===n.SHORT&&(be=n.RGBA16I),ce===n.INT&&(be=n.RGBA32I)),x===n.RGB&&(ce===n.UNSIGNED_SHORT&&Be&&(be=Be.RGB16_EXT),ce===n.SHORT&&Be&&(be=Be.RGB16_SNORM_EXT),ce===n.UNSIGNED_INT_5_9_9_9_REV&&(be=n.RGB9_E5),ce===n.UNSIGNED_INT_10F_11F_11F_REV&&(be=n.R11F_G11F_B10F)),x===n.RGBA){const Ee=Re?fs:Et.getTransfer(ye);ce===n.FLOAT&&(be=n.RGBA32F),ce===n.HALF_FLOAT&&(be=n.RGBA16F),ce===n.UNSIGNED_BYTE&&(be=Ee===It?n.SRGB8_ALPHA8:n.RGBA8),ce===n.UNSIGNED_SHORT&&Be&&(be=Be.RGBA16_EXT),ce===n.SHORT&&Be&&(be=Be.RGBA16_SNORM_EXT),ce===n.UNSIGNED_SHORT_4_4_4_4&&(be=n.RGBA4),ce===n.UNSIGNED_SHORT_5_5_5_1&&(be=n.RGB5_A1)}return(be===n.R16F||be===n.R32F||be===n.RG16F||be===n.RG32F||be===n.RGBA16F||be===n.RGBA32F)&&e.get("EXT_color_buffer_float"),be}function P(L,x){let ce;return L?x===null||x===Dn||x===_r?ce=n.DEPTH24_STENCIL8:x===gn?ce=n.DEPTH32F_STENCIL8:x===xr&&(ce=n.DEPTH24_STENCIL8,lt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Dn||x===_r?ce=n.DEPTH_COMPONENT24:x===gn?ce=n.DEPTH_COMPONENT32F:x===xr&&(ce=n.DEPTH_COMPONENT16),ce}function C(L,x){return m(L)===!0||L.isFramebufferTexture&&L.minFilter!==Ht&&L.minFilter!==Yt?Math.log2(Math.max(x.width,x.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?x.mipmaps.length:1}function W(L){const x=L.target;x.removeEventListener("dispose",W),N(x),x.isVideoTexture&&u.delete(x),x.isHTMLTexture&&h.delete(x)}function S(L){const x=L.target;x.removeEventListener("dispose",S),se(x)}function N(L){const x=i.get(L);if(x.__webglInit===void 0)return;const ce=L.source,ge=p.get(ce);if(ge){const ye=ge[x.__cacheKey];ye.usedTimes--,ye.usedTimes===0&&J(L),Object.keys(ge).length===0&&p.delete(ce)}i.remove(L)}function J(L){const x=i.get(L);n.deleteTexture(x.__webglTexture);const ce=L.source,ge=p.get(ce);delete ge[x.__cacheKey],o.memory.textures--}function se(L){const x=i.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),i.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let ge=0;ge<6;ge++){if(Array.isArray(x.__webglFramebuffer[ge]))for(let ye=0;ye<x.__webglFramebuffer[ge].length;ye++)n.deleteFramebuffer(x.__webglFramebuffer[ge][ye]);else n.deleteFramebuffer(x.__webglFramebuffer[ge]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[ge])}else{if(Array.isArray(x.__webglFramebuffer))for(let ge=0;ge<x.__webglFramebuffer.length;ge++)n.deleteFramebuffer(x.__webglFramebuffer[ge]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let ge=0;ge<x.__webglColorRenderbuffer.length;ge++)x.__webglColorRenderbuffer[ge]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[ge]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const ce=L.textures;for(let ge=0,ye=ce.length;ge<ye;ge++){const Re=i.get(ce[ge]);Re.__webglTexture&&(n.deleteTexture(Re.__webglTexture),o.memory.textures--),i.remove(ce[ge])}i.remove(L)}let _e=0;function me(){_e=0}function w(){return _e}function G(L){_e=L}function g(){const L=_e;return L>=r.maxTextures&&lt("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+r.maxTextures),_e+=1,L}function z(L){const x=[];return x.push(L.wrapS),x.push(L.wrapT),x.push(L.wrapR||0),x.push(L.magFilter),x.push(L.minFilter),x.push(L.anisotropy),x.push(L.internalFormat),x.push(L.format),x.push(L.type),x.push(L.generateMipmaps),x.push(L.premultiplyAlpha),x.push(L.flipY),x.push(L.unpackAlignment),x.push(L.colorSpace),x.join()}function re(L,x){const ce=i.get(L);if(L.isVideoTexture&&Z(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&ce.__version!==L.version){const ge=L.image;if(ge===null)lt("WebGLRenderer: Texture marked for update but no image data found.");else if(ge.complete===!1)lt("WebGLRenderer: Texture marked for update but image is incomplete");else{j(ce,L,x);return}}else L.isExternalTexture&&(ce.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,ce.__webglTexture,n.TEXTURE0+x)}function K(L,x){const ce=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&ce.__version!==L.version){j(ce,L,x);return}else L.isExternalTexture&&(ce.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,ce.__webglTexture,n.TEXTURE0+x)}function R(L,x){const ce=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&ce.__version!==L.version){j(ce,L,x);return}t.bindTexture(n.TEXTURE_3D,ce.__webglTexture,n.TEXTURE0+x)}function T(L,x){const ce=i.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&ce.__version!==L.version){X(ce,L,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,ce.__webglTexture,n.TEXTURE0+x)}const F={[os]:n.REPEAT,[Pn]:n.CLAMP_TO_EDGE,[as]:n.MIRRORED_REPEAT},Q={[Ht]:n.NEAREST,[Mu]:n.NEAREST_MIPMAP_NEAREST,[fr]:n.NEAREST_MIPMAP_LINEAR,[Yt]:n.LINEAR,[Ms]:n.LINEAR_MIPMAP_NEAREST,[si]:n.LINEAR_MIPMAP_LINEAR},k={[Eu]:n.NEVER,[Cu]:n.ALWAYS,[wu]:n.LESS,[ra]:n.LEQUAL,[Tu]:n.EQUAL,[sa]:n.GEQUAL,[Au]:n.GREATER,[Ru]:n.NOTEQUAL};function Y(L,x){if(x.type===gn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Yt||x.magFilter===Ms||x.magFilter===fr||x.magFilter===si||x.minFilter===Yt||x.minFilter===Ms||x.minFilter===fr||x.minFilter===si)&&lt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(L,n.TEXTURE_WRAP_S,F[x.wrapS]),n.texParameteri(L,n.TEXTURE_WRAP_T,F[x.wrapT]),(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)&&n.texParameteri(L,n.TEXTURE_WRAP_R,F[x.wrapR]),n.texParameteri(L,n.TEXTURE_MAG_FILTER,Q[x.magFilter]),n.texParameteri(L,n.TEXTURE_MIN_FILTER,Q[x.minFilter]),x.compareFunction&&(n.texParameteri(L,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(L,n.TEXTURE_COMPARE_FUNC,k[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Ht||x.minFilter!==fr&&x.minFilter!==si||x.type===gn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){const ce=e.get("EXT_texture_filter_anisotropic");n.texParameterf(L,ce.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function $(L,x){let ce=!1;L.__webglInit===void 0&&(L.__webglInit=!0,x.addEventListener("dispose",W));const ge=x.source;let ye=p.get(ge);ye===void 0&&(ye={},p.set(ge,ye));const Re=z(x);if(Re!==L.__cacheKey){ye[Re]===void 0&&(ye[Re]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,ce=!0),ye[Re].usedTimes++;const Be=ye[L.__cacheKey];Be!==void 0&&(ye[L.__cacheKey].usedTimes--,Be.usedTimes===0&&J(x)),L.__cacheKey=Re,L.__webglTexture=ye[Re].texture}return ce}function D(L,x,ce){return Math.floor(Math.floor(L/ce)/x)}function O(L,x,ce,ge){const Re=L.updateRanges;if(Re.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,ce,ge,x.data);else{Re.sort((nt,ke)=>nt.start-ke.start);let Be=0;for(let nt=1;nt<Re.length;nt++){const ke=Re[Be],Ge=Re[nt],d=ke.start+ke.count,y=D(Ge.start,x.width,4),U=D(ke.start,x.width,4);Ge.start<=d+1&&y===U&&D(Ge.start+Ge.count-1,x.width,4)===y?ke.count=Math.max(ke.count,Ge.start+Ge.count-ke.start):(++Be,Re[Be]=Ge)}Re.length=Be+1;const be=t.getParameter(n.UNPACK_ROW_LENGTH),Ee=t.getParameter(n.UNPACK_SKIP_PIXELS),Fe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let nt=0,ke=Re.length;nt<ke;nt++){const Ge=Re[nt],d=Math.floor(Ge.start/4),y=Math.ceil(Ge.count/4),U=d%x.width,E=Math.floor(d/x.width),B=y,q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,U),t.pixelStorei(n.UNPACK_SKIP_ROWS,E),t.texSubImage2D(n.TEXTURE_2D,0,U,E,B,q,ce,ge,x.data)}L.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,be),t.pixelStorei(n.UNPACK_SKIP_PIXELS,Ee),t.pixelStorei(n.UNPACK_SKIP_ROWS,Fe)}}function j(L,x,ce){let ge=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(ge=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&(ge=n.TEXTURE_3D);const ye=$(L,x),Re=x.source;t.bindTexture(ge,L.__webglTexture,n.TEXTURE0+ce);const Be=i.get(Re);if(Re.version!==Be.__version||ye===!0){if(t.activeTexture(n.TEXTURE0+ce),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){const q=Et.getPrimaries(Et.workingColorSpace),oe=x.colorSpace===Vn?null:Et.getPrimaries(x.colorSpace),he=x.colorSpace===Vn||q===oe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let Ee=_(x.image,!1,r.maxTextureSize);Ee=pt(x,Ee);const Fe=s.convert(x.format,x.colorSpace),nt=s.convert(x.type);let ke=A(x.internalFormat,Fe,nt,x.normalized,x.colorSpace,x.isVideoTexture);Y(ge,x);let Ge;const d=x.mipmaps,y=x.isVideoTexture!==!0,U=Be.__version===void 0||ye===!0,E=Re.dataReady,B=C(x,Ee);if(x.isDepthTexture)ke=P(x.format===_i,x.type),U&&(y?t.texStorage2D(n.TEXTURE_2D,1,ke,Ee.width,Ee.height):t.texImage2D(n.TEXTURE_2D,0,ke,Ee.width,Ee.height,0,Fe,nt,null));else if(x.isDataTexture)if(d.length>0){y&&U&&t.texStorage2D(n.TEXTURE_2D,B,ke,d[0].width,d[0].height);for(let q=0,oe=d.length;q<oe;q++)Ge=d[q],y?E&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,Ge.width,Ge.height,Fe,nt,Ge.data):t.texImage2D(n.TEXTURE_2D,q,ke,Ge.width,Ge.height,0,Fe,nt,Ge.data);x.generateMipmaps=!1}else y?(U&&t.texStorage2D(n.TEXTURE_2D,B,ke,Ee.width,Ee.height),E&&O(x,Ee,Fe,nt)):t.texImage2D(n.TEXTURE_2D,0,ke,Ee.width,Ee.height,0,Fe,nt,Ee.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){y&&U&&t.texStorage3D(n.TEXTURE_2D_ARRAY,B,ke,d[0].width,d[0].height,Ee.depth);for(let q=0,oe=d.length;q<oe;q++)if(Ge=d[q],x.format!==xn)if(Fe!==null)if(y){if(E)if(x.layerUpdates.size>0){const he=il(Ge.width,Ge.height,x.format,x.type);for(const ee of x.layerUpdates){const de=Ge.data.subarray(ee*he/Ge.data.BYTES_PER_ELEMENT,(ee+1)*he/Ge.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,ee,Ge.width,Ge.height,1,Fe,de)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,Ge.width,Ge.height,Ee.depth,Fe,Ge.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,ke,Ge.width,Ge.height,Ee.depth,0,Ge.data,0,0);else lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else y?E&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,Ge.width,Ge.height,Ee.depth,Fe,nt,Ge.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,ke,Ge.width,Ge.height,Ee.depth,0,Fe,nt,Ge.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{y&&U&&t.texStorage2D(n.TEXTURE_2D,B,ke,d[0].width,d[0].height);for(let q=0,oe=d.length;q<oe;q++)Ge=d[q],x.format!==xn?Fe!==null?y?E&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,Ge.width,Ge.height,Fe,Ge.data):t.compressedTexImage2D(n.TEXTURE_2D,q,ke,Ge.width,Ge.height,0,Ge.data):lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):y?E&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,Ge.width,Ge.height,Fe,nt,Ge.data):t.texImage2D(n.TEXTURE_2D,q,ke,Ge.width,Ge.height,0,Fe,nt,Ge.data)}else if(x.isDataArrayTexture)if(y){if(U&&t.texStorage3D(n.TEXTURE_2D_ARRAY,B,ke,Ee.width,Ee.height,Ee.depth),E)if(x.layerUpdates.size>0){const q=il(Ee.width,Ee.height,x.format,x.type);for(const oe of x.layerUpdates){const he=Ee.data.subarray(oe*q/Ee.data.BYTES_PER_ELEMENT,(oe+1)*q/Ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,oe,Ee.width,Ee.height,1,Fe,nt,he)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,Ee.width,Ee.height,Ee.depth,Fe,nt,Ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ke,Ee.width,Ee.height,Ee.depth,0,Fe,nt,Ee.data);else if(x.isData3DTexture)y?(U&&t.texStorage3D(n.TEXTURE_3D,B,ke,Ee.width,Ee.height,Ee.depth),E&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,Ee.width,Ee.height,Ee.depth,Fe,nt,Ee.data)):t.texImage3D(n.TEXTURE_3D,0,ke,Ee.width,Ee.height,Ee.depth,0,Fe,nt,Ee.data);else if(x.isFramebufferTexture){if(U)if(y)t.texStorage2D(n.TEXTURE_2D,B,ke,Ee.width,Ee.height);else{let q=Ee.width,oe=Ee.height;for(let he=0;he<B;he++)t.texImage2D(n.TEXTURE_2D,he,ke,q,oe,0,Fe,nt,null),q>>=1,oe>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){const q=n.canvas;if(q.hasAttribute("layoutsubtree")||q.setAttribute("layoutsubtree","true"),Ee.parentNode!==q){q.appendChild(Ee),h.add(x),q.onpaint=oe=>{const he=oe.changedElements;for(const ee of h)he.includes(ee.image)&&(ee.needsUpdate=!0)},q.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,Ee);else{const he=n.RGBA,ee=n.RGBA,de=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,he,ee,de,Ee)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(d.length>0){if(y&&U){const q=Ae(d[0]);t.texStorage2D(n.TEXTURE_2D,B,ke,q.width,q.height)}for(let q=0,oe=d.length;q<oe;q++)Ge=d[q],y?E&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,Fe,nt,Ge):t.texImage2D(n.TEXTURE_2D,q,ke,Fe,nt,Ge);x.generateMipmaps=!1}else if(y){if(U){const q=Ae(Ee);t.texStorage2D(n.TEXTURE_2D,B,ke,q.width,q.height)}E&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Fe,nt,Ee)}else t.texImage2D(n.TEXTURE_2D,0,ke,Fe,nt,Ee);m(x)&&I(ge),Be.__version=Re.version,x.onUpdate&&x.onUpdate(x)}L.__version=x.version}function X(L,x,ce){if(x.image.length!==6)return;const ge=$(L,x),ye=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+ce);const Re=i.get(ye);if(ye.version!==Re.__version||ge===!0){t.activeTexture(n.TEXTURE0+ce);const Be=Et.getPrimaries(Et.workingColorSpace),be=x.colorSpace===Vn?null:Et.getPrimaries(x.colorSpace),Ee=x.colorSpace===Vn||Be===be?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const Fe=x.isCompressedTexture||x.image[0].isCompressedTexture,nt=x.image[0]&&x.image[0].isDataTexture,ke=[];for(let ee=0;ee<6;ee++)!Fe&&!nt?ke[ee]=_(x.image[ee],!0,r.maxCubemapSize):ke[ee]=nt?x.image[ee].image:x.image[ee],ke[ee]=pt(x,ke[ee]);const Ge=ke[0],d=s.convert(x.format,x.colorSpace),y=s.convert(x.type),U=A(x.internalFormat,d,y,x.normalized,x.colorSpace),E=x.isVideoTexture!==!0,B=Re.__version===void 0||ge===!0,q=ye.dataReady;let oe=C(x,Ge);Y(n.TEXTURE_CUBE_MAP,x);let he;if(Fe){E&&B&&t.texStorage2D(n.TEXTURE_CUBE_MAP,oe,U,Ge.width,Ge.height);for(let ee=0;ee<6;ee++){he=ke[ee].mipmaps;for(let de=0;de<he.length;de++){const pe=he[de];x.format!==xn?d!==null?E?q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de,0,0,pe.width,pe.height,d,pe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de,U,pe.width,pe.height,0,pe.data):lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):E?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de,0,0,pe.width,pe.height,d,y,pe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de,U,pe.width,pe.height,0,d,y,pe.data)}}}else{if(he=x.mipmaps,E&&B){he.length>0&&oe++;const ee=Ae(ke[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,oe,U,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(nt){E?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,ke[ee].width,ke[ee].height,d,y,ke[ee].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,U,ke[ee].width,ke[ee].height,0,d,y,ke[ee].data);for(let de=0;de<he.length;de++){const Te=he[de].image[ee].image;E?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de+1,0,0,Te.width,Te.height,d,y,Te.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de+1,U,Te.width,Te.height,0,d,y,Te.data)}}else{E?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,d,y,ke[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,U,d,y,ke[ee]);for(let de=0;de<he.length;de++){const pe=he[de];E?q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de+1,0,0,d,y,pe.image[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,de+1,U,d,y,pe.image[ee])}}}m(x)&&I(n.TEXTURE_CUBE_MAP),Re.__version=ye.version,x.onUpdate&&x.onUpdate(x)}L.__version=x.version}function V(L,x,ce,ge,ye,Re){const Be=s.convert(ce.format,ce.colorSpace),be=s.convert(ce.type),Ee=A(ce.internalFormat,Be,be,ce.normalized,ce.colorSpace),Fe=i.get(x),nt=i.get(ce);if(nt.__renderTarget=x,!Fe.__hasExternalTextures){const ke=Math.max(1,x.width>>Re),Ge=Math.max(1,x.height>>Re);ye===n.TEXTURE_3D||ye===n.TEXTURE_2D_ARRAY?t.texImage3D(ye,Re,Ee,ke,Ge,x.depth,0,Be,be,null):t.texImage2D(ye,Re,Ee,ke,Ge,0,Be,be,null)}t.bindFramebuffer(n.FRAMEBUFFER,L),rt(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ge,ye,nt.__webglTexture,0,$e(x)):(ye===n.TEXTURE_2D||ye>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ye<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ge,ye,nt.__webglTexture,Re),t.bindFramebuffer(n.FRAMEBUFFER,null)}function le(L,x,ce){if(n.bindRenderbuffer(n.RENDERBUFFER,L),x.depthBuffer){const ge=x.depthTexture,ye=ge&&ge.isDepthTexture?ge.type:null,Re=P(x.stencilBuffer,ye),Be=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;rt(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,$e(x),Re,x.width,x.height):ce?n.renderbufferStorageMultisample(n.RENDERBUFFER,$e(x),Re,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,Re,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Be,n.RENDERBUFFER,L)}else{const ge=x.textures;for(let ye=0;ye<ge.length;ye++){const Re=ge[ye],Be=s.convert(Re.format,Re.colorSpace),be=s.convert(Re.type),Ee=A(Re.internalFormat,Be,be,Re.normalized,Re.colorSpace);rt(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,$e(x),Ee,x.width,x.height):ce?n.renderbufferStorageMultisample(n.RENDERBUFFER,$e(x),Ee,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,Ee,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Se(L,x,ce){const ge=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,L),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ye=i.get(x.depthTexture);if(ye.__renderTarget=x,(!ye.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),ge){if(ye.__webglInit===void 0&&(ye.__webglInit=!0,x.depthTexture.addEventListener("dispose",W)),ye.__webglTexture===void 0){ye.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ye.__webglTexture),Y(n.TEXTURE_CUBE_MAP,x.depthTexture);const Fe=s.convert(x.depthTexture.format),nt=s.convert(x.depthTexture.type);let ke;x.depthTexture.format===$n?ke=n.DEPTH_COMPONENT24:x.depthTexture.format===_i&&(ke=n.DEPTH24_STENCIL8);for(let Ge=0;Ge<6;Ge++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Ge,0,ke,x.width,x.height,0,Fe,nt,null)}}else re(x.depthTexture,0);const Re=ye.__webglTexture,Be=$e(x),be=ge?n.TEXTURE_CUBE_MAP_POSITIVE_X+ce:n.TEXTURE_2D,Ee=x.depthTexture.format===_i?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===$n)rt(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Ee,be,Re,0,Be):n.framebufferTexture2D(n.FRAMEBUFFER,Ee,be,Re,0);else if(x.depthTexture.format===_i)rt(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Ee,be,Re,0,Be):n.framebufferTexture2D(n.FRAMEBUFFER,Ee,be,Re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function H(L){const x=i.get(L),ce=L.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==L.depthTexture){const ge=L.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),ge){const ye=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,ge.removeEventListener("dispose",ye)};ge.addEventListener("dispose",ye),x.__depthDisposeCallback=ye}x.__boundDepthTexture=ge}if(L.depthTexture&&!x.__autoAllocateDepthBuffer)if(ce)for(let ge=0;ge<6;ge++)Se(x.__webglFramebuffer[ge],L,ge);else{const ge=L.texture.mipmaps;ge&&ge.length>0?Se(x.__webglFramebuffer[0],L,0):Se(x.__webglFramebuffer,L,0)}else if(ce){x.__webglDepthbuffer=[];for(let ge=0;ge<6;ge++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[ge]),x.__webglDepthbuffer[ge]===void 0)x.__webglDepthbuffer[ge]=n.createRenderbuffer(),le(x.__webglDepthbuffer[ge],L,!1);else{const ye=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Re=x.__webglDepthbuffer[ge];n.bindRenderbuffer(n.RENDERBUFFER,Re),n.framebufferRenderbuffer(n.FRAMEBUFFER,ye,n.RENDERBUFFER,Re)}}else{const ge=L.texture.mipmaps;if(ge&&ge.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),le(x.__webglDepthbuffer,L,!1);else{const ye=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Re=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,Re),n.framebufferRenderbuffer(n.FRAMEBUFFER,ye,n.RENDERBUFFER,Re)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ve(L,x,ce){const ge=i.get(L);x!==void 0&&V(ge.__webglFramebuffer,L,L.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),ce!==void 0&&H(L)}function we(L){const x=L.texture,ce=i.get(L),ge=i.get(x);L.addEventListener("dispose",S);const ye=L.textures,Re=L.isWebGLCubeRenderTarget===!0,Be=ye.length>1;if(Be||(ge.__webglTexture===void 0&&(ge.__webglTexture=n.createTexture()),ge.__version=x.version,o.memory.textures++),Re){ce.__webglFramebuffer=[];for(let be=0;be<6;be++)if(x.mipmaps&&x.mipmaps.length>0){ce.__webglFramebuffer[be]=[];for(let Ee=0;Ee<x.mipmaps.length;Ee++)ce.__webglFramebuffer[be][Ee]=n.createFramebuffer()}else ce.__webglFramebuffer[be]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){ce.__webglFramebuffer=[];for(let be=0;be<x.mipmaps.length;be++)ce.__webglFramebuffer[be]=n.createFramebuffer()}else ce.__webglFramebuffer=n.createFramebuffer();if(Be)for(let be=0,Ee=ye.length;be<Ee;be++){const Fe=i.get(ye[be]);Fe.__webglTexture===void 0&&(Fe.__webglTexture=n.createTexture(),o.memory.textures++)}if(L.samples>0&&rt(L)===!1){ce.__webglMultisampledFramebuffer=n.createFramebuffer(),ce.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,ce.__webglMultisampledFramebuffer);for(let be=0;be<ye.length;be++){const Ee=ye[be];ce.__webglColorRenderbuffer[be]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,ce.__webglColorRenderbuffer[be]);const Fe=s.convert(Ee.format,Ee.colorSpace),nt=s.convert(Ee.type),ke=A(Ee.internalFormat,Fe,nt,Ee.normalized,Ee.colorSpace,L.isXRRenderTarget===!0),Ge=$e(L);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ge,ke,L.width,L.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.RENDERBUFFER,ce.__webglColorRenderbuffer[be])}n.bindRenderbuffer(n.RENDERBUFFER,null),L.depthBuffer&&(ce.__webglDepthRenderbuffer=n.createRenderbuffer(),le(ce.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(Re){t.bindTexture(n.TEXTURE_CUBE_MAP,ge.__webglTexture),Y(n.TEXTURE_CUBE_MAP,x);for(let be=0;be<6;be++)if(x.mipmaps&&x.mipmaps.length>0)for(let Ee=0;Ee<x.mipmaps.length;Ee++)V(ce.__webglFramebuffer[be][Ee],L,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+be,Ee);else V(ce.__webglFramebuffer[be],L,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+be,0);m(x)&&I(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Be){for(let be=0,Ee=ye.length;be<Ee;be++){const Fe=ye[be],nt=i.get(Fe);let ke=n.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(ke=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ke,nt.__webglTexture),Y(ke,Fe),V(ce.__webglFramebuffer,L,Fe,n.COLOR_ATTACHMENT0+be,ke,0),m(Fe)&&I(ke)}t.unbindTexture()}else{let be=n.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(be=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(be,ge.__webglTexture),Y(be,x),x.mipmaps&&x.mipmaps.length>0)for(let Ee=0;Ee<x.mipmaps.length;Ee++)V(ce.__webglFramebuffer[Ee],L,x,n.COLOR_ATTACHMENT0,be,Ee);else V(ce.__webglFramebuffer,L,x,n.COLOR_ATTACHMENT0,be,0);m(x)&&I(be),t.unbindTexture()}L.depthBuffer&&H(L)}function Le(L){const x=L.textures;for(let ce=0,ge=x.length;ce<ge;ce++){const ye=x[ce];if(m(ye)){const Re=ne(L),Be=i.get(ye).__webglTexture;t.bindTexture(Re,Be),I(Re),t.unbindTexture()}}}const Me=[],Ue=[];function Ye(L){if(L.samples>0){if(rt(L)===!1){const x=L.textures,ce=L.width,ge=L.height;let ye=n.COLOR_BUFFER_BIT;const Re=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Be=i.get(L),be=x.length>1;if(be)for(let Fe=0;Fe<x.length;Fe++)t.bindFramebuffer(n.FRAMEBUFFER,Be.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Fe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Be.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Fe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Be.__webglMultisampledFramebuffer);const Ee=L.texture.mipmaps;Ee&&Ee.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Be.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Be.__webglFramebuffer);for(let Fe=0;Fe<x.length;Fe++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(ye|=n.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(ye|=n.STENCIL_BUFFER_BIT)),be){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Be.__webglColorRenderbuffer[Fe]);const nt=i.get(x[Fe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,nt,0)}n.blitFramebuffer(0,0,ce,ge,0,0,ce,ge,ye,n.NEAREST),l===!0&&(Me.length=0,Ue.length=0,Me.push(n.COLOR_ATTACHMENT0+Fe),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&(Me.push(Re),Ue.push(Re),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Ue)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Me))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),be)for(let Fe=0;Fe<x.length;Fe++){t.bindFramebuffer(n.FRAMEBUFFER,Be.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Fe,n.RENDERBUFFER,Be.__webglColorRenderbuffer[Fe]);const nt=i.get(x[Fe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Be.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Fe,n.TEXTURE_2D,nt,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Be.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&l){const x=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function $e(L){return Math.min(r.maxSamples,L.samples)}function rt(L){const x=i.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Z(L){const x=o.render.frame;u.get(L)!==x&&(u.set(L,x),L.update())}function pt(L,x){const ce=L.colorSpace,ge=L.format,ye=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||ce!==us&&ce!==Vn&&(Et.getTransfer(ce)===It?(ge!==xn||ye!==un)&&lt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ct("WebGLTextures: Unsupported texture color space:",ce)),x}function Ae(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=g,this.resetTextureUnits=me,this.getTextureUnits=w,this.setTextureUnits=G,this.setTexture2D=re,this.setTexture2DArray=K,this.setTexture3D=R,this.setTextureCube=T,this.rebindTextures=ve,this.setupRenderTarget=we,this.updateRenderTargetMipmap=Le,this.updateMultisampleRenderTarget=Ye,this.setupDepthRenderbuffer=H,this.setupFrameBufferTexture=V,this.useMultisampledRTT=rt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Cm(n,e){function t(i,r=Vn){let s;const o=Et.getTransfer(r);if(i===un)return n.UNSIGNED_BYTE;if(i===Qo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===jo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===oc)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===ac)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===rc)return n.BYTE;if(i===sc)return n.SHORT;if(i===xr)return n.UNSIGNED_SHORT;if(i===Jo)return n.INT;if(i===Dn)return n.UNSIGNED_INT;if(i===gn)return n.FLOAT;if(i===Un)return n.HALF_FLOAT;if(i===lc)return n.ALPHA;if(i===cc)return n.RGB;if(i===xn)return n.RGBA;if(i===$n)return n.DEPTH_COMPONENT;if(i===_i)return n.DEPTH_STENCIL;if(i===ea)return n.RED;if(i===ta)return n.RED_INTEGER;if(i===bi)return n.RG;if(i===na)return n.RG_INTEGER;if(i===ia)return n.RGBA_INTEGER;if(i===ts||i===ns||i===is||i===rs)if(o===It)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ts)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ns)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===is)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===rs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ts)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ns)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===is)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===rs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===fo||i===ho||i===po||i===mo)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===fo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ho)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===po)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===mo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===go||i===xo||i===_o||i===vo||i===Mo||i===ls||i===yo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===go||i===xo)return o===It?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===_o)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===vo)return s.COMPRESSED_R11_EAC;if(i===Mo)return s.COMPRESSED_SIGNED_R11_EAC;if(i===ls)return s.COMPRESSED_RG11_EAC;if(i===yo)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===So||i===bo||i===Eo||i===wo||i===To||i===Ao||i===Ro||i===Co||i===Po||i===Lo||i===Io||i===Do||i===Uo||i===No)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===So)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===bo)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Eo)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===wo)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===To)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Ao)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ro)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Co)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Po)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Lo)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Io)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Do)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Uo)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===No)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Fo||i===Oo||i===Bo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Fo)return o===It?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Oo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Bo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===zo||i===ko||i===cs||i===Go)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===zo)return s.COMPRESSED_RED_RGTC1_EXT;if(i===ko)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===cs)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Go)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===_r?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const Pm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Lm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Im{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new vc(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Fn({vertexShader:Pm,fragmentShader:Lm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new on(new ms(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Dm extends Ei{constructor(e,t){super();const i=this;let r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,f=null,p=null,v=null;const b=typeof XRWebGLBinding<"u",_=new Im,m={},I=t.getContextAttributes();let ne=null,A=null;const P=[],C=[],W=new wt;let S=null,N=null;const J=new mn;J.viewport=new Ut;const se=new mn;se.viewport=new Ut;const _e=[J,se],me=new Gf;let w=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(D){let O=P[D];return O===void 0&&(O=new As,P[D]=O),O.getTargetRaySpace()},this.getControllerGrip=function(D){let O=P[D];return O===void 0&&(O=new As,P[D]=O),O.getGripSpace()},this.getHand=function(D){let O=P[D];return O===void 0&&(O=new As,P[D]=O),O.getHandSpace()};function g(D){const O=C.indexOf(D.inputSource);if(O===-1)return;const j=P[O];j!==void 0&&(j.update(D.inputSource,D.frame,c||o),j.dispatchEvent({type:D.type,data:D.inputSource}))}function z(){r.removeEventListener("select",g),r.removeEventListener("selectstart",g),r.removeEventListener("selectend",g),r.removeEventListener("squeeze",g),r.removeEventListener("squeezestart",g),r.removeEventListener("squeezeend",g),r.removeEventListener("end",z),r.removeEventListener("inputsourceschange",re);for(let D=0;D<P.length;D++){const O=C[D];O!==null&&(C[D]=null,P[D].disconnect(O))}w=null,G=null,_.reset();for(const D in m)delete m[D];if(e.setRenderTarget(ne),p=null,f=null,h=null,r=null,A=null,$.stop(),i.isPresenting=!1,e.setPixelRatio(S),e.setSize(W.width,W.height,!1),N!==null){const D=N.camera;D.fov=N.fov,D.zoom=N.zoom,D.updateProjectionMatrix(),N=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(D){s=D,i.isPresenting===!0&&lt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(D){a=D,i.isPresenting===!0&&lt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(D){c=D},this.getBaseLayer=function(){return f!==null?f:p},this.getBinding=function(){return h===null&&b&&(h=new XRWebGLBinding(r,t)),h},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(D){if(r=D,r!==null){if(ne=e.getRenderTarget(),r.addEventListener("select",g),r.addEventListener("selectstart",g),r.addEventListener("selectend",g),r.addEventListener("squeeze",g),r.addEventListener("squeezestart",g),r.addEventListener("squeezeend",g),r.addEventListener("end",z),r.addEventListener("inputsourceschange",re),I.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(W),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let j=null,X=null,V=null;I.depth&&(V=I.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,j=I.stencil?_i:$n,X=I.stencil?_r:Dn);const le={colorFormat:t.RGBA8,depthFormat:V,scaleFactor:s};h=this.getBinding(),f=h.createProjectionLayer(le),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),A=new bn(f.textureWidth,f.textureHeight,{format:xn,type:un,depthTexture:new Sr(f.textureWidth,f.textureHeight,X,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:I.stencil,colorSpace:e.outputColorSpace,samples:I.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{const j={antialias:I.antialias,alpha:!0,depth:I.depth,stencil:I.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,j),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),A=new bn(p.framebufferWidth,p.framebufferHeight,{format:xn,type:un,colorSpace:e.outputColorSpace,stencilBuffer:I.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),$.setContext(r),$.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function re(D){for(let O=0;O<D.removed.length;O++){const j=D.removed[O],X=C.indexOf(j);X>=0&&(C[X]=null,P[X].disconnect(j))}for(let O=0;O<D.added.length;O++){const j=D.added[O];let X=C.indexOf(j);if(X===-1){for(let le=0;le<P.length;le++)if(le>=C.length){C.push(j),X=le;break}else if(C[le]===null){C[le]=j,X=le;break}if(X===-1)break}const V=P[X];V&&V.connect(j)}}const K=new fe,R=new fe;function T(D,O,j){K.setFromMatrixPosition(O.matrixWorld),R.setFromMatrixPosition(j.matrixWorld);const X=K.distanceTo(R),V=O.projectionMatrix.elements,le=j.projectionMatrix.elements,Se=V[14]/(V[10]-1),H=V[14]/(V[10]+1),ve=(V[9]+1)/V[5],we=(V[9]-1)/V[5],Le=(V[8]-1)/V[0],Me=(le[8]+1)/le[0],Ue=Se*Le,Ye=Se*Me,$e=X/(-Le+Me),rt=$e*-Le;if(O.matrixWorld.decompose(D.position,D.quaternion,D.scale),D.translateX(rt),D.translateZ($e),D.matrixWorld.compose(D.position,D.quaternion,D.scale),D.matrixWorldInverse.copy(D.matrixWorld).invert(),V[10]===-1)D.projectionMatrix.copy(O.projectionMatrix),D.projectionMatrixInverse.copy(O.projectionMatrixInverse);else{const Z=Se+$e,pt=H+$e,Ae=Ue-rt,L=Ye+(X-rt),x=ve*H/pt*Z,ce=we*H/pt*Z;D.projectionMatrix.makePerspective(Ae,L,x,ce,Z,pt),D.projectionMatrixInverse.copy(D.projectionMatrix).invert()}}function F(D,O){O===null?D.matrixWorld.copy(D.matrix):D.matrixWorld.multiplyMatrices(O.matrixWorld,D.matrix),D.matrixWorldInverse.copy(D.matrixWorld).invert()}this.updateCamera=function(D){if(r===null)return;let O=D.near,j=D.far;_.texture!==null&&(_.depthNear>0&&(O=_.depthNear),_.depthFar>0&&(j=_.depthFar)),me.near=se.near=J.near=O,me.far=se.far=J.far=j,(w!==me.near||G!==me.far)&&(r.updateRenderState({depthNear:me.near,depthFar:me.far}),w=me.near,G=me.far),me.layers.mask=D.layers.mask|6,J.layers.mask=me.layers.mask&-5,se.layers.mask=me.layers.mask&-3;const X=D.parent,V=me.cameras;F(me,X);for(let le=0;le<V.length;le++)F(V[le],X);V.length===2?T(me,J,se):me.projectionMatrix.copy(J.projectionMatrix),N===null&&D.isPerspectiveCamera&&(N={camera:D,fov:D.fov,zoom:D.zoom}),Q(D,me,X)};function Q(D,O,j){j===null?D.matrix.copy(O.matrixWorld):(D.matrix.copy(j.matrixWorld),D.matrix.invert(),D.matrix.multiply(O.matrixWorld)),D.matrix.decompose(D.position,D.quaternion,D.scale),D.updateMatrixWorld(!0),D.projectionMatrix.copy(O.projectionMatrix),D.projectionMatrixInverse.copy(O.projectionMatrixInverse),D.isPerspectiveCamera&&(D.fov=yr*2*Math.atan(1/D.projectionMatrix.elements[5]),D.zoom=1)}this.getCamera=function(){return me},this.getFoveation=function(){if(!(f===null&&p===null))return l},this.setFoveation=function(D){l=D,f!==null&&(f.fixedFoveation=D),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=D)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(me)},this.getCameraTexture=function(D){return m[D]};let k=null;function Y(D,O){if(u=O.getViewerPose(c||o),v=O,u!==null){const j=u.views;p!==null&&(e.setRenderTargetFramebuffer(A,p.framebuffer),e.setRenderTarget(A));let X=!1;j.length!==me.cameras.length&&(me.cameras.length=0,X=!0);for(let H=0;H<j.length;H++){const ve=j[H];let we=null;if(p!==null)we=p.getViewport(ve);else{const Me=h.getViewSubImage(f,ve);we=Me.viewport,H===0&&(e.setRenderTargetTextures(A,Me.colorTexture,Me.depthStencilTexture),e.setRenderTarget(A))}let Le=_e[H];Le===void 0&&(Le=new mn,Le.layers.enable(H),Le.viewport=new Ut,_e[H]=Le),Le.matrix.fromArray(ve.transform.matrix),Le.matrix.decompose(Le.position,Le.quaternion,Le.scale),Le.projectionMatrix.fromArray(ve.projectionMatrix),Le.projectionMatrixInverse.copy(Le.projectionMatrix).invert(),Le.viewport.set(we.x,we.y,we.width,we.height),H===0&&(me.matrix.copy(Le.matrix),me.matrix.decompose(me.position,me.quaternion,me.scale)),X===!0&&me.cameras.push(Le)}const V=r.enabledFeatures;if(V&&V.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&b){h=i.getBinding();const H=h.getDepthInformation(j[0]);H&&H.isValid&&H.texture&&_.init(H,r.renderState)}if(V&&V.includes("camera-access")&&b){e.state.unbindTexture(),h=i.getBinding();for(let H=0;H<j.length;H++){const ve=j[H].camera;if(ve){let we=m[ve];we||(we=new vc,m[ve]=we);const Le=h.getCameraImage(ve);we.sourceTexture=Le}}}}for(let j=0;j<P.length;j++){const X=C[j],V=P[j];X!==null&&V!==void 0&&V.update(X,O,c||o)}k&&k(D,O),O.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:O}),v=null}const $=new Ec;$.setAnimationLoop(Y),this.setAnimationLoop=function(D){k=D},this.dispose=function(){}}}const Um=new yt,Lc=new xt;Lc.set(-1,0,0,0,1,0,0,0,1);function Nm(n,e){function t(_,m){_.matrixAutoUpdate===!0&&_.updateMatrix(),m.value.copy(_.matrix)}function i(_,m){m.color.getRGB(_.fogColor.value,Mc(n)),m.isFog?(_.fogNear.value=m.near,_.fogFar.value=m.far):m.isFogExp2&&(_.fogDensity.value=m.density)}function r(_,m,I,ne,A){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(_,m):m.isMeshLambertMaterial?(s(_,m),m.envMap&&(_.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(_,m),h(_,m)):m.isMeshPhongMaterial?(s(_,m),u(_,m),m.envMap&&(_.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(_,m),f(_,m),m.isMeshPhysicalMaterial&&p(_,m,A)):m.isMeshMatcapMaterial?(s(_,m),v(_,m)):m.isMeshDepthMaterial?s(_,m):m.isMeshDistanceMaterial?(s(_,m),b(_,m)):m.isMeshNormalMaterial?s(_,m):m.isLineBasicMaterial?(o(_,m),m.isLineDashedMaterial&&a(_,m)):m.isPointsMaterial?l(_,m,I,ne):m.isSpriteMaterial?c(_,m):m.isShadowMaterial?(_.color.value.copy(m.color),_.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(_,m){_.opacity.value=m.opacity,m.color&&_.diffuse.value.copy(m.color),m.emissive&&_.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(_.map.value=m.map,t(m.map,_.mapTransform)),m.alphaMap&&(_.alphaMap.value=m.alphaMap,t(m.alphaMap,_.alphaMapTransform)),m.bumpMap&&(_.bumpMap.value=m.bumpMap,t(m.bumpMap,_.bumpMapTransform),_.bumpScale.value=m.bumpScale,m.side===sn&&(_.bumpScale.value*=-1)),m.normalMap&&(_.normalMap.value=m.normalMap,t(m.normalMap,_.normalMapTransform),_.normalScale.value.copy(m.normalScale),m.side===sn&&_.normalScale.value.negate()),m.displacementMap&&(_.displacementMap.value=m.displacementMap,t(m.displacementMap,_.displacementMapTransform),_.displacementScale.value=m.displacementScale,_.displacementBias.value=m.displacementBias),m.emissiveMap&&(_.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,_.emissiveMapTransform)),m.specularMap&&(_.specularMap.value=m.specularMap,t(m.specularMap,_.specularMapTransform)),m.alphaTest>0&&(_.alphaTest.value=m.alphaTest);const I=e.get(m),ne=I.envMap,A=I.envMapRotation;ne&&(_.envMap.value=ne,_.envMapRotation.value.setFromMatrix4(Um.makeRotationFromEuler(A)).transpose(),ne.isCubeTexture&&ne.isRenderTargetTexture===!1&&_.envMapRotation.value.premultiply(Lc),_.reflectivity.value=m.reflectivity,_.ior.value=m.ior,_.refractionRatio.value=m.refractionRatio),m.lightMap&&(_.lightMap.value=m.lightMap,_.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,_.lightMapTransform)),m.aoMap&&(_.aoMap.value=m.aoMap,_.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,_.aoMapTransform))}function o(_,m){_.diffuse.value.copy(m.color),_.opacity.value=m.opacity,m.map&&(_.map.value=m.map,t(m.map,_.mapTransform))}function a(_,m){_.dashSize.value=m.dashSize,_.totalSize.value=m.dashSize+m.gapSize,_.scale.value=m.scale}function l(_,m,I,ne){_.diffuse.value.copy(m.color),_.opacity.value=m.opacity,_.size.value=m.size*I,_.scale.value=ne*.5,m.map&&(_.map.value=m.map,t(m.map,_.uvTransform)),m.alphaMap&&(_.alphaMap.value=m.alphaMap,t(m.alphaMap,_.alphaMapTransform)),m.alphaTest>0&&(_.alphaTest.value=m.alphaTest)}function c(_,m){_.diffuse.value.copy(m.color),_.opacity.value=m.opacity,_.rotation.value=m.rotation,m.map&&(_.map.value=m.map,t(m.map,_.mapTransform)),m.alphaMap&&(_.alphaMap.value=m.alphaMap,t(m.alphaMap,_.alphaMapTransform)),m.alphaTest>0&&(_.alphaTest.value=m.alphaTest)}function u(_,m){_.specular.value.copy(m.specular),_.shininess.value=Math.max(m.shininess,1e-4)}function h(_,m){m.gradientMap&&(_.gradientMap.value=m.gradientMap)}function f(_,m){_.metalness.value=m.metalness,m.metalnessMap&&(_.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,_.metalnessMapTransform)),_.roughness.value=m.roughness,m.roughnessMap&&(_.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,_.roughnessMapTransform)),m.envMap&&(_.envMapIntensity.value=m.envMapIntensity)}function p(_,m,I){_.ior.value=m.ior,m.sheen>0&&(_.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),_.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(_.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,_.sheenColorMapTransform)),m.sheenRoughnessMap&&(_.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,_.sheenRoughnessMapTransform))),m.clearcoat>0&&(_.clearcoat.value=m.clearcoat,_.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(_.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,_.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(_.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===sn&&_.clearcoatNormalScale.value.negate())),m.dispersion>0&&(_.dispersion.value=m.dispersion),m.retroreflectivity>0&&(_.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(_.iridescence.value=m.iridescence,_.iridescenceIOR.value=m.iridescenceIOR,_.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],_.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(_.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,_.iridescenceMapTransform)),m.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),m.transmission>0&&(_.transmission.value=m.transmission,_.transmissionSamplerMap.value=I.texture,_.transmissionSamplerSize.value.set(I.width,I.height),m.transmissionMap&&(_.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,_.transmissionMapTransform)),_.thickness.value=m.thickness,m.thicknessMap&&(_.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=m.attenuationDistance,_.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(_.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(_.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=m.specularIntensity,_.specularColor.value.copy(m.specularColor),m.specularColorMap&&(_.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,_.specularColorMapTransform)),m.specularIntensityMap&&(_.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,_.specularIntensityMapTransform))}function v(_,m){m.matcap&&(_.matcap.value=m.matcap)}function b(_,m){const I=e.get(m).light;_.referencePosition.value.setFromMatrixPosition(I.matrixWorld),_.nearDistance.value=I.shadow.camera.near,_.farDistance.value=I.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Fm(n,e,t,i){let r={},s={},o=[];const a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(A,P){const C=P.program;i.uniformBlockBinding(A,C)}function c(A,P){let C=r[A.id];C===void 0&&(_(A),C=u(A),r[A.id]=C,A.addEventListener("dispose",I));const W=P.program;i.updateUBOMapping(A,W);const S=e.render.frame;s[A.id]!==S&&(f(A),s[A.id]=S)}function u(A){const P=h();A.__bindingPointIndex=P;const C=n.createBuffer(),W=A.__size,S=A.usage;return n.bindBuffer(n.UNIFORM_BUFFER,C),n.bufferData(n.UNIFORM_BUFFER,W,S),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,P,C),C}function h(){for(let A=0;A<a;A++)if(o.indexOf(A)===-1)return o.push(A),A;return Ct("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(A){const P=r[A.id],C=A.uniforms,W=A.__cache;n.bindBuffer(n.UNIFORM_BUFFER,P);for(let S=0,N=C.length;S<N;S++){const J=C[S];if(Array.isArray(J))for(let se=0,_e=J.length;se<_e;se++)p(J[se],S,se,W);else p(J,S,0,W)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(A,P,C,W){if(b(A,P,C,W)===!0){const S=A.__offset,N=A.value;if(Array.isArray(N)){let J=0;for(let se=0;se<N.length;se++){const _e=N[se],me=m(_e);v(_e,A.__data,J),typeof _e!="number"&&typeof _e!="boolean"&&!_e.isMatrix3&&!ArrayBuffer.isView(_e)&&(J+=me.storage/Float32Array.BYTES_PER_ELEMENT)}}else v(N,A.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,S,A.__data)}}function v(A,P,C){typeof A=="number"||typeof A=="boolean"?P[0]=A:A.isMatrix3?(P[0]=A.elements[0],P[1]=A.elements[1],P[2]=A.elements[2],P[3]=0,P[4]=A.elements[3],P[5]=A.elements[4],P[6]=A.elements[5],P[7]=0,P[8]=A.elements[6],P[9]=A.elements[7],P[10]=A.elements[8],P[11]=0):ArrayBuffer.isView(A)?P.set(new A.constructor(A.buffer,A.byteOffset,P.length)):A.toArray(P,C)}function b(A,P,C,W){const S=A.value,N=P+"_"+C;if(W[N]===void 0)return typeof S=="number"||typeof S=="boolean"?W[N]=S:ArrayBuffer.isView(S)?W[N]=S.slice():W[N]=S.clone(),!0;{const J=W[N];if(typeof S=="number"||typeof S=="boolean"){if(J!==S)return W[N]=S,!0}else{if(ArrayBuffer.isView(S))return!0;if(J.equals(S)===!1)return J.copy(S),!0}}return!1}function _(A){const P=A.uniforms;let C=0;const W=16;for(let N=0,J=P.length;N<J;N++){const se=Array.isArray(P[N])?P[N]:[P[N]];for(let _e=0,me=se.length;_e<me;_e++){const w=se[_e],G=Array.isArray(w.value)?w.value:[w.value];for(let g=0,z=G.length;g<z;g++){const re=G[g],K=m(re),R=C%W,T=R%K.boundary,F=R+T;C+=T,F!==0&&W-F<K.storage&&(C+=W-F),w.__data=new Float32Array(K.storage/Float32Array.BYTES_PER_ELEMENT),w.__offset=C,C+=K.storage}}}const S=C%W;return S>0&&(C+=W-S),A.__size=C,A.__cache={},this}function m(A){const P={boundary:0,storage:0};return typeof A=="number"||typeof A=="boolean"?(P.boundary=4,P.storage=4):A.isVector2?(P.boundary=8,P.storage=8):A.isVector3||A.isColor?(P.boundary=16,P.storage=12):A.isVector4?(P.boundary=16,P.storage=16):A.isMatrix3?(P.boundary=48,P.storage=48):A.isMatrix4?(P.boundary=64,P.storage=64):A.isTexture?lt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(A)?(P.boundary=16,P.storage=A.byteLength):lt("WebGLRenderer: Unsupported uniform value type.",A),P}function I(A){const P=A.target;P.removeEventListener("dispose",I);const C=o.indexOf(P.__bindingPointIndex);o.splice(C,1),n.deleteBuffer(r[P.id]),delete r[P.id],delete s[P.id]}function ne(){for(const A in r)n.deleteBuffer(r[A]);o=[],r={},s={}}return{bind:l,update:c,dispose:ne}}const Om=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Tn=null;function Bm(){return Tn===null&&(Tn=new ca(Om,16,16,bi,Un),Tn.name="DFG_LUT",Tn.minFilter=Yt,Tn.magFilter=Yt,Tn.wrapS=Pn,Tn.wrapT=Pn,Tn.generateMipmaps=!1,Tn.needsUpdate=!0),Tn}class zm{constructor(e={}){const{canvas:t=Iu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:f=!1,outputBufferType:p=un}=e;this.isWebGLRenderer=!0;let v;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=i.getContextAttributes().alpha}else v=o;const b=p,_=new Set([ia,na,ta]),m=new Set([un,Dn,xr,_r,Qo,jo]),I=new Uint32Array(4),ne=new Int32Array(4),A=new fe;let P=null,C=null;const W=[],S=[];let N=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=In,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const J=this;let se=!1,_e=null,me=null,w=null,G=null;this._outputColorSpace=cn;let g=0,z=0,re=null,K=-1,R=null;const T=new Ut,F=new Ut;let Q=null;const k=new dt(0);let Y=0,$=t.width,D=t.height,O=1,j=null,X=null;const V=new Ut(0,0,$,D),le=new Ut(0,0,$,D);let Se=!1;const H=new ps;let ve=!1,we=!1;const Le=new yt,Me=new fe,Ue=new Ut,Ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let $e=!1;function rt(){return re===null?O:1}let Z=i;function pt(M,te){return t.getContext(M,te)}let Ae,L,x,ce,ge,ye,Re,Be,be,Ee,Fe,nt,ke,Ge,d,y,U,E,B,q,oe,he,ee;try{const M={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ko}`),t.addEventListener("webglcontextlost",Te,!1),t.addEventListener("webglcontextrestored",Ce,!1),t.addEventListener("webglcontextcreationerror",it,!1),Z===null){const te="webgl2";if(Z=pt(te,M),Z===null)throw pt(te)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}de()}catch(M){throw t.removeEventListener("webglcontextlost",Te,!1),t.removeEventListener("webglcontextrestored",Ce,!1),t.removeEventListener("webglcontextcreationerror",it,!1),Ct("WebGLRenderer: "+M.message),M}function de(){Ae=new Bp(Z),Ae.init(),oe=new Cm(Z,Ae),L=new Rp(Z,Ae,e,oe),x=new Am(Z,Ae),L.reversedDepthBuffer&&f&&x.buffers.depth.setReversed(!0),me=Z.createFramebuffer(),w=Z.createFramebuffer(),G=Z.createFramebuffer(),ce=new Gp(Z),ge=new dm,ye=new Rm(Z,Ae,x,ge,L,oe,ce),Re=new Op(J),Be=new Vf(Z),he=new Tp(Z,Be),be=new zp(Z,Be,ce,he),Ee=new Vp(Z,be,Be,he,ce),E=new Hp(Z,L,ye),d=new Cp(ge),Fe=new hm(J,Re,Ae,L,he,d),nt=new Nm(J,ge),ke=new mm,Ge=new ym(Ae),U=new wp(J,Re,x,Ee,v,l),y=new Tm(J,Ee,L),ee=new Fm(Z,ce,L,x),B=new Ap(Z,Ae,ce),q=new kp(Z,Ae,ce),ce.programs=Fe.programs,J.capabilities=L,J.extensions=Ae,J.properties=ge,J.renderLists=ke,J.shadowMap=y,J.state=x,J.info=ce}b!==un&&(N=new Xp(b,t.width,t.height,a,r,s));const pe=new Dm(J,Z);this.xr=pe,this.getContext=function(){return Z},this.getContextAttributes=function(){return Z.getContextAttributes()},this.forceContextLoss=function(){const M=Ae.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Ae.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return O},this.setPixelRatio=function(M){M!==void 0&&(O=M,this.setSize($,D,!1))},this.getSize=function(M){return M.set($,D)},this.setSize=function(M,te,ae=!0){if(pe.isPresenting){lt("WebGLRenderer: Can't change size while VR device is presenting.");return}$=M,D=te,t.width=Math.floor(M*O),t.height=Math.floor(te*O),ae===!0&&(t.style.width=M+"px",t.style.height=te+"px"),N!==null&&N.setSize(t.width,t.height),this.setViewport(0,0,M,te)},this.getDrawingBufferSize=function(M){return M.set($*O,D*O).floor()},this.setDrawingBufferSize=function(M,te,ae){$=M,D=te,O=ae,t.width=Math.floor(M*ae),t.height=Math.floor(te*ae),this.setViewport(0,0,M,te)},this.setEffects=function(M){if(b===un){Ct("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let te=0;te<M.length;te++)if(M[te].isOutputPass===!0){lt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}N.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(T)},this.getViewport=function(M){return M.copy(V)},this.setViewport=function(M,te,ae,xe){M.isVector4?V.set(M.x,M.y,M.z,M.w):V.set(M,te,ae,xe),x.viewport(T.copy(V).multiplyScalar(O).round())},this.getScissor=function(M){return M.copy(le)},this.setScissor=function(M,te,ae,xe){M.isVector4?le.set(M.x,M.y,M.z,M.w):le.set(M,te,ae,xe),x.scissor(F.copy(le).multiplyScalar(O).round())},this.getScissorTest=function(){return Se},this.setScissorTest=function(M){x.setScissorTest(Se=M)},this.setOpaqueSort=function(M){j=M},this.setTransparentSort=function(M){X=M},this.getClearColor=function(M){return M.copy(U.getClearColor())},this.setClearColor=function(){U.setClearColor(...arguments)},this.getClearAlpha=function(){return U.getClearAlpha()},this.setClearAlpha=function(){U.setClearAlpha(...arguments)},this.clear=function(M=!0,te=!0,ae=!0){let xe=0;if(M){let ue=!1;if(re!==null){const Pe=re.texture.format;ue=_.has(Pe)}if(ue){const Pe=re.texture.type,ze=m.has(Pe),Oe=U.getClearColor(),Xe=U.getClearAlpha(),tt=Oe.r,ht=Oe.g,ut=Oe.b;ze?(I[0]=tt,I[1]=ht,I[2]=ut,I[3]=Xe,Z.clearBufferuiv(Z.COLOR,0,I)):(ne[0]=tt,ne[1]=ht,ne[2]=ut,ne[3]=Xe,Z.clearBufferiv(Z.COLOR,0,ne))}else xe|=Z.COLOR_BUFFER_BIT}te&&(xe|=Z.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ae&&(xe|=Z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),xe!==0&&Z.clear(xe)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),_e=M},this.dispose=function(){t.removeEventListener("webglcontextlost",Te,!1),t.removeEventListener("webglcontextrestored",Ce,!1),t.removeEventListener("webglcontextcreationerror",it,!1),U.dispose(),ke.dispose(),Ge.dispose(),ge.dispose(),Re.dispose(),Ee.dispose(),he.dispose(),ee.dispose(),Fe.dispose(),pe.dispose(),pe.removeEventListener("sessionstart",Tt),pe.removeEventListener("sessionend",Ft),St.stop()};function Te(M){M.preventDefault(),Ta("WebGLRenderer: Context Lost."),se=!0}function Ce(){Ta("WebGLRenderer: Context Restored."),se=!1;const M=ce.autoReset,te=y.enabled,ae=y.autoUpdate,xe=y.needsUpdate,ue=y.type;de(),ce.autoReset=M,y.enabled=te,y.autoUpdate=ae,y.needsUpdate=xe,y.type=ue}function it(M){Ct("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Ke(M){const te=M.target;te.removeEventListener("dispose",Ke),st(te)}function st(M){ct(M),ge.remove(M)}function ct(M){const te=ge.get(M).programs;te!==void 0&&(te.forEach(function(ae){Fe.releaseProgram(ae)}),M.isShaderMaterial&&Fe.releaseShaderCache(M))}this.renderBufferDirect=function(M,te,ae,xe,ue,Pe){te===null&&(te=Ye);const ze=ue.isMesh&&ue.matrixWorld.determinantAffine()<0,Oe=De(M,te,ae,xe,ue);x.setMaterial(xe,ze);let Xe=ae.index,tt=1;if(xe.wireframe===!0){if(Xe=be.getWireframeAttribute(ae),Xe===void 0)return;tt=2}const ht=ae.drawRange,ut=ae.attributes.position;let Ve=ht.start*tt,At=(ht.start+ht.count)*tt;Pe!==null&&(Ve=Math.max(Ve,Pe.start*tt),At=Math.min(At,(Pe.start+Pe.count)*tt)),Xe!==null?(Ve=Math.max(Ve,0),At=Math.min(At,Xe.count)):ut!=null&&(Ve=Math.max(Ve,0),At=Math.min(At,ut.count));const Bt=At-Ve;if(Bt<0||Bt===1/0)return;he.setup(ue,xe,Oe,ae,Xe);let Lt,Pt=B;if(Xe!==null&&(Lt=Be.get(Xe),Pt=q,Pt.setIndex(Lt)),ue.isMesh)xe.wireframe===!0?(x.setLineWidth(xe.wireframeLinewidth*rt()),Pt.setMode(Z.LINES)):Pt.setMode(Z.TRIANGLES);else if(ue.isLine){let Kt=xe.linewidth;Kt===void 0&&(Kt=1),x.setLineWidth(Kt*rt()),ue.isLineSegments?Pt.setMode(Z.LINES):ue.isLineLoop?Pt.setMode(Z.LINE_LOOP):Pt.setMode(Z.LINE_STRIP)}else ue.isPoints?Pt.setMode(Z.POINTS):ue.isSprite&&Pt.setMode(Z.TRIANGLES);if(ue.isBatchedMesh)if(Ae.get("WEBGL_multi_draw"))Pt.renderMultiDraw(ue._multiDrawStarts,ue._multiDrawCounts,ue._multiDrawCount);else{const Kt=ue._multiDrawStarts,Ze=ue._multiDrawCounts,en=ue._multiDrawCount,Rt=Xe?Be.get(Xe).bytesPerElement:1,hn=ge.get(xe).currentProgram.getUniforms();for(let En=0;En<en;En++)hn.setValue(Z,"_gl_DrawID",En),Pt.render(Kt[En]/Rt,Ze[En])}else if(ue.isInstancedMesh)Pt.renderInstances(Ve,Bt,ue.count);else if(ae.isInstancedBufferGeometry){const Kt=ae._maxInstanceCount!==void 0?ae._maxInstanceCount:1/0,Ze=Math.min(ae.instanceCount,Kt);Pt.renderInstances(Ve,Bt,Ze)}else Pt.render(Ve,Bt)};function Ne(M,te,ae,xe){_e!==null&&M.isNodeMaterial&&_e.setObject(xe,M),ve===!0&&d.setState(M,ae,!1),M.transparent===!0&&M.side===Cn&&M.forceSinglePass===!1?(M.side=sn,M.needsUpdate=!0,Ie(M,te,xe),M.side=ai,M.needsUpdate=!0,Ie(M,te,xe),M.side=Cn):Ie(M,te,xe)}this.compile=function(M,te,ae=null){ae===null&&(ae=M),_e!==null&&_e.renderStart(M,te,ae),C=Ge.get(ae),C.init(te),S.push(C),ae.traverseVisible(function(ue){ue.isLight&&ue.layers.test(te.layers)&&(C.pushLight(ue),ue.castShadow&&C.pushShadow(ue))}),M!==ae&&M.traverseVisible(function(ue){ue.isLight&&ue.layers.test(te.layers)&&(C.pushLight(ue),ue.castShadow&&C.pushShadow(ue))}),C.setupLights(),_e!==null&&_e.updateLights(C.state.lightsArray),we=this.localClippingEnabled,ve=d.init(this.clippingPlanes,we),ve===!0&&d.setGlobalState(this.clippingPlanes,te),_e!==null&&y.render(C.state.shadowsArray,ae,te);const xe=new Set;return M.traverse(function(ue){if(!(ue.isMesh||ue.isPoints||ue.isLine||ue.isSprite))return;const Pe=ue.material;if(Pe)if(Array.isArray(Pe))for(let ze=0;ze<Pe.length;ze++){const Oe=Pe[ze];Ne(Oe,ae,te,ue),xe.add(Oe)}else Ne(Pe,ae,te,ue),xe.add(Pe)}),C=S.pop(),_e!==null&&_e.renderEnd(),xe},this.compileAsync=function(M,te,ae=null){const xe=this.compile(M,te,ae);return new Promise(ue=>{function Pe(){if(xe.forEach(function(ze){const Xe=ge.get(ze).currentProgram;(Xe===void 0||Xe.isReady())&&xe.delete(ze)}),xe.size===0){ue(M);return}setTimeout(Pe,10)}Ae.get("KHR_parallel_shader_compile")!==null?Pe():setTimeout(Pe,10)})};let je=null;function ot(M){je&&je(M)}function Tt(){St.stop()}function Ft(){St.start()}const St=new Ec;St.setAnimationLoop(ot),typeof self<"u"&&St.setContext(self),this.setAnimationLoop=function(M){je=M,pe.setAnimationLoop(M),M===null?St.stop():St.start()},pe.addEventListener("sessionstart",Tt),pe.addEventListener("sessionend",Ft),this.render=function(M,te){if(te!==void 0&&te.isCamera!==!0){Ct("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(se===!0)return;_e!==null&&_e.renderStart(M,te);const ae=pe.enabled===!0&&pe.isPresenting===!0,xe=N!==null&&(re===null||ae)&&N.begin(J,re);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),te.parent===null&&te.matrixWorldAutoUpdate===!0&&te.updateMatrixWorld(),pe.enabled===!0&&pe.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(pe.cameraAutoUpdate===!0&&pe.updateCamera(te),te=pe.getCamera()),M.isScene===!0&&M.onBeforeRender(J,M,te,re),C=Ge.get(M,S.length),C.init(te),C.state.textureUnits=ye.getTextureUnits(),S.push(C),Le.multiplyMatrices(te.projectionMatrix,te.matrixWorldInverse),H.setFromProjectionMatrix(Le,Ln,te.reversedDepth),we=this.localClippingEnabled,ve=d.init(this.clippingPlanes,we),P=ke.get(M,W.length),P.init(),W.push(P),pe.enabled===!0&&pe.isPresenting===!0){const ze=J.xr.getDepthSensingMesh();ze!==null&&Je(ze,te,-1/0,J.sortObjects)}Je(M,te,0,J.sortObjects),P.finish(),_e!==null&&_e.updateLights(C.state.lightsArray),J.sortObjects===!0&&P.sort(j,X),$e=pe.enabled===!1||pe.isPresenting===!1||pe.hasDepthSensing()===!1,$e&&U.addToRenderList(P,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ve===!0&&d.beginShadows();const ue=C.state.shadowsArray;if(y.render(ue,M,te),ve===!0&&d.endShadows(),(xe&&N.hasRenderPass())===!1){const ze=P.opaque,Oe=P.transmissive;if(C.setupLights(),te.isArrayCamera){const Xe=te.cameras;if(Oe.length>0)for(let tt=0,ht=Xe.length;tt<ht;tt++){const ut=Xe[tt];mt(ze,Oe,M,ut)}$e&&U.render(M);for(let tt=0,ht=Xe.length;tt<ht;tt++){const ut=Xe[tt];vt(P,M,ut,ut.viewport)}}else Oe.length>0&&mt(ze,Oe,M,te),$e&&U.render(M),vt(P,M,te)}re!==null&&z===0&&(ye.updateMultisampleRenderTarget(re),ye.updateRenderTargetMipmap(re)),xe&&N.end(J),M.isScene===!0&&M.onAfterRender(J,M,te),he.resetDefaultState(),K=-1,R=null,S.pop(),S.length>0?(C=S[S.length-1],ye.setTextureUnits(C.state.textureUnits),ve===!0&&d.setGlobalState(J.clippingPlanes,C.state.camera)):C=null,W.pop(),W.length>0?P=W[W.length-1]:P=null,_e!==null&&_e.renderEnd()};function Je(M,te,ae,xe){if(M.visible===!1)return;if(M.layers.test(te.layers)){if(M.isGroup)ae=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(te);else if(M.isLightProbeGrid)C.pushLightProbeGrid(M);else if(M.isLight)C.pushLight(M),M.castShadow&&C.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(H)){xe&&Ue.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Le);const ze=Ee.update(M),Oe=M.material;Oe.visible&&P.push(M,ze,Oe,ae,Ue.z,null,te)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(H))){const ze=Ee.update(M),Oe=M.material;if(xe&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ue.copy(M.boundingSphere.center)):(ze.boundingSphere===null&&ze.computeBoundingSphere(),Ue.copy(ze.boundingSphere.center)),Ue.applyMatrix4(M.matrixWorld).applyMatrix4(Le)),Array.isArray(Oe)){const Xe=ze.groups;for(let tt=0,ht=Xe.length;tt<ht;tt++){const ut=Xe[tt],Ve=Oe[ut.materialIndex];Ve&&Ve.visible&&P.push(M,ze,Ve,ae,Ue.z,ut,te)}}else Oe.visible&&P.push(M,ze,Oe,ae,Ue.z,null,te)}}const Pe=M.children;for(let ze=0,Oe=Pe.length;ze<Oe;ze++)Je(Pe[ze],te,ae,xe)}function vt(M,te,ae,xe){const{opaque:ue,transmissive:Pe,transparent:ze}=M;C.setupLightsView(ae),ve===!0&&d.setGlobalState(J.clippingPlanes,ae),xe&&x.viewport(T.copy(xe)),ue.length>0&&gt(ue,te,ae),Pe.length>0&&gt(Pe,te,ae),ze.length>0&&gt(ze,te,ae),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function mt(M,te,ae,xe){if((ae.isScene===!0?ae.overrideMaterial:null)!==null)return;if(C.state.transmissionRenderTarget[xe.id]===void 0){const Ve=Ae.has("EXT_color_buffer_half_float")||Ae.has("EXT_color_buffer_float");C.state.transmissionRenderTarget[xe.id]=new bn(1,1,{generateMipmaps:!0,type:Ve?Un:un,minFilter:si,samples:Math.max(4,L.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Et.workingColorSpace})}const Pe=C.state.transmissionRenderTarget[xe.id],ze=xe.viewport||T;Pe.setSize(ze.z*J.transmissionResolutionScale,ze.w*J.transmissionResolutionScale);const Oe=J.getRenderTarget(),Xe=J.getActiveCubeFace(),tt=J.getActiveMipmapLevel();J.setRenderTarget(Pe),J.getClearColor(k),Y=J.getClearAlpha(),Y<1&&J.setClearColor(16777215,.5),J.clear(),$e&&U.render(ae);const ht=J.toneMapping;J.toneMapping=In;const ut=xe.viewport;if(xe.viewport!==void 0&&(xe.viewport=void 0),C.setupLightsView(xe),ve===!0&&d.setGlobalState(J.clippingPlanes,xe),gt(M,ae,xe),ye.updateMultisampleRenderTarget(Pe),ye.updateRenderTargetMipmap(Pe),Ae.has("WEBGL_multisampled_render_to_texture")===!1){let Ve=!1;for(let At=0,Bt=te.length;At<Bt;At++){const Lt=te[At],{object:Pt,geometry:Kt,material:Ze,group:en}=Lt;if(Ze.side===Cn&&Pt.layers.test(xe.layers)){const Rt=Ze.side;Ze.side=sn,Ze.needsUpdate=!0,ie(Pt,ae,xe,Kt,Ze,en),Ze.side=Rt,Ze.needsUpdate=!0,Ve=!0}}Ve===!0&&(ye.updateMultisampleRenderTarget(Pe),ye.updateRenderTargetMipmap(Pe))}J.setRenderTarget(Oe,Xe,tt),J.setClearColor(k,Y),ut!==void 0&&(xe.viewport=ut),J.toneMapping=ht}function gt(M,te,ae){const xe=te.isScene===!0?te.overrideMaterial:null;for(let ue=0,Pe=M.length;ue<Pe;ue++){const ze=M[ue],{object:Oe,geometry:Xe,group:tt}=ze;let ht=ze.material;ht.allowOverride===!0&&xe!==null&&(ht=xe),Oe.layers.test(ae.layers)&&ie(Oe,te,ae,Xe,ht,tt)}}function ie(M,te,ae,xe,ue,Pe){_e!==null&&ue.isNodeMaterial&&_e.setObject(M,ue),M.onBeforeRender(J,te,ae,xe,ue,Pe),M.modelViewMatrix.multiplyMatrices(ae.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),ue.onBeforeRender(J,te,ae,xe,M,Pe),ue.transparent===!0&&ue.side===Cn&&ue.forceSinglePass===!1?(ue.side=sn,ue.needsUpdate=!0,J.renderBufferDirect(ae,te,xe,ue,M,Pe),ue.side=ai,ue.needsUpdate=!0,J.renderBufferDirect(ae,te,xe,ue,M,Pe),ue.side=Cn):J.renderBufferDirect(ae,te,xe,ue,M,Pe),M.onAfterRender(J,te,ae,xe,ue,Pe)}function Ie(M,te,ae){te.isScene!==!0&&(te=Ye);const xe=ge.get(M),ue=C.state.lights,Pe=C.state.shadowsArray,ze=ue.state.version,Oe=Fe.getParameters(M,ue.state,Pe,te,ae,C.state.lightProbeGridArray),Xe=Fe.getProgramCacheKey(Oe);let tt=xe.programs;xe.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?te.environment:null,xe.fog=te.fog;const ht=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;xe.envMap=Re.get(M.envMap||xe.environment,ht),xe.envMapRotation=xe.environment!==null&&M.envMap===null?te.environmentRotation:M.envMapRotation,tt===void 0&&(M.addEventListener("dispose",Ke),tt=new Map,xe.programs=tt);let ut=tt.get(Xe);if(ut!==void 0){if(xe.currentProgram===ut&&xe.lightsStateVersion===ze)return ft(M,Oe),ut}else Oe.uniforms=Fe.getUniforms(M),_e!==null&&M.isNodeMaterial&&_e.build(M,ae,Oe),M.onBeforeCompile(Oe,J),ut=Fe.acquireProgram(Oe,Xe),tt.set(Xe,ut),xe.uniforms=Oe.uniforms;const Ve=xe.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ve.clippingPlanes=d.uniform),ft(M,Oe),xe.needsLights=et(M),xe.lightsStateVersion=ze,xe.needsLights&&(Ve.ambientLightColor.value=ue.state.ambient,Ve.lightProbe.value=ue.state.probe,Ve.sunLights.value=ue.state.sun,Ve.sunLightShadows.value=ue.state.sunShadow,Ve.directionalLights.value=ue.state.directional,Ve.directionalLightShadows.value=ue.state.directionalShadow,Ve.spotLights.value=ue.state.spot,Ve.spotLightShadows.value=ue.state.spotShadow,Ve.rectAreaLights.value=ue.state.rectArea,Ve.ltc_1.value=ue.state.rectAreaLTC1,Ve.ltc_2.value=ue.state.rectAreaLTC2,Ve.pointLights.value=ue.state.point,Ve.pointLightShadows.value=ue.state.pointShadow,Ve.hemisphereLights.value=ue.state.hemi,Ve.sunShadowMatrix.value=ue.state.sunShadowMatrix,Ve.sunShadowCascade.value=ue.state.sunShadowCascade,Ve.directionalShadowMatrix.value=ue.state.directionalShadowMatrix,Ve.spotLightMatrix.value=ue.state.spotLightMatrix,Ve.spotLightMap.value=ue.state.spotLightMap,Ve.pointShadowMatrix.value=ue.state.pointShadowMatrix),xe.lightProbeGrid=C.state.lightProbeGridArray.length>0,xe.currentProgram=ut,xe.uniformsList=null,ut}function at(M){if(M.uniformsList===null){const te=M.currentProgram.getUniforms();M.uniformsList=ss.seqWithValue(te.seq,M.uniforms)}return M.uniformsList}function ft(M,te){const ae=ge.get(M);ae.outputColorSpace=te.outputColorSpace,ae.batching=te.batching,ae.batchingColor=te.batchingColor,ae.instancing=te.instancing,ae.instancingColor=te.instancingColor,ae.instancingMorph=te.instancingMorph,ae.skinning=te.skinning,ae.morphTargets=te.morphTargets,ae.morphNormals=te.morphNormals,ae.morphColors=te.morphColors,ae.morphTargetsCount=te.morphTargetsCount,ae.numClippingPlanes=te.numClippingPlanes,ae.numIntersection=te.numClipIntersection,ae.vertexAlphas=te.vertexAlphas,ae.vertexTangents=te.vertexTangents,ae.toneMapping=te.toneMapping}function qe(M,te){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;A.setFromMatrixPosition(te.matrixWorld);for(let ae=0,xe=M.length;ae<xe;ae++){const ue=M[ae];if(ue.texture!==null&&ue.boundingBox.containsPoint(A))return ue}return null}function De(M,te,ae,xe,ue){te.isScene!==!0&&(te=Ye),ye.resetTextureUnits();const Pe=te.fog,ze=xe.isMeshStandardMaterial||xe.isMeshLambertMaterial||xe.isMeshPhongMaterial?te.environment:null,Oe=re===null?J.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:Et.workingColorSpace,Xe=xe.isMeshStandardMaterial||xe.isMeshLambertMaterial&&!xe.envMap||xe.isMeshPhongMaterial&&!xe.envMap,tt=Re.get(xe.envMap||ze,Xe),ht=xe.vertexColors===!0&&!!ae.attributes.color&&ae.attributes.color.itemSize===4,ut=!!ae.attributes.tangent&&(!!xe.normalMap||xe.anisotropy>0),Ve=!!ae.morphAttributes.position,At=!!ae.morphAttributes.normal,Bt=!!ae.morphAttributes.color;let Lt=In;xe.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(Lt=J.toneMapping);const Pt=ae.morphAttributes.position||ae.morphAttributes.normal||ae.morphAttributes.color,Kt=Pt!==void 0?Pt.length:0,Ze=ge.get(xe),en=C.state.lights;if(ve===!0&&(we===!0||M!==R)){const Nt=M===R&&xe.id===K;d.setState(xe,M,Nt)}let Rt=!1;xe.version===Ze.__version?(Ze.needsLights&&Ze.lightsStateVersion!==en.state.version||Ze.outputColorSpace!==Oe||ue.isBatchedMesh&&Ze.batching===!1||!ue.isBatchedMesh&&Ze.batching===!0||ue.isBatchedMesh&&Ze.batchingColor===!0&&ue._colorsTexture===null||ue.isBatchedMesh&&Ze.batchingColor===!1&&ue._colorsTexture!==null||ue.isInstancedMesh&&Ze.instancing===!1||!ue.isInstancedMesh&&Ze.instancing===!0||ue.isSkinnedMesh&&Ze.skinning===!1||!ue.isSkinnedMesh&&Ze.skinning===!0||ue.isInstancedMesh&&Ze.instancingColor===!0&&ue.instanceColor===null||ue.isInstancedMesh&&Ze.instancingColor===!1&&ue.instanceColor!==null||ue.isInstancedMesh&&Ze.instancingMorph===!0&&ue.morphTexture===null||ue.isInstancedMesh&&Ze.instancingMorph===!1&&ue.morphTexture!==null||Ze.envMap!==tt||xe.fog===!0&&Ze.fog!==Pe||Ze.numClippingPlanes!==void 0&&(Ze.numClippingPlanes!==d.numPlanes||Ze.numIntersection!==d.numIntersection)||Ze.vertexAlphas!==ht||Ze.vertexTangents!==ut||Ze.morphTargets!==Ve||Ze.morphNormals!==At||Ze.morphColors!==Bt||Ze.toneMapping!==Lt||Ze.morphTargetsCount!==Kt||!!Ze.lightProbeGrid!=C.state.lightProbeGridArray.length>0)&&(Rt=!0):(Rt=!0,Ze.__version=xe.version);let hn=Ze.currentProgram;Rt===!0&&(hn=Ie(xe,te,ue),_e&&xe.isNodeMaterial&&_e.onUpdateProgram(xe,hn,Ze));let En=!1,Zn=!1,Ti=!1;const Dt=hn.getUniforms(),zt=Ze.uniforms;if(x.useProgram(hn.program)&&(En=!0,Zn=!0,Ti=!0),xe.id!==K&&(K=xe.id,Zn=!0),Ze.needsLights){const Nt=qe(C.state.lightProbeGridArray,ue);Ze.lightProbeGrid!==Nt&&(Ze.lightProbeGrid=Nt,Zn=!0)}if(En||R!==M){x.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Dt.setValue(Z,"projectionMatrix",M.projectionMatrix),Dt.setValue(Z,"viewMatrix",M.matrixWorldInverse);const Qn=Dt.map.cameraPosition;Qn!==void 0&&Qn.setValue(Z,Me.setFromMatrixPosition(M.matrixWorld)),L.logarithmicDepthBuffer&&Dt.setValue(Z,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(xe.isMeshPhongMaterial||xe.isMeshToonMaterial||xe.isMeshLambertMaterial||xe.isMeshBasicMaterial||xe.isMeshStandardMaterial||xe.isShaderMaterial)&&Dt.setValue(Z,"isOrthographic",M.isOrthographicCamera===!0),R!==M&&(R=M,Zn=!0,Ti=!0)}if(Ze.needsLights&&(en.state.sunShadowMap.length>0&&Dt.setValue(Z,"sunShadowMap",en.state.sunShadowMap,ye),en.state.directionalShadowMap.length>0&&Dt.setValue(Z,"directionalShadowMap",en.state.directionalShadowMap,ye),en.state.spotShadowMap.length>0&&Dt.setValue(Z,"spotShadowMap",en.state.spotShadowMap,ye),en.state.pointShadowMap.length>0&&Dt.setValue(Z,"pointShadowMap",en.state.pointShadowMap,ye)),ue.isSkinnedMesh){Dt.setOptional(Z,ue,"bindMatrix"),Dt.setOptional(Z,ue,"bindMatrixInverse");const Nt=ue.skeleton;Nt&&(Nt.boneTexture===null&&Nt.computeBoneTexture(),Dt.setValue(Z,"boneTexture",Nt.boneTexture,ye))}ue.isBatchedMesh&&(Dt.setOptional(Z,ue,"batchingTexture"),Dt.setValue(Z,"batchingTexture",ue._matricesTexture,ye),Dt.setOptional(Z,ue,"batchingIdTexture"),Dt.setValue(Z,"batchingIdTexture",ue._indirectTexture,ye),Dt.setOptional(Z,ue,"batchingColorTexture"),ue._colorsTexture!==null&&Dt.setValue(Z,"batchingColorTexture",ue._colorsTexture,ye));const Jn=ae.morphAttributes;if((Jn.position!==void 0||Jn.normal!==void 0||Jn.color!==void 0)&&E.update(ue,ae,hn),(Zn||Ze.receiveShadow!==ue.receiveShadow)&&(Ze.receiveShadow=ue.receiveShadow,Dt.setValue(Z,"receiveShadow",ue.receiveShadow)),(xe.isMeshStandardMaterial||xe.isMeshLambertMaterial||xe.isMeshPhongMaterial)&&xe.envMap===null&&te.environment!==null&&(zt.envMapIntensity.value=te.environmentIntensity),zt.dfgLUT!==void 0&&(zt.dfgLUT.value=Bm()),Zn){if(Dt.setValue(Z,"toneMappingExposure",J.toneMappingExposure),Ze.needsLights&&We(zt,Ti),Pe&&xe.fog===!0&&nt.refreshFogUniforms(zt,Pe),nt.refreshMaterialUniforms(zt,xe,O,D,C.state.transmissionRenderTarget[M.id]),Ze.needsLights&&Ze.lightProbeGrid){const Nt=Ze.lightProbeGrid;zt.probesSH.value=Nt.texture,zt.probesMin.value.copy(Nt.boundingBox.min),zt.probesMax.value.copy(Nt.boundingBox.max),zt.probesResolution.value.copy(Nt.resolution)}ss.upload(Z,at(Ze),zt,ye)}if(xe.isShaderMaterial&&xe.uniformsNeedUpdate===!0&&(ss.upload(Z,at(Ze),zt,ye),xe.uniformsNeedUpdate=!1),xe.isSpriteMaterial&&Dt.setValue(Z,"center",ue.center),Dt.setValue(Z,"modelViewMatrix",ue.modelViewMatrix),Dt.setValue(Z,"normalMatrix",ue.normalMatrix),Dt.setValue(Z,"modelMatrix",ue.matrixWorld),xe.uniformsGroups!==void 0){const Nt=xe.uniformsGroups;for(let Qn=0,Ai=Nt.length;Qn<Ai;Qn++){const _a=Nt[Qn];ee.update(_a,hn),ee.bind(_a,hn)}}return hn}function We(M,te){M.ambientLightColor.needsUpdate=te,M.lightProbe.needsUpdate=te,M.sunLights.needsUpdate=te,M.sunLightShadows.needsUpdate=te,M.directionalLights.needsUpdate=te,M.directionalLightShadows.needsUpdate=te,M.pointLights.needsUpdate=te,M.pointLightShadows.needsUpdate=te,M.spotLights.needsUpdate=te,M.spotLightShadows.needsUpdate=te,M.rectAreaLights.needsUpdate=te,M.hemisphereLights.needsUpdate=te}function et(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return g},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return re},this.setRenderTargetTextures=function(M,te,ae){const xe=ge.get(M);xe.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,xe.__autoAllocateDepthBuffer===!1&&(xe.__useRenderToTexture=!1),ge.get(M.texture).__webglTexture=te,ge.get(M.depthTexture).__webglTexture=xe.__autoAllocateDepthBuffer?void 0:ae,xe.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,te){const ae=ge.get(M);ae.__webglFramebuffer=te,ae.__useDefaultFramebuffer=te===void 0},this.setRenderTarget=function(M,te=0,ae=0){re=M,g=te,z=ae;let xe=null,ue=!1,Pe=!1;if(M){const Oe=ge.get(M);if(Oe.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(Z.FRAMEBUFFER,Oe.__webglFramebuffer),T.copy(M.viewport),F.copy(M.scissor),Q=M.scissorTest,x.viewport(T),x.scissor(F),x.setScissorTest(Q),K=-1;return}else if(Oe.__webglFramebuffer===void 0)ye.setupRenderTarget(M);else if(Oe.__hasExternalTextures)ye.rebindTextures(M,ge.get(M.texture).__webglTexture,ge.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const ht=M.depthTexture;if(Oe.__boundDepthTexture!==ht){if(ht!==null&&ge.has(ht)&&(M.width!==ht.image.width||M.height!==ht.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ye.setupDepthRenderbuffer(M)}}const Xe=M.texture;(Xe.isData3DTexture||Xe.isDataArrayTexture||Xe.isCompressedArrayTexture)&&(Pe=!0);const tt=ge.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(tt[te])?xe=tt[te][ae]:xe=tt[te],ue=!0):M.samples>0&&ye.useMultisampledRTT(M)===!1?xe=ge.get(M).__webglMultisampledFramebuffer:Array.isArray(tt)?xe=tt[ae]:xe=tt,T.copy(M.viewport),F.copy(M.scissor),Q=M.scissorTest}else T.copy(V).multiplyScalar(O).floor(),F.copy(le).multiplyScalar(O).floor(),Q=Se;if(ae!==0&&(xe=me),x.bindFramebuffer(Z.FRAMEBUFFER,xe)&&x.drawBuffers(M,xe),x.viewport(T),x.scissor(F),x.setScissorTest(Q),ue){const Oe=ge.get(M.texture);Z.framebufferTexture2D(Z.FRAMEBUFFER,Z.COLOR_ATTACHMENT0,Z.TEXTURE_CUBE_MAP_POSITIVE_X+te,Oe.__webglTexture,ae)}else if(Pe){const Oe=te;for(let Xe=0;Xe<M.textures.length;Xe++){const tt=ge.get(M.textures[Xe]);Z.framebufferTextureLayer(Z.FRAMEBUFFER,Z.COLOR_ATTACHMENT0+Xe,tt.__webglTexture,ae,Oe)}}else if(M!==null&&ae!==0){const Oe=ge.get(M.texture);Z.framebufferTexture2D(Z.FRAMEBUFFER,Z.COLOR_ATTACHMENT0,Z.TEXTURE_2D,Oe.__webglTexture,ae)}K=-1};function _t(M){const te=ge.get(M);return(te.__readFormat!==M.format||te.__readType!==M.type)&&(te.__readFormat=M.format,te.__readType=M.type,te.__formatReadable=L.textureFormatReadable(M.format),te.__typeReadable=L.textureTypeReadable(M.type)),te}this.readRenderTargetPixels=function(M,te,ae,xe,ue,Pe,ze,Oe=0){if(!(M&&M.isWebGLRenderTarget)){Ct("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Xe=ge.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ze!==void 0&&(Xe=Xe[ze]),Xe){x.bindFramebuffer(Z.FRAMEBUFFER,Xe);try{const tt=M.textures[Oe],ht=tt.format,ut=tt.type;M.textures.length>1&&Z.readBuffer(Z.COLOR_ATTACHMENT0+Oe);const Ve=_t(tt);if(Ve.__formatReadable===!1){Ct("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ve.__typeReadable===!1){Ct("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}te>=0&&te<=M.width-xe&&ae>=0&&ae<=M.height-ue&&Z.readPixels(te,ae,xe,ue,oe.convert(ht),oe.convert(ut),Pe)}finally{const tt=re!==null?ge.get(re).__webglFramebuffer:null;x.bindFramebuffer(Z.FRAMEBUFFER,tt)}}},this.readRenderTargetPixelsAsync=async function(M,te,ae,xe,ue,Pe,ze,Oe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Xe=ge.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ze!==void 0&&(Xe=Xe[ze]),Xe)if(te>=0&&te<=M.width-xe&&ae>=0&&ae<=M.height-ue){x.bindFramebuffer(Z.FRAMEBUFFER,Xe);const tt=M.textures[Oe],ht=tt.format,ut=tt.type;M.textures.length>1&&Z.readBuffer(Z.COLOR_ATTACHMENT0+Oe);const Ve=_t(tt);if(Ve.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ve.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const At=Z.createBuffer();Z.bindBuffer(Z.PIXEL_PACK_BUFFER,At),Z.bufferData(Z.PIXEL_PACK_BUFFER,Pe.byteLength,Z.STREAM_READ),Z.readPixels(te,ae,xe,ue,oe.convert(ht),oe.convert(ut),0),Z.bindBuffer(Z.PIXEL_PACK_BUFFER,null);const Bt=re!==null?ge.get(re).__webglFramebuffer:null;x.bindFramebuffer(Z.FRAMEBUFFER,Bt);const Lt=Z.fenceSync(Z.SYNC_GPU_COMMANDS_COMPLETE,0);return Z.flush(),await Du(Z,Lt,4),Z.bindBuffer(Z.PIXEL_PACK_BUFFER,At),Z.getBufferSubData(Z.PIXEL_PACK_BUFFER,0,Pe),Z.bindBuffer(Z.PIXEL_PACK_BUFFER,null),Z.deleteBuffer(At),Z.deleteSync(Lt),Pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,te=null,ae=0){const xe=Math.pow(2,-ae),ue=Math.floor(M.image.width*xe),Pe=Math.floor(M.image.height*xe),ze=te!==null?te.x:0,Oe=te!==null?te.y:0;ye.setTexture2D(M,0),Z.copyTexSubImage2D(Z.TEXTURE_2D,ae,0,0,ze,Oe,ue,Pe),x.unbindTexture()},this.copyTextureToTexture=function(M,te,ae=null,xe=null,ue=0,Pe=0){let ze,Oe,Xe,tt,ht,ut,Ve,At,Bt;const Lt=M.isCompressedTexture?M.mipmaps[Pe]:M.image;if(ae!==null)ze=ae.max.x-ae.min.x,Oe=ae.max.y-ae.min.y,Xe=ae.isBox3?ae.max.z-ae.min.z:1,tt=ae.min.x,ht=ae.min.y,ut=ae.isBox3?ae.min.z:0;else{const zt=Math.pow(2,-ue);ze=Math.floor(Lt.width*zt),Oe=Math.floor(Lt.height*zt),M.isDataArrayTexture?Xe=Lt.depth:M.isData3DTexture?Xe=Math.floor(Lt.depth*zt):Xe=1,tt=0,ht=0,ut=0}xe!==null?(Ve=xe.x,At=xe.y,Bt=xe.z):(Ve=0,At=0,Bt=0);const Pt=oe.convert(te.format),Kt=oe.convert(te.type);let Ze;te.isData3DTexture?(ye.setTexture3D(te,0),Ze=Z.TEXTURE_3D):te.isDataArrayTexture||te.isCompressedArrayTexture?(ye.setTexture2DArray(te,0),Ze=Z.TEXTURE_2D_ARRAY):(ye.setTexture2D(te,0),Ze=Z.TEXTURE_2D),x.activeTexture(Z.TEXTURE0),x.pixelStorei(Z.UNPACK_FLIP_Y_WEBGL,te.flipY),x.pixelStorei(Z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,te.premultiplyAlpha),x.pixelStorei(Z.UNPACK_ALIGNMENT,te.unpackAlignment);const en=x.getParameter(Z.UNPACK_ROW_LENGTH),Rt=x.getParameter(Z.UNPACK_IMAGE_HEIGHT),hn=x.getParameter(Z.UNPACK_SKIP_PIXELS),En=x.getParameter(Z.UNPACK_SKIP_ROWS),Zn=x.getParameter(Z.UNPACK_SKIP_IMAGES);x.pixelStorei(Z.UNPACK_ROW_LENGTH,Lt.width),x.pixelStorei(Z.UNPACK_IMAGE_HEIGHT,Lt.height),x.pixelStorei(Z.UNPACK_SKIP_PIXELS,tt),x.pixelStorei(Z.UNPACK_SKIP_ROWS,ht),x.pixelStorei(Z.UNPACK_SKIP_IMAGES,ut);const Ti=M.isDataArrayTexture||M.isData3DTexture,Dt=te.isDataArrayTexture||te.isData3DTexture;if(M.isDepthTexture){const zt=ge.get(M),Jn=ge.get(te),Nt=ge.get(zt.__renderTarget),Qn=ge.get(Jn.__renderTarget);x.bindFramebuffer(Z.READ_FRAMEBUFFER,Nt.__webglFramebuffer),x.bindFramebuffer(Z.DRAW_FRAMEBUFFER,Qn.__webglFramebuffer);for(let Ai=0;Ai<Xe;Ai++)Ti&&(Z.framebufferTextureLayer(Z.READ_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,ge.get(M).__webglTexture,ue,ut+Ai),Z.framebufferTextureLayer(Z.DRAW_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,ge.get(te).__webglTexture,Pe,Bt+Ai)),Z.blitFramebuffer(tt,ht,ze,Oe,Ve,At,ze,Oe,Z.DEPTH_BUFFER_BIT,Z.NEAREST);x.bindFramebuffer(Z.READ_FRAMEBUFFER,null),x.bindFramebuffer(Z.DRAW_FRAMEBUFFER,null)}else if(ue!==0||M.isRenderTargetTexture||ge.has(M)){const zt=ge.get(M),Jn=ge.get(te);x.bindFramebuffer(Z.READ_FRAMEBUFFER,w),x.bindFramebuffer(Z.DRAW_FRAMEBUFFER,G);for(let Nt=0;Nt<Xe;Nt++)Ti?Z.framebufferTextureLayer(Z.READ_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,zt.__webglTexture,ue,ut+Nt):Z.framebufferTexture2D(Z.READ_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,Z.TEXTURE_2D,zt.__webglTexture,ue),Dt?Z.framebufferTextureLayer(Z.DRAW_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,Jn.__webglTexture,Pe,Bt+Nt):Z.framebufferTexture2D(Z.DRAW_FRAMEBUFFER,Z.COLOR_ATTACHMENT0,Z.TEXTURE_2D,Jn.__webglTexture,Pe),ue!==0?Z.blitFramebuffer(tt,ht,ze,Oe,Ve,At,ze,Oe,Z.COLOR_BUFFER_BIT,Z.NEAREST):Dt?Z.copyTexSubImage3D(Ze,Pe,Ve,At,Bt+Nt,tt,ht,ze,Oe):Z.copyTexSubImage2D(Ze,Pe,Ve,At,tt,ht,ze,Oe);x.bindFramebuffer(Z.READ_FRAMEBUFFER,null),x.bindFramebuffer(Z.DRAW_FRAMEBUFFER,null)}else Dt?M.isDataTexture||M.isData3DTexture?Z.texSubImage3D(Ze,Pe,Ve,At,Bt,ze,Oe,Xe,Pt,Kt,Lt.data):te.isCompressedArrayTexture?Z.compressedTexSubImage3D(Ze,Pe,Ve,At,Bt,ze,Oe,Xe,Pt,Lt.data):Z.texSubImage3D(Ze,Pe,Ve,At,Bt,ze,Oe,Xe,Pt,Kt,Lt):M.isDataTexture?Z.texSubImage2D(Z.TEXTURE_2D,Pe,Ve,At,ze,Oe,Pt,Kt,Lt.data):M.isCompressedTexture?Z.compressedTexSubImage2D(Z.TEXTURE_2D,Pe,Ve,At,Lt.width,Lt.height,Pt,Lt.data):Z.texSubImage2D(Z.TEXTURE_2D,Pe,Ve,At,ze,Oe,Pt,Kt,Lt);x.pixelStorei(Z.UNPACK_ROW_LENGTH,en),x.pixelStorei(Z.UNPACK_IMAGE_HEIGHT,Rt),x.pixelStorei(Z.UNPACK_SKIP_PIXELS,hn),x.pixelStorei(Z.UNPACK_SKIP_ROWS,En),x.pixelStorei(Z.UNPACK_SKIP_IMAGES,Zn),Pe===0&&te.generateMipmaps&&Z.generateMipmap(Ze),x.unbindTexture()},this.initRenderTarget=function(M){ge.get(M).__webglFramebuffer===void 0&&ye.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?ye.setTextureCube(M,0):M.isData3DTexture?ye.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?ye.setTexture2DArray(M,0):ye.setTexture2D(M,0),x.unbindTexture()},this.resetState=function(){g=0,z=0,re=null,x.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ln}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Et._getDrawingBufferColorSpace(e),t.unpackColorSpace=Et._getUnpackColorSpace()}}var Ot;(n=>{n.create=(t=0,i=0,r=0)=>({x:t,y:i,z:r}),n.add=(t,i)=>({x:t.x+i.x,y:t.y+i.y,z:t.z+i.z}),n.subtract=(t,i)=>({x:t.x-i.x,y:t.y-i.y,z:t.z-i.z}),n.scale=(t,i)=>({x:t.x*i,y:t.y*i,z:t.z*i}),n.dot=(t,i)=>t.x*i.x+t.y*i.y+t.z*i.z,n.cross=(t,i)=>({x:t.y*i.z-t.z*i.y,y:t.z*i.x-t.x*i.z,z:t.x*i.y-t.y*i.x}),n.length=t=>e(t)===0?Math.sqrt((0,n.dot)(t,t)):Math.hypot(t.x,t.y,t.z),n.normalize=t=>{const i=e(t),r=i===0?t:{x:t.x/i,y:t.y/i,z:t.z/i},s=(0,n.length)(r);return s===0?(0,n.create)(0,0,0):(0,n.scale)(r,1/s)};const e=t=>{const i=Math.max(Math.abs(t.x),Math.abs(t.y),Math.abs(t.z));return Number.isFinite(i)&&i>0&&(i<2**-511||i>2**511)?i:0};n.lerp=(t,i,r)=>({x:t.x+(i.x-t.x)*r,y:t.y+(i.y-t.y)*r,z:t.z+(i.z-t.z)*r})})(Ot||(Ot={}));const km=(n,e)=>{const t=Math.trunc(n),i=t>>>0,r=Math.floor(t/4294967296)>>>0;let s=(e^i)>>>0;return s=Math.imul(s^s>>>16,2146121005),s=Math.imul(s^s>>>15^r,2221713035),(s^s>>>16)>>>0},rn=(...n)=>{let e=2654435769;for(const i of n)e=km(i,e);e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296};var Mi;(n=>{n.identity=()=>({x:0,y:0,z:0,w:1}),n.DEG2RAD=Math.PI/180,n.multiply=(e,t)=>({x:e.w*t.x+e.x*t.w+e.y*t.z-e.z*t.y,y:e.w*t.y-e.x*t.z+e.y*t.w+e.z*t.x,z:e.w*t.z+e.x*t.y-e.y*t.x+e.z*t.w,w:e.w*t.w-e.x*t.x-e.y*t.y-e.z*t.z}),n.normalize=e=>{const t=Math.sqrt(e.x*e.x+e.y*e.y+e.z*e.z+e.w*e.w);if(t===0)return(0,n.identity)();const i=1/t;return{x:e.x*i,y:e.y*i,z:e.z*i,w:e.w*i}},n.inverse=e=>(0,n.normalize)({x:-e.x,y:-e.y,z:-e.z,w:e.w}),n.fromAxisAngle=(e,t)=>{const i=Math.sqrt(e.x*e.x+e.y*e.y+e.z*e.z);if(i===0)return(0,n.identity)();const r=t*n.DEG2RAD/2,s=Math.sin(r)/i;return{x:e.x*s,y:e.y*s,z:e.z*s,w:Math.cos(r)}},n.fromEuler=e=>{const t=r=>r==="X"?{x:1,y:0,z:0}:r==="Y"?{x:0,y:1,z:0}:{x:0,y:0,z:1},i=r=>r==="X"?e.x:r==="Y"?e.y:e.z;return e.order.split("").map(r=>(0,n.fromAxisAngle)(t(r),i(r))).reduce((r,s)=>(0,n.multiply)(r,s),(0,n.identity)())},n.rotateVector=(e,t)=>{const i=2*(e.y*t.z-e.z*t.y),r=2*(e.z*t.x-e.x*t.z),s=2*(e.x*t.y-e.y*t.x);return{x:t.x+e.w*i+(e.y*s-e.z*r),y:t.y+e.w*r+(e.z*i-e.x*s),z:t.z+e.w*s+(e.x*r-e.y*i)}},n.slerp=(e,t,i)=>{let r=e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w,s=t.x,o=t.y,a=t.z,l=t.w;if(r<0&&(r=-r,s=-s,o=-o,a=-a,l=-l),r>.9995)return(0,n.normalize)({x:e.x+(s-e.x)*i,y:e.y+(o-e.y)*i,z:e.z+(a-e.z)*i,w:e.w+(l-e.w)*i});const c=Math.acos(r),u=Math.sin(c),h=Math.sin((1-i)*c)/u,f=Math.sin(i*c)/u;return{x:e.x*h+s*f,y:e.y*h+o*f,z:e.z*h+a*f,w:e.w*h+l*f}}})(Mi||(Mi={}));var Tl;(n=>{n.identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],n.compose=(e,t,i)=>{const r=t.x+t.x,s=t.y+t.y,o=t.z+t.z,a=t.x*r,l=t.x*s,c=t.x*o,u=t.y*s,h=t.y*o,f=t.z*o,p=t.w*r,v=t.w*s,b=t.w*o;return[(1-(u+f))*i.x,(l+b)*i.x,(c-v)*i.x,0,(l-b)*i.y,(1-(a+f))*i.y,(h+p)*i.y,0,(c+v)*i.z,(h-p)*i.z,(1-(a+u))*i.z,0,e.x,e.y,e.z,1]},n.multiply=(e,t)=>{const i=new Array(16);for(let r=0;r<4;++r)for(let s=0;s<4;++s){let o=0;for(let a=0;a<4;++a)o+=e[a*4+s]*t[r*4+a];i[r*4+s]=o}return i},n.position=e=>({x:e[12],y:e[13],z:e[14]}),n.decompose=e=>{const t=Math.hypot(e[0],e[1],e[2]),i=Math.hypot(e[4],e[5],e[6]),r=Math.hypot(e[8],e[9],e[10]),s=Math.max(t,Number.EPSILON),o=Math.max(i,Number.EPSILON),a=Math.max(r,Number.EPSILON),l=e[0]/s,c=e[1]/s,u=e[2]/s,h=e[4]/o,f=e[5]/o,p=e[6]/o,v=e[8]/a,b=e[9]/a,_=e[10]/a,m=l+f+_;let I,ne,A,P;if(m>0){const C=.5/Math.sqrt(m+1);P=.25/C,I=(p-b)*C,ne=(v-u)*C,A=(c-h)*C}else if(l>f&&l>_){const C=2*Math.sqrt(1+l-f-_);P=(p-b)/C,I=.25*C,ne=(h+c)/C,A=(v+u)/C}else if(f>_){const C=2*Math.sqrt(1+f-l-_);P=(v-u)/C,I=(h+c)/C,ne=.25*C,A=(b+p)/C}else{const C=2*Math.sqrt(1+_-l-f);P=(c-h)/C,I=(v+u)/C,ne=(b+p)/C,A=.25*C}return{position:{x:e[12],y:e[13],z:e[14]},rotation:{x:I,y:ne,z:A,w:P},scale:{x:t,y:i,z:r}}}})(Tl||(Tl={}));const Gm=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,Hm=n=>{const e=Gm.exec(n);if(e===null)throw new Error(`sRGB color "${n}" is not one opaque six-digit #RRGGBB swatch.`);const t={r:js(Number.parseInt(e[1],16)/255),g:js(Number.parseInt(e[2],16)/255),b:js(Number.parseInt(e[3],16)/255)};return{...t,a:1,hex:Vm(t)}},Vm=n=>`#${Qs(n.r)}${Qs(n.g)}${Qs(n.b)}`,Qs=n=>{if(Number.isFinite(n)===!1)throw new Error(`Linear color component ${n} is not a finite number.`);return Math.round(Wm(Math.min(1,Math.max(0,n)))*255).toString(16).padStart(2,"0")},js=n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4),Wm=n=>n<=.0031308?n*12.92:1.055*Math.pow(n,1/2.4)-.055,Ic=n=>{switch(n.type){case"box":return Al(n.width,n.height,n.depth);case"plane":return Al(n.width,0,n.depth);case"sphere":return Xm(n.radius,16,12);case"cylinder":return eo(n.radius,n.radius,n.height,16);case"cone":return eo(n.radius,0,n.height,16);case"capsule":return eo(n.radius,n.radius,n.height+2*n.radius,16);default:{const e=n;throw new Error(`unknown primitive shape "${String(e.type)}"`)}}},Al=(n,e,t)=>{const i=n/2,r=e/2,s=t/2,o=[],a=[],l=[],c=[[[i,-r,-s,i,r,-s,i,r,s,i,-r,s],[1,0,0]],[[-i,-r,s,-i,r,s,-i,r,-s,-i,-r,-s],[-1,0,0]],[[-i,r,-s,-i,r,s,i,r,s,i,r,-s],[0,1,0]],[[-i,-r,s,-i,-r,-s,i,-r,-s,i,-r,s],[0,-1,0]],[[-i,-r,s,i,-r,s,i,r,s,-i,r,s],[0,0,1]],[[i,-r,-s,-i,-r,-s,-i,r,-s,i,r,-s],[0,0,-1]]];for(const[u,h]of c){const f=o.length/3;for(let p=0;p<4;++p)o.push(u[p*3],u[p*3+1],u[p*3+2]),a.push(h[0],h[1],h[2]);l.push(f,f+1,f+2,f,f+2,f+3)}return{positions:o,normals:a,indices:l}},Xm=(n,e,t)=>{const i=[],r=[],s=[];for(let a=0;a<=t;++a){const l=a/t*Math.PI,c=Math.sin(l),u=Math.cos(l);for(let h=0;h<=e;++h){const f=h/e*Math.PI*2,p=c*Math.cos(f),v=u,b=c*Math.sin(f);r.push(p,v,b),i.push(p*n,v*n,b*n)}}const o=e+1;for(let a=0;a<t;++a)for(let l=0;l<e;++l){const c=a*o+l,u=c+o;s.push(c,c+1,u,c+1,u+1,u)}return{positions:i,normals:r,indices:s}},eo=(n,e,t,i)=>{const r=[],s=[],o=[],a=t/2,l=Math.hypot(t,e-n),c=t/l,u=(e-n)/l;for(let f=0;f<=i;++f){const p=f/i*Math.PI*2,v=Math.cos(p),b=Math.sin(p);r.push(v*n,a,b*n),s.push(v*c,u,b*c),r.push(v*e,-a,b*e),s.push(v*c,u,b*c)}for(let f=0;f<i;++f){const p=f*2;o.push(p,p+2,p+1,p+2,p+3,p+1)}const h=(f,p,v)=>{if(f<=0)return;const b=r.length/3;r.push(0,p,0),s.push(0,v,0);for(let _=0;_<=i;++_){const m=_/i*Math.PI*2;r.push(Math.cos(m)*f,p,Math.sin(m)*f),s.push(0,v,0)}for(let _=0;_<i;++_){const m=b+1+_;v===1?o.push(b,m+1,m):o.push(b,m,m+1)}};return h(n,a,1),h(e,-a,-1),{positions:r,normals:s,indices:o}},oi=1e-12,qm=n=>{const e=n.label??"polygon",t=n.holes??[],i=[`${e} outer ring`,...t.map((s,o)=>`${e} hole[${o}]`)],r=[n.outer,...t];for(let s=0;s<r.length;++s){const o=Ym(r[s],i[s]);if(o!==null)return o}for(let s=0;s+1<r.length;++s)for(let o=s+1;o<r.length;++o){const a=r[s],l=r[o];for(let c=0;c<a.length;++c)for(let u=0;u<l.length;++u)if(Dc(a[c],a[(c+1)%a.length],l[u],l[(u+1)%l.length]))return`${i[s]} and ${i[o]} touch or cross at edge ${c} and edge ${u}`}for(let s=1;s<r.length;++s){const o=r[s][0];if(Cl(o,r[0])===!1)return`${i[s]} must lie inside ${i[0]}`;for(let a=1;a<r.length;++a)if(a!==s&&Cl(o,r[a]))return`${i[s]} must lie outside ${i[a]}`}return null},Ym=(n,e)=>{if(n.length<3)return`${e} needs at least three points`;for(let i=0;i<n.length;++i){const r=n[i];if(!Number.isFinite(r.x)||!Number.isFinite(r.y))return`${e}[${i}] must be finite`}const t=n.length;for(let i=0;i<t;++i){const r=n[i],s=n[(i+1)%t];if(Math.hypot(s.x-r.x,s.y-r.y)<=oi)return`${e}[${i}] repeats the point beside it`}if(Math.abs(Zm(n))<=oi)return`${e} encloses no area`;for(let i=0;i<t;++i){const r=n[(i+t-1)%t],s=n[i],o=n[(i+1)%t];if(Math.abs(qi(r,s,o))<=oi&&(s.x-r.x)*(o.x-s.x)+(s.y-r.y)*(o.y-s.y)<0)return`${e}[${i}] doubles back along its own edge`}return $m(n,e)},$m=(n,e)=>{for(let t=0;t<n.length;++t)for(let i=t+1;i<n.length;++i)if(Km(n.length,t,i)===!1&&Dc(n[t],n[(t+1)%n.length],n[i],n[(i+1)%n.length]))return`${e} crosses itself between edge ${t} and edge ${i}`;return null},Km=(n,e,t)=>(e+1)%n===t||(t+1)%n===e,Zm=n=>{let e=0;for(let t=0;t<n.length;++t){const i=n[t],r=n[(t+1)%n.length];e+=i.x*r.y-r.x*i.y}return e/2},qi=(n,e,t)=>(e.x-n.x)*(t.y-n.y)-(e.y-n.y)*(t.x-n.x),Dc=(n,e,t,i)=>Rl(qi(t,i,n),qi(t,i,e))&&Rl(qi(n,e,t),qi(n,e,i))?!0:[[t,i,n],[t,i,e],[n,e,t],[n,e,i]].some(([s,o,a])=>{if(Math.abs(qi(s,o,a))>oi)return!1;const l=o.x-s.x,c=o.y-s.y,u=((a.x-s.x)*l+(a.y-s.y)*c)/(l*l+c*c);return u>=-oi&&u<=1+oi}),Rl=(n,e)=>Math.abs(n)>oi&&Math.abs(e)>oi&&n*e<0,Cl=(n,e)=>{let t=!1;for(let i=0;i<e.length;++i){const r=e[i],s=e[(i+1)%e.length];r.y>n.y!=s.y>n.y&&n.x<r.x+(n.y-r.y)/(s.y-r.y)*(s.x-r.x)&&(t=!t)}return t},Jm={left:0,top:0,right:1,bottom:1},Qm=n=>{const e=n??Jm;if([e.left,e.top,e.right,e.bottom].every(t=>Number.isFinite(t)&&t>=0&&t<=1)===!1||e.left>=e.right||e.top>=e.bottom)throw new RangeError("Delivery crop edges must be finite, normalized to [0, 1], and ordered left < right and top < bottom.");return{...e}},Uc=n=>`automovie:model:${n}`,jm=n=>{if(n.lod.length===0)throw new Error("A compiled formation requires at least one LOD tier.");const e=Math.max(1,n.projectedPixels),t=n.distance*(24/e),i=n.lod.findIndex(a=>a.maxDistance===null||t<=a.maxDistance),r=i<0?n.lod.length-1:i,s=n.lod.findIndex(a=>a.tier===n.previous);if(s<0||s===r)return{lod:n.lod[r],effectiveDistance:t};const o=n.hysteresis??.1;if(r>s){const a=n.lod[s].maxDistance;if(t<=a*(1+o))return{lod:n.lod[s],effectiveDistance:t}}else{const a=n.lod[r].maxDistance;if(t>=a*(1-o))return{lod:n.lod[s],effectiveDistance:t}}return{lod:n.lod[r],effectiveDistance:t}};(()=>{const n={flexion:{x:0,y:1,z:0},abduction:{x:0,y:0,z:1},twist:{x:1,y:0,z:0}},e=["leftShoulder","leftUpperArm","leftLowerArm","leftHand","rightShoulder","rightUpperArm","rightLowerArm","rightHand"],t={};for(const i of e)t[i]=n;return t})();const eg=[{effector:"leftFoot",upper:"leftUpperLeg",lower:"leftLowerLeg"},{effector:"rightFoot",upper:"rightUpperLeg",lower:"rightLowerLeg"}];eg.map(n=>({foot:n.effector,upper:n.upper,lower:n.lower}));const Qe=(n,e)=>({bone:n,flexion:e.flexion??null,abduction:e.abduction??null,twist:e.twist??null});Qe("spine",{flexion:0}),Qe("head",{flexion:0}),Qe("spine",{flexion:50}),Qe("head",{flexion:15}),Qe("spine",{flexion:50}),Qe("head",{flexion:15}),Qe("spine",{flexion:0}),Qe("head",{flexion:0}),Qe("head",{flexion:0}),Qe("head",{flexion:22}),Qe("head",{flexion:2}),Qe("head",{flexion:22}),Qe("head",{flexion:0}),Qe("head",{twist:0}),Qe("head",{twist:30}),Qe("head",{twist:-30}),Qe("head",{twist:30}),Qe("head",{twist:0}),Kr(0),Kr(1),Kr(1),Kr(0),Qe("rightUpperLeg",{flexion:55}),Qe("rightLowerLeg",{flexion:75}),Qe("spine",{flexion:-6}),Qe("rightUpperLeg",{flexion:68}),Qe("rightLowerLeg",{flexion:6}),Qe("spine",{flexion:-8}),Qe("rightUpperLeg",{flexion:52}),Qe("rightLowerLeg",{flexion:72}),Qe("spine",{flexion:-5}),Qe("spine",{flexion:18,abduction:24}),Qe("rightUpperLeg",{flexion:30}),Qe("rightLowerLeg",{flexion:22}),Qe("spine",{flexion:6,abduction:-20}),Qe("leftUpperLeg",{flexion:24}),Qe("leftLowerLeg",{flexion:16}),Qe("spine",{flexion:8,abduction:6}),$r(0),$r(55),$r(12),$r(55),to(1),to(1.1),to(1),Pl(),Pl(),Qe("leftUpperArm",{flexion:86,abduction:8}),Qe("rightUpperArm",{abduction:70,flexion:34}),Qe("rightLowerArm",{flexion:30}),Qe("rightUpperArm",{abduction:92,flexion:-46}),Qe("rightLowerArm",{flexion:108}),Qe("leftUpperArm",{abduction:18,flexion:62}),Qe("leftLowerArm",{flexion:16}),Qe("spine",{flexion:-8,twist:-22}),Qe("rightUpperArm",{abduction:104,flexion:60}),Qe("rightLowerArm",{flexion:16}),Qe("leftUpperArm",{abduction:24,flexion:-22}),Qe("leftLowerArm",{flexion:24}),Qe("spine",{flexion:16,twist:16}),Qe("rightUpperArm",{abduction:62,flexion:30}),Qe("rightLowerArm",{flexion:36}),Qe("leftUpperArm",{abduction:20,flexion:-10}),Qe("spine",{flexion:12,twist:4});function to(n){return[Qe("leftUpperArm",{abduction:150*n,flexion:10}),Qe("rightUpperArm",{abduction:150*n,flexion:10})]}function Pl(){return[Qe("leftUpperArm",{flexion:88,abduction:8}),Qe("leftLowerArm",{flexion:8}),Qe("rightUpperArm",{abduction:84,flexion:24}),Qe("rightLowerArm",{flexion:118}),Qe("head",{twist:12})]}function $r(n){return[Qe("rightUpperArm",{abduction:132,flexion:6}),Qe("rightLowerArm",{flexion:n}),Qe("leftUpperArm",{abduction:14})]}function Kr(n){return[Qe("leftUpperLeg",{flexion:55*n}),Qe("rightUpperLeg",{flexion:55*n}),Qe("leftLowerLeg",{flexion:65*n}),Qe("rightLowerLeg",{flexion:65*n}),Qe("spine",{flexion:15*n})]}const tg=(n,e)=>{if(!Number.isFinite(n.x)||!Number.isFinite(n.y))throw new Error(`${e} must be finite`)},ng=(n,e)=>{if(![n.x,n.y,n.z].every(Number.isFinite))throw new Error(`${e} must be finite`)},ig=(n,e)=>{if(!Number.isFinite(n)||n<=0)throw new Error(`${e} must be a finite number > 0`)},rg=(n,e,t)=>{if(!Number.isSafeInteger(n)||n<e)throw new Error(`${t} must be a safe integer >= ${e}`)},sg=()=>({positions:[],normals:[],uvs:[],indices:[]}),og=(n,e,t=null,i=[])=>({positions:n,normals:ag(n,e,i),uvs:t,indices:e,skin:null}),ag=(n,e,t=[])=>{const i=new Array(n.length).fill(0);for(let r=0;r<e.length;r+=3){const s=e[r]*3,o=e[r+1]*3,a=e[r+2]*3,l={x:n[o]-n[s],y:n[o+1]-n[s+1],z:n[o+2]-n[s+2]},c={x:n[a]-n[s],y:n[a+1]-n[s+1],z:n[a+2]-n[s+2]},u=Ot.cross(l,c);for(const h of[s,o,a])i[h]+=u.x,i[h+1]+=u.y,i[h+2]+=u.z}for(const r of t){const s={x:0,y:0,z:0};for(const o of r)s.x+=i[o*3],s.y+=i[o*3+1],s.z+=i[o*3+2];for(const o of r)i[o*3]=s.x,i[o*3+1]=s.y,i[o*3+2]=s.z}for(let r=0;r<i.length;r+=3){const s=Ot.normalize({x:i[r],y:i[r+1],z:i[r+2]});i[r]=s.x,i[r+1]=s.y,i[r+2]=s.z}return i},pi=n=>{if(n.profile.length<2)throw new Error("revolve profile needs at least two points");rg(n.segments,3,"revolve segments"),n.profile.forEach((a,l)=>{if(tg(a,`revolve profile[${l}]`),a.x<0)throw new Error(`revolve profile[${l}] radius must be >= 0`)});const e=[0];for(let a=1;a<n.profile.length;++a)e.push(e[a-1]+Math.hypot(n.profile[a].x-n.profile[a-1].x,n.profile[a].y-n.profile[a-1].y));const t=[],i=[];for(let a=0;a<=n.segments;++a){const l=a/n.segments*Math.PI*2,c=Math.cos(l),u=Math.sin(l);n.profile.forEach((h,f)=>{t.push(h.x*c,h.y,h.x*u),i.push((Math.PI*2-l)*h.x,e[f])})}const r=n.profile.length,s=[];for(let a=0;a<n.segments;++a)for(let l=0;l+1<r;++l){const c=a*r+l,u=c+r;s.push(c,c+1,u),s.push(c+1,u+1,u)}const o=n.profile.map((a,l)=>a.x===0?Array.from({length:n.segments+1},(c,u)=>u*r+l):[l,n.segments*r+l]);return og(t,s,i,o)},An=n=>{if(n.length===0)throw new Error("polyhedron needs at least one face");const e=[],t=[],i=[],r=[];return n.forEach((s,o)=>{if(s.length<3)throw new Error(`polyhedron face[${o}] needs at least three corners`);s.forEach((f,p)=>ng(f,`polyhedron face[${o}] corner[${p}]`));const a=s[0],l=Ot.cross(Ot.subtract(s[1],a),Ot.subtract(s[s.length-1],a));if(Ot.length(l)<=no)throw new Error(`polyhedron face[${o}] encloses no area`);const c=Ot.normalize(l);if(s.some(f=>Math.abs(Ot.dot(Ot.subtract(f,a),c))>no))throw new Error(`polyhedron face[${o}] is not planar`);for(let f=0;f<s.length;++f){const p=s[(f+s.length-1)%s.length],v=s[f],b=s[(f+1)%s.length];if(Ot.dot(Ot.cross(Ot.subtract(v,p),Ot.subtract(b,v)),c)<-no)throw new Error(`polyhedron face[${o}] must be convex`)}const u=lg(c),h=e.length/3;for(const f of s)e.push(f.x,f.y,f.z),t.push(c.x,c.y,c.z),i.push(Ot.dot(f,u.u),Ot.dot(f,u.v));for(let f=1;f+1<s.length;++f)r.push(h,h+f,h+f+1)}),{positions:e,normals:t,uvs:i,indices:r,skin:null}},lg=n=>{if(Math.abs(n.y)<cg){const t=Ll({x:0,y:1,z:0},n);return{u:Ot.cross(t,n),v:t}}const e=Ll({x:1,y:0,z:0},n);return{u:e,v:Ot.cross(n,e)}},Ll=(n,e)=>Ot.normalize(Ot.subtract(n,Ot.scale(e,Ot.dot(n,e)))),cg=1-1e-6,no=1e-9,io=n=>Nc(n.outer,n.holes??[],"polygon"),ug=(n,e,t)=>{const i=qm({outer:n,holes:e,label:t});if(i!==null)throw new Error(i);const r=[n,...e].map((l,c)=>hg(l.map(u=>({x:u.x,y:u.y})),c===0)),s=[],o=[],a=[];for(const l of r){const c=s.length;a.push({start:c,count:l.points.length});for(let u=0;u<l.points.length;++u)s.push(l.points[u]),o.push(c+l.sourceIndices[u])}return{points:s,sourceIndices:o,rings:a,area:r.reduce((l,c)=>l+Fc(c.points),0)}},Nc=(n,e,t)=>{const i=ug(n,e,t);return{...i,triangles:fg(i)}},fg=n=>mg(n.points,dg(n.points,n.rings)),hg=(n,e)=>{const t=n.map((i,r)=>r);return Fc(n)>0!==e&&(n.reverse(),t.reverse()),{points:n,sourceIndices:t}},Fc=n=>{let e=0;for(let t=0;t<n.length;++t){const i=n[t],r=n[(t+1)%n.length];e+=i.x*r.y-r.x*i.y}return e/2},Wn=(n,e,t)=>(e.x-n.x)*(t.y-n.y)-(e.y-n.y)*(t.x-n.x),Il=(n,e,t,i)=>Dl(Wn(t,i,n),Wn(t,i,e))&&Dl(Wn(n,e,t),Wn(n,e,i))?!0:[[t,i,n],[t,i,e],[n,e,t],[n,e,i]].some(([s,o,a])=>{if(Math.abs(Wn(s,o,a))>Yn)return!1;const l=o.x-s.x,c=o.y-s.y,u=((a.x-s.x)*l+(a.y-s.y)*c)/(l*l+c*c);return u>=-Yn&&u<=1+Yn}),Dl=(n,e)=>Math.abs(n)>Yn&&Math.abs(e)>Yn&&n*e<0,Ul=(n,e)=>{let t=!1;for(let i=0;i<e.length;++i){const r=e[i],s=e[(i+1)%e.length];r.y>n.y!=s.y>n.y&&n.x<r.x+(n.y-r.y)/(s.y-r.y)*(s.x-r.x)&&(t=!t)}return t},dg=(n,e)=>{const t=e.map(s=>Array.from({length:s.count},(o,a)=>s.start+a)),i=e.map(s=>n.slice(s.start,s.start+s.count)),r=[...t[0]];for(let s=1;s<t.length;++s){const o=r.flatMap((u,h)=>t[s].map((f,p)=>({at:h,from:p}))).find(u=>pg(n,i,r,t,s,u)),a=[...t[s].slice(o.from),...t[s].slice(0,o.from)],l=r[o.at],c=r.splice(o.at+1);for(const u of a)r.push(u);r.push(a[0],l);for(const u of c)r.push(u)}return r},pg=(n,e,t,i,r,s)=>{const o=n[t[s.at]],a=n[i[r][s.from]],l=t.length;for(let u=0;u<l;++u)if(u!==s.at&&u!==(s.at+l-1)%l&&Il(o,a,n[t[u]],n[t[(u+1)%l]]))return!1;for(let u=r;u<i.length;++u){const h=i[u];for(let f=0;f<h.length;++f)if((u!==r||f!==s.from&&f!==(s.from+h.length-1)%h.length)&&Il(o,a,n[h[f]],n[h[(f+1)%h.length]]))return!1}const c={x:(o.x+a.x)/2,y:(o.y+a.y)/2};return Ul(c,e[0])&&e.every((u,h)=>h===0||Ul(c,u)===!1)},mg=(n,e)=>{const t=[...e],i=[];for(let r=t.length;r>3;--r){const s=t.length,o=t.findIndex((a,l)=>gg(n,t,l));if(o===-1)throw new Error("polygon triangulation could not find a valid ear");i.push(t[(o+s-1)%s],t[o],t[(o+1)%s]),t.splice(o,1)}return i.push(t[0],t[1],t[2]),i},gg=(n,e,t)=>{const i=e.length,r=(t+i-1)%i,s=(t+1)%i,o=n[e[r]],a=n[e[t]],l=n[e[s]];return Wn(o,a,l)<=Yn?!1:e.every(c=>c===e[r]||c===e[t]||c===e[s]?!0:xg(o,a,l,n[c])===!1)},xg=(n,e,t,i)=>Wn(n,e,i)>=-Yn&&Wn(e,t,i)>=-Yn&&Wn(t,n,i)>=-Yn,Yn=1e-12,Zr=n=>{ig(n.depth,"polygon extrusion depth");const e=Nc(n.outer,n.holes??[],"polygon"),t=n.depth/2,i=sg();for(const[r,s]of[[1,t],[-1,-t]]){const o=i.positions.length/3;for(const a of e.points)i.positions.push(a.x,a.y,s),i.normals.push(0,0,r),i.uvs.push(a.x,a.y*r);for(let a=0;a<e.triangles.length;a+=3)i.indices.push(o+e.triangles[a],o+e.triangles[a+(r===1?1:2)],o+e.triangles[a+(r===1?2:1)])}for(const r of e.rings){let s=0;for(let o=0;o<r.count;++o){const a=e.points[r.start+o],l=e.points[r.start+(o+1)%r.count],c=Math.hypot(l.x-a.x,l.y-a.y),u={x:(l.y-a.y)/c,y:(a.x-l.x)/c,z:0},h=i.positions.length/3;for(const[f,p,v]of[[a,t,s],[a,-t,s],[l,-t,s+c],[l,t,s+c]])i.positions.push(f.x,f.y,p),i.normals.push(u.x,u.y,u.z),i.uvs.push(v,p);i.indices.push(h,h+1,h+2,h,h+2,h+3),s+=c}}return{...i,skin:null}},_g=(n,e,t)=>{const i=n.prototypes??[{id:"default",modelRecipe:n.modelRecipe,weight:1}];if(t!==void 0){const o=i.find(a=>a.id===t);if(o===void 0)throw new Error(`Instance set "${n.id}" slot ${e} references missing prototype "${t}".`);return o}const r=i.reduce((o,a)=>o+a.weight,0);let s=rn(n.seed,e,1886547828)*r;for(const o of i.slice(0,-1)){if(s<o.weight)return o;s-=o.weight}return i.at(-1)},vg=(n,e)=>{if(Number.isSafeInteger(e)===!1||e<0||e>=n.count)throw new RangeError(`Instance set "${n.id}" slot ${e} is outside 0..${n.count-1}.`);const t=yg(n,e),i=n.facingDeg*Math.PI/180,r=Math.cos(i),s=Math.sin(i),o=rn(n.seed,e,1935892844),a=ri(n.variation.scale.min,n.variation.scale.max,o),l=Math.min(n.variation.palette.length-1,Math.floor(rn(n.seed,e,1885432933)*n.variation.palette.length)),c=n.layout.kind==="along-route"?{x:t.x,y:n.anchor.y,z:t.z}:{x:n.anchor.x+t.x*r+t.z*s,y:n.anchor.y+t.y,z:n.anchor.z-t.x*s+t.z*r},u=Object.fromEntries(n.variation.traits.map((I,ne)=>[I.name,ri(I.min,I.max,rn(n.seed,e,ne,1953653097))])),h=n.layout.kind==="explicit"?n.layout.transforms[e]:void 0,f=(h==null?void 0:h.palette)??n.variation.palette[l];if([c.x,c.y,c.z,a,...Object.values(u)].some(I=>Number.isFinite(I)===!1)||f===void 0)throw new RangeError(`Instance set "${n.id}" slot ${e} derived non-finite variation or an empty palette.`);const p=n.prototypes===void 0&&n.layout.kind!=="lattice"&&n.layout.kind!=="explicit"&&n.variation.scale3===void 0&&n.variation.rotationDeg===void 0&&n.variation.visibleProbability===void 0,v=_g(n,e,h==null?void 0:h.prototype),b={slot:e,node:h===void 0?`instance:${n.id}:slot:${String(e).padStart(6,"0")}`:`instance:${n.id}:${h.id}`,modelRecipe:v.modelRecipe,position:c,facingDeg:n.facingDeg,scale:a,palette:f,traits:{...u,...h==null?void 0:h.traits}};if(p)return b;const _=(h==null?void 0:h.scale)??(n.variation.scale3===void 0?{x:a,y:a,z:a}:{x:ri(n.variation.scale3.min.x,n.variation.scale3.max.x,rn(n.seed,e,1935898744)),y:ri(n.variation.scale3.min.y,n.variation.scale3.max.y,rn(n.seed,e,1935899001)),z:ri(n.variation.scale3.min.z,n.variation.scale3.max.z,rn(n.seed,e,1935899258))}),m=Mi.normalize(Mi.multiply(Mi.fromAxisAngle({x:0,y:1,z:0},n.facingDeg),(h==null?void 0:h.rotation)??Mg(n,e)));return{...b,prototype:v.id,rotation:m,scale3:_,visible:(h==null?void 0:h.visible)??(n.variation.visibleProbability===void 0||rn(n.seed,e,1986622313)<n.variation.visibleProbability)}},Mg=(n,e)=>{const t=n.variation.rotationDeg;return t===void 0?Mi.identity():Mi.fromEuler({x:ri(t.x.min,t.x.max,rn(n.seed,e,1919906936)),y:ri(t.y.min,t.y.max,rn(n.seed,e,1919906937)),z:ri(t.z.min,t.z.max,rn(n.seed,e,1919906938)),order:"XYZ"})},yg=(n,e)=>{const t=n.layout;if(t.kind==="grid"){const f=Math.floor(e/t.columns);return{x:(e%t.columns-(t.columns-1)/2)*t.spacing.x,y:0,z:f*t.spacing.z}}if(t.kind==="scatter"){const f=Math.sqrt(rn(n.seed,e,1918985321))*t.radius,p=rn(n.seed,e,1634625388)*Math.PI*2;return{x:Math.cos(p)*f,y:0,z:Math.sin(p)*f}}if(t.kind==="lattice"){const f=t.rows*t.columns,p=Math.floor(e/f),v=e%f,b=Math.floor(v/t.columns);return{x:(v%t.columns-(t.columns-1)/2)*t.spacing.x,y:p*t.spacing.y,z:b*t.spacing.z}}if(t.kind==="explicit"){const f=t.transforms[e];if(f===void 0)throw new Error(`Instance set "${n.id}" slot ${e} has no explicit transform.`);return f.translation}const i=n.route;if(i===null||i.id!==t.route||i.waypoints.length<2)throw new Error(`Instance set "${n.id}" references unavailable route "${t.route}".`);const r=i.waypoints.slice(1).map((f,p)=>{const v=i.waypoints[p];return{left:v,right:f,length:Math.hypot(f.x-v.x,f.z-v.z)}}),s=r.reduce((f,p)=>f+p.length,0);if(Number.isFinite(s)===!1||s<=0)throw new RangeError(`Instance set "${n.id}" route "${t.route}" must have finite non-zero length.`);let o=(e+.5)/n.count*s,a=r.at(-1);for(const f of r.slice(0,-1)){if(o<=f.length){a=f;break}o-=f.length}const l=Math.min(1,o/a.length),c={x:a.right.x-a.left.x,z:a.right.z-a.left.z},u=Math.hypot(c.x,c.z),h=(rn(n.seed,e,1785295988)*2-1)*t.lateralJitter;return{x:a.left.x+c.x*l-c.z/u*h,y:0,z:a.left.z+c.z*l+c.x/u*h}},ri=(n,e,t)=>n*(1-t)+e*t,Sg=n=>{const e=new _n;if(n.type==="primitive"){const i=Ic(n.shape);return e.setAttribute("position",new qt(i.positions,3)),e.setAttribute("normal",new qt(i.normals,3)),e.setIndex(i.indices),e}const t=n.mesh;return e.setAttribute("position",new qt(t.positions,3)),t.normals!==null&&e.setAttribute("normal",new qt(t.normals,3)),t.uvs!==null&&e.setAttribute("uv",new qt(t.uvs,2)),t.colors!==void 0&&e.setAttribute("color",new qt(t.colors,3)),t.indices!==null&&e.setIndex(t.indices),t.skin!==null&&(e.setAttribute("skinIndex",new la(t.skin.boneIndices,4)),e.setAttribute("skinWeight",new qt(t.skin.weights,4))),t.normals===null&&e.computeVertexNormals(),e},Nl=n=>typeof n=="string"?n:n.asset;class bg{constructor(e){Ri(this,"pending",new Map);Ri(this,"sources",new Map);Ri(this,"issued",[]);Ri(this,"disposed",!1);Ri(this,"resolve");this.load=e,this.resolve=t=>{this.assertLive();const i=Nl(t),r=this.sources.get(i);if(r===void 0)throw new Error(`Texture asset "${i}" was never primed into this shot cache.`);const s=r.clone();return this.issued.push(s),s}}async prime(e){this.assertLive();const t=new Set;for(const s of e)s!=null&&t.add(Nl(s));const i=await Promise.allSettled([...t].map(s=>this.decodeOnce(s))),r=[...t].filter((s,o)=>i[o].status==="rejected");if(r.length!==0)throw new Error(`Texture assets could not be decoded: ${r.join(", ")}.`)}get size(){return this.sources.size}async dispose(){if(this.disposed)return;this.disposed=!0;const e=await Promise.allSettled(this.pending.values());for(const t of this.issued)t.dispose();this.issued.length=0;for(const t of e)t.status==="fulfilled"&&t.value.dispose();this.pending.clear(),this.sources.clear()}decodeOnce(e){const t=this.pending.get(e);if(t!==void 0)return t;const i=this.load(e).then(r=>(this.sources.set(e,r),r));return this.pending.set(e,i),i}assertLive(){if(this.disposed)throw new Error("This shot texture cache has already been disposed.")}}const Eg=(n,e)=>{const t=n.baseColor,i=n.alphaMode??(n.opacity<1?"blend":"opaque"),r=new Pf({color:new dt(t.r,t.g,t.b),metalness:n.metallic,roughness:n.roughness,transparent:i==="blend",depthWrite:i!=="blend",opacity:n.opacity,alphaTest:i==="mask"?n.alphaCutoff??.5:0,side:n.doubleSided===!0?Cn:ai,transmission:n.transmission??0,ior:n.ior??1.5,thickness:n.thickness??0,clearcoat:n.clearcoat??0});r.map=cr(n.baseColorTexture,"srgb",e);const s=cr(n.metallicRoughnessTexture,"linear",e);return r.metalnessMap=s,r.roughnessMap=s,r.normalMap=cr(n.normalTexture,"linear",e),n.normalScale!==void 0&&r.normalScale.setScalar(n.normalScale),r.aoMap=cr(n.occlusionTexture,"linear",e),r.aoMapIntensity=n.occlusionStrength??1,r.emissiveMap=cr(n.emissiveTexture,"srgb",e),n.emissive!==null?r.emissive=new dt(n.emissive.r,n.emissive.g,n.emissive.b):r.emissiveMap!==null&&r.emissive.setRGB(1,1,1),r},cr=(n,e,t)=>{if(n==null||t===void 0)return null;const i=t(n);if(i===void 0)return null;const r=typeof n=="string"?{texCoord:0,colorSpace:e}:n;return i.colorSpace=r.colorSpace==="srgb"?cn:Vn,i.channel=r.texCoord,r.transform!==void 0&&(i.offset.set(r.transform.offset.x,r.transform.offset.y),i.repeat.set(r.transform.scale.x,r.transform.scale.y),i.rotation=r.transform.rotationDeg*Math.PI/180),r.sampler!==void 0&&(i.wrapS=Fl(r.sampler.wrapS),i.wrapT=Fl(r.sampler.wrapT),i.minFilter=wg(r.sampler.minFilter),i.magFilter=r.sampler.magFilter==="nearest"?Ht:Yt),i.needsUpdate=!0,i},Fl=n=>n==="clamp"?Pn:n==="repeat"?os:as,wg=n=>{switch(n){case"nearest":return Ht;case"linear":return Yt;case"nearestMipmapLinear":return fr;case"linearMipmapLinear":return si}},Tg=()=>new yc({color:new dt(.8,.8,.8),metalness:0,roughness:.9}),Ag=(n,e)=>{n.position.set(e.translation.x,e.translation.y,e.translation.z),n.quaternion.set(e.rotation.x,e.rotation.y,e.rotation.z,e.rotation.w),n.scale.set(e.scale.x,e.scale.y,e.scale.z)},hs=(n,e)=>{const t=new vi;t.name=n.name??n.id;const i=new Map;if(n.skeleton!==null){for(const a of n.skeleton.bones){const l=new xc;l.name=a.bone,l.position.set(a.rest.translation.x,a.rest.translation.y,a.rest.translation.z),l.quaternion.set(a.rest.rotation.x,a.rest.rotation.y,a.rest.rotation.z,a.rest.rotation.w),i.set(a.bone,l)}for(const a of n.skeleton.bones){const l=i.get(a.bone);((a.parent!==null?i.get(a.parent):void 0)??t).add(l)}}const r=new Map(n.materials.map(a=>[a.id,a])),s=new Map,o=new Map;for(const a of n.parts){const l=Sg(a.geometry),c=l.hasAttribute("color"),u=a.material===null?void 0:r.get(a.material);let h;if(u===void 0)h=Tg(),h.vertexColors=c;else{let v=s.get(u.id);v===void 0&&(v=new Map,s.set(u.id,v));const b=v.get(c);b===void 0?(h=Eg(u,e),h.vertexColors=c,v.set(c,h)):h=b}const f=a.attachedBone===null&&a.geometry.type==="mesh"?a.geometry.mesh.skin:null,p=f!==null?new Vo(l,h):new on(l,h);if(p.name=a.name??a.id,o.set(a.id,p),a.transform!==null&&Ag(p,a.transform),p instanceof Vo&&f!==null){const v=f.joints.map(b=>{const _=i.get(b);if(_===void 0)throw new Error(`part "${a.id}" skin references missing bone "${b}"`);return _});t.add(p),t.updateMatrixWorld(!0),p.bind(new ua(v)),p.normalizeSkinWeights()}else if(a.attachedBone!==null){const v=i.get(a.attachedBone);if(v===void 0)throw new Error(`part "${a.id}" attachedBone references missing bone "${a.attachedBone}"`);v.add(p)}else t.add(p)}return{object:t,bones:i,parts:o}},Ol=new WeakMap,Rg=n=>{const e=Ol.get(n);e!==void 0&&(e.target.dispose(),e.quadGeometry.dispose(),e.quadMaterial.dispose(),Ol.delete(n))},Cg=n=>{const e=n.view;if(e===null||e.enabled===!1)return;const t=Qm({left:e.offsetX/e.fullWidth,top:e.offsetY/e.fullHeight,right:(e.offsetX+e.width)/e.fullWidth,bottom:(e.offsetY+e.height)/e.fullHeight});return t.left===0&&t.top===0&&t.right===1&&t.bottom===1?void 0:t},Bl=new WeakMap,Pg=n=>{const e=Bl.get(n);e!==void 0&&(e.target.dispose(),e.quadGeometry.dispose(),e.quadMaterial.dispose(),Bl.delete(n))},Lg=n=>{Rg(n),Pg(n),n.dispose()},Ig=(n,e,t,i,r)=>{const s=new zm({canvas:n,antialias:(r==null?void 0:r.antialias)??!0,preserveDrawingBuffer:(r==null?void 0:r.preserveDrawingBuffer)??!1});(r==null?void 0:r.pixelRatio)!==void 0&&s.setPixelRatio(r.pixelRatio),(()=>{const u=n.clientWidth||1,h=n.clientHeight||1;s.setSize(u,h,!1),t.aspect=u/h,t.updateProjectionMatrix()})();let a=!0,l=null;const c=u=>{if(!a)return;l===null&&(l=u),i((u-l)/1e3)!==!0&&s.render(e,t),requestAnimationFrame(c)};return requestAnimationFrame(c),{renderer:s,stop:()=>{a=!1,Lg(s)}}},Oc=n=>{const e=[];return n.traverse(t=>{t.isMesh===!0&&e.push(t)}),e};function Bc(n,e=!1){const t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),r=new Set(Object.keys(n[0].morphAttributes)),s={},o={},a=n[0].morphTargetsRelative,l=new _n;let c=0;for(let u=0;u<n.length;++u){const h=n[u];let f=0;if(t!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const p in h.attributes){if(!i.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+p+'" attribute exists among all geometries, or in none of them.'),null;s[p]===void 0&&(s[p]=[]),s[p].push(h.attributes[p]),f++}if(f!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const p in h.morphAttributes){if(!r.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[p]===void 0&&(o[p]=[]),o[p].push(h.morphAttributes[p])}if(e){let p;if(t)p=h.index.count;else if(h.attributes.position!==void 0)p=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,p,u),c+=p}}if(t){let u=0;const h=[];for(let f=0;f<n.length;++f){const p=n[f].index;for(let v=0;v<p.count;++v)h.push(p.getX(v)+u);u+=n[f].attributes.position.count}l.setIndex(h)}for(const u in s){const h=zl(s[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let f=0;f<h;++f){const p=[];for(let b=0;b<o[u].length;++b)p.push(o[u][b][f]);const v=zl(p);if(!v)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(v)}}}return l}function zl(n){let e,t,i,r=-1,s=0;for(let c=0;c<n.length;++c){const u=n[c];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=u.normalized),i!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=u.gpuType),r!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=u.count*t}const o=new e(s),a=new fn(o,t,i);let l=0;for(let c=0;c<n.length;++c){const u=n[c];if(u.isInterleavedBufferAttribute){const h=l/t;for(let f=0,p=u.count;f<p;f++)for(let v=0;v<t;v++){const b=u.getComponent(f,v);a.setComponent(f+h,v,b)}}else o.set(u.array,l);l+=u.count*t}return r!==void 0&&(a.gpuType=r),a}const Dg=(n,e=`Instanced runtime model "${n.id}"`,t)=>{const i=hs(n);i.object.updateMatrixWorld(!0);const r=Oc(i.object);return{...zc(r,e),cycle:null}},Ug=(n,e="Loaded instanced runtime model")=>(n.object.updateMatrixWorld(!0),{...zc(Oc(n.object),e),cycle:null}),zc=(n,e)=>{const t=[],i=[];n.forEach((o,a)=>{if(o instanceof Vo)throw new Error(`${e} has a skinned source mesh.`);if(Object.values(o.geometry.morphAttributes).some(c=>c.length>0))throw new Error(`${e} has morph-target source geometry.`);if(Array.isArray(o.material))throw new Error(`${e} has a multi-material source mesh.`);const l=o.geometry.clone().applyMatrix4(o.matrixWorld);l.setAttribute("automoviePart",new qt(new Float32Array(l.getAttribute("position").count).fill(a),1)),t.push(l),i.push(o.material)});let r=0;for(const o of t){const a=o.getAttribute("color");if(a!==void 0){if(a.itemSize!==3&&a.itemSize!==4||a.count!==o.getAttribute("position").count)throw new Error(`${e} needs one RGB or RGBA colour per vertex.`);r=Math.max(r,a.itemSize)}}if(r!==0)for(const o of t){const a=o.getAttribute("color"),l=o.getAttribute("position").count,c=new Float32Array(l*r).fill(1);if(a!==void 0)for(let u=0;u<l;++u)for(let h=0;h<a.itemSize;++h)c[u*r+h]=a.getComponent(u,h);o.setAttribute("color",new qt(c,r))}const s=Bc(t,!0);if(s===null||i.length===0)throw new Error(`${e} cannot be flattened for instancing.`);return{geometry:s,materials:i}},Ng=n=>{const e=new vi,t=new Map;e.name=`instance-set:${n.instanceSet.id}`,e.position.copy(kc(n.instanceSet.anchor));const i=n.instanceSet.prototypes??[{id:"default",modelRecipe:n.instanceSet.modelRecipe,weight:1,lod:n.instanceSet.lod,projectionRadius:n.instanceSet.projectionRadius}],r=new Map(i.map(u=>[u.id,new Map(u.lod.map(h=>{var _;const f=n.models.get(h.model);if(f===void 0)throw new Error(`Instance set "${n.instanceSet.id}" prototype "${u.id}" LOD "${h.tier}" references missing runtime model "${h.model}".`);const p=`Instance set "${n.instanceSet.id}" prototype "${u.id}" LOD "${h.tier}"`,v=(_=n.prototypeObjects)==null?void 0:_.get(h.model),b=v===void 0?Dg(f,p):Ug(v,p);return[h.tier,{geometry:b.geometry,materials:b.materials.map(Gg)}]}))])),s=Bg(n.instanceSet),o=n.instanceSet.variation.traits.map(u=>u.name),a=n.instanceSet.chunks.map(u=>{const f=Array.from({length:u.count},(v,b)=>Fg(n.instanceSet,u.start+b)).filter(v=>v.visible!==!1),p=i.flatMap(v=>{const b=f.filter(I=>(I.prototype??"default")===v.id);if(b.length===0)return[];const _=new Map,m=r.get(v.id);for(const I of v.lod){const ne=m.get(I.tier),A=ne.geometry.clone();for(const[C,W]of o.entries())A.setAttribute(`automovieTrait${C}`,new Wo(new Float32Array(b.map(S=>S.traits[W])),1));const P=new Sf(A,ne.materials,b.length);P.name=`${n.instanceSet.id}:${u.index}:${v.id}:${I.tier}`,P.userData.automovieTraitNames=[...o],P.userData.automoviePrototype=v.id,P.userData.automovieSlots=b.map(C=>C.slot),b.forEach((C,W)=>{P.setMatrixAt(W,Og(C,n.instanceSet.anchor));let S=t.get(C.palette);if(S===void 0){const N=Hm(C.palette);S=new dt(N.r,N.g,N.b),t.set(C.palette,S)}P.setColorAt(W,S)}),P.instanceMatrix.needsUpdate=!0,P.instanceColor.needsUpdate=!0,P.computeBoundingBox(),P.computeBoundingSphere(),P.frustumCulled=!1,P.visible=!1,e.add(P),_.set(I.tier,P)}return[{projectionRadius:v.projectionRadius,count:b.length,lod:v.lod,tiers:_,selected:null}]});return{runtime:u,radius:zg(u.bounds,u.centroid),prototypes:p}}),l=a.reduce((u,h)=>u+h.prototypes.reduce((f,p)=>f+p.count,0),0),c={visible:{hero:0,near:0,far:0},culled:0,hidden:n.instanceSet.count-l};return{object:e,stats:c,update(u,h){c.visible={hero:0,near:0,far:0},c.culled=0,e.updateMatrixWorld(!0),u.updateMatrixWorld(!0),u.updateProjectionMatrix();const f=new yt().multiplyMatrices(u.projectionMatrix,u.matrixWorldInverse),p=new ps().setFromProjectionMatrix(f),v=new fe;u.getWorldPosition(v);const b=Math.tan(xi.degToRad(u.fov)/2),_=Cg(u),m=b*(_===void 0?1:_.bottom-_.top);for(const I of a){const ne=e.localToWorld(new fe(I.runtime.centroid.x-n.instanceSet.anchor.x,I.runtime.centroid.y-n.instanceSet.anchor.y,I.runtime.centroid.z-n.instanceSet.anchor.z)),A=new li(ne,I.radius+n.instanceSet.projectionRadius*s);if(p.intersectsSphere(A)===!1){for(const W of I.prototypes)for(const S of W.tiers.values())S.visible=!1;c.culled+=I.prototypes.reduce((W,S)=>W+S.count,0);continue}const P=Math.max(.001,v.distanceTo(ne)),C=Math.max(.001,-ne.clone().applyMatrix4(u.matrixWorldInverse).z);for(const W of I.prototypes){const S=W.projectionRadius*s*h/(m*C),N=jm({lod:W.lod,distance:P,projectedPixels:S,previous:W.selected}).lod;W.selected=N.tier;for(const[J,se]of W.tiers)se.visible=J===N.tier;c.visible[N.tier]+=W.count}}}}},Fg=(n,e)=>vg(n,e),Og=(n,e)=>new yt().compose(new fe(n.position.x-e.x,n.position.y-e.y,n.position.z-e.z),n.rotation===void 0?new Qt().setFromAxisAngle(new fe(0,1,0),kg(n.facingDeg)):new Qt(n.rotation.x,n.rotation.y,n.rotation.z,n.rotation.w),n.scale3===void 0?new fe(n.scale,n.scale,n.scale):kc(n.scale3)),Bg=n=>{if(n.layout.kind==="explicit"){let t=Number.EPSILON;for(const i of n.layout.transforms)t=Math.max(t,i.scale.x,i.scale.y,i.scale.z);return t}const e=n.variation.scale3;return e===void 0?n.variation.scale.max:Math.max(e.max.x,e.max.y,e.max.z)},zg=(n,e)=>Math.max(.01,...[n.min.x,n.max.x].flatMap(t=>[n.min.y,n.max.y].flatMap(i=>[n.min.z,n.max.z].map(r=>Math.hypot(t-e.x,i-e.y,r-e.z))))),kg=n=>n*Math.PI/180,kc=n=>new fe(n.x,n.y,n.z),Gg=n=>{var t;const e=n.clone();return(t=e.color)==null||t.set(16777215),e},Gc={wood:{file:"oak-albedo-v1.png",metres:[.4,1]},stone:{file:"limestone-albedo-v1.png",metres:[.6,.6]},plaster:{file:"lime-plaster-albedo-v1.png",metres:[.8,.8]},tile:{file:"terracotta-albedo-v1.png",metres:[.3,.3]},cloth:{file:"linen-albedo-v1.png",metres:[.04,.04]},bark:{file:"apple-bark-albedo-v1.png",metres:[.55,.9]},soil:{file:"garden-soil-albedo-v1.png",metres:[1.2,1.2]}},Hc={oak:"wood",oakLight:"wood",oakPale:"wood",oakGrain:"wood",upper:"wood",bark:"bark",soil:"soil",stone:"stone",stoneLight:"stone",stoneDark:"stone",floor:"stone",gravel:"stone",plaster:"plaster",roof:"tile",roofLight:"tile",roofMuted:"tile",bed:"cloth",linen:"cloth",linenDark:"cloth",quiltRust:"cloth",quiltSage:"cloth"},Hg={oak:[.14,.19,.25],oakLight:[.22,.28,.34],oakPale:[.31,.37,.44],oakGrain:[.1,.15,.2],upper:[.19,.23,.29],bark:[.78,.78,.76],soil:[.64,.62,.57],stone:[.68,.69,.67],stoneLight:[.85,.85,.8],stoneDark:[.35,.37,.35],floor:[.65,.63,.56],gravel:[.72,.69,.6],plaster:[.75,.71,.61],roof:[.17,.22,.27],roofLight:[.23,.26,.29],roofMuted:[.2,.24,.28],bed:[.63,.61,.53],linen:[.94,.91,.82],linenDark:[.57,.54,.44],quiltRust:[.54,.24,.17],quiltSage:[.34,.43,.27]};function Vc(n){const e=Gc[n];return{asset:"assets/textures/manor/"+e.file,texCoord:0,coordinateSource:"surface-metres",colorSpace:"srgb",transform:{offset:{x:0,y:0},scale:{x:1/e.metres[0],y:1/e.metres[1]},rotationDeg:0},sampler:{wrapS:"mirror",wrapT:"mirror",minFilter:"linearMipmapLinear",magFilter:"linear"}}}const Vg=()=>Object.keys(Gc).map(Vc);function Wg(n){return n.map(e=>{const t=Hc[e.id];if(!t)return e;const[i,r,s]=Hg[e.id];return{...e,baseColor:{r:i,g:r,b:s,a:1,hex:null},baseColorTexture:Vc(t)}})}const mi=(n,e)=>n.reduce((t,i,r)=>t+i*e[r],0),gi=n=>{const e=Math.hypot(...n);return n.map(t=>t/e)},Jr=(n,e)=>[n[1]*e[2]-n[2]*e[1],n[2]*e[0]-n[0]*e[2],n[0]*e[1]-n[1]*e[0]],Xg=n=>{const e=[1/0,1/0,1/0],t=[-1/0,-1/0,-1/0];for(let s=0;s<n.length;s++){const o=s%3;e[o]=Math.min(e[o],n[s]),t[o]=Math.max(t[o],n[s])}const i=t.map((s,o)=>s-e[o]),r=i.indexOf(Math.max(...i));return[0,1,2].map(s=>s===r?1:0)};function kl(n,e,{grainAxis:t,origin:i,faceFrames:r,developed:s=!1,projected:o=!1,cylindrical:a=!1}={}){var A;const l=Hc[e];if(!l)return n;const c=l==="wood"||l==="bark",u=n.type==="primitive"?{...Ic(n.shape),uvs:null,skin:null}:n.mesh;if(s||!o&&!c&&u.uvs!==null&&u.uvs!==void 0)return{type:"mesh",mesh:u};if(o||a){const P=[],C=[],W=[],S=[],N=u.indices??Array.from({length:u.positions.length/3},(J,se)=>se);for(let J=0;J<N.length;J+=3){const se=N.slice(J,J+3).map(g=>u.positions.slice(g*3,g*3+3)),_e=N.slice(J,J+3).map(g=>u.normals.slice(g*3,g*3+3)),me=gi(Jr(se[1].map((g,z)=>g-se[0][z]),se[2].map((g,z)=>g-se[0][z]))),w=me.map(Math.abs).indexOf(Math.max(...me.map(Math.abs))),G=se.map(g=>Math.atan2(g[2],g[0]));if(Math.max(...G)-Math.min(...G)>Math.PI)for(let g=0;g<3;g++)G[g]<0&&(G[g]+=Math.PI*2);for(let g=0;g<3;g++){const z=se[g];if(P.push(...z),C.push(..._e[g]),S.push(S.length),a&&Math.abs(me[1])<.94)W.push(G[g]*Math.hypot(z[0],z[2]),z[1]);else{const re=w===0?[2,1]:w===1?[0,2]:[0,1];W.push(z[re[0]],z[re[1]])}}}return{type:"mesh",mesh:{...u,positions:P,normals:C,uvs:W,indices:S}}}const h=u.positions,f=u.normals,p=[],v=gi(t??Xg(h)),b=[1/0,1/0,1/0],_=b.map(P=>-P);for(let P=0;P<h.length;P++)b[P%3]=Math.min(b[P%3],h[P]),_[P%3]=Math.max(_[P%3],h[P]);const m=i??b.map((P,C)=>(P+_[C])/2);let I=0,ne=((A=r==null?void 0:r[0])==null?void 0:A.count)??1/0;for(let P=0;P<h.length;P+=3){for(;P/3>=ne;)I++,ne+=r[I].count;const C=r==null?void 0:r[I],W=(C==null?void 0:C.origin)??m,S=h.slice(P,P+3).map((me,w)=>me-W[w]),N=gi(f.slice(P,P+3)),J=l==="wood"?gi((C==null?void 0:C.grainAxis)??v):[0,1,0];if(l==="wood"&&Math.abs(mi(J,N))>.94){const me=gi(Jr(J,Math.abs(J[2])<.9?[0,0,1]:[1,0,0])),w=Jr(J,me),G=mi(S,me),g=mi(S,w);p.push(G,g);continue}let se=J.map((me,w)=>me-N[w]*mi(J,N));if(Math.hypot(...se)<1e-8){const me=Math.abs(N[2])<.9?[0,0,1]:[1,0,0];se=me.map((w,G)=>w-N[G]*mi(me,N))}se=gi(se);const _e=gi(Jr(se,N));p.push(mi(S,_e),mi(S,se))}return{type:"mesh",mesh:{...u,uvs:p}}}function qg({box:n,mesh:e,beam:t,finish:i,polyhedron:r,revolve:s,extrude:o,V:a,Q:l,registerMechanism:c}){const u=g=>g<0?0:g===1?3.33:.45,h=(g,z,re,K,R,T={})=>{const F=r(z.map(Y=>Y.map(a)));let Q=0,k=!1;for(const Y of z){if(Y.every($=>$.uv)){const[$,D,O]=Y.map(X=>X.uv),j=(D[0]-$[0])*(O[1]-$[1])-(D[1]-$[1])*(O[0]-$[0]);if(Math.abs(j)>1e-12){for(let X=0;X<Y.length;X++)F.uvs[(Q+X)*2]=Y[X].uv[0],F.uvs[(Q+X)*2+1]=Y[X].uv[1];k=!0}}Q+=Y.length}e(g,F,re,K,R,{...T,developed:k})};function f(g,z,re,K="oakLight",R,T=.003,F){const[Q,k,Y]=z,$=Math.min(T,Q/5,k/3,Y/5),D=(X,V)=>{const le=Q/2-X,Se=Y/2-X,H=Math.min($,le/3,Se/3);return[[-le+H,V,-Se],[le-H,V,-Se],[le,V,-Se+H],[le,V,Se-H],[le-H,V,Se],[-le+H,V,Se],[-le,V,Se-H],[-le,V,-Se+H]]},O=[D($,-k/2),D(0,-k/2+$),D(0,k/2-$),D($,k/2)],j=[O[0].toReversed(),O[3]];for(let X=0;X<3;X++)for(let V=0;V<8;V++)j.push([O[X][V],O[X][(V+1)%8],O[X+1][(V+1)%8],O[X+1][V]]);h(g,j.map(X=>X.toReversed()),re,K,R,F)}function p(g,z,re,K=0){const R=Math.cos(K),T=Math.sin(K),F=V=>[g+R*V[0]+T*V[2],z+V[1],re-T*V[0]+R*V[2]],Q=l([0,1,0],K),k=(V,le,Se,H="oak",ve=!1,we)=>ve?f(V,le,F(Se),H,Q,.003,we):n(V,le,F(Se),H,Q,we),Y=(V,le,Se,H,ve)=>e(V,le,F(Se),H,Q,ve),$=(V,le,Se,H=.035,ve="oak")=>t(V,F(le),F(Se),H,ve),D=(V,le,Se,H,ve="iron",we=24)=>e(V,s({profile:[{x:0,y:0},{x:le,y:0},{x:le,y:Se},{x:0,y:Se}],segments:we}),F(H),ve,Q,{grainAxis:[0,1,0],cylindrical:!0}),O=(V,le,Se,H="iron",ve=!1)=>{const we=le.length,Le=Se/2,Me=le[1].map((Ae,L)=>Ae-le[0][L]),Ue=le[Math.min(2,we-1)].map((Ae,L)=>Ae-le[1][L]),Ye=[Me[1]*Ue[2]-Me[2]*Ue[1],Me[2]*Ue[0]-Me[0]*Ue[2],Me[0]*Ue[1]-Me[1]*Ue[0]],$e=Math.hypot(...Ye),rt=$e>1e-10&&le.every(Ae=>Math.abs(Ae.reduce((L,x,ce)=>L+(x-le[0][ce])*Ye[ce]/$e,0))<1e-8),Z=le.map((Ae,L)=>{const x=le[ve?(L+we-1)%we:Math.max(0,L-1)],ce=le[ve?(L+1)%we:Math.min(we-1,L+1)],ge=ce.map((Ee,Fe)=>Ee-x[Fe]),ye=Math.hypot(...ge);for(let Ee=0;Ee<3;Ee++)ge[Ee]/=ye;const Re=rt?[Ye[1]*ge[2]-Ye[2]*ge[1],Ye[2]*ge[0]-Ye[0]*ge[2],Ye[0]*ge[1]-Ye[1]*ge[0]]:Math.abs(ge[2])<.9?[-ge[1],ge[0],0]:[0,-ge[2],ge[1]],Be=Math.hypot(...Re);for(let Ee=0;Ee<3;Ee++)Re[Ee]/=Be;const be=[ge[1]*Re[2]-ge[2]*Re[1],ge[2]*Re[0]-ge[0]*Re[2],ge[0]*Re[1]-ge[1]*Re[0]];return Array.from({length:8},(Ee,Fe)=>Ae.map((nt,ke)=>nt+Le*(Re[ke]*Math.cos(Fe*Math.PI/4)+be[ke]*Math.sin(Fe*Math.PI/4))))}),pt=[];for(let Ae=0;Ae<(ve?we:we-1);Ae++)for(let L=0;L<8;L++){const x=Z[Ae][L],ce=Z[Ae][(L+1)%8],ge=Z[(Ae+1)%we][(L+1)%8],ye=Z[(Ae+1)%we][L];pt.push([x,ce,ge],[x,ge,ye])}ve||pt.push(Z[0].toReversed(),Z[we-1]),h(V,pt,[g,z,re],H,Q)};return{b:k,m:Y,line:$,cyl:D,vessel:(V,le,Se,H,ve="clay",we=!1,Le="jar")=>{Le==="jar"&&Se<le*.9&&(Le="bowl"),Le==="jar"&&we&&Se<.15&&(Le="cup");const Me=Math.min(.014,le*.12),Ue=Le==="bowl"?[[0,0],[le*.4,0],[le*.66,.2*Se],[le,.88*Se],[le,Se],[le-Me,Se],[le*.63,.27*Se],[le*.38,Me],[0,Me]]:Le==="cup"||Le==="pail"?[[0,0],[le*.77,0],[le,Se],[le-Me,Se],[le*.77-Me,Me],[0,Me]]:[[0,0],[le*.68,0],[le,.25*Se],[le*.92,.7*Se],[le*.72,Se],[le*.72-Me,Se],[le*.92-Me,.7*Se],[le-Me,.25*Se],[le*.65,Me],[0,Me]];if(Y(V,s({profile:Ue.map(([Ye,$e])=>({x:Ye,y:$e})),segments:24}),H,ve,{grainAxis:[0,1,0],cylindrical:!0}),we){const Ye=Array.from({length:25},($e,rt)=>{const Z=-Math.PI/2+rt*Math.PI/24;return[H[0]+le*.86+Math.cos(Z)*le*.65,H[1]+Se*.55+Math.sin(Z)*Se*.3,H[2]]});O(V+"-handle",Ye,Math.min(.022,le*.27),ve)}},hoop:(V,le,Se,H,ve="iron",we="xy",Le=0,Me=Math.PI*2)=>{const Ue=Math.abs(Me-Le-Math.PI*2)<1e-8,Ye=Array.from({length:Ue?32:25},($e,rt)=>{const Z=Le+(Me-Le)*rt/(Ue?32:24);return we==="xy"?[le[0]+Se*Math.cos(Z),le[1]+Se*Math.sin(Z),le[2]]:[le[0]+Se*Math.cos(Z),le[1],le[2]+Se*Math.sin(Z)]});O(V,Ye,H,ve,Ue)},tube:O,point:F,r:Q}}function v(g,z,re,K,R,T,F,Q="linen",k=0,Y=.003,$){const D=Array.from({length:R+1},(H,ve)=>Array.from({length:T+1},(we,Le)=>F(ve/R,Le/T))),O=Array.from({length:R+1},()=>Array(T+1).fill(0)),j=Array.from({length:R+1},()=>Array(T+1).fill(0)),X=(H,ve)=>Math.hypot(...H.map((we,Le)=>we-ve[Le]));for(let H=0;H<=R;H++)for(let ve=0;ve<=T;ve++)H&&(O[H][ve]=O[H-1][ve]+X(D[H][ve],D[H-1][ve])),ve&&(j[H][ve]=j[H][ve-1]+X(D[H][ve],D[H][ve-1]));const V=(H,ve,we=!1)=>{const Le=H/R,Me=ve/T,Ue=D[H][ve],Ye=[O[H][ve],j[H][ve]],$e=ye=>Object.assign(ye,{uv:Ye});if(!we)return $e(Ue);if($)return $e($(Le,Me));const rt=F(Math.max(0,Le-1e-4),Me),Z=F(Math.min(1,Le+1e-4),Me),pt=F(Le,Math.max(0,Me-1e-4)),Ae=F(Le,Math.min(1,Me+1e-4)),L=Z.map((ye,Re)=>ye-rt[Re]),x=Ae.map((ye,Re)=>ye-pt[Re]),ce=[x[1]*L[2]-x[2]*L[1],x[2]*L[0]-x[0]*L[2],x[0]*L[1]-x[1]*L[0]],ge=Math.hypot(...ce);return $e(Ue.map((ye,Re)=>ye-Y*ce[Re]/ge))},le=[],Se=(H,ve,we,Le)=>le.push([H,ve,we],[H,we,Le]);for(let H=0;H<R;H++)for(let ve=0;ve<T;ve++)Se(V(H,ve),V(H,ve+1),V(H+1,ve+1),V(H+1,ve)),Se(V(H,ve,!0),V(H+1,ve,!0),V(H+1,ve+1,!0),V(H,ve+1,!0));for(let H=0;H<R;H++)Se(V(H,0),V(H+1,0),V(H+1,0,!0),V(H,0,!0)),Se(V(H,T),V(H,T,!0),V(H+1,T,!0),V(H+1,T));for(let H=0;H<T;H++)Se(V(0,H),V(0,H,!0),V(0,H+1,!0),V(0,H+1)),Se(V(R,H),V(R,H+1),V(R,H+1,!0),V(R,H,!0));h(g,le,[z,re,K],Q,l([0,1,0],k))}function b(g,z,re,K,R,T,F="linen",Q=0){for(let k=0;k<3;k++)v(g+"-layer-"+k,z,re+k*.02,K,16,12,(Y,$)=>[(Y-.5)*R,.02+.004*Math.sin(Math.PI*Y)*Math.sin(Math.PI*$),($-.5)*T],k===1?"linen":F,Q,.02,(Y,$)=>[(Y-.5)*R,k===0?0:.004*Math.sin(Math.PI*Y)*Math.sin(Math.PI*$),($-.5)*T])}function _(g,z,re,K,R,T="linen",F=0,Q=.015){v(g,z,re,K,16,36,(k,Y)=>{const $=Y*3;let D,O;if($<1)D=-.17*(1-$),O=-Q;else if($<2){const j=($-1)*Math.PI;D=Q*Math.sin(j),O=-Q*Math.cos(j)}else D=-.28*($-2),O=Q;return[(k-.5)*R,D,O+.002*Math.sin(k*31)*Math.max(0,-D)]},T,F)}function m(g,z,re,K,R,T,F="linen",Q=0,k=.04,Y=.015){const $=p(z,re,K,Q),D=20,O=12,j=[],X=(V,le,Se=!1)=>{const H=V/D,ve=le/O,we=Math.min(H,1-H,ve,1-ve),Le=.006*Math.sin(H*43+ve*7)+.004*Math.sin(ve*35);return[(H-.5)*R,Y*Math.sin(Math.PI*H)*Math.sin(Math.PI*ve)+Le-k*Math.max(0,1-we/.12)-(Se?.008:0),(ve-.5)*T]};for(let V=0;V<D;V++)for(let le=0;le<O;le++)j.push([X(V,le),X(V,le+1),X(V+1,le+1),X(V+1,le)],[X(V,le,!0),X(V+1,le,!0),X(V+1,le+1,!0),X(V,le+1,!0)]);for(let V=0;V<D;V++)for(const le of[0,O])j.push([X(V,le),X(V+1,le),X(V+1,le,!0),X(V,le,!0)]);for(let V=0;V<O;V++)for(const le of[0,D])j.push([X(le,V),X(le,V,!0),X(le,V+1,!0),X(le,V+1)]);h(g,j.flatMap(V=>[[V[0],V[1],V[2]],[V[0],V[2],V[3]]]),[z,re,K],F,$.r)}function I(g,z,re,K,R,T,F=0,Q=0){const k=g==="hall-table",Y=k?.1:.12,$=k?.11:.13,D=k?.655:.645,O=k?.645:.22;re=u(F)+(k?.006:0);const j=p(z,re,K,Q),X=R/2-(k?.06:.14),V=T/2-.12,le=H=>k?Math.sign(H)*(R/2-.14):H;for(const H of[-X,X])for(const ve of[-V,V])j.b(g+"-leg-"+le(H)+"-"+ve,[Y,.71,Y],[H,.355,ve],"oak",!0);for(const H of[-V,V])j.b(g+"-apron-long-"+H,[2*X-Y,$,.065],[0,D,H],"oak");for(const H of[-X,X])j.b(g+"-apron-end-"+le(H),[k?.075:.065,$,2*V-Y],[H,D,0],"oak"),k||j.b(g+"-end-stretcher-"+le(H),[.075,.075,2*V-Y],[H,O,0],"oak");j.b(g+"-long-stretcher",[2*X-.075,.085,.085],[0,O,0],"oak");const Se=Math.ceil(T/.22);for(let H=0;H<Se;H++)j.b(g+"-top-plank-"+H,[R,.055,T/Se-.003],[0,.7375,-T/2+(H+.5)*T/Se],H%2?"oak":"oakLight",!0);for(const H of[-X,X])for(const ve of[-V,V])j.b(g+"-joint-peg-"+le(H)+"-"+ve,[.025,.025,k?Y+.012:.132],[H,.66,ve],"oakLight");if(g==="hall-table"){j.vessel(g+"-pitcher",.115,.27,[-.65,.765,0],"clay",!0);for(const H of[-.65,0,.65])for(const ve of[-T*.3,T*.3])j.vessel(g+"-dish-"+H+"-"+ve,.105,.032,[H,.765,ve],"oakLight"),j.vessel(g+"-cup-"+H+"-"+ve,.045,.095,[H+.16,.765,ve],"clay",!0);j.vessel(g+"-serving-bowl",.16,.09,[.15,.765,0],"clay")}else{const H=-R*.2,ve=0;if(g!=="ledger-desk"){for(const Ae of[.7715,.8205])j.b(g+"-book-board-"+Ae,[.27,.013,.34],[H,Ae,ve],"leather",!0);j.b(g+"-book-pages",[.247,.036,.315],[H+.004,.796,ve],"paper"),j.b(g+"-book-spine",[.017,.062,.34],[H-.126,.796,ve],"leather");for(let Ae=0;Ae<5;Ae++)j.b(g+"-page-edge-"+Ae,[.24,.001,.001],[H+.004,.781+Ae*.007,ve+.1575],"linenDark");j.b(g+"-book-clasp",[.025,.007,.06],[H+.04,.8305,ve+.14],"iron")}j.vessel(g+"-inkpot",.037,.07,[R*.28,.765,-T*.25],"charcoal"),j.line(g+"-quill",[R*.28,.8,-T*.25],[R*.19,1.01,-T*.27],.007,"paper");const we=[R*.28,.8],Le=[R*.19,1.01],Me=Le.map((Ae,L)=>Ae-we[L]),Ue=Math.hypot(...Me),Ye=(Ae,L)=>({x:we[0]+Me[0]*Ae+Me[1]/Ue*L,y:we[1]+Me[1]*Ae-Me[0]/Ue*L}),$e=Ae=>-T*.25+(Ae-.8)/.21*(-T*.02),rt=[Ye(.34,0),Ye(.6,.028),Ye(1,0),Ye(.62,-.032)].map(Ae=>[Ae.x,Ae.y,$e(Ae.y)+.001]),Z=rt.map(Ae=>[Ae[0],Ae[1],Ae[2]-.002]),pt=[rt,Z.toReversed()];for(let Ae=0;Ae<4;Ae++)pt.push([rt[Ae],Z[Ae],Z[(Ae+1)%4],rt[(Ae+1)%4]]);h(g+"-quill-vane",pt.map(Ae=>Ae.map(j.point)),[0,0,0],"paper");for(let Ae=0;Ae<7;Ae++){const L=Ye(.42+Ae*.065,0),x=Ye(.5+Ae*.061,Ae%2?.022:-.023);j.line(g+"-quill-barb-"+Ae,[L.x,L.y,$e(L.y)+.002],[x.x,x.y,$e(x.y)+.002],.0018,"linenDark")}j.b(g+"-loose-parchment",[.22,.002,.25],[R*.12,.766,.06],"paper");for(let Ae=0;Ae<7;Ae++)j.b(g+"-ink-line-"+Ae,[.14-Ae%3*.023,2e-4,.002],[R*.12,.7671,-.025+Ae*.022],"charcoal");if(g==="ledger-desk")for(const Ae of[-1,1]){j.b(g+"-open-register-cover-"+Ae,[.19,.008,.29],[H+Ae*.1,.769,0],"leather");const L=H+Ae*.096,x=.178;j.b(g+"-open-register-leaves-"+Ae,[x,.02,.27],[L,.783,0],"paper");for(let ce=0;ce<9;ce++)j.b(g+"-register-entry-"+Ae+"-"+ce,[x-.045-ce%3*.012,.001,.002],[L,.7935,-.105+ce*.025],"charcoal")}}i(g,F,"furnishing",{frontAngle:Q})}function ne(g,z,re,K,R,T,F=0,Q=0,k=!1){re=u(F)+(/^hall-bench/.test(g)?.006:0);const Y=p(z,re,K,Q),$=Math.max(.09,R/2-.1),D=Math.max(.065,T/2-(g==="hall-bench-west"?.075:.055)),O=.075,j=X=>g==="hall-bench-west"?Math.sign(X)*Math.max(.065,T/2-.055):X;for(const X of[-$,$])for(const V of[-D,D])Y.b(g+"-leg-"+X+"-"+j(V),[O,.405,O],[X,.2025,V],"oak",!0);for(const X of[-$,$])Y.b(g+"-end-rail-"+X,[.06,.07,2*D],[X,.37,0],"oak"),Y.b(g+"-end-tie-"+X,[.055,.055,2*D],[X,.15,0],"oak");Y.b(g+"-stretcher",[2*$,.065,.055],[0,.15,0],"oak");for(const X of[-D,D])Y.b(g+"-seat-rail-"+j(X),[2*$,.07,.05],[0,.37,X],"oak");for(let X=0;X<2;X++)Y.b(g+"-seat-board-"+X,[R,.045,T/2-.002],[0,.4275,(X-.5)*T/2],"oakLight",!0);if(k){for(const X of[-$,$])Y.b(g+"-back-post-"+X,[.065,.48,.065],[X,.665,-D],"oak",!0);for(const X of[.64,.85])Y.b(g+"-back-rail-"+X,[2*$,.075,.04],[0,X,-D],"oakLight",!0);for(let X=0;X<3;X++)Y.b(g+"-back-splat-"+X,[.045,.2,.025],[(X-1)*R*.22,.745,-D],"oak")}i(g,F,"furnishing",{frontAngle:Q})}function A(g,z,re,K,R,T,F=1){re=u(F);const Q=p(z,re,K),k=R/2-.065,Y=T/2-.065;for(const j of[-k,k])for(const X of[-Y,Y]){const V=j<0?1.06:.7;Q.b(g+"-post-"+j+"-"+X,[.11,V,.11],[j,V/2,X],"oak",!0),e(g+"-finial-"+j+"-"+X,s({profile:[{x:0,y:0},{x:.046,y:0},{x:.047,y:.015},{x:.033,y:.03},{x:.047,y:.055},{x:.042,y:.083},{x:.021,y:.103},{x:0,y:.106}],segments:32}),Q.point([j,V,X]),"oakLight",Q.r,{grainAxis:[0,1,0]})}for(const j of[-Y,Y])Q.b(g+"-side-rail-"+j,[R-.13,.16,.075],[0,.36,j],"oak");for(const j of[-k,k])Q.b(g+"-end-rail-"+j,[.075,.16,T-.13],[j,.36,0],"oak");const $=14;for(let j=0;j<$;j++)Q.b(g+"-slat-"+j,[.09,.035,T-.14],[-R/2+.14+j*(R-.28)/($-1),.4375,0],"oakLight");for(let j=0;j<5;j++)Q.b(g+"-head-panel-"+j,[.04,.58,(T-.22)/5-.003],[-k,.715,-(T-.22)/2+(j+.5)*(T-.22)/5],"oakLight",!0);Q.b(g+"-head-top",[.08,.075,T-.11],[-k,1.02,0],"oak",!0);for(let j=0;j<3;j++)Q.b(g+"-foot-panel-"+j,[.04,.2,(T-.22)/3-.003],[k,.53,-(T-.22)/2+(j+.5)*(T-.22)/3],"oakLight",!0);Q.b(g+"-mattress",[R-.23,.17,T-.23],[0,.54,0],"bed",!0);const D=(j,X=0)=>{const V=(j-.5)*2,le=Math.abs(V),Se=Math.sign(V),H=(T-.23)/2;if(le<=.7)return[.628+X+.007*Math.sin(le/.7*Math.PI)**2,Se*(H-.004)*le/.7];if(le<=.8){const ve=(le-.7)/.1*Math.PI/2;return[.616+(.012+X)*Math.cos(ve),Se*(H-.004+(.012+X)*Math.sin(ve))]}return[.616-.1*(le-.8)/.2,Se*(H+.008+X)]};for(const[j,X,V,le,Se,H]of[[g+"-sheet",z,R-.24,0,.003,"linen"],[g+"-quilt",z+R*.17,R*.56,.009,.009,g==="master-bed"?"quiltRust":g==="child-west-bed"?"quiltSage":"linenDark"]]){const ve=(we,Le)=>.0025*Math.sin(((X-z+(we-.5)*V)/(R-.24)+.5)*Math.PI*6)*Math.sin(Le*Math.PI)**2;v(j,X,re,K,32,40,(we,Le)=>{const[Me,Ue]=D(Le,le);return[(we-.5)*V,Me+ve(we,Le),Ue]},H,0,Se,(we,Le)=>{const[Me,Ue]=D(Le,le-Se);return[(we-.5)*V,Me+ve(we,Le),Ue]})}const O=T>1.2?2:1;for(let j=0;j<O;j++){const X=T>1.2?.57:T*.68,V=K+(j-(O-1)/2)*.68,le=(Se,H)=>{const ve=V-K+(H-.5)*X,we=.5+ve*.7/(T-.238),Le=(-R/2+.42+(Se-.5)*.43)/(R-.24)+.5;return D(we,0)[0]+.0025*Math.sin(Le*Math.PI*6)*Math.sin(we*Math.PI)**2};v(g+"-pillow-"+j,z-R/2+.42,re,V,20,16,(Se,H)=>[(Se-.5)*.43,le(Se,H)+.011+.11*Math.sin(Math.PI*Se)*Math.sin(Math.PI*H),(H-.5)*X],"linen",0,.011,(Se,H)=>[(Se-.5)*.43,le(Se,H),(H-.5)*X])}i(g,F,"furnishing")}function P(g,z,re,K,R,T,F=1,Q=0){re=u(F);const k=p(z,re,K,Q);for(const Y of[-R/2+.065,R/2-.065])for(const $ of[-T/2+.065,T/2-.065])k.b(g+"-foot-"+Y+"-"+$,[.085,.12,.085],[Y,.06,$],"oak");k.b(g+"-bottom",[R-.09,.045,T-.09],[0,.12,0],"oak");for(const Y of[-T/2+.025,T/2-.025]){k.b(g+"-rebate-backing-"+Y,[R-.06,.34,.012],[0,.305,Y-Math.sign(Y)*.024],"oak",!1,{grainAxis:[0,1,0]});for(let $=0;$<4;$++)k.b(g+"-panel-"+Y+"-"+$,[R/4-.001,.35,.05],[-R/2+($+.5)*R/4,.305,Y],$%3?"oak":"oakLight",!0)}for(const Y of[-R/2+.025,R/2-.025])k.b(g+"-end-"+Y,[.05,.35,T-.1],[Y,.305,0],"oak",!0,{grainAxis:[0,1,0]});for(let Y=0;Y<3;Y++)k.b(g+"-lid-board-"+Y,[R+.035,.045,T/3-.002],[0,.5025,-T/2+(Y+.5)*T/3],"oakLight",!0);k.b(g+"-lid-rebate",[R+.027,.012,T-.006],[0,.481,0],"oak");for(const Y of[-R*.3,R*.3]){k.b(g+"-lid-strap-"+Y,[.035,.008,T+.03],[Y,.529,0],"iron"),k.b(g+"-front-strap-"+Y,[.035,.33,.008],[Y,.315,T/2+.004],"iron"),k.b(g+"-lid-hinge-leaf-"+Y,[.04,.008,.045],[Y,.505,-T/2+.01],"iron");const $=l([-Math.sin(Q),0,-Math.cos(Q)],Math.PI/2),D=[{x:.008,y:-.021},{x:.014,y:-.021},{x:.014,y:.021},{x:.008,y:.021},{x:.008,y:-.021}];e(g+"-lid-knuckle-"+Y,s({profile:D,segments:28}),k.point([Y,.489,-T/2-.012]),"iron",$),e(g+"-hinge-pin-"+Y,s({profile:[{x:0,y:-.044},{x:.015,y:-.044},{x:.015,y:-.023},{x:.007,y:-.023},{x:.007,y:.023},{x:.015,y:.023},{x:.015,y:.044},{x:0,y:.044}],segments:28}),k.point([Y,.489,-T/2-.012]),"iron",$),k.b(g+"-hinge-leaf-"+Y,[.088,.14,.009],[Y,.42,-T/2-.0045],"iron");for(const O of[-T*.32,0,T*.32])k.b(g+"-lid-rivet-"+Y+"-"+O,[.014,.02,.014],[Y,.528,O],"ironWarm",!0);for(const O of[.17,.3,.45])k.b(g+"-rivet-"+Y+"-"+O,[.013,.013,.018],[Y,O,T/2+.005],"iron")}k.b(g+"-lock",[.07,.105,.022],[0,.422,T/2+.011],"iron"),k.b(g+"-keyhole",[.008,.02,.003],[0,.415,T/2+.0235],"charcoal");for(const Y of[-.023,.023])k.b(g+"-lid-hasp-side-"+Y,[.014,.08,.009],[Y,.471,T/2+.03],"iron");for(const Y of[.5175])k.b(g+"-lid-hasp-end-"+Y,[.06,.014,.009],[0,Y,T/2+.03],"iron");k.b(g+"-lid-hasp-return",[.06,.009,.044],[0,.522,T/2+.012],"iron"),k.tube(g+"-lock-staple",[[-.012,.459,T/2+.019],[-.012,.459,T/2+.046],[.012,.459,T/2+.046],[.012,.459,T/2+.019]],.008,"iron"),c({id:g+"-lid",parent:g,prefix:g+"-lid-",level:F,pivot:k.point([0,.489,-T/2-.012]),restAngle:Q,axis:[1,0,0],travel:-Math.PI*.48,kind:"furnishing-lid"}),i(g,F,"furnishing",{frontAngle:Q})}function C(g,z,re,K,R,T,F,Q=0){re=u(Q);const k=p(z,re,K),Y=R/2-.04,$=F/2-.055;for(const O of[-Y,Y])for(const j of[-$,0,$])k.b(g+"-upright-"+O+"-"+j,[.07,T,.085],[O,T/2,j],"oak",!0);const D=[];for(let O=0;O<4;O++){const j=.13+O*(T-.16)/3;D.push(j+.023),k.b(g+"-board-"+O,[R,.046,F],[0,j,0],"oakLight",!0);for(const X of[-$,$])k.b(g+"-cleat-"+O+"-"+X,[R-.05,.045,.05],[0,j-.045,X],"oak")}k.line(g+"-rear-brace",[-Y,.12,-$],[-Y,T-.07,$],.04,"oak");for(let O=0;O<3;O++)for(let j=0;j<Math.floor(F/.31);j++){const X=-F/2+.18+j*.31;if(Q===0)if((j+O)%3===1){const V=g+"-grain-sack-"+O+"-"+j,le=[[.075,0],[.1,.025],[.112,.085],[.098,.175],[.0295,.232],[.0295,.24],[.038,.263],[.008,.272]],Se=24,H=le.map(([we,Le],Me)=>Array.from({length:Se},(Ue,Ye)=>{const $e=Ye*2*Math.PI/Se,rt=1+(Me>3?.055:.022)*Math.sin($e*7+j);return[we*Math.cos($e)*rt,Le,Me>3?we*Math.sin($e)*rt:we*.82*Math.sin($e)*rt]})),ve=[];for(let we=0;we<Se;we++){const Le=(we+1)%Se;ve.push([[0,le[0][1],0],H[0][we],H[0][Le]],[[0,le.at(-1)[1],0],H.at(-1)[Le],H.at(-1)[we]])}for(let we=0;we<H.length-1;we++)for(let Le=0;Le<Se;Le++){const Me=(Le+1)%Se;ve.push([H[we][Le],H[we+1][Le],H[we+1][Me]],[H[we][Le],H[we+1][Me],H[we][Me]])}h(V,ve,k.point([.015,D[O],X]),"linenDark",k.r),k.hoop(g+"-sack-tie-"+O+"-"+j,[.015,D[O]+.235,X],.031,.006,"linen","xz"),k.tube(V+"-tie-ends",[[.045,D[O]+.235,X],[.063,D[O]+.233,X+.009],[.073,D[O]+.211,X+.012]],.005,"linen")}else k.vessel(g+"-crock-"+O+"-"+j,Math.min(.115,R*.29),.21+O*.028,[.015,D[O],X],j%3?"clay":"clayLight"),k.cyl(g+"-jar-lid-"+O+"-"+j,.084,.017,[.015,D[O]+.21+O*.028,X],"oakLight");else b(g+"-folded-cloth-"+O+"-"+j,z,re+D[O],K+X,R-.16,.24,j%2?"linen":"linenDark")}i(g,Q,"furnishing",{frontAngle:Math.PI/2})}function W(g,z,re,K,R,T,F,Q=0,k=0,Y="vessels"){re=u(Q);const $=p(z,re,K,k);for(const D of[-R/2+.055,R/2-.055])for(const O of[-F/2+.055,F/2-.055])$.b(g+"-leg-"+D+"-"+O,[.07,T,.07],[D,T/2,O],"oak",!0);$.b(g+"-back",[R-.1,T-.15,.035],[0,(T+.15)/2,-F/2+.023],"oak");for(const D of[-R/2+.025,R/2-.025])$.b(g+"-side-"+D,[.04,T-.15,F-.09],[D,(T+.15)/2,0],"oak");$.b(g+"-top",[R+.045,.06,F+.035],[0,T+.03,0],"oakLight",!0);for(let D=0;D<3;D++){const O=.15+D*(T-.22)/3;if($.b(g+"-shelf-"+D,[R-.08,.045,F-.065],[0,O,0],"oakLight"),Y==="clothes"||Y==="linen"){const j=$.point([0,O+.0225,.01]);b(g+"-linen-stack-"+D,...j,R-.17,F-.12,D===1?"quiltSage":"linen",k)}else if(Y==="books"){const j=Math.floor((R-.18)/.09);for(let X=0;X<j;X++){const V=-R/2+.11+X*.09,le=.215+.055*((X*7+D*3)%11)/10;$.b(g+"-pages-"+D+"-"+X,[.056,le,F-.107],[V,O+.0225+le/2,.01],"paper");for(const Se of[-.033,.033])$.b(g+"-cover-"+D+"-"+X+"-"+Se,[.01,le,F-.105],[V+Se,O+.0225+le/2,.01],"leather",!0);$.b(g+"-spine-"+D+"-"+X,[.071,le,.017],[V,O+.0225+le/2,F/2-.035],"leather");for(const Se of[.05,le-.05])$.b(g+"-binding-band-"+D+"-"+X+"-"+Se,[.073,.012,.019],[V,O+.0225+Se,F/2-.032],"linenDark")}}else if(Y==="shoes")for(const j of[-.09,.09]){const X=g+"-shoe-"+D+"-"+j,V=O+.0225;$.b(X+"-sole",[.1,.018,.2],[j,V+.009,.005],"leather",!0),$.m(X+"-heel-upper",s({profile:[{x:0,y:0},{x:.044,y:0},{x:.043,y:.068},{x:.035,y:.074},{x:.03,y:.074},{x:.036,y:.018},{x:0,y:.018}],segments:24}),[j,V+.018,-.035],"leather");const le=Array.from({length:7},(H,ve)=>{const we=ve/6,Le=-.012+we*.108,Me=.045*(1-.72*we**3);return Array.from({length:12},(Ue,Ye)=>{const $e=Ye*Math.PI*2/12;return[j+Me*Math.cos($e),V+.035+.019*Math.sin($e)*(1-.65*we),Le]})}),Se=[le[0].toReversed(),le.at(-1)];for(let H=0;H<6;H++)for(let ve=0;ve<12;ve++){const we=(ve+1)%12;Se.push([le[H][ve],le[H][we],le[H+1][we]],[le[H][ve],le[H+1][we],le[H+1][ve]])}h(X+"-toe-box",Se,$.point([0,0,0]),"leather",$.r);for(const H of[-1,1])$.line(X+"-lace-"+H,[j+H*.027,V+.067,-.015],[j-H*.021,V+.061,.027],.003,"linenDark")}else{const j=Math.max(1,Math.floor((R-.12)/.22));for(let X=0;X<j;X++)$.vessel(g+"-vessel-"+D+"-"+X,Math.min(.075,(F-.09)/2),.15+D*.025,[(X-(j-1)/2)*.22,O+.0225,.015],X%2?"clayLight":"clay")}}if(Y==="clothes"||Y==="linen")for(const D of[-1,1]){const O=g+"-door-"+D,j=R/2-.01,X=T-.16,V=D*(R/2-.004),le=V-D*j,Se=(V+le)/2;for(const H of[V-D*.021,le+D*.021])$.b(O+"-stile-"+H,[.042,X,.028],[H,.155+X/2,F/2+.018],"oak",!0);for(const H of[.155+.032,T-.005-.032])$.b(O+"-rail-"+H,[j-.042,.064,.028],[Se,H,F/2+.018],"oakLight",!0);$.b(O+"-recessed-panel",[j-.076,X-.112,.015],[Se,.155+X/2,F/2+.015],"oakLight");for(const H of[.25,T-.1]){$.b(O+"-hinge-strap-"+H,[.09,.026,.008],[V-D*.034,H,F/2+.036],"iron"),$.m(O+"-hinge-knuckle-"+H,s({profile:[{x:.008,y:0},{x:.013,y:0},{x:.013,y:.056},{x:.008,y:.056},{x:.008,y:0}],segments:28}),[V,H-.028,F/2+.047],"iron"),$.m(g+"-fixed-door-pin-"+D+"-"+H,s({profile:[{x:0,y:0},{x:.013,y:0},{x:.013,y:.009},{x:.007,y:.009},{x:.007,y:.074},{x:0,y:.074}],segments:28}),[V,H-.037,F/2+.047],"iron");const ve=H<T/2?.13:T+.024;$.cyl(g+"-fixed-door-stem-"+D+"-"+H,.007,Math.abs(H-ve),[V,Math.min(H,ve),F/2+.047],"iron"),$.line(g+"-fixed-door-anchor-"+D+"-"+H,[V-D*.035,ve,F/2-.04],[V,ve,F/2+.047],.014,"iron");for(const we of[V-D*.027,V-D*.06])$.b(O+"-hinge-rivet-"+H+"-"+we,[.011,.011,.018],[we,H,F/2+.039],"ironWarm",!0)}$.line(O+"-pull-eye",[le+D*.028,.155+X*.55,F/2+.015],[le+D*.028,.155+X*.55,F/2+.057],.009,"iron"),$.hoop(O+"-pull",[le+D*.028,.155+X*.55-.024,F/2+.053],.026,.007,"iron"),c({id:O,parent:g,prefix:O+"-",level:Q,pivot:$.point([V,.155,F/2+.047]),restAngle:k,axis:[0,1,0],travel:D*Math.PI*.48,kind:"furnishing-door"})}i(g,Q,"furnishing",{frontAngle:k})}function S(g,z,re,K,R,T){re=u(0);const F=p(z,re,K),Q=R/2-.085,k=T/2-.07;for(const Y of[-Q,Q])for(const $ of[-k,k])F.b(g+"-leg-"+Y+"-"+$,[.1,.83,.1],[Y,.415,$],"oak",!0);for(const Y of[.16,.47])F.b(g+"-shelf-"+Y,[R-.08,.045,T-.06],[0,Y,0],"oakLight");for(const Y of[-k,k])F.b(g+"-apron-"+Y,[R-.1,.14,.05],[0,.76,Y],"oak");for(let Y=0;Y<3;Y++)F.b(g+"-worktop-"+Y,[R,.06,T/3-.003],[0,.86,(Y-1)*T/3],"oakLight",!0);for(let Y=0;Y<4;Y++)F.vessel(g+"-lower-pot-"+Y,.13,.24,[-R*.32+Y*R*.21,.1825,0],"clay");F.vessel(g+"-mixing-bowl",.18,.12,[-.65,.89,0],"clayLight"),F.vessel(g+"-pitcher",.1,.26,[.62,.89,-.02],"clay",!0),F.cyl(g+"-water-jug-cover-plug",.059,.016,[.62,1.134,-.02],"oakLight"),F.cyl(g+"-water-jug-cover-cap",.076,.015,[.62,1.15,-.02],"oakLight"),F.cyl(g+"-water-jug-cover-knob",.012,.025,[.62,1.165,-.02],"oak"),F.b(g+"-cutting-board",[.4,.025,.25],[0,.9025,.06],"oak",!0),F.b(g+"-knife-blade",[.16,.008,.032],[.02,.921,.06],"iron"),F.b(g+"-knife-grip",[.085,.017,.03],[.142,.923,.06],"oak");for(const Y of[-R*.32,R*.32])F.b(g+"-rack-post-"+Y,[.045,.43,.045],[Y,1.055,-T/2+.045],"oak");F.b(g+"-rack",[R*.74,.06,.04],[0,1.24,-T/2+.045],"oak");for(let Y=0;Y<5;Y++){const $=-R*.28+Y*R*.14,D=-T/2+.115,O=Y===2?"iron":"oakLight";if(F.line(g+"-peg-"+Y,[$,1.24,-T/2+.045],[$,1.24,-T/2+.13],.01,"oak"),F.hoop(g+"-tool-eye-"+Y,[$,1.231,D],.017,.006,O),F.line(g+"-tool-handle-"+Y,[$,1.221,D],[$,1.009,D],.012,O),Y===3){for(const j of[-.02,0,.02])F.line(g+"-fork-tine-"+j,[$+j,1.019,D],[$+j,.964,D],.009,O);F.line(g+"-fork-crosspiece",[$-.02,1.014,D],[$+.02,1.014,D],.012,O)}else{const j=Y===2?.038:.027,X=[[0,0],[j*.6,0],[j,.009],[j,.014],[j-.005,.014],[j*.52,.004],[0,.004]];e(g+"-spoon-bowl-"+Y,s({profile:X.map(([V,le])=>({x:V,y:le})),segments:20}),F.point([$,.995,D]),O,l([1,0,0],Math.PI/2))}}i(g,0,"furnishing")}function N(g,z,re,K,R=1){re=u(R);const T=R===1?Math.PI/2:0,F=p(z,re,K,T),Q=.7,k=R===1?.48:.72;for(const X of[-.27,.27])for(const V of[-k/2+.08,k/2-.08])F.b(g+"-leg-"+X+"-"+V,[.065,.73,.065],[X,.365,V],"oak",!0);F.b(g+"-shelf",[.62,.035,k-.1],[0,.18,0],"oakLight"),F.b(g+"-slab",[Q,.07,k],[0,.765,0],"stone",!0),F.vessel(g+"-basin",R===1?.18:.21,.12,[-.07,.8,R===1?.01:.07],"clayLight"),F.vessel(g+"-jug",.075,.24,[.22,.8,-k/2+.09],"clay",!0),F.cyl(g+"-jug-lid",.054,.012,[.22,1.04,-k/2+.09],"oakLight"),F.vessel(g+"-waste-pail",.17,.29,[0,.1975,0],"oakLight",!1,"pail");for(const X of[.245,.45])F.hoop(g+"-pail-hoop-"+X,[0,X,0],.17*(.77+.23*(X-.1975)/.29)+.005,.012,"iron","xz");if(F.hoop(g+"-pail-bail",[0,.46,0],.165,.012,"iron","xy",0,Math.PI),R===1){F.tube(g+"-towel-rail",[[.38,.69,-.16],[.38,.69,.16]],.022,"oak");for(const X of[-.16,.16])F.line(g+"-rail-support-"+X,[.27,.69,X],[.38,.69,X],.018,"oak");_(g+"-towel",...F.point([.38,.69,0]),.28,"linen",T+Math.PI/2,.014)}else{F.tube(g+"-towel-rail",[[-.29,.69,k/2+.035],[.29,.69,k/2+.035]],.022,"oak");for(const X of[-.27,.27])F.line(g+"-rail-support-"+X,[X,.69,k/2-.08],[X,.69,k/2+.035],.018,"oak");_(g+"-towel",...F.point([0,.69,k/2+.035]),.28,"linen",T,.014)}i(g,R,"furnishing",{frontAngle:T});const Y=R===1?3.96:6.15,$=R===1?4.65:1.02,D=p(Y,re,$),O=R===1?.42:.34,j=R===1?.52:.43;D.cyl(g+"-tub-bottom",O*.8,.065,[0,0,0],"oak");for(let X=0;X<28;X++){const V=X*Math.PI*2/28,le=(X+1)*Math.PI*2/28,Se=(Ue,Ye)=>[[Math.cos(V)*Ue,Ye,Math.sin(V)*Ue],[Math.cos(le)*Ue,Ye,Math.sin(le)*Ue]],H=Se(O*.83,.04),ve=Se(O,j),we=Se(O*.83-.025,.04),Le=Se(O-.025,j),Me=[[H[0],ve[0],ve[1],H[1]],[we[1],Le[1],Le[0],we[0]],[ve[0],Le[0],Le[1],ve[1]],[H[1],we[1],we[0],H[0]],[H[0],we[0],Le[0],ve[0]],[H[1],ve[1],Le[1],we[1]]];h(g+"-tub-stave-"+X,Me,[Y,re,$],X%3?"oakLight":"oakPale")}for(const X of[.13,j-.07])D.hoop(g+"-tub-band-"+X,[0,X,0],O*.83+O*.17*(X-.04)/(j-.04)+.006,.019,"iron","xz");R===0&&D.vessel(g+"-soap-crock",.07,.1,[O*.48,.065,0],"clayLight"),v(g+"-tub-linen",Y,re,$,24,36,(X,V)=>{const le=(X-.5)*.23,Se=V*3,H=Math.sqrt(O*O-le*le),ve=Math.sqrt((O-.025)**2-le*le);let we,Le;if(Se<1)Le=j-.14*(1-Se),we=ve-.004-(1-Se)*.012;else if(Se<2)we=ve-.004+(H-ve+.008)*(Se-1),Le=j+.003+.002*Math.sin((Se-1)*Math.PI);else{Le=j-.24*(Se-2);const Me=.019*Math.exp(-(((Le-(j-.07))/.035)**2));we=H+.004-(Se-2)*O*.17*.24/(j-.04)+Me}return[we,Le,le]},"linen"),D.line(g+"-wash-paddle",[O*.25,.06,-O*.2],[O*.6,j+.16,-O*.35],.032,"oakLight"),i(g+"-tub",R,"furnishing")}function J(g,z,re,K,R,T,F=0){re=u(F);const Q=T>R?Math.PI/2:0;T>R&&([R,T]=[T,R]);const k=p(z,re,K,Q);v(g+"-woven-base",z,re+.006,K,Math.ceil(R/.05),16,(Y,$)=>[(Y-.5)*R,0,($-.5)*T],"linenDark",Q,.006);for(const Y of[-T/2+.024,T/2-.024])k.b(g+"-selvedge-"+Y,[R,.002,.026],[0,.007,Y],"linen");for(const Y of[-R/2,R/2])for(let $=0;$<Math.floor(T/.02);$++)k.tube(g+"-fringe-"+Y+"-"+$,[[Y,.005,-T/2+.01+$*.02],[Y+Math.sign(Y)*.025,.004,-T/2+.014+$*.02],[Y+Math.sign(Y)*.047,.003,-T/2+.011+$*.02]],.002,"linen");i(g,F,"furnishing")}function se(g,z,re,K,R=0,T=0){const F=p(z,re,K,T);F.b(g+"-plate",[.07,.26,.015],[0,0,0],"iron",!0);for(const Q of[-.095,.095])F.b(g+"-nail-"+Q,[.02,.02,.016],[0,Q,.006],"iron");F.line(g+"-bracket",[0,-.07,.004],[0,-.1,.16],.022,"iron"),F.line(g+"-stem",[0,-.1,.16],[0,.02,.16],.022,"iron"),F.vessel(g+"-drip-cup",.065,.025,[0,.01,.16],"iron"),F.cyl(g+"-candle",.023,.14,[0,.02,.16],"wax"),F.cyl(g+"-wick",.003,.016,[0,.16,.16],"charcoal",8),F.m(g+"-flame",s({profile:[{x:0,y:0},{x:.007,y:.004},{x:.013,y:.013},{x:.014,y:.023},{x:.011,y:.032},{x:.007,y:.043},{x:.003,y:.054},{x:0,y:.062}],segments:32}),[0,.167,.16],"flame"),i(g,R,"furnishing",{frontAngle:T})}function _e(g,z,re,K,R=1){re=u(R);const T=p(z,re,K),F=.6,Q=.57;for(const Y of[-.25,.25])for(const $ of[-.23,.23])T.b(g+"-post-"+Y+"-"+$,[.07,.43,.07],[Y,.215,$],"oak",!0);for(const Y of[-.276,.276])T.b(g+"-side-"+Y,[.045,.35,.5],[Y,.255,0],"oakLight");T.b(g+"-back",[.51,.35,.04],[0,.255,-.26],"oak"),T.b(g+"-removable-front",[.51,.36,.025],[0,.25,.26],"oakLight",!0),T.hoop(g+"-front-pull",[0,.3,.28],.035,.009,"iron"),T.line(g+"-front-pull-eye",[0,.331,.262],[0,.331,.283],.01,"iron");const k=Array.from({length:32},(Y,$)=>({x:.15*Math.cos($*Math.PI/16),y:.17*Math.sin($*Math.PI/16)}));e(g+"-pierced-seat",o({outer:[{x:-F/2,y:-Q/2},{x:F/2,y:-Q/2},{x:F/2,y:Q/2},{x:-F/2,y:Q/2}],holes:[k],depth:.045}),[z,re+.4525,K],"oakLight",l([1,0,0],Math.PI/2)),T.vessel(g+"-chamber-pot",.205,.32,[0,0,0],"clayLight",!1,"pail"),e(g+"-transport-lid",s({profile:[{x:0,y:-.006},{x:.205,y:-.006},{x:.205,y:.006},{x:0,y:.006}],segments:32}),T.point([0,.205,-.225]),"oakLight",l([1,0,0],Math.PI/2)),T.hoop(g+"-transport-lid-pull",[0,.215,-.2],.022,.007,"iron"),T.line(g+"-transport-lid-eye",[0,.234,-.229],[0,.234,-.198],.009,"iron"),T.b(g+"-raised-lid",[.38,.3,.035],[0,.635,-.255],"oak",!0),T.line(g+"-lid-pin",[-.16,.484,-.25],[.16,.484,-.25],.018,"iron"),i(g,R,"furnishing")}function me(g,z,re,K,R,T,F){const Q=g.startsWith("kitchen"),k=Q?Math.PI:0,Y=.45,$=p(z,Y,K,k),D=1.02,O=-F/2+.055;$.b(g+"-hearthstone",[R+.18,.08,F+.3],[0,.04,.06],"stoneDark",!0);for(const Me of[-R/2+.1,R/2-.1])for(let Ue=0;Ue<5;Ue++)$.b(g+"-jamb-"+Me+"-"+Ue,[.2,(D-.08)/5-.006,F],[Me,.08+(Ue+.5)*(D-.08)/5,0],Ue%2?"stone":"stoneLight",!0);for(const Me of[-R/2+.1,R/2-.1])for(let Ue=0;Ue<=5;Ue++){const Ye=Ue===0||Ue===5?.003:.006,$e=.08+Ue*(D-.08)/5+(Ue===0?.0015:Ue===5?-.0015:0);$.b(g+"-jamb-bed-joint-"+Me+"-"+Ue,[.194,Ye,F-.006],[Me,$e,0],"plaster")}$.b(g+"-fireback",[R-.4,D-.08,.11],[0,(D+.08)/2,O],"charcoal"),$.b(g+"-lintel",[R,.15,.18],[0,D+.075,F/2-.09],"stoneDark",!0);const j=1.95-Y,X=(Q?-1.57:-1.03)-K,V=X*Math.cos(k),le=(Me,Ue,Ye,$e)=>[[-Me/2,Ye,$e-Ue/2],[Me/2,Ye,$e-Ue/2],[Me/2,Ye,$e+Ue/2],[-Me/2,Ye,$e+Ue/2]],Se=le(R,F,D,0),H=le(.9,.6,j,V),ve=le(R-.24,F-.2,D,0),we=le(.66,.36,j,V),Le=[];for(let Me=0;Me<4;Me++){const Ue=(Me+1)%4;Le.push([Se[Me],Se[Ue],H[Ue],H[Me]],[ve[Ue],ve[Me],we[Me],we[Ue]],[H[Me],H[Ue],we[Ue],we[Me]],[Se[Ue],Se[Me],ve[Me],ve[Ue]])}h(g+"-hollow-hood",Le.map(Me=>Me.toReversed()),[z,Y,K],"plaster",$.r);for(const Me of[-R*.22,R*.22])$.line(g+"-andiron-leg-"+Me,[Me,.08,.14],[Me,.28,.14],.035,"iron"),$.line(g+"-andiron-foot-"+Me,[Me,.1,-.19],[Me,.1,.26],.035,"iron"),$.line(g+"-andiron-rest-"+Me,[Me,.2,-.18],[Me,.2,.2],.03,"iron");for(let Me=0;Me<3;Me++){const Ue=Me===1?[0,.3395,-.16]:[-R*.28,.2565,(Me-1)*.1],Ye=Me===1?[0,.3395,.16]:[R*.28,.2565,(Me-1)*.1];$.tube(g+"-log-"+Me,[Ue,Ye],.083,Me===1?"charcoal":"oak");for(let $e=0;$e<4;$e++)$.tube(g+"-charred-bark-"+Me+"-"+$e,[Ue.map((rt,Z)=>rt+(Z===1?.036:Z===(Me===1?0:2)?($e-1.5)*.015:0)),Ye.map((rt,Z)=>rt+(Z===1?.036:Z===(Me===1?0:2)?($e-1.5)*.015:0))],.012,"charcoal")}for(let Me=0;Me<23;Me++){const Ue=R*.52*(Me*.618%1-.5),Ye=.32*(Me*.414%1-.5);$.m(g+"-coal-"+Me,s({profile:[{x:0,y:0},{x:.022+Me%3*.007,y:0},{x:.027,y:.018},{x:0,y:.033}],segments:7}),[Ue,.08,Ye],Me%4?"charcoal":"ember")}for(let Me=0;Me<5;Me++){const Ue=(Me-2)*R*.095,Ye=-.035+Me%2*.085,$e=.15+Me%3*.026;$.m(g+"-tongue-fuel-"+Me,s({profile:[{x:0,y:0},{x:.028,y:0},{x:.033,y:.01},{x:.024,y:.026},{x:0,y:.029}],segments:20}),[Ue,.08,Ye],"ember");const rt=Array.from({length:8},(Ae,L)=>{const x=L/8,ce=.008*(1-x)+.025*Math.sin(x*Math.PI)**1.4;return Array.from({length:20},(ge,ye)=>[Ue+.024*x*x*Math.sin(Me*1.7)+ce*Math.cos(ye*Math.PI/10),.095+$e*x,Ye+.012*x*x+ce*.65*Math.sin(ye*Math.PI/10)])}),Z=[rt[0].toReversed()],pt=[Ue+.024*Math.sin(Me*1.7),.095+$e,Ye+.012];for(let Ae=0;Ae<7;Ae++)for(let L=0;L<20;L++){const x=(L+1)%20;Z.push([rt[Ae][L],rt[Ae][x],rt[Ae+1][x]],[rt[Ae][L],rt[Ae+1][x],rt[Ae+1][L]])}for(let Ae=0;Ae<20;Ae++)Z.push([rt[7][Ae],rt[7][(Ae+1)%20],pt]);h(g+"-fire-tongue-"+Me,Z,[z,Y,K],"flame",$.r)}if(Q){$.line(g+"-crane-upright",[R*.31,.08,0],[R*.31,1.027,0],.035,"iron");for(const Me of[.18,.72])$.b(g+"-crane-anchor-"+Me,[.11,.06,.075],[R*.31,Me,0],"iron"),$.line(g+"-crane-fixing-"+Me,[R*.31,Me,0],[R/2-.12,Me,0],.025,"iron");$.line(g+"-crane-arm",[R*.31,.987,0],[0,.987,.04],.025,"iron");for(let Me=0;Me<7;Me++){const Ue=.981-Me*.037;$.tube(g+"-chain-link-"+Me,Array.from({length:20},(Ye,$e)=>{const rt=$e*Math.PI/10;return Me%2?[.013*Math.cos(rt),Ue+.021*Math.sin(rt),.04]:[0,Ue+.021*Math.sin(rt),.04+.013*Math.cos(rt)]}),.005,"iron",!0)}$.hoop(g+"-bail",[0,.5765,.04],.17,.012,"iron","xy",0,Math.PI),$.vessel(g+"-cookpot",.17,.19,[0,.4,.04],"iron",!1,"pail");for(const Me of[-.17,.17])$.b(g+"-bail-ear-"+Me,[.025,.042,.023],[Me,.5755,.04],"iron")}i(g,0,"furnishing")}function w(g,z,re,K=1){const R=p(z,u(K),re);for(const T of[-.19,.19])for(const F of[-.16,.16])R.b(g+"-leg-"+T+"-"+F,[.06,.6,.06],[T,.3,F],"oak",!0);for(const T of[.15,.61])R.b(g+"-board-"+T,[.47,.04,.41],[0,T,0],"oakLight",!0);R.vessel(g+"-water-jug",.085,.23,[-.07,.63,-.05],"clay",!0),R.cyl(g+"-jug-lid",.061,.012,[-.07,.86,-.05],"oakLight"),R.vessel(g+"-cup",.042,.08,[.12,.63,.1],"clayLight",!1,"cup"),i(g,K,"furnishing")}function G(g,z,re){const K=u(0),R=p(z,K,re);for(const T of[-.39,.39])R.b(g+"-foot-"+T,[.08,.05,.44],[T,.025,0],"oak"),R.b(g+"-upright-"+T,[.045,1.16,.045],[T,.63,0],"oak");for(const T of[.47,.84,1.2])R.tube(g+"-drying-rail-"+T,[[-.39,T,0],[.39,T,0]],.024,"oak");for(const T of[-.2,.17])_(g+"-drying-cloth-"+T,z+T,K+1.2,re,.25);R.line(g+"-broom-handle",[.48,.13,.03],[.48,1.3,.03],.025,"oak"),R.line(g+"-broom-holder-arm",[.39,.84,0],[.48,.84,.03],.018,"iron"),R.hoop(g+"-broom-holder",[.48,.84,.03],.016,.007,"iron","xz");for(let T=0;T<19;T++){const F=T*Math.PI*2/19;R.line(g+"-broom-straw-"+T,[.48+.065*Math.cos(F),.005,.03+.036*Math.sin(F)],[.48+.013*Math.cos(F),.28,.03+.013*Math.sin(F)],.006,"linenDark")}R.hoop(g+"-broom-binding",[.48,.22,.03],.023,.009,"linen","xz"),R.vessel(g+"-closed-water-pail",.18,.32,[-.62,0,.04],"oakLight",!1,"pail");for(const T of[.06,.28])R.hoop(g+"-water-band-"+T,[-.62,T,.04],.18*(.77+.23*T/.32)+.004,.012,"iron","xz");R.cyl(g+"-pail-lid",.18,.018,[-.62,.32,.04],"oakLight"),R.hoop(g+"-carry-bail",[-.62,.29,.04],.175,.012,"iron","xy",0,Math.PI),i(g,0,"furnishing")}return{bevel:f,at:p,cloth:m,table:I,bench:ne,bed:A,chest:P,shelf:C,cabinet:W,counter:S,washBasin:N,rug:J,wallLamp:se,latrineUnit:_e,hearth:me,nightStand:w,serviceTools:G}}function Yg({box:n,mesh:e,beam:t,finish:i,polyhedron:r,revolve:s,extrude:o,V:a,Q:l,bevel:c,registerMechanism:u}){const h=[-1.7,2.35],f=[1.65,3.65],p=[],v=(w,G,g,z)=>p.push({id:w,material:G,faces:g,grainAxis:z}),b=(w,G,g)=>{for(const z of p)e(z.id,r(z.faces.map(re=>re.map(a))),[0,0,0],z.material,void 0,{grainAxis:z.grainAxis});p.length=0,i(w,G,g)},_=w=>Math.sin(w*127.1+73.7)*43758.5453%1,m=(w,G,g,z=1,re="stone")=>{const K=[[-.45,.78],[0,1],[.43,.78]],R=K.map(([F,Q],k)=>Array.from({length:9},(Y,$)=>{const D=$*Math.PI*2/9+z*.71,O=1+_(z+$*13)*.18;return[G[0]+Math.cos(D)*g[0]*Q*O/2,G[1]+(F+_(z+$*5+k*31)*.06)*g[1],G[2]+Math.sin(D)*g[2]*Q*O/2]})),T=[];for(let F=1;F<8;F++)T.push([R[0][0],R[0][F],R[0][F+1]],[R[2][0],R[2][F+1],R[2][F]]);for(let F=0;F<2;F++)for(let Q=0;Q<9;Q++){const k=(Q+1)%9;T.push([R[F][Q],R[F+1][Q],R[F+1][k]],[R[F][Q],R[F+1][k],R[F][k]])}v(w,re,T)},I=(w,G,g,z,re,K="bark")=>{const R=g.map((X,V)=>X-G[V]),T=Math.hypot(...R),F=R.map(X=>X/T),Q=Math.abs(F[1])<.9?[F[2],0,-F[0]]:[0,F[2],-F[1]],k=Math.hypot(...Q);for(let X=0;X<3;X++)Q[X]/=k;const Y=[F[1]*Q[2]-F[2]*Q[1],F[2]*Q[0]-F[0]*Q[2],F[0]*Q[1]-F[1]*Q[0]],$=(X,V)=>Array.from({length:9},(le,Se)=>X.map((H,ve)=>H+V*(Q[ve]*Math.cos(Se*Math.PI*2/9)+Y[ve]*Math.sin(Se*Math.PI*2/9)))),D=$(G,z),O=$(g,re),j=[D.toReversed(),O];for(let X=0;X<9;X++)j.push([D[X],D[(X+1)%9],O[(X+1)%9],O[X]]);v(w,K,j,F)},ne=(w,G,g,z,re,K=0,R="leaves")=>{const T=Math.cos(g),F=Math.sin(g),Q=(D,O,j)=>[G[0]+T*D-F*O,G[1]+j+D*K,G[2]+F*D+T*O],k=[[0,0],[.16,-.3],[.42,-.5],[.7,-.41],[.91,-.19],[1,0],[.91,.19],[.7,.41],[.42,.5],[.16,.3]].map(([D,O])=>Q(D*z,O*re,.016*Math.sin(D*Math.PI)-z*.24*D*D)),Y=Q(z*.46,0,.018-z*.24*.46**2),$=[];for(let D=0;D<k.length;D++){const O=(D+1)%k.length;$.push([k[D],k[O],Y])}v(w,R,$)};e("site-earth",o({outer:[{x:-11.5,y:-8.5},{x:11.5,y:-8.5},{x:11.5,y:10.5},{x:-11.5,y:10.5}],holes:[((w,G,g,z=48)=>Array.from({length:z},(re,K)=>({x:w+g*Math.cos(K*2*Math.PI/z),y:G+g*Math.sin(K*2*Math.PI/z)})))(...h,1.3952380952380952)],depth:.6}),[0,-.3,0],"soil",l([1,0,0],Math.PI/2)),e("pond-excavation-bearing",s({profile:[{x:0,y:-.6},{x:1.3952380952380952,y:-.6},{x:1.3952380952380952,y:0},{x:1.3,y:-.4},{x:0,y:-.4}],segments:48}),[h[0],0,h[1]],"soil");for(let w=0;w<850;w++){const G=-10.4+20.8*(w*.61803398875%1),g=-7.4+17*(w*.41421356237%1);if(!(Math.abs(G)<7.9&&g<6.35||Math.abs(G-.1)<.75&&g>4||Math.hypot(G-h[0],g-h[1])<1.65))for(let z=0;z<3;z++)ne("ground-grass-"+w+"-"+z,[G,0,g],w+z*2.1,.12+w%5*.02,.017,1.1,"herbs")}b("site",-1,"site");const P=[[-.15,-.1],[.95,-.1],[.95,4.275],[3.2,4.275],[3.2,5.125],[.95,5.125],[.65,9.4],[-.45,9.4],[-.15,5.125],[-3.2,5.125],[-3.2,4.275],[-.15,4.275]];e("garden-path-union",o({outer:P.map(([w,G])=>({x:w,y:G})),depth:.036}),[0,.018,0],"gravel",l([1,0,0],Math.PI/2));for(let w=0;w<P.length;w++){const G=P[w],g=P[(w+1)%P.length],z=Math.hypot(g[0]-G[0],g[1]-G[1]);if(!(z<1||Math.abs(G[0]-g[0])>.001&&(Math.abs(G[1])<.2||G[1]>9.3)))for(let re=0;re<Math.floor(z/.28);re++){const K=(re+.5)/Math.floor(z/.28),R=G[0]+(g[0]-G[0])*K,T=G[1]+(g[1]-G[1])*K;T<1.08||m("path-edge-"+w+"-"+re,[R,.064,T],[.24,.12,.24],w*100+re,re%3?"stone":"stoneLight")}}for(let w=0;w<1700;w++){const G=-3.15+6.3*(w*.61803398875%1),g=.98+8.35*(w*.41421356237%1),z=g<=5.125?.3:.3*(9.4-g)/(9.4-5.125);(G>-.43+z&&G<.63+z||g>4.295&&g<5.105)&&m("gravel-"+w,[G,.038,g],[.028+w%3*.009,.012,.024],w,w%4?"gravel":"stoneLight")}b("garden-paths",-1,"garden");for(const[w,G,g,z,re]of[[0,1.95,1.9,1.8,1.3],[1,-1.5,5.55,1.3,.65]]){c("bed-earth-"+w,[z,.09,re],[G,.045,g],"soil",void 0,.035);for(let K=0;K<22;K++){const R=G+z*(K*.61803398875%1-.5)*.87,T=g+re*(K*.41421356237%1-.5)*.83,F=.2+K%5*.052,Q=[R+.035,.09+F,T];I("herb-"+w+"-"+K,[R,.09,T],Q,.009,.003,"herbs");for(let k=1;k<=5;k++)for(const Y of[-1,1])ne("herb-leaf-"+w+"-"+K+"-"+k+"-"+Y,[R+k*.006,.09+F*k/6,T],K*.9+k*.8+Y*Math.PI/2,K%3===1?.08:.11,K%3===1?.068:.038,.1,K%3?"herbs":"leafLight");if(K%3===0)for(let k=0;k<4;k++){const Y=[Q[0]+Math.cos(k*1.7)*.024,Q[1]+k*.015,Q[2]+Math.sin(k*1.7)*.024];I("flower-pedicel-"+w+"-"+K+"-"+k,Q,Y,.003,.002,"herbs"),m("herb-flower-"+w+"-"+K+"-"+k,Y,[.034,.038,.034],K+k,"flower")}}}b("herb-beds",-1,"garden"),e("pond-lined-basin",s({profile:[{x:0,y:-.4},{x:1.3,y:-.4},{x:1.4,y:.02},{x:1.3,y:.04},{x:1.2,y:-.06},{x:1.03,y:-.36},{x:0,y:-.36}],segments:64}),[h[0],0,h[1]],"stoneDark",void 0,{projected:!0});for(let w=0;w<29;w++){const G=w*Math.PI*2/29,g=1.3+_(w)*.025;m("pond-rim-"+w,[h[0]+g*Math.cos(G),.063+_(w+1)*.017,h[1]+g*Math.sin(G)],[.27+_(w+2)*.025,.17+_(w+3)*.055,.27+_(w+4)*.025],w,w%3?"stone":"stoneLight")}e("pond-water",s({profile:[{x:0,y:-.36},{x:1.03,y:-.36},{x:1.2,y:-.06},{x:1.215,y:-.045},{x:0,y:-.045}],segments:48}),[h[0],0,h[1]],"water");for(let w=0;w<18;w++){const G=w*.45,g=.85+w%3*.08,z=h[0]+Math.cos(G)*g,re=h[1]+Math.sin(G)*g;if(w%2===0){I("pond-reed-root-"+w,[z,-.375,re],[z,-.07,re],.018,.012,"herbs");for(let K=0;K<4;K++)ne("pond-reed-"+w+"-"+K,[z,-.07,re],G+K*.5,.32+K%2*.13,.026,1.5,"herbs")}else{I("pond-lily-stalk-"+w,[z,-.375,re],[z,-.045,re],.005,.004,"herbs");const K=[z,-.045,re],R=Array.from({length:18},(F,Q)=>{const k=.25+Q*(Math.PI*2-.5)/17;return[z+.069*Math.cos(k),-.044+.001*Math.sin(Q),re+.061*Math.sin(k)]}),T=[];for(let F=0;F<17;F++)T.push([K,R[F+1],R[F]]);v("pond-lily-"+w,"leafDark",T)}}for(let w=0;w<36;w++){const G=w*.7,g=.25+w%9*.08;m("submerged-stone-"+w,[h[0]+Math.cos(G)*g,-.33,h[1]+Math.sin(G)*g],[.12,.06,.09],w,"stoneDark")}b("pond",-1,"garden");const C=[[f[0],-.02,f[1]],[f[0]-.06,1.1,f[1]+.02],[f[0]-.17,2.25,f[1]-.08],[f[0]-.06,3.45,f[1]+.04]],W=[.18,.127,.091,.036],S=C.map((w,G)=>Array.from({length:9},(g,z)=>[w[0]+W[G]*Math.cos(z*Math.PI*2/9),w[1],w[2]+W[G]*Math.sin(z*Math.PI*2/9)])),N=[S[0].toReversed(),S.at(-1)];for(let w=0;w<3;w++)for(let G=0;G<9;G++){const g=(G+1)%9;N.push([S[w][G],S[w][g],S[w+1][g]],[S[w][G],S[w+1][g],S[w+1][G]])}v("trunk-continuous","bark",N.map(w=>w.toReversed()),[0,1,0]);const J=[f[0]+.19,4.3,f[1]-.09];I("trunk-leader",C[3],J,.036,.003);for(let w=0;w<10;w++){const G=(w+.5)/10,g=C[3].map((z,re)=>z+(J[re]-z)*G);ne("leader-leaf-"+w,g,w*2.399963,.12,.065,-.2+w%4*.15)}for(let w=0;w<5;w++){const G=w*1.27,g=.4+.11*(w%3),z=[f[0]+Math.cos(G)*g*.48,.065,f[1]+Math.sin(G)*g*.48],re=[f[0]+Math.cos(G+.12)*g,-.018,f[1]+Math.sin(G+.12)*g];I("root-neck-"+w,[f[0],.15,f[1]],z,.075,.038),I("root-tip-"+w,z,re,.038,.01)}for(let w=0;w<8;w++){const G=w*2.399963,g=w<3?1:2,z=w<3?.15+w*.15:(w-3)*.15,re=C[g].map((T,F)=>T+(C[g+1][F]-T)*z),K=[f[0]+Math.cos(G)*(1.26+w%2*.1),3.3+w%3*.4,f[1]+Math.sin(G)*(1.26+w%2*.1)],R=re.map((T,F)=>T+(K[F]-T)*.48+(F===1?.06:F===2?.06*Math.sin(w):0));I("bough-base-"+w,re,R,.062-.003*w,.034),I("bough-tip-"+w,R,K,.034,.003);for(let T=0;T<16;T++){const F=(T+.4)/16,Q=T<7?re.map((D,O)=>D+(R[O]-D)*(T+.5)/7):R.map((D,O)=>D+(K[O]-D)*(T-6.5)/9),k=G+(T%2?1:-1)*(.7+T*.09),Y=.22+.1*(1-F),$=[Q[0]+Math.cos(k)*Y,Q[1]+.04+T%3*.06,Q[2]+Math.sin(k)*Y];I("twig-"+w+"-"+T,Q,$,.01,.003);for(let D=0;D<13;D++){const O=(D+.5)/13,j=Q.map((V,le)=>V+($[le]-V)*O),X=k+D*2.399963;ne("apple-leaf-"+w+"-"+T+"-"+D,j,X,.11+D%3*.017,.07,-.38+(w*3+T+D)%7*.12,["leaves","leafLight","leafDark"][(w+T+D)%3])}if((w+T)%5===0){const D=[$[0],$[1]-.025,$[2]];I("fruit-stalk-"+w+"-"+T,$,[D[0],D[1]-.014,D[2]],.003,.002),e("apple-"+w+"-"+T,s({profile:[{x:0,y:-.085},{x:.025,y:-.083},{x:.043,y:-.055},{x:.042,y:-.023},{x:.022,y:-.005},{x:0,y:-.012}],segments:20}),D,"appleRed")}}}b("apple-tree",-1,"garden");const se=(w,G,g)=>{const z=Math.hypot(g[0]-G[0],g[1]-G[1]),re=(g[0]-G[0])/z,K=(g[1]-G[1])/z,R=-K,T=re,F=Math.ceil(z/.24);for(let Q=0;Q<=F;Q++){const k=z*Q/F;I(w+"-stake-"+Q,[G[0]+re*k,-.16,G[1]+K*k],[G[0]+re*k,.72+Q%3*.025,G[1]+K*k],.026,.017)}for(let Q=0;Q<8;Q++)for(let k=0;k<F;k++){const Y=z*k/F,$=z*(k+1)/F,D=(k+Q)%2?1:-1;for(let O=0;O<6;O++){const j=X=>{const V=Y+($-Y)*X,le=.027*D*Math.cos(Math.PI*X);return[G[0]+re*V+R*le,.1+Q*.073,G[1]+K*V+T*le]};I(w+"-withe-"+Q+"-"+k+"-"+O,j(O/6),j((O+1)/6),.013,.012,"bark")}}};se("fence-front-west",[-9,8.25],[-.55,8.25]),se("fence-front-east",[.75,8.25],[9,8.25]),se("fence-west",[-9,.15],[-9,8.25]),se("fence-east",[9,8.25],[9,.15]);for(const w of[-.55,.75])c("gate-post-"+w,[.11,.9,.11],[w,.45,8.25],"oak",void 0,.015);const _e=[-.49,0,8.25],me=(w,G,g)=>[_e[0]+w,G,_e[2]+g];for(let w=0;w<7;w++)t("gate-leaf-upright-"+w,me(.05+w*.18,.09,0),me(.05+w*.18,.76,0),.037,"oak");for(const w of[.19,.61])t("gate-leaf-rail-"+w,me(0,w,0),me(1.18,w,0),.055,"oakLight");t("gate-leaf-brace",me(.025,.18,.03),me(1.16,.62,.03),.039,"oak");for(const w of[.19,.61]){e("gate-pintle-"+w,s({profile:[{x:0,y:0},{x:.017,y:0},{x:.017,y:.02},{x:.009,y:.02},{x:.009,y:.14},{x:0,y:.14}],segments:20}),me(0,w-.07,0),"iron"),t("gate-fixed-anchor-"+w,[-.55,w-.06,8.25],me(0,w-.06,0),.02,"iron"),e("gate-leaf-knuckle-"+w,s({profile:[{x:.01,y:0},{x:.017,y:0},{x:.017,y:.1},{x:.01,y:.1},{x:.01,y:0}],segments:20}),me(0,w-.05,0),"iron"),t("gate-leaf-hinge-strap-"+w,me(0,w,.016),me(.3,w,.024),.018,"iron");for(const G of[.05,.14,.25])c("gate-leaf-rivet-"+w+"-"+G,[.013,.013,.03],me(G,w,.019),"ironWarm",void 0,.002)}t("gate-leaf-latch",me(.99,.6,-.033),me(1.23,.6,-.033),.02,"iron"),t("gate-leaf-latch-grip",me(1.08,.6,-.034),me(1.08,.55,-.045),.016,"iron"),n("gate-keeper",[.06,.06,.022],[.75,.6,8.215],"iron"),b("garden-fence",-1,"garden-boundary"),u({id:"garden-gate",parent:"garden-fence",prefix:"gate-leaf-",level:-1,pivot:_e,restAngle:0,axis:[0,1,0],travel:-Math.PI*.46,kind:"gate",default:1})}function $g(n){n.shadowMap.enabled=!0,n.localClippingEnabled=!0,n.shadowMap.type=Yl,n.toneMapping=Zo,n.toneMappingExposure=1.05}function Gl({shadows:n=!0,resolveTexture:e,geometryOnly:t=!1,instanceConsumer:i}={}){var nt,ke,Ge;const r=d=>{const y=new dt(d);return{r:y.r,g:y.g,b:y.b,a:1,hex:null}},s=Object.entries({oak:"#574331",oakLight:"#6b523d",oakPale:"#755d46",oakGrain:"#4b3d2e",plaster:"#d3c2a3",stone:"#929085",stoneLight:"#aaa496",stoneDark:"#68645c",roof:"#74503a",roofLight:"#80563c",roofMuted:"#79543e",floor:"#a4957a",upper:"#896f51",iron:"#363532",ironWarm:"#6b5541",glass:"#a2b3ac",water:"#476f73",soil:"#655e42",herbs:"#657d48",leaves:"#7d854c",leafLight:"#7e874b",leafDark:"#4a6137",flower:"#a96f63",gravel:"#b4a58b",bed:"#8e8876",linen:"#bda986",linenDark:"#87775f",quiltRust:"#795447",quiltSage:"#69765c",appleRed:"#8d4535",clay:"#8d654d",clayLight:"#b89874",charcoal:"#302b25",leather:"#65483b",paper:"#cfbd92",wax:"#d8bc83",flame:"#ffbd46",ember:"#d86b22",proxy:"#a88b61"}).map(([d,y])=>({id:d,name:d,baseColor:r(y),roughness:["iron","ironWarm"].includes(d)?.46:d==="glass"?.18:d==="water"?.21:.88,metallic:["iron","ironWarm"].includes(d)?.65:0,opacity:d==="glass"?.35:d==="water"?.76:1,emissive:["flame","ember"].includes(d)?r(y):null,baseColorTexture:null,doubleSided:["herbs","leaves","leafLight","leafDark"].includes(d)})),o=d=>({x:d[0],y:d[1],z:d[2]}),a=(d,y)=>{const U=Math.sin(y/2);return{x:d[0]*U,y:d[1]*U,z:d[2]*U,w:Math.cos(y/2)}},l=(d,y={x:0,y:0,z:0,w:1})=>({translation:o(d),rotation:y,scale:{x:1,y:1,z:1}});let c=[];const u=[],h=[],f=[],p=[],v=[],b=(d,y,U,E="oak",B,q)=>c.push({id:d,name:d,geometry:kl({type:"primitive",shape:{type:"box",width:y[0],height:y[1],depth:y[2]}},E,q),material:E,attachedBone:null,transform:l(U,B)}),_=(d,y,U,E="plaster",B,q)=>c.push({id:d,name:d,geometry:kl({type:"mesh",mesh:y},E,q),material:E,attachedBone:null,transform:l(U,B)}),m=(d,y,U,E=.06,B="oak")=>{const q=new fe(...y),oe=new fe(...U),he=oe.clone().sub(q),ee=new Qt().setFromUnitVectors(new fe(0,1,0),he.clone().normalize());b(d,[E,he.length(),E],q.add(oe).multiplyScalar(.5).toArray(),B,{x:ee.x,y:ee.y,z:ee.z,w:ee.w})},I=(d,y,U,E=.14,B="oak",q=!0)=>{if(q&&/^(rear-rafter|rear-tie|wing-rafter|wing-tie|valley)/.test(d)){let pe=0,Te=1,Ce=!0;for(const[it,Ke,st]of[[0,Q[0]-.15,Q[1]+.15],[2,Q[2]-.15,Q[3]+.15]]){const ct=U[it]-y[it];if(Math.abs(ct)<1e-9)(y[it]<Ke||y[it]>st)&&(Ce=!1);else{const Ne=[(Ke-y[it])/ct,(st-y[it])/ct].sort((je,ot)=>je-ot);pe=Math.max(pe,Ne[0]),Te=Math.min(Te,Ne[1])}}if(Ce&&pe<Te){const it=Ke=>y.map((st,ct)=>st+(U[ct]-st)*Ke);pe>1e-4&&I(d+"-before",y,it(pe),E,B,!1),Te<.9999&&I(d+"-after",it(Te),U,E,B,!1);return}}if(/rail|guard-top|inner-turn-join|arrival-guard-join/.test(d)){const pe=Math.hypot(U[0]-y[0],U[2]-y[2]);if(pe>1e-6){const Te=-(U[2]-y[2])/pe*E/2,Ce=(U[0]-y[0])/pe*E/2,it=Ne=>[[Ne[0]+Te,Ne[1]-E/2,Ne[2]+Ce],[Ne[0]-Te,Ne[1]-E/2,Ne[2]-Ce],[Ne[0]-Te,Ne[1]+E/2,Ne[2]-Ce],[Ne[0]+Te,Ne[1]+E/2,Ne[2]+Ce]],Ke=it(y),st=it(U),ct=[Ke.toReversed(),st];for(let Ne=0;Ne<4;Ne++)ct.push([Ke[Ne],Ke[(Ne+1)%4],st[(Ne+1)%4],st[Ne]]);_(d,An(ct.map(Ne=>Ne.map(o))),[0,0,0],B);return}}const oe=new fe(...y),he=new fe(...U),ee=he.clone().sub(oe),de=new Qt().setFromUnitVectors(new fe(0,1,0),ee.clone().normalize());b(d,[E,ee.length(),E],oe.add(he).multiplyScalar(.5).toArray(),B,{x:de.x,y:de.y,z:de.z,w:de.w})};s.push({...s.find(d=>d.id==="oak"),id:"bark",name:"bark"});const ne=Wg(s);function A(d,y,U="frame",E={}){u.push({id:d,level:y,role:U,review:E,model:{id:d,name:d,origin:"generated",skeleton:null,materials:ne,parts:c,asset:null,body:null}}),c=[]}function P(d,y,U,E,B,q,oe,he,ee="window"){const de=c.filter(E);if(!de.length)throw new Error("Empty moving assembly: "+d);c=c.filter(st=>!E(st));const pe=l(B,a([0,1,0],q)),Te=st=>new yt().compose(new fe(st.translation.x,st.translation.y,st.translation.z),new Qt(st.rotation.x,st.rotation.y,st.rotation.z,st.rotation.w),new fe(st.scale.x,st.scale.y,st.scale.z)),Ce=Te(pe).invert(),it=de.map(st=>{const ct=new fe,Ne=new Qt,je=new fe;return Ce.clone().multiply(Te(st.transform)).decompose(ct,Ne,je),{...st,transform:{translation:o(ct.toArray()),rotation:{x:Ne.x,y:Ne.y,z:Ne.z,w:Ne.w},scale:o(je.toArray())}}}),Ke={kind:"revolute",axis:o(oe),pivot:o([0,0,0]),min:Math.min(0,he),max:Math.max(0,he)};return u.push({id:d,level:U,role:ee,parent:y,review:{frontAngle:q},articulation:{rest:pe,motion:Ke,closed:0,open:he,default:0},model:{id:d,name:d,origin:"generated",skeleton:null,materials:ne,parts:it,asset:null,body:null}}),{id:d,element:d,motion:Ke}}const{bevel:C,at:W,table:S,bench:N,hearth:J,counter:se,shelf:_e,bed:me,chest:w,washBasin:G,rug:g,cabinet:z,wallLamp:re,latrineUnit:K,nightStand:R,serviceTools:T}=qg({box:b,mesh:_,beam:m,finish:A,polyhedron:An,revolve:pi,extrude:Zr,V:o,Q:a,registerMechanism:d=>v.push(d)}),F=(d,y,U,E,B)=>p.push({id:d,label:y,level:U,bounds:E,door:B}),Q=[-6.5,-5.6,-1.9,-.7];F("hall","생활 홀",0,[-7.38,-4.72,-1.2,5.75],[-4.6,3.85]),F("kitchen","주방",0,[-7.35,-3.4,-5.25,-1.48],[-3.95,-1.36]),F("pantry","식료실",0,[-3.2,-1.6,-5.25,-1.48],[-2.4,-1.36]),F("ledger","서재·장부실",0,[3.2,7.35,-5.25,-1.48],[3.95,-1.36]),F("service","저장·세척실",0,[4.72,7.35,-1.2,5.75],[4.6,3.85]),F("entrance","현관·계단 하부",0,[-1.4,3,-5.25,-1.48],[.8,-1.36]),F("gallery-west","서쪽 회랑",0,[-4.48,-3.25,0,5.75],[-3.85,5.75]),F("gallery-rear","뒤쪽 회랑",0,[-4.48,4.48,-1.24,0],[0,0]),F("gallery-east","동쪽 회랑",0,[3.25,4.48,0,5.75],[3.85,5.75]),F("master","주침실",1,[-7.35,-3.35,.15,5.75],[-4.45,.05]),F("child-west","작은 침실 서쪽",1,[-7.35,-1.45,-5.25,-1.85],[-4.45,-1.75]),F("child-east","작은 침실 동쪽",1,[3.1,7.35,-5.25,-1.85],[4.45,-1.75]),F("washroom","공동 세척·측간실",1,[3.35,4.9,.15,5.75],[4.1,.05]),F("storage","공용 수납",1,[5.1,7.35,.15,5.75],[5.75,.05]),F("corridor","2층 일자 복도",1,[-5.6,6.4,-1.65,-.15],[2.4,-1.65]),F("landing","2층 계단참",1,[1.8,3,-5.25,-1.65],[2.4,-1.65]);for(const d of p){const[y,U,E,B]=d.bounds;d.polygon=[[y,E],[U,E],[U,B],[y,B]]}p.find(d=>d.id==="master").polygon=[[-7.35,-1.65],[-6.62,-1.65],[-6.62,-.58],[-5.8,-.58],[-5.8,.15],[-3.35,.15],[-3.35,5.75],[-7.35,5.75]],p.find(d=>d.id==="storage").polygon=[[6.6,-1.65],[7.35,-1.65],[7.35,5.75],[5.1,5.75],[5.1,.15],[6.6,.15]],p.find(d=>d.id==="landing").polygon=[[1.8,-5.25],[3,-5.25],[3,-1.75],[-1.3,-1.75],[-1.3,-2.6],[0,-2.6],[0,-3.94],[1.8,-3.94]];const k=[.45,3.33],Y=2.66;function $(d,y,U,E,B=[],q=!1){var gt;const oe=k[E],he=U[0]-y[0],ee=U[1]-y[1],de=Math.hypot(he,ee),pe=-Math.atan2(ee,he),Te=a([0,1,0],pe),Ce=(ie,Ie,at=0)=>[y[0]+he*ie/de+Math.sin(pe)*at,Ie,y[1]+ee*ie/de+Math.cos(pe)*at],it=B.map(ie=>[ie.at-ie.w/2,ie.at+ie.w/2,ie.sill||0,(ie.sill||0)+ie.h]),Ke=[[0,.16],[de-.16,de]],st=Math.ceil(de/1.5);for(let ie=1;ie<st;ie++){const Ie=de*ie/st;B.some(at=>Math.abs(Ie-at.at)<at.w/2+.32)||Ke.push([Ie-.08,Ie+.08])}for(const ie of B)Ke.push([ie.at-ie.w/2-.16,ie.at-ie.w/2],[ie.at+ie.w/2,ie.at+ie.w/2+.16]);const ct=Math.abs(he)>Math.abs(ee)?[Q[0]-y[0],Q[1]-y[0]].map(ie=>ie*Math.sign(he)).sort((ie,Ie)=>ie-Ie):[Q[2]-y[1],Q[3]-y[1]].map(ie=>ie*Math.sign(ee)).sort((ie,Ie)=>ie-Ie),Ne=Math.abs(he)>Math.abs(ee)?y[1]>=Q[2]&&y[1]<=Q[3]:y[0]>=Q[0]&&y[0]<=Q[1],je=E===0?1.95-oe:0,ot=[...new Set([0,de,...it.flatMap(ie=>ie.slice(0,2)),...Ke.flat(),...Ne?[ct[0]-.12,...ct,ct[1]+.12]:[]].filter(ie=>ie>=0&&ie<=de))].sort((ie,Ie)=>ie-Ie),Tt=[...new Set([0,.2,Y-.28,Y,...it.flatMap(ie=>[ie[2],ie[3],ie[3]+.18,...ie[2]>0?[ie[2]-.12]:[]]),...Ne?[je]:[]].filter(ie=>ie>=0&&ie<=Y))].sort((ie,Ie)=>ie-Ie),Ft=ot.slice(0,-1).map((ie,Ie)=>Tt.slice(0,-1).map((at,ft)=>{const qe=(ie+ot[Ie+1])/2,De=(at+Tt[ft+1])/2;return it.some(et=>qe>et[0]&&qe<et[1]&&De>et[2]&&De<et[3])||Ne&&qe>ct[0]&&qe<ct[1]&&De>=je?null:Ne&&qe>ct[0]-.12&&qe<ct[1]+.12?"stone":ot[Ie+1]-ie<.065&&Ke.some(et=>Math.abs(et[1]-ie)<1e-7||Math.abs(et[0]-ot[Ie+1])<1e-7)||De<.2||De>Y-.28||Ke.some(et=>qe>et[0]&&qe<et[1])||it.some(et=>qe>=et[0]&&qe<=et[1]&&(De>=et[3]&&De<et[3]+.18||et[2]>0&&De>et[2]-.12&&De<et[2]))?"oak":"plaster"})),St={oak:[],plaster:[],stone:[]},Je=[],vt=ie=>ie==="plaster"?.1:.12;for(let ie=0;ie<ot.length-1;ie++)for(let Ie=0;Ie<Tt.length-1;Ie++){const at=Ft[ie][Ie];if(!at)continue;const ft=ot[ie],qe=ot[ie+1],De=Tt[Ie],We=Tt[Ie+1],et=vt(at),_t=(ue,Pe,ze)=>Ce(ue,oe+Pe,d==="outer-west-0"&&ue>=2.93-1e-8&&ue<=4.195+1e-8&&Math.abs(ze-.1)<1e-8?ze-.045:ze),M=(ft+qe)/2,te=Ke.some(ue=>M>=ue[0]&&M<=ue[1])&&De>=.2&&We<=Y-.28,ae={grainAxis:te?[0,1,0]:[he/de,0,ee/de],origin:Ce(te?(ft+qe)/2:0,oe,0)},xe=ue=>{St[at].push(ue),at==="oak"&&Je.push({...ae,count:ue.length})};xe([_t(ft,De,et),_t(qe,De,et),_t(qe,We,et),_t(ft,We,et)]),xe([_t(qe,De,-et),_t(ft,De,-et),_t(ft,We,-et),_t(qe,We,-et)]);for(const[ue,Pe,ze,Oe]of[[ie-1,Ie,[ft,De],[ft,We]],[ie+1,Ie,[qe,We],[qe,De]],[ie,Ie-1,[qe,De],[ft,De]],[ie,Ie+1,[ft,We],[qe,We]]]){const Xe=(gt=Ft[ue])==null?void 0:gt[Pe];if(Xe&&vt(Xe)>=et)continue;const tt=Xe?[[-et,-vt(Xe)],[vt(Xe),et]]:[[-et,et]];for(const[ht,ut]of tt)xe([_t(...ze,ht),_t(...Oe,ht),_t(...Oe,ut),_t(...ze,ut)].reverse())}}for(const[ie,Ie]of Object.entries(St))Ie.length&&_(d+"-"+ie,An(Ie.map(at=>at.map(o))),[0,0,0],ie,void 0,{faceFrames:ie==="oak"?Je:void 0});const mt=Ke.map(ie=>[Math.max(0,ie[0]),Math.min(de,ie[1])]).sort((ie,Ie)=>ie[0]-Ie[0]);if(q)for(let ie=0;ie<mt.length-1;ie++){const Ie=mt[ie][1],at=mt[ie+1][0];if(!(at-Ie<.65||it.some(ft=>at>ft[0]&&Ie<ft[1])||Ne&&at>ct[0]-.12&&Ie<ct[1]+.12))for(const ft of[-1,1]){const De=Y-.27,We=(at-Ie)/(De-.19),et=.035*Math.sqrt(1+We*We),_t=[[Ie-et,.19],[Ie+et,.19],[at+et,De],[at-et,De]],M=[],te=d==="outer-west-0"&&ie===3&&ft===1?.045:0;if(te&&Math.abs(Ie-2.93)+Math.abs(at-4.195)>1e-7)throw new Error("Hall flush brace bay changed");const ae=_t.map(([ue,Pe])=>Ce(ue,oe+Pe,ft*.165-te)),xe=_t.map(([ue,Pe])=>Ce(ue,oe+Pe,ft*.11-te));M.push(ae,xe.toReversed());for(let ue=0;ue<4;ue++)M.push([ae[ue],xe[ue],xe[(ue+1)%4],ae[(ue+1)%4]]);_(d+"-brace-"+ie+"-"+ft,An(M.map(ue=>ue.map(o))),[0,0,0],"oak",void 0,{grainAxis:[he/de*(at-Ie),De-.19,ee/de*(at-Ie)],origin:Ce(Ie,oe+.19,ft*.1375-te)});for(const[ue,Pe]of[[Ie,.23],[at,Y-.31]])b(d+"-brace-peg-"+ie+"-"+ft+"-"+Pe,[.02,.02,.014],Ce(ue,oe+Pe,ft*.167-te),"oakLight",Te)}}for(const ie of B){const Ie=oe+(ie.sill||0),at=Ie+ie.h;if(ie.sill){const ft=ie.id==="ww-a-0"||ie.id==="ww-b-0";b(ie.id+"-sill-lip",[ie.w+.28,.06,ft?.27:.3],Ce(ie.at,Ie-.07,ft?-.015:0),"oak",Te),b(ie.id+"-jamb-left",[.07,ie.h+.18,.08],Ce(ie.at-ie.w/2-.035,(Ie+at)/2),"oak",Te),b(ie.id+"-jamb-right",[.07,ie.h+.18,.08],Ce(ie.at+ie.w/2+.035,(Ie+at)/2),"oak",Te),b(ie.id+"-lintel",[ie.w+.14,.08,.08],Ce(ie.at,at+.04),"oak",Te),b(ie.id+"-mullion",[.042,ie.h,.045],Ce(ie.at,(Ie+at)/2),"oak",Te);const qe=[];for(const De of[-1,1]){const We=ie.id+"-casement-"+De,et=ie.w/2-.034,_t=ie.at+De*(ie.w/2-.006),M=_t-De*et,te=(_t+M)/2;b(We+"-glass",[et-.028,ie.h-.028,.016],Ce(te,(Ie+at)/2),"glass",Te);for(const Pe of[_t-De*.014,M+De*.014])b(We+"-stile-"+Pe,[.028,ie.h,.044],Ce(Pe,(Ie+at)/2,.01),"oak",Te);for(const Pe of[Ie+.015,at-.015])b(We+"-rail-"+Pe,[et,.03,.044],Ce(te,Pe,.01),"oak",Te);b(We+"-transom",[et-.028,.025,.03],Ce(te,Ie+ie.h*.58,.01),"oak",Te);const ae=Math.min(_t,M)+.014,xe=Math.max(_t,M)-.014;for(const Pe of[-1.6,1.6])for(let ze=Math.floor(Math.min(0,-Pe*ie.w)/.225);ze<=Math.ceil(Math.max(ie.h,ie.h-Pe*ie.w)/.225);ze++){const Oe=ze*.225,Xe=[],tt=ae-ie.at+ie.w/2,ht=xe-ie.at+ie.w/2;for(const ut of[tt,ht]){const Ve=Pe*ut+Oe;Ve>=.014&&Ve<=ie.h-.014&&Xe.push([ut,Ve])}for(const ut of[.014,ie.h-.014]){const Ve=(ut-Oe)/Pe;Ve>tt&&Ve<ht&&Xe.push([Ve,ut])}if(Xe.length===2){const ut=Xe.sort((Ve,At)=>Ve[1]-At[1]);for(const[Ve,At,Bt]of[[0,.014,ie.h*.58-.0125],[1,ie.h*.58+.0125,ie.h-.014]]){const Lt=Math.max(At,ut[0][1]),Pt=Math.min(Bt,ut[1][1]);Pt>Lt&&m(We+"-lead-"+Pe+"-"+ze+"-"+Ve,Ce(ie.at-ie.w/2+(Lt-Oe)/Pe,Ie+Lt,.01),Ce(ie.at-ie.w/2+(Pt-Oe)/Pe,Ie+Pt,.01),.0055,"iron")}}}for(const Pe of[Ie+.18,at-.18]){b(We+"-hinge-strap-"+Pe,[.028,.027,.009],Ce(_t-De*.011,Pe,.0365),"iron",Te),_(We+"-hinge-knuckle-"+Pe,pi({profile:[{x:.006,y:0},{x:.011,y:0},{x:.011,y:.042},{x:.006,y:.042},{x:.006,y:0}],segments:20}),Ce(_t,Pe-.021,.04),"iron"),_(ie.id+"-fixed-hinge-pin-"+De+"-"+Pe,pi({profile:[{x:0,y:0},{x:.011,y:0},{x:.011,y:.006},{x:.0055,y:.006},{x:.0055,y:.057},{x:0,y:.057}],segments:20}),Ce(_t,Pe-.027,.04),"iron");const ze=Pe<Ie+ie.h/2?Ie-.045:at+.045;b(ie.id+"-fixed-hinge-strap-"+De+"-"+Pe,[.092,.018,.014],Ce(_t+De*.038,ze,.04),"iron",Te),_(ie.id+"-fixed-hinge-stem-"+De+"-"+Pe,pi({profile:[{x:0,y:0},{x:.0055,y:0},{x:.0055,y:Math.abs(Pe-ze)},{x:0,y:Math.abs(Pe-ze)}],segments:20}),Ce(_t,Math.min(Pe,ze),.04),"iron");for(const Oe of[_t-De*.007,_t-De*.019])b(We+"-hinge-rivet-"+Pe+"-"+Oe,[.006,.008,.013],Ce(Oe,Pe,.037),"ironWarm",Te)}b(We+"-catch-plate",[.022,.07,.01],Ce(M+De*.014,Ie+.46,.037),"iron",Te),m(We+"-catch-handle",Ce(M+De*.014,Ie+.46,.039),Ce(M+De*.014,Ie+.5,.061),.01,"iron");const ue=P(We,d,E,Pe=>Pe.id.startsWith(We+"-"),Ce(_t,Ie,.04),pe+(De===1?Math.PI:0),[0,1,0],De*Math.PI*.42);qe.push({...ue,width:et,height:ie.h})}ie.operation={panels:qe,states:[{id:"closed",panels:qe.map(De=>({panel:De.id,value:0}))},{id:"vent",panels:qe.map(De=>({panel:De.id,value:(De.motion.min+De.motion.max)/3}))},{id:"open",panels:qe.map(De=>({panel:De.id,value:De.motion.min+De.motion.max}))}],state:"closed",hardware:[{id:ie.id+"-fixed-frame",kind:"frame-and-pintles",element:d}]}}else{const ft=Ce(ie.at-ie.w/2+.004,Ie+.02,-.031),qe=ie.id+"-leaf",De=c;c=[];const We=ie.w-.035,et=ie.h-.055;for(let ae=0;ae<6;ae++)C(qe+"-plank-"+ae,[We/6-.0015,et,.048],[(ae+.5)*We/6,et/2,0],ae%3?"oak":"oakLight",void 0,.003);b(qe+"-tongue-rebates",[We-.008,et-.008,.014],[We/2,et/2,0],"oak");for(const ae of[.22,et-.22])C(qe+"-rail-"+ae,[We-.05,.12,.038],[We/2,ae,.043],"oakLight",void 0,.006);m(qe+"-rising-brace",[.09,.282,.043],[We-.09,et-.282,.043],.046,"oakLight");const _t=W(0,0,0);for(const ae of[.22,et-.22]){b(qe+"-strap-"+ae,[We*.7,.055,.01],[We*.35,ae,-.03],"iron"),_(qe+"-hinge-knuckle-"+ae,pi({profile:[{x:.008,y:0},{x:.022,y:0},{x:.022,y:.13},{x:.008,y:.13},{x:.008,y:0}],segments:24}),[.004,ae-.065,-.031],"iron");for(let xe=0;xe<5;xe++)b(qe+"-strap-rivet-"+ae+"-"+xe,[.018,.018,.024],[.09+xe*We*.12,ae,-.032],"iron")}const M=et*.52;if(b(qe+"-latch-plate",[.07,.16,.012],[We-.14,M,-.031],"iron"),b(qe+"-latch-bar",[.24,.028,.018],[We-.095,M,-.049],"iron"),b(qe+"-latch-pivot",[.018,.018,.02],[We-.19,M,-.061],"ironWarm"),_t.hoop(qe+"-ring-handle",[We-.14,M-.064,-.068],.045,.01,"iron"),_t.tube(qe+"-ring-eye",[[We-.14,M-.019,-.03],[We-.14,M-.019,-.072]],.012,"iron"),b(qe+"-reverse-handle-plate",[.06,.16,.011],[We-.14,M,.031],"iron"),m(qe+"-through-spindle",[We-.14,M,-.055],[We-.14,M,.057],.012,"iron"),_t.hoop(qe+"-reverse-ring",[We-.14,M-.064,.062],.045,.01,"iron"),_t.tube(qe+"-reverse-eye",[[We-.14,M-.019,.03],[We-.14,M-.019,.066]],.012,"iron"),b(qe+"-thumb-lift",[.065,.016,.047],[We-.115,M+.037,.049],"iron"),ie.id==="wash-door"){b(qe+"-privacy-bolt",[.22,.023,.021],[We-.06,M+.18,.045],"iron");for(const ae of[We-.13,We-.015])b(qe+"-bolt-guide-back-"+ae,[.027,.052,.0095],[ae,M+.18,.02875],"iron"),b(qe+"-bolt-guide-bottom-"+ae,[.027,.012,.044],[ae,M+.18-.0175,.046],"iron"),b(qe+"-bolt-guide-top-"+ae,[.027,.012,.044],[ae,M+.18+.0195,.046],"iron"),b(qe+"-bolt-guide-front-"+ae,[.027,.052,.012],[ae,M+.18,.068],"iron");m(qe+"-bolt-knob",[We-.09,M+.18,.06],[We-.09,M+.21,.084],.012,"iron")}for(const ae of[M-.055,M+.055])b(qe+"-latch-rivet-"+ae,[.013,.013,.024],[We-.14,ae,-.033],"iron");for(const ae of c)ae.transform.translation.x-=.004,ae.transform.translation.z+=.031;A(qe,E,"door"),c=De;for(const ae of[.22,et-.22])b(ie.id+"-jamb-strap-"+ae,[.13,.055,.012],Ce(ie.at-ie.w/2-.085,Ie+.02+ae,-.03),"iron",Te),m(ie.id+"-pintle-drop-"+ae,Ce(ie.at-ie.w/2-.026,Ie+.02+ae,-.031),Ce(ie.at-ie.w/2-.026,Ie+.02+ae-.07,-.031),.012,"iron"),m(ie.id+"-pintle-arm-"+ae,Ce(ie.at-ie.w/2-.026,Ie+.02+ae-.07,-.031),Ce(ie.at-ie.w/2+.004,Ie+.02+ae-.07,-.031),.01,"iron"),_(ie.id+"-pintle-"+ae,pi({profile:[{x:0,y:0},{x:.022,y:0},{x:.022,y:.01},{x:.0075,y:.01},{x:.0075,y:.15},{x:0,y:.15}],segments:24}),Ce(ie.at-ie.w/2+.004,Ie+.02+ae-.075,-.031),"iron");b(ie.id+"-keeper",[.06,.08,.018],Ce(ie.at+ie.w/2+.02,Ie+.02+M,-.04),"iron",Te),ie.id==="wash-door"&&b(ie.id+"-privacy-keeper",[.055,.05,.024],Ce(ie.at+ie.w/2+.013,Ie+.02+M+.18,.044),"iron",Te),u.at(-1).pose={pivot:ft,closedAngle:pe,angle:pe+(["master-door","wash-door","storage-door"].includes(ie.id)?-1:1)*Math.PI/2};const te=u.at(-1).pose.angle-pe;ie.operation={panels:[{id:qe,element:qe,width:We,height:et,motion:{kind:"revolute",axis:o([0,1,0]),pivot:o([0,0,0]),min:Math.min(0,te),max:Math.max(0,te)}}],states:[{id:"closed",panels:[{panel:qe,value:0}]},{id:"open",panels:[{panel:qe,value:te}]}],state:"open",hardware:[{id:ie.id+"-fixed-jamb",kind:"pintles-and-keeper",element:d}]},f.push({id:ie.id,level:E,eye:Ce(ie.at,oe+1.6),a:y,b:U,width:ie.w,height:ie.h})}}h.push({id:d,a:y,b:U,level:E,openings:B,exterior:q,owner:d,faces:["inside","outside","top","bottom","ends","opening-reveals"]}),A(d,E,"wall",{frontAngle:pe})}const D=(d,y,U=.78)=>({id:d,at:y,w:U,h:1.12,sill:.95}),O=(d,y,U=.95)=>({id:d,at:y,w:U,h:2.12});for(let d=0;d<2;d++)$("outer-north-"+d,[-7.6,-5.4],[7.6,-5.4],d,[D("nw-"+d,2.2),D("nc-"+d,5.1),D("ne-"+d,12.6)],!0),$("outer-west-"+d,[-7.5,6],[-7.5,-5.4],d,[D("ww-a-"+d,2.1),D("ww-b-"+d,5.1),D("ww-c-"+d,9.2)],!0),$("outer-east-"+d,[7.5,-5.4],[7.5,6],d,[D("ew-a-"+d,2),D("ew-b-"+d,6.4),D("ew-c-"+d,9.3)],!0),$("gable-west-"+d,[-7.6,5.9],[-3.25,5.9],d,[D("sw-"+d,2)],!0),$("gable-east-"+d,[3.25,5.9],[7.6,5.9],d,[D("se-"+d,2.1)],!0),d===1&&($("court-west-upper",[-3.35,5.9],[-3.35,0],d,[D("cw-a",1.8),D("cw-b",4.5)],!0),$("court-east-upper",[3.35,0],[3.35,5.9],d,[D("ce-a",1.5),D("ce-b",4.5)],!0),$("court-rear-upper",[-3.25,-.1],[3.25,-.1],d,[D("cr-a",1.25),D("cr-b",5.25)],!0));$("hall-gallery",[-4.6,5.8],[-4.6,-1.36],0,[O("hall-door",1.95,1.05),D("hall-court-window",4.8)]),$("service-gallery",[4.6,-1.36],[4.6,5.8],0,[O("service-door",5.21),D("service-court-window",2.16)]),$("kitchen-front",[-7.4,-1.36],[-3.3,-1.36],0,[O("kitchen-door",3.45)]),$("pantry-front",[-3.3,-1.36],[-1.5,-1.36],0,[O("pantry-door",.9,.9)]),$("ledger-front",[3.1,-1.36],[7.4,-1.36],0,[O("ledger-door",.85)]),$("kitchen-pantry",[-3.3,-5.3],[-3.3,-1.36],0),$("pantry-entrance",[-1.5,-5.3],[-1.5,-1.36],0),$("entrance-ledger",[3.1,-5.3],[3.1,-1.36],0),$("entrance-front",[-1.5,-1.36],[3.1,-1.36],0,[O("entrance-door",2.3,1.2)]),$("child-west-front",[-7.4,-1.75],[-1.4,-1.75],1,[O("child-west-door",2.95)]),$("child-west-stair",[-1.4,-5.3],[-1.4,-1.75],1),$("child-east-front",[3.1,-1.75],[7.4,-1.75],1,[O("child-east-door",1.35)]),$("child-east-stair",[3.1,-5.3],[3.1,-1.75],1),$("master-front",[-5.7,.05],[-3.35,.05],1,[O("master-door",1.25)]),$("corridor-west-end",[-5.7,-1.65],[-5.7,.05],1),$("wash-front",[3.35,.05],[5,.05],1,[O("wash-door",.75,.9)]),$("storage-front",[5,.05],[6.5,.05],1,[O("storage-door",.75,.9)]),$("corridor-east-end",[6.5,.05],[6.5,-1.65],1),$("wash-storage",[5,.05],[5,5.8],1),$("wash-screen",[3.45,2.6],[4.1,2.6],1);const j=(d,y)=>d>=-7.6&&d<=7.6&&y>=-5.5&&y<=6&&!(Math.abs(d)<3.25&&y>0),X=[[-1.4,0,-5.35,-2.6],[0,1.8,-5.35,-3.94]];function V(d,y,U,E=!1,B="upper"){const q=[[-7.6,-5.5],[7.6,-5.5],[7.6,6],[3.25,6],[3.25,0],[-3.25,0],[-3.25,6],[-7.6,6]],oe=[];if(E&&oe.push([[-1.4,-5.35],[1.8,-5.35],[1.8,-3.94],[0,-3.94],[0,-2.6],[-1.4,-2.6]]),y>3){const[ee,de,pe,Te]=Q;oe.push([[ee,pe],[de,pe],[de,Te],[ee,Te]])}const he=d==="ground-floor"||d==="upper-floor"?.006:0;if(_(d+"-solid",Zr({outer:q.map(([ee,de])=>({x:ee,y:de})),holes:oe.map(ee=>ee.map(([de,pe])=>({x:de,y:pe}))),depth:U-he}),[0,y-(U+he)/2,0],B,a([1,0,0],Math.PI/2)),d==="ground-floor"||d==="upper-floor"){const ee=d==="ground-floor";for(let de=0,pe=-5.49;pe<5.999;pe+=ee?.52:.24,de++){const Te=Math.min(ee?.52:.24,6-pe),Ce=de%3*.43;for(let it=0,Ke=-7.6-Ce;Ke<7.6;Ke+=ee?.74:1.72,it++){const st=Math.min(7.6,Ke+(ee?.74:1.72)),ct=Math.max(-7.6,Ke),Ne=[ct,st],je=[pe,pe+Te];for(const ot of[-3.25,3.25,...oe.flat().map(Tt=>Tt[0])])ot>ct&&ot<st&&Ne.push(ot);for(const ot of[0,...oe.flat().map(Tt=>Tt[1])])ot>pe&&ot<pe+Te&&je.push(ot);Ne.sort((ot,Tt)=>ot-Tt),je.sort((ot,Tt)=>ot-Tt);for(let ot=0;ot<Ne.length-1;ot++)for(let Tt=0;Tt<je.length-1;Tt++){const Ft=Ne[ot],St=Ne[ot+1],Je=je[Tt],vt=je[Tt+1],mt=(Ft+St)/2,gt=(Je+vt)/2;!j(mt,gt)||oe.some(ie=>mt>Math.min(...ie.map(Ie=>Ie[0]))&&mt<Math.max(...ie.map(Ie=>Ie[0]))&&gt>Math.min(...ie.map(Ie=>Ie[1]))&&gt<Math.max(...ie.map(Ie=>Ie[1]))&&(()=>{let Ie=!1;for(let at=0,ft=ie.length-1;at<ie.length;ft=at++)ie[at][1]>gt!=ie[ft][1]>gt&&mt<(ie[ft][0]-ie[at][0])*(gt-ie[at][1])/(ie[ft][1]-ie[at][1])+ie[at][0]&&(Ie=!Ie);return Ie})())||St-Ft<.012||vt-Je<.012||b(d+"-finish-"+de+"-"+it+"-"+ot+"-"+Tt,[St-Ft-.004,.006,vt-Je-.003],[mt,y-.003,gt],ee?(it+de)%3?"floor":"stoneLight":(it+de)%4?"upper":"oakPale")}}}}A(d,y<1?0:1,"slab")}V("foundation",.38,.38,!1,"stone");const le=[[-7.6,-5.5],[7.6,-5.5],[7.6,6],[3.25,6],[3.25,0],[-3.25,0],[-3.25,6],[-7.6,6]];for(let d=0;d<le.length;d++){const y=le[d],U=le[(d+1)%le.length],E=Math.hypot(U[0]-y[0],U[1]-y[1]),B=-Math.atan2(U[1]-y[1],U[0]-y[0]);for(let q=0;q<2;q++)for(let oe=0,he=-.31*(q%2);he<E;he+=.63,oe++){const ee=Math.max(.015,he),de=Math.min(E-.015,he+.618);if(de-ee<.02)continue;const pe=(ee+de)/2,Te=y[0]+(U[0]-y[0])*pe/E,Ce=y[1]+(U[1]-y[1])*pe/E;C("foundation-block-"+d+"-"+q+"-"+oe,[de-ee,.178,.13],[Te,q*.19+.094,Ce],(q+oe)%3?"stone":"stoneLight",a([0,1,0],B),.016)}}A("foundation-masonry",0,"masonry"),V("ground-floor",.45,.07,!1,"floor"),V("upper-floor",3.33,.22,!0),V("upper-ceiling",6.12,.13,!1,"plaster");for(const d of[-3.29,3.29])for(let y=0;y<5;y++){const U=y*1.45;b("pier-"+d+"-"+y,[.18,.6,.18],[d,.3,U],"stone"),b("gallery-post-"+d+"-"+y,[.14,2.51,.14],[d,1.855,U]),y<4&&I("brace-"+d+"-"+y,[d,2.68,U],[d,3.05,U+.38],.1)}for(const d of[-2.1,-.9,2.1])b("rear-pier-"+d,[.18,.6,.18],[d,.3,-.05],"stone"),b("rear-post-"+d,[.14,2.51,.14],[d,1.855,-.05]),I("rear-brace-"+d,[d,2.65,-.05],[d-.38,3.02,-.05],.1);for(const d of[-3.35,3.35])b("gallery-long-beam-"+d,[.22,.22,5.89],[d,3.11,3.055]);b("gallery-rear-beam",[6.92,.22,.22],[0,3.11,0]),A("gallery-frame",0);for(let d=0;d<2;d++)for(let y=-4.98;y<5.9;y+=.6){const U=y<0?[[-7.4,7.4]]:[[-7.4,-3.35],[3.35,7.4]];for(const[E,B]of U){const q=d?[-4.5,0,5.5]:[-5.3,5.5],oe=[...d===0?X:[],Q,...q.map(ee=>[ee-.01,ee+.01,-5.4,d?-.1:-1.3])];let he=[E,B];for(const ee of oe)y>ee[2]-.1&&y<ee[3]+.1&&he.push(Math.max(E,ee[0]-.1),Math.min(B,ee[1]+.1));he=he.filter(ee=>ee>=E&&ee<=B).sort((ee,de)=>ee-de);for(let ee=0;ee<he.length-1;ee++){const de=(he[ee]+he[ee+1])/2;oe.some(pe=>de>pe[0]-.1&&de<pe[1]+.1&&y>pe[2]-.1&&y<pe[3]+.1)||he[ee+1]-he[ee]>.01&&b("joist-"+d+"-"+y+"-"+ee,[he[ee+1]-he[ee],.19,.14],[de,d?5.895:3.015,y])}}}for(const d of[-5.3,5.5])b("rear-floor-bearer-"+d,[.22,.28,4.1],[d,2.97,-3.35]);for(const d of[-4.5,0,5.5])b("ceiling-bearer-"+d,[.22,.28,5.3],[d,5.85,-2.75]);for(const d of[3.015,5.895]){for(const y of[Q[0]-.1,Q[1]+.1])b("shaft-trimmer-"+d+"-"+y,[.2,.19,1.6],[y,d,-1.3]);for(const y of[Q[2]-.1,Q[3]+.1])b("shaft-header-"+d+"-"+y,[.9,.19,.2],[-6.05,d,y])}for(const[d,y,U]of[["void-south",[-1.4,3,-2.51],[.09,3,-2.51]],["void-inner",[.09,3,-2.6],[.09,3,-3.85]],["void-upper",[0,3,-3.85],[1.89,3,-3.85]],["void-arrival",[1.89,3,-3.94],[1.89,3,-5.3]]]){const E=Math.abs(U[0]-y[0]),B=Math.abs(U[2]-y[2]);b(d,[E||.18,.22,B||.18],[(y[0]+U[0])/2,3,(y[2]+U[2])/2])}A("floor-joists",-1);for(let d=0;d<7;d++)b("lower-tread-"+d,[1.24,.07,.26],[-.66,.45+.18*(d+1)-.035,-2.17-.26*(d+.5)]);b("turn-landing",[1.24,.12,1.24],[-.66,1.83,-4.61]);for(let d=0;d<7;d++){const y=-.04+.26*(d+.5);b("upper-tread-"+d,[d===6?.28:.26,.07,1.24],[y+(d===6?.01:0),.45+.18*(9+d)-.035,-4.61])}function Se(d){const y=[];for(let U=0;U<7;U++){const E=(d?2:.56)+.18*U;y.push({x:.26*U,y:E},{x:d&&U===6?1.84:.26*(U+1),y:E})}return d?y.push({x:1.84,y:2.86},{x:0,y:1.77}):y.push({x:1.82,y:1.77},{x:1.95,y:1.77},{x:1.95,y:1.51},{x:.26,y:.45},{x:0,y:.45}),Zr({outer:y,holes:[],depth:.14})}for(const d of[-1.2,-.12])_("lower-stringer-"+d,Se(!1),[d,0,-2.17],"oak",a([0,1,0],Math.PI/2));for(const d of[-5.15,-4.07])_("upper-stringer-"+d,Se(!0),[-.04,0,d],"oak");for(const d of[-1.2,-.12])for(const y of[-5.15,-4.07])b("turn-support-"+d+"-"+y,[.14,1.32,.14],[d,1.11,y]);function H(d,y,U,E,B){b(d,[.045,B-E,.045],[y,(E+B)/2,U])}for(const[d,y]of[["outer",-1.25],["inner",-.07]]){for(let U=0;U<7;U++){const E=-2.3-U*.26,B=.63+U*.18;H("lower-"+d+"-"+U,y,E,B,B+.92)}H("lower-"+d+"-turn",y,-4.12,1.89,2.81),I("lower-"+d+"-rail",[y,1.55,-2.3],[y,2.81,-4.12],.065)}for(const[d,y]of[["outer",-5.2],["inner",-4.02]]){for(let U=0;U<7;U++){const E=-.04+.26*(U+.5)+(U===6?.01:0),B=2.07+U*.18,q=2.81+(E+.04)*1.44/1.84;H("upper-"+d+"-"+U,E,y,B,q)}H("upper-"+d+"-turn",-.04,y,1.89,2.81),H("upper-"+d+"-arrival",1.84,y,3.33,4.28),I("upper-"+d+"-rail",[-.04,2.81,y],[1.8,4.25,y],.065),I("upper-"+d+"-arrival-rail",[1.8,4.25,y],[1.84,4.28,y],.065)}I("turn-handrail",[-1.25,2.81,-4.12],[-1.25,2.81,-5.2],.065),I("turn-back-handrail",[-1.25,2.81,-5.2],[-.04,2.81,-5.2],.065);for(let d=1;d<=8;d++)H("turn-side-infill-"+d,-1.25,-4.12-d*1.08/8,1.89,2.81),H("turn-back-infill-"+d,-1.25+d*1.21/8,-5.2,1.89,2.81);for(const[d,y]of[[[-1.35,3.33,-2.56],[.04,3.33,-2.56]],[[.04,3.33,-2.56],[.04,3.33,-3.9]],[[.04,3.33,-3.9],[1.84,3.33,-3.9]]]){I("guard-foot-"+d,d.map((E,B)=>B===1?E+.04:E),y.map((E,B)=>B===1?E+.04:E),.08),I("guard-top-"+d,d.map((E,B)=>B===1?E+.95:E),y.map((E,B)=>B===1?E+.95:E),.065);const U=Math.ceil(Math.hypot(y[0]-d[0],y[2]-d[2])/.13);for(let E=0;E<=U;E++)b("guard-"+d+"-"+E,[.035,.95,.035],[d[0]+(y[0]-d[0])*E/U,3.805,d[2]+(y[2]-d[2])*E/U])}b("inner-turn-join",[.065,.065,.1325],[-.07,2.81,-4.05375]),I("arrival-guard-join",[1.84,4.28,-4.02],[1.84,4.28,-3.9],.065),A("central-stair",-1,"stair");const ve=(d,y)=>{const U=[];if(y<=.3&&y>=-5.85&&Math.abs(d)<=7.95&&U.push(6.2+1.1*Math.min(y+5.85,.3-y)),y>=-2.775&&y<=6.35)for(const E of[-1,1]){const B=d*E;B>=2.9&&B<=7.95&&U.push(6.2+1.1*Math.min(B-2.9,7.95-B))}return U.length?Math.max(...U):null};function we(d,y,U,E){const B=[];for(let q=0;q<d.length;q++){const oe=d[q],he=d[(q+1)%d.length],ee=E?oe[y]<=U:oe[y]>=U,de=E?he[y]<=U:he[y]>=U;if(ee&&B.push(oe),ee!==de){const pe=(U-oe[y])/(he[y]-oe[y]);B.push([oe[0]+pe*(he[0]-oe[0]),oe[1]+pe*(he[1]-oe[1])])}}return B}function Le(d){const y=d.flat(),U=[],E=(de,pe)=>Math.hypot(...de.map((Te,Ce)=>Te-pe[Ce]))<1e-9,B=(de,pe,Te=!1)=>{const Ce=Te?[0,2]:[0,1,2],it=Ce.map(ct=>pe[ct]-de[ct]),Ke=it.reduce((ct,Ne)=>ct+Ne*Ne,0),st=[0,1];if(Ke<1e-18)return st;for(const ct of y){const Ne=Ce.reduce((je,ot,Tt)=>je+(ct[ot]-de[ot])*it[Tt],0)/Ke;Ne>1e-9&&Ne<1-1e-9&&Math.hypot(...Ce.map((je,ot)=>ct[je]-de[je]-Ne*it[ot]))<1e-9&&st.push(Ne)}return st.sort((ct,Ne)=>ct-Ne).filter((ct,Ne,je)=>Ne===0||ct-je[Ne-1]>1e-9)},q=(de,pe,Te)=>de.map((Ce,it)=>Ce+(pe[it]-Ce)*Te);for(const de of d)if(de.length===4&&Math.hypot(de[0][0]-de[1][0],de[0][2]-de[1][2])<1e-9&&Math.hypot(de[2][0]-de[3][0],de[2][2]-de[3][2])<1e-9){const pe=B(de[0],de[3],!0);for(let Te=0;Te<pe.length-1;Te++)U.push([q(de[0],de[3],pe[Te]),q(de[1],de[2],pe[Te]),q(de[1],de[2],pe[Te+1]),q(de[0],de[3],pe[Te+1])])}else{const pe=de.flatMap((Ce,it)=>{const Ke=de[(it+1)%de.length];return B(Ce,Ke).slice(0,-1).map(st=>q(Ce,Ke,st))}),Te=[0,1,2].map(Ce=>de.reduce((it,Ke)=>it+Ke[Ce],0)/de.length);for(let Ce=0;Ce<pe.length;Ce++)E(pe[Ce],pe[(Ce+1)%pe.length])||U.push([Te,pe[Ce],pe[(Ce+1)%pe.length]])}const oe=new Map,he=new Set,ee=de=>de.map((pe,Te)=>de.slice(Te).concat(de.slice(0,Te)).join("|")).sort()[0];for(let de=0;de<U.length;de++){const pe=U[de].map(Ke=>Ke.map(st=>Math.round(st*1e9)||0).join(",")),Te=ee(pe),Ce=ee([...pe].reverse()),it=oe.get(Ce);it!==void 0?(he.add(de),he.add(it),oe.delete(Ce)):oe.set(Te,de)}return U.filter((de,pe)=>!he.has(pe))}function Me(d,y,U){const[E,B,q,oe]=Q,he=Math.max(...y.map(Je=>Je[0]))>E&&Math.min(...y.map(Je=>Je[0]))<B&&Math.max(...y.map(Je=>Je[1]))>q&&Math.min(...y.map(Je=>Je[1]))<oe,ee=he?we(we(y,0,E,!1),0,B,!0):[],de=Je=>Je.reduce((vt,mt,gt)=>{const ie=Je[(gt+1)%Je.length];return vt+mt[0]*ie[1]-ie[0]*mt[1]},0),pe=(he?[we(y,0,E,!0),we(y,0,B,!1),we(ee,1,q,!0),we(ee,1,oe,!1)]:[y]).filter(Je=>Je.length>=3&&Math.abs(de(Je))>1e-5),Te=[],Ce=pe.flat(),it=(Je,vt,mt)=>Math.abs((Je[0]-vt[0])*(mt[1]-vt[1])-(Je[1]-vt[1])*(mt[0]-vt[0]))<1e-7&&(Je[0]-vt[0])*(Je[0]-mt[0])+(Je[1]-vt[1])*(Je[1]-mt[1])<1e-7;for(const Je of pe){const vt=io({outer:Je.map(([gt,ie])=>({x:gt,y:ie}))});for(let gt=0;gt<vt.triangles.length;gt+=3){const ie=vt.triangles.slice(gt,gt+3).reverse().map(Ie=>{const at=vt.points[Ie];return[at.x,U(at.x,at.y),at.y]});Te.push(ie,ie.map(Ie=>[Ie[0],Ie[1]-.16,Ie[2]]).reverse())}const mt=de(Je)>0?[...Je].reverse():Je;for(let gt=0;gt<mt.length;gt++){const ie=mt[gt],Ie=mt[(gt+1)%mt.length],at=(Ie[0]-ie[0])**2+(Ie[1]-ie[1])**2;if(at<1e-12)continue;const ft=[...new Set([0,1,...Ce.filter(De=>it(De,ie,Ie)).map(De=>((De[0]-ie[0])*(Ie[0]-ie[0])+(De[1]-ie[1])*(Ie[1]-ie[1]))/at)])].sort((De,We)=>De-We),qe=De=>[ie[0]+(Ie[0]-ie[0])*De,ie[1]+(Ie[1]-ie[1])*De];for(let De=0;De<ft.length-1;De++){if(ft[De+1]-ft[De]<1e-8)continue;const We=qe(ft[De]),et=qe(ft[De+1]),_t=qe((ft[De]+ft[De+1])/2);if(pe.some(ae=>ae!==Je&&ae.some((xe,ue)=>it(_t,xe,ae[(ue+1)%ae.length]))))continue;const M=[We[0],U(...We),We[1]],te=[et[0],U(...et),et[1]];Te.push([M,[M[0],M[1]-.16,M[2]],[te[0],te[1]-.16,te[2]],te])}}}_(d,An(Te.map(Je=>Je.map(o))),[0,0,0],"roof");const Ke={roof:[],roofLight:[],roofMuted:[]},st=d.startsWith("rear"),ct=[];for(const Je of pe){const vt=io({outer:Je.map(([mt,gt])=>({x:mt,y:gt}))});for(let mt=0;mt<vt.triangles.length;mt+=3)ct.push(vt.triangles.slice(mt,mt+3).map(gt=>[vt.points[gt].x,vt.points[gt].y]))}const Ne=Math.min(...y.map(Je=>Je[0])),je=Math.max(...y.map(Je=>Je[0])),ot=Math.min(...y.map(Je=>Je[1])),Tt=Math.max(...y.map(Je=>Je[1])),Ft=st?.27:.225,St=st?.225:.27;for(let Je=0;Je<Math.ceil((Tt-ot)/St)+1;Je++)for(let vt=0;vt<Math.ceil((je-Ne)/Ft)+1;vt++){const mt=Ne+vt*Ft-(st?Je%2*Ft/2:0),gt=ot+Je*St-(st?0:vt%2*St/2),ie=["roof","roofMuted","roofLight"][Math.floor(Math.abs(Math.sin(vt*12.9898+Je*78.233)*43758.5453)%1*3)],Ie=st?U(mt,gt+St)>U(mt,gt):U(mt+Ft,gt)>U(mt,gt),at=(qe,De)=>{const We=st?(De-gt)/St:(qe-mt)/Ft;return U(qe,De)+.025+.016*(Ie?1-We:We)},ft=[];for(const qe of ct){let De=we(we(we(we(qe,0,mt+.002,!1),0,mt+Ft-.002,!0),1,gt+.002,!1),1,gt+St-.002,!0);if(De=De.filter((M,te)=>Math.hypot(M[0]-De[(te+De.length-1)%De.length][0],M[1]-De[(te+De.length-1)%De.length][1])>1e-9),De.length<3||Math.abs(de(De))<1e-8)continue;de(De)>0&&De.reverse();const We=De.map(M=>[M[0],at(...M),M[1]]),et=We.map(M=>[M[0],M[1]-.028,M[2]]),_t=ft;_t.push(We,et.toReversed());for(let M=0;M<De.length;M++)_t.push([We[M],et[M],et[(M+1)%De.length],We[(M+1)%De.length]])}Ke[ie].push(...Le(ft))}for(const[Je,vt]of Object.entries(Ke))vt.length&&_(d+"-tiles-"+Je,An(vt.map(mt=>mt.map(o))),[0,0,0],Je)}Me("rear-north",[[-7.95,-5.85],[7.95,-5.85],[7.95,-2.775],[-7.95,-2.775]],(d,y)=>6.2+1.1*(y+5.85)),Me("rear-south",[[-7.95,-2.775],[7.95,-2.775],[7.95,.3],[5.425,-2.225],[2.9,.3],[-2.9,.3],[-5.425,-2.225],[-7.95,.3]],(d,y)=>6.53-1.1*y);for(const d of[-1,1])Me("wing-inner-"+d,[[2.9,.3],[5.425,-2.225],[5.425,6.35],[2.9,6.35]].map(([y,U])=>[y*d,U]),y=>6.2+1.1*(Math.abs(y)-2.9)),Me("wing-outer-"+d,[[5.425,-2.225],[7.95,.3],[7.95,6.35],[5.425,6.35]].map(([y,U])=>[y*d,U]),y=>6.2+1.1*(7.95-Math.abs(y)));for(let d=0,y=-7.92;y<7.92;y+=.31,d++){const U=y,E=Math.min(7.95,y+.3),B=-2.775,q=9.5825,oe=pe=>[[pe,q-.12,B-.16],[pe,q+.035,B],[pe,q-.12,B+.16],[pe,q-.155,B+.16],[pe,q-.004,B],[pe,q-.155,B-.16]],he=oe(U),ee=oe(E),de=[];for(const pe of[[0,1,4,5],[1,2,3,4]])de.push(pe.map(Te=>he[Te]).reverse(),pe.map(Te=>ee[Te]));for(let pe=0;pe<he.length;pe++)de.push([he[pe],he[(pe+1)%he.length],ee[(pe+1)%he.length],ee[pe]]);_("rear-ridge-tile-"+d,An(de.map(pe=>pe.map(o))),[0,0,0],"roofMuted")}for(const d of[-1,1])for(let y=0,U=-2.18;U<6.35;U+=.31,y++){const E=U,B=Math.min(6.35,U+.3),q=d*5.425,oe=8.9775,he=Te=>[[q-.16,oe-.12,Te],[q,oe+.035,Te],[q+.16,oe-.12,Te],[q+.16,oe-.155,Te],[q,oe-.004,Te],[q-.16,oe-.155,Te]],ee=he(E),de=he(B),pe=[];for(const Te of[[0,1,4,5],[1,2,3,4]])pe.push(Te.map(Ce=>ee[Ce]),Te.map(Ce=>de[Ce]).reverse());for(let Te=0;Te<ee.length;Te++)pe.push([ee[Te],de[Te],de[(Te+1)%ee.length],ee[(Te+1)%ee.length]]);_("wing-ridge-tile-"+d+"-"+y,An(pe.map(Te=>Te.map(o))),[0,0,0],"roofMuted")}A("roof-envelope",2,"roof"),I("rear-ridge",[-7.5,9.3,-2.775],[7.5,9.3,-2.775],.22);for(let d=-7.3,y=0;d<=7.31;d+=.73,y++){if(I("rear-rafter-n-"+y,[d,ve(d,-5.5)-.28,-5.5],[d,9.3,-2.775],.14),Math.abs(d)<2.85)I("rear-rafter-s-"+y,[d,9.3,-2.775],[d,ve(d,0)-.28,0],.14);else{const U=Math.abs(d),E=U<=5.425?3.2-U:U-7.65;I("rear-rafter-s-"+y,[d,9.3,-2.775],[d,ve(d,E)-.28,E],.14)}y%3===0&&(I("rear-tie-"+y,[d,6.03,-5.4],[d,6.03,0],.23),I("rear-king-"+y,[d,6.03,-2.775],[d,9.3,-2.775],.15))}for(const d of[-1,1]){I("wing-ridge-"+d,[d*5.425,8.6975,-2.225],[d*5.425,8.6975,6],.22);for(const y of[2.9,7.95])I("valley-"+d+"-"+y,[d*y,5.92,.3],[d*5.425,8.6975,-2.225],.22);for(let y=0,U=-1.9;U<.3;U+=.55,y++){const E=U+2.225,B=5.425-E,q=5.425+E;I("wing-rafter-jack-in-"+d+"-"+y,[d*B,ve(d*B,U)-.28,U],[d*5.425,8.6975,U],.14),I("wing-rafter-jack-out-"+d+"-"+y,[d*5.425,8.6975,U],[d*q,ve(d*q,U)-.28,U],.14)}for(let y=.4,U=0;y<6.01;y+=.7,U++)I("wing-rafter-in-"+d+"-"+U,[d*3.25,6.285,y],[d*5.425,8.6975,y],.14),I("wing-rafter-out-"+d+"-"+U,[d*5.425,8.6975,y],[d*7.6,6.285,y],.14),U%3===0&&(I("wing-tie-"+d+"-"+U,[d*3.25,6.03,y],[d*7.6,6.03,y],.23),I("wing-king-"+d+"-"+U,[d*5.425,6.03,y],[d*5.425,8.6975,y],.15))}for(const d of[Q[0]-.15,Q[1]+.15]){const y=Q[2]-.15,U=Q[3]+.15;I("shaft-roof-trimmer-"+d,[d,ve(d,y)-.28,y],[d,ve(d,U)-.28,U],.18)}for(const d of[Q[2]-.15,Q[3]+.15]){const y=Q[0]-.15,U=Q[1]+.15;I("shaft-roof-header-"+d,[y,ve(y,d)-.28,d],[U,ve(U,d)-.28,d],.18)}A("roof-frame",2,"roof-frame");function Ue(d,y,U,E){const B=U[0]-y[0],q=U[1]-y[1],oe=Math.hypot(B,q),he=-q/oe*.1,ee=B/oe*.1,de=Math.ceil(oe/1.3),pe=Array.from({length:de+1},(Ne,je)=>[Math.max(0,je/de-.06/oe),Math.min(1,je/de+.06/oe)]),Te=[...new Set([0,1,...E,...pe.flat()])].sort((Ne,je)=>Ne-je),Ce={oak:[],plaster:[]},it=[],Ke=(Ne,je,ot=0)=>{const Tt=y[0]+B*Ne+he*je,Ft=y[1]+q*Ne+ee*je;return[Tt,ve(Tt,Ft)-.18-ot,Ft]},st=(Ne,je)=>{const ot=Ke(Ne,je);return ot[1]=6.1,ot},ct=(Ne,je,ot=[0,1,0])=>{const Tt=je.length===4?[[je[0],je[1],je[2]],[je[0],je[2],je[3]]]:[je];for(const Ft of Tt)Ce[Ne].push(Ft),Ne==="oak"&&it.push({count:Ft.length,grainAxis:ot,origin:[y[0],6.1,y[1]]})};for(let Ne=0;Ne<Te.length-1;Ne++){const je=Te[Ne],ot=Te[Ne+1];if(ot-je<1e-8)continue;const Tt=(je+ot)/2,Ft=pe.some(([St,Je])=>Tt>St&&Tt<Je)?"oak":"plaster";for(const St of[-1,1]){const Je=[st(je,St),st(ot,St),Ke(ot,St,.16),Ke(je,St,.16)],vt=[Ke(je,St,.16),Ke(ot,St,.16),Ke(ot,St),Ke(je,St)];ct(Ft,St===1?Je:Je.toReversed()),ct("oak",St===1?vt:vt.toReversed(),Ke(ot,St).map((mt,gt)=>mt-Ke(je,St)[gt]))}ct("oak",[Ke(je,1),Ke(ot,1),Ke(ot,-1),Ke(je,-1)],Ke(ot,1).map((St,Je)=>St-Ke(je,1)[Je])),ct(Ft,[st(ot,1),st(je,1),st(je,-1),st(ot,-1)])}for(const Ne of[0,1]){const je=[st(Ne,1),Ke(Ne,1),Ke(Ne,-1),st(Ne,-1)];ct("oak",Ne===0?je:je.toReversed())}for(const[Ne,je]of Object.entries(Ce))je.length&&_(d+"-"+Ne,An(je.map(ot=>ot.map(o))),[0,0,0],Ne,void 0,{faceFrames:Ne==="oak"?it:void 0})}for(const d of[-1,1])Ue("front-gable-"+d,[d*3.25,5.9],[d*7.6,5.9],[0,.5,1]);A("gable-fill",2,"roof");for(const[d,y,U]of[["attic-north",[-7.6,-5.4],[7.6,-5.4]],["attic-west",[-7.5,-5.4],[-7.5,5.8]],["attic-east",[7.5,-5.4],[7.5,5.8]],["attic-court-west",[-3.35,-.1],[-3.35,5.9]],["attic-court-east",[3.35,-.1],[3.35,5.9]],["attic-court-rear",[-3.25,-.1],[3.25,-.1]]]){const E=U[0]-y[0],B=U[1]-y[1],q=[0,1];if(Math.abs(B)>.001)for(const oe of[-2.775,3.2-Math.abs(y[0]),Math.abs(y[0])-7.65]){const he=(oe-y[1])/B;he>0&&he<1&&q.push(he)}if(Math.abs(E)>.001)for(const oe of[-7.95,-5.425,-2.9,2.9,5.425,7.95]){const he=(oe-y[0])/E;he>0&&he<1&&q.push(he)}Ue(d,y,U,[...new Set(q)].sort((oe,he)=>oe-he)),A(d,2,"roof")}for(const[d,y,U,E,B]of[["west",-6.44,-1.3,.12,1.2],["east",-5.66,-1.3,.12,1.2],["north",-6.05,-1.84,.66,.12],["south",-6.05,-.76,.66,.12],["divider",-6.05,-1.3,.66,.12]])b("flue-"+d,[E,7.75,B],[y,5.825,U],"stone");for(const[d,y,U,E,B]of[["west",-6.44,-1.3,.2,1.36],["east",-5.66,-1.3,.2,1.36],["north",-6.05,-1.88,.58,.2],["south",-6.05,-.72,.58,.2],["divider",-6.05,-1.3,.58,.16]])C("flue-cap-"+d,[E,.16,B],[y,9.7,U],"stone",void 0,.012);for(let d=0,y=1.96;y<9.6;y+=.24,d++)for(const[U,E,B]of[["west",[-6.507,-1.9],[-6.507,-.7]],["east",[-5.593,-.7],[-5.593,-1.9]],["north",[-5.6,-1.907],[-6.5,-1.907]],["south",[-6.5,-.693],[-5.6,-.693]]]){const q=Math.hypot(B[0]-E[0],B[1]-E[1]),oe=-Math.atan2(B[1]-E[1],B[0]-E[0]);for(let he=0,ee=-.19*(d%2);ee<q;ee+=.39,he++){const de=Math.max(.007,ee),pe=Math.min(q-.007,ee+.382);if(pe-de<.02)continue;const Te=(de+pe)/2;C("chimney-ashlar-"+U+"-"+d+"-"+he,[pe-de,Math.min(.23,9.62-y),.02],[E[0]+(B[0]-E[0])*Te/q,y+Math.min(.23,9.62-y)/2,E[1]+(B[1]-E[1])*Te/q],(he+d)%3?"stone":"stoneLight",a([0,1,0],oe),.004)}}A("chimney",-1,"service-shaft"),S("hall-table",-6.57,.45,2.35,2.25,.8,0,Math.PI/2),N("hall-bench-west",-7.22,.45,2.35,2.12,.31,0,Math.PI/2),N("hall-bench-east",-6.01,.45,2.35,2.12,.31,0,Math.PI/2),w("hall-chest",-6.72,.45,5.3,1,.45,0,Math.PI),g("hall-rug",-6.55,.45,2.35,1.66,2.55,0),J("hall-hearth",-6.05,.45,-.78,1.45,1.55,.85),se("kitchen-counter",-5.8,.44,-4.65,2.5,.65),J("kitchen-hearth",-6.05,.45,-1.98,1.2,1.35,.85),_e("pantry-shelves",-2.93,1.3,-3.6,.42,1.7,2.5),S("ledger-desk",5.6,.42,-3.6,1.5,.75),N("ledger-seat",5.6,.4,-2.7,.5,.5,0,Math.PI,!0),z("ledger-bookcase",3.85,.45,-5,1.15,1.5,.35,0,0,"books"),w("ledger-lockbox",6.6,.45,-1.9,.85,.45,0),G("service-washbench",6.85,.45,2.5,0),me("master-bed",-5.4,3.33,3.8,2.05,1.6),w("master-chest",-6.65,3.38,1.5,1.1,.5),me("child-west-bed",-5.8,3.33,-4.5,2.05,.95),me("child-east-bed",5.25,3.33,-4.5,2.05,.95),w("child-west-chest",-6.4,3.33,-2.38,.9,.44,1),w("child-east-chest",3.67,3.33,-3.1,.75,.44,1),S("child-west-desk",-3.15,3.33,-2.55,1.35,.55,1),N("child-west-stool",-3.15,3.33,-3.15,.42,.42,1),S("child-east-desk",6.45,3.33,-2.55,1.35,.55,1),N("child-east-stool",6.45,3.33,-3.15,.42,.42,1),z("master-cabinet",-3.73,3.33,2.8,.72,1.45,.38,1,-Math.PI/2,"clothes"),R("master-nightstand",-6.84,4.68,1),N("master-seat",-3.9,3.33,5.25,.52,.43,1,Math.PI/2,!0),G("wash-basin",3.74,3.33,1.75),K("latrine",3.88,3.33,3.1),_e("storage-shelves",5.35,3.33,3.25,.4,1.6,3.6,1),w("storage-chest",6.65,3.36,4.9,.85,.6),N("gallery-west-bench",-3.85,0,6.55,1.12,.27,-1),N("gallery-east-bench",3.85,0,6.55,1.12,.27,-1),N("gallery-rear-bench",-2,0,6.55,1.05,.25,-1),z("gallery-rear-cabinet",.8,.45,-3.4,.62,1.05,.27,0),g("upper-corridor-runner",.38,3.33,-.9,10.35,.64,1),g("landing-runner",2.4,3.33,-3.48,.64,2.2,1),w("landing-chest",.8,.45,-4.65,.62,.42,0),N("entrance-bench",2.72,.42,-2.55,1.1,.28,0,Math.PI/2),z("entrance-cabinet",2.48,.76,-4.55,.52,.95,.34,0,0,"shoes"),z("service-cabinet",6.22,.8,5.32,.7,1.25,.36,0,Math.PI,"linen"),T("service-drying-rack",5.5,4.8);for(const[d,y,U,E,B,q]of[["hall-lamp",-7.3725,2.27,1.725,0,Math.PI/2],["kitchen-lamp",-4.93,1.92,-5.2725,0,0],["ledger-lamp",-7.6+15.2*10/11,1.92,-5.2725,0,0],["master-lamp",-3.4775,5.08,2.95,1,-Math.PI/2],["corridor-lamp",-.65,5.08,-.2275,1,Math.PI],["landing-lamp",2.9725,5.08,-5.3+3.55*2/3,1,-Math.PI/2]])re(d,y,U,E,B,q);Yg({box:b,mesh:_,beam:m,finish:A,polyhedron:An,revolve:pi,extrude:Zr,V:o,Q:a,bevel:C,registerMechanism:d=>v.push(d)});const Ye=[[0,0],[1.02,0],[1.02,.15],[.68,.15],[.68,.3],[.34,.3],[.34,.45],[0,.45]],$e=io({outer:Ye.map(([d,y])=>({x:d,y}))}),rt=[];for(let d=0;d<$e.triangles.length;d+=3){const y=$e.triangles.slice(d,d+3).map(U=>$e.points[U]);rt.push(y.map(U=>[-.6,U.y,U.x]),y.toReversed().map(U=>[.6,U.y,U.x]))}for(let d=0;d<Ye.length;d++){const y=Ye[d],U=Ye[(d+1)%Ye.length];rt.push([[-.6,y[1],y[0]],[.6,y[1],y[0]],[.6,U[1],U[0]],[-.6,U[1],U[0]]])}for(let d=0;d<3;d++)for(let y=0;y<3;y++){const U=.45-d*.15;C("entry-step-stone-"+d+"-"+y,[.397,U,.338],[-.4+y*.4,U/2,.17+d*.34],(d+y)%3?"stone":"stoneLight",void 0,.006)}A("entry-steps",0,"stair");for(const d of v){const y=u.find(E=>E.id===d.parent);if(!y)throw new Error("Missing mechanism owner: "+d.parent);const U=c;c=y.model.parts,P(d.id,d.parent,d.level,E=>E.id.startsWith(d.prefix),d.pivot,d.restAngle,d.axis,d.travel,d.kind),y.model.parts=c,c=U,d.default!==void 0&&(u.at(-1).articulation.default=d.default)}{const d=u.find(B=>B.id==="wash-door-leaf"),y=c;c=d.model.parts,P("wash-door-privacy-bolt",d.id,1,B=>B.id===d.id+"-privacy-bolt"||B.id===d.id+"-bolt-knob",[.865-.17-.004,2.065*.52+.18-.0115,.076],0,[1,0,0],-.105,"sliding-bolt"),d.model.parts=c,c=y;const U=u.at(-1).articulation;U.motion={kind:"prismatic",axis:o([1,0,0]),min:-.105,max:0},U.relativeToParent=!0,U.default=1,h.flatMap(B=>B.openings).find(B=>B.id==="wash-door").operation.hardware.push({id:"wash-door-privacy-bolt",kind:"sliding-privacy-bolt",element:"wash-door-privacy-bolt"})}if(t)return{entries:u,rooms:p,boundaries:h,portals:f,holes:X,chimneyCut:Q};const Z=new ff;Z.background=new dt("#ded9cf");const pt=new mn(46.83,1.5,.025,120);Z.add(new Of("#edf2f5","#827764",1.1));const Ae=new tl("#fff1df",2.6);Ae.position.set(-12,18,10),Ae.castShadow=!0,Ae.shadow.mapSize.set(4096,4096),Object.assign(Ae.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:.1,far:55}),Ae.shadow.normalBias=.025,Ae.shadow.bias=-1e-4,Z.add(Ae),Z.add(Ae.target);const L=new tl("#fff8ed",.5);Z.add(L),Z.add(L.target);const x=new Map;for(const d of u){const{object:y}=i?i.build(d):hs(d.model,e);y.name=d.id,d.pose&&(y.position.set(...d.pose.pivot),y.rotation.y=d.pose.angle),y.traverse(U=>{var E;U.isMesh&&(U.castShadow=!0,U.receiveShadow=!0,((E=d.model.parts.find(B=>B.name===U.name))==null?void 0:E.material)==="glass"&&(U.material=U.material.clone(),U.material.transparent=!0,U.material.opacity=.35,U.material.depthWrite=!1,U.castShadow=!1))}),Z.add(y),x.set(d.id,y)}function ce(d,y){const U=d.articulation,E=x.get(d.id),B=U.rest,q=new fe(U.motion.axis.x,U.motion.axis.y,U.motion.axis.z).normalize(),oe=U.closed+(U.open-U.closed)*y,he=new fe(B.translation.x,B.translation.y,B.translation.z),ee=new Qt(B.rotation.x,B.rotation.y,B.rotation.z,B.rotation.w),de=new fe(B.scale.x,B.scale.y,B.scale.z);U.motion.kind==="revolute"?ee.multiply(new Qt().setFromAxisAngle(q,oe)):he.addScaledVector(q.applyQuaternion(ee),oe);const pe=new yt().compose(he,ee,de);if(U.relativeToParent){const Te=x.get(d.parent);Te.updateMatrixWorld(!0),pe.premultiply(Te.matrixWorld)}pe.decompose(E.position,E.quaternion,E.scale)}const ge=(d,y)=>{if(d===y)return!0;const U=u.find(E=>E.id===d);return!!(U!=null&&U.parent&&ge(U.parent,y))},ye=d=>{const y=new Nn;for(const U of u)ge(U.id,d)&&y.union(new Nn().setFromObject(x.get(U.id)));return y};for(const d of u)d.articulation&&ce(d,d.articulation.default);const Re=[{id:"01-whole-south-east",eye:[20,13,23],at:[0,3,0]},{id:"02-whole-south-west",eye:[-20,13,23],at:[0,3,0]},{id:"03-whole-north-east",eye:[20,12,-23],at:[0,3,0]},{id:"04-whole-north-west",eye:[-20,12,-23],at:[0,3,0]},{id:"exterior-south",eye:[0,6,27],at:[0,3,0]},{id:"exterior-north",eye:[0,6,-27],at:[0,3,0]},{id:"exterior-west",eye:[-27,6,0],at:[0,3,0]},{id:"exterior-east",eye:[27,6,0],at:[0,3,0]},{id:"roof-overhead",eye:[0,27,3],at:[0,0,0]},{id:"ground-plan",eye:[0,26,0],at:[0,0,0],cut:"ground",plan:!0},{id:"upper-plan",eye:[0,27,0],at:[0,3.33,0],cut:"upper",plan:!0},{id:"stair-section-west",eye:[-7.5,3.5,-3.7],at:[.4,1.9,-3.7],cut:"stair"},{id:"stair-section-south",eye:[.3,3.5,4],at:[.3,1.9,-3.7],cut:"stair"},{id:"frame-axonometric",eye:[19,19,21],at:[0,2,0],cut:"frame"},{id:"reference-exterior",eye:[16,7.5,20],at:[0,4,0]},{id:"reference-courtyard",eye:[.2,1.75,7.7],at:[0,2.5,-.6]},{id:"garden-south",eye:[0,1.6,6.6],at:[0,1.5,.1]},{id:"garden-reverse",eye:[0,2,-.8],at:[0,1.3,5.5]},{id:"stair-start",eye:[-.7,2.05,-1.6],at:[-.7,2,-4.8]},{id:"stair-turn",eye:[-.7,3.49,-4.7],at:[2.5,3.6,-4.7]},{id:"stair-top-return",eye:[2.35,4.93,-4.7],at:[-.7,2.4,-4.7]},{id:"landing-to-corridor",eye:[2.35,4.93,-3.4],at:[-1,4.6,-.9]},{id:"gallery-turn-west",eye:[-3.9,2.05,-.65],at:[-3.85,1.6,5.4]},{id:"gallery-turn-east",eye:[3.9,2.05,-.65],at:[3.85,1.6,5.4]},{id:"corridor-west-to-east",eye:[-5.1,4.93,-.9],at:[5.9,4.7,-.9]},{id:"corridor-east-to-west",eye:[6,4.93,-.9],at:[-5.1,4.7,-.9]}];for(const d of p){const[y,U,E,B]=d.bounds,q=k[d.level]+1.6,oe=[(y+U)/2,q,(E+B)/2];for(const[he,ee,de]of[["north",0,-1],["east",1,0],["south",0,1],["west",-1,0]])Re.push({id:d.id+"--"+he,eye:oe,at:[oe[0]+ee,q,oe[2]+de],room:d.id});for(const[he,ee,de]of[["corner-a",y+.25,E+.25],["corner-b",U-.25,B-.25],["corner-c",y+.25,B-.25],["corner-d",U-.25,E+.25]])Re.push({id:d.id+"--"+he,eye:[ee,q,de],at:[oe[0],q-.3,oe[2]],room:d.id});Re.push({id:d.id+"--threshold",eye:[d.door[0],q,d.door[1]],at:[oe[0],q-.25,oe[2]],room:d.id})}for(const d of p.filter(y=>y.polygon.length>4)){const y=U=>{let E=!1;for(let B=0,q=d.polygon.length-1;B<d.polygon.length;q=B++){const oe=d.polygon[B],he=d.polygon[q];oe[1]>U[1]!=he[1]>U[1]&&U[0]<(he[0]-oe[0])*(U[1]-oe[1])/(he[1]-oe[1])+oe[0]&&(E=!E)}return E};for(let U=0;U<d.polygon.length;U++){const E=d.polygon[U],B=d.polygon[(U+d.polygon.length-1)%d.polygon.length],q=d.polygon[(U+1)%d.polygon.length];let oe=(B[0]-E[0])/Math.hypot(B[0]-E[0],B[1]-E[1])+(q[0]-E[0])/Math.hypot(q[0]-E[0],q[1]-E[1]),he=(B[1]-E[1])/Math.hypot(B[0]-E[0],B[1]-E[1])+(q[1]-E[1])/Math.hypot(q[0]-E[0],q[1]-E[1]);y([E[0]+oe*.22,E[1]+he*.22])||(oe=-oe,he=-he);const ee=[E[0]+oe*.22,k[d.level]+1.6,E[1]+he*.22];Re.push({id:d.id+"--polygon-corner-"+U,room:d.id,eye:ee,at:[ee[0]+oe,ee[1]-.2,ee[2]+he]})}}for(const d of p){const[y,U,E,B]=d.bounds,q=k[d.level]+1.6,oe=[(y+U)/2,q,(E+B)/2];if(!d.id.startsWith("gallery")&&d.id!=="landing"&&d.id!=="corridor"){const he=oe[0]-d.door[0],ee=oe[2]-d.door[1],de=Math.hypot(he,ee);Re.push({id:d.id+"--inside-entry",eye:[d.door[0]+he/de*.65,q,d.door[1]+ee/de*.65],at:[oe[0],q-.4,oe[2]],room:d.id})}}Re.push({id:"storage--nook-in",eye:[6.92,4.93,-1.15],at:[6.92,4.55,2.5],room:"storage"},{id:"storage--nook-return",eye:[6.92,4.93,1.4],at:[6.92,4.5,-1.5],room:"storage"},{id:"master--shaft-clear",eye:[-6.98,4.93,-1.1],at:[-6.6,4.45,.7],room:"master"},{id:"pantry--aisle-high",eye:[-2.2,2.85,-4.8],at:[-2.7,1.15,-2],room:"pantry"},{id:"hall--hearth-clear",eye:[-5.1,2.35,1],at:[-6.3,1.2,-.5],room:"hall"},{id:"kitchen--working-clear",eye:[-4.1,2.35,-2.7],at:[-6.2,1.2,-3.7],room:"kitchen"},{id:"washroom--screen-front",eye:[4.55,5.2,.5],at:[3.8,4,1.5],room:"washroom"},{id:"washroom--screen-back",eye:[4.55,5.2,4.8],at:[3.85,4,2.1],room:"washroom"},{id:"storage--aisle-high",eye:[5.5,5.65,1],at:[6.5,4.2,4.5],room:"storage"},{id:"gallery--entry-approach",eye:[.8,2.05,-.1],at:[.8,1.9,-2.5],room:"gallery-rear"},{id:"stair--lower-inner",eye:[1.6,2.2,-2],at:[-.7,1.5,-3.7],room:"entrance"},{id:"stair--landing-high",eye:[-.7,4.3,-4.7],at:[2.1,3.2,-4.7],room:"entrance"});for(const d of Re)d.id==="kitchen--inside-entry"&&(d.eye=[-4,2.05,-2.6],d.at=[-5.8,1.6,-3.8]),d.id==="master--inside-entry"&&(d.eye=[-4.45,4.93,1.3],d.at=[-5.4,4.4,3.8]);const Be={"ledger--corner-a":[4.8,2.05,-4.85],"service--threshold":[4.95,2.05,4],"gallery-rear--threshold":[.35,2.05,-.35],"hall--corner-a":[-6.98,2.05,.15],"hall--corner-d":[-4.94,2.05,.2],"pantry--corner-a":[-2.48,2.05,-4.95],"pantry--corner-c":[-2.47,2.05,-1.7],"entrance--corner-a":[-1.08,2.05,-1.85],"master--corner-d":[-4.08,4.93,.6],"master--threshold":[-4.46,4.93,.85],"master--polygon-corner-0":[-6.97,4.93,-.42],"master--polygon-corner-5":[-4,4.93,.7],"storage--corner-a":[5.9,4.93,.48],"storage--corner-c":[5.9,4.93,5.4],"storage--polygon-corner-0":[6.78,4.93,-1.25],"storage--polygon-corner-1":[7.16,4.93,-1.25],"storage--polygon-corner-3":[5.9,4.93,5.35],"storage--polygon-corner-4":[5.75,4.93,.65],"storage--aisle-high":[6.1,5.65,.65],"landing--corner-b":[2.36,4.93,-2.1],"landing--polygon-corner-2":[2.42,4.93,-2.08]};for(const d of Re){if(Be[d.id]){d.eye=Be[d.id];const y=p.find(oe=>oe.id===d.room),[U,E,B,q]=y.bounds;d.at=[(U+E)/2,k[y.level]+.95,(B+q)/2]}if((nt=d.room)!=null&&nt.startsWith("gallery")&&/--(north|east|south|west)$/.test(d.id)){const y=p.find(he=>he.id===d.room),[U,E,B,q]=y.bounds,oe=d.id.split("--")[1];if(d.room==="gallery-rear")d.eye=[.32,2.05,-.55],d.at=oe==="east"?[4,1.65,-.55]:oe==="west"?[-4,1.65,-.55]:oe==="north"?[.8,1.75,-1.3]:[.32,1.4,1.3];else{const he=(U+E)/2;d.eye=[he,2.05,2.25],d.at=oe==="north"?[he,1.7,-.5]:oe==="south"?[he,1.7,5.8]:[oe==="east"?E:U,1.4,3.9]}}if(d.room==="washroom"&&/--(north|east|south|west)$/.test(d.id)){const y=d.id.split("--")[1];d.eye=[4.48,4.93,y==="north"?1.7:3.85],d.at=y==="north"?[3.8,4.08,.8]:y==="south"?[3.8,3.95,4.8]:y==="east"?[4.85,4.02,3.1]:[3.8,3.85,3.1]}d.id==="corridor--south"&&(d.eye=[.35,4.93,-1.1],d.at=[2.5,4.05,-.08]),d.id==="landing--east"&&(d.eye=[2.3,4.93,-3.3],d.at=[2.8,3.95,-2.02])}for(const d of[...Re])if(d.room&&/--(north|east|south|west)$/.test(d.id)){const y=p.find(pe=>pe.id===d.room),[U,E,B,q]=y.bounds,oe=k[y.level]+1.6,he=d.id.split("--")[1],ee=[(U+E)/2,oe,(B+q)/2],de={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[he];(d.eye.some((pe,Te)=>pe!==ee[Te])||Math.abs(d.at[1]-oe)>1e-4)&&Re.push({...d,id:d.id+"-working-detail"}),d.eye=ee,d.at=[ee[0]+de[0],oe,ee[2]+de[1]]}for(const[d,y]of[["hall","hall-door"],["kitchen","kitchen-door"],["pantry","pantry-door"],["ledger","ledger-door"],["service","service-door"],["entrance","entrance-door"],["master","master-door"],["child-west","child-west-door"],["child-east","child-east-door"],["washroom","wash-door"],["storage","storage-door"]]){const U=p.find(pe=>pe.id===d),E=f.find(pe=>pe.id===y),B=Re.find(pe=>pe.id===d+"--inside-entry"),q=k[U.level]+1.6,oe=d==="washroom"?[4.53,q,2.1]:d==="entrance"?[2.24,q,-2.12]:(B==null?void 0:B.eye)||[(U.bounds[0]+U.bounds[1])/2,q,(U.bounds[2]+U.bounds[3])/2],he=[oe[0]-E.eye[0],oe[2]-E.eye[2]],ee=Math.hypot(...he),de=ee<3.15?[E.eye[0]+he[0]*3.15/ee,q,E.eye[2]+he[1]*3.15/ee]:oe;for(const pe of[0,.5,1])Re.push({id:d+"--door-sweep-"+pe,room:d,eye:de,at:[E.eye[0],k[U.level]+1.05,E.eye[2]],doorOpen:pe})}for(const[d,y,U,E]of[["hall--aisle-length","hall",[-5.302,2.05,3.68],[-5.302,1.25,.85]],["hall--west-seat-end","hall",[-7,2.05,3.85],[-7,1.1,2.35]],["ledger--bookcase-front","ledger",[4.25,2.05,-3.9],[3.85,1.35,-5]],["entrance--understair-storage","entrance",[1.72,2.05,-2.9],[.8,1.05,-4.3]],["gallery-west--clear-lane","gallery-west",[-3.91,2.05,5.52],[-3.91,1.2,.1]],["gallery-east--clear-lane","gallery-east",[3.91,2.05,5.52],[3.91,1.2,.1]],["gallery-rear--clear-lane","gallery-rear",[-3.9,2.05,-.69],[3.9,1.3,-.69]],["washroom--basin-workspace","washroom",[4.47,4.93,.65],[3.9,4.1,1.7]],["garden--seating-return",null,[-.1,1.6,9.3],[-2.1,.8,6.55]]])Re.push({id:d,room:y,eye:U,at:E});for(const d of u){const y=(((ke=d.pose)==null?void 0:ke.closedAngle)??((Ge=d.review)==null?void 0:Ge.frontAngle)??0)*180/Math.PI;for(const[U,E,B]of[["front",0,0],["right",90,0],["rear",180,0],["left",270,0],["top",0,85],["bottom",0,-85],["oblique-a",40,30],["oblique-b",220,30]])Re.push({id:d.id+"--"+U,object:d.id,az:E+y,el:B,neutral:!0});if(d.articulation)for(const U of[0,.5,1])for(const[E,B]of[["a",40],["b",220]])Re.push({id:d.id+"--operation-"+U+"-"+E,object:d.parent,focus:d.id,operation:{element:d.id,fraction:U},az:(E==="a"?40:140)+y,el:20,connectionOnly:d.role==="window"}),Re.push(d.id==="hall-chest-lid"?{id:d.id+"--operation-"+U+"-"+E+"-context",room:"hall",eye:E==="a"?[-6.1,2.05,4.3]:[-6.95,2.05,4.3],at:[-6.72,1.05,5.3],operation:{element:d.id,fraction:U}}:d.id==="ww-c-0-casement--1"&&E==="a"?{id:d.id+"--operation-"+U+"-"+E+"-context",room:"kitchen",eye:[-5.9,2.05,-3.75],at:[-7.35,1.96,-2.96],operation:{element:d.id,fraction:U}}:{id:d.id+"--operation-"+U+"-"+E+"-context",object:d.id,context:!0,operation:{element:d.id,fraction:U},az:B,el:20})}const be={purpose:"whole manor scratch frame; not formal compiler topology",rooms:p,boundaries:h,portals:f,entries:u.map(({model:d,...y})=>({...y,parts:d.parts.map(U=>U.id)})),area:{footprint:135.8,upperOpening:X.reduce((d,y)=>d+(y[1]-y[0])*(y[3]-y[2]),0),servicePenetration:(Q[1]-Q[0])*(Q[3]-Q[2])},holes:X,chimneyCut:Q};n===!1&&(Ae.castShadow=!1);function Ee(d){var U,E;const y=Re[d];for(const B of u){const q=x.get(B.id);B.pose&&(q.rotation.y=y.neutral||y.room&&y.id.includes("corner")||y.operation&&ge(y.operation.element,B.id)?B.pose.closedAngle:B.pose.angle),B.articulation&&ce(B,((U=y.operation)==null?void 0:U.element)===B.id?y.operation.fraction:y.neutral?0:B.articulation.default),q.visible=y.context||!y.object||ge(B.id,y.object),y.connectionOnly&&B.id===y.object&&(q.visible=!1),y.cut==="ground"&&(q.visible=B.level<=0&&B.id!=="floor-joists"),y.cut==="upper"&&(q.visible=B.level===1&&B.id!=="upper-ceiling"||B.id==="central-stair"||B.id==="chimney"),y.cut==="frame"&&(q.visible=B.id!=="roof-envelope"&&B.id!=="upper-ceiling"),y.cut==="stair"&&(q.visible=["central-stair","upper-floor","ground-floor","foundation","floor-joists"].includes(B.id)),q.traverse(oe=>{if(oe.isMesh){const he=Array.isArray(oe.material)?oe.material:[oe.material];for(const ee of he)ee.clippingPlanes=y.cut==="stair"&&(B.role==="slab"||B.id==="floor-joists")?[y.id.endsWith("west")?new pn(new fe(1,0,0),1.4):new pn(new fe(0,0,-1),-2.2)]:[],B.id==="chimney"&&["ground","upper"].includes(y.cut)&&(ee.clippingPlanes=[new pn(new fe(0,-1,0),y.cut==="ground"?3.11:6.12),...y.cut==="upper"?[new pn(new fe(0,1,0),-3.33)]:[]])}})}if(y.doorOpen!==void 0)for(const B of u)B.pose&&(x.get(B.id).rotation.y=B.pose.closedAngle+(B.pose.angle-B.pose.closedAngle)*y.doorOpen);if(y.doorOpen!==void 0)for(const B of u)(E=B.articulation)!=null&&E.relativeToParent&&ce(B,B.articulation.default);if(pt.up.set(0,1,0),pt.fov=2*Math.atan(Math.tan(Math.PI/6)/pt.aspect)*180/Math.PI,y.plan&&pt.up.set(0,0,-1),y.object){const B=ye(y.focus??y.object);y.focus&&B.expandByScalar(.07);const q=B.getCenter(new fe),oe=y.az*Math.PI/180,he=y.el*Math.PI/180,ee=new fe(Math.sin(oe)*Math.cos(he),Math.sin(he),Math.cos(oe)*Math.cos(he)),de=new fe().crossVectors(new fe(0,1,0),ee).normalize(),pe=new fe().crossVectors(ee,de).normalize(),Te=Math.tan(pt.fov*Math.PI/360),Ce=Te*pt.aspect;let it=.1;for(const Ke of[B.min.x,B.max.x])for(const st of[B.min.y,B.max.y])for(const ct of[B.min.z,B.max.z]){const Ne=new fe(Ke,st,ct).sub(q);it=Math.max(it,Ne.dot(ee)+1.12*Math.max(Math.abs(Ne.dot(de))/Ce,Math.abs(Ne.dot(pe))/Te))}pt.position.copy(q).addScaledVector(ee,it),pt.lookAt(q)}else pt.position.set(...y.eye),pt.lookAt(...y.at);return L.visible=!!(y.object||y.room||y.id.includes("stair")||y.id.includes("corridor")||y.id.includes("landing")),L.position.copy(pt.position),L.target.position.copy(y.object?ye(y.focus??y.object).getCenter(new fe):new fe(...y.at)),pt.updateProjectionMatrix(),i&&(Z.updateMatrixWorld(!0),pt.updateMatrixWorld(!0),i.update(pt)),y}const Fe=new fe(0,3,0);return Ee(0),{scene:Z,camera:pt,views:Re,objects:x,entries:u,inspection:L,applyView:Ee,manifest:be,target:Fe,setArticulation:ce,configureRenderer:$g,update(){L.position.copy(pt.position),L.target.position.copy(Fe)}}}const Hl=()=>({translation:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1},scale:{x:1,y:1,z:1}}),Qr=n=>({x:n.x,y:n.y,z:n.z});function Kg(n){const e=[],t=[],i=[],r=new Map,s=[];for(const l of n){const c=new Map;for(const[u,h]of l.model.parts.entries()){const f=h.geometry.type==="mesh"?h.geometry.mesh:null;if(!f||f.skin||h.attachedBone!==null){i.push({entry:l.id,part:h.id,partIndex:u});continue}const p=[1/0,1/0,1/0],v=[-1/0,-1/0,-1/0];for(let J=0;J<f.positions.length;J++)p[J%3]=Math.min(p[J%3],f.positions[J]),v[J%3]=Math.max(v[J%3],f.positions[J]);const b=p.map((J,se)=>(J+v[se])/2),_={...f,positions:f.positions.map((J,se)=>J-b[se%3])},m=l.model.materials.find(J=>J.id===h.material),I=JSON.stringify([_,m]);let ne=r.get(I);if(!ne){const J="manor-prototype-"+String(e.length).padStart(5,"0");ne={id:J,bounds:{min:Qr(new fe(...p.map((se,_e)=>se-b[_e]))),max:Qr(new fe(...v.map((se,_e)=>se-b[_e])))},model:{id:J,name:J,origin:"generated",skeleton:null,materials:[m],parts:[{...h,id:"member",name:"member",geometry:{type:"mesh",mesh:_},transform:Hl()}],asset:null,body:null}},r.set(I,ne),e.push(ne)}const A=h.transform??Hl(),P=new yt().compose(new fe(A.translation.x,A.translation.y,A.translation.z),new Qt(A.rotation.x,A.rotation.y,A.rotation.z,A.rotation.w),new fe(A.scale.x,A.scale.y,A.scale.z)).multiply(new yt().makeTranslation(...b)),C=new fe,W=new Qt,S=new fe;P.decompose(C,W,S);const N={id:h.id+"@"+u,translation:Qr(C),rotation:{x:W.x,y:W.y,z:W.z,w:W.w},scale:Qr(S)};c.has(ne.id)||c.set(ne.id,[]),c.get(ne.id).push(N),s.push({entry:l.id,part:h.id,partIndex:u,prototype:ne.id,transform:N})}for(const[u,h]of c){const f=e.find(v=>v.id===u).model.materials[0],p=f.baseColor;t.push({entry:l.id,definition:{id:l.id+"--"+u,modelRecipe:u,count:h.length,layout:{kind:"explicit",transforms:h},anchor:{x:0,y:0,z:0},facingDeg:0,seed:1902,variation:{scale:{min:1,max:1},palette:["#"+new dt(p.r,p.g,p.b).getHexString()],traits:[]}}})}}const o=new Map;for(const l of s)o.set(l.prototype,(o.get(l.prototype)??0)+1);const a=new Set([...o].filter(([,l])=>l>1).map(([l])=>l));for(const l of s)a.has(l.prototype)||i.push({entry:l.entry,part:l.part,partIndex:l.partIndex});return{prototypes:e.filter(l=>a.has(l.id)),sets:t.filter(l=>a.has(l.definition.modelRecipe)),singletons:i,partBindings:s.filter(l=>a.has(l.prototype))}}const Vl=1024,Wc=["x","y","z"],Wl=n=>{const e={x:1/0,y:1/0,z:1/0},t={x:-1/0,y:-1/0,z:-1/0},i={x:0,y:0,z:0};return n.forEach((r,s)=>{for(const o of Wc){const a=r.translation[o];e[o]=Math.min(e[o],a),t[o]=Math.max(t[o],a),i[o]=i[o]*(s/(s+1))+a/(s+1)}}),{bounds:{min:e,max:t},centroid:i}},Zg=n=>Math.max(.01,Math.hypot(...Wc.map(e=>Math.max(Math.abs(n.min[e]),Math.abs(n.max[e])))));function Jg(n,e){const{transforms:t}=n.layout,i=[];for(let s=0;s<n.count;s+=Vl){const o=Math.min(Vl,n.count-s);i.push({index:i.length,start:s,count:o,...Wl(t.slice(s,s+o))})}const r=[{tier:"near",maxDistance:null,recipe:n.modelRecipe,model:Uc(n.modelRecipe)}];return{version:1,id:n.id,count:n.count,modelRecipe:n.modelRecipe,layout:n.layout,route:null,anchor:n.anchor,facingDeg:n.facingDeg,seed:n.seed,variation:n.variation,...Wl(t),projectionRadius:e,chunks:i,lod:r}}function Qg(n){const e=Kg(n),t=new Map;for(const i of e.prototypes)t.set(i.id,Zg(i.bounds)),i.model.id=Uc(i.id);return{...e,sets:e.sets.map(i=>({...i,compiled:Jg(i.definition,t.get(i.definition.modelRecipe))}))}}function jg(n,e){const t=new Map(n.prototypes.map(a=>[a.model.id,a.model])),i=new Map(n.prototypes.map(a=>[a.model.id,hs(a.model,e)])),r=new Map;for(const a of n.sets)r.has(a.entry)||r.set(a.entry,[]),r.get(a.entry).push(a);const s=[];let o=0;return{build(a){const l=new vi;l.name=a.id;for(const u of r.get(a.id)??[]){const h=Ng({instanceSet:u.compiled,models:t,prototypeObjects:i});l.add(h.object),s.push(h),o+=u.compiled.count}const c=new Set(n.singletons.filter(u=>u.entry===a.id).map(u=>u.partIndex));return c.size&&l.add(hs({...a.model,parts:a.model.parts.filter((u,h)=>c.has(h))},e).object),{object:l}},update(a,l=1024){for(const c of s)c.update(a,l)},stats(){return{prototypes:t.size,instanceSets:s.length,drawnInstances:o,gpuInstancedMeshes:s.reduce((a,l)=>(l.object.traverse(c=>{c.isInstancedMesh&&a++}),a),0)}}}}const Xl={"assets/textures/manor/oak-albedo-v1.png":new URL(""+new URL("oak-albedo-v1-Cqbj0niT.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/limestone-albedo-v1.png":new URL(""+new URL("limestone-albedo-v1-Cgf_arJh.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/lime-plaster-albedo-v1.png":new URL(""+new URL("lime-plaster-albedo-v1-D1fYnT5c.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/terracotta-albedo-v1.png":new URL(""+new URL("terracotta-albedo-v1-By3kfZ1o.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/linen-albedo-v1.png":new URL(""+new URL("linen-albedo-v1-JYGz-mUD.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/apple-bark-albedo-v1.png":new URL(""+new URL("apple-bark-albedo-v1-ClEyDPCq.png",import.meta.url).href,import.meta.url).href,"assets/textures/manor/garden-soil-albedo-v1.png":new URL(""+new URL("garden-soil-albedo-v1-D2kB78t7.png",import.meta.url).href,import.meta.url).href};async function ex({report:n=()=>{},...e}={}){await n("Decoding textures");const t=new Ff,i=new bg(r=>{const s=Xl[r];if(!s)throw new Error("Unresolved manor texture: "+r);return t.loadAsync(s)});try{await i.prime(Vg()),await n("Deriving shared prototypes");const r=Qg(Gl({geometryOnly:!0}).entries),s=jg(r,i.resolve);await n("Building the manor");const o=Gl({...e,geometryOnly:!1,resolveTexture:i.resolve,instanceConsumer:s});if(o.scene===void 0)throw new Error("Textured manor preview requires the visual scene capability; geometry-only output cannot be displayed.");const a=o.update;return o.update=()=>{a(),s.update(o.camera)},{...o,followLighting:a,instanceConsumer:s,instanceState:s.stats(),textureState:{ready:!0,decoded:i.size,assets:Object.keys(Xl)},disposeTextures:()=>i.dispose()}}catch(r){throw await i.dispose(),r}}const tx=(n,e,t)=>{const i=n.toFixed(2),r=Math.max(...e,0);let s=!1,o=0,a=0,l=0;for(const u of e){if(s===!1&&u===r){s=!0;continue}o+=u,a+=Math.min(u,t),l+=1}if(o<=0)return`${i}m/s`;const c=(n*(a/o)).toFixed(2);return c===i?`${i}m/s`:`${i}m/s (flying ${c}m/s at ${(l/o).toFixed(1)}fps)`},nx=n=>{const e=new Set,t=n.items.map(m=>{if(m.id.length===0||e.has(m.id))throw new Error("Preview navigation requires unique, nonempty item IDs.");return e.add(m.id),{...m,search:[m.id,m.label,m.group??"",...m.keywords??[]].join(" ").normalize("NFKC").toLowerCase()}}),i=new AbortController,r=document.createElement("section");r.id="preview-navigation",r.setAttribute("aria-label","Scene navigation");const s=document.createElement("div");s.className="preview-navigation-heading";const o=document.createElement("strong");o.textContent="Scene navigation";const a=document.createElement("button");a.type="button",a.textContent="Collapse",a.setAttribute("aria-expanded","true"),a.setAttribute("aria-controls","preview-navigation-content"),s.append(o,a);const l=document.createElement("div");l.id="preview-navigation-content";const c=document.createElement("label");c.textContent="Search rooms, objects, or views";const u=document.createElement("input");u.type="search",u.placeholder="Name, group, or keyword",u.autocomplete="off",c.append(u);const h=document.createElement("label");h.textContent="View";const f=document.createElement("select");h.append(f);const p=document.createElement("button");p.type="button",p.textContent="Go to view";const v=document.createElement("div");v.className="preview-navigation-count",v.setAttribute("role","status"),l.append(c,h,p,v),r.append(s,l);let b="";const _=()=>{const m=u.value.normalize("NFKC").toLowerCase().trim().split(/\s+/).filter(Boolean),I=t.filter(P=>m.every(C=>P.search.includes(C))),ne=new Option(I.length===0?"No matching views":"Choose a view","");ne.disabled=!0,f.replaceChildren(ne);const A=new Map;for(const P of I){const C=new Option(P.label,P.id);if(P.group===void 0||P.group.length===0)f.append(C);else{let W=A.get(P.group);W===void 0&&(W=document.createElement("optgroup"),W.label=P.group,A.set(P.group,W),f.append(W)),W.append(C)}}f.value=I.some(P=>P.id===b)?b:"",f.disabled=I.length===0,p.disabled=f.value.length===0,v.textContent=`${I.length} of ${t.length} views`};return u.addEventListener("input",_,{signal:i.signal}),f.addEventListener("change",()=>{b=f.value,p.disabled=!1,n.apply(b)},{signal:i.signal}),p.addEventListener("click",()=>n.apply(f.value),{signal:i.signal}),a.addEventListener("click",()=>{l.hidden=!l.hidden,a.textContent=l.hidden?"Expand":"Collapse",a.setAttribute("aria-expanded",String(!l.hidden))},{signal:i.signal}),_(),document.body.append(r),()=>{i.abort(),r.remove()}},jr=new dt(16777215),ix=n=>{var t;const e=n.map??null;return JSON.stringify([n.type,e===null?null:[e.source.uuid,e.repeat.toArray(),e.offset.toArray(),e.rotation,e.wrapS,e.wrapT,e.colorSpace,e.minFilter,e.magFilter],n.transparent,n.opacity,n.side,n.depthWrite,n.alphaTest,n.roughness,n.metalness,(t=n.emissive)==null?void 0:t.getHex(),n.emissiveIntensity])},ql=(n,e,t)=>{const i=new _n;i.setAttribute("position",n.getAttribute("position").clone()),n.hasAttribute("normal")&&i.setAttribute("normal",n.getAttribute("normal").clone()),n.hasAttribute("uv")&&i.setAttribute("uv",n.getAttribute("uv").clone()),n.index!==null&&i.setIndex(n.index.clone()),i.applyMatrix4(e),i.hasAttribute("normal")||i.computeVertexNormals();const r=i.getAttribute("position").count,s=new Float32Array(r*3);for(let o=0;o<r;++o)t.toArray(s,o*3);return i.setAttribute("color",new fn(s,3)),i},rx=n=>{const e=n.some(i=>i.hasAttribute("uv")),t=n.every(i=>i.index!==null);for(const[i,r]of n.entries())e&&!r.hasAttribute("uv")&&r.setAttribute("uv",new fn(new Float32Array(r.getAttribute("position").count*2),2)),!t&&r.index!==null&&(n[i]=r.toNonIndexed())},Xc=n=>n.isMesh===!0,sx=n=>n.isInstancedMesh===!0,ox=n=>Array.isArray(n)?n.length===1?n[0]:null:n,ax=n=>{var a;n.updateMatrixWorld(!0);const e=n.matrixWorld.clone().invert(),t=new Map,i=[],r=new yt,s=new dt,o=(l,c)=>{const u=ix(l);let h=t.get(u);h===void 0&&(h={material:l,geometries:[]},t.set(u,h)),h.geometries.push(c)};if(n.traverse(l=>{if(!Xc(l)||l===n)return;const c=ox(l.material);if(c===null)return;const u=l.geometry;if(u.morphAttributes.position!==void 0||Object.keys(u.morphAttributes).length!==0||l.isSkinnedMesh===!0)return;const h=e.clone().multiply(l.matrixWorld);if(sx(l))for(let f=0;f<l.count;++f)l.getMatrixAt(f,r),l.instanceColor!==null?l.getColorAt(f,s):s.copy(jr),o(c,ql(u,h.clone().multiply(r),s.clone().multiply(c.color??jr)));else o(c,ql(u,h,c.color??jr));i.push(l)}),i.length!==0){for(const l of i)l.removeFromParent();for(const[l,c]of t){rx(c.geometries);const u=Bc(c.geometries,!1);if(u===null)throw new Error(`Manor entry "${n.name}" could not merge ${l}.`);const h=c.material.clone();(a=h.color)==null||a.copy(jr),h.vertexColors=!0;const f=new on(u,h);f.name=`${n.name}:baked`,f.castShadow=!0,f.receiveShadow=!0,n.add(f)}}},lx=n=>{const e=()=>{let i=0;for(const r of n.values())r.traverse(s=>{Xc(s)&&(i+=1)});return i},t=e();for(const i of n.values())ax(i);return{before:t,after:e()}},qc="view",cx=[{id:"01-whole-south-east",label:"Whole manor"},{id:"reference-exterior",label:"Exterior"},{id:"reference-courtyard",label:"Courtyard"},{id:"garden-south",label:"Garden"},{id:"hall--corner-b",label:"Great hall"},{id:"kitchen--corner-b",label:"Kitchen"},{id:"entrance--corner-a",label:"Entrance"},{id:"master--corner-a",label:"Master chamber"},{id:"stair-turn",label:"Stair"},{id:"corridor-west-to-east",label:"Upper corridor"},{id:"ground-plan",label:"Ground plan"},{id:"upper-plan",label:"Upper plan"},{id:"frame-axonometric",label:"Timber frame"},{id:"roof-overhead",label:"Roof"}],On=n=>{const e=document.querySelector(n);if(e===null)throw new Error(`The manor page is missing its ${n} element.`);return e},kt=On("#view"),ux=On("#status"),Yo=On("#loading"),Yc=On("#phase"),fx=On("#featured"),da=On("#panel"),hx=On("#scene"),$o=On("#panel-toggle"),$c=n=>{da.classList.toggle("collapsed",n),$o.textContent=n?"Show":"Hide",$o.setAttribute("aria-expanded",String(!n))};$c(window.matchMedia("(max-width: 720px)").matches);$o.addEventListener("click",()=>$c(!da.classList.contains("collapsed")));const dx=n=>{Yo.hidden=!1,Yo.classList.add("failed"),Yc.textContent=`The manor could not be built.
`+(n instanceof Error?n.message:String(n))},px=()=>new Promise(n=>{requestAnimationFrame(()=>setTimeout(n,0))}),mx=()=>new URLSearchParams(window.location.search).get(qc),gx=n=>{const e=new URL(window.location.href);e.searchParams.set(qc,n),window.history.replaceState(null,"",e)},xx=(n,e)=>{const t=new Map(n.views.map((o,a)=>[o.id,a])),i=new Map;for(const o of cx){if(!t.has(o.id))continue;const a=document.createElement("button");a.type="button",a.textContent=o.label,a.addEventListener("click",()=>e(o.id)),i.set(o.id,a),fx.append(a)}const r=new Map(n.manifest.rooms.map(o=>[o.id,o.label])),s=nx({items:n.views.map(o=>({id:o.id,label:o.id,group:r.get(o.room??"")??o.object??"Views",keywords:[o.room??"",o.object??""]})),apply:e});return da.insertBefore(On("#preview-navigation"),On("#keys")),{removeNavigation:s,highlight:o=>{for(const[a,l]of i)l.setAttribute("aria-current",String(a===o))}}},_x=async()=>{const n=async k=>{Yc.textContent=k,await px()},e=await ex({report:n});await n("Merging draw batches");const t=lx(e.objects),{scene:i,camera:r}=e,s=new Map(e.views.map((k,Y)=>[k.id,Y])),o=k=>{const Y=s.get(k);if(Y===void 0)throw new Error(`Unknown manor view: ${k}`);e.applyView(Y),e.target.copy(e.inspection.target.position),gx(k),a.highlight(k)},a=xx(e,o),l=mx();o(l!==null&&s.has(l)?l:e.views[0].id);const c=new AbortController,u=new Set,h=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","Space","KeyC","ShiftLeft","ShiftRight"]),f=k=>k instanceof Element&&k.closest("input, textarea, select, button, [contenteditable]")!==null,p=xi.degToRad(89),v=new Kn(0,0,0,"YXZ"),b=new fe,_=new fe,m=new fe(0,1,0),I=new fe;r.lookAt(e.target);let ne=Math.max(e.target.distanceTo(r.position),.001);const A=e.target.clone(),P=r.position.clone(),C=r.quaternion.clone(),W=()=>{P.copy(r.position),C.copy(r.quaternion),A.copy(e.target)},S=()=>{const k=!e.target.equals(A);!k&&r.position.equals(P)&&r.quaternion.equals(C)||(u.clear(),k&&r.lookAt(e.target),ne=Math.max(e.target.distanceTo(r.position),.001),W())},N=()=>{e.target.copy(r.position).addScaledVector(r.getWorldDirection(b),ne),W()},J=(k,Y)=>{S(),v.setFromQuaternion(r.quaternion,"YXZ"),v.y-=k*.0025,v.x=xi.clamp(v.x-Y*.0025,-p,p),v.z=0,r.up.copy(m),r.quaternion.setFromEuler(v),N()},se=(k,Y)=>Number(k.some($=>u.has($)))-Number(Y.some($=>u.has($)));let _e=0,me=4,w=0,G=0,g=!1,z="";const re=[],K=Ig(kt,i,r,k=>{const Y=Math.max(k-_e,0),$=Math.min(Y,.1);_e=k,re.push(Y)>15&&re.shift(),(kt.clientWidth!==w||kt.clientHeight!==G)&&(w=kt.clientWidth,G=kt.clientHeight,K.renderer.setSize(Math.max(w,1),Math.max(G,1),!1),r.aspect=Math.max(w,1)/Math.max(G,1),r.updateProjectionMatrix()),S();const D=document.pointerLockElement===kt,O=u.has("ShiftLeft")||u.has("ShiftRight"),j=me*(O?4:1);return D&&(r.getWorldDirection(b),_.set(1,0,0).applyQuaternion(r.quaternion),I.set(0,0,0).addScaledVector(b,se(["KeyW","ArrowUp"],["KeyS","ArrowDown"])).addScaledVector(_,se(["KeyD","ArrowRight"],["KeyA","ArrowLeft"])).addScaledVector(m,se(["Space"],["KeyC"])),I.lengthSq()!==0&&r.position.addScaledVector(I.normalize(),j*$)),N(),e.followLighting(),v.setFromQuaternion(r.quaternion,"YXZ"),ux.textContent=`x=${r.position.x.toFixed(2)} y=${r.position.y.toFixed(2)} z=${r.position.z.toFixed(2)} · yaw=${xi.radToDeg(v.y).toFixed(1)}° pitch=${xi.radToDeg(v.x).toFixed(1)}° · fov=${r.fov.toFixed(1)}° · speed=${tx(j,re,.1)}
`+(D?"Mouse look · Esc releases":z||"Click the view to fly"),!1},{pixelRatio:Math.min(window.devicePixelRatio,1.5)});K.renderer.setClearColor(1841688,1),e.configureRenderer(K.renderer);const R=new Intl.NumberFormat("en-US");hx.textContent=`${R.format(e.instanceState.prototypes)} shared prototypes placed ${R.format(e.instanceState.drawnInstances)} times · ${R.format(t.before)} authored meshes drawn as ${R.format(t.after)} · ${R.format(e.views.length)} authored views`,Yo.hidden=!0,kt.focus();const T=()=>{u.clear(),c.abort(),a.removeNavigation(),document.pointerLockElement===kt&&document.exitPointerLock(),K.stop(),e.disposeTextures()};window.addEventListener("pagehide",T,{once:!0}),window.addEventListener("keydown",k=>{if(k.code==="Escape"){u.clear(),document.pointerLockElement===kt&&document.exitPointerLock();return}if(k.defaultPrevented||document.pointerLockElement!==kt||f(k.target)){u.clear();return}k.code==="KeyQ"||k.code==="KeyE"?(k.repeat||(me=xi.clamp(k.code==="KeyQ"?me/1.5:me*1.5,.1,100)),k.preventDefault()):h.has(k.code)&&(u.add(k.code),k.preventDefault())},{signal:c.signal}),window.addEventListener("keyup",k=>u.delete(k.code),{signal:c.signal}),window.addEventListener("focusin",k=>{u.clear(),f(k.target)&&document.pointerLockElement===kt&&document.exitPointerLock()},{signal:c.signal}),window.addEventListener("blur",()=>{u.clear(),document.pointerLockElement===kt&&document.exitPointerLock()},{signal:c.signal}),document.addEventListener("pointerlockchange",()=>{u.clear(),z=""},{signal:c.signal});const F=k=>{g=!1,z="Mouse look was not acquired. Click to retry. "+(k instanceof Error?k.message:String(k))};kt.addEventListener("click",k=>{if(k.pointerType!=="touch"&&!(g||document.pointerLockElement===kt)){kt.focus(),g=!0;try{Promise.resolve(kt.requestPointerLock()).then(()=>{g=!1}).catch(F)}catch(Y){F(Y)}}},{signal:c.signal}),document.addEventListener("pointerlockerror",()=>F("The browser refused pointer lock."),{signal:c.signal}),window.addEventListener("mousemove",k=>{document.pointerLockElement===kt&&J(k.movementX,k.movementY)},{signal:c.signal});let Q=null;kt.addEventListener("pointerdown",k=>{k.pointerType!=="touch"||Q!==null||(Q={id:k.pointerId,x:k.clientX,y:k.clientY})},{signal:c.signal}),kt.addEventListener("pointermove",k=>{Q===null||k.pointerId!==Q.id||(J((k.clientX-Q.x)*2,(k.clientY-Q.y)*2),Q={id:Q.id,x:k.clientX,y:k.clientY})},{signal:c.signal});for(const k of["pointerup","pointercancel"])kt.addEventListener(k,Y=>{Q!==null&&Y.pointerId===Q.id&&(Q=null)},{signal:c.signal});kt.addEventListener("wheel",k=>{k.preventDefault(),r.fov=xi.clamp(r.fov*Math.exp(k.deltaY*.001),5,110),r.updateProjectionMatrix()},{passive:!1,signal:c.signal})};_x().catch(dx);
