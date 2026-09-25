/** Metric, Y-up model parts shared by the 62 reviewed furnishings and props.
 * Geometry is generated from dimensions, never copied vertex arrays. Each
 * part owns one surface id and metre-valued UVs; bitmap assets are optional.
 * A change to these generators invalidates every prototype measurement. */
import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieModelPart, IAutoMovieMaterial } from "@automovie/interface";

export type Point = readonly [number, number, number];
export type Size = readonly [number, number, number];
export type FinishRole = "furniture-wood" | "upholstery" | "siding" | "trim-white" | "roof-shingle" | "charcoal-metal"
  | "greige-cabinet" | "stone-counter" | "dark-bookcase" | "stainless-steel" | "white-enamel"
  | "primary-bedding" | "olive-bedding" | "blue-grey-bedding" | "mirror-silver" | "black-glass-panel";
const finishRoles: Record<FinishRole,{ fallback:number; scale:readonly [number,number]; roughness:number; metallic:number }> = {
  "furniture-wood": {fallback:0xa87a4e,scale:[1,1],roughness:0.50,metallic:0},
  upholstery: {fallback:0xb7afa3,scale:[0.01,0.01],roughness:0.92,metallic:0},
  siding: {fallback:0xede8dc,scale:[0.3,0.3],roughness:0.55,metallic:0},
  "trim-white": {fallback:0xf6f4ee,scale:[1,1],roughness:0.35,metallic:0},
  "roof-shingle": {fallback:0x3a3c3e,scale:[0.3,0.3],roughness:0.90,metallic:0},
  "charcoal-metal": {fallback:0x2e3033,scale:[1,1],roughness:0.40,metallic:0},
  "greige-cabinet": {fallback:0x8a7f72,scale:[1,1],roughness:0.50,metallic:0},
  "stone-counter": {fallback:0xe4e0d8,scale:[1,1],roughness:0.30,metallic:0},
  "dark-bookcase": {fallback:0x4a3a2e,scale:[1,1],roughness:0.55,metallic:0},
  "stainless-steel": {fallback:0xc0c2c4,scale:[1,1],roughness:0.30,metallic:1},
  "white-enamel": {fallback:0xf5f5f2,scale:[1,1],roughness:0.25,metallic:0},
  "primary-bedding": {fallback:0xcfc8bc,scale:[0.01,0.01],roughness:0.93,metallic:0},
  "olive-bedding": {fallback:0x6b7040,scale:[0.01,0.01],roughness:0.92,metallic:0},
  "blue-grey-bedding": {fallback:0x6e7f8c,scale:[0.01,0.01],roughness:0.92,metallic:0},
  "mirror-silver": {fallback:0xededed,scale:[1,1],roughness:0.02,metallic:1},
  "black-glass-panel": {fallback:0x1f1f20,scale:[1,1],roughness:0.08,metallic:0},
};
export interface SurfaceBinding {
  /** Stable material face id from docs/models/00-model-frame.md. */
  surface: string;
  /** Physical metres represented by one texture repeat on U and V. */
  scale: readonly [number, number];
  /** Pixel-free blocking colour used when no bitmap exists. */
  fallback: number;
  /** Explicit projection for the generated metric UVs. */
  uv: "box-metric" | "cylinder-metric" | "ellipsoid-metric" | "mixed-metric";
}
export interface HousePrototype {
  id: string;
  owner: string;
  model: IAutoMovieModel;
  bindings: readonly SurfaceBinding[];
}

const rgb = (hex: number) => {
  const channel = (n: number) => {
    const v = n / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return { r: channel((hex >> 16) & 255), g: channel((hex >> 8) & 255), b: channel(hex & 255), a: 1, hex: null };
};

/** One box with independent face vertices so every normal and UV is exact. */
export function metricBox(min: Point, max: Point): IAutoMovieMesh {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  if (![...min, ...max].every(Number.isFinite) || x1 <= x0 || y1 <= y0 || z1 <= z0)
    throw Error(`invalid box ${min}..${max}`);
  const faces: Array<{ corners: Point[]; normal: Point; width: number; height: number }> = [
    { corners: [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], normal: [0,0,1], width: x1-x0, height: y1-y0 },
    { corners: [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]], normal: [0,0,-1], width: x1-x0, height: y1-y0 },
    { corners: [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]], normal: [1,0,0], width: z1-z0, height: y1-y0 },
    { corners: [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]], normal: [-1,0,0], width: z1-z0, height: y1-y0 },
    { corners: [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]], normal: [0,1,0], width: x1-x0, height: z1-z0 },
    { corners: [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], normal: [0,-1,0], width: x1-x0, height: z1-z0 },
  ];
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const face of faces) {
    const start = positions.length / 3;
    for (const corner of face.corners) {
      positions.push(...corner);
      normals.push(...face.normal);
    }
    uvs.push(0,0, face.width,0, face.width,face.height, 0,face.height);
    indices.push(start,start+1,start+2, start,start+2,start+3);
  }
  return { positions, normals, uvs, indices, skin: null };
}

