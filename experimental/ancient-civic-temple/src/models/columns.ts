/**
 * The two reviewed stone column prototypes in docs/models/columns.md.
 * These generated metre meshes have no finish or placement. Their four stable
 * part ids are the later material binding interface; changing either height
 * invalidates beam contact and every model-board observation of that variant.
 */
import { mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const part = (id: string, mesh: IAutoMovieMesh) => ({
  id,
  name: null,
  material: null,
  attachedBone: null,
  transform: null,
  geometry: { type: "mesh" as const, mesh },
});

const box = (width: number, bottom: number, height: number, depth: number): IAutoMovieMesh => {
  const geometry = new ObjectMesh().box("box", 0, bottom, 0, width, height, depth)
    .model("box", "box").parts[0]!.geometry;
  if (geometry.type !== "mesh") throw new Error("column box must be a mesh");
  return geometry.mesh;
};

const round = (bottom: number, top: number, lower: number, upper: number): IAutoMovieMesh => {
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const append = (x: number, y: number, z: number,
    nx: number, ny: number, nz: number, u: number, v: number): number => {
    const index = positions.length / 3;
    positions.push(x,y,z);
    normals.push(nx,ny,nz);
    uvs.push(u,v);
    return index;
  };
  const rise = top-bottom, taper = upper-lower;
  const slant = Math.hypot(rise,taper), ny = -taper/slant, nr = rise/slant;
  for (let i=0;i<=24;i++) {
    const angle=2*Math.PI*i/24, c=Math.cos(angle), s=Math.sin(angle);
    const lo=append(lower*c,bottom,-lower*s,nr*c,ny,-nr*s,lower*angle,0);
    const hi=append(upper*c,top,-upper*s,nr*c,ny,-nr*s,upper*angle,slant);
    if (i<24) indices.push(lo,lo+2,hi,lo+2,hi+2,hi);
  }
  const bottomCenter=append(0,bottom,0,0,-1,0,0,0);
  const topCenter=append(0,top,0,0,1,0,0,0);
  for(let i=0;i<24;i++) {
    const a=2*Math.PI*i/24,b=2*Math.PI*(i+1)/24;
    const bc=append(
      lower*Math.cos(a),
      bottom,
      -lower*Math.sin(a),
      0,
      -1,
      0,
      lower*Math.cos(a),
      -lower*Math.sin(a),
    );
    const bn=append(
      lower*Math.cos(b),
      bottom,
      -lower*Math.sin(b),
      0,
      -1,
      0,
      lower*Math.cos(b),
      -lower*Math.sin(b),
    );
    indices.push(bottomCenter,bn,bc);
    const tc=append(
      upper*Math.cos(a),
      top,
      -upper*Math.sin(a),
      0,
      1,
      0,
      upper*Math.cos(a),
      upper*Math.sin(a),
    );
    const tn=append(
      upper*Math.cos(b),
      top,
      -upper*Math.sin(b),
      0,
      1,
      0,
      upper*Math.cos(b),
      upper*Math.sin(b),
    );
    indices.push(topCenter,tc,tn);
  }
  return { positions,normals,uvs,indices,skin:null };
};

const model = (id: string, name: string, plinth: IAutoMovieMesh,
  base: IAutoMovieMesh, shaft: IAutoMovieMesh, capital: IAutoMovieMesh): IAutoMovieModel => ({
    id,
    name,
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [],
    parts: [
      part("plinth", plinth),
      part("base", base),
      part("shaft", shaft),
      part("capital", capital),
    ],
  });

/** Builds the reviewed 12°/19° colonnade variants and the larger porch column. */
export class TempleColumns {
  /** The roof/rafter tangent fixes the capital top; the shaft consumes the remainder. */
  colonnade(slopeDegrees: 12 | 19): IAutoMovieModel {
    const radians = slopeDegrees * Math.PI / 180;
    const beamTop = 3.20 + 0.045 * Math.tan(radians) - 0.30 / Math.cos(radians);
    const height = beamTop - 0.28;
    const shaftBottom = 0.08 + 0.10;
    const shaftTop = height - (0.03 + 0.10 + 0.07);
    return model(
      `column.colonnade.${slopeDegrees}`,
      `주랑 원주 ${slopeDegrees}°`,
      box(0.34, 0, 0.08, 0.34),
      round(0.08, 0.18, 0.155, 0.155),
      round(shaftBottom, shaftTop, 0.135, 0.115),
      mergeAutoMovieMeshes([
        round(shaftTop, shaftTop + 0.03, 0.125, 0.125),
        round(shaftTop + 0.03, height - 0.07, 0.125, 0.155),
        box(0.34, height - 0.07, 0.07, 0.34),
      ]),
    );
  }

  /** The 3.20 m capital plane receives the porch beam without a placement offset. */
  porch(): IAutoMovieModel {
    const shaftBottom = 0.10 + 0.13;
    const shaftTop = shaftBottom + 2.71;
    return model(
      "column.porch",
      "포치 원주",
      box(0.50, 0, 0.10, 0.50),
      round(0.10, shaftBottom, 0.21, 0.21),
      round(shaftBottom, shaftTop, 0.18, 0.155),
      mergeAutoMovieMeshes([
        round(shaftTop, shaftTop + 0.04, 0.165, 0.165),
        round(shaftTop + 0.04, 3.20 - 0.09, 0.165, 0.21),
        box(0.46, 3.20 - 0.09, 0.09, 0.46),
      ]),
    );
  }
}
