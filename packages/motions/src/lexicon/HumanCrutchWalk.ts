import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { supportContact } from "../actions/supportContact";
import { getUp } from "../floor/getUp";
import { HumanContactWindow } from "../law/HumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { carryCrutchHands } from "./carryCrutchHands";
import { crutchHeldLeg } from "./crutchHeldLeg";
import { crutchWalkCourse } from "./crutchWalkCourse";

/** How far a staged crutch tip may stand off the floor, metres. */
const FLOOR: number = 0.01;

/**
 * How far a swung-through foot lands past the crutch tips, metres: 12 inches,
 * "Land on your good foot, about 12 inches in front of the crutches" (UMass
 * Memorial Health, "Discharge Instructions: Using Crutches
 * (Non-Weight-Bearing)", content by WebMD Ignite), measured, as a swing-to
 * landing's level is, from the middle of the foot's support between heel and
 * ball.
 */
const THROUGH: number = 12 * 0.0254;

/**
 * The hip's and knee's flexion that hold a three-point gait's injured foot off
 * the floor, degrees (provisional: the knee bent near a right angle and the hip
 * a little forward, so the foot clears the floor by a hand's breadth even as
 * the sound knee gives under the swing).
 */
const HELD: Readonly<Record<"hip" | "knee", number>> = { hip: 30, knee: 80 };

/**
 * How far above the crutch pads the axillae stay while the body swings, metres:
 * two to three finger widths (provisional, the axillary crutch fitting's
 * clearance).
 */
const PAD: number = 0.05;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** No offset: a planted crutch's grip lies on the support course. */
const STILL: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * One staged crutch: its entry frame, its grip in its own frame and its
 * advances.
 */
interface ICrutch {
  /** The staged frame at the action's start. */
  start: IAutoMovieRigidTransform;

  /** The grip's place in the crutch's frame, metres. */
  grip: IAutoMovieVector3;

  /** Its advances over the walk. */
  moves: crutchWalkCourse.IAdvance[];
}

/**
 * The crutches' common centre at entry: midway between their staged tips, on
 * the floor.
 */
function centreOf(
  left: IAutoMovieRigidTransform,
  right: IAutoMovieRigidTransform,
): IAutoMovieVector3 {
  const mid: IAutoMovieVector3 = Vector3.lerp(
    left.position,
    right.position,
    0.5,
  );
  return { ...mid, y: 0 };
}

/**
 * Walking on two crutches: a crutch gait on the support law, the crutches
 * advancing on their own track and the body swinging on the hands.
 *
 * Each station first advances both crutch tips (`ADVANCE` of its time), the
 * feet standing; then the hands bear on the planted handgrips while the feet
 * swing. In a three-point gait only the sound foot bears and steps, the injured
 * leg held off the floor (`HELD`), its foot first lifted clear over its place
 * before the leg folds; in a swing-to gait both feet land level with the tips
 * ("Lift and swing the body to the crutches", Morelewicz and Chambers 1961,
 * "Crutch Walking", AAIN Journal 9(1):20-21; "Land on your good foot, between
 * your crutches", UMass Memorial Health's crutch instructions), and in a
 * swing-through gait `THROUGH` past them. A foot is level with a line where the
 * middle of its support, between the heel and the ball it lands flat on
 * (contacts.md, "Feet"), lies on it. The crutch props share the walk's clock
 * (`track`), so a scene's crutches and the body read one course. Each station
 * carries both crutches and the feet rigidly with the walker: displaced by the
 * station and turned about the walk's `origin` (each crutch about its own tip
 * and the feet about the tips' midpoint when none is given). The hands hold
 * their grips where the crutch stands at each support key and ride the crutch's
 * lift between them (`carryCrutchHands`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of each gait, where the weight goes and how the props share the clock.
 * @evidence contracts/development/design.md#principled-representation Support stances whose contacts are the bearing feet and hands, and one track per crutch derived from the same stations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One law and its crutch track.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hands bear at the crutches' own grips; no hand or foot place is authored apart from the stations.
 *
 * Each station's `seconds` is the author's, so the speed is its distance over them; no natural value is defined (provisional, missing a study of crutch gait). A crutch advances through the first third of each station and the body swings through the rest; the opening stance takes a quarter of the first station's time.
 */
