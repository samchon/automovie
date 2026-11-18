import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
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
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { HumanPreshape } from "./HumanPreshape";
import { pickUpAdjust } from "./pickUpAdjust";
import { pickUpLift } from "./pickUpLift";
import { pickUpPosture } from "./pickUpPosture";
import type { pickUpSearch } from "./pickUpSearch";
import { pickUpStance } from "./pickUpStance";

/**
 * Reaching for a prop's grip, grasping it and lifting it clear.
 *
 * The goal is the grip, not the arm: the hand's grip socket is brought onto
 * the prop's grip affordance along its approach axis (`HumanGrasp`), taken
 * as the archetype declares it: untilted, and from the side about the
 * grip's axis the arm reaches with the least wrist error among the sides
 * its declared symmetry allows (any side of a round grip, either of a
 * half-symmetric one, the declared one otherwise; `pickUpSearch.TURNS`);
 * a use's grasp is searched over its own turns and tilts. Then the
 * fingers open to the peak aperture on the way and close on the prop's
 * colliders until contact (`HumanGrip`), and inverse kinematics solves the
 * arm. Where the arm reaches the grip from the posture the action is
 * entered in, the rest of the body holds that posture, so a pick up
 * continues a stand or the deepest point of a bend with its feet planted,
 * and only the reaching arm and its fingers move. Where it does not, a
 * standing body is lowered toward the grip over the reach, as the bend law
 * lowers it (`pickUpPosture`): a slight lean at a counter, a stoop or a
 * squat for a low one, the feet planted; a seated one leans from its seat;
 * and where the arm still misses, the trunk turns toward the grip first
 * and a standing body then takes one adjustment step (`pickUpAdjust`).
 * The lift is the whole body's: the trunk or the stance carries what the
 * arm cannot, and where neither does, the step is taken for the grip and
 * the lifted place together (`pickUpStance`). A body that moved for the
 * grip or the lift straightens after it over as long as the reach, the
 * hand riding with the shoulder, and the event `upright` closes the
 * action.
 *
 * Phases:
 *
 * 1. Reach: the reach-to-grasp transport (`HumanPrehension`): the
 *    two-factor movement time of McIntosh et al. (2018) for the wrist's travel
 *    and the grasped width, with the performer's timing variability; the
 *    hand comes in the last stretch along the approach axis from a setback
 *    equal to the peak aperture, so the open hand clears the object, and the
 *    aperture peaks inside Jeannerod's 60 to 70 % band.
 * 2. Load: the hand holds still for 0.15 s with the fingers closed, the
 *    preload and load phases that precede lift-off in a precision lift
 *    (Johansson and Westling 1984, Exp. Brain Res. 56:550); the duration is
 *    provisional, as the phase durations themselves were not reached.
 * 3. Lift: the wrist rises `lift` metres (0.1 m when absent, provisional:
 *    about a hand's breadth clear of the support, or 0 when the other hand
 *    already holds it) on a minimum-jerk profile
 *    timed by the same movement-time law. Where the arm alone cannot bring
 *    the wrist to its lifted place, the trunk inclines toward it, or a
 *    lowered body straightens part of the way, over the lift
 *    (`pickUpLift.raise`); a lift the planned hand still falls short of by
 *    more than the arm solver's place tolerance is refused on `lift`
 *    (`pickUpLift.judged`).
 *
 * The hand grips the prop from `gripClosed` to the end, which attaches the
 * prop to the hand (`HumanPerformance.prop`), so the prop rides the lift, and
 * the plan declares a hold from `gripClosed`, so the hand keeps the prop with
 * its closed fingers through later actions (carried with the trunk while a
 * walk or a turn drives the body) until a put down or a hand over takes it.
 * A second hand steadies a prop the other already carries; it takes the grip
 * without a lift, and an independently requested lift is refused on `lift`.
 *
 * Events: `gripClosed`, `liftOff`, `lifted`, and `upright` after a body
 * lowered for the grip or inclined for the lift straightens. A pick up cut
 * into a stand before `gripClosed` abandons the reach; after `lifted` it continues into a stand, a walk, a put down or
 * a hand over. A grip no lowering brings within the arm, or one beyond the
 * arm of a body that is not standing, is refused with the step named.
 */
