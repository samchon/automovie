import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { HumanBound } from "../../law/HumanBound";
import { HumanFrame } from "../../posture/HumanFrame";

/** A stage foot selected in the leading or following path. */
type Side = AutoMovieHumanSide;

/** A normalized starting and settling window for one moving foot. */
type Window = readonly [start: number, settle: number];

/** The closed set of authored horizontal stage directions. */
const DIRECTIONS: Readonly<
  Record<IAutoMovieMotionHumanStageBladeFootwork.Direction, IAutoMovieVector3>
> = {
  forward: { x: 0, y: 0, z: 1 },
  back: { x: 0, y: 0, z: -1 },
  left: { x: 1, y: 0, z: 0 },
  right: { x: -1, y: 0, z: 0 },
};

/**
 * The AJKF descriptions of sliding footwork inform ground clearance in the
 * kendo profile. Foil studies distinguish foot travel and whole-body carry by
 * measure. The foil profile is the general fencing step; the epee step is
 * shorter and more measured, as a weapon whose whole body is target keeps its
 * distance, and the sabre step longer and quicker, as the fastest of the three
 * weapons. All numbers here are provisional film timings and scales, including
 * the deliberate cast timing for the armoured profile.
 *
 * @see https://www.kendo.or.jp/knowledge/books/kendogijutsu_01/
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC13050851/
 */
const PROFILES: Readonly<
  Record<
    IAutoMovieMotionHumanStageBladeFootwork.Style,
    stageBladeFootworkSchedule.IProfile
  >
> = {
  fencing: {
    windows: [
      [0.06, 0.4],
      [0.49, 0.82],
    ],
    travel: 0.14,
    lift: 0.014,
    follow: 3,
    seconds: 0.55,
  },
  foil: {
    windows: [
      [0.06, 0.4],
      [0.49, 0.82],
    ],
    travel: 0.14,
    lift: 0.014,
    follow: 3,
    seconds: 0.55,
  },
  epee: {
    windows: [
      [0.08, 0.44],
      [0.53, 0.86],
    ],
    travel: 0.12,
    lift: 0.012,
    follow: 2,
    seconds: 0.65,
  },
  sabre: {
    windows: [
      [0.05, 0.36],
      [0.42, 0.76],
    ],
    travel: 0.15,
    lift: 0.016,
    follow: 4,
    seconds: 0.45,
  },
  kendo: {
    windows: [
      [0.05, 0.43],
      [0.47, 0.85],
    ],
    travel: 0.12,
    lift: 0,
    follow: 1,
    seconds: 0.62,
  },
  armoured: {
    windows: [
      [0.12, 0.51],
      [0.6, 0.91],
    ],
    travel: 0.11,
    lift: 0.025,
    follow: 4,
    seconds: 0.85,
  },
};

/** Reference hip height in metres for the profile's body-scaled edit length. */
const REFERENCE_HIP: number = 0.93;

/** The longest authored mark shift in shares of actor stature. */
const MAX_TRAVEL: number = 0.23;

/**
 * A blade set's footwork schedule between two floor marks: the style's profile
 * (`PROFILES`), the mark shift (the profile's share of stature unless authored,
 * at most `MAX_TRAVEL` of it) and the duration (the profile's at the reference
 * hip height, scaled by the square root of the hip height); the first foot to
 * travel is the lead going forward, the rear going back, or the side stepped
 * toward; each foot travels over its profile window and plants outside it, and
 * a prop cue rides the same clock.
 *
 * @param params The style, direction, lead, distance, duration and prop cue.
 * @param measure The body's stature and hip height.
 * @param yaw The entry heading, degrees.
 * @param feet The entry feet.
 * @returns The schedule.
 * @throws {HumanRefusal} When the shift, the duration or the prop cue lies
 *   outside its bounds.
 */
