import { buildAutoMoviePolyhedron, triangulateAutoMovieRegion } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import type { metricGeometry } from "../materials/manor";
interface RoofWriter {
  chimneyCut: number[];
  V(point: number[]): IAutoMovieVector3;
  mesh(id: string, mesh: IAutoMovieMesh, position: number[], material?: string,
    rotation?: IAutoMovieQuaternion, mapping?: Parameters<typeof metricGeometry>[2]): void;
  beam(id: string, start: number[], end: number[], width?: number, material?: string, cutShaft?: boolean): void;
  finish(id: string, level: number, role?: string): void;
}
/** Emit the same roof envelope, framed supports and clipped tile population in its original order. */
export function buildManorRoof({ chimneyCut, V, mesh, beam, finish }: RoofWriter): void {
// Plain roof planes of three joined gables. Union roof is the higher surface at overlaps.
const roofHeight=(x: number,z: number): number =>{
 const r: number[] = [];if(z<=.30&&z>=-5.85&&Math.abs(x)<=7.95)r.push(6.20+1.10*Math.min(z+5.85,.30-z));
 if(z>=-2.775&&z<=6.35)for(const sign of [-1,1]){const xx=x*sign;if(xx>=2.90&&xx<=7.95)r.push(6.20+1.10*Math.min(xx-2.90,7.95-xx));}if (!r.length) throw new Error("Authored manor roof is unavailable at this coordinate."); return Math.max(...r);
};
// Exact plane intersections own the valleys, avoiding sampled sawtooth joins.
function clipPlan(poly: number[][],axis: number,value: number,keepLess: boolean){const result: number[][] = [];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],aa=keepLess?a[axis]<=value:a[axis]>=value,bb=keepLess?b[axis]<=value:b[axis]>=value;if(aa)result.push(a);if(aa!==bb){const t=(value-a[axis])/(b[axis]-a[axis]);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return result;}
// Cancel opposing shared faces between clipped pieces of the same solid.
// Quantization matches the engine's positional weld tolerance; no outer face
// or triangle winding is changed and disjoint tile gaps remain disjoint.
function exteriorFaces(faces: number[][][]){
 const points=faces.flat(), expanded: number[][][] = [];
 const close=(a: number[],b: number[])=>Math.hypot(...a.map((v,k)=>v-b[k]))<1e-9;
 const fractions=(a: number[],b: number[],planar=false)=>{
  const axes=planar?[0,2]:[0,1,2],d=axes.map(k=>b[k]-a[k]),length2=d.reduce((s,v)=>s+v*v,0);
  const ts=[0,1];if(length2<1e-18)return ts;
  for(const p of points){const t=axes.reduce((s,k,i)=>s+(p[k]-a[k])*d[i],0)/length2;
   if(t>1e-9&&t<1-1e-9&&Math.hypot(...axes.map((k,i)=>p[k]-a[k]-t*d[i]))<1e-9)ts.push(t);
  }
  return ts.sort((a,b)=>a-b).filter((t,i,all)=>i===0||t-all[i-1]>1e-9);
 };
 const lerp=(a: number[],b: number[],t: number)=>a.map((v,k)=>v+(b[k]-v)*t);
 for(const face of faces){
  if(face.length===4&&Math.hypot(face[0][0]-face[1][0],face[0][2]-face[1][2])<1e-9&&Math.hypot(face[2][0]-face[3][0],face[2][2]-face[3][2])<1e-9){
   const ts=fractions(face[0],face[3],true);
   for(let i=0;i<ts.length-1;i++)expanded.push([lerp(face[0],face[3],ts[i]),lerp(face[1],face[2],ts[i]),lerp(face[1],face[2],ts[i+1]),lerp(face[0],face[3],ts[i+1])]);
  }else{
   // Conforming cap edges retain every T-junction vertex before triangulation.
   const edge=face.flatMap((a,i)=>{const b=face[(i+1)%face.length];return fractions(a,b).slice(0,-1).map(t=>lerp(a,b,t));});
   const center=[0,1,2].map(k=>face.reduce((s,p)=>s+p[k],0)/face.length);
   for(let i=0;i<edge.length;i++)if(!close(edge[i],edge[(i+1)%edge.length]))expanded.push([center,edge[i],edge[(i+1)%edge.length]]);
  }
 }
 const pending=new Map<string, number>(),removed=new Set<number>();
 const canonical=(keys: string[])=>keys.map((_,i)=>keys.slice(i).concat(keys.slice(0,i)).join('|')).sort((a,b)=>a<b?-1:a>b?1:0)[0];
 for(let i=0;i<expanded.length;i++){
  const keys=expanded[i].map(p=>p.map(v=>Math.round(v*1e9)||0).join(','));
  const forward=canonical(keys),reverse=canonical([...keys].reverse()),other=pending.get(reverse);
  if(other!==undefined){removed.add(i);removed.add(other);pending.delete(reverse);}
  else pending.set(forward,i);
 }
 return expanded.filter((_,i)=>!removed.has(i));
}
function roofPanel(id: string,outline: number[][],height: (x: number, z: number) => number){
 const [x0,x1,z0,z1]=chimneyCut;
 const overlaps=Math.max(...outline.map(p=>p[0]))>x0&&Math.min(...outline.map(p=>p[0]))<x1&&Math.max(...outline.map(p=>p[1]))>z0&&Math.min(...outline.map(p=>p[1]))<z1;
 const mid=overlaps?clipPlan(clipPlan(outline,0,x0,false),0,x1,true):[];
 const area=(p: number[][])=>p.reduce((s,a,j)=>{const b=p[(j+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
 const regions=(overlaps?[clipPlan(outline,0,x0,true),clipPlan(outline,0,x1,false),clipPlan(mid,1,z0,true),clipPlan(mid,1,z1,false)]:[outline]).filter(p=>p.length>=3&&Math.abs(area(p))>.00001);
 const faces: number[][][] = [],points=regions.flat();
 const onSegment=(p: number[],a: number[],b: number[])=>Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))<1e-7&&(p[0]-a[0])*(p[0]-b[0])+(p[1]-a[1])*(p[1]-b[1])<1e-7;
 for(const region of regions){
  const t=triangulateAutoMovieRegion({outer:region.map(([x,z])=>({x,y:z}))});
  for(let i=0;i<t.triangles.length;i+=3){const tri=t.triangles.slice(i,i+3).reverse().map(k=>{const p=t.points[k];return[p.x,height(p.x,p.y),p.y];});faces.push(tri,tri.map(p=>[p[0],p[1]-.16,p[2]]).reverse());}
  const edge=area(region)>0?[...region].reverse():region;
  for(let i=0;i<edge.length;i++){
   const a=edge[i],b=edge[(i+1)%edge.length],len2=(b[0]-a[0])**2+(b[1]-a[1])**2;if(len2<1e-12)continue;
   const split=[...new Set([0,1,...points.filter(p=>onSegment(p,a,b)).map(p=>((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/len2)])].sort((a,b)=>a-b);
   const at=(t: number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
   for(let j=0;j<split.length-1;j++){if(split[j+1]-split[j]<1e-8)continue;const p=at(split[j]),q=at(split[j+1]),m=at((split[j]+split[j+1])/2);
    if(regions.some(other=>other!==region&&other.some((v,k)=>onSegment(m,v,other[(k+1)%other.length]))))continue;
    const u=[p[0],height(p[0],p[1]),p[1]],v=[q[0],height(q[0],q[1]),q[1]];faces.push([u,[u[0],u[1]-.16,u[2]],[v[0],v[1]-.16,v[2]],v]);
   }
  }
 }
 mesh(id,buildAutoMoviePolyhedron(faces.map(f=>f.map(V))),[0,0,0],'roof');
 // Tile fragments are clipped to the exact planar roof triangles and flue void.
 // Each course rises at its weather edge; no decorative bar spans below a pitch.
 const tiled: Record<string, number[][][]> = {roof:[],roofLight:[],roofMuted:[]},alongX=id.startsWith('rear'),triangles: number[][][] = [];
 for(const region of regions){const t=triangulateAutoMovieRegion({outer:region.map(([x,y])=>({x,y}))});for(let i=0;i<t.triangles.length;i+=3)triangles.push(t.triangles.slice(i,i+3).map(k=>[t.points[k].x,t.points[k].y]));}
 const minX=Math.min(...outline.map(p=>p[0])),maxX=Math.max(...outline.map(p=>p[0])),minZ=Math.min(...outline.map(p=>p[1])),maxZ=Math.max(...outline.map(p=>p[1])),sx=alongX?.27:.225,sz=alongX?.225:.27;
 for(let iz=0;iz<Math.ceil((maxZ-minZ)/sz)+1;iz++)for(let ix=0;ix<Math.ceil((maxX-minX)/sx)+1;ix++){
  const x=minX+ix*sx-(alongX?(iz%2)*sx/2:0),z=minZ+iz*sz-(alongX?0:(ix%2)*sz/2);
  const material=['roof','roofMuted','roofLight'][Math.floor(Math.abs(Math.sin(ix*12.9898+iz*78.233)*43758.5453)%1*3)],
   uphill=alongX?height(x,z+sz)>height(x,z):height(x+sx,z)>height(x,z),
   h=(px: number,pz: number)=>{const t=alongX?(pz-z)/sz:(px-x)/sx;return height(px,pz)+.025+.016*(uphill?1-t:t);};
  const tileFaces: number[][][] = [];
  for(const tri of triangles){let p=clipPlan(clipPlan(clipPlan(clipPlan(tri,0,x+.002,false),0,x+sx-.002,true),1,z+.002,false),1,z+sz-.002,true);
   // Four clip passes can return the same corner twice at floating precision.
   // Remove only consecutive coincident points, not collinear boundary vertices.
   p=p.filter((q,i)=>Math.hypot(q[0]-p[(i+p.length-1)%p.length][0],q[1]-p[(i+p.length-1)%p.length][1])>1e-9);
   if(p.length<3||Math.abs(area(p))<1e-8)continue;if(area(p)>0)p.reverse();
   const top=p.map(q=>[q[0],h(q[0],q[1]),q[1]]),bottom=top.map(q=>[q[0],q[1]-.028,q[2]]),f=tileFaces;f.push(top,bottom.toReversed());for(let k=0;k<p.length;k++)f.push([top[k],bottom[k],bottom[(k+1)%p.length],top[(k+1)%p.length]]);
  }
  tiled[material].push(...exteriorFaces(tileFaces));
 }
 for(const [mat,f]of Object.entries(tiled))if(f.length)mesh(id+'-tiles-'+mat,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],mat);
}
roofPanel('rear-north',[[-7.95,-5.85],[7.95,-5.85],[7.95,-2.775],[-7.95,-2.775]],(_x,z)=>6.2+1.1*(z+5.85));
roofPanel('rear-south',[[-7.95,-2.775],[7.95,-2.775],[7.95,.30],[5.425,-2.225],[2.9,.30],[-2.9,.30],[-5.425,-2.225],[-7.95,.30]],(_x,z)=>6.53-1.1*z);
for(const sign of [-1,1]){
 roofPanel('wing-inner-'+sign,[[2.9,.30],[5.425,-2.225],[5.425,6.35],[2.9,6.35]].map(([x,z])=>[x*sign,z]),x=>6.2+1.1*(Math.abs(x)-2.9));
 roofPanel('wing-outer-'+sign,[[5.425,-2.225],[7.95,.30],[7.95,6.35],[5.425,6.35]].map(([x,z])=>[x*sign,z]),x=>6.2+1.1*(7.95-Math.abs(x)));
}
// Ridge saddles meet both slopes, separate from the timber ridge below.
for(let k=0,x=-7.92;x<7.92;x+=.31,k++){
 const lo=x,hi=Math.min(7.95,x+.30),c=-2.775,yy=9.5825,ring=(u: number)=>[[u,yy-.12,c-.16],[u,yy+.035,c],[u,yy-.12,c+.16],[u,yy-.155,c+.16],[u,yy-.004,c],[u,yy-.155,c-.16]],a=ring(lo),b=ring(hi),f: number[][][] = [];
 for(const ids of [[0,1,4,5],[1,2,3,4]])f.push(ids.map(i=>a[i]).reverse(),ids.map(i=>b[i]));for(let i=0;i<a.length;i++)f.push([a[i],a[(i+1)%a.length],b[(i+1)%a.length],b[i]]);mesh('rear-ridge-tile-'+k,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],'roofMuted');
}
for(const sign of [-1,1])for(let k=0,z=-2.18;z<6.35;z+=.31,k++){
 const lo=z,hi=Math.min(6.35,z+.30),c=sign*5.425,yy=8.9775,ring=(u: number)=>[[c-.16,yy-.12,u],[c,yy+.035,u],[c+.16,yy-.12,u],[c+.16,yy-.155,u],[c,yy-.004,u],[c-.16,yy-.155,u]],a=ring(lo),b=ring(hi),f: number[][][] = [];
 for(const ids of [[0,1,4,5],[1,2,3,4]])f.push(ids.map(i=>a[i]),ids.map(i=>b[i]).reverse());for(let i=0;i<a.length;i++)f.push([a[i],b[i],b[(i+1)%a.length],a[(i+1)%a.length]]);mesh('wing-ridge-tile-'+sign+'-'+k,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],'roofMuted');
}
finish('roof-envelope',2,'roof');
// Roof load frame: rafters, ties, ridge and valley members beneath the envelope.
beam('rear-ridge',[-7.5,9.30,-2.775],[7.5,9.30,-2.775],.22);
for(let x=-7.3,i=0;x<=7.31;x+=.73,i++){
 beam('rear-rafter-n-'+i,[x,roofHeight(x,-5.50)-.28,-5.50],[x,9.30,-2.775],.14);
 if(Math.abs(x)<2.85)beam('rear-rafter-s-'+i,[x,9.30,-2.775],[x,roofHeight(x,0)-.28,0],.14);
 else{const xx=Math.abs(x),z=xx<=5.425?3.2-xx:xx-7.65;beam('rear-rafter-s-'+i,[x,9.30,-2.775],[x,roofHeight(x,z)-.28,z],.14);}
 if(i%3===0){beam('rear-tie-'+i,[x,6.03,-5.4],[x,6.03,0],.23);beam('rear-king-'+i,[x,6.03,-2.775],[x,9.30,-2.775],.15);}
}
for(const sign of [-1,1]){
 beam('wing-ridge-'+sign,[sign*5.425,8.6975,-2.225],[sign*5.425,8.6975,6.0],.22);
 for(const x of [2.90,7.95])beam('valley-'+sign+'-'+x,[sign*x,5.92,.30],[sign*5.425,8.6975,-2.225],.22);
 for(let i=0,z=-1.90;z<.3;z+=.55,i++){
  const inset=z+2.225,xa=5.425-inset,xb=5.425+inset;
  beam('wing-rafter-jack-in-'+sign+'-'+i,[sign*xa,roofHeight(sign*xa,z)-.28,z],[sign*5.425,8.6975,z],.14);
  beam('wing-rafter-jack-out-'+sign+'-'+i,[sign*5.425,8.6975,z],[sign*xb,roofHeight(sign*xb,z)-.28,z],.14);
 }
 for(let z=.40,i=0;z<6.01;z+=.70,i++){
  beam('wing-rafter-in-'+sign+'-'+i,[sign*3.25,6.285,z],[sign*5.425,8.6975,z],.14);
  beam('wing-rafter-out-'+sign+'-'+i,[sign*5.425,8.6975,z],[sign*7.6,6.285,z],.14);
  if(i%3===0){beam('wing-tie-'+sign+'-'+i,[sign*3.25,6.03,z],[sign*7.6,6.03,z],.23);beam('wing-king-'+sign+'-'+i,[sign*5.425,6.03,z],[sign*5.425,8.6975,z],.15);}
 }
}
for(const x of [chimneyCut[0]-.15,chimneyCut[1]+.15]){const z0=chimneyCut[2]-.15,z1=chimneyCut[3]+.15;beam('shaft-roof-trimmer-'+x,[x,roofHeight(x,z0)-.28,z0],[x,roofHeight(x,z1)-.28,z1],.18);}
for(const z of [chimneyCut[2]-.15,chimneyCut[3]+.15]){const x0=chimneyCut[0]-.15,x1=chimneyCut[1]+.15;beam('shaft-roof-header-'+z,[x0,roofHeight(x0,z)-.28,z],[x1,roofHeight(x1,z)-.28,z],.18);}
finish('roof-frame',2,'roof-frame');
// A faceted solid per boundary: ridge/valley breakpoints, no overlapping strip ends.
function atticWall(id: string,a: number[],b: number[],breaks: number[]){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*.10,nz=dx/len*.10;
 const count=Math.ceil(len/1.3),studs=Array.from({length:count+1},(_,i)=>[Math.max(0,i/count-.06/len),Math.min(1,i/count+.06/len)]);
 const cuts=[...new Set([0,1,...breaks,...studs.flat()])].sort((a,b)=>a-b),faces: Record<string, number[][][]> = {oak:[],plaster:[]},frames: NonNullable<NonNullable<Parameters<typeof metricGeometry>[2]>["faceFrames"]> = [];
 const p=(t: number,side: number,drop=0)=>{const x=a[0]+dx*t+nx*side,z=a[1]+dz*t+nz*side;return[x,roofHeight(x,z)-.18-drop,z];};
 const bottom=(t: number,side: number)=>{const q=p(t,side);q[1]=6.10;return q;};
 const add=(m: string,f: number[][],grainAxis=[0,1,0])=>{const fs=f.length===4?[[f[0],f[1],f[2]],[f[0],f[2],f[3]]]:[f];for(const face of fs){faces[m].push(face);if(m==='oak')frames.push({count:face.length,grainAxis,origin:[a[0],6.10,a[1]]});}};
 for(let i=0;i<cuts.length-1;i++){
  const u=cuts[i],v=cuts[i+1];if(v-u<1e-8)continue;const mid=(u+v)/2,mat=studs.some(([a,b])=>mid>a&&mid<b)?'oak':'plaster';
  for(const side of [-1,1]){
   const lower=[bottom(u,side),bottom(v,side),p(v,side,.16),p(u,side,.16)],band=[p(u,side,.16),p(v,side,.16),p(v,side),p(u,side)];
   add(mat,side===1?lower:lower.toReversed());add('oak',side===1?band:band.toReversed(),p(v,side).map((q,k)=>q-p(u,side)[k]));
  }
  add('oak',[p(u,1),p(v,1),p(v,-1),p(u,-1)],p(v,1).map((q,k)=>q-p(u,1)[k]));
  add(mat,[bottom(v,1),bottom(u,1),bottom(u,-1),bottom(v,-1)]);
 }
 for(const t of [0,1]){const f=[bottom(t,1),p(t,1),p(t,-1),bottom(t,-1)];add('oak',t===0?f:f.toReversed());}
 for(const [m,f]of Object.entries(faces))if(f.length)mesh(id+'-'+m,buildAutoMoviePolyhedron(f.map(f=>f.map(V))),[0,0,0],m,undefined,{faceFrames:m==='oak'?frames:undefined});
}
for(const sign of [-1,1])atticWall('front-gable-'+sign,[sign*3.25,5.90],[sign*7.6,5.90],[0,.5,1]);
finish('gable-fill',2,'roof');
// Remaining attic boundary faces close the union roof to the upper ceiling.
for(const [id,a,b]of [['attic-north',[-7.6,-5.4],[7.6,-5.4]],['attic-west',[-7.5,-5.4],[-7.5,5.8]],['attic-east',[7.5,-5.4],[7.5,5.8]],['attic-court-west',[-3.35,-.1],[-3.35,5.9]],['attic-court-east',[3.35,-.1],[3.35,5.9]],['attic-court-rear',[-3.25,-.1],[3.25,-.1]]] satisfies [string, number[], number[]][]){
 const dx=b[0]-a[0],dz=b[1]-a[1],breaks=[0,1];
 if(Math.abs(dz)>.001)for(const z of [-2.775,3.2-Math.abs(a[0]),Math.abs(a[0])-7.65]){const t=(z-a[1])/dz;if(t>0&&t<1)breaks.push(t);}
 if(Math.abs(dx)>.001)for(const x of [-7.95,-5.425,-2.9,2.9,5.425,7.95]){const t=(x-a[0])/dx;if(t>0&&t<1)breaks.push(t);}
 atticWall(id,a,b,[...new Set(breaks)].sort((a,b)=>a-b));
 finish(id,2,'roof');
}

}
