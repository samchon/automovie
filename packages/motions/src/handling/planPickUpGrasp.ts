import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { poseBones } from "../posture/poseBones";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";
import { pickUp } from "./pickUp";
import { pickUpAdjust } from "./pickUpAdjust";
import type { pickUpIntercept } from "./pickUpIntercept";
import { pickUpLift } from "./pickUpLift";
import { pickUpPosture } from "./pickUpPosture";
import type { pickUpSearch } from "./pickUpSearch";
import { pickUpStance } from "./pickUpStance";

/**
 * Plan a pick-up's reach, grasp and lift from the action context and an optional resolved interception: the posture, contacts, events and hold.
 *
 * Moved unchanged from `pickUp` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the function computes and where it was moved from; the caller's documentation states the method.
 * @evidence contracts/development/implementation.md#principled-implementation The same computation its caller performed inline before the move, with the same inputs and outputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function per file; the caller keeps its own decisions and delegates this step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value, tolerance or branch changed in the move.
 * @evidence contracts/development/implementation.md#efficient-algorithms The cost is the moved body's, unchanged; the move adds one call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nothing beyond what the body shared before the move.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond what the body retained before the move.
 */
export function planPickUpGrasp(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  interception?: ReturnType<typeof pickUpIntercept>,
): IAutoMovieMotionHumanActionPlan {
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  const steadied: boolean =
    context.entry.holds[side === "left" ? "right" : "left"] ===
    context.params.prop;
  const lift: number = context.params.lift ?? (steadied ? 0 : 0.1);
  if (!(lift >= 0)) throw new Error("A pick up lifts a non-negative height");
  if (steadied && lift > 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "lift",
      value: lift,
      feasible: { kind: "range", minimum: 0, maximum: 0, unit: "m" },
      reason: `the other hand already holds ${context.params.prop}; a second grip steadies it and cannot lift it independently`,
      fix: "take the second grip without lifting, then move both hands together or hand the prop over",
    });
  const body: IAutoMovieMotionHumanBody = context.body;

  // The grasp: where the hand goes, how it opens and how it closes.
  // The grip is taken from the side of its axis the arm can reach with the
  // hand turned as asked (a cylinder grips alike from any azimuth).
  const authored: IAutoMovieMotionHumanGrasp.ITarget =
    interception?.target ??
    HumanGrasp.target(
      context,
      context.params.prop,
      context.params.handle,
      context.start,
    );
  const carried: IAutoMovieVector3 | undefined =
    interception === undefined
      ? undefined
      : Vector3.scale(interception.velocity, pickUp.LOAD / 2);

  // The body the grip is taken and the lift made from: the entry's, or the
  // entry lowered, turned or stepped, and how it carries the lift
  // (`pickUpStance`).
  const { found, lowered, raise }: pickUpStance.IChosen = pickUpStance.of(
    context,
    side,
    lift,
    authored,
    carried,
    interception?.frame,
  );
  const { chosen, bend, stance }: pickUpSearch.ISearched = found;
  const held: IAutoMovieMotionHumanPosture = stance.posture;
  const target: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.around(
    authored,
    chosen.turn,
  );
  const grasp: IAutoMovieMotionHumanHand.IWrist = chosen.wrist;
  pickUpPosture.reachable(context, side, grasp.point, held);

  // The use is judged at its own pose, by its own measure: how far the
  // arm, fitted there within its ranges, leaves the working point off
  // where the use asks it (`HumanGrasp.IKey.judge`), within the held-tool
  // bound (`StrikingRoll.MISS`). What the grasp pose leaves unmet of an
  // asked tilt is no failure of the use: the fingers close where the arm
  // shows the hand, and the use's pose is built from that hand. Its key
  // follows the grasp's and the lift's (`pickUpSearch`); the next
  // action's demands after it are judged by that action's own plan.
  const unmet: number = chosen.judged[lift > 0 ? 2 : 1] ?? Number.NaN;
  if (context.params.use !== undefined && !(unmet <= StrikingRoll.MISS))
    throw new HumanRefusal({
      kind: "reach",
      axis: "use",
      value: unmet,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: StrikingRoll.MISS,
        unit: "m",
      },
      reason: `no grasp of ${context.params.prop} by ${context.params.handle} lets the ${side} hand present its ${context.params.use.tip} on the ${context.params.use.line} line: the best (turned ${chosen.turn}, tilted ${chosen.tilt} degrees, the elbow ${chosen.departure.toFixed(0)} degrees off its hint) leaves the ${context.params.use.tip} ${(unmet * 1000).toFixed(1)} mm off its place at the use's pose`,
      fix: "turn the prop where it lies so the handle can be taken from the side its use needs, take it with the other hand, or name another line for the use",
    });

  // Where the arm alone cannot bring the wrist to its lifted place, the
  // trunk inclines or the stance straightens over the lift (`pickUpLift`).
  const rising: boolean = raise.trunk !== null || raise.share < 1;
  // The stance's body a share of the way down; the entry's when it was
  // not lowered.
  const way: pickUpPosture.IStance["at"] = (
    share: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture =>
    lowered === null ? held : lowered.at(share, resolution, projection);
  const raisedAt: ReturnType<typeof pickUpLift.prepare> = pickUpLift.prepare(
    body,
    raise,
    way,
  );

  // The digits close on the prop where the arm actually puts the hand.
  const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.close(
    body,
    side,
    target.grip,
    chosen.shown,
    target.colliders,
  ).joints;
  const open: IAutoMovieMotionHumanPosture["joints"] = HumanPreshape.open(
    body,
    side,
    closed,
    target.width,
  ).joints;
  const entry: IAutoMovieResolvedBone = poseBones(
    body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
  ).get(`${side}Hand`)!;

  // Timing: reach, load, lift.
  const reach: number =
    interception?.seconds ??
    HumanPrehension.duration(
      context.skill,
      context.random("reach"),
      Vector3.length(Vector3.subtract(grasp.point, entry.worldPosition)),
      target.width,
    );
  if (carried !== undefined)
    pickUpPosture.reachable(
      context,
      side,
      Vector3.add(grasp.point, carried),
      held,
    );
  const rise: number = lift > 0 ? HumanPrehension.nominal(lift, 0) : 0;
  // A body lowered for the grip, or inclined for the lift, straightens
  // over as long as the reach after the lift, as a bend descends and
  // rises in one time.
  const liftOff: number = reach + pickUp.LOAD;
  const end: number = liftOff + rise;
  const up: number = lowered === null && !rising ? 0 : reach;
  const duration: number = end + up;
  const transport: IAutoMovieMotionHumanPrehension.ITransport =
    HumanPrehension.transport(
      entry.worldPosition,
      grasp.point,
      target.approach,
      HumanPrehension.aperture(target.width),
      { from: entry.worldRotation, to: grasp.rotation },
      reach,
    );
  const peak: number = HumanPrehension.peak(context.random("peak"));
  /** Add the support's remaining displacement as the fingers close, then brake. */
  const interceptionOffset = (
    velocity: IAutoMovieVector3,
    at: number,
  ): IAutoMovieVector3 => {
    const elapsed: number = at - reach;
    const load: number = Math.min(pickUp.LOAD, elapsed);
    return Vector3.scale(
      velocity,
      elapsed < 0
        ? elapsed * AutoMovieMotionInterval.progress(peak, 1, at / reach)
        : load * (1 - load / (2 * pickUp.LOAD)),
    );
  };
  const shapes: Parameters<typeof HumanPrehension.shape>[0] = {
    entry: HumanGrip.fingers(context.entry.pose, side),
    open,
    closed,
  };
  const shapeAt: ReturnType<typeof HumanPrehension.prepareShape> =
    HumanPrehension.prepareShape(shapes, peak);
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const rest: IAutoMovieMotionHumanArmAngles.IAngles =
    AutoMovieMotionHumanArm.angles(context.entry.pose, side);
  const hand: IAutoMovieMotionHumanContactWindow["part"] =
    side === "left" ? "leftHand" : "rightHand";
  const shoulder: (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => IAutoMovieVector3 = (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(
      body,
      posture,
      undefined,
      resolution,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    ).get(`${side}UpperArm`)!.worldPosition;
  // Where the straightening after the lift starts from.
  const bottom: IAutoMovieVector3 | null =
    up === 0 ? null : shoulder(rising ? raisedAt(raise.share, 1) : held);
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "gripClosed", share: reach / duration },
      { name: "liftOff", share: liftOff / duration },
      { name: "lifted", share: end / duration },
      ...(up === 0 ? [] : [{ name: "upright", share: 1 }]),
    ],
    contacts: [
      ...pickUpAdjust.plants(lowered, reach, end, up, raise.share),
      // What else the body rests on at the entry, a seat or a back, it
      // keeps throughout.
      ...context.entry.supports
        .filter(
          (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
            s.part !== "leftFoot" && s.part !== "rightFoot",
        )
        .map(
          (
            s: IAutoMovieMotionHumanEntryState.ISupport,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...s,
            from: 0,
            to: 1,
          }),
        ),
      {
        part: hand,
        kind: "grip",
        from: reach / duration,
        to: 1,
        support: { kind: "prop", subject: context.params.prop },
      },
    ],
    holds: [
      {
        side,
        prop: context.params.prop,
        from: reach / duration,
        fingers: closed,
        ...(context.params.use === undefined
          ? {}
          : { use: context.params.use }),
      },
    ],
    contact: reach,
    posture: (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));

      // The body at the second: the entry, lowered over the reach; over the
      // lift, inclined or straightened as far as the lift needs; and
      // straightened after it, back to the entry.
      let base: IAutoMovieMotionHumanPosture = held;
      if (t < reach) {
        if (lowered !== null)
          base = lowered.at(
            minimumJerk.share(t / reach),
            resolution,
            projection,
          );
      } else if (t <= end) {
        const k: number =
          rising && rise > 0
            ? minimumJerk.share(Math.min(1, Math.max(0, (t - liftOff) / rise)))
            : 0;
        if (k > 0)
          base = raisedAt(1 - (1 - raise.share) * k, k, resolution, projection);
      } else {
        const m: number = 1 - minimumJerk.share((t - end) / up);
        base = rising
          ? raisedAt(raise.share * m, m, resolution, projection)
          : lowered!.at(m, resolution, projection);
      }
      // As the body straightens the hand rides with the shoulder.
      const raised: IAutoMovieVector3 =
        t > end
          ? Vector3.subtract(shoulder(base, resolution), bottom!)
          : { x: 0, y: 0, z: 0 };

      /** The wrist's transport, lift and optional conveyor displacement. */
      const point = (at: number): IAutoMovieVector3 => {
        const wrist: IAutoMovieVector3 =
          at < reach
            ? transport.wrist(at)
            : Vector3.add(raised, {
                ...grasp.point,
                y:
                  grasp.point.y +
                  (rise > 0
                    ? lift *
                      minimumJerk.share(Math.min(1, (at - liftOff) / rise))
                    : 0),
              });
        return interception === undefined
          ? wrist
          : Vector3.add(wrist, interceptionOffset(interception.velocity, at));
      };

      // The posture whose arm goal is the transport's at a second of the
      // action, with the fingers shaped as they are at `shaped`.
      const goaled: (
        at: number,
        shaped: number,
      ) => IAutoMovieMotionHumanPosture = (
        at: number,
        shaped: number,
      ): IAutoMovieMotionHumanPosture => ({
        ...base,
        joints: {
          ...base.joints,
          ...shapeAt(shaped / reach),
        },
        limbs: {
          ...base.limbs,
          [limb]: {
            point: point(at),
            rotation: at < reach ? transport.turn(at) : chosen.shown.rotation,
            bend,

            // The grip's own arm solution anchors the whole action, at one
            // constant weight: a weight that grew through the reach let the
            // fit change from one of its solutions to another at a single
            // instant, which showed as a step of the elbow.
            reference: chosen.reference,
            ...(at >= reach ? { planted: true } : {}),
          },
        },
      });

      // The arm leaves the pose it was entered in by a blend of its joints
      // toward one fixed pose, the transport's at the end of this first
      // part, so the elbow keeps one course from the hanging arm: a goal
      // solved afresh at each second near the hip, far from the grip's
      // solution, changed solution between seconds (the wrist read 0.4 m
      // apart 1/120 s apart). From there the transport's goal alone leads
      // to the grip. The blend eases in and arrives moving.
      const leave: number = pickUp.LEAVE * reach;

      // Keep the complete position-and-attitude request after closure.
      // A wrist-only attitude edit after the fit can move the hand by
      // twisting the forearm and would discard the lift's position goal.
      // The ordinary resolver keeps the other limb/digit constraints and
      // the original grip reference while fitting both at the actual time.
      return t >= leave
        ? goaled(t, t)
        : AutoMovieMotionHumanArm.carry(
            body,
            goaled(leave, t),
            { [side]: rest },
            (t / leave) ** 2,
            undefined,
            resolution,
            projection,
          );
    },
  };

  // The lift is judged on the plan's own hand: what the body cannot raise
  // as far as asked is refused, never lifted less in silence.
  pickUpLift.judged(context, side, lift, plan, reach, end);
  // A stationary grip keeps the wrist, support and digits fixed while loading.
  if (interception === undefined) {
    const loading: IAutoMovieMotionHumanPosture = plan.posture(reach);
    HumanPreparedPlayback.attach(plan, body, {
      mode: "posture",
      phases: [
        { from: reach, to: liftOff, sample: () => ({ posture: loading }) },
      ],
    });
  }
  return plan;
}
