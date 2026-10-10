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
    const offset = combined.positions.length / 3,
      count = shaft.positions.length / 3;
    combined.positions.push(...shaft.positions);
    combined.indices!.push(
      ...(shaft.indices ?? []).map((vertex) => vertex + offset),
    );
    for (let at = 0; at < props.rowVertices; at++) {
      roots.push(offset + at);
      tips.push(offset + count - props.rowVertices + at);
    }
  }
  const request = {
    owner: "brow-" + props.side,
    state: props.state,
    against: props.against,
    mesh: combined,
    exterior: props.skin,
    boundary: "open" as const,
    toleranceMetres: props.toleranceMetres,
  };
  const subject = "brows:" + props.side;
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
