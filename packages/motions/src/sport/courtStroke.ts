import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { CourtStrokeProfiles } from "./CourtStrokeProfiles";
import { courtRacketWrist } from "./courtRacketWrist";
import { courtStrokeFeet } from "./courtStrokeFeet";

/** The record of `IContext`'s site. */
type IContext = {
  side?: AutoMovieHumanSide;
  manner?: IAutoMovieMotionManner;
};

/** Which registered action inputs the court stroke reads. */
type Context = IAutoMovieMotionHumanActionContext<IContext>;

/** Optional elected working point and held racket for a stroke. */
interface IOptions {
  /** Centre of the intended hand contact or racket face, world metres. */
  readonly contact?: IAutoMovieVector3;
  /** Subject held in the hitting hand from a previous pickup. */
  readonly implement?: string;
}

/** Reference stature for the profile's film-time values, metres. */
const REFERENCE_STATURE: number = 1.75;

/** Half of the provisional racket contact window, in film seconds. */
const RACKET_CONTACT_HALF: number = 0.018;
/** The alternatives of `NominalPosturePhaseAngleAxis`'s site. */
type NominalPosturePhaseAngleAxis = 0 | 1 | 2;

/**
 * Plan the court athlete from entry stance through support, load, strike and
 * recovery. The planted foot targets stay fixed. A jump carries the feet on a
 * ballistic arc while the pelvis bends into landing over the new support. A
 * named held racket uses its actual face and longitudinal axis in the fitted
 * hand frame; one ball trajectory can use the exposed `stroke` event.
 *
 * @param context The body, actual entry stance, handedness and manner.
 * @param kind The sport-specific support and stroke profile.
 * @param options The optional explicit contact and held implement.
 * @returns The motion, support windows and retained racket grip.
 * @throws {HumanRefusal} When a named implement is unavailable to the hand or a
 *   constrained arm path cannot be fitted.
 */
