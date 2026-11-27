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

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingHeldFrame } from "../../striking/internal/StrikingHeldFrame";
import { humanStagePropBeat } from "./humanStagePropBeat";

/*
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

/*
 * Plan the beat in the entry performer's frame and keep the registered grip.
 * Parameter context: Entry body, held digital prop and authored beat.
 * Returns: A fitted kinematic action with the `stroke` editing cue.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageProp>,
): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanStageProp = context.params;
  const beat: humanStagePropBeat.IBeat = humanStagePropBeat(params.beat);
  const hand: AutoMovieHumanSide = params.hand ?? "right";
  const other: AutoMovieHumanSide = hand === "left" ? "right" : "left";
  const seconds: number = params.duration ?? beat.seconds;
  if (!(seconds > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: seconds,
      reason: "the stage beat needs a positive finite duration",
      fix: "give it a positive duration in seconds",
    });
  const at: IAutoMovieVector3 | undefined = params.at;
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
  const world = ([x, y, z]: humanStagePropBeat.Vector): IAutoMovieVector3 =>
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
      const pose: humanStagePropBeat.IPose = beat.sample(share);
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

/*
 * The support site from the leading grip in the hand's frame, expanded from its
 * offset in the tool's axis-edge basis.
 * Parameter tool: The held tool and its axes.
 * Parameter support: The support handle's offset.
 * Returns: The support site from the grip socket, metres, in the hand bone's
 * axes.
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

/*
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

/*
 * Resolve a named second grip in the same held frame the primary hand uses.
 */
function supportGrip(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStageProp>,
  held: IAutoMovieMotionHumanHeld.IHeld,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  other: AutoMovieHumanSide,
): IAutoMovieMotionHumanStrikingBlade.ISupport | null {
  const site: string | undefined = context.params.support;
  if (context.entry.holds[other] !== held.prop) {
    if (site === undefined) return null;
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "support",
      value: site,
      reason: "the support hand does not hold this stage prop",
      fix: "take the named grip with the support hand before the beat",
    });
  }
  if (site === undefined)
    throw new AutoMovieMotionHumanRefusal({
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
