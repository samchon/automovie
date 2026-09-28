/** Explicit metric door mesh operations; the three door owners select their geometry. */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

export const doorModel = (
  name: string,
  parts: IAutoMovieModelPart[],
): IAutoMovieModel => ({
  id: `exterior-door:${name}`,
  name,
  origin: "generated",
  parts,
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});

export type Box = readonly [number, number, number, number, number, number];
export type Face = "jamb" | "exterior-trim" | "casing" | "leaf-exterior" |
  "leaf-interior" | "leaf-edge" | "leaf-panel" | "muntin" | "sash" |
  "glass" | "hinge" | "handle";
export type Vec3 = readonly [number, number, number];

const empty = (): IAutoMovieMesh => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
  skin: null,
});

const quad = (mesh: IAutoMovieMesh, vertices: readonly Vec3[], normal: Vec3,
  uv: (v: Vec3) => readonly [number, number]): void => {
  const first = mesh.positions.length / 3;
  for (const v of vertices) {
    mesh.positions.push(...v);
    mesh.normals!.push(...normal);
    mesh.uvs!.push(...uv(v));
  }
  mesh.indices!.push(first, first + 1, first + 2, first, first + 2, first + 3);
};

/** One closed member, optionally split by the three material-facing families. */
export const boxMeshes = (b: Box, front: Face, back = front, edge = front,
  length: "x" | "y" | null = null): readonly [Face, IAutoMovieMesh][] => {
  const [x0, x1, y0, y1, z0, z1] = b;
  if (![...b].every(Number.isFinite) || x1 <= x0 || y1 <= y0 || z1 <= z0)
    throw new Error(`invalid exterior-door member: ${b.join(",")}`);
  const groups = new Map<Face, IAutoMovieMesh>();
  const face = (id: Face, points: readonly Vec3[], n: Vec3): void => {
    const mesh = groups.get(id) ?? empty();
    groups.set(id, mesh);
    quad(mesh, points, n, ([x, y, z]) => {
      if (length === "y") return [y - y0, Math.abs(n[2]) === 1 ? x - x0 : z - z0];
      if (length === "x") return [x - x0, Math.abs(n[1]) === 1 ? z - z0 : y - y0];
      if (Math.abs(n[2]) === 1) return [x - x0, y - y0];
      if (Math.abs(n[1]) === 1) return [x - x0, z - z0];
      return [z - z0, y - y0];
    });
  };
  face(
    front,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    [0, 0, 1],
  );
  face(
    back,
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    [0, 0, -1],
  );
  face(
    edge,
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    [1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ],
    [-1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 1, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    [0, -1, 0],
  );
  return [...groups];
};

type Notch = "edge-left" | "edge-right" | "corner-right-bottom" |
  "corner-left-top" | "corner-right-top";

/** Extrude a member with a true polygonal hinge-cylinder subtraction. */
export const hingeCut = (b: Box, axisX: number, axisZ: number, radius: number,
  notch: Notch, front: Face, back: Face, edge: Face): readonly [Face, IAutoMovieMesh][] => {
  const [x0,x1,y0,y1,z0,z1]=b, poly: [number,number][]=[];
  const push=(x:number,z:number):void=>{
    poly.push([x,z]);
  };
  const half=12,quarter=6,step=Math.PI/12;
  if(notch==="edge-left"){
    push(x0,z0);
    push(x1,z0);
    push(x1,z1);
    push(x0,z1);
    push(x0,axisZ+radius);
    for(let i=1;i<=half;i++)push(
      axisX+radius*Math.sin(i*step),
      axisZ+radius*Math.cos(i*step),
    );
  } else if(notch==="edge-right"){
    push(x0,z0);
    push(x1,z0);
    push(x1,axisZ-radius);
    for(let i=1;i<=half;i++)push(
      axisX-radius*Math.sin(i*step),
      axisZ-radius*Math.cos(i*step),
    );
    push(x1,z1);
    push(x0,z1);
  } else if(notch==="corner-right-bottom"){
    push(x0,z0);
    push(axisX-radius,z0);
    for(let i=1;i<=quarter;i++)push(
      axisX-radius*Math.cos(i*step),
      axisZ+radius*Math.sin(i*step),
    );
    push(x1,z1);
    push(x0,z1);
  } else if(notch==="corner-left-top"){
    push(x0,z0);
    push(x1,z0);
    push(x1,z1);
    push(axisX+radius,z1);
    for(let i=1;i<=quarter;i++)push(
      axisX+radius*Math.cos(i*step),
      axisZ-radius*Math.sin(i*step),
    );
  } else{
    push(x0,z0);
    push(x1,z0);
    push(x1,axisZ-radius);
    for(let i=1;i<=quarter;i++)push(
      axisX-radius*Math.sin(i*step),
      axisZ-radius*Math.cos(i*step),
    );
    push(x0,z1);
  }
  const groups=new Map<Face,IAutoMovieMesh>();
  const surface=(id:Face):IAutoMovieMesh=>{
    const m=groups.get(id)??empty();
    groups.set(id,m);
    return m;
  };
  for(let i=0;i<poly.length;i++){
    const a=poly[i]!,b2=poly[(i+1)%poly.length]!;
    const dx=b2[0]-a[0],dz=b2[1]-a[1],length=Math.hypot(dx,dz);
    if(length<1e-12)continue;
    const id=Math.abs(a[1]-z1)<1e-9&&Math.abs(b2[1]-z1)<1e-9
      ? front
      : Math.abs(a[1]-z0)<1e-9&&Math.abs(b2[1]-z0)<1e-9
        ? back
        : edge;
    const n:Vec3=[dz/length,0,-dx/length];
    quad(
      surface(id),
      [
        [a[0], y0, a[1]],
        [a[0], y1, a[1]],
        [b2[0], y1, b2[1]],
        [b2[0], y0, b2[1]],
      ],
      n,
      ([x,y,z])=>[Math.hypot(x-a[0], z-a[1]), y-y0],
    );
  }
  // Ear clipping retains the open circular notch in both end caps.
  const cross=(a:readonly number[],b2:readonly number[],c:readonly number[]):number=>
    (b2[0]!-a[0]!)*(c[1]!-a[1]!)-(b2[1]!-a[1]!)*(c[0]!-a[0]!);
  const active=poly.map((_,i)=>i), triangles:number[][]=[];
  while(active.length>3){
    let found=false;
    for(let k=0;k<active.length;k++){
      const ia=active[(k+active.length-1)%active.length]!,ib=active[k]!,
        ic=active[(k+1)%active.length]!;
      const a=poly[ia]!,b2=poly[ib]!,c=poly[ic]!;
      if(cross(a,b2,c)<=1e-12)continue;
      const inside=active.some((p)=>{
        if(p===ia||p===ib||p===ic)return false;
        const q=poly[p]!;
        return cross(a,b2,q)>1e-12&&cross(b2,c,q)>1e-12&&cross(c,a,q)>1e-12;
      });
      if(inside)continue;
      triangles.push([ia,ib,ic]);
      active.splice(k,1);
      found=true;
      break;
    }
    if(!found)throw new Error(`hinge notch could not triangulate: ${notch}`);
  }
  triangles.push(active);
  for(const tri of triangles){
    for(const [y,normal,order] of [
      [y0, -1, tri],
      [y1, 1, [tri[2]!, tri[1]!, tri[0]!]],
    ] as const){
      const m=surface(edge),first=m.positions.length/3;
      for(const i of order){
        const [x,z]=poly[i]!;
        m.positions.push(x, y, z);
        m.normals!.push(0, normal, 0);
        m.uvs!.push(x-x0, z-z0);
      }
      m.indices!.push(first,first+1,first+2);
    }
  }
  return [...groups];
};

/** Closed cylinder with metric circumferential and axial UVs. */
export const cylinder = (axis: "x" | "y" | "z", center: Vec3, radius: number,
  start: number, end: number): IAutoMovieMesh => {
  if(![...center,radius,start,end].every(Number.isFinite)||radius<=0||end<=start)
    throw new Error("invalid exterior door cylinder");
  const mesh = empty(), sides = 24;
  const point = (a: number, t: number): Vec3 => {
    const u = radius * Math.sin(a), v = radius * Math.cos(a);
    return axis === "x"
      ? [t, center[1] + u, center[2] + v]
      : axis === "y"
        ? [center[0] + u, t, center[2] + v]
        : [center[0] + u, center[1] + v, t];
  };
  const radial = (a: number): Vec3 => axis === "x"
    ? [0, Math.sin(a), Math.cos(a)]
    : axis === "y"
      ? [Math.sin(a), 0, Math.cos(a)]
      : [Math.sin(a), Math.cos(a), 0];
  for (let i = 0; i < sides; i++) {
    const a = i * 2*Math.PI/sides, b = (i+1)*2*Math.PI/sides;
    const p = [
      point(a, start),
      point(b, start),
      point(b, end),
      point(a, end),
    ] as const;
    // Separate vertices at each facet provide its own flat normal.
    const mid = radial((a+b)/2);
    quad(mesh, axis === "y" ? p : [p[3], p[2], p[1], p[0]], mid, (v) => [
      radius * (v === p[0] || v === p[3] ? a : b),
      axis === "x" ? v[0]-start : axis === "y" ? v[1]-start : v[2]-start,
    ]);
    const cap = (t: number, sign: number): void => {
      const c = axis === "x"
        ? [t,center[1],center[2]] as Vec3
        : axis === "y"
          ? [center[0],t,center[2]] as Vec3
          : [center[0],center[1],t] as Vec3;
      const v0 = point(a,t), v1 = point(b,t);
      const n = axis === "x"
        ? [sign,0,0] as Vec3
        : axis === "y"
          ? [0,sign,0] as Vec3
          : [0,0,sign] as Vec3;
      const first = mesh.positions.length/3;
      for (const v of [c,v0,v1]) {
        mesh.positions.push(...v);
        mesh.normals!.push(...n);
        const uv: readonly [number,number] = axis === "x"
          ? [v[1]-center[1], v[2]-center[2]]
          : axis === "y"
            ? [v[0]-center[0], v[2]-center[2]]
            : [v[0]-center[0], v[1]-center[1]];
        mesh.uvs!.push(...uv);
      }
      if ((sign === 1) === (axis === "y")) mesh.indices!.push(
        first,
        first+1,
        first+2,
      );
      else mesh.indices!.push(first,first+2,first+1);
    };
    cap(start,-1);
    cap(end,1);
  }
  return mesh;
};

export const rotateY = (mesh: IAutoMovieMesh, pivot: Vec3, radians: number): void => {
  const c = Math.cos(radians), s = Math.sin(radians);
  for (let i=0; i<mesh.positions.length; i+=3) {
    const x=mesh.positions[i]! - pivot[0], z=mesh.positions[i+2]! - pivot[2];
    mesh.positions[i]=pivot[0]+c*x+s*z;
    mesh.positions[i+2]=pivot[2]-s*x+c*z;
    const nx=mesh.normals![i]!, nz=mesh.normals![i+2]!;
    mesh.normals![i]=c*nx+s*nz;
    mesh.normals![i+2]=-s*nx+c*nz;
  }
};
