import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
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

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { pickUp } from "./pickUp";
import { putDownTarget } from "./putDownTarget";

/**
 * Draw a gripped object out of its carrier along a straight line, the
 * inverse of aperture placement (`putDownAperture`): a sword drawn from its
 * scabbard. Register it with `HumanChain.extend({ drawFromCarrier })` or by
 * name, and with the performance.
 *
 * The hand has gripped the seated object (a pickup with no lift). The
 * object then rides the carrier's slide socket while the action drives the
 * carrier's slider from the seat to the opening on one minimum-jerk movement,
 * timed as a loaded carry (`HumanPrehension.carry`), so the carrier keeps it
 * on its line as a scabbard guides its blade, the parent-constraint handoff
 * of digital prop work (Autodesk Maya, Parent constraint,
 * https://help.autodesk.com/cloudhelp/2022/ENU/Maya-CharacterAnimation/files/GUID-F6785389-FAC1-429F-8783-B06B0B8AF1A8.htm).
 * The hand follows on its grip, its wrist placed through the grip's rigid
 * offset read from the displayed frames at the start, and takes the object
 * over at the opening. The rest of the body
 * holds the posture the action was entered in, so the carrier, worn or
 * placed, holds still under the line. Adult insertion trials separate the
 * transport to an opening from the aligned insertion (Ossmy et al. 2020,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/); this is the aligned
 * part run backward. The fitted hand is judged against its planned place on
 * the grip at plan time, and a draw it cannot follow is refused rather than
 * shown with the hand off the hilt. Events: `unseated` at the start and `drawn` at the end. A cut to
 * `stand` inside the draw, or to `walk` at its end, keeps the grip. Over a
 * carrier (a seated rider's draw), the draw claims only its hands and arms,
 * their goals riding the bone the carrier is worn on so they follow the line
 * as the body moves; there the fit is not judged against the line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry state, the path, the timing, the held body, the events and the cut.
 * @evidence contracts/development/design.md#principled-representation The object rides the carrier's own slide socket on the authored line, so the displayed object follows the line exactly; the hand follows it within `GRIP` and owns it from the opening.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One law beside `putDownAperture`, reading the same two affordances in the same roles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object kind is special-cased; the line and its guide are the carrier's.
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
 * @throws {HumanRefusal} On `prop` when the hand does not hold it or the drawn wrist lies beyond the arm, on `from` when the carrier is not named, on `from.aperture` when the two affordances are not a straight aligned line or the fitted hand leaves its planned place on the grip by more than `GRIP`, and on `from.point` when the object is not seated there.
 *
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
  const back: number = pulled?.back ?? 0;
  const opened: IAutoMovieRigidTransform = wrist(opening);
  const end: IAutoMovieRigidTransform = {
    ...opened,
    position: Vector3.subtract(opened.position, Vector3.scale(direction, back)),
  };
  // The drawn wrist is reached by the body as the draw leaves it: a long
  // draw's trunk has turned away from the drawing side by then.
  const turnedAway: IAutoMovieMotionHumanPosture =
    pulled === null || context.carrier !== undefined
      ? context.entry.posture
      : StrikingBlade.turned(context.entry.posture, pulled.turn);
  pickUp.reachable(context, side, end.position, turnedAway);

  // One loaded, aligned movement along the line; a pulled carrier retreats
  // along it on the same clock, so the hands part by the line's length.
  const held: IAutoMovieMotionHumanPosture = context.entry.posture;
  const carried: number = HumanPrehension.carry(
    Math.max(Vector3.length(line) - back, back),
  );
  const transport: IAutoMovieMotionHumanPrehension.ITransport =
    HumanPrehension.transport(
      start.position,
      end.position,
      direction,
      0,
      { from: start.rotation, to: end.rotation },
      carried,
    );
  const retreat: IAutoMovieMotionHumanPrehension.ITransport | null =
    pulled === null
      ? null
      : HumanPrehension.transport(
          pulled.wrist.position,
          Vector3.subtract(
            pulled.wrist.position,
            Vector3.scale(direction, back),
          ),
          Vector3.scale(direction, -1),
          0,
          { from: pulled.wrist.rotation, to: pulled.wrist.rotation },
          carried,
        );
  if (pulled !== null)
    pickUp.reachable(
      context,
      pulled.side,
      Vector3.subtract(pulled.wrist.position, Vector3.scale(direction, back)),
      turnedAway,
    );
  const duration: number = transport.duration;
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    held,
    side,
  );
  const reference: IAutoMovieHumanLimbReference = resolveHumanPosture.reference(
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
      // The pulling hand carries the carrier back and lets it hang again.
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
    body: context.body,
    plan,
    side,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    span,
  });
  return pulled === null
    ? drawing
    : courseArmGoal({
        body: context.body,
        plan: drawing,
        side: pulled.side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, pulled.side),
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
 * The draw over a carrier: a seated rider drawing from a carrier worn on
 * its body. The carrier action keeps the body; the draw claims only its
 * hands and arms, and their goals ride the bone the carrier is worn on, so
 * the hands follow the line as the body moves under the rider. The path is
 * the grounded draw's, carried into that bone's frame at the entry; the
 * trunk's turn of a long draw is the carrier's, so it is left out.
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

  /** How far the carrier retreats along the line, metres. */
  back: number;

  /** The trunk's twist, degrees toward the performer's left. */
  turn: number;
}

/**
 * The other hand's pull, when the draw asks for one: the hand already holds
 * the worn carrier at its throat, the carrier hangs from a bone of this
 * performer, and the retreat is shorter than the line.
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
  if (!(pull.back > 0 && Number.isFinite(pull.back)))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "pull.back",
      value: pull.back,
      reason: "the carrier retreats a positive finite length",
      fix: "give the retreat in metres",
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
    back: pull.back,
    turn: (side === "right" ? 1 : -1) * (pull.turn ?? 0),
  };
}

/** The draw's samples the fitted hand is judged at, beyond the start. */
const JUDGED: number = 8;

/** How far the fitted hand may leave its planned place on the guided grip, metres: half of the 2 cm a scabbard is made wider than its blade (Wulflund, https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html), the play the grip has before it would bind the blade. */
const GRIP: number = 0.01;

/** How far the gripped object's frame may sit from the seat when the draw starts, metres: aperture placement's 15 mm seat tolerance. */
const SEATED: number = 0.015;
