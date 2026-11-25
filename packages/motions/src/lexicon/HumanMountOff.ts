import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { walk } from "../actions/walk";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { courseHumanLegs } from "../compose/courseHumanLegs";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { prepareSeatedPalms } from "../everyday/prepareSeatedPalms";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanMount } from "./HumanMount";
import { HumanMountPush } from "./HumanMountPush";
import { HumanSwungLeg } from "./HumanSwungLeg";

/** The alternatives of `Frame2`'s site. */
type Frame2 = "root" | "yaw" | "pitch" | "joints";

/**
 * Where the pelvis is at an instant of getting off: the root, the heading, the
 * pelvis pitch and the set joints.
 */
type Frame = Pick<IAutoMovieMotionHumanPosture, Frame2>;
/** The alternatives of `PlanLowerLimb`'s site. */
type PlanLowerLimb = "leftLeg" | "rightLeg";

/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftFoot" | "rightFoot";

/** The record of `IPlanFrameAtTilt`'s site. */
type IPlanFrameAtTilt = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};

/** Samples per second of the action clock used to find floor reach. */
const REACH_RATE: number = 60;

/**
 * Getting off a high seat onto the floor: what `rise` plans where a foot is off
 * the floor, on a rest or hanging.
 *
 * The goal is the standing posture of the stand law over two floor places:
 * ahead of the seat, the pelvis `HumanMount.AHEAD` thigh lengths ahead of where
 * it sat, or beside a seat sat astride, `HumanMount.BESIDE` thigh lengths
 * beyond where the near foot rode. The seat socket travels from the seat to
 * where it stands there, the root follows from it and the trunk's pitch, and
 * the legs and the hands are solved by inverse kinematics.
 *
 * The socket leaves the seat at 15 % of the time, the `seatOff`; sideways it
 * first rises `HumanMount.HOP` so the thigh clears the seat. Both feet leave
 * their rests before that, while the seat still bears the body: a leg cannot
 * hold a fixed rest under a pelvis that travels. The first foot off, at 5 %, is
 * the left one, or sideways the far one, whose ankle passes back over the seat
 * (`HumanMount.OVER`); the other follows at 10 %. Each lands at the first
 * instant, from 30 %, at which its leg reaches its floor place from the
 * descending hip, the second at least 20 % after it left. Where no leg reaches
 * the floor from the seat, the body slides off it until the first foot lands;
 * stepping down in a stirrup is not modelled. `standing` comes at 90 %.
 *
 * The time is `2 (1 + 0.6 (r - 1))` seconds for a socket resting at `r` of the
 * popliteal height, at most 4 (provisional, as getting on). First pass: the
 * pelvis does not turn while a leg swings over, and the hands hold nothing.
 */
