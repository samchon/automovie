import { IAutoMovieSubdivisionCage } from "./IAutoMovieSubdivisionCage";
import { IAutoMovieSubdivisionParameter } from "./IAutoMovieSubdivisionParameter";
import { IAutoMovieSubdivisionSurface } from "./IAutoMovieSubdivisionSurface";
import { ISubdivisionLevel } from "./ISubdivisionLevel";
import { admitSubdivisionCage } from "./admitSubdivisionCage";
import { limitSubdivisionLevel } from "./limitSubdivisionLevel";
import { refineSubdivisionLevel } from "./refineSubdivisionLevel";

/**
 * Refine a polygon cage into a Catmull-Clark subdivision surface and evaluate
 * its limit positions and normals.
 *
 * Each level applies Catmull and Clark's (1978) face, edge and vertex rules.
 * Boundary edges are infinitely sharp, so a boundary follows the cubic B-spline
 * of its cage edges, and a boundary vertex with one face is rounded rather than
 * kept, OpenSubdiv's edge-only boundary interpolation. Creases follow DeRose,
 * Kass and Truong (1998): a vertex with two sharp edges takes the crease rule,
 * one with three or more is a corner, and semi-sharp edges blend into smooth
 * ones as their sharpness decays. After the first level every face is a quad,
 * so the cage may mix triangles, pentagons and other polygons with its quads.
 *
 * The limit position and normal of each vertex come from the published limit
 * masks, evaluated after any semi-sharp sharpness left at the final level is
 * spent, so they are what infinite refinement gives and do not depend on the
 * level. A vertex on an infinitely sharp crease or boundary gets one normal per
 * side. The one exception is a boundary or crease side of a single face, such
 * as a cage corner under edge-only interpolation, where the surface's
 * parametrisation is degenerate and the normal is OpenSubdiv's mask.
 *
 * UVs refine face-varying with every chart boundary pinned, so an authored UV
 * layout keeps its chart outlines exactly. The surface is deterministic: the
 * same cage and level give the same numbers in the same order on every host.
 *
 * Refused before refinement: every defect `admitSubdivisionCage` lists, and a
 * level that is not an integer of at least one. A vertex whose limit normal
 * vanishes, such as an interior vertex of valence two or a collapsed cage, is
 * refused after refinement. Each level multiplies the quad count by four.
 *
 * @param props.cage The control cage, only read.
 * @param props.levels Number of refinement steps, an integer of at least 1.
 * @returns The refined quads, limit positions and normals, UVs and cage parameters.
 *
 * @evidence contracts/common.md#principled-implementation Uniform Catmull-Clark refinement with the Hoppe boundary and crease rules and the semi-sharp extension of DeRose, Kass and Truong (1998), limit masks from Halstead, Kass and DeRose (1993) and the crease cross tangent of Biermann, Levin and Zorin (2000), applied to rings refined until those masks hold; every rule is an affine mask evaluated in a fixed order, which is what makes the output deterministic. The one stated approximation is the one-face crease side, whose parametrisation is degenerate.
 * @evidence contracts/common.md#clear-and-simple-design Admission, one-level refinement and limit evaluation are separate functions over one level record; this function owns the level loop, the per-vertex parameter choice and the output layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller-specific rule or tolerance; a vanishing normal is refused rather than replaced, and the cage is never repaired.
 * @evidence contracts/common.md#meaningful-documentation States the rules applied at boundaries, creases and corners, that limit results do not depend on the level and the one exception, the UV and determinism guarantees, every refusal, and the growth per level.
 * @evidence contracts/performance.md#efficient-algorithms For `F` cage corners and `L` levels, each level is linear in its size and the last has about `F * 4^(L - 1)` quads, so time and space are dominated by the final level; the limit adds one point refinement of that level and a bounded ring iteration per vertex.
 * @evidence contracts/performance.md#reuse-equivalent-work Each level is computed once from the previous one, and the limit reuses one shared point refinement for every vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the current level is held while refining; the returned surface owns arrays linear in the final level and nothing else is retained.
 * @author Samchon
 */
export const subdivideAutoMovieSurface = (props: {
  /** The control cage, only read. */
  cage: IAutoMovieSubdivisionCage;

  /** Number of refinement steps, an integer of at least 1. */
  levels: number;
}): IAutoMovieSubdivisionSurface => {
  if (!Number.isSafeInteger(props.levels) || props.levels < 1)
    throw new Error("subdivision levels must be an integer of at least 1");
  let level: ISubdivisionLevel = admitSubdivisionCage(props.cage);
  for (let step: number = 0; step < props.levels; ++step)
    level = refineSubdivisionLevel(level);
  const limit: { positions: number[]; normals: number[]; cornerNormals: number[] } =
    limitSubdivisionLevel(level);
  const parameters: IAutoMovieSubdivisionParameter[] =
    new Array<IAutoMovieSubdivisionParameter>(level.topology.vertexCount);
  level.topology.faceVertices.forEach((v: number, c: number): void => {
    if (parameters[v] !== undefined) return;
    parameters[v] = {
      face: level.parameterFaces[c]!,
      corner:
        level.parameterCorners[c] === -1 ? null : level.parameterCorners[c]!,
      u: level.parameterU[c]!,
      v: level.parameterV[c]!,
    };
  });
  return {
    positions: level.positions,
    limitPositions: limit.positions,
    faces: level.topology.faceVertices,
    normals: limit.normals,
    normalFaces: limit.cornerNormals,
    uvs: level.uvs,
    uvFaces: level.cornerUvs,
    parameters,
  };
};