export namespace pickUp {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "pickUp";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "gripClosed"], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
        keep: ["grip"],
      },
    ],
    walk: [
      {
        window: ["lifted", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
        keep: ["grip"],
      },
    ],
  };

  /** The share of the reach over which the arm leaves its entry pose by a blend of its joints, before the transport's goal alone leads it to the grip (provisional: 0.6, ahead of the last stretch the hand makes along the approach). */
  export const LEAVE: number = 0.6;

  /** The load phase between contact and lift-off, seconds; provisional. */
  export const LOAD: number = 0.15;

  /**
   * Plan a pick up.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no lowering brings the grip within reach, no grasp serves the use, the hand cannot rise as far as the lift asks, or a second hand asks to lift independently of the hand already carrying the prop.
   * @throws {Error} When the lift is negative, or the prop has no such affordance or no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The law and parameters define original grasp/use/lift/steadied-hand goals, contact events, variation and refusals; this plan preserves complete position/attitude requests through the actual lift.
   * @evidence contracts/development/implementation.md#principled-implementation Existing stance/grasp/prehension owners choose and transport the grip, close its actual contacts, carry the original complete arm/digit/reference goals and apply the original lift-height judgement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Grasp/stance admission precedes finger/transport preparation, original phase body construction and complete arm goals; optional same-person observations follow those existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original grasp/lift targets, contact timing, candidate fits, ROM, reference, planting and acceptance bounds remain; no shown endpoint replaces an asked goal and no attitude-only post-fit twist discards position.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed target/hand/digit/transport data prepare once. Active body lowering, shoulder reading and initial carry borrow exact current-person FK/ROM where supplied; every original phase goal and actual solve remains. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit current-call loans flow through original adjusted stance/lift/body/carry paths; absent loans retain native policy and varying current goals are independently fitted without pose/time result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns original chosen grasp/stance/transport/finger geometry; current FK/ROM arguments are used synchronously and never stored in the plan, returned goals or query history.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
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
    const authored: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.target(
      context,
      context.params.prop,
      context.params.handle,
      context.start,
    );

    // The body the grip is taken and the lift made from: the entry's, or the
    // entry lowered, turned or stepped, and how it carries the lift
    // (`pickUpStance`).
    const { found, lowered, raise }: pickUpStance.IChosen = pickUpStance.of(
      context,
      side,
      lift,
      authored,
    );
    const { chosen, bend, stance }: pickUpSearch.ISearched = found;
    const held: IAutoMovieMotionHumanPosture = stance.posture;
    const target: IAutoMovieMotionHumanGrasp.ITarget = HumanGrasp.around(authored, chosen.turn);
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
    const way: pickUpPosture.IStance["at"] = (share: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture =>
      lowered === null ? held : lowered.at(share, resolution, projection);

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
    const reach: number = HumanPrehension.duration(
      context.skill,
      context.random("reach"),
      Vector3.length(Vector3.subtract(grasp.point, entry.worldPosition)),
      target.width,
    );
    const rise: number = lift > 0 ? HumanPrehension.nominal(lift, 0) : 0;
    // A body lowered for the grip, or inclined for the lift, straightens
    // over as long as the reach after the lift, as a bend descends and
    // rises in one time.
    const end: number = reach + LOAD + rise;
    const up: number = lowered === null && !rising ? 0 : reach;
    const duration: number = end + up;
    const transport: IAutoMovieMotionHumanPrehension.ITransport = HumanPrehension.transport(
      entry.worldPosition,
      grasp.point,
      target.approach,
      HumanPrehension.aperture(target.width),
      { from: entry.worldRotation, to: grasp.rotation },
      reach,
    );
    const peak: number = HumanPrehension.peak(context.random("peak"));
    const shapes: Parameters<typeof HumanPrehension.shape>[0] = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open,
      closed,
    };
    const shapeAt: ReturnType<typeof HumanPrehension.prepareShape> = HumanPrehension.prepareShape(shapes, peak);
    const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
    const rest: IAutoMovieMotionHumanArmAngles.IAngles =
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);
    const hand: IAutoMovieMotionHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    const shoulder: (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]) => IAutoMovieVector3 =
      (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): IAutoMovieVector3 =>
        HumanTrunk.resolve(body, posture, undefined, resolution, new Set<AutoMovieHumanoidBone>([`${side}UpperArm`])).get(`${side}UpperArm`)!.worldPosition;
    // Where the straightening after the lift starts from.
    const bottom: IAutoMovieVector3 | null =
      up === 0
        ? null
        : shoulder(
            rising ? pickUpLift.posed(body, raise, way, raise.share, 1) : held,
          );
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "gripClosed", share: reach / duration },
        { name: "liftOff", share: (reach + LOAD) / duration },
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
            (s: IAutoMovieMotionHumanEntryState.ISupport): IAutoMovieMotionHumanContactWindow => ({
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
        },
      ],
      contact: reach,
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));

        // The body at the second: the entry, lowered over the reach; over the
        // lift, inclined or straightened as far as the lift needs; and
        // straightened after it, back to the entry.
        let base: IAutoMovieMotionHumanPosture = held;
        if (t < reach) {
          if (lowered !== null) base = lowered.at(minimumJerk.share(t / reach), resolution, projection);
        } else if (t <= end) {
          const k: number =
            rising && rise > 0
              ? minimumJerk.share(Math.min(1, Math.max(0, (t - reach - LOAD) / rise)))
              : 0;
          if (k > 0)
            base = pickUpLift.posed(
              body,
              raise,
              way,
              1 - (1 - raise.share) * k,
              k,
              resolution,
              projection,
            );
        } else {
          const m: number = 1 - minimumJerk.share((t - end) / up);
          base = rising
            ? pickUpLift.posed(body, raise, way, raise.share * m, m, resolution, projection)
            : lowered!.at(m, resolution, projection);
        }
        // As the body straightens the hand rides with the shoulder.
        const raised: IAutoMovieVector3 =
          t > end
            ? Vector3.subtract(shoulder(base, resolution), bottom!)
            : { x: 0, y: 0, z: 0 };

        // The posture whose arm goal is the transport's at a second of the
        // action, with the fingers shaped as they are at `shaped`.
        const goaled: (at: number, shaped: number) => IAutoMovieMotionHumanPosture = (at: number, shaped: number): IAutoMovieMotionHumanPosture => ({
          ...base,
          joints: {
            ...base.joints,
            ...shapeAt(shaped / reach),
          },
          limbs: {
            ...base.limbs,
            [limb]: {
              point:
                at < reach
                  ? transport.wrist(at)
                  : Vector3.add(raised, {
                      ...grasp.point,
                      y:
                        grasp.point.y +
                        (rise > 0
                          ? lift *
                            minimumJerk.share(Math.min(1, (at - reach - LOAD) / rise))
                          : 0),
                    }),
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
        const leave: number = LEAVE * reach;

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
    return plan;
  }

  /** Whether a wrist goal lies within the straight arm's reach from its shoulder (`pickUpPosture.reaches`), which the put down reads too. */
  export const reaches: typeof pickUpPosture.reaches = pickUpPosture.reaches;

  /** Refuse a wrist goal beyond the straight arm's reach from its shoulder (`pickUpPosture.reachable`), which the put down reads too. */
  export const reachable: typeof pickUpPosture.reachable =
    pickUpPosture.reachable;
}
