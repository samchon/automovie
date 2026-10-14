import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";
import type { IHumanFaceBrowClearanceProps } from "./IHumanFaceBrowClearanceProps";

/**
 * Measure one eyebrow's emitted shafts against the skin that seated them.
 *
 * Three relations are read on one combined mesh of the side's shafts:
 *
 * 1. Every shaft vertex and triangle against the skin. This is the judged
 *    relation, with the conditions the former brow assertion applied one
 *    vertex at a time: a vertex deeper than the source tolerance inside the
 *    skin, a vertex whose nearest skin feature is an open rim, or a triangle
 *    crossing the skin refuses.
 * 2. The root row of every shaft against the skin, unjudged. Its largest
 *    signed distance is how far the highest root stands off the skin, the
 *    quantity that says whether roots float.
 * 3. The tip row of every shaft against the skin, unjudged. Its distribution
 *    is the standing height of the brow, which decides whether shafts read
 *    as hair above the skin or lie in it.
 *
 * No shaft produces no reading. Distances are metres on Float32 coordinates,
 * positive outside the skin; the instrument's uncertainty is its own.
 *
 * @evidence contracts/common.md#principled-implementation The emitted shaft population is combined once so the original judged whole-shaft relation and unjudged root/tip observations read the same host state.
 * @evidence contracts/common.md#clear-and-simple-design One shared request supplies skin/state/tolerance to the clearance instrument, with explicit root/tip indices and no triangle census for those two subsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shafts yields no readings, roots/tips remain unjudged, and the source tolerance is not changed to make clearance pass.
 * @evidence contracts/common.md#meaningful-documentation The prose states all three populations, refusal conditions, signed metre interpretation and independent instrument uncertainty.
 * @evidence contracts/performance.md#efficient-algorithms Combining V shaft vertices/T triangles is linear; whole-mesh and two subset clearance reads add the spatial query/crossing instrument's actual host-dependent work.
 * @evidence contracts/performance.md#reuse-equivalent-work All three readings share one combined mesh/reference request and the clearance owner can reuse equivalent immutable mesh/query work for that same state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Combined buffers and subset index lists are call-local; returned numerical readings/witnesses are caller-owned and do not retain live shaft meshes.
 */
export function readHumanFaceBrowClearance(
  props: IHumanFaceBrowClearanceProps,
): IAutoMovieHumanConstructionClearanceReading[] {
  if (props.shafts.length === 0) return [];
  const combined: IAutoMovieMesh = {
    positions: [],
    indices: [],
    normals: null,
    uvs: null,
    skin: null,
  };
  const roots: number[] = [],
    tips: number[] = [];
  for (const shaft of props.shafts) {
    const offset: number = combined.positions.length / 3,
      count: number = shaft.positions.length / 3;
    combined.positions.push(...shaft.positions);
    combined.indices!.push(
      ...(shaft.indices ?? []).map((vertex: number): number  => vertex + offset),
    );
    for (let at: number = 0; at < props.rowVertices; at++) {
      roots.push(offset + at);
      tips.push(offset + count - props.rowVertices + at);
    }
  }
  const request: { owner: string; state: "rest" | "performed"; against: string; mesh: IAutoMovieMesh; exterior: IAutoMovieMesh; boundary: "open"; toleranceMetres: number; } = {
    owner: "brow-" + props.side,
    state: props.state,
    against: props.against,
    mesh: combined,
    exterior: props.skin,
    boundary: "open" as const,
    toleranceMetres: props.toleranceMetres,
  };
  const subject: string = "brows:" + props.side;
  return [
    measureHumanFaceClearance({ ...request, subject, judged: true }),
    measureHumanFaceClearance({
      ...request,
      subject: subject + ":roots",
      judged: false,
      vertices: roots,
      crossingIndices: null,
    }),
    measureHumanFaceClearance({
      ...request,
      subject: subject + ":tips",
      judged: false,
      vertices: tips,
      crossingIndices: null,
    }),
  ];
}
