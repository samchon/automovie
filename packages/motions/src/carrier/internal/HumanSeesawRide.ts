import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRide } from "../../lexicon/internal/HumanRide";
import { PreparedHumanIntervals } from "../../perform/internal/PreparedHumanIntervals";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Ride a seesaw seat: the seated ride with the hands on the handles
 * (`HumanRide`), and the feet planted on the ground while the seat is so low
 * that the soles, hanging below it as the seated entry holds them, would meet
 * the ground, so the rider can push off. Each foot is placed where its knee is
 * ahead of the seat just before it comes that low, stays while it is, and is
 * lifted just after it rises again; no ankle ever goes below its height over
 * the ground.
 *
 * @param context The seated entry, the beam and its points.
 * @returns The ride with the ground contacts of the low end.
 * @throws {HumanRefusal} For a ride the seat refuses.
 */
export function HumanSeesawRide(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const { on, seat, hands, duration: seconds }: Params = context.params;
  const ground: number = context.params.ground ?? 0;
  const ride: Plan = HumanRide.ride.plan({
    ...context,
    params: { on, duration: seconds, seat, hands },
  });
  const posed: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    SOLES,
  );
  // Both feet share each preparation observation. The table does not survive
  // the planning call; playback retains only true plant intervals.
  const seen: Map<
    number,
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket>
  > = new Map();
  const soles = (
    time: number,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket> => {
    const kept:
      | Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket>
      | undefined = seen.get(time);
    if (kept !== undefined) return kept;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = posed(
      resolveHumanPosture(body, ride.posture(time)),
    );
    const lower = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.ISocket =>
      HumanFoot.sockets(body, bones, side).reduce((a, b) =>
        a.point.y <= b.point.y ? a : b,
      );
    const result: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.ISocket
    > = {
      left: lower("left"),
      right: lower("right"),
    };
    seen.set(time, result);
    return result;
  };
  const low = (side: AutoMovieHumanSide): ILow[] =>
    HumanMaterialContact.intervals(
      0,
      ride.duration,
      (time: number): number => soles(time)[side].point.y - ground,
    ).map(({ from, to }: HumanMaterialContact.IInterval): ILow => {
      const shown: IAutoMovieMotionHumanFoot.ISocket = soles(from)[side];
      const socket: IAutoMovieMotionHumanFoot.ISocket = {
        ...shown,
        point: { ...shown.point, y: ground },
      };
      return {
        from,
        to,
        socket,
        planted: HumanFoot.prepareAt(
          body,
          side,
          socket.socket,
          ride.posture(from).yaw,
          0,
        )(socket.point),
        offset: HumanFoot.offset(body, side, socket.socket),
      };
    });
  const lows: Record<AutoMovieHumanSide, ILow[]> = {
    left: low("left"),
    right: low("right"),
  };
  seen.clear();
  const reader = (
    side: AutoMovieHumanSide,
  ): {
    held(time: number): ILow | undefined;
    near(time: number): ILow | undefined;
  } => {
    const phases: ILow[] = lows[side];
    const held: (time: number) => ILow | undefined =
      PreparedHumanIntervals.first(phases);
    const nearby = PreparedHumanIntervals.first(
      phases.map((phase: ILow) => ({
        from: phase.from - PLACE,
        to: phase.to + PLACE,
        phase,
      })),
    );
    return {
      held,
      near: (time: number): ILow | undefined => nearby(time)?.phase,
    };
  };
  const left: ReturnType<typeof reader> = reader("left");
  const right: ReturnType<typeof reader> = reader("right");
  const contacts: IAutoMovieMotionHumanContactWindow[] = ride.contacts.filter(
    (contact): boolean =>
      contact.part !== "leftFoot" && contact.part !== "rightFoot",
  );
  for (const side of ["left", "right"] as const)
    for (const interval of lows[side])
      contacts.push({
        part: `${side}Foot`,
        kind: "plant",
        from: interval.from / ride.duration,
        to: interval.to / ride.duration,
        support: { kind: "ground", height: ground },
        socket: interval.socket.socket,
        material: {
          bone: body.surfaces.sockets[
            `${interval.socket.socket}${side === "left" ? "Left" : "Right"}`
          ].bone,
          point: { ...interval.socket.point, y: 0 },
          normal: { x: 0, y: 1, z: 0 },
          clearance: 0,
        },
      });
  return {
    ...ride,
    contacts,
    posture: (at: number): Posture => {
      const posture: Posture = ride.posture(at);
      const limbs: Posture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const) {
        const track: ReturnType<typeof reader> = side === "left" ? left : right;
        const held: ILow | undefined = track.held(at);
        const interval: ILow | undefined = held ?? track.near(at);
        if (interval === undefined) continue;
        const share: number =
          held !== undefined
            ? 1
            : at < interval.from
              ? AutoMovieEngineMotionSampling.minimumJerkShare(1 - (interval.from - at) / PLACE)
              : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((at - interval.to) / PLACE);
        const goal: IAutoMovieVector3 = interval.planted.ankle;
        const carried: IAutoMovieHumanLimbGoal | undefined =
          posture.limbs[`${side}Leg`];
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(
          interval.planted.rotation,
          { x: 0, y: 0, z: body.measure.thigh },
        );
        const knee: IAutoMovieVector3 = {
          ...Vector3.add(goal, forward),
          y: Math.max(goal.y + body.measure.shank, posture.root.y),
        };
        limbs[`${side}Leg`] =
          carried === undefined
            ? {
                point: goal,
                bend: knee,
                rotation: interval.planted.rotation,
                planted: held !== undefined,
                contact: interval.offset,
              }
            : {
                ...carried,
                // The foot comes down onto the ground and lifts off it on
                // an arc, never dragging across it.
                point: Vector3.add(Vector3.lerp(carried.point, goal, share), {
                  x: 0,
                  y: LIFT * Math.sin(Math.PI * share),
                  z: 0,
                }),
                bend: Vector3.lerp(carried.bend, knee, share),
                rotation:
                  carried.rotation === undefined
                    ? interval.planted.rotation
                    : Quaternion.slerp(
                        carried.rotation,
                        interval.planted.rotation,
                        share,
                      ),
                planted: held !== undefined,
                contact: interval.offset,
              };
      }
      return { ...posture, limbs };
    },
  };
}
type Params = IAutoMovieMotionHumanPlayground.ISeesawRideParams;
type Plan = IAutoMovieMotionHumanActionPlan;

type Posture = IAutoMovieMotionHumanPosture;

/** Feet and toes needed to read the displayed soles. */
const SOLES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftFoot",
  "leftToes",
  "rightFoot",
  "rightToes",
]);

/** Seconds a foot takes to reach the ground or leave it (provisional staging). */
const PLACE: number = 0.25;

/**
 * How high a foot arcs over the ground as it is placed or lifted, metres
 * (provisional staging).
 */
const LIFT: number = 0.05;

/** One foot's planted interval, in ride seconds. */
interface ILow {
  /** The free sole first reaches the floor. */
  from: number;

  /** The free sole leaves the floor. */
  to: number;

  /** The sole point kept still throughout. */
  socket: IAutoMovieMotionHumanFoot.ISocket;

  /** The level foot's ankle and heading for that sole point. */
  planted: IAutoMovieMotionHumanFoot.IPlacement;

  /** The fixed sole offset from the planted ankle, in the foot's frame. */
  offset: IAutoMovieVector3;
}
