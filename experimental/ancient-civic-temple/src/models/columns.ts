/**
 * The two reviewed stone column prototypes in docs/models/columns.md.
 * These generated metre meshes have no finish or placement. Their four stable
 * part ids are the later material binding interface; changing either height
 * invalidates beam contact and every model-board observation of that variant.
 */
import { mergeAutoMovieMeshes } from "@automovie/engine";
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
 * @evidenceReview models/columns.md #d7c2949 Read both column H2s against the colonnade and porch methods: model() names four separate stone parts for each family.
 * @evidence principles/core/source-units.md#source-scope-preservation Its only public variants are the two column families in columns.md; the shared model helper keeps their four named stone parts separate.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This class exposes the two cited column builders and no placement or finish builder; model() retains the four part keys.
 * @evidence principles/core/source-units.md#source-substantive-completion Both methods emit complete mesh parts with normals and UVs, rather than a column placeholder or an unconsumed parameter record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Each public method reaches box() and round() mesh output, including indices and attributes, before returning a four-part IAutoMovieModel.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade and porch H2s specify both shaft profiles, 24 radial sides, cap stacks, and beam contact heights; the two builders could emit those meshes without adding a new column decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Compared both builders' shaft radii, cap levels and 24-side sweep with their H2s; neither class method required an unowned column section.
 * @evidence obligations/design/model-sources.md#design-owned-construction The box/round helper emits the two H2s' sections and retains plinth, base, shaft, and capital as stable material parts.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 The helper computes tapered normals and UVs from ring parameters, while model() preserves the four design-owned surface identities.
 */
export class TempleColumns {
  /**
   * The roof/rafter tangent fixes the capital top; the shaft consumes the remainder.
   * @evidence models/columns.md#colonnade-column The 12° and 19° inputs select reviewed roof slopes, and beamTop minus 0.28 sets the cap height before the fixed 0.38 m stack leaves the tapered shaft span.
   * @evidenceReview models/columns.md#colonnade-column #c68e4a5 The slope branch reads templeRoofRules, derives beamTop and leaves the H2's base and capital stack around a shaft ending at height minus 0.20.
   * @evidence principles/core/source-units.md#source-scope-preservation Its slope guard rejects other roof variants and its four emitted parts keep the reviewed 0.34 m plinth, 24-sided round sections, and two beam-height contacts.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The runtime guard refuses unsupported slopes; colonnade() returns the four cited sections rather than choosing a roof placement.
   * @evidence principles/core/source-units.md#source-substantive-completion For either accepted slope it returns positions, normals, UVs, indices and the complete plinth/base/shaft/capital hierarchy, with no later shaft-height choice.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both accepted branches call round() for base and taper and merge the three capital layers into one usable mesh part.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade-column H2 gives both height equations and taper endpoints; the 12°/19° build and capital-to-beam contact use those inputs without finding an unowned section or UV seam.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's two roof-dependent cap heights and taper radii match the derived height and ring arguments, leaving no new colonnade proportion to return upstream.
   * @evidence obligations/design/model-sources.md#deterministic-build Equal slope inputs select the same roof rule, arithmetic height and 24-sector loop, then assemble parts in fixed order without mutable state.
   * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe The slope switch, colonnadeBeamTop computation and four model() arguments have no random or camera state, so equal slopes reproduce ordered meshes.
   * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit The only parameter is a guarded 12°/19° roof slope; the output remains the H2's plain 24-sided blocking stone column.
   * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa A numeric value outside 12 or 19 throws before construction; an accepted value produces the fixed 24-sector stone prototype.
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
      mergeAutoMovieMeshes([
        round(shaftTop, shaftTop + 0.03, 0.125, 0.125),
        round(shaftTop + 0.03, height - 0.07, 0.125, 0.155, 0.03),
        box(0.34, height - 0.07, 0.07, 0.34),
      ]),
    );
  }

  /**
   * The 3.20 m capital plane receives the porch beam without a placement offset.
   * @evidence models/columns.md#porch-column Box and round sections produce the 0.50 m plinth, 2.71 m taper, 0.46 m cap and four surface parts at the H2's local floor origin.
   * @evidenceReview models/columns.md#porch-column #68f825c The porch method's 0.50 plinth box, long tapered round shaft and stacked capital reach Y=3.20 from the floor origin in the H2.
   * @evidence principles/core/source-units.md#source-scope-preservation This no-argument builder fixes only the porch prototype; its cap reaches 3.20 m and leaves the two world placements to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 porch() has no transform or placement argument, returns one local column, and leaves copying it to the later instance owner.
   * @evidence principles/core/source-units.md#source-substantive-completion It returns the full plinth/base/shaft/capital meshes, including the tapered normals and continuous ring V coordinates at the neck.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The round() rings and merged cap produce the shaft neck with normals and carried V coordinates before model() returns all four meshes.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The porch-column H2 already sets the six vertical sections, 24 sides, part names, origin and beam underside; this builder needs no new proportion or contact choice.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The porch H2 supplies every stacked height and the beam underside; the fixed box/round calls add no separate porch-column contact rule.
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
      mergeAutoMovieMeshes([
        round(shaftTop, shaftTop + 0.04, 0.165, 0.165),
        round(shaftTop + 0.04, 3.20 - 0.09, 0.165, 0.21, 0.04),
        box(0.46, 3.20 - 0.09, 0.09, 0.46),
      ]),
    );
  }
}
