import { IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/** Coordinates and part identities are copied from the reviewed @part rows. */
export interface ModelPartRecord {
  id: string;
  shape: "box" | "cylinder" | "curved" | "hollow" | "mitered-box";
  x: [number, number]; y: [number, number]; z: [number, number];
}
export interface ModelStateRecord {
  state: string;
  parts: ModelPartRecord[];
  voids?: Record<string, Bounds[]>;
  pieces?: Record<string, Bounds[]>;
  radial?: Record<string, [number, number, number, number]>;
  ellipse?: Record<string, [number, number, number, number, number, number]>;
  bores?: Record<string, {axis: string; args: string[]}>;
  profiles?: Record<string, string[]>;
  joins?: Record<string, number[]>;
  apices?: Record<string, number[]>;
  plantSpec?: { wallMinimum: number; wallFactor: number; potBottomRadius: number; potTopRadius: number; potHeight: number; soilSurface: number; leafThickness: number; [key: string]: unknown };
}
export interface ModelPrototype {
  anchor: string; name: string; states: ModelStateRecord[];
}
interface Bounds { x: [number, number]; y: [number, number]; z: [number, number] }
type Vec = [number, number, number];
const TAU = Math.PI * 2;
const SEGMENTS = 24;

class MeshWriter {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  readonly uvs: number[] = [];
  readonly indices: number[] = [];

  vertex(p: Vec, n: Vec, uv: [number, number]): number {
    const index = this.positions.length / 3;
    this.positions.push(...p); this.normals.push(...n); this.uvs.push(...uv);
    return index;
  }
  triangle(a: number, b: number, c: number): void {
    const p=(i:number):Vec=>[this.positions[i*3],this.positions[i*3+1],this.positions[i*3+2]];
    const n:Vec=[this.normals[a*3],this.normals[a*3+1],this.normals[a*3+2]];
    const outward=dot(cross(sub(p(b),p(a)),sub(p(c),p(a))),n)>=0;
    this.indices.push(a,outward?b:c,outward?c:b);
  }
  quad(points: [Vec, Vec, Vec, Vec], normal: Vec): void {
    const face = points.map(p => this.vertex(p, normal, metricUv(p, normal, points)));
    const ab = sub(points[1], points[0]); const ac = sub(points[2], points[0]);
    if (dot(cross(ab, ac), normal) > 0) {
      this.triangle(face[0], face[1], face[2]); this.triangle(face[0], face[2], face[3]);
    } else {
      this.triangle(face[0], face[2], face[1]); this.triangle(face[0], face[3], face[2]);
    }
  }
  finish(): IAutoMovieMesh {
    if (!this.indices.length || this.uvs.length !== this.positions.length / 3 * 2) throw Error("empty or non-UV model part");
    return { positions: this.positions, normals: this.normals, uvs: this.uvs, indices: this.indices, skin: null };
  }
}
function sub(a: Vec, b: Vec): Vec { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function dot(a: Vec, b: Vec): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function cross(a: Vec, b: Vec): Vec { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function normalize(a: Vec): Vec { const length = Math.hypot(...a); return [a[0]/length,a[1]/length,a[2]/length]; }

// docs/models/000-representation.md#model-uv-and-topology: physical metre
// coordinates on each planar face, with the same axes on opposing normals.
function metricUv(p: Vec, n: Vec, points: Vec[]): [number, number] {
  const axis = Math.abs(n[0]) > 0.5 ? [2,1] : Math.abs(n[1]) > 0.5 ? [0,2] : [0,1];
  return [p[axis[0]]-Math.min(...points.map(q=>q[axis[0]])), p[axis[1]]-Math.min(...points.map(q=>q[axis[1]]))];
}
function planarBox(w: MeshWriter, b: Bounds): void {
  const [x0,x1]=b.x, [y0,y1]=b.y, [z0,z1]=b.z;
  w.quad([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],[-1,0,0]);
  w.quad([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]);
  w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],[0,0,-1]);
  w.quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);
  w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0]);
  w.quad([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[0,1,0]);
}

