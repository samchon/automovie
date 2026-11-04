var nh=Object.defineProperty;var ih=(i,t,e)=>t in i?nh(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var qe=(i,t,e)=>ih(i,typeof t!="symbol"?t+"":t,e);import{r as ma}from"./runWebsiteCleanup-B-abgGEC.js";/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _c="186",rh=0,Yc=1,sh=2,Hs=1,ah=2,zr=3,Pi=0,$e=1,Wn=2,qn=0,Hr=1,Kc=2,Zc=3,Jc=4,oh=5,or=100,ch=101,lh=102,uh=103,fh=104,hh=200,dh=201,ph=202,mh=203,af=204,of=205,gh=206,_h=207,vh=208,xh=209,Sh=210,Mh=211,yh=212,Eh=213,bh=214,go=0,_o=1,vo=2,$r=3,xo=4,So=5,Mo=6,yo=7,cf=0,wh=1,Th=2,Cn=0,lf=1,uf=2,ff=3,hf=4,df=5,pf=6,mf=7,Qc="attached",Ah="detached",gf=300,Ii=301,_r=302,ga=303,_a=304,ca=306,Eo=1e3,$n=1001,bo=1002,Pe=1003,Rh=1004,os=1005,Fe=1006,va=1007,wi=1008,Je=1009,_f=1010,vf=1011,qr=1012,vc=1013,Pn=1014,ln=1015,In=1016,xc=1017,Sc=1018,Yr=1020,xf=35902,Sf=35899,Mf=1021,yf=1022,un=1023,Zn=1026,Ti=1027,Mc=1028,yc=1029,Li=1030,Ec=1031,bc=1033,Vs=33776,Ws=33777,Xs=33778,$s=33779,wo=35840,To=35841,Ao=35842,Ro=35843,Co=36196,Po=37492,Io=37496,Lo=37488,Do=37489,Zs=37490,No=37491,Uo=37808,Fo=37809,Oo=37810,Bo=37811,zo=37812,ko=37813,Go=37814,Ho=37815,Vo=37816,Wo=37817,Xo=37818,$o=37819,qo=37820,Yo=37821,Ko=36492,Zo=36494,Jo=36495,Qo=36283,jo=36284,Js=36285,tc=36286,Ch=3200,Kv=3201,ec=0,Ph=1,pi="",an="srgb",Qs="srgb-linear",js="linear",re="srgb",xa=7680,Ih=519,Lh=512,Dh=513,Nh=514,wc=515,Uh=516,Fh=517,Tc=518,Oh=519,Bh=35044,jc="300 es",Rn=2e3,Kr=2001;function zh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Zr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function kh(){const i=Zr("canvas");return i.style.display="block",i}const tl={};function ta(...i){const t="THREE."+i.shift();console.log(t,...i)}function Ef(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Lt(...i){i=Ef(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function jt(...i){i=Ef(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function fr(...i){const t=i.join(" ");t in tl||(tl[t]=!0,Lt(...i))}function Gh(i,t,e){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const Hh={[go]:_o,[vo]:Mo,[xo]:yo,[$r]:So,[_o]:go,[Mo]:vo,[yo]:xo,[So]:$r};class Di{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const r=n[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,t);t.target=null}}}const De=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let el=1234567;const Vr=Math.PI/180,vr=180/Math.PI;function Ni(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(De[i&255]+De[i>>8&255]+De[i>>16&255]+De[i>>24&255]+"-"+De[t&255]+De[t>>8&255]+"-"+De[t>>16&15|64]+De[t>>24&255]+"-"+De[e&63|128]+De[e>>8&255]+"-"+De[e>>16&255]+De[e>>24&255]+De[n&255]+De[n>>8&255]+De[n>>16&255]+De[n>>24&255]).toLowerCase()}function Ht(i,t,e){return Math.max(t,Math.min(e,i))}function Ac(i,t){return(i%t+t)%t}function Vh(i,t,e,n,r){return n+(i-t)*(r-n)/(e-t)}function Wh(i,t,e){return i!==t?(e-i)/(t-i):0}function Wr(i,t,e){return(1-e)*i+e*t}function Xh(i,t,e,n){return Wr(i,t,1-Math.exp(-e*n))}function $h(i,t=1){return t-Math.abs(Ac(i,t*2)-t)}function qh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Yh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Kh(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Zh(i,t){return i+Math.random()*(t-i)}function Jh(i){return i*(.5-Math.random())}function Qh(i){i!==void 0&&(el=i);let t=el+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function jh(i){return i*Vr}function td(i){return i*vr}function ed(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function nd(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function id(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function rd(i,t,e,n,r){const s=Math.cos,a=Math.sin,o=s(e/2),c=a(e/2),l=s((t+n)/2),h=a((t+n)/2),p=s((t-n)/2),f=a((t-n)/2),u=s((n-t)/2),d=a((n-t)/2);switch(r){case"XYX":i.set(o*h,c*p,c*f,o*l);break;case"YZY":i.set(c*f,o*h,c*p,o*l);break;case"ZXZ":i.set(c*p,c*f,o*h,o*l);break;case"XZX":i.set(o*h,c*d,c*u,o*l);break;case"YXY":i.set(c*u,o*h,c*d,o*l);break;case"ZYZ":i.set(c*d,c*u,o*h,o*l);break;default:Lt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function _n(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function se(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const qs={DEG2RAD:Vr,RAD2DEG:vr,generateUUID:Ni,clamp:Ht,euclideanModulo:Ac,mapLinear:Vh,inverseLerp:Wh,lerp:Wr,damp:Xh,pingpong:$h,smoothstep:qh,smootherstep:Yh,randInt:Kh,randFloat:Zh,randFloatSpread:Jh,seededRandom:Qh,degToRad:jh,radToDeg:td,isPowerOfTwo:ed,ceilPowerOfTwo:nd,floorPowerOfTwo:id,setQuaternionFromProperEuler:rd,normalize:se,denormalize:_n},Nc=class Nc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6],this.y=r[1]*e+r[4]*n+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Ht(this.x,t.x,e.x),this.y=Ht(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Ht(this.x,t,e),this.y=Ht(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ht(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),r=Math.sin(e),s=this.x-t.x,a=this.y-t.y;return this.x=s*n-a*r+t.x,this.y=s*r+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Nc.prototype.isVector2=!0;let $t=Nc,Ui=class{constructor(t=0,e=0,n=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=r}static slerpFlat(t,e,n,r,s,a,o){let c=n[r+0],l=n[r+1],h=n[r+2],p=n[r+3],f=s[a+0],u=s[a+1],d=s[a+2],_=s[a+3];if(p!==_||c!==f||l!==u||h!==d){let g=c*f+l*u+h*d+p*_;g<0&&(f=-f,u=-u,d=-d,_=-_,g=-g);let m=1-o;if(g<.9995){const x=Math.acos(g),y=Math.sin(x);m=Math.sin(m*x)/y,o=Math.sin(o*x)/y,c=c*m+f*o,l=l*m+u*o,h=h*m+d*o,p=p*m+_*o}else{c=c*m+f*o,l=l*m+u*o,h=h*m+d*o,p=p*m+_*o;const x=1/Math.sqrt(c*c+l*l+h*h+p*p);c*=x,l*=x,h*=x,p*=x}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=p}static multiplyQuaternionsFlat(t,e,n,r,s,a){const o=n[r],c=n[r+1],l=n[r+2],h=n[r+3],p=s[a],f=s[a+1],u=s[a+2],d=s[a+3];return t[e]=o*d+h*p+c*u-l*f,t[e+1]=c*d+h*f+l*p-o*u,t[e+2]=l*d+h*u+o*f-c*p,t[e+3]=h*d-o*p-c*f-l*u,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,r){return this._x=t,this._y=e,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,r=t._y,s=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(r/2),p=o(s/2),f=c(n/2),u=c(r/2),d=c(s/2);switch(a){case"XYZ":this._x=f*h*p+l*u*d,this._y=l*u*p-f*h*d,this._z=l*h*d+f*u*p,this._w=l*h*p-f*u*d;break;case"YXZ":this._x=f*h*p+l*u*d,this._y=l*u*p-f*h*d,this._z=l*h*d-f*u*p,this._w=l*h*p+f*u*d;break;case"ZXY":this._x=f*h*p-l*u*d,this._y=l*u*p+f*h*d,this._z=l*h*d+f*u*p,this._w=l*h*p-f*u*d;break;case"ZYX":this._x=f*h*p-l*u*d,this._y=l*u*p+f*h*d,this._z=l*h*d-f*u*p,this._w=l*h*p+f*u*d;break;case"YZX":this._x=f*h*p+l*u*d,this._y=l*u*p+f*h*d,this._z=l*h*d-f*u*p,this._w=l*h*p-f*u*d;break;case"XZY":this._x=f*h*p-l*u*d,this._y=l*u*p-f*h*d,this._z=l*h*d+f*u*p,this._w=l*h*p+f*u*d;break;default:Lt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,r=Math.sin(n);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],r=e[4],s=e[8],a=e[1],o=e[5],c=e[9],l=e[2],h=e[6],p=e[10],f=n+o+p;if(f>0){const u=.5/Math.sqrt(f+1);this._w=.25/u,this._x=(h-c)*u,this._y=(s-l)*u,this._z=(a-r)*u}else if(n>o&&n>p){const u=2*Math.sqrt(1+n-o-p);this._w=(h-c)/u,this._x=.25*u,this._y=(r+a)/u,this._z=(s+l)/u}else if(o>p){const u=2*Math.sqrt(1+o-n-p);this._w=(s-l)/u,this._x=(r+a)/u,this._y=.25*u,this._z=(c+h)/u}else{const u=2*Math.sqrt(1+p-n-o);this._w=(a-r)/u,this._x=(s+l)/u,this._y=(c+h)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ht(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const r=Math.min(1,e/n);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,r=t._y,s=t._z,a=t._w,o=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+a*o+r*l-s*c,this._y=r*h+a*c+s*o-n*l,this._z=s*h+a*l+n*c-r*o,this._w=a*h-n*o-r*c-s*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,r=t._y,s=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let c=1-e;if(o<.9995){const l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,e=Math.sin(e*l)/h,this._x=this._x*c+n*e,this._y=this._y*c+r*e,this._z=this._z*c+s*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+r*e,this._z=this._z*c+s*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var gr;let K=(gr=class{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(nl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(nl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*r,this.y=s[1]*e+s[4]*n+s[7]*r,this.z=s[2]*e+s[5]*n+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=t.elements,a=1/(s[3]*e+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*e+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*e+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,r=this.z,s=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*r-o*n),h=2*(o*e-s*r),p=2*(s*n-a*e);return this.x=e+c*l+a*p-o*h,this.y=n+c*h+o*l-s*p,this.z=r+c*p+s*h-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*r,this.y=s[1]*e+s[5]*n+s[9]*r,this.z=s[2]*e+s[6]*n+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Ht(this.x,t.x,e.x),this.y=Ht(this.y,t.y,e.y),this.z=Ht(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Ht(this.x,t,e),this.y=Ht(this.y,t,e),this.z=Ht(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,r=t.y,s=t.z,a=e.x,o=e.y,c=e.z;return this.x=r*c-s*o,this.y=s*a-n*c,this.z=n*o-r*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Sa.copy(this).projectOnVector(t),this.sub(Sa)}reflect(t){return this.sub(Sa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ht(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,r=this.z-t.z;return e*e+n*n+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const r=Math.sin(e)*t;return this.x=r*Math.sin(n),this.y=Math.cos(e)*t,this.z=r*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},gr.prototype.isVector3=!0,gr);const Sa=new K,nl=new Ui,Uc=class Uc{constructor(t,e,n,r,s,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,c,l)}set(t,e,n,r,s,a,o,c,l){const h=this.elements;return h[0]=t,h[1]=r,h[2]=o,h[3]=e,h[4]=s,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],p=n[7],f=n[2],u=n[5],d=n[8],_=r[0],g=r[3],m=r[6],x=r[1],y=r[4],v=r[7],E=r[2],S=r[5],b=r[8];return s[0]=a*_+o*x+c*E,s[3]=a*g+o*y+c*S,s[6]=a*m+o*v+c*b,s[1]=l*_+h*x+p*E,s[4]=l*g+h*y+p*S,s[7]=l*m+h*v+p*b,s[2]=f*_+u*x+d*E,s[5]=f*g+u*y+d*S,s[8]=f*m+u*v+d*b,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8];return e*a*h-e*o*l-n*s*h+n*o*c+r*s*l-r*a*c}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],p=h*a-o*l,f=o*c-h*s,u=l*s-a*c,d=e*p+n*f+r*u;if(d===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/d;return t[0]=p*_,t[1]=(r*l-h*n)*_,t[2]=(o*n-r*a)*_,t[3]=f*_,t[4]=(h*e-r*c)*_,t[5]=(r*s-o*e)*_,t[6]=u*_,t[7]=(n*c-l*e)*_,t[8]=(a*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,r,s,a,o){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-r*l,r*c,-r*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return fr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ma.makeScale(t,e)),this}rotate(t){return fr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ma.makeRotation(-t)),this}translate(t,e){return fr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ma.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<9;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Uc.prototype.isMatrix3=!0;let Ut=Uc;const Ma=new Ut,il=new Ut().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),rl=new Ut().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function sd(){const i={enabled:!0,workingColorSpace:Qs,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===re&&(r.r=Yn(r.r),r.g=Yn(r.g),r.b=Yn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===re&&(r.r=hr(r.r),r.g=hr(r.g),r.b=hr(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===pi?js:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return fr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return fr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Qs]:{primaries:t,whitePoint:n,transfer:js,toXYZ:il,fromXYZ:rl,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:an},outputColorSpaceConfig:{drawingBufferColorSpace:an}},[an]:{primaries:t,whitePoint:n,transfer:re,toXYZ:il,fromXYZ:rl,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:an}}}),i}const qt=sd();function Yn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function hr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Bi;class ad{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Bi===void 0&&(Bi=Zr("canvas")),Bi.width=t.width,Bi.height=t.height;const r=Bi.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),n=Bi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Zr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const r=n.getImageData(0,0,t.width,t.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Yn(s[a]/255)*255;return n.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Yn(e[n]/255)*255):e[n]=Yn(e[n]);return{data:e,width:t.width,height:t.height}}else return Lt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let od=0;class Rc{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:od++}),this.uuid=Ni(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(ya(r[a].image)):s.push(ya(r[a]))}else s=ya(r);n.url=s}return e||(t.images[this.uuid]=n),n}}function ya(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ad.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Lt("Texture: Unable to serialize Texture."),{})}let cd=0;const Ea=new K;class Oe extends Di{constructor(t=Oe.DEFAULT_IMAGE,e=Oe.DEFAULT_MAPPING,n=$n,r=$n,s=Fe,a=wi,o=un,c=Je,l=Oe.DEFAULT_ANISOTROPY,h=pi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:cd++}),this.uuid=Ni(),this.name="",this.source=new Rc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new $t(0,0),this.repeat=new $t(1,1),this.center=new $t(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ut,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ea).x}get height(){return this.source.getSize(Ea).y}get depth(){return this.source.getSize(Ea).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Lt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){Lt(`Texture.setValues(): property '${e}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==gf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Eo:t.x=t.x-Math.floor(t.x);break;case $n:t.x=t.x<0?0:1;break;case bo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Eo:t.y=t.y-Math.floor(t.y);break;case $n:t.y=t.y<0?0:1;break;case bo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Oe.DEFAULT_IMAGE=null;Oe.DEFAULT_MAPPING=gf;Oe.DEFAULT_ANISOTROPY=1;const Fc=class Fc{constructor(t=0,e=0,n=0,r=1){this.x=t,this.y=e,this.z=n,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,r){return this.x=t,this.y=e,this.z=n,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*e+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*e+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*e+a[7]*n+a[11]*r+a[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,r,s;const c=t.elements,l=c[0],h=c[4],p=c[8],f=c[1],u=c[5],d=c[9],_=c[2],g=c[6],m=c[10];if(Math.abs(h-f)<.01&&Math.abs(p-_)<.01&&Math.abs(d-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(p+_)<.1&&Math.abs(d+g)<.1&&Math.abs(l+u+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const y=(l+1)/2,v=(u+1)/2,E=(m+1)/2,S=(h+f)/4,b=(p+_)/4,M=(d+g)/4;return y>v&&y>E?y<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(y),r=S/n,s=b/n):v>E?v<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),n=S/r,s=M/r):E<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(E),n=b/s,r=M/s),this.set(n,r,s,e),this}let x=Math.sqrt((g-d)*(g-d)+(p-_)*(p-_)+(f-h)*(f-h));return Math.abs(x)<.001&&(x=1),this.x=(g-d)/x,this.y=(p-_)/x,this.z=(f-h)/x,this.w=Math.acos((l+u+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Ht(this.x,t.x,e.x),this.y=Ht(this.y,t.y,e.y),this.z=Ht(this.z,t.z,e.z),this.w=Ht(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Ht(this.x,t,e),this.y=Ht(this.y,t,e),this.z=Ht(this.z,t,e),this.w=Ht(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ht(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Fc.prototype.isVector4=!0;let Yt=Fc;class ld extends Di{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Fe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Yt(0,0,t,e),this.scissorTest=!1,this.viewport=new Yt(0,0,t,e),this.textures=[];const r={width:t,height:e,depth:n.depth},s=new Oe(r),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Fe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const r=Object.assign({},t.textures[e].image);this.textures[e].source=new Rc(r)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class xn extends ld{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class bf extends Oe{constructor(t=null,e=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=$n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class ud extends Oe{constructor(t=null,e=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=$n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}var Ci;let Kt=(Ci=class{constructor(t,e,n,r,s,a,o,c,l,h,p,f,u,d,_,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,c,l,h,p,f,u,d,_,g)}set(t,e,n,r,s,a,o,c,l,h,p,f,u,d,_,g){const m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=r,m[1]=s,m[5]=a,m[9]=o,m[13]=c,m[2]=l,m[6]=h,m[10]=p,m[14]=f,m[3]=u,m[7]=d,m[11]=_,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ci().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,r=1/zi.setFromMatrixColumn(t,0).length(),s=1/zi.setFromMatrixColumn(t,1).length(),a=1/zi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*r,e[1]=n[1]*r,e[2]=n[2]*r,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,r=t.y,s=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(r),l=Math.sin(r),h=Math.cos(s),p=Math.sin(s);if(t.order==="XYZ"){const f=a*h,u=a*p,d=o*h,_=o*p;e[0]=c*h,e[4]=-c*p,e[8]=l,e[1]=u+d*l,e[5]=f-_*l,e[9]=-o*c,e[2]=_-f*l,e[6]=d+u*l,e[10]=a*c}else if(t.order==="YXZ"){const f=c*h,u=c*p,d=l*h,_=l*p;e[0]=f+_*o,e[4]=d*o-u,e[8]=a*l,e[1]=a*p,e[5]=a*h,e[9]=-o,e[2]=u*o-d,e[6]=_+f*o,e[10]=a*c}else if(t.order==="ZXY"){const f=c*h,u=c*p,d=l*h,_=l*p;e[0]=f-_*o,e[4]=-a*p,e[8]=d+u*o,e[1]=u+d*o,e[5]=a*h,e[9]=_-f*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const f=a*h,u=a*p,d=o*h,_=o*p;e[0]=c*h,e[4]=d*l-u,e[8]=f*l+_,e[1]=c*p,e[5]=_*l+f,e[9]=u*l-d,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const f=a*c,u=a*l,d=o*c,_=o*l;e[0]=c*h,e[4]=_-f*p,e[8]=d*p+u,e[1]=p,e[5]=a*h,e[9]=-o*h,e[2]=-l*h,e[6]=u*p+d,e[10]=f-_*p}else if(t.order==="XZY"){const f=a*c,u=a*l,d=o*c,_=o*l;e[0]=c*h,e[4]=-p,e[8]=l*h,e[1]=f*p+_,e[5]=a*h,e[9]=u*p-d,e[2]=d*p-u,e[6]=o*h,e[10]=_*p+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(fd,t,hd)}lookAt(t,e,n){const r=this.elements;return Ye.subVectors(t,e),Ye.lengthSq()===0&&(Ye.z=1),Ye.normalize(),ii.crossVectors(n,Ye),ii.lengthSq()===0&&(Math.abs(n.z)===1?Ye.x+=1e-4:Ye.z+=1e-4,Ye.normalize(),ii.crossVectors(n,Ye)),ii.normalize(),cs.crossVectors(Ye,ii),r[0]=ii.x,r[4]=cs.x,r[8]=Ye.x,r[1]=ii.y,r[5]=cs.y,r[9]=Ye.y,r[2]=ii.z,r[6]=cs.z,r[10]=Ye.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],p=n[5],f=n[9],u=n[13],d=n[2],_=n[6],g=n[10],m=n[14],x=n[3],y=n[7],v=n[11],E=n[15],S=r[0],b=r[4],M=r[8],w=r[12],A=r[1],T=r[5],L=r[9],N=r[13],P=r[2],C=r[6],U=r[10],F=r[14],z=r[3],D=r[7],O=r[11],k=r[15];return s[0]=a*S+o*A+c*P+l*z,s[4]=a*b+o*T+c*C+l*D,s[8]=a*M+o*L+c*U+l*O,s[12]=a*w+o*N+c*F+l*k,s[1]=h*S+p*A+f*P+u*z,s[5]=h*b+p*T+f*C+u*D,s[9]=h*M+p*L+f*U+u*O,s[13]=h*w+p*N+f*F+u*k,s[2]=d*S+_*A+g*P+m*z,s[6]=d*b+_*T+g*C+m*D,s[10]=d*M+_*L+g*U+m*O,s[14]=d*w+_*N+g*F+m*k,s[3]=x*S+y*A+v*P+E*z,s[7]=x*b+y*T+v*C+E*D,s[11]=x*M+y*L+v*U+E*O,s[15]=x*w+y*N+v*F+E*k,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[12],a=t[1],o=t[5],c=t[9],l=t[13],h=t[2],p=t[6],f=t[10],u=t[14],d=t[3],_=t[7],g=t[11],m=t[15],x=c*u-l*f,y=o*u-l*p,v=o*f-c*p,E=a*u-l*h,S=a*f-c*h,b=a*p-o*h;return e*(_*x-g*y+m*v)-n*(d*x-g*E+m*S)+r*(d*y-_*E+m*b)-s*(d*v-_*S+g*b)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[1],a=t[5],o=t[9],c=t[2],l=t[6],h=t[10];return e*(a*h-o*l)-n*(s*h-o*c)+r*(s*l-a*c)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],p=t[9],f=t[10],u=t[11],d=t[12],_=t[13],g=t[14],m=t[15],x=e*o-n*a,y=e*c-r*a,v=e*l-s*a,E=n*c-r*o,S=n*l-s*o,b=r*l-s*c,M=h*_-p*d,w=h*g-f*d,A=h*m-u*d,T=p*g-f*_,L=p*m-u*_,N=f*m-u*g,P=x*N-y*L+v*T+E*A-S*w+b*M;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/P;return t[0]=(o*N-c*L+l*T)*C,t[1]=(r*L-n*N-s*T)*C,t[2]=(_*b-g*S+m*E)*C,t[3]=(f*S-p*b-u*E)*C,t[4]=(c*A-a*N-l*w)*C,t[5]=(e*N-r*A+s*w)*C,t[6]=(g*v-d*b-m*y)*C,t[7]=(h*b-f*v+u*y)*C,t[8]=(a*L-o*A+l*M)*C,t[9]=(n*A-e*L-s*M)*C,t[10]=(d*S-_*v+m*x)*C,t[11]=(p*v-h*S-u*x)*C,t[12]=(o*w-a*T-c*M)*C,t[13]=(e*T-n*w+r*M)*C,t[14]=(_*y-d*E-g*x)*C,t[15]=(h*E-p*y+f*x)*C,this}scale(t){const e=this.elements,n=t.x,r=t.y,s=t.z;return e[0]*=n,e[4]*=r,e[8]*=s,e[1]*=n,e[5]*=r,e[9]*=s,e[2]*=n,e[6]*=r,e[10]*=s,e[3]*=n,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,r))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),r=Math.sin(e),s=1-n,a=t.x,o=t.y,c=t.z,l=s*a,h=s*o;return this.set(l*a+n,l*o-r*c,l*c+r*o,0,l*o+r*c,h*o+n,h*c-r*a,0,l*c-r*o,h*c+r*a,s*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,r,s,a){return this.set(1,n,s,0,t,1,a,0,e,r,1,0,0,0,0,1),this}compose(t,e,n){const r=this.elements,s=e._x,a=e._y,o=e._z,c=e._w,l=s+s,h=a+a,p=o+o,f=s*l,u=s*h,d=s*p,_=a*h,g=a*p,m=o*p,x=c*l,y=c*h,v=c*p,E=n.x,S=n.y,b=n.z;return r[0]=(1-(_+m))*E,r[1]=(u+v)*E,r[2]=(d-y)*E,r[3]=0,r[4]=(u-v)*S,r[5]=(1-(f+m))*S,r[6]=(g+x)*S,r[7]=0,r[8]=(d+y)*b,r[9]=(g-x)*b,r[10]=(1-(f+_))*b,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,n){const r=this.elements;t.x=r[12],t.y=r[13],t.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let a=zi.set(r[0],r[1],r[2]).length();const o=zi.set(r[4],r[5],r[6]).length(),c=zi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),dn.copy(this);const l=1/a,h=1/o,p=1/c;return dn.elements[0]*=l,dn.elements[1]*=l,dn.elements[2]*=l,dn.elements[4]*=h,dn.elements[5]*=h,dn.elements[6]*=h,dn.elements[8]*=p,dn.elements[9]*=p,dn.elements[10]*=p,e.setFromRotationMatrix(dn),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,r,s,a,o=Rn,c=!1){const l=this.elements,h=2*s/(e-t),p=2*s/(n-r),f=(e+t)/(e-t),u=(n+r)/(n-r);let d,_;if(c)d=s/(a-s),_=a*s/(a-s);else if(o===Rn)d=-(a+s)/(a-s),_=-2*a*s/(a-s);else if(o===Kr)d=-a/(a-s),_=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=p,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,r,s,a,o=Rn,c=!1){const l=this.elements,h=2/(e-t),p=2/(n-r),f=-(e+t)/(e-t),u=-(n+r)/(n-r);let d,_;if(c)d=1/(a-s),_=a/(a-s);else if(o===Rn)d=-2/(a-s),_=-(a+s)/(a-s);else if(o===Kr)d=-1/(a-s),_=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=f,l[1]=0,l[5]=p,l[9]=0,l[13]=u,l[2]=0,l[6]=0,l[10]=d,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<16;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Ci.prototype.isMatrix4=!0,Ci);const zi=new K,dn=new Kt,fd=new K(0,0,0),hd=new K(1,1,1),ii=new K,cs=new K,Ye=new K,sl=new Kt,al=new Ui;class Jn{constructor(t=0,e=0,n=0,r=Jn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,r=this._order){return this._x=t,this._y=e,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const r=t.elements,s=r[0],a=r[4],o=r[8],c=r[1],l=r[5],h=r[9],p=r[2],f=r[6],u=r[10];switch(e){case"XYZ":this._y=Math.asin(Ht(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,u),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ht(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,u),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ht(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-p,u),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Ht(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(f,u),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ht(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(o,u));break;case"XZY":this._z=Math.asin(-Ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,u),this._y=0);break;default:Lt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return sl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(sl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return al.setFromEuler(this),this.setFromQuaternion(al,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Jn.DEFAULT_ORDER="XYZ";class wf{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let dd=0;const ol=new K,ki=new Ui,Dn=new Kt,ls=new K,Er=new K,pd=new K,md=new Ui,cl=new K(1,0,0),ll=new K(0,1,0),ul=new K(0,0,1),fl={type:"added"},gd={type:"removed"},Gi={type:"childadded",child:null},ba={type:"childremoved",child:null};class xe extends Di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dd++}),this.uuid=Ni(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=xe.DEFAULT_UP.clone();const t=new K,e=new Jn,n=new Ui,r=new K(1,1,1);function s(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Kt},normalMatrix:{value:new Ut}}),this.matrix=new Kt,this.matrixWorld=new Kt,this.matrixAutoUpdate=xe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=xe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new wf,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.multiply(ki),this}rotateOnWorldAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.premultiply(ki),this}rotateX(t){return this.rotateOnAxis(cl,t)}rotateY(t){return this.rotateOnAxis(ll,t)}rotateZ(t){return this.rotateOnAxis(ul,t)}translateOnAxis(t,e){return ol.copy(t).applyQuaternion(this.quaternion),this.position.add(ol.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(cl,t)}translateY(t){return this.translateOnAxis(ll,t)}translateZ(t){return this.translateOnAxis(ul,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Dn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ls.copy(t):ls.set(t,e,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Er.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Dn.lookAt(Er,ls,this.up):Dn.lookAt(ls,Er,this.up),this.quaternion.setFromRotationMatrix(Dn),r&&(Dn.extractRotation(r.matrixWorld),ki.setFromRotationMatrix(Dn),this.quaternion.premultiply(ki.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(jt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(fl),Gi.child=t,this.dispatchEvent(Gi),Gi.child=null):jt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(gd),ba.child=t,this.dispatchEvent(ba),ba.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Dn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Dn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Dn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(fl),Gi.child=t,this.dispatchEvent(Gi),Gi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Er,t,pd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Er,md,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,r=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*r,s[13]+=n-s[1]*e-s[5]*n-s[9]*r,s[14]+=r-s[2]*e-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const r=this.parent;if(t===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(t),r.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const p=c[l];s(t.shapes,p)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(s(t.materials,this.material[c]));r.material=o}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(s(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),h=a(t.images),p=a(t.shapes),f=a(t.skeletons),u=a(t.animations),d=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),p.length>0&&(n.shapes=p),f.length>0&&(n.skeletons=f),u.length>0&&(n.animations=u),d.length>0&&(n.nodes=d)}return n.object=r,n;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const r=t.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}xe.DEFAULT_UP=new K(0,1,0);xe.DEFAULT_MATRIX_AUTO_UPDATE=!0;xe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class us extends xe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const _d={type:"move"};class wa{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new us,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new us,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new us,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let r=null,s=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(const _ of t.hand.values()){const g=e.getJointPose(_,n),m=this._getHandJoint(l,_);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}const h=l.joints["index-finger-tip"],p=l.joints["thumb-tip"],f=h.position.distanceTo(p.position),u=.02,d=.005;l.inputState.pinching&&f>u+d?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&f<=u-d&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(r=e.getPose(t.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(_d)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new us;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Tf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ri={h:0,s:0,l:0},fs={h:0,s:0,l:0};function Ta(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Wt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=an){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,qt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,r=qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,qt.colorSpaceToWorking(this,r),this}setHSL(t,e,n,r=qt.workingColorSpace){if(t=Ac(t,1),e=Ht(e,0,1),n=Ht(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,a=2*n-s;this.r=Ta(a,s,t+1/3),this.g=Ta(a,s,t),this.b=Ta(a,s,t-1/3)}return qt.colorSpaceToWorking(this,r),this}setStyle(t,e=an){function n(s){s!==void 0&&parseFloat(s)<1&&Lt("Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Lt("Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(s,16),e);Lt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=an){const n=Tf[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Lt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Yn(t.r),this.g=Yn(t.g),this.b=Yn(t.b),this}copyLinearToSRGB(t){return this.r=hr(t.r),this.g=hr(t.g),this.b=hr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=an){return qt.workingToColorSpace(Ne.copy(this),t),Math.round(Ht(Ne.r*255,0,255))*65536+Math.round(Ht(Ne.g*255,0,255))*256+Math.round(Ht(Ne.b*255,0,255))}getHexString(t=an){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=qt.workingColorSpace){qt.workingToColorSpace(Ne.copy(this),e);const n=Ne.r,r=Ne.g,s=Ne.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const p=a-o;switch(l=h<=.5?p/(a+o):p/(2-a-o),a){case n:c=(r-s)/p+(r<s?6:0);break;case r:c=(s-n)/p+2;break;case s:c=(n-r)/p+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=qt.workingColorSpace){return qt.workingToColorSpace(Ne.copy(this),e),t.r=Ne.r,t.g=Ne.g,t.b=Ne.b,t}getStyle(t=an){qt.workingToColorSpace(Ne.copy(this),t);const e=Ne.r,n=Ne.g,r=Ne.b;return t!==an?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(t,e,n){return this.getHSL(ri),this.setHSL(ri.h+t,ri.s+e,ri.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(ri),t.getHSL(fs);const n=Wr(ri.h,fs.h,e),r=Wr(ri.s,fs.s,e),s=Wr(ri.l,fs.l,e);return this.setHSL(n,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*r,this.g=s[1]*e+s[4]*n+s[7]*r,this.b=s[2]*e+s[5]*n+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ne=new Wt;Wt.NAMES=Tf;class Jv extends xe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Jn,this.environmentIntensity=1,this.environmentRotation=new Jn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const pn=new K,Nn=new K,Aa=new K,Un=new K,Hi=new K,Vi=new K,hl=new K,Ra=new K,Ca=new K,Pa=new K,Ia=new Yt,La=new Yt,Da=new Yt;class vn{constructor(t=new K,e=new K,n=new K){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,r){r.subVectors(n,e),pn.subVectors(t,e),r.cross(pn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,n,r,s){pn.subVectors(r,e),Nn.subVectors(n,e),Aa.subVectors(t,e);const a=pn.dot(pn),o=pn.dot(Nn),c=pn.dot(Aa),l=Nn.dot(Nn),h=Nn.dot(Aa),p=a*l-o*o;if(p===0)return s.set(0,0,0),null;const f=1/p,u=(l*c-o*h)*f,d=(a*h-o*c)*f;return s.set(1-u-d,d,u)}static containsPoint(t,e,n,r){return this.getBarycoord(t,e,n,r,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(t,e,n,r,s,a,o,c){return this.getBarycoord(t,e,n,r,Un)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Un.x),c.addScaledVector(a,Un.y),c.addScaledVector(o,Un.z),c)}static getInterpolatedAttribute(t,e,n,r,s,a){return Ia.setScalar(0),La.setScalar(0),Da.setScalar(0),Ia.fromBufferAttribute(t,e),La.fromBufferAttribute(t,n),Da.fromBufferAttribute(t,r),a.setScalar(0),a.addScaledVector(Ia,s.x),a.addScaledVector(La,s.y),a.addScaledVector(Da,s.z),a}static isFrontFacing(t,e,n,r){return pn.subVectors(n,e),Nn.subVectors(t,e),pn.cross(Nn).dot(r)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,r){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,n,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return pn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),pn.cross(Nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return vn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return vn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,r,s){return vn.getInterpolation(t,this.a,this.b,this.c,e,n,r,s)}containsPoint(t){return vn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return vn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,r=this.b,s=this.c;let a,o;Hi.subVectors(r,n),Vi.subVectors(s,n),Ra.subVectors(t,n);const c=Hi.dot(Ra),l=Vi.dot(Ra);if(c<=0&&l<=0)return e.copy(n);Ca.subVectors(t,r);const h=Hi.dot(Ca),p=Vi.dot(Ca);if(h>=0&&p<=h)return e.copy(r);const f=c*p-h*l;if(f<=0&&c>=0&&h<=0)return a=c/(c-h),e.copy(n).addScaledVector(Hi,a);Pa.subVectors(t,s);const u=Hi.dot(Pa),d=Vi.dot(Pa);if(d>=0&&u<=d)return e.copy(s);const _=u*l-c*d;if(_<=0&&l>=0&&d<=0)return o=l/(l-d),e.copy(n).addScaledVector(Vi,o);const g=h*d-u*p;if(g<=0&&p-h>=0&&u-d>=0)return hl.subVectors(s,r),o=(p-h)/(p-h+(u-d)),e.copy(r).addScaledVector(hl,o);const m=1/(g+_+f);return a=_*m,o=f*m,e.copy(n).addScaledVector(Hi,a).addScaledVector(Vi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Sn{constructor(t=new K(1/0,1/0,1/0),e=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(mn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(mn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=mn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,mn):mn.fromBufferAttribute(s,a),mn.applyMatrix4(t.matrixWorld),this.expandByPoint(mn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),hs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),hs.copy(n.boundingBox)),hs.applyMatrix4(t.matrixWorld),this.union(hs)}const r=t.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,mn),mn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(br),ds.subVectors(this.max,br),Wi.subVectors(t.a,br),Xi.subVectors(t.b,br),$i.subVectors(t.c,br),si.subVectors(Xi,Wi),ai.subVectors($i,Xi),_i.subVectors(Wi,$i);let e=[0,-si.z,si.y,0,-ai.z,ai.y,0,-_i.z,_i.y,si.z,0,-si.x,ai.z,0,-ai.x,_i.z,0,-_i.x,-si.y,si.x,0,-ai.y,ai.x,0,-_i.y,_i.x,0];return!Na(e,Wi,Xi,$i,ds)||(e=[1,0,0,0,1,0,0,0,1],!Na(e,Wi,Xi,$i,ds))?!1:(ps.crossVectors(si,ai),e=[ps.x,ps.y,ps.z],Na(e,Wi,Xi,$i,ds))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,mn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(mn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Fn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Fn=[new K,new K,new K,new K,new K,new K,new K,new K],mn=new K,hs=new Sn,Wi=new K,Xi=new K,$i=new K,si=new K,ai=new K,_i=new K,br=new K,ds=new K,ps=new K,vi=new K;function Na(i,t,e,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){vi.fromArray(i,s);const o=r.x*Math.abs(vi.x)+r.y*Math.abs(vi.y)+r.z*Math.abs(vi.z),c=t.dot(vi),l=e.dot(vi),h=n.dot(vi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const Xn=vd();function vd(){const i=new ArrayBuffer(4),t=new Float32Array(i),e=new Uint32Array(i),n=new Uint32Array(512),r=new Uint32Array(512);for(let c=0;c<256;++c){const l=c-127;l<-27?(n[c]=0,n[c|256]=32768,r[c]=24,r[c|256]=24):l<-14?(n[c]=1024>>-l-14,n[c|256]=1024>>-l-14|32768,r[c]=-l-1,r[c|256]=-l-1):l<=15?(n[c]=l+15<<10,n[c|256]=l+15<<10|32768,r[c]=13,r[c|256]=13):l<128?(n[c]=31744,n[c|256]=64512,r[c]=24,r[c|256]=24):(n[c]=31744,n[c|256]=64512,r[c]=13,r[c|256]=13)}const s=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let c=1;c<1024;++c){let l=c<<13,h=0;for(;!(l&8388608);)l<<=1,h-=8388608;l&=-8388609,h+=947912704,s[c]=l|h}for(let c=1024;c<2048;++c)s[c]=939524096+(c-1024<<13);for(let c=1;c<31;++c)a[c]=c<<23;a[31]=1199570944,a[32]=2147483648;for(let c=33;c<63;++c)a[c]=2147483648+(c-32<<23);a[63]=3347054592;for(let c=1;c<64;++c)c!==32&&(o[c]=1024);return{floatView:t,uint32View:e,baseTable:n,shiftTable:r,mantissaTable:s,exponentTable:a,offsetTable:o}}function xd(i){Math.abs(i)>65504&&Lt("DataUtils.toHalfFloat(): Value out of range."),i=Ht(i,-65504,65504),Xn.floatView[0]=i;const t=Xn.uint32View[0],e=t>>23&511;return Xn.baseTable[e]+((t&8388607)>>Xn.shiftTable[e])}function Sd(i){const t=i>>10;return Xn.uint32View[0]=Xn.mantissaTable[Xn.offsetTable[t]+(i&1023)]+Xn.exponentTable[t],Xn.floatView[0]}class Qv{static toHalfFloat(t){return xd(t)}static fromHalfFloat(t){return Sd(t)}}const ve=new K,ms=new $t;let Md=0;class fn extends Di{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Md++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Bh,this.updateRanges=[],this.gpuType=ln,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[n+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ms.fromBufferAttribute(this,e),ms.applyMatrix3(t),this.setXY(e,ms.x,ms.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix3(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix4(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyNormalMatrix(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.transformDirection(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=_n(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=se(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=_n(e,this.array)),e}setX(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=_n(e,this.array)),e}setY(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=_n(e,this.array)),e}setZ(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=_n(e,this.array)),e}setW(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),n=se(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,r){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),n=se(n,this.array),r=se(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),n=se(n,this.array),r=se(r,this.array),s=se(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Af extends fn{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Rf extends fn{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Kn extends fn{constructor(t,e,n){super(new Float32Array(t),e,n)}}const yd=new Sn,wr=new K,Ua=new K;class Qn{constructor(t=new K,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):yd.setFromPoints(t).getCenter(n);let r=0;for(let s=0,a=t.length;s<a;s++)r=Math.max(r,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;wr.subVectors(t,this.center);const e=wr.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),r=(n-this.radius)*.5;this.center.addScaledVector(wr,r/n),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ua.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(wr.copy(t.center).add(Ua)),this.expandByPoint(wr.copy(t.center).sub(Ua))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Ed=0;const nn=new Kt,Fa=new xe,qi=new K,Ke=new Sn,Tr=new Sn,Te=new K;class jn extends Di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ed++}),this.uuid=Ni(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(zh(t)?Rf:Af)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Ut().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return Fa.lookAt(t),Fa.updateMatrix(),this.applyMatrix4(Fa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let r=0,s=t.length;r<s;r++){const a=t[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Kn(n,3))}else{const n=Math.min(t.length,e.count);for(let r=0;r<n;r++){const s=t[r];e.setXYZ(r,s.x,s.y,s.z||0)}t.length>e.count&&Lt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Sn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){jt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,r=e.length;n<r;n++){const s=e[n];Ke.setFromBufferAttribute(s),this.morphTargetsRelative?(Te.addVectors(this.boundingBox.min,Ke.min),this.boundingBox.expandByPoint(Te),Te.addVectors(this.boundingBox.max,Ke.max),this.boundingBox.expandByPoint(Te)):(this.boundingBox.expandByPoint(Ke.min),this.boundingBox.expandByPoint(Ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&jt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){jt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new K,1/0);return}if(t){const n=this.boundingSphere.center;if(Ke.setFromBufferAttribute(t),e)for(let s=0,a=e.length;s<a;s++){const o=e[s];Tr.setFromBufferAttribute(o),this.morphTargetsRelative?(Te.addVectors(Ke.min,Tr.min),Ke.expandByPoint(Te),Te.addVectors(Ke.max,Tr.max),Ke.expandByPoint(Te)):(Ke.expandByPoint(Tr.min),Ke.expandByPoint(Tr.max))}Ke.getCenter(n);let r=0;for(let s=0,a=t.count;s<a;s++)Te.fromBufferAttribute(t,s),r=Math.max(r,n.distanceToSquared(Te));if(e)for(let s=0,a=e.length;s<a;s++){const o=e[s],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Te.fromBufferAttribute(o,l),c&&(qi.fromBufferAttribute(t,l),Te.add(qi)),r=Math.max(r,n.distanceToSquared(Te))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&jt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){jt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,r=e.normal,s=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new fn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[];for(let M=0;M<n.count;M++)o[M]=new K,c[M]=new K;const l=new K,h=new K,p=new K,f=new $t,u=new $t,d=new $t,_=new K,g=new K;function m(M,w,A){l.fromBufferAttribute(n,M),h.fromBufferAttribute(n,w),p.fromBufferAttribute(n,A),f.fromBufferAttribute(s,M),u.fromBufferAttribute(s,w),d.fromBufferAttribute(s,A),h.sub(l),p.sub(l),u.sub(f),d.sub(f);const T=1/(u.x*d.y-d.x*u.y);isFinite(T)&&(_.copy(h).multiplyScalar(d.y).addScaledVector(p,-u.y).multiplyScalar(T),g.copy(p).multiplyScalar(u.x).addScaledVector(h,-d.x).multiplyScalar(T),o[M].add(_),o[w].add(_),o[A].add(_),c[M].add(g),c[w].add(g),c[A].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let M=0,w=x.length;M<w;++M){const A=x[M],T=A.start,L=A.count;for(let N=T,P=T+L;N<P;N+=3)m(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const y=new K,v=new K,E=new K,S=new K;function b(M){E.fromBufferAttribute(r,M),S.copy(E);const w=o[M];y.copy(w),y.sub(E.multiplyScalar(E.dot(w))).normalize(),v.crossVectors(S,w);const T=v.dot(c[M])<0?-1:1;a.setXYZW(M,y.x,y.y,y.z,T)}for(let M=0,w=x.length;M<w;++M){const A=x[M],T=A.start,L=A.count;for(let N=T,P=T+L;N<P;N+=3)b(t.getX(N+0)),b(t.getX(N+1)),b(t.getX(N+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new fn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,u=n.count;f<u;f++)n.setXYZ(f,0,0,0);const r=new K,s=new K,a=new K,o=new K,c=new K,l=new K,h=new K,p=new K;if(t)for(let f=0,u=t.count;f<u;f+=3){const d=t.getX(f+0),_=t.getX(f+1),g=t.getX(f+2);r.fromBufferAttribute(e,d),s.fromBufferAttribute(e,_),a.fromBufferAttribute(e,g),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),o.fromBufferAttribute(n,d),c.fromBufferAttribute(n,_),l.fromBufferAttribute(n,g),o.add(h),c.add(h),l.add(h),n.setXYZ(d,o.x,o.y,o.z),n.setXYZ(_,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let f=0,u=e.count;f<u;f+=3)r.fromBufferAttribute(e,f+0),s.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Te.fromBufferAttribute(t,e),Te.normalize(),t.setXYZ(e,Te.x,Te.y,Te.z)}toNonIndexed(){function t(o,c){const l=o.array,h=o.itemSize,p=o.normalized,f=new l.constructor(c.length*h);let u=0,d=0;for(let _=0,g=c.length;_<g;_++){o.isInterleavedBufferAttribute?u=c[_]*o.data.stride+o.offset:u=c[_]*h;for(let m=0;m<h;m++)f[d++]=l[u++]}return new fn(f,h,p)}if(this.index===null)return Lt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new jn,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=t(c,n);e.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const c=[],l=s[o];for(let h=0,p=l.length;h<p;h++){const f=l[h],u=t(f,n);c.push(u)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let p=0,f=l.length;p<f;p++){const u=l[p];h.push(u.toJSON(t.data))}h.length>0&&(r[c]=h,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const r=t.attributes;for(const l in r){const h=r[l];this.setAttribute(l,h.clone(e))}const s=t.morphAttributes;for(const l in s){const h=[],p=s[l];for(let f=0,u=p.length;f<u;f++)h.push(p[f].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,h=a.length;l<h;l++){const p=a[l];this.addGroup(p.start,p.count,p.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ze=new K;class Cc{constructor(t,e,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.applyMatrix4(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.applyNormalMatrix(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ze.fromBufferAttribute(this,e),ze.transformDirection(t),this.setXYZ(e,ze.x,ze.y,ze.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=_n(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=se(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=_n(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=_n(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=_n(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=_n(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),n=se(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),n=se(n,this.array),r=se(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),n=se(n,this.array),r=se(r,this.array),s=se(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this.data.array[t+3]=s,this}clone(t){if(t===void 0){ta("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return new fn(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Cc(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){ta("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Oa=new K,bd=new K,wd=new Ut;class hi{constructor(t=new K(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,r){return this.normal.set(t,e,n),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const r=Oa.subVectors(n,e).cross(bd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const r=t.delta(Oa),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(r,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||wd.getNormalMatrix(t),r=this.coplanarPoint(Oa).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let Td=0;class is extends Di{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Td++}),this.uuid=Ni(),this.name="",this.type="Material",this.blending=Hr,this.side=Pi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=af,this.blendDst=of,this.blendEquation=or,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Wt(0,0,0),this.blendAlpha=0,this.depthFunc=$r,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ih,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=xa,this.stencilZFail=xa,this.stencilZPass=xa,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Lt(`Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){Lt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const c=s[o];delete c.metadata,a.push(c)}return a}if(e){const s=r(t.textures),a=r(t.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Wt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new hi().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new $t().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new $t().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const r=e.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const On=new K,Ba=new K,gs=new K,_s=new K;class Cf{constructor(t=new K,e=new K(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,On)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=On.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(On.copy(this.origin).addScaledVector(this.direction,e),On.distanceToSquared(t))}distanceSqToSegment(t,e,n,r){Ba.copy(t).add(e).multiplyScalar(.5),gs.copy(e).sub(t).normalize(),_s.copy(this.origin).sub(Ba);const s=t.distanceTo(e)*.5,a=-this.direction.dot(gs),o=_s.dot(this.direction),c=-_s.dot(gs),l=_s.lengthSq(),h=Math.abs(1-a*a);let p,f,u,d;if(h>0)if(p=a*c-o,f=a*o-c,d=s*h,p>=0)if(f>=-d)if(f<=d){const _=1/h;p*=_,f*=_,u=p*(p+a*f+2*o)+f*(a*p+f+2*c)+l}else f=s,p=Math.max(0,-(a*f+o)),u=-p*p+f*(f+2*c)+l;else f=-s,p=Math.max(0,-(a*f+o)),u=-p*p+f*(f+2*c)+l;else f<=-d?(p=Math.max(0,-(-a*s+o)),f=p>0?-s:Math.min(Math.max(-s,-c),s),u=-p*p+f*(f+2*c)+l):f<=d?(p=0,f=Math.min(Math.max(-s,-c),s),u=f*(f+2*c)+l):(p=Math.max(0,-(a*s+o)),f=p>0?s:Math.min(Math.max(-s,-c),s),u=-p*p+f*(f+2*c)+l);else f=a>0?-s:s,p=Math.max(0,-(a*f+o)),u=-p*p+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Ba).addScaledVector(gs,f),u}intersectSphere(t,e){if(t.radius<0)return null;On.subVectors(t.center,this.origin);const n=On.dot(this.direction),r=On.dot(On)-n*n,s=t.radius*t.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,r,s,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,f=this.origin;return l>=0?(n=(t.min.x-f.x)*l,r=(t.max.x-f.x)*l):(n=(t.max.x-f.x)*l,r=(t.min.x-f.x)*l),h>=0?(s=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(s=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),p>=0?(o=(t.min.z-f.z)*p,c=(t.max.z-f.z)*p):(o=(t.max.z-f.z)*p,c=(t.min.z-f.z)*p),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,e)}intersectsBox(t){return this.intersectBox(t,On)!==null}intersectTriangle(t,e,n,r,s){const a=this.origin,o=this.direction,c=o.x,l=o.y,h=o.z,p=t.x-a.x,f=t.y-a.y,u=t.z-a.z,d=e.x-a.x,_=e.y-a.y,g=e.z-a.z,m=n.x-a.x,x=n.y-a.y,y=n.z-a.z,v=Math.abs(c),E=Math.abs(l),S=Math.abs(h);let b,M,w,A,T,L,N,P,C,U,F,z;if(v>=E&&v>=S?(w=c,L=p,C=d,z=m,c>=0?(b=l,M=h,A=f,T=u,N=_,P=g,U=x,F=y):(b=h,M=l,A=u,T=f,N=g,P=_,U=y,F=x)):E>=S?(w=l,L=f,C=_,z=x,l>=0?(b=h,M=c,A=u,T=p,N=g,P=d,U=y,F=m):(b=c,M=h,A=p,T=u,N=d,P=g,U=m,F=y)):(w=h,L=u,C=g,z=y,h>=0?(b=c,M=l,A=p,T=f,N=d,P=_,U=m,F=x):(b=l,M=c,A=f,T=p,N=_,P=d,U=x,F=m)),w===0)return null;const D=b/w,O=M/w,k=1/w,J=A-D*L,$=T-O*L,rt=N-D*C,at=P-O*C,lt=U-D*z,W=F-O*z,j=lt*at-W*rt,ot=J*W-$*lt,Dt=rt*$-at*J;if(r){if(j<0||ot<0||Dt<0)return null}else if((j<0||ot<0||Dt<0)&&(j>0||ot>0||Dt>0))return null;const St=j+ot+Dt;if(St===0)return null;const Bt=k*(j*L+ot*C+Dt*z);return(St>0?Bt<0:Bt>0)?null:this.at(Bt/St,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Pf extends is{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Jn,this.combine=cf,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const dl=new Kt,xi=new Cf,vs=new Qn,pl=new K,xs=new K,Ss=new K,Ms=new K,za=new K,ys=new K,ml=new K,Es=new K;class tn extends xe{constructor(t=new jn,e=new Pf){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(s&&o){ys.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const h=o[c],p=s[c];h!==0&&(za.fromBufferAttribute(p,t),a?ys.addScaledVector(za,h):ys.addScaledVector(za.sub(e),h))}e.add(ys)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),vs.copy(n.boundingSphere),vs.applyMatrix4(s),xi.copy(t.ray).recast(t.near),!(vs.containsPoint(xi.origin)===!1&&(xi.intersectSphere(vs,pl)===null||xi.origin.distanceToSquared(pl)>(t.far-t.near)**2))&&(dl.copy(s).invert(),xi.copy(t.ray).applyMatrix4(dl),!(n.boundingBox!==null&&xi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,xi)))}_computeIntersections(t,e,n){let r;const s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,p=s.attributes.normal,f=s.groups,u=s.drawRange;if(o!==null)if(Array.isArray(a))for(let d=0,_=f.length;d<_;d++){const g=f[d],m=a[g.materialIndex],x=Math.max(g.start,u.start),y=Math.min(o.count,Math.min(g.start+g.count,u.start+u.count));for(let v=x,E=y;v<E;v+=3){const S=o.getX(v),b=o.getX(v+1),M=o.getX(v+2);r=bs(this,m,t,n,l,h,p,S,b,M),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const d=Math.max(0,u.start),_=Math.min(o.count,u.start+u.count);for(let g=d,m=_;g<m;g+=3){const x=o.getX(g),y=o.getX(g+1),v=o.getX(g+2);r=bs(this,a,t,n,l,h,p,x,y,v),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let d=0,_=f.length;d<_;d++){const g=f[d],m=a[g.materialIndex],x=Math.max(g.start,u.start),y=Math.min(c.count,Math.min(g.start+g.count,u.start+u.count));for(let v=x,E=y;v<E;v+=3){const S=v,b=v+1,M=v+2;r=bs(this,m,t,n,l,h,p,S,b,M),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=g.materialIndex,e.push(r))}}else{const d=Math.max(0,u.start),_=Math.min(c.count,u.start+u.count);for(let g=d,m=_;g<m;g+=3){const x=g,y=g+1,v=g+2;r=bs(this,a,t,n,l,h,p,x,y,v),r&&(r.faceIndex=Math.floor(g/3),e.push(r))}}}}function Ad(i,t,e,n,r,s,a,o){let c;if(t.side===$e?c=n.intersectTriangle(a,s,r,!0,o):c=n.intersectTriangle(r,s,a,t.side===Pi,o),c===null)return null;Es.copy(o),Es.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Es);return l<e.near||l>e.far?null:{distance:l,point:Es.clone(),object:i}}function bs(i,t,e,n,r,s,a,o,c,l){i.getVertexPosition(o,xs),i.getVertexPosition(c,Ss),i.getVertexPosition(l,Ms);const h=Ad(i,t,e,n,xs,Ss,Ms,ml);if(h){const p=new K;vn.getBarycoord(ml,xs,Ss,Ms,p),r&&(h.uv=vn.getInterpolatedAttribute(r,o,c,l,p,new $t)),s&&(h.uv1=vn.getInterpolatedAttribute(s,o,c,l,p,new $t)),a&&(h.normal=vn.getInterpolatedAttribute(a,o,c,l,p,new K),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:c,c:l,normal:new K,materialIndex:0};vn.getNormal(xs,Ss,Ms,f.normal),h.face=f,h.barycoord=p}return h}const Ar=new Yt,gl=new Yt,_l=new Yt,Rd=new Yt,vl=new Kt,ws=new K,ka=new Qn,xl=new Kt,Ga=new Cf;class Cd extends tn{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Qc,this.bindMatrix=new Kt,this.bindMatrixInverse=new Kt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new Sn),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,ws),this.boundingBox.expandByPoint(ws)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Qn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,ws),this.boundingSphere.expandByPoint(ws)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const n=this.material,r=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ka.copy(this.boundingSphere),ka.applyMatrix4(r),t.ray.intersectsSphere(ka)!==!1&&(xl.copy(r).invert(),Ga.copy(t.ray).applyMatrix4(xl),!(this.boundingBox!==null&&Ga.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,Ga)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new Yt,e=this.geometry.attributes.skinWeight;for(let n=0,r=e.count;n<r;n++){t.fromBufferAttribute(e,n);const s=1/t.manhattanLength();s!==1/0?t.multiplyScalar(s):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===Qc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Ah?this.bindMatrixInverse.copy(this.bindMatrix).invert():Lt("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const n=this.skeleton,r=this.geometry;gl.fromBufferAttribute(r.attributes.skinIndex,t),_l.fromBufferAttribute(r.attributes.skinWeight,t),e.isVector4?(Ar.copy(e),e.set(0,0,0,0)):(Ar.set(...e,1),e.set(0,0,0)),Ar.applyMatrix4(this.bindMatrix);for(let s=0;s<4;s++){const a=_l.getComponent(s);if(a!==0){const o=gl.getComponent(s);vl.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),e.addScaledVector(Rd.copy(Ar).applyMatrix4(vl),a)}}return e.isVector4&&(e.w=Ar.w),e.applyMatrix4(this.bindMatrixInverse)}}class Pd extends xe{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Pc extends Oe{constructor(t=null,e=1,n=1,r,s,a,o,c,l=Pe,h=Pe,p,f){super(null,a,o,c,l,h,r,s,p,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Sl=new Kt,Id=new Kt;class If{constructor(t=[],e=[]){this.uuid=Ni(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){Lt("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,r=this.bones.length;n<r;n++)this.boneInverses.push(new Kt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const n=new Kt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const t=this.bones,e=this.boneInverses,n=this.boneMatrices,r=this.boneTexture;for(let s=0,a=t.length;s<a;s++){const o=t[s]?t[s].matrixWorld:Id;Sl.multiplyMatrices(o,e[s]),Sl.toArray(n,s*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new If(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const n=new Pc(e,t,t,un,ln);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){const r=this.bones[e];if(r.name===t)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,r=t.bones.length;n<r;n++){const s=t.bones[n];let a=e[s];a===void 0&&(Lt("Skeleton: No bone found with UUID:",s),a=new Pd),this.bones.push(a),this.boneInverses.push(new Kt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){const t={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,n=this.boneInverses;for(let r=0,s=e.length;r<s;r++){const a=e[r];t.bones.push(a.uuid);const o=n[r];t.boneInverses.push(o.toArray())}return t}}class Ml extends fn{constructor(t,e,n,r=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Yi=new Kt,yl=new Kt,Ts=[],El=new Sn,Ld=new Kt,Rr=new tn,Cr=new Qn;class jv extends tn{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ml(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,Ld)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Sn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Yi),El.copy(t.boundingBox).applyMatrix4(Yi),this.boundingBox.union(El)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Qn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Yi),Cr.copy(t.boundingSphere).applyMatrix4(Yi),this.boundingSphere.union(Cr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=t*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(t,e){const n=this.matrixWorld,r=this.count;if(Rr.geometry=this.geometry,Rr.material=this.material,Rr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Cr.copy(this.boundingSphere),Cr.applyMatrix4(n),t.ray.intersectsSphere(Cr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Yi),yl.multiplyMatrices(n,Yi),Rr.matrixWorld=yl,Rr.raycast(t,Ts);for(let a=0,o=Ts.length;a<o;a++){const c=Ts[a];c.instanceId=s,c.object=this,e.push(c)}Ts.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Ml(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const n=e.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Pc(new Float32Array(r*this.count),r,this.count,Mc,ln));const s=this.morphTexture.source.data.data;let a=0;for(let l=0;l<n.length;l++)a+=n[l];const o=this.geometry.morphTargetsRelative?1:1-a,c=r*t;return s[c]=o,s.set(n,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Si=new Qn,Dd=new $t(.5,.5),As=new K;class Ic{constructor(t=new hi,e=new hi,n=new hi,r=new hi,s=new hi,a=new hi){this.planes=[t,e,n,r,s,a]}set(t,e,n,r,s,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Rn,n=!1){const r=this.planes,s=t.elements,a=s[0],o=s[1],c=s[2],l=s[3],h=s[4],p=s[5],f=s[6],u=s[7],d=s[8],_=s[9],g=s[10],m=s[11],x=s[12],y=s[13],v=s[14],E=s[15];if(r[0].setComponents(l-a,u-h,m-d,E-x).normalize(),r[1].setComponents(l+a,u+h,m+d,E+x).normalize(),r[2].setComponents(l+o,u+p,m+_,E+y).normalize(),r[3].setComponents(l-o,u-p,m-_,E-y).normalize(),n)r[4].setComponents(c,f,g,v).normalize(),r[5].setComponents(l-c,u-f,m-g,E-v).normalize();else if(r[4].setComponents(l-c,u-f,m-g,E-v).normalize(),e===Rn)r[5].setComponents(l+c,u+f,m+g,E+v).normalize();else if(e===Kr)r[5].setComponents(c,f,g,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Si.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Si.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Si)}intersectsSprite(t){Si.center.set(0,0,0);const e=Dd.distanceTo(t.center);return Si.radius=.7071067811865476+e,Si.applyMatrix4(t.matrixWorld),this.intersectsSphere(Si)}intersectsSphere(t){const e=this.planes,n=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const r=e[n];if(As.x=r.normal.x>0?t.max.x:t.min.x,As.y=r.normal.y>0?t.max.y:t.min.y,As.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(As)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Lf extends Oe{constructor(t=[],e=Ii,n,r,s,a,o,c,l,h){super(t,e,n,r,s,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Jr extends Oe{constructor(t,e,n=Pn,r,s,a,o=Pe,c=Pe,l,h=Zn,p=1){if(h!==Zn&&h!==Ti)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:t,height:e,depth:p};super(f,r,s,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Rc(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class Nd extends Jr{constructor(t,e=Pn,n=Ii,r,s,a=Pe,o=Pe,c,l=Zn){const h={width:t,height:t,depth:1},p=[h,h,h,h,h,h];super(t,t,e,n,r,s,a,o,c,l),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Df extends Oe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class rs extends jn{constructor(t=1,e=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const c=[],l=[],h=[],p=[];let f=0,u=0;d("z","y","x",-1,-1,n,e,t,a,s,0),d("z","y","x",1,-1,n,e,-t,a,s,1),d("x","z","y",1,1,t,n,e,r,a,2),d("x","z","y",1,-1,t,n,-e,r,a,3),d("x","y","z",1,-1,t,e,n,r,s,4),d("x","y","z",-1,-1,t,e,-n,r,s,5),this.setIndex(c),this.setAttribute("position",new Kn(l,3)),this.setAttribute("normal",new Kn(h,3)),this.setAttribute("uv",new Kn(p,2));function d(_,g,m,x,y,v,E,S,b,M,w){const A=v/b,T=E/M,L=v/2,N=E/2,P=S/2,C=b+1,U=M+1;let F=0,z=0;const D=new K;for(let O=0;O<U;O++){const k=O*T-N;for(let J=0;J<C;J++){const $=J*A-L;D[_]=$*x,D[g]=k*y,D[m]=P,l.push(D.x,D.y,D.z),D[_]=0,D[g]=0,D[m]=S>0?1:-1,h.push(D.x,D.y,D.z),p.push(J/b),p.push(1-O/M),F+=1}}for(let O=0;O<M;O++)for(let k=0;k<b;k++){const J=f+k+C*O,$=f+k+C*(O+1),rt=f+(k+1)+C*(O+1),at=f+(k+1)+C*O;c.push(J,$,at),c.push($,rt,at),z+=6}o.addGroup(u,z,w),u+=z,f+=F}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new rs(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class la extends jn{constructor(t=1,e=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:r};const s=t/2,a=e/2,o=Math.floor(n),c=Math.floor(r),l=o+1,h=c+1,p=t/o,f=e/c,u=[],d=[],_=[],g=[];for(let m=0;m<h;m++){const x=m*f-a;for(let y=0;y<l;y++){const v=y*p-s;d.push(v,-x,0),_.push(0,0,1),g.push(y/o),g.push(1-m/c)}}for(let m=0;m<c;m++)for(let x=0;x<o;x++){const y=x+l*m,v=x+l*(m+1),E=x+1+l*(m+1),S=x+1+l*m;u.push(y,v,S),u.push(v,E,S)}this.setIndex(u),this.setAttribute("position",new Kn(d,3)),this.setAttribute("normal",new Kn(_,3)),this.setAttribute("uv",new Kn(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new la(t.width,t.height,t.widthSegments,t.heightSegments)}}function xr(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const r=i[e][n];if(bl(r))r.isRenderTargetTexture?(Lt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=r.clone();else if(Array.isArray(r))if(bl(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();t[e][n]=s}else t[e][n]=r.slice();else t[e][n]=r}}return t}function ke(i){const t={};for(let e=0;e<i.length;e++){const n=xr(i[e]);for(const r in n)t[r]=n[r]}return t}function bl(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Ud(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Nf(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:qt.workingColorSpace}const Fd={clone:xr,merge:ke};var Od=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Bd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ln extends is{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Od,this.fragmentShader=Bd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=xr(t.uniforms),this.uniformsGroups=Ud(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?e.uniforms[r]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[r]={type:"m4",value:a.toArray()}:e.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const r=t.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=e[r.value]||null;break;case"c":this.uniforms[n].value=new Wt().setHex(r.value);break;case"v2":this.uniforms[n].value=new $t().fromArray(r.value);break;case"v3":this.uniforms[n].value=new K().fromArray(r.value);break;case"v4":this.uniforms[n].value=new Yt().fromArray(r.value);break;case"m3":this.uniforms[n].value=new Ut().fromArray(r.value);break;case"m4":this.uniforms[n].value=new Kt().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class zd extends Ln{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class kd extends is{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Wt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ec,this.normalScale=new $t(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Jn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class tx extends kd{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new $t(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ht(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Wt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Wt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Wt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Gd extends is{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ch,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Hd extends is{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Ha={enabled:!1,files:{},add:function(i,t){this.enabled!==!1&&(wl(i)||(this.files[i]=t))},get:function(i){if(this.enabled!==!1&&!wl(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function wl(i){try{const t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}class Vd{constructor(t,e,n){const r=this;let s=!1,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,o),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,p){return l.push(h,p),this},this.removeHandler=function(h){const p=l.indexOf(h);return p!==-1&&l.splice(p,2),this},this.getHandler=function(h){for(let p=0,f=l.length;p<f;p+=2){const u=l[p],d=l[p+1];if(u.global&&(u.lastIndex=0),u.test(h))return d}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Wd=new Vd;class Lc{constructor(t){this.manager=t!==void 0?t:Wd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const n=this;return new Promise(function(r,s){n.load(t,r,e,s)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}}Lc.DEFAULT_MATERIAL_NAME="__DEFAULT";const Ki=new WeakMap;class Xd extends Lc{constructor(t){super(t)}load(t,e,n,r){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const s=this,a=Ha.get(`image:${t}`);if(a!==void 0){if(a.complete===!0)s.manager.itemStart(t),setTimeout(function(){e&&e(a),s.manager.itemEnd(t)},0);else{let p=Ki.get(a);p===void 0&&(p=[],Ki.set(a,p)),p.push({onLoad:e,onError:r})}return a}const o=Zr("img");function c(){h(),e&&e(this);const p=Ki.get(this)||[];for(let f=0;f<p.length;f++){const u=p[f];u.onLoad&&u.onLoad(this)}Ki.delete(this),s.manager.itemEnd(t)}function l(p){h(),r&&r(p),Ha.remove(`image:${t}`);const f=Ki.get(this)||[];for(let u=0;u<f.length;u++){const d=f[u];d.onError&&d.onError(p)}Ki.delete(this),s.manager.itemError(t),s.manager.itemEnd(t)}function h(){o.removeEventListener("load",c,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",l,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Ha.add(`image:${t}`,o),s.manager.itemStart(t),o.src=t,o}}class ex extends Lc{constructor(t){super(t)}load(t,e,n,r){const s=new Oe,a=new Xd(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,function(o){s.image=o,s.needsUpdate=!0,e!==void 0&&e(s)},n,r),s}}class ua extends xe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Wt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class nx extends ua{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(xe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Wt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Va=new Kt,Tl=new K,Al=new K;class Dc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new $t(512,512),this.mapType=Je,this.map=null,this.mapPass=null,this.matrix=new Kt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ic,this._frameExtents=new $t(1,1),this._viewportCount=1,this._viewports=[new Yt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;Tl.setFromMatrixPosition(t.matrixWorld),e.position.copy(Tl),Al.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Al),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,r){Va.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Va,t.coordinateSystem,t.reversedDepth);const s=this._frameExtents,a=r?r.z/s.x:1,o=r?r.w/s.y:1,c=r?r.x/s.x:0,l=r?r.y/s.y:0;t.coordinateSystem===Kr||t.reversedDepth?e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),e.multiply(Va)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Rs=new K,Cs=new Ui,En=new K;class Uf extends xe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Kt,this.projectionMatrix=new Kt,this.projectionMatrixInverse=new Kt,this.coordinateSystem=Rn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Rs,Cs,En),En.x===1&&En.y===1&&En.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Rs,Cs,En.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Rs,Cs,En),En.x===1&&En.y===1&&En.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Rs,Cs,En.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const oi=new K,Rl=new $t,Cl=new $t;class Me extends Uf{constructor(t=50,e=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=vr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Vr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return vr*2*Math.atan(Math.tan(Vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(oi.x,oi.y).multiplyScalar(-t/oi.z),oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(oi.x,oi.y).multiplyScalar(-t/oi.z)}getViewSize(t,e){return this.getViewBounds(t,Rl,Cl),e.subVectors(Cl,Rl)}setViewOffset(t,e,n,r,s,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Vr*.5*this.fov)/this.zoom,n=2*e,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;s+=a.offsetX*r/c,e-=a.offsetY*n/l,r*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class $d extends Dc{constructor(){super(new Me(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){const e=this.camera,n=vr*2*t.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=t.distance||e.far;(n!==e.fov||r!==e.aspect||s!==e.far)&&(e.fov=n,e.aspect=r,e.far=s,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this.aspect=t.aspect,this}toJSON(){const t=super.toJSON();return t.focus=this.focus,t.aspect=this.aspect,t}}class ix extends ua{constructor(t,e,n=0,r=Math.PI/3,s=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(xe.DEFAULT_UP),this.updateMatrix(),this.target=new xe,this.distance=n,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new $d}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}}class qd extends Dc{constructor(){super(new Me(90,1,.5,500)),this.isPointLightShadow=!0}}class rx extends ua{constructor(t,e,n=0,r=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=r,this.shadow=new qd}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}}class dr extends Uf{constructor(t=-1,e=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-t,a=n+t,o=r+e,c=r-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,a=s+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Yd extends Dc{constructor(){super(new dr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class sx extends ua{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(xe.DEFAULT_UP),this.updateMatrix(),this.target=new xe,this.shadow=new Yd}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}const Zi=-90,Ji=1;class Kd extends xe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Me(Zi,Ji,t,e);r.layers=this.layers,this.add(r);const s=new Me(Zi,Ji,t,e);s.layers=this.layers,this.add(s);const a=new Me(Zi,Ji,t,e);a.layers=this.layers,this.add(a);const o=new Me(Zi,Ji,t,e);o.layers=this.layers,this.add(o);const c=new Me(Zi,Ji,t,e);c.layers=this.layers,this.add(c);const l=new Me(Zi,Ji,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,r,s,a,o,c]=e;for(const l of e)this.remove(l);if(t===Rn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Kr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,c,l,h]=this.children,p=t.getRenderTarget(),f=t.getActiveCubeFace(),u=t.getActiveMipmapLevel(),d=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,s),t.setRenderTarget(n,1,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,r),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(p,f,u),t.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class Zd extends Me{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const Oc=class Oc{constructor(t,e,n,r){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,r){const s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=r,this}};Oc.prototype.isMatrix2=!0;let Pl=Oc;function Il(i,t,e,n){const r=Jd(n);switch(e){case Mf:return i*t;case Mc:return i*t/r.components*r.byteLength;case yc:return i*t/r.components*r.byteLength;case Li:return i*t*2/r.components*r.byteLength;case Ec:return i*t*2/r.components*r.byteLength;case yf:return i*t*3/r.components*r.byteLength;case un:return i*t*4/r.components*r.byteLength;case bc:return i*t*4/r.components*r.byteLength;case Vs:case Ws:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Xs:case $s:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case To:case Ro:return Math.max(i,16)*Math.max(t,8)/4;case wo:case Ao:return Math.max(i,8)*Math.max(t,8)/2;case Co:case Po:case Lo:case Do:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Io:case Zs:case No:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Uo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Fo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Oo:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Bo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case zo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ko:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Go:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ho:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Vo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Wo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Xo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case $o:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case qo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Yo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Ko:case Zo:case Jo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Qo:case jo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Js:case tc:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Jd(i){switch(i){case Je:case _f:return{byteLength:1,components:1};case qr:case vf:case In:return{byteLength:2,components:1};case xc:case Sc:return{byteLength:2,components:4};case Pn:case vc:case ln:return{byteLength:4,components:1};case xf:case Sf:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_c}}));typeof window<"u"&&(window.__THREE__?Lt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_c);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ff(){let i=null,t=!1,e=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),e(s,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(r),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){i=s}}}function Qd(i){const t=new WeakMap;function e(o,c){const l=o.array,h=o.usage,p=l.byteLength,f=i.createBuffer();i.bindBuffer(c,f),i.bufferData(c,l,h),o.onUploadCallback();let u;if(l instanceof Float32Array)u=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)u=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?u=i.HALF_FLOAT:u=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)u=i.SHORT;else if(l instanceof Uint32Array)u=i.UNSIGNED_INT;else if(l instanceof Int32Array)u=i.INT;else if(l instanceof Int8Array)u=i.BYTE;else if(l instanceof Uint8Array)u=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)u=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:u,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:p}}function n(o,c,l){const h=c.array,p=c.updateRanges;if(i.bindBuffer(l,o),p.length===0)i.bufferSubData(l,0,h);else{p.sort((u,d)=>u.start-d.start);let f=0;for(let u=1;u<p.length;u++){const d=p[f],_=p[u];_.start<=d.start+d.count+1?d.count=Math.max(d.count,_.start+_.count-d.start):(++f,p[f]=_)}p.length=f+1;for(let u=0,d=p.length;u<d;u++){const _=p[u];i.bufferSubData(l,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:r,remove:s,update:a}}var jd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,tp=`#ifdef USE_ALPHAHASH
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
#endif`,ep=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,np=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ip=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,sp=`#ifdef USE_AOMAP
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
#endif`,ap=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,op=`#ifdef USE_BATCHING
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
#endif`,cp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,lp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,up=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,fp=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,hp=`#ifdef USE_IRIDESCENCE
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
#endif`,dp=`#ifdef USE_BUMPMAP
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
#endif`,pp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,mp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_p=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,vp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,xp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Mp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,yp=`#define PI 3.141592653589793
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
} // validated`,Ep=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,bp=`vec3 transformedNormal = objectNormal;
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
#endif`,wp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Tp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ap=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Pp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ip=`#ifdef USE_ENVMAP
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
#endif`,Lp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Dp=`#ifdef USE_ENVMAP
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
#endif`,Np=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Up=`#ifdef USE_ENVMAP
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
#endif`,Fp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Op=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kp=`#ifdef USE_GRADIENTMAP
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
}`,Gp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Hp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Vp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Wp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Xp=`#ifdef USE_ENVMAP
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
#endif`,$p=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,qp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zp=`PhysicalMaterial material;
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
#endif`,Jp=`uniform sampler2D dfgLUT;
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
}`,Qp=`
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
#endif`,jp=`#if defined( RE_IndirectDiffuse )
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
#endif`,tm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,em=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,nm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,im=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,am=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,om=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,cm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,lm=`#if defined( USE_POINTS_UV )
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
#endif`,um=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,fm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,dm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mm=`#ifdef USE_MORPHTARGETS
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
#endif`,gm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_m=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,vm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,xm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,ym=`#ifdef USE_NORMALMAP
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
#endif`,Em=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,bm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Am=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Cm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Pm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Im=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Lm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Dm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Nm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Um=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Fm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Om=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Bm=`float getShadowMask() {
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
}`,zm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,km=`#ifdef USE_SKINNING
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
#endif`,Gm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Hm=`#ifdef USE_SKINNING
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
#endif`,Vm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Wm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$m=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,qm=`#ifdef USE_TRANSMISSION
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
#endif`,Ym=`#ifdef USE_TRANSMISSION
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
#endif`,Km=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Zm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Jm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Qm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const jm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,t0=`uniform sampler2D t2D;
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
}`,e0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,n0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,i0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,r0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,s0=`#include <common>
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
}`,a0=`#if DEPTH_PACKING == 3200
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
}`,o0=`#define DISTANCE
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
}`,c0=`#define DISTANCE
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
}`,l0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,u0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,f0=`uniform float scale;
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
}`,h0=`uniform vec3 diffuse;
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
}`,d0=`#include <common>
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
}`,p0=`uniform vec3 diffuse;
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
}`,m0=`#define LAMBERT
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
}`,g0=`#define LAMBERT
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
}`,_0=`#define MATCAP
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
}`,v0=`#define MATCAP
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
}`,x0=`#define NORMAL
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
}`,S0=`#define NORMAL
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
}`,M0=`#define PHONG
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
}`,y0=`#define PHONG
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
}`,E0=`#define STANDARD
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
}`,b0=`#define STANDARD
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
}`,w0=`#define TOON
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
}`,T0=`#define TOON
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
}`,A0=`uniform float size;
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
}`,R0=`uniform vec3 diffuse;
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
}`,C0=`#include <common>
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
}`,P0=`uniform vec3 color;
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
}`,I0=`uniform float rotation;
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
}`,L0=`uniform vec3 diffuse;
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
}`,kt={alphahash_fragment:jd,alphahash_pars_fragment:tp,alphamap_fragment:ep,alphamap_pars_fragment:np,alphatest_fragment:ip,alphatest_pars_fragment:rp,aomap_fragment:sp,aomap_pars_fragment:ap,batching_pars_vertex:op,batching_vertex:cp,begin_vertex:lp,beginnormal_vertex:up,bsdfs:fp,iridescence_fragment:hp,bumpmap_pars_fragment:dp,clipping_planes_fragment:pp,clipping_planes_pars_fragment:mp,clipping_planes_pars_vertex:gp,clipping_planes_vertex:_p,color_fragment:vp,color_pars_fragment:xp,color_pars_vertex:Sp,color_vertex:Mp,common:yp,cube_uv_reflection_fragment:Ep,defaultnormal_vertex:bp,displacementmap_pars_vertex:wp,displacementmap_vertex:Tp,emissivemap_fragment:Ap,emissivemap_pars_fragment:Rp,colorspace_fragment:Cp,colorspace_pars_fragment:Pp,envmap_fragment:Ip,envmap_common_pars_fragment:Lp,envmap_pars_fragment:Dp,envmap_pars_vertex:Np,envmap_physical_pars_fragment:Xp,envmap_vertex:Up,fog_vertex:Fp,fog_pars_vertex:Op,fog_fragment:Bp,fog_pars_fragment:zp,gradientmap_pars_fragment:kp,lightmap_pars_fragment:Gp,lights_lambert_fragment:Hp,lights_lambert_pars_fragment:Vp,lights_pars_begin:Wp,lights_toon_fragment:$p,lights_toon_pars_fragment:qp,lights_phong_fragment:Yp,lights_phong_pars_fragment:Kp,lights_physical_fragment:Zp,lights_physical_pars_fragment:Jp,lights_fragment_begin:Qp,lights_fragment_maps:jp,lights_fragment_end:tm,lightprobes_pars_fragment:em,logdepthbuf_fragment:nm,logdepthbuf_pars_fragment:im,logdepthbuf_pars_vertex:rm,logdepthbuf_vertex:sm,map_fragment:am,map_pars_fragment:om,map_particle_fragment:cm,map_particle_pars_fragment:lm,metalnessmap_fragment:um,metalnessmap_pars_fragment:fm,morphinstance_vertex:hm,morphcolor_vertex:dm,morphnormal_vertex:pm,morphtarget_pars_vertex:mm,morphtarget_vertex:gm,normal_fragment_begin:_m,normal_fragment_maps:vm,normal_pars_fragment:xm,normal_pars_vertex:Sm,normal_vertex:Mm,normalmap_pars_fragment:ym,clearcoat_normal_fragment_begin:Em,clearcoat_normal_fragment_maps:bm,clearcoat_pars_fragment:wm,iridescence_pars_fragment:Tm,opaque_fragment:Am,packing:Rm,premultiplied_alpha_fragment:Cm,project_vertex:Pm,dithering_fragment:Im,dithering_pars_fragment:Lm,roughnessmap_fragment:Dm,roughnessmap_pars_fragment:Nm,shadowmap_pars_fragment:Um,shadowmap_pars_vertex:Fm,shadowmap_vertex:Om,shadowmask_pars_fragment:Bm,skinbase_vertex:zm,skinning_pars_vertex:km,skinning_vertex:Gm,skinnormal_vertex:Hm,specularmap_fragment:Vm,specularmap_pars_fragment:Wm,tonemapping_fragment:Xm,tonemapping_pars_fragment:$m,transmission_fragment:qm,transmission_pars_fragment:Ym,uv_pars_fragment:Km,uv_pars_vertex:Zm,uv_vertex:Jm,worldpos_vertex:Qm,background_vert:jm,background_frag:t0,backgroundCube_vert:e0,backgroundCube_frag:n0,cube_vert:i0,cube_frag:r0,depth_vert:s0,depth_frag:a0,distance_vert:o0,distance_frag:c0,equirect_vert:l0,equirect_frag:u0,linedashed_vert:f0,linedashed_frag:h0,meshbasic_vert:d0,meshbasic_frag:p0,meshlambert_vert:m0,meshlambert_frag:g0,meshmatcap_vert:_0,meshmatcap_frag:v0,meshnormal_vert:x0,meshnormal_frag:S0,meshphong_vert:M0,meshphong_frag:y0,meshphysical_vert:E0,meshphysical_frag:b0,meshtoon_vert:w0,meshtoon_frag:T0,points_vert:A0,points_frag:R0,shadow_vert:C0,shadow_frag:P0,sprite_vert:I0,sprite_frag:L0},gt={common:{diffuse:{value:new Wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ut},alphaMap:{value:null},alphaMapTransform:{value:new Ut},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ut}},envmap:{envMap:{value:null},envMapRotation:{value:new Ut},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ut}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ut}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ut},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ut},normalScale:{value:new $t(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ut},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ut}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ut}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ut}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new K},probesMax:{value:new K},probesResolution:{value:new K}},points:{diffuse:{value:new Wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ut},alphaTest:{value:0},uvTransform:{value:new Ut}},sprite:{diffuse:{value:new Wt(16777215)},opacity:{value:1},center:{value:new $t(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ut},alphaMap:{value:null},alphaMapTransform:{value:new Ut},alphaTest:{value:0}}},An={basic:{uniforms:ke([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.fog]),vertexShader:kt.meshbasic_vert,fragmentShader:kt.meshbasic_frag},lambert:{uniforms:ke([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Wt(0)},envMapIntensity:{value:1}}]),vertexShader:kt.meshlambert_vert,fragmentShader:kt.meshlambert_frag},phong:{uniforms:ke([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Wt(0)},specular:{value:new Wt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:kt.meshphong_vert,fragmentShader:kt.meshphong_frag},standard:{uniforms:ke([gt.common,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.roughnessmap,gt.metalnessmap,gt.fog,gt.lights,{emissive:{value:new Wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag},toon:{uniforms:ke([gt.common,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.gradientmap,gt.fog,gt.lights,{emissive:{value:new Wt(0)}}]),vertexShader:kt.meshtoon_vert,fragmentShader:kt.meshtoon_frag},matcap:{uniforms:ke([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,{matcap:{value:null}}]),vertexShader:kt.meshmatcap_vert,fragmentShader:kt.meshmatcap_frag},points:{uniforms:ke([gt.points,gt.fog]),vertexShader:kt.points_vert,fragmentShader:kt.points_frag},dashed:{uniforms:ke([gt.common,gt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:kt.linedashed_vert,fragmentShader:kt.linedashed_frag},depth:{uniforms:ke([gt.common,gt.displacementmap]),vertexShader:kt.depth_vert,fragmentShader:kt.depth_frag},normal:{uniforms:ke([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,{opacity:{value:1}}]),vertexShader:kt.meshnormal_vert,fragmentShader:kt.meshnormal_frag},sprite:{uniforms:ke([gt.sprite,gt.fog]),vertexShader:kt.sprite_vert,fragmentShader:kt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ut},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:kt.background_vert,fragmentShader:kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ut}},vertexShader:kt.backgroundCube_vert,fragmentShader:kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:kt.cube_vert,fragmentShader:kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:kt.equirect_vert,fragmentShader:kt.equirect_frag},distance:{uniforms:ke([gt.common,gt.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:kt.distance_vert,fragmentShader:kt.distance_frag},shadow:{uniforms:ke([gt.lights,gt.fog,{color:{value:new Wt(0)},opacity:{value:1}}]),vertexShader:kt.shadow_vert,fragmentShader:kt.shadow_frag}};An.physical={uniforms:ke([An.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ut},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ut},clearcoatNormalScale:{value:new $t(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ut},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ut},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ut},sheen:{value:0},sheenColor:{value:new Wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ut},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ut},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ut},transmissionSamplerSize:{value:new $t},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ut},attenuationDistance:{value:0},attenuationColor:{value:new Wt(0)},specularColor:{value:new Wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ut},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ut},anisotropyVector:{value:new $t},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ut}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag};const Ps={r:0,b:0,g:0},D0=new Kt,Of=new Ut;Of.set(-1,0,0,0,1,0,0,0,1);function N0(i,t,e,n,r,s){const a=new Wt(0);let o=r===!0?0:1,c,l,h=null,p=0,f=null;function u(x){let y=x.isScene===!0?x.background:null;if(y&&y.isTexture){const v=x.backgroundBlurriness>0;y=t.get(y,v)}return y}function d(x){let y=!1;const v=u(x);v===null?g(a,o):v&&v.isColor&&(g(v,1),y=!0);const E=i.xr.getEnvironmentBlendMode();E==="additive"?e.buffers.color.setClear(0,0,0,1,s):E==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,s),(i.autoClear||y)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function _(x,y){const v=u(y);v&&(v.isCubeTexture||v.mapping===ca)?(l===void 0&&(l=new tn(new rs(1,1,1),new Ln({name:"BackgroundCubeMaterial",uniforms:xr(An.backgroundCube.uniforms),vertexShader:An.backgroundCube.vertexShader,fragmentShader:An.backgroundCube.fragmentShader,side:$e,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(E,S,b){this.matrixWorld.copyPosition(b.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=v,l.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(D0.makeRotationFromEuler(y.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Of),l.material.toneMapped=qt.getTransfer(v.colorSpace)!==re,(h!==v||p!==v.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,h=v,p=v.version,f=i.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new tn(new la(2,2),new Ln({name:"BackgroundMaterial",uniforms:xr(An.background.uniforms),vertexShader:An.background.vertexShader,fragmentShader:An.background.fragmentShader,side:Pi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=qt.getTransfer(v.colorSpace)!==re,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||p!==v.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=v,p=v.version,f=i.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function g(x,y){x.getRGB(Ps,Nf(i)),e.buffers.color.setClear(Ps.r,Ps.g,Ps.b,y,s)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,y=1){a.set(x),o=y,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(x){o=x,g(a,o)},render:d,addToRenderList:_,dispose:m}}function U0(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=f(null);let s=r,a=!1;function o(T,L,N,P,C){let U=!1;const F=p(T,P,N,L);s!==F&&(s=F,l(s.object)),U=u(T,P,N,C),U&&d(T,P,N,C),C!==null&&t.update(C,i.ELEMENT_ARRAY_BUFFER),(U||a)&&(a=!1,v(T,L,N,P),C!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(C).buffer))}function c(){return i.createVertexArray()}function l(T){return i.bindVertexArray(T)}function h(T){return i.deleteVertexArray(T)}function p(T,L,N,P){const C=P.wireframe===!0;let U=n[L.id];U===void 0&&(U={},n[L.id]=U);const F=T.isInstancedMesh===!0?T.id:0;let z=U[F];z===void 0&&(z={},U[F]=z);let D=z[N.id];D===void 0&&(D={},z[N.id]=D);let O=D[C];return O===void 0&&(O=f(c()),D[C]=O),O}function f(T){const L=[],N=[],P=[];for(let C=0;C<e;C++)L[C]=0,N[C]=0,P[C]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:N,attributeDivisors:P,object:T,attributes:{},index:null}}function u(T,L,N,P){const C=s.attributes,U=L.attributes;let F=0;const z=N.getAttributes();for(const D in z)if(z[D].location>=0){const k=C[D];let J=U[D];if(J===void 0&&(D==="instanceMatrix"&&T.instanceMatrix&&(J=T.instanceMatrix),D==="instanceColor"&&T.instanceColor&&(J=T.instanceColor)),k===void 0||k.attribute!==J||J&&k.data!==J.data)return!0;F++}return s.attributesNum!==F||s.index!==P}function d(T,L,N,P){const C={},U=L.attributes;let F=0;const z=N.getAttributes();for(const D in z)if(z[D].location>=0){let k=U[D];k===void 0&&(D==="instanceMatrix"&&T.instanceMatrix&&(k=T.instanceMatrix),D==="instanceColor"&&T.instanceColor&&(k=T.instanceColor));const J={};J.attribute=k,k&&k.data&&(J.data=k.data),C[D]=J,F++}s.attributes=C,s.attributesNum=F,s.index=P}function _(){const T=s.newAttributes;for(let L=0,N=T.length;L<N;L++)T[L]=0}function g(T){m(T,0)}function m(T,L){const N=s.newAttributes,P=s.enabledAttributes,C=s.attributeDivisors;N[T]=1,P[T]===0&&(i.enableVertexAttribArray(T),P[T]=1),C[T]!==L&&(i.vertexAttribDivisor(T,L),C[T]=L)}function x(){const T=s.newAttributes,L=s.enabledAttributes;for(let N=0,P=L.length;N<P;N++)L[N]!==T[N]&&(i.disableVertexAttribArray(N),L[N]=0)}function y(T,L,N,P,C,U,F){F===!0?i.vertexAttribIPointer(T,L,N,C,U):i.vertexAttribPointer(T,L,N,P,C,U)}function v(T,L,N,P){_();const C=P.attributes,U=N.getAttributes(),F=L.defaultAttributeValues;for(const z in U){const D=U[z];if(D.location>=0){let O=C[z];if(O===void 0&&(z==="instanceMatrix"&&T.instanceMatrix&&(O=T.instanceMatrix),z==="instanceColor"&&T.instanceColor&&(O=T.instanceColor)),O!==void 0){const k=O.normalized,J=O.itemSize,$=t.get(O);if($===void 0)continue;const rt=$.buffer,at=$.type,lt=$.bytesPerElement,W=at===i.INT||at===i.UNSIGNED_INT||O.gpuType===vc;if(O.isInterleavedBufferAttribute){const j=O.data,ot=j.stride,Dt=O.offset;if(j.isInstancedInterleavedBuffer){for(let St=0;St<D.locationSize;St++)m(D.location+St,j.meshPerAttribute);T.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let St=0;St<D.locationSize;St++)g(D.location+St);i.bindBuffer(i.ARRAY_BUFFER,rt);for(let St=0;St<D.locationSize;St++)y(D.location+St,J/D.locationSize,at,k,ot*lt,(Dt+J/D.locationSize*St)*lt,W)}else{if(O.isInstancedBufferAttribute){for(let j=0;j<D.locationSize;j++)m(D.location+j,O.meshPerAttribute);T.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=O.meshPerAttribute*O.count)}else for(let j=0;j<D.locationSize;j++)g(D.location+j);i.bindBuffer(i.ARRAY_BUFFER,rt);for(let j=0;j<D.locationSize;j++)y(D.location+j,J/D.locationSize,at,k,J*lt,J/D.locationSize*j*lt,W)}}else if(F!==void 0){const k=F[z];if(k!==void 0)switch(k.length){case 2:i.vertexAttrib2fv(D.location,k);break;case 3:i.vertexAttrib3fv(D.location,k);break;case 4:i.vertexAttrib4fv(D.location,k);break;default:i.vertexAttrib1fv(D.location,k)}}}}x()}function E(){w();for(const T in n){const L=n[T];for(const N in L){const P=L[N];for(const C in P){const U=P[C];for(const F in U)h(U[F].object),delete U[F];delete P[C]}}delete n[T]}}function S(T){if(n[T.id]===void 0)return;const L=n[T.id];for(const N in L){const P=L[N];for(const C in P){const U=P[C];for(const F in U)h(U[F].object),delete U[F];delete P[C]}}delete n[T.id]}function b(T){for(const L in n){const N=n[L];for(const P in N){const C=N[P];if(C[T.id]===void 0)continue;const U=C[T.id];for(const F in U)h(U[F].object),delete U[F];delete C[T.id]}}}function M(T){for(const L in n){const N=n[L],P=T.isInstancedMesh===!0?T.id:0,C=N[P];if(C!==void 0){for(const U in C){const F=C[U];for(const z in F)h(F[z].object),delete F[z];delete C[U]}delete N[P],Object.keys(N).length===0&&delete n[L]}}}function w(){A(),a=!0,s!==r&&(s=r,l(s.object))}function A(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:w,resetDefaultState:A,dispose:E,releaseStatesOfGeometry:S,releaseStatesOfObject:M,releaseStatesOfProgram:b,initAttributes:_,enableAttribute:g,disableUnusedAttributes:x}}function F0(i,t,e){let n;function r(c){n=c}function s(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function a(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),e.update(l,n,h))}function o(c,l,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let f=0;for(let u=0;u<h;u++)f+=l[u];e.update(f,n,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function O0(i,t,e,n){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const b=t.get("EXT_texture_filter_anisotropic");r=i.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(b){return!(b!==un&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(b){const M=b===In&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(b!==Je&&b!==ln&&!M&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(b){if(b==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";b="mediump"}return b==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const h=c(l);h!==l&&(Lt("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const p=e.logarithmicDepthBuffer===!0,f=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&f===!1&&Lt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),E=i.getParameter(i.MAX_SAMPLES),S=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:p,reversedDepthBuffer:f,maxTextures:u,maxVertexTextures:d,maxTextureSize:_,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:x,maxVaryings:y,maxFragmentUniforms:v,maxSamples:E,samples:S}}function B0(i){const t=this;let e=null,n=0,r=!1,s=!1;const a=new hi,o=new Ut,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(p,f){const u=p.length!==0||f||n!==0||r;return r=f,n=p.length,u},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,f){e=h(p,f,0)},this.setState=function(p,f,u){const d=p.clippingPlanes,_=p.clipIntersection,g=p.clipShadows,m=i.get(p);if(!r||d===null||d.length===0||s&&!g)s?h(null):l();else{const x=s?0:n,y=x*4;let v=m.clippingState||null;c.value=v,v=h(d,f,y,u);for(let E=0;E!==y;++E)v[E]=e[E];m.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(p,f,u,d){const _=p!==null?p.length:0;let g=null;if(_!==0){if(g=c.value,d!==!0||g===null){const m=u+_*4,x=f.matrixWorldInverse;o.getNormalMatrix(x),(g===null||g.length<m)&&(g=new Float32Array(m));for(let y=0,v=u;y!==_;++y,v+=4)a.copy(p[y]).applyMatrix4(x,o),a.normal.toArray(g,v),g[v+3]=a.constant}c.value=g,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,g}}const cr=4,z0=6,k0=20,G0=256,Pr=new dr,Ll=new Wt;let Wa=null,Xa=0,$a=0,qa=!1;const H0=new K,Mi=new K;class Dl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,r=100,s={}){const{size:a=256,position:o=H0}=s;Wa=this._renderer.getRenderTarget(),Xa=this._renderer.getActiveCubeFace(),$a=this._renderer.getActiveMipmapLevel(),qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,r,c,o),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Fl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ul(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Wa,Xa,$a),this._renderer.xr.enabled=qa,t.scissorTest=!1,Qi(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ii||t.mapping===_r?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Wa=this._renderer.getRenderTarget(),Xa=this._renderer.getActiveCubeFace(),$a=this._renderer.getActiveMipmapLevel(),qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Fe,minFilter:Fe,generateMipmaps:!1,type:In,format:un,colorSpace:Qs,depthBuffer:!1},r=Nl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Nl(t,e,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=V0(s)),this._blurMaterial=X0(s,t,e),this._ggxMaterial=W0(s,t,e)}return r}_compileMaterial(t){const e=new tn(new jn,t);this._renderer.compile(e,Pr)}_sceneToCubeUV(t,e,n,r,s){const c=new Me(90,1,e,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],p=this._renderer,f=p.autoClear,u=p.toneMapping;p.getClearColor(Ll),p.toneMapping=Cn,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new tn(new rs,new Pf({name:"PMREM.Background",side:$e,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,g=_.material;let m=!1;const x=t.background;x?x.isColor&&(g.color.copy(x),t.background=null,m=!0):(g.color.copy(Ll),m=!0);for(let y=0;y<6;y++){const v=y%3;v===0?(c.up.set(0,l[y],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+h[y],s.y,s.z)):v===1?(c.up.set(0,0,l[y]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+h[y],s.z)):(c.up.set(0,l[y],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+h[y]));const E=this._cubeSize;Qi(r,v*E,y>2?E:0,E,E),p.setRenderTarget(r),m&&p.render(_,c),p.render(t,c)}p.toneMapping=u,p.autoClear=f,t.background=x}_textureToCubeUV(t,e){const n=this._renderer,r=t.mapping===Ii||t.mapping===_r;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Fl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ul());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=t;const c=this._cubeSize;Qi(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,Pr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(t,s-1,s);e.autoClear=n}_applyGGXFilter(t,e,n){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const c=a.uniforms,l=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),p=Math.sqrt(l*l-h*h),f=l*1.25,u=p*f,{_lodMax:d}=this,_=this._sizeLods[n],g=3*_*(n>d-cr?n-d+cr:0),m=4*(this._cubeSize-_);c.envMap.value=t.texture,c.roughness.value=u,c.mipInt.value=d-e,Qi(s,g,m,3*_,2*_),r.setRenderTarget(s),r.render(o,Pr),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=d-n,Qi(t,g,m,3*_,2*_),r.setRenderTarget(t),r.render(o,Pr)}_blur(t,e,n,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(t,s,e,n,a),this._blurPass(s,t,n,n,a)}_blurPass(t,e,n,r,s){const a=this._renderer,o=this._blurMaterial,c=this._lodMeshes[r];c.material=o;const l=o.uniforms;l.envMap.value=t.texture,l.sigma.value=s,l.mipInt.value=this._lodMax-n;const h=this._sizeLods[r],p=3*h*(r>this._lodMax-cr?r-this._lodMax+cr:0),f=4*(this._cubeSize-h);Qi(e,p,f,3*h,2*h),a.setRenderTarget(e),a.render(c,Pr)}}function V0(i){const t=[],e=[];let n=i;const r=i-cr+1+z0;for(let s=0;s<r;s++){const a=Math.pow(2,n);t.push(a);const o=1/(a-2),c=-o,l=1+o,h=[c,c,l,c,l,l,c,c,l,l,c,l],p=6,f=6,u=3,d=new Float32Array(u*f*p),_=new Float32Array(u*f*p);for(let m=0;m<p;m++){const x=m%3*2/3-1,y=m>2?0:-1,v=[x,y,0,x+2/3,y,0,x+2/3,y+1,0,x,y,0,x+2/3,y+1,0,x,y+1,0];d.set(v,u*f*m);for(let E=0;E<f;E++){const S=h[E*2]*2-1,b=h[E*2+1]*2-1;m===0?Mi.set(1,b,S):m===1?Mi.set(-S,1,-b):m===2?Mi.set(-S,b,1):m===3?Mi.set(-1,b,-S):m===4?Mi.set(-S,-1,b):Mi.set(S,b,-1),Mi.toArray(_,(m*f+E)*u)}}const g=new jn;g.setAttribute("position",new fn(d,u)),g.setAttribute("outputDirection",new fn(_,u)),e.push(new tn(g,null)),n>cr&&n--}return{lodMeshes:e,sizeLods:t}}function Nl(i,t,e){const n=new xn(i,t,e);return n.texture.mapping=ca,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Qi(i,t,e,n,r){i.viewport.set(t,e,n,r),i.scissor.set(t,e,n,r)}function W0(i,t,e){return new Ln({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:G0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:fa(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function X0(i,t,e){return new Ln({name:"SphericalGaussianBlur",defines:{SAMPLES:k0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:fa(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Ul(){return new Ln({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:fa(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Fl(){return new Ln({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:fa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:qn,depthTest:!1,depthWrite:!1})}function fa(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Bf extends xn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},r=[n,n,n,n,n,n];this.texture=new Lf(r),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new rs(5,5,5),s=new Ln({name:"CubemapFromEquirect",uniforms:xr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:$e,blending:qn});s.uniforms.tEquirect.value=e;const a=new tn(r,s),o=e.minFilter;return e.minFilter===wi&&(e.minFilter=Fe),new Kd(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,r=!0){const s=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,r);t.setRenderTarget(s)}}function $0(i){let t=new WeakMap,e=new WeakMap,n=null;function r(f,u=!1){return f==null?null:u?a(f):s(f)}function s(f){if(f&&f.isTexture){const u=f.mapping;if(u===ga||u===_a)if(t.has(f)){const d=t.get(f).texture;return o(d,f.mapping)}else{const d=f.image;if(d&&d.height>0){const _=new Bf(d.height);return _.fromEquirectangularTexture(i,f),t.set(f,_),f.addEventListener("dispose",l),o(_.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){const u=f.mapping,d=u===ga||u===_a,_=u===Ii||u===_r;if(d||_){let g=e.get(f);const m=g!==void 0?g.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==m)return n===null&&(n=new Dl(i)),g=d?n.fromEquirectangular(f,g):n.fromCubemap(f,g),g.texture.pmremVersion=f.pmremVersion,e.set(f,g),g.texture;if(g!==void 0)return g.texture;{const x=f.image;return d&&x&&x.height>0||_&&x&&c(x)?(n===null&&(n=new Dl(i)),g=d?n.fromEquirectangular(f):n.fromCubemap(f),g.texture.pmremVersion=f.pmremVersion,e.set(f,g),f.addEventListener("dispose",h),g.texture):null}}}return f}function o(f,u){return u===ga?f.mapping=Ii:u===_a&&(f.mapping=_r),f}function c(f){let u=0;const d=6;for(let _=0;_<d;_++)f[_]!==void 0&&u++;return u===d}function l(f){const u=f.target;u.removeEventListener("dispose",l);const d=t.get(u);d!==void 0&&(t.delete(u),d.dispose())}function h(f){const u=f.target;u.removeEventListener("dispose",h);const d=e.get(u);d!==void 0&&(e.delete(u),d.dispose())}function p(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:p}}function q0(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const r=i.getExtension(n);return t[n]=r,r}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const r=e(n);return r===null&&fr("WebGLRenderer: "+n+" extension not supported."),r}}}function Y0(i,t,e,n){const r={},s=new WeakMap;function a(p){const f=p.target;f.index!==null&&t.remove(f.index);for(const d in f.attributes)t.remove(f.attributes[d]);f.removeEventListener("dispose",a),delete r[f.id];const u=s.get(f);u&&(t.remove(u),s.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function o(p,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,e.memory.geometries++),f}function c(p){const f=p.attributes;for(const u in f)t.update(f[u],i.ARRAY_BUFFER)}function l(p){const f=[],u=p.index,d=p.attributes.position;let _=0;if(d===void 0)return;if(u!==null){const x=u.array;_=u.version;for(let y=0,v=x.length;y<v;y+=3){const E=x[y+0],S=x[y+1],b=x[y+2];f.push(E,S,S,b,b,E)}}else{const x=d.array;_=d.version;for(let y=0,v=x.length/3-1;y<v;y+=3){const E=y+0,S=y+1,b=y+2;f.push(E,S,S,b,b,E)}}const g=new(d.count>=65535?Rf:Af)(f,1);g.version=_;const m=s.get(p);m&&t.remove(m),s.set(p,g)}function h(p){const f=s.get(p);if(f){const u=p.index;u!==null&&f.version<u.version&&l(p)}else l(p);return s.get(p)}return{get:o,update:c,getWireframeAttribute:h}}function K0(i,t,e){let n;function r(p){n=p}let s,a;function o(p){s=p.type,a=p.bytesPerElement}function c(p,f){i.drawElements(n,f,s,p*a),e.update(f,n,1)}function l(p,f,u){u!==0&&(i.drawElementsInstanced(n,f,s,p*a,u),e.update(f,n,u))}function h(p,f,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,p,0,u);let _=0;for(let g=0;g<u;g++)_+=f[g];e.update(_,n,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function Z0(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(s/3);break;case i.LINES:e.lines+=o*(s/2);break;case i.LINE_STRIP:e.lines+=o*(s-1);break;case i.LINE_LOOP:e.lines+=o*s;break;case i.POINTS:e.points+=o*s;break;default:jt("WebGLInfo: Unknown draw mode:",a);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:n}}function J0(i,t,e){const n=new WeakMap,r=new Yt;function s(a,o,c){const l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0;let f=n.get(o);if(f===void 0||f.count!==p){let w=function(){b.dispose(),n.delete(o),o.removeEventListener("dispose",w)};f!==void 0&&f.texture.dispose();const u=o.morphAttributes.position!==void 0,d=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],x=o.morphAttributes.color||[];let y=0;u===!0&&(y=1),d===!0&&(y=2),_===!0&&(y=3);let v=o.attributes.position.count*y,E=1;v>t.maxTextureSize&&(E=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);const S=new Float32Array(v*E*4*p),b=new bf(S,v,E,p);b.type=ln,b.needsUpdate=!0;const M=y*4;for(let A=0;A<p;A++){const T=g[A],L=m[A],N=x[A],P=v*E*4*A;for(let C=0;C<T.count;C++){const U=C*M;u===!0&&(r.fromBufferAttribute(T,C),S[P+U+0]=r.x,S[P+U+1]=r.y,S[P+U+2]=r.z,S[P+U+3]=0),d===!0&&(r.fromBufferAttribute(L,C),S[P+U+4]=r.x,S[P+U+5]=r.y,S[P+U+6]=r.z,S[P+U+7]=0),_===!0&&(r.fromBufferAttribute(N,C),S[P+U+8]=r.x,S[P+U+9]=r.y,S[P+U+10]=r.z,S[P+U+11]=N.itemSize===4?r.w:1)}}f={count:p,texture:b,size:new $t(v,E)},n.set(o,f),o.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let u=0;for(let _=0;_<l.length;_++)u+=l[_];const d=o.morphTargetsRelative?1:1-u;c.getUniforms().setValue(i,"morphTargetBaseInfluence",d),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:s}}function Q0(i,t,e,n,r){let s=new WeakMap;function a(l){const h=r.render.frame,p=l.geometry,f=t.get(l,p);if(s.get(f)!==h&&(t.update(f),s.set(f,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==h&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){const u=l.skeleton;s.get(u)!==h&&(u.update(),s.set(u,h))}return f}function o(){s=new WeakMap}function c(l){const h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}const j0={[lf]:"LINEAR_TONE_MAPPING",[uf]:"REINHARD_TONE_MAPPING",[ff]:"CINEON_TONE_MAPPING",[hf]:"ACES_FILMIC_TONE_MAPPING",[pf]:"AGX_TONE_MAPPING",[mf]:"NEUTRAL_TONE_MAPPING",[df]:"CUSTOM_TONE_MAPPING"};function tg(i,t,e,n,r,s){const a=new xn(t,e,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null;const l=new jn;l.setAttribute("position",new Kn([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new Kn([0,2,0,0,2,0],2));const h=new zd({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),p=new tn(l,h),f=new dr(-1,1,1,-1,0,1);let u=null,d=null,_=!1,g,m=null,x=[],y=!1;this.setSize=function(v,E){a.setSize(v,E),o!==null&&o.setSize(v,E),c!==null&&c.setSize(v,E);for(let S=0;S<x.length;S++){const b=x[S];b.setSize&&b.setSize(v,E)}},this.setEffects=function(v){x=v,y=x.length>0&&x[0].isRenderPass===!0;const E=a.width,S=a.height;x.length>0&&o===null&&(o=new xn(E,S,{type:In,depthBuffer:!1,stencilBuffer:!1}),c=new xn(E,S,{type:In,depthBuffer:!1,stencilBuffer:!1}));for(let b=0;b<x.length;b++){const M=x[b];M.setSize&&M.setSize(E,S)}},this.begin=function(v,E){if(_||v.toneMapping===Cn&&x.length===0)return!1;if(m=E,E!==null){const S=E.width,b=E.height;(a.width!==S||a.height!==b)&&this.setSize(S,b)}return y===!1&&v.setRenderTarget(a),g=v.toneMapping,v.toneMapping=Cn,!0},this.hasRenderPass=function(){return y},this.end=function(v,E){v.toneMapping=g,_=!0;let S=a,b=o;for(let M=0;M<x.length;M++){const w=x[M];w.enabled!==!1&&(w.render(v,b,S,E),w.needsSwap!==!1&&(S=b,b=b===o?c:o))}if(u!==v.outputColorSpace||d!==v.toneMapping){u=v.outputColorSpace,d=v.toneMapping,h.defines={},qt.getTransfer(u)===re&&(h.defines.SRGB_TRANSFER="");const M=j0[d];M&&(h.defines[M]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=S.texture,v.setRenderTarget(m),v.render(p,f),m=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}const zf=new Oe,nc=new Jr(1,1),kf=new bf,Gf=new ud,Hf=new Lf,Ol=[],Bl=[],zl=new Float32Array(16),kl=new Float32Array(9),Gl=new Float32Array(4);function yr(i,t,e){const n=i[0];if(n<=0||n>0)return i;const r=t*e;let s=Ol[r];if(s===void 0&&(s=new Float32Array(r),Ol[r]=s),t!==0){n.toArray(s,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(s,o)}return s}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function be(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ha(i,t){let e=Bl[t];e===void 0&&(e=new Int32Array(t),Bl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function eg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function ng(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),be(e,t)}}function ig(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),be(e,t)}}function rg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),be(e,t)}}function sg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;Gl.set(n),i.uniformMatrix2fv(this.addr,!1,Gl),be(e,n)}}function ag(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;kl.set(n),i.uniformMatrix3fv(this.addr,!1,kl),be(e,n)}}function og(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;zl.set(n),i.uniformMatrix4fv(this.addr,!1,zl),be(e,n)}}function cg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function lg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),be(e,t)}}function ug(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),be(e,t)}}function fg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),be(e,t)}}function hg(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function dg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),be(e,t)}}function pg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),be(e,t)}}function mg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),be(e,t)}}function gg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(nc.compareFunction=e.isReversedDepthBuffer()?Tc:wc,s=nc):s=zf,e.setTexture2D(t||s,r)}function _g(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture3D(t||Gf,r)}function vg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTextureCube(t||Hf,r)}function xg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture2DArray(t||kf,r)}function Sg(i){switch(i){case 5126:return eg;case 35664:return ng;case 35665:return ig;case 35666:return rg;case 35674:return sg;case 35675:return ag;case 35676:return og;case 5124:case 35670:return cg;case 35667:case 35671:return lg;case 35668:case 35672:return ug;case 35669:case 35673:return fg;case 5125:return hg;case 36294:return dg;case 36295:return pg;case 36296:return mg;case 35678:case 36198:case 36298:case 36306:case 35682:return gg;case 35679:case 36299:case 36307:return _g;case 35680:case 36300:case 36308:case 36293:return vg;case 36289:case 36303:case 36311:case 36292:return xg}}function Mg(i,t){i.uniform1fv(this.addr,t)}function yg(i,t){const e=yr(t,this.size,2);i.uniform2fv(this.addr,e)}function Eg(i,t){const e=yr(t,this.size,3);i.uniform3fv(this.addr,e)}function bg(i,t){const e=yr(t,this.size,4);i.uniform4fv(this.addr,e)}function wg(i,t){const e=yr(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Tg(i,t){const e=yr(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Ag(i,t){const e=yr(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Rg(i,t){i.uniform1iv(this.addr,t)}function Cg(i,t){i.uniform2iv(this.addr,t)}function Pg(i,t){i.uniform3iv(this.addr,t)}function Ig(i,t){i.uniform4iv(this.addr,t)}function Lg(i,t){i.uniform1uiv(this.addr,t)}function Dg(i,t){i.uniform2uiv(this.addr,t)}function Ng(i,t){i.uniform3uiv(this.addr,t)}function Ug(i,t){i.uniform4uiv(this.addr,t)}function Fg(i,t,e){const n=this.cache,r=t.length,s=ha(e,r);Ee(n,s)||(i.uniform1iv(this.addr,s),be(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=nc:a=zf;for(let o=0;o!==r;++o)e.setTexture2D(t[o]||a,s[o])}function Og(i,t,e){const n=this.cache,r=t.length,s=ha(e,r);Ee(n,s)||(i.uniform1iv(this.addr,s),be(n,s));for(let a=0;a!==r;++a)e.setTexture3D(t[a]||Gf,s[a])}function Bg(i,t,e){const n=this.cache,r=t.length,s=ha(e,r);Ee(n,s)||(i.uniform1iv(this.addr,s),be(n,s));for(let a=0;a!==r;++a)e.setTextureCube(t[a]||Hf,s[a])}function zg(i,t,e){const n=this.cache,r=t.length,s=ha(e,r);Ee(n,s)||(i.uniform1iv(this.addr,s),be(n,s));for(let a=0;a!==r;++a)e.setTexture2DArray(t[a]||kf,s[a])}function kg(i){switch(i){case 5126:return Mg;case 35664:return yg;case 35665:return Eg;case 35666:return bg;case 35674:return wg;case 35675:return Tg;case 35676:return Ag;case 5124:case 35670:return Rg;case 35667:case 35671:return Cg;case 35668:case 35672:return Pg;case 35669:case 35673:return Ig;case 5125:return Lg;case 36294:return Dg;case 36295:return Ng;case 36296:return Ug;case 35678:case 36198:case 36298:case 36306:case 35682:return Fg;case 35679:case 36299:case 36307:return Og;case 35680:case 36300:case 36308:case 36293:return Bg;case 36289:case 36303:case 36311:case 36292:return zg}}class Gg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Sg(e.type)}}class Hg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=kg(e.type)}}class Vg{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(t,e[o.id],n)}}}const Ya=/(\w+)(\])?(\[|\.)?/g;function Hl(i,t){i.seq.push(t),i.map[t.id]=t}function Wg(i,t,e){const n=i.name,r=n.length;for(Ya.lastIndex=0;;){const s=Ya.exec(n),a=Ya.lastIndex;let o=s[1];const c=s[2]==="]",l=s[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===r){Hl(e,l===void 0?new Gg(o,i,t):new Hg(o,i,t));break}else{let p=e.map[o];p===void 0&&(p=new Vg(o),Hl(e,p)),e=p}}}class Ys{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);Wg(o,c,this)}const r=[],s=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(t,e,n,r){const s=this.map[e];s!==void 0&&s.setValue(t,n,r)}setOptional(t,e,n){const r=e[n];r!==void 0&&this.setValue(t,n,r)}static upload(t,e,n,r){for(let s=0,a=e.length;s!==a;++s){const o=e[s],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,r)}}static seqWithValue(t,e){const n=[];for(let r=0,s=t.length;r!==s;++r){const a=t[r];a.id in e&&n.push(a)}return n}}function Vl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Xg=37297;let $g=0;function qg(i,t){const e=i.split(`
`),n=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const Wl=new Ut;function Yg(i){qt._getMatrix(Wl,qt.workingColorSpace,i);const t=`mat3( ${Wl.elements.map(e=>e.toFixed(4))} )`;switch(qt.getTransfer(i)){case js:return[t,"LinearTransferOETF"];case re:return[t,"sRGBTransferOETF"];default:return Lt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Xl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=(i.getShaderInfoLog(t)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+s+`

`+qg(i.getShaderSource(t),o)}else return s}function Kg(i,t){const e=Yg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const Zg={[lf]:"Linear",[uf]:"Reinhard",[ff]:"Cineon",[hf]:"ACESFilmic",[pf]:"AgX",[mf]:"Neutral",[df]:"Custom"};function Jg(i,t){const e=Zg[t];return e===void 0?(Lt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Is=new K;function Qg(){qt.getLuminanceCoefficients(Is);const i=Is.x.toFixed(4),t=Is.y.toFixed(4),e=Is.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function jg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(kr).join(`
`)}function t_(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function e_(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(t,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),e[a]={type:s.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function kr(i){return i!==""}function $l(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ql(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const n_=/^[ \t]*#include +<([\w\d./]+)>/gm;function ic(i){return i.replace(n_,r_)}const i_=new Map;function r_(i,t){let e=kt[t];if(e===void 0){const n=i_.get(t);if(n!==void 0)e=kt[n],Lt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return ic(e)}const s_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Yl(i){return i.replace(s_,a_)}function a_(i,t,e,n){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Kl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const o_={[Hs]:"SHADOWMAP_TYPE_PCF",[zr]:"SHADOWMAP_TYPE_VSM"};function c_(i){return o_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const l_={[Ii]:"ENVMAP_TYPE_CUBE",[_r]:"ENVMAP_TYPE_CUBE",[ca]:"ENVMAP_TYPE_CUBE_UV"};function u_(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":l_[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const f_={[_r]:"ENVMAP_MODE_REFRACTION"};function h_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":f_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const d_={[cf]:"ENVMAP_BLENDING_MULTIPLY",[wh]:"ENVMAP_BLENDING_MIX",[Th]:"ENVMAP_BLENDING_ADD"};function p_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":d_[i.combine]||"ENVMAP_BLENDING_NONE"}function m_(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function g_(i,t,e,n){const r=i.getContext(),s=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=c_(e),l=u_(e),h=h_(e),p=p_(e),f=m_(e),u=jg(e),d=t_(s),_=r.createProgram();let g,m,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(kr).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(kr).join(`
`),m.length>0&&(m+=`
`)):(g=[Kl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(kr).join(`
`),m=[Kl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+p:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Cn?"#define TONE_MAPPING":"",e.toneMapping!==Cn?kt.tonemapping_pars_fragment:"",e.toneMapping!==Cn?Jg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",kt.colorspace_pars_fragment,Kg("linearToOutputTexel",e.outputColorSpace),Qg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(kr).join(`
`)),a=ic(a),a=$l(a,e),a=ql(a,e),o=ic(o),o=$l(o,e),o=ql(o,e),a=Yl(a),o=Yl(o),e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,g=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",e.glslVersion===jc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===jc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=x+g+a,v=x+m+o,E=Vl(r,r.VERTEX_SHADER,y),S=Vl(r,r.FRAGMENT_SHADER,v);r.attachShader(_,E),r.attachShader(_,S),e.index0AttributeName!==void 0?r.bindAttribLocation(_,0,e.index0AttributeName):e.hasPositionAttribute===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function b(T){if(i.debug.checkShaderErrors){const L=r.getProgramInfoLog(_)||"",N=r.getShaderInfoLog(E)||"",P=r.getShaderInfoLog(S)||"",C=L.trim(),U=N.trim(),F=P.trim();let z=!0,D=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,_,E,S);else{const O=Xl(r,E,"vertex"),k=Xl(r,S,"fragment");jt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+T.name+`
Material Type: `+T.type+`

Program Info Log: `+C+`
`+O+`
`+k)}else C!==""?Lt("WebGLProgram: Program Info Log:",C):(U===""||F==="")&&(D=!1);D&&(T.diagnostics={runnable:z,programLog:C,vertexShader:{log:U,prefix:g},fragmentShader:{log:F,prefix:m}})}r.deleteShader(E),r.deleteShader(S),M=new Ys(r,_),w=e_(r,_)}let M;this.getUniforms=function(){return M===void 0&&b(this),M};let w;this.getAttributes=function(){return w===void 0&&b(this),w};let A=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return A===!1&&(A=r.getProgramParameter(_,Xg)),A},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=$g++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=E,this.fragmentShader=S,this}let __=0;class v_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const r=this._getShaderCacheForMaterial(t);return r.has(e)===!1&&(r.add(e),e.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new x_(t),e.set(t,n)),n}}class x_{constructor(t){this.id=__++,this.code=t,this.usedTimes=0}}function S_(i){return i===Li||i===Zs||i===Js}function M_(i,t,e,n,r,s){const a=new wf,o=new v_,c=new Set,l=[],h=new Map,p=n.logarithmicDepthBuffer;let f=n.precision;const u={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(M){return c.add(M),M===0?"uv":`uv${M}`}function _(M,w,A,T,L,N){const P=T.fog,C=L.geometry,U=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?T.environment:null,F=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,z=t.get(M.envMap||U,F),D=z&&z.mapping===ca?z.image.height:null,O=u[M.type];M.precision!==null&&(f=n.getMaxPrecision(M.precision),f!==M.precision&&Lt("WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));const k=C.morphAttributes.position||C.morphAttributes.normal||C.morphAttributes.color,J=k!==void 0?k.length:0;let $=0;C.morphAttributes.position!==void 0&&($=1),C.morphAttributes.normal!==void 0&&($=2),C.morphAttributes.color!==void 0&&($=3);let rt,at,lt,W;if(O){const le=An[O];rt=le.vertexShader,at=le.fragmentShader}else{rt=M.vertexShader,at=M.fragmentShader;const le=o.getVertexShaderStage(M),ee=o.getFragmentShaderStage(M);o.update(M,le,ee),lt=le.id,W=ee.id}const j=i.getRenderTarget(),ot=i.state.buffers.depth.getReversed(),Dt=L.isInstancedMesh===!0,St=L.isBatchedMesh===!0,Bt=!!M.map,te=!!M.matcap,Nt=!!z,Qt=!!M.aoMap,ce=!!M.lightMap,Xt=!!M.bumpMap&&M.wireframe===!1,he=!!M.normalMap,we=!!M.displacementMap,He=!!M.emissiveMap,pe=!!M.metalnessMap,ge=!!M.roughnessMap,V=M.anisotropy>0,Ie=M.clearcoat>0,ie=M.dispersion>0,B=M.retroreflectivity>0,R=M.iridescence>0,X=M.sheen>0,Z=M.transmission>0,tt=V&&!!M.anisotropyMap,ct=Ie&&!!M.clearcoatMap,ut=Ie&&!!M.clearcoatNormalMap,et=Ie&&!!M.clearcoatRoughnessMap,it=R&&!!M.iridescenceMap,ft=R&&!!M.iridescenceThicknessMap,Rt=X&&!!M.sheenColorMap,mt=X&&!!M.sheenRoughnessMap,ht=!!M.specularMap,Ct=!!M.specularColorMap,It=!!M.specularIntensityMap,Ft=Z&&!!M.transmissionMap,H=Z&&!!M.thicknessMap,dt=!!M.gradientMap,nt=!!M.alphaMap,pt=M.alphaTest>0,xt=!!M.alphaHash,st=!!M.extensions;let Pt=Cn;M.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Pt=i.toneMapping);const Tt={shaderID:O,shaderType:M.type,shaderName:M.name,vertexShader:rt,fragmentShader:at,defines:M.defines,customVertexShaderID:lt,customFragmentShaderID:W,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:St,batchingColor:St&&L._colorsTexture!==null,instancing:Dt,instancingColor:Dt&&L.instanceColor!==null,instancingMorph:Dt&&L.morphTexture!==null,outputColorSpace:j===null?i.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:qt.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Bt,matcap:te,envMap:Nt,envMapMode:Nt&&z.mapping,envMapCubeUVHeight:D,aoMap:Qt,lightMap:ce,bumpMap:Xt,normalMap:he,displacementMap:we,emissiveMap:He,normalMapObjectSpace:he&&M.normalMapType===Ph,normalMapTangentSpace:he&&M.normalMapType===ec,packedNormalMap:he&&M.normalMapType===ec&&S_(M.normalMap.format),metalnessMap:pe,roughnessMap:ge,anisotropy:V,anisotropyMap:tt,clearcoat:Ie,clearcoatMap:ct,clearcoatNormalMap:ut,clearcoatRoughnessMap:et,dispersion:ie,retroreflection:B,iridescence:R,iridescenceMap:it,iridescenceThicknessMap:ft,sheen:X,sheenColorMap:Rt,sheenRoughnessMap:mt,specularMap:ht,specularColorMap:Ct,specularIntensityMap:It,transmission:Z,transmissionMap:Ft,thicknessMap:H,gradientMap:dt,opaque:M.transparent===!1&&M.blending===Hr&&M.alphaToCoverage===!1,alphaMap:nt,alphaTest:pt,alphaHash:xt,combine:M.combine,mapUv:Bt&&d(M.map.channel),aoMapUv:Qt&&d(M.aoMap.channel),lightMapUv:ce&&d(M.lightMap.channel),bumpMapUv:Xt&&d(M.bumpMap.channel),normalMapUv:he&&d(M.normalMap.channel),displacementMapUv:we&&d(M.displacementMap.channel),emissiveMapUv:He&&d(M.emissiveMap.channel),metalnessMapUv:pe&&d(M.metalnessMap.channel),roughnessMapUv:ge&&d(M.roughnessMap.channel),anisotropyMapUv:tt&&d(M.anisotropyMap.channel),clearcoatMapUv:ct&&d(M.clearcoatMap.channel),clearcoatNormalMapUv:ut&&d(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:et&&d(M.clearcoatRoughnessMap.channel),iridescenceMapUv:it&&d(M.iridescenceMap.channel),iridescenceThicknessMapUv:ft&&d(M.iridescenceThicknessMap.channel),sheenColorMapUv:Rt&&d(M.sheenColorMap.channel),sheenRoughnessMapUv:mt&&d(M.sheenRoughnessMap.channel),specularMapUv:ht&&d(M.specularMap.channel),specularColorMapUv:Ct&&d(M.specularColorMap.channel),specularIntensityMapUv:It&&d(M.specularIntensityMap.channel),transmissionMapUv:Ft&&d(M.transmissionMap.channel),thicknessMapUv:H&&d(M.thicknessMap.channel),alphaMapUv:nt&&d(M.alphaMap.channel),vertexTangents:!!C.attributes.tangent&&(he||V),vertexNormals:!!C.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!C.attributes.color&&C.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!C.attributes.uv&&(Bt||nt),fog:!!P,useFog:M.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||C.attributes.normal===void 0&&he===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:ot,skinning:L.isSkinnedMesh===!0,hasPositionAttribute:C.attributes.position!==void 0,morphTargets:C.morphAttributes.position!==void 0,morphNormals:C.morphAttributes.normal!==void 0,morphColors:C.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:$,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:N.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&A.length>0,shadowMapType:i.shadowMap.type,toneMapping:Pt,decodeVideoTexture:Bt&&M.map.isVideoTexture===!0&&qt.getTransfer(M.map.colorSpace)===re,decodeVideoTextureEmissive:He&&M.emissiveMap.isVideoTexture===!0&&qt.getTransfer(M.emissiveMap.colorSpace)===re,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Wn,flipSided:M.side===$e,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:st&&M.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(st&&M.extensions.multiDraw===!0||St)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Tt.vertexUv1s=c.has(1),Tt.vertexUv2s=c.has(2),Tt.vertexUv3s=c.has(3),c.clear(),Tt}function g(M){const w=[];if(M.shaderID?w.push(M.shaderID):(w.push(M.customVertexShaderID),w.push(M.customFragmentShaderID)),M.defines!==void 0)for(const A in M.defines)w.push(A),w.push(M.defines[A]);return M.isRawShaderMaterial===!1&&(m(w,M),x(w,M),w.push(i.outputColorSpace)),w.push(M.customProgramCacheKey),w.join()}function m(M,w){M.push(w.precision),M.push(w.outputColorSpace),M.push(w.envMapMode),M.push(w.envMapCubeUVHeight),M.push(w.mapUv),M.push(w.alphaMapUv),M.push(w.lightMapUv),M.push(w.aoMapUv),M.push(w.bumpMapUv),M.push(w.normalMapUv),M.push(w.displacementMapUv),M.push(w.emissiveMapUv),M.push(w.metalnessMapUv),M.push(w.roughnessMapUv),M.push(w.anisotropyMapUv),M.push(w.clearcoatMapUv),M.push(w.clearcoatNormalMapUv),M.push(w.clearcoatRoughnessMapUv),M.push(w.iridescenceMapUv),M.push(w.iridescenceThicknessMapUv),M.push(w.sheenColorMapUv),M.push(w.sheenRoughnessMapUv),M.push(w.specularMapUv),M.push(w.specularColorMapUv),M.push(w.specularIntensityMapUv),M.push(w.transmissionMapUv),M.push(w.thicknessMapUv),M.push(w.combine),M.push(w.fogExp2),M.push(w.sizeAttenuation),M.push(w.morphTargetsCount),M.push(w.morphAttributeCount),M.push(w.numSunLights),M.push(w.numDirLights),M.push(w.numPointLights),M.push(w.numSpotLights),M.push(w.numSpotLightMaps),M.push(w.numHemiLights),M.push(w.numRectAreaLights),M.push(w.numSunLightShadows),M.push(w.numDirLightShadows),M.push(w.numPointLightShadows),M.push(w.numSpotLightShadows),M.push(w.numSpotLightShadowsWithMaps),M.push(w.numLightProbes),M.push(w.shadowMapType),M.push(w.toneMapping),M.push(w.numClippingPlanes),M.push(w.numClipIntersection),M.push(w.depthPacking)}function x(M,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.retroreflection&&a.enable(24),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),M.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),w.hasPositionAttribute&&a.enable(23),M.push(a.mask)}function y(M){const w=u[M.type];let A;if(w){const T=An[w];A=Fd.clone(T.uniforms)}else A=M.uniforms;return A}function v(M,w){let A=h.get(w);return A!==void 0?++A.usedTimes:(A=new g_(i,w,M,r),l.push(A),h.set(w,A)),A}function E(M){if(--M.usedTimes===0){const w=l.indexOf(M);l[w]=l[l.length-1],l.pop(),h.delete(M.cacheKey),M.destroy()}}function S(M){o.remove(M)}function b(){o.dispose()}return{getParameters:_,getProgramCacheKey:g,getUniforms:y,acquireProgram:v,releaseProgram:E,releaseShaderCache:S,programs:l,dispose:b}}function y_(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,c){i.get(a)[o]=c}function s(){i=new WeakMap}return{has:t,get:e,remove:n,update:r,dispose:s}}function E_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Zl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Jl(){const i=[];let t=0;const e=[],n=[],r=[];function s(){t=0,e.length=0,n.length=0,r.length=0}function a(f){let u=0;return f.isInstancedMesh&&(u+=2),f.isSkinnedMesh&&(u+=1),u}function o(f,u,d,_,g,m){let x=i[t];return x===void 0?(x={id:f.id,object:f,geometry:u,material:d,materialVariant:a(f),groupOrder:_,renderOrder:f.renderOrder,z:g,group:m},i[t]=x):(x.id=f.id,x.object=f,x.geometry=u,x.material=d,x.materialVariant=a(f),x.groupOrder=_,x.renderOrder=f.renderOrder,x.z=g,x.group=m),t++,x}function c(f,u,d,_,g,m,x){x.reversedDepth===!0&&(g=-g);const y=o(f,u,d,_,g,m);d.transmission>0?n.push(y):d.transparent===!0?r.push(y):e.push(y)}function l(f,u,d,_,g,m){const x=o(f,u,d,_,g,m);d.transmission>0?n.unshift(x):d.transparent===!0?r.unshift(x):e.unshift(x)}function h(f,u){e.length>1&&e.sort(f||E_),n.length>1&&n.sort(u||Zl),r.length>1&&r.sort(u||Zl)}function p(){for(let f=t,u=i.length;f<u;f++){const d=i[f];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:r,init:s,push:c,unshift:l,finish:p,sort:h}}function b_(){let i=new WeakMap;function t(n,r){const s=i.get(n);let a;return s===void 0?(a=new Jl,i.set(n,[a])):r>=s.length?(a=new Jl,s.push(a)):a=s[r],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function w_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new K,color:new Wt};break;case"SpotLight":e={position:new K,direction:new K,color:new Wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new K,color:new Wt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new K,skyColor:new Wt,groundColor:new Wt};break;case"RectAreaLight":e={color:new Wt,position:new K,halfWidth:new K,halfHeight:new K};break}return i[t.id]=e,e}}}function T_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $t};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $t};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $t,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let A_=0;function R_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function C_(i){const t=new w_,e=T_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new K);const r=new K,s=new Kt,a=new Kt;function o(l){let h=0,p=0,f=0;for(let L=0;L<9;L++)n.probe[L].set(0,0,0);let u=0,d=0,_=0,g=0,m=0,x=0,y=0,v=0,E=0,S=0,b=0,M=0,w=0,A=0;l.sort(R_);for(let L=0,N=l.length;L<N;L++){const P=l[L],C=P.color,U=P.intensity,F=P.distance;let z=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===Li?z=P.shadow.map.texture:z=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)h+=C.r*U,p+=C.g*U,f+=C.b*U;else if(P.isLightProbe){for(let D=0;D<9;D++)n.probe[D].addScaledVector(P.sh.coefficients[D],U);A++}else if(P.isSunLight){const D=t.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const O=P.shadow,k=e.get(P);k.shadowIntensity=O.intensity,k.shadowBias=O.bias,k.shadowNormalBias=O.normalBias,k.shadowRadius=O.radius,k.shadowMapSize.copy(O.mapSize).multiply(O.getFrameExtents()),n.sunShadow[d]=k,n.sunShadowMap[d]=z;const J=O.getViewportCount();for(let $=0;$<J;$++)n.sunShadowMatrix[_+$]=O.getMatrix($),n.sunShadowCascade[_+$]=O._cascadeData[$];_+=J,d++}n.sun[u]=D,u++}else if(P.isDirectionalLight){const D=t.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const O=P.shadow,k=e.get(P);k.shadowIntensity=O.intensity,k.shadowBias=O.bias,k.shadowNormalBias=O.normalBias,k.shadowRadius=O.radius,k.shadowMapSize=O.mapSize,n.directionalShadow[g]=k,n.directionalShadowMap[g]=z,n.directionalShadowMatrix[g]=P.shadow.matrix,E++}n.directional[g]=D,g++}else if(P.isSpotLight){const D=t.get(P);D.position.setFromMatrixPosition(P.matrixWorld),D.color.copy(C).multiplyScalar(U),D.distance=F,D.coneCos=Math.cos(P.angle),D.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),D.decay=P.decay,n.spot[x]=D;const O=P.shadow;if(P.map&&(n.spotLightMap[M]=P.map,M++,O.updateMatrices(P),P.castShadow&&w++),n.spotLightMatrix[x]=O.matrix,P.castShadow){const k=e.get(P);k.shadowIntensity=O.intensity,k.shadowBias=O.bias,k.shadowNormalBias=O.normalBias,k.shadowRadius=O.radius,k.shadowMapSize=O.mapSize,n.spotShadow[x]=k,n.spotShadowMap[x]=z,b++}x++}else if(P.isRectAreaLight){const D=t.get(P);D.color.copy(C).multiplyScalar(U),D.halfWidth.set(P.width*.5,0,0),D.halfHeight.set(0,P.height*.5,0),n.rectArea[y]=D,y++}else if(P.isPointLight){const D=t.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),D.distance=P.distance,D.decay=P.decay,P.castShadow){const O=P.shadow,k=e.get(P);k.shadowIntensity=O.intensity,k.shadowBias=O.bias,k.shadowNormalBias=O.normalBias,k.shadowRadius=O.radius,k.shadowMapSize=O.mapSize,k.shadowCameraNear=O.camera.near,k.shadowCameraFar=O.camera.far,n.pointShadow[m]=k,n.pointShadowMap[m]=z,n.pointShadowMatrix[m]=P.shadow.matrix,S++}n.point[m]=D,m++}else if(P.isHemisphereLight){const D=t.get(P);D.skyColor.copy(P.color).multiplyScalar(U),D.groundColor.copy(P.groundColor).multiplyScalar(U),n.hemi[v]=D,v++}}y>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=gt.LTC_FLOAT_1,n.rectAreaLTC2=gt.LTC_FLOAT_2):(n.rectAreaLTC1=gt.LTC_HALF_1,n.rectAreaLTC2=gt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=p,n.ambient[2]=f;const T=n.hash;(T.sunLength!==u||T.directionalLength!==g||T.pointLength!==m||T.spotLength!==x||T.rectAreaLength!==y||T.hemiLength!==v||T.numSunShadows!==d||T.numDirectionalShadows!==E||T.numPointShadows!==S||T.numSpotShadows!==b||T.numSpotMaps!==M||T.numLightProbes!==A)&&(n.sun.length=u,n.directional.length=g,n.spot.length=x,n.rectArea.length=y,n.point.length=m,n.hemi.length=v,n.sunShadow.length=d,n.sunShadowMap.length=d,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.directionalShadowMatrix.length=E,n.pointShadow.length=S,n.pointShadowMap.length=S,n.pointShadowMatrix.length=S,n.spotShadow.length=b,n.spotShadowMap.length=b,n.spotLightMatrix.length=b+M-w,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=A,T.sunLength=u,T.directionalLength=g,T.pointLength=m,T.spotLength=x,T.rectAreaLength=y,T.hemiLength=v,T.numSunShadows=d,T.numDirectionalShadows=E,T.numPointShadows=S,T.numSpotShadows=b,T.numSpotMaps=M,T.numLightProbes=A,n.version=A_++)}function c(l,h){let p=0,f=0,u=0,d=0,_=0,g=0;const m=h.matrixWorldInverse;for(let x=0,y=l.length;x<y;x++){const v=l[x];if(v.isSunLight){const E=n.sun[p];E.direction.setFromMatrixPosition(v.matrixWorld),E.direction.transformDirection(m),p++}else if(v.isDirectionalLight){const E=n.directional[f];E.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(m),f++}else if(v.isSpotLight){const E=n.spot[d];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(m),E.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(m),d++}else if(v.isRectAreaLight){const E=n.rectArea[_];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(m),a.identity(),s.copy(v.matrixWorld),s.premultiply(m),a.extractRotation(s),E.halfWidth.set(v.width*.5,0,0),E.halfHeight.set(0,v.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),_++}else if(v.isPointLight){const E=n.point[u];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(m),u++}else if(v.isHemisphereLight){const E=n.hemi[g];E.direction.setFromMatrixPosition(v.matrixWorld),E.direction.transformDirection(m),g++}}}return{setup:o,setupView:c,state:n}}function Ql(i){const t=new C_(i),e=[],n=[],r=[];function s(f){p.camera=f,e.length=0,n.length=0,r.length=0}function a(f){e.push(f)}function o(f){n.push(f)}function c(f){r.push(f)}function l(){t.setup(e)}function h(f){t.setupView(e,f)}const p={lightsArray:e,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:p,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function P_(i){let t=new WeakMap;function e(r,s=0){const a=t.get(r);let o;return a===void 0?(o=new Ql(i),t.set(r,[o])):s>=a.length?(o=new Ql(i),a.push(o)):o=a[s],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const I_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,L_=`uniform sampler2D shadow_pass;
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
}`,D_=[new K(1,0,0),new K(-1,0,0),new K(0,1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1)],N_=[new K(0,-1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1),new K(0,-1,0),new K(0,-1,0)],jl=new Kt,Ir=new K,Ka=new K;function U_(i,t,e){let n=new Ic;const r=new $t,s=new $t,a=new Yt,o=new Gd,c=new Hd,l={},h=e.maxTextureSize,p={[Pi]:$e,[$e]:Pi,[Wn]:Wn},f=new Ln({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new $t},radius:{value:4}},vertexShader:I_,fragmentShader:L_}),u=f.clone();u.defines.HORIZONTAL_PASS=1;const d=new jn;d.setAttribute("position",new fn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new tn(d,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Hs;let m=this.type;this.render=function(S,b,M){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||S.length===0)return;this.type===ah&&(Lt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Hs);const w=i.getRenderTarget(),A=i.getActiveCubeFace(),T=i.getActiveMipmapLevel(),L=i.state;L.setBlending(qn),L.buffers.depth.getReversed()===!0?L.buffers.color.setClear(0,0,0,0):L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);const N=m!==this.type;N&&b.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(C=>C.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,C=S.length;P<C;P++){const U=S[P],F=U.shadow;if(F===void 0){Lt("WebGLShadowMap:",U,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;r.copy(F.mapSize);const z=F.getFrameExtents();r.multiply(z),s.copy(F.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/z.x),r.x=s.x*z.x,F.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/z.y),r.y=s.y*z.y,F.mapSize.y=s.y));const D=i.state.buffers.depth.getReversed();if(F.camera._reversedDepth=D,F.map===null||N===!0){if(F.map!==null&&(F.map.depthTexture!==null&&(F.map.depthTexture.dispose(),F.map.depthTexture=null),F.map.dispose()),this.type===zr){if(U.isPointLight){Lt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}F.map=new xn(r.x,r.y,{format:Li,type:In,minFilter:Fe,magFilter:Fe,generateMipmaps:!1}),F.map.texture.name=U.name+".shadowMap",F.map.depthTexture=new Jr(r.x,r.y,ln),F.map.depthTexture.name=U.name+".shadowMapDepth",F.map.depthTexture.format=Zn,F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Pe,F.map.depthTexture.magFilter=Pe}else U.isPointLight?(F.map=new Bf(r.x),F.map.depthTexture=new Nd(r.x,Pn)):(F.map=new xn(r.x,r.y),F.map.depthTexture=new Jr(r.x,r.y,Pn)),F.map.depthTexture.name=U.name+".shadowMap",F.map.depthTexture.format=Zn,this.type===Hs?(F.map.depthTexture.compareFunction=D?Tc:wc,F.map.depthTexture.minFilter=Fe,F.map.depthTexture.magFilter=Fe):(F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Pe,F.map.depthTexture.magFilter=Pe);F.camera.updateProjectionMatrix()}F.map.isWebGLCubeRenderTarget!==!0&&(F.map.width!==r.x||F.map.height!==r.y)&&F.map.setSize(r.x,r.y);const O=F.map.isWebGLCubeRenderTarget?6:F.getViewportCount();U.isPointLight!==!0&&F.updateMatrices(U,M);for(let k=0;k<O;k++){const J=F.getCamera(k);if(U.isPointLight){const $=F.camera,rt=F.matrix,at=U.distance||$.far;at!==$.far&&($.far=at,$.updateProjectionMatrix()),Ir.setFromMatrixPosition(U.matrixWorld),$.position.copy(Ir),Ka.copy($.position),Ka.add(D_[k]),$.up.copy(N_[k]),$.lookAt(Ka),$.updateMatrixWorld(),rt.makeTranslation(-Ir.x,-Ir.y,-Ir.z),jl.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),F._frustum.setFromProjectionMatrix(jl,$.coordinateSystem,$.reversedDepth)}if(F.map.isWebGLCubeRenderTarget)i.setRenderTarget(F.map,k),i.clear();else{k===0&&(i.setRenderTarget(F.map),i.clear());const $=F.getViewport(k);a.set(s.x*$.x,s.y*$.y,s.x*$.z,s.y*$.w),L.viewport(a)}n=F.getFrustum(k),v(b,M,J,U,this.type)}F.isPointLightShadow!==!0&&this.type===zr&&x(F,M),F.needsUpdate=!1}m=this.type,g.needsUpdate=!1,i.setRenderTarget(w,A,T)};function x(S,b){const M=t.update(_);f.defines.VSM_SAMPLES!==S.blurSamples&&(f.defines.VSM_SAMPLES=S.blurSamples,u.defines.VSM_SAMPLES=S.blurSamples,f.needsUpdate=!0,u.needsUpdate=!0),S.mapPass===null?S.mapPass=new xn(r.x,r.y,{format:Li,type:In}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),f.uniforms.shadow_pass.value=S.map.depthTexture,f.uniforms.resolution.value.set(S.map.width,S.map.height),f.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(b,null,M,f,_,null),u.uniforms.shadow_pass.value=S.mapPass.texture,u.uniforms.resolution.value.set(S.map.width,S.map.height),u.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(b,null,M,u,_,null)}function y(S,b,M,w){let A=null;const T=M.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(T!==void 0)A=T;else if(A=M.isPointLight===!0?c:o,i.localClippingEnabled&&b.clipShadows===!0&&Array.isArray(b.clippingPlanes)&&b.clippingPlanes.length!==0||b.displacementMap&&b.displacementScale!==0||b.alphaMap&&b.alphaTest>0||b.map&&b.alphaTest>0||b.alphaToCoverage===!0){const L=A.uuid,N=b.uuid;let P=l[L];P===void 0&&(P={},l[L]=P);let C=P[N];C===void 0&&(C=A.clone(),P[N]=C,b.addEventListener("dispose",E)),A=C}if(A.visible=b.visible,A.wireframe=b.wireframe,w===zr?A.side=b.shadowSide!==null?b.shadowSide:b.side:A.side=b.shadowSide!==null?b.shadowSide:p[b.side],A.alphaMap=b.alphaMap,A.alphaTest=b.alphaToCoverage===!0?.5:b.alphaTest,A.map=b.map,A.clipShadows=b.clipShadows,A.clippingPlanes=b.clippingPlanes,A.clipIntersection=b.clipIntersection,A.displacementMap=b.displacementMap,A.displacementScale=b.displacementScale,A.displacementBias=b.displacementBias,A.wireframeLinewidth=b.wireframeLinewidth,A.linewidth=b.linewidth,M.isPointLight===!0&&A.isMeshDistanceMaterial===!0){const L=i.properties.get(A);L.light=M}return A}function v(S,b,M,w,A){if(S.visible===!1)return;if(S.layers.test(b.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&A===zr)&&(!S.frustumCulled||S.intersectsFrustum(n))){S.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,S.matrixWorld);const N=t.update(S),P=S.material;if(Array.isArray(P)){const C=N.groups;for(let U=0,F=C.length;U<F;U++){const z=C[U],D=P[z.materialIndex];if(D&&D.visible){const O=y(S,D,w,A);S.onBeforeShadow(i,S,b,M,N,O,z),i.renderBufferDirect(M,null,N,O,S,z),S.onAfterShadow(i,S,b,M,N,O,z)}}}else if(P.visible){const C=y(S,P,w,A);S.onBeforeShadow(i,S,b,M,N,C,null),i.renderBufferDirect(M,null,N,C,S,null),S.onAfterShadow(i,S,b,M,N,C,null)}}const L=S.children;for(let N=0,P=L.length;N<P;N++)v(L[N],b,M,w,A)}function E(S){S.target.removeEventListener("dispose",E);for(const M in l){const w=l[M],A=S.target.uuid;A in w&&(w[A].dispose(),delete w[A])}}}function F_(i,t){function e(){let H=!1;const dt=new Yt;let nt=null;const pt=new Yt(0,0,0,0);return{setMask:function(xt){nt!==xt&&!H&&(i.colorMask(xt,xt,xt,xt),nt=xt)},setLocked:function(xt){H=xt},setClear:function(xt,st,Pt,Tt,le){le===!0&&(xt*=Tt,st*=Tt,Pt*=Tt),dt.set(xt,st,Pt,Tt),pt.equals(dt)===!1&&(i.clearColor(xt,st,Pt,Tt),pt.copy(dt))},reset:function(){H=!1,nt=null,pt.set(-1,0,0,0)}}}function n(){let H=!1,dt=!1,nt=null,pt=null,xt=null;return{setReversed:function(st){if(dt!==st){const Pt=t.get("EXT_clip_control");st?Pt.clipControlEXT(Pt.LOWER_LEFT_EXT,Pt.ZERO_TO_ONE_EXT):Pt.clipControlEXT(Pt.LOWER_LEFT_EXT,Pt.NEGATIVE_ONE_TO_ONE_EXT),dt=st;const Tt=xt;xt=null,this.setClear(Tt)}},getReversed:function(){return dt},setTest:function(st){st?j(i.DEPTH_TEST):ot(i.DEPTH_TEST)},setMask:function(st){nt!==st&&!H&&(i.depthMask(st),nt=st)},setFunc:function(st){if(dt&&(st=Hh[st]),pt!==st){switch(st){case go:i.depthFunc(i.NEVER);break;case _o:i.depthFunc(i.ALWAYS);break;case vo:i.depthFunc(i.LESS);break;case $r:i.depthFunc(i.LEQUAL);break;case xo:i.depthFunc(i.EQUAL);break;case So:i.depthFunc(i.GEQUAL);break;case Mo:i.depthFunc(i.GREATER);break;case yo:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}pt=st}},setLocked:function(st){H=st},setClear:function(st){xt!==st&&(xt=st,dt&&(st=1-st),i.clearDepth(st))},reset:function(){H=!1,nt=null,pt=null,xt=null,dt=!1}}}function r(){let H=!1,dt=null,nt=null,pt=null,xt=null,st=null,Pt=null,Tt=null,le=null;return{setTest:function(ee){H||(ee?j(i.STENCIL_TEST):ot(i.STENCIL_TEST))},setMask:function(ee){dt!==ee&&!H&&(i.stencilMask(ee),dt=ee)},setFunc:function(ee,hn,Mn){(nt!==ee||pt!==hn||xt!==Mn)&&(i.stencilFunc(ee,hn,Mn),nt=ee,pt=hn,xt=Mn)},setOp:function(ee,hn,Mn){(st!==ee||Pt!==hn||Tt!==Mn)&&(i.stencilOp(ee,hn,Mn),st=ee,Pt=hn,Tt=Mn)},setLocked:function(ee){H=ee},setClear:function(ee){le!==ee&&(i.clearStencil(ee),le=ee)},reset:function(){H=!1,dt=null,nt=null,pt=null,xt=null,st=null,Pt=null,Tt=null,le=null}}}const s=new e,a=new n,o=new r,c=new WeakMap,l=new WeakMap;let h={},p={},f={},u=new WeakMap,d=[],_=null,g=!1,m=null,x=null,y=null,v=null,E=null,S=null,b=null,M=new Wt(0,0,0),w=0,A=!1,T=null,L=null,N=null,P=null,C=null;const U=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let F=!1,z=0;const D=i.getParameter(i.VERSION);D.indexOf("WebGL")!==-1?(z=parseFloat(/^WebGL (\d)/.exec(D)[1]),F=z>=1):D.indexOf("OpenGL ES")!==-1&&(z=parseFloat(/^OpenGL ES (\d)/.exec(D)[1]),F=z>=2);let O=null,k={};const J=i.getParameter(i.SCISSOR_BOX),$=i.getParameter(i.VIEWPORT),rt=new Yt().fromArray(J),at=new Yt().fromArray($);function lt(H,dt,nt,pt){const xt=new Uint8Array(4),st=i.createTexture();i.bindTexture(H,st),i.texParameteri(H,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(H,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Pt=0;Pt<nt;Pt++)H===i.TEXTURE_3D||H===i.TEXTURE_2D_ARRAY?i.texImage3D(dt,0,i.RGBA,1,1,pt,0,i.RGBA,i.UNSIGNED_BYTE,xt):i.texImage2D(dt+Pt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,xt);return st}const W={};W[i.TEXTURE_2D]=lt(i.TEXTURE_2D,i.TEXTURE_2D,1),W[i.TEXTURE_CUBE_MAP]=lt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),W[i.TEXTURE_2D_ARRAY]=lt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),W[i.TEXTURE_3D]=lt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),j(i.DEPTH_TEST),a.setFunc($r),Xt(!1),he(Yc),j(i.CULL_FACE),Qt(qn);function j(H){h[H]!==!0&&(i.enable(H),h[H]=!0)}function ot(H){h[H]!==!1&&(i.disable(H),h[H]=!1)}function Dt(H,dt){return f[H]!==dt?(i.bindFramebuffer(H,dt),f[H]=dt,H===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=dt),H===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=dt),!0):!1}function St(H,dt){let nt=d,pt=!1;if(H){nt=u.get(dt),nt===void 0&&(nt=[],u.set(dt,nt));const xt=H.textures;if(nt.length!==xt.length||nt[0]!==i.COLOR_ATTACHMENT0){for(let st=0,Pt=xt.length;st<Pt;st++)nt[st]=i.COLOR_ATTACHMENT0+st;nt.length=xt.length,pt=!0}}else nt[0]!==i.BACK&&(nt[0]=i.BACK,pt=!0);pt&&i.drawBuffers(nt)}function Bt(H){return _!==H?(i.useProgram(H),_=H,!0):!1}const te={[or]:i.FUNC_ADD,[ch]:i.FUNC_SUBTRACT,[lh]:i.FUNC_REVERSE_SUBTRACT};te[uh]=i.MIN,te[fh]=i.MAX;const Nt={[hh]:i.ZERO,[dh]:i.ONE,[ph]:i.SRC_COLOR,[af]:i.SRC_ALPHA,[Sh]:i.SRC_ALPHA_SATURATE,[vh]:i.DST_COLOR,[gh]:i.DST_ALPHA,[mh]:i.ONE_MINUS_SRC_COLOR,[of]:i.ONE_MINUS_SRC_ALPHA,[xh]:i.ONE_MINUS_DST_COLOR,[_h]:i.ONE_MINUS_DST_ALPHA,[Mh]:i.CONSTANT_COLOR,[yh]:i.ONE_MINUS_CONSTANT_COLOR,[Eh]:i.CONSTANT_ALPHA,[bh]:i.ONE_MINUS_CONSTANT_ALPHA};function Qt(H,dt,nt,pt,xt,st,Pt,Tt,le,ee){if(H===qn){g===!0&&(ot(i.BLEND),g=!1);return}if(g===!1&&(j(i.BLEND),g=!0),H!==oh){if(H!==m||ee!==A){if((x!==or||E!==or)&&(i.blendEquation(i.FUNC_ADD),x=or,E=or),ee)switch(H){case Hr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Kc:i.blendFunc(i.ONE,i.ONE);break;case Zc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Jc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:jt("WebGLState: Invalid blending: ",H);break}else switch(H){case Hr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Kc:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Zc:jt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Jc:jt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:jt("WebGLState: Invalid blending: ",H);break}y=null,v=null,S=null,b=null,M.set(0,0,0),w=0,m=H,A=ee}return}xt=xt||dt,st=st||nt,Pt=Pt||pt,(dt!==x||xt!==E)&&(i.blendEquationSeparate(te[dt],te[xt]),x=dt,E=xt),(nt!==y||pt!==v||st!==S||Pt!==b)&&(i.blendFuncSeparate(Nt[nt],Nt[pt],Nt[st],Nt[Pt]),y=nt,v=pt,S=st,b=Pt),(Tt.equals(M)===!1||le!==w)&&(i.blendColor(Tt.r,Tt.g,Tt.b,le),M.copy(Tt),w=le),m=H,A=!1}function ce(H,dt){H.side===Wn?ot(i.CULL_FACE):j(i.CULL_FACE);let nt=H.side===$e;dt&&(nt=!nt),Xt(nt),H.blending===Hr&&H.transparent===!1?Qt(qn):Qt(H.blending,H.blendEquation,H.blendSrc,H.blendDst,H.blendEquationAlpha,H.blendSrcAlpha,H.blendDstAlpha,H.blendColor,H.blendAlpha,H.premultipliedAlpha),a.setFunc(H.depthFunc),a.setTest(H.depthTest),a.setMask(H.depthWrite),s.setMask(H.colorWrite);const pt=H.stencilWrite;o.setTest(pt),pt&&(o.setMask(H.stencilWriteMask),o.setFunc(H.stencilFunc,H.stencilRef,H.stencilFuncMask),o.setOp(H.stencilFail,H.stencilZFail,H.stencilZPass)),He(H.polygonOffset,H.polygonOffsetFactor,H.polygonOffsetUnits),H.alphaToCoverage===!0?j(i.SAMPLE_ALPHA_TO_COVERAGE):ot(i.SAMPLE_ALPHA_TO_COVERAGE)}function Xt(H){T!==H&&(H?i.frontFace(i.CW):i.frontFace(i.CCW),T=H)}function he(H){H!==rh?(j(i.CULL_FACE),H!==L&&(H===Yc?i.cullFace(i.BACK):H===sh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ot(i.CULL_FACE),L=H}function we(H){H!==N&&(F&&i.lineWidth(H),N=H)}function He(H,dt,nt){H?(j(i.POLYGON_OFFSET_FILL),(P!==dt||C!==nt)&&(P=dt,C=nt,a.getReversed()&&(dt=-dt),i.polygonOffset(dt,nt))):ot(i.POLYGON_OFFSET_FILL)}function pe(H){H?j(i.SCISSOR_TEST):ot(i.SCISSOR_TEST)}function ge(H){H===void 0&&(H=i.TEXTURE0+U-1),O!==H&&(i.activeTexture(H),O=H)}function V(H,dt,nt){nt===void 0&&(O===null?nt=i.TEXTURE0+U-1:nt=O);let pt=k[nt];pt===void 0&&(pt={type:void 0,texture:void 0},k[nt]=pt),(pt.type!==H||pt.texture!==dt)&&(O!==nt&&(i.activeTexture(nt),O=nt),i.bindTexture(H,dt||W[H]),pt.type=H,pt.texture=dt)}function Ie(){const H=k[O];H!==void 0&&H.type!==void 0&&(i.bindTexture(H.type,null),H.type=void 0,H.texture=void 0)}function ie(){try{i.compressedTexImage2D(...arguments)}catch(H){jt("WebGLState:",H)}}function B(){try{i.compressedTexImage3D(...arguments)}catch(H){jt("WebGLState:",H)}}function R(){try{i.texSubImage2D(...arguments)}catch(H){jt("WebGLState:",H)}}function X(){try{i.texSubImage3D(...arguments)}catch(H){jt("WebGLState:",H)}}function Z(){try{i.compressedTexSubImage2D(...arguments)}catch(H){jt("WebGLState:",H)}}function tt(){try{i.compressedTexSubImage3D(...arguments)}catch(H){jt("WebGLState:",H)}}function ct(){try{i.texStorage2D(...arguments)}catch(H){jt("WebGLState:",H)}}function ut(){try{i.texStorage3D(...arguments)}catch(H){jt("WebGLState:",H)}}function et(){try{i.texImage2D(...arguments)}catch(H){jt("WebGLState:",H)}}function it(){try{i.texImage3D(...arguments)}catch(H){jt("WebGLState:",H)}}function ft(H){return p[H]!==void 0?p[H]:i.getParameter(H)}function Rt(H,dt){p[H]!==dt&&(i.pixelStorei(H,dt),p[H]=dt)}function mt(H){rt.equals(H)===!1&&(i.scissor(H.x,H.y,H.z,H.w),rt.copy(H))}function ht(H){at.equals(H)===!1&&(i.viewport(H.x,H.y,H.z,H.w),at.copy(H))}function Ct(H,dt){let nt=l.get(dt);nt===void 0&&(nt=new WeakMap,l.set(dt,nt));let pt=nt.get(H);pt===void 0&&(pt=i.getUniformBlockIndex(dt,H.name),nt.set(H,pt))}function It(H,dt){const pt=l.get(dt).get(H);c.get(dt)!==pt&&(i.uniformBlockBinding(dt,pt,H.__bindingPointIndex),c.set(dt,pt))}function Ft(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},p={},O=null,k={},f={},u=new WeakMap,d=[],_=null,g=!1,m=null,x=null,y=null,v=null,E=null,S=null,b=null,M=new Wt(0,0,0),w=0,A=!1,T=null,L=null,N=null,P=null,C=null,rt.set(0,0,i.canvas.width,i.canvas.height),at.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:j,disable:ot,bindFramebuffer:Dt,drawBuffers:St,useProgram:Bt,setBlending:Qt,setMaterial:ce,setFlipSided:Xt,setCullFace:he,setLineWidth:we,setPolygonOffset:He,setScissorTest:pe,activeTexture:ge,bindTexture:V,unbindTexture:Ie,compressedTexImage2D:ie,compressedTexImage3D:B,texImage2D:et,texImage3D:it,pixelStorei:Rt,getParameter:ft,updateUBOMapping:Ct,uniformBlockBinding:It,texStorage2D:ct,texStorage3D:ut,texSubImage2D:R,texSubImage3D:X,compressedTexSubImage2D:Z,compressedTexSubImage3D:tt,scissor:mt,viewport:ht,reset:Ft}}function O_(i,t,e,n,r,s,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new $t,h=new WeakMap,p=new Set;let f;const u=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(B,R){return d?new OffscreenCanvas(B,R):Zr("canvas")}function g(B,R,X){let Z=1;const tt=ie(B);if((tt.width>X||tt.height>X)&&(Z=X/Math.max(tt.width,tt.height)),Z<1)if(typeof HTMLImageElement<"u"&&B instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&B instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&B instanceof ImageBitmap||typeof VideoFrame<"u"&&B instanceof VideoFrame){const ct=Math.floor(Z*tt.width),ut=Math.floor(Z*tt.height);f===void 0&&(f=_(ct,ut));const et=R?_(ct,ut):f;return et.width=ct,et.height=ut,et.getContext("2d").drawImage(B,0,0,ct,ut),Lt("WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+ct+"x"+ut+")."),et}else return"data"in B&&Lt("WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),B;return B}function m(B){return B.generateMipmaps}function x(B){i.generateMipmap(B)}function y(B){return B.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:B.isWebGL3DRenderTarget?i.TEXTURE_3D:B.isWebGLArrayRenderTarget||B.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(B,R,X,Z,tt,ct=!1){if(B!==null){if(i[B]!==void 0)return i[B];Lt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+B+"'")}let ut;Z&&(ut=t.get("EXT_texture_norm16"),ut||Lt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let et=R;if(R===i.RED&&(X===i.FLOAT&&(et=i.R32F),X===i.HALF_FLOAT&&(et=i.R16F),X===i.UNSIGNED_BYTE&&(et=i.R8),X===i.UNSIGNED_SHORT&&ut&&(et=ut.R16_EXT),X===i.SHORT&&ut&&(et=ut.R16_SNORM_EXT)),R===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(et=i.R8UI),X===i.UNSIGNED_SHORT&&(et=i.R16UI),X===i.UNSIGNED_INT&&(et=i.R32UI),X===i.BYTE&&(et=i.R8I),X===i.SHORT&&(et=i.R16I),X===i.INT&&(et=i.R32I)),R===i.RG&&(X===i.FLOAT&&(et=i.RG32F),X===i.HALF_FLOAT&&(et=i.RG16F),X===i.UNSIGNED_BYTE&&(et=i.RG8),X===i.UNSIGNED_SHORT&&ut&&(et=ut.RG16_EXT),X===i.SHORT&&ut&&(et=ut.RG16_SNORM_EXT)),R===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(et=i.RG8UI),X===i.UNSIGNED_SHORT&&(et=i.RG16UI),X===i.UNSIGNED_INT&&(et=i.RG32UI),X===i.BYTE&&(et=i.RG8I),X===i.SHORT&&(et=i.RG16I),X===i.INT&&(et=i.RG32I)),R===i.RGB_INTEGER&&(X===i.UNSIGNED_BYTE&&(et=i.RGB8UI),X===i.UNSIGNED_SHORT&&(et=i.RGB16UI),X===i.UNSIGNED_INT&&(et=i.RGB32UI),X===i.BYTE&&(et=i.RGB8I),X===i.SHORT&&(et=i.RGB16I),X===i.INT&&(et=i.RGB32I)),R===i.RGBA_INTEGER&&(X===i.UNSIGNED_BYTE&&(et=i.RGBA8UI),X===i.UNSIGNED_SHORT&&(et=i.RGBA16UI),X===i.UNSIGNED_INT&&(et=i.RGBA32UI),X===i.BYTE&&(et=i.RGBA8I),X===i.SHORT&&(et=i.RGBA16I),X===i.INT&&(et=i.RGBA32I)),R===i.RGB&&(X===i.UNSIGNED_SHORT&&ut&&(et=ut.RGB16_EXT),X===i.SHORT&&ut&&(et=ut.RGB16_SNORM_EXT),X===i.UNSIGNED_INT_5_9_9_9_REV&&(et=i.RGB9_E5),X===i.UNSIGNED_INT_10F_11F_11F_REV&&(et=i.R11F_G11F_B10F)),R===i.RGBA){const it=ct?js:qt.getTransfer(tt);X===i.FLOAT&&(et=i.RGBA32F),X===i.HALF_FLOAT&&(et=i.RGBA16F),X===i.UNSIGNED_BYTE&&(et=it===re?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT&&ut&&(et=ut.RGBA16_EXT),X===i.SHORT&&ut&&(et=ut.RGBA16_SNORM_EXT),X===i.UNSIGNED_SHORT_4_4_4_4&&(et=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(et=i.RGB5_A1)}return(et===i.R16F||et===i.R32F||et===i.RG16F||et===i.RG32F||et===i.RGBA16F||et===i.RGBA32F)&&t.get("EXT_color_buffer_float"),et}function E(B,R){let X;return B?R===null||R===Pn||R===Yr?X=i.DEPTH24_STENCIL8:R===ln?X=i.DEPTH32F_STENCIL8:R===qr&&(X=i.DEPTH24_STENCIL8,Lt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):R===null||R===Pn||R===Yr?X=i.DEPTH_COMPONENT24:R===ln?X=i.DEPTH_COMPONENT32F:R===qr&&(X=i.DEPTH_COMPONENT16),X}function S(B,R){return m(B)===!0||B.isFramebufferTexture&&B.minFilter!==Pe&&B.minFilter!==Fe?Math.log2(Math.max(R.width,R.height))+1:B.mipmaps!==void 0&&B.mipmaps.length>0?B.mipmaps.length:B.isCompressedTexture&&Array.isArray(B.image)?R.mipmaps.length:1}function b(B){const R=B.target;R.removeEventListener("dispose",b),w(R),R.isVideoTexture&&h.delete(R),R.isHTMLTexture&&p.delete(R)}function M(B){const R=B.target;R.removeEventListener("dispose",M),T(R)}function w(B){const R=n.get(B);if(R.__webglInit===void 0)return;const X=B.source,Z=u.get(X);if(Z){const tt=Z[R.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&A(B),Object.keys(Z).length===0&&u.delete(X)}n.remove(B)}function A(B){const R=n.get(B);i.deleteTexture(R.__webglTexture);const X=B.source,Z=u.get(X);delete Z[R.__cacheKey],a.memory.textures--}function T(B){const R=n.get(B);if(B.depthTexture&&(B.depthTexture.dispose(),n.remove(B.depthTexture)),B.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(R.__webglFramebuffer[Z]))for(let tt=0;tt<R.__webglFramebuffer[Z].length;tt++)i.deleteFramebuffer(R.__webglFramebuffer[Z][tt]);else i.deleteFramebuffer(R.__webglFramebuffer[Z]);R.__webglDepthbuffer&&i.deleteRenderbuffer(R.__webglDepthbuffer[Z])}else{if(Array.isArray(R.__webglFramebuffer))for(let Z=0;Z<R.__webglFramebuffer.length;Z++)i.deleteFramebuffer(R.__webglFramebuffer[Z]);else i.deleteFramebuffer(R.__webglFramebuffer);if(R.__webglDepthbuffer&&i.deleteRenderbuffer(R.__webglDepthbuffer),R.__webglMultisampledFramebuffer&&i.deleteFramebuffer(R.__webglMultisampledFramebuffer),R.__webglColorRenderbuffer)for(let Z=0;Z<R.__webglColorRenderbuffer.length;Z++)R.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(R.__webglColorRenderbuffer[Z]);R.__webglDepthRenderbuffer&&i.deleteRenderbuffer(R.__webglDepthRenderbuffer)}const X=B.textures;for(let Z=0,tt=X.length;Z<tt;Z++){const ct=n.get(X[Z]);ct.__webglTexture&&(i.deleteTexture(ct.__webglTexture),a.memory.textures--),n.remove(X[Z])}n.remove(B)}let L=0;function N(){L=0}function P(){return L}function C(B){L=B}function U(){const B=L;return B>=r.maxTextures&&Lt("WebGLTextures: Trying to use "+(B+1)+" texture units while this GPU supports only "+r.maxTextures),L+=1,B}function F(B){const R=[];return R.push(B.wrapS),R.push(B.wrapT),R.push(B.wrapR||0),R.push(B.magFilter),R.push(B.minFilter),R.push(B.anisotropy),R.push(B.internalFormat),R.push(B.format),R.push(B.type),R.push(B.generateMipmaps),R.push(B.premultiplyAlpha),R.push(B.flipY),R.push(B.unpackAlignment),R.push(B.colorSpace),R.join()}function z(B,R){const X=n.get(B);if(B.isVideoTexture&&V(B),B.isRenderTargetTexture===!1&&B.isExternalTexture!==!0&&B.version>0&&X.__version!==B.version){const Z=B.image;if(Z===null)Lt("WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)Lt("WebGLRenderer: Texture marked for update but image is incomplete");else{ot(X,B,R);return}}else B.isExternalTexture&&(X.__webglTexture=B.sourceTexture?B.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+R)}function D(B,R){const X=n.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&X.__version!==B.version){ot(X,B,R);return}else B.isExternalTexture&&(X.__webglTexture=B.sourceTexture?B.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+R)}function O(B,R){const X=n.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&X.__version!==B.version){ot(X,B,R);return}e.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+R)}function k(B,R){const X=n.get(B);if(B.isCubeDepthTexture!==!0&&B.version>0&&X.__version!==B.version){Dt(X,B,R);return}e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+R)}const J={[Eo]:i.REPEAT,[$n]:i.CLAMP_TO_EDGE,[bo]:i.MIRRORED_REPEAT},$={[Pe]:i.NEAREST,[Rh]:i.NEAREST_MIPMAP_NEAREST,[os]:i.NEAREST_MIPMAP_LINEAR,[Fe]:i.LINEAR,[va]:i.LINEAR_MIPMAP_NEAREST,[wi]:i.LINEAR_MIPMAP_LINEAR},rt={[Lh]:i.NEVER,[Oh]:i.ALWAYS,[Dh]:i.LESS,[wc]:i.LEQUAL,[Nh]:i.EQUAL,[Tc]:i.GEQUAL,[Uh]:i.GREATER,[Fh]:i.NOTEQUAL};function at(B,R){if(R.type===ln&&t.has("OES_texture_float_linear")===!1&&(R.magFilter===Fe||R.magFilter===va||R.magFilter===os||R.magFilter===wi||R.minFilter===Fe||R.minFilter===va||R.minFilter===os||R.minFilter===wi)&&Lt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(B,i.TEXTURE_WRAP_S,J[R.wrapS]),i.texParameteri(B,i.TEXTURE_WRAP_T,J[R.wrapT]),(B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY)&&i.texParameteri(B,i.TEXTURE_WRAP_R,J[R.wrapR]),i.texParameteri(B,i.TEXTURE_MAG_FILTER,$[R.magFilter]),i.texParameteri(B,i.TEXTURE_MIN_FILTER,$[R.minFilter]),R.compareFunction&&(i.texParameteri(B,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(B,i.TEXTURE_COMPARE_FUNC,rt[R.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(R.magFilter===Pe||R.minFilter!==os&&R.minFilter!==wi||R.type===ln&&t.has("OES_texture_float_linear")===!1)return;if(R.anisotropy>1||n.get(R).__currentAnisotropy){const X=t.get("EXT_texture_filter_anisotropic");i.texParameterf(B,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,r.getMaxAnisotropy())),n.get(R).__currentAnisotropy=R.anisotropy}}}function lt(B,R){let X=!1;B.__webglInit===void 0&&(B.__webglInit=!0,R.addEventListener("dispose",b));const Z=R.source;let tt=u.get(Z);tt===void 0&&(tt={},u.set(Z,tt));const ct=F(R);if(ct!==B.__cacheKey){tt[ct]===void 0&&(tt[ct]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,X=!0),tt[ct].usedTimes++;const ut=tt[B.__cacheKey];ut!==void 0&&(tt[B.__cacheKey].usedTimes--,ut.usedTimes===0&&A(R)),B.__cacheKey=ct,B.__webglTexture=tt[ct].texture}return X}function W(B,R,X){return Math.floor(Math.floor(B/X)/R)}function j(B,R,X,Z){const ct=B.updateRanges;if(ct.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,R.width,R.height,X,Z,R.data);else{ct.sort((Rt,mt)=>Rt.start-mt.start);let ut=0;for(let Rt=1;Rt<ct.length;Rt++){const mt=ct[ut],ht=ct[Rt],Ct=mt.start+mt.count,It=W(ht.start,R.width,4),Ft=W(mt.start,R.width,4);ht.start<=Ct+1&&It===Ft&&W(ht.start+ht.count-1,R.width,4)===It?mt.count=Math.max(mt.count,ht.start+ht.count-mt.start):(++ut,ct[ut]=ht)}ct.length=ut+1;const et=e.getParameter(i.UNPACK_ROW_LENGTH),it=e.getParameter(i.UNPACK_SKIP_PIXELS),ft=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,R.width);for(let Rt=0,mt=ct.length;Rt<mt;Rt++){const ht=ct[Rt],Ct=Math.floor(ht.start/4),It=Math.ceil(ht.count/4),Ft=Ct%R.width,H=Math.floor(Ct/R.width),dt=It,nt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Ft),e.pixelStorei(i.UNPACK_SKIP_ROWS,H),e.texSubImage2D(i.TEXTURE_2D,0,Ft,H,dt,nt,X,Z,R.data)}B.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,et),e.pixelStorei(i.UNPACK_SKIP_PIXELS,it),e.pixelStorei(i.UNPACK_SKIP_ROWS,ft)}}function ot(B,R,X){let Z=i.TEXTURE_2D;(R.isDataArrayTexture||R.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),R.isData3DTexture&&(Z=i.TEXTURE_3D);const tt=lt(B,R),ct=R.source;e.bindTexture(Z,B.__webglTexture,i.TEXTURE0+X);const ut=n.get(ct);if(ct.version!==ut.__version||tt===!0){if(e.activeTexture(i.TEXTURE0+X),(typeof ImageBitmap<"u"&&R.image instanceof ImageBitmap)===!1){const nt=qt.getPrimaries(qt.workingColorSpace),pt=R.colorSpace===pi?null:qt.getPrimaries(R.colorSpace),xt=R.colorSpace===pi||nt===pt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt)}e.pixelStorei(i.UNPACK_ALIGNMENT,R.unpackAlignment);let it=g(R.image,!1,r.maxTextureSize);it=Ie(R,it);const ft=s.convert(R.format,R.colorSpace),Rt=s.convert(R.type);let mt=v(R.internalFormat,ft,Rt,R.normalized,R.colorSpace,R.isVideoTexture);at(Z,R);let ht;const Ct=R.mipmaps,It=R.isVideoTexture!==!0,Ft=ut.__version===void 0||tt===!0,H=ct.dataReady,dt=S(R,it);if(R.isDepthTexture)mt=E(R.format===Ti,R.type),Ft&&(It?e.texStorage2D(i.TEXTURE_2D,1,mt,it.width,it.height):e.texImage2D(i.TEXTURE_2D,0,mt,it.width,it.height,0,ft,Rt,null));else if(R.isDataTexture)if(Ct.length>0){It&&Ft&&e.texStorage2D(i.TEXTURE_2D,dt,mt,Ct[0].width,Ct[0].height);for(let nt=0,pt=Ct.length;nt<pt;nt++)ht=Ct[nt],It?H&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,ht.width,ht.height,ft,Rt,ht.data):e.texImage2D(i.TEXTURE_2D,nt,mt,ht.width,ht.height,0,ft,Rt,ht.data);R.generateMipmaps=!1}else It?(Ft&&e.texStorage2D(i.TEXTURE_2D,dt,mt,it.width,it.height),H&&j(R,it,ft,Rt)):e.texImage2D(i.TEXTURE_2D,0,mt,it.width,it.height,0,ft,Rt,it.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){It&&Ft&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,mt,Ct[0].width,Ct[0].height,it.depth);for(let nt=0,pt=Ct.length;nt<pt;nt++)if(ht=Ct[nt],R.format!==un)if(ft!==null)if(It){if(H)if(R.layerUpdates.size>0){const xt=Il(ht.width,ht.height,R.format,R.type);for(const st of R.layerUpdates){const Pt=ht.data.subarray(st*xt/ht.data.BYTES_PER_ELEMENT,(st+1)*xt/ht.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,st,ht.width,ht.height,1,ft,Pt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,ht.width,ht.height,it.depth,ft,ht.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,nt,mt,ht.width,ht.height,it.depth,0,ht.data,0,0);else Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else It?H&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,ht.width,ht.height,it.depth,ft,Rt,ht.data):e.texImage3D(i.TEXTURE_2D_ARRAY,nt,mt,ht.width,ht.height,it.depth,0,ft,Rt,ht.data);R.layerUpdates.size>0&&R.clearLayerUpdates()}else{It&&Ft&&e.texStorage2D(i.TEXTURE_2D,dt,mt,Ct[0].width,Ct[0].height);for(let nt=0,pt=Ct.length;nt<pt;nt++)ht=Ct[nt],R.format!==un?ft!==null?It?H&&e.compressedTexSubImage2D(i.TEXTURE_2D,nt,0,0,ht.width,ht.height,ft,ht.data):e.compressedTexImage2D(i.TEXTURE_2D,nt,mt,ht.width,ht.height,0,ht.data):Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):It?H&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,ht.width,ht.height,ft,Rt,ht.data):e.texImage2D(i.TEXTURE_2D,nt,mt,ht.width,ht.height,0,ft,Rt,ht.data)}else if(R.isDataArrayTexture)if(It){if(Ft&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,mt,it.width,it.height,it.depth),H)if(R.layerUpdates.size>0){const nt=Il(it.width,it.height,R.format,R.type);for(const pt of R.layerUpdates){const xt=it.data.subarray(pt*nt/it.data.BYTES_PER_ELEMENT,(pt+1)*nt/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,pt,it.width,it.height,1,ft,Rt,xt)}R.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,ft,Rt,it.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,mt,it.width,it.height,it.depth,0,ft,Rt,it.data);else if(R.isData3DTexture)It?(Ft&&e.texStorage3D(i.TEXTURE_3D,dt,mt,it.width,it.height,it.depth),H&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,ft,Rt,it.data)):e.texImage3D(i.TEXTURE_3D,0,mt,it.width,it.height,it.depth,0,ft,Rt,it.data);else if(R.isFramebufferTexture){if(Ft)if(It)e.texStorage2D(i.TEXTURE_2D,dt,mt,it.width,it.height);else{let nt=it.width,pt=it.height;for(let xt=0;xt<dt;xt++)e.texImage2D(i.TEXTURE_2D,xt,mt,nt,pt,0,ft,Rt,null),nt>>=1,pt>>=1}}else if(R.isHTMLTexture){if("texElementImage2D"in i){const nt=i.canvas;if(nt.hasAttribute("layoutsubtree")||nt.setAttribute("layoutsubtree","true"),it.parentNode!==nt){nt.appendChild(it),p.add(R),nt.onpaint=pt=>{const xt=pt.changedElements;for(const st of p)xt.includes(st.image)&&(st.needsUpdate=!0)},nt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,it);else{const xt=i.RGBA,st=i.RGBA,Pt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,xt,st,Pt,it)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ct.length>0){if(It&&Ft){const nt=ie(Ct[0]);e.texStorage2D(i.TEXTURE_2D,dt,mt,nt.width,nt.height)}for(let nt=0,pt=Ct.length;nt<pt;nt++)ht=Ct[nt],It?H&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,ft,Rt,ht):e.texImage2D(i.TEXTURE_2D,nt,mt,ft,Rt,ht);R.generateMipmaps=!1}else if(It){if(Ft){const nt=ie(it);e.texStorage2D(i.TEXTURE_2D,dt,mt,nt.width,nt.height)}H&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ft,Rt,it)}else e.texImage2D(i.TEXTURE_2D,0,mt,ft,Rt,it);m(R)&&x(Z),ut.__version=ct.version,R.onUpdate&&R.onUpdate(R)}B.__version=R.version}function Dt(B,R,X){if(R.image.length!==6)return;const Z=lt(B,R),tt=R.source;e.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+X);const ct=n.get(tt);if(tt.version!==ct.__version||Z===!0){e.activeTexture(i.TEXTURE0+X);const ut=qt.getPrimaries(qt.workingColorSpace),et=R.colorSpace===pi?null:qt.getPrimaries(R.colorSpace),it=R.colorSpace===pi||ut===et?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,R.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,it);const ft=R.isCompressedTexture||R.image[0].isCompressedTexture,Rt=R.image[0]&&R.image[0].isDataTexture,mt=[];for(let st=0;st<6;st++)!ft&&!Rt?mt[st]=g(R.image[st],!0,r.maxCubemapSize):mt[st]=Rt?R.image[st].image:R.image[st],mt[st]=Ie(R,mt[st]);const ht=mt[0],Ct=s.convert(R.format,R.colorSpace),It=s.convert(R.type),Ft=v(R.internalFormat,Ct,It,R.normalized,R.colorSpace),H=R.isVideoTexture!==!0,dt=ct.__version===void 0||Z===!0,nt=tt.dataReady;let pt=S(R,ht);at(i.TEXTURE_CUBE_MAP,R);let xt;if(ft){H&&dt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Ft,ht.width,ht.height);for(let st=0;st<6;st++){xt=mt[st].mipmaps;for(let Pt=0;Pt<xt.length;Pt++){const Tt=xt[Pt];R.format!==un?Ct!==null?H?nt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt,0,0,Tt.width,Tt.height,Ct,Tt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt,Ft,Tt.width,Tt.height,0,Tt.data):Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):H?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt,0,0,Tt.width,Tt.height,Ct,It,Tt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt,Ft,Tt.width,Tt.height,0,Ct,It,Tt.data)}}}else{if(xt=R.mipmaps,H&&dt){xt.length>0&&pt++;const st=ie(mt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,pt,Ft,st.width,st.height)}for(let st=0;st<6;st++)if(Rt){H?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,mt[st].width,mt[st].height,Ct,It,mt[st].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Ft,mt[st].width,mt[st].height,0,Ct,It,mt[st].data);for(let Pt=0;Pt<xt.length;Pt++){const le=xt[Pt].image[st].image;H?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt+1,0,0,le.width,le.height,Ct,It,le.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt+1,Ft,le.width,le.height,0,Ct,It,le.data)}}else{H?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,0,0,Ct,It,mt[st]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,0,Ft,Ct,It,mt[st]);for(let Pt=0;Pt<xt.length;Pt++){const Tt=xt[Pt];H?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt+1,0,0,Ct,It,Tt.image[st]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+st,Pt+1,Ft,Ct,It,Tt.image[st])}}}m(R)&&x(i.TEXTURE_CUBE_MAP),ct.__version=tt.version,R.onUpdate&&R.onUpdate(R)}B.__version=R.version}function St(B,R,X,Z,tt,ct){const ut=s.convert(X.format,X.colorSpace),et=s.convert(X.type),it=v(X.internalFormat,ut,et,X.normalized,X.colorSpace),ft=n.get(R),Rt=n.get(X);if(Rt.__renderTarget=R,!ft.__hasExternalTextures){const mt=Math.max(1,R.width>>ct),ht=Math.max(1,R.height>>ct);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,ct,it,mt,ht,R.depth,0,ut,et,null):e.texImage2D(tt,ct,it,mt,ht,0,ut,et,null)}e.bindFramebuffer(i.FRAMEBUFFER,B),ge(R)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,tt,Rt.__webglTexture,0,pe(R)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,tt,Rt.__webglTexture,ct),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Bt(B,R,X){if(i.bindRenderbuffer(i.RENDERBUFFER,B),R.depthBuffer){const Z=R.depthTexture,tt=Z&&Z.isDepthTexture?Z.type:null,ct=E(R.stencilBuffer,tt),ut=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ge(R)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(R),ct,R.width,R.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(R),ct,R.width,R.height):i.renderbufferStorage(i.RENDERBUFFER,ct,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ut,i.RENDERBUFFER,B)}else{const Z=R.textures;for(let tt=0;tt<Z.length;tt++){const ct=Z[tt],ut=s.convert(ct.format,ct.colorSpace),et=s.convert(ct.type),it=v(ct.internalFormat,ut,et,ct.normalized,ct.colorSpace);ge(R)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(R),it,R.width,R.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(R),it,R.width,R.height):i.renderbufferStorage(i.RENDERBUFFER,it,R.width,R.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function te(B,R,X){const Z=R.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,B),!(R.depthTexture&&R.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const tt=n.get(R.depthTexture);if(tt.__renderTarget=R,(!tt.__webglTexture||R.depthTexture.image.width!==R.width||R.depthTexture.image.height!==R.height)&&(R.depthTexture.image.width=R.width,R.depthTexture.image.height=R.height,R.depthTexture.needsUpdate=!0),Z){if(tt.__webglInit===void 0&&(tt.__webglInit=!0,R.depthTexture.addEventListener("dispose",b)),tt.__webglTexture===void 0){tt.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,tt.__webglTexture),at(i.TEXTURE_CUBE_MAP,R.depthTexture);const ft=s.convert(R.depthTexture.format),Rt=s.convert(R.depthTexture.type);let mt;R.depthTexture.format===Zn?mt=i.DEPTH_COMPONENT24:R.depthTexture.format===Ti&&(mt=i.DEPTH24_STENCIL8);for(let ht=0;ht<6;ht++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0,mt,R.width,R.height,0,ft,Rt,null)}}else z(R.depthTexture,0);const ct=tt.__webglTexture,ut=pe(R),et=Z?i.TEXTURE_CUBE_MAP_POSITIVE_X+X:i.TEXTURE_2D,it=R.depthTexture.format===Ti?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(R.depthTexture.format===Zn)ge(R)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,it,et,ct,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,it,et,ct,0);else if(R.depthTexture.format===Ti)ge(R)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,it,et,ct,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,it,et,ct,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Nt(B){const R=n.get(B),X=B.isWebGLCubeRenderTarget===!0;if(R.__boundDepthTexture!==B.depthTexture){const Z=B.depthTexture;if(R.__depthDisposeCallback&&R.__depthDisposeCallback(),Z){const tt=()=>{delete R.__boundDepthTexture,delete R.__depthDisposeCallback,Z.removeEventListener("dispose",tt)};Z.addEventListener("dispose",tt),R.__depthDisposeCallback=tt}R.__boundDepthTexture=Z}if(B.depthTexture&&!R.__autoAllocateDepthBuffer)if(X)for(let Z=0;Z<6;Z++)te(R.__webglFramebuffer[Z],B,Z);else{const Z=B.texture.mipmaps;Z&&Z.length>0?te(R.__webglFramebuffer[0],B,0):te(R.__webglFramebuffer,B,0)}else if(X){R.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer[Z]),R.__webglDepthbuffer[Z]===void 0)R.__webglDepthbuffer[Z]=i.createRenderbuffer(),Bt(R.__webglDepthbuffer[Z],B,!1);else{const tt=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ct=R.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,ct),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,ct)}}else{const Z=B.texture.mipmaps;if(Z&&Z.length>0?e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,R.__webglFramebuffer),R.__webglDepthbuffer===void 0)R.__webglDepthbuffer=i.createRenderbuffer(),Bt(R.__webglDepthbuffer,B,!1);else{const tt=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ct=R.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ct),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,ct)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Qt(B,R,X){const Z=n.get(B);R!==void 0&&St(Z.__webglFramebuffer,B,B.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&Nt(B)}function ce(B){const R=B.texture,X=n.get(B),Z=n.get(R);B.addEventListener("dispose",M);const tt=B.textures,ct=B.isWebGLCubeRenderTarget===!0,ut=tt.length>1;if(ut||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=R.version,a.memory.textures++),ct){X.__webglFramebuffer=[];for(let et=0;et<6;et++)if(R.mipmaps&&R.mipmaps.length>0){X.__webglFramebuffer[et]=[];for(let it=0;it<R.mipmaps.length;it++)X.__webglFramebuffer[et][it]=i.createFramebuffer()}else X.__webglFramebuffer[et]=i.createFramebuffer()}else{if(R.mipmaps&&R.mipmaps.length>0){X.__webglFramebuffer=[];for(let et=0;et<R.mipmaps.length;et++)X.__webglFramebuffer[et]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(ut)for(let et=0,it=tt.length;et<it;et++){const ft=n.get(tt[et]);ft.__webglTexture===void 0&&(ft.__webglTexture=i.createTexture(),a.memory.textures++)}if(B.samples>0&&ge(B)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let et=0;et<tt.length;et++){const it=tt[et];X.__webglColorRenderbuffer[et]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[et]);const ft=s.convert(it.format,it.colorSpace),Rt=s.convert(it.type),mt=v(it.internalFormat,ft,Rt,it.normalized,it.colorSpace,B.isXRRenderTarget===!0),ht=pe(B);i.renderbufferStorageMultisample(i.RENDERBUFFER,ht,mt,B.width,B.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+et,i.RENDERBUFFER,X.__webglColorRenderbuffer[et])}i.bindRenderbuffer(i.RENDERBUFFER,null),B.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),Bt(X.__webglDepthRenderbuffer,B,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ct){e.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),at(i.TEXTURE_CUBE_MAP,R);for(let et=0;et<6;et++)if(R.mipmaps&&R.mipmaps.length>0)for(let it=0;it<R.mipmaps.length;it++)St(X.__webglFramebuffer[et][it],B,R,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+et,it);else St(X.__webglFramebuffer[et],B,R,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+et,0);m(R)&&x(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ut){for(let et=0,it=tt.length;et<it;et++){const ft=tt[et],Rt=n.get(ft);let mt=i.TEXTURE_2D;(B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)&&(mt=B.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(mt,Rt.__webglTexture),at(mt,ft),St(X.__webglFramebuffer,B,ft,i.COLOR_ATTACHMENT0+et,mt,0),m(ft)&&x(mt)}e.unbindTexture()}else{let et=i.TEXTURE_2D;if((B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)&&(et=B.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(et,Z.__webglTexture),at(et,R),R.mipmaps&&R.mipmaps.length>0)for(let it=0;it<R.mipmaps.length;it++)St(X.__webglFramebuffer[it],B,R,i.COLOR_ATTACHMENT0,et,it);else St(X.__webglFramebuffer,B,R,i.COLOR_ATTACHMENT0,et,0);m(R)&&x(et),e.unbindTexture()}B.depthBuffer&&Nt(B)}function Xt(B){const R=B.textures;for(let X=0,Z=R.length;X<Z;X++){const tt=R[X];if(m(tt)){const ct=y(B),ut=n.get(tt).__webglTexture;e.bindTexture(ct,ut),x(ct),e.unbindTexture()}}}const he=[],we=[];function He(B){if(B.samples>0){if(ge(B)===!1){const R=B.textures,X=B.width,Z=B.height;let tt=i.COLOR_BUFFER_BIT;const ct=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ut=n.get(B),et=R.length>1;if(et)for(let ft=0;ft<R.length;ft++)e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,ut.__webglMultisampledFramebuffer);const it=B.texture.mipmaps;it&&it.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer);for(let ft=0;ft<R.length;ft++){if(B.resolveDepthBuffer&&(B.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),B.stencilBuffer&&B.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),et){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);const Rt=n.get(R[ft]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Rt,0)}i.blitFramebuffer(0,0,X,Z,0,0,X,Z,tt,i.NEAREST),c===!0&&(he.length=0,we.length=0,he.push(i.COLOR_ATTACHMENT0+ft),B.depthBuffer&&B.storeMultisampledDepthBuffer===!1&&(he.push(ct),we.push(ct),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,we)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,he))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),et)for(let ft=0;ft<R.length;ft++){e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);const Rt=n.get(R[ft]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,Rt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglMultisampledFramebuffer)}else if(B.depthBuffer&&B.storeMultisampledDepthBuffer===!1&&c){const R=B.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[R])}}}function pe(B){return Math.min(r.maxSamples,B.samples)}function ge(B){const R=n.get(B);return B.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function V(B){const R=a.render.frame;h.get(B)!==R&&(h.set(B,R),B.update())}function Ie(B,R){const X=B.colorSpace,Z=B.format,tt=B.type;return B.isCompressedTexture===!0||B.isVideoTexture===!0||X!==Qs&&X!==pi&&(qt.getTransfer(X)===re?(Z!==un||tt!==Je)&&Lt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):jt("WebGLTextures: Unsupported texture color space:",X)),R}function ie(B){return typeof HTMLImageElement<"u"&&B instanceof HTMLImageElement?(l.width=B.naturalWidth||B.width,l.height=B.naturalHeight||B.height):typeof VideoFrame<"u"&&B instanceof VideoFrame?(l.width=B.displayWidth,l.height=B.displayHeight):(l.width=B.width,l.height=B.height),l}this.allocateTextureUnit=U,this.resetTextureUnits=N,this.getTextureUnits=P,this.setTextureUnits=C,this.setTexture2D=z,this.setTexture2DArray=D,this.setTexture3D=O,this.setTextureCube=k,this.rebindTextures=Qt,this.setupRenderTarget=ce,this.updateRenderTargetMipmap=Xt,this.updateMultisampleRenderTarget=He,this.setupDepthRenderbuffer=Nt,this.setupFrameBufferTexture=St,this.useMultisampledRTT=ge,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function B_(i,t){function e(n,r=pi){let s;const a=qt.getTransfer(r);if(n===Je)return i.UNSIGNED_BYTE;if(n===xc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Sc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===xf)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Sf)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===_f)return i.BYTE;if(n===vf)return i.SHORT;if(n===qr)return i.UNSIGNED_SHORT;if(n===vc)return i.INT;if(n===Pn)return i.UNSIGNED_INT;if(n===ln)return i.FLOAT;if(n===In)return i.HALF_FLOAT;if(n===Mf)return i.ALPHA;if(n===yf)return i.RGB;if(n===un)return i.RGBA;if(n===Zn)return i.DEPTH_COMPONENT;if(n===Ti)return i.DEPTH_STENCIL;if(n===Mc)return i.RED;if(n===yc)return i.RED_INTEGER;if(n===Li)return i.RG;if(n===Ec)return i.RG_INTEGER;if(n===bc)return i.RGBA_INTEGER;if(n===Vs||n===Ws||n===Xs||n===$s)if(a===re)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Vs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ws)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Xs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===$s)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Vs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ws)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Xs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===$s)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===wo||n===To||n===Ao||n===Ro)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===wo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===To)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ao)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ro)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Co||n===Po||n===Io||n===Lo||n===Do||n===Zs||n===No)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Co||n===Po)return a===re?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Io)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===Lo)return s.COMPRESSED_R11_EAC;if(n===Do)return s.COMPRESSED_SIGNED_R11_EAC;if(n===Zs)return s.COMPRESSED_RG11_EAC;if(n===No)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Uo||n===Fo||n===Oo||n===Bo||n===zo||n===ko||n===Go||n===Ho||n===Vo||n===Wo||n===Xo||n===$o||n===qo||n===Yo)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Uo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Fo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Oo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Bo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===zo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ko)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Go)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ho)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Vo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Wo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Xo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===$o)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===qo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Yo)return a===re?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ko||n===Zo||n===Jo)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===Ko)return a===re?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Zo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Jo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Qo||n===jo||n===Js||n===tc)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===Qo)return s.COMPRESSED_RED_RGTC1_EXT;if(n===jo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Js)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===tc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Yr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const z_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,k_=`
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

}`;class G_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Df(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Ln({vertexShader:z_,fragmentShader:k_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new tn(new la(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class H_ extends Di{constructor(t,e){super();const n=this;let r=null,s=1,a=null,o="local-floor",c=1,l=null,h=null,p=null,f=null,u=null,d=null;const _=typeof XRWebGLBinding<"u",g=new G_,m={},x=e.getContextAttributes();let y=null,v=null;const E=[],S=[],b=new $t;let M=null,w=null;const A=new Me;A.viewport=new Yt;const T=new Me;T.viewport=new Yt;const L=[A,T],N=new Zd;let P=null,C=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let j=E[W];return j===void 0&&(j=new wa,E[W]=j),j.getTargetRaySpace()},this.getControllerGrip=function(W){let j=E[W];return j===void 0&&(j=new wa,E[W]=j),j.getGripSpace()},this.getHand=function(W){let j=E[W];return j===void 0&&(j=new wa,E[W]=j),j.getHandSpace()};function U(W){const j=S.indexOf(W.inputSource);if(j===-1)return;const ot=E[j];ot!==void 0&&(ot.update(W.inputSource,W.frame,l||a),ot.dispatchEvent({type:W.type,data:W.inputSource}))}function F(){r.removeEventListener("select",U),r.removeEventListener("selectstart",U),r.removeEventListener("selectend",U),r.removeEventListener("squeeze",U),r.removeEventListener("squeezestart",U),r.removeEventListener("squeezeend",U),r.removeEventListener("end",F),r.removeEventListener("inputsourceschange",z);for(let W=0;W<E.length;W++){const j=S[W];j!==null&&(S[W]=null,E[W].disconnect(j))}P=null,C=null,g.reset();for(const W in m)delete m[W];if(t.setRenderTarget(y),u=null,f=null,p=null,r=null,v=null,lt.stop(),n.isPresenting=!1,t.setPixelRatio(M),t.setSize(b.width,b.height,!1),w!==null){const W=w.camera;W.fov=w.fov,W.zoom=w.zoom,W.updateProjectionMatrix(),w=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){s=W,n.isPresenting===!0&&Lt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){o=W,n.isPresenting===!0&&Lt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(W){l=W},this.getBaseLayer=function(){return f!==null?f:u},this.getBinding=function(){return p===null&&_&&(p=new XRWebGLBinding(r,e)),p},this.getFrame=function(){return d},this.getSession=function(){return r},this.setSession=async function(W){if(r=W,r!==null){if(y=t.getRenderTarget(),r.addEventListener("select",U),r.addEventListener("selectstart",U),r.addEventListener("selectend",U),r.addEventListener("squeeze",U),r.addEventListener("squeezestart",U),r.addEventListener("squeezeend",U),r.addEventListener("end",F),r.addEventListener("inputsourceschange",z),x.xrCompatible!==!0&&await e.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(b),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let ot=null,Dt=null,St=null;x.depth&&(St=x.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ot=x.stencil?Ti:Zn,Dt=x.stencil?Yr:Pn);const Bt={colorFormat:e.RGBA8,depthFormat:St,scaleFactor:s};p=this.getBinding(),f=p.createProjectionLayer(Bt),r.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),v=new xn(f.textureWidth,f.textureHeight,{format:un,type:Je,depthTexture:new Jr(f.textureWidth,f.textureHeight,Dt,void 0,void 0,void 0,void 0,void 0,void 0,ot),stencilBuffer:x.stencil,colorSpace:t.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{const ot={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:s};u=new XRWebGLLayer(r,e,ot),r.updateRenderState({baseLayer:u}),t.setPixelRatio(1),t.setSize(u.framebufferWidth,u.framebufferHeight,!1),v=new xn(u.framebufferWidth,u.framebufferHeight,{format:un,type:Je,colorSpace:t.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await r.requestReferenceSpace(o),lt.setContext(r),lt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function z(W){for(let j=0;j<W.removed.length;j++){const ot=W.removed[j],Dt=S.indexOf(ot);Dt>=0&&(S[Dt]=null,E[Dt].disconnect(ot))}for(let j=0;j<W.added.length;j++){const ot=W.added[j];let Dt=S.indexOf(ot);if(Dt===-1){for(let Bt=0;Bt<E.length;Bt++)if(Bt>=S.length){S.push(ot),Dt=Bt;break}else if(S[Bt]===null){S[Bt]=ot,Dt=Bt;break}if(Dt===-1)break}const St=E[Dt];St&&St.connect(ot)}}const D=new K,O=new K;function k(W,j,ot){D.setFromMatrixPosition(j.matrixWorld),O.setFromMatrixPosition(ot.matrixWorld);const Dt=D.distanceTo(O),St=j.projectionMatrix.elements,Bt=ot.projectionMatrix.elements,te=St[14]/(St[10]-1),Nt=St[14]/(St[10]+1),Qt=(St[9]+1)/St[5],ce=(St[9]-1)/St[5],Xt=(St[8]-1)/St[0],he=(Bt[8]+1)/Bt[0],we=te*Xt,He=te*he,pe=Dt/(-Xt+he),ge=pe*-Xt;if(j.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(ge),W.translateZ(pe),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),St[10]===-1)W.projectionMatrix.copy(j.projectionMatrix),W.projectionMatrixInverse.copy(j.projectionMatrixInverse);else{const V=te+pe,Ie=Nt+pe,ie=we-ge,B=He+(Dt-ge),R=Qt*Nt/Ie*V,X=ce*Nt/Ie*V;W.projectionMatrix.makePerspective(ie,B,R,X,V,Ie),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function J(W,j){j===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(j.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(r===null)return;let j=W.near,ot=W.far;g.texture!==null&&(g.depthNear>0&&(j=g.depthNear),g.depthFar>0&&(ot=g.depthFar)),N.near=T.near=A.near=j,N.far=T.far=A.far=ot,(P!==N.near||C!==N.far)&&(r.updateRenderState({depthNear:N.near,depthFar:N.far}),P=N.near,C=N.far),N.layers.mask=W.layers.mask|6,A.layers.mask=N.layers.mask&-5,T.layers.mask=N.layers.mask&-3;const Dt=W.parent,St=N.cameras;J(N,Dt);for(let Bt=0;Bt<St.length;Bt++)J(St[Bt],Dt);St.length===2?k(N,A,T):N.projectionMatrix.copy(A.projectionMatrix),w===null&&W.isPerspectiveCamera&&(w={camera:W,fov:W.fov,zoom:W.zoom}),$(W,N,Dt)};function $(W,j,ot){ot===null?W.matrix.copy(j.matrixWorld):(W.matrix.copy(ot.matrixWorld),W.matrix.invert(),W.matrix.multiply(j.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(j.projectionMatrix),W.projectionMatrixInverse.copy(j.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=vr*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(f===null&&u===null))return c},this.setFoveation=function(W){c=W,f!==null&&(f.fixedFoveation=W),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=W)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(N)},this.getCameraTexture=function(W){return m[W]};let rt=null;function at(W,j){if(h=j.getViewerPose(l||a),d=j,h!==null){const ot=h.views;u!==null&&(t.setRenderTargetFramebuffer(v,u.framebuffer),t.setRenderTarget(v));let Dt=!1;ot.length!==N.cameras.length&&(N.cameras.length=0,Dt=!0);for(let Nt=0;Nt<ot.length;Nt++){const Qt=ot[Nt];let ce=null;if(u!==null)ce=u.getViewport(Qt);else{const he=p.getViewSubImage(f,Qt);ce=he.viewport,Nt===0&&(t.setRenderTargetTextures(v,he.colorTexture,he.depthStencilTexture),t.setRenderTarget(v))}let Xt=L[Nt];Xt===void 0&&(Xt=new Me,Xt.layers.enable(Nt),Xt.viewport=new Yt,L[Nt]=Xt),Xt.matrix.fromArray(Qt.transform.matrix),Xt.matrix.decompose(Xt.position,Xt.quaternion,Xt.scale),Xt.projectionMatrix.fromArray(Qt.projectionMatrix),Xt.projectionMatrixInverse.copy(Xt.projectionMatrix).invert(),Xt.viewport.set(ce.x,ce.y,ce.width,ce.height),Nt===0&&(N.matrix.copy(Xt.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Dt===!0&&N.cameras.push(Xt)}const St=r.enabledFeatures;if(St&&St.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&_){p=n.getBinding();const Nt=p.getDepthInformation(ot[0]);Nt&&Nt.isValid&&Nt.texture&&g.init(Nt,r.renderState)}if(St&&St.includes("camera-access")&&_){t.state.unbindTexture(),p=n.getBinding();for(let Nt=0;Nt<ot.length;Nt++){const Qt=ot[Nt].camera;if(Qt){let ce=m[Qt];ce||(ce=new Df,m[Qt]=ce);const Xt=p.getCameraImage(Qt);ce.sourceTexture=Xt}}}}for(let ot=0;ot<E.length;ot++){const Dt=S[ot],St=E[ot];Dt!==null&&St!==void 0&&St.update(Dt,j,l||a)}rt&&rt(W,j),j.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:j}),d=null}const lt=new Ff;lt.setAnimationLoop(at),this.setAnimationLoop=function(W){rt=W},this.dispose=function(){}}}const V_=new Kt,Vf=new Ut;Vf.set(-1,0,0,0,1,0,0,0,1);function W_(i,t){function e(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,Nf(i)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function r(g,m,x,y,v){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(g,m):m.isMeshLambertMaterial?(s(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(g,m),p(g,m)):m.isMeshPhongMaterial?(s(g,m),h(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(g,m),f(g,m),m.isMeshPhysicalMaterial&&u(g,m,v)):m.isMeshMatcapMaterial?(s(g,m),d(g,m)):m.isMeshDepthMaterial?s(g,m):m.isMeshDistanceMaterial?(s(g,m),_(g,m)):m.isMeshNormalMaterial?s(g,m):m.isLineBasicMaterial?(a(g,m),m.isLineDashedMaterial&&o(g,m)):m.isPointsMaterial?c(g,m,x,y):m.isSpriteMaterial?l(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,e(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===$e&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,e(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===$e&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,e(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,e(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);const x=t.get(m),y=x.envMap,v=x.envMapRotation;y&&(g.envMap.value=y,g.envMapRotation.value.setFromMatrix4(V_.makeRotationFromEuler(v)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Vf),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,g.aoMapTransform))}function a(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform))}function o(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function c(g,m,x,y){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*x,g.scale.value=y*.5,m.map&&(g.map.value=m.map,e(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function l(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function p(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function f(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function u(g,m,x){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===$e&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=x.texture,g.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,g.specularIntensityMapTransform))}function d(g,m){m.matcap&&(g.matcap.value=m.matcap)}function _(g,m){const x=t.get(m).light;g.referencePosition.value.setFromMatrixPosition(x.matrixWorld),g.nearDistance.value=x.shadow.camera.near,g.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function X_(i,t,e,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(v,E){const S=E.program;n.uniformBlockBinding(v,S)}function l(v,E){let S=r[v.id];S===void 0&&(g(v),S=h(v),r[v.id]=S,v.addEventListener("dispose",x));const b=E.program;n.updateUBOMapping(v,b);const M=t.render.frame;s[v.id]!==M&&(f(v),s[v.id]=M)}function h(v){const E=p();v.__bindingPointIndex=E;const S=i.createBuffer(),b=v.__size,M=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,b,M),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,S),S}function p(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return jt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(v){const E=r[v.id],S=v.uniforms,b=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let M=0,w=S.length;M<w;M++){const A=S[M];if(Array.isArray(A))for(let T=0,L=A.length;T<L;T++)u(A[T],M,T,b);else u(A,M,0,b)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(v,E,S,b){if(_(v,E,S,b)===!0){const M=v.__offset,w=v.value;if(Array.isArray(w)){let A=0;for(let T=0;T<w.length;T++){const L=w[T],N=m(L);d(L,v.__data,A),typeof L!="number"&&typeof L!="boolean"&&!L.isMatrix3&&!ArrayBuffer.isView(L)&&(A+=N.storage/Float32Array.BYTES_PER_ELEMENT)}}else d(w,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,M,v.__data)}}function d(v,E,S){typeof v=="number"||typeof v=="boolean"?E[0]=v:v.isMatrix3?(E[0]=v.elements[0],E[1]=v.elements[1],E[2]=v.elements[2],E[3]=0,E[4]=v.elements[3],E[5]=v.elements[4],E[6]=v.elements[5],E[7]=0,E[8]=v.elements[6],E[9]=v.elements[7],E[10]=v.elements[8],E[11]=0):ArrayBuffer.isView(v)?E.set(new v.constructor(v.buffer,v.byteOffset,E.length)):v.toArray(E,S)}function _(v,E,S,b){const M=v.value,w=E+"_"+S;if(b[w]===void 0)return typeof M=="number"||typeof M=="boolean"?b[w]=M:ArrayBuffer.isView(M)?b[w]=M.slice():b[w]=M.clone(),!0;{const A=b[w];if(typeof M=="number"||typeof M=="boolean"){if(A!==M)return b[w]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(A.equals(M)===!1)return A.copy(M),!0}}return!1}function g(v){const E=v.uniforms;let S=0;const b=16;for(let w=0,A=E.length;w<A;w++){const T=Array.isArray(E[w])?E[w]:[E[w]];for(let L=0,N=T.length;L<N;L++){const P=T[L],C=Array.isArray(P.value)?P.value:[P.value];for(let U=0,F=C.length;U<F;U++){const z=C[U],D=m(z),O=S%b,k=O%D.boundary,J=O+k;S+=k,J!==0&&b-J<D.storage&&(S+=b-J),P.__data=new Float32Array(D.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=S,S+=D.storage}}}const M=S%b;return M>0&&(S+=b-M),v.__size=S,v.__cache={},this}function m(v){const E={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(E.boundary=4,E.storage=4):v.isVector2?(E.boundary=8,E.storage=8):v.isVector3||v.isColor?(E.boundary=16,E.storage=12):v.isVector4?(E.boundary=16,E.storage=16):v.isMatrix3?(E.boundary=48,E.storage=48):v.isMatrix4?(E.boundary=64,E.storage=64):v.isTexture?Lt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(E.boundary=16,E.storage=v.byteLength):Lt("WebGLRenderer: Unsupported uniform value type.",v),E}function x(v){const E=v.target;E.removeEventListener("dispose",x);const S=a.indexOf(E.__bindingPointIndex);a.splice(S,1),i.deleteBuffer(r[E.id]),delete r[E.id],delete s[E.id]}function y(){for(const v in r)i.deleteBuffer(r[v]);a=[],r={},s={}}return{bind:c,update:l,dispose:y}}const $_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let bn=null;function q_(){return bn===null&&(bn=new Pc($_,16,16,Li,In),bn.name="DFG_LUT",bn.minFilter=Fe,bn.magFilter=Fe,bn.wrapS=$n,bn.wrapT=$n,bn.generateMipmaps=!1,bn.needsUpdate=!0),bn}class Y_{constructor(t={}){const{canvas:e=kh(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:f=!1,outputBufferType:u=Je}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=a;const _=u,g=new Set([bc,Ec,yc]),m=new Set([Je,Pn,qr,Yr,xc,Sc]),x=new Uint32Array(4),y=new Int32Array(4),v=new K;let E=null,S=null;const b=[],M=[];let w=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Cn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const A=this;let T=!1,L=null,N=null,P=null,C=null;this._outputColorSpace=an;let U=0,F=0,z=null,D=-1,O=null;const k=new Yt,J=new Yt;let $=null;const rt=new Wt(0);let at=0,lt=e.width,W=e.height,j=1,ot=null,Dt=null;const St=new Yt(0,0,lt,W),Bt=new Yt(0,0,lt,W);let te=!1;const Nt=new Ic;let Qt=!1,ce=!1;const Xt=new Kt,he=new K,we=new Yt,He={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let pe=!1;function ge(){return z===null?j:1}let V=n;function Ie(I,G){return e.getContext(I,G)}let ie,B,R,X,Z,tt,ct,ut,et,it,ft,Rt,mt,ht,Ct,It,Ft,H,dt,nt,pt,xt,st;try{const I={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${_c}`),e.addEventListener("webglcontextlost",le,!1),e.addEventListener("webglcontextrestored",ee,!1),e.addEventListener("webglcontextcreationerror",hn,!1),V===null){const G="webgl2";if(V=Ie(G,I),V===null)throw Ie(G)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Pt()}catch(I){throw e.removeEventListener("webglcontextlost",le,!1),e.removeEventListener("webglcontextrestored",ee,!1),e.removeEventListener("webglcontextcreationerror",hn,!1),jt("WebGLRenderer: "+I.message),I}function Pt(){ie=new q0(V),ie.init(),pt=new B_(V,ie),B=new O0(V,ie,t,pt),R=new F_(V,ie),B.reversedDepthBuffer&&f&&R.buffers.depth.setReversed(!0),N=V.createFramebuffer(),P=V.createFramebuffer(),C=V.createFramebuffer(),X=new Z0(V),Z=new y_,tt=new O_(V,ie,R,Z,B,pt,X),ct=new $0(A),ut=new Qd(V),xt=new U0(V,ut),et=new Y0(V,ut,X,xt),it=new Q0(V,et,ut,xt,X),H=new J0(V,B,tt),Ct=new B0(Z),ft=new M_(A,ct,ie,B,xt,Ct),Rt=new W_(A,Z),mt=new b_,ht=new P_(ie),Ft=new N0(A,ct,R,it,d,c),It=new U_(A,it,B),st=new X_(V,X,B,R),dt=new F0(V,ie,X),nt=new K0(V,ie,X),X.programs=ft.programs,A.capabilities=B,A.extensions=ie,A.properties=Z,A.renderLists=mt,A.shadowMap=It,A.state=R,A.info=X}_!==Je&&(w=new tg(_,e.width,e.height,o,r,s));const Tt=new H_(A,V);this.xr=Tt,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){const I=ie.get("WEBGL_lose_context");I&&I.loseContext()},this.forceContextRestore=function(){const I=ie.get("WEBGL_lose_context");I&&I.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(I){I!==void 0&&(j=I,this.setSize(lt,W,!1))},this.getSize=function(I){return I.set(lt,W)},this.setSize=function(I,G,Q=!0){if(Tt.isPresenting){Lt("WebGLRenderer: Can't change size while VR device is presenting.");return}lt=I,W=G,e.width=Math.floor(I*j),e.height=Math.floor(G*j),Q===!0&&(e.style.width=I+"px",e.style.height=G+"px"),w!==null&&w.setSize(e.width,e.height),this.setViewport(0,0,I,G)},this.getDrawingBufferSize=function(I){return I.set(lt*j,W*j).floor()},this.setDrawingBufferSize=function(I,G,Q){lt=I,W=G,j=Q,e.width=Math.floor(I*Q),e.height=Math.floor(G*Q),this.setViewport(0,0,I,G)},this.setEffects=function(I){if(_===Je){jt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(I){for(let G=0;G<I.length;G++)if(I[G].isOutputPass===!0){Lt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(I||[])},this.getCurrentViewport=function(I){return I.copy(k)},this.getViewport=function(I){return I.copy(St)},this.setViewport=function(I,G,Q,q){I.isVector4?St.set(I.x,I.y,I.z,I.w):St.set(I,G,Q,q),R.viewport(k.copy(St).multiplyScalar(j).round())},this.getScissor=function(I){return I.copy(Bt)},this.setScissor=function(I,G,Q,q){I.isVector4?Bt.set(I.x,I.y,I.z,I.w):Bt.set(I,G,Q,q),R.scissor(J.copy(Bt).multiplyScalar(j).round())},this.getScissorTest=function(){return te},this.setScissorTest=function(I){R.setScissorTest(te=I)},this.setOpaqueSort=function(I){ot=I},this.setTransparentSort=function(I){Dt=I},this.getClearColor=function(I){return I.copy(Ft.getClearColor())},this.setClearColor=function(){Ft.setClearColor(...arguments)},this.getClearAlpha=function(){return Ft.getClearAlpha()},this.setClearAlpha=function(){Ft.setClearAlpha(...arguments)},this.clear=function(I=!0,G=!0,Q=!0){let q=0;if(I){let Y=!1;if(z!==null){const vt=z.texture.format;Y=g.has(vt)}if(Y){const vt=z.texture.type,yt=m.has(vt),_t=Ft.getClearColor(),bt=Ft.getClearAlpha(),At=_t.r,zt=_t.g,Vt=_t.b;yt?(x[0]=At,x[1]=zt,x[2]=Vt,x[3]=bt,V.clearBufferuiv(V.COLOR,0,x)):(y[0]=At,y[1]=zt,y[2]=Vt,y[3]=bt,V.clearBufferiv(V.COLOR,0,y))}else q|=V.COLOR_BUFFER_BIT}G&&(q|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Q&&(q|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),q!==0&&V.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(I){I.setRenderer(this),L=I},this.dispose=function(){e.removeEventListener("webglcontextlost",le,!1),e.removeEventListener("webglcontextrestored",ee,!1),e.removeEventListener("webglcontextcreationerror",hn,!1),Ft.dispose(),mt.dispose(),ht.dispose(),Z.dispose(),ct.dispose(),it.dispose(),xt.dispose(),st.dispose(),ft.dispose(),Tt.dispose(),Tt.removeEventListener("sessionstart",zc),Tt.removeEventListener("sessionend",kc),gi.stop()};function le(I){I.preventDefault(),ta("WebGLRenderer: Context Lost."),T=!0}function ee(){ta("WebGLRenderer: Context Restored."),T=!1;const I=X.autoReset,G=It.enabled,Q=It.autoUpdate,q=It.needsUpdate,Y=It.type;Pt(),X.autoReset=I,It.enabled=G,It.autoUpdate=Q,It.needsUpdate=q,It.type=Y}function hn(I){jt("WebGLRenderer: A WebGL context could not be created. Reason: ",I.statusMessage)}function Mn(I){const G=I.target;G.removeEventListener("dispose",Mn),Kf(G)}function Kf(I){Zf(I),Z.remove(I)}function Zf(I){const G=Z.get(I).programs;G!==void 0&&(G.forEach(function(Q){ft.releaseProgram(Q)}),I.isShaderMaterial&&ft.releaseShaderCache(I))}this.renderBufferDirect=function(I,G,Q,q,Y,vt){G===null&&(G=He);const yt=Y.isMesh&&Y.matrixWorld.determinantAffine()<0,_t=jf(I,G,Q,q,Y);R.setMaterial(q,yt);let bt=Q.index,At=1;if(q.wireframe===!0){if(bt=et.getWireframeAttribute(Q),bt===void 0)return;At=2}const zt=Q.drawRange,Vt=Q.attributes.position;let wt=zt.start*At,ne=(zt.start+zt.count)*At;vt!==null&&(wt=Math.max(wt,vt.start*At),ne=Math.min(ne,(vt.start+vt.count)*At)),bt!==null?(wt=Math.max(wt,0),ne=Math.min(ne,bt.count)):Vt!=null&&(wt=Math.max(wt,0),ne=Math.min(ne,Vt.count));const _e=ne-wt;if(_e<0||_e===1/0)return;xt.setup(Y,q,_t,Q,bt);let fe,oe=dt;if(bt!==null&&(fe=ut.get(bt),oe=nt,oe.setIndex(fe)),Y.isMesh)q.wireframe===!0?(R.setLineWidth(q.wireframeLinewidth*ge()),oe.setMode(V.LINES)):oe.setMode(V.TRIANGLES);else if(Y.isLine){let Le=q.linewidth;Le===void 0&&(Le=1),R.setLineWidth(Le*ge()),Y.isLineSegments?oe.setMode(V.LINES):Y.isLineLoop?oe.setMode(V.LINE_LOOP):oe.setMode(V.LINE_STRIP)}else Y.isPoints?oe.setMode(V.POINTS):Y.isSprite&&oe.setMode(V.TRIANGLES);if(Y.isBatchedMesh)if(ie.get("WEBGL_multi_draw"))oe.renderMultiDraw(Y._multiDrawStarts,Y._multiDrawCounts,Y._multiDrawCount);else{const Le=Y._multiDrawStarts,Mt=Y._multiDrawCounts,Be=Y._multiDrawCount,Zt=bt?ut.get(bt).bytesPerElement:1,en=Z.get(q).currentProgram.getUniforms();for(let yn=0;yn<Be;yn++)en.setValue(V,"_gl_DrawID",yn),oe.render(Le[yn]/Zt,Mt[yn])}else if(Y.isInstancedMesh)oe.renderInstances(wt,_e,Y.count);else if(Q.isInstancedBufferGeometry){const Le=Q._maxInstanceCount!==void 0?Q._maxInstanceCount:1/0,Mt=Math.min(Q.instanceCount,Le);oe.renderInstances(wt,_e,Mt)}else oe.render(wt,_e)};function Bc(I,G,Q,q){L!==null&&I.isNodeMaterial&&L.setObject(q,I),Qt===!0&&Ct.setState(I,Q,!1),I.transparent===!0&&I.side===Wn&&I.forceSinglePass===!1?(I.side=$e,I.needsUpdate=!0,as(I,G,q),I.side=Pi,I.needsUpdate=!0,as(I,G,q),I.side=Wn):as(I,G,q)}this.compile=function(I,G,Q=null){Q===null&&(Q=I),L!==null&&L.renderStart(I,G,Q),S=ht.get(Q),S.init(G),M.push(S),Q.traverseVisible(function(Y){Y.isLight&&Y.layers.test(G.layers)&&(S.pushLight(Y),Y.castShadow&&S.pushShadow(Y))}),I!==Q&&I.traverseVisible(function(Y){Y.isLight&&Y.layers.test(G.layers)&&(S.pushLight(Y),Y.castShadow&&S.pushShadow(Y))}),S.setupLights(),L!==null&&L.updateLights(S.state.lightsArray),ce=this.localClippingEnabled,Qt=Ct.init(this.clippingPlanes,ce),Qt===!0&&Ct.setGlobalState(this.clippingPlanes,G),L!==null&&It.render(S.state.shadowsArray,Q,G);const q=new Set;return I.traverse(function(Y){if(!(Y.isMesh||Y.isPoints||Y.isLine||Y.isSprite))return;const vt=Y.material;if(vt)if(Array.isArray(vt))for(let yt=0;yt<vt.length;yt++){const _t=vt[yt];Bc(_t,Q,G,Y),q.add(_t)}else Bc(vt,Q,G,Y),q.add(vt)}),S=M.pop(),L!==null&&L.renderEnd(),q},this.compileAsync=function(I,G,Q=null){const q=this.compile(I,G,Q);return new Promise(Y=>{function vt(){if(q.forEach(function(yt){const bt=Z.get(yt).currentProgram;(bt===void 0||bt.isReady())&&q.delete(yt)}),q.size===0){Y(I);return}setTimeout(vt,10)}ie.get("KHR_parallel_shader_compile")!==null?vt():setTimeout(vt,10)})};let da=null;function Jf(I){da&&da(I)}function zc(){gi.stop()}function kc(){gi.start()}const gi=new Ff;gi.setAnimationLoop(Jf),typeof self<"u"&&gi.setContext(self),this.setAnimationLoop=function(I){da=I,Tt.setAnimationLoop(I),I===null?gi.stop():gi.start()},Tt.addEventListener("sessionstart",zc),Tt.addEventListener("sessionend",kc),this.render=function(I,G){if(G!==void 0&&G.isCamera!==!0){jt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;L!==null&&L.renderStart(I,G);const Q=Tt.enabled===!0&&Tt.isPresenting===!0,q=w!==null&&(z===null||Q)&&w.begin(A,z);if(I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),Tt.enabled===!0&&Tt.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Tt.cameraAutoUpdate===!0&&Tt.updateCamera(G),G=Tt.getCamera()),I.isScene===!0&&I.onBeforeRender(A,I,G,z),S=ht.get(I,M.length),S.init(G),S.state.textureUnits=tt.getTextureUnits(),M.push(S),Xt.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),Nt.setFromProjectionMatrix(Xt,Rn,G.reversedDepth),ce=this.localClippingEnabled,Qt=Ct.init(this.clippingPlanes,ce),E=mt.get(I,b.length),E.init(),b.push(E),Tt.enabled===!0&&Tt.isPresenting===!0){const yt=A.xr.getDepthSensingMesh();yt!==null&&pa(yt,G,-1/0,A.sortObjects)}pa(I,G,0,A.sortObjects),E.finish(),L!==null&&L.updateLights(S.state.lightsArray),A.sortObjects===!0&&E.sort(ot,Dt),pe=Tt.enabled===!1||Tt.isPresenting===!1||Tt.hasDepthSensing()===!1,pe&&Ft.addToRenderList(E,I),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Qt===!0&&Ct.beginShadows();const Y=S.state.shadowsArray;if(It.render(Y,I,G),Qt===!0&&Ct.endShadows(),(q&&w.hasRenderPass())===!1){const yt=E.opaque,_t=E.transmissive;if(S.setupLights(),G.isArrayCamera){const bt=G.cameras;if(_t.length>0)for(let At=0,zt=bt.length;At<zt;At++){const Vt=bt[At];Hc(yt,_t,I,Vt)}pe&&Ft.render(I);for(let At=0,zt=bt.length;At<zt;At++){const Vt=bt[At];Gc(E,I,Vt,Vt.viewport)}}else _t.length>0&&Hc(yt,_t,I,G),pe&&Ft.render(I),Gc(E,I,G)}z!==null&&F===0&&(tt.updateMultisampleRenderTarget(z),tt.updateRenderTargetMipmap(z)),q&&w.end(A),I.isScene===!0&&I.onAfterRender(A,I,G),xt.resetDefaultState(),D=-1,O=null,M.pop(),M.length>0?(S=M[M.length-1],tt.setTextureUnits(S.state.textureUnits),Qt===!0&&Ct.setGlobalState(A.clippingPlanes,S.state.camera)):S=null,b.pop(),b.length>0?E=b[b.length-1]:E=null,L!==null&&L.renderEnd()};function pa(I,G,Q,q){if(I.visible===!1)return;if(I.layers.test(G.layers)){if(I.isGroup)Q=I.renderOrder;else if(I.isLOD)I.autoUpdate===!0&&I.update(G);else if(I.isLightProbeGrid)S.pushLightProbeGrid(I);else if(I.isLight)S.pushLight(I),I.castShadow&&S.pushShadow(I);else if(I.isSprite){if(!I.frustumCulled||I.intersectsFrustum(Nt)){q&&we.setFromMatrixPosition(I.matrixWorld).applyMatrix4(Xt);const yt=it.update(I),_t=I.material;_t.visible&&E.push(I,yt,_t,Q,we.z,null,G)}}else if((I.isMesh||I.isLine||I.isPoints)&&(!I.frustumCulled||I.intersectsFrustum(Nt))){const yt=it.update(I),_t=I.material;if(q&&(I.boundingSphere!==void 0?(I.boundingSphere===null&&I.computeBoundingSphere(),we.copy(I.boundingSphere.center)):(yt.boundingSphere===null&&yt.computeBoundingSphere(),we.copy(yt.boundingSphere.center)),we.applyMatrix4(I.matrixWorld).applyMatrix4(Xt)),Array.isArray(_t)){const bt=yt.groups;for(let At=0,zt=bt.length;At<zt;At++){const Vt=bt[At],wt=_t[Vt.materialIndex];wt&&wt.visible&&E.push(I,yt,wt,Q,we.z,Vt,G)}}else _t.visible&&E.push(I,yt,_t,Q,we.z,null,G)}}const vt=I.children;for(let yt=0,_t=vt.length;yt<_t;yt++)pa(vt[yt],G,Q,q)}function Gc(I,G,Q,q){const{opaque:Y,transmissive:vt,transparent:yt}=I;S.setupLightsView(Q),Qt===!0&&Ct.setGlobalState(A.clippingPlanes,Q),q&&R.viewport(k.copy(q)),Y.length>0&&ss(Y,G,Q),vt.length>0&&ss(vt,G,Q),yt.length>0&&ss(yt,G,Q),R.buffers.depth.setTest(!0),R.buffers.depth.setMask(!0),R.buffers.color.setMask(!0),R.setPolygonOffset(!1)}function Hc(I,G,Q,q){if((Q.isScene===!0?Q.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[q.id]===void 0){const wt=ie.has("EXT_color_buffer_half_float")||ie.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[q.id]=new xn(1,1,{generateMipmaps:!0,type:wt?In:Je,minFilter:wi,samples:Math.max(4,B.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:qt.workingColorSpace})}const vt=S.state.transmissionRenderTarget[q.id],yt=q.viewport||k;vt.setSize(yt.z*A.transmissionResolutionScale,yt.w*A.transmissionResolutionScale);const _t=A.getRenderTarget(),bt=A.getActiveCubeFace(),At=A.getActiveMipmapLevel();A.setRenderTarget(vt),A.getClearColor(rt),at=A.getClearAlpha(),at<1&&A.setClearColor(16777215,.5),A.clear(),pe&&Ft.render(Q);const zt=A.toneMapping;A.toneMapping=Cn;const Vt=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),S.setupLightsView(q),Qt===!0&&Ct.setGlobalState(A.clippingPlanes,q),ss(I,Q,q),tt.updateMultisampleRenderTarget(vt),tt.updateRenderTargetMipmap(vt),ie.has("WEBGL_multisampled_render_to_texture")===!1){let wt=!1;for(let ne=0,_e=G.length;ne<_e;ne++){const fe=G[ne],{object:oe,geometry:Le,material:Mt,group:Be}=fe;if(Mt.side===Wn&&oe.layers.test(q.layers)){const Zt=Mt.side;Mt.side=$e,Mt.needsUpdate=!0,Vc(oe,Q,q,Le,Mt,Be),Mt.side=Zt,Mt.needsUpdate=!0,wt=!0}}wt===!0&&(tt.updateMultisampleRenderTarget(vt),tt.updateRenderTargetMipmap(vt))}A.setRenderTarget(_t,bt,At),A.setClearColor(rt,at),Vt!==void 0&&(q.viewport=Vt),A.toneMapping=zt}function ss(I,G,Q){const q=G.isScene===!0?G.overrideMaterial:null;for(let Y=0,vt=I.length;Y<vt;Y++){const yt=I[Y],{object:_t,geometry:bt,group:At}=yt;let zt=yt.material;zt.allowOverride===!0&&q!==null&&(zt=q),_t.layers.test(Q.layers)&&Vc(_t,G,Q,bt,zt,At)}}function Vc(I,G,Q,q,Y,vt){L!==null&&Y.isNodeMaterial&&L.setObject(I,Y),I.onBeforeRender(A,G,Q,q,Y,vt),I.modelViewMatrix.multiplyMatrices(Q.matrixWorldInverse,I.matrixWorld),I.normalMatrix.getNormalMatrix(I.modelViewMatrix),Y.onBeforeRender(A,G,Q,q,I,vt),Y.transparent===!0&&Y.side===Wn&&Y.forceSinglePass===!1?(Y.side=$e,Y.needsUpdate=!0,A.renderBufferDirect(Q,G,q,Y,I,vt),Y.side=Pi,Y.needsUpdate=!0,A.renderBufferDirect(Q,G,q,Y,I,vt),Y.side=Wn):A.renderBufferDirect(Q,G,q,Y,I,vt),I.onAfterRender(A,G,Q,q,Y,vt)}function as(I,G,Q){G.isScene!==!0&&(G=He);const q=Z.get(I),Y=S.state.lights,vt=S.state.shadowsArray,yt=Y.state.version,_t=ft.getParameters(I,Y.state,vt,G,Q,S.state.lightProbeGridArray),bt=ft.getProgramCacheKey(_t);let At=q.programs;q.environment=I.isMeshStandardMaterial||I.isMeshLambertMaterial||I.isMeshPhongMaterial?G.environment:null,q.fog=G.fog;const zt=I.isMeshStandardMaterial||I.isMeshLambertMaterial&&!I.envMap||I.isMeshPhongMaterial&&!I.envMap;q.envMap=ct.get(I.envMap||q.environment,zt),q.envMapRotation=q.environment!==null&&I.envMap===null?G.environmentRotation:I.envMapRotation,At===void 0&&(I.addEventListener("dispose",Mn),At=new Map,q.programs=At);let Vt=At.get(bt);if(Vt!==void 0){if(q.currentProgram===Vt&&q.lightsStateVersion===yt)return Xc(I,_t),Vt}else _t.uniforms=ft.getUniforms(I),L!==null&&I.isNodeMaterial&&L.build(I,Q,_t),I.onBeforeCompile(_t,A),Vt=ft.acquireProgram(_t,bt),At.set(bt,Vt),q.uniforms=_t.uniforms;const wt=q.uniforms;return(!I.isShaderMaterial&&!I.isRawShaderMaterial||I.clipping===!0)&&(wt.clippingPlanes=Ct.uniform),Xc(I,_t),q.needsLights=eh(I),q.lightsStateVersion=yt,q.needsLights&&(wt.ambientLightColor.value=Y.state.ambient,wt.lightProbe.value=Y.state.probe,wt.sunLights.value=Y.state.sun,wt.sunLightShadows.value=Y.state.sunShadow,wt.directionalLights.value=Y.state.directional,wt.directionalLightShadows.value=Y.state.directionalShadow,wt.spotLights.value=Y.state.spot,wt.spotLightShadows.value=Y.state.spotShadow,wt.rectAreaLights.value=Y.state.rectArea,wt.ltc_1.value=Y.state.rectAreaLTC1,wt.ltc_2.value=Y.state.rectAreaLTC2,wt.pointLights.value=Y.state.point,wt.pointLightShadows.value=Y.state.pointShadow,wt.hemisphereLights.value=Y.state.hemi,wt.sunShadowMatrix.value=Y.state.sunShadowMatrix,wt.sunShadowCascade.value=Y.state.sunShadowCascade,wt.directionalShadowMatrix.value=Y.state.directionalShadowMatrix,wt.spotLightMatrix.value=Y.state.spotLightMatrix,wt.spotLightMap.value=Y.state.spotLightMap,wt.pointShadowMatrix.value=Y.state.pointShadowMatrix),q.lightProbeGrid=S.state.lightProbeGridArray.length>0,q.currentProgram=Vt,q.uniformsList=null,Vt}function Wc(I){if(I.uniformsList===null){const G=I.currentProgram.getUniforms();I.uniformsList=Ys.seqWithValue(G.seq,I.uniforms)}return I.uniformsList}function Xc(I,G){const Q=Z.get(I);Q.outputColorSpace=G.outputColorSpace,Q.batching=G.batching,Q.batchingColor=G.batchingColor,Q.instancing=G.instancing,Q.instancingColor=G.instancingColor,Q.instancingMorph=G.instancingMorph,Q.skinning=G.skinning,Q.morphTargets=G.morphTargets,Q.morphNormals=G.morphNormals,Q.morphColors=G.morphColors,Q.morphTargetsCount=G.morphTargetsCount,Q.numClippingPlanes=G.numClippingPlanes,Q.numIntersection=G.numClipIntersection,Q.vertexAlphas=G.vertexAlphas,Q.vertexTangents=G.vertexTangents,Q.toneMapping=G.toneMapping}function Qf(I,G){if(I.length===0)return null;if(I.length===1)return I[0].texture!==null?I[0]:null;v.setFromMatrixPosition(G.matrixWorld);for(let Q=0,q=I.length;Q<q;Q++){const Y=I[Q];if(Y.texture!==null&&Y.boundingBox.containsPoint(v))return Y}return null}function jf(I,G,Q,q,Y){G.isScene!==!0&&(G=He),tt.resetTextureUnits();const vt=G.fog,yt=q.isMeshStandardMaterial||q.isMeshLambertMaterial||q.isMeshPhongMaterial?G.environment:null,_t=z===null?A.outputColorSpace:z.isXRRenderTarget===!0?z.texture.colorSpace:qt.workingColorSpace,bt=q.isMeshStandardMaterial||q.isMeshLambertMaterial&&!q.envMap||q.isMeshPhongMaterial&&!q.envMap,At=ct.get(q.envMap||yt,bt),zt=q.vertexColors===!0&&!!Q.attributes.color&&Q.attributes.color.itemSize===4,Vt=!!Q.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),wt=!!Q.morphAttributes.position,ne=!!Q.morphAttributes.normal,_e=!!Q.morphAttributes.color;let fe=Cn;q.toneMapped&&(z===null||z.isXRRenderTarget===!0)&&(fe=A.toneMapping);const oe=Q.morphAttributes.position||Q.morphAttributes.normal||Q.morphAttributes.color,Le=oe!==void 0?oe.length:0,Mt=Z.get(q),Be=S.state.lights;if(Qt===!0&&(ce===!0||I!==O)){const ue=I===O&&q.id===D;Ct.setState(q,I,ue)}let Zt=!1;q.version===Mt.__version?(Mt.needsLights&&Mt.lightsStateVersion!==Be.state.version||Mt.outputColorSpace!==_t||Y.isBatchedMesh&&Mt.batching===!1||!Y.isBatchedMesh&&Mt.batching===!0||Y.isBatchedMesh&&Mt.batchingColor===!0&&Y._colorsTexture===null||Y.isBatchedMesh&&Mt.batchingColor===!1&&Y._colorsTexture!==null||Y.isInstancedMesh&&Mt.instancing===!1||!Y.isInstancedMesh&&Mt.instancing===!0||Y.isSkinnedMesh&&Mt.skinning===!1||!Y.isSkinnedMesh&&Mt.skinning===!0||Y.isInstancedMesh&&Mt.instancingColor===!0&&Y.instanceColor===null||Y.isInstancedMesh&&Mt.instancingColor===!1&&Y.instanceColor!==null||Y.isInstancedMesh&&Mt.instancingMorph===!0&&Y.morphTexture===null||Y.isInstancedMesh&&Mt.instancingMorph===!1&&Y.morphTexture!==null||Mt.envMap!==At||q.fog===!0&&Mt.fog!==vt||Mt.numClippingPlanes!==void 0&&(Mt.numClippingPlanes!==Ct.numPlanes||Mt.numIntersection!==Ct.numIntersection)||Mt.vertexAlphas!==zt||Mt.vertexTangents!==Vt||Mt.morphTargets!==wt||Mt.morphNormals!==ne||Mt.morphColors!==_e||Mt.toneMapping!==fe||Mt.morphTargetsCount!==Le||!!Mt.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(Zt=!0):(Zt=!0,Mt.__version=q.version);let en=Mt.currentProgram;Zt===!0&&(en=as(q,G,Y),L&&q.isNodeMaterial&&L.onUpdateProgram(q,en,Mt));let yn=!1,ti=!1,Fi=!1;const ae=en.getUniforms(),me=Mt.uniforms;if(R.useProgram(en.program)&&(yn=!0,ti=!0,Fi=!0),q.id!==D&&(D=q.id,ti=!0),Mt.needsLights){const ue=Qf(S.state.lightProbeGridArray,Y);Mt.lightProbeGrid!==ue&&(Mt.lightProbeGrid=ue,ti=!0)}if(yn||O!==I){R.buffers.depth.getReversed()&&I.reversedDepth!==!0&&(I._reversedDepth=!0,I.updateProjectionMatrix()),ae.setValue(V,"projectionMatrix",I.projectionMatrix),ae.setValue(V,"viewMatrix",I.matrixWorldInverse);const ni=ae.map.cameraPosition;ni!==void 0&&ni.setValue(V,he.setFromMatrixPosition(I.matrixWorld)),B.logarithmicDepthBuffer&&ae.setValue(V,"logDepthBufFC",2/(Math.log(I.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&ae.setValue(V,"isOrthographic",I.isOrthographicCamera===!0),O!==I&&(O=I,ti=!0,Fi=!0)}if(Mt.needsLights&&(Be.state.sunShadowMap.length>0&&ae.setValue(V,"sunShadowMap",Be.state.sunShadowMap,tt),Be.state.directionalShadowMap.length>0&&ae.setValue(V,"directionalShadowMap",Be.state.directionalShadowMap,tt),Be.state.spotShadowMap.length>0&&ae.setValue(V,"spotShadowMap",Be.state.spotShadowMap,tt),Be.state.pointShadowMap.length>0&&ae.setValue(V,"pointShadowMap",Be.state.pointShadowMap,tt)),Y.isSkinnedMesh){ae.setOptional(V,Y,"bindMatrix"),ae.setOptional(V,Y,"bindMatrixInverse");const ue=Y.skeleton;ue&&(ue.boneTexture===null&&ue.computeBoneTexture(),ae.setValue(V,"boneTexture",ue.boneTexture,tt))}Y.isBatchedMesh&&(ae.setOptional(V,Y,"batchingTexture"),ae.setValue(V,"batchingTexture",Y._matricesTexture,tt),ae.setOptional(V,Y,"batchingIdTexture"),ae.setValue(V,"batchingIdTexture",Y._indirectTexture,tt),ae.setOptional(V,Y,"batchingColorTexture"),Y._colorsTexture!==null&&ae.setValue(V,"batchingColorTexture",Y._colorsTexture,tt));const ei=Q.morphAttributes;if((ei.position!==void 0||ei.normal!==void 0||ei.color!==void 0)&&H.update(Y,Q,en),(ti||Mt.receiveShadow!==Y.receiveShadow)&&(Mt.receiveShadow=Y.receiveShadow,ae.setValue(V,"receiveShadow",Y.receiveShadow)),(q.isMeshStandardMaterial||q.isMeshLambertMaterial||q.isMeshPhongMaterial)&&q.envMap===null&&G.environment!==null&&(me.envMapIntensity.value=G.environmentIntensity),me.dfgLUT!==void 0&&(me.dfgLUT.value=q_()),ti){if(ae.setValue(V,"toneMappingExposure",A.toneMappingExposure),Mt.needsLights&&th(me,Fi),vt&&q.fog===!0&&Rt.refreshFogUniforms(me,vt),Rt.refreshMaterialUniforms(me,q,j,W,S.state.transmissionRenderTarget[I.id]),Mt.needsLights&&Mt.lightProbeGrid){const ue=Mt.lightProbeGrid;me.probesSH.value=ue.texture,me.probesMin.value.copy(ue.boundingBox.min),me.probesMax.value.copy(ue.boundingBox.max),me.probesResolution.value.copy(ue.resolution)}Ys.upload(V,Wc(Mt),me,tt)}if(q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Ys.upload(V,Wc(Mt),me,tt),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&ae.setValue(V,"center",Y.center),ae.setValue(V,"modelViewMatrix",Y.modelViewMatrix),ae.setValue(V,"normalMatrix",Y.normalMatrix),ae.setValue(V,"modelMatrix",Y.matrixWorld),q.uniformsGroups!==void 0){const ue=q.uniformsGroups;for(let ni=0,Oi=ue.length;ni<Oi;ni++){const qc=ue[ni];st.update(qc,en),st.bind(qc,en)}}return en}function th(I,G){I.ambientLightColor.needsUpdate=G,I.lightProbe.needsUpdate=G,I.sunLights.needsUpdate=G,I.sunLightShadows.needsUpdate=G,I.directionalLights.needsUpdate=G,I.directionalLightShadows.needsUpdate=G,I.pointLights.needsUpdate=G,I.pointLightShadows.needsUpdate=G,I.spotLights.needsUpdate=G,I.spotLightShadows.needsUpdate=G,I.rectAreaLights.needsUpdate=G,I.hemisphereLights.needsUpdate=G}function eh(I){return I.isMeshLambertMaterial||I.isMeshToonMaterial||I.isMeshPhongMaterial||I.isMeshStandardMaterial||I.isShadowMaterial||I.isShaderMaterial&&I.lights===!0}this.getActiveCubeFace=function(){return U},this.getActiveMipmapLevel=function(){return F},this.getRenderTarget=function(){return z},this.setRenderTargetTextures=function(I,G,Q){const q=Z.get(I);q.__autoAllocateDepthBuffer=I.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),Z.get(I.texture).__webglTexture=G,Z.get(I.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:Q,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(I,G){const Q=Z.get(I);Q.__webglFramebuffer=G,Q.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(I,G=0,Q=0){z=I,U=G,F=Q;let q=null,Y=!1,vt=!1;if(I){const _t=Z.get(I);if(_t.__useDefaultFramebuffer!==void 0){R.bindFramebuffer(V.FRAMEBUFFER,_t.__webglFramebuffer),k.copy(I.viewport),J.copy(I.scissor),$=I.scissorTest,R.viewport(k),R.scissor(J),R.setScissorTest($),D=-1;return}else if(_t.__webglFramebuffer===void 0)tt.setupRenderTarget(I);else if(_t.__hasExternalTextures)tt.rebindTextures(I,Z.get(I.texture).__webglTexture,Z.get(I.depthTexture).__webglTexture);else if(I.depthBuffer){const zt=I.depthTexture;if(_t.__boundDepthTexture!==zt){if(zt!==null&&Z.has(zt)&&(I.width!==zt.image.width||I.height!==zt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");tt.setupDepthRenderbuffer(I)}}const bt=I.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(vt=!0);const At=Z.get(I).__webglFramebuffer;I.isWebGLCubeRenderTarget?(Array.isArray(At[G])?q=At[G][Q]:q=At[G],Y=!0):I.samples>0&&tt.useMultisampledRTT(I)===!1?q=Z.get(I).__webglMultisampledFramebuffer:Array.isArray(At)?q=At[Q]:q=At,k.copy(I.viewport),J.copy(I.scissor),$=I.scissorTest}else k.copy(St).multiplyScalar(j).floor(),J.copy(Bt).multiplyScalar(j).floor(),$=te;if(Q!==0&&(q=N),R.bindFramebuffer(V.FRAMEBUFFER,q)&&R.drawBuffers(I,q),R.viewport(k),R.scissor(J),R.setScissorTest($),Y){const _t=Z.get(I.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+G,_t.__webglTexture,Q)}else if(vt){const _t=G;for(let bt=0;bt<I.textures.length;bt++){const At=Z.get(I.textures[bt]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+bt,At.__webglTexture,Q,_t)}}else if(I!==null&&Q!==0){const _t=Z.get(I.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,_t.__webglTexture,Q)}D=-1};function $c(I){const G=Z.get(I);return(G.__readFormat!==I.format||G.__readType!==I.type)&&(G.__readFormat=I.format,G.__readType=I.type,G.__formatReadable=B.textureFormatReadable(I.format),G.__typeReadable=B.textureTypeReadable(I.type)),G}this.readRenderTargetPixels=function(I,G,Q,q,Y,vt,yt,_t=0){if(!(I&&I.isWebGLRenderTarget)){jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=Z.get(I).__webglFramebuffer;if(I.isWebGLCubeRenderTarget&&yt!==void 0&&(bt=bt[yt]),bt){R.bindFramebuffer(V.FRAMEBUFFER,bt);try{const At=I.textures[_t],zt=At.format,Vt=At.type;I.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+_t);const wt=$c(At);if(wt.__formatReadable===!1){jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(wt.__typeReadable===!1){jt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=I.width-q&&Q>=0&&Q<=I.height-Y&&V.readPixels(G,Q,q,Y,pt.convert(zt),pt.convert(Vt),vt)}finally{const At=z!==null?Z.get(z).__webglFramebuffer:null;R.bindFramebuffer(V.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(I,G,Q,q,Y,vt,yt,_t=0){if(!(I&&I.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=Z.get(I).__webglFramebuffer;if(I.isWebGLCubeRenderTarget&&yt!==void 0&&(bt=bt[yt]),bt)if(G>=0&&G<=I.width-q&&Q>=0&&Q<=I.height-Y){R.bindFramebuffer(V.FRAMEBUFFER,bt);const At=I.textures[_t],zt=At.format,Vt=At.type;I.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+_t);const wt=$c(At);if(wt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(wt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ne=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,ne),V.bufferData(V.PIXEL_PACK_BUFFER,vt.byteLength,V.STREAM_READ),V.readPixels(G,Q,q,Y,pt.convert(zt),pt.convert(Vt),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);const _e=z!==null?Z.get(z).__webglFramebuffer:null;R.bindFramebuffer(V.FRAMEBUFFER,_e);const fe=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await Gh(V,fe,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,ne),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,vt),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(ne),V.deleteSync(fe),vt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(I,G=null,Q=0){const q=Math.pow(2,-Q),Y=Math.floor(I.image.width*q),vt=Math.floor(I.image.height*q),yt=G!==null?G.x:0,_t=G!==null?G.y:0;tt.setTexture2D(I,0),V.copyTexSubImage2D(V.TEXTURE_2D,Q,0,0,yt,_t,Y,vt),R.unbindTexture()},this.copyTextureToTexture=function(I,G,Q=null,q=null,Y=0,vt=0){let yt,_t,bt,At,zt,Vt,wt,ne,_e;const fe=I.isCompressedTexture?I.mipmaps[vt]:I.image;if(Q!==null)yt=Q.max.x-Q.min.x,_t=Q.max.y-Q.min.y,bt=Q.isBox3?Q.max.z-Q.min.z:1,At=Q.min.x,zt=Q.min.y,Vt=Q.isBox3?Q.min.z:0;else{const me=Math.pow(2,-Y);yt=Math.floor(fe.width*me),_t=Math.floor(fe.height*me),I.isDataArrayTexture?bt=fe.depth:I.isData3DTexture?bt=Math.floor(fe.depth*me):bt=1,At=0,zt=0,Vt=0}q!==null?(wt=q.x,ne=q.y,_e=q.z):(wt=0,ne=0,_e=0);const oe=pt.convert(G.format),Le=pt.convert(G.type);let Mt;G.isData3DTexture?(tt.setTexture3D(G,0),Mt=V.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(tt.setTexture2DArray(G,0),Mt=V.TEXTURE_2D_ARRAY):(tt.setTexture2D(G,0),Mt=V.TEXTURE_2D),R.activeTexture(V.TEXTURE0),R.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,G.flipY),R.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),R.pixelStorei(V.UNPACK_ALIGNMENT,G.unpackAlignment);const Be=R.getParameter(V.UNPACK_ROW_LENGTH),Zt=R.getParameter(V.UNPACK_IMAGE_HEIGHT),en=R.getParameter(V.UNPACK_SKIP_PIXELS),yn=R.getParameter(V.UNPACK_SKIP_ROWS),ti=R.getParameter(V.UNPACK_SKIP_IMAGES);R.pixelStorei(V.UNPACK_ROW_LENGTH,fe.width),R.pixelStorei(V.UNPACK_IMAGE_HEIGHT,fe.height),R.pixelStorei(V.UNPACK_SKIP_PIXELS,At),R.pixelStorei(V.UNPACK_SKIP_ROWS,zt),R.pixelStorei(V.UNPACK_SKIP_IMAGES,Vt);const Fi=I.isDataArrayTexture||I.isData3DTexture,ae=G.isDataArrayTexture||G.isData3DTexture;if(I.isDepthTexture){const me=Z.get(I),ei=Z.get(G),ue=Z.get(me.__renderTarget),ni=Z.get(ei.__renderTarget);R.bindFramebuffer(V.READ_FRAMEBUFFER,ue.__webglFramebuffer),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,ni.__webglFramebuffer);for(let Oi=0;Oi<bt;Oi++)Fi&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Z.get(I).__webglTexture,Y,Vt+Oi),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Z.get(G).__webglTexture,vt,_e+Oi)),V.blitFramebuffer(At,zt,yt,_t,wt,ne,yt,_t,V.DEPTH_BUFFER_BIT,V.NEAREST);R.bindFramebuffer(V.READ_FRAMEBUFFER,null),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(Y!==0||I.isRenderTargetTexture||Z.has(I)){const me=Z.get(I),ei=Z.get(G);R.bindFramebuffer(V.READ_FRAMEBUFFER,P),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,C);for(let ue=0;ue<bt;ue++)Fi?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,me.__webglTexture,Y,Vt+ue):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,me.__webglTexture,Y),ae?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,ei.__webglTexture,vt,_e+ue):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,ei.__webglTexture,vt),Y!==0?V.blitFramebuffer(At,zt,yt,_t,wt,ne,yt,_t,V.COLOR_BUFFER_BIT,V.NEAREST):ae?V.copyTexSubImage3D(Mt,vt,wt,ne,_e+ue,At,zt,yt,_t):V.copyTexSubImage2D(Mt,vt,wt,ne,At,zt,yt,_t);R.bindFramebuffer(V.READ_FRAMEBUFFER,null),R.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else ae?I.isDataTexture||I.isData3DTexture?V.texSubImage3D(Mt,vt,wt,ne,_e,yt,_t,bt,oe,Le,fe.data):G.isCompressedArrayTexture?V.compressedTexSubImage3D(Mt,vt,wt,ne,_e,yt,_t,bt,oe,fe.data):V.texSubImage3D(Mt,vt,wt,ne,_e,yt,_t,bt,oe,Le,fe):I.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,vt,wt,ne,yt,_t,oe,Le,fe.data):I.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,vt,wt,ne,fe.width,fe.height,oe,fe.data):V.texSubImage2D(V.TEXTURE_2D,vt,wt,ne,yt,_t,oe,Le,fe);R.pixelStorei(V.UNPACK_ROW_LENGTH,Be),R.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Zt),R.pixelStorei(V.UNPACK_SKIP_PIXELS,en),R.pixelStorei(V.UNPACK_SKIP_ROWS,yn),R.pixelStorei(V.UNPACK_SKIP_IMAGES,ti),vt===0&&G.generateMipmaps&&V.generateMipmap(Mt),R.unbindTexture()},this.initRenderTarget=function(I){Z.get(I).__webglFramebuffer===void 0&&tt.setupRenderTarget(I)},this.initTexture=function(I){I.isCubeTexture?tt.setTextureCube(I,0):I.isData3DTexture?tt.setTexture3D(I,0):I.isDataArrayTexture||I.isCompressedArrayTexture?tt.setTexture2DArray(I,0):tt.setTexture2D(I,0),R.unbindTexture()},this.resetState=function(){U=0,F=0,z=null,R.reset(),xt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=qt._getUnpackColorSpace()}}function je(i,t){const e=t===void 0?[]:[t.error],n=r=>{const s=new Set,a=[{error:r,leave:!1}];for(;a.length!==0;){const o=a.pop();if(o.leave){s.delete(o.error);continue}let c;try{if(o.error instanceof AggregateError&&!s.has(o.error)){const l=o.error.errors;Array.isArray(l)&&l.length!==0&&(c=Array.from(l))}}catch{}if(c===void 0){e.push(o.error);continue}s.add(o.error),a.push({error:o.error,leave:!0});for(let l=c.length-1;l>=0;--l)a.push({error:c[l],leave:!1})}};for(const r of i)try{r()}catch(s){n(s)}if(e.length===1)throw e[0];if(e.length>1)throw new AggregateError(e,"Render-mode setup or restoration failed.")}const Wf=i=>{const t=i.getRenderTarget(),e=i.getActiveCubeFace(),n=i.getActiveMipmapLevel(),r=i.getViewport(new Yt),s=i.getScissor(new Yt),a=i.getScissorTest(),o=i.getCurrentViewport(new Yt),c=i.getContext(),l=new Yt().fromArray(c.getParameter(c.SCISSOR_BOX)),h=c.isEnabled(c.SCISSOR_TEST);return()=>je([()=>{i.setViewport(r)},()=>{i.setScissor(s)},()=>{i.setScissorTest(a)},()=>{if(t===null){i.setRenderTarget(null,e,n);return}const p=t.viewport.clone(),f=t.scissor.clone(),u=t.scissorTest;t.viewport.copy(o),t.scissor.copy(l),t.scissorTest=h;let d;try{i.setRenderTarget(t,e,n)}catch(g){d={error:g}}const _=[()=>{t.viewport.copy(p)},()=>{t.scissor.copy(f)},()=>{t.scissorTest=u}];d===void 0?je(_):je(_,d)}])},K_=new WeakMap;function Z_(i,t){const e=K_.get(i);if(e!==void 0)throw e.error}const Za=new WeakMap;function rc(i,t,e){const n=Za.get(t);if(n!==void 0)throw n.error;if(e===void 0)return;const r={scene:i,resources:[...e.resources],nativeDepth:[...e.nativeDepth],error:new Error("The scene's shadow resources are still being retired.")};Za.set(t,r);try{e.run(),Za.delete(t)}catch(s){throw r.error=s,s}}var on;(i=>{i.create=(e=0,n=0,r=0)=>({x:e,y:n,z:r}),i.add=(e,n)=>({x:e.x+n.x,y:e.y+n.y,z:e.z+n.z}),i.subtract=(e,n)=>({x:e.x-n.x,y:e.y-n.y,z:e.z-n.z}),i.scale=(e,n)=>({x:e.x*n,y:e.y*n,z:e.z*n}),i.dot=(e,n)=>e.x*n.x+e.y*n.y+e.z*n.z,i.cross=(e,n)=>({x:e.y*n.z-e.z*n.y,y:e.z*n.x-e.x*n.z,z:e.x*n.y-e.y*n.x}),i.length=e=>t(e)===0?Math.sqrt((0,i.dot)(e,e)):Math.hypot(e.x,e.y,e.z),i.normalize=e=>{const n=t(e),r=n===0?e:{x:e.x/n,y:e.y/n,z:e.z/n},s=(0,i.length)(r);return s===0?(0,i.create)(0,0,0):(0,i.scale)(r,1/s)};const t=e=>{const n=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));return Number.isFinite(n)&&n>0&&(n<2**-511||n>2**511)?n:0};i.lerp=(e,n,r)=>({x:e.x+(n.x-e.x)*r,y:e.y+(n.y-e.y)*r,z:e.z+(n.z-e.z)*r})})(on||(on={}));const J_={wide:4,full:1.15,medium:.62,close:.28};new Set(Object.keys(J_));const Q_={static:!0,follow:!0,orbit:!0,"push-in":!0,truck:!0,whip:!0};new Set(Object.keys(Q_));const Xf=.9995;var pr;(i=>{i.identity=()=>({x:0,y:0,z:0,w:1}),i.DEG2RAD=Math.PI/180;const t={X:{x:1,y:0,z:0},Y:{x:0,y:1,z:0},Z:{x:0,y:0,z:1}};i.multiply=(n,r)=>({x:n.w*r.x+n.x*r.w+n.y*r.z-n.z*r.y,y:n.w*r.y-n.x*r.z+n.y*r.w+n.z*r.x,z:n.w*r.z+n.x*r.y-n.y*r.x+n.z*r.w,w:n.w*r.w-n.x*r.x-n.y*r.y-n.z*r.z}),i.normalize=n=>{const r=e(n.x,n.y,n.z,n.w),s=r===1?n:{x:n.x/r,y:n.y/r,z:n.z/r,w:n.w/r},a=Math.sqrt(s.x*s.x+s.y*s.y+s.z*s.z+s.w*s.w);if(a===0)return(0,i.identity)();const o=1/a;return{x:s.x*o,y:s.y*o,z:s.z*o,w:s.w*o}},i.inverse=n=>(0,i.normalize)({x:-n.x,y:-n.y,z:-n.z,w:n.w}),i.fromAxisAngle=(n,r)=>{const s=e(n.x,n.y,n.z),a=s===1?n:{x:n.x/s,y:n.y/s,z:n.z/s},o=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);if(o===0)return(0,i.identity)();const c=r*i.DEG2RAD/2,l=Math.sin(c)/o;return{x:a.x*l,y:a.y*l,z:a.z*l,w:Math.cos(c)}};const e=(n,r,s,a=0)=>{const o=Math.max(Math.abs(n),Math.abs(r),Math.abs(s),Math.abs(a));return Number.isFinite(o)&&o>0&&(o<2**-511||o>2**510)?o:1};i.fromEuler=n=>{let r=(0,i.identity)();for(const s of n.order){const a=s==="X"?n.x:s==="Y"?n.y:n.z;r=(0,i.multiply)(r,(0,i.fromAxisAngle)(t[s],a))}return r},i.rotateVector=(n,r)=>{const s=2*(n.y*r.z-n.z*r.y),a=2*(n.z*r.x-n.x*r.z),o=2*(n.x*r.y-n.y*r.x);return{x:r.x+n.w*s+(n.y*o-n.z*a),y:r.y+n.w*a+(n.z*s-n.x*o),z:r.z+n.w*o+(n.x*a-n.y*s)}},i.slerp=(n,r,s)=>{let a=n.x*r.x+n.y*r.y+n.z*r.z+n.w*r.w,o=r.x,c=r.y,l=r.z,h=r.w;if(a<0&&(a=-a,o=-o,c=-c,l=-l,h=-h),a>Xf)return(0,i.normalize)({x:n.x+(o-n.x)*s,y:n.y+(c-n.y)*s,z:n.z+(l-n.z)*s,w:n.w+(h-n.w)*s});const p=Math.acos(a),f=Math.sin(p),u=Math.sin((1-s)*p)/f,d=Math.sin(s*p)/f;return{x:n.x*u+o*d,y:n.y*u+c*d,z:n.z*u+l*d,w:n.w*u+h*d}}})(pr||(pr={}));const j_=new Set(["eyeBlinkLeft","eyeLookDownLeft","eyeLookInLeft","eyeLookOutLeft","eyeLookUpLeft","eyeSquintLeft","eyeWideLeft","eyeBlinkRight","eyeLookDownRight","eyeLookInRight","eyeLookOutRight","eyeLookUpRight","eyeSquintRight","eyeWideRight","jawForward","jawLeft","jawRight","jawOpen","mouthClose","mouthFunnel","mouthPucker","mouthLeft","mouthRight","mouthSmileLeft","mouthSmileRight","mouthFrownLeft","mouthFrownRight","mouthDimpleLeft","mouthDimpleRight","mouthStretchLeft","mouthStretchRight","mouthRollLower","mouthRollUpper","mouthShrugLower","mouthShrugUpper","mouthPressLeft","mouthPressRight","mouthLowerDownLeft","mouthLowerDownRight","mouthUpperUpLeft","mouthUpperUpRight","browDownLeft","browDownRight","browInnerUp","browOuterUpLeft","browOuterUpRight","cheekPuff","cheekSquintLeft","cheekSquintRight","noseSneerLeft","noseSneerRight","tongueOut"]),tv=new Set(["neutral","happy","angry","sad","relaxed","surprised","aa","ih","ou","ee","oh","blink","blinkLeft","blinkRight","lookUp","lookDown","lookLeft","lookRight"]);class mi{constructor(t,e,n=mi.slopes(t,e)){qe(this,"coefficients");if(this.xs=t,t.length<2||e.length!==t.length||n.length!==t.length||![...t,...e,...n].every(Number.isFinite)||t.some((s,a)=>a>0&&s<=t[a-1]))throw new Error("Ordered finite spline coordinates required");const r=[];for(let s=0;s<t.length-1;s++){const a=t[s+1]-t[s],o=(e[s+1]-e[s])/a,c=(n[s]+n[s+1]-2*o)/a;r.push([c/a,(o-n[s])/a-c,n[s],e[s]])}this.coefficients=r}at(t,e=!1){if(!Number.isFinite(t)||t<this.xs[0]||t>this.xs.at(-1))throw new Error("Outside scalar spline coordinate range");let n=0;for(;n<this.xs.length-2&&t>=this.xs[n+1];)n++;const r=t-this.xs[n],s=this.coefficients[n],a=e?(3*s[0]*r+2*s[1])*r+s[2]:((s[0]*r+s[1])*r+s[2])*r+s[3];if(!Number.isFinite(a))throw new Error("Unresolved scalar spline arithmetic");return a}static slopes(t,e){if(t.length<2||t.length!==e.length)throw new Error("Matching station values required");const n=t.slice(1).map((s,a)=>s-t[a]),r=e.slice(1).map((s,a)=>(s-e[a])/n[a]);if(![...t,...e,...r].every(Number.isFinite)||n.some(s=>s<=0))throw new Error("Finite increasing spline coordinates required");return mi.fromSecants(n,r)}static fromSecants(t,e){if(t.length===1)return[e[0],e[0]];const n=new Array(t.length+1).fill(0);for(let r=1;r<t.length;r++){if(e[r-1]===0||e[r]===0||Math.sign(e[r-1])!==Math.sign(e[r]))continue;const s=2*t[r]+t[r-1],a=t[r]+2*t[r-1];n[r]=(s+a)/(s/e[r-1]+a/e[r])}return n[0]=mi.edge(t[0],t[1],e[0],e[1]),n[n.length-1]=mi.edge(t.at(-1),t.at(-2),e.at(-1),e.at(-2)),n}static fieldSlopes(t,e){const n=e.map(r=>r.map(()=>[0,0,0]));for(let r=0;r<e[0].length;r++)for(let s=0;s<3;s++)mi.slopes(t,e.map(o=>o[r][s])).forEach((o,c)=>{n[c][r][s]=o});return n}static edge(t,e,n,r){const s=((2*t+e)*n-t*r)/(t+e);return Math.sign(s)!==Math.sign(n)?0:Math.sign(n)!==Math.sign(r)&&Math.abs(s)>3*Math.abs(n)?3*n:s}}var Ot;(i=>{i.clone=o=>[o[0],o[1],o[2]],i.add=(o,c)=>[o[0]+c[0],o[1]+c[1],o[2]+c[2]],i.sub=(o,c)=>[o[0]-c[0],o[1]-c[1],o[2]-c[2]],i.scale=(o,c)=>[o[0]*c,o[1]*c,o[2]*c],i.mix=(o,c,l)=>(0,i.add)(o,(0,i.scale)((0,i.sub)(c,o),l)),i.hermite=(o,c,l,h,p)=>[(0,i.clone)(o),(0,i.add)(o,(0,i.scale)(l,p/3)),(0,i.sub)(c,(0,i.scale)(h,p/3)),(0,i.clone)(c)];function t(o,c){if(!(c>0&&Number.isFinite(c)))throw new Error("A positive finite cubic Hermite chart width is required");if(o.length!==4||![0,1,2,3].every(l=>Object.hasOwn(o,l)&&Array.isArray(o[l])&&o[l].length===3&&[0,1,2].every(h=>Object.hasOwn(o[l],h)&&Number.isFinite(o[l][h]))))throw new Error("Exactly four finite three-component cubic Bernstein controls are required");return{start:(0,i.clone)(o[0]),end:(0,i.clone)(o[3]),startDerivative:e(o,0,c),endDerivative:e(o,1,c)}}i.toHermite=t;function e(o,c,l){const h=(0,i.derivative)(o,c,l),p=o[c===0?0:2],f=o[c===0?1:3];return[0,1,2].map(u=>{const d=f[u]-p[u];let _=h[u];if((!Number.isFinite(_)||_===0&&p[u]!==f[u])&&(_=3*d/l),(!Number.isFinite(_)||_===0&&p[u]!==f[u])&&(_=3*(d/l)),(!Number.isFinite(_)||_===0&&p[u]!==f[u])&&(_=3*(f[u]/l-p[u]/l)),!Number.isFinite(_)||_===0&&p[u]!==f[u])throw new Error("Cubic endpoint derivative is unresolved in binary64");return _})}i.cubic=(o,c)=>[0,1,2].map(l=>(1-c)**3*o[0][l]+3*(1-c)**2*c*o[1][l]+3*(1-c)*c*c*o[2][l]+c**3*o[3][l]),i.derivative=(o,c,l)=>[0,1,2].map(h=>3/l*((1-c)**2*(o[1][h]-o[0][h])+2*(1-c)*c*(o[2][h]-o[1][h])+c*c*(o[3][h]-o[2][h])));function n(o,c,l=!1){const h=(d,_)=>l?(0,i.mix)(d,_,c):(0,i.add)((0,i.scale)(d,1-c),(0,i.scale)(_,c)),p=[h(o[0],o[1]),h(o[1],o[2]),h(o[2],o[3])],f=[h(p[0],p[1]),h(p[1],p[2])],u=h(f[0],f[1]);return[[(0,i.clone)(o[0]),p[0],f[0],u],[(0,i.clone)(u),f[1],p[2],(0,i.clone)(o[3])]]}i.split=n;function r(o,c,l=!1){if(c.some(u=>!(u>0)))throw new Error("Positive actual phase widths required");let h=c.reduce((u,d)=>u+d,0),p=o.map(i.clone);const f=[];for(const u of c.slice(0,-1)){const d=n(p,u/h,l);f.push(d[0]),p=d[1],h-=u}return[...f,p]}i.partition=r,i.slopes=mi.slopes,i.fieldSlopes=mi.fieldSlopes;function s(o,c){const l=[0];for(const u of c)l.push(l.at(-1)+u);const h=[-c.at(-1),...l,l.at(-1)+c[0]],p=[o.at(-1),...o,o[0],o[1]],f=o.map(()=>[0,0,0]);for(let u=0;u<3;u++){const d=(0,i.slopes)(h,p.map(_=>_[u]));f.forEach((_,g)=>{_[u]=d[g+1]/3})}return f}i.angular=s;function a(o,c,l){return o.map((h,p)=>{const f=(p+1)%o.length;return[(0,i.clone)(h),(0,i.add)(h,(0,i.scale)(c[p],l[p])),(0,i.sub)(o[f],(0,i.scale)(c[f],l[p])),(0,i.clone)(o[f])]})}i.spans=a})(Ot||(Ot={}));var Gt;(i=>{function t(u,d){let _=1;for(let g=1;g<=d;g++)_*=(u-g+1)/g;return _}i.choose=t;function e(u,d){if(d===0)return u[0];if(d===1)return u.at(-1);if(u.length===1)return u[0];if(u.length===2){const g=u[0],m=u[1];return g+d*(m-g)}if(u.length===3||u.length===4){let g=u[0],m=u[1],x=u[2];if(u.length===4){const y=u[3];g=g+d*(m-g),m=m+d*(x-m),x=x+d*(y-x)}return g=g+d*(m-g),m=m+d*(x-m),g+d*(m-g)}const _=[...u];for(let g=_.length;g>1;g--)for(let m=0;m+1<g;m++)_[m]=_[m]+d*(_[m+1]-_[m]);return _[0]}i.scalar=e;function n(u,d){if(d===0)return Ot.clone(u[0]);if(d===1)return Ot.clone(u.at(-1));let _=u.map(Ot.clone);for(;_.length>1;)_=_.slice(0,-1).map((g,m)=>Ot.mix(g,_[m+1],d));return _[0]}i.value=n;function r(u,d=1){return u.slice(1).map((_,g)=>Ot.scale(Ot.sub(_,u[g]),(u.length-1)*d))}i.tangent=r;function s(u,d=1){return u.length===1?[0]:u.slice(1).map((_,g)=>(_-u[g])*(u.length-1)*d)}i.dScalar=s;function a(u,d){if(d<u.length-1)throw new Error("Degree reduction is not an elevation");let _=[...u];for(;_.length<=d;){const g=_.length;_=Array.from({length:g+1},(m,x)=>x===0?_[0]:x===g?_[g-1]:x/g*_[x-1]+(1-x/g)*_[x])}return _}i.elevateScalar=a;function o(u,d){const _=[0,1,2].map(g=>a(u.map(m=>m[g]),d));return _[0].map((g,m)=>_.map(x=>x[m]))}i.elevate=o;function c(u,d){const _=u.length-1,g=d.length-1;return Array.from({length:_+g+1},(m,x)=>{let y=0;for(let v=Math.max(0,x-g);v<=Math.min(_,x);v++)y+=t(_,v)*t(g,x-v)/t(_+g,x)*u[v]*d[x-v];return y})}i.product=c;function l(u,d){const _=[0,1,2].map(g=>c(u,d.map(m=>m[g])));return _[0].map((g,m)=>_.map(x=>x[m]))}i.productV=l;function h(u,d,_=1){const g=Math.max(u.length,d.length)-1,m=o(u,g),x=o(d,g);return m.map((y,v)=>Ot.add(y,Ot.scale(x[v],_)))}i.add=h;function p(u,d,_=1){const g=Math.max(u.length,d.length)-1,m=a(u,g),x=a(d,g);return m.map((y,v)=>y+_*x[v])}i.addS=p;function f(u,d){return u.map(_=>Ot.scale(_,d))}i.scale=f})(Gt||(Gt={}));var mr;(i=>{function t(r,s,a,o,c){const l=Math.max(r.length,s.length,a.length,o.length)-1,h=Gt.elevate(r,l),p=Gt.elevate(s,l);return[h,Gt.add(h,Gt.elevate(a,l),c/3),Gt.add(p,Gt.elevate(o,l),-c/3),p]}i.hermite=t;function e(r,s){return r[0].map((a,o)=>Gt.value(r.map(c=>c[o]),s))}i.gridValue=e;function n(r,s=1){return r.slice(1).map((a,o)=>Gt.scale(Gt.add(a,r[o],-1),(r.length-1)*s))}i.gridTangent=n})(mr||(mr={}));var tu;(i=>{function t(_,g,m){o(_,g),a(m);const x=l(_),y=l(g),v=l(m),E=h(y,x),S=h(x,{n:-E.n*v.n,e:E.e+v.e});return{value:m===0?_:m===1?g:u(S.n,1n,S.e),key:p(S)}}i.phase=t;function e(_,g,m){o(_,g),a(m.value);const x=f(m.key);if(m.value!==u(x.n,1n,x.e))throw new Error("Canonical phase key and numeric value disagree");const y=h(x,l(_)),v=h(l(g),l(_)),E=v.n<0n?-1n:1n;if(y.n*E<0n||h(v,y).n*E<0n)throw new Error("Canonical phase is outside the directed interval");if(y.n===0n)return 0;if(h(v,y).n===0n)return 1;const S=u(y.n*E,v.n*E,y.e-v.e);if(!(S>0&&S<1))throw new Error("Interior canonical phase inverse collapses to an endpoint");return S}i.local=e;function n(_,g){const m=f(_.key),x=f(g.key);if(_.value!==u(m.n,1n,m.e)||g.value!==u(x.n,1n,x.e))throw new Error("Canonical phase key and numeric value disagree");const y=h(m,x).n;return y<0n?-1:y>0n?1:0}i.compare=n;function r(_,g,m){if(m.length<2||m[0].local!==0||m[m.length-1].local!==1)throw new Error("A finite inverse requires complete local anchors");const x=n(m[m.length-1].phase,m[0].phase);if(x===0)throw new Error("Finite inverse endpoints must differ");let y=-1,v;for(let P=0;P<m.length;++P){const C=m[P];if(a(C.local),n(_(C.local),C.phase)!==0)throw new Error("Finite inverse anchor disagrees with its forward map");if(P>0&&(C.local<=m[P-1].local||n(C.phase,m[P-1].phase)*x<=0))throw new Error("Finite inverse anchors must be strictly directed");const U=n(g,C.phase)*x;U===0&&(v=C.local),U>0&&(y=P)}if(v!==void 0)return v;if(y<0||y+1>=m.length)throw new Error("Finite inverse target is outside its anchors");const E=m[y],S=m[y+1],b=new DataView(new ArrayBuffer(8));b.setFloat64(0,E.local===0?0:E.local,!1);let M=b.getBigUint64(0,!1);b.setFloat64(0,S.local,!1);let w=b.getBigUint64(0,!1),A=E.phase,T=S.phase;for(;w-M>1n;){const P=M+w>>1n;b.setBigUint64(0,P,!1);const C=b.getFloat64(0,!1),U=_(C);if(n(U,A)*x<0||n(U,T)*x>0)throw new Error("Finite forward map reverses inside its inverse bracket");const F=n(U,g)*x;if(F===0)return C;F<0?(M=P,A=U):(w=P,T=U)}b.setBigUint64(0,M,!1);const L=b.getFloat64(0,!1);b.setBigUint64(0,w,!1);const N=b.getFloat64(0,!1);if(L>E.local&&L<S.local)return L;if(N>E.local&&N<S.local)return N;throw new Error("Finite inverse has no representable interior local coordinate")}i.inverse=r;function s(_){const g=new Set,m=new Map;for(const v of _){if(o(v.start,v.end),typeof v.id!="string"||!v.id||g.has(v.id)||typeof v.authority!="string"||!v.authority||v.walk!==1&&v.walk!==-1)throw new Error("Boundary uses require unique nonempty IDs, authority and signed walks");g.add(v.id);const E=m.get(v.authority)??new Map;m.set(v.authority,E);const S=Math.min(v.start,v.end),b=Math.max(v.start,v.end);for(const M of[S,b])E.has(M)||E.set(M,{add:[],remove:[]});E.get(S).add.push({id:v.id,walk:v.walk*(v.end>v.start?1:-1)}),E.get(b).remove.push(v.id)}const x=[],y=[];for(const v of[...m.keys()].sort(d)){const E=m.get(v),S=[...E.keys()].sort((M,w)=>M<w?-1:M>w?1:0),b=new Map;for(let M=0;M+1<S.length;M++){const w=S[M],A=S[M+1],T=E.get(w);for(const P of T.remove)b.delete(P);for(const P of T.add)b.set(P.id,P.walk);const L=[...b.keys()].sort(d),N=L.map(P=>b.get(P));x.push({authority:v,start:w,end:A,uses:L,walks:N}),L.length?L.length>2?y.push(`Overfull declared boundary atom ${JSON.stringify(v)} [${w},${A}]: ${L.length} uses`):L.length===2&&N[0]===N[1]&&y.push(`Equal directed walks on boundary atom ${JSON.stringify(v)} [${w},${A}]`):y.push(`Uncovered boundary atom ${JSON.stringify(v)} [${w},${A}]`)}}return{atoms:x,diagnostics:y}}i.partition=s;function a(_){if(!Number.isFinite(_)||_<0||_>1)throw new Error("Boundary phases must be finite in [0,1]")}function o(_,g){if(a(_),a(g),_===g)throw new Error("Boundary interval endpoints must differ")}function c(_,g){if(_===0n)return{n:0n,e:0};for(;(_&1n)===0n;)_>>=1n,g++;return{n:_,e:g}}function l(_){const g=new DataView(new ArrayBuffer(8));g.setFloat64(0,_,!1);const m=g.getBigUint64(0,!1),x=Number(m>>52n&2047n),y=m&(1n<<52n)-1n;return c(x===0?y:y+(1n<<52n),x===0?-1074:x-1075)}function h(_,g){const m=Math.min(_.e,g.e);return c((_.n<<BigInt(_.e-m))-(g.n<<BigInt(g.e-m)),m)}function p(_){return`d:${_.n.toString(16)}p${_.e}`}function f(_){if(typeof _!="string"||_.length>550)throw new Error("Invalid canonical dyadic phase key");const g=/^d:([0-9a-f]+)p(-?(?:0|[1-9][0-9]*))$/.exec(_);if(!g)throw new Error("Invalid canonical dyadic phase key");const m=Number(g[2]);if(!Number.isSafeInteger(m)||m<-2148||m>0)throw new Error("Canonical dyadic exponent is outside binary64 affine phase bounds");const x=c(BigInt(`0x${g[1]}`),m);if(p(x)!==_||h(x,{n:1n,e:0}).n>0n)throw new Error("Noncanonical or out-of-range dyadic phase key");return x}function u(_,g,m){if(_===0n)return 0;let x=_.toString(2).length-g.toString(2).length;(x>=0?_<g<<BigInt(x):_<<BigInt(-x)<g)&&x--;const y=Math.max(-1074,x+m-52),v=m-y,E=v>=0?_<<BigInt(v):_,S=v>=0?g:g<<BigInt(-v);let b=E/S;const M=2n*(E%S);return(M>S||M===S&&(b&1n)===1n)&&b++,Number(b)*2**y}function d(_,g){return _<g?-1:_>g?1:0}})(tu||(tu={}));var Xe;(i=>{function t(o,c){if(c===0)return[o.map(()=>Ot.clone(o[0])),o.map(Ot.clone)];if(c===1)return[o.map(Ot.clone),o.map(()=>Ot.clone(o.at(-1)))];let l=o.map(Ot.clone);const h=[Ot.clone(l[0])],p=[Ot.clone(l.at(-1))];for(;l.length>1;)l=l.slice(0,-1).map((f,u)=>Ot.mix(f,l[u+1],c)),h.push(Ot.clone(l[0])),p.push(Ot.clone(l.at(-1)));return[h,p.reverse()]}i.split=t;function e(o,c){return t(o.map(h=>[h,0,0]),c).map(h=>h.map(p=>p[0]))}i.splitS=e;function n(o,c,l){if(!(0<=c&&c<l&&l<=1))throw new Error("A restriction must lie in its original chart");const h=l===1?o.map(Ot.clone):t(o,l)[0];return c===0?h:t(h,c/l)[1]}i.restrict=n;function r(o,c,l){return n(o.map(h=>[h,0,0]),c,l).map(h=>h[0])}i.restrictS=r;function s(o){const c=t(o,.3333333333333333),l=t(c[1],.5);return[c[0],...l]}i.thirds=s;function a(o){return s(o.map(c=>[c,0,0])).map(c=>c.map(l=>l[0]))}i.thirdsS=a})(Xe||(Xe={}));const ev=(i,t)=>{const e=on.normalize(i),n=on.normalize(t),r=on.cross(e,n),s=on.length(r),a=on.dot(e,n);if(s===0){if(a>=0)return pr.identity();const o=Math.abs(e.x)<.9?on.cross(e,{x:1,y:0,z:0}):on.cross(e,{x:0,y:1,z:0});return pr.fromAxisAngle(o,180)}return pr.fromAxisAngle(r,Math.atan2(s,a)*180/Math.PI)},nv=["Hand","ThumbMetacarpal","ThumbProximal","ThumbDistal","IndexProximal","IndexIntermediate","IndexDistal","MiddleProximal","MiddleIntermediate","MiddleDistal","RingProximal","RingIntermediate","RingDistal","LittleProximal","LittleIntermediate","LittleDistal"];(()=>{const i={flexion:{x:0,y:1,z:0},abduction:{x:0,y:0,z:1},twist:{x:1,y:0,z:0}},t=["leftShoulder","leftUpperArm","leftLowerArm","rightShoulder","rightUpperArm","rightLowerArm"],e={...i,twistPlacement:"distal"},n={};for(const o of t)n[o]=o==="leftLowerArm"||o==="rightLowerArm"?e:i;const r={flexion:{x:0,y:0,z:1},abduction:{x:0,y:1,z:0},twist:{x:1,y:0,z:0}},s={...r,abduction:{x:0,y:-1,z:0}};for(const o of["left","right"])for(const c of nv)n[`${o}${c}`]=c.startsWith("Ring")||c.startsWith("Little")?s:r;const a=["leftUpperLeg","rightUpperLeg","leftFoot","rightFoot","leftToes","rightToes"];for(const o of a)n[o]={flexion:{x:-1,y:0,z:0},abduction:{x:0,y:0,z:1},twist:{x:0,y:1,z:0}};return n})();var eu;(i=>{i.identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],i.compose=(r,s,a)=>{const o=s.x+s.x,c=s.y+s.y,l=s.z+s.z,h=s.x*o,p=s.x*c,f=s.x*l,u=s.y*c,d=s.y*l,_=s.z*l,g=s.w*o,m=s.w*c,x=s.w*l;return[(1-(u+_))*a.x,(p+x)*a.x,(f-m)*a.x,0,(p-x)*a.y,(1-(h+_))*a.y,(d+g)*a.y,0,(f+m)*a.z,(d-g)*a.z,(1-(h+u))*a.z,0,r.x,r.y,r.z,1]},i.multiply=(r,s)=>{const a=new Array(16);for(let o=0;o<4;++o)for(let c=0;c<4;++c){let l=0;for(let h=0;h<4;++h)l+=r[h*4+c]*s[o*4+h];a[o*4+c]=l}return a},i.position=r=>({x:r[12],y:r[13],z:r[14]}),i.transformPoint=(r,s)=>({x:r[0]*s.x+r[4]*s.y+r[8]*s.z+r[12],y:r[1]*s.x+r[5]*s.y+r[9]*s.z+r[13],z:r[2]*s.x+r[6]*s.y+r[10]*s.z+r[14]});const t=[{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}],e=r=>{const s=[0,1,2].filter(a=>r[a]!==null);if(s.length===3)return r;if(s.length===2){const a=3-s[0]-s[1],o=r[(a+1)%3],c=r[(a+2)%3],l=on.cross(o,c);if(on.length(l)===0)return n((a+1)%3,o);const h=r.slice();return h[a]=on.normalize(l),h}return s.length===1?n(s[0],r[s[0]]):t.slice()},n=(r,s)=>{const a=ev(t[r],s);return t.map((o,c)=>c===r?s:pr.rotateVector(a,o))};i.decompose=r=>{const s=Math.hypot(r[0],r[1],r[2]),a=Math.hypot(r[4],r[5],r[6]),o=Math.hypot(r[8],r[9],r[10]),[c,l,h]=e([s===0?null:{x:r[0]/s,y:r[1]/s,z:r[2]/s},a===0?null:{x:r[4]/a,y:r[5]/a,z:r[6]/a},o===0?null:{x:r[8]/o,y:r[9]/o,z:r[10]/o}]),p=c.x,f=c.y,u=c.z,d=l.x,_=l.y,g=l.z,m=h.x,x=h.y,y=h.z,v=p+_+y;let E,S,b,M;if(v>0){const w=.5/Math.sqrt(v+1);M=.25/w,E=(g-x)*w,S=(m-u)*w,b=(f-d)*w}else if(p>_&&p>y){const w=2*Math.sqrt(1+p-_-y);M=(g-x)/w,E=.25*w,S=(d+f)/w,b=(m+u)/w}else if(_>y){const w=2*Math.sqrt(1+_-p-y);M=(m-u)/w,E=(d+f)/w,S=.25*w,b=(x+g)/w}else{const w=2*Math.sqrt(1+y-p-_);M=(f-d)/w,E=(m+u)/w,S=(x+g)/w,b=.25*w}return{position:{x:r[12],y:r[13],z:r[14]},rotation:{x:E,y:S,z:b,w:M},scale:{x:s,y:a,z:o}}}})(eu||(eu={}));const iv=[{effector:"leftFoot",upper:"leftUpperLeg",lower:"leftLowerLeg"},{effector:"rightFoot",upper:"rightUpperLeg",lower:"rightLowerLeg"}];iv.map(i=>({foot:i.effector,upper:i.upper,lower:i.lower}));const nu=(i,t)=>{const e=i.positions.length/3;if(Number.isSafeInteger(e)===!1)throw new Error(`${t} needs positions in whole xyz triples`);const n=i.indices??Array.from({length:e},(r,s)=>s);if(n.length%3!==0)throw new Error(`${t} needs triangle indices in threes`);for(let r=0;r<n.length;++r){const s=n[r];if(s===void 0||Number.isSafeInteger(s)===!1||s<0||s>=e)throw new Error(`${t} indexes a vertex the mesh does not carry`)}return n};function $f(i){const t=(o,c)=>{if(!Array.isArray(o)||o.length===0||c!==void 0&&o.length!==c)throw new Error("Complete dense coefficients required");for(let l=0;l<o.length;l++)if(!Object.hasOwn(o,l))throw new Error("Sparse coefficients are not a complete primitive")},e=o=>{if(typeof o!="number"||!Number.isFinite(o))throw new Error("Finite numeric coefficients required")},n=o=>{t(o,3);for(const c of o)e(c)},r=(o,c)=>{t(o,c);for(const l of o)n(l)};if(!i||typeof i.name!="string"||!i.name||typeof i.closed!="boolean"||i.unit!=="mm"||!["turn","mm","normalized"].includes(i.phaseUnit))throw new Error("Explicit curve identity, topology and units required");if(i.type==="analyticOval"){for(const c of[i.center,i.u,i.v])n(c);if(e(i.radiusU),e(i.radiusV),i.phaseUnit!=="turn"||!i.closed||i.radiusU<=0||i.radiusV<=0)throw new Error("Invalid analytic oval");const o=(c,l)=>c.reduce((h,p,f)=>h+p*l[f],0);if(Math.abs(o(i.u,i.u)-1)>64*Number.EPSILON||Math.abs(o(i.v,i.v)-1)>64*Number.EPSILON||Math.abs(o(i.u,i.v))>64*Number.EPSILON)throw new Error("Orthonormal oval axes required");return}if(i.type!=="cubicBezier"&&i.type!=="bernstein")throw new Error("Unsupported actual primitive");const s=i.type==="cubicBezier"?i.spans:i.pieces;t(s),t(i.phaseIntervals,s.length);let a=0;for(const o of i.phaseIntervals){e(o);const c=a+o;if(o<=0||!Number.isFinite(c)||c<=a)throw new Error("Unresolved parameter partition");a=c}if(i.type==="cubicBezier"){for(const o of i.spans)r(o,4);return}for(const o of i.pieces){if(!o||!["polynomialBezier","rationalBezier","rationalXZPolynomialYBezier"].includes(o.primitive)||!Number.isSafeInteger(o.degree)||o.degree<0)throw new Error("Invalid actual Bernstein degree");const c=o.primitive==="polynomialBezier"?o.controls:o.homogeneousNumerator;if(r(c,o.degree+1),o.parameterDomain!==void 0&&(t(o.parameterDomain,2),o.parameterDomain[0]!==0||o.parameterDomain[1]!==1))throw new Error("Only normalized local domain supported");if(o.qInterval!==void 0){t(o.qInterval,2);for(const l of o.qInterval)e(l);if(!(o.qInterval[1]>o.qInterval[0]))throw new Error("Invalid course interval")}if(o.primitive!=="polynomialBezier"){t(o.weights,o.degree+1);for(const l of o.weights)if(e(l),l<=0)throw new Error("Positive denominator coefficients required");if(o.controls!==void 0){r(o.controls,c.length);for(let l=0;l<c.length;l++)for(let h=0;h<3;h++){const p=c[l][h]/o.weights[l];if(e(p),c[l][h]!==0&&p===0)throw new Error("Unresolved rational cache quotient");const f=o.controls[l][h];if(Math.abs(p-f)>32*Number.EPSILON*Math.max(Math.abs(p),Math.abs(f),Number.MIN_VALUE))throw new Error("Contradictory derived cache")}}if(o.primitive==="rationalXZPolynomialYBezier"){t(o.polynomialYControls);for(const l of o.polynomialYControls)e(l)}}}}var lr;(i=>{function t(s){const a=Xe.thirds(s.numerator),o=Xe.thirdsS(s.denominator);return a.map((c,l)=>({numerator:c,denominator:o[l]}))}i.thirdsR=t;function e(s,a,o=!1){const c=Gt.value(s.numerator,a),l=Gt.scalar(s.denominator,a);if(!(l>0))throw new Error("Nonpositive actual rational denominator");return o?Ot.scale(Ot.sub(Ot.scale(Gt.value(Gt.tangent(s.numerator),a),l),Ot.scale(c,Gt.scalar(Gt.dScalar(s.denominator),a))),1/(l*l)):Ot.scale(c,1/l)}i.evaluateR=e;function n(s,a,o=!1){const c=Gt.scalar(s.numerator,a),l=Gt.scalar(s.denominator,a);if(!(l>0))throw new Error("Nonpositive scalar denominator");return o?(Gt.scalar(Gt.dScalar(s.numerator),a)*l-c*Gt.scalar(Gt.dScalar(s.denominator),a))/(l*l):c/l}i.evaluateS=n;function r(s,a,o,c){if(!(s>0&&a>0))throw new Error("Positive transition endpoints required");const l=o>0?2*s:o<0?s/2:s,h=c>0?a/2:c<0?2*a:a,p=[1,o?o/(3*(l-s)):1,c?c/(3*(a-h)):1,1];return{numerator:[s,l,h,a].map((f,u)=>f*p[u]),denominator:p}}i.positiveScalar=r})(lr||(lr={}));var iu;(i=>{i.choose=Gt.choose,i.scalar=Gt.scalar,i.value=Gt.value,i.tangent=Gt.tangent,i.dScalar=Gt.dScalar,i.elevateScalar=Gt.elevateScalar,i.elevate=Gt.elevate,i.product=Gt.product,i.productV=Gt.productV,i.add=Gt.add,i.addS=Gt.addS,i.scale=Gt.scale,i.split=Xe.split,i.splitS=Xe.splitS,i.restrict=Xe.restrict,i.restrictS=Xe.restrictS,i.thirds=Xe.thirds,i.thirdsS=Xe.thirdsS,i.hermite=mr.hermite,i.gridValue=mr.gridValue,i.gridTangent=mr.gridTangent,i.thirdsR=lr.thirdsR,i.evaluateR=lr.evaluateR,i.evaluateS=lr.evaluateS,i.positiveScalar=lr.positiveScalar})(iu||(iu={}));var ru;(i=>{i.rounding=4/3*Math.tan(Math.PI/8);function t(a,o){const c=[-.9602898564975363,-.7966664774136267,-.525532409916329,-.1834346424956498,.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363],l=[.1012285362903763,.2223810344533745,.3137066458778873,.362683783378362,.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];if(![a,o].every(u=>Number.isFinite(u)&&u>=0))throw new Error("Nonnegative finite section diameters required");const h=a/2,p=o/2,f=i.rounding;return 2*c.reduce((u,d,_)=>{const g=(d+1)/2,m=1-g,x=6*m*g*(f*h-h)-3*g*g*f*h,y=3*m*m*f*p+6*m*g*(p-f*p);return u+l[_]*Math.hypot(x,y)},0)}i.perimeter=t;function e(a,o){if(!(Number.isFinite(a)&&Number.isFinite(o)&&o>0&&a>2*o))throw new Error("Incompatible cubic oval circumference and fixed diameter");let c=0,l=a/2;for(let p=0;p<64;p++){const f=(c+l)/2;t(f,o)<a?c=f:l=f}return(c+l)/2}i.otherDiameter=e;function n(a,o,c=256){if(![a,o].every(Number.isFinite)||a<=0||o<=0||!Number.isInteger(c)||c<2||c%2!==0)throw new Error("Positive cubic ellipse dimensions and even quadrature count required");const l=a/2,h=o/2,p=4*(Math.sqrt(2)-1)/3;let f=0;for(let u=0;u<=c;u++){const d=u/c,_=3*(2*(1-d)*d*(p*l-l)-d*d*p*l),g=3*((1-d)**2*p*h+2*(1-d)*d*(h-p*h));f+=(u===0||u===c?1:u%2?4:2)*Math.hypot(_,g)}return 4*f/(3*c)}i.perimeterBySimpson=n;function r(a,o=1){if(![a,o].every(Number.isFinite)||a<=0||o<=0)throw new Error("Positive girth and independent breadth/depth required");const c=a/n(o,1);return{breadthMm:o*c,depthMm:c}}i.axesBySimpson=r;function s(a,o){if(![a,o].every(Number.isFinite)||o<=0||a<=2*o)throw new Error("Girth must exceed the collapsed section perimeter");let c=0,l=a/2;for(let h=0;h<64;h++){const p=(c+l)/2;if(p===c||p===l)break;n(o,p)<a?c=p:l=p}return(c+l)/2}i.otherDiameterBySimpson=s})(ru||(ru={}));const Ls=Ot.add,ci=Ot.sub,Ds=Ot.scale,yi=(i,t)=>i[0]*t[0]+i[1]*t[1]+i[2]*t[2],su=(i,t)=>Math.hypot(i[0]-t[0],i[1]-t[1],i[2]-t[2]);var Qr;(i=>{function t(n,r,s){let a=0,o=0,c=0,l=0,h=1/0;const p=(u,d,_,g)=>{const m=Ls(n[u],Ds(ci(n[(u+1)%n.length],n[u]),_)),x=Ls(r[d],Ds(ci(r[(d+1)%r.length],r[d]),g)),y=su(m,x);y<h&&(h=y,a=u,o=d,c=_,l=g)};for(let u=0;u<n.length;u++)for(let d=0;d<r.length;d++){const _=n[(u+1)%n.length],g=r[(d+1)%r.length];p(u,d,0,e(n[u],r[d],g).t),p(u,d,1,e(_,r[d],g).t),p(u,d,e(r[d],n[u],_).t,0),p(u,d,e(g,n[u],_).t,1);const m=ci(_,n[u]),x=ci(g,r[d]),y=ci(r[d],n[u]),v=yi(m,m),E=yi(x,x),S=yi(m,x),b=yi(m,y),M=yi(x,y),w=v*E-S*S;if(w>0){const A=(b*E-M*S)/w,T=(b*S-M*v)/w;A>=0&&A<=1&&T>=0&&T<=1&&p(u,d,A,T)}}const f=(u,d,_)=>{const g=(d+1)%u.length;if(_===0||_===1){const x=_===0?d:g,y=[...u.slice(x),...u.slice(0,x)];return[...y,y[0]]}const m=Ls(u[d],Ds(ci(u[g],u[d]),_));return s(m,u[d],u[g],_),[m,...u.slice(d+1),...u.slice(0,d+1),m]};return[...f(n,a,c),...f(r,o,l)]}i.join=t;function e(n,r,s){const a=ci(s,r),o=Math.max(0,Math.min(1,yi(ci(n,r),a)/(yi(a,a)||1))),c=Ls(r,Ds(a,o));return{p:c,t:o,distance:su(n,c)}}i.closest=e})(Qr||(Qr={}));const au=Ot.add,Lr=Ot.sub,ou=Ot.scale,cu=Qr.closest,Ja=(i,t)=>Math.hypot(i[0]-t[0],i[1]-t[1],i[2]-t[2]);var lu;(i=>{function t(h){const p=[0];for(let f=0;f<h.length;f++)p.push(p[f]+Ja(h[f],h[(f+1)%h.length]));return{points:h,cumulative:p,length:p[p.length-1]}}i.curve=t;function e(h,p){const f=(p%1+1)%1*h.length;let u=0,d=h.points.length;for(;d-u>1;){const m=u+d>>1;h.cumulative[m]<=f?u=m:d=m}const _=h.cumulative[u+1]-h.cumulative[u],g=_>0?(f-h.cumulative[u])/_:0;return au(h.points[u],ou(Lr(h.points[(u+1)%h.points.length],h.points[u]),g))}i.at=e;function n(h,p,f=0){return Array.from({length:p},(u,d)=>e(h,d/p+f))}i.sample=n;function r(h){const p=h.reduce((f,u)=>au(f,u),[0,0,0]);return ou(p,1/h.length)}i.centroid=r,i.join=Qr.join;function s(h){if(h.net!==void 0)return h.net;if(h.original===void 0||h.path===void 0||!Number.isSafeInteger(h.path)||h.path<0||h.path>=2**h.depth||!Number.isInteger(h.depth)||h.depth<0||h.depth>30)throw new Error("Source leaf lacks its generating restriction");const p=h.path;let f=h.original.map(u=>Ot.clone(u));for(let u=h.depth-1;u>=0;u--)f=Xe.split(f,.5)[Math.floor(p/2**u)%2];return h.net=f,f}i.controls=s;function a(h,p){if(!(p>0&&Number.isFinite(p))||!(Number.isFinite(h.start)&&Number.isFinite(h.end)&&h.end>h.start)||!Number.isSafeInteger(h.depth)||h.depth<0||h.depth>30&&h.original!==void 0)throw new Error("A finite increasing source restriction and positive chord tolerance are required");if(h.original!==void 0&&(h.path===void 0||!Number.isSafeInteger(h.path)||h.path<0||h.path>=2**h.depth))throw new Error("Source half-path metadata is unresolved");const f=[],u=d=>{const _=s(d),g=Math.max(cu(_[1],_[0],_[3]).distance,cu(_[2],_[0],_[3]).distance),m=_.every(v=>v.every((E,S)=>E===_[0][S]));if(g<=p&&(Ja(_[0],_[3])>0||m)){f.push(d);return}if(d.depth>=30)throw new Error("Cubic tessellation reached numeric subdivision limit");const x=(d.start+d.end)/2;if(!(x>d.start&&x<d.end))throw new Error("Cubic subdivision phase is unresolved");const y=Xe.split(_,.5);u({net:y[0],start:d.start,end:x,depth:d.depth+1,...d.original===void 0?{}:{original:d.original,path:d.path*2}}),u({net:y[1],start:x,end:d.end,depth:d.depth+1,...d.original===void 0?{}:{original:d.original,path:d.path*2+1}})};return u(h),f}i.partition=a,i.closest=Qr.closest;function o(h){if(h.length<3)return!1;const p=h[0],f=h.find(d=>d.some((_,g)=>_!==p[g]));if(f===void 0)return!1;const u=Lr(f,p);return h.some(d=>{const _=Lr(d,p),g=[u[1]*_[2]-u[2]*_[1],u[2]*_[0]-u[0]*_[2],u[0]*_[1]-u[1]*_[0]];if(!g.every(Number.isFinite))throw new Error("Unresolved boundary affine rank");return g.some(m=>m!==0)})}i.hasArea=o;function c(h,p){if($f(h),!h.closed||!Number.isFinite(p)||p<=0)throw new Error("Closed cubic and positive physical chord tolerance required");if(h.spans.some((_,g)=>_[3].some((m,x)=>m!==h.spans[(g+1)%h.spans.length][0][x])))throw new Error("A closed contour requires exact C0-connected source spans");let f=[],u=0;h.spans.forEach((_,g)=>{const m=h.phaseIntervals[g];for(const x of a({net:_.map(y=>Ot.clone(y)),original:_,path:0,start:u,end:u+m,depth:0},p))f.push(x);u+=m});const d=f.filter(_=>!s(_).every(g=>g.every((m,x)=>m===s(_)[0][x])));for(f=d.length?d:f.slice(0,1);!o(f.map(_=>s(_)[0]));){const _=s(f[0])[0],g=f.map(b=>s(b)[0]).find(b=>b.some((M,w)=>M!==_[w])),m=g===void 0?void 0:Lr(g,_),x=f.findIndex(b=>s(b).some(M=>{if(m===void 0)return M.some((A,T)=>A!==_[T]);const w=Lr(M,_);return[m[1]*w[2]-m[2]*w[1],m[2]*w[0]-m[0]*w[2],m[0]*w[1]-m[1]*w[0]].some(A=>A!==0)}));if(x<0)break;const y=f[x],v=(y.start+y.end)/2;if(y.depth>=30||!(v>y.start&&v<y.end))throw new Error("Closed boundary representation reached numeric subdivision limit");const E=Xe.split(s(y),.5),S=[...a({net:E[0],start:y.start,end:v,depth:y.depth+1,...y.original===void 0?{}:{original:y.original,path:y.path*2}},p),...a({net:E[1],start:v,end:y.end,depth:y.depth+1,...y.original===void 0?{}:{original:y.original,path:y.path*2+1}},p)];f=[...f.slice(0,x),...S,...f.slice(x+1)]}return f.map(_=>({p:Ot.clone(s(_)[0]),phase:_.start,leaf:_.original===void 0?_:{original:_.original,path:_.path,start:_.start,end:_.end,depth:_.depth}}))}i.tessellate=c;function l(h){const p=r(n(t(h),64));let f=0,u=-1/0;return h.forEach((d,_)=>{const g=Ja(d,p);g>u&&(u=g,f=_)}),[...h.slice(f),...h.slice(0,f)]}i.exterior=l})(lu||(lu={}));function rv(i,t){if(!Number.isSafeInteger(t)||t<1||i.length!==t)throw new Error("Phase widths must match the polynomial spans");const e=[0];for(let n=0;n<t;++n){const r=i[n],s=e[n]+r;if(!Number.isFinite(r)||r<=0||!Number.isFinite(s)||s<=e[n])throw new Error("Phase widths require a resolvable positive partition");e.push(s)}if(Math.abs(e[t]-1)>64*t*Number.EPSILON||e[t-1]>=1)throw new Error("Phase widths must cover one normalized turn");return e[t]=1,e}var uu;(i=>{function t(e,n,r="quadratic"){if(r!=="quadratic"&&r!=="ruled")throw new Error("An explicit supported station interpolation is required");const s=n.length;if(s<2||e.length!==s||e.some((f,u)=>!Number.isFinite(f)||u>0&&!(f>e[u-1])))throw new Error("Increasing finite physical stations and corresponding courses required");const a=n.map(f=>{if($f(f),f.type!=="cubicBezier"||f.closed||f.phaseUnit!=="normalized"||f.unit!=="mm")throw new Error("Open normalized millimetre cubic courses required");const u=rv(f.phaseIntervals,f.spans.length);for(let d=1;d<f.spans.length;d++)if(f.spans[d-1][3].some((_,g)=>_!==f.spans[d][0][g]))throw new Error("A source course must have continuous span endpoints");return u}),o=e.slice(1).map((f,u)=>f-e[u]);if(o.some(f=>!Number.isFinite(f)))throw new Error("Representable station widths required");const c=e.map((f,u)=>{if(s===2)return[{interval:0,factor:1}];const d=u===0?0:u===s-1?u-2:u-1,_=d+1,g=Math.max(o[d],o[_]),m=o[d]/g,x=o[_]/g,y=m/(m+x),v=x/(m+x);return u===0?[{interval:d,factor:1+y},{interval:_,factor:-y}]:u===s-1?[{interval:_,factor:1+v},{interval:d,factor:-v}]:[{interval:d,factor:v},{interval:_,factor:y}]}),l=(f,u)=>{let d=0,_=a[f].length-2;for(;d<_;){const g=Math.floor((d+_+1)/2);a[f][g]<=u?d=g:_=g-1}return d},h=(f,u)=>n[f].spans[u].map(d=>[d[0],d[1],d[2]]),p=(f,u)=>{const d=Array.from({length:4},()=>[0,0,0]);for(const{interval:_,factor:g}of c[f])for(let m=0;m<4;m++)for(let x=0;x<3;x++)d[m][x]+=g*((u.get(_+1)[m][x]-u.get(_)[m][x])/o[_]);return d};return{interval:f=>{if(!Number.isInteger(f)||f<0||f>=s-1)throw new Error("Station interval index outside field");const u=r==="ruled"?[f,f+1]:[...new Set([f,f+1,...[...c[f],...c[f+1]].flatMap(_=>[_.interval,_.interval+1])])].sort((_,g)=>_-g),d=[...new Set(u.flatMap(_=>a[_]))].sort((_,g)=>_-g);return d.slice(0,-1).map((_,g)=>{const m=d[g+1],x=new Map;for(const S of u){const b=l(S,_),M=a[S][b],w=a[S][b+1]-M;x.set(S,Xe.restrict(h(S,b),(_-M)/w,(m-M)/w))}const y=x.get(f),v=x.get(f+1),E=r==="ruled"?[y,y.map((S,b)=>Ot.mix(S,v[b],1/3)),y.map((S,b)=>Ot.mix(S,v[b],2/3)),v]:mr.hermite(y,v,p(f,x),p(f+1,x),o[f]);if(E.some(S=>S.some(b=>!b.every(Number.isFinite))))throw new Error("Unresolved local Hermite coefficients");return{u0:_,u1:m,grid:E}})},station:(f,u)=>{if(!Number.isInteger(f)||f<0||f>=s||!Number.isFinite(u)||u<0||u>1)throw new Error("Station jet outside admitted chart");const d=y=>{const v=l(y,u),E=a[y][v+1]-a[y][v];return Gt.value(h(y,v),(u-a[y][v])/E)},_=l(f,u),g=a[f][_+1]-a[f][_],m=[0,0,0];if(r==="ruled"){const y=Math.min(f,s-2),v=d(y),E=d(y+1);for(let S=0;S<3;S++)m[S]=(E[S]-v[S])/o[y];return{position:d(f),coursePartial:Gt.value(Gt.tangent(h(f,_),1/g),(u-a[f][_])/g),stationPartial:m}}const x=new Map;for(const{interval:y,factor:v}of c[f]){for(const b of[y,y+1])x.has(b)||x.set(b,d(b));const E=x.get(y),S=x.get(y+1);for(let b=0;b<3;b++)m[b]+=v*((S[b]-E[b])/o[y])}return{position:d(f),coursePartial:Gt.value(Gt.tangent(h(f,_),1/g),(u-a[f][_])/g),stationPartial:m}}}}i.prepare=t})(uu||(uu={}));Ot.add;Ot.sub;Ot.scale;var fu;(i=>{function t(n){const r=new Set,s=a=>{const o=a.name;if(typeof o!="string")throw new Error("realizeAutoMovieConstruction: a node has no name");if(r.has(o))throw new Error(`realizeAutoMovieConstruction: the name ${o} is used twice`);r.add(o);const c=(l,h,p)=>{if(!l.has(h))throw new Error(`realizeAutoMovieConstruction: ${o}'s ${p} ${h} is not a face of its subtree`)};switch(a.type){case"view":return{views:new Set([o]),faces:new Set([o])};case"join":{const l=s(a.host),h=s(a.part);return c(h.views,a.seed.partFace,"part face"),c(l.faces,a.seed.hostFace,"host face"),{views:e(l.views,h.views),faces:e(e(l.faces,h.faces),new Set([o]))}}case"continue":{const l=s(a.host),h=s(a.part);return c(l.views,a.hostFace,"host face"),c(h.views,a.partFace,"part face"),{views:e(l.views,h.views),faces:e(l.faces,h.faces)}}case"trim":{const l=s(a.host);return c(l.faces,a.face,"face"),l}default:throw new Error(`realizeAutoMovieConstruction: ${o} has the unknown type ${a.type}`)}};s(n)}i.admit=t;function e(n,r){return new Set([...n,...r])}})(fu||(fu={}));var Ve;(i=>{function t(m){return{origin:[0,m,0],u:[1,0,0],v:[0,0,1]}}i.horizontal=t;function e(m,x,y){return[m.origin[0]+x*m.u[0]+y*m.v[0],m.origin[1]+x*m.u[1]+y*m.v[1],m.origin[2]+x*m.u[2]+y*m.v[2]]}i.place=e;function n(m,x){const y=[x[0]-m.origin[0],x[1]-m.origin[1],x[2]-m.origin[2]];return[d(y,m.u),d(y,m.v)]}i.local=n;function r(m,x,y,v,E,S,b){const M=2*E**3-3*E**2+1,w=E**3-2*E**2+E,A=-2*E**3+3*E**2,T=E**3-E**2,L=[0,1,2].map(k=>M*m.origin[k]+w*y[k]+A*x.origin[k]+T*v[k]),N=k=>k!==void 0&&Math.abs(k[0])+Math.abs(k[1])+Math.abs(k[2])<1e-12;if(_(m.u,x.u)&&_(m.v,x.v)&&(S===void 0&&b===void 0||N(S)&&N(b)))return{origin:L,u:m.u,v:m.v};const P=a(m),C=a(x),U=p(c(o(P),C)),F=S===void 0?U:l(o(P),S),z=b===void 0?U:u(U,l(o(C),b)),D=[0,1,2].map(k=>w*F[k]+A*U[k]+T*z[k]),O=c(P,f(D));return{origin:L,u:[O[0][0],O[1][0],O[2][0]],v:[O[0][2],O[1][2],O[2][2]]}}i.interpolate=r;function s(m,x,y){const v=a(m),E=p(c(o(v),a(x))),S=l(v,E);return[S[0]/y,S[1]/y,S[2]/y]}i.rate=s;function a(m){const x=m.u,y=m.v,v=[y[1]*x[2]-y[2]*x[1],y[2]*x[0]-y[0]*x[2],y[0]*x[1]-y[1]*x[0]];return[[x[0],v[0],y[0]],[x[1],v[1],y[1]],[x[2],v[2],y[2]]]}function o(m){return[0,1,2].map(x=>[0,1,2].map(y=>m[y][x]))}function c(m,x){return[0,1,2].map(y=>[0,1,2].map(v=>m[y][0]*x[0][v]+m[y][1]*x[1][v]+m[y][2]*x[2][v]))}function l(m,x){return[0,1,2].map(y=>m[y][0]*x[0]+m[y][1]*x[1]+m[y][2]*x[2])}function h(m,x){return[m[1]*x[2]-m[2]*x[1],m[2]*x[0]-m[0]*x[2],m[0]*x[1]-m[1]*x[0]]}function p(m){const x=g(m),y=x[0]<0?-1:1,v=y*x[1],E=y*x[2],S=y*x[3],b=Math.hypot(v,E,S);if(b<1e-15)return[2*v,2*E,2*S];const M=2*Math.atan2(b,y*x[0]);return[v/b*M,E/b*M,S/b*M]}function f(m){const x=Math.hypot(m[0],m[1],m[2]),y=x<1e-6?1-x**2/6:Math.sin(x)/x,v=x<1e-6?.5-x**2/24:(1-Math.cos(x))/x**2,[E,S,b]=m,M=[[0,-b,S],[b,0,-E],[-S,E,0]],w=c(M,M);return[0,1,2].map(A=>[0,1,2].map(T=>(A===T?1:0)+y*M[A][T]+v*w[A][T]))}function u(m,x){const y=Math.hypot(m[0],m[1],m[2]),v=y<1e-4?1/12+y**2/720:1/y**2-(1+Math.cos(y))/(2*y*Math.sin(y)),E=h(m,x),S=h(m,E);return[0,1,2].map(b=>x[b]+E[b]/2+v*S[b])}function d(m,x){return m[0]*x[0]+m[1]*x[1]+m[2]*x[2]}function _(m,x){return Math.abs(m[0]-x[0])+Math.abs(m[1]-x[1])+Math.abs(m[2]-x[2])<1e-12}function g(m){const x=m[0][0],y=m[0][1],v=m[0][2],E=m[1][0],S=m[1][1],b=m[1][2],M=m[2][0],w=m[2][1],A=m[2][2],T=x+S+A;if(T>0){const N=2*Math.sqrt(T+1);return[.25*N,(w-b)/N,(v-M)/N,(E-y)/N]}if(x>S&&x>A){const N=2*Math.sqrt(1+x-S-A);return[(w-b)/N,.25*N,(y+E)/N,(v+M)/N]}if(S>A){const N=2*Math.sqrt(1+S-x-A);return[(v-M)/N,(y+E)/N,.25*N,(b+w)/N]}const L=2*Math.sqrt(1+A-x-S);return[(E-y)/L,(v+M)/L,(b+w)/L,.25*L]}})(Ve||(Ve={}));var hu;(i=>{function t(r,s){return r!==s?1:-1}i.sign=t;function e(r,s,a,o){if(r.basis!=="spline"||a.basis!=="spline")return"both chains must carry spline sections";if(r.order!==a.order)return`the host's sections have ${r.order} control points and the part's ${a.order}`;const c=(u,d)=>{var _,g;return((_=u.pole)==null?void 0:_.end)===d||((g=u.opposite)==null?void 0:g.end)===d};if(c(r,s))return`the host's ${s} end closes in a pole`;if(c(a,o))return`the part's ${o} end closes in a pole`;const l=s==="bottom"?r.layers[0]:r.layers[r.layers.length-1],h=o==="bottom"?0:a.layers.length-1,p=n(l,a.layers[h].y,a.order,t(s,o)),f=a.layers.slice();return f[h]=p,{...a,layers:f}}i.apply=e;function n(r,s,a,o){if(o===1){const p={...r,y:s,frame:r.frame??Ve.horizontal(r.y)};return delete p.view,p}const c=(p,f,u)=>{const d=new Array(2*a);for(let _=0;_<a;_++){const g=(a-_)%a;d[_]=f*p[g],d[a+_]=u*p[a+g]}return d},l=(p,f)=>Array.from({length:a},(u,d)=>f*p[(a-d)%a]),h=(p,f,u,d)=>({origin:[f*p.origin[0],f*p.origin[1],f*p.origin[2]],u:[u*p.u[0],u*p.u[1],u*p.u[2]],v:[d*p.v[0],d*p.v[1],d*p.v[2]]});return{y:s,frame:h(r.frame??Ve.horizontal(r.y),1,1,-1),coefficients:c(r.coefficients,1,-1),slopes:c(r.slopes,-1,1),...r.curvatures===void 0?{}:{curvatures:c(r.curvatures,1,-1)},...r.lift===void 0?{}:{lift:l(r.lift,-1)},...r.liftSlopes===void 0?{}:{liftSlopes:l(r.liftSlopes,1)},...r.liftCurvatures===void 0?{}:{liftCurvatures:l(r.liftCurvatures,-1)},...r.frameSlopes===void 0?{}:{frameSlopes:h(r.frameSlopes,-1,-1,1)},...r.frameCurvatures===void 0?{}:{frameCurvatures:h(r.frameCurvatures,1,1,-1)}}}})(hu||(hu={}));var Ge;(i=>{function t(a,o,c,l){const h=a.chart.length;if(a.kind==="hole"||a.kind==="island"){const u=s(c,r(a)[1],l);let d=!1;for(let _=0;_<h;_++){const g=a.chart[_],m=a.chart[(_+1)%h];g[1]>u!=m[1]>u&&o<g[0]+(u-g[1])*(m[0]-g[0])/(m[1]-g[1])&&(d=!d)}return a.kind==="island"?d:!d}const p=l??2*Math.PI;let f=0;for(let u=0;u<h;u++){const d=a.chart[u],_=a.chart[(u+1)%h],g=[_[0],s(_[1],d[1],p)],m=s(c,(d[1]+g[1])/2,p);if(d[1]>m==g[1]>m)continue;const x=d[0]+(m-d[1])*(g[0]-d[0])/(g[1]-d[1]);(a.kind==="start"?x<=o:x>=o)&&f++}return f%2===1}i.kept=t;function e(a,o,c){const l=a.chart.length,h=a.chart[0][1],f=a.chart[l-1][1]-h>=0?1:-1,u=h+f*sv(f*(o-h),c);for(let d=0;d<l;d++){const _=a.chart[d],g=d+1<l?a.chart[d+1]:[a.chart[0][0],a.chart[0][1]+f*c];if((u-_[1])*(u-g[1])<=0&&_[1]!==g[1])return _[0]+(u-_[1])*(g[0]-_[0])/(g[1]-_[1])}return a.chart[0][0]}i.station=e;function n(a,o,c,l){const h=a.chart.length;let p={segment:0,share:0,distance:1/0};for(let f=0;f<h;f++){const u=a.chart[f],d=a.chart[(f+1)%h],_=f+1<h?d[1]:s(d[1],u[1],l),g=s(c,u[1],l),m=d[0]-u[0],x=_-u[1],y=m*m+x*x,v=y>0?Math.min(1,Math.max(0,((o-u[0])*m+(g-u[1])*x)/y)):0,E=Math.hypot(o-u[0]-v*m,g-u[1]-v*x);E<p.distance&&(p={segment:f,share:v,distance:E})}return p}i.foot=n;function r(a){let o=0,c=0;for(const l of a.chart)o+=l[0],c+=l[1];return[o/a.chart.length,c/a.chart.length]}i.centre=r;function s(a,o,c){return c===void 0?a:a+c*Math.round((o-a)/c)}i.shift=s})(Ge||(Ge={}));function sv(i,t){const e=i%t;return e<0?e+t:e}var Jt;(i=>{function t(f,u){return[f[0]+u[0],f[1]+u[1],f[2]+u[2]]}i.add=t;function e(f,u){return[f[0]-u[0],f[1]-u[1],f[2]-u[2]]}i.sub=e;function n(f,u){return[f[0]*u,f[1]*u,f[2]*u]}i.scale=n;function r(f){const u=[0,0,0];for(const[d,_]of f)u[0]+=d*_[0],u[1]+=d*_[1],u[2]+=d*_[2];return u}i.combine=r;function s(f,u){return f[0]*u[0]+f[1]*u[1]+f[2]*u[2]}i.dot=s;function a(f,u){return[f[1]*u[2]-f[2]*u[1],f[2]*u[0]-f[0]*u[2],f[0]*u[1]-f[1]*u[0]]}i.cross=a;function o(f){return Math.hypot(f[0],f[1],f[2])}i.norm=o;function c(f){const u=o(f);return u>0?[f[0]/u,f[1]/u,f[2]/u]:null}i.unit=c;function l(f,u,d,_){const g=s(f,a(u,d)),m=o(f)*o(u)*o(d);return Math.abs(g)>1e-14*m?[s(_,a(u,d))/g,s(f,a(_,d))/g,s(f,a(u,_))/g]:null}i.solve3=l;function h(f,u,d,_,g){const m=f*_-u*d;return Math.abs(m)>1e-14*(Math.abs(f*_)+Math.abs(u*d))?[(g[0]*_-u*g[1])/m,(f*g[1]-d*g[0])/m]:null}i.solve2=h;function p(f,u){const d=f.length,_=f.map((x,y)=>[...x,u[y]]);let g=0;for(const x of f)for(const y of x)g=Math.max(g,Math.abs(y));for(let x=0;x<d;x++){let y=x;for(let v=x+1;v<d;v++)Math.abs(_[v][x])>Math.abs(_[y][x])&&(y=v);if(!(Math.abs(_[y][x])>1e-14*g))return null;[_[x],_[y]]=[_[y],_[x]];for(let v=x+1;v<d;v++){const E=_[v][x]/_[x][x];for(let S=x;S<=d;S++)_[v][S]-=E*_[x][S]}}const m=new Array(d).fill(0);for(let x=d-1;x>=0;x--){let y=_[x][d];for(let v=x+1;v<d;v++)y-=_[x][v]*m[v];m[x]=y/_[x][x]}return m}i.solve=p})(Jt||(Jt={}));const{dot:Qa,norm:ji,sub:tr}=Jt;var Tn;(i=>{function t(a,o,c,l,h,p){if(!Ge.kept(a,o,c,p))return!1;const f=Qa(l.u,l.u),u=Qa(l.u,l.v),d=Qa(l.v,l.v),_=a.chart.length;let g=1/0;for(let m=0;m<_;m++){const x=a.chart[m],y=a.chart[(m+1)%_],v=Ge.shift(y[1],x[1],p),E=Ge.shift(c,x[1],p);g=Math.min(g,e(o-x[0],E-x[1],y[0]-x[0],v-x[1],f,u,d))}return g>=h}i.keeps=t;function e(a,o,c,l,h,p,f){const u=h*c*c+2*p*c*l+f*l*l,d=h*a*c+p*(a*l+o*c)+f*o*l,_=u>0?Math.min(1,Math.max(0,d/u)):0,g=a-_*c,m=o-_*l;return Math.sqrt(Math.max(0,h*g*g+2*p*g*m+f*m*m))}function n(a,o,c){let l=0;for(const h of o)l+=Ge.foot(a,h[0],h[1],c).distance;return l/o.length}i.nearest=n;function r(a,o){const c=p=>[a.positions[3*p],a.positions[3*p+1],a.positions[3*p+2]],l=[0];for(let p=1;p<o.length;p++)l.push(l[p-1]+ji(tr(c(o[p]),c(o[p-1]))));const h=l[o.length-1]+ji(tr(c(o[0]),c(o[o.length-1])));return l.map(p=>h>0?2*Math.PI*p/h:0)}i.arc=r;function s(a,o,c){const l=g=>[a.positions[3*g],a.positions[3*g+1],a.positions[3*g+2]],h=l(o[0]);let p=0;c.forEach((g,m)=>{ji(tr(l(g),h))<ji(tr(l(c[p]),h))&&(p=m)});const f=c.map((g,m)=>c[(p+m)%c.length]),u=[f[0],...f.slice(1).reverse()],d=g=>{const x=r(a,g).findIndex(y=>y>=Math.PI/2);return l(g[x<0?0:x])},_=d(o);return ji(tr(d(f),_))<=ji(tr(d(u),_))?f:u}i.aligned=s})(Tn||(Tn={}));var ea;(i=>{function t(n,r){const s=e(n),a=e(r),o=s.vertices.length,c=a.vertices.length,l=[];let h=0,p=0;const f=d=>s.angles[d%o]+Math.floor(d/o)*Sr,u=d=>a.angles[d%c]+Math.floor(d/c)*Sr;for(;h<o||p<c;)p>=c||h<o&&f(h+1)-u(p)<=u(p+1)-f(h)?(l.push([s.vertices[h%o],s.vertices[(h+1)%o],a.vertices[p%c]]),h++):(l.push([s.vertices[h%o],a.vertices[(p+1)%c],a.vertices[p%c]]),p++);return l}i.band=t;function e(n){const r=n.vertices.length;let s=0;for(let p=0;p<r;p++)s+=av(n.angles[(p+1)%r]-n.angles[p]);const a=Array.from({length:r},(p,f)=>s>=0?f:r-1-f);let o=0;for(let p=1;p<r;p++)Ks(n.angles[a[p]])<Ks(n.angles[a[o]])&&(o=p);const c=[],l=[];let h=Ks(n.angles[a[o]]);for(let p=0;p<r;p++){const f=a[(o+p)%r],u=p===0?h:h+ov(n.angles[f]-h);c.push(n.vertices[f]),l.push(u),h=u}return{vertices:c,angles:l}}i.increasing=e})(ea||(ea={}));const Sr=2*Math.PI;function av(i){return i-Sr*Math.round(i/Sr)}function Ks(i){const t=i%Sr;return t<0?t+Sr:t}function ov(i){return Ks(i)}const{cross:du,dot:pu,norm:er,scale:mu,sub:gu}=Jt;var Qe;(i=>{function t(){return{positions:[],indices:[],coordinates:[],owners:[]}}i.create=t;function e(u,d){const _=u.owners.findIndex(g=>g.name===d.name);return _>=0?_:(u.owners.push({name:d.name,point:(g,m)=>d.jet(g,m).p}),u.owners.length-1)}i.owner=e;function n(u,d){const _=e(u,d.host),g=e(u,d.part),m=e(u,d.blend),x=d.hostLoop.chart.length,y=d.hostLoop.chart.map((E,S)=>{const b=2*Math.PI*S/x,M=d.partLoop.chart[S],w=[c(u,d.host.jet(E[0],E[1]).p,_,E[0],E[1])];for(let A=1;A<d.rows;A++){const T=d.length*A/d.rows;w.push(c(u,d.blend.jet(T,b).p,m,T,b))}return w.push(c(u,d.part.jet(M[0],M[1]).p,g,M[0],M[1])),w}),v=[];for(let E=0;E<x;E++)for(let S=0;S<d.rows;S++){const b=y[E][S],M=y[(E+1)%x][S],w=y[(E+1)%x][S+1],A=y[E][S+1];v.push([b,M,w],[b,w,A])}return l(u,v,E=>{const S=d.hostLoop.chart[Math.floor(E/(2*d.rows))];return f(d.host,S[0],S[1])}),{host:{kind:d.hostLoop.kind,vertices:y.map(E=>E[0]),chart:d.hostLoop.chart},part:{kind:d.partLoop.kind,vertices:y.map(E=>E[d.rows]),chart:d.partLoop.chart}}}i.seam=n;function r(u,d){const{surface:_,stations:g,phases:m,loops:x}=d,y=e(u,_),v=_.period!==void 0,E=g.length,S=m.length,b=v?S:S-1,M=g.map(z=>m.map(D=>_.jet(z,D))),w=g.map((z,D)=>m.map((O,k)=>{const J=Math.min(...[g[D-1],g[D+1]].filter(W=>W!==void 0).map(W=>Math.abs(W-z))),$=m[k+1]??(v?m[0]+_.period:m[k-1]),rt=Math.abs($-O),at=M[D][k],lt=.5*Math.min(er(at.u)*J,er(at.v)*rt);return x.every(W=>Tn.keeps(W,z,O,at,lt,_.period))})),A=new Map,T=(z,D)=>{const O=z*S+D%S,k=A.get(O);if(k!==void 0)return k;const J=c(u,M[z][D%S].p,y,g[z],m[D%S]);return A.set(O,J),J},L=[],N=new Set,P=new Map;for(let z=0;z+1<E;z++)for(let D=0;D<b;D++){const O=(D+1)%S;if(!(w[z][D]&&w[z+1][D]&&w[z+1][O]&&w[z][O]))continue;const k=T(z,D),J=T(z+1,D),$=T(z+1,O),rt=T(z,O);L.push([k,J,$],[k,$,rt]);for(const[at,lt]of[[k,J],[J,$],[$,rt],[rt,k]]){const W=`${lt},${at}`;N.has(W)?N.delete(W):N.add(`${at},${lt}`)}P.set(k,[g[z],m[D]]),P.set(J,[g[z+1],m[D]]),P.set($,[g[z+1],m[O]]),P.set(rt,[g[z],m[O]])}l(u,L,_.orientation===1!=(d.inverted===!0)?1:-1,!0);const C=[],U=new Map;for(const z of N){const[D,O]=z.split(",").map(Number);U.set(D,O)}for(;U.size>0;){const z=U.keys().next().value,D=[];let O=z;for(;U.has(O);){D.push(O);const k=U.get(O);U.delete(O),O=k}C.push(D)}const F=[...C];for(const z of x){let D=-1,O=1/0;if(F.forEach((rt,at)=>{const lt=Tn.nearest(z,rt.map(W=>P.get(W)),_.period);lt<O&&(O=lt,D=at)}),D<0)continue;const k=Tn.aligned(u,z.vertices,F.splice(D,1)[0]),J=ea.band({vertices:z.vertices,angles:Tn.arc(u,z.vertices)},{vertices:k,angles:Tn.arc(u,k)}),$=d.inverted===!0?-1:1;l(u,J,rt=>mu(p(u,_,J[rt]),$))}return F}i.face=r;function s(u,d,_,g){if(d.length===0)return;const m=g?-1:1;l(u,d,x=>mu(p(u,_,d[x]),m))}i.close=s;function a(u,d,_,g){const m=Tn.aligned(u,d,_),x=ea.band({vertices:[...d],angles:Tn.arc(u,d)},{vertices:m,angles:Tn.arc(u,m)});let y=[0,0,0];for(const v of x){const E=h(u,v);er(E)>er(y)&&(y=E)}return pu(y,g)<0?x.map(([v,E,S])=>[v,S,E]):x}i.bridge=a;function o(u,d){const _=u.coordinates.slice(3*d,3*d+3);return u.owners[_[0]].point(_[1],_[2])}i.evaluate=o;function c(u,d,_,g,m){return u.positions.push(d[0],d[1],d[2]),u.coordinates.push(_,g,m),u.positions.length/3-1}i.vertex=c;function l(u,d,_,g=!1){let m;if(g||typeof _=="number")m=_<0;else{let x=-1,y=0;d.forEach((v,E)=>{const S=er(h(u,v));S>y&&(y=S,x=E)}),m=x>=0&&pu(h(u,d[x]),_(x))<0}for(const[x,y,v]of d)u.indices.push(...m?[x,v,y]:[x,y,v])}function h(u,d){const _=g=>[u.positions[3*g],u.positions[3*g+1],u.positions[3*g+2]];return du(gu(_(d[1]),_(d[0])),gu(_(d[2]),_(d[0])))}function p(u,d,_){const g=[0,0,0];for(const m of _){const x=f(d,u.coordinates[3*m+1],u.coordinates[3*m+2]),y=er(x);if(y>0)for(let v=0;v<3;v++)g[v]=g[v]+x[v]/y}return g}function f(u,d,_){const g=u.jet(d,_),m=du(g.u,g.v);return[m[0]*u.orientation,m[1]*u.orientation,m[2]*u.orientation]}})(Qe||(Qe={}));var _u;(i=>{function t(e,n){const r=e.faces[n.host].surface,s=Qe.owner(e.mesh,r),a=l=>2*Math.PI*l/n.count,o=Array.from({length:n.count},(l,h)=>Qe.vertex(e.mesh,r.jet(n.hostStation,a(h)).p,s,n.hostStation,a(h)));e.faces[n.host].cycles.push({kind:n.hostKind,vertices:o,chart:o.map((l,h)=>[n.hostStation,a(h)]),neighbours:o.map((l,h)=>({face:n.part,from:[n.partStation,n.sign*a(h)],to:[n.partStation,n.sign*a(h+1)]}))});const c=Array.from({length:n.count},(l,h)=>n.sign===1?h:(n.count-h)%n.count);e.faces[n.part].cycles.push({kind:n.partKind,vertices:c.map(l=>o[l]),chart:c.map((l,h)=>[n.partStation,a(h)]),neighbours:c.map((l,h)=>({face:n.host,from:[n.hostStation,n.sign*a(h)],to:[n.hostStation,n.sign*a(h+1)]}))})}i.create=t})(_u||(_u={}));var cn;(i=>{function t(r,s){const a=r.length,o=new Array(a).fill(1),c=new Array(a).fill(0),l=new Array(a).fill(0);for(let p=1;p+1<a;p++){const f=r[p]-r[p-1],u=r[p+1]-r[p],d=f/o[p-1];o[p]=2*(f+u)-d*c[p-1],c[p]=u,l[p]=6*((s[p+1]-s[p])/u-(s[p]-s[p-1])/f)-d*l[p-1]}const h=new Array(a).fill(0);for(let p=a-2;p>=1;p--)h[p]=(l[p]-c[p]*h[p+1])/o[p];return{xs:r,ys:s,curvatures:h}}i.create=t;function e(r,s){const{xs:a,ys:o,curvatures:c}=r,l=a.length;let h=l-2;for(let d=0;d+1<l;d++)if(s<=a[d+1]){h=d;break}const p=a[h+1]-a[h],f=s-a[h],u=(o[h+1]-o[h])/p-p*(2*c[h]+c[h+1])/6;if(f<0)return o[h]+f*u;if(f>p){const d=u+p*c[h]+p*(c[h+1]-c[h])/2;return o[h+1]+(f-p)*d}return o[h]+f*(u+f*(c[h]/2+f*(c[h+1]-c[h])/(6*p)))}i.evaluate=e;function n(r,s){const{xs:a,ys:o,curvatures:c}=r,l=a.length;let h=l-2;for(let _=0;_+1<l;_++)if(s<=a[_+1]){h=_;break}const p=a[h+1]-a[h],f=Math.min(p,Math.max(0,s-a[h])),u=(o[h+1]-o[h])/p-p*(2*c[h]+c[h+1])/6,d=s>=a[0]&&s<=a[l-1];return[u+c[h]*f+(c[h+1]-c[h])*f*f/(2*p),d?c[h]+(c[h+1]-c[h])*f/p:0]}i.derivative=n})(cn||(cn={}));const{add:Bn,cross:nr,dot:rn,scale:Re,sub:zn}=Jt;function ja(i){const t=Math.hypot(i[0],i[1],i[2]);return t>0?Re(i,1/t):i}var bi;(i=>{function t(_,g,m){const x=nr(m,g);return{at:y=>({origin:Bn(_,Re(x,y)),u:[...g],v:[...m]})}}i.straight=t;function e(){return t([0,0,0],[1,0,0],[0,0,1])}i.horizontal=e;function n(_,g){const m=v=>cn.create(v.map(E=>E.station),v.map(E=>E.value)),x=m(_),y=m(g);return{at:v=>({origin:[cn.evaluate(x,v),v,cn.evaluate(y,v)],u:[1,0,0],v:[0,0,1]})}}i.level=n;function r(_,g,m){const x=a(_,g);if(typeof x=="string")return x;const{directions:y,turns:v}=x,E=zn(m,Re(y[0],rn(m,y[0]))),S=Math.hypot(E[0],E[1],E[2]);if(!(S>1e-9*Math.hypot(m[0],m[1],m[2])))return"up lies along the first segment";const b=Re(E,1/S);return{at:M=>{let w=[..._[0]],A=b,T=y[0],L=0;for(let N=0;N<v.length;N++){const P=v[N];if(M<=P.start)break;w=Bn(w,Re(T,P.start-L)),L=P.start;const C=Math.min(2*P.half,M-L);if(P.angle>0){w=Bn(w,f(T,P,C));const U=P.angle*c(C/(2*P.half));A=l(A,P.axis,U),T=l(T,P.axis,U)}else w=Bn(w,Re(T,C));if(L+=C,C<2*P.half)return o(w,A,T)}return o(Bn(w,Re(T,M-L)),A,T)}}}i.jointed=r;function s(_,g){const m=a(_,g);return typeof m=="string"?m:m.lengths.map((x,y)=>{const v=y>=1?m.turns[y-1].setback:0,E=y<m.turns.length?m.turns[y].setback:0,S=y===0?0:m.turns[y-1].start+2*m.turns[y-1].half;return{from:v,to:x-E,start:S,end:S+x-v-E}})}i.runs=s;function a(_,g){const m=_.length;if(m<2)return`${m} centres, at least two needed`;if(g.length!==m-2)return`${g.length} half lengths for ${m-2} interior centres`;const x=[],y=[];for(let S=0;S+1<m;S++){const b=zn(_[S+1],_[S]),M=Math.hypot(b[0],b[1],b[2]);if(!(M>0))return`centres ${S} and ${S+1} coincide`;x.push(Re(b,1/M)),y.push(M)}const v=[];for(let S=1;S+1<m;S++){const b=g[S-1];if(!(b>0))return`half length ${b} at centre ${S} is not positive`;const M=x[S-1],w=x[S],A=Math.max(-1,Math.min(1,rn(M,w))),T=Math.acos(A);if(!(T<Math.PI-1e-9))return`segments ${S-1} and ${S} are opposite`;const L=nr(M,w),N=Math.hypot(L[0],L[1],L[2]),P=N>0?Re(L,1/N):[0,0,0],C={centre:S,half:b,angle:N>0?T:0,axis:P,setback:b,start:0};if(C.angle>0){const U=f(M,C,2*b),F=Bn(M,w);C.setback=rn(U,F)/rn(F,F)}v.push(C)}for(let S=0;S+1<m;S++){const b=S>=1?v[S-1].setback:0,M=S+1<m-1?v[S].setback:0;if(!(b+M<y[S]))return`the turns' set-backs ${b} and ${M} overrun segment ${S} of length ${y[S]}`}let E=0;for(let S=0;S<v.length;S++){const b=v[S],M=S>=1?v[S-1].setback:0;E+=y[S]-M-b.setback,b.start=E,E+=2*b.half}return{directions:x,lengths:y,turns:v}}function o(_,g,m){return{origin:_,u:[...g],v:nr(g,m)}}function c(_){const g=Math.min(1,Math.max(0,_));return g*g*g*(10+g*(-15+6*g))}function l(_,g,m){const x=Math.cos(m),y=Math.sin(m);return Bn(Bn(Re(_,x),Re(nr(g,_),y)),Re(g,rn(g,_)*(1-x)))}const h=[[-.9739065285171717,.0666713443086881],[-.8650633666889845,.1494513491505806],[-.6794095682990244,.219086362515982],[-.4333953941292472,.2692667193099963],[-.1488743389816312,.2955242247147529],[.1488743389816312,.2955242247147529],[.4333953941292472,.2692667193099963],[.6794095682990244,.219086362515982],[.8650633666889845,.1494513491505806],[.9739065285171717,.0666713443086881]],p=8;function f(_,g,m){let x=[0,0,0];const y=m/p;for(let v=0;v<p;v++)for(const[E,S]of h){const b=y*(v+(E+1)/2),M=g.angle*c(b/(2*g.half));x=Bn(x,Re(l(_,g.axis,M),S*y/2))}return x}function u(_,g,m){const x=_.map(A=>A.station),y=[0,1,2].map(A=>cn.create(x,_.map(T=>T.point[A]))),v=A=>y.map(T=>cn.evaluate(T,A)),E=A=>ja(y.map(T=>cn.derivative(T,A)[0])),S=x[0],b=E(S),M=ja(zn(g,Re(b,rn(g,b)))),w=(A,T,L)=>{const N=v(A),P=v(A+L),C=E(A),U=E(A+L),F=zn(P,N),z=rn(F,F);if(!(z>0))return T;const D=zn(T,Re(F,2/z*rn(F,T))),O=zn(C,Re(F,2/z*rn(F,C))),k=zn(U,O),J=rn(k,k);return J>0?zn(D,Re(k,2/J*rn(k,D))):D};return{at:A=>{const T=A-S,L=Math.max(1,Math.ceil(Math.abs(T)/m)),N=T/L;let P=M;for(let F=0;F<L;F++)P=w(S+F*N,P,N);const C=E(A),U=ja(zn(P,Re(C,rn(P,C))));return{origin:v(A),u:U,v:nr(U,C)}}}}i.minimal=u;function d(_){return nr(_.v,_.u)}i.normal=d})(bi||(bi={}));var Mr;(i=>{i.SCALE=1e3;function t(p){const f=e(p.axis);return typeof f=="string"?f:{name:p.name,axis:f,stations:p.stations.map(u=>u*i.SCALE),front:l(p.front),side:l(p.side),fullness:h(p.fullness),...p.pole==="open"?{}:{pole:p.pole},order:p.order,samples:p.samples}}i.part=t;function e(p){switch(p.type){case"straight":return bi.straight(r(p.origin),s(p.u),s(p.v));case"level":return p.origin===null?bi.horizontal():bi.level(c(p.origin.x),c(p.origin.z));case"curved":return bi.minimal(p.knots.map(f=>({station:f.station*i.SCALE,point:r(f.point)})),s(p.u),p.step*i.SCALE);case"jointed":return bi.jointed(p.centres.map(r),p.halves.map(f=>f*i.SCALE),s(p.up))}}i.frame=e;function n(p){switch(p.type){case"phase":return{kind:"phase"};case"arc":return{kind:"arc"};case"angle":return{kind:"angle",centre:r(p.centre),normal:s(p.normal),reference:s(p.reference)}}}i.parameter=n;function r(p){return[p.x*i.SCALE,p.y*i.SCALE,p.z*i.SCALE]}i.point=r;function s(p){return[p.x,p.y,p.z]}i.vector=s;function a(p){return{knots:p.knots.map(f=>({site:f.site,station:f.station*i.SCALE,value:f.value*i.SCALE}))}}function o(p){return{knots:p.knots.map(f=>({site:f.site,station:f.station*i.SCALE,value:f.value}))}}function c(p){return p.knots.map(f=>({station:f.station*i.SCALE,value:f.value*i.SCALE}))}function l(p){return{positive:a(p.positive),negative:a(p.negative)}}function h(p){const f=u=>[o(u[0]),o(u[1]),o(u[2]),o(u[3])];switch(p.type){case"girth":return{kind:"girth",girth:a(p.girth),...p.departures===null?{}:{departures:f(p.departures)}};case"shoulder":return{kind:"shoulder",shoulder:o(p.shoulder),...p.departures===null?{}:{departures:f(p.departures)}};case"top":return{kind:"top",shoulders:f(p.shoulders)}}}})(Mr||(Mr={}));const{dot:li,norm:Ns,sub:cv}=Jt;var jr;(i=>{i.STEPS=60;function t(e,n,r,s){let a=r[0],o=r[1];for(let c=0;c<i.STEPS;c++){const l=e.jet(a,o),h=cv(l.p,n),p=Ns(l.u),f=Ns(l.v);if(!(p>0&&f>0))return null;const u=li(h,l.u),d=li(h,l.v);if(Math.abs(u)/p<=s&&Math.abs(d)/f<=s)return{u:a,v:o,point:l.p,distance:Ns(h)};const _=li(l.u,l.u),g=li(l.u,l.v),m=li(l.v,l.v);let x=_+li(h,l.uu),y=g+li(h,l.uv),v=m+li(h,l.vv);x>0&&x*v-y*y>0||(x=_,y=g,v=m);const E=Jt.solve2(x,y,y,v,[-u,-d]);if(E===null)return null;const S=Math.sqrt(Math.max(0,_*E[0]**2+2*g*E[0]*E[1]+m*E[1]**2)),b=Math.max(Ns(h),s),M=S>b&&S>0?b/S:1;a+=M*E[0],o+=M*E[1]}return null}i.of=t})(jr||(jr={}));const{norm:vu,scale:to,solve3:lv,sub:xu}=Jt;var Su;(i=>{i.STEPS=40,i.GRID=[16,32];function t(r,s,a,o,c,l){const h=Mr.SCALE;if(r.type==="point")return{phi:r.part[1],s:r.part[0]*h,y:r.host[0]*h,theta:r.host[1],face:c};if(!(r.from>=0&&r.from<=1&&r.to>=0&&r.to<=1&&r.from!==r.to))return`search shares ${r.from} and ${r.to} must lie in [0, 1] and differ`;const p=a[0],f=a[a.length-1],u=p+r.from*(f-p),d=p+r.to*(f-p),_=Math.min(u,d),g=Math.max(u,d),m=a.filter(v=>v>_&&v<g),x=u<d?[u,...m,d]:[u,...m.reverse(),d];let y=null;for(const v of x){const E=s.jet(v,r.phase).p,S=y??n(o,E),b=jr.of(o,E,S,l)??jr.of(o,E,n(o,E),l);if(b===null)continue;y=[b.u,b.v];const M=e(s,o,r.phase,[v,b.u,b.v],l);if(M!==null&&M[0]>=_&&M[0]<=g)return{phi:r.phase,s:M[0],y:M[1],theta:M[2],face:c}}return`the part's station line at phase ${r.phase} meets the host nowhere between stations ${u} and ${d} mm`}i.create=t;function e(r,s,a,o,c){let l=[...o];for(let h=0;h<i.STEPS;h++){const p=r.jet(l[0],a),f=s.jet(l[1],l[2]),u=xu(p.p,f.p);if(vu(u)<=c)return l;const d=lv(p.u,to(f.u,-1),to(f.v,-1),to(u,-1));if(d===null||!d.every(Number.isFinite))return null;l=[l[0]+d[0],l[1]+d[1],l[2]+d[2]]}return null}function n(r,s){const[a,o]=r.domain??[0,1],c=r.period??1;let l=[a,0],h=1/0;for(let p=0;p<=i.GRID[0];p++)for(let f=0;f<i.GRID[1];f++){const u=a+(o-a)*p/i.GRID[0],d=c*f/i.GRID[1],_=vu(xu(r.jet(u,d).p,s));_<h&&(h=_,l=[u,d])}return l}})(Su||(Su={}));var Mu;(i=>{function t(n,r,s){const a=new Map(r.chainSurfaces.map((o,c)=>[o,r.chainList[c]]));n.faces.forEach((o,c)=>{var u,d;const l=a.get(o.surface);if(l===void 0)return;const h=l.layers[0].y,p=l.layers[l.layers.length-1].y,f=Qe.owner(n.mesh,o.surface);for(const _ of s[c]??[]){if(_.length===0)continue;const g=n.mesh.coordinates[3*_[0]+1],m=Math.abs(g-h)<=Math.abs(g-p)?"bottom":"top",x=((u=l.pole)==null?void 0:u.end)===m?l.pole:((d=l.opposite)==null?void 0:d.end)===m?l.opposite:void 0;if(x===void 0)continue;const y=Qe.vertex(n.mesh,x.point,f,m==="bottom"?h:p,0),v=_.map((E,S)=>[E,_[(S+1)%_.length],y]);Qe.close(n.mesh,v,o.surface,o.inverted===!0)}})}i.close=t;function e(n){const r=n.mesh.positions.length/3;return{positions:n.mesh.positions.map(s=>s/Mr.SCALE),indices:n.mesh.indices.slice(),coordinates:n.mesh.coordinates.slice(0,3*r),owners:n.mesh.owners.map(s=>s.name)}}i.mesh=e})(Mu||(Mu={}));var yu;(i=>{function t(r,s){return{faces:r.faces.length,cycles:r.faces.map(a=>a.cycles.map(n)),inverted:r.faces.map(a=>a.inverted),positions:r.mesh.positions.length,coordinates:r.mesh.coordinates.length,indices:r.mesh.indices.length,owners:r.mesh.owners.length,blends:r.blends.length,names:new Set(s.faces.keys()),chainList:s.chainList.length,chainSurfaces:s.chainSurfaces.length,blendSurfaces:s.blendSurfaces.length,joins:s.joins.length,trims:s.trims.length}}i.snap=t;function e(r,s,a){r.faces.length=a.faces,r.faces.forEach((o,c)=>{o.cycles=a.cycles[c],a.inverted[c]===void 0?delete o.inverted:o.inverted=a.inverted[c]}),r.mesh.positions.length=a.positions,r.mesh.coordinates.length=a.coordinates,r.mesh.indices.length=a.indices,r.mesh.owners.length=a.owners,r.blends.length=a.blends;for(const o of[...s.faces.keys()])a.names.has(o)||(s.faces.delete(o),s.chains.delete(o));s.chainList.length=a.chainList,s.chainSurfaces.length=a.chainSurfaces,s.blendSurfaces.length=a.blendSurfaces,s.joins.length=a.joins,s.trims.length=a.trims}i.restore=e;function n(r){return{kind:r.kind,vertices:r.vertices.slice(),chart:r.chart.map(s=>[s[0],s[1]]),neighbours:r.neighbours.map(s=>({face:s.face,from:[s.from[0],s.from[1]],to:[s.to[0],s.to[1]]}))}}})(yu||(yu={}));var ye;(i=>{function t(c){return c}i.width=t;function e(c,l,h){const p=(h/(2*Math.PI)%1+1)%1*l,f=Math.min(l-1,Math.floor(p)),u=p-f,d=1-u,_=d*d*d/6,g=(3*u*u*u-6*u*u+4)/6,m=(-3*u*u*u+3*u*u+3*u+1)/6,x=u*u*u/6,y=-(d*d)/2,v=(3*u*u-4*u)/2,E=(-3*u*u+2*u+1)/2,S=u*u/2,b=(f-1+l)%l,M=f%l,w=(f+1)%l,A=(f+2)%l,T=c,L=l/(2*Math.PI);return[_*T[b]+g*T[M]+m*T[w]+x*T[A],_*T[l+b]+g*T[l+M]+m*T[l+w]+x*T[l+A],(y*T[b]+v*T[M]+E*T[w]+S*T[A])*L,(y*T[l+b]+v*T[l+M]+E*T[l+w]+S*T[l+A])*L]}i.evaluate=e;function n(c){const l=c.length,h=new Array(2*l).fill(0);return c.forEach((p,f)=>{for(let u=-eo.length+1;u<eo.length;u++){const d=((f+u)%l+l)%l,_=eo[Math.abs(u)];h[d]+=_*p[0],h[l+d]+=_*p[1]}}),h}i.interpolate=n;function r(c,l,h){const p=(h/(2*Math.PI)%1+1)%1*l,f=Math.min(l-1,Math.floor(p)),u=p-f,d=1-u,_=d*d*d/6,g=(3*u*u*u-6*u*u+4)/6,m=(-3*u*u*u+3*u*u+3*u+1)/6,x=u*u*u/6,y=-(d*d)/2,v=(3*u*u-4*u)/2,E=(-3*u*u+2*u+1)/2,S=u*u/2,b=d,M=3*u-2,w=1-3*u,A=u,T=(f-1+l)%l,L=f%l,N=(f+1)%l,P=(f+2)%l,C=c,U=C[T],F=C[L],z=C[N],D=C[P],O=C[l+T],k=C[l+L],J=C[l+N],$=C[l+P],rt=l/(2*Math.PI),at=rt*rt;return[_*U+g*F+m*z+x*D,_*O+g*k+m*J+x*$,(y*U+v*F+E*z+S*D)*rt,(y*O+v*k+E*J+S*$)*rt,(b*U+M*F+w*z+A*D)*at,(b*O+M*k+w*J+A*$)*at]}i.jet=r;function s(c,l,h){const p=c.length;if(p%l!==0)throw new Error(`${p} samples are not a multiple of ${l} control points`);const f=new Array(l).fill(0),u=new Array(l).fill(0),d=new Array(l).fill(0);if(c.forEach((y,v)=>{const E=v*l/p,S=Math.floor(E),b=o(E-S);for(let M=0;M<4;M++){const w=((S-1+M)%l+l)%l;if(f[w]+=b[M]*y[0],u[w]+=b[M]*y[1],S===0)for(let A=0;A<4;A++)d[((A-M)%l+l)%l]+=b[M]*b[A]}}),h!==void 0){const y=2*Math.PI*Math.min(Math.max(2,h),l/2)/l;let v=0;for(let b=0;b<l;b++)v+=d[b]*Math.cos(y*b);const E=v/(2-2*Math.cos(y))**2,S=[[0,6],[1,-4],[l-1,-4],[2,1],[l-2,1]];for(const[b,M]of S)d[b]+=E*M}const _=uv(l),[g,m]=a(d,_),x=y=>{const[v,E]=a(y,_),S=new Array(l).fill(0);for(let b=0;b<l;b++){const M=g[b]*g[b]+m[b]*m[b],w=(v[b]*g[b]+E[b]*m[b])/M,A=(E[b]*g[b]-v[b]*m[b])/M;for(let T=0;T<l;T++)S[T]+=(w*_.cos[b*l+T]-A*_.sin[b*l+T])/l}return S};return[...x(f),...x(u)]}i.project=s;function a(c,l){const h=c.length,p=new Float64Array(h),f=new Float64Array(h);for(let u=0;u<h;u++)for(let d=0;d<h;d++)p[u]+=c[d]*l.cos[u*h+d],f[u]-=c[d]*l.sin[u*h+d];return[p,f]}function o(c){const l=1-c;return[l*l*l/6,(3*c*c*c-6*c*c+4)/6,(-3*c*c*c+3*c*c+3*c+1)/6,c*c*c/6]}})(ye||(ye={}));const Eu=new Map;function uv(i){const t=Eu.get(i);if(t!==void 0)return t;const e=new Float64Array(i*i),n=new Float64Array(i*i);for(let s=0;s<i;s++)for(let a=0;a<i;a++){const o=2*Math.PI*s*a/i;e[s*i+a]=Math.cos(o),n[s*i+a]=Math.sin(o)}const r={cos:e,sin:n};return Eu.set(i,r),r}const eo=Array.from({length:33},(i,t)=>Math.sqrt(3)*(Math.sqrt(3)-2)**t),{cross:Us,dot:kn,norm:no,scale:io}=Jt;var bu;(i=>{function t(o){return o.type==="fold"||o.type==="curvature"}i.traced=t;function e(o,c,l,h){if(c.type==="station")return"a station width is the part's only, never the host's";if(o.type==="station"&&!l)return"a station width needs the phase parameter";const p=n(c,"host",h);if(typeof p=="string")return p;if(o.type==="station")return{part:{station:o.value*Mr.SCALE},host:p};const f=n(o,"part",h);return typeof f=="string"?f:{part:f,host:p}}i.create=e;function n(o,c,l){const h=Mr.SCALE;switch(o.type){case"chord":return o.value>0?()=>o.value*h:`the ${c} chord ${o.value} m is not positive`;case"chords":return!(o.values.length>=4)||!o.values.every(p=>p>0)?`the ${c} chord table needs at least four positive values`:a(o.values.map(p=>p*h),0);case"fold":{if(!(o.radius>0&&o.cap>0))return`the ${c} fold radius ${o.radius} m and cap ${o.cap} m must be positive`;if(l===null)return"the fold width has no traced curve";const p=l.curve.points.map(f=>{const u=r(l,f);return Math.min(o.cap,o.radius*Math.tan(u/2))*h});return a(p,l.curve.points[0].t)}case"curvature":{if(!(o.share>0&&o.share<1&&o.cap>0))return`the ${c} curvature share ${o.share} must lie inside (0, 1) and its cap ${o.cap} m be positive`;if(o.end!==null&&!(o.end>0&&o.end<1))return`the ${c} curvature end share ${o.end} must lie inside (0, 1)`;if(l===null)return"the curvature width has no traced curve";const p=l.curve.points.map(f=>{const u=s(c==="part"?l.part.jet(f.s,f.phi):l.host.faces[f.face].jet(f.y,f.theta),f.tangent),d=c==="part"?l.part:l.host.faces[f.face],_=c==="part"?f.s:f.y,g=d.domain===void 0||o.end===null?1/0:o.end*Math.min(_-d.domain[0],d.domain[1]-_),m=Math.min(o.cap*h,Math.max(0,g));return u>0?Math.min(m,o.share/u):m});return a(p,l.curve.points[0].t)}}}function r(o,c){const l=o.host.faces[c.face],h=l.jet(c.y,c.theta),p=o.part.jet(c.s,c.phi),f=io(Us(h.u,h.v),l.orientation),u=io(Us(p.u,p.v),o.part.orientation*(o.diff?-1:1)),d=kn(f,u)/(no(f)*no(u));return Math.acos(Math.max(-1,Math.min(1,d)))}function s(o,c){const l=Us(o.u,o.v),h=no(l);if(!(h>0))return 0;const p=io(l,1/h),f=Us(p,c),u=kn(o.u,o.u),d=kn(o.u,o.v),_=kn(o.v,o.v),g=kn(f,o.u),m=kn(f,o.v),x=u*_-d*d;if(!(x>0))return 0;const y=(_*g-d*m)/x,v=(u*m-d*g)/x,E=y*y*u+2*y*v*d+v*v*_;if(!(E>0))return 0;const S=y*y*kn(o.uu,p)+2*y*v*kn(o.uv,p)+v*v*kn(o.vv,p);return Math.abs(S/E)}function a(o,c){const l=o.length,h=ye.interpolate(o.map(p=>[p,0]));return p=>ye.evaluate(h,l,p-c)[0]}})(bu||(bu={}));var na;(i=>{function t(r){return 2*r+1}i.width=t;function e(r,s,a){const o=t(s);let c=r[0],l=r[o],h=0,p=0;for(let f=1;f<=s;f++){const u=Math.cos(f*a),d=Math.sin(f*a),_=r[2*f-1],g=r[2*f],m=r[o+2*f-1],x=r[o+2*f];c+=_*u+g*d,l+=m*u+x*d,h+=f*(g*u-_*d),p+=f*(x*u-m*d)}return[c,l,h,p]}i.evaluate=e;function n(r,s){const a=r.length;if(a<=2*s)throw new Error("Harmonic projection needs more samples than terms");const o=t(s),c=new Array(2*o).fill(0);return r.forEach((l,h)=>{const p=2*Math.PI*h/a;c[0]+=l[0]/a,c[o]+=l[1]/a;for(let f=1;f<=s;f++){const u=2/a*Math.cos(f*p),d=2/a*Math.sin(f*p);c[2*f-1]+=l[0]*u,c[2*f]+=l[0]*d,c[o+2*f-1]+=l[1]*u,c[o+2*f]+=l[1]*d}}),c}i.project=n})(na||(na={}));var sc;(i=>{function t(e,n,r,s,a){let o=n,c=r,l=e(o),h=e(c);if(l===0)return o;if(h===0)return c;if(!(l*h<0))return null;let p=0,f=o;for(let u=0;u<a;u++){f=(o*h-c*l)/(h-l);const d=e(f);if(Math.abs(d)<=s)return f;d*h<0?(o=c,l=h,c=f,h=d,p=0):(c=f,h=d,p===-1&&(l/=2),p=-1)}return f}i.root=t})(sc||(sc={}));var ts;(i=>{function t(s,a,o){if(s.shift!==void 0){const b=e(s,a,o);return[b[0],b[1],b[2]]}const[c,l]=s.stations,h=r(s),p=ro(o-s.phases[0]);if(a<=c||a>=l||p>=h)return[0,0,0];const f=(a-c)/(l-c)*(s.rows-3),u=p/h*(s.columns-3),[d,_,g]=ac(f,s.rows),[m,x,y]=ac(u,s.columns);let v=0,E=0,S=0;for(let b=0;b<4;b++)for(let M=0;M<4;M++){const w=s.heights[(d+b)*s.columns+m+M];v+=_[b]*x[M]*w,E+=g[b]*x[M]*w,S+=_[b]*y[M]*w}return[v,E*(s.rows-3)/(l-c),S*(s.columns-3)/h]}i.height=t;function e(s,a,o){const c=s.shift===void 0?[0,0,0,0,0,0]:n(s,s.shift,a,o),l=n(s,s.heights,a+c[0],o),h=1+c[1];return[l[0],l[1]*h,l[1]*c[2]+l[2],l[3]*h*h+l[1]*c[3],l[3]*h*c[2]+l[4]*h+l[1]*c[4],l[3]*c[2]*c[2]+2*l[4]*c[2]+l[5]+l[1]*c[5]]}i.jet=e;function n(s,a,o,c){const[l,h]=s.stations,p=r(s),f=ro(c-s.phases[0]);if(o<=l||o>=h||f>=p)return[0,0,0,0,0,0];const u=(s.rows-3)/(h-l),d=(s.columns-3)/p,[_,g,m,x]=wu((o-l)/(h-l)*(s.rows-3),s.rows),[y,v,E,S]=wu(f/p*(s.columns-3),s.columns),b=[0,0,0,0,0,0];for(let M=0;M<4;M++)for(let w=0;w<4;w++){const A=a[(_+M)*s.columns+y+w];b[0]+=g[M]*v[w]*A,b[1]+=m[M]*v[w]*A*u,b[2]+=g[M]*E[w]*A*d,b[3]+=x[M]*v[w]*A*u*u,b[4]+=m[M]*E[w]*A*u*d,b[5]+=g[M]*S[w]*A*d*d}return b}function r(s){const a=ro(s.phases[1]-s.phases[0]);return a===0?2*Math.PI:a}i.width=r})(ts||(ts={}));function ro(i){const t=i%(2*Math.PI);return t<0?t+2*Math.PI:t}function wu(i,t){const[e,n,r]=ac(i,t),s=i-e;return[e,n,r,[1-s,3*s-2,1-3*s,s]]}function ac(i,t){const e=Math.min(t-4,Math.max(0,Math.floor(i))),n=i-e;return[e,[(1-n)**3/6,(3*n**3-6*n**2+4)/6,(-3*n**3+3*n**2+3*n+1)/6,n**3/6],[-((1-n)**2)/2,(3*n**2-4*n)/2,(-3*n**2+2*n+1)/2,n**2/2]]}var Se;(i=>{function t(a,o,c,l){const h=1/o**c;if(!l){const f=c===0?[2*a**3-3*a**2+1,a**3-2*a**2+a,-2*a**3+3*a**2,a**3-a**2]:c===1?[6*a**2-6*a,3*a**2-4*a+1,-6*a**2+6*a,3*a**2-2*a]:[12*a-6,6*a-4,-12*a+6,6*a-2];return[f[0]*h,f[1]*o*h,0,0,f[3]*o*h,f[2]*h]}const p=c===0?[1-10*a**3+15*a**4-6*a**5,a-6*a**3+8*a**4-3*a**5,.5*a**2-1.5*a**3+1.5*a**4-.5*a**5,.5*a**3-a**4+.5*a**5,-4*a**3+7*a**4-3*a**5,10*a**3-15*a**4+6*a**5]:c===1?[-30*a**2+60*a**3-30*a**4,1-18*a**2+32*a**3-15*a**4,a-4.5*a**2+6*a**3-2.5*a**4,1.5*a**2-4*a**3+2.5*a**4,-12*a**2+28*a**3-15*a**4,30*a**2-60*a**3+30*a**4]:[-60*a+180*a**2-120*a**3,-36*a+96*a**2-60*a**3,1-9*a+18*a**2-10*a**3,3*a-12*a**2+10*a**3,-24*a+84*a**2-60*a**3,60*a-180*a**2+120*a**3];return[p[0]*h,p[1]*o*h,p[2]*o*o*h,p[3]*o*o*h,p[4]*o*h,p[5]*h]}i.weights=t;function e(a,o,c){return a.value.map((l,h)=>c[0]*l+c[1]*a.slope[h]+(a.curvature===void 0?0:c[2]*a.curvature[h])+(o.curvature===void 0?0:c[3]*o.curvature[h])+c[4]*o.slope[h]+c[5]*o.value[h])}i.combine=e;function n(a){return a.frame!==void 0&&a.frameSlopes!==void 0}i.framed=n;function r(a){const o=c=>[...c.origin,...c.u,...c.v];return{value:o(a.frame),slope:o(a.frameSlopes),...a.frameCurvatures===void 0?{}:{curvature:o(a.frameCurvatures)}}}i.frameEnd=r;function s(a){return{origin:[a[0],a[1],a[2]],u:[a[3],a[4],a[5]],v:[a[6],a[7],a[8]]}}i.unflat=s})(Se||(Se={}));var es;(i=>{function t(v,E){return o(v,E,!1)}i.coefficients=t;function e(v,E){return o(v,E,!0)}i.derivative=e;function n(v,E){const S=v.layers,b=S[0].y,M=S[S.length-1].y;if(E<b-1e-9||E>M+1e-9)throw new Error(`Station ${E} is outside chain ${v.name}`);let w=0,A=S.length-1;for(;A-w>1;){const T=w+A>>1;S[T].y<=E?w=T:A=T}return[w,A]}i.bracket=n;function r(v,E){return v.layers.some(S=>S.lift!==void 0)?o(v,E,!1,a):null}i.lift=r;function s(v){return[v.coefficients,v.slopes]}function a(v){if(v.lift!==void 0)return[v.lift,v.liftSlopes];const E=new Array(v.coefficients.length/2).fill(0);return[E,E]}function o(v,E,S,b=s){const M=v.layers,[w,A]=n(v,E),[T,L]=b(M[w]),[N,P]=b(M[A]),C=M[w],U=M[A],F=U.y-C.y,z=Math.min(1,Math.max(0,(E-C.y)/F)),D=b===s?C.curvatures:C.liftCurvatures,O=b===s?U.curvatures:U.liftCurvatures;if(D!==void 0&&O!==void 0)return Se.combine({value:T,slope:L,curvature:D},{value:N,slope:P,curvature:O},Se.weights(z,F,S?1:0,!0));const k=S?(6*z**2-6*z)/F:2*z**3-3*z**2+1,J=S?(3*z**2-4*z+1)/F:z**3-2*z**2+z,$=S?(-6*z**2+6*z)/F:-2*z**3+3*z**2,rt=S?(3*z**2-2*z)/F:z**3-z**2;return T.map((at,lt)=>k*at+J*F*L[lt]+$*N[lt]+rt*F*P[lt])}function c(v,E){var F,z;const S=v.layers,[b,M]=n(v,E),w=S[b],A=S[M];if(Se.framed(w)&&Se.framed(A)){const D=Se.frameEnd(w),O=Se.frameEnd(A),k=D.curvature!==void 0&&O.curvature!==void 0,J=Se.weights(Math.min(1,Math.max(0,(E-w.y)/(A.y-w.y))),A.y-w.y,0,k);return Se.unflat(Se.combine(D,O,J))}if(w.frame===void 0&&A.frame===void 0&&((F=S[b-1])==null?void 0:F.frame)===void 0&&((z=S[M+1])==null?void 0:z.frame)===void 0)return Ve.horizontal(E);const T=D=>S[D].frame??Ve.horizontal(S[D].y),L=A.y-w.y,N=D=>{const O=Math.max(0,D-1),k=Math.min(S.length-1,D+1),J=T(O).origin,$=T(k).origin,rt=S[k].y-S[O].y;return[0,1,2].map(at=>($[at]-J[at])/rt*L)},P=D=>Ve.rate(T(D),T(D+1),S[D+1].y-S[D].y),C=D=>S[D+1].y-S[D].y,U=D=>{const O=S.length-1;let k;if(O===1)k=P(0);else if(D===0||D===O){const[J,$]=D===0?[0,1]:[O-1,O-2],rt=P(J),at=P($),lt=C(J)/(C(J)+C($));k=[0,1,2].map(W=>rt[W]+(rt[W]-at[W])*lt)}else{const J=P(D-1),$=P(D),rt=C(D-1),at=C(D);k=[0,1,2].map(lt=>(at*J[lt]+rt*$[lt])/(rt+at))}return[k[0]*L,k[1]*L,k[2]*L]};return Ve.interpolate(T(b),T(M),N(b),N(M),Math.min(1,Math.max(0,(E-w.y)/L)),U(b),U(M))}i.frame=c;function l(v,E){const[S,b]=p(v,t(v,E)),M=c(v,E),w=Ve.place(M,S,b),A=r(v,E);if(A===null)return w;const T=A.reduce((N,P)=>N+P,0)/A.length,L=y(M);return[w[0]+T*L[0],w[1]+T*L[1],w[2]+T*L[2]]}i.axis=l;function h(v,E,S){return v.basis==="spline"?ye.evaluate(E,v.order,S):na.evaluate(E,v.order,S)}i.section=h;function p(v,E){if(v.basis!=="spline")return[E[0],E[na.width(v.order)]];const S=v.order;let b=0,M=0;for(let w=0;w<S;w++)b+=E[w],M+=E[S+w];return[b/S,M/S]}i.center=p;function f(v,E,S){const b=c(v,E);return S.map(M=>Ve.local(b,M))}i.local=f;function u(v,E,S){const b=d(v,E);return S.map(M=>b(M))}i.ring=u;function d(v,E){const S=t(v,E),b=c(v,E),M=r(v,E),w=M===null?null:[...M,...M],A=y(b);return T=>{const L=h(v,S,T),N=Ve.place(b,L[0],L[1]);if(w!==null){const P=ye.evaluate(w,v.order,T)[0];for(let C=0;C<3;C++)N[C]+=P*A[C]}for(const P of v.reliefs??[]){const C=ts.height(P,E,T)[0];if(C!==0)for(let U=0;U<3;U++)N[U]+=C*P.axis[U]}return N}}i.sampler=d;function _(v,E,S){let b=x.get(v);b===void 0&&x.set(v,b=[]);for(const w of b)if(w.s===E)return w.at(S);const M=v.basis==="spline"?g(v,E):d(v,E);return b.unshift({s:E,at:M}),b.length>m&&b.pop(),M(S)}i.point=_;function g(v,E){const S=v.layers,[b,M]=n(v,E),w=S[b],A=S[M],T=A.y-w.y,L=Math.min(1,Math.max(0,(E-w.y)/T)),N=c(v,E),P=y(N),C=v.order,U=($,rt,at,lt,W,j)=>{if(at!==void 0&&j!==void 0){const te=Se.weights(L,T,0,!0);return Nt=>te[0]*$(Nt)+te[1]*rt(Nt)+te[2]*at[Nt]+te[3]*j[Nt]+te[4]*W(Nt)+te[5]*lt(Nt)}const ot=2*L**3-3*L**2+1,Dt=L**3-2*L**2+L,St=-2*L**3+3*L**2,Bt=L**3-L**2;return te=>ot*$(te)+Dt*T*rt(te)+St*lt(te)+Bt*T*W(te)},F=U($=>w.coefficients[$],$=>w.slopes[$],w.curvatures,$=>A.coefficients[$],$=>A.slopes[$],A.curvatures),z=S.some($=>$.lift!==void 0)?U($=>w.lift!==void 0?w.lift[$]:0,$=>w.lift!==void 0?w.liftSlopes[$]:0,w.liftCurvatures,$=>A.lift!==void 0?A.lift[$]:0,$=>A.lift!==void 0?A.liftSlopes[$]:0,A.liftCurvatures):null,D=new Array(2*C),O=z===null?null:new Array(2*C),k=new Uint8Array(C),J=$=>{if(k[$]!==1){if(D[$]=F($),D[C+$]=F(C+$),O!==null){const rt=z($);O[$]=rt,O[C+$]=rt}k[$]=1}};return $=>{const rt=Math.min(C-1,Math.floor(($/(2*Math.PI)%1+1)%1*C));if(Number.isInteger(rt))for(let W=-1;W<=2;W++)J((rt+W+C)%C);const at=ye.evaluate(D,C,$),lt=Ve.place(N,at[0],at[1]);if(O!==null){const W=ye.evaluate(O,C,$)[0];for(let j=0;j<3;j++)lt[j]+=W*P[j]}for(const W of v.reliefs??[]){const j=ts.height(W,E,$)[0];if(j!==0)for(let ot=0;ot<3;ot++)lt[ot]+=j*W.axis[ot]}return lt}}const m=8,x=new WeakMap;function y(v){return[v.v[1]*v.u[2]-v.v[2]*v.u[1],v.v[2]*v.u[0]-v.v[0]*v.u[2],v.v[0]*v.u[1]-v.v[1]*v.u[0]]}})(es||(es={}));var Vn;(i=>{function t(s,a,o){if(!(o>0))throw new Error(`${s}: a station list needs a positive least step, not ${o}`);if(a.length<2)throw new Error(`${s}: a station list needs two stations, not ${a.length}`);for(let c=0;c<a.length;c++){const l=a[c];if(!Number.isFinite(l))throw new Error(`${s}: layer ${c} stands at ${l}, not a finite station in millimetres`);if(c>0&&!(l-a[c-1]>=o))throw new Error(`${s}: layer ${c} stands ${l-a[c-1]} mm over layer ${c-1}; stations must rise by at least ${o} mm`)}return a}i.stations=t;function e(s,a,o){for(let c=0;c<a.length;c++)if(!(Math.abs(a[c])<=o))throw new Error(`${s}: entry ${c} is ${a[c]}, outside the finite bound ${o}`);return a}i.jet=e;function n(s,a,o){let c=0;for(let l=0;l<o.length;l++){const h=o[l];if(!(Number.isFinite(h[0])&&Number.isFinite(h[1])&&Number.isFinite(h[2])))throw new Error(`${s}: layer ${a} point ${l} is [${h.join(", ")}], not finite`);const p=o[(l+1)%o.length];c+=h[0]*p[2]-p[0]*h[2]}if(!(Math.abs(c)>0))throw new Error(`${s}: layer ${a}'s ring of ${o.length} points encloses no area`);return o}i.ring=n,i.LEAST_LAYER_GAP=.05,i.SPLINE_GAP_SHARE=1e-6;function r(s){return i.SPLINE_GAP_SHARE*Math.abs(s[s.length-1]-s[0])}i.splineGap=r,i.FINITE=Number.MAX_VALUE})(Vn||(Vn={}));var ur;(i=>{function t(o){return o.layers.every(c=>c.curvatures!==void 0&&c.frame!==void 0&&c.frameSlopes!==void 0&&c.frameCurvatures!==void 0)}i.carries=t;function e(o,c,l){const{a:h,b:p,u:f,H:u,c:d,f:_}=s(o,c),g=o.order,m=ye.jet(d[0],g,l),x=ye.jet(d[1],g,l),y=ye.jet(d[2],g,l),[v,E,S]=_,b=[[v[0],v[1],v[2]],[E[0],E[1],E[2]],[S[0],S[1],S[2]]],M=[[v[3],v[4],v[5]],[E[3],E[4],E[5]],[S[3],S[4],S[5]]],w=[[v[6],v[7],v[8]],[E[6],E[7],E[8]],[S[6],S[7],S[8]]],A=[0,0,0],T=[0,0,0],L=[0,0,0],N=[0,0,0],P=[0,0,0],C=[0,0,0];for(let F=0;F<3;F++){const z=M[0][F],D=M[1][F],O=M[2][F],k=w[0][F],J=w[1][F],$=w[2][F];A[F]=b[0][F]+z*m[0]+k*m[1],T[F]=b[1][F]+z*x[0]+D*m[0]+k*x[1]+J*m[1],L[F]=z*m[2]+k*m[3],N[F]=b[2][F]+z*y[0]+2*D*x[0]+O*m[0]+k*y[1]+2*J*x[1]+$*m[1],P[F]=z*x[2]+D*m[2]+k*x[3]+J*m[3],C[F]=z*m[4]+k*m[5]}const U={p:A,s:T,t:L,ss:N,st:P,tt:C};(h.lift!==void 0||p.lift!==void 0)&&fv(U,h,p,f,u,g,l,M,w);for(const F of o.reliefs??[]){const z=ts.jet(F,c,l);if(z.every(O=>O===0))continue;const D=F.axis;U.p=We(U.p,Ce(D,z[0])),U.s=We(U.s,Ce(D,z[1])),U.t=We(U.t,Ce(D,z[2])),U.ss=We(U.ss,Ce(D,z[3])),U.st=We(U.st,Ce(D,z[4])),U.tt=We(U.tt,Ce(D,z[5]))}return U}i.at=e;const n=8,r=new WeakMap;function s(o,c){let l=r.get(o);l===void 0&&r.set(o,l=[]);for(const M of l)if(M.s===c)return M.station;const[h,p]=es.bracket(o,c),f=o.layers[h],u=o.layers[p],d=u.y-f.y,_=Math.min(1,Math.max(0,(c-f.y)/d)),g=[0,1,2].map(M=>Se.weights(_,d,M,!0)),m={value:f.coefficients,slope:f.slopes,curvature:f.curvatures},x={value:u.coefficients,slope:u.slopes,curvature:u.curvatures},y=g.map(M=>Se.combine(m,x,M)),v=Se.frameEnd(f),E=Se.frameEnd(u),S=g.map(M=>Se.combine(v,E,M)),b={a:f,b:u,u:_,H:d,c:y,f:S};return l.unshift({s:c,station:b}),l.length>n&&l.pop(),b}function a(o){const c=Ei(o.t,o.s),l=Math.hypot(c[0],c[1],c[2]);return l>1e-12?[c[0]/l,c[1]/l,c[2]/l]:null}i.normal=a})(ur||(ur={}));function fv(i,t,e,n,r,s,a,o,c){const l=new Array(s).fill(0),h=t.liftCurvatures!==void 0&&e.liftCurvatures!==void 0,p={value:t.lift??l,slope:t.liftSlopes??l,...h?{curvature:t.liftCurvatures}:{}},f={value:e.lift??l,slope:e.liftSlopes??l,...h?{curvature:e.liftCurvatures}:{}},d=[0,1,2].map(x=>Se.combine(p,f,Se.weights(n,r,x,h))).map(x=>ye.jet([...x,...x],s,a)),_=Ei(c[0],o[0]),g=We(Ei(c[1],o[0]),Ei(c[0],o[1])),m=We(Ei(c[2],o[0]),Ce(Ei(c[1],o[1]),2),Ei(c[0],o[2]));i.p=We(i.p,Ce(_,d[0][0])),i.s=We(i.s,Ce(_,d[1][0]),Ce(g,d[0][0])),i.t=We(i.t,Ce(_,d[0][2])),i.ss=We(i.ss,Ce(_,d[2][0]),Ce(g,2*d[1][0]),Ce(m,d[0][0])),i.st=We(i.st,Ce(_,d[1][2]),Ce(g,d[0][2])),i.tt=We(i.tt,Ce(_,d[0][4]))}function We(...i){const t=[0,0,0];for(const e of i)for(let n=0;n<3;n++)t[n]+=e[n];return t}function Ce(i,t){return[i[0]*t,i[1]*t,i[2]*t]}function Ei(i,t){return[i[1]*t[2]-i[2]*t[1],i[2]*t[0]-i[0]*t[2],i[0]*t[1]-i[1]*t[0]]}var Tu;(i=>{function t(s,a){const o=e(a);return s==="polar"?n(a,o):r(a,o,s==="sagittal")}i.phases=t;function e(s){const a=s.length;let o=0,c=0,l=0;for(let h=0;h<a;h++){const p=s[h],f=s[(h+1)%a],u=p[0]*f[1]-f[0]*p[1];o+=u,c+=(p[0]+f[0])*u,l+=(p[1]+f[1])*u}if(Math.abs(o)<1e-9){const h=[0,0];for(const p of s)h[0]+=p[0]/a,h[1]+=p[1]/a;return h}return[c/(3*o),l/(3*o)]}i.centroid=e;function n(s,a){const o=[];let c=NaN;for(const l of s){let h=Math.atan2(l[1]-a[1],l[0]-a[0]);if(Number.isNaN(c))h<0&&(h+=2*Math.PI);else{for(;h<c-Math.PI;)h+=2*Math.PI;for(;h>c+Math.PI;)h-=2*Math.PI}o.push(h),c=h}return o}function r(s,a,o){const c=s.length,l=[];for(let y=0;y<c;y++){const v=s[y],E=s[(y+1)%c],S=v[1]-a[1],b=E[1]-a[1];if(S===0)l.push({at:y,x:v[0]});else if(S*b<0){const M=S/(S-b);l.push({at:y+M,x:v[0]+M*(E[0]-v[0])})}}if(l.length<2)throw new Error("Sagittal phase needs a section crossing its axis plane");const h=l.reduce((y,v)=>v.x>y.x?v:y).at,p=l.reduce((y,v)=>v.x<y.x?v:y).at,f=[0];for(let y=0;y<c;y++){const v=s[y],E=s[(y+1)%c];f.push(f[y]+Math.hypot(E[0]-v[0],E[1]-v[1]))}const u=f[c],d=y=>{const v=Math.floor(y);return y===v?f[v]:f[v]+(y-v)*(f[v+1]-f[v])},_=(y,v)=>{const E=d(v)-d(y);return E>=0?E:E+u},g=o?_(h,p):u/2,m=u-g,x=[];for(let y=0;y<c;y++){const v=_(h,y);x.push(v<=g?Math.PI*v/Math.max(g,1e-12):Math.PI+Math.PI*(v-g)/Math.max(m,1e-12))}return x}})(Tu||(Tu={}));var Au;(i=>{i.PROBES=48;function t(e,n,r,s,a=8){const o=Array.from({length:i.PROBES},(u,d)=>2*Math.PI*d/i.PROBES),c=[n,...e.layers.map(u=>u.y).filter(u=>u>n&&u<r),r],l=[n],h=u=>es.ring(e,u,o),p=(u,d,_,g,m)=>{if(_<a){const x=(u+d)/2,y=h(x);let v=0;if(y.forEach((E,S)=>{v=Math.max(v,Math.hypot(E[0]-(g[S][0]+m[S][0])/2,E[1]-(g[S][1]+m[S][1])/2,E[2]-(g[S][2]+m[S][2])/2))}),v>s){p(u,x,_+1,g,y),p(x,d,_+1,y,m);return}}l.push(d)};let f=h(c[0]);for(let u=1;u<c.length;u++){const d=h(c[u]);p(c[u-1],c[u],0,f,d),f=d}return l}i.bisect=t})(Au||(Au={}));var oc;(i=>{function t(s,a,o){if(s.length<2||a.length!==s.length)throw new Error("A polar section needs two guides and one fullness per sector");const c=s.length,l=s[0].angle,h=hv(o-l)+l;let p=0,f=c;for(;f-p>1;){const m=p+f>>1;s[m].angle<=h?p=m:f=m}const u=p,d=s[u],_=s[(u+1)%c],g=u+1<c?_.angle-d.angle:_.angle+cc-d.angle;if(!(g>0))throw new Error("Polar guides must increase within one turn");return r(d,_,g,a[u],(h-d.angle)/g)}i.radius=t;function e(s,a,o,c){return c-r(s,a,o,0,.5)[0]}i.fullnessAt=e;function n(s,a){const[o,c,l]=s,h=Math.cos(a),p=Math.sin(a);return[[o*h,o*p],[c*h-o*p,c*p+o*h],[(l-o)*h-2*c*p,(l-o)*p+2*c*h]]}i.point=n;function r(s,a,o,c,l){const h=o,p=l,f=p*p,u=1+f*p*(-10+p*(15-6*p)),d=f*(-30+p*(60-30*p)),_=p*(-60+p*(180-120*p)),g=p+f*p*(-6+p*(8-3*p)),m=1+f*(-18+p*(32-15*p)),x=p*(-36+p*(96-60*p)),y=f*(.5+p*(-1.5+p*(1.5-.5*p))),v=p*(1+p*(-4.5+p*(6-2.5*p))),E=1+p*(-9+p*(18-10*p)),S=1-u,b=-d,M=-_,w=f*p*(-4+p*(7-3*p)),A=f*(-12+p*(28-15*p)),T=p*(-24+p*(84-60*p)),L=f*p*(.5+p*(-1+.5*p)),N=f*(1.5+p*(-4+2.5*p)),P=p*(3+p*(-12+10*p)),C=1-p,U=64*f*p*C*C*C,F=192*f*C*C*(1-2*p),z=384*p*C*(1-5*p+5*f),D=s.value,O=h*s.slope,k=h*h*s.curvature,J=a.value,$=h*a.slope,rt=h*h*a.curvature;return[u*D+g*O+y*k+S*J+w*$+L*rt+c*U,(d*D+m*O+v*k+b*J+A*$+N*rt+c*F)/h,(_*D+x*O+E*k+M*J+T*$+P*rt+c*z)/(h*h)]}})(oc||(oc={}));const cc=2*Math.PI;function hv(i){const t=i%cc;return t<0?t+cc:t}var ia;(i=>{function t(o,c){const l=o.length,h=c[0].length,p=o.map(()=>new Array(h).fill(0));if(l<3)return p;const f=o.slice(1).map((g,m)=>g-o[m]),u=l-2,d=new Array(u),_=new Array(u);for(let g=0;g<h;g++){for(let m=0;m<u;m++){const x=m+1,y=6*((c[x+1][g]-c[x][g])/f[x]-(c[x][g]-c[x-1][g])/f[x-1]),v=2*(f[x-1]+f[x]),E=f[x-1],S=f[x],b=m===0?v:v-E*d[m-1];d[m]=S/b,_[m]=(m===0?y:y-E*_[m-1])/b}p[u][g]=_[u-1];for(let m=u-2;m>=0;m--)p[m+1][g]=_[m]-d[m]*p[m+2][g]}return p}i.curvatures=t;function e(o,c,l=t(o,c)){const h=o.length;return o.map((p,f)=>{const u=Math.min(f,h-2),d=o[u+1]-o[u];return c[f].map((_,g)=>{const m=(c[u+1][g]-c[u][g])/d;return f===u?m-d*(2*l[u][g]+l[u+1][g])/6:m+d*(l[u][g]+2*l[u+1][g])/6})})}i.slopes=e;function n(o,c){if(o.curvatures===void 0||o.frameSlopes===void 0)throw new Error("A shared layer's owner carries no jets");return{coefficients:[...o.coefficients],plane:s(o.frame??dv(o.y)),slopes:o.slopes.map(l=>l*c),curvatures:o.curvatures.map(l=>l*c*c),frameSlopes:s(o.frameSlopes).map(l=>l*c),frameCurvatures:s(o.frameCurvatures).map(l=>l*c*c)}}i.copy=n;function r(o,c=[]){const l=o.layers,h=Vn.stations(o.name,l.map(S=>S.y),Vn.splineGap(l.map(S=>S.y))),p=new Set(c),f=l.map(S=>[...S.coefficients]),u=t(h,f),d=e(h,f,u),_=l.some(S=>S.lift!==void 0),g=l.map(S=>S.lift!==void 0?[...S.lift]:new Array(S.coefficients.length/2).fill(0)),m=_?e(h,g):[],x=l.every(S=>S.frame!==void 0),y=x?l.map(S=>s(S.frame)):[],v=x?t(h,y):[],E=x?e(h,y,v):[];return{...o,layers:l.map((S,b)=>{if(p.has(b)){if(S.curvatures===void 0)throw new Error(`Kept layer ${b} of ${o.name} carries no curvatures`);return S}return Vn.jet(`${o.name} layer ${b} slopes`,d[b],Vn.FINITE),Vn.jet(`${o.name} layer ${b} curvatures`,u[b],Vn.FINITE),{...S,slopes:d[b],curvatures:u[b],..._?{lift:g[b],liftSlopes:m[b]}:{},...x?{frameSlopes:a(E[b]),frameCurvatures:a(v[b])}:{}}})}}i.continuous=r;function s(o){return[...o.origin,...o.u,...o.v]}i.flat=s;function a(o){return{origin:[o[0],o[1],o[2]],u:[o[3],o[4],o[5]],v:[o[6],o[7],o[8]]}}i.unflat=a})(ia||(ia={}));function dv(i){return{origin:[0,i,0],u:[1,0,0],v:[0,0,1]}}const{combine:pv}=Jt;var Xr;(i=>{function t(n,r,s){const a=e(s),o=c=>pv([[a[c][0],n.point],[a[c][1],n.first],[a[c][2],n.second],[a[c][3],r.second],[a[c][4],r.first],[a[c][5],r.point]]);return{point:o(0),first:o(1),second:o(2)}}i.jet=t;function e(n){const r=n*n,s=r*n,a=s*n,o=a*n;return[[1-10*s+15*a-6*o,n-6*s+8*a-3*o,.5*r-1.5*s+1.5*a-.5*o,.5*s-a+.5*o,-4*s+7*a-3*o,10*s-15*a+6*o],[-30*r+60*s-30*a,1-18*r+32*s-15*a,n-4.5*r+6*s-2.5*a,1.5*r-4*s+2.5*a,-12*r+28*s-15*a,30*r-60*s+30*a],[-60*n+180*r-120*s,-36*n+96*r-60*s,1-9*n+18*r-10*s,3*n-12*r+10*s,-24*n+84*r-60*s,60*n-180*r+120*s]]}i.basis=e})(Xr||(Xr={}));var lc;(i=>{function t(e,n,r){const s=n.curve.points[0].t,a=[];for(let d=0;d<r;d++){const _=n.column(s+2*Math.PI*d/r);if(_===null)return null;const g=m=>m.every(x=>Number.isFinite(x));if(!(g(_.start.point)&&g(_.start.first)&&g(_.start.second)&&g(_.end.point)&&g(_.end.first)&&g(_.end.second)))return null;a.push(_)}let o=0;for(const d of a)o+=Math.hypot(...[0,1,2].map(_=>d.end.point[_]-d.start.point[_]));const c=o/r;if(!(c>0))return null;const l=(d,_)=>{const g=a.map(_),m=(y,v)=>ye.interpolate(g.map(E=>[E[y][0]*v,E[y][2]*v])),x=(y,v)=>ye.interpolate(g.map(E=>[E[y][1]*v,0])).slice(0,r);return{y:d,frame:mv,frameSlopes:Ru,frameCurvatures:Ru,coefficients:m(0,1),slopes:m(1,1/c),curvatures:m(2,1/(c*c)),lift:x(0,1),liftSlopes:x(1,1/c),liftCurvatures:x(2,1/(c*c))}},h={name:e,basis:"spline",order:r,rule:"polar",samples:r,layers:[l(0,d=>[d.start.point,d.start.first,d.start.second]),l(c,d=>[d.end.point,d.end.first,d.end.second])]},p=a[0],f=a.map(d=>[d.rail.s,d.rail.phi]),u=()=>{const d=p.rail.partAcross,_=Math.hypot(d[0],d[1]);if(!(_>0))return!1;const m=.001*Math.max(...f.map(x=>Math.hypot(x[0]-p.rail.s,x[1]-p.rail.phi)))/_;return!Ge.kept({kind:"hole",chart:f},p.rail.s+m*d[0],p.rail.phi+m*d[1],2*Math.PI)};return{chain:h,length:c,seed:s,host:{kind:n.curve.winding===0?"hole":p.rail.across[0]>0?"start":"end",chart:a.map(d=>[d.rail.host[0],d.rail.host[1]]),faces:a.map(d=>d.rail.hostFace)},across:a.map(d=>[d.rail.across[0],d.rail.across[1]]),partAcross:a.map(d=>[d.rail.partAcross[0],d.rail.partAcross[1]]),curve:a.map(d=>[d.rail.curve.point[0],d.rail.curve.point[1],d.rail.curve.point[2]]),widths:{host:a.map((d,_)=>n.widths(s+2*Math.PI*_/r).host),part:a.map((d,_)=>n.widths(s+2*Math.PI*_/r).part)},parameter:n.curve.parameter.kind,sigma:p.rail.sigma>0?1:-1,part:{kind:n.curve.partWinding===0?u()?"island":"hole":p.rail.sigma>0?"start":"end",chart:f}}}i.of=t})(lc||(lc={}));const mv={origin:[0,0,0],u:[1,0,0],v:[0,0,1]},Ru={origin:[0,0,0],u:[0,0,0],v:[0,0,0]};var ra;(i=>{function t(n){return ur.carries(n)?n:n.layers.every(s=>s.frame===void 0&&s.curvatures!==void 0)?{...n,layers:n.layers.map(s=>({...s,frame:Ve.horizontal(s.y),frameSlopes:{origin:[0,1,0],u:[0,0,0],v:[0,0,0]},frameCurvatures:{origin:[0,0,0],u:[0,0,0],v:[0,0,0]}}))}:ia.continuous({...n,layers:n.layers.map(s=>({...s,frame:s.frame??Ve.horizontal(s.y)}))})}i.framed=t;function e(n){if(!ur.carries(n))return null;const r=n.layers[0].y,s=n.layers[n.layers.length-1].y,a=(r+s)/2,o=ur.at(n,a,0),c=Jt.sub(o.p,es.axis(n,a)),l=Jt.dot(Jt.cross(o.s,o.t),c);if(!(Math.abs(l)>0))return null;const h=l>0!=(n.mirrored===!0)?1:-1;return{name:n.name,period:2*Math.PI,domain:[r,s],orientation:h,jet:(p,f)=>{const u=Math.min(s,Math.max(r,p)),d=p-u,_=ur.at(n,u,f);if(d===0)return{p:_.p,u:_.s,v:_.t,uu:_.ss,uv:_.st,vv:_.tt};const g=(m,x,y)=>[m[0]+y*x[0],m[1]+y*x[1],m[2]+y*x[2]];return{p:g(g(_.p,_.s,d),_.ss,d*d/2),u:g(_.s,_.ss,d),v:g(_.t,_.st,d),uu:_.ss,uv:_.st,vv:_.tt}}}}i.surface=e})(ra||(ra={}));var sa;(i=>{i.BISECTIONS=40,i.SIDE=.25;function t(r,s,a,o,c){const l=(a.host.faces??a.host.chart.map(()=>0)).map(f=>o[f]),h=(f,u,d,_)=>{const g=r.faces[f].surface,m=Qe.owner(r.mesh,g);return{vertex:Qe.vertex(r.mesh,g.jet(u[0],u[1]).p,m,u[0],u[1]),phase:d,faces:[f],chart:new Map([[f,u]]),..._!==void 0?{across:_}:{}}},p=[];for(let f=0;f<c;f++){p.push(h(l[f],a.host.chart[f],2*Math.PI*f/c,a.across[f]));const u=l[(f+1)%c];if(u===l[f])continue;let d=a.seed+2*Math.PI*f/c,_=a.seed+2*Math.PI*(f+1)/c,g=s.rail(d),m=s.rail(_);for(let y=0;y<i.BISECTIONS&&g!==null&&m!==null;y++){const v=(d+_)/2,E=s.rail(v);if(E===null){if(_-d<=1e-6*2*Math.PI/c)break;return`no rail at t ${v}, between the columns at t ${d} and ${_} where the rail leaves face ${l[f]} for face ${u}`}o[E.hostFace]===l[f]?(d=v,g=E):(_=v,m=E)}if(g===null||m===null)return`no rail at the column ${g===null?`t ${d}`:`t ${_}`} beside the crossing from face ${l[f]} to face ${u}`;if(o[g.hostFace]!==l[f]||o[m.hostFace]!==u)return`the rail's crossing from face ${l[f]} to face ${u} lands on faces ${o[g.hostFace]} and ${o[m.hostFace]} (t ${d} to ${_})`;const x=h(l[f],[g.host[0],g.host[1]],(d+_)/2-a.seed);x.faces.push(o[m.hostFace]),x.chart.set(o[m.hostFace],[m.host[0],m.host[1]]),p.push(x)}return p}i.rail=t;function e(r,s,a,o){const c=s.length,l=(f,u)=>({face:a,from:[0,f.phase],to:[0,u.phase+2*Math.PI*Math.round((f.phase-u.phase)/(2*Math.PI))]}),h=s[0].faces[0];if(s.every(f=>f.faces.length===1&&f.faces[0]===h))return r.faces[h].cycles.push({kind:o,vertices:s.map(f=>f.vertex),chart:s.map(f=>f.chart.get(h)),neighbours:s.map((f,u)=>l(f,s[(u+1)%c]))}),null;const p=s.findIndex(f=>f.faces.length===2);for(let f=0;f<c;){const u=(p+f)%c,d=s[u],_=[d];let g=f+1;for(;g<=c;g++){const v=s[(p+g)%c];if(_.push(v),v.faces.length===2)break}const m=_[_.length-1],x=d.faces.find(v=>m.faces.includes(v)&&_.slice(1,-1).every(E=>E.faces[0]===v));if(x===void 0)return`the rail's run from phase ${d.phase} to ${m.phase} lies on no one face`;const y=n(r,x,_,l);if(y!==null)return y;f=g}return null}i.trim=e;function n(r,s,a,o){const c=r.faces[s],l=c.surface.period,h=a[0],p=a[a.length-1],f=L=>{const N=L.chart.get(s);let P=null;for(const k of c.cycles){const J=k.vertices.indexOf(L.vertex);if(J>=0)return[k,J];const $=Ge.foot(k,N[0],N[1],l);(P===null||$.distance<P.foot.distance)&&(P={cycle:k,foot:$})}if(P===null)return null;const{cycle:C,foot:U}=P,F=L.faces.find(k=>k!==s),z=C.neighbours[U.segment],D=z.face===F?L.chart.get(F):[z.from[0]+U.share*(z.to[0]-z.from[0]),z.from[1]+U.share*(z.to[1]-z.from[1])],O=U.segment+1;return C.vertices.splice(O,0,L.vertex),C.chart.splice(O,0,[N[0],Ge.shift(N[1],C.chart[U.segment][1],l)]),C.neighbours.splice(U.segment,1,{face:z.face,from:z.from,to:D},{face:z.face,from:D,to:z.to}),[C,O]},u=f(h),d=f(p);if(u===null||d===null)return`face ${c.surface.name} has no trim for the rail to cross`;if(u[0]!==d[0])return`the rail enters face ${c.surface.name} through one trim and leaves through another`;const _=u[0],g=_.vertices.indexOf(h.vertex),m=_.vertices.indexOf(p.vertex);if(g<0||m<0)return`the rail's run on face ${c.surface.name} does not meet its trim at both ends (entry at ${g}, exit at ${m})`;const x=a.find(L=>!L.chart.has(s));if(x!==void 0)return`the rail's run on face ${c.surface.name} holds a point at phase ${x.phase} with no chart on that face (faces ${x.faces.join(", ")})`;if(_.chart.length!==_.vertices.length||_.neighbours.length!==_.vertices.length)return`face ${c.surface.name}'s trim holds ${_.vertices.length} vertices, ${_.chart.length} chart points and ${_.neighbours.length} neighbours`;const v=_.vertices.length,E=(L,N)=>{const P=[];for(let C=L;P.push(C),C!==N;C=(C+1)%v);return P},S=a.slice(1,-1),b=(L,N,P,C)=>{const U=L.map(O=>_.vertices[O]),F=L.map(O=>_.chart[O]),z=L.slice(0,-1).map(O=>_.neighbours[O]),D=[P,...N,C];for(let O=0;O+1<D.length;O++)O>0&&(U.push(D[O].vertex),F.push(D[O].chart.get(s))),z.push(o(D[O],D[O+1]));for(let O=1;O<F.length;O++)F[O]=[F[O][0],Ge.shift(F[O][1],F[O-1][1],l)];return{kind:_.kind,vertices:U,chart:F,neighbours:z}},M=b(E(m,g),S,h,p),w=b(E(g,m),[...S].reverse(),p,h),A=S[Math.floor(S.length/2)];let T=M;if(A!==void 0&&A.across!==void 0){const L=D=>r.mesh.positions.slice(3*D.vertex,3*D.vertex+3),N=(D,O)=>Math.hypot(...[0,1,2].map(k=>L(D)[k]-L(O)[k])),P=a.indexOf(A),C=i.SIDE*Math.min(N(A,a[P-1]),N(A,a[P+1])),U=A.chart.get(s),F=A.across,z=D=>Ge.kept(D,U[0]+C*F[0],U[1]+C*F[1],l)&&!Ge.kept(D,U[0]-C*F[0],U[1]-C*F[1],l);if(z(w)&&!z(M))T=w;else if(!z(M))return`neither side of the rail's run on face ${c.surface.name} keeps the face past the rail`}return c.cycles.splice(c.cycles.indexOf(_),1,T),null}})(sa||(sa={}));const{add:Cu,cross:gv,dot:Ze,scale:Dr,sub:Gn}=Jt;var aa;(i=>{function t(n){const r=n.length,s=ye.interpolate(n.map(l=>[l[0],l[1]])),a=ye.interpolate(n.map(l=>[l[2],0])),o=Array.from({length:r},(l,h)=>[s[h],s[r+h],a[h]]),c=l=>{const h=(l/(2*Math.PI)%1+1)%1*r,p=Math.min(r-1,Math.floor(h)),f=h-p,u=1-f,d=r/(2*Math.PI),_=[[u*u*u/6,(3*f*f*f-6*f*f+4)/6,(-3*f*f*f+3*f*f+3*f+1)/6,f*f*f/6],[-u*u/2,(3*f*f-4*f)/2,(-3*f*f+2*f+1)/2,f*f/2],[u,3*f-2,1-3*f,f],[-1,3,-3,1]],g=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];for(let m=0;m<4;m++)for(let x=0;x<4;x++){const y=o[((p-1+x)%r+r)%r],v=_[m][x]*d**m;g[m][0]+=v*y[0],g[m][1]+=v*y[1],g[m][2]+=v*y[2]}return g};return{g:(l,h,p)=>{const[f,u]=c(p);return Ze(Gn(l,f),u)},grad:l=>[c(l)[1],0],gt:(l,h)=>{const[p,f,u]=c(h);return-Ze(f,f)+Ze(Gn(l,p),u)},extra:(l,h,p)=>{const[f,u,d,_]=c(p);return 2*Ze(h,d)-3*Ze(u,d)+Ze(Gn(l,f),_)},angle:()=>0}}i.arc=t;function e(n){if(n.kind==="arc")return null;if(n.kind==="phase")return{g:(h,p,f)=>p-f,grad:()=>[[0,0,0],1],gt:()=>-1,extra:()=>0,angle:()=>0};const r=Jt.unit(n.normal);if(r===null)return null;const s=Jt.unit(Gn(n.reference,Dr(r,Ze(n.reference,r))));if(s===null)return null;const a=gv(r,s),o=n.centre,c=h=>Cu(Dr(s,Math.cos(h)),Dr(a,Math.sin(h))),l=h=>Cu(Dr(s,-Math.sin(h)),Dr(a,Math.cos(h)));return{g:(h,p,f)=>Ze(Gn(h,o),l(f)),grad:h=>[l(h),0],gt:(h,p)=>-Ze(Gn(h,o),c(p)),extra:(h,p,f)=>-2*Ze(p,c(f))-Ze(Gn(h,o),l(f)),angle:h=>Math.atan2(Ze(Gn(h,o),a),Ze(Gn(h,o),s))}}i.of=e})(aa||(aa={}));const{combine:Nr,cross:so,dot:ao,norm:Ur,sub:Fs}=Jt;var gn;(i=>{i.STEPS=40,i.HALVINGS=24,i.SWITCHES=4;function t(o,c,l,h,p,f,u){let d=f,_=[p[0],p[1],p[2],p[3]];for(let g=0;g<=i.SWITCHES;g++){const m=e(o,c.faces[d],l,h,_,u);if(m===null)return null;if(c.kept(d,m.y,m.theta))return{...m,face:d};const x=c.across(d,m.y,m.theta);if(x===null)return null;d=x.face,_=[m.s,m.phi,x.u,x.v]}return null}i.solve=t;function e(o,c,l,h,p,f){let u=[p[0],p[1],p[2],p[3]],d=o.jet(u[0],u[1]),_=c.jet(u[2],u[3]);const g=(E,S,b)=>[...Fs(E.p,S.p),l.g(E.p,b[1],h)],m=E=>Math.hypot(...E);let x=g(d,_,u),y=m(x);for(let E=0;E<i.STEPS&&!(y<=f);E++){const S=Jt.solve(n(d,_,l,h),x.map(w=>-w));if(S===null)return null;let b=1,M=!1;for(let w=0;w<20;w++,b/=2){const A=[u[0]+b*S[0],u[1]+b*S[1],u[2]+b*S[2],u[3]+b*S[3]],T=o.jet(A[0],A[1]),L=c.jet(A[2],A[3]),N=g(T,L,A);if(m(N)<y){u=A,d=T,_=L,x=N,y=m(N),M=!0;break}}if(!M)return null}if(!(y<=f))return null;const v=Jt.solve(n(d,_,l,h),x.map(E=>-E));if(v!==null){const E=[u[0]+v[0],u[1]+v[1],u[2]+v[2],u[3]+v[3]],S=o.jet(E[0],E[1]),b=c.jet(E[2],E[3]);m(g(S,b,E))<=y&&(u=E,d=S,_=b)}return r(d,_,l,h,u,0)}function n(o,c,l,h){const[p,f]=l.grad(h);return[...[0,1,2].map(u=>[o.u[u],o.v[u],-c.u[u],-c.v[u]]),[ao(p,o.u),ao(p,o.v)+f,0,0]]}function r(o,c,l,h,p,f){const u=n(o,c,l,h),d=Jt.solve(u,[0,0,0,-l.gt(o.p,h)]);if(d===null)return null;const[_,g,m,x]=d,y=Nr([[_*_,o.uu],[2*_*g,o.uv],[g*g,o.vv]]),v=Nr([[m*m,c.uu],[2*m*x,c.uv],[x*x,c.vv]]),E=Nr([[_,o.u],[g,o.v]]),S=ao(l.grad(h)[0],y)+l.extra(o.p,E,h),b=Fs(y,v),M=Jt.solve(u,[-b[0],-b[1],-b[2],-S]);if(M===null)return null;const w=so(o.u,o.v),A=so(c.u,c.v),T=Ur(so(w,A))/(Ur(w)*Ur(A));return{t:h,face:f,s:p[0],phi:p[1],y:p[2],theta:p[3],point:o.p,tangent:E,second:Nr([[1,y],[M[0],o.u],[M[1],o.v]]),rate:d,rate2:M,angle:Math.asin(Math.min(1,T))}}function s(o,c,l,h,p,f){let u=h,d=p-h.t,_=0;for(;u.t!==p;){const g=Math.abs(p-u.t)<Math.abs(d)?p-u.t:d,x=[u.s,u.phi,u.y,u.theta].map((b,M)=>b+u.rate[M]*g+u.rate2[M]*g*g/2),y=Nr([[1,u.point],[g,u.tangent],[g*g/2,u.second]]),v=Math.abs(p-u.t-g)===0?p:u.t+g,E=t(o,c,l,v,x,u.face,f),S=Ur(Fs(y,u.point));if(E!==null&&Ur(Fs(E.point,y))<=.25*S+10*f){u=E;continue}if(++_>i.HALVINGS)return null;d=g/2}return u}i.advance=s;function a(o,c,l,h){return c===0&&l===0&&h===0?o:{...o,theta:o.theta+c,phi:o.phi+l,t:o.t+h}}i.shifted=a})(gn||(gn={}));const{add:_v,cross:ir,dot:oo,norm:wn,scale:Pu,sub:Fr}=Jt;var Ai;(i=>{function t(s){const{part:a,count:o,tolerance:c,grazing:l}=s,h=r(s.host),p=s.parameter??{kind:"phase"},f=`solid.intersection.${a.name}.${h.name}`,u=[],d=(C,U)=>(u.push({producer:f,level:6,contract:C,detail:U}),{curve:null,diagnostics:u});if(a.period===void 0)return d("periodic part",`${a.name} has no periodic phase`);if(!(o>=8))return d("trace count",`${o} points per turn, under 8`);const _=2*Math.PI;let g,m,x;if(p.kind==="arc"){const C=n(a,h,s,o,c);if(typeof C=="string")return d("traced loop",C);g=C.law,m=0,x=gn.solve(a,h,g,0,C.x,C.face,c)}else{const C=aa.of(p);if(C===null)return d("parameter","the angle parameter's normal and reference are parallel or zero");g=C,m=p.kind==="phase"?s.seed.phi:g.angle(a.jet(s.seed.s,s.seed.phi).p),x=gn.solve(a,h,g,m,[s.seed.s,s.seed.phi,s.seed.y,s.seed.theta],s.seed.face??0,c)}if(x===null)return d("one loop per contact",`no meeting near the seed (phi ${s.seed.phi}, s ${s.seed.s}, y ${s.seed.y}, theta ${s.seed.theta})`);const y=[x];let v=x;for(let C=1;C<=o;C++){const U=m+_*C/o,F=gn.advance(a,h,g,v,U,c);if(F===null)return d("traced loop",`lost at t ${v.t}, toward ${U}`);v=F,C<o&&y.push(F)}const E=h.faces[x.face],S=v.face===x.face,b=E.period===void 0||!S?0:Math.round((v.theta-x.theta)/E.period),M=E.period===void 0?0:b*E.period,w=Math.round((v.phi-x.phi)/a.period),A=w*a.period,T=a.jet(x.s,x.phi),L=E.jet(x.y,x.theta),N=Math.max(Math.abs(v.s-x.s)*wn(T.u),Math.abs(v.phi-A-x.phi)*wn(T.v),S?Math.abs(v.y-x.y)*wn(L.u):1/0,Math.abs(v.theta-M-x.theta)*wn(L.v));if(!(N<=10*c))return d("one loop per contact",`the trace returns ${N} mm from its start after one turn`);for(const C of y){const U=e(a,C.s)??e(h.faces[C.face],C.y);if(U!==null)return d("inside the layers",`at t ${C.t}: ${U}; build the part far enough to cross its host inside both chains' layers`)}for(const C of y)C.angle<l&&u.push({producer:f,level:6,contract:"transversal contact",detail:`tangent planes ${C.angle} rad apart at t ${C.t}, under ${l}`});const P=C=>{const U=Math.floor((C-m)/_),F=C-U*_,z=Math.round((F-m)/_*o),D=z>=o?gn.shifted(y[0],M,A,_):y[z],O=gn.advance(a,h,g,D,F,c);return O===null?null:gn.shifted(O,U*M,U*A,U*_)};return{curve:{part:a.name,host:h.name,parameter:p,points:y,winding:b,partWinding:w,at:P},diagnostics:u}}i.trace=t;function e(s,a){const o=s.domain;return o===void 0||a>=o[0]&&a<=o[1]?null:`${s.name}'s u ${a} lies outside its layers ${o[0]} to ${o[1]}`}i.beyond=e,i.WALK_STEPS=64,i.WALK_POINTS=4,i.CLOSING_STEPS=6;function n(s,a,o,c,l){const h=(F,z)=>{const D=s.jet(F.s,F.phi),O=a.faces[F.face].jet(F.y,F.theta),k=Jt.unit(ir(ir(D.u,D.v),ir(O.u,O.v)));return k===null?null:z!==null&&oo(k,z)<0?Pu(k,-1):k},p=(F,z)=>({g:D=>oo(Fr(D,F),z),grad:()=>[z,0],gt:()=>0,extra:()=>0,angle:()=>0}),f=o.seed.face??0,u=[o.seed.s,o.seed.phi,o.seed.y,o.seed.theta],d=s.jet(u[0],u[1]),_=a.faces[f].jet(u[2],u[3]),g=Jt.unit(ir(ir(d.u,d.v),ir(_.u,_.v)));if(g===null)return"the surfaces touch at the seed";const m=gn.solve(s,a,p(d.p,g),0,u,f,l);if(m===null)return"no meeting near the seed";const x=h(m,g)??g,y=(F,z,D,O)=>{const k=_v(F.point,Pu(z,D)),J=[F.s,F.phi,F.y,F.theta],$=O===null||O.face!==F.face?J:[2*J[0]-O.s,2*J[1]-O.phi,2*J[2]-O.y,2*J[3]-O.theta],rt=gn.solve(s,a,p(k,z),0,$,F.face,l);return rt!==null&&wn(Fr(rt.point,k))<=.25*D+10*l?rt:null};let v=wn(d.v)*2*Math.PI/c,E=m,S=x,b=null,M=0,w=!1;for(let F=0;F<i.WALK_STEPS*c;F++){const z=Fr(m.point,E.point);if(F>2&&wn(z)<=v&&oo(z,S)>0){M+=wn(z),w=!0;break}let D=null;for(let k=0;k<gn.HALVINGS&&D===null;k++)D=y(E,S,v,b),D===null&&(v/=2);if(D===null)return`lost after ${M} mm of the walk`;M+=wn(Fr(D.point,E.point)),b=E,E=D;const O=h(E,S);if(O===null)return`the surfaces touch ${M} mm along the walk`;S=O}if(!w)return`the walk does not return to its start in ${i.WALK_STEPS*c} steps`;const A=i.WALK_POINTS*c,T=F=>{const z=[m.point];let D=m,O=x,k=null;for(let J=1;J<A;J++){const $=y(D,O,F,k);if($===null)return`the equal-chord walk is lost at step ${J} of ${A}`;z.push($.point),k=D,D=$;const rt=h(D,O);if(rt===null)return`the surfaces touch at step ${J} of the equal-chord walk`;O=rt}return z},L=(F,z)=>wn(Fr(F[0],F[F.length-1]))-z;let N=M/A,P=T(N);if(typeof P=="string")return P;let C=L(P,N),U=N+C/A;for(let F=0;F<i.CLOSING_STEPS&&Math.abs(C)>1e-9*N;F++){const z=T(U);if(typeof z=="string")break;const D=L(z,U),O=D===C?U:U-D*(U-N)/(D-C);[N,P,C,U]=[U,z,D,O]}return{law:aa.arc(P),x:[m.s,m.phi,m.y,m.theta],face:m.face}}function r(s){return"faces"in s?s:{name:s.name,faces:[s],kept:()=>!0,across:()=>null}}i.atlas=r})(Ai||(Ai={}));const{combine:ui,cross:Os,dot:de,norm:Hn,sub:co,unit:lo}=Jt;var uc;(i=>{i.STEPS=40,i.ROUNDING=1e-12,i.SWITCHES=4,i.CROSSING_BISECTIONS=40;function t(a,o,c,l,h,p,f="station"){const u=a.jet(c.s,c.phi),d=o.faces[c.face],_=d.jet(c.y,c.theta),g=lo(Os(u.u,u.v)),m=lo(Os(_.u,_.v));if(g===null||m===null)return null;const x=[g[0]*a.orientation,g[1]*a.orientation,g[2]*a.orientation],y=[m[0]*d.orientation,m[1]*d.orientation,m[2]*d.orientation];let v,E=c.phi,S,b;if(f==="station"){const P=de(u.u,y);if(!(Math.abs(P)>0))return null;const C=P>0==(l==="outside")?1:-1;if(b=C,S=[C/Hn(u.u),0],typeof h=="number"){const U=s(F=>a.jet(c.s+C*F,c.phi),[C,0],c.point,h);if(U===null)return null;v=c.s+C*U}else{if(!(C*(h.station-c.s)>0))return null;v=h.station}}else{if(typeof h!="number")return null;const P=r(u,[c.rate[0],c.rate[1]],y,l==="outside"?1:-1);if(P===null)return null;S=P,b=P[0]>=0?1:-1;const C=s(F=>a.jet(c.s+F*P[0],c.phi+F*P[1]),P,c.point,h);if(C===null)return null;const U=n(a,[c.s+C*P[0],c.phi+C*P[1]],c.point,e(u,P),h);if(U===null)return null;v=U[0],E=U[1]}const M=r(_,[c.rate[2],c.rate[3]],x,1);if(M===null)return null;const w=s(P=>d.jet(c.y+P*M[0],c.theta+P*M[1]),M,c.point,p);if(w===null)return null;let A=c.face,T=[c.y+w*M[0],c.theta+w*M[1]],L=M;for(let P=0;P<i.SWITCHES&&!o.kept(A,T[0],T[1]);P++){const C=P===0?[c.y,c.theta]:T,U=ot=>o.kept(A,C[0]+ot*(T[0]-C[0]),C[1]+ot*(T[1]-C[1]));let F=0,z=1;for(let ot=0;ot<i.CROSSING_BISECTIONS;ot++){const Dt=(F+z)/2;U(Dt)?F=Dt:z=Dt}const D=[C[0]+z*(T[0]-C[0]),C[1]+z*(T[1]-C[1])],O=o.faces[A].jet(D[0],D[1]),k=ui([[L[0],O.u],[L[1],O.v]]),J=o.across(A,D[0],D[1]);if(J===null)return null;const $=o.faces[J.face].jet(J.u,J.v),rt=Jt.solve2(de($.u,$.u),de($.u,$.v),de($.u,$.v),de($.v,$.v),[de($.u,k),de($.v,k)]);if(rt===null)return null;const at=Hn(ui([[rt[0],$.u],[rt[1],$.v]]));if(!(at>0))return null;A=J.face,L=[rt[0]/at,rt[1]/at];const lt=o.faces[A],W=[J.u,J.v],j=s(ot=>lt.jet(W[0]+ot*L[0],W[1]+ot*L[1]),L,c.point,p,Math.max(0,p-Hn(co($.p,c.point))));if(j===null)return null;T=[W[0]+j*L[0],W[1]+j*L[1]]}const N=n(o.faces[A],T,c.point,e(_,M),p);if(N===null)return null;if(T=N,!o.kept(A,T[0],T[1])){const P=o.faces[A].jet(T[0],T[1]),C=ui([[L[0],P.u],[L[1],P.v]]),U=o.across(A,T[0],T[1]);if(U===null)return null;const F=n(o.faces[U.face],[U.u,U.v],c.point,e(_,M),p);if(F===null||!o.kept(U.face,F[0],F[1]))return null;const z=o.faces[U.face].jet(F[0],F[1]),D=Jt.solve2(de(z.u,z.u),de(z.u,z.v),de(z.u,z.v),de(z.v,z.v),[de(z.u,C),de(z.v,C)]);if(D===null)return null;const O=Hn(ui([[D[0],z.u],[D[1],z.v]]));if(!(O>0))return null;A=U.face,T=F,L=[D[0]/O,D[1]/O]}return{curve:c,s:v,phi:E,sigma:b,partAcross:S,partPoint:a.jet(v,E).p,hostFace:A,host:T,across:L,hostPoint:o.faces[A].jet(T[0],T[1]).p}}i.at=t;function e(a,o){const c=ui([[o[0],a.u],[o[1],a.v]]);return lo(Os(Os(a.u,a.v),c))??[0,0,0]}function n(a,o,c,l,h){if(!(Hn(l)>0))return null;const p=h+Hn(c);let f=[o[0],o[1]];for(let u=0;u<i.STEPS;u++){const d=a.jet(f[0],f[1]),_=co(d.p,c),g=de(_,l),m=de(_,_)-h*h,x=Math.abs(g)<=i.ROUNDING*p&&Math.abs(m)<=2*h*i.ROUNDING*p,y=Jt.solve2(de(d.u,l),de(d.v,l),2*de(_,d.u),2*de(_,d.v),[-g,-m]);if(y===null)return null;if(f=[f[0]+y[0],f[1]+y[1]],x)return f}return null}function r(a,o,c,l){const h=de(a.u,a.u),p=de(a.u,a.v),f=de(a.v,a.v),u=Jt.solve2(h,p,p,f,[-o[1],o[0]]);if(u===null)return null;const d=Math.sqrt(h*u[0]*u[0]+2*p*u[0]*u[1]+f*u[1]*u[1]);if(!(d>0))return null;const _=de(ui([[u[0],a.u],[u[1],a.v]]),c);if(!(Math.abs(_)>0))return null;const g=(_>0?1:-1)*l/d;return[u[0]*g,u[1]*g]}function s(a,o,c,l,h){if(!(l>0))return null;const p=a(0),f=Hn(ui([[o[0],p.u],[o[1],p.v]]));if(!(f>0))return null;let u=(h??l)/f;for(let d=0;d<i.STEPS;d++){const _=a(u),g=co(_.p,c),m=Hn(g),x=m-l,y=de(g,ui([[o[0],_.u],[o[1],_.v]]))/m;if(!(y>0))return null;const v=Math.abs(x)<=i.ROUNDING*(l+Hn(c));if(u-=x/y,v)return u}return null}})(uc||(uc={}));const{combine:Iu}=Jt;var ns;(i=>{function t(e,n,r,s,a,o){const c=e.jet(n,r);return{point:c.p,first:Iu([[o*s,c.u],[o*a,c.v]]),second:Iu([[o*o*s*s,c.uu],[2*o*o*s*a,c.uv],[o*o*a*a,c.vv]])}}i.of=t})(ns||(ns={}));const{combine:Lu,cross:vv,dot:xv,norm:uo,sub:Du}=Jt;var oa;(i=>{i.FOLD_SHARES=8;function t(r,s){const a=r.curve!==void 0?{curve:r.curve,diagnostics:[]}:Ai.trace(r),o=[...a.diagnostics],c=`solid.join.${r.part.name}.${r.host.name}`,l=Ai.atlas(r.host),h=(M,w)=>(o.push({producer:c,level:6,contract:M,detail:w}),{join:null,diagnostics:o});if(a.curve===null)return{join:null,diagnostics:o};if(o.length!==0)return{join:null,diagnostics:o};const p=a.curve,f=2*Math.PI,u=p.points[0].t,d=r.parameter===void 0||r.parameter.kind==="phase"?"station":"square",_=new Map,g=M=>{const w=_.get(M);if(w!==void 0)return w;const A=p.at(M),T=A===null?null:uc.at(r.part,l,A,s,typeof r.width.part=="function"?r.width.part(M):r.width.part,r.width.host(M),d);return _.set(M,T),T},m=M=>{const w=g(M);return w===null?null:e(r.part,l.faces[w.hostFace],w)},x=M=>{const w=[];for(let A=0;A<M;A++){const T=g(u+f*A/M);if(T===null)return null;w.push(T.host)}return w},y=[];for(const M of p.points){const w=m(M.t);if(w===null)return h("rails",`no rail at t ${M.t} (host width ${r.width.host(M.t)} mm)`);const A=Ai.beyond(r.part,w.rail.s)??Ai.beyond(l.faces[w.rail.hostFace],w.rail.host[0]);if(A!==null)return h("inside the layers",`the rails at t ${M.t}: ${A}`);y.push(w)}const E=y.every(M=>M.rail.hostFace===y[0].rail.hostFace)?n(y.map(M=>M.rail.host),p.winding===0):null;if(E!==null)return h("simple rail",`the host's rail crosses itself ${E}; a width passes the rail's radius of curvature`);const S=f/(16*p.points.length);for(const M of y){const w=m(M.rail.curve.t-S),A=m(M.rail.curve.t+S);if(w===null||A===null)return h("rails",`no rail beside t ${M.rail.curve.t}`);let T=null;for(let L=0;L<=i.FOLD_SHARES;L++){const N=L/i.FOLD_SHARES,P=Du(Xr.jet(A.start,A.end,N).point,Xr.jet(w.start,w.end,N).point),C=vv(P,Xr.jet(M.start,M.end,N).first);if(T!==null&&!(xv(T,C)>0))return h("unfolded blend",`the blend's normal reverses at t ${M.rail.curve.t}, share ${N}`);T=C}}return{join:{curve:p,keep:s,continuity:"G2",rail:g,column:m,loop:x,widths:M=>({host:r.width.host(M),part:typeof r.width.part=="function"?r.width.part(M):null})},diagnostics:o}}i.create=t;function e(r,s,a){const o=uo(Du(a.partPoint,a.hostPoint)),c=s.jet(a.host[0],a.host[1]),l=uo(Lu([[a.across[0],c.u],[a.across[1],c.v]])),h=r.jet(a.s,a.phi),p=uo(Lu([[a.partAcross[0],h.u],[a.partAcross[1],h.v]]));return{rail:a,start:ns.of(s,a.host[0],a.host[1],-a.across[0],-a.across[1],o/l),end:ns.of(r,a.s,a.phi,a.partAcross[0],a.partAcross[1],o/p)}}function n(r,s){const a=r.length,o=s?a:a-1,c=(l,h,p)=>(h[0]-l[0])*(p[1]-l[1])-(h[1]-l[1])*(p[0]-l[0]);for(let l=0;l<o;l++){const h=r[l],p=r[(l+1)%a];for(let f=l+2;f<o;f++){if(s&&l===0&&f===a-1)continue;const u=r[f],d=r[(f+1)%a];if(c(h,p,u)*c(h,p,d)<0&&c(u,d,h)*c(u,d,p)<0)return`between edges ${l} and ${f}`}}return null}})(oa||(oa={}));var fc;(i=>{function t(e){return oa.create(e,"inside")}i.create=t})(fc||(fc={}));var hc;(i=>{function t(e){return oa.create(e,"outside")}i.create=t})(hc||(hc={}));var Nu;(i=>{function t(o,c){return{name:o,faces:c.map(l=>({...l,cycles:[]})),mesh:Qe.create(),blends:[]}}i.create=t;function e(o,c=-1){const l=o.faces.map((u,d)=>d).filter(u=>u!==c),h=new Map(l.map((u,d)=>[u,d])),p=l.map(u=>({...o.faces[u],cycles:o.faces[u].cycles.map(Uu)})),f=u=>p[u];return{index:l,atlas:{name:o.name,faces:l.map(u=>o.faces[u].surface),kept:(u,d,_)=>a(f(u),d,_),across:(u,d,_)=>{const g=f(u);let m=null;for(const E of g.cycles){if(Ge.kept(E,d,_,g.surface.period))continue;const S=Ge.foot(E,d,_,g.surface.period);(m===null||S.distance<m.foot.distance)&&(m={cycle:E,foot:S})}if(m===null)return null;const x=m.cycle.neighbours[m.foot.segment],y=h.get(x.face);if(y===void 0)return null;const v=m.foot.share;return{face:y,u:x.from[0]+v*(x.to[0]-x.from[0]),v:x.from[1]+v*(x.to[1]-x.from[1])}}}}}i.atlas=e;function n(o,c){const l=[],h=o.faces.length,p=o.faces.map(N=>N.cycles.map(Uu)),f=[o.mesh.positions.length,o.mesh.coordinates.length,o.mesh.indices.length,o.mesh.owners.length],u=(N,P)=>(l.push({producer:`solid.body.${o.name}.${c.name}`,level:6,contract:N,detail:P}),o.faces.length=h,o.faces.forEach((C,U)=>void(C.cycles=p[U])),[o.mesh.positions.length,o.mesh.coordinates.length,o.mesh.indices.length,o.mesh.owners.length]=f,{blend:null,join:null,diagnostics:l}),d=typeof c.part=="number"?c.part:-1,_=typeof c.part=="number"?o.faces[c.part].surface:c.part.surface,{atlas:g,index:m}=e(o,d),x=(c.kind==="merge"?hc:fc).create({...c.join,part:_,host:g});if(l.push(...x.diagnostics),x.join===null)return{blend:null,join:null,diagnostics:l};const y=x.join,v=lc.of(c.name,y,c.count);if(v===null)return u("rails","a column of the blend has no rail");const E=ra.surface(v.chain);if(E===null)return u("blend surface","the blend chain carries no jets");const S=d>=0?d:o.faces.push({...c.part,cycles:[],inverted:c.kind==="diff"})-1,b=o.faces.length;o.faces.push({surface:E,stations:Array.from({length:c.rows+1},(N,P)=>v.length*P/c.rows),phases:Array.from({length:c.count},(N,P)=>2*Math.PI*P/c.count),cycles:[]});const M=sa.rail(o,y,v,m,c.count);if(typeof M=="string")return u("rails",`the host rail's crossing between two faces could not be placed: ${M}`);const w=Qe.owner(o.mesh,_),A=v.part.chart.map(N=>Qe.vertex(o.mesh,_.jet(N[0],N[1]).p,w,N[0],N[1])),T=N=>2*Math.PI*N/c.count;o.faces[b].cycles.push({kind:"start",vertices:M.map(N=>N.vertex),chart:M.map(N=>[0,N.phase]),neighbours:M.map((N,P)=>{const C=M[(P+1)%M.length],U=N.faces.find(F=>C.faces.includes(F))??N.faces[0];return{face:U,from:N.chart.get(U),to:C.chart.get(U)}})},{kind:"end",vertices:A.slice(),chart:A.map((N,P)=>[v.length,T(P)]),neighbours:A.map((N,P)=>({face:S,from:v.part.chart[P],to:v.part.chart[(P+1)%A.length]}))}),o.faces[S].cycles.push({kind:v.part.kind,vertices:A,chart:v.part.chart.map(N=>[N[0],N[1]]),neighbours:A.map((N,P)=>({face:b,from:[v.length,T(P)],to:[v.length,T((P+1)%A.length)+(P+1===A.length?2*Math.PI:0)]}))});const L=sa.trim(o,M,b,v.host.kind);return L!==null?u("trim",L):(o.blends.push(v),{blend:v,join:y,diagnostics:l})}i.merge=n;function r(o){return o.faces.map(c=>Qe.face(o.mesh,{surface:c.surface,stations:c.stations,phases:c.phases,loops:c.cycles.map(l=>({kind:l.kind,vertices:l.vertices,chart:l.chart})),inverted:c.inverted}))}i.draw=r;function s(o){const c=new Map,l=[],h=p=>{const f=c.get(p);if(f!==void 0)return f;const u=o.mesh.coordinates.slice(3*p,3*p+3);return l.push({chain:o.mesh.owners[u[0]].name,chart:[u[1],u[2]]}),c.set(p,l.length-1),l.length-1};return{name:o.name,points:l,faces:o.faces.map(p=>({chain:p.surface.name,cycles:p.cycles.map(f=>({kind:f.kind,points:f.vertices.map(h),chart:f.chart.map(u=>[u[0],u[1]])})),...p.inverted===!0?{inverted:!0}:{}}))}}i.publish=s;function a(o,c,l){return o.cycles.every(h=>Ge.kept(h,c,l,o.surface.period))}i.kept=a})(Nu||(Nu={}));function Uu(i){return{kind:i.kind,vertices:i.vertices.slice(),chart:i.chart.map(t=>[t[0],t[1]]),neighbours:i.neighbours.map(t=>({face:t.face,from:[t.from[0],t.from[1]],to:[t.to[0],t.to[1]]}))}}const{dot:fo}=Jt;var Fu;(i=>{i.DENSITY=16;function t(n,r,s,a){const o=`solid.trim.${n.name}`,c=[],l=(S,b)=>(c.push({producer:o,level:5,contract:S,detail:b}),{trim:null,diagnostics:c});if(!(r.length>=4)||s.length!==r.length)return l("margin landmarks",`${r.length} landmarks and ${s.length} guesses; at least 4, one guess each`);const h=[];for(let S=0;S<r.length;S++){const b=jr.of(n,r[S],s[S],a);if(b===null)return l("landmark foot",`no foot for landmark ${S} at ${r[S].join(", ")}`);const M=Ai.beyond(n,b.u);if(M!==null)return l("landmark foot",`landmark ${S}'s foot lies past the face: ${M}`);h.push([b.u,b.v])}const p=ye.interpolate(h),f=h.length,u=S=>ye.evaluate(p,f,S),d=Array.from({length:f*i.DENSITY},(S,b)=>{const M=u(2*Math.PI*b/(f*i.DENSITY));return[M[0],M[1]]}),_=e(d);if(_>=0)return l("simple margin",`the loop through the landmarks crosses itself at sample ${_}`);const g=d.reduce((S,b)=>S+b[1],0)/d.length;let m=0;for(let S=0,b=d.length-1;S<d.length;b=S++)m+=d[b][0]*d[S][1]-d[S][0]*d[b][1];const x=m>0?1:-1,y=(S,b)=>{const M=n.period===void 0?b:b+n.period*Math.round((g-b)/n.period);let w=!1;for(let A=0,T=d.length-1;A<d.length;T=A++){const L=d[A],N=d[T];L[0]>S!=N[0]>S&&M<(N[1]-L[1])*(S-L[0])/(N[0]-L[0])+L[1]&&(w=!w)}return w},v=S=>{const[b,M,w,A]=u(S),T=n.jet(b,M),L=fo(T.u,T.u),N=fo(T.u,T.v),P=fo(T.v,T.v),C=Jt.solve2(L,N,N,P,[-A,w]);if(C===null)return null;const U=Math.sqrt(L*C[0]*C[0]+2*N*C[0]*C[1]+P*C[1]*C[1]);if(!(U>0))return null;const F=x/U;return[b,M,C[0]*F,C[1]*F]};for(let S=0;S<d.length;S++)if(v(2*Math.PI*S/d.length)===null)return l("regular chart",`the surface's chart degenerates on the loop at sample ${S}`);const E=(S,b)=>{const[M,w,A,T]=v(S)??[...u(S).slice(0,2),0,0];return ns.of(n,M,w,A,T,b)};return{trim:{surface:n.name,loop:p,feet:h,at:u,inside:y,ribbon:E},diagnostics:c}}i.create=t;function e(n){const r=n.length,s=(a,o,c)=>(o[0]-a[0])*(c[1]-a[1])-(o[1]-a[1])*(c[0]-a[0]);for(let a=0;a<r;a++)for(let o=a+2;o<r;o++){if(a===0&&o===r-1)continue;const c=n[a],l=n[(a+1)%r],h=n[o],p=n[(o+1)%r];if(s(c,l,h)*s(c,l,p)<0&&s(h,p,c)*s(h,p,l)<0)return a}return-1}})(Fu||(Fu={}));var di;(i=>{i.ELLIPSE=Math.SQRT2-1;function t(h,p){const f=h.extents,u=(d,_,g)=>{const m=p[d]/(1-p[d]);return _/(2*m*m*g*g)};return[0,1,2,3].map(d=>{const _=(d+3)%4;return Math.min(u(_,f[d],f[_]),u(d,f[d],f[(d+1)%4]))})}i.curvatures=t;function e(h,p){const f=n(h,p),u=h.extents;return f.diagonals=[0,1,2,3].map(d=>s(f,f.guides[d].angle+Math.atan2(u[(d+1)%4],u[d]))[0]),f.girth=a(f),f}i.of=e;function n(h,p){const f=h.extents,u=t(h,p),d=[0,1,2,3].map(g=>({angle:g*Math.PI/2,value:f[g],slope:0,curvature:f[g]-u[g]*f[g]*f[g]})),_=[];for(let g=0;g<4;g++){_.push(d[g]);for(let m=1;m<Ou;m++)_.push(r(f[g],f[(g+1)%4],p[g],Mv(f[g],f[(g+1)%4],p[g],m/Ou),d[g].angle))}return{box:h,shoulders:[...p],guides:d,knots:_,fullness:[0,0,0,0],girth:0,diagonals:[0,0,0,0]}}i.bare=n;function r(h,p,f,u,d){const _=f/(1-f),g=1-u,m=[g*g*h+2*_*u*g*h,2*_*u*g*p+u*u*p],x=[-2*g*h+2*_*(1-2*u)*h,2*_*(1-2*u)*p+2*u*p],y=[2*h-4*_*h,-4*_*p+2*p],v=g*g+2*_*u*g+u*u,E=-2*g+2*_*(1-2*u)+2*u,S=4-4*_,b=[m[0]/v,m[1]/v],M=[(x[0]-b[0]*E)/v,(x[1]-b[1]*E)/v],w=[(y[0]-2*M[0]*E-b[0]*S)/v,(y[1]-2*M[1]*E-b[1]*S)/v],A=Math.hypot(b[0],b[1]),T=(b[0]*M[0]+b[1]*M[1])/A,L=(b[0]*M[1]-b[1]*M[0])/(A*A),N=(M[0]*M[0]+M[1]*M[1]+b[0]*w[0]+b[1]*w[1]-T*T)/A,P=(b[0]*w[1]-b[1]*w[0])/(A*A)-2*L*T/A;return{angle:d+Math.atan2(b[1],b[0]),value:A,slope:T/L,curvature:(N*L-T*P)/(L*L*L)}}i.conic=r;function s(h,p){return oc.radius(h.knots,yv(h.knots.length),p)}i.radius=s;function a(h){let p=0;const f=h.knots.map(u=>u.angle);for(let u=0;u<f.length;u++){const d=f[u],_=u+1<f.length?f[u+1]:f[0]+2*Math.PI,g=_-d,m=(d+_)/2;for(let x=0;x<zu.length;x++){const[y,v]=s(h,m+zu[x]*g/2);p+=Ev[x]*g/2*Math.hypot(y,v)}}return p}i.length=a;function o(h){const p=h.box.extents;for(let f=0;f<4;f++){const u=f*Math.PI/2;for(let d=0;d<=ku;d++){const _=u+d*dc/ku,[g,m,x]=s(h,_);if(!(g>0))return`radius ${g} mm at angle ${_}`;const y=g*g+2*m*m-g*x;if(y<-1e-12*g*g)return`concave at angle ${_} (curvature numerator ${y} mm^2)`;const v=g*Math.cos(_-u),E=g*Math.sin(_-u);if(v>p[f]*(1+Gu))return`past side ${f} by ${v-p[f]} mm at angle ${_}`;if(E>p[(f+1)%4]*(1+Gu))return`past side ${(f+1)%4} by ${E-p[(f+1)%4]} mm at angle ${_}`}}return null}i.fault=o;function c(h,p=[0,0,0,0]){const f=y=>{const v=p.map(S=>y+S);if(!v.every(S=>S>0&&S<1))return null;const E=n(h,v);return o(E)===null?E:null};if(f(i.ELLIPSE)===null)return null;const u=h.extents,d=Math.ceil(Math.log2(2*(u[0]+u[1]+u[2]+u[3])/Hu)),_=(y,v)=>{let E=y,S=v;for(let b=0;b<d;b++){const M=(E+S)/2;f(M)!==null?E=M:S=M}return E},g=_(i.ELLIPSE,0),m=_(i.ELLIPSE,1),x=y=>e(h,p.map(v=>y+v));return{shoulder:[g,m],girth:[x(g).girth,x(m).girth]}}i.range=c;function l(h,p,f,u=[0,0,0,0]){const d=c(p,u),_=p.extents,g=_[0]+_[2],m=_[1]+_[3],x=S=>e(p,u.map(b=>S+b));if(d===null)return{section:null,diagnostics:[{producer:h,level:2,contract:"view section",detail:`the box [${_.join(", ")}] mm with departures [${u.join(", ")}] admits no valid section at the ellipse's shoulder`}]};const[y,v]=d.girth;if(!(f>=y&&f<=v)){const S=f<y?d.shoulder[0]:d.shoulder[1];return{section:x(S),diagnostics:[{producer:h,level:2,contract:"girth in reach",detail:`girth ${f} mm outside the reach ${y} to ${v} mm of the box ${g} by ${m} mm (rhombus ${2*Math.hypot(g,m)} mm, rectangle ${2*(g+m)} mm); the section is the shoulder ${S}`}]}}const E=sc.root(S=>x(S).girth-f,d.shoulder[0],d.shoulder[1],Hu,bv)??(f-y<v-f?d.shoulder[0]:d.shoulder[1]);return{section:x(E),diagnostics:[]}}i.solve=l})(di||(di={}));const dc=Math.PI/2,Ou=16,Sv=60;function Mv(i,t,e,n){const r=e/(1-e),s=n*2*dc;let a=0,o=1;for(let c=0;c<Sv;c++){const l=(a+o)/2,h=1-l,p=h*h+2*r*l*h+l*l,f=-2*h+2*r*(1-2*l)+2*l,u=[h*h*i+2*r*l*h*i,2*r*l*h*t+l*l*t],d=[-2*h*i+2*r*(1-2*l)*i,2*r*(1-2*l)*t+2*l*t],_=d[0]*p-u[0]*f,g=d[1]*p-u[1]*f;Math.atan2(g,_)-dc+Math.atan2(u[1],u[0])<s?a=l:o=l}return(a+o)/2}const Bu=new Map;function yv(i){let t=Bu.get(i);return t===void 0&&(t=new Array(i).fill(0),Bu.set(i,t)),t}const zu=[-.9602898564975363,-.7966664774136267,-.525532409916329,-.1834346424956498,.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363],Ev=[.1012285362903763,.2223810344533745,.3137066458778873,.362683783378362,.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763],ku=96,Gu=1e-6,Hu=1e-6,bv=100;var Vu;(i=>{function t(e){const n=[],r=`view.${e.name}`,s=(D,O)=>{n.push({producer:r,level:2,contract:D,detail:O})},a=()=>({chain:null,surface:null,sections:[],diagnostics:n,continuity:Wu});if(!(Number.isInteger(e.order)&&e.order>=8&&e.order%4===0))return s("order",`order ${e.order} is not a positive multiple of 4 of at least 8`),a();const o=D=>D.length>=2&&D.every((O,k)=>Number.isFinite(O)&&(k===0||O>D[k-1]&&O-D[k-1]>=Vn.splineGap(D)));if(!o(e.stations))return s("stations",`stations [${e.stations.join(", ")}] are not at least two strictly increasing finite values`),a();const c=e.stations[0],l=e.stations[e.stations.length-1],h=e.pole==="both"?["bottom","top"]:e.pole===void 0?[]:[e.pole],p=h.map(D=>D==="bottom"?c:l),f=D=>h.length===2?Math.acos(Math.min(1,Math.max(-1,1-2*(D-c)/(l-c)))):h.length===1?(h[0]==="bottom"?1:-1)*Math.sqrt(Math.abs(D-p[0])):D,u=(D,O,k=!1)=>{const J=O.knots.map(rt=>rt.station);if(!o(J)||!O.knots.every(rt=>Number.isFinite(rt.value)))return s("outline",`${D}: knots ${O.knots.map(rt=>`${rt.site}@${rt.station}=${rt.value}`).join(", ")} are not finite by strictly increasing station`),null;if(!k||h.length===0){const rt=cn.create(J,O.knots.map(at=>at.value));return at=>cn.evaluate(rt,at)}for(const rt of h){const at=rt==="bottom"?O.knots[0]:O.knots[O.knots.length-1],lt=rt==="bottom"?c:l;if(at.station!==lt||at.value!==0)return s("pole knot",`${D}: its ${rt} knot ${at.site}@${at.station}=${at.value} is not 0 at the pole's station ${lt}`),null}const $=cn.create(J.map(f),O.knots.map(rt=>rt.value));return rt=>cn.evaluate($,f(rt))},d=(D,O)=>{if(O===void 0)return()=>[0,0,0,0];const k=O.map((J,$)=>u(`${D} ${$}`,J));return k.some(J=>J===null)?null:J=>k.map($=>$(J))},_=u("front positive",e.front.positive,!0),g=u("front negative",e.front.negative,!0),m=u("side positive",e.side.positive,!0),x=u("side negative",e.side.negative,!0),y=e.fullness,v=y.kind==="girth"?u("girth",y.girth,!0):y.kind==="shoulder"?u("shoulder",y.shoulder):()=>0,E=y.kind==="top"?d("top shoulder",y.shoulders):d("departure",y.departures);if(_===null||g===null||m===null||x===null||v===null||E===null)return a();const S=e.stations.filter(D=>!p.includes(D));let b=S;const M=[],w=[e.front.positive,e.front.negative,e.side.positive,e.side.negative].flatMap(D=>D.knots.map(O=>O.station)),A=(l-c)/(e.stations.length-1);for(const D of S.length>0?p:[]){const O=D===c?S[0]:S[S.length-1],J=[_(O),m(O),-g(O),-x(O)].reduce((lt,W)=>lt+W,0)/4,$=Math.max(0,Math.ceil(J/A)-1),rt=Array.from({length:$},(lt,W)=>{const j=(W+1)/($+1);return D+(O-D)*j*j});b=[...b,...rt];const at=Math.min(...w.filter(lt=>!p.includes(lt)).map(lt=>Math.abs(lt-D)));M.push(lt=>{const W=Math.min(1,Math.abs(lt-D)/at);return 1-W*W*W*(10-15*W+6*W*W)})}b.sort((D,O)=>D-O);const T=D=>Math.max(0,...M.map(O=>O(D))),L=(D,O)=>{const k=T(O);return k===0?D:D.map(J=>J+k*(di.ELLIPSE-J))},N=[];for(const D of b){const O=`station ${D} mm`,k=[_(D),m(D),g(D),x(D)];if(!(k[0]>k[2])||!(k[1]>k[3])){s("outline order",`${O}: an outline crosses its opposite (front ${k[0]} over ${k[2]} mm, side ${k[1]} over ${k[3]} mm)`);continue}const J=[k[0],k[1],-k[2],-k[3]];if(!J.every(at=>at>0)){s("half extent",`${O}: half extents [${J.join(", ")}] mm; the axis must lie strictly inside the box`);continue}const $={extents:J};let rt;if(y.kind==="girth"){const at=di.solve(`${r} ${O}`,$,v(D),E(D));n.push(...at.diagnostics),rt=at.section!==null&&T(D)>0?di.of($,L(at.section.shoulders,D)):at.section}else{const at=L(E(D).map(W=>y.kind==="top"?W:v(D)+W),D);if(!at.every(W=>W>0&&W<1)){s("shoulder",`${O}: shoulders [${at.join(", ")}] outside (0, 1)`);continue}rt=di.of($,at);const lt=di.fault(rt);lt!==null&&(s("view section",`${O}: shoulders [${at.join(", ")}] on the box [${J.join(", ")}] mm: ${lt}`),rt=null)}rt!==null&&N.push({station:D,frame:e.axis.at(D),section:rt})}if(N.length<2)return s("stations",`${N.length} of ${e.stations.length} stations carry a section; a chain needs two`),{...a(),sections:N};const P=e.order,C=N.map(D=>{const O=Array.from({length:P},($,rt)=>{const at=2*Math.PI*rt/P,lt=di.radius(D.section,at)[0];return[lt*Math.cos(at),lt*Math.sin(at)]}),k=ye.interpolate(O),J=D.section;return{y:D.station,frame:D.frame,coefficients:k,slopes:new Array(k.length).fill(0),view:{extents:[...J.box.extents],shoulders:[...J.shoulders],curvatures:J.guides.map($=>($.value-$.curvature)/($.value*$.value))}}}),U=h.map((D,O)=>({end:D,point:[...e.axis.at(p[O]).origin]})),F=ia.continuous({name:e.name,basis:"spline",order:P,rule:"polar",samples:e.samples,layers:C,...U[0]!==void 0?{pole:U[0]}:{},...U[1]!==void 0?{opposite:U[1]}:{}}),z=ra.surface(F);return z===null&&s("solid surface","the chain does not read as a solid surface (no jets or a degenerate middle section)"),{chain:F,surface:z,sections:N,diagnostics:n,continuity:Wu}}i.create=t})(Vu||(Vu={}));const Wu={phase:"C2",station:"C2"};function pc(i){const t=[1/0,1/0,1/0],e=[-1/0,-1/0,-1/0];for(const s of i)for(let a=0;a<3;a++)t[a]=Math.min(t[a],s.low[a]),e[a]=Math.max(e[a],s.high[a]);if(i.length<=12)return{low:t,high:e,triangles:i};let n=0;for(let s=1;s<3;s++)e[s]-t[s]>e[n]-t[n]&&(n=s);i.sort((s,a)=>s.centre[n]-a.centre[n]);const r=Math.floor(i.length/2);return{low:t,high:e,left:pc(i.slice(0,r)),right:pc(i.slice(r))}}function mc(i,t){if("triangles"in i){const a=i.triangles.map(t),o=[1/0,1/0,1/0],c=[-1/0,-1/0,-1/0];for(const l of a)for(let h=0;h<3;h++)o[h]=Math.min(o[h],l.low[h]),c[h]=Math.max(c[h],l.high[h]);return{low:o,high:c,triangles:a}}const e=mc(i.left,t),n=mc(i.right,t),r=[0,1,2].map(a=>Math.min(e.low[a],n.low[a])),s=[0,1,2].map(a=>Math.max(e.high[a],n.high[a]));return{low:r,high:s,left:e,right:n}}var Xu;(i=>{function t(r){return ho(r.positions,nu(r,"Mesh crossings (complete triangle buffers)"))}i.index=t;function e(r){const s=Object.freeze(nu(r,"Mesh crossings (complete triangle buffers)").slice()),a=ho(r.positions,s);return{positionCount:r.positions.length,indices:s,triangles:a,hierarchy:a.length===0?void 0:pc([...a])}}i.prepare=e;function n(r,s){if(s.length!==r.positionCount)throw new Error("Mesh crossing refit needs the original XYZ position cardinality.");const a=ho(s,r.indices);return{positionCount:r.positionCount,indices:r.indices,triangles:a,hierarchy:r.hierarchy===void 0?void 0:mc(r.hierarchy,o=>a[o.ordinal])}}i.withPositions=n})(Xu||(Xu={}));function ho(i,t){for(let r=0;r<i.length;r++)if(!Number.isFinite(i[r]))throw new Error("Mesh crossings need finite complete triangle buffers.");const e=r=>[i[r*3],i[r*3+1],i[r*3+2]],n=[];for(let r=0;r<t.length;r+=3){const s=e(t[r]),a=e(t[r+1]),o=e(t[r+2]),c=[0,1,2].map(h=>Math.min(s[h],a[h],o[h])),l=[0,1,2].map(h=>Math.max(s[h],a[h],o[h]));n.push({ordinal:r/3,corners:[s,a,o],low:c,high:l,centre:[0,1,2].map(h=>c[h]/2+l[h]/2)})}return n}const rr=1e-4,$u=64,wv=10,Or=16;var qu;(i=>{i.BOUND=.1;function t(f,u,d,_,g,m){if(d<3&&_===0){for(let v=0;v<d;++v)g[v]=0;return 0}if(d<2)return d===1&&(g[0]=0),0;if(n(f,u,d,_,0,g,m))return 0;let x=0,y=.5;for(;!n(f,u,d,_,y,g,m);){if(x=y,y>=$u)return y;y=Math.min($u,2*y)}for(let v=0;v<wv;++v){const E=(x+y)/2;n(f,u,d,_,E,g,m)?y=E:x=E}return c(f,u,d,_,y,g,m),y}i.fit=t;function e(f,u,d,_,g,m,x){if(_===1)return u[0];const y=f[0],v=f[_-1];let E=x;if(g!==0)E=((E-y)%g+g)%g+y;else{if(E<=y)return u[0];if(E>=v)return u[_-1]}let S=0,b=_-1;if(E>=v)S=_-1;else for(;b-S>1;){const M=S+b>>1;f[M]<=E?S=M:b=M}return r(f,u,d,_,g,m,S,(E-f[S])/s(f,_,g,S))}i.evaluate=e;function n(f,u,d,_,g,m,x){return c(f,u,d,_,g,m,x),h(f,u,m,d,_,g,x)}function r(f,u,d,_,g,m,x,y){const v=(x+1)%_,E=s(f,_,g,x),S=u[x],b=u[v],M=d[x],w=d[v];if(m<rr){const T=1-y;return T*S+y*b+E*E/6*(M*(T*T*T-T)+w*(y*y*y-y))}const A=E*E/(m*m);return A*(M*Math.sinh(m*(1-y))+w*Math.sinh(m*y))/Math.sinh(m)+(S-M*A)*(1-y)+(b-w*A)*y}function s(f,u,d,_){return _<u-1?f[_+1]-f[_]:f[0]+d-f[u-1]}function a(f,u){return u<rr?f/3:f*(Math.cosh(u)/(u*Math.sinh(u))-1/(u*u))}function o(f,u){return u<rr?f/6:f*(1/(u*u)-1/(u*Math.sinh(u)))}function c(f,u,d,_,g,m,x){const y=_===0?d-1:d,v=_===0?1:0,E=_===0?d-2:d;for(let T=0;T<E;++T){const L=v+T,N=(L+y-1)%y,P=L%y,C=s(f,d,_,N),U=s(f,d,_,P);x[T]=o(C,g),x[d+T]=a(C,g)+a(U,g),x[2*d+T]=o(U,g),x[3*d+T]=(u[(P+1)%d]-u[P])/U-(u[(N+1)%d]-u[N])/C}if(_===0){m[0]=0,m[d-1]=0,l(E,d,3*d,x,m,1);return}if(d===2){const T=x[d],L=x[0]+x[2*d],N=x[1]+x[2*d+1],P=x[d+1],C=T*P-L*N;m[0]=(x[3*d]*P-L*x[3*d+1])/C,m[1]=(T*x[3*d+1]-N*x[3*d])/C;return}const S=x[0],b=x[2*d+d-1],M=-x[d];x[d]=x[d]-M,x[2*d-1]=x[2*d-1]-b*S/M,l(d,d,3*d,x,m,0);for(let T=0;T<d;++T)x[3*d+T]=T===0?M:T===d-1?b:0;l(d,d,3*d,x,x,6*d);const w=6*d,A=(m[0]+S*m[d-1]/M)/(1+x[w]+S*x[w+d-1]/M);for(let T=0;T<d;++T)m[T]=m[T]-A*x[w+T]}function l(f,u,d,_,g,m){if(f<=0)return;const x=4*u,y=5*u;_[x]=_[2*u]/_[u],_[y]=_[d]/_[u];for(let v=1;v<f;++v){const E=_[u+v]-_[v]*_[x+v-1];_[x+v]=_[2*u+v]/E,_[y+v]=(_[d+v]-_[v]*_[y+v-1])/E}g[m+f-1]=_[y+f-1];for(let v=f-2;v>=0;--v)g[m+v]=_[y+v]-_[x+v]*g[m+v+1]}function h(f,u,d,_,g,m,x){const y=g===0?_-1:_,v=7*_;for(let E=0;E<=Or;++E)x[v+E]=m<rr?0:Math.sinh(m*E/Or)/Math.sinh(m);for(let E=0;E<y;++E){const S=(E+1)%_,b=Math.min(u[E],u[S]),M=Math.max(u[E],u[S]);let w=0;for(let N=E-2;N<=E+2;++N)w=Math.max(w,p(u,_,y,g,N));const A=i.BOUND*w,T=s(f,_,g,E),L=m<rr?T*T/6:T*T/(m*m);for(let N=1;N<Or;++N){const P=N/Or,C=1-P,U=m<rr?C*u[E]+P*u[S]+L*(d[E]*(C*C*C-C)+d[S]*(P*P*P-P)):L*(d[E]*x[v+Or-N]+d[S]*x[v+N])+(u[E]-d[E]*L)*C+(u[S]-d[S]*L)*P;if(U>M+A||U<b-A)return!1}}return!0}function p(f,u,d,_,g){return _===0&&(g<0||g>=d)?0:Math.abs(f[((g+1)%u+u)%u]-f[(g%u+u)%u])}})(qu||(qu={}));var Yu;(i=>{i.multiply=(t,e,n,r,s,a)=>{const o=t[e],c=t[e+1],l=t[e+2],h=t[e+3],p=n[r],f=n[r+1],u=n[r+2],d=n[r+3];s[a]=h*p+o*d+c*u-l*f,s[a+1]=h*f-o*u+c*d+l*p,s[a+2]=h*u+o*f-c*p+l*d,s[a+3]=h*d-o*p-c*f-l*u},i.normalize=(t,e)=>{const n=Math.hypot(t[e],t[e+1],t[e+2],t[e+3]);if(n===0){t[e]=0,t[e+1]=0,t[e+2]=0,t[e+3]=1;return}for(let r=0;r<4;++r)t[e+r]=t[e+r]/n},i.conjugate=(t,e,n,r)=>{const s=t[e],a=t[e+1],o=t[e+2];n[r+3]=t[e+3],n[r]=-s,n[r+1]=-a,n[r+2]=-o},i.fromBasis=(t,e,n,r,s,a)=>{const o=t[e],c=t[e+1],l=t[e+2],h=t[n],p=t[n+1],f=t[n+2],u=t[r],d=t[r+1],_=t[r+2],g=o+p+_;if(g>0){const m=Math.sqrt(g+1)*2;s[a+3]=m/4,s[a]=(f-d)/m,s[a+1]=(u-l)/m,s[a+2]=(c-h)/m}else if(o>p&&o>_){const m=Math.sqrt(1+o-p-_)*2;s[a+3]=(f-d)/m,s[a]=m/4,s[a+1]=(h+c)/m,s[a+2]=(u+l)/m}else if(p>_){const m=Math.sqrt(1+p-o-_)*2;s[a+3]=(u-l)/m,s[a]=(h+c)/m,s[a+1]=m/4,s[a+2]=(d+f)/m}else{const m=Math.sqrt(1+_-o-p)*2;s[a+3]=(c-h)/m,s[a]=(u+l)/m,s[a+1]=(d+f)/m,s[a+2]=m/4}(0,i.normalize)(s,a)},i.rotate=(t,e,n,r,s,a)=>{const o=t[e],c=t[e+1],l=t[e+2],h=t[e+3],p=n[r],f=n[r+1],u=n[r+2],d=2*(c*u-l*f),_=2*(l*p-o*u),g=2*(o*f-c*p);s[a]=p+h*d+(c*g-l*_),s[a+1]=f+h*_+(l*d-o*g),s[a+2]=u+h*g+(o*_-c*d)},i.slerp=(t,e,n,r,s,a,o)=>{const c=t[e],l=t[e+1],h=t[e+2],p=t[e+3];let f=n[r],u=n[r+1],d=n[r+2],_=n[r+3],g=c*f+l*u+h*d+p*_;if(g<0&&(g=-g,f=-f,u=-u,d=-d,_=-_),g>Xf){a[o]=c+(f-c)*s,a[o+1]=l+(u-l)*s,a[o+2]=h+(d-h)*s,a[o+3]=p+(_-p)*s,(0,i.normalize)(a,o);return}const m=Math.acos(g),x=Math.sin(m),y=Math.sin((1-s)*m)/x,v=Math.sin(s*m)/x;a[o]=c*y+f*v,a[o+1]=l*y+u*v,a[o+2]=h*y+d*v,a[o+3]=p*y+_*v}})(Yu||(Yu={}));var Ku;(i=>{i.slope=(n,r,s,a,o)=>{if(s<2){s===1&&(o[0]=0);return}const c=a===0?s-1:s;for(let l=0;l<s;++l){const h=l>0?e(n,r,s,a,l-1):a!==0?e(n,r,s,a,c-1):NaN,p=l<c?e(n,r,s,a,l):NaN;Number.isNaN(h)?o[l]=p:Number.isNaN(p)?o[l]=h:o[l]=h*p<=0?0:(h+p)/2}for(let l=0;l<c;++l){const h=(l+1)%s,p=e(n,r,s,a,l);if(p===0){o[l]=0,o[h]=0;continue}const f=o[l]/p,u=o[h]/p;f<0&&(o[l]=0),u<0&&(o[h]=0);const d=Math.hypot(Math.max(0,f),Math.max(0,u));if(d>3){const _=3/d;o[l]=_*Math.max(0,f)*p,o[h]=_*Math.max(0,u)*p}}},i.evaluate=(n,r,s,a,o,c)=>{if(a===1)return r[0];const l=n[0],h=n[a-1];let p=c;if(o!==0)p=((p-l)%o+o)%o+l;else{if(p<=l)return r[0];if(p>=h)return r[a-1]}let f=0,u=a-1;if(p>=h)f=a-1;else for(;u-f>1;){const v=f+u>>1;n[v]<=p?f=v:u=v}const d=f,_=(d+1)%a,g=t(n,a,o,d),m=(p-n[d])/g,x=m*m,y=x*m;return(2*y-3*x+1)*r[d]+(y-2*x+m)*g*s[d]+(-2*y+3*x)*r[_]+(y-x)*g*s[_]};const t=(n,r,s,a)=>a<r-1?n[a+1]-n[a]:n[0]+s-n[r-1],e=(n,r,s,a,o)=>(r[(o+1)%s]-r[o])/t(n,s,a,o)})(Ku||(Ku={}));var Zu;(i=>{function t(s){if(!Array.isArray(s)||s.length!==3)throw new Error("matrix3: finite three-coordinate cross-product operand required");for(let a=0;a<3;a++)if(!Number.isFinite(s[a]))throw new Error("matrix3: finite three-coordinate cross-product operand required");return[0,-s[2],s[1],s[2],0,-s[0],-s[1],s[0],0]}i.skew=t;function e(s,a){if(!Array.isArray(s)||!Array.isArray(a)||s.length!==9||a.length!==9)throw new Error("matrix3: two complete finite row-major matrices required");for(let c=0;c<9;c++)if(!Number.isFinite(s[c])||!Number.isFinite(a[c]))throw new Error("matrix3: two complete finite row-major matrices required");const o=new Array(9).fill(0);for(let c=0;c<3;c++)for(let l=0;l<3;l++)for(let h=0;h<3;h++)o[3*c+l]+=s[3*c+h]*a[3*h+l];if(!o.every(Number.isFinite))throw new Error("matrix3: product is not representable");return o}i.multiply=e;function n(s){if(!Array.isArray(s)||s.length!==9)throw new Error("matrix3: complete finite row-major matrix required");for(let a=0;a<9;a++)if(!Number.isFinite(s[a]))throw new Error("matrix3: complete finite row-major matrix required");return[s[0],s[3],s[6],s[1],s[4],s[7],s[2],s[5],s[8]]}i.transpose=n;function r(s,a){if(!Array.isArray(s)||!Array.isArray(a)||s.length!==9||a.length!==3)throw new Error("matrix3: complete finite matrix and three-coordinate vector required");for(let c=0;c<9;c++)if(!Number.isFinite(s[c]))throw new Error("matrix3: complete finite matrix and three-coordinate vector required");for(let c=0;c<3;c++)if(!Number.isFinite(a[c]))throw new Error("matrix3: complete finite matrix and three-coordinate vector required");const o=[s[0]*a[0]+s[1]*a[1]+s[2]*a[2],s[3]*a[0]+s[4]*a[1]+s[5]*a[2],s[6]*a[0]+s[7]*a[1]+s[8]*a[2]];if(!o.every(Number.isFinite))throw new Error("matrix3: vector product is not representable");return o}i.apply=r})(Zu||(Zu={}));const Tv=["Shoulder","UpperArm","LowerArm","Hand","ThumbMetacarpal","ThumbProximal","ThumbDistal","IndexProximal","IndexIntermediate","IndexDistal","MiddleProximal","MiddleIntermediate","MiddleDistal","RingProximal","RingIntermediate","RingDistal","LittleProximal","LittleIntermediate","LittleDistal"],Av=["UpperLeg","LowerLeg","Foot","Toes"],Rv=Tv.slice(3),fi={sign:-1,neutral:0};(()=>{const i={},t=(e,n,r)=>{const s=e;i[s]={...i[s],[n]:r}};for(const e of["Shoulder","UpperArm","LowerArm"])t(`left${e}`,"flexion",fi),t(`right${e}`,"abduction",fi);t("leftUpperArm","twist",fi),t("rightUpperArm","twist",fi);for(const e of Rv)t(`left${e}`,"flexion",fi),t(`left${e}`,"abduction",fi);for(const e of Av)t(`right${e}`,"abduction",fi),t(`right${e}`,"twist",fi);return t("leftUpperArm","abduction",{sign:1,neutral:90}),t("rightUpperArm","abduction",{sign:-1,neutral:90}),i})();const Cv={up:"eyeLookUpLeft",down:"eyeLookDownLeft",in:"eyeLookInLeft",out:"eyeLookOutLeft"},Pv={up:"eyeLookUpRight",down:"eyeLookDownRight",in:"eyeLookInRight",out:"eyeLookOutRight"};[...Object.values(Cv),...Object.values(Pv)];const Et=(i,t)=>({bone:i,flexion:t.flexion??null,abduction:t.abduction??null,twist:t.twist??null});Et("spine",{flexion:0}),Et("head",{flexion:0}),Et("spine",{flexion:50}),Et("head",{flexion:15}),Et("spine",{flexion:50}),Et("head",{flexion:15}),Et("spine",{flexion:0}),Et("head",{flexion:0}),Et("head",{flexion:0}),Et("head",{flexion:22}),Et("head",{flexion:2}),Et("head",{flexion:22}),Et("head",{flexion:0}),Et("head",{twist:0}),Et("head",{twist:30}),Et("head",{twist:-30}),Et("head",{twist:30}),Et("head",{twist:0}),zs(0),zs(1),zs(1),zs(0),Et("rightUpperLeg",{flexion:55}),Et("rightLowerLeg",{flexion:75}),Et("spine",{flexion:-6}),Et("rightUpperLeg",{flexion:68}),Et("rightLowerLeg",{flexion:6}),Et("spine",{flexion:-8}),Et("rightUpperLeg",{flexion:52}),Et("rightLowerLeg",{flexion:72}),Et("spine",{flexion:-5}),Et("spine",{flexion:18,abduction:24}),Et("rightUpperLeg",{flexion:30}),Et("rightLowerLeg",{flexion:22}),Et("spine",{flexion:6,abduction:-20}),Et("leftUpperLeg",{flexion:24}),Et("leftLowerLeg",{flexion:16}),Et("spine",{flexion:8,abduction:6}),Bs(0),Bs(55),Bs(12),Bs(55),po(1),po(1.1),po(1),Ju(),Ju(),Et("leftUpperArm",{flexion:86,abduction:8}),Et("rightUpperArm",{abduction:70,flexion:34}),Et("rightLowerArm",{flexion:30}),Et("rightUpperArm",{abduction:92,flexion:-46}),Et("rightLowerArm",{flexion:108}),Et("leftUpperArm",{abduction:18,flexion:62}),Et("leftLowerArm",{flexion:16}),Et("spine",{flexion:-8,twist:-22}),Et("rightUpperArm",{abduction:104,flexion:60}),Et("rightLowerArm",{flexion:16}),Et("leftUpperArm",{abduction:24,flexion:-22}),Et("leftLowerArm",{flexion:24}),Et("spine",{flexion:16,twist:16}),Et("rightUpperArm",{abduction:62,flexion:30}),Et("rightLowerArm",{flexion:36}),Et("leftUpperArm",{abduction:20,flexion:-10}),Et("spine",{flexion:12,twist:4});function po(i){return[Et("leftUpperArm",{abduction:150*i,flexion:10}),Et("rightUpperArm",{abduction:150*i,flexion:10})]}function Ju(){return[Et("leftUpperArm",{flexion:88,abduction:8}),Et("leftLowerArm",{flexion:8}),Et("rightUpperArm",{abduction:84,flexion:24}),Et("rightLowerArm",{flexion:118}),Et("head",{twist:12})]}function Bs(i){return[Et("rightUpperArm",{abduction:132,flexion:6}),Et("rightLowerArm",{flexion:i}),Et("leftUpperArm",{abduction:14})]}function zs(i){return[Et("leftUpperLeg",{flexion:55*i}),Et("rightUpperLeg",{flexion:55*i}),Et("leftLowerLeg",{flexion:65*i}),Et("rightLowerLeg",{flexion:65*i}),Et("spine",{flexion:15*i})]}(()=>{const i=new Uint32Array(256);for(let t=0;t<256;++t){let e=t;for(let n=0;n<8;++n)e=e&1?3988292384^e>>>1:e>>>1;i[t]=e>>>0}return i})();var Ue;(i=>{i.STRIDE=24,i.GPU_RELATIVE_ERROR=2**-18;function t(a,o,c,l,h,p,f,u,d,_,g,m,x,y,v){let E=o,S=p;f>S&&(S=f,E=c),u>S&&(S=u,E=l),d>S&&(E=h);const b=ks(a,o,E)*p,M=ks(a,c,E)*f,w=ks(a,l,E)*u,A=ks(a,h,E)*d;let T=b*a[o+16]+M*a[c+16]+w*a[l+16]+A*a[h+16],L=b*a[o+17]+M*a[c+17]+w*a[l+17]+A*a[h+17],N=b*a[o+18]+M*a[c+18]+w*a[l+18]+A*a[h+18],P=b*a[o+19]+M*a[c+19]+w*a[l+19]+A*a[h+19],C=b*a[o+20]+M*a[c+20]+w*a[l+20]+A*a[h+20],U=b*a[o+21]+M*a[c+21]+w*a[l+21]+A*a[h+21],F=b*a[o+22]+M*a[c+22]+w*a[l+22]+A*a[h+22],z=b*a[o+23]+M*a[c+23]+w*a[l+23]+A*a[h+23];const D=Math.sqrt(T*T+L*L+N*N+P*P);T/=D,L/=D,N/=D,P/=D,C/=D,U/=D,F/=D,z/=D;const O=L*m-N*g+P*_,k=N*_-T*m+P*g,J=T*g-L*_+P*m;let $=_+2*(L*J-N*k),rt=g+2*(N*O-T*J),at=m+2*(T*k-L*O);x&&($+=2*(P*C-z*T+(L*F-N*U)),rt+=2*(P*U-z*L+(N*C-T*F)),at+=2*(P*F-z*N+(T*U-L*C))),y[v]=$,y[v+1]=rt,y[v+2]=at}i.dual=t;function e(a,o,c,l,h,p,f,u,d,_,g,m,x,y){x[y]=sn(a,o,0,_,g,m)*p+sn(a,c,0,_,g,m)*f+sn(a,l,0,_,g,m)*u+sn(a,h,0,_,g,m)*d,x[y+1]=sn(a,o,1,_,g,m)*p+sn(a,c,1,_,g,m)*f+sn(a,l,1,_,g,m)*u+sn(a,h,1,_,g,m)*d,x[y+2]=sn(a,o,2,_,g,m)*p+sn(a,c,2,_,g,m)*f+sn(a,l,2,_,g,m)*u+sn(a,h,2,_,g,m)*d}i.linear=e;function n(a,o){const c=new Set;for(let l=0;l<a.count;++l)o.getX(l)!==0&&c.add(a.getX(l)),o.getY(l)!==0&&c.add(a.getY(l)),o.getZ(l)!==0&&c.add(a.getZ(l)),o.getW(l)!==0&&c.add(a.getW(l));return Int32Array.from([...c].sort((l,h)=>l-h))}i.usedJoints=n;function r(a,o){return a instanceof fn&&!a.normalized&&a.itemSize===o?a.array:null}i.packed=r;function s(a){return a instanceof Cc?a.data.version:a.version}i.versionOf=s})(Ue||(Ue={}));function sn(i,t,e,n,r,s){return i[t+e]*n+i[t+4+e]*r+i[t+8+e]*s+i[t+12+e]}function ks(i,t,e){return i[t+16]*i[e+16]+i[t+17]*i[e+17]+i[t+18]*i[e+18]+i[t+19]*i[e+19]<0?-1:1}class Ri{constructor(t){qe(this,"posed",new Float32Array(0));qe(this,"extent",new Sn);qe(this,"radius",0);qe(this,"largest",0);qe(this,"source",null);qe(this,"stale",!0);qe(this,"used",new Int32Array(0));qe(this,"key",new Float64Array(0));qe(this,"rest",{geometry:null,version:"",centre:new K,radius:0,used:new Int32Array(0)});this.mesh=t}invalidate(){this.stale=!0}reset(){this.source=null,this.rest.geometry=null,this.stale=!0}evaluate(){const t=this.mesh,e=t.geometry;if(this.source===e&&!this.stale)return;const n=e.attributes.skinIndex,r=e.attributes.skinWeight,s=e.attributes.position,a=s.count;this.source!==e&&(this.used=Ue.usedJoints(n,r));const o=Ri.table(t.skeleton.bones.length),c=t.morphTargetInfluences??[],l=3+c.length+16*this.used.length,h=this.key.length===l&&this.source===e?this.key:new Float64Array(l);let p=h===this.key;const f=(C,U)=>{h[C]!==U&&(h[C]=U,p=!1)};f(0,Ue.versionOf(s)),f(1,n.version),f(2,r.version),c.forEach((C,U)=>f(3+U,C));let u=3+c.length;for(const C of this.used){Ri.joint(t,C,o,C*Ae);for(let U=0;U<16;++U)f(u++,o[C*Ae+U])}if(this.key=h,this.stale=!1,p&&this.source===e)return;this.source=e,this.posed.length!==a*3&&(this.posed=new Float32Array(a*3));const d=e.morphAttributes.position!==void 0&&c.some(C=>C!==0),_=tn.prototype.getVertexPosition,g=t.method==="dual-quaternion",m=this.posed,x=Ue.packed(s,3),y=Ue.packed(n,4),v=Ue.packed(r,4);let E=1/0,S=1/0,b=1/0,M=-1/0,w=-1/0,A=-1/0;for(let C=0;C<a;++C){let U,F,z;d?(_.call(t,C,ar),U=ar.x,F=ar.y,z=ar.z):x!==null?(U=x[C*3],F=x[C*3+1],z=x[C*3+2]):(U=s.getX(C),F=s.getY(C),z=s.getZ(C));const D=(y!==null?y[C*4]:n.getX(C))*Ae,O=(y!==null?y[C*4+1]:n.getY(C))*Ae,k=(y!==null?y[C*4+2]:n.getZ(C))*Ae,J=(y!==null?y[C*4+3]:n.getW(C))*Ae,$=v!==null?v[C*4]:r.getX(C),rt=v!==null?v[C*4+1]:r.getY(C),at=v!==null?v[C*4+2]:r.getZ(C),lt=v!==null?v[C*4+3]:r.getW(C);g?Ue.dual(o,D,O,k,J,$,rt,at,lt,U,F,z,!0,m,C*3):Ue.linear(o,D,O,k,J,$,rt,at,lt,U,F,z,m,C*3);const W=m[C*3],j=m[C*3+1],ot=m[C*3+2];W<E&&(E=W),W>M&&(M=W),j<S&&(S=j),j>w&&(w=j),ot<b&&(b=ot),ot>A&&(A=ot)}a===0?this.extent.makeEmpty():(this.extent.min.set(E,S,b),this.extent.max.set(M,w,A));const T=(E+M)/2,L=(S+w)/2,N=(b+A)/2;let P=0;for(let C=0;C<m.length;C+=3){const U=m[C]-T,F=m[C+1]-L,z=m[C+2]-N,D=U*U+F*F+z*z;D>P&&(P=D)}this.radius=a===0?0:Math.sqrt(P),this.largest=a===0?0:Math.max(-E,M,-S,w,-b,A,0)}enclose(t){const e=this.mesh,n=e.geometry,r=n.attributes.position,s=n.attributes.skinIndex,a=n.attributes.skinWeight;if(n.morphAttributes.position!==void 0&&(e.morphTargetInfluences??[]).some(d=>d!==0))return!1;if(r.count===0)return t.makeEmpty(),!0;const o=`${Ue.versionOf(r)}:${s.version}:${a.version}`;if(this.rest.geometry!==n||this.rest.version!==o){const d=new Sn;for(let m=0;m<r.count;++m)d.expandByPoint(ar.fromBufferAttribute(r,m));const _=d.getCenter(new K);let g=0;for(let m=0;m<r.count;++m)g=Math.max(g,_.distanceToSquared(ar.fromBufferAttribute(r,m)));this.rest={geometry:n,version:o,centre:_,radius:Math.sqrt(g),used:Ue.usedJoints(s,a)}}const c=this.rest.used,l=Ri.table(e.skeleton.bones.length),h=[];for(const d of c)Ri.joint(e,d,l,d*Ae),sr.fromArray(l,d*Ae),h.push(this.rest.centre.clone().applyMatrix4(sr));let p=0,f=1/0;if(h.forEach((d,_)=>{let g=0;for(const m of h)g=Math.max(g,d.distanceTo(m));g<f&&(f=g,p=_)}),h.length===0)return!1;if(e.method==="dual-quaternion"){let d=1;for(const _ of c)for(const g of c){const m=Math.abs(l[_*Ae+16]*l[g*Ae+16]+l[_*Ae+17]*l[g*Ae+17]+l[_*Ae+18]*l[g*Ae+18]+l[_*Ae+19]*l[g*Ae+19]);m<d&&(d=m)}if(!(d>Iv))return!1;f/=d}t.center.copy(h[p]);const u=this.rest.radius+f;return t.radius=u+(t.center.length()+u)*Ue.GPU_RELATIVE_ERROR,!0}static joint(t,e,n,r){const s=t.skeleton.bones[e];sr.multiplyMatrices(s===void 0?Qu:s.matrixWorld,t.skeleton.boneInverses[e]??Qu),sr.premultiply(t.bindMatrixInverse).multiply(t.bindMatrix);const a=sr.elements;for(let d=0;d<16;++d)n[r+d]=a[d];if(t.method!=="dual-quaternion")return;ju.setFromRotationMatrix(sr);const o=a[12],c=a[13],l=a[14],{x:h,y:p,z:f,w:u}=ju;n[r+16]=h,n[r+17]=p,n[r+18]=f,n[r+19]=u,n[r+20]=.5*(o*u+c*f-l*p),n[r+21]=.5*(-o*f+c*u+l*h),n[r+22]=.5*(o*p-c*h+l*u),n[r+23]=.5*(-o*h-c*p-l*f)}static table(t){return mo.length<t*Ae&&(mo=new Float64Array(t*Ae)),mo}}const Ae=Ue.STRIDE,Iv=.25;let mo=new Float64Array(0);const Qu=new Kt,sr=new Kt,ju=new Ui,ar=new K;class qf extends Cd{constructor(e,n,r="linear"){super(e,n);qe(this,"method");qe(this,"cpu",new Ri(this));this.method=r}tolerance(){return this.cpu.evaluate(),this.cpu.largest*Ue.GPU_RELATIVE_ERROR}invalidatePose(){this.cpu.invalidate(),qf.clearBounds(this)}static clearBounds(e){const n=e;n.boundingBox=null,n.boundingSphere=null}getVertexPosition(e,n){return this.cpu.evaluate(),n.fromArray(this.cpu.posed,e*3)}applyBoneTransform(e,n){if(this.method!=="dual-quaternion")return super.applyBoneTransform(e,n);ef.fromBufferAttribute(this.geometry.attributes.skinIndex,e),Br.fromBufferAttribute(this.geometry.attributes.skinWeight,e);for(let s=0;s<4;++s)Ri.joint(this,ef.getComponent(s),tf,s*Gr);const r=!(n instanceof Yt)||n.w!==0;return Ue.dual(tf,0,Gr,2*Gr,3*Gr,Br.x,Br.y,Br.z,Br.w,n.x,n.y,n.z,r,Gs,0),n.x=Gs[0],n.y=Gs[1],n.z=Gs[2],n}computeBoundingBox(){this.cpu.evaluate();const n=(this.boundingBox??new Sn).copy(this.cpu.extent);n.isEmpty()||n.expandByScalar(this.tolerance()),this.boundingBox=n}computeBoundingSphere(){const e=this.boundingSphere??new Qn;this.cpu.enclose(e)||(this.cpu.evaluate(),this.cpu.extent.isEmpty()?e.makeEmpty():(this.cpu.extent.getCenter(e.center),e.radius=this.cpu.radius+this.tolerance())),this.boundingSphere=e}raycast(e,n){const r=this;r.boundingSphere===null&&this.computeBoundingSphere(),nf.copy(this.boundingSphere).applyMatrix4(this.matrixWorld),e.ray.intersectsSphere(nf)&&(r.boundingBox===null&&this.computeBoundingBox(),super.raycast(e,n))}copy(e,n){return super.copy(e,n),this.method=e.method,this.cpu.reset(),this.invalidatePose(),this}}const Gr=Ue.STRIDE,tf=new Float64Array(4*Gr),Gs=new Float64Array(3),ef=new Yt,Br=new Yt,nf=new Qn;[...tv,...j_];const rf=new WeakMap,Lv=i=>{const t=rf.get(i);t!==void 0&&(t.dispose(),rf.delete(i))},gc=i=>{let t=!1,e;return()=>{if(t){if(e!==void 0)throw e.error;return}t=!0;try{i()}catch(n){throw e={error:n},n}}},Dv=(i,t)=>{if(!("isWebGLRenderTarget"in t)||t.isWebGLRenderTarget!==!0)throw new Error("A retained cube shadow target must be a native WebGL render target.");if(t.depthTexture!==null&&t.depthTexture.version===0)throw new Error("An uninitialized cube depth cannot be queried as a retained native shadow draw product.");const e=Wf(i),n=i.getContext();let r=null,s;try{i.setRenderTarget(t,0,0),n.getFramebufferAttachmentParameter(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE)===n.TEXTURE&&(r=n.getFramebufferAttachmentParameter(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME))}catch(a){s={error:a}}return s===void 0?je([e]):je([e],s),r},Nv=(i,t)=>{const e=Wf(i),n=i.getContext();je([()=>{n.isTexture(t)&&n.deleteTexture(t)},()=>{i.resetState()},e])},Uv=(i,t)=>{rc(i,t);const e=new Set,n=new Set,r=[],s=[],a=new Set;i.traverse(c=>{if(c.isLight!==!0)return;const l=c.shadow;if(l!==void 0){s.push(l);for(const h of[l.map,l.mapPass])h!==null&&(a.add(h),e.add(h),h.depthTexture!==null&&e.add(h.depthTexture))}});const o=t.getRenderTarget();if(o!==null&&(a.has(o)||o.depthTexture!==null&&e.has(o.depthTexture)))throw new Error("Cannot retire shadow attachments borrowed by the caller's current render destination.");for(const c of a){if("isWebGLCubeRenderTarget"in c&&c.isWebGLCubeRenderTarget===!0&&c.depthTexture!==null&&c.depthTexture.version!==0)try{const l=Dv(t,c);l!==null&&n.add(l)}catch(l){r.push(l)}c.depthTexture=null}for(const c of s)c.map=null,c.mapPass=null,c.needsUpdate=!0;rc(i,t,{resources:[...e],nativeDepth:[...n],run:()=>je([...r.map(c=>()=>{throw c}),...Array.from(e,c=>()=>{c.dispose()}),...Array.from(n,c=>()=>{Nv(t,c)})])})};function Fv(){let i=0,t;const e=n=>{if(!Number.isFinite(n)||n<0)throw new Error("A completed display clock requires finite nonnegative seconds.")};return{current:()=>i,run:(n,r)=>{e(n);const s=t;t=n;try{r()}finally{t=s}},complete:n=>{const r=n??t??i;return e(r),i=r,i}}}function Ov(i){const t=()=>{if(!(i instanceof Me||i instanceof dr)||i.parent!==null||!i.matrixAutoUpdate||!i.matrixWorldAutoUpdate)throw new Error("Camera transfer requires a detached auto-updating Perspective/Orthographic camera.");return i};return{capture:()=>{const r=t(),s=r.clone();if(s.updateProjectionMatrix(),!s.projectionMatrix.elements.every((a,o)=>a===r.projectionMatrix.elements[o]))throw new Error("A custom projection requires its original projection owner.");return{type:r.type,position:r.position.toArray(),quaternion:r.quaternion.toArray(),scale:r.scale.toArray(),up:r.up.toArray(),layers:r.layers.mask,projection:r.projectionMatrix.toArray(),view:r.view===null?null:{...r.view},lens:r instanceof Me?{kind:"perspective",fov:r.fov,aspect:r.aspect,near:r.near,far:r.far,zoom:r.zoom,filmGauge:r.filmGauge,filmOffset:r.filmOffset,focus:r.focus}:{kind:"orthographic",left:r.left,right:r.right,top:r.top,bottom:r.bottom,near:r.near,far:r.far,zoom:r.zoom}}},restore:r=>{const s=t();if(r===null||typeof r!="object"||Reflect.get(r,"type")!==s.type)throw new Error("Camera transfer changed camera type.");const a=(y,v)=>{const E=Reflect.get(r,y);if(!Array.isArray(E)||E.length!==v||!E.every(S=>typeof S=="number"&&Number.isFinite(S)))throw new Error("Camera transfer has no finite "+y+".");return E},o=a("position",3),c=a("quaternion",4),l=a("scale",3),h=a("up",3),p=a("projection",16),f=new Kt().fromArray(p).determinant();if(!(Math.hypot(...c)>0)||!(Math.hypot(...h)>0)||l.some(y=>y===0)||f===0||!Number.isFinite(f))throw new Error("Camera transfer has a degenerate pose/projection.");const u=Reflect.get(r,"layers");if(typeof u!="number"||!Number.isInteger(u)||u<-2147483648||u>4294967295)throw new Error("Camera transfer has no valid layer mask.");const d=Reflect.get(r,"lens");if(d===null||typeof d!="object")throw new Error("Camera transfer has no lens.");const _=y=>{const v=Reflect.get(d,y);if(typeof v!="number"||!Number.isFinite(v))throw new Error("Camera transfer has no finite "+y+".");return v},g=s.clone();if(g instanceof Me){if(Reflect.get(d,"kind")!=="perspective")throw new Error("Camera transfer changed projection type.");const[y,v,E,S,b,M,w,A]=["fov","aspect","near","far","zoom","filmGauge","filmOffset","focus"].map(_);if(!(y>0&&y<180&&v>0&&E>0&&S>E&&b>0&&M>0&&A>0))throw new Error("Camera transfer lens is invalid.");Object.assign(g,{fov:y,aspect:v,near:E,far:S,zoom:b,filmGauge:M,filmOffset:w,focus:A})}else{if(Reflect.get(d,"kind")!=="orthographic")throw new Error("Camera transfer changed projection type.");const[y,v,E,S,b,M,w]=["left","right","top","bottom","near","far","zoom"].map(_);if(!(v>y&&E>S&&b>=0&&M>b&&w>0))throw new Error("Camera transfer lens is invalid.");Object.assign(g,{left:y,right:v,top:E,bottom:S,near:b,far:M,zoom:w})}const m=Reflect.get(r,"view");if(m!==null){if(typeof m!="object")throw new Error("Camera transfer has no view offset.");const y=Reflect.get(m,"enabled"),v=["fullWidth","fullHeight","offsetX","offsetY","width","height"].map(T=>{const L=Reflect.get(m,T);if(typeof L!="number"||!Number.isFinite(L))throw new Error("Camera transfer has no finite view "+T+".");return L}),[E,S,b,M,w,A]=v;if(typeof y!="boolean"||!(E>0&&S>0&&w>0&&A>0))throw new Error("Camera transfer view dimensions are invalid.");g.setViewOffset(E,S,b,M,w,A),g.view.enabled=y}else g.view=null;if(g instanceof Me&&(g.aspect=_("aspect")),g.updateProjectionMatrix(),!g.projectionMatrix.elements.every((y,v)=>y===p[v]))throw new Error("The projection does not match the transferred native lens.");g.position.fromArray(o),g.quaternion.fromArray(c),g.scale.fromArray(l),g.up.fromArray(h),g.layers.mask=u,g.updateMatrixWorld(!0);const x=g.matrixWorld.determinant();if(!g.matrixWorld.elements.every(Number.isFinite)||x===0||!Number.isFinite(x))throw new Error("The transferred camera world transform is degenerate.");if(s instanceof Me&&g instanceof Me)s.copy(g,!1);else if(s instanceof dr&&g instanceof dr)s.copy(g,!1);else throw new Error("The validated camera projection changed type.");s.updateMatrixWorld(!0)}}}function Bv(i){const t=Ov(i.camera);let e=0,n,r=!1,s;const a=()=>{if(r)throw new Error("The viewer frame controller is closed.");if(s!==void 0)throw s.error;i.assertActive()};return{control:{capture:()=>(a(),{camera:t.capture(),elapsedSeconds:i.currentSeconds()}),restore:c=>{if(a(),c===null||typeof c!="object")throw new Error("Viewer transfer is not an object.");const l=Reflect.get(c,"elapsedSeconds");if(typeof l!="number"||!Number.isFinite(l)||l<0)throw new Error("Viewer transfer has no valid time.");const h=t.capture(),p=i.currentSeconds();t.restore(Reflect.get(c,"camera"));try{i.rebase(l),i.redraw(l)}catch(f){je([()=>t.restore(h),()=>i.rebase(p)],{error:f})}},redraw:()=>{a(),i.redraw(i.currentSeconds())},freeze:()=>{var c;return a(),e===0&&(n=(c=i.freezeCompleted)==null?void 0:c.call(i)),++e,gc(()=>{if(r||--e!==0)return;const l=n;n=void 0;try{je([()=>i.rebase(i.currentSeconds()),()=>{l==null||l(!0)}])}catch(h){throw s={error:h},h}})}},frame:c=>{a(),e===0&&c()},dispose:gc(()=>{r=!0,e=0;const c=n;n=void 0,c==null||c(!1)})}}function zv(i,t){const e=new $t;return(n,r,s)=>{if(!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(r)||r<=0||!Number.isFinite(s)||s<=0)throw new Error("Viewer viewport requires positive integer CSS dimensions and finite positive pixel ratio.");if(![Math.floor(n*s),Math.floor(r*s)].every(c=>Number.isSafeInteger(c)&&c>0&&c<=4294967295))throw new Error("Viewer drawing-buffer dimensions must fit positive canvas unsigned-long extents.");i.getSize(e);const a=e.x!==n||e.y!==r||i.getPixelRatio()!==s,o=t.aspect!==n/r;return!a&&!o?!1:(a&&i.setDrawingBufferSize(n,r,s),t.aspect=n/r,t.updateProjectionMatrix(),!0)}}function kv(i,t,e=!1){var n,r;((n=i.getAttribute)==null?void 0:n.call(i,"data-automovie-frame-observer"))==="on"&&((r=i.dispatchEvent)==null||r.call(i,new CustomEvent("automovie:completed-frame",{detail:e?{...t,changed:!0}:t})))}function Gv(i,t){if(!Number.isFinite(i)||i<0)throw new Error("A redraw requires finite nonnegative seconds.");const e=t.completedCount(),n=t.readFrame();if(t.produce(i),t.completedCount()===e){const r=t.readFrame();if(r===void 0||r===n)throw new Error("The original viewer producer did not complete a new redraw.");if(r.elapsedSeconds!==void 0&&r.elapsedSeconds!==i)throw new Error("The original viewer producer completed a different scene time.");t.publish(r,i)}if(t.completedCount()===e||t.completedSeconds()!==i)throw new Error("The original viewer producer did not complete the requested scene time.")}const sf=new WeakMap,Hv=i=>{const t=sf.get(i);t!==void 0&&(t.dispose(),sf.delete(i))},Yf=i=>je([()=>{Lv(i)},()=>{Hv(i)},()=>{i.dispose()}]),Vv=(i,t,e)=>je([e,()=>{Uv(t,i)},()=>{Yf(i)}]),ax=(i,t,e,n,r)=>{const s=new Y_({canvas:i,antialias:(r==null?void 0:r.antialias)??!0,preserveDrawingBuffer:(r==null?void 0:r.preserveDrawingBuffer)??!1});let a=!0,o,c;try{let l=function(){if(!a)throw new Error("The mounted viewer is closed.")};const h=zv(s,e),p=()=>h(i.clientWidth||1,i.clientHeight||1,(r==null?void 0:r.pixelRatio)??(Number.isFinite(window.devicePixelRatio)&&window.devicePixelRatio>0?window.devicePixelRatio:1));p();let f=null;const u=Fv();let d=0,_,g=0;const m=Bv({camera:e,currentSeconds:()=>u.current(),assertActive:l,rebase:w=>{d=w,f=null},redraw:w=>S(w),freezeCompleted:r==null?void 0:r.freezeCompleted});c=m;const x=m.control,y=(w,A=!1)=>{l(),u.run(w,()=>{const T=n(w);a&&(T!==!0&&(Z_(t),rc(t,s),s.render(t,e)),!(T===!0&&A)&&v(T===!0?void 0:{scene:t,camera:e,pass:"beauty",elapsedSeconds:w},A?w:void 0,A))})},v=(w,A,T=!1)=>{var N;l();const L=((N=r==null?void 0:r.completedFrame)==null?void 0:N.call(r))??w;L!==void 0&&E(L,A,T)},E=(w,A,T=!1)=>{if(l(),!T&&w===_)return;if(A!==void 0&&w.elapsedSeconds!==void 0&&A!==w.elapsedSeconds)throw new Error("Requested completion time differs from the original producer's completed time.");const L=u.complete(A??w.elapsedSeconds);_=w,++g,kv(i,{...w,elapsedSeconds:L,control:x},T)},S=(w=u.current())=>{l(),u.run(w,()=>{Gv(w,{completedCount:()=>g,completedSeconds:()=>u.current(),readFrame:()=>{var A;return(A=r==null?void 0:r.completedFrame)==null?void 0:A.call(r)},produce:A=>{(r==null?void 0:r.redrawCompleted)!==void 0?r.redrawCompleted(A):y(A,!0)},publish:(A,T)=>E(A,T,!0)})})},b=gc(()=>{Vv(s,t,()=>{a=!1,o!==void 0&&cancelAnimationFrame(o),o=void 0,m.dispose()})}),M=w=>{if(o=void 0,!!a){f===null&&(f=w);try{p()&&g>0&&S(u.current()),m.frame(()=>y(d+(w-f)/1e3)),a&&(o=requestAnimationFrame(M))}catch(A){je([b],{error:A})}}};return o=requestAnimationFrame(M),{renderer:s,completeFrame:w=>{l();const A=()=>v({scene:t,camera:e,pass:"beauty"},w,!0);w===void 0?A():u.run(w,A)},stop:b}}catch(l){je([()=>{a=!1,o!==void 0&&cancelAnimationFrame(o)},()=>{c==null||c.dispose()},()=>{Yf(s)}],{error:l})}},Wv=(i,t,e,n,r)=>{const s=i.getWorldDirection(new K).multiplyScalar(e.forward).addScaledVector(new K(1,0,0).applyQuaternion(i.quaternion),e.right).addScaledVector(new K(0,1,0),e.up),a=Math.min(Math.max(n,0),.1);return s.lengthSq()===0||a===0?!1:(s.normalize().multiplyScalar((r?2:8)*a),i.position.add(s),t.add(s),!0)},Xv=(i,t,e,n)=>{const r=Math.max(t.distanceTo(i.position),.001),s=new Jn().setFromQuaternion(i.quaternion,"YXZ");s.y-=e*.0025,s.x=qs.clamp(s.x-n*.0025,-qs.degToRad(89),qs.degToRad(89)),s.z=0,i.up.set(0,1,0),i.quaternion.setFromEuler(s),t.copy(i.position).addScaledVector(i.getWorldDirection(new K),r)},$v=(i,t)=>{i.fov=qs.clamp(i.fov*Math.exp(t*.001),5,110),i.updateProjectionMatrix()},ox=i=>{const{canvas:t,camera:e,target:n}=i,r=t.ownerDocument,s=r.defaultView,a=new Set,o=new Map,c=[],l=(T,L,N,P)=>{const C=U=>{m||N(U)};T.addEventListener(L,C,P),c.push(()=>T.removeEventListener(L,C,P))},h=()=>r.pointerLockElement===t,p=()=>a.has("ShiftLeft")||a.has("ShiftRight")||[...o.values()].includes("slow");let f="";const u=()=>i.notice(`${p()?"Slow · 2":"Free flight · 8"} m/s · ${h()?"Mouse look · Esc releases":f||"Click to fly · Drag to look"}`);let d=null,_=!1,g=!1,m=!1;const x=[];let y=null;const v=()=>{a.clear(),o.clear(),d=null,_=!1,y=null,u()},E=()=>{ma([v,()=>{h()&&r.exitPointerLock()}])},S=T=>T instanceof s.HTMLElement&&T.closest("input, textarea, select, button, [contenteditable]")!==null,b=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","Space","KeyC","ShiftLeft","ShiftRight"]);l(s,"keydown",T=>{if(T.code==="Escape"){E();return}if(T.defaultPrevented||T.altKey||T.metaKey||T.ctrlKey||!h()&&r.activeElement!==t||S(T.target)){v();return}if(T.code==="KeyR")T.repeat||(v(),i.reset());else if(b.has(T.code))a.add(T.code),u();else return;T.preventDefault()}),l(s,"keyup",T=>{a.delete(T.code),u()}),l(s,"focusin",T=>{T.target!==t&&E()}),l(s,"blur",E),l(r,"visibilitychange",()=>{r.hidden&&E()}),l(r,"pointerlockchange",()=>{f="",g=!1,v()});const M=()=>{g=!1,!m&&(f="Mouse capture unavailable · Drag to look, WASD to fly · Click to retry",u())};l(r,"pointerlockerror",M),l(t,"click",T=>{if(_||T.pointerType==="touch"){_=!1;return}if(!(g||h())){t.focus(),g=!0;try{let L=!1;Promise.resolve(t.requestPointerLock()).then(()=>{L=!0,g=!1,m&&h()&&r.exitPointerLock()}).catch(N=>{if(!L){M();return}if(m){const P=x.length===0?N:new AggregateError([x[0],N],"Spectator cleanup failed.");x.splice(0,x.length,P)}console.error("Spectator pointer-lock callback failed.",N)})}catch{M()}}});const w=(T,L)=>{Xv(e,n,T,L),i.changed()};l(s,"mousemove",T=>{h()&&w(T.movementX,T.movementY)}),l(t,"pointerdown",T=>{h()||d!==null||T.button!==0||(T.preventDefault(),t.focus(),t.setPointerCapture(T.pointerId),_=T.pointerType==="touch",d={id:T.pointerId,x:T.clientX,y:T.clientY})}),l(t,"pointermove",T=>{if(d===null||T.pointerId!==d.id)return;const L=T.clientX-d.x,N=T.clientY-d.y;(L!==0||N!==0)&&(_=!0,w(L,N),d.x=T.clientX,d.y=T.clientY)});for(const T of r.querySelectorAll("[data-flight]"))l(T,"pointerdown",L=>{L.button===0&&(L.preventDefault(),T.setPointerCapture(L.pointerId),o.set(L.pointerId,T.dataset.flight),u())});for(const T of["pointerup","pointercancel","lostpointercapture"])l(s,T,L=>{o.delete(L.pointerId),(d==null?void 0:d.id)===L.pointerId&&(d=null),u()});l(t,"wheel",T=>{T.preventDefault(),$v(e,T.deltaY),i.changed()},{passive:!1});for(const T of r.querySelectorAll("[data-flight-reset]"))l(T,"click",()=>{v(),i.reset()});const A=(T,L,N,P)=>{const C=[...o.values()];return Number(T.some(U=>a.has(U))||C.includes(N))-Number(L.some(U=>a.has(U))||C.includes(P))};try{u()}catch(T){throw m=!0,ma(c.splice(0),[T]),T}return{clear:v,frame:T=>{if(m)return!1;const L=y===null?0:T-y;return y=T,Wv(e,n,{forward:A(["KeyW","ArrowUp"],["KeyS","ArrowDown"],"forward","back"),right:A(["KeyD","ArrowRight"],["KeyA","ArrowLeft"],"right","left"),up:A(["Space"],["KeyC"],"up","down")},L,p())},dispose:()=>{if(m){if(x.length!==0)throw x[0];return}m=!0;try{ma([E,...c.splice(0)])}catch(T){throw x.push(T),T}}}};export{Ic as $,Ot as A,jn as B,$n as C,Pc as D,ga as E,ln as F,us as G,In as H,Pd as I,qf as J,tn as K,Fe as L,bo as M,Pe as N,Cd as O,If as P,pr as Q,un as R,an as S,Gd as T,Je as U,on as V,Hd as W,Kt as X,fn as Y,Ml as Z,jv as _,wi as a,qs as a0,Qn as a1,Ui as a2,ah as a3,hf as a4,Jv as a5,Me as a6,nx as a7,sx as a8,hi as a9,Sn as aa,ex as ab,ox as ac,ax as ad,Dl as ae,ix as af,Ut as ag,Kv as ah,xn as ai,Ln as aj,Fd as ak,Yt as al,rx as am,Hs as an,ua as ao,_a as b,gt as c,Mc as d,Li as e,os as f,Rh as g,va as h,pi as i,Qs as j,Eo as k,Gt as l,tu as m,mr as n,Xe as o,Kn as p,Af as q,je as r,kt as s,K as t,Qv as u,tx as v,Wn as w,Pi as x,Wt as y,kd as z};
