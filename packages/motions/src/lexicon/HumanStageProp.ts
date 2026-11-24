import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanStageProp,
  IAutoMovieMotionHumanStrikingAdvance,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingHeldFrame } from "../striking/StrikingHeldFrame";

/** A direction or an arm-length offset in actor-local coordinates. */
type Vector = readonly [x: number, y: number, z: number];

/** The silhouette at one time along the beat, in actor-local coordinates. */
interface IPose {
  /** The grip relative to the holding shoulder, in arm lengths. */
  grip: Vector;
  /** Model mark direction in the actor's frame. */
  axis: Vector;
  /** Roll reference in the actor's frame. */
  roll: Vector;
}

/** One style table entry. */
interface IBeat {
  /** Fallback mark on the model. */
  mark: string;
  /** Authored duration, seconds. */
  seconds: number;
  /** Axial trunk travel, degrees in the beat's authoring frame. */
  turn: number;
  /** Whether the shared stance planner moves a foot. */
  advance: IAutoMovieMotionHumanStrikingAdvance.Advance;
  /** Read the scene silhouette through a normalized pose span. */
  sample(share: number): IPose;
}

/** A common carrier pose path for the rigid and linked prop comparison. */
function sampleOffsetDisplay(share: number): IPose {
  const lateral: number = Math.cos(Math.PI * share);
  return {
    grip: [0.2 * lateral, 0.26 - 0.34 * share, 0.46],
    axis: [0.3 * lateral, 0.76 - share, 1],
    roll: [0, 1, 0],
  };
}

/**
 * Presets for virtual screen blocking. Qiangshu's continuous circular
 * silhouettes and mobile footing inform the two display flourishes
 * (International Wushu Federation, Taolu). All coordinates and times are
 * authored animation values. The shield rows follow separate visual accents.
 */
const BEATS: Readonly<Record<IAutoMovieMotionHumanStageProp["beat"], IBeat>> = {
  figureEight: {
    mark: "tip",
    seconds: 1.8,
    turn: 12,
    advance: "step",
    sample: (share: number): IPose => {
      const angle: number = 2 * Math.PI * share;
      return {
        grip: [0.21 * Math.sin(angle), 0.13 * Math.sin(2 * angle) - 0.12, 0.48],
        axis: [0.7 * Math.sin(angle), 1, 0.55 * Math.cos(angle)],
        roll: [0, 0, 1],
      };
    },
  },
  overheadCircle: {
    mark: "tip",
    seconds: 1.9,
    turn: 7,
    advance: "none",
    sample: (share: number): IPose => {
      const angle: number = 2 * Math.PI * share;
      return {
        grip: [0.2 * Math.cos(angle), 0.51, 0.36 + 0.12 * Math.sin(angle)],
        axis: [Math.cos(angle), 0.58, Math.sin(angle)],
        roll: [0, 1, 0],
      };
    },
  },
  block: {
    mark: "face",
    seconds: 1.05,
    turn: -10,
    advance: "none",
    sample: (share: number): IPose => ({
      grip: [-0.18 * share, 0.02, 0.36 + 0.17 * share],
      axis: [-0.17 + 0.17 * share, 0, 1],
      roll: [0, 1, 0],
    }),
  },
  yield: {
    mark: "face",
    seconds: 1.1,
    turn: 15,
    advance: "none",
    sample: (share: number): IPose => ({
      grip: [0.15 * share, -0.13 * share, 0.54 - 0.25 * share],
      axis: [0.25 * share, 0.14 * share, 1],
      roll: [0, 1, 0],
    }),
  },
  boss: {
    mark: "boss",
    seconds: 1.05,
    turn: -8,
    advance: "step",
    sample: (share: number): IPose => ({
      grip: [-0.04, -0.11, 0.34 + 0.16 * share],
      axis: [0, 0.04, 1],
      roll: [0, 1, 0],
    }),
  },
  rim: {
    mark: "rim",
    seconds: 1.35,
    turn: -16,
    advance: "step",
    sample: (share: number): IPose => ({
      grip: [0.23 - 0.38 * share, -0.11 + 0.13 * share, 0.46],
      axis: [0.72 - 0.85 * share, 0.23, 1],
      roll: [0, 1, 0],
    }),
  },
  offset: {
    mark: "face",
    seconds: 1.3,
    turn: -8,
    advance: "none",
    sample: sampleOffsetDisplay,
  },
  linked: {
    mark: "link",
    seconds: 1.3,
    turn: -8,
    advance: "none",
    sample: sampleOffsetDisplay,
  },
};

