import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { supportContact } from "../actions/supportContact";
import { getUp } from "../floor/getUp";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";

/** The crutch's visible lift as it swings forward, metres (provisional, as the aided walk's). */
const LIFT: number = 0.04;

/** How far a staged crutch tip may stand off the floor, metres. */
const FLOOR: number = 0.01;

/** The share of each station the crutches take to advance before the body swings (provisional: the crutches lead, the swing follows). */
const ADVANCE: number = 1 / 3;

/** How far a swung-through foot lands past the crutch tips, metres (provisional: a short step past the tripod). */
const THROUGH: number = 0.15;

/** The hip's and knee's flexion that hold a three-point gait's injured foot off the floor, degrees (provisional: the knee bent near a right angle and the hip a little forward, so the foot clears the floor by a hand's breadth even as the sound knee gives under the swing). */
const HELD: Readonly<Record<"hip" | "knee", number>> = { hip: 30, knee: 80 };

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** One crutch advance: when it lifts, when its tip plants, and its two floor frames. */
interface IAdvance {
  /** Lift begins, action seconds. */
  from: number;

  /** The tip plants, action seconds. */
  to: number;

  /** The floor frames before and after. */
  floor: readonly [IAutoMovieRigidTransform, IAutoMovieRigidTransform];
}

/** The crutches' common clock: when the grip is settled and each station's advance and swing. */
interface IClock {
  /** The opening stance's seconds, a quarter of the first station's. */
  ready: number;

  /** Each station's crutch advance window and its body swing's end, action seconds. */
  stations: readonly IStationClock[];
}

/** One staged crutch: its entry frame, its grip in its own frame and its advances. */
interface ICrutch {
  /** The staged frame at the action's start. */
  start: IAutoMovieRigidTransform;

  /** The grip's place in the crutch's frame, metres. */
  grip: IAutoMovieVector3;

  /** Its advances over the walk. */
  moves: IAdvance[];
}

/** One station's instants, action seconds. */
interface IStationClock {
  /** The crutches lift. */
  lift: number;

  /** The crutches plant. */
  plant: number;

  /** The feet land. */
  land: number;
}

/** Refuse a crutch or route setting with its reason. */
function refuse(axis: string, value: unknown, reason: string): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "stage both crutches on the floor beside the body, each with a grip and a tip, and give finite stations",
  });
}

/** The common clock of a crutch walk's stations. */
function clock(params: IAutoMovieMotionHumanCrutchWalk): IClock {
  if (!Array.isArray(params.stations) || params.stations.length === 0)
    return refuse("stations", 0, "a crutch walk needs at least one station");
  const ready: number = params.stations[0]!.seconds / 4;
  let t: number = ready;
  return {
    ready,
    stations: params.stations.map(
      (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): IStationClock => {
        if (
          ![station.x, station.z, station.turn ?? 0, station.seconds].every(
            Number.isFinite,
          ) ||
          station.seconds <= 0
        )
          return refuse(
            "stations",
            i,
            "the station coordinates and heading must be finite and its time positive",
          );
        const at: IStationClock = {
          lift: t,
          plant: t + ADVANCE * station.seconds,
          land: t + station.seconds,
        };
        t += station.seconds;
        return at;
      },
    ),
  };
}

/** A frame carried from its entry pose by a station's displacement and turn. */
function stationed(
  start: IAutoMovieRigidTransform,
  centre: IAutoMovieVector3,
  station: IAutoMovieMotionHumanAidWalk.IStation | undefined,
): IAutoMovieRigidTransform {
  if (station === undefined) return start;
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    UP,
    station.turn ?? 0,
  );
  return {
    position: Vector3.add(
      Vector3.add(centre, { x: station.x, y: 0, z: station.z }),
      Quaternion.rotateVector(turn, Vector3.subtract(start.position, centre)),
    ),
    rotation: Quaternion.multiply(turn, start.rotation),
  };
}

/** One crutch's advances over the walk, from its staged frame. */
function advances(
  start: IAutoMovieRigidTransform,
  centre: IAutoMovieVector3,
  params: IAutoMovieMotionHumanCrutchWalk,
  timing: IClock,
): IAdvance[] {
  let old: IAutoMovieRigidTransform = start;
  return params.stations.map(
    (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): IAdvance => {
      const next: IAutoMovieRigidTransform = stationed(start, centre, station);
      const move: IAdvance = {
        from: timing.stations[i]!.lift,
        to: timing.stations[i]!.plant,
        floor: [old, next],
      };
      old = next;
      return move;
    },
  );
}

