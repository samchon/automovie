import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropHold,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { pickUp } from "./pickUp";
import { putDownTarget } from "./putDownTarget";

/**
 * Draw a gripped object out of its carrier along a straight line, the inverse
 * of aperture placement (`putDownAperture`): a sword drawn from its scabbard.
 * Register it with `HumanChain.extend({ drawFromCarrier })` or by name, and
 * with the performance.
 *
 * The hand has gripped the seated object (a pickup with no lift). The object
 * then rides the carrier's slide socket while the action drives the carrier's
 * slider from the seat to the opening on one minimum-jerk movement, timed as a
 * loaded carry (`HumanPrehension.carry`), so the carrier keeps it on its line
 * as a scabbard guides its blade, the parent-constraint handoff of digital prop
 * work (Autodesk Maya, Parent constraint,
 * https://help.autodesk.com/cloudhelp/2022/ENU/Maya-CharacterAnimation/files/GUID-F6785389-FAC1-429F-8783-B06B0B8AF1A8.htm).
 * The hand follows on its grip, its wrist placed through the grip's rigid
 * offset read from the displayed frames at the start, and takes the object over
 * at the opening. The rest of the body holds the posture the action was entered
 * in, so the carrier, worn or placed, holds still under the line. Adult
 * insertion trials separate the transport to an opening from the aligned
 * insertion (Ossmy et al. 2020,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/); this is the aligned part
 * run backward. The fitted hand is judged against its planned place on the grip
 * at plan time, and a draw it cannot follow is refused rather than shown with
 * the hand off the hilt. Events: `unseated` at the start and `drawn` at the
 * end. A cut to `stand` inside the draw, or to `walk` at its end, keeps the
 * grip. Over a carrier (a seated rider's draw), the draw claims only its hands
 * and arms, their goals riding the bone the carrier is worn on so they follow
 * the line as the body moves; there the fit is not judged against the line.
 * With a `pull`, a blade longer than the arm's reach, the other hand slides the
 * carrier back along its own line and then turns it about where it hangs toward
 * the drawing shoulder, each by the least that brings the drawn wrist within
 * reach (`pivoting`), while the trunk turns away, and the blade leaves low and
 * in front along the moving line.
 */
