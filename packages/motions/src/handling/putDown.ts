import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmReach } from "../compose/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanCarriedHand } from "./HumanCarriedHand";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { pickUp } from "./pickUp";
import { putDownRestingDemand } from "./putDownRestingDemand";
import { putDownTarget } from "./putDownTarget";
import { putDownTravel } from "./putDownTravel";

/**
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names where
 * the prop's origin goes (and optionally its heading), and the hand is placed
 * wherever holds the prop there, by the rigid hand-to-prop offset the grip has
 * kept since it closed (the prop's displayed frame and the hand's at the start,
 * so whatever the grasp was, the same grasp lays the prop down). With `on`, the
 * prop is put on a bone of the performer's own body instead, at its frame on
 * that bone as the body stands at the start, and is worn there from `placed`
 * (`IHumanActionPlan.wears`). With `onto`, it is set on another prop's socket,
 * its own socket laid on it, and rides that socket from `placed` as the other
 * prop's articulations pose it (`IHumanActionPlan.mounts`): an arrow nocked on
 * a bow's string, drawn back with it. A free placement uses the prop's declared
 * rest rotation turned to the requested heading, or the whole `rotation` the
 * author declares, such as a card laid face up. The arm keeps its entry
 * configuration as its reference while the rest of the body keeps its entry
 * posture.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
 * 0.05 m straight down so the prop lands rather than slides (provisional
 * setback); the release, the fingers opening flat over 0.2 s (provisional) as
 * the grip ends, which leaves the prop where it was placed; and the hand's
 * return to where the arm hangs, rising the same 0.05 m first, over another
 * movement time.
 *
 * Events: `placed` transfers the prop from the grip to its resting frame.
 * `release` marks the end of finger opening. A placing frame beyond the arm's
 * reach is refused, as is a placement without a destination. A rigid receiver
 * with an authored motion track may translate horizontally at constant speed
 * during a direct placement. The hand arrives with the receiver's velocity,
 * opens while tracking it, and eases away afterward.
 */
