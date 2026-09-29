/**
 * The two reviewed stone column prototypes in docs/models/columns.md.
 * These generated metre meshes have no finish or placement. Their four stable
 * part ids are the later material binding interface; changing either height
 * invalidates beam contact and every model-board observation of that variant.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { colonnadeBeamTop } from "../geometry/model-roof-datums";
import { templeRoofRules } from "../spaces/roofs/assembly";

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

const round = (bottom: number, top: number, lower: number, upper: number,
  vStart=0): IAutoMovieMesh => {
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
    const lo=append(lower*c,bottom,-lower*s,nr*c,ny,-nr*s,lower*angle,vStart);
    const hi=append(
      upper*c,
      top,
      -upper*s,
      nr*c,
      ny,
      -nr*s,
      upper*angle,
      vStart+slant,
    );
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

/** One continuous capital exterior: neck, flare, annular soffit and abacus. */
const capitalMesh = (bottom:number, neckTop:number, abacusBottom:number,
  top:number, neckRadius:number, flareRadius:number, halfSquare:number):IAutoMovieMesh=>{
  const mesh=new ObjectMesh(),segments=24;
  const neckLength=neckTop-bottom;
  const flareLength=Math.hypot(abacusBottom-neckTop,flareRadius-neckRadius);
  const circle=(i:number,y:number,r:number)=>{
    const a=2*Math.PI*i/segments;
    return { x:r*Math.cos(a),y,z:-r*Math.sin(a) };
  };
  const square=(i:number,y:number)=>{
    const a=2*Math.PI*i/segments,c=Math.cos(a),s=Math.sin(a);
    const scale=halfSquare/Math.max(Math.abs(c),Math.abs(s));
    return { x:scale*c,y,z:-scale*s };
  };
  const squareArc=[0];
  for(let i=0;i<segments;i++){
    const a=square(i,abacusBottom),b=square((i+1)%segments,abacusBottom);
    squareArc.push(squareArc[i]!+Math.hypot(b.x-a.x,b.z-a.z));
  }
  for(let i=0;i<segments;i++){
    const j=(i+1)%segments;
    const a0=2*Math.PI*i/segments,a1=2*Math.PI*(i+1)/segments;
    const lo=circle(i,bottom,neckRadius),ln=circle(j,bottom,neckRadius);
    const mid=circle(i,neckTop,neckRadius),mn=circle(j,neckTop,neckRadius);
    const hi=circle(i, abacusBottom, flareRadius),hn=circle(j, abacusBottom, flareRadius);
    const so=square(i,abacusBottom),sn=square(j,abacusBottom);
    const st=square(i,top),tn=square(j,top);
    mesh.face(
      "capital",
      [lo, ln, mn, mid],
      [
        [neckRadius*a0, 0],
        [neckRadius*a1, 0],
        [neckRadius*a1, neckLength],
        [neckRadius*a0, neckLength],
      ],
    );
    mesh.face(
      "capital",
      [mid, mn, hn, hi],
      [
        [neckRadius*a0, neckLength],
        [neckRadius*a1, neckLength],
        [flareRadius*a1, neckLength+flareLength],
        [flareRadius*a0, neckLength+flareLength],
      ],
    );
    mesh.face("capital",[hi,hn,sn,so]);
    mesh.face(
      "capital",
      [so, sn, tn, st],
      [
        [squareArc[i]!, neckLength+flareLength],
        [squareArc[i+1]!, neckLength+flareLength],
        [squareArc[i+1]!, neckLength+flareLength+top-abacusBottom],
        [squareArc[i]!, neckLength+flareLength+top-abacusBottom],
      ],
    );
    mesh.face("capital",[{ x:0,y:bottom,z:0 },ln,lo]);
    mesh.face("capital",[st,tn,{ x:0,y:top,z:0 }]);
  }
  const geometry=mesh.model("capital","capital").parts[0]!.geometry;
  if(geometry.type!=="mesh")throw new Error("capital must be a mesh");
  return geometry.mesh;
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

/**
 * Builds the reviewed 12°/19° colonnade variants and the larger porch column.
 * @evidence models/columns.md This class exposes the colonnade and porch stone-column builders with the shared plinth/base/shaft/capital part assembly.
 * @evidence principles/core/source-units.md#source-scope-preservation Its only public variants are the two column families in columns.md; the shared model helper keeps their four named stone parts separate.
 * @evidence principles/core/source-units.md#source-substantive-completion Both methods emit complete mesh parts with normals and UVs, rather than a column placeholder or an unconsumed parameter record.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade and porch H2s specify both shaft profiles, 24 radial sides, cap stacks, and beam contact heights; the two builders could emit those meshes without adding a new column decision.
 * @evidence obligations/design/model-sources.md#design-owned-construction The box/round helper emits the two H2s' sections and retains plinth, base, shaft, and capital as stable material parts.
 */
export class TempleColumns {
  /**
   * The roof/rafter tangent fixes the capital top; the shaft consumes the remainder.
   * @evidence models/columns.md#colonnade-column The 12° and 19° inputs select reviewed roof slopes, and beamTop minus 0.28 sets the cap height before the fixed 0.38 m stack leaves the tapered shaft span.
   * @evidence principles/core/source-units.md#source-scope-preservation Its slope guard rejects other roof variants and its four emitted parts keep the reviewed 0.34 m plinth, 24-sided round sections, and two beam-height contacts.
   * @evidence principles/core/source-units.md#source-substantive-completion For either accepted slope it returns positions, normals, UVs, indices and the complete plinth/base/shaft/capital hierarchy, with no later shaft-height choice.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade-column H2 gives both height equations and taper endpoints; the 12°/19° build and capital-to-beam contact use those inputs without finding an unowned section or UV seam.
   * @evidence obligations/design/model-sources.md#deterministic-build Equal slope inputs select the same roof rule, arithmetic height and 24-sector loop, then assemble parts in fixed order without mutable state.
   * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The only parameter is a guarded 12°/19° roof slope; the output remains the H2's plain 24-sided blocking stone column.
   */
  colonnade(slopeDegrees: 12 | 19): IAutoMovieModel {
    if (slopeDegrees !== 12 && slopeDegrees !== 19)
      throw new Error(`${slopeDegrees}: unsupported colonnade slope`);
    const slope = slopeDegrees === 12
      ? templeRoofRules.leanSlope
      : templeRoofRules.eastGableSlope;
    const beamTop = colonnadeBeamTop(slope);
    const height = beamTop - 0.28;
    const shaftBottom = 0.08 + 0.10;
    const shaftTop = height - (0.03 + 0.10 + 0.07);
    return model(
      `column.colonnade.${slopeDegrees}`,
      `주랑 원주 ${slopeDegrees}°`,
      box(0.34, 0, 0.08, 0.34),
      round(0.08, 0.18, 0.155, 0.155),
      round(shaftBottom, shaftTop, 0.135, 0.115),
      capitalMesh(
        shaftTop,
        shaftTop+0.03,
        height-0.07,
        height,
        0.125,
        0.155,
        0.17,
      ),
    );
  }

  /**
   * The 3.20 m capital plane receives the porch beam without a placement offset.
   * @evidence models/columns.md#porch-column Box and round sections produce the 0.50 m plinth, 2.71 m taper, 0.46 m cap and four surface parts at the H2's local floor origin.
   * @evidence principles/core/source-units.md#source-scope-preservation This no-argument builder fixes only the porch prototype; its cap reaches 3.20 m and leaves the two world placements to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion It returns the full plinth/base/shaft/capital meshes, including the tapered normals and continuous ring V coordinates at the neck.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The porch-column H2 already sets the six vertical sections, 24 sides, part names, origin and beam underside; this builder needs no new proportion or contact choice.
   */
  porch(): IAutoMovieModel {
    const shaftBottom = 0.10 + 0.13;
    const shaftTop = shaftBottom + 2.71;
    return model(
      "column.porch",
      "포치 원주",
      box(0.50, 0, 0.10, 0.50),
      round(0.10, shaftBottom, 0.21, 0.21),
      round(shaftBottom, shaftTop, 0.18, 0.155),
      capitalMesh(shaftTop, shaftTop+0.04, 3.20-0.09, 3.20, 0.165, 0.21, 0.23),
    );
  }
}