export function stageBladeFootworkSchedule(
  params: IAutoMovieMotionHumanStageBladeFootwork.IParams,
  measure: Pick<IAutoMovieBodyMeasure, "stature" | "hipHeight">,
  yaw: number,
  feet: Pick<IAutoMovieMotionHumanEntryState["feet"], "left" | "right">,
): stageBladeFootworkSchedule.ISchedule {
  const profile: stageBladeFootworkSchedule.IProfile = PROFILES[params.style];
  const stature: number = measure.stature;
  const distance: number = HumanBound.within(
    "distance",
    params.distance ?? profile.travel * stature,
    0,
    MAX_TRAVEL * stature,
    "m",
    "minimum",
  );
  const duration: number = HumanBound.above(
    "duration",
    params.duration ??
      profile.seconds * Math.sqrt(measure.hipHeight / REFERENCE_HIP),
    0,
    "s",
  );
  const heading: IAutoMovieMotionHumanFrame = {
    origin: { x: 0, y: 0, z: 0 },
    yaw,
  };
  const forward: IAutoMovieVector3 = HumanFrame.point(
    heading,
    DIRECTIONS.forward,
  );
  const lead: Side =
    params.lead ??
    (Vector3.dot(Vector3.subtract(feet.left.ankle, feet.right.ankle), forward) >
    0
      ? "left"
      : "right");
  const first: Side =
    params.direction === "forward"
      ? lead
      : params.direction === "back"
        ? opposite(lead)
        : params.direction;
  const travel: IAutoMovieVector3 = Vector3.scale(
    HumanFrame.point(heading, DIRECTIONS[params.direction]),
    distance,
  );
  const [firstWindow, followingWindow] = profile.windows;
  const instants: IAutoMovieMotionClockInstant[] = [
    { name: "firstLift", seconds: duration * firstWindow[0] },
    { name: "firstSettle", seconds: duration * firstWindow[1] },
    { name: "followLift", seconds: duration * followingWindow[0] },
    { name: "followSettle", seconds: duration * followingWindow[1] },
  ];
  if (params.propCue !== undefined)
    instants.push({
      name: "propCue",
      seconds: duration * HumanBound.within("propCue", params.propCue, 0, 1),
    });
  return {
    profile,
    duration,
    first,
    travel,
    clock: AutoMovieMotionClock(duration, instants),
    contacts: [
      ...plants(first, firstWindow),
      ...plants(opposite(first), followingWindow),
    ],
  };
}

/** The footwork's schedule. */
export namespace stageBladeFootworkSchedule {
  /** Cadence, travel and swing clearance tuned for visible stage blocking. */
  export interface IProfile {
    /** Two ordered travel windows. */
    windows: readonly [Window, Window];

    /** The default length in shares of actor stature. */
    travel: number;

    /** The peak clearance of the swing in shares of actor stature. */
    lift: number;

    /** Peak spinal flexion in clinical degrees as the foot travels. */
    follow: number;

    /** A stage duration in seconds at the reference hip height. */
    seconds: number;
  }

  /** A footwork's profile, feet, travel, clock and plants. */
  export interface ISchedule {
    /** The style's profile. */
    profile: IProfile;

    /** The footwork's seconds. */
    duration: number;

    /** The first foot to travel. */
    first: Side;

    /** The mark shift, world metres. */
    travel: IAutoMovieVector3;

    /** The feet's lifts and settles and the prop cue. */
    clock: IAutoMovieMotionClock;

    /** Each foot's plants outside its travel. */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }
}

/** Both fixed intervals of a foot's ground contact outside its travel window. */
function plants(
  side: Side,
  window: Window,
): IAutoMovieMotionHumanContactWindow[] {
  return [
    {
      part: `${side}Foot`,
      kind: "plant",
      from: 0,
      to: window[0],
      support: { kind: "ground" },
    },
    {
      part: `${side}Foot`,
      kind: "plant",
      from: window[1],
      to: 1,
      support: { kind: "ground" },
    },
  ];
}

/** The other side of the supplied side. */
function opposite(side: Side): Side {
  return side === "left" ? "right" : "left";
}