export const drawFromCarrier: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanDrawFromCarrier> =
  {
    name: "drawFromCarrier",
    // Over a carrier, a seated rider's draw: the drawing arm and hand only.
    overlay: true,
    interrupts: {
      stand: [
        {
          window: ["unseated", 1],
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
      walk: [
        {
          window: ["drawn", 1],
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
    },
    plan,
  };

/**
 * Read the line on the carrier and move the gripped object along it.
 *
 * @param context The entry with the object gripped and seated.
 * @returns The draw.
 * @throws {HumanRefusal} On `prop` when the hand does not hold it or the drawn
 *   wrist lies beyond the arm, on `from` when the carrier is not named, on
 *   `from.aperture` when the two affordances are not a straight aligned line or
 *   the fitted hand leaves its planned place on the grip by more than `GRIP`,
 *   and on `from.point` when the object is not seated there.
 * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and each refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Each moving hand is planned as one admitted course over the draw (`courseArmGoal`), judged on its goals. The world frames of both affordances come from `putDownTarget` as for aperture placement; the object rides the slide socket the drive moves along the line, and the grip's rigid offset O from the displayed hand and object gives the following wrist frame P O^-1 at each object frame P.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the grip, read the line, check the seat and reach, drive the slide and pose one following transport, then judge the fitted hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unseated object or an unreachable opening is refused, never moved or clamped; the seated tolerance is aperture placement's own seat tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two affordance reads, one hand pose and `JUDGED` + 1 posture fits at plan time; constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `putDownTarget`, `HumanPrehension` and the pickup's reach.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the transport, the held posture and the bend.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
): IAutoMovieMotionHumanActionPlan {
  const { prop, from } = context.params;
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  if (!prop || context.entry.holds[side] !== prop)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "prop",
      value: prop,
      feasible: {
        kind: "alternatives",
        values: [context.entry.holds[side] ?? "none"],
      },
      reason:
        "a draw starts with the seated object gripped by the drawing hand",
      fix: "grip the object with that hand first, with a pickup of no lift",
    });
  if (
    from === undefined ||
    !from.prop ||
    !from.aperture ||
    !from.point ||
    from.prop === prop
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "from",
      value: from?.prop ?? "absent",
      feasible: { kind: "alternatives", values: ["a separate carrier"] },
      reason: "a draw needs a seat and an opening on a separate carrier",
      fix: "name the carrier and both of its affordances",
    });

  // The object's world frame on the seat and at the opening.
  const at = (point: string): IAutoMovieRigidTransform =>
    putDownTarget.of(
      { ...context, params: { prop, onto: { prop: from.prop, point } } },
      context.entry.pose,
    )!;
  const seat: IAutoMovieRigidTransform = at(from.point);
  const opening: IAutoMovieRigidTransform = at(from.aperture);
  const line: IAutoMovieVector3 = Vector3.subtract(
    opening.position,
    seat.position,
  );
  if (
    !(Vector3.length(line) > Number.EPSILON) ||
    !(Quaternion.angle(opening.rotation, seat.rotation) <= 1e-6)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "from.aperture",
      value: from.aperture,
      feasible: {
        kind: "alternatives",
        values: ["a distinct aligned opening"],
      },
      reason:
        "the opening and seat must share an attitude at distinct positions",
      fix: "author the seat and opening along a straight draw line",
    });

  // The object must be seated where the line starts.
  const shown: IAutoMovieRigidTransform = context
    .prop(prop)
    .frame(context.start);
  if (Vector3.distance(shown.position, seat.position) > SEATED)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "from.point",
      value: from.point,
      feasible: { kind: "alternatives", values: ["the object seated there"] },
      reason: `${prop} is ${Vector3.distance(shown.position, seat.position).toFixed(3)} m from ${from.prop}.${from.point}`,
      fix: "draw the object from the carrier it is seated in",
    });

  // The grip's rigid offset, from the displayed frames now.
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const bone: AutoMovieHumanoidBone = `${side}Hand`;
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([bone]),
  ).get(bone)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(shown.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, shown.rotation),
  };
  const wrist = (frame: IAutoMovieRigidTransform): IAutoMovieRigidTransform => {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(frame.rotation, Quaternion.inverse(offset.rotation)),
    );
    return {
      position: Vector3.subtract(
        frame.position,
        Quaternion.rotateVector(rotation, offset.position),
      ),
      rotation,
    };
  };
  const start: IAutoMovieRigidTransform = wrist(shown);
  const direction: IAutoMovieVector3 = Vector3.normalize(line);
  const pulled: IPulled | null = pulling(context, side);
  // The drawn wrist is reached by the body as the draw leaves it: a long
  // draw's trunk has turned away from the drawing side by then.
  const turnedAway: IAutoMovieMotionHumanPosture =
    pulled === null || context.carrier !== undefined
      ? context.entry.posture
      : StrikingBlade.turned(context.entry.posture, pulled.turn);
  // A pulled carrier slides back along its line and turns about where it
  // hangs while the slider runs, so the blade leaves low and in front along
  // the moving line; otherwise the line holds.
  const pivot: IPivot | null =
    pulled === null
      ? null
      : pivoting(
          context,
          from,
          side,
          pulled,
          turnedAway,
          wrist,
          Vector3.length(line),
        );
  const bladeAt: (p: number) => IAutoMovieRigidTransform = (
    p: number,
  ): IAutoMovieRigidTransform =>
    pivot === null
      ? {
          position: Vector3.add(shown.position, Vector3.scale(line, p)),
          rotation: shown.rotation,
        }
      : pivot.blade(p, Vector3.length(line) * p);
  const end: IAutoMovieRigidTransform =
    pivot === null ? wrist(opening) : wrist(bladeAt(1));
  pickUp.reachable(context, side, end.position, turnedAway);

  // One loaded, aligned movement along the line: straight for a carrier
  // that holds still, along the pivoting line for a pulled one, on the
  // same minimum-jerk progress as the slider.
  const held: IAutoMovieMotionHumanPosture = context.entry.posture;
  const carried: number = HumanPrehension.carry(
    Vector3.distance(start.position, end.position),
  );
  const progress: (t: number) => number = (t: number): number =>
    minimumJerk(Math.min(1, Math.max(0, t / carried))).s;
  const transport: IAutoMovieMotionHumanPrehension.ITransport =
    pivot === null
      ? HumanPrehension.transport(
          start.position,
          end.position,
          direction,
          0,
          { from: start.rotation, to: end.rotation },
          carried,
        )
      : {
          duration: carried,
          wrist: (t: number): IAutoMovieVector3 =>
            wrist(bladeAt(progress(t))).position,
          turn: (t: number): IAutoMovieQuaternion =>
            wrist(bladeAt(progress(t))).rotation,
        };
  const retreat: IAutoMovieMotionHumanPrehension.ITransport | null =
    pivot === null || pulled === null
      ? null
      : {
          duration: carried,
          wrist: (t: number): IAutoMovieVector3 =>
            pivot.carry(pulled.wrist, progress(t)).position,
          turn: (t: number): IAutoMovieQuaternion =>
            pivot.carry(pulled.wrist, progress(t)).rotation,
        };
  if (pivot !== null && pulled !== null)
    pickUp.reachable(
      context,
      pulled.side,
      pivot.carry(pulled.wrist, 1).position,
      turnedAway,
    );
  const duration: number = transport.duration;
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    held,
    side,
  );
  const reference: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
    context.entry.pose,
    limb,
  );
  const part: IAutoMovieMotionHumanContactWindow["part"] =
    side === "left" ? "leftHand" : "rightHand";

  // The hand keeps the object, its closed fingers and its use, through the draw.
  const use: IAutoMovieMotionPropHold["use"] = context.entry.uses[side];
  if (context.carrier !== undefined)
    return overCarrier({
      context,
      side,
      prop,
      from,
      line,
      duration,
      transport,
      bend,
      use,
      pulled,
      retreat,
    });
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "unseated", share: 0 },
      { name: "drawn", share: 1 },
    ],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      // The hand follows the object on its grip without carrying it: the
      // carrier's slide guides it until the hand takes it at the opening.
      {
        part,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: prop, carries: false },
      },
      {
        part,
        kind: "grip",
        from: 1,
        to: 1,
        support: { kind: "prop", subject: prop },
      },
      // The pulling hand carries the carrier through its turn and lets it
      // hang again.
      ...(pulled === null
        ? []
        : [
            {
              part: pulled.part,
              kind: "grip" as const,
              from: 0,
              to: 1,
              support: { kind: "prop" as const, subject: from.prop },
            },
          ]),
    ],
    mounts: [{ prop, onto: from.prop, point: from.slide, from: 0 }],
    ...(pulled === null
      ? {}
      : { wears: [{ prop: from.prop, bone: pulled.bone, from: 1 }] }),
    drives: [
      {
        prop: from.prop,
        articulation: from.slider,
        from: 0,
        to: 1,
        travel: (seconds: number): number =>
          Vector3.length(line) *
          minimumJerk(Math.min(1, Math.max(0, seconds / duration))).s,
      },
    ],
    holds: [
      {
        side,
        prop,
        from: 1,
        fingers: HumanGrip.fingers(context.entry.pose, side),
        ...(use === undefined ? {} : { use }),
      },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const body: IAutoMovieMotionHumanPosture =
        pulled === null
          ? held
          : StrikingBlade.turned(
              held,
              pulled.turn * minimumJerk(t / duration).s,
            );
      return {
        ...body,
        limbs: {
          ...body.limbs,
          ...(pulled === null || retreat === null
            ? {}
            : {
                [pulled.limb]: {
                  point: retreat.wrist(t),
                  rotation: retreat.turn(t),
                  bend: pulled.bend,
                  planted: true,
                },
              }),
          [limb]: {
            point: transport.wrist(t),
            rotation: transport.turn(t),
            bend,
            // The arm leaves the grip's configuration as the draw moves the
            // hand away from it, so its pull fades with the draw's progress
            // instead of costing the hand its attitude at the top.
            reference: {
              ...reference,
              weight: 1 - minimumJerk(t / duration).s,
            },
            planted: true,
          },
        },
      };
    },
  };

  // The fitted hand must stay on the guided object's grip: judge the posed
  // hand against the planned wrist along the draw.
  for (let k: number = 0; k <= JUDGED; ++k) {
    const t: number = (duration * k) / JUDGED;
    const pose: IAutoMoviePose = resolveHumanPosture(
      context.body,
      plan.posture(t),
      context.entry.pose,
    );
    const hands: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(
        pulled === null ? [bone] : [bone, `${pulled.side}Hand`],
      ),
    );
    const off: number = Math.max(
      Vector3.distance(hands.get(bone)!.worldPosition, transport.wrist(t)),
      pulled === null || retreat === null
        ? 0
        : Vector3.distance(
            hands.get(`${pulled.side}Hand`)!.worldPosition,
            retreat.wrist(t),
          ),
    );
    if (off > GRIP)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "from.aperture",
        value: from.aperture,
        feasible: { kind: "range", unit: "m", minimum: 0, maximum: GRIP },
        reason: `the drawing hand leaves ${prop}'s grip by ${off.toFixed(3)} m at ${(k / JUDGED).toFixed(2)} of the draw`,
        fix: "wear the carrier where the drawing arm can follow its line",
      });
  }
  // Each moving hand is planned as one admitted course over the draw, not
  // fitted afresh at every second, where two nearly tied arm solutions let
  // one instant take the other branch; the judgement above reads the goals.
  // The arm entered on its grip, so the hold spans the whole draw.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: 0,
    relax: duration,
    end: duration,
  };
  const drawing: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan,
    side,
    span,
  });
  return pulled === null
    ? drawing
    : courseArmGoal({
        context,
        plan: drawing,
        side: pulled.side,
        span,
      });
}

/** What a draw over a carrier is planned from, as the grounded draw read it. */
interface IOver {
  /** The action's context, its carrier present. */
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>;
  /** The drawing hand. */
  side: AutoMovieHumanSide;
  /** The drawn object. */
  prop: string;
  /** The carrier and its affordances. */
  from: IAutoMovieMotionHumanDrawFromCarrier.IFrom;
  /** The draw line, world metres at the entry. */
  line: IAutoMovieVector3;
  /** The draw's length, seconds. */
  duration: number;
  /** The drawing wrist's transport, world at the entry. */
  transport: IAutoMovieMotionHumanPrehension.ITransport;
  /** The drawing elbow's hint, world at the entry. */
  bend: IAutoMovieVector3;
  /** The hand's use of the object. */
  use: IAutoMovieMotionPropHold["use"];
  /** The other hand's pull, when it pulls. */
  pulled: IPulled | null;
  /** The pulling wrist's transport, world at the entry. */
  retreat: IAutoMovieMotionHumanPrehension.ITransport | null;
}

/**
 * The draw over a carrier: a seated rider drawing from a carrier worn on its
 * body. The carrier action keeps the body; the draw claims only its hands and
 * arms, and their goals ride the bone the carrier is worn on, so the hands
 * follow the line as the body moves under the rider. The path is the grounded
 * draw's, carried into that bone's frame at the entry; the trunk's turn of a
 * long draw is the carrier's, so it is left out.
 */
function overCarrier(over: IOver): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    side,
    prop,
    from,
    line,
    duration,
    transport,
    bend,
    use,
    pulled,
    retreat,
  }: IOver = over;
  const worn: IAutoMovieMotionHumanProp["worn"] = context.prop(from.prop).prop
    .worn;
  const frame: AutoMovieHumanoidBone =
    worn !== undefined && worn.subject === context.subject ? worn.bone : "hips";
  const at: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([frame]),
  ).get(frame)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(at.worldRotation);
  const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(inverse, Vector3.subtract(p, at.worldPosition));
  const turn: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(Quaternion.multiply(inverse, q));
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  const part: IAutoMovieMotionHumanContactWindow["part"] = `${side}Hand`;
  const goal: (
    wrist: IAutoMovieMotionHumanPrehension.ITransport,
    elbow: IAutoMovieVector3,
    t: number,
  ) => IAutoMovieHumanLimbGoal = (
    wrist: IAutoMovieMotionHumanPrehension.ITransport,
    elbow: IAutoMovieVector3,
    t: number,
  ): IAutoMovieHumanLimbGoal => ({
    point: local(wrist.wrist(t)),
    rotation: turn(wrist.turn(t)),
    bend: local(elbow),
    on: frame,
  });
  return {
    duration,
    events: [
      { name: "unseated", share: 0 },
      { name: "drawn", share: 1 },
    ],
    contacts: [
      ...base.contacts,
      {
        part,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: prop, carries: false },
      },
      {
        part,
        kind: "grip",
        from: 1,
        to: 1,
        support: { kind: "prop", subject: prop },
      },
      ...(pulled === null
        ? []
        : [
            {
              part: pulled.part,
              kind: "grip" as const,
              from: 0,
              to: 1,
              support: { kind: "prop" as const, subject: from.prop },
            },
          ]),
    ],
    channels: [
      `${side}Arm`,
      `${side}Hand`,
      ...(pulled === null
        ? []
        : ([`${pulled.side}Arm`, `${pulled.side}Hand`] as const)),
    ],
    mounts: [{ prop, onto: from.prop, point: from.slide, from: 0 }],
    ...(pulled === null
      ? {}
      : { wears: [{ prop: from.prop, bone: pulled.bone, from: 1 }] }),
    drives: [
      {
        prop: from.prop,
        articulation: from.slider,
        from: 0,
        to: 1,
        travel: (seconds: number): number =>
          Vector3.length(line) *
          minimumJerk(Math.min(1, Math.max(0, seconds / duration))).s,
      },
    ],
    holds: [
      {
        side,
        prop,
        from: 1,
        fingers: HumanGrip.fingers(context.entry.pose, side),
        ...(use === undefined ? {} : { use }),
      },
    ],
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const posture: IAutoMovieMotionHumanPosture = base.posture(
        t,
        channels,
        resolution,
        projection,
      );
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${side}Arm`]: goal(transport, bend, t),
          ...(pulled === null || retreat === null
            ? {}
            : { [`${pulled.side}Arm`]: goal(retreat, pulled.bend, t) }),
        },
      };
    },
  };
}
/** The other hand's pull on a worn carrier, read from the entry. */
interface IPulled {
  /** The pulling hand. */
  side: AutoMovieHumanSide;

  /** Its contact part. */
  part: IAutoMovieMotionHumanContactWindow["part"];

  /** Its limb. */
  limb: AutoMovieHumanLimb;

  /** Its wrist at the start, world. */
  wrist: IAutoMovieRigidTransform;

  /** Its elbow's hint. */
  bend: IAutoMovieVector3;

  /** The bone the carrier hangs from, worn on again at the end. */
  bone: AutoMovieHumanoidBone;

  /** The trunk's twist, degrees toward the performer's left. */
  turn: number;
}

/**
 * The other hand's pull, when the draw asks for one: the hand already holds the
 * worn carrier at its throat, and the carrier hangs from a bone of this
 * performer.
 */
function pulling(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
  side: AutoMovieHumanSide,
): IPulled | null {
  const pull: IAutoMovieMotionHumanDrawFromCarrier.IPull | undefined =
    context.params.pull;
  if (pull === undefined) return null;
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const carrier: string = context.params.from.prop;
  if (context.entry.holds[other] !== carrier)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "pull.handle",
      value: pull.handle,
      feasible: {
        kind: "alternatives",
        values: [context.entry.holds[other] ?? "none"],
      },
      reason: `the ${other} hand does not hold ${carrier} to pull it back`,
      fix: `take ${carrier} at ${pull.handle} with the ${other} hand, a pickup of no lift, before the draw`,
    });
  const worn: IAutoMovieMotionHumanProp["worn"] =
    context.prop(carrier).prop.worn;
  if (worn === undefined || worn.subject !== context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "pull",
      value: carrier,
      reason: `${carrier} is not worn by ${context.subject}, so it has no place to hang again`,
      fix: "pull back a carrier the drawing performer wears",
    });
  const bone: AutoMovieHumanoidBone = `${other}Hand`;
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([bone]),
  ).get(bone)!;
  return {
    side: other,
    part: other === "left" ? "leftHand" : "rightHand",
    limb: other === "left" ? "leftArm" : "rightArm",
    wrist: { position: hand.worldPosition, rotation: hand.worldRotation },
    bend: AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      other,
    ),
    bone: worn.bone,
    turn: (side === "right" ? 1 : -1) * (pull.turn ?? 0),
  };
}

/**
 * The two roots of a point's slide back along a carrier's line that put it at
 * an arm's reach from a shoulder, metres; the reach holds between them.
 */
interface IRoots {
  /** The lesser root. */
  low: number;

  /** The greater root. */
  high: number;
}

/**
 * A pulled carrier's pivot: the frames its slide and turn about its hanger
 * give.
 */
interface IPivot {
  /**
   * The drawn object's world frame at a share of the pivot and a slider travel,
   * metres.
   */
  blade(share: number, travel: number): IAutoMovieRigidTransform;
  /**
   * A frame carried rigidly with the carrier by a share of the pivot: the
   * pulling hand's wrist.
   */
  carry(
    frame: IAutoMovieRigidTransform,
    share: number,
  ): IAutoMovieRigidTransform;
}

/**
 * The pulled carrier's pivot. A long blade leaves its scabbard low and in front
 * as the other hand draws the scabbard back: first along its own line, the frog
 * riding the belt, by the least slide that brings the drawn wrist within
 * `operate.REACH` of the drawing arm's length from its shoulder, as far as the
 * pulling hand can carry the throat within its own reach (both closed form: a
 * point `e` from a shoulder slid back by `r` along the line's unit direction
 * `d` lies `|e - r d|` from it, so the reach holds between the roots of `r^2 -
 * 2 r (d.e) + |e|^2 - R^2`); then, for what the slide leaves, by the least turn
 * about the slid hanger (the carrier's `belt` affordance, or its origin where
 * it declares none) toward the drawing shoulder: with `v` the drawn wrist and
 * `w` the shoulder from the hanger, the wrist turned by `t` lies `sqrt(|v|^2 +
 *
 * |w|^2 - 2|v||w|cos(phi - t))`from the shoulder,`phi` the angle between
 *
 * Them, so `t = phi - acos(c)`, `c` the law of cosines' cosine at the reach. A
 * wrist already within reach needs neither; one neither brings within it turns
 * straight at the shoulder and is refused by the reach check that follows.
 */
function pivoting(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
  from: IAutoMovieMotionHumanDrawFromCarrier.IFrom,
  side: AutoMovieHumanSide,
  pulled: IPulled,
  posture: IAutoMovieMotionHumanPosture,
  wristOf: (frame: IAutoMovieRigidTransform) => IAutoMovieRigidTransform,
  travel: number,
): IPivot {
  const reader: ReturnType<typeof context.prop> = context.prop(from.prop);
  const carrier: IAutoMovieRigidTransform = reader.frame(context.start);
  const hangerLocal: IAutoMovieAffordance | undefined = (
    reader.prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === "belt");
  const hanger: IAutoMovieVector3 =
    hangerLocal === undefined
      ? carrier.position
      : Vector3.add(
          carrier.position,
          Quaternion.rotateVector(
            carrier.rotation,
            hangerLocal.frame.translation,
          ),
        );
  // The object's frame on the slide at a travel, the carrier unturned.
  const slid: (distance: number) => IAutoMovieRigidTransform = (
    distance: number,
  ): IAutoMovieRigidTransform => {
    const posed: IAutoMovieMotionHumanProp.IPosed | undefined =
      reader.prop.articulate?.({ [from.slider]: distance });
    const slide: IAutoMovieAffordance | undefined = posed?.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === from.slide,
    );
    if (slide === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "from.slide",
        value: from.slide,
        reason: `${from.prop} poses no ${from.slide} on its ${from.slider}`,
        fix: "draw from a carrier that declares the slide its slider moves",
      });
    return {
      position: Vector3.add(
        carrier.position,
        Quaternion.rotateVector(carrier.rotation, slide.frame.translation),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(carrier.rotation, slide.frame.rotation),
      ),
    };
  };

  // The shoulders the two hands work from, and the reach of each arm.
  const shoulders: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(
      context.body,
      posture,
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        `${pulled.side}UpperArm`,
      ]),
    );
  const shoulder: IAutoMovieVector3 = shoulders.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const holding: IAutoMovieVector3 = shoulders.get(
    `${pulled.side}UpperArm`,
  )!.worldPosition;
  const reach: number =
    operate.REACH *
    (context.body.measure.upperArm + context.body.measure.forearm);
  const drawn: IAutoMovieVector3 = wristOf(slid(travel)).position;

  // First the slide back along the carrier's own line (the frog riding the
  // belt): the least that brings the drawn wrist within reach, as far as the
  // pulling hand can carry the throat. With `d` the line's unit direction, a
  // point `e` from a shoulder slid back by `r` lies `|e - r d|` from it, so
  // the reach is met between the roots of `r^2 - 2 r (d.e) + |e|^2 - R^2`.
  const along: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(slid(travel).position, slid(0).position),
  );
  const roots: (e: IAutoMovieVector3) => IRoots | null = (
    e: IAutoMovieVector3,
  ): IRoots | null => {
    const de: number = Vector3.dot(along, e);
    const disc: number = de * de - Vector3.dot(e, e) + reach * reach;
    if (!(disc >= 0)) return null;
    const root: number = Math.sqrt(disc);
    return { low: de - root, high: de + root };
  };
  const most: number = Math.max(
    0,
    roots(Vector3.subtract(pulled.wrist.position, holding))?.high ?? 0,
  );
  const least: IRoots | null = roots(Vector3.subtract(drawn, shoulder));
  const back: number = Math.min(
    most,
    least === null ? most : Math.max(0, least.low),
  );
  const slide: (share: number) => IAutoMovieVector3 = (
    share: number,
  ): IAutoMovieVector3 => Vector3.scale(along, -back * share);

  // Then the least turn about the slid hanger toward the drawing shoulder
  // that brings the drawn wrist the rest of the way within reach.
  const pivot: IAutoMovieVector3 = Vector3.add(hanger, slide(1));
  const v: IAutoMovieVector3 = Vector3.subtract(
    Vector3.add(drawn, slide(1)),
    pivot,
  );
  const w: IAutoMovieVector3 = Vector3.subtract(shoulder, pivot);
  const across: IAutoMovieVector3 = Vector3.cross(v, w);
  const lv: number = Vector3.length(v);
  const lw: number = Vector3.length(w);
  const angle: number = ((): number => {
    if (
      Vector3.distance(v, w) <= reach ||
      !(Vector3.length(across) > Number.EPSILON * lv * lw)
    )
      return 0;
    const phi: number = Math.acos(
      Math.min(1, Math.max(-1, Vector3.dot(v, w) / (lv * lw))),
    );
    const c: number = (lv * lv + lw * lw - reach * reach) / (2 * lv * lw);
    return c > 1 ? phi : phi - Math.acos(Math.max(-1, c));
  })();
  const axis: IAutoMovieVector3 =
    angle === 0 ? { x: 1, y: 0, z: 0 } : Vector3.normalize(across);
  const turn: (share: number) => IAutoMovieQuaternion = (
    share: number,
  ): IAutoMovieQuaternion =>
    Quaternion.fromAxisAngle(axis, (angle * share * 180) / Math.PI);
  // A frame carried with the carrier: slid back, then turned about the
  // slid hanger.
  const carry: (
    frame: IAutoMovieRigidTransform,
    share: number,
  ) => IAutoMovieRigidTransform = (
    frame: IAutoMovieRigidTransform,
    share: number,
  ): IAutoMovieRigidTransform => {
    const q: IAutoMovieQuaternion = turn(share);
    const moved: IAutoMovieVector3 = slide(share);
    const about: IAutoMovieVector3 = Vector3.add(hanger, moved);
    return {
      position: Vector3.add(
        about,
        Quaternion.rotateVector(
          q,
          Vector3.subtract(Vector3.add(frame.position, moved), about),
        ),
      ),
      rotation: Quaternion.normalize(Quaternion.multiply(q, frame.rotation)),
    };
  };
  return {
    carry,
    blade: (share: number, distance: number): IAutoMovieRigidTransform =>
      carry(slid(distance), share),
  };
}
/** The draw's samples the fitted hand is judged at, beyond the start. */
const JUDGED: number = 8;

/**
 * How far the fitted hand may leave its planned place on the guided grip,
 * metres: half of the 2 cm a scabbard is made wider than its blade (Wulflund,
 * https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html),
 * the play the grip has before it would bind the blade.
 */
const GRIP: number = 0.01;

/**
 * How far the gripped object's frame may sit from the seat when the draw
 * starts, metres: aperture placement's 15 mm seat tolerance.
 */
const SEATED: number = 0.015;
