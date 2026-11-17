import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

/** Type contracts exchanged by AutoMovieHumanHandSkinTargets; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandSkinTargets {
  /** The makeArm argument of AutoMovieHumanHandSkinTargets.skinTargets. What the solve's knuckle section, read on the palm's rings and the border
  fingers' roots, must measure for the meshed skin to measure the breadth
  and the hand tape.
  The skin at the knuckles is the palm's and, at its borders, the webs'
  columns out to the index and little fingers' roots, which the surface
  builds after the chains; read on the chains alone the breadth missed by
  -5 to +4 mm, depending on how the border was approximated. So the hand is
  solved, its palm and fingers are meshed by the body's own surface, the
  skin's section is measured ({@link AutoMovieHumanKnuckleSection}), and the
  solve's targets move by the skin's ratio to the inputs, in
  {@link SKIN_ROUNDS} rounds; the ratio of skin to chain changes little with
  the scales, so each round shrinks the miss severalfold. Measured in the
  left frame for either side, since the right is its reflection; cached per
  mirror-free inputs, so one side serves the other's mirror image, and
  because the skeleton asks for the same bones first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What the solve's knuckle section, read on the palm's rings and the border fingers' roots, must measure for the meshed skin to measure the breadth and the hand tape.
 * @evidence contracts/development/design.md#principled-representation What the solve's knuckle section, read on the palm's rings and the border fingers' roots, must measure for the meshed skin to measure the breadth and the hand tape. The callable takes measures and returns IAutoMovieHumanHandWrist.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandSkinTargets.SkinTargetsMakeArm is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandSkinTargets.skinTargets for what the solve's knuckle section, read on the palm's rings and the border fingers' roots, must measure for the meshed skin to measure the breadth and the hand tape.
 */
  export type SkinTargetsMakeArm = (
    measures: IAutoMovieHumanHandScales,
  ) => IAutoMovieHumanHandWrist;

  /** Result of AutoMovieHumanHandSkinTargets.skinTargets. What the solve's knuckle section, read on the palm's rings and the border
  fingers' roots, must measure for the meshed skin to measure the breadth
  and the hand tape.
  The skin at the knuckles is the palm's and, at its borders, the webs'
  columns out to the index and little fingers' roots, which the surface
  builds after the chains; read on the chains alone the breadth missed by
  -5 to +4 mm, depending on how the border was approximated. So the hand is
  solved, its palm and fingers are meshed by the body's own surface, the
  skin's section is measured ({@link AutoMovieHumanKnuckleSection}), and the
  solve's targets move by the skin's ratio to the inputs, in
  {@link SKIN_ROUNDS} rounds; the ratio of skin to chain changes little with
  the scales, so each round shrinks the miss severalfold. Measured in the
  left frame for either side, since the right is its reflection; cached per
  mirror-free inputs, so one side serves the other's mirror image, and
  because the skeleton asks for the same bones first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What the solve's knuckle section, read on the palm's rings and the border fingers' roots, must measure for the meshed skin to measure the breadth and the hand tape.
 * @evidence contracts/development/design.md#principled-representation `breadth`: Target skin breadth over the knuckles, millimetres. `girth`: Target skin tape around the knuckles, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandSkinTargets.ISkinTargetsResult is the canonical exchange used by AutoMovieHumanHandSkinTargets.skinTargets, AutoMovieHumanHandSolve.solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `girth`; callers supply the complete record.
 */
  export type ISkinTargetsResult = {
    /** Target skin breadth over the knuckles, millimetres. */
    breadth: number;
    /** Target skin tape around the knuckles, millimetres. */
    girth: number;
  };
}
