import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanPostureRaw } from "../posture/HumanPostureRaw";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";

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

/** Cadence, travel and swing clearance tuned for visible stage blocking. */
interface IProfile {
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
  Record<IAutoMovieMotionHumanStageBladeFootwork.Style, IProfile>
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
 * Shift a performer's stance between two floor marks on a blade set. A fenced
 * stage uses lifted steps, the kendo profile moves the travelling foot along
 * the floor, and an armoured cast can use a deliberate cadence. These are
 * screen-blocking profiles. A prop cue belongs to the editor's clock
 * independently of footholds. Props remain attached by the normal grip owner.
 */
export const stageBladeFootwork: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStageBladeFootwork.IParams> =
  {
    name: "stageBladeFootwork",
    interrupts: {
      any: [{ window: [0.92, 1], kind: "inertialize", entry: 0, blend: 0.12 }],
    },
    plan,
  };

/**
 * Resolve the parameters once and transport the carried upper posture over the
 * same floor frame as the two foot paths.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageBladeFootwork.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const params: IAutoMovieMotionHumanStageBladeFootwork.IParams =
    context.params;
  if (!Object.hasOwn(PROFILES, params.style))
    refuse("style", params.style, Object.keys(PROFILES));
  if (!Object.hasOwn(DIRECTIONS, params.direction))
    refuse("direction", params.direction, Object.keys(DIRECTIONS));
  if (
    params.lead !== undefined &&
    params.lead !== "left" &&
    params.lead !== "right"
  )
    refuse("lead", params.lead, ["left", "right"]);
  const profile: IProfile = PROFILES[params.style];
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const feet: typeof context.entry.feet = context.entry.feet;
  const stature: number = body.measure.stature;
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
      profile.seconds * Math.sqrt(body.measure.hipHeight / REFERENCE_HIP),
    0,
    "s",
  );
  const heading: IAutoMovieMotionHumanFrame = {
    origin: { x: 0, y: 0, z: 0 },
    yaw: entry.yaw,
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
  const following: Side = opposite(first);
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
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
    duration,
    instants,
  );
  const firstPath: AutoMovieMotionInterval.IPrepared =
    AutoMovieMotionClock.prepare(clock, "firstLift", "firstSettle");
  const followingPath: AutoMovieMotionInterval.IPrepared =
    AutoMovieMotionClock.prepare(clock, "followLift", "followSettle");
  return {
    duration,
    events: clock.events(),
    contacts: [
      ...plants(first, firstWindow),
      ...plants(following, followingWindow),
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const initial: number = firstPath.progress(seconds);
      const next: number = followingPath.progress(seconds);
      const left: number = first === "left" ? initial : next;
      const right: number = first === "right" ? initial : next;
      const placed: Record<Side, IAutoMovieMotionHumanFoot.IPlacement> = {
        left: placement(feet.left, travel, left, profile.lift * stature),
        right: placement(feet.right, travel, right, profile.lift * stature),
      };
      const root: IAutoMovieVector3 = Vector3.add(
        entry.root,
        Vector3.scale(travel, (left + right) / 2),
      );

      // Fit the root height against both placements to keep their reach
      // limit continuous as a travelling foot becomes a plant.
      const lower: IAutoMovieMotionHumanPosture = lowerHumanPosture(body, {
        ...entry,
        root,
        limbs: StrikingStance.legs(body, placed),
      });
      const upper: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
        entry,
        lower.root,
      );
      const [flexion, abduction, twist] = upper.joints.spine ?? [0, 0, 0];
      const travelFlexion: number =
        profile.follow * (pulse(initial) + pulse(next));
      return {
        ...upper,
        joints: {
          ...upper.joints,
          spine: [flexion + travelFlexion, abduction, twist],
        },
        limbs: {
          ...upper.limbs,
          ...StrikingStance.legs(body, placed, {
            left: settled(left),
            right: settled(right),
          }),
        },
      };
    },
  };
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

/** The lifted swing or low glide from a displayed entry footprint. */
function placement(
  foot: IAutoMovieMotionHumanFoot.IPlacement,
  travel: IAutoMovieVector3,
  progress: number,
  lift: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  const ankle: IAutoMovieVector3 = Vector3.add(
    foot.ankle,
    Vector3.scale(travel, progress),
  );
  return {
    ankle: { ...ankle, y: ankle.y + lift * pulse(progress) },
    rotation: foot.rotation,
  };
}

/** A travel envelope that starts and settles at zero. */
function pulse(progress: number): number {
  return 4 * progress * (1 - progress);
}

/** A clamped travel progress is at its plant before or after its moving phase. */
function settled(progress: number): boolean {
  return progress === 0 || progress === 1;
}

/** The other side of the supplied side. */
function opposite(side: Side): Side {
  return side === "left" ? "right" : "left";
}

/** State the closed set of accepted stage values to the planner. */
function refuse(
  axis: string,
  value: unknown,
  choices: readonly string[],
): never {
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    feasible: null,
    reason: "the stage mark shift has no such option",
    fix: `choose ${choices.join(", ")}`,
  });
}