/**
 * A held digital prop display law. `stroke` is the authored screen beat,
 * available to another performance chain as a synchronization anchor. The
 * existing body and arm planners own support and grip fitting.
 */
export const HumanStageProp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStageProp> =
  {
    name: "stageProp",
    interrupts: StrikingHeld.follows("stroke"),
    plan,
  };

/**
 * Plan the beat in the entry performer's frame and keep the registered grip.
 *
 * @param context Entry body, held digital prop and authored beat.
 * @returns A fitted kinematic action with the `stroke` editing cue.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageProp>,
): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanStageProp = context.params;
  const beat: IBeat = BEATS[params.beat];
  const hand: AutoMovieHumanSide = params.hand ?? "right";
  const other: AutoMovieHumanSide = hand === "left" ? "right" : "left";
  const seconds: number = params.duration ?? beat.seconds;
  if (!(seconds > 0 && Number.isFinite(seconds)))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: seconds,
      reason: "the stage beat needs a positive finite duration",
      fix: "give it a positive duration in seconds",
    });
  const at: IAutoMovieVector3 | undefined = params.at;
  if (at !== undefined && ![at.x, at.y, at.z].every(Number.isFinite))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "at",
      value: "nonfinite point",
      reason: "a screen mark must be finite",
      fix: "give the virtual set point as finite world coordinates",
    });
  const clock: ReturnType<typeof AutoMovieMotionClock.phrase> =
    AutoMovieMotionClock.phrase({
      prepare: 0.19 * seconds,
      attack: 0.57 * seconds,
      hold: 0.06 * seconds,
      retract: 0.18 * seconds,
    });
  const mark: string = params.mark ?? beat.mark;
  const held: IAutoMovieMotionHumanHeld.IHeld = heldAtStroke(
    context,
    hand,
    mark,
    clock.at("stroke"),
  );
  const read: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.read(
    held,
    { tip: mark },
  );
  const marker: IAutoMovieAffordance = held.affordances.find(
    (site: IAutoMovieAffordance): boolean => site.id === mark,
  )!;
  const gripToMark: ReturnType<typeof AutoMovieMotionHumanHeld.point> =
    AutoMovieMotionHumanHeld.point(held, mark);
  const roll: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(held.frame.rotation, marker.frame.rotation),
    Vector3.create(1, 0, 0),
  );
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = {
    ...read,
    axis: gripToMark.direction,
    edge: StrikingHeldFrame.square(gripToMark.direction, roll),
    rolls: false,
  };

  const support: IAutoMovieMotionHumanStrikingBlade.ISupport | null =
    supportGrip(context, held, tool, other);
  const yaw: number = context.entry.posture.yaw;
  const sign: number = hand === "left" ? 1 : -1;
  const origin: IAutoMovieVector3 = Vector3.create(0, 0, 0);
  const world = ([x, y, z]: Vector): IAutoMovieVector3 =>
    HumanFrame.point({ origin, yaw }, Vector3.create(sign * x, y, z));
  const line: IAutoMovieVector3 = world([0, 0, 1]);
  const advance: IAutoMovieMotionHumanStrikingAdvance.Advance =
    at === undefined ? beat.advance : "none";
  const shoulder: IAutoMovieVector3 = StrikingBlade.shoulder(
    context,
    hand,
    advance,
    line,
  );
  const arm: number =
    context.body.measure.upperArm + context.body.measure.forearm;
  const staged: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(context, {
    tool,
    clock,
    support,
    advance,
    line,
    stay: false,
    stop: 1,
    back: 0,
    turn: sign * beat.turn,
    path: (progress: number): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
      const share: number = Math.min(1, Math.max(0, progress));
      const pose: IPose = beat.sample(share);
      const grip: IAutoMovieVector3 = Vector3.add(
        shoulder,
        Vector3.scale(world(pose.grip), arm),
      );
      const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        StrikingHeld.hand(tool, 0, origin, world(pose.axis), world(pose.roll));
      // A two-handed prop turns about the middle of its hands: the authored
      // grip is that middle, so the support site never sweeps a full grip
      // spacing around the leading hand, out of the other arm's reach.
      const centred: IAutoMovieVector3 =
        support === null
          ? grip
          : Vector3.subtract(
              grip,
              Vector3.scale(
                Quaternion.rotateVector(
                  frame.rotation,
                  supportPoint(tool, support),
                ),
                0.5,
              ),
            );
      if (at === undefined) return { point: centred, rotation: frame.rotation };
      const markGrip: IAutoMovieVector3 = Vector3.add(at, frame.point);
      return {
        point: Vector3.lerp(centred, markGrip, share * share),
        rotation: frame.rotation,
      };
    },
  });
  const { contact: _contact, wields: _wields, ...visual } = staged;
  return visual;
}

/**
 * The support site from the leading grip in the hand's frame, expanded from its
 * offset in the tool's axis-edge basis.
 *
 * @param tool The held tool and its axes.
 * @param support The support handle's offset.
 * @returns The support site from the grip socket, metres, in the hand bone's
 *   axes.
 */
