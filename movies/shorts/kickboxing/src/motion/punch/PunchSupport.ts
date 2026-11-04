import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { ActionClock } from "../core/ActionClock";
import { MotionAction } from "../core/MotionAction";

/**
 * Turning-punch foot preparation and return on the host's actual plantar frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership A fixed-identity frame connects unload, roll, turn and replant. PunchAction measures both sole frames and actual minimum vertices from one unchanged base-body roll FK; only the acting pair receives world yaw. A minimum's hard trajectory survives unloaded phases, changing only its ground role. Initial/final heel witnesses remain through unloading/replant. Captured anchors survive arm return before foot unwinding. These are kinematic requests, not pressure or solve proof.
 * @evidence contracts/common.md#authoring-interface All anchors are actual supplied world points. Frame quaternions are world-axis deltas about that same point; they never coexist with yawDegrees. A framed unprepared foot needs positive preparation and recovery. Authored .3 unloading/.8 replant fractions determine phase order rather than athlete timing measurements.
 */
export namespace PunchSupport {
  /**
   * One support request and its optional authored toe-extension seed weight.
   *
   * @evidence contracts/common.md#implementation-and-ownership Keeps the actual geometric support request distinct from an anatomical seed used to approach it; neither establishes pressure or balance.
   * @evidence contracts/common.md#authoring-interface Roll is a closed-unit authored seed weight and support carries world metre anchors plus optional unit frame deltas.
   */
  export interface State {
    /** Named actual support witnesses and normalized load intent. */
    support: MotionAction.Support;
    /** Closed-unit roll preparation; seed only, never a pressure measurement. */
    roll: number;
  }

  /**
   * Sample the same measured foot frame through preparation, strike and return.
   *
   * @evidence contracts/common.md#implementation-and-ownership Constant-size patch selection preserves actual identities and initialWorld metadata. Public Engine quaternion slerp supplies roll interpolation and multiplication composes later world yaw. Only the acting foot is released; load shares remain nonnegative and sum to one.
   * @evidence contracts/common.md#authoring-interface The context supplies both planted feet and the acting forefoot pivot. Missing framed initialWorld or zero setup/settling for a displaced point refuses. An unloaded hard free frame remains a strict trajectory goal, not certified ground support. The host independently reports full-foot floor, actual support and trajectory residuals.
   */
  export function sample(
    request: MotionAction.Request,
    timing: MotionAction.Timing,
    context: MotionAction.Context,
    phase: MotionAction.Phase,
    progress: number,
    drive: number,
    returnSupport?: MotionAction.Support,
  ): State {
    const available: MotionAction.SupportPatch[] | undefined =
      context.supportPatches;
    const desiredLead: number = 0.5 + 0.12 * drive;
    const defaultSupport: MotionAction.Support = {
      left: request.leadSide === "left" ? desiredLead : 1 - desiredLead,
      right: request.leadSide === "right" ? desiredLead : 1 - desiredLead,
    };
    if (!available) {
      throw new Error("Turning punches require actual plantar witnesses");
    }
    const planted: MotionAction.SupportPatch[] = (
      ["left", "right"] as const
    ).map(
      (side: MotionAction.Side): MotionAction.SupportPatch =>
        select(available, side, "planted"),
    );
    const pivot: MotionAction.SupportPatch = select(
      available,
      request.side,
      "pivot",
    );
    const initial: MotionAction.Vec3 = pivot.initialWorld ?? pivot.world;
    if (pivot.frameRotation && !pivot.initialWorld)
      throw new Error("A framed forefoot needs its actual initial world point");
    const moved: boolean =
      Math.hypot(
        initial[0] - pivot.world[0],
        initial[1] - pivot.world[1],
        initial[2] - pivot.world[2],
      ) > 1e-9 ||
      (pivot.frameRotation !== undefined &&
        Math.abs(pivot.frameRotation[3]) < 1 - 1e-12);
    if (moved && (timing.preparation <= 0 || timing.recovery <= 0))
      throw new Error(
        "An unprepared forefoot needs explicit preparation and replant recovery",
      );
    let patch: MotionAction.SupportPatch = framed(pivot, 0, 0, "free");
    patch.world = [...initial];
    let actingLoad: number = defaultSupport[request.side];
    let roll: number = 0;
    let yaw: number = 0;
    if (phase === "preparation") {
      actingLoad = 0.5 * (1 - ActionClock.ease(progress / 0.3));
      if (progress >= 0.3) {
        roll = ActionClock.ease((progress - 0.3) / 0.7);
        patch = framed(pivot, roll, 0, "free");
        patch.world = mix(initial, pivot.world, roll);
      }
    } else if (
      phase === "delivery" ||
      phase === "contact" ||
      phase === "retraction"
    ) {
      roll = 1;
      yaw = (request.side === "left" ? -1 : 1) * 18 * drive;
      patch = framed(pivot, roll, yaw, "pivot");
      if (phase === "delivery") actingLoad *= ActionClock.ease(progress / 0.25);
    } else if (phase === "recovery") {
      const startLoad: number = returnSupport?.[request.side] ?? 0.5;
      if (progress < 0.3) {
        actingLoad = startLoad * (1 - ActionClock.ease(progress / 0.3));
        roll = 1;
        patch = framed(
          pivot,
          roll,
          (request.side === "left" ? -1 : 1) * 18 * drive,
          "pivot",
        );
      } else if (progress < 0.8) {
        actingLoad = 0;
        roll = 1 - ActionClock.ease((progress - 0.3) / 0.5);
        patch = framed(
          pivot,
          roll,
          (request.side === "left" ? -1 : 1) * 18 * drive,
          "free",
        );
        patch.world = mix(initial, pivot.world, roll);
      } else actingLoad = 0.5 * ActionClock.ease((progress - 0.8) / 0.2);
    } else actingLoad = 0.5;
    const retainHeel: boolean =
      phase === "idle" ||
      phase === "complete" ||
      (phase === "preparation" && progress < 0.3) ||
      (phase === "recovery" && progress >= 0.8);
    const patches: MotionAction.SupportPatch[] = [
      ...planted.filter(
        (item: MotionAction.SupportPatch): boolean =>
          item.side !== request.side || retainHeel,
      ),
      patch,
    ];
    return {
      support: {
        left: request.side === "left" ? actingLoad : 1 - actingLoad,
        right: request.side === "right" ? actingLoad : 1 - actingLoad,
        patches,
      },
      roll: pivot.frameRotation ? roll : 0,
    };
  }

