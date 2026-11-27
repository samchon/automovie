import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieResolveCenterOfMass } from "../pose/IAutoMovieResolveCenterOfMass";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/** Contracts used by GymnasticsMat.lie. */
export namespace IAutoMovieMotionHumanGymnasticsMat {
  /**
   * The posture after a touchdown on the back. Input props of
   * GymnasticsMat.lie. The body, its mass model, the touchdown posture written
   * by joints with no roll, the centre's velocity at the touchdown, m/s, and
   * the surface's height, world metres.
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
