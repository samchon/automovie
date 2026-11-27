import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLanceCouch,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/internal/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/internal/poseBones";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanLanceCouchCarriage } from "./HumanLanceCouchCarriage";
import { HumanLanceCouchClear } from "./HumanLanceCouchClear";
import { HumanLanceCouchHanging } from "./HumanLanceCouchHanging";
import { HumanLanceCouchPick } from "./HumanLanceCouchPick";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPresentation } from "./HumanMountedPresentation";
import { HumanUnseatPose } from "./HumanUnseatPose";

/**
 * The carried shaft's direction in the seat frame: along the travel, the point
 * a little down and in, so the butt behind the grip rises clear of the horse's
 * croup and passes outside the rider's arm (provisional).
 */
const LEVEL: Readonly<IAutoMovieVector3> = { x: 0.05, y: -0.2, z: 1 };

/**
 * The step the strike is first sought at, seconds: a film frame at 60 per
 * second.
 */
const FRAME: number = 1 / 60;

/**
 * Seconds the arms take from the entry to the couch and the bridle
 * (provisional).
 */
const REACH: number = 0.5;

/**
 * A lance couched and lowered to a skill-at-arms target from the saddle
 * (`IAutoMovieMotionHumanLanceCouch`): carried on the seat contact, the right
 * hand holds the lance by its grip with the upper arm out and down from the
 * shoulder, the shaft along the travel at the grasp's angle to the forearm, and
 * the left holds both reins at their middle. The strike is the first frame at
 * which a carriage lays the lance's point on the target's own point, read in
 * the moving seat frame: the grip one lance length from the target within the
 * arm's reach, the forearm at the grasp's angle to the shaft; over `lower`
 * seconds before it the hand comes down to that carriage and the shaft onto the
 * line to the target by a minimum-jerk path between two carriages laid from the
 * arm's own line (the hand continuing the forearm, the shaft at the grasp's
 * angle to it, the elbow one upper arm from the shoulder), the point meets the
 * target at the strike, the target is set on the lance's point from then, and
 * over `lower` seconds after it the lance comes back to the couch. Register
 * `HumanLanceCouch` to use it.
 */
export const HumanLanceCouch: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLanceCouch> =
  {
    name: "lanceCouch",
    interrupts: { any: [{ window: [0, 1], kind: "inertialize", entry: 0 }] },
    plan: planHumanLanceCouch,
  };

/** The law's context. */
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLanceCouch>;

/**
 * Admit the act, find the strike, lay the stations, then sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the refusals: a non-seated entry, a target the lowered point never reaches inside the act, a strike too early to lower to, and a target past the mounted presentation's bearing.
 * @evidence contracts/development/implementation.md#principled-implementation The target closes on the rider in the seat frame as the horse comes up; once it lies within the arm's and the lance's reach of the shoulder, each frame seeks a grip one lance length from the target from which a closed-form elbow lays the forearm at the grasp's angle to the line to it, and the first frame with one is the strike; the shaft lies on that line, so the point meets the target there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the strike, the stations, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target no carriage reaches is refused with the nearest it comes, never struck short.
 * @evidence contracts/development/implementation.md#efficient-algorithms One seat read and one target read per frame of the search, and a fixed set of closed-form grips only once the target is within reach; two carriages laid once; a sample reads one seat frame, the horse's shapes and the two reins.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool, the stations, the strike and the two carriages are shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the tool, the carrier reader and the target's prop.
 */
