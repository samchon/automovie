import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/** The standing posture a synthetic plan holds when none is given. */
const STANDING: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * An action plan for unit tests of a function that reads a plan's timing,
 * windows or posture: the given duration and windows, no event, and one posture
 * held at every second, so expected values follow from the windows alone.
 *
 * @param props The duration, the optional windows, contacts and named hands,
 *   and the posture held.
 * @returns The plan.
 */
export function syntheticHumanPlan(
  props: syntheticHumanPlan.IProps,
): IAutoMovieMotionHumanActionPlan {
  const posture: IAutoMovieMotionHumanPosture = props.posture ?? STANDING;
  return {
    duration: props.duration,
    events: [],
    contacts: props.contacts ?? [],
    ...(props.still === undefined ? {} : { still: props.still }),
    ...(props.legsStill === undefined ? {} : { legsStill: props.legsStill }),
    ...(props.hands === undefined ? {} : { hands: props.hands }),
    posture: (): IAutoMovieMotionHumanPosture => posture,
  };
}

/** Companion types of {@link syntheticHumanPlan}. */
export namespace syntheticHumanPlan {
  /** A synthetic plan's duration and windows. */
  export interface IProps {
    /** The duration, seconds. */
    duration: number;

    /** The still window, plan seconds. */
    still?: readonly [number, number];

    /** The legs-still window, plan seconds. */
    legsStill?: readonly [number, number];

    /** The contact windows. */
    contacts?: IAutoMovieMotionHumanActionPlan["contacts"];

    /** The hands the plan names. */
    hands?: IAutoMovieMotionHumanActionPlan["hands"];

    /** The posture held at every second; a standing root by default. */
    posture?: IAutoMovieMotionHumanPosture;
  }
}