/** A box whose upper cross-section is shifted in depth, for fixed inclined joinery. */
export function metricShearedBox(min:Point,max:Point,pivotY:number,slope:number):IAutoMovieMesh {
  if(!Number.isFinite(pivotY)||!Number.isFinite(slope)) throw Error("invalid box shear");
  const mesh=metricBox(min,max);
  for(let i=0;i<mesh.positions.length;i+=3)
    mesh.positions[i+2]+=slope*(mesh.positions[i+1]!-pivotY);
  for(let face=0;face<6;face++) {
    const start=face*12,a=mesh.positions.slice(start,start+3),b=mesh.positions.slice(start+3,start+6),c=mesh.positions.slice(start+6,start+9);
    const u=[0,1,2].map((k)=>b[k]!-a[k]!),v=[0,1,2].map((k)=>c[k]!-a[k]!);
    const cross=[u[1]!*v[2]!-u[2]!*v[1]!,u[2]!*v[0]!-u[0]!*v[2]!,u[0]!*v[1]!-u[1]!*v[0]!];
    const length=Math.hypot(...cross);
    for(let j=0;j<4;j++) for(let k=0;k<3;k++) mesh.normals![start+j*3+k]=cross[k]!/length;
    if(face<4) for(let j=0;j<4;j++) mesh.uvs![face*8+j*2+1]*=Math.hypot(1,slope);
  }
  return mesh;
}

/** Closed twelve or more sided cylinder/frustum; UVs are arc length and Y. */
export function metricFrustum(center: Point, bottomRadius: number, topRadius: number, height: number, sides = 16): IAutoMovieMesh {
  if (![...center,bottomRadius,topRadius,height,sides].every(Number.isFinite) || bottomRadius <= 0 || topRadius <= 0 || height <= 0 || sides < 3)
    throw Error("invalid frustum");
  const [cx,cy,cz] = center;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const add = (x:number,y:number,z:number,nx:number,ny:number,nz:number,u:number,v:number) => {
    positions.push(x,y,z); normals.push(nx,ny,nz); uvs.push(u,v);
    return positions.length/3-1;
  };
  for (let i=0;i<sides;i++) {
    const a=2*Math.PI*i/sides, b=2*Math.PI*(i+1)/sides;
    const na=[Math.cos(a), (bottomRadius-topRadius)/height, Math.sin(a)];
    const nb=[Math.cos(b), (bottomRadius-topRadius)/height, Math.sin(b)];
    const la=Math.hypot(...na), lb=Math.hypot(...nb);
    const u0=bottomRadius*a, u1=bottomRadius*b, topU0=topRadius*a, topU1=topRadius*b;
    const p=add(cx+bottomRadius*Math.cos(a),cy,cz+bottomRadius*Math.sin(a),na[0]/la,na[1]/la,na[2]/la,u0,0);
    add(cx+bottomRadius*Math.cos(b),cy,cz+bottomRadius*Math.sin(b),nb[0]/lb,nb[1]/lb,nb[2]/lb,u1,0);
    add(cx+topRadius*Math.cos(b),cy+height,cz+topRadius*Math.sin(b),nb[0]/lb,nb[1]/lb,nb[2]/lb,topU1,height);
    add(cx+topRadius*Math.cos(a),cy+height,cz+topRadius*Math.sin(a),na[0]/la,na[1]/la,na[2]/la,topU0,height);
    indices.push(p,p+2,p+1,p,p+3,p+2);
    for (const [y,r,normal,reverse] of [[cy,bottomRadius,-1,true],[cy+height,topRadius,1,false]] as const) {
      const mid=add(cx,y,cz,0,normal,0,r,r);
      const q=add(cx+r*Math.cos(a),y,cz+r*Math.sin(a),0,normal,0,r+r*Math.cos(a),r+r*Math.sin(a));
      const s=add(cx+r*Math.cos(b),y,cz+r*Math.sin(b),0,normal,0,r+r*Math.cos(b),r+r*Math.sin(b));
      indices.push(...(reverse ? [mid,q,s] : [mid,s,q]));
    }
  }
  return { positions,normals,uvs,indices,skin:null };
}

