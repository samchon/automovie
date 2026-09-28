/**
 * Metric face construction for reviewed model prototypes. Inputs are local
 * metre coordinates. The explicit outline, grain axis and surface id remain
 * with each model owner; this module only emits faces and stable UV seams.
 * A change here invalidates every model mesh and neutral-board observation.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";
import { ObjectMesh } from "./object-mesh";

type Point = IAutoMovieVector3;
const p = (x: number, y: number, z: number): Point => ({ x, y, z });
const dot = (a: Point, b: Point) => a.x*b.x + a.y*b.y + a.z*b.z;
const sub = (a: Point, b: Point) => p(a.x-b.x, a.y-b.y, a.z-b.z);
const cross = (a: Point, b: Point) => p(
  a.y*b.z-a.z*b.y,
  a.z*b.x-a.x*b.z,
  a.x*b.y-a.y*b.x,
);
const norm = (a: Point) => {
  const d = Math.hypot(a.x,a.y,a.z);
  if (!(d > 1e-12)) throw new Error("zero face basis");
  return p(a.x/d, a.y/d, a.z/d);
};

/** A quad/convex polygon with optional metric lengthwise U and V=n×U. */
export const modelFace = (builder: ObjectMesh, part: string, vertices: readonly Point[],
  grain?: { origin: Point; direction: Point }): void => {
  if (grain === undefined) {
    builder.face(part, vertices);
    return;
  }
  const n = norm(
    cross(sub(vertices[1]!, vertices[0]!), sub(vertices[2]!, vertices[0]!)),
  );
  const along = grain.direction;
  const projected = p(
    along.x - dot(along,n)*n.x,
    along.y - dot(along,n)*n.y,
    along.z - dot(along,n)*n.z,
  );
  if (Math.hypot(projected.x,projected.y,projected.z) < 1e-10) {
    builder.face(part, vertices); // a cut end has the ordinary normal-based projection
    return;
  }
  const u = norm(projected), v = cross(n,u);
  builder.face(
    part,
    vertices,
    vertices.map((q) => {
      const offset = sub(q, grain.origin);
      return [dot(offset,u), dot(offset,v)] as const;
    }),
  );
};

/** A solid rectangular section; grain axis is the reviewed member's long axis. */
export const modelBox = (builder: ObjectMesh, part: string,
  min: Point, max: Point, grain?: { origin: Point; direction: Point }): void => {
  if (!(max.x > min.x && max.y > min.y && max.z > min.z))
    throw new Error(`${part}: positive box extents required`);
  const a=min.x,b=max.x,c=min.y,d=max.y,e=min.z,f=max.z;
  const faces = [
    [p(a,c,e),p(b,c,e),p(b,c,f),p(a,c,f)], // bottom -Y
    [p(a,d,f),p(b,d,f),p(b,d,e),p(a,d,e)], // top +Y
    [p(a,c,f),p(b,c,f),p(b,d,f),p(a,d,f)], // front +Z
    [p(b,c,e),p(a,c,e),p(a,d,e),p(b,d,e)], // back -Z
    [p(a,c,e),p(a,c,f),p(a,d,f),p(a,d,e)], // left -X
    [p(b,c,f),p(b,c,e),p(b,d,e),p(b,d,f)], // right +X
  ];
  for (const face of faces) modelFace(builder,part,face,grain);
};

