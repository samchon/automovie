import { IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/** Coordinates and part identities are copied from the reviewed @part rows. */
export interface ModelPartRecord {
  id: string;
  shape: "box" | "cylinder" | "curved" | "hollow" | "mitered-box";
  x: [number, number]; y: [number, number]; z: [number, number];
}
export interface ModelStateRecord {
  state: string;
  envelope: Bounds;
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
  compose?: {anchor:string;state:string;offset:[number,number,number]};
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
  quad(points: [Vec, Vec, Vec, Vec], normal: Vec, uvReference: Vec[] = points): void {
    const face = points.map(p => this.vertex(p, normal, metricUv(p, normal, uvReference)));
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
function planarBox(w: MeshWriter, b: Bounds, skipAxis = -1): void {
  const [x0,x1]=b.x, [y0,y1]=b.y, [z0,z1]=b.z;
  if(skipAxis!==0){w.quad([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],[-1,0,0]);w.quad([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]);}
  if(skipAxis!==2){w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],[0,0,-1]);w.quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);}
  if(skipAxis!==1){w.quad([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0]);w.quad([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[0,1,0]);}
}

/** Extrude the reviewed 45-degree half-plane at each end of a stool ring bar. */
function miteredBox(w: MeshWriter, b: Bounds): void {
  const [x0,x1]=b.x,[y0,y1]=b.y,[z0,z1]=b.z;
  const xLong=x1-x0>z1-z0;
  const cx=(x0+x1)/2,cz=(z0+z1)/2;
  const half=(xLong?z1-z0:x1-x0)/2;
  const profile:[number,number][]=xLong
    ? [[x0,cz<0?z0:z1],[x1,cz<0?z0:z1],[x1,cz],
      [x1-half,cz<0?z1:z0],[x0+half,cz<0?z1:z0],[x0,cz]]
    : [[cx<0?x0:x1,z0],[cx<0?x0:x1,z1],[cx,z1],
      [cx<0?x1:x0,z1-half],[cx<0?x1:x0,z0+half],[cx,z0]];
  const area=profile.reduce((sum,p,i)=>{
    const q=profile[(i+1)%profile.length];return sum+p[0]*q[1]-q[0]*p[1];
  },0);
  for(const [y,normal] of [[y0,-1],[y1,1]] as const){
    const n:Vec=[0,normal,0];
    const ids=profile.map(([x,z])=>w.vertex([x,y,z],n,[x-x0,z-z0]));
    for(let i=1;i<ids.length-1;i++)w.triangle(ids[0],ids[i],ids[i+1]);
  }
  for(let i=0;i<profile.length;i++){
    const a=profile[i],d=profile[(i+1)%profile.length];
    const dx=d[0]-a[0],dz=d[1]-a[1],length=Math.hypot(dx,dz);
    const sign=area>0?1:-1;
    const n:Vec=[sign*dz/length,0,-sign*dx/length];
    w.quad([[a[0],y0,a[1]],[d[0],y0,d[1]],[d[0],y1,d[1]],[a[0],y1,a[1]]],n);
  }
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
  const faces: Array<{points:[Vec,Vec,Vec,Vec];normal:Vec;plane:number}> = [];
  const face=(points:[Vec,Vec,Vec,Vec],normal:Vec,plane:number)=>faces.push({points,normal,plane});
  for(let i=0;i<intervals[0].length;i++) for(let j=0;j<intervals[1].length;j++) for(let k=0;k<intervals[2].length;k++) {
    if(!solid(i,j,k)) continue;
    const [x0,x1]=intervals[0][i], [y0,y1]=intervals[1][j], [z0,z1]=intervals[2][k];
    if(!solid(i-1,j,k)) face([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],[-1,0,0],x0);
    if(!solid(i+1,j,k)) face([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0],x1);
    if(!solid(i,j-1,k)) face([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0],y0);
    if(!solid(i,j+1,k)) face([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[0,1,0],y1);
    if(!solid(i,j,k-1)) face([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],[0,0,-1],z0);
    if(!solid(i,j,k+1)) face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1],z1);
  }
  const groups=new Map<string,Vec[]>();
  for(const f of faces){const key=`${f.normal.join(",")}/${f.plane}`;groups.set(key,[...(groups.get(key)??[]),...f.points]);}
  for(const f of faces)w.quad(f.points,f.normal,groups.get(`${f.normal.join(",")}/${f.plane}`)!);
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

const box=(x0:number,x1:number,y0:number,y1:number,z0:number,z1:number):Bounds=>({x:[x0,x1],y:[y0,y1],z:[z0,z1]});

function wheelRing(w:MeshWriter,cx:number,cy:number,z0:number,z1:number,r:number):void {
  const inner=r*7/8;
  const p=(radius:number,z:number,i:number):Vec=>[cx+Math.sin(TAU*i/SEGMENTS)*radius,cy-Math.cos(TAU*i/SEGMENTS)*radius,z];
  for(let i=0;i<SEGMENTS;i++){
    const a=p(r,z0,i),b=p(r,z0,i+1),c=p(r,z1,i+1),d=p(r,z1,i);
    const e=p(inner,z0,i),f=p(inner,z0,i+1),g=p(inner,z1,i+1),h=p(inner,z1,i);
    const n:Vec=[Math.sin(TAU*(i+.5)/SEGMENTS),-Math.cos(TAU*(i+.5)/SEGMENTS),0];
    w.quad([a,b,c,d],n);w.quad([f,e,h,g],[-n[0],-n[1],0]);
    w.quad([a,e,f,b],[0,0,-1]);w.quad([d,c,g,h],[0,0,1]);
  }
}

function barXY(w:MeshWriter,a:[number,number],b:[number,number],radius:number,z=0):void {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const nx=-dy/length*radius,ny=dx/length*radius;
  const left:Vec=[a[0]+nx,a[1]+ny,z-radius],right:Vec=[a[0]-nx,a[1]-ny,z-radius];
  const frontLeft:Vec=[b[0]+nx,b[1]+ny,z-radius],frontRight:Vec=[b[0]-nx,b[1]-ny,z-radius];
  const backLeft:Vec=[a[0]+nx,a[1]+ny,z+radius],backRight:Vec=[a[0]-nx,a[1]-ny,z+radius];
  const farLeft:Vec=[b[0]+nx,b[1]+ny,z+radius],farRight:Vec=[b[0]-nx,b[1]-ny,z+radius];
  w.quad([left,frontLeft,farLeft,backLeft],[nx/radius,ny/radius,0]);
  w.quad([frontRight,right,backRight,farRight],[-nx/radius,-ny/radius,0]);
  w.quad([right,frontRight,frontLeft,left],[0,0,-1]);
  w.quad([backLeft,farLeft,farRight,backRight],[0,0,1]);
  w.quad([right,left,backLeft,backRight],[-dx/length,-dy/length,0]);
  w.quad([frontLeft,frontRight,farRight,farLeft],[dx/length,dy/length,0]);
}

/** Coarse silhouette substitutions use only ratios and occupied intervals fixed in the matching reviewed H2. */
function authoredSilhouette(w:MeshWriter,b:Bounds,anchor:string,state:string,part:string):boolean {
  const [x0,x1]=b.x,[y0,y1]=b.y,[z0,z1]=b.z;
  const W=x1-x0,H=y1-y0,D=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const union=(pieces:Bounds[]):boolean=>{cutBoxes(w,b,pieces,[]);return true;};
  if((anchor==='dining-chair'&&part==='back') || (anchor==='desk-chair'&&(part==='shell-seat'||part==='shell-back')) ||
    (anchor==='bath-accessories'&&state==='tissue-pack')) {planarBox(w,b);return true;}
  if(anchor==='household-tools') {
    if(state==='vacuum'||state==='cleaning-tool'||state==='garden-tool') {
      const head=state==='vacuum'?H/4:H/10, radius=state==='vacuum'?Math.min(W,D)/12:Math.min(W,D)/8;
      return union([box(x0,x1,y0,y0+head,z0,z1),box(cx-radius,cx+radius,y0+head,y1,cz-radius,cz+radius)]);
    }
    if(state==='folded-ladder') {
      const rail=W/10,step=W/12;
      const pieces=[box(x0,x0+rail,y0,y1,z0,z1),box(x1-rail,x1,y0,y1,z0,z1)];
      for(let j=1;j<=5;j++)pieces.push(box(x0+rail,x1-rail,y0+j*H/6-step/2,y0+j*H/6+step/2,cz-D/6,cz+D/6));
      return union(pieces);
    }
  }
  if(anchor==='exterior-furnishings') {
    if(state==='outdoor-bench'||state==='outdoor-chair'||state==='outdoor-table') {
      const seat=state!=='outdoor-table',base=seat?y0+0.55*H:y1-H/12,top=base+H/12;
      const legW=W/16,legD=D/12;
      const pieces=[box(x0,x1,base,top,z0,z1)];
      if(seat)pieces.push(box(x0,x1,base,y1,z0,z0+D/12));
      for(const x of [x0,x1-legW])for(const z of [z0,z1-legD])pieces.push(box(x,x+legW,y0,base,z,z+legD));
      return union(pieces);
    }
    if(state==='bike-rack') {
      const foot=H/16,post=W/12;
      return union([box(x0,x0+post,y0,y1-foot,z0,z1),box(x1-post,x1,y0,y1-foot,z0,z1),
        box(x0,x1,y1-foot,y1,cz-post/2,cz+post/2),
        box(x0,x0+post,y0,y0+foot,z0,z1),box(x1-post,x1,y0,y0+foot,z0,z1)]);
    }
    if(state==='bicycle') {
      const wheelX=0.545,wheelY=0.34,r=wheelY,halfZ=0.0175,frameR=W/120;
      for(const x of [-wheelX,wheelX])wheelRing(w,x,wheelY,-halfZ,halfZ,r);
      const A:[number,number]=[-wheelX,wheelY],B:[number,number]=[0,0.70],C:[number,number]=[wheelX,wheelY];
      const Dn:[number,number]=[0,0.40],E:[number,number]=[-W/8,0.93-H/80];
      for(const [start,end] of [[A,B],[B,Dn],[Dn,A],[B,C],[C,Dn],[B,E]] as [typeof A,typeof A][])barXY(w,start,end,frameR);
      barXY(w,C,[W/4,H-frameR],frameR);
      planarBox(w,box(-W/8-W/10,-W/8+W/10,0.93-H/40,0.93,-D/8,D/8));
      planarBox(w,box(W/4-frameR,W/4+frameR,H-2*frameR,H,z0,z1));
      return true;
    }
  }
  if(anchor==='personal-articles') {
    if(state==='shoe')return union([box(x0,x1,y0,y0+H/8,z0,z1),box(x0,x1,y0+H/8,y1,z0,cz),
      box(x0,x1,y0+H/8,y0+H/2,cz,z1)]);
    if(state==='hanger')return union([box(x0,x1,y0,y0+H/5,z0,z1),
      box(cx-W/20,cx+W/20,y0+H/5,y1,z0,z1)]);
    if(state==='umbrella')return union([box(cx-W/8,cx+W/8,y0,y0+H/16,cz-D/8,cz+D/8),
      box(cx-W/2,cx+W/2,y0+H/16,y0+7*H/8,cz-D/2,cz+D/2),
      box(cx-W/6,cx+W/6,y0+7*H/8,y1,cz-D/6,cz+D/6)]);
  }
  if(anchor==='dining-wares'&&(state==='fork'||state==='spoon'||state==='table-knife')) {
    const handleW=state==='spoon'?W/3:W/2,headZ=state==='table-knife'?cz:z0+3*D/4;
    const pieces=[box(cx-handleW/2,cx+handleW/2,y0,y0+H/2,z0,headZ)];
    if(state==='fork')for(let j=0;j<4;j++)pieces.push(box(x0+j*2*W/7,x0+(j*2+1)*W/7,y0,y1,headZ,z1));
    else pieces.push(box(x0,x1,y0,y1,headZ,z1));
    return union(pieces);
  }
  if(anchor==='kitchen-smallwares') {
    if(state==='utensil')return union([box(cx-W/6,cx+W/6,y0,y0+H/2,z0,z0+3*D/4),
      box(x0,x1,y0,y1,z0+3*D/4,z1)]);
    if(state==='drying-rack'){
      const bar=W/16;
      const pieces=[box(x0,x0+bar,y0,y1,z0,z1),box(x1-bar,x1,y0,y1,z0,z1)];
      for(let j=0;j<5;j++){const z=z0+(j+1)*D/6;pieces.push(box(x0+bar,x1-bar,y0,y0+H/10,z,z+D/24));}
      return union(pieces);
    }
  }
  if(anchor==='wall-accessories') {
    if(state==='wall-sconce')return union([box(x0,x1,y0,y1,z0,z0+D/8),
      box(cx-W/16,cx+W/16,y0+H/2,y0+H/2+W/8,z0+D/8,z0+5*D/8),
      box(x0,x1,y0+H/2,y1,z0+5*D/8,z1)]);
    if(state==='coat-hook'){
      const arm=W/16,armY=y0+H/2;
      return union([box(x0,x1,y0,armY,z0,z0+D/8),
        ...[x0+W/10,x1-W/10-arm].flatMap(x=>[box(x,x+arm,armY-arm/2,armY+arm,z0+D/16,z1),
          box(x,x+arm,armY,y1,z1-arm,z1)])]);
    }
  }
  return false;
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
    const reference=Array.from({length:SEGMENTS},(_,i)=>point(o,i));
    for(let i=0;i<SEGMENTS;i++) {
      const a=point(o,i),b=point(o,i+1),c=point(ir,i+1),d=point(ir,i);
      w.quad([a,b,c,d],n,reference);
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

/** A 24-sided axial bore through the authored interval of a rectangular host. */
function boxWithBore(w:MeshWriter,b:Bounds,bore:{axis:string;args:string[]}):boolean {
  if(bore.axis!=="-x"&&bore.axis!=="-z")throw Error(`unsupported box bore axis ${bore.axis}`);
  const numeric=(s:string)=>Number(s.replace("−","-"));
  const range=(s:string):[number,number]=>{const values=s.split("..").map(numeric);if(values.length!==2||!values.every(Number.isFinite))throw Error(`invalid bore ${s}`);return [values[0],values[1]];};
  const axis= bore.axis==="-x"?0:2;
  const axial=axis===0?b.x:b.z;
  const span=axis===0?range(bore.args[0]):range(bore.args[3]);
  const centerU=axis===0?numeric(bore.args[1]):numeric(bore.args[0]);
  const centerV=axis===0?numeric(bore.args[2]):numeric(bore.args[1]);
  const radius=axis===0?numeric(bore.args[3]):numeric(bore.args[2]);
  const u=axis===0?b.y:b.x,v=axis===0?b.z:b.y;
  if(span[0]<axial[0]-1e-8||span[1]>axial[1]+1e-8||span[1]<=span[0]||
    radius<=0||centerU-radius<=u[0]||centerU+radius>=u[1]||centerV-radius<=v[0]||centerV+radius>=v[1]) return false;
  const point=(axialValue:number,uu:number,vv:number):Vec=>axis===0?[axialValue,uu,vv]:[uu,vv,axialValue];
  const normal=(sign:number):Vec=>axis===0?[sign,0,0]:[0,0,sign];
  const circle=(at:number,i:number):Vec=>point(at,centerU+radius*Math.cos(TAU*i/SEGMENTS),centerV+radius*Math.sin(TAU*i/SEGMENTS));
  const outer=(at:number,i:number):{point:Vec;side:number}=>{
    const du=Math.cos(TAU*i/SEGMENTS),dv=Math.sin(TAU*i/SEGMENTS);
    const tu=du>0?(u[1]-centerU)/du:du<0?(u[0]-centerU)/du:Infinity;
    const tv=dv>0?(v[1]-centerV)/dv:dv<0?(v[0]-centerV)/dv:Infinity;
    const scale=Math.min(tu,tv),side=tu<=tv?(du>0?0:2):(dv>0?1:3);
    let uu=centerU+du*scale,vv=centerV+dv*scale;
    if(side===0)uu=u[1];else if(side===2)uu=u[0];else if(side===1)vv=v[1];else vv=v[0];
    return {point:point(at,uu,vv),side};
  };
  const corner=(side:number):[number,number]=>side===0?[u[1],v[1]]:side===1?[u[0],v[1]]:side===2?[u[0],v[0]]:[u[1],v[0]];
  const boundary:Array<[number,number]>=[];
  for(let i=0;i<SEGMENTS;i++) {
    const a=outer(0,i),next=outer(0,(i+1)%SEGMENTS);
    boundary.push(axis===0?[a.point[1],a.point[2]]:[a.point[0],a.point[1]]);
    if(a.side!==next.side)boundary.push(corner(a.side));
  }
  for(let side=0;side<4;side++) {
    const fixed=side===0?u[1]:side===1?v[1]:side===2?u[0]:v[0];
    const along=(side===0||side===2?1:0);
    const values=[...new Set(boundary.filter(p=>Math.abs(p[1-along]-fixed)<1e-9).map(p=>p[along]))].sort((a,b)=>a-b);
    const n:Vec=axis===0?(side===0?[0,1,0]:side===1?[0,0,1]:side===2?[0,-1,0]:[0,0,-1]):
      (side===0?[1,0,0]:side===1?[0,1,0]:side===2?[-1,0,0]:[0,-1,0]);
    const uvReference=[point(axial[0],u[0],v[0]),point(axial[1],u[1],v[1])];
    for(let i=0;i<values.length-1;i++){
      const cross0:[number,number]=along===1?[fixed,values[i]]:[values[i],fixed];
      const cross1:[number,number]=along===1?[fixed,values[i+1]]:[values[i+1],fixed];
      w.quad([point(axial[0],...cross0),point(axial[1],...cross0),point(axial[1],...cross1),point(axial[0],...cross1)],n,uvReference);
    }
  }
  const faceReference=[point(0,u[0],v[0]),point(0,u[1],v[1])];
  for(const [end,sign] of [[0,-1],[1,1]] as const) {
    const at=axial[end],n=normal(sign);
    if(Math.abs(at-span[end])>1e-8){
      const ci=w.vertex(point(at,centerU,centerV),n,metricUv(point(at,centerU,centerV),n,faceReference));
      for(let i=0;i<boundary.length;i++){
        const a=point(at,...boundary[i]),next=point(at,...boundary[(i+1)%boundary.length]);
        const ia=w.vertex(a,n,metricUv(a,n,faceReference)),ib=w.vertex(next,n,metricUv(next,n,faceReference));
        w.triangle(ci,ia,ib);
      }
      continue;
    }
    for(let i=0;i<SEGMENTS;i++) {
      const a=outer(at,i),next=outer(at,(i+1)%SEGMENTS);
      w.quad([a.point,next.point,circle(at,(i+1)%SEGMENTS),circle(at,i)],n,faceReference);
      if(a.side!==next.side){
        const vertex=corner(a.side),p=point(at,vertex[0],vertex[1]);
        if(Math.hypot(...sub(a.point,p))>1e-12&&Math.hypot(...sub(next.point,p))>1e-12){
          const ids=[a.point,p,next.point].map(q=>w.vertex(q,n,metricUv(q,n,faceReference)));
          w.triangle(ids[0],ids[1],ids[2]);
        }
      }
    }
  }
  let arc=0;
  for(let i=0;i<SEGMENTS;i++){
    const edge=Math.hypot(...sub(circle(span[0],i+1),circle(span[0],i)));
    const radial:Vec=axis===0?[0,-Math.cos(TAU*(i+0.5)/SEGMENTS),-Math.sin(TAU*(i+0.5)/SEGMENTS)]:
      [-Math.cos(TAU*(i+0.5)/SEGMENTS),-Math.sin(TAU*(i+0.5)/SEGMENTS),0];
    const points=[circle(span[0],i),circle(span[0],i+1),circle(span[1],i+1),circle(span[1],i)];
    const uv:[[number,number],[number,number],[number,number],[number,number]]=[[arc,0],[arc+edge,0],[arc+edge,span[1]-span[0]],[arc,span[1]-span[0]]];
    const ids=points.map((p,j)=>w.vertex(p,radial,uv[j]));
    w.triangle(ids[0],ids[1],ids[2]);w.triangle(ids[0],ids[2],ids[3]);arc+=edge;
  }
  for(const [at,sign] of [[span[0],1],[span[1],-1]] as const){
    if(Math.abs(at-axial[sign>0?0:1])<=1e-8)continue;
    const n=normal(sign),center=point(at,centerU,centerV),reference=[point(at,centerU-radius,centerV-radius),point(at,centerU+radius,centerV+radius)];
    const ci=w.vertex(center,n,metricUv(center,n,reference));
    for(let i=0;i<SEGMENTS;i++){
      const a=circle(at,i),next=circle(at,i+1);
      const ia=w.vertex(a,n,metricUv(a,n,reference)),ib=w.vertex(next,n,metricUv(next,n,reference));
      w.triangle(ci,ia,ib);
    }
  }
  return true;
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
  const direction=normalize([(b.x[0]+b.x[1])/2-a[0],0,(b.z[0]+b.z[1])/2-a[2]]);
  const tangent:Vec=[-direction[2],0,direction[0]];
  for(const face of faces){
    const n=normalize(cross(sub(face[1],face[0]),sub(face[2],face[0])));
    const ids=face.map(p=>w.vertex(p,n,[dot(sub(p,a),tangent),Math.hypot(...sub(p,a))]));
    w.triangle(ids[0],ids[1],ids[2]);
  }
}

function buildPart(part:ModelPartRecord,state:ModelStateRecord,anchor:string):IAutoMovieMesh {
  const w=new MeshWriter();const bounds:Bounds={x:part.x,y:part.y,z:part.z};
  if(state.apices?.[part.id]) {
    if (!state.plantSpec) throw Error("plant leaf lacks authored specification");
    plantLeaf(w,bounds,state.apices[part.id],state.plantSpec.leafThickness*Number(state.state)/1000);
  }
  else if(part.shape==="hollow" && vessel(w,bounds,state,part)) { /* authored cavity */ }
  else if(state.radial?.[part.id] && state.radial[part.id][2]>0) radialShell(w,bounds,state.radial[part.id]);
  else if(part.shape==="hollow" && state.bores?.[part.id] && !state.voids?.[part.id] && !state.pieces?.[part.id] && state.bores[part.id].axis!=="-y" && boxWithBore(w,bounds,state.bores[part.id])) { /* circular host bore */ }
  else if(part.shape==="hollow") {
    const voids=[...(state.voids?.[part.id]??[]),...(state.bores?.[part.id]?boreCuts(state.bores[part.id],bounds):[])];
    const pieces=state.pieces?.[part.id]??[];
    if(!voids.length&&!pieces.length)throw Error(`hollow part without authored cavity: ${state.state}/${part.id}`);
    cutBoxes(w,bounds,pieces,voids);
  }
  else if(part.shape==="cylinder") cylinder(w,bounds);
  else if(part.shape==="mitered-box") miteredBox(w,bounds);
  else if(state.pieces?.[part.id]) cutBoxes(w,bounds,state.pieces[part.id],[]);
  else if(part.shape==="curved") {if(!authoredSilhouette(w,bounds,anchor,state.state,part.id))ellipsoid(w,bounds);}
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
      return {id:record.id,name:record.id,geometry:{type:"mesh" as const,mesh:buildPart(record,state,prototype.anchor)},material:material.id,attachedBone:null,transform:null};
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