/** Boundary of an axis-aligned union of reviewed pieces minus reviewed voids. */
function cutBoxes(w: MeshWriter, part: Bounds, pieces: Bounds[], voids: Bounds[]): void {
  const axes: (keyof Bounds)[] = ["x","y","z"];
  const coords = axes.map(axis => [...new Set([part[axis][0],part[axis][1], ...pieces.flatMap(p=>p[axis]), ...voids.flatMap(v=>v[axis])])]
    .filter(n=>n>=part[axis][0] && n<=part[axis][1]).sort((a,b)=>a-b));
  const intervals = coords.map(values => values.slice(0,-1).map((a,i): [number,number]=>[a,values[i+1]]));
  const inside = (x:number,y:number,z:number,b:Bounds) => x>=b.x[0] && x<=b.x[1] && y>=b.y[0] && y<=b.y[1] && z>=b.z[0] && z<=b.z[1];
  const solid = (i:number,j:number,k:number) => {
    if (i<0||j<0||k<0||i>=intervals[0].length||j>=intervals[1].length||k>=intervals[2].length) return false;
    const x=(intervals[0][i][0]+intervals[0][i][1])/2, y=(intervals[1][j][0]+intervals[1][j][1])/2, z=(intervals[2][k][0]+intervals[2][k][1])/2;
    return (pieces.length ? pieces.some(b=>inside(x,y,z,b)) : inside(x,y,z,part)) && !voids.some(b=>inside(x,y,z,b));
  };
  for(let i=0;i<intervals[0].length;i++) for(let j=0;j<intervals[1].length;j++) for(let k=0;k<intervals[2].length;k++) {
    if(!solid(i,j,k)) continue;
    const [x0,x1]=intervals[0][i], [y0,y1]=intervals[1][j], [z0,z1]=intervals[2][k];
    if(!solid(i-1,j,k)) w.quad([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],[-1,0,0]);
    if(!solid(i+1,j,k)) w.quad([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]);
    if(!solid(i,j-1,k)) w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0]);
    if(!solid(i,j+1,k)) w.quad([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[0,1,0]);
    if(!solid(i,j,k-1)) w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],[0,0,-1]);
    if(!solid(i,j,k+1)) w.quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);
  }
}

function cylinder(w: MeshWriter, b: Bounds): void {
  const lengths=[b.x[1]-b.x[0],b.y[1]-b.y[0],b.z[1]-b.z[0]];
  // A round, shallow seat has equal X/Z diameters; a long rod has equal
  // transverse dimensions. The remaining axis is the cylinder axis.
  const pairs:[[number,number,number],[number,number,number],[number,number,number]]=[[0,1,2],[0,2,1],[1,2,0]];
  const axis=pairs.sort((a,b)=>Math.abs(lengths[a[0]]-lengths[a[1]])-Math.abs(lengths[b[0]]-lengths[b[1]]))[0][2];
  const across=axis===0?[1,2]:axis===1?[0,2]:[0,1];
  const c: Vec=[(b.x[0]+b.x[1])/2,(b.y[0]+b.y[1])/2,(b.z[0]+b.z[1])/2];
  const r0=lengths[across[0]]/2,r1=lengths[across[1]]/2;
  const a=axis===0?b.x:axis===1?b.y:b.z;
  const rings: number[][]=[];
  let cumulative=0;
  for(const level of [0,1]) {
    const ring:number[]=[];
    for(let i=0;i<=SEGMENTS;i++) {
      const theta=TAU*i/SEGMENTS;
      const p:Vec=[...c]; p[axis]=a[level]; p[across[0]]=c[across[0]]+Math.sin(theta)*r0; p[across[1]]=c[across[1]]-Math.cos(theta)*r1;
      const n:Vec=[0,0,0]; n[across[0]]=Math.sin(theta)/r0; n[across[1]]=-Math.cos(theta)/r1;
      if(i>0) {
        const previous=TAU*(i-1)/SEGMENTS;
        cumulative+=Math.hypot((Math.sin(theta)-Math.sin(previous))*r0,(Math.cos(theta)-Math.cos(previous))*r1);
      }
      ring.push(w.vertex(p,normalize(n),[cumulative,level*(a[1]-a[0])]));
    }
    rings.push(ring);
    cumulative=0;
  }
  for(let i=0;i<SEGMENTS;i++) {
    const aa=rings[0][i],bb=rings[0][i+1],cc=rings[1][i+1],dd=rings[1][i];
    // The phase begins at local -Z; outward winding for X/Y/Z axial tubes.
    if(axis===1) { w.triangle(aa,cc,bb); w.triangle(aa,dd,cc); }
    else { w.triangle(aa,bb,cc); w.triangle(aa,cc,dd); }
  }
  for(let level=0;level<2;level++) {
    const n:Vec=[0,0,0]; n[axis]=level?1:-1;
    const face:Vec[]=[];
    for(let i=0;i<SEGMENTS;i++) {const theta=TAU*i/SEGMENTS;const p:Vec=[...c];p[axis]=a[level];p[across[0]]=c[across[0]]+Math.sin(theta)*r0;p[across[1]]=c[across[1]]-Math.cos(theta)*r1;face.push(p);}
    const min0=Math.min(...face.map(p=>p[across[0]])),min1=Math.min(...face.map(p=>p[across[1]]));
    const center:Vec=[...c];center[axis]=a[level];
    const ci=w.vertex(center,n,[center[across[0]]-min0,center[across[1]]-min1]);
    const ids=face.map(p=>w.vertex(p,n,metricUv(p,n,face)));
    for(let i=0;i<SEGMENTS;i++) {
      const aa=ids[i],bb=ids[(i+1)%SEGMENTS];
      const crossDir=cross(sub(face[(i+1)%SEGMENTS],center),sub(face[i],center));
      if(dot(crossDir,n)>0) w.triangle(ci,bb,aa); else w.triangle(ci,aa,bb);
    }
  }
}

