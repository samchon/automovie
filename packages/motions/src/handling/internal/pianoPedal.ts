import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPianoPedal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { pianoPedalStroke } from "./pianoPedalStroke";
import { readPianoPedal } from "./readPianoPedal";
import * as PianoPedalData from "./PianoPedalData";

/*
 * Stage the right forefoot on an upright piano's damper pedal, depress and
 * release it on its own clock, and return to the original floor plant. Hannah
 * Creviston describes keeping the heel grounded and playing the damper with the
 * ball of the foot in Yamaha's piano pedaling guide
 * (https://hub.yamaha.com/music-educators/instruments/piano/piano-pedagogy-pedaling/).
 * MIDI Control Change 64 provides separate damper timing from note events. See
 * https://midi.org/midi-1-0-control-change-messages.
 */
export const pianoPedal: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPianoPedal> =
  {
    name: "pianoPedal",
    interrupts: {},
    plan,
  };

/*
 * Resolve a seated right-foot path and independent pedal travel.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoPedal>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params } = context;
  const support: IAutoMovieMotionHumanEntryState.ISupport | undefined =
    entry.supports.find(
      (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        s.part === "rightFoot" && s.kind === "plant",
    );
  if (
    entry.base.kind !== "seated" ||
    !entry.feet.left.planted ||
    !entry.feet.right.planted ||
    support === undefined ||
    support.support.kind !== "ground" ||
    entry.posture.rotation !== undefined ||
    context.carrier !== undefined
  )
    refuse(
      "base",
      entry.base.kind,
      "enter seated with both feet planted and the right foot on the ground",
    );

  const duration: number = params.duration;
  const presses: Press[] = params.presses.map(
    (press: Press): Press => ({ ...press }),
  );
  pianoPedalStroke.admit(presses, duration);
  const first: number = presses[0]!.from;
  const last: number = presses[presses.length - 1]!.to;
  const pedal: ReturnType<typeof readPianoPedal> = readPianoPedal(context);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    entry.pose,
  );
  const foot: IAutoMovieResolvedBone = bones.get("rightFoot")!;
  const bend: IAutoMovieVector3 = bones.get("rightLowerLeg")!.worldPosition;
  const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    bones,
    "right",
  );
  const floor: number = sockets[0]!.point.y;
  if (
    sockets.some(
      (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
        Math.abs(socket.point.y - floor) > HumanFoot.BEARING,
    )
  )
    refuse(
      "base",
      entry.base.kind,
      "start with the right sole flat on the floor",
    );
  const heelOffset: IAutoMovieVector3 = HumanFoot.offset(body, "right", "heel");
  const ballOffset: IAutoMovieVector3 = HumanFoot.offset(body, "right", "ball");
  const span: IAutoMovieVector3 = Vector3.subtract(ballOffset, heelOffset);
  const radius: number = Math.hypot(span.y, span.z);
  const lift: number = pedal.point.y - floor;
  if (!(0 < lift && lift < radius) || span.z <= 0)
    refuse(
      "prop",
      params.prop,
      "align the pedal above the heel and within the forefoot's rocking range",
    );

  const forward: IAutoMovieVector3 = Quaternion.rotateVector(pedal.rotation, {
    x: 0,
    y: 0,
    z: -1,
  });
  const heading: number = (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
  const phase: number = Math.atan2(span.y, span.z);

  const restRotation: IAutoMovieQuaternion = HumanFoot.rotation(
    heading,
    ((Math.asin(lift / radius) - phase) * 180) / Math.PI,
  );
  // Put the ball near the player-facing edge so the rear portion of the
  // tilted sole clears the plate. A press moves the ball inward as it drops.
  const rim: IAutoMovieVector3 = Vector3.subtract(
    pedal.point,
    Vector3.scale(
      forward,
      pedal.depth / 2 - Math.min(HumanFoot.BEARING, pedal.depth / 4),
    ),
  );
  const heel: IAutoMovieVector3 = Vector3.subtract(
    rim,
    Quaternion.rotateVector(restRotation, span),
  );
  const heelToPivot: IAutoMovieVector3 = Vector3.subtract(pedal.pivot, heel);

  /*
   * Intersect the ball's arc around the fixed heel with the rotated plate.
   */
  const placed = (degrees: number): IAutoMovieMotionHumanFoot.IPlacement => {
    const angle: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      pedal.axis,
      degrees,
    );
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(angle, {
      x: 0,
      y: 1,
      z: 0,
    });
    const height: number = Vector3.dot(heelToPivot, normal);
    if (!(Math.abs(height) < radius))
      refuse(
        "prop",
        params.prop,
        "place the piano so the foot can follow the full pedal arc",
      );
    const pitch: number =
      degrees + ((Math.asin(height / radius) - phase) * 180) / Math.PI;
    return HumanFoot.pivot(body, "right", "heel", heel, heading, pitch);
  };
  const staged: IAutoMovieMotionHumanFoot.IPlacement = placed(0);
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.still(
    duration,
    entry.posture,
    entry.supports
      .filter(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.part !== "rightFoot",
      )
      .map(
        (
          s: IAutoMovieMotionHumanEntryState.ISupport,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...s,
          from: 0,
          to: 1,
        }),
      ),
  );

  /*
   * Raise the shoe over the floor and plate during approach and recovery.
   */
  const move = (progress: number): IAutoMovieMotionHumanFoot.IPlacement => {
    const blend: number = AutoMovieEngineMotionSampling.minimumJerkShare(progress);
    const ankle: IAutoMovieVector3 = Vector3.lerp(
      foot.worldPosition,
      staged.ankle,
      blend,
    );
    return {
      ankle: {
        ...ankle,
        y: ankle.y + PianoPedalData.SWING_CLEARANCE * 4 * blend * (1 - blend),
      },
      rotation: Quaternion.slerp(foot.worldRotation, staged.rotation, blend),
    };
  };

  /*
   * Replace just the right leg on the existing seated posture.
   */
  const withFoot = (
    held: IAutoMovieMotionHumanPosture,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    grounded: boolean,
  ): IAutoMovieMotionHumanPosture => {
    const leg: IAutoMovieHumanLimbGoal = {
      point: placement.ankle,
      rotation: placement.rotation,
      bend,
      ...(grounded ? { planted: true, contact: heelOffset } : {}),
    };
    return {
      ...held,
      joints: { ...held.joints, rightToes: [0, 0, 0] },
      limbs: { ...held.limbs, rightLeg: leg },
    };
  };

  // Check the realised fit at three angles of the shared rocker.
  for (const degrees of [0, pedal.travel / 2, pedal.travel]) {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(
          body,
          withFoot(entry.posture, placed(degrees), true),
        ),
      );
    const actual: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      resolved,
      "right",
    );
    const untilted: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(pedal.axis, -degrees),
      Vector3.subtract(actual[1]!.point, pedal.pivot),
    );
    const onPlate: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(pedal.rotation),
      Vector3.subtract(untilted, Vector3.subtract(pedal.point, pedal.pivot)),
    );
    if (
      Math.abs(onPlate.x) > pedal.width / 2 ||
      Math.abs(onPlate.z) > pedal.depth / 2 ||
      Math.abs(onPlate.y) > HumanFoot.BEARING ||
      Vector3.length(Vector3.subtract(actual[0]!.point, heel)) >
        HumanFoot.BEARING
    )
      refuse(
        "prop",
        params.prop,
        "move the bench so the right forefoot can meet the pedal with its heel grounded",
      );
  }

  // The approach and recovery share the same raised path in reverse.
  for (const progress of [0.25, 0.5, 0.75]) {
    const target: IAutoMovieMotionHumanFoot.IPlacement = move(progress);
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(body, withFoot(entry.posture, target, false)),
      );
    const actual: IAutoMovieVector3 = resolved.get("rightFoot")!.worldPosition;
    if (
      Vector3.length(Vector3.subtract(actual, target.ankle)) >
        HumanFoot.BEARING ||
      HumanFoot.sockets(body, resolved, "right").some(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.point.y < floor - HumanFoot.BEARING,
      )
    )
      refuse(
        "prop",
        params.prop,
        "move the bench so the right foot can reach the pedal above the floor",
      );
  }

  return {
    duration,
    base: entry.base,
    channels: ["rightLeg"],
    contacts: [
      ...base.contacts,
      { ...support, from: 0, to: 0 },
      {
        ...support,
        kind: "pivot",
        region: "heelRight",
        from: first / duration,
        to: last / duration,
      },
      { ...support, from: 1, to: 1 },
    ],
    events: presses.flatMap(
      (press: Press, i: number): IAutoMovieMotionEvent[] => [
        { name: `pedalDown${i + 1}`, share: press.at / duration },
        { name: `pedalUp${i + 1}`, share: press.to / duration },
      ],
    ),
    drives: [
      {
        prop: params.prop,
        articulation: "damperPedalHinge",
        from: first / duration,
        to: last / duration,
        travel: (seconds: number): number =>
          pianoPedalStroke.travel(presses, seconds) * pedal.travel,
      },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const held: IAutoMovieMotionHumanPosture = base.posture(seconds);
      if (seconds <= 0 || seconds >= duration) return held;
      if (seconds < first) return withFoot(held, move(seconds / first), false);
      if (seconds > last)
        return withFoot(
          held,
          move((duration - seconds) / (duration - last)),
          false,
        );
      return withFoot(
        held,
        placed(pianoPedalStroke.travel(presses, seconds) * pedal.travel),
        true,
      );
    },
  };
}

/*
 * Report a placement or clock the author can correct.
 */
function refuse(axis: string, value: RefuseValue, fix: string): never {
  throw new AutoMovieMotionHumanRefusal({
    kind: axis === "prop" ? "reach" : "parameter",
    axis,
    value,
    reason: "the right-foot damper action cannot be placed",
    fix,
  });
}

/*
 * The foot clock's independently authored stroke.
 */
type Press = IAutoMovieMotionHumanPianoPedal.IPress;

/*
 * The alternatives of `RefuseValue`'s site.
 */
type RefuseValue = string | number;
