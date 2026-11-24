import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * A placed action for unit tests of a function that reads a segment's timing
 * and plan: its film placement as given and a plan of the given duration whose
 * posture is the given still posture.
 *
 * The law and the context are never read by the functions such a test calls,
 * so they are left unset and typed as their contracts (`as never`), which a
 * read of them would expose at once.
 *
 * @param props The placement: the order, the law's time zero (`start`, the
 *   entry by default), the entry and end seconds, the plan's duration and its
 *   optional still windows, contacts and named hands.
 * @returns The segment.
 */
export function syntheticHumanSegment(
  props: syntheticHumanSegment.IProps,
): IAutoMovieMotionHumanSegment {
  const posture: IAutoMovieMotionHumanPosture = props.posture ?? {
    root: { x: 0, y: 0.9, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration: props.duration,
    events: [],
    contacts: props.contacts ?? [],
    ...(props.still === undefined ? {} : { still: props.still }),
    ...(props.legsStill === undefined ? {} : { legsStill: props.legsStill }),
    ...(props.hands === undefined ? {} : { hands: props.hands }),
    posture: (): IAutoMovieMotionHumanPosture => posture,
  };
  return {
    index: props.index ?? 0,
    entry: props.index ?? 0,
    id: props.id ?? "still",
    name: "stand",
    params: {},
    law: undefined as never,
    context: undefined as never,
    plan,
    start: props.start ?? props.entryTime,
    entryTime: props.entryTime,
    end: props.end,
  };
}

/** Companion types of {@link syntheticHumanSegment}. */
export namespace syntheticHumanSegment {
  /** A synthetic segment's placement and plan. */
  export interface IProps {
    /** Order within the person's actions; 0 by default. */
    index?: number;

    /** The action's id; `still` by default. */
    id?: string;

    /** Film second of the law's time zero; the entry by default. */
    start?: number;

    /** Film second it becomes active. */
    entryTime: number;

    /** Film second it stops. */
    end: number;

    /** The plan's duration, seconds. */
    duration: number;

    /** The plan's still window, plan seconds. */
    still?: readonly [number, number];

    /** The plan's legs-still window, plan seconds. */
    legsStill?: readonly [number, number];

    /** The plan's contact windows. */
    contacts?: IAutoMovieMotionHumanActionPlan["contacts"];

    /** The hands the plan names. */
    hands?: IAutoMovieMotionHumanActionPlan["hands"];

    /** The plan's posture at every second; a standing root by default. */
    posture?: IAutoMovieMotionHumanPosture;
  }
}