/** Rounded canopy volume with explicit outward triangle normals and metre UVs. */
export function metricEllipsoid(center: Point, radii: Size, sides=16, rings=8): IAutoMovieMesh {
  if (![...center,...radii,sides,rings].every(Number.isFinite) || radii.some((r)=>r<=0) || sides<3 || rings<3)
    throw Error("invalid ellipsoid");
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  const at=(longitude:number,latitude:number):Point=>[
    center[0]+radii[0]*Math.sin(latitude)*Math.cos(longitude),
    center[1]+radii[1]*Math.cos(latitude),
    center[2]+radii[2]*Math.sin(latitude)*Math.sin(longitude),
  ];
  const triangle=(a:Point,b:Point,c:Point,uvs3:readonly (readonly [number,number])[])=>{
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const cross:[number,number,number]=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const direction=(a[0]+b[0]+c[0]-3*center[0])*cross[0]/radii[0]+(a[1]+b[1]+c[1]-3*center[1])*cross[1]/radii[1]+(a[2]+b[2]+c[2]-3*center[2])*cross[2]/radii[2];
    const ordered=direction>=0?[a,b,c]:[a,c,b];
    const texture=direction>=0?uvs3:[uvs3[0]!,uvs3[2]!,uvs3[1]!];
    const normalLength=Math.hypot(...cross);
    if(normalLength<1e-12) return;
    const sign=direction>=0?1:-1;
    const start=positions.length/3;
    for(let i=0;i<3;i++) {
      positions.push(...ordered[i]!);
      normals.push(cross[0]/normalLength*sign,cross[1]/normalLength*sign,cross[2]/normalLength*sign);
      uvs.push(...texture[i]!);
    }
    indices.push(start,start+1,start+2);
  };
  for(let ring=0;ring<rings;ring++) for(let side=0;side<sides;side++) {
    const u0=2*Math.PI*side/sides,u1=2*Math.PI*(side+1)/sides;
    const v0=Math.PI*ring/rings,v1=Math.PI*(ring+1)/rings;
    const a=at(u0,v0),b=at(u1,v0),c=at(u1,v1),d=at(u0,v1);
    const ua=u0*radii[0],ub=u1*radii[0],va=v0*radii[1],vb=v1*radii[1];
    triangle(a,b,c,[[ua,va],[ub,va],[ub,vb]]);
    triangle(a,c,d,[[ua,va],[ub,vb],[ua,vb]]);
  }
  return {positions,normals,uvs,indices,skin:null};
}

/** A tapered closed branch between two physical endpoints. */
export function metricBeam(start:Point,end:Point,r0:number,r1:number,sides=12):IAutoMovieMesh {
  const direction=[end[0]-start[0],end[1]-start[1],end[2]-start[2]];
  const length=Math.hypot(...direction);
  if(!Number.isFinite(length)||length<=0) throw Error("invalid beam endpoints");
  const y=direction.map((n)=>n/length);
  const reference=Math.abs(y[1]!)<0.9?[0,1,0]:[1,0,0];
  const x=[reference[1]!*y[2]!-reference[2]!*y[1]!,reference[2]!*y[0]!-reference[0]!*y[2]!,reference[0]!*y[1]!-reference[1]!*y[0]!];
  const norm=Math.hypot(...x);
  const xn=x.map((n)=>n/norm);
  const z=[xn[1]!*y[2]!-xn[2]!*y[1]!,xn[2]!*y[0]!-xn[0]!*y[2]!,xn[0]!*y[1]!-xn[1]!*y[0]!];
  const mesh=metricFrustum([0,0,0],r0,r1,length,sides);
  const rotated=(v:readonly number[],origin:readonly number[])=>[
    origin[0]!+v[0]!*xn[0]!+v[1]!*y[0]!+v[2]!*z[0]!,
    origin[1]!+v[0]!*xn[1]!+v[1]!*y[1]!+v[2]!*z[1]!,
    origin[2]!+v[0]!*xn[2]!+v[1]!*y[2]!+v[2]!*z[2]!,
  ];
  for(let i=0;i<mesh.positions.length;i+=3) {
    const pos=rotated(mesh.positions.slice(i,i+3),start);
    const normal=rotated(mesh.normals!.slice(i,i+3),[0,0,0]);
    mesh.positions.splice(i,3,...pos);
    mesh.normals!.splice(i,3,...normal);
  }
  return mesh;
}

