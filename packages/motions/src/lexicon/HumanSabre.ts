import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSabre,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanResponse } from "../skill/HumanResponse";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPresentation } from "./HumanMountedPresentation";
import { HumanSabreForm } from "./HumanSabreForm";
import { HumanSwordGuard } from "./HumanSwordGuard";
import { HumanUnseatPose } from "./HumanUnseatPose";
import { humanSabreCharge } from "./humanSabreCharge";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSabre>;

/**
 * A carriage's station in the seat frame: the grip's place, the way the blade
 * points and the way its true edge faces.
 */
interface IStation {
  /** The grip's place, metres. */
  grip: IAutoMovieVector3;

  /** The way the blade points, a unit vector. */
  axis: IAutoMovieVector3;

  /** The way the true edge faces. */
  edge: IAutoMovieVector3;
}

/** The alternatives of `StationsEntryItem`'s site. */
type StationsEntryItem = "slope" | "engage";

/**
 * Admit the carriage and the charge, lay both stations, then sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the refusals: a non-seated entry, a transition longer than a gallop stride, a cue with no instant inside the act, and a charge cued while the ride's own gait track does not show the gallop.
 * @evidence contracts/development/implementation.md#principled-implementation Stations are laid from the seated trunk's own right shoulder joint: the slope's by the arm's own segments, the engage's by the ox's row in arm lengths; the slope's loosened grip is the grip window's in-hand turn about the grip socket, the world turn that brings the blade's axis onto the shoulder's front taken into the hand's frame; the goal hangs the elbow from the body and keeps the arm's solution at the decisive station, as the sword strokes do; the charge starts at the cue plus `HumanResponse.latency` for a warned reaction; the horse's gait is the latest change on the ride's own gait track at or before the charge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the stations, the clock, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A charge before the gallop is refused, never delayed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One shoulder resolve, one turn and one decisive arm fit per plan; a sample reads one seat frame, the two rein contacts and the horse's frame for its shapes, and writes two arm goals, laid together by one course, the sabre arm clear of the horse.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool and the stations are shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the tool and the carrier reader.
 */
