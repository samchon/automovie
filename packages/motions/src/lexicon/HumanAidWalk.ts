import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMountRider,
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
import { HumanMountRider } from "./HumanMountRider";
import { humanAidWalkGrip } from "./humanAidWalkGrip";

/** The prop's visible lift for authored film clearance, metres. */
const LIFT: number = 0.04;

/** Support alignment of the aid to the floor, in metres. */
const FLOOR: number = 0.01;

/** Fixed world vertical for floor, pivot and grip reads. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The hands and feet use the same side names. */
type Side = "left" | "right";

/** One prop advance and the floor poses it joins, in film seconds and world metres. */
interface IAdvance {
  /** Lift begins. */
  from: number;

  /** The next tip becomes planted. */
  to: number;

  /** Start and finish floor poses. */
  floor: readonly [IAutoMovieRigidTransform, IAutoMovieRigidTransform];
}

/** Name the aid or route setting that prevents motion. */
function refuse(axis: string, value: string | number, reason: string): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "place the declared aid on the floor, with reachable grips and stations",
  });
}

/** Keep the named planted foot when its other foot makes the next step. */
function foot(
  side: Side,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanSupport.IContact {
  return {
    part: `${side}Foot`,
    kind: "bear",
    target: { kind: "point", frame: "world", at, normal: UP },
  };
}

/** Resolve the same lift, touchdown and stationary windows for prop and body. */
function course(
  start: IAutoMovieRigidTransform,
  props: IAutoMovieMotionHumanAidWalk,
): {
  ready: number;
  moves: readonly IAdvance[];
} {
  if (
    props.kind !== "cane" &&
    props.kind !== "crutch" &&
    props.kind !== "walker"
  )
    return refuse(
      "kind",
      String(props.kind),
      "the aid order must name a cane, a crutch or a walker",
    );
  if (!Array.isArray(props.stations))
    return refuse(
      "stations",
      0,
      "an aided route needs an array of floor stations",
    );
  const first: IAutoMovieMotionHumanAidWalk.IStation | undefined =
    props.stations[0];
  if (first === undefined)
    return refuse("stations", 0, "an aided route needs at least one station");
  const ready: number = first.seconds / 4;
  const walker: boolean = props.kind === "walker";
  let clock: number = ready;
  let old: IAutoMovieRigidTransform = start;
  const moves: IAdvance[] = props.stations.map((station, index): IAdvance => {
    const heading: number = station.turn ?? 0;
    if (
      ![station.x, station.z, heading, station.seconds].every(
        Number.isFinite,
      ) ||
      station.seconds <= 0
    )
      return refuse(
        "stations",
        index,
        "the station coordinates and heading must be finite and its time positive",
      );
    const phase: number = station.seconds / (walker ? 3 : 2);
    const pose: IAutoMovieRigidTransform = {
      position: Vector3.add(start.position, {
        x: station.x,
        y: 0,
        z: station.z,
      }),
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(UP, heading),
        start.rotation,
      ),
    };
    const move: IAdvance = {
      from: clock,
      to: clock + phase * (walker ? 1 : 2 / 3),
      floor: [old, pose],
    };
    old = pose;
    clock += station.seconds;
    return move;
  });
  return { ready, moves };
}