/** Closed annular panel facing +Z, for a real circular opening. */
export function metricRingZ(center:Point,inside:number,outside:number,depth:number,sides=16):IAutoMovieMesh {
  if(![...center,inside,outside,depth,sides].every(Number.isFinite)||inside<=0||outside<=inside||depth<=0||sides<3)
    throw Error("invalid annular panel");
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  const point=(r:number,a:number,z:number):Point=>[center[0]+r*Math.cos(a),center[1]+r*Math.sin(a),center[2]+z];
  const quad=(p:readonly Point[],uv:readonly (readonly [number,number])[])=>{
    const a=p[0]!,b=p[1]!,c=p[2]!;
    const x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
    const length=Math.hypot(...n),start=positions.length/3;
    for(const vertex of p) { positions.push(...vertex); normals.push(...n.map((k)=>k/length)); }
    for(const coordinate of uv) uvs.push(...coordinate);
    indices.push(start,start+1,start+2,start,start+2,start+3);
  };
  for(let i=0;i<sides;i++) {
    const a=2*Math.PI*i/sides,b=2*Math.PI*(i+1)/sides;
    const inner0=inside*a,inner1=inside*b,outer0=outside*a,outer1=outside*b,thickness=outside-inside;
    quad([point(inside,a,depth),point(outside,a,depth),point(outside,b,depth),point(inside,b,depth)],
      [[0,inner0],[thickness,outer0],[thickness,outer1],[0,inner1]]);
    quad([point(inside,b,0),point(outside,b,0),point(outside,a,0),point(inside,a,0)],
      [[0,inner1],[thickness,outer1],[thickness,outer0],[0,inner0]]);
    quad([point(outside,a,0),point(outside,b,0),point(outside,b,depth),point(outside,a,depth)],
      [[outer0,0],[outer1,0],[outer1,depth],[outer0,depth]]);
    quad([point(inside,a,0),point(inside,a,depth),point(inside,b,depth),point(inside,b,0)],
      [[0,inner0],[depth,inner0],[depth,inner1],[0,inner1]]);
  }
  return {positions,normals,uvs,indices,skin:null};
}

/** Horizontal annular plate, with its top at the supplied Y coordinate. */
export function metricRingY(top:Point,inside:number,outside:number,depth:number,sides=16):IAutoMovieMesh {
  const mesh=metricRingZ([0,0,0],inside,outside,depth,sides);
  for(let i=0;i<mesh.positions.length;i+=3) {
    const x=mesh.positions[i]!,y=mesh.positions[i+1]!,z=mesh.positions[i+2]!;
    mesh.positions[i]=top[0]+x;
    mesh.positions[i+1]=top[1]-z;
    mesh.positions[i+2]=top[2]+y;
    const nx=mesh.normals![i]!,ny=mesh.normals![i+1]!,nz=mesh.normals![i+2]!;
    mesh.normals![i]=nx;
    mesh.normals![i+1]=-nz;
    mesh.normals![i+2]=ny;
  }
  return mesh;
}