function ellipsoid(w:MeshWriter,b:Bounds):void {
  const c:Vec=[(b.x[0]+b.x[1])/2,(b.y[0]+b.y[1])/2,(b.z[0]+b.z[1])/2];
  const r:Vec=[(b.x[1]-b.x[0])/2,(b.y[1]-b.y[0])/2,(b.z[1]-b.z[0])/2];
  const rings:number[][]=[];
  for(let lat=1;lat<12;lat++) {
    const phi=Math.PI*lat/12,ring:number[]=[];
    let arc=0;
    for(let lon=0;lon<=SEGMENTS;lon++) {
      const theta=TAU*lon/SEGMENTS;
      const unit:Vec=[Math.sin(phi)*Math.sin(theta),-Math.cos(phi),-Math.sin(phi)*Math.cos(theta)];
      const p:Vec=[c[0]+unit[0]*r[0],c[1]+unit[1]*r[1],c[2]+unit[2]*r[2]];
      const normal=normalize([unit[0]/r[0],unit[1]/r[1],unit[2]/r[2]]);
      if(lon>0){const prev=TAU*(lon-1)/SEGMENTS;arc+=Math.hypot((Math.sin(theta)-Math.sin(prev))*r[0]*Math.sin(phi),(Math.cos(theta)-Math.cos(prev))*r[2]*Math.sin(phi));}
      let meridian=0;
      for(let step=1;step<=lat;step++) {
        const p0=Math.PI*(step-1)/12,p1=Math.PI*step/12;
        meridian+=Math.hypot((Math.sin(p1)-Math.sin(p0))*(r[0]+r[2])/2,(Math.cos(p1)-Math.cos(p0))*r[1]);
      }
      ring.push(w.vertex(p,normal,[arc,meridian]));
    }
    rings.push(ring);
  }
  const bottom=w.vertex([c[0],b.y[0],c[2]],[0,-1,0],[0,0]);
  const top=w.vertex([c[0],b.y[1],c[2]],[0,1,0],[0,Math.PI*(r[1]+(r[0]+r[2])/2)/2]);
  for(let lon=0;lon<SEGMENTS;lon++) {
    w.triangle(bottom,rings[0][lon+1],rings[0][lon]);
    for(let lat=0;lat<rings.length-1;lat++) {
      const a=rings[lat][lon],b0=rings[lat][lon+1],d=rings[lat+1][lon],e=rings[lat+1][lon+1];
      w.triangle(a,b0,e);w.triangle(a,e,d);
    }
    w.triangle(top,rings[rings.length-1][lon],rings[rings.length-1][lon+1]);
  }
}

