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
/** The alternatives of `HELDEntryItem`'s site. */
type HELDEntryItem = "hip" | "knee";

/**
 * The hip's and knee's flexion that hold a three-point gait's injured foot off
 * the floor, degrees (provisional: the knee bent near a right angle and the hip
 * a little forward, so the foot clears the floor by a hand's breadth even as
 * the sound knee gives under the swing).
 */
const HELD: Readonly<Record<HELDEntryItem, number>> = { hip: 30, knee: 80 };

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

/** One staged crutch with its own contact points and prepared advances. */
interface ICrutch {
  /** The staged frame at the action's start. */
  start: IAutoMovieRigidTransform;

  /** The grip's place in the crutch's frame, metres. */
  grip: IAutoMovieVector3;

  /** The tip's place in the crutch's frame, metres. */
  tip: IAutoMovieVector3;

  /** Its advances over the walk. */
  moves: crutchWalkCourse.IAdvance[];
}

/**
 * Plan a walk on two crutches: the crutch gait on the support law, the crutches
 * advancing on their own track and the body swinging on the hands
 * (`HumanCrutchWalk.plan`).
 *
 * @param context The walk's context.
 * @returns The plan.
 */
export function HumanCrutchWalkPlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchWalk>,
): IAutoMovieMotionHumanActionPlan {
  const { params, body }: typeof context = context;
  const pattern: IAutoMovieMotionHumanCrutchWalk.Pattern =
    params.pattern ?? "threePoint";
  const injured: AutoMovieHumanSide = params.injured ?? "left";
  const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
  const timing: crutchWalkCourse.IClock = crutchWalkCourse.clock(params);
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const ground: number = HumanFoot.point(body, sound, "sole", {
    ankle: context.entry.feet[sound].ankle,
    rotation: context.entry.feet[sound].rotation,
  }).y;
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
    const localTip: IAutoMovieVector3 = tip.frame.translation;
    if (Math.abs(crutchWalkCourse.tipAt(start, localTip).y - ground) > FLOOR)
      return crutchWalkCourse.refuse(
        side,
        subject,
        "the crutch does not start on its tip on the floor",
      );
    return {
      start,
      grip: grip.frame.translation,
      tip: localTip,
      moves: crutchWalkCourse.advances(start, params, timing, localTip),
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
  const feet: readonly AutoMovieHumanSide[] =
    pattern === "threePoint" ? [sound] : ["left", "right"];
  const toesAtEntry: IAutoMovieVector3[] = supportContact.points(body, entry, [
    { contact: { part: "leftFoot", kind: "bear" }, at: null },
    { contact: { part: "rightFoot", kind: "bear" }, at: null },
  ]);
  // Ground targets constrain the horizontal toe position. On a raised floor
  // the fitted target is the toe joint, at its displayed offset above the sole.
  const initial: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: {
      ...toesAtEntry[0]!,
      y: ground <= HumanFoot.BEARING ? 0 : toesAtEntry[0]!.y,
    },
    right: {
      ...toesAtEntry[1]!,
      y: ground <= HumanFoot.BEARING ? 0 : toesAtEntry[1]!.y,
    },
  };
  const tipAt = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 =>
    crutchWalkCourse.tipAt(
      crutchWalkCourse.frameAt(
        crutches[side].moves,
        crutches[side].start,
        seconds,
      ),
      crutches[side].tip,
    );
  const tipsAt = (seconds: number): IAutoMovieVector3 =>
    Vector3.lerp(tipAt("left", seconds), tipAt("right", seconds), 0.5);

  // Both feet turn about the entry station or the midpoint of the staged tips.
  const centre: IAutoMovieVector3 = params.origin ?? tipsAt(0);
  // How far ahead of the middle of each bearing foot's support, between its
  // heel and its ball, the foot's bear point (its toes' joint) lies along
  // the heading: read once on the entry's displayed sockets
  // (`HumanFoot.sockets`).
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    context.entry.pose,
  );
  const ahead: readonly number[] = feet.map(
    (side: AutoMovieHumanSide): number => {
      const [heel, ball]: IAutoMovieMotionHumanFoot.ISocket[] =
        HumanFoot.sockets(body, bones, side);
      return Vector3.dot(
        Vector3.subtract(
          initial[side],
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
      { position: initial[feet[i]!], rotation: Quaternion.identity() },
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
            Vector3.subtract(tipsAt(timing.stations[station]!.plant), carried),
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
  const shoulders: number | undefined =
    padTop !== -Infinity ? padTop + PAD : undefined;
  let standing: IAutoMovieMotionHumanSupport.IContact[] = feet.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: { kind: "point", frame: "world", at: initial[side], normal: UP },
    }),
  );
  // Both feet stand while the hands take the grips; a three-point gait
  // lifts its injured foot only once the hands bear (`HELD`).
  const both: IAutoMovieMotionHumanSupport.IContact[] =
    pattern === "threePoint"
      ? (["left", "right"] as const).map(
          (
            side: AutoMovieHumanSide,
          ): IAutoMovieMotionHumanSupport.IContact => ({
            part: `${side}Foot`,
            kind: "bear",
            target: {
              kind: "point",
              frame: "world",
              at: initial[side],
              normal: UP,
            },
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
  // Each toe joint stands at least as high as it bears on the floor at
  // entry (`HumanContactWindow.IPath.floor`): the floor's height plus the
  // joint's height above its sole.
  const floors: Readonly<Record<HumanContactWindow.Foot, number>> = {
    leftFoot: toesAtEntry[0]!.y,
    rightFoot: toesAtEntry[1]!.y,
  };
  const bearing: HumanContactWindow.IContacts = HumanContactWindow.fromPath({
    windows: plan.contacts,
    duration: plan.duration,
    floor: (foot: HumanContactWindow.Foot): number => floors[foot],
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
  // Each foot held where its contact locks it (`HumanContactWindow.locked`).
  const shown: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture =>
    HumanContactWindow.locked(
      posture(seconds, channels, resolution, projection),
      bearing,
      seconds,
      plan.duration,
    );
  return {
    ...plan,
    posture: shown,
    yields: ["head"],
    contacts: [
      ...bearing.windows,
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
}