/** Hollow cylindrical or tapered vessel with a closed foot and open mouth. */
export function metricCup(center:Point,bottomRadius:number,topRadius:number,height:number,wall:number,sides=16):IAutoMovieMesh {
  if(![...center,bottomRadius,topRadius,height,wall,sides].every(Number.isFinite)||bottomRadius<=wall||topRadius<=wall||height<=wall||wall<=0||sides<3)
    throw Error("invalid open vessel");
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  const point=(r:number,a:number,y:number):Point=>[center[0]+r*Math.cos(a),center[1]+y,center[2]+r*Math.sin(a)];
  const tri=(a:Point,b:Point,c:Point,uv:readonly (readonly [number,number])[],outward:Point)=>{
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const sign=cross.reduce((s,n,k)=>s+n*outward[k]!,0)>=0?1:-1;
    const norm=Math.hypot(...cross),start=positions.length/3;
    const vertices=sign>0?[a,b,c]:[a,c,b],tex=sign>0?uv:[uv[0]!,uv[2]!,uv[1]!];
    for(let i=0;i<3;i++) { positions.push(...vertices[i]!); normals.push(...cross.map((n)=>n/norm*sign)); uvs.push(...tex[i]!); }
    indices.push(start,start+1,start+2);
  };
  const quad=(p:readonly Point[],uv:readonly (readonly [number,number])[],outward:Point)=>{
    tri(p[0]!,p[1]!,p[2]!,uv.slice(0,3),outward);
    tri(p[0]!,p[2]!,p[3]!,[uv[0]!,uv[2]!,uv[3]!],outward);
  };
  for(let i=0;i<sides;i++) {
    const a=2*Math.PI*i/sides,b=2*Math.PI*(i+1)/sides;
    const radial:Point=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];
    const surface=(r0:number,r1:number,y0:number,y1:number,outward:Point)=>{
      quad([point(r0,a,y0),point(r0,b,y0),point(r1,b,y1),point(r1,a,y1)],
        [[r0*a,y0],[r0*b,y0],[r1*b,y1],[r1*a,y1]],outward);
    };
    surface(bottomRadius,topRadius,0,height,radial);
    surface(bottomRadius-wall,topRadius-wall,wall,height,[-radial[0],0,-radial[2]]);
    quad([point(topRadius-wall,a,height),point(topRadius-wall,b,height),point(topRadius,b,height),point(topRadius,a,height)],
      [[(topRadius-wall)*a,0],[(topRadius-wall)*b,0],[topRadius*b,wall],[topRadius*a,wall]],[0,1,0]);
    tri(center,point(bottomRadius,a,0),point(bottomRadius,b,0),
      [[0,0],[bottomRadius*Math.cos(a),bottomRadius*Math.sin(a)],[bottomRadius*Math.cos(b),bottomRadius*Math.sin(b)]],[0,-1,0]);
    tri([center[0],center[1]+wall,center[2]],point(bottomRadius-wall,a,wall),point(bottomRadius-wall,b,wall),
      [[0,0],[(bottomRadius-wall)*Math.cos(a),(bottomRadius-wall)*Math.sin(a)],[(bottomRadius-wall)*Math.cos(b),(bottomRadius-wall)*Math.sin(b)]],[0,1,0]);
  }
  return {positions,normals,uvs,indices,skin:null};
}

/** An oval open bowl derived from the same watertight vessel geometry. */
export function metricOvalCup(center:Point,radiusX:number,radiusZ:number,height:number,wall:number,sides=12):IAutoMovieMesh {
  if(!Number.isFinite(radiusZ)||radiusZ<=wall) throw Error("invalid oval cup depth");
  const mesh=metricCup(center,radiusX,radiusX,height,wall,sides);
  const stretch=radiusZ/radiusX;
  for(let i=0;i<mesh.positions.length;i+=3) {
    mesh.positions[i+2]=center[2]+(mesh.positions[i+2]!-center[2])*stretch;
    const nx=mesh.normals![i]!,ny=mesh.normals![i+1]!,nz=mesh.normals![i+2]!/stretch;
    const norm=Math.hypot(nx,ny,nz);
    mesh.normals!.splice(i,3,nx/norm,ny/norm,nz/norm);
  }
  return mesh;
}

/** Hollow lamp shade with its open mouth below the ceiling-side cap. */
export function metricInvertedCup(top:Point,lowerRadius:number,upperRadius:number,height:number,wall:number,sides=16):IAutoMovieMesh {
  const mesh=metricCup([top[0],0,top[2]],upperRadius,lowerRadius,height,wall,sides);
  for(let i=0;i<mesh.positions.length;i+=3) {
    mesh.positions[i+1]=top[1]-mesh.positions[i+1]!;
    mesh.normals![i+1]=-mesh.normals![i+1]!;
  }
  for(let i=0;i<mesh.indices!.length;i+=3)
    [mesh.indices![i+1],mesh.indices![i+2]]=[mesh.indices![i+2]!,mesh.indices![i+1]!];
  return mesh;
}

