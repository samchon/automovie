import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchDrink } from "./IAutoMovieMotionHumanTouchDrink";
import type { IAutoMovieMotionHumanTouchEffector } from "./IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "./IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionHumanGrasp } from "./IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanTouch } from "./IAutoMovieMotionHumanTouch";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * The arm a hand-to-face task lays on its place (`handToFace`): how the
 * effector lies, the elbow's hint and the reference every second's fit is held
 * to, and, for a held vessel, its lean toward the lips and the way it faces.
 */
export namespace IAutoMovieMotionHumanHandToFaceArm {
  /** One hand's arm at the face. One hand's arm. */
  export interface IArm {
    /** What the effector's along axis lies on. */
    lay: IAutoMovieMotionHumanTouch.ITouch["lay"];

    /** The elbow's hint, world. */
    bend: IAutoMovieVector3;

    /** The arm laid at the face, which every second's fit is held to. */
    reference: NonNullable<IAutoMovieMotionHumanTouch.ITouch["reference"]>;

    /**
     * The goal that lays the hand at the face, the one the reference solves:
     * the action's reach is timed to it.
     */
    goal: IAutoMovieHumanLimbGoal;

    /** A vessel's lean toward the lips, degrees; absent for no vessel. */
    lean?: number;

    /**
     * The level direction a vessel faces against; absent for no vessel
     * searched.
     */
    facing?: IAutoMovieVector3;
  }

  /** One hand's arm at the face. What `of` reads. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The entry with the head at the face as the hand arrives. */
    atFace: IAutoMovieMotionHumanPosture;

    /** The entry with the head turned, as a drinker's is in the drinking phase. */
    turned: IAutoMovieMotionHumanPosture;

    /** The hand. */
    side: AutoMovieHumanSide;

    /** The hand's effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /** The hand's place at a posture and second. */
    place: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The row's tangent. */
    tangent: IAutoMovieMotionHumanTouchForm.Tangent;

    /** Whether the row holds its effector upright, a vessel. */
    upright: boolean;

    /**
     * The grasp a held tool was taken up by, which keeps its turn; null for
     * none.
     */
    own: IAutoMovieMotionHumanGrasp.IKey | null;

    /**
     * The drink a held vessel's rim side was admitted with
     * (`handToFaceVessel`), whose effector is `effector`; searched here for an
     * upright effector without one.
     */
    drink?: IAutoMovieMotionHumanTouchDrink.IDrink;
  }
}