export namespace HumanMountOff {
  /**
   * Plan getting off a seat.
   *
   * @param context The rise's context.
   * @param start The seat socket where it rests, world metres.
   * @param r The socket's height as a share of the popliteal height.
   * @returns The plan, with the rise's events `seatOff` and `standing`.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRise.IParams>,
    start: IAutoMovieVector3,
    r: number,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry: IAutoMovieMotionHumanEntryState = context.entry;
    const yaw: number = entry.posture.yaw;
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );
    const pitch0: number = entry.posture.pitch;
    const sat: IAutoMovieMotionHumanBase.ISeat | undefined =
      entry.base.kind === "seated" ? entry.base.seat : undefined;
    const side: AutoMovieHumanSide | undefined =
      sat?.mount === "left" || sat?.mount === "right" ? sat.mount : undefined;
    const to: NonNullable<IAutoMovieMotionHumanRise.IParams["to"]> =
      context.params.to ?? (sat?.astride === true ? (side ?? "left") : "front");

    // A seat got onto from one side only is got off on that side.
    if (sat?.astride === true && side !== undefined && to !== side)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: to,
        feasible: { kind: "alternatives", values: [side] },
        reason: `this seat is got off on its ${side}, the side it is mounted from, and the rise asks for ${to}`,
        fix: `leave \`to\` out, or give ${side}`,
      });
    const sideways: boolean = to !== "front";
    const near: AutoMovieHumanSide = to === "right" ? "right" : "left";
    const leader: AutoMovieHumanSide = sideways
      ? near === "left"
        ? "right"
        : "left"
      : "left";
    const follower: AutoMovieHumanSide = leader === "left" ? "right" : "left";

    // Where it stands afterwards: the pelvis clear of the seat, the feet at their rest places under it.
    const under: IAutoMovieMotionHumanFrame = {
      origin: { ...start, y: seated.floor(body, entry) },
      yaw,
    };
    const stood: IAutoMovieMotionHumanFrame = {
      origin: HumanFrame.point(
        under,
        sideways
          ? {
              x:
                (near === "left" ? 1 : -1) *
                (Math.abs(HumanFrame.local(under, entry.feet[near].ankle).x) +
                  HumanMount.BESIDE * m.thigh),
              y: 0,
              z: 0,
            }
          : { x: 0, y: 0, z: HumanMount.AHEAD * m.thigh },
      ),
      yaw,
    };
    const floorPlace = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      return HumanFrame.point(stood, {
        x: rest.x,
        y: m.ankleHeight,
        z: rest.z,
      });
    };
    const landing: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: floorPlace("left"),
      right: floorPlace("right"),
    };
    const goal: IAutoMovieVector3 = seated.socket(body, {
      root: stand.root(body, landing, yaw),
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });

    const duration: number =
      Math.min(4, 2 * (1 + 0.6 * Math.max(0, r - 1))) *
      AutoMovieMotionManner(context, context.params.manner).tempo;
    const seatOff: number = 0.15 * duration;
    const hop: number = sideways ? HumanMount.HOP * m.thigh : 0;
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...standUpright(body).joints,
    };
    const crossing: readonly [number, number] = sideways
      ? [0.3 * duration, 0.8 * duration]
      : [seatOff, 0.8 * duration];
    const frameAt = (t: number): Frame => {
      const across: number = minimumJerk.share(
        (t - crossing[0]) / (crossing[1] - crossing[0]),
      );
      const socket: IAutoMovieVector3 = {
        x: start.x + (goal.x - start.x) * across,
        y:
          start.y +
          hop * minimumJerk.share((t - seatOff) / (0.2 * duration)) +
          (goal.y - start.y - hop) *
            minimumJerk.share((t - 0.35 * duration) / (0.5 * duration)),
        z: start.z + (goal.z - start.z) * across,
      };
      const lean: number =
        t < 0.4 * duration
          ? pitch0 +
            (HumanMount.LEAN - pitch0) * minimumJerk.share(t / (0.4 * duration))
          : HumanMount.LEAN *
            (1 - minimumJerk.share((t - 0.4 * duration) / (0.6 * duration)));
      const tilt: IPlanFrameAtTilt = HumanTrunk.incline(relaxed, lean);
      return {
        root: seated.root(body, socket, { yaw, pitch: tilt.pitch, roll: 0 }),
        yaw,
        pitch: tilt.pitch,
        joints: tilt.joints,
      };
    };
    const span: readonly [number, number] = HumanMount.span(body);
    const stretch = (
      t: number,
      side: AutoMovieHumanSide,
      ankle: IAutoMovieVector3,
    ): number => {
      const frame: Frame = frameAt(t);
      return Vector3.length(
        Vector3.subtract(
          ankle,
          hipJoints(
            body,
            frame.root,
            humanPostureHeading({ ...frame, roll: 0 }),
            frame.joints.hips,
          )[side],
        ),
      );
    };

    // A leg reaches a place within its reachable band, or as far as it stands stretched in the quiet stance the getting off ends in, which holds it nearer straight than the band's edge.
    const standingReach: Record<AutoMovieHumanSide, number> = {
      left: Math.max(span[1], stretch(duration, "left", landing.left)),
      right: Math.max(span[1], stretch(duration, "right", landing.right)),
    };
    const reaches = (
      t: number,
      side: AutoMovieHumanSide,
      ankle: IAutoMovieVector3,
    ): boolean => {
      const d: number = stretch(t, side, ankle);
      return d >= span[0] && d <= standingReach[side];
    };
    const first = (
      after: number,
      before: number,
      found: (t: number) => boolean,
    ): number => {
      if (after < before && found(after)) return after;
      // Each foot searches on the same clock after its own release so that
      // two feet that first reach the floor on one tick land together.
      for (
        let tick: number = Math.floor(after * REACH_RATE) + 1;
        tick / REACH_RATE < before;
        ++tick
      ) {
        const t: number = tick / REACH_RATE;
        if (found(t)) return t;
      }
      return before;
    };

    // Where each foot is held until it leaves: its rest, or where it hangs.
    const holds: Record<AutoMovieHumanSide, HumanMount.IFoot> = {
      left: HumanMount.held(entry, "left"),
      right: HumanMount.held(entry, "right"),
    };

    // Both feet leave their rests while the seat still bears the body, the leader first: a leg cannot hold a fixed rest under a pelvis that travels. Each lands when its leg first reaches its floor place.
    const lands: number = first(
      0.3 * duration,
      duration,
      (t: number): boolean => reaches(t, leader, landing[leader]),
    );
    const leaves: number = (2 / 3) * seatOff;
    const flight: Record<AutoMovieHumanSide, readonly [number, number]> = {
      left: [0, 0],
      right: [0, 0],
    };
    flight[leader] = [seatOff / 3, lands];
    flight[follower] = [
      leaves,
      Math.min(
        duration,
        Math.max(
          leaves + 0.2 * duration,
          first(leaves, duration, (t: number): boolean =>
            reaches(t, follower, landing[follower]),
          ),
        ),
      ),
    ];
    const over: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw },
      {
        x: 0,
        y: HumanMount.OVER.above * m.thigh,
        z: -HumanMount.OVER.behind * m.thigh,
      },
    );

    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: seatOff / duration,
        support: { kind: "ground" },
      },
    ];
    for (const side of ["left", "right"] as const) {
      const part: PlanPart = `${side}Foot`;
      if (entry.feet[side].planted)
        contacts.push({
          part,
          kind: "plant",
          from: 0,
          to: flight[side][0] / duration,
          // The foot bears where the entry held it, a stirrup or a rest,
          // under its ball.
          support: HumanSupportFrame.contact(context, part),
          socket: "ball",
        });
      contacts.push({
        part,
        kind: "plant",
        from: flight[side][1] / duration,
        to: 1,
        // It lands on the floor under the seat, at that floor's height.
        support: { kind: "ground", height: under.origin.y },
      });
    }
    // The body getting off with its legs' goals at a second, before the hands.
    const lower = (t: number): IAutoMovieMotionHumanPosture => {
      const frame: Frame = frameAt(t);
      const standing: IAutoMovieMotionHumanPosture["limbs"] = legged(
        frame.root,
        landing,
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
        body,
        frame.root,
        humanPostureHeading({ ...frame, roll: 0 }),
        frame.joints.hips,
      );
      for (const side of ["left", "right"] as const) {
        const limb: PlanLowerLimb = `${side}Leg`;
        const down: IAutoMovieHumanLimbGoal = standing[limb]!;
        const [departs, arrives]: readonly [number, number] = flight[side];
        // A foot that bears nothing turns its toes down about its ball
        // within the unloaded ankle's range (`HumanMountPush.tip`): a held
        // foot as it sheds the body before it leaves its rest, a landed one
        // lowering its heel as it takes the body.
        if (t >= arrives)
          limbs[limb] = HumanMountPush.tip(
            body,
            side,
            hips[side],
            down,
            1 - AutoMovieMotionHumanFootRelax.load(t, Infinity, arrives),
          );
        else if (t <= departs)
          limbs[limb] = HumanMountPush.tip(
            body,
            side,
            hips[side],
            HumanMount.leg(body, side, holds[side], entry.feet[side].planted),
            entry.feet[side].planted
              ? 1 - AutoMovieMotionHumanFootRelax.load(t, departs)
              : 1,
          );
        else
          limbs[limb] = HumanMountPush.tip(
            body,
            side,
            hips[side],
            HumanMount.leg(
              body,
              side,
              HumanMount.between(
                holds[side],
                {
                  ankle: landing[side],
                  bend: down.bend,
                  yaw: yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
                },
                minimumJerk.share((t - departs) / (arrives - departs)),
                walk.LIFT * m.hipHeight,
                sideways && side === leader ? over : undefined,
              ),
              false,
            ),
            1,
          );
      }
      return { ...frame, roll: 0, limbs };
    };

    // The legs planned once over the getting off, from the legs it is
    // entered with (`courseHumanLegs`): every reader of the posture places
    // them at this course, so the thighs the hands rest on as they leave
    // are the thighs shown.
    // The flat palms and the thigh skin, read once for the getting off:
    // every second lays them on the thighs as they are
    // (`prepareSeatedPalms`).
    const palms: ReturnType<typeof prepareSeatedPalms> = prepareSeatedPalms(
      body,
      entry.posture,
    );
    const legs: courseHumanLegs.Seeded = courseHumanLegs({
      body,
      posture: lower,
      span: { start: 0, end: duration },
      instants: [seatOff, ...flight.left, ...flight.right].filter(
        (t: number): boolean => t > 0 && t < duration,
      ),
      entry: context.entry.pose,
    });

    // A leg in flight is keyed in joint space where its world course leaves
    // the leg's range (`HumanSwungLeg`): a course back over a saddle asks
    // the ankle past what the hip reaches.
    return HumanSwungLeg.plan(
      body,
      {
        duration,
        events: [
          { name: "seatOff", share: seatOff / duration },
          { name: "standing", share: 0.9 },
        ],
        contacts,
        base: { kind: "standing" },
        posture: (
          seconds: number,
          _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
          projection?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[3],
        ): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          return seated.arms(
            body,
            legs(lower(t), t),
            1 - minimumJerk.share(t / (0.3 * duration)),
            resolution,
            projection,
            palms,
          );
        },
      },
      (side: AutoMovieHumanSide): HumanSwungLeg.Swing | null =>
        flight[side][1] > flight[side][0] ? flight[side] : null,
    );
  }
}