/** Read the supported prop pose or its single minimum-jerk swing between placements. */
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
      const height: number = minimumJerk.share(2 * Math.min(share, 1 - share));
      return {
        position: { ...position, y: position.y + LIFT * height },
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

/**
 * A floor-aid gait with an explicit prop curve and body fitting on the same clock.
 *
 * A walker advances while both feet support the actor. A cane or crutch
 * advances during the opposite foot's swing. The parked aid stays fixed.
 * The screen orders are based on measured aid and foot contacts in
 * [Thies et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7057469/)
 * and [Kang et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7506684/).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two floor support orders and the prepared grip.
 * @evidence contracts/development/design.md#principled-representation The native prop track and performer use the same seconds and floor stations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The staged prop provides the collision geometry and grip contacts. The existing support and hand fitters own pose computation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rejects a conflicting prop track or unreachable handle. The body plan never replaces the prop owner's motion curve.
 */
export const HumanAidWalk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanAidWalk> & {
  /** Stage the aid through the normal rigid prop track callback. */
  track(
    start: IAutoMovieRigidTransform,
    props: IAutoMovieMotionHumanAidWalk,
    startsAt?: number,
  ): (filmSecond: number) => IAutoMovieRigidTransform;
} = {
  name: "aidWalk",
  interrupts: {},
  track: (
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanAidWalk,
    startsAt: number = 0,
  ): ((filmSecond: number) => IAutoMovieRigidTransform) => {
    const { moves }: ReturnType<typeof course> = course(start, params);
    return (filmSecond: number): IAutoMovieRigidTransform =>
      frameAt(moves, start, filmSecond - startsAt);
  },
  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAidWalk>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params, body }: typeof context = context;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const prop: ReturnType<typeof context.prop> = context.prop(params.prop);
    const start: IAutoMovieRigidTransform = prop.frame(context.start);
    const affordances: readonly IAutoMovieAffordance[] =
      prop.prop.affordances ?? [];
    const tip: IAutoMovieAffordance | undefined = affordances.find(
      (affordance: IAutoMovieAffordance): boolean =>
        affordance.id === "tip" && affordance.kind === "surface",
    );
    if (tip === undefined)
      return refuse("prop", params.prop, "the placed aid has no floor tip");
    const footOffset: IAutoMovieVector3 = Quaternion.rotateVector(
      start.rotation,
      tip.frame.translation,
    );
    if (Math.abs(start.position.y + footOffset.y) > FLOOR)
      return refuse("prop", params.prop, "the aid does not start on its floor");
    const walker: boolean = params.kind === "walker";
    const side: Side =
      params.kind === "walker" ? "left" : (params.hand ?? "right");
    const lead: Side = walker ? "left" : side === "left" ? "right" : "left";
    const trail: Side = lead === "left" ? "right" : "left";
    const sides: readonly Side[] = walker ? ["left", "right"] : [side];
    const { ready, moves }: ReturnType<typeof course> = course(start, params);
    const initial: readonly IAutoMovieVector3[] = supportContact.onFloors(
      body,
      entry,
      [`${lead}Foot`, `${trail}Foot`],
    );
    const center: IAutoMovieVector3 = Vector3.lerp(
      initial[0]!,
      initial[1]!,
      0.5,
    );
    const prefer: IAutoMovieMotionHumanSupport.IStance["prefer"] =
      getUp.quiet(body);
    let leading: IAutoMovieMotionHumanSupport.IContact = foot(
      lead,
      initial[0]!,
    );
    let trailing: IAutoMovieMotionHumanSupport.IContact = foot(
      trail,
      initial[1]!,
    );
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [leading, trailing],
        seconds: ready,
        event: "aidReady",
        prefer,
      },
    ];
    let turn: number = 0;
    for (const station of params.stations) {
      const heading: number = station.turn ?? 0;
      const next: IAutoMovieVector3 = Vector3.add(center, {
        x: station.x,
        y: 0,
        z: station.z,
      });
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        UP,
        heading,
      );
      const phase: number = station.seconds / (walker ? 3 : 2);
      if (walker)
        stances.push({
          contacts: [leading, trailing],
          seconds: phase,
          turn,
          prefer,
        });
      leading = foot(
        lead,
        Vector3.add(
          next,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(initial[0]!, center),
          ),
        ),
      );
      stances.push({
        contacts: [leading, trailing],
        seconds: phase,
        turn: heading,
        prefer,
      });
      trailing = foot(
        trail,
        Vector3.add(
          next,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(initial[1]!, center),
          ),
        ),
      );
      stances.push({
        contacts: [leading, trailing],
        seconds: phase,
        turn: heading,
        prefer,
      });
      turn = heading;
    }

    const plan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });
    const samples: Set<number> = new Set([
      ready,
      plan.duration,
      ...plan.events.map((event) => event.share * plan.duration),
    ]);
    for (const move of moves)
      for (const share of [0, 0.25, 0.5, 0.75, 1])
        samples.add(move.from + share * (move.to - move.from));
    const stations: {
      frame: IAutoMovieRigidTransform;
      body: IAutoMovieMotionHumanPosture;
    }[] = [];
    for (const seconds of samples) {
      const intended: IAutoMovieRigidTransform = frameAt(moves, start, seconds);
      const actual: IAutoMovieRigidTransform = prop.frame(
        context.start + seconds,
      );
      if (
        Vector3.distance(actual.position, intended.position) > FLOOR ||
        Quaternion.angle(actual.rotation, intended.rotation) > 1
      )
        return refuse(
          "prop",
          params.prop,
          "the staged track disagrees with the aid's authored floor stations",
        );
      if (seconds >= ready)
        stations.push({
          frame: intended,
          body: plan.posture(seconds),
        });
    }

    const hands: readonly humanAidWalkGrip.IHand[] = humanAidWalkGrip.fit(
      body,
      entry,
      params.prop,
      prop.prop.shapes ?? [],
      affordances,
      start,
      walker,
      sides,
      stations,
      refuse,
    );

    const stage: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const base: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      const frame: IAutoMovieRigidTransform = frameAt(moves, start, seconds);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...base.joints };
      const share: number = minimumJerk.share(
        Math.min(1, Math.max(0, seconds / ready)),
      );
      for (const hand of hands) {
        const held: IAutoMovieMotionHumanMountRider.IHoldResult =
          HumanMountRider.hold(
            body,
            hand.side,
            base,
            humanAidWalkGrip.target(
              hand.affordance,
              frame,
              hand.offset,
              hand.angle,
            ),
            share,
            hand.digits,
            resolution,
            projection,
          );
        limbs[`${hand.side}Arm`] = held.arm;
        Object.assign(joints, held.fingers);
      }
      return { ...base, joints, limbs };
    };

    return {
      ...plan,
      posture: stage,
      yields: ["head"],
      contacts: [
        ...plan.contacts,
        ...hands.map(
          (hand: IHand): IAutoMovieMotionHumanContactWindow => ({
            part: `${hand.side}Hand`,
            kind: "grip",
            from: ready / plan.duration,
            to: 1,
            support: { kind: "prop", subject: params.prop, carries: false },
          }),
        ),
      ],
      events: [
        ...plan.events,
        ...moves.map((move: IAdvance, index: number) => ({
          name: `aidPlant${index + 1}`,
          share: move.to / plan.duration,
        })),
      ].sort((a, b): number => a.share - b.share),
    };
  },
};