/** Extrudes one counterclockwise XY section from back to front. */
export const modelExtrudeXY = (builder: ObjectMesh, part: string,
  section: readonly (readonly [number,number])[], back: number, front: number,
  grain?: { origin: Point; direction: Point }): void => {
  if (section.length < 3 || !(front > back)) throw new Error(
    `${part}: invalid XY section`,
  );
  // Ear clipping preserves the cap of a concave section; a fan can put
  // reversed triangles across a beam's underside notch.
  const cross2=(a:readonly [number,number],b:readonly [number,number],
    c:readonly [number,number])=>
    (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const active=section.map((_,i)=>i).filter((i)=>
    Math.abs(cross2(section[(i+section.length-1)%section.length]!,section[i]!,
      section[(i+1)%section.length]!))>1e-12);
  const triangles:number[][]=[];
  while(active.length>3){
    let cut=false;
    for(let j=0;j<active.length;j++){
      const ia=active[(j+active.length-1)%active.length]!,
        ib=active[j]!,ic=active[(j+1)%active.length]!;
      const a=section[ia]!,b=section[ib]!,c=section[ic]!;
      if(cross2(a,b,c)<=1e-12)continue;
      if(active.some((index)=>index!==ia&&index!==ib&&index!==ic&&
        cross2(a,b,section[index]!)>=-1e-12&&
        cross2(b,c,section[index]!)>=-1e-12&&
        cross2(c,a,section[index]!)>=-1e-12))continue;
      triangles.push([ia,ib,ic]);
      active.splice(j,1);
      cut=true;
      break;
    }
    if(!cut)throw new Error(`${part}: section cannot be triangulated`);
  }
  triangles.push([...active]);
  for(const triangle of triangles){
    modelFace(
      builder,
      part,
      triangle.map((i)=>{
        const [x,y]=section[i]!;
        return p(x, y, front);
      }),
      grain,
    );
    modelFace(
      builder,
      part,
      [...triangle].reverse().map((i)=>{
        const [x,y]=section[i]!;
        return p(x, y, back);
      }),
      grain,
    );
  }
  for(let i=0;i<section.length;i++){
    const [x0,y0]=section[i]!, [x1,y1]=section[(i+1)%section.length]!;
    modelFace(
      builder,
      part,
      [p(x0, y0, front), p(x0, y0, back), p(x1, y1, back), p(x1, y1, front)],
      grain,
    );
  }
};

/** Extrudes one counterclockwise YZ section across X. */
export const modelExtrudeYZ = (builder: ObjectMesh, part: string,
  section: readonly (readonly [number,number])[], left: number, right: number,
  grain?: { origin: Point; direction: Point }): void => {
  if (section.length < 3 || !(right > left)) throw new Error(
    `${part}: invalid YZ section`,
  );
  modelFace(
    builder,
    part,
    section.map(([y,z])=> p(right, y, z)),
    grain,
  );
  modelFace(
    builder,
    part,
    [...section].reverse().map(([y,z])=> p(left, y, z)),
    grain,
  );
  for(let i=0;i<section.length;i++){
    const [y0,z0]=section[i]!, [y1,z1]=section[(i+1)%section.length]!;
    modelFace(
      builder,
      part,
      [p(right, y0, z0), p(left, y0, z0), p(left, y1, z1), p(right, y1, z1)],
      grain,
    );
  }
};

/** A single part mesh from the authored face operations above. */
export const modelMesh = (builder: ObjectMesh, part: string): IAutoMovieMesh => {
  const geometry = builder.model(part,part).parts.find(
    (entry)=>entry.id===part,
  )?.geometry;
  if (geometry?.type !== "mesh") throw new Error(`${part}: mesh missing`);
  return geometry.mesh;
};

/** Faceted ellipsoid; the owner supplies every centre, radius and division. */
export const modelEllipsoid = (builder: ObjectMesh, part: string,
  center: Point, radii: Point, around: number, levels: number): void => {
  if (!(radii.x>0&&radii.y>0&&radii.z>0&&around>=3&&levels>=2))
    throw new Error(`${part}: invalid ellipsoid dimensions`);
  const at=(level:number,side:number):Point=>{
    const polar=Math.PI*level/levels,angle=2*Math.PI*side/around;
    return p(
      center.x+radii.x*Math.sin(polar)*Math.cos(angle),
      center.y+radii.y*Math.cos(polar),
      center.z-radii.z*Math.sin(polar)*Math.sin(angle),
    );
  };
  const top=p(center.x,center.y+radii.y,center.z);
  const bottom=p(center.x,center.y-radii.y,center.z);
  for(let side=0;side<around;side++){
    modelFace(builder,part,[top,at(1,side),at(1,side+1)]);
    for(let level=1;level<levels-1;level++)
      modelFace(builder, part, [
        at(level, side),
        at(level+1, side),
        at(level+1, side+1),
        at(level, side+1),
      ]);
    modelFace(builder,part,[bottom,at(levels-1,side+1),at(levels-1,side)]);
  }
};

/** Closed metric torus, with a seam at +X in XY and XZ or +Z in YZ. */
export const modelTorus = (center: Point, major: number, minor: number,
  plane: "xy" | "xz" | "yz", majorSegments: number, tubeSegments: number): IAutoMovieMesh => {
  if (!(major > minor && minor > 0 && majorSegments >= 3 && tubeSegments >= 3))
    throw new Error("torus: invalid reviewed radii or divisions");
  const positions: number[]=[], normals: number[]=[], uvs: number[]=[], indices: number[]=[];
  for(let i=0;i<=majorSegments;i++){
    const a=2*Math.PI*i/majorSegments, ca=Math.cos(a),sa=Math.sin(a);
    const radial=plane==="xy"
      ? p(ca, sa, 0)
      : plane==="xz"
        ? p(ca, 0, -sa)
        : p(0, sa, ca);
    const binormal=plane==="xy" ? p(0,0,1) : plane==="xz" ? p(0,1,0) : p(1,0,0);
    for(let j=0;j<=tubeSegments;j++){
      const b=2*Math.PI*j/tubeSegments, cb=Math.cos(b),sb=Math.sin(b);
      const n=p(
        radial.x*cb+binormal.x*sb,
        radial.y*cb+binormal.y*sb,
        radial.z*cb+binormal.z*sb,
      );
      positions.push(
        center.x+major*radial.x+minor*n.x,
        center.y+major*radial.y+minor*n.y,
        center.z+major*radial.z+minor*n.z,
      );
      normals.push(n.x,n.y,n.z);
      uvs.push(major*a,minor*b);
    }
    if(i===majorSegments) break;
    for(let j=0;j<tubeSegments;j++){
      const row=i*(tubeSegments+1), next=row+tubeSegments+1;
      // The orientation of the radial/binormal frame is plane-specific.
      if(plane==="yz") indices.push(
        row+j,
        row+j+1,
        next+j,
        row+j+1,
        next+j+1,
        next+j,
      );
      else indices.push(row+j, next+j, row+j+1, row+j+1, next+j, next+j+1);
    }
  }
  return { positions,normals,uvs,indices,skin:null };
};

/** Keep model part ordering and finish unbound until the materials branch opens. */
export const reviewedModel = (id: string, name: string,
  entries: readonly (readonly [string,IAutoMovieMesh])[]): IAutoMovieModel => ({
    id,
    name,
    origin:"generated",
    skeleton:null,
    body:null,
    asset:null,
    materials:[],
    parts:entries.map(([part,mesh])=>({
      id:part,
      name:null,
      material:null,
      attachedBone:null,
      transform:null,
      geometry:{ type:"mesh", mesh },
    })),
  });
