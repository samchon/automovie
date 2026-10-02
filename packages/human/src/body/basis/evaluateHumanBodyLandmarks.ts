import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { applyHumanBodyShapeRows } from "./applyHumanBodyShapeRows";

/**
 * The basis's landmarks after a document's channels and correctives, without
 * shaping any skin.
 *
 * Landmarks are the joints' source, so this is all the shaped rest skeleton
 * needs, at the cost of a few hundred rows instead of every surface's. The
 * rows are applied by `applyHumanBodyShapeRows`, the same owner the skin
 * uses, to a copy of the basis positions, and the basis is never mutated.
 * Positions are metres in the builder's Y-up, Z-forward, +X-left frame.
 *
 * @evidence contracts/common.md#principled-implementation The landmarks are copied and shaped by the same row sum as the skin (applyHumanBodyShapeRows), so a joint centre sits where the skin around it moved. The copy keeps the basis immutable and the evaluation deterministic. Landmarks are a few hundred rows, which is why the skeleton rest can be read without shaping any surface.
 * @evidence contracts/common.md#clear-and-simple-design One copy, one call to the shared owner and one keyed record; no option or layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or foreign mutation: the basis array is copied before it is shaped and the returned record is fresh.
 * @evidence contracts/common.md#meaningful-documentation States why landmarks alone suffice for the skeleton, the shared owner, the immutability of the basis, and the frame and unit of the positions.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres in the builder Y-up, Z-forward, +X-left frame, the frame the basis landmarks are stored in; the function converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines and groups no part; landmarks are the points the basis already names.
 * @evidenceExclude contracts/modeling.md#parameter-channels It consumes the channel weights of a state and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive; the record has one point per basis landmark.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the body builder owns the emitted form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value, range or constant; the landmark rows were solved elsewhere.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of weights belongs to humanBodyBasisWeights; this function shapes with the state it is handed.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It defines no caller input; the state is the admitted output of humanBodyBasisWeights.
 */
export function evaluateHumanBodyLandmarks(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels" | "landmarks">,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
): Record<string, IAutoMovieVector3> {
  const marks = basis.landmarks.positions.slice();
  applyHumanBodyShapeRows(basis, state, marks, basis.landmarks.targets);
  const landmarks: Record<string, IAutoMovieVector3> = {};
  basis.landmarks.ids.forEach((id, i) => {
    landmarks[id] = { x: marks[i * 3], y: marks[i * 3 + 1], z: marks[i * 3 + 2] };
  });
  return landmarks;
}