function radialShell(w:MeshWriter,b:Bounds,r:[number,number,number,number]):void {
  const [cx,cz,inner,outer]=r;
  lathedShell(w,cx,cz,[[b.y[0],outer,outer],[b.y[1],outer,outer]],[[b.y[0],inner,inner],[b.y[1],inner,inner]],true);
}

type Ring = [number,number,number]; // local Y, X radius, Z radius
function lathedShell(w:MeshWriter,cx:number,cz:number,outer:Ring[],inner:Ring[],through:boolean):void {
  const point=(ring:Ring,i:number):Vec=>[cx+Math.sin(TAU*i/SEGMENTS)*ring[1],ring[0],cz-Math.cos(TAU*i/SEGMENTS)*ring[2]];
  const wall=(rings:Ring[],inward:boolean):void=>{
    let meridian=0;
    for(let level=0;level<rings.length-1;level++) {
      const lo=rings[level],hi=rings[level+1];
      const step=Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]);
      for(let i=0;i<SEGMENTS;i++) {
        const p0=point(lo,i),p1=point(lo,i+1),p2=point(hi,i+1),p3=point(hi,i);
        const normal=normalize([Math.sin(TAU*(i+0.5)/SEGMENTS)/Math.max(lo[1],0.000001),0,-Math.cos(TAU*(i+0.5)/SEGMENTS)/Math.max(lo[2],0.000001)]);
        const n=inward?([-normal[0],-normal[1],-normal[2]] as Vec):normal;
        let arc=0;for(let j=0;j<i;j++)arc+=Math.hypot(point(lo,j+1)[0]-point(lo,j)[0],point(lo,j+1)[2]-point(lo,j)[2]);
        const edge=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]);
        const a=w.vertex(p0,n,[arc,meridian]),b=w.vertex(p1,n,[arc+edge,meridian]);
        const c=w.vertex(p2,n,[arc+edge,meridian+step]),d=w.vertex(p3,n,[arc,meridian+step]);
        if(inward){w.triangle(a,c,b);w.triangle(a,d,c);}else{w.triangle(a,b,c);w.triangle(a,c,d);}
      }
      meridian+=step;
    }
  };
  const cap=(y:number,rx:number,rz:number,n:Vec)=>{
    const center:Vec=[cx,y,cz];const ci=w.vertex(center,n,[rx,rz]);
    const points=Array.from({length:SEGMENTS},(_,i):Vec=>[cx+Math.sin(TAU*i/SEGMENTS)*rx,y,cz-Math.cos(TAU*i/SEGMENTS)*rz]);
    const ids=points.map(p=>w.vertex(p,n,metricUv(p,n,points)));
    for(let i=0;i<SEGMENTS;i++){const a=ids[i],b=ids[(i+1)%SEGMENTS];if(n[1]>0)w.triangle(ci,b,a);else w.triangle(ci,a,b);}
  };
  wall(outer,false);wall(inner,true);
  const bridge=(o:Ring,ir:Ring,n:Vec)=>{
    for(let i=0;i<SEGMENTS;i++) {
      const a=point(o,i),b=point(o,i+1),c=point(ir,i+1),d=point(ir,i);
      w.quad([a,b,c,d],n);
    }
  };
  bridge(outer[outer.length-1],inner[inner.length-1],[0,1,0]);
  if(through) bridge(inner[0],outer[0],[0,-1,0]);
  else {cap(outer[0][0],outer[0][1],outer[0][2],[0,-1,0]);cap(inner[0][0],inner[0][1],inner[0][2],[0,1,0]);}
}