function planHumanLanceCouch(
  context: Context,
): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanLanceCouch = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["ride", "mounted"] },
      reason: `a lance is couched from the saddle, and the performer is ${entered.kind}`,
      fix: "ride the horse first",
    });
  HumanBound.above("duration", params.duration, 0, "s");
  HumanBound.above("lower", params.lower, 0, "s");
  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const target: IAutoMovieMotionHumanPropReader = context.prop(
    params.target.prop,
  );
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
    support,
    params.on,
    params.frame ?? "seat",
  );
  const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    context.entry.posture,
    carrier(context.start),
    HumanMountedFrame.LOCAL,
  );
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    "right",
    params.prop,
    // A round shaft has no edge: the lance rolls freely about its axis in the hand.
    { tip: "tip" },
  );
  const goal = StrikingHeld.prepareGoal(context, tool, tool.length);
  const m = context.body.measure;
  // The hand's own line and reach to the grip socket, from the body's hand placed with no turn at the origin.
  const wrist: IAutoMovieVector3 = HumanHand.place(
    context.body,
    "right",
    "grip",
    { x: 0, y: 0, z: 0 },
    Quaternion.identity(),
    "relaxed",
  ).point;
  const arm: HumanLanceCouchCarriage.IArm = {
    upperArm: m.upperArm,
    fore: m.forearm + Vector3.length(wrist),
    line: Vector3.normalize(Vector3.scale(wrist, -1)),
  };

  // The stations in the seat frame, from the seated root.
  // The right shoulder where the seated body actually holds it, in the seat frame.
  const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
    context.body,
    local,
  ).get("rightUpperArm")!.worldPosition;
  const level: IAutoMovieVector3 = Vector3.normalize(LEVEL);
  // The hand the rider enters with, in the seat frame: the carry turns from it as little as it can.
  const holding: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(carrier(context.start).rotation),
    poseBones(
      context.body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(["rightHand"]),
    ).get("rightHand")!.worldRotation,
  );
  // The horse's body the carriages keep clear of: its rest shapes, the seat contact's point in its model.
  const seatContact: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === (params.frame ?? "seat"),
    );
  const horse: HumanLanceCouchClear.IHorseBody = {
    shapes: support.prop.shapes ?? [],
    seat: seatContact?.frame.translation ?? { x: 0, y: 0, z: 0 },
  };
  // A carriage the arm's own fit holds within the stroke's bound, judged on the seated body in the seat frame.
  const reaches = (laid: HumanLanceCouchCarriage.ICarriage): number =>
    StrikingRoll.miss(context, tool, laid.hand, tool.length, local);
  const carried: HumanLanceCouchCarriage.ICarriage = HumanLanceCouchHanging(
    arm,
    shoulder,
    tool,
    level,
    holding,
    horse,
    reaches,
  );

  // The target's point in the seat frame at an act second.
  const seen = (t: number): IAutoMovieVector3 => {
    const film: number = context.start + t;
    const seat: IAutoMovieRigidTransform = carrier(film);
    return Quaternion.rotateVector(
      Quaternion.inverse(seat.rotation),
      Vector3.subtract(
        HumanMountedFrame.contact(target, params.target.point, film),
        seat.position,
      ),
    );
  };
  const armReach: number = arm.upperArm + arm.fore;
  // A carriage that lays the point on the target at an act second, if any.
  const at = (t: number): HumanLanceCouchCarriage.ICarriage | undefined =>
    striking(
      arm,
      shoulder,
      tool,
      seen(t),
      carried.hand.rotation,
      horse,
      reaches,
    );

  // The strike: the first frame at which a carriage lays the point on the target.
  let strike: number | undefined;
  let lowering: HumanLanceCouchCarriage.ICarriage | undefined;
  let nearest: number = Infinity;
  let closest: number = 0;
  for (let t: number = 0; t <= params.duration; t += FRAME) {
    const apart: number =
      Vector3.distance(seen(t), shoulder) - (tool.length + armReach);
    if (apart < nearest) {
      nearest = apart;
      closest = t;
    }
    if (apart > 0) continue;
    const found: HumanLanceCouchCarriage.ICarriage | undefined = at(t);
    if (found === undefined) continue;
    strike = t;
    lowering = found;
    break;
  }
  if (strike === undefined || lowering === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: nearest + tool.length + armReach,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: tool.length + armReach,
        unit: "m",
      },
      reason: `between film seconds ${context.start.toFixed(2)} and ${(context.start + params.duration).toFixed(2)} no carriage of the lance lays its point on ${params.target.prop}'s ${params.target.point}: it comes no nearer than ${(nearest + tool.length + armReach).toFixed(2)} m from the shoulder, at ${(context.start + closest).toFixed(2)} s, against the arm's and the lance's ${(tool.length + armReach).toFixed(2)} m`,
      fix: "ride the horse's line past the target within the lance's reach, or lengthen the act",
    });
  if (strike < params.lower)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "lower",
      value: params.lower,
      feasible: { kind: "range", minimum: 0, maximum: strike, unit: "s" },
      reason: `the strike comes ${strike.toFixed(2)} s into the act, before the point can come down in ${params.lower} s`,
      fix: "begin the act earlier or lower faster",
    });
  const struck: IAutoMovieVector3 = seen(strike);
  const landed: HumanLanceCouchCarriage.ICarriage = lowering;
  HumanMountedPresentation.turn(
    HumanMountedPresentation.bearing(0, local.root, struck),
    0,
    "right",
    "target",
  );
  // The two carriages, laid once in the seat frame from the arm's own line: the carry along `level`, the strike on the line to the target exactly, so the point meets it.

  const duration: number = params.duration;
  const shapes: NonNullable<IAutoMovieMotionHumanPropReader["prop"]["shapes"]> =
    support.prop.shapes ?? [];
  const ease = (t: number, from: number): number =>
    AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, (t - from) / params.lower)));
  const windows: IAutoMovieMotionHumanContactWindow[] = [
    ...StrikingHeld.grips(tool),
    {
      part: "leftHand",
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: params.on },
    },
  ];
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "lowering", share: (strike - params.lower) / duration },
      { name: "strike", share: strike / duration },
      {
        name: "raised",
        share: Math.min(1, (strike + params.lower) / duration),
      },
    ],
    contact: strike,
    contacts: windows,
    base: entered,
    holds: StrikingHeld.holds(context, tool),
    mounts: [
      {
        prop: params.target.prop,
        onto: params.prop,
        point: "tip",
        from: strike / duration,
      },
    ],
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      // Down onto the target's line before the strike, back to the couch after it.
      const down: number =
        t <= strike ? ease(t, strike - params.lower) : 1 - ease(t, strike);
      const now: IAutoMovieRigidTransform = carrier(film);
      const toWorld = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(now.position, Quaternion.rotateVector(now.rotation, p));
      const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        local,
        HumanMountedFrame.LOCAL,
        now,
      );
      // Eased between the two carriages in the seat frame, then carried into the world.
      const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
        point: toWorld(
          Vector3.lerp(carried.hand.point, landed.hand.point, down),
        ),
        rotation: Quaternion.multiply(
          now.rotation,
          Quaternion.slerp(carried.hand.rotation, landed.hand.rotation, down),
        ),
      };
      // The lance arm keeps clear of the horse's own body, its shapes carried on its frame at this second, so a couch through the horse refuses naming its part.
      const placed: IAutoMovieRigidTransform = support.frame(film);
      const horse: IAutoMovieMotionHumanColliders.IExternal[] = shapes.map(
        (
          shape: IAutoMovieMotionHumanColliders.IExternal["shapes"][number],
        ): IAutoMovieMotionHumanColliders.IExternal => ({
          subject: params.on,
          part: shape.id,
          pose: placed,
          shapes: [shape],
        }),
      );
      shown.limbs = {
        ...shown.limbs,
        rightArm: {
          ...goal(
            frame,
            toWorld(Vector3.lerp(carried.elbow, landed.elbow, down)),
          ),
          clearExternal: horse,
        },
      };
      // The bridle hand: both reins at their middle.
      const reins: IAutoMovieVector3 = Vector3.lerp(
        HumanMountedFrame.contact(support, "leftRein", film),
        HumanMountedFrame.contact(support, "rightRein", film),
        0.5,
      );
      return HumanUnseatPose.reach(shown, "left", reins, 1);
    },
  };

  // Both arms are laid as planned courses on these goals, so no instant refits them afresh: the lance arm clear of the horse's body, then the bridle arm on its own, whose hand holds the reins over the horse's tack.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: Math.min(REACH, duration),
    relax: duration,
    end: duration,
  };
  return courseArmGoal({
    context,
    plan: courseArmGoal({
      context,
      plan: goals,
      side: "right",
      span,
    }),
    side: "left",
    span,
  });
}