/** A crutch's frame at an action second: planted, or on one minimum-jerk swing between plants. */
function frameAt(
  moves: readonly IAdvance[],
  start: IAutoMovieRigidTransform,
  seconds: number,
): IAutoMovieRigidTransform {
  let stable: IAutoMovieRigidTransform = start;
  for (const move of moves) {
    if (seconds <= move.from) return stable;
    if (seconds < move.to) {
      const share: number = (seconds - move.from) / (move.to - move.from);
      const blend: number = minimumJerk.share(share);
      const position: IAutoMovieVector3 = Vector3.lerp(
        move.floor[0].position,
        move.floor[1].position,
        blend,
      );
      return {
        position: {
          ...position,
          y: position.y + LIFT * minimumJerk.share(2 * Math.min(share, 1 - share)),
        },
        rotation: Quaternion.slerp(
          move.floor[0].rotation,
          move.floor[1].rotation,
          blend,
        ),
      };
    }
    stable = move.floor[1];
  }
  return stable;
}

/** The crutches' common centre at entry: midway between their staged tips, on the floor. */
function centreOf(
  left: IAutoMovieRigidTransform,
  right: IAutoMovieRigidTransform,
): IAutoMovieVector3 {
  const mid: IAutoMovieVector3 = Vector3.lerp(left.position, right.position, 0.5);
  return { ...mid, y: 0 };
}

