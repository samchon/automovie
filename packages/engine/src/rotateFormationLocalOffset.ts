import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Turn a unit-local displacement into the frame a unit's members are placed in.
 *
 * A member's offset is authored in its unit's own frame: `+x` is the unit's
 * left-to-right and `+z` its front-to-back, whichever way the unit happens to
 * be pointing. {@link transformFormationPoint} rotates a unit's interior by the
 * same total heading, so an offset joins a placed point only after this turns
 * it, and a member that stepped aside keeps stepping aside once its unit
 * turns.
 *
 * Taken as a heading in degrees rather than as a unit, because the two
 * consumers of this arithmetic hold different halves of it: a gate composing a
 * whole world placement passes the unit's designed heading plus the offset its
 * cue has turned it by, while a renderer whose scene graph already carries the
 * cue's rotation passes only the designed heading.
 * Finite heading and offset arithmetic are caller premises; a heading whose
 * degree-to-radian product overflows propagates nonfinite coordinates.
 *
 * @evidence contracts/common.md#principled-implementation The XZ cosine/sine matrix is a positive Y heading turn, preserving vertical displacement and matching transformFormationPoint's convention for unit-local offsets.
 * @evidence contracts/common.md#clear-and-simple-design Placement and viewer consumers supply the heading their frame still needs, so this owner performs rotation without duplicating cue or scene-graph composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every offset uses the same matrix, with no slot identity branch or angular deadband; caller arithmetic limits remain visible through nonfinite output.
 * @evidence contracts/common.md#meaningful-documentation States degree heading, local displacement frame, both consumer compositions and the finite-arithmetic premise rather than implying an input gate.
 * @evidence contracts/performance.md#efficient-algorithms One sine and cosine and four horizontal products compute the fixed-dimensional turn in constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each placement supplies its current heading and offset; this scalar operation coordinates no requests or retained formation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only one fresh three-component displacement escapes, with neither the source offset nor a formation reference retained.
 */
export const rotateFormationLocalOffset: (
  offset: IAutoMovieVector3,
  headingDeg: number,
) => IAutoMovieVector3 = (
  offset: IAutoMovieVector3,
  headingDeg: number,
): IAutoMovieVector3 => {
  const radians: number = (headingDeg * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: offset.x * cosine + offset.z * sine,
    y: offset.y,
    z: -offset.x * sine + offset.z * cosine,
  };
};