export namespace putDown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "putDown";

  /**
   * May be performed over a carrier, as a seated rider holsters a revolver: it
   * then claims only the working arm and its hand (`HumanCarriedHand`).
   */
  export const overlay: boolean = true;

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["release", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["release", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /** The final vertical stretch of the placing transport, metres; provisional. */
  export const SETBACK: number = 0.05;

  /** Time the fingers take to open at the release, seconds; provisional. */
  export const OPEN: number = 0.2;

  /**
   * The turns of a free placement's heading tried, degrees from the prop's
   * heading as it is held: the whole way round in the grasp search's steps of
   * 15 (`HumanGrasp.TURNS`), since a prop laid with no authored heading rests
   * alike at any.
   */
  export const HEADINGS: readonly number[] = Array.from(
    { length: 24 },
    (_: unknown, i: number): number => -165 + 15 * i,
  );

  /**
   * Plan a put down.
   *
   * @param context The action's context.
   * @param aperture Offset from the seat to the opening, world metres, when the
   *   registered aperture law shares this planner.
   * @param route Optional waypoint offsets in metres from the seating frame.
   * @returns The plan.
   * @throws {HumanRefusal} When no destination is named, the placing wrist lies
   *   beyond the arm's reach, or a socket placement's grasp cannot lay its
   *   socket on the receiver.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
    aperture?: IAutoMovieVector3,
    route?: putDownTravel.IRoute,
  ): IAutoMovieMotionHumanActionPlan {
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const body: IAutoMovieMotionHumanBody = context.body;
    const held: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The hand-to-prop offset the grip keeps, from the displayed frames now.
    const hand: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    ).get(`${side}Hand`)!;
    const prop: IAutoMovieRigidTransform = context
      .prop(context.params.prop)
      .frame(context.start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const offset: IAutoMovieRigidTransform = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, hand.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };

    // The prop's resting frame, then the hand that holds it there.
    const heading = (q: IAutoMovieQuaternion): number => {
      const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (Math.atan2(f.x, f.z) * 180) / Math.PI;
    };
    // Turn the prop's declared rest attitude to the requested heading.
    const authored: IAutoMovieQuaternion = context.prop(context.params.prop)
      .prop.frame.rotation;
    const declaredHeading: number = heading(authored);
    const unhold: IAutoMovieQuaternion = Quaternion.inverse(offset.rotation);
    const holding: (yaw: number) => IAutoMovieMotionHumanHand.IWrist = (
      yaw: number,
    ): IAutoMovieMotionHumanHand.IWrist => {
      const rest: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw - declaredHeading),
          authored,
        ),
      );
      const r: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(rest, unhold),
      );
      return {
        point: Vector3.subtract(
          context.params.to!,
          Quaternion.rotateVector(r, offset.position),
        ),
        rotation: r,
      };
    };

    // An authored heading is kept; otherwise the prop may rest at whichever
    // heading the arm can lay it down at exactly.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );
    const on = context.params.on;
    const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
      context.params.onto;
    const wearing: IAutoMovieRigidTransform | undefined = putDownTarget.of(
      context,
      context.entry.pose,
    );
    if (wearing === undefined && context.params.to === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: "absent",
        feasible: { kind: "alternatives", values: ["at", "on", "onto"] },
        reason:
          "a put down names where the prop goes: a place, a bone or another prop's socket",
        fix: "give `at`, a world point, `on`, a bone of the performer and the prop's frame on it, or `onto`, another prop's socket",
      });
    // A declared resting attitude is laid exactly, through the same grip.
    const attitude: IAutoMovieQuaternion | undefined =
      wearing === undefined ? context.params.rotation : undefined;
    const chosen: IAutoMovieMotionHumanHand.IWrist =
      attitude !== undefined
        ? ((): IAutoMovieMotionHumanHand.IWrist => {
            const asked: IAutoMovieQuaternion = Quaternion.normalize(
              Quaternion.multiply(Quaternion.normalize(attitude), unhold),
            );
            const at: (r: IAutoMovieQuaternion) => IAutoMovieVector3 = (
              r: IAutoMovieQuaternion,
            ): IAutoMovieVector3 =>
              Vector3.subtract(
                context.params.to!,
                Quaternion.rotateVector(r, offset.position),
              );
            // An authored resting attitude with no authored heading rests
            // alike at any heading about the vertical (a card face up): the
            // hand takes the heading nearest the asked one at which the arm
            // meets the attitude, or the placement is refused
            // (`AutoMovieMotionHumanArmReach`). An authored heading is laid
            // exactly.
            const r: IAutoMovieQuaternion =
              context.params.yaw !== undefined
                ? asked
                : AutoMovieMotionHumanArmReach.attitude({
                    body,
                    posture: held,
                    side,
                    bend: AutoMovieMotionHumanBend.hang(body, held, side),
                    requested: asked,
                    axis: { x: 0, y: 1, z: 0 },
                    wrist: at,
                    name: "rotation",
                  }).rotation;
            return { point: at(r), rotation: r };
          })()
        : wearing !== undefined
          ? ((): IAutoMovieMotionHumanHand.IWrist => {
              const r: IAutoMovieQuaternion = Quaternion.normalize(
                Quaternion.multiply(
                  wearing.rotation,
                  Quaternion.inverse(offset.rotation),
                ),
              );
              return {
                point: Vector3.subtract(
                  wearing.position,
                  Quaternion.rotateVector(r, offset.position),
                ),
                rotation: r,
              };
            })()
          : context.params.yaw === undefined
            ? HumanGrasp.reachable(
                body,
                held,
                side,
                bend,
                (turn: number): IAutoMovieMotionHumanHand.IWrist =>
                  holding(heading(prop.rotation) + turn),
                undefined,
                undefined,
                // The heading is free the whole way round, so every one is
                // the arm's to choose from, nearest the prop's own first.
                HEADINGS,
                undefined,
                // A turn that puts the wrist beyond the arm, which the reach
                // below refuses, is tried only when every turn does.
                pickUp.reaches(context, side),
              ).wrist
            : holding(context.params.yaw);

    // The arm keeps the configuration it carried the prop in.
    const reference: IAutoMovieHumanLimbReference =
      resolveHumanPosture.reference(
        context.entry.pose,
        side === "left" ? "leftArm" : "rightArm",
      );
    const rotation: IAutoMovieQuaternion = chosen.rotation;
    const place: IAutoMovieVector3 = chosen.point;

    // A socket placement is a contact task: the source socket must remain
    // on the receiver when the wrist cannot retain the whole attitude.
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool | undefined =
      onto?.via === undefined
        ? undefined
        : StrikingHeld.of(context, side, context.params.prop, {
            tip: onto.via,
          });
    const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
      point: Vector3.add(
        place,
        Quaternion.rotateVector(
          rotation,
          HumanHand.offset(body, side, "grip").point,
        ),
      ),
      rotation,
    };
    const constraint: IAutoMovieHumanLimbGoal | undefined =
      tool === undefined
        ? undefined
        : StrikingHeld.goal(context, tool, frame, 0, bend);
    // An authored resting attitude (a card laid face up) is the placement's
    // outcome, so the hand holds it as hard task limits over the placement
    // and the opening: the prop's origin and a point a hand's length along
    // its up axis, each in the hand's frame, kept within the held-tool bound
    // (`StrikingRoll.MISS`) of where the asked attitude puts them. A planned
    // hold treats a bare attitude as an objective it may trade away; a task
    // limit it may not.
    const authoredLimits: IAutoMovieHumanEffectorPointLimit[] | undefined =
      attitude === undefined || constraint !== undefined
        ? undefined
        : [
            offset.position,
            Vector3.add(
              offset.position,
              Quaternion.rotateVector(offset.rotation, {
                x: 0,
                y: body.measure.hand,
                z: 0,
              }),
            ),
          ].map(
            (
              contact: IAutoMovieVector3,
            ): IAutoMovieHumanEffectorPointLimit => ({
              contact,
              bound: StrikingRoll.MISS,
            }),
          );
    const mouth: IAutoMovieVector3 | undefined =
      aperture === undefined ? undefined : Vector3.add(place, aperture);
    if (aperture !== undefined) {
      const targets: readonly IAutoMovieVector3[] =
        route === undefined
          ? [aperture]
          : [...route.approach, aperture, ...route.insertion];
      for (const target of targets) {
        pickUp.reachable(context, side, Vector3.add(place, target));
        if (tool !== undefined)
          StrikingRoll.reachable(
            context,
            tool,
            { ...frame, point: Vector3.add(frame.point, target) },
            0,
            held,
            "take the prop by a grasp that aligns with the aperture",
          );
      }
    }

    // Timing: carry down, open, return.
    const hanging: IAutoMovieMotionHumanPosture["limbs"] = { ...held.limbs };
    delete hanging[side === "left" ? "leftArm" : "rightArm"];
    const handBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const home: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        { ...held, limbs: hanging },
        undefined,
        {},
        undefined,
        handBones,
      ).pose,
      undefined,
      handBones,
    ).get(`${side}Hand`)!;
    const travel: putDownTravel.ITravel = putDownTravel(
      context,
      { position: hand.worldPosition, rotation: hand.worldRotation },
      { position: place, rotation },
      { position: home.worldPosition, rotation: home.worldRotation },
      SETBACK,
      mouth,
      route,
    );
    const down: number = travel.carry.duration;
    const back: number = travel.retreat.duration;
    const duration: number = down + OPEN + back;
    // Over a carrier, a receiver this performer carries (a holster on the
    // hips of a rider rounding a marker) is still in the bone it rides, and
    // the hand's goal rides that bone (`HumanCarriedHand.over`), so its
    // world track is not the placement's: only a receiver in the world must
    // keep a constant-velocity track.
    const ridden: boolean =
      context.carrier !== undefined &&
      onto !== undefined &&
      HumanCarriedHand.riding(context, onto.prop) !== undefined;
    const displacement: ((seconds: number) => IAutoMovieVector3) | undefined =
      ridden
        ? undefined
        : putDownTarget.translation(context, duration, aperture);
    if (tool !== undefined && displacement === undefined)
      StrikingRoll.reachable(
        context,
        tool,
        frame,
        0,
        held,
        "take the prop by a grasp that places its socket on the receiver",
      );
    pickUp.reachable(
      context,
      side,
      displacement === undefined
        ? place
        : Vector3.add(place, displacement(down)),
    );
    if (displacement !== undefined)
      pickUp.reachable(
        context,
        side,
        Vector3.add(place, displacement(down + OPEN)),
      );
    const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const flat: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "flat",
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "relaxed",
    );
    const openAt: ReturnType<typeof HumanPrehension.prepareShape> =
      HumanPrehension.prepareShape(
        { entry: closed, open: flat, closed: flat },
        1,
      );
    const returnShape: ReturnType<typeof HumanPrehension.prepareShape> =
      HumanPrehension.prepareShape(
        { entry: flat, open: relaxed, closed: relaxed },
        1,
      );
    const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
    const part: IAutoMovieMotionHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        ...(travel.aperture === undefined
          ? []
          : [{ name: "aperture", share: travel.aperture / duration }]),
        { name: "placed", share: down / duration },
        { name: "release", share: (down + OPEN) / duration },
      ],
      contacts: [
        // Each foot keeps the contact the entry has it in, on the frame it
        // bears on: a seated body's hanging foot is planted on no floor.
        ...context.entry.supports
          .filter(
            (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
              s.part === "leftFoot" || s.part === "rightFoot",
          )
          .map(
            (
              s: IAutoMovieMotionHumanEntryState.ISupport,
            ): IAutoMovieMotionHumanContactWindow => ({
              part: s.part,
              kind: "plant",
              from: 0,
              to: 1,
              support: s.support,
            }),
          ),
        {
          part,
          kind: "grip",
          from: 0,
          to: down / duration,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      ...(onto === undefined
        ? {}
        : {
            mounts: [
              {
                prop: context.params.prop,
                onto: onto.prop,
                point: onto.point,
                from: down / duration,
                // Set exactly on its seat, its own `via` socket on the
                // receiving one; the hand brings it there.
                offset: putDownTarget.seated(context),
              },
            ],
          }),
      ...(on === undefined || onto !== undefined
        ? {}
        : {
            wears: [
              {
                prop: context.params.prop,
                bone: on.bone,
                from: down / duration,
              },
            ],
          }),
      contact: down,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let wrist: IAutoMovieVector3;
        let turned: IAutoMovieQuaternion;
        let digits: IAutoMovieMotionHumanPosture["joints"];
        if (t <= down) {
          wrist = travel.carry.wrist(t);
          turned = travel.carry.turn(t);
          digits = closed;
        } else if (t <= down + OPEN) {
          wrist = place;
          turned = rotation;
          digits = openAt((t - down) / OPEN);
        } else {
          const r: number = t - down - OPEN;
          wrist = travel.retreat.wrist(back - r);
          turned = travel.retreat.turn(back - r);
          digits = returnShape(r / back);
        }
        // Ease the receiver's displacement in and out while matching its velocity through opening.
        if (displacement !== undefined) {
          const follow: number =
            t <= down
              ? AutoMovieMotionInterval.progress(0, down, t)
              : t <= down + OPEN
                ? 1
                : 1 -
                  AutoMovieMotionInterval.progress(
                    duration - back,
                    duration,
                    t,
                  );
          wrist = Vector3.add(wrist, Vector3.scale(displacement(t), follow));
        }
        return {
          ...held,
          joints: { ...held.joints, ...digits },
          limbs: {
            ...held.limbs,
            [limb]: {
              point: wrist,
              rotation: turned,
              bend,
              reference,
              ...(constraint === undefined ||
              (displacement === undefined && t > down)
                ? authoredLimits === undefined || t < down || t > down + OPEN
                  ? {}
                  : { limits: authoredLimits }
                : {
                    contact: constraint.contact,
                    limits: constraint.limits,
                  }),
              ...(t <= down + (displacement === undefined ? 0 : OPEN)
                ? { planted: true }
                : {}),
            },
          },
        };
      },
    };
    if (displacement !== undefined)
      putDownTarget.checkContact(
        context,
        plan.posture(down),
        side,
        offset,
        down,
      );
    // A placement that stays where it is laid is planned as one admitted
    // course of the arm (`courseArmGoal`), as the pick up's reach is: the
    // carry from the arm the entry shows to the placing arm, the hold on the
    // placing frame while the fingers open, and the return to the hanging
    // arm. The carry and the return are the planner's joint-space
    // transports, so the forearm's twist and the wrist go continuously
    // between two arms the body can take, never through a world attitude
    // the forearm's twist range cannot follow (a slerped attitude switched
    // the twist between its range's ends), and never through a goal with no
    // attitude, which the limb fit reads as an untwisted forearm. A receiver
    // that moves and an aperture's insertion keep their tracked goals.
    if (
      context.carrier === undefined &&
      displacement === undefined &&
      mouth === undefined
    )
      return courseArmGoal({
        context,
        plan,
        side,
        span: { start: 0, ready: down, relax: down + OPEN, end: duration },
        // Read past its end, the arm keeps the angles its return ended
        // with, never a fresh fit of the hanging goal on another branch.
        after: "angles",
      });
    // Over a carrier the carrier keeps the body: the hand's work alone, its
    // goal riding the bone the target rides (a holster on the hips).
    if (context.carrier !== undefined)
      return HumanCarriedHand.over(
        plan,
        context,
        side,
        context.params.on?.bone ??
          (onto === undefined
            ? undefined
            : HumanCarriedHand.riding(context, onto.prop)),
      );
    return plan;
  }

  /**
   * A fixed socket placement asks the earlier grasp to align both sockets; a
   * free placement at an authored resting attitude asks it to lay the prop at
   * that attitude (`putDownRestingDemand`).
   *
   * @param ahead The destination, the predicted stance and the candidate grip.
   * @returns The resting pose when an attitude is authored, the fixed socket
   *   pose when a named source socket is supplied, otherwise none.
   */
  export function demands(
    ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanPutDown.IParams>,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] {
    // A free placement at an authored resting attitude asks the grip to lay
    // the prop at it (`putDownRestingDemand`).
    const resting: IAutoMovieMotionHumanActionLaw.IDemand | undefined =
      putDownRestingDemand(ahead);
    if (resting !== undefined) return [resting];
    const via: string | undefined = ahead.params.onto?.via;
    if (
      via === undefined ||
      ahead.grip.prop !== ahead.params.prop ||
      ahead.grip.side !== (ahead.params.hand ?? "right")
    )
      return [];
    // Look-ahead has the pickup's clock. Fit tracked contacts when their placement starts.
    if (putDownTarget.track(ahead, ahead.params.onto!.prop) !== undefined)
      return [];
    const destination: IAutoMovieRigidTransform = putDownTarget.of(
      ahead,
      (): ReturnType<typeof resolveHumanPosture> =>
        resolveHumanPosture(ahead.body, ahead.grip.posture),
    )!;
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = ahead.grip.tool({
      tip: via,
    });
    const frame: IAutoMovieRigidTransform = HumanPropFrame.parent(
      destination,
      tool.held!.frame,
    );
    return [
      {
        posture: ahead.grip.posture,
        tool,
        frame: {
          point: frame.position,
          rotation: frame.rotation,
        },
        back: 0,
        bound: StrikingRoll.MISS,
      },
    ];
  }
}
