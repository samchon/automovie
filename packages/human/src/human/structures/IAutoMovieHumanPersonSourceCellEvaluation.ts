/**
 * An admitted performed source evaluation: per original parent triangle its
 * accumulated area vector (flat triples, square metres), and each used
 * canonical sample's performed position (metres, Y up, +Z forward). Both are
 * owned.
 *
 * @evidence contracts/common.md#principled-implementation Parent area vectors and canonical sample positions are what shading and transport consume from performed cells.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are accumulated from actual performed cells; no neutral value substitutes.
 * @evidence contracts/common.md#meaningful-documentation States both members, units, frame and ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The evaluation defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluation emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Area vectors are square metres and positions metres in the shared Y-up, +Z-forward frame.
 * @evidence contracts/modeling.md#shared-boundaries A shared sample has one position agreed by both halves.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal evaluation that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluation {
  /** Accumulated area vector per parent triangle, flat triples, square metres. */
  parentAreas: number[];

  /** Performed position per used canonical sample ID, metres. */
  sourcePositions: ReadonlyMap<number, readonly number[]>;
}