function vessel(w:MeshWriter,b:Bounds,st:ModelStateRecord,part:ModelPartRecord):boolean {
  const rx=(b.x[1]-b.x[0])/2,rz=(b.z[1]-b.z[0])/2,cx=(b.x[0]+b.x[1])/2,cz=(b.z[0]+b.z[1])/2;
  if(st.plantSpec && part.id==="pot") {
    const spec=st.plantSpec,H=Number(st.state)/1000,t=Math.max(spec.wallMinimum,spec.wallFactor*H);
    const bottomR=spec.potBottomRadius*H,topR=spec.potTopRadius*H;
    const bottomInner=bottomR+(topR-bottomR)*t/(b.y[1]-b.y[0])-t;
    lathedShell(w,0,0,[[b.y[0],bottomR,bottomR],[b.y[1],topR,topR]],[[b.y[0]+t,bottomInner,bottomInner],[b.y[1],topR-t,topR-t]],false);
    return true;
  }
  const profile=st.profiles?.[part.id];
  if(profile) {
    const [section,bottomDivisor,shoulderRatio,wallDivisor,mouthRadius]=profile;
    const H=b.y[1]-b.y[0],floor=H/Number(bottomDivisor),shoulder=Number(shoulderRatio.split("/")[0])/Number(shoulderRatio.split("/")[1]);
    const wall=H/Number(wallDivisor),neck=Number(mouthRadius)+wall;
    const nr=section==="ellipse"?neck:neck;
    lathedShell(w,cx,cz,[[b.y[0],rx,rz],[b.y[0]+H*shoulder,rx,rz],[b.y[1],nr,nr]],
      [[b.y[0]+floor,Math.max(rx-wall,0.000001),Math.max(rz-wall,0.000001)],[b.y[0]+H*shoulder,Math.max(rx-wall,0.000001),Math.max(rz-wall,0.000001)],[b.y[1],Number(mouthRadius),Number(mouthRadius)]],false);
    return true;
  }
  const ellipse=st.ellipse?.[part.id];
  if(ellipse) {
    const [ex,ez,ix,iz,ox,oz]=ellipse;
    const through=part.id!=="bowl";
    const floor=through?b.y[0]:b.y[1]-0.14; // toilet H2: bowl-cavity-depth = 0.14 m
    lathedShell(w,ex,ez,[[b.y[0],ox,oz],[b.y[1],ox,oz]],[[floor,ix,iz],[b.y[1],ix,iz]],through);
    return true;
  }
  const bore=st.bores?.[part.id];
  if(bore?.axis==="-y" && !st.voids?.[part.id]) {
    const radius=Number(bore.args[0]),yrange=bore.args[1].replace("−","-").split("..").map(Number);
    if(yrange.length!==2 || !yrange.every(Number.isFinite)) throw Error(`invalid bore ${part.id}`);
    lathedShell(w,cx,cz,[[b.y[0],rx,rz],[b.y[1],rx,rz]],[[yrange[0],radius,radius],[b.y[1],radius,radius]],yrange[0]===b.y[0]);
    return true;
  }
  return false;
}

function boreCuts(bore:{axis:string;args:string[]},part:Bounds):Bounds[] {
  let axis:0|1|2,centerA:number,centerB:number,radius:number,interval:[number,number];
  const numeric=(s:string)=>Number(s.replace("−","-"));
  const span=(s:string):[number,number]=>{const values=s.split("..").map(numeric);if(values.length!==2||!values.every(Number.isFinite))throw Error(`invalid bore span ${s}`);return [values[0],values[1]];};
  if(bore.axis==="-z") {axis=2;centerA=numeric(bore.args[0]);centerB=numeric(bore.args[1]);radius=numeric(bore.args[2]);interval=span(bore.args[3]);}
  else if(bore.axis==="-x") {axis=0;interval=span(bore.args[0]);centerA=numeric(bore.args[1]);centerB=numeric(bore.args[2]);radius=numeric(bore.args[3]);}
  else {axis=1;radius=numeric(bore.args[0]);interval=span(bore.args[1]);centerA=(part.x[0]+part.x[1])/2;centerB=(part.z[0]+part.z[1])/2;}
  // The axial 24-gon is represented by its twelve symmetric rectangular
  // bands for the common orthogonal cut producer. Its bore axis and radius
  // come from the reviewed @bore declaration, not from a viewer tolerance.
  const values=[...new Set(Array.from({length:SEGMENTS},(_,i)=>Math.round(Math.sin(TAU*i/SEGMENTS)*radius*1e9)/1e9))].sort((a,b)=>a-b);
  const cuts:Bounds[]=[];
  for(let i=0;i<values.length-1;i++) {
    const mid=(values[i]+values[i+1])/2;
    const half=radius*Math.cos(Math.asin(Math.min(1,Math.abs(mid/radius))));
    const a:[number,number]=[centerA-half,centerA+half];
    const b:[number,number]=[centerB+values[i],centerB+values[i+1]];
    cuts.push(axis===2?{x:a,y:b,z:interval}:axis===0?{x:interval,y:b,z:a}:{x:a,y:interval,z:b});
  }
  return cuts;
}