/** Closed thin drape: continuous front/back folds with metre UVs. */
export function metricPleatedCurtain(left:number,bottom:number,top:number,baseDepth=0.083):IAutoMovieMesh {
  if(![left,bottom,top,baseDepth].every(Number.isFinite)||top<=bottom||baseDepth<=0.023)
    throw Error("invalid pleated curtain");
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  const face=(points:readonly Point[],tex:readonly (readonly [number,number])[],outward:Point)=>{
    for(const [a,b,c] of [[0,1,2],[0,2,3]]) {
      const p=points[a]!,q=points[b]!,r=points[c]!;
      const ab=[q[0]-p[0],q[1]-p[1],q[2]-p[2]],ac=[r[0]-p[0],r[1]-p[1],r[2]-p[2]];
      const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      const sign=cross.reduce((sum,value,k)=>sum+value*outward[k]!,0)>=0?1:-1;
      const normal=cross.map((value)=>value*sign/Math.hypot(...cross));
      const order=sign>0?[a,b,c]:[a,c,b],start=positions.length/3;
      for(const index of order) { positions.push(...points[index]!); normals.push(...normal); uvs.push(...tex[index]!); }
      indices.push(start,start+1,start+2);
    }
  };
  const segments=12,width=0.18,thickness=0.006;
  const depth=(i:number)=>baseDepth+0.02*Math.sin(6*Math.PI*i/segments);
  for(let i=0;i<segments;i++) {
    const x0=left+i*width/segments,x1=left+(i+1)*width/segments,z0=depth(i),z1=depth(i+1);
    const front0=z0+thickness/2,front1=z1+thickness/2,back0=z0-thickness/2,back1=z1-thickness/2;
    face([[x0,bottom,front0],[x1,bottom,front1],[x1,top,front1],[x0,top,front0]],[[x0,bottom],[x1,bottom],[x1,top],[x0,top]],[0,0,1]);
    face([[x0,bottom,back0],[x1,bottom,back1],[x1,top,back1],[x0,top,back0]],[[x0,bottom],[x1,bottom],[x1,top],[x0,top]],[0,0,-1]);
    face([[x0,top,back0],[x1,top,back1],[x1,top,front1],[x0,top,front0]],[[x0,back0],[x1,back1],[x1,front1],[x0,front0]],[0,1,0]);
    face([[x0,bottom,back0],[x1,bottom,back1],[x1,bottom,front1],[x0,bottom,front0]],[[x0,back0],[x1,back1],[x1,front1],[x0,front0]],[0,-1,0]);
  }
  for(const i of [0,segments]) {
    const x=left+i*width/segments,z=depth(i),direction=i===0?-1:1;
    face([[x,bottom,z-thickness/2],[x,bottom,z+thickness/2],[x,top,z+thickness/2],[x,top,z-thickness/2]],
      [[0,bottom],[thickness,bottom],[thickness,top],[0,top]],[direction,0,0]);
  }
  return {positions,normals,uvs,indices,skin:null};
}

const fallback = (surface: string): number => {
  if (/countertop|ceramic|basin/.test(surface)) return 0xe9e6df;
  if (/fixture-shade/.test(surface)) return 0xd9cdb8;
  if (/diffuser|fixture-glass/.test(surface)) return 0xe4e1d4;
  if (/appliance-body|control-panel/.test(surface)) return 0xa9aaa8;
  if (/glass|mirror|firebox|appliance-interior/.test(surface)) return 0x30383b;
  if (/steel|metal|handle|rail|rod|hinge|bracket|fixture|faucet|appliance/.test(surface)) return 0x55585a;
  if (/foliage|fruit/.test(surface)) return 0x657c43;
  if (/bark|wood|top|leg|headboard|bed-frame|shelf|carcass|mantel|board|book/.test(surface)) return 0x967251;
  if (/field|curtain|towel|folded|bedding|pillow|seat|back|arm/.test(surface)) return 0xc7bdb0;
  return 0xe4e0d7;
};
const scale = (surface: string): readonly [number,number] =>
  /siding|shingle|bark/.test(surface) ? [0.3,0.3] : /fabric|field|curtain|towel|folded|bedding|pillow|seat|back|arm/.test(surface) ? [0.2,0.2] : [1,1];