  /**
   * Preserve captured measured frame/contact anchors until the foot can unload.
   *
   * @evidence contracts/common.md#implementation-and-ownership With full-foot measurement both the independent frame and actual ground-contact patch are retained exactly through common arm recovery. Unwinding them at different centres would contradict the captured ground anchor. Legacy single-pivot input instead removes yaw at its one unchanged centre, preserving measured roll.
   * @evidence contracts/common.md#authoring-interface The actual state is copied; no measured contact identity/world anchor changes inside MotionRecovery. Subsequent recovery unloads the actual contact before releasing it and reversing foot yaw/roll. The legacy fallback requires its matching source pivot and never claims full-foot proof.
   */
  export function retractionGoal(
    actual: MotionAction.Support,
    context: MotionAction.Context,
  ): MotionAction.Support {
    const result: MotionAction.Support = structuredClone(actual);
    if (context.supportFrame) return result;
    result.patches = actual.patches?.map(
      (patch: MotionAction.SupportPatch): MotionAction.SupportPatch => {
        if (patch.mode !== "pivot") return structuredClone(patch);
        if (!patch.frameRotation)
          return { ...structuredClone(patch), yawDegrees: 0 };
        const source: MotionAction.SupportPatch = select(
          context.supportPatches ?? [],
          patch.side,
          "pivot",
        );
        if (
          source.bone !== patch.bone ||
          source.localPoint.some(
            (value: number, axis: number): boolean =>
              value !== patch.localPoint[axis],
          )
        )
          throw new Error(
            "Retraction needs the same measured forefoot roll frame",
          );
        const goal: MotionAction.SupportPatch = {
          ...structuredClone(patch),
          frameRotation: source.frameRotation
            ? [...source.frameRotation]
            : [0, 0, 0, 1],
        };
        delete goal.yawDegrees;
        return goal;
      },
    );
    return result;
  }
}

/** Select and admit one real host-owned plantar alternative without changing it. */
function select(
  available: MotionAction.SupportPatch[],
  side: MotionAction.Side,
  mode: "planted" | "pivot",
): MotionAction.SupportPatch {
  const patch: MotionAction.SupportPatch | undefined = available.find(
    (item: MotionAction.SupportPatch): boolean =>
      item.side === side && item.mode === mode,
  );
  if (!patch)
    throw new Error(`Punch requires the actual ${side} ${mode} witness`);
  MotionAction.validateSupportFrame(patch);
  return structuredClone(patch);
}

/** Compose one explicit world-yaw delta after the measured world roll delta. */
function framed(
  source: MotionAction.SupportPatch,
  roll: number,
  yaw: number,
  mode: "pivot" | "free",
): MotionAction.SupportPatch {
  const result: MotionAction.SupportPatch = {
    ...structuredClone(source),
    mode,
    constraint: "hard",
  };
  const value: [number, number, number, number] = source.frameRotation ?? [
    0, 0, 0, 1,
  ];
  const partial: IAutoMovieQuaternion = Quaternion.slerp(
    Quaternion.identity(),
    { x: value[0], y: value[1], z: value[2], w: value[3] },
    roll,
  );
  const composed: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -yaw),
    partial,
  );
  result.frameRotation = [composed.x, composed.y, composed.z, composed.w];
  delete result.yawDegrees;
  return result;
}

/** A bounded metre path connects two actual locations of the same bone point. */
function mix(
  a: MotionAction.Vec3,
  b: MotionAction.Vec3,
  weight: number,
): MotionAction.Vec3 {
  return [
    a[0] + (b[0] - a[0]) * weight,
    a[1] + (b[1] - a[1]) * weight,
    a[2] + (b[2] - a[2]) * weight,
  ];
}
