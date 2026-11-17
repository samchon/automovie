import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolveCenterOfMass } from "../../../pose/IAutoMovieResolveCenterOfMass";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Contracts used by GymnasticsMat.lie.
 *
 * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.
 * @evidence contracts/development/design.md#principled-representation body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsMat.ts (GymnasticsMat.lie, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass.IModel, IAutoMovieMotionHumanPosture, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGymnasticsMat {
  /**
   * The posture after a touchdown on the back. Input props of GymnasticsMat.lie. The body, its mass model, the touchdown posture written by joints with no roll, the centre's velocity at the touchdown, m/s, and the surface's height, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.
   * @evidence contracts/development/design.md#principled-representation body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsMat.ts (GymnasticsMat.lie, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass.IModel, IAutoMovieMotionHumanPosture, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILieProps = {
    /** Borrowed body used to settle onto the mat. */
    body: IAutoMovieMotionHumanBody;
    /** Mass and flight model supplying centre-of-mass geometry. */
    model: IAutoMovieResolveCenterOfMass.IModel;
    /** Posture at the beginning of settling. */
    from: IAutoMovieMotionHumanPosture;
    /** Initial centre-of-mass velocity in world metres per second. */
    velocity: IAutoMovieVector3;
    /** Mat contact-plane height on world +Y, metres. */
    height: number;
  };
}