function supportPoint(
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  support: IAutoMovieMotionHumanStrikingBlade.ISupport,
): IAutoMovieVector3 {
  return Vector3.add(
    Vector3.add(
      Vector3.scale(tool.axis, support.offset.x),
      Vector3.scale(tool.edge, support.offset.y),
    ),
    Vector3.scale(Vector3.cross(tool.axis, tool.edge), support.offset.z),
  );
}

/**
 * Keep the registered hold and read articulated model sites at the authored
 * stroke accent.
 */
function heldAtStroke(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageProp>,
  hand: AutoMovieHumanSide,
  mark: string,
  stroke: number,
): IAutoMovieMotionHumanHeld.IHeld {
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    hand,
    context.params.prop,
  );
  if (
    !held.affordances.some(
      (site: IAutoMovieAffordance): boolean =>
        site.rides !== undefined &&
        (site.id === mark || site.id === context.params.support),
    )
  )
    return held;
  const reader: ReturnType<typeof context.prop> = context.prop(held.prop);
  const posed:
    | ReturnType<NonNullable<typeof reader.prop.articulate>>
    | undefined = reader.prop.articulate?.(
    reader.state?.(context.start + stroke) ?? {},
  );
  return posed === undefined
    ? held
    : { ...held, affordances: posed.affordances };
}

/** Resolve a named second grip in the same held frame the primary hand uses. */
function supportGrip(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageProp>,
  held: IAutoMovieMotionHumanHeld.IHeld,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  other: AutoMovieHumanSide,
): IAutoMovieMotionHumanStrikingBlade.ISupport | null {
  const site: string | undefined = context.params.support;
  if (context.entry.holds[other] !== held.prop) {
    if (site === undefined) return null;
    throw new HumanRefusal({
      kind: "affordance",
      axis: "support",
      value: site,
      reason: "the support hand does not hold this stage prop",
      fix: "take the named grip with the support hand before the beat",
    });
  }
  if (site === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "support",
      value: other,
      reason: "both hands hold the prop but no support site is declared",
      fix: "name the support hand's grip on the stage prop",
    });
  const point: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
    held,
    site,
  ).point;
  return {
    offset: {
      x: Vector3.dot(point, tool.axis),
      y: Vector3.dot(point, tool.edge),
      z: Vector3.dot(point, Vector3.cross(tool.axis, tool.edge)),
    },
    handle: "axis",
  };
}
