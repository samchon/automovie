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
 * @evidence contracts/common.md#principled-implementation The signed query and crossing census of the shared face instrument read the emitted Float32 geometry, so the reported numbers are those of the delivered parts; root and tip rows are selected by the lattice's own row layout.
 * @evidence contracts/common.md#clear-and-simple-design One combined mesh and three requests; the judged conditions live in the instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tolerance and refusal conditions are unchanged from the assertion this reader replaces; nothing is retried or shortened.
 * @evidence contracts/common.md#meaningful-documentation States each relation, which one is judged and what the unjudged ones measure.
 * @evidence contracts/modeling.md#shared-boundaries Shafts are read against the same skin state whose host seated them.
 * @evidence contracts/modeling.md#spatial-conventions All geometry and distances are head-frame metres.
 * @evidence contracts/modeling.md#rendered-observation The reader reports numbers only; the brow assembly's rendered observation is recorded in the campaign rounds.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no primitive.
 * @evidence contracts/anatomy.md#permitted-range Geometric skin clearance admits no measured implantation depth or clinical density interval; the root standoff is reported because no bound for it has been read.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reader carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader defines no authoring input.
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