function planHumanSabre(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanSabre = context.params;
  const entered: IAutoMovieMotionHumanBase = context.entry.base;
  if (entered.kind !== "seated")
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: entered.kind,
      feasible: { kind: "alternatives", values: ["ride", "mounted"] },
      reason: `a sabre is carried from the saddle, and the performer is ${entered.kind}`,
      fix: "ride the horse first",
    });
  humanSabreCharge(params);
  const support = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
    support,
    params.on,
    params.frame ?? "seat",
  );
  const origin: IAutoMovieRigidTransform = carrier(context.start);
  const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    context.entry.posture,
    origin,
    HumanMountedFrame.LOCAL,
  );
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld(
    context,
    "right",
    params.prop,
    { tip: "point", edge: "edge" },
  );
  const goal = StrikingHeld.prepareGoal(context, tool, tool.length);
  const m = context.body.measure;

  // The stations in the seat frame, laid from the right shoulder joint where the seated trunk places it.
  const shoulder: IAutoMovieVector3 = poseBones(
    context.body,
    resolveHumanPosture.seeded(
      context.body,
      { ...local, limbs: {} },
      undefined,
      {},
      undefined,
      HumanBoneGroups.RIGHT_SHOULDER,
    ).pose,
    undefined,
    HumanBoneGroups.RIGHT_SHOULDER,
  ).get("rightUpperArm")!.worldPosition;
  const arm: number = m.upperArm + m.forearm;
  const row = (
    parts: IAutoMovieMotionHumanSword.IParts,
    yaw: number,
  ): IAutoMovieVector3 =>
    HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: -parts.out, y: parts.up, z: parts.forward },
    );
  // The charge: after the warned reaction, while galloping.
  let from: number | undefined;
  if (params.cue !== undefined) {
    const charge: number | undefined = context
      .cue(params.cue)
      .map((c) => c.seconds - context.start)
      .filter((t: number): boolean => t >= 0 && t <= params.duration)
      .sort((a: number, b: number): number => a - b)[0];
    if (charge === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cue",
        value: params.cue,
        feasible: null,
        reason: `the cue track ${params.cue} has no instant inside the act`,
        fix: "cue the charge inside the act",
      });
    const film: number = context.start + charge;
    // The horse's gait at the charge: the latest change on the ride's own gait track at or before it.
    const changes = (
      params.gaits === undefined ? [] : context.cue(params.gaits)
    )
      .filter((c) => c.seconds <= film)
      .sort((x, y) => x.seconds - y.seconds);
    const gait: string | undefined = changes.at(-1)?.name.split("-").at(-1);
    if (gait !== "gallop")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cue",
        value: film,
        feasible: null,
        reason: `the charge is cued at film second ${film.toFixed(3)} while the horse ${gait === undefined ? "shows no gait change on its track" : `goes at the ${gait}`}, before its gallop`,
        fix: "cue the charge on the gallop leg, and name the ride's gait track in gaits",
      });
    from =
      charge +
      HumanResponse.latency(
        context.skill,
        context.random("sabre"),
        "reaction",
        true,
        context.attributes,
      );
  }
  const share = (t: number): number =>
    params.carry === "engage"
      ? 1
      : from === undefined
        ? 0
        : minimumJerk.share(
            Math.min(1, Math.max(0, (t - from) / params.transition)),
          );
  // The engage: a station toward the target when one is named, read where it is as the engage completes and moved into the seat frame; straight ahead along the seat's forward otherwise.
  const engagedAt: number = context.start + (from ?? 0) + params.transition;
  const aimed: IAutoMovieRigidTransform = carrier(engagedAt);
  const ahead: IAutoMovieVector3 =
    params.target === undefined
      ? Vector3.add(shoulder, { x: 0, y: 0, z: HumanSabreForm.FAR })
      : Quaternion.rotateVector(
          Quaternion.inverse(aimed.rotation),
          Vector3.subtract(
            context.aim(params.target, engagedAt).point,
            aimed.position,
          ),
        );
  const engaged: HumanMountedPresentation.IStation =
    HumanMountedPresentation.station(
      m,
      local.root,
      "right",
      ahead,
      HumanSabreForm.REACHED * (m.upperArm + m.forearm + 0.5 * m.hand),
      "target",
    );
  // The engage: the ox's raised hilt (`HumanSwordGuard.GUARDS.ox`) about the shoulder turned toward the line, the point leading along it.
  const ox = HumanSwordGuard.GUARDS.ox;
  const line: IAutoMovieVector3 = Vector3.subtract(ahead, engaged.shoulder);
  const bearing: number = (Math.atan2(line.x, line.z) * 180) / Math.PI;
  const engageGrip: IAutoMovieVector3 = Vector3.add(
    engaged.shoulder,
    Vector3.scale(row(ox.hilt, bearing), arm),
  );
  const stations: Readonly<Record<StationsEntryItem, IStation>> = {
    // The upper arm hanging and the forearm level forward, the grip in front of the elbow, the blade upright and the edge forward: the carry, which the hand's grip holds at its own angle to the forearm.
    slope: {
      grip: HumanFrame.point(
        { origin: shoulder, yaw: local.yaw },
        { x: 0, y: -m.upperArm, z: m.forearm + 0.5 * m.hand },
      ),
      axis: { x: 0, y: 1, z: 0 },
      edge: HumanFrame.forward(local.yaw),
    },
    engage: {
      grip: engageGrip,
      axis: Vector3.normalize(Vector3.subtract(ahead, engageGrip)),
      edge: row(ox.edge, bearing),
    },
  };
  // Each station's grip within the arm's reach of its shoulder, read in closed form before the course is laid.
  const most: number = m.upperArm + m.forearm + 0.5 * m.hand;
  HumanBound.within(
    "carry",
    Vector3.distance(stations.slope.grip, shoulder),
    0,
    most,
  );
  HumanBound.within(
    "target",
    Vector3.distance(stations.engage.grip, engaged.shoulder),
    0,
    most,
  );
  const duration: number = params.duration;
  // The slope: the historical slope rests the back of the blade on the right shoulder with the grip loosened, the hilt pivoting in the palm between the thumb and the fingers. The hand holds the carry, and the blade turns in the hand about the grip until its back lies along the front of the shoulder; it turns back as the fingers close to the full grip over the first half of the charge's transition, before the engage.
  const rested: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(
      Vector3.add(shoulder, { x: 0, y: 0, z: HumanSabreForm.SKIN }),
      stations.slope.grip,
    ),
  );
  const carried: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
    StrikingHeld.hand(
      tool,
      tool.length,
      stations.slope.grip,
      stations.slope.axis,
      stations.slope.edge,
    );
  const pivoted: number =
    (Math.acos(
      Math.max(-1, Math.min(1, Vector3.dot(stations.slope.axis, rested))),
    ) *
      180) /
    Math.PI;
  // The world turn about the grip, taken into the hand's own frame, where the grip's in-hand motion is given.
  const loosened: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(carried.rotation),
    Quaternion.multiply(
      Quaternion.fromAxisAngle(
        Vector3.cross(stations.slope.axis, rested),
        pivoted,
      ),
      carried.rotation,
    ),
  );
  const socket: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    "right",
    "grip",
  ).point;
  const loose = (t: number): number =>
    minimumJerk.share(
      Math.min(1, t / Math.min(HumanSabreForm.REACH, duration)),
    ) *
    (from === undefined
      ? 1
      : 1 -
        minimumJerk.share(
          Math.min(1, Math.max(0, (t - from) / (params.transition / 2))),
        ));
  const inHand = (at: number): IAutoMovieRigidTransform => {
    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
      Quaternion.identity(),
      loosened,
      loose(at * duration),
    );
    return {
      rotation,
      position: Vector3.subtract(
        socket,
        Quaternion.rotateVector(rotation, socket),
      ),
    };
  };

  // The arm's own solution at the decisive station, the engage when a charge comes and the slope otherwise: the reference every goal keeps from the arrival on, as the sword strokes keep theirs (`StrikingBlade`).
  const anchored: IAutoMovieHumanLimbReference =
    ((): IAutoMovieHumanLimbReference => {
      const at: IStation =
        from === undefined ? stations.slope : stations.engage;
      const stood: IAutoMovieMotionHumanPosture = StrikingBlade.turned(
        local,
        from === undefined ? 0 : engaged.turn,
      );
      return HumanLimbFit.reference(
        resolveHumanPosture.seeded(context.body, {
          ...stood,
          limbs: {
            ...stood.limbs,
            rightArm: {
              ...goal(
                StrikingHeld.hand(tool, tool.length, at.grip, at.axis, at.edge),
                { x: 0, y: 0, z: 0 },
              ),
              bend: AutoMovieMotionHumanBend.hang(context.body, stood, "right"),
            },
          },
        }).pose,
        "rightArm",
      );
    })();
  const windows: IAutoMovieMotionHumanContactWindow[] = [
    ...StrikingHeld.grips(tool).map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({ ...window, inHand }),
    ),
    {
      part: "leftHand",
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: params.on },
    },
  ];
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: humanSabreCharge.events(params, from),

    contacts: windows,
    base: entered,
    holds: StrikingHeld.holds(context, tool),
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const film: number = context.start + t;
      const s: number = share(t);
      const grip: IAutoMovieVector3 = Vector3.lerp(
        stations.slope.grip,
        stations.engage.grip,
        s,
      );
      const axis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.lerp(stations.slope.axis, stations.engage.axis, s),
      );
      const edge: IAutoMovieVector3 = Vector3.normalize(
        Vector3.lerp(stations.slope.edge, stations.engage.edge, s),
      );
      // The stations are laid in the seat frame and carried into the world before the hand is placed, so the goal is the world's own.
      const now: IAutoMovieRigidTransform = carrier(film);
      const toWorld = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(now.position, Quaternion.rotateVector(now.rotation, p));
      const turn = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(now.rotation, v);
      // The trunk turns toward a target off the heading by the engage's share.
      const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        StrikingBlade.turned(local, s * engaged.turn),
        HumanMountedFrame.LOCAL,
        now,
      );
      const frame = StrikingHeld.hand(
        tool,
        tool.length,
        toWorld(grip),
        turn(axis),
        turn(edge),
      );
      // The goal as the sword strokes give it (`StrikingBlade`): the elbow hung from the body, kept on the arm's own solution at the decisive station from the arrival on.
      shown.limbs = {
        ...shown.limbs,
        rightArm: {
          ...goal(frame, { x: 0, y: 0, z: 0 }),
          clearExternal: (support.prop.shapes ?? []).map(
            (
              shape: IAutoMovieMotionHumanColliders.IExternal["shapes"][number],
            ): IAutoMovieMotionHumanColliders.IExternal => ({
              subject: params.on,
              part: shape.id,
              pose: support.frame(film),
              shapes: [shape],
            }),
          ),
          bend: AutoMovieMotionHumanBend.hang(context.body, shown, "right"),
          reference: {
            ...anchored,
            weight: Math.min(1, t / Math.min(HumanSabreForm.REACH, duration)),
          },
        },
      };
      // The bridle hand: both reins at their middle.
      const reins: IAutoMovieVector3 = Vector3.lerp(
        HumanMountedFrame.contact(support, "leftRein", film),
        HumanMountedFrame.contact(support, "rightRein", film),
        0.5,
      );
      return HumanUnseatPose.reach(shown, "left", reins, 1);
    },
  };

  // Both arms are laid as planned courses on these goals, the reach to the bridle and the sabre's carriage over the first `REACH` seconds and the hold after, so no instant refits them afresh.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: Math.min(HumanSabreForm.REACH, duration),
    relax: duration,
    end: duration,
  };
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (local: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        context,
        plan: local,
        side: "right",
        span,
        with: [
          {
            side: "left",
            span,
          },
        ],
      }),
  );
}