export const HumanCrutchWalk: IAutoMovieMotionHumanCrutchWalk.ILaw = {
  name: "crutchWalk",
  interrupts: {},

  track: (
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchWalk,
    _side: AutoMovieHumanSide,
    startsAt: number = 0,
  ): ((filmSecond: number) => IAutoMovieRigidTransform) => {
    const timing: crutchWalkCourse.IClock = crutchWalkCourse.clock(params);
    // A crutch moves rigidly with the walker: displaced by each station and
    // turned about the entry station (`origin`). Both crutches advance on one
    // clock, so the side selects no phase of its own.
    const moves: crutchWalkCourse.IAdvance[] = crutchWalkCourse.advances(
      start,
      params,
      timing,
    );
    return (filmSecond: number): IAutoMovieRigidTransform =>
      crutchWalkCourse.frameAt(moves, start, filmSecond - startsAt);
  },

  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchWalk>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params, body }: typeof context = context;
    const pattern: IAutoMovieMotionHumanCrutchWalk.Pattern =
      params.pattern ?? "threePoint";
    const injured: AutoMovieHumanSide = params.injured ?? "left";
    const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
    const timing: crutchWalkCourse.IClock = crutchWalkCourse.clock(params);
    const crutch: (side: AutoMovieHumanSide) => ICrutch = (
      side: AutoMovieHumanSide,
    ): ICrutch => {
      const subject: string = side === "left" ? params.left : params.right;
      const read: ReturnType<typeof context.prop> = context.prop(subject);
      const start: IAutoMovieRigidTransform = read.frame(context.start);
      const affordances: readonly IAutoMovieAffordance[] =
        read.prop.affordances ?? [];
      const grip: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === "grip",
      );
      const tip: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === "tip",
      );
      if (grip === undefined || tip === undefined)
        return crutchWalkCourse.refuse(
          side,
          subject,
          "a crutch declares a grip and a tip",
        );
      const foot: IAutoMovieVector3 = Vector3.add(
        start.position,
        Quaternion.rotateVector(start.rotation, tip.frame.translation),
      );
      if (Math.abs(foot.y) > FLOOR)
        return crutchWalkCourse.refuse(
          side,
          subject,
          "the crutch does not start on its tip on the floor",
        );
      return {
        start,
        grip: grip.frame.translation,
        moves: crutchWalkCourse.advances(start, params, timing),
      };
    };
    const crutches: Record<AutoMovieHumanSide, ICrutch> = {
      left: crutch("left"),
      right: crutch("right"),
    };

    // Each hand grips its crutch's handgrip, a bar front to back between the
    // rails, the palm turned in: pressed palm down onto a point at the hip's
    // height instead, the wrist would extend past its range and the arm flip.
    // The grip is read where the crutch's track has it at each key.
    const hand: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanSupport.IContact = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: {
        kind: "prop",
        subject: side === "left" ? params.left : params.right,
        point: "grip",
      },
    });

    // The feet: the bearing ones, at entry and carried by each station.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const feet: readonly AutoMovieHumanSide[] =
      pattern === "threePoint" ? [sound] : ["left", "right"];
    const initial: readonly IAutoMovieVector3[] = supportContact.onFloors(
      body,
      entry,
      feet.map(
        (side: AutoMovieHumanSide): `${AutoMovieHumanSide}Foot` =>
          `${side}Foot`,
      ),
    );
    // The feet turn with the crutches about the entry station, or about the
    // tips' midpoint when the walk gives none.
    const centre: IAutoMovieVector3 =
      params.origin ?? centreOf(crutches.left.start, crutches.right.start);
    const tipsAt: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 =>
      Vector3.lerp(
        crutchWalkCourse.frameAt(
          crutches.left.moves,
          crutches.left.start,
          seconds,
        ).position,
        crutchWalkCourse.frameAt(
          crutches.right.moves,
          crutches.right.start,
          seconds,
        ).position,
        0.5,
      );
    // How far ahead of the middle of each bearing foot's support, between its
    // heel and its ball, the foot's bear point (its toes' joint) lies along
    // the heading: read once on the entry's displayed sockets
    // (`HumanFoot.sockets`).
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
    );
    const ahead: readonly number[] = feet.map(
      (side: AutoMovieHumanSide, i: number): number => {
        const [heel, ball]: IAutoMovieMotionHumanFoot.ISocket[] =
          HumanFoot.sockets(body, bones, side);
        return Vector3.dot(
          Vector3.subtract(
            initial[i]!,
            Vector3.lerp(heel!.point, ball!.point, 0.5),
          ),
          HumanFrame.forward(entry.yaw),
        );
      },
    );
    const footAt: (
      i: number,
      station: number,
    ) => IAutoMovieMotionHumanSupport.IContact = (
      i: number,
      station: number,
    ): IAutoMovieMotionHumanSupport.IContact => {
      const carried: IAutoMovieVector3 = crutchWalkCourse.stationed(
        { position: initial[i]!, rotation: Quaternion.identity() },
        centre,
        params.stations[station],
      ).position;
      // A three-point sound foot lands between the tips; a swing-to foot
      // with the middle of its support level with them and a swing-through
      // foot's `THROUGH` past them.
      const forward: IAutoMovieVector3 = HumanFrame.forward(
        entry.yaw + (params.stations[station]!.turn ?? 0),
      );
      const reach: number =
        pattern === "threePoint"
          ? 0
          : Vector3.dot(
              Vector3.subtract(
                tipsAt(timing.stations[station]!.plant),
                carried,
              ),
              forward,
            ) +
            ahead[i]! +
            (pattern === "swingThrough" ? THROUGH : 0);
      return {
        part: `${feet[i]!}Foot`,
        kind: "bear",
        target: {
          kind: "point",
          frame: "world",
          at: Vector3.add(carried, Vector3.scale(forward, Math.max(0, reach))),
          normal: UP,
        },
      };
    };
    const prefer: IAutoMovieMotionHumanSupport.IStance["prefer"] =
      getUp.quiet(body);
    // The body swings on its pushing arms, the axillae kept PAD above the
    // higher crutch pad, which a crutch on the floor holds at its entry
    // height (the pad is never hung on).
    const padAt: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => {
      const read: ReturnType<typeof context.prop> = context.prop(
        side === "left" ? params.left : params.right,
      );
      const pad: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === "pad");
      return pad === undefined
        ? -Infinity
        : crutches[side].start.position.y +
            Quaternion.rotateVector(
              crutches[side].start.rotation,
              pad.frame.translation,
            ).y;
    };
    const padTop: number = Math.max(padAt("left"), padAt("right"));
    const shoulders: number | undefined = Number.isFinite(padTop)
      ? padTop + PAD
      : undefined;
    let standing: IAutoMovieMotionHumanSupport.IContact[] = feet.map(
      (
        side: AutoMovieHumanSide,
        i: number,
      ): IAutoMovieMotionHumanSupport.IContact => ({
        part: `${side}Foot`,
        kind: "bear",
        target: { kind: "point", frame: "world", at: initial[i]!, normal: UP },
      }),
    );
    // Both feet stand while the hands take the grips; a three-point gait
    // lifts its injured foot only once the hands bear (`HELD`).
    const both: IAutoMovieMotionHumanSupport.IContact[] =
      pattern === "threePoint"
        ? supportContact.onFloors(body, entry, ["leftFoot", "rightFoot"]).map(
            (
              at: IAutoMovieVector3,
              i: number,
            ): IAutoMovieMotionHumanSupport.IContact => ({
              part: i === 0 ? "leftFoot" : "rightFoot",
              kind: "bear",
              target: { kind: "point", frame: "world", at, normal: UP },
            }),
          )
        : standing;
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [...both, hand("left"), hand("right")],
        seconds: timing.ready,
        event: "crutchReady",
        prefer,
      },
    ];
    params.stations.forEach(
      (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): void => {
        const at: crutchWalkCourse.IStationClock = timing.stations[i]!;
        // The crutches advance while the feet stand.
        stances.push({
          contacts: [...standing, hand("left"), hand("right")],
          seconds: at.plant - at.lift,
          turn: station.turn ?? 0,
          event: `crutchPlant${i + 1}`,
          prefer,
        });
        // The feet swing on the planted crutches.
        standing = feet.map(
          (
            _side: AutoMovieHumanSide,
            f: number,
          ): IAutoMovieMotionHumanSupport.IContact => footAt(f, i),
        );
        stances.push({
          contacts: [...standing, hand("left"), hand("right")],
          seconds: at.land - at.plant,
          turn: station.turn ?? 0,
          event: `footLand${i + 1}`,
          prefer,
          ...(shoulders !== undefined ? { shoulders } : {}),
        });
      },
    );
    const plan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });

    // The support keys hold each hand on its grip where the crutch stands at
    // that key; between the keys of an advance the crutch rises over its own
    // lift, so each hand is carried by the grip's offset from the support's
    // minimum-jerk chord (the same share the advance blends by).
    const gripAt = (
      side: AutoMovieHumanSide,
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = crutchWalkCourse.frameAt(
        crutches[side].moves,
        crutches[side].start,
        seconds,
      );
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, crutches[side].grip),
      );
    };
    const offset =
      (seconds: number): ((side: AutoMovieHumanSide) => IAutoMovieVector3) =>
      (side: AutoMovieHumanSide): IAutoMovieVector3 => {
        const move: crutchWalkCourse.IAdvance | undefined = crutches[
          side
        ].moves.find(
          (m: crutchWalkCourse.IAdvance): boolean =>
            seconds > m.from && seconds < m.to,
        );
        if (move === undefined) return STILL;
        return Vector3.subtract(
          gripAt(side, seconds),
          Vector3.lerp(
            gripAt(side, move.from),
            gripAt(side, move.to),
            minimumJerk.share((seconds - move.from) / (move.to - move.from)),
          ),
        );
      };
    const carried: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture =>
      carryCrutchHands(
        plan.posture(seconds, channels, resolution, projection),
        offset(seconds),
      );

    // A three-point gait holds the injured leg off the floor once the hands
    // bear, held by the end of the first advance (`crutchHeldLeg`).
    const hold: ReturnType<typeof crutchHeldLeg> = crutchHeldLeg({
      body,
      side: injured,
      lifted: timing.ready,
      held: timing.stations[0]!.plant,
      hip: HELD.hip,
      knee: HELD.knee,
      read: (seconds: number): IAutoMovieMotionHumanPosture =>
        plan.posture(seconds),
    });
    const posture: IAutoMovieMotionHumanActionPlan["posture"] =
      pattern !== "threePoint"
        ? carried
        : (
            seconds,
            channels,
            resolution,
            projection,
          ): IAutoMovieMotionHumanPosture =>
            hold(carried(seconds, channels, resolution, projection), seconds);
    // The feet bear where their planned toes stand still on the floor
    // (`HumanContactWindow.fromPath`), on the support each stance names.
    const toes: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(["leftToes", "rightToes"]);
    const feetWindows: IAutoMovieMotionHumanContactWindow[] =
      HumanContactWindow.fromPath({
        windows: plan.contacts,
        duration: plan.duration,
        toes: (seconds: number): HumanContactWindow.Toes => {
          const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            poseBones(
              body,
              resolveHumanPosture(body, posture(seconds)),
              undefined,
              toes,
            );
          return {
            leftFoot: placed.get("leftToes")!.worldPosition,
            rightFoot: placed.get("rightToes")!.worldPosition,
          };
        },
      });
    return {
      ...plan,
      posture,
      yields: ["head"],
      contacts: [
        ...feetWindows,
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: {
              kind: "prop",
              subject: side === "left" ? params.left : params.right,
              carries: false,
            },
          }),
        ),
      ],
      events: [...plan.events].sort(
        (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
          a.share - b.share,
      ),
    };
  },
};