function plantLeaf(w:MeshWriter,b:Bounds,apex:number[],thickness:number):void {
  const a:Vec=[apex[0],apex[1],apex[2]];
  // Reviewed leaf AABBs are the finite end wedge extents. The beginning is
  // its single @plant-apex; the four remaining vertices form its end edge.
  const end:Vec[]=[
    [b.x[0],b.y[1],b.z[0]], [b.x[1],b.y[1],b.z[0]],
    [b.x[0],b.y[1]-thickness,b.z[1]], [b.x[1],b.y[1]-thickness,b.z[1]],
  ];
  const faces:[Vec,Vec,Vec][]=[[a,end[0],end[1]],[a,end[1],end[3]],[a,end[3],end[2]],[a,end[2],end[0]],[end[0],end[2],end[3]],[end[0],end[3],end[1]]];
  for(const face of faces){const n=normalize(cross(sub(face[1],face[0]),sub(face[2],face[0])));const ids=face.map(p=>w.vertex(p,n,[Math.hypot(p[0]-a[0],p[2]-a[2]),p[1]-a[1]]));w.triangle(ids[0],ids[1],ids[2]);}
}

function buildPart(part:ModelPartRecord,state:ModelStateRecord):IAutoMovieMesh {
  const w=new MeshWriter();const bounds:Bounds={x:part.x,y:part.y,z:part.z};
  if(state.apices?.[part.id]) {
    if (!state.plantSpec) throw Error("plant leaf lacks authored specification");
    plantLeaf(w,bounds,state.apices[part.id],state.plantSpec.leafThickness*Number(state.state)/1000);
  }
  else if(part.shape==="hollow" && vessel(w,bounds,state,part)) { /* authored cavity */ }
  else if(state.radial?.[part.id] && state.radial[part.id][2]>0) radialShell(w,bounds,state.radial[part.id]);
  else if(part.shape==="hollow") {
    const voids=[...(state.voids?.[part.id]??[]),...(state.bores?.[part.id]?boreCuts(state.bores[part.id],bounds):[])];
    const pieces=state.pieces?.[part.id]??[];
    if(!voids.length&&!pieces.length)throw Error(`hollow part without authored cavity: ${state.state}/${part.id}`);
    cutBoxes(w,bounds,pieces,voids);
  }
  else if(part.shape==="cylinder") cylinder(w,bounds);
  else if(part.shape==="curved") ellipsoid(w,bounds);
  else planarBox(w,bounds);
  return w.finish();
}

/** Builds exactly the selected reviewed state; material ownership stays downstream. */
export class ModelRepresentation {
  static build(prototype:ModelPrototype,stateName:string,materialFor:(anchor:string,state:string,part:string)=>IAutoMovieMaterial):IAutoMovieModel {
    const state=prototype.states.find(item=>item.state===stateName);
    if(!state) throw Error(`unknown state ${prototype.anchor}/${stateName}`);
    const materials=new Map<string,IAutoMovieMaterial>();
    const parts=state.parts.map(record=>{
      const material=materialFor(prototype.anchor,stateName,record.id);
      if(!material || !material.id) throw Error(`material missing for ${prototype.anchor}/${stateName}/${record.id}`);
      const previous=materials.get(material.id);
      if(previous && previous!==material && JSON.stringify(previous)!==JSON.stringify(material)) throw Error(`conflicting material ${material.id}`);
      materials.set(material.id,material);
      return {id:record.id,name:record.id,geometry:{type:"mesh" as const,mesh:buildPart(record,state)},material:material.id,attachedBone:null,transform:null};
    });
    // Cabinet is explicitly named by its shape/mm/state token. Flex work and
    // guest sleep remain two fixed results of one reviewed prototype identity.
    const id=prototype.anchor==="cabinet-and-shelf"?`cabinet/${stateName}`:
      prototype.anchor==="murphy-bed"?"murphy-bed":
      prototype.anchor==="work-desk"&&(stateName==="folded"||stateName==="open")?"work-desk/flex":
      `${prototype.anchor}/${stateName}`;
    return {id,name:prototype.name,origin:"generated",parts,materials:[...materials.values()],asset:null,skeleton:null,body:null};
  }
}
