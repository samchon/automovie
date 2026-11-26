import type {
  IAutoMovieSubdivideSurface,
  IAutoMovieSubdivisionLevel,
  IAutoMovieSubdivisionSurface,
} from "@automovie/interface";

import { admitSubdivisionCage } from "./admitSubdivisionCage";
import { evaluateSubdivisionLevel } from "./internal/evaluateSubdivisionLevel";
import { refineSubdivisionLevel } from "./refineSubdivisionLevel";

/**
 * Most refinement steps one call admits. Each level multiplies the quad count
 * by four, so six levels already turn every cage corner into 1,024 quads, more
 * than a render or measurement cage needs, and a larger level only lets one
 * call exhaust memory.
 */
const MAX_LEVELS: number = 6;

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
 * side. The exceptions are boundary or crease sides of one face, such as a cage
 * corner under edge-only interpolation, or of four or more faces: there the
 * limit surface has no tangent plane containing the crease, and the normal is
 * OpenSubdiv's approximating mask, as `limitSubdivisionRing` explains.
 *
 * UVs refine face-varying with every chart boundary pinned, so an authored UV
 * layout keeps its chart outlines exactly. The surface is deterministic: the
 * same cage and level give the same numbers in the same order on every host.
 *
 * Refused before refinement: every defect `admitSubdivisionCage` lists, and a
 * level that is not an integer from 1 to 6. The cap exists because each level
 * multiplies the quad count by four, so the output is at most 1,024 quads per
 * cage corner. A vertex whose limit normal vanishes, such as an interior vertex
 * of valence two or a collapsed cage, is refused after refinement.
 *
 * @param props.cage The control cage, only read.
 * @param props.levels Number of refinement steps, an integer from 1 to 6.
 * @returns The refined quads, limit positions and normals, UVs and cage
 *   parameters.
 */
export function subdivideAutoMovieSurface(
  props: IAutoMovieSubdivideSurface.IProps,
): IAutoMovieSubdivisionSurface {
  if (props.levels < 1 || props.levels > MAX_LEVELS)
    throw new Error(
      `subdivision levels must be an integer from 1 to ${MAX_LEVELS}`,
    );
  let level: IAutoMovieSubdivisionLevel = admitSubdivisionCage(props.cage);
  for (let step: number = 0; step < props.levels; ++step)
    level = refineSubdivisionLevel(level);
  return evaluateSubdivisionLevel(level);
}