/** And above and below the target's level, in degrees. */
const UPDOWN: number = 10;

/**
 * A carriage that lays the lance's point on a target, if any: the grip one
 * lance length from the target, within the arm's reach, with an elbow that lays
 * the forearm at the grasp's angle to the line to the target; of those found,
 * the one whose hand turns least from the carry's.
 *
 * @param arm The rider's lance arm.
 * @param shoulder The right shoulder, seat-frame metres.
 * @param tool The held lance in the hand's frame.
 * @param target The target's point, seat-frame metres.
 * @param from The carry's hand rotation, seat frame.
 * @param horse The horse's body, which the carriage keeps clear of.
 * @param reaches Whether the arm's own fit holds a carriage.
 * @returns The carriage, or undefined when none lays the point on the target.
 */
function striking(
  arm: HumanLanceCouchCarriage.IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  target: IAutoMovieVector3,
  from: IAutoMovieQuaternion,
  horse: HumanLanceCouchClear.IHorseBody,
  reaches: (laid: HumanLanceCouchCarriage.ICarriage) => number,
): HumanLanceCouchCarriage.ICarriage | undefined {
  const reach: number = arm.upperArm + arm.fore;
  const options: HumanLanceCouchPick.IOption[] = [];
  for (let up: number = -90; up <= 90; up += UPDOWN)
    for (
      let around: number = 0;
      around < 360;
      around += HumanLanceCouchHanging.AROUND
    ) {
      const a: number = (around * Math.PI) / 180;
      const e: number = (up * Math.PI) / 180;
      const back: IAutoMovieVector3 = {
        x: Math.cos(e) * Math.sin(a),
        y: Math.sin(e),
        z: Math.cos(e) * Math.cos(a),
      };
      const grip: IAutoMovieVector3 = Vector3.add(
        target,
        Vector3.scale(back, tool.length),
      );
      if (Vector3.distance(grip, shoulder) > reach) continue;
      try {
        const laid: HumanLanceCouchCarriage.ICarriage = HumanLanceCouchCarriage(
          arm,
          shoulder,
          tool,
          grip,
          Vector3.scale(back, -1),
        );
        if (!HumanLanceCouchClear(horse, laid)) continue;
        options.push({
          laid,
          turn: Quaternion.angle(laid.hand.rotation, from),
        });
      } catch (error: unknown) {
        if (!(error instanceof HumanRefusal)) throw error;
      }
    }
  return HumanLanceCouchPick(options, reaches).laid;
}
