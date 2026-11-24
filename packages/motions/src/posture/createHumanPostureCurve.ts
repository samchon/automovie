import type {
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";

/**
 * Construct a constant posture from an owned complete clinical payload.
 * Supported finite joint-only inputs are copied and frozen privately; each read
 * returns a fresh mutable copy. Other inputs keep the existing borrowed
 * constant reader and receive no curve provenance.
 *
 * Prepared reads only a genuine constructor's private payload and returns the
 * original resolver's actual preparation for fixed COM/rigid placement. Its
 * live rig/ROM guard governs consumption of that preparation; enclosing dynamic
 * plan callbacks receive no whole-curve constancy claim.
 */
export function createHumanPostureCurve(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const saved: IAutoMovieMotionHumanPosture | undefined = snapshot(posture);
  if (saved === undefined) return (): IAutoMovieMotionHumanPosture => posture;

  const at: IAutoMovieMotionHumanActionPlan["posture"] =
    (): IAutoMovieMotionHumanPosture => structuredClone(saved);
  ISSUED.set(at, saved);
  return at;
}

/** Canonical preparation of the constructor-owned constant clinical source. */
export namespace createHumanPostureCurve {
  /**
   * Prepare the constructor's fixed clinical source for an unchanged body.
   * Missing constructor provenance or unavailable current rig metadata returns
   * undefined; actual resolver failures propagate. The consumer checks
   * unchanged before reusing this acquisition after a later body observation.
   */
  export function prepared(
    body: IAutoMovieMotionHumanBody,
    source: IAutoMovieMotionHumanActionPlan["posture"],
  ): ICaptured | undefined {
    const saved: IAutoMovieMotionHumanPosture | undefined = ISSUED.get(source);
    if (saved === undefined) return undefined;
    const unchanged: (() => boolean) | undefined =
      prepareHumanPostureRigCheck(body);
    if (unchanged === undefined) return undefined;

    const prepared: HumanPosturePreparation.IPrepared =
      HumanPosturePreparation.prepare(body, saved);
    if (!unchanged()) return undefined;
    let active: boolean = true;
    return {
      prepared,
      unchanged: (): boolean => {
        active = active && unchanged();
        return active;
      },
    };
  }

  /**
   * An actual captured source's canonical preparation while its rig/ROM stays
   * unchanged.
   */
  export interface ICaptured {
    /**
     * Genuine resolver-issued source; COM/FK/rigid placement remain with that
     * numerical owner.
     */
    readonly prepared: HumanPosturePreparation.IPrepared;

    /**
     * Check before consuming the preparation; false permanently ends its
     * validity.
     */
    unchanged(): boolean;
  }
}

/**
 * Copy the complete supported authoring before checking or retaining any
 * scalar.
 */
function snapshot(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture | undefined {
  try {
    const saved: IAutoMovieMotionHumanPosture = structuredClone(posture);
    if (
      Object.keys(saved).some((key: string): boolean => !FIELDS.has(key)) ||
      Object.keys(saved.root).some(
        (key: string): boolean => key !== "x" && key !== "y" && key !== "z",
      ) ||
      ![
        saved.root.x,
        saved.root.y,
        saved.root.z,
        saved.yaw,
        saved.pitch,
        saved.roll,
      ].every(Number.isFinite) ||
      Object.values(saved.limbs).some(
        (goal: IAutoMovieHumanLimbGoal | undefined): boolean =>
          goal !== undefined,
      ) ||
      Object.values(saved.digits ?? {}).some(
        (goal: IAutoMovieHumanDigitGoal | undefined): boolean =>
          goal !== undefined,
      ) ||
      saved.rotation !== undefined
    )
      return undefined;

    for (const joint of Object.values(saved.joints)) {
      if (
        joint === undefined ||
        joint.length !== 3 ||
        ![joint[0], joint[1], joint[2]].every(Number.isFinite) ||
        Object.keys(joint).some(
          (key: string): boolean => key !== "0" && key !== "1" && key !== "2",
        )
      )
        return undefined;
      Object.freeze(joint);
    }
    Object.freeze(saved.root);
    Object.freeze(saved.joints);
    Object.freeze(saved.limbs);
    if (saved.digits !== undefined) Object.freeze(saved.digits);
    return Object.freeze(saved);
  } catch {
    return undefined;
  }
}

/** Only complete ordinary clinical authoring can establish the static class. */
const FIELDS: ReadonlySet<string> = new Set([
  "root",
  "yaw",
  "pitch",
  "roll",
  "joints",
  "limbs",
  "digits",
  "rotation",
]);

/**
 * Weak membership locates constructor-owned coefficients without retaining
 * released curves.
 */
const ISSUED: WeakMap<
  IAutoMovieMotionHumanActionPlan["posture"],
  IAutoMovieMotionHumanPosture
> = new WeakMap();