export function courtStroke(
  context: Context,
  kind: CourtStrokeProfiles.Kind,
  options: IOptions,
): IAutoMovieMotionHumanActionPlan {
  const body: Context["body"] = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const profile: CourtStrokeProfiles.IProfile =
    CourtStrokeProfiles.VALUES[kind];
  const side: AutoMovieHumanSide = context.params.side ?? "right";
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const handed: number = side === "left" ? 1 : -1;
  const size: number = body.measure.stature;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const scale: number = Math.sqrt(size / REFERENCE_STATURE);
  const manner: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
    context,
    context.params.manner,
  );
  const ready: number = profile.beats[0] * scale;
  const impact: number = ready + profile.beats[1] * scale;
  const recovery: number = profile.beats[2] * scale;
  const end: number = impact + recovery;
  const halfFlight: number = (profile.air * scale) / 2;
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.of(end, [
      { name: "stepStart", seconds: ready * 0.18 },
      { name: "plant", seconds: ready * 0.86 },
      { name: "ready", seconds: ready },
      { name: "strokeStart", seconds: ready },
      { name: "stroke", seconds: impact },
      ...(halfFlight > 0
        ? [
            { name: "takeoff", seconds: impact - halfFlight },
            { name: "landing", seconds: impact + halfFlight },
          ]
        : []),
      { name: "strokeEnd", seconds: impact + recovery * 0.56 },
      { name: "relax", seconds: impact + recovery * 0.67 },
    ]),
    manner,
    { holds: [], fixed: halfFlight > 0 ? ["takeoff", "stroke"] : [] },
  );
  const duration: number = clock.duration;
  const frame: ReturnType<typeof HumanFrame.prepare> = HumanFrame.prepare({
    origin: entry.root,
    yaw: entry.yaw,
  });
  const local: (
    offset: CourtStrokeProfiles.Offset,
    metre: number,
  ) => IAutoMovieVector3 = (
    [x, y, z]: CourtStrokeProfiles.Offset,
    metre: number,
  ): IAutoMovieVector3 =>
    frame.direction({ x: handed * x * metre, y: y * metre, z: z * metre });
  const step: IAutoMovieVector3 = local(
    [profile.step[0], 0, profile.step[1]],
    size * manner.extent,
  );
  const moves: boolean = Vector3.length(step) > 0;
  const lead: AutoMovieHumanSide = profile.sameFoot ? side : other;
  const footprint = (
    foot: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const from: IAutoMovieMotionHumanFoot.IPlacement = context.entry.feet[foot];
    return moves && foot === lead
      ? { ...from, ankle: Vector3.add(from.ankle, step) }
      : from;
  };
  const landings: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  > = {
    left: footprint("left"),
    right: footprint("right"),
  };
  const takeoff: number = halfFlight > 0 ? clock.at("takeoff") : 0;
  const landing: number = halfFlight > 0 ? clock.at("landing") : 0;
  const airborne: (s: number) => boolean = (s: number): boolean =>
    s > takeoff && s < landing;
  const lift: (s: number) => number = (s: number): number =>
    airborne(s)
      ? AutoMovieGravity.STANDARD * 0.5 * (s - takeoff) * (landing - s)
      : 0;
  const extent: (s: number) => number = AutoMovieMotionClock.prepareEnvelope(
    clock,
    ["start", "ready"],
    ["relax", "end"],
  );
  const transfer: (s: number) => number = AutoMovieMotionClock.prepareEnvelope(
    clock,
    ["stepStart", "stroke"],
    ["relax", "end"],
  );
  const compression: (s: number) => number =
    AutoMovieMotionClock.prepareEnvelope(
      clock,
      ["start", "ready"],
      [
        halfFlight > 0 ? "ready" : "strokeStart",
        halfFlight > 0 ? "takeoff" : "strokeEnd",
      ],
    );
  const turn: (s: number) => number = (s: number): number =>
    clock.progress("ready", "stroke", s);
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: duration,
  };
  const nominalPosture = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ): IAutoMovieMotionHumanPosture => {
    const weight: number = extent(s);
    const t: number = turn(s);
    const phaseAngle = (axis: NominalPosturePhaseAngleAxis): number =>
      weight *
      (profile.chamber[axis] + (profile.hit[axis] - profile.chamber[axis]) * t);
    const horizontal: IAutoMovieVector3 = Vector3.scale(
      step,
      0.5 * transfer(s),
    );
    const absorb: number =
      halfFlight > 0
        ? clock.envelope(["landing", "relax"], ["relax", "end"], s) * 0.55
        : 0;
    return StrikingBlade.turned(
      {
        ...posture,
        root: Vector3.add(posture.root, {
          ...horizontal,
          y: lift(s) - size * profile.sink * (compression(s) + absorb),
        }),
        yaw: posture.yaw + handed * phaseAngle(0),
        pitch: posture.pitch + phaseAngle(2),
      },
      handed * phaseAngle(1),
    );
  };
  const touchdown: IAutoMovieMotionHumanPosture | undefined =
    halfFlight > 0 ? nominalPosture(entry, landing) : undefined;
  const drop: number =
    touchdown !== undefined
      ? touchdown.root.y -
        lowerHumanPosture(body, {
          ...touchdown,
          limbs: {
            leftLeg: AutoMovieMotionHumanLeg.goal(
              body,
              touchdown,
              "left",
              landings.left,
              true,
            ),
            rightLeg: AutoMovieMotionHumanLeg.goal(
              body,
              touchdown,
              "right",
              landings.right,
              true,
            ),
          },
        }).root.y
      : 0;
  const settle: ((s: number) => number) | undefined =
    drop > 0
      ? AutoMovieMotionClock.prepareEnvelope(
          clock,
          ["stroke", "landing"],
          ["relax", "end"],
        )
      : undefined;
  const postureAt = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ): IAutoMovieMotionHumanPosture => {
    const at: IAutoMovieMotionHumanPosture = nominalPosture(posture, s);
    if (settle === undefined) return at;

    // Bring the hips to a reachable height by touchdown. Both sole paths
    // retain their original anchors and meet them at the landing event.
    return { ...at, root: { ...at.root, y: at.root.y - drop * settle(s) } };
  };
  const { primitives: feet, contacts }: ReturnType<typeof courtStrokeFeet> =
    courtStrokeFeet({
      body,
      stance: context.entry.feet,
      landings,
      stepFoot: moves ? lead : undefined,
      clock,
      clearance: 0.035 * size,
      flight: { enabled: halfFlight > 0, takeoff, landing, airborne, lift },
    });
  const primitives: IAutoMovieMotionHumanPrimitive[] = [
    { channels: ["root", "trunk"], from: 0, to: duration, write: postureAt },
    ...feet,
  ];

  const face: IAutoMovieVector3 = Vector3.normalize(local(profile.face, 1));
  const rawAxis: IAutoMovieVector3 = local(profile.axis, 1);
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(rawAxis, Vector3.scale(face, Vector3.dot(rawAxis, face))),
  );
  const drive: IAutoMovieVector3 = local(profile.drive, arm * manner.extent);
  const strike: number = clock.at("stroke");
  const straight = (s: number): IAutoMovieVector3 =>
    Vector3.scale(
      drive,
      AutoMovieMotionClock.through(clock, ["ready", "stroke", "strokeEnd"], s) -
        1,
    );
  const dominant: IAutoMovieVector3 = local(profile.reach, arm);
  const finish: IAutoMovieVector3 | undefined =
    profile.finish === undefined
      ? undefined
      : Vector3.subtract(
          local(profile.finish, arm),
          Vector3.add(dominant, straight(clock.at("strokeEnd"))),
        );
  const recover: (s: number) => number = (s: number): number =>
    finish === undefined ? 0 : clock.progress("stroke", "strokeEnd", s);
  const partner: IAutoMovieVector3 = local(profile.balance, arm);
  const middle: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(dominant, partner),
    0.5,
  );
  const centre = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    AutoMovieMotionHumanPlaced.shoulders(body, posture);
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool | undefined =
    options.implement === undefined
      ? undefined
      : courtRacketWrist.read(context, side, options.implement);
  const racket: ReturnType<typeof courtRacketWrist> | undefined =
    tool === undefined
      ? undefined
      : courtRacketWrist(
          context,
          tool,
          axis,
          face,
          local([0.4, -0.5, -0.2], 1),
        );
  const aim: (s: number) => number = AutoMovieMotionClock.prepareEnvelope(
    clock,
    ["start", "stroke"],
    ["stroke", "relax"],
  );
  const stow: (s: number) => number = AutoMovieMotionClock.prepare(
    clock,
    "stroke",
    "relax",
  ).progress;
  const zero: IAutoMovieVector3 = Vector3.create(0, 0, 0);

  // Convert the proposed wrist line to the actual racket face line using
  // the same rigid offsets the arm solver inverts for the held implement.
  const reach: IAutoMovieVector3 =
    racket === undefined ? dominant : Vector3.add(dominant, racket.faceOffset);
  const nominal: IAutoMovieVector3 = Vector3.add(
    centre(postureAt(entry, strike)),
    profile.paired === true ? middle : reach,
  );
  const correction: IAutoMovieVector3 =
    options.contact === undefined
      ? zero
      : Vector3.subtract(options.contact, nominal);
  const handPoint = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
    place: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const through: IAutoMovieVector3 = straight(s);
    const eased: number = recover(s);

    // The strike keeps its carried speed at contact. The free follow-through
    // curves towards a shoulder-relative finish as the world mark fades.
    const path: IAutoMovieVector3 =
      finish === undefined
        ? through
        : Vector3.add(through, Vector3.scale(finish, eased));
    return Vector3.add(
      Vector3.add(centre(posture), place),
      Vector3.add(path, Vector3.scale(correction, extent(s) * (1 - eased))),
    );
  };
  const balanceHand = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
    const shoulder: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.joint(
      body,
      posture,
      `${other}UpperArm`,
    );
    const own: ReturnType<typeof HumanFrame.prepare> = HumanFrame.prepare({
      origin: shoulder,
      yaw: posture.yaw,
    });
    const [out, up, forward]: CourtStrokeProfiles.Offset = profile.balance;
    const opened: number = turn(s);

    // The free hand opens on its own side of the rotating shoulder. A
    // reversed copy of the striking path would pull it across the chest.
    return {
      point: own.point({
        x: handed * out * arm * (0.72 + 0.28 * opened),
        y: up * arm,
        z: forward * arm * (1 - 0.4 * opened),
      }),
      facing: own.direction({ x: -handed * 0.65, y: 0.76, z: 0 }),
      forward: own.direction({ x: 0, y: 0.2, z: 1 }),
    };
  };

  for (const hand of [side, other]) {
    const rest: ReturnType<typeof AutoMovieMotionHumanArm.angles> =
      AutoMovieMotionHumanArm.angles(context.entry.pose, hand);
    const strikes: boolean = hand === side || profile.paired === true;
    const place: IAutoMovieVector3 = hand === side ? dominant : partner;
    if (hand === side && racket !== undefined) {
      // The tool stays in the hand throughout. Only the face needs a
      // precise world site at impact. The arm planner connects that narrow
      // window to the available entry and recovery configurations.
      const half: number = Math.min(
        RACKET_CONTACT_HALF,
        (strike - span.ready) / 2,
        (span.relax - strike) / 2,
      );
      const contactStart: number = strike - half;
      const contactEnd: number = strike + half;
      const gripClock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
        duration,
        [
          { name: "contactStart", seconds: contactStart },
          { name: "contactEnd", seconds: contactEnd },
        ],
      );
      primitives.push(
        AutoMovieMotionHumanArm.carried({
          body,
          side: hand,
          from: 0,
          to: duration,
          rest,
          weight: AutoMovieMotionClock.prepareEnvelope(
            gripClock,
            ["start", "contactStart"],
            ["contactEnd", "end"],
          ),
          span: { ...span, ready: contactStart, relax: contactEnd },
          goal: (
            posture: IAutoMovieMotionHumanPosture,
            s: number,
          ): IAutoMovieHumanLimbGoal =>
            racket.goal(posture, handPoint(posture, s, place), aim(s), stow(s)),
        }),
      );
    } else
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side: hand,
          from: 0,
          to: duration,
          rest,
          weight: extent,
          span,
          place: strikes
            ? (
                posture: IAutoMovieMotionHumanPosture,
                s: number,
              ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
                point: handPoint(posture, s, place),
                facing: face,
                forward: axis,
              })
            : balanceHand,
        }),
      );
  }

  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      primitives,
      contact: "stroke",
    });
  return tool === undefined
    ? plan
    : {
        ...plan,
        contacts: [...plan.contacts, ...StrikingHeld.grips(tool)],
        holds: StrikingHeld.holds(context, tool),
      };
}
