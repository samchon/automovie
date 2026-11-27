import {Quaternion, Vector3, AutoMovieEngineMotionSampling} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
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
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { standUpright } from "../../actions/internal/standUpright";
import { walk } from "../../gait/internal/walk";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionHumanArmChain } from "../../compose/internal/AutoMovieMotionHumanArmChain";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { courseHumanLegs } from "../../compose/internal/courseHumanLegs";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { prepareSeatedPalms } from "../../everyday/internal/prepareSeatedPalms";
import { seated } from "../../everyday/internal/seated";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanMount } from "./HumanMount";
import { HumanMountOffSupports } from "./HumanMountOffSupports";
import { HumanMountPush } from "./HumanMountPush";
import { HumanSwungLeg } from "./HumanSwungLeg";
import { prepareMountOffFloor } from "./prepareMountOffFloor";

/*
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
  /*
   * Plan getting off a seat.
   * Parameter context: The rise's context.
   * Parameter entered: The seat socket where it rests at entry, world metres.
   * Parameter r: The socket's height as a share of the popliteal height.
   * Returns: The plan, with the rise's events `seatOff` and `standing`.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRise.IParams>,
    entered: IAutoMovieVector3,
    r: number,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry: IAutoMovieMotionHumanEntryState = context.entry;
    const pitch0: number = entry.posture.pitch;
    const sat: IAutoMovieMotionHumanBase.ISeat | undefined =
      entry.base.kind === "seated" ? entry.base.seat : undefined;
    const side: AutoMovieHumanSide | undefined =
      sat?.mount === "left" || sat?.mount === "right" ? sat.mount : undefined;
    const to: NonNullable<IAutoMovieMotionHumanRise.IParams["to"]> =
      context.params.to ?? (sat?.astride === true ? (side ?? "left") : "front");

    // A seat got onto from one side only is got off on that side.
    if (sat?.astride === true && side !== undefined && to !== side)
      throw new AutoMovieMotionHumanRefusal({
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
    const duration: number =
      Math.min(4, 2 * (1 + 0.6 * Math.max(0, r - 1))) *
      AutoMovieMotionManner(context, context.params.manner).tempo;
    const seatOff: number = 0.15 * duration;
    const footOff = (side: AutoMovieHumanSide): number =>
      side === leader ? seatOff / 3 : (2 / 3) * seatOff;
    const seat: IAutoMovieMotionHumanEntryState.ISupport | undefined =
      entry.supports.find(
        (bearing): boolean => bearing.part === "seat" && bearing.kind === "seat",
      );
    const carriedSeat: HumanMountOffSupports.IFrame | undefined =
      sat?.astride === true && seat?.support.kind === "prop"
        ? HumanMountOffSupports.material(
            context.prop(seat.support.subject),
            seat.support.point,
            context.start,
            seatOff,
            {
              position: entry.pose.root?.translation ?? entry.posture.root,
              rotation:
                entry.pose.root?.rotation ?? humanPostureHeading(entry.posture),
            },
          )
        : undefined;
    const exitHeading: ReturnType<typeof humanPostureHeading.angles> | undefined =
      carriedSeat === undefined
        ? undefined
        : humanPostureHeading.angles(carriedSeat.end.rotation);
    const yaw: number = exitHeading?.yaw ?? entry.posture.yaw;
    const start: IAutoMovieVector3 =
      carriedSeat === undefined || exitHeading === undefined
        ? entered
        : seated.socket(body, {
            ...entry.posture,
            ...exitHeading,
            root: carriedSeat.end.position,
          });
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );

    const carriedFeet: ReturnType<typeof HumanMountOffSupports.feet> =
      sat?.astride === true ? HumanMountOffSupports.feet(context, footOff) : {};

    // Where it stands afterwards: the pelvis clear of the seat, the feet at their rest places under it.
    const under: IAutoMovieMotionHumanFrame = {
      origin: { ...start, y: seated.floor(body, entry) },
      yaw,
    };
    const nearAnkle: IAutoMovieVector3 =
      carriedFeet[near]?.end.point ?? entry.feet[near].ankle;
    const stood: IAutoMovieMotionHumanFrame = {
      origin: HumanFrame.point(
        under,
        sideways
          ? {
              x:
                (near === "left" ? 1 : -1) *
                (Math.abs(HumanFrame.local(under, nearAnkle).x) +
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

    const handRelease: number = 0.3 * duration;
    const standing: number = 0.9 * duration;
    const hop: number = sideways ? HumanMount.HOP * m.thigh : 0;
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...standUpright(body).joints,
    };
    const crossing: readonly [number, number] = sideways
      ? [0.3 * duration, 0.8 * duration]
      : [seatOff, 0.8 * duration];
    const enteredJoints: IAutoMovieMotionHumanPosture["joints"] = {};
    if (carriedSeat !== undefined)
      for (const joint of entry.pose.joints)
        enteredJoints[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    const leanAt: number = 0.4 * duration;
    const seatMotion: HumanMountOffSupports.Offset | undefined =
      carriedSeat === undefined
        ? undefined
        : HumanMountOffSupports.departure(carriedSeat, leanAt - seatOff);
    const peak: IPlanFrameAtTilt = HumanTrunk.incline(relaxed, HumanMount.LEAN);
    const trunk = carriedSeat === undefined
      ? []
      : TRUNK.map((bone: AutoMovieHumanoidBone) => ({
          bone,
          read: blendHumanJoint.between(
            body,
            bone,
            enteredJoints[bone] ?? [0, 0, 0],
            peak.joints[bone] ?? [0, 0, 0],
          ),
        }));
    const peakRotation: IAutoMovieQuaternion = humanPostureHeading({
      yaw,
      pitch: peak.pitch,
      roll: 0,
    });
    const frameAt = (t: number): Frame => {
      if (carriedSeat !== undefined && t <= seatOff) {
        const frame: IAutoMovieRigidTransform = carriedSeat.at(t);
        return {
          root: frame.position,
          ...humanPostureHeading.angles(frame.rotation),
          joints: enteredJoints,
        };
      }
      const across: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (t - crossing[0]) / (crossing[1] - crossing[0]),
      );
      const socket: IAutoMovieVector3 = {
        x: start.x + (goal.x - start.x) * across,
        y:
          start.y +
          hop * AutoMovieEngineMotionSampling.minimumJerkShare((t - seatOff) / (0.2 * duration)) +
          (goal.y - start.y - hop) *
            AutoMovieEngineMotionSampling.minimumJerkShare((t - 0.35 * duration) / (0.5 * duration)),
        z: start.z + (goal.z - start.z) * across,
      };
      if (carriedSeat !== undefined && t < leanAt) {
        const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          (t - seatOff) / (leanAt - seatOff),
        );
        const rotation: IAutoMovieQuaternion = Quaternion.slerp(
          carriedSeat.end.rotation,
          peakRotation,
          share,
        );
        const root: IAutoMovieVector3 = seated.root(
          body,
          socket,
          humanPostureHeading.angles(rotation),
        );
        const moving: IAutoMovieRigidTransform | undefined = seatMotion?.(
          t - seatOff,
        );
        const heading: ReturnType<typeof humanPostureHeading.angles> =
          humanPostureHeading.angles(
            moving === undefined
              ? rotation
              : Quaternion.multiply(moving.rotation, rotation),
          );
        const joints: IAutoMovieMotionHumanPosture["joints"] = { ...relaxed };
        for (const { bone, read } of trunk) joints[bone] = read(share);
        return {
          root: moving === undefined ? root : Vector3.add(root, moving.position),
          ...heading,
          joints,
        };
      }
      const lean: number =
        t < leanAt
          ? pitch0 + (HumanMount.LEAN - pitch0) * AutoMovieEngineMotionSampling.minimumJerkShare(t / leanAt)
          : HumanMount.LEAN *
            (1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - leanAt) / (0.6 * duration)));
      const tilt: IPlanFrameAtTilt = HumanTrunk.incline(relaxed, lean);
      return {
        root: seated.root(body, socket, { yaw, pitch: tilt.pitch, roll: 0 }),
        yaw,
        pitch: tilt.pitch,
        roll: 0,
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
            humanPostureHeading(frame),
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
    const leaving = (side: AutoMovieHumanSide): HumanMount.IFoot => {
      const held: HumanMountOffSupports.IFoot | undefined = carriedFeet[side];
      return held === undefined
        ? HumanMount.held(entry, side)
        : {
            ankle: held.end.point,
            bend: held.end.bend,
            yaw: HumanFoot.heading(held.end.rotation),
          };
    };
    const holds: Record<AutoMovieHumanSide, HumanMount.IFoot> = {
      left: leaving("left"),
      right: leaving("right"),
    };

    // Both feet leave their rests while the seat still bears the body, the leader first: a leg cannot hold a fixed rest under a pelvis that travels. Each lands when its leg first reaches its floor place.
    const lands: number = first(
      0.3 * duration,
      duration,
      (t: number): boolean => reaches(t, leader, landing[leader]),
    );
    const leaves: number = footOff(follower);
    const flight: Record<AutoMovieHumanSide, readonly [number, number]> = {
      left: [0, 0],
      right: [0, 0],
    };
    flight[leader] = [footOff(leader), lands];
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
    const lastLanding: number = Math.max(flight.left[1], flight.right[1]);
    const footMotion: Partial<
      Record<AutoMovieHumanSide, HumanMountOffSupports.Offset>
    > = {};
    for (const side of ["left", "right"] as const) {
      const held: HumanMountOffSupports.IFoot | undefined = carriedFeet[side];
      if (held === undefined) continue;
      const [off, on]: readonly [number, number] = flight[side];
      const moving: HumanMountOffSupports.Offset | undefined =
        HumanMountOffSupports.departure(held, on - off);
      if (moving !== undefined) footMotion[side] = moving;
    }
    const over: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw },
      {
        x: 0,
        y: HumanMount.OVER.above * m.thigh,
        z: -HumanMount.OVER.behind * m.thigh,
      },
    );

    const contacts: IAutoMovieMotionHumanContactWindow[] =
      seat === undefined ? [] : [{ ...seat, from: 0, to: seatOff / duration }];
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
    const lower = (
      t: number,
      plants?: Readonly<Record<AutoMovieHumanSide, prepareMountOffFloor.Read>>,
    ): IAutoMovieMotionHumanPosture => {
      const frame: Frame = frameAt(t);
      const needsGoal: boolean = plants === undefined || t < lastLanding;
      const standing: IAutoMovieMotionHumanPosture["limbs"] | undefined =
        needsGoal ? legged(frame.root, landing) : undefined;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...frame.joints };
      let hips: Record<AutoMovieHumanSide, IAutoMovieVector3> | undefined;
      for (const side of ["left", "right"] as const) {
        const limb: PlanLowerLimb = `${side}Leg`;
        const [departs, arrives]: readonly [number, number] = flight[side];
        const carried: HumanMountOffSupports.IFoot | undefined = carriedFeet[side];
        if (carried !== undefined && t <= departs) {
          limbs[limb] = carried.at(t);
          continue;
        }
        const plant: prepareMountOffFloor.IPlaced | undefined =
          t >= arrives ? plants?.[side](t) : undefined;
        if (plant !== undefined) {
          if (plant.goal !== undefined) limbs[limb] = plant.goal;
          Object.assign(joints, plant.joints);
          continue;
        }
        const down: IAutoMovieHumanLimbGoal = standing![limb]!;
        // Once loaded, the foot takes the flat goal: the heel tip's zero
        // share would return the same goal without changing any placement.
        if (t > arrives) {
          limbs[limb] = down;
          continue;
        }
        hips ??= hipJoints(
          body,
          frame.root,
          humanPostureHeading(frame),
          frame.joints.hips,
        );
        const hip: IAutoMovieVector3 = hips[side];
        // A foot that bears nothing turns its toes down about its ball
        // within the unloaded ankle's range (`HumanMountPush.tip`). A held
        // foot eases into its flight pose while the seat bears the body. A
        // landed foot lowers its heel as it takes the body.
        if (t === arrives)
          limbs[limb] = HumanMountPush.tip(body, side, hip, down, 1);
        else if (t <= departs)
          limbs[limb] = HumanMountPush.tip(
            body,
            side,
            hip,
            HumanMount.leg(body, side, holds[side], entry.feet[side].planted),
            entry.feet[side].planted
              ? AutoMovieEngineMotionSampling.minimumJerkShare(t / departs)
              : 1,
          );
        else {
          const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
            (t - departs) / (arrives - departs),
          );
          const flightGoal: IAutoMovieHumanLimbGoal = HumanMount.leg(
            body,
            side,
            HumanMount.between(
              holds[side],
              {
                ankle: landing[side],
                bend: down.bend,
                yaw: yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
              },
              share,
              walk.LIFT * m.hipHeight,
              sideways && side === leader ? over : undefined,
            ),
            false,
          );
          const tipped: IAutoMovieHumanLimbGoal = HumanMountPush.tip(
            body,
            side,
            hip,
            flightGoal,
            1,
          );
          if (carried === undefined) {
            limbs[limb] = tipped;
            continue;
          }
          const ankle: IAutoMovieVector3 = Vector3.lerp(
            flightGoal.point,
            tipped.point,
            share,
          );
          const rotation: IAutoMovieQuaternion = Quaternion.slerp(
            carried.end.rotation,
            tipped.rotation!,
            share,
          );
          const moving: IAutoMovieRigidTransform | undefined = footMotion[
            side
          ]?.(t - departs);
          const point: IAutoMovieVector3 = moving === undefined
            ? ankle
            : Vector3.add(ankle, moving.position);
          limbs[limb] = {
            ...tipped,
            point,
            rotation:
              moving === undefined
                ? rotation
                : Quaternion.multiply(moving.rotation, rotation),
            bend:
              moving === undefined
                ? tipped.bend
                : Vector3.add(
                    point,
                    Quaternion.rotateVector(
                      moving.rotation,
                      Vector3.subtract(tipped.bend, ankle),
                    ),
                  ),
          };
        }
      }
      return { ...frame, limbs, joints };
    };

    // Prepare the leg goals and their joint-space fallback before a palm
    // observes either thigh.
    const breaks: readonly number[] = [seatOff, ...flight.left, ...flight.right];
    // A second on both stance clocks starts from one lower posture. The
    // stance readers retain only their fitted knots.
    const samples: Map<number, IAutoMovieMotionHumanPosture> = new Map();
    const ground = (t: number): IAutoMovieMotionHumanPosture => {
      let at: IAutoMovieMotionHumanPosture | undefined = samples.get(t);
      if (at === undefined) {
        at = lower(t);
        samples.set(t, at);
      }
      return at;
    };
    const plants: Readonly<Record<AutoMovieHumanSide, prepareMountOffFloor.Read>> = {
      left: prepareMountOffFloor(body, "left", flight.left[1], duration, ground),
      right: prepareMountOffFloor(body, "right", flight.right[1], duration, ground),
    };
    samples.clear();
    const flying = (t: number): IAutoMovieMotionHumanPosture => {
      const at: IAutoMovieMotionHumanPosture = lower(t, plants);
      for (const side of ["left", "right"] as const) {
        const [off, on]: readonly [number, number] = flight[side];
        if (t >= on || (carriedFeet[side] !== undefined && t < off))
          delete at.limbs[`${side}Leg`];
      }
      return at;
    };
    const legs: courseHumanLegs.Seeded = courseHumanLegs({
      body,
      posture: flying,
      span: { start: 0, end: lastLanding },
      instants: breaks.filter(
        (t: number): boolean => t > 0 && t < lastLanding,
      ),
      entry: context.entry.pose,
    });
    const swung: IAutoMovieMotionHumanActionPlan = HumanSwungLeg.plan(
      body,
      {
        duration,
        events: [
          { name: "seatOff", share: seatOff / duration },
          { name: "standing", share: standing / duration },
        ],
        contacts,
        base: { kind: "standing" },
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const at: IAutoMovieMotionHumanPosture = lower(t, plants);
          if (t >= lastLanding) return at;
          const coursed: IAutoMovieMotionHumanPosture = legs(at, t);
          for (const side of ["left", "right"] as const) {
            const limb: PlanLowerLimb = `${side}Leg`;
            const [off, on]: readonly [number, number] = flight[side];
            if (
              (t >= on || (carriedFeet[side] !== undefined && t <= off)) &&
              at.limbs[limb] !== undefined
            )
              coursed.limbs[limb] = at.limbs[limb];
          }
          return coursed;
        },
      },
      (side: AutoMovieHumanSide): HumanSwungLeg.Swing | null =>
        flight[side][1] > flight[side][0] ? flight[side] : null,
    );

    // The hands hang outside the displayed swing until the feet land. Find
    // their carriage once, over the flight and its support changes, and ease
    // it in before the first foot leaves and out as the body stands.
    const firstRelease: number = flight[leader][0];
    const settle: number =
      lastLanding < duration ? Math.max(standing, lastLanding) : standing;
    const phases: readonly number[] = [
      ...new Set([
        ...AutoMovieEngineMotionSampling.windowSampleTimes(
          firstRelease,
          lastLanding,
          HumanArmSwing.PHASES / (lastLanding - firstRelease),
        ),
        ...breaks,
        handRelease,
      ]),
    ];
    const carried: ReturnType<typeof HumanArmSwing.carriage> =
      HumanArmSwing.carriage(body, phases, swung.posture, ["left", "right"]);
    const palms: ReturnType<typeof prepareSeatedPalms> = prepareSeatedPalms(
      body,
      entry.posture,
    );
    const hung = (
      t: number,
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const share: number =
        AutoMovieEngineMotionSampling.minimumJerkShare(t / firstRelease) *
        (1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - settle) / (duration - settle)));
      return share === 0
        ? posture
        : HumanArmSwing.carry(posture, {
            left: share * carried.left,
            right: share * carried.right,
          });
    };
    // Release the hand onto the direct hanging joints at the final knot.
    // A wrist fitted up to that instant can approach it with another elbow.
    const arms: ReturnType<typeof AutoMovieMotionHumanArmChain.continued> =
      AutoMovieMotionHumanArmChain.continued(
        body,
        handRelease,
        (t: number): IAutoMovieMotionHumanPosture =>
          seated.arms(
            body,
            hung(t, swung.posture(t)),
            1 - AutoMovieEngineMotionSampling.minimumJerkShare(t / handRelease),
            undefined,
            undefined,
            palms,
          ),
        ["left", "right"],
        "angles",
      );
    return {
      ...swung,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = swung.posture(t);
        if (
          channels !== undefined &&
          !channels.some(
            (channel): boolean =>
              channel === "leftArm" ||
              channel === "rightArm" ||
              channel === "leftHand" ||
              channel === "rightHand",
          )
        )
          return posture;
        const hanging: IAutoMovieMotionHumanPosture = hung(t, posture);
        return t < handRelease ? arms(t, hanging) : hanging;
      },
    };
  }
}

/*
 * Samples per second of the action clock used to find floor reach.
 */
const REACH_RATE: number = 60;
/*
 * Trunk joints carried unchanged on the seat and then released into the lean.
 */
const TRUNK: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "upperChest",
];

/*
 * The alternatives of `Frame2`'s site.
 */
type Frame2 = "root" | "yaw" | "pitch" | "roll" | "joints";

/*
 * Where the pelvis is at an instant of getting off: the root, the heading, the
 * pelvis pitch and the set joints.
 */
type Frame = Pick<IAutoMovieMotionHumanPosture, Frame2>;

/*
 * The alternatives of `PlanLowerLimb`'s site.
 */
type PlanLowerLimb = "leftLeg" | "rightLeg";

/*
 * The alternatives of `PlanPart`'s site.
 */
type PlanPart = "leftFoot" | "rightFoot";

/*
 * The record of `IPlanFrameAtTilt`'s site.
 */
type IPlanFrameAtTilt = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};