/**
 * Walking on two crutches (#3994): a crutch gait on the support law, the
 * crutches advancing on their own track and the body swinging on the hands.
 *
 * Each station first advances both crutch tips (`ADVANCE` of its time),
 * the feet standing; then the hands bear on the planted handgrips while the
 * feet swing. In a three-point gait only the sound foot bears and steps, the
 * injured leg held off the floor (`HELD`); in a swing-to gait both feet land
 * level with the tips, and in a swing-through gait `THROUGH` past them
 * (Physiopedia, Crutches, https://www.physio-pedia.com/Crutches). The crutch
 * props share the walk's clock (`track`), so a scene's crutches and the body
 * read one course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order of each gait, where the weight goes and how the props share the clock.
 * @evidence contracts/development/design.md#principled-representation Support stances whose contacts are the bearing feet and hands, and one track per crutch derived from the same stations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One law and its crutch track.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hands bear at the crutches' own grips; no hand or foot place is authored apart from the stations.
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
    const timing: IClock = clock(params);
    // Each crutch turns about the body's centre, which it cannot see alone;
    // a crutch is carried by the stations' displacement and turns about its
    // own tip, as the body's centre carries it to first order.
    const moves: IAdvance[] = advances(start, { ...start.position, y: 0 }, params, timing);
    return (filmSecond: number): IAutoMovieRigidTransform =>
      frameAt(moves, start, filmSecond - startsAt);
  },

  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchWalk>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params, body }: typeof context = context;
    const pattern: IAutoMovieMotionHumanCrutchWalk.Pattern =
      params.pattern ?? "threePoint";
    const injured: AutoMovieHumanSide = params.injured ?? "left";
    const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
    const timing: IClock = clock(params);
    const crutch: (side: AutoMovieHumanSide) => ICrutch = (side: AutoMovieHumanSide): ICrutch => {
      const subject: string = side === "left" ? params.left : params.right;
      const read: ReturnType<typeof context.prop> = context.prop(subject);
      const start: IAutoMovieRigidTransform = read.frame(context.start);
      const affordances: readonly IAutoMovieAffordance[] = read.prop.affordances ?? [];
      const grip: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === "grip",
      );
      const tip: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === "tip",
      );
      if (grip === undefined || tip === undefined)
        return refuse(side, subject, "a crutch declares a grip and a tip");
      const foot: IAutoMovieVector3 = Vector3.add(
        start.position,
        Quaternion.rotateVector(start.rotation, tip.frame.translation),
      );
      if (Math.abs(foot.y) > FLOOR)
        return refuse(side, subject, "the crutch does not start on its tip on the floor");
      return {
        start,
        grip: grip.frame.translation,
        moves: advances(start, { ...start.position, y: 0 }, params, timing),
      };
    };
    const crutches: Record<AutoMovieHumanSide, ICrutch> = {
      left: crutch("left"),
      right: crutch("right"),
    };
    const gripAt: (side: AutoMovieHumanSide, seconds: number) => IAutoMovieVector3 = (side: AutoMovieHumanSide, seconds: number): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = frameAt(
        crutches[side].moves,
        crutches[side].start,
        seconds,
      );
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, crutches[side].grip),
      );
    };
    const hand: (side: AutoMovieHumanSide, seconds: number) => IAutoMovieMotionHumanSupport.IContact = (side: AutoMovieHumanSide, seconds: number): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "bear",
      target: { kind: "point", frame: "world", at: gripAt(side, seconds), normal: UP },
    });

    // The feet: the bearing ones, at entry and carried by each station.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const feet: readonly AutoMovieHumanSide[] =
      pattern === "threePoint" ? [sound] : ["left", "right"];
    const initial: readonly IAutoMovieVector3[] = supportContact.onFloors(
      body,
      entry,
      feet.map((side: AutoMovieHumanSide): `${AutoMovieHumanSide}Foot` => `${side}Foot`),
    );
    const centre: IAutoMovieVector3 = centreOf(crutches.left.start, crutches.right.start);
    const tipsAt: (seconds: number) => IAutoMovieVector3 = (seconds: number): IAutoMovieVector3 =>
      Vector3.lerp(
        frameAt(crutches.left.moves, crutches.left.start, seconds).position,
        frameAt(crutches.right.moves, crutches.right.start, seconds).position,
        0.5,
      );
    const footAt: (i: number, station: number) => IAutoMovieMotionHumanSupport.IContact = (
      i: number,
      station: number,
    ): IAutoMovieMotionHumanSupport.IContact => {
      const carried: IAutoMovieVector3 = stationed(
        { position: initial[i]!, rotation: Quaternion.identity() },
        centre,
        params.stations[station],
      ).position;
      // A three-point sound foot lands between the tips; a swing-to foot
      // level with them and a swing-through foot `THROUGH` past them.
      const forward: IAutoMovieVector3 = HumanFrame.forward(
        entry.yaw + (params.stations[station]!.turn ?? 0),
      );
      const reach: number =
        pattern === "threePoint"
          ? 0
          : Vector3.dot(
              Vector3.subtract(tipsAt(timing.stations[station]!.plant), carried),
              forward,
            ) + (pattern === "swingThrough" ? THROUGH : 0);
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
    };    const prefer: IAutoMovieMotionHumanSupport.IStance["prefer"] = getUp.quiet(body);
    let standing: IAutoMovieMotionHumanSupport.IContact[] = feet.map(
      (side: AutoMovieHumanSide, i: number): IAutoMovieMotionHumanSupport.IContact => ({
        part: `${side}Foot`,
        kind: "bear",
        target: { kind: "point", frame: "world", at: initial[i]!, normal: UP },
      }),
    );
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [...standing, hand("left", 0), hand("right", 0)],
        seconds: timing.ready,
        event: "crutchReady",
        prefer,
      },
    ];
    params.stations.forEach(
      (station: IAutoMovieMotionHumanAidWalk.IStation, i: number): void => {
        const at: IStationClock = timing.stations[i]!;
        // The crutches advance while the feet stand.
        stances.push({
          contacts: [...standing, hand("left", at.plant), hand("right", at.plant)],
          seconds: at.plant - at.lift,
          turn: station.turn ?? 0,
          event: `crutchPlant${i + 1}`,
          prefer,
        });
        // The feet swing on the planted crutches.
        standing = feet.map(
          (_side: AutoMovieHumanSide, f: number): IAutoMovieMotionHumanSupport.IContact => footAt(f, i),
        );
        stances.push({
          contacts: [...standing, hand("left", at.plant), hand("right", at.plant)],
          seconds: at.land - at.plant,
          turn: station.turn ?? 0,
          event: `footLand${i + 1}`,
          prefer,
        });
      },
    );
    const plan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });

    // A three-point gait holds the injured leg off the floor throughout.
    const posture: IAutoMovieMotionHumanActionPlan["posture"] =
      pattern !== "threePoint"
        ? plan.posture
        : (seconds, channels, resolution, projection): IAutoMovieMotionHumanPosture => {
            const base: IAutoMovieMotionHumanPosture = plan.posture(
              seconds,
              channels,
              resolution,
              projection,
            );
            const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
            delete limbs[`${injured}Leg`];
            return {
              ...base,
              limbs,
              joints: {
                ...base.joints,
                [`${injured}UpperLeg`]: [HELD.hip, 0, 0],
                [`${injured}LowerLeg`]: [HELD.knee, 0, 0],
              },
            };
          };
    return {
      ...plan,
      posture,
      yields: ["head"],
      contacts: [
        ...plan.contacts,
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