/**
 * A sabre's slope and engage from the saddle (`IAutoMovieMotionHumanSabre`):
 * carried on the seat contact, the right hand closes on the held sabre's grip
 * and is placed by the sabre's own geometry (`StrikingHeld`) at stations laid
 * from the right shoulder joint. At the slope the upper arm hangs and the
 * forearm lies level forward, the hand in front of the elbow holding the blade
 * upright with the edge forward, and the grip is loosened: the blade turns in
 * the hand about the grip (the grip window's in-hand motion) until its back
 * rests on the front of the right shoulder, point up and a little back, edge
 * forward, as the historical slope carries it with the hilt pivoting between
 * the thumb and the fingers; at the charge the fingers close back to the full
 * grip and the hand comes to the engage, the ox's raised hilt about the
 * shoulder turned toward the line with the point leading along it. The left
 * hand holds both reins at their middle. A charge cue brings the slope to the
 * engage after the rider's warned reaction over `transition` seconds by a
 * minimum-jerk path in the seat frame; the grip stays closed throughout.
 * Register `HumanSabre` to use it.
 */
export const HumanSabre: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSabre> =
  {
    name: "sabre",
    interrupts: { any: [{ window: [0, 1], kind: "inertialize", entry: 0 }] },
    plan: planHumanSabre,
  };