/** Every add call is one addressable physical component and one material face. */
export class PrototypeBuilder {
  private readonly parts: IAutoMovieModelPart[] = [];
  private readonly surfaceKinds = new Map<string, SurfaceBinding["uv"]>();
  constructor(readonly id: string, readonly owner: string,
    readonly finishes:Readonly<Record<string,FinishRole>>={}, readonly finishAll?:FinishRole) {}
  box(surface: string, min: Point, max: Point): this {
    return this.add(surface, metricBox(min,max), "box-metric");
  }
  shearedBox(surface:string,min:Point,max:Point,pivotY:number,slope:number):this {
    return this.add(surface,metricShearedBox(min,max,pivotY,slope),"box-metric");
  }
  frustum(surface: string, center: Point, r0:number, r1:number, height:number, sides=16): this {
    return this.add(surface, metricFrustum(center,r0,r1,height,sides), "cylinder-metric");
  }
  ellipsoid(surface:string,center:Point,radii:Size):this {
    return this.add(surface,metricEllipsoid(center,radii),"ellipsoid-metric");
  }
  beam(surface:string,start:Point,end:Point,r0:number,r1:number,sides=12):this {
    return this.add(surface,metricBeam(start,end,r0,r1,sides),"cylinder-metric");
  }
  ringZ(surface:string,center:Point,inside:number,outside:number,depth:number):this {
    return this.add(surface,metricRingZ(center,inside,outside,depth),"cylinder-metric");
  }
  ringY(surface:string,top:Point,inside:number,outside:number,depth:number):this {
    return this.add(surface,metricRingY(top,inside,outside,depth),"cylinder-metric");
  }
  cup(surface:string,center:Point,bottomRadius:number,topRadius:number,height:number,wall:number):this {
    return this.add(surface,metricCup(center,bottomRadius,topRadius,height,wall),"cylinder-metric");
  }
  ovalCup(surface:string,center:Point,radiusX:number,radiusZ:number,height:number,wall:number):this {
    return this.add(surface,metricOvalCup(center,radiusX,radiusZ,height,wall),"cylinder-metric");
  }
  invertedCup(surface:string,top:Point,lowerRadius:number,upperRadius:number,height:number,wall:number):this {
    return this.add(surface,metricInvertedCup(top,lowerRadius,upperRadius,height,wall),"cylinder-metric");
  }
  pleatedCurtain(surface:string,left:number,bottom:number,top:number):this {
    return this.add(surface,metricPleatedCurtain(left,bottom,top),"box-metric");
  }
  private add(surface:string, mesh:IAutoMovieMesh, uv:Exclude<SurfaceBinding["uv"],"mixed-metric">):this {
    const prior=this.surfaceKinds.get(surface);
    this.surfaceKinds.set(surface,prior && prior !== uv ? "mixed-metric" : uv);
    const id=`${surface}-${this.parts.filter((p)=>p.material===surface).length+1}`;
    this.parts.push({ id,name:id,geometry:{type:"mesh",mesh},material:surface,attachedBone:null,transform:null });
    return this;
  }
  finish(): HousePrototype {
    if (!this.parts.length) throw Error(`${this.id}: empty prototype`);
    const role=(surface:string)=>this.finishes[surface]??this.finishAll;
    const bindings=[...this.surfaceKinds].map(([surface,uv]):SurfaceBinding=>({surface,uv,
      scale:role(surface)?finishRoles[role(surface)!].scale:scale(surface),
      fallback:role(surface)?finishRoles[role(surface)!].fallback:fallback(surface)}));
    const materials:IAutoMovieMaterial[]=bindings.map((binding)=>({
      id:binding.surface,name:binding.surface,baseColor:rgb(binding.fallback),
      metallic:role(binding.surface)?finishRoles[role(binding.surface)!].metallic:
        !(/diffuser|glass|shade/.test(binding.surface)) && /steel|metal|handle|rail|rod|hinge|bracket|fixture|faucet|appliance/.test(binding.surface)?0.65:0,
      roughness:role(binding.surface)?finishRoles[role(binding.surface)!].roughness:/glass|mirror/.test(binding.surface)?0.14:0.72,
      emissive:null,opacity:/glass/.test(binding.surface)&&binding.surface!=="appliance-glass"?0.38:1,baseColorTexture:null,
    }));
    return { id:this.id, owner:this.owner, bindings, model:{id:this.id,name:this.id,origin:"generated",parts:this.parts,skeleton:null,body:null,materials,asset:null} };
  }
}
