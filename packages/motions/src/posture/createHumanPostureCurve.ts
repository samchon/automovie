import type {
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * Construct a constant posture from an owned complete clinical payload.
 * Supported finite joint-only inputs are copied and frozen privately; each
 * read returns a fresh mutable copy. Other inputs keep the existing borrowed
 * constant reader and receive no curve provenance.
 *
 * prepared reads only a genuine constructor's private payload and returns
 * the original resolver's actual preparation for fixed COM/rigid placement.
 * Its live rig/ROM guard governs consumption of that preparation; enclosing
 * dynamic plan callbacks receive no whole-curve constancy claim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete copied source ownership, fresh output records, constant clinical-degree coefficients, ordinary unsupported fallback and prepared's actual resolver token/current-rig guard. prepared returns undefined for unissued sources or unavailable rig metadata and propagates original resolver failures. ICaptured documents genuine preparation ownership and permanent invalidation. Public borrowed Base.still remains separate and receives no proof.
 * @evidence contracts/development/implementation.md#principled-implementation Fixed gymnastic placement already owns one complete direct-joint payload. Copying those exact clinical coefficients and preparing them with the original resolver establishes its canonical source. prepared checks the complete live rig/ROM before and after that original solve; no observed sample or caller assertion certifies an enclosing dynamic plan.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor owns the full finite joint-only snapshot and weak registration; prepared performs one weak provenance lookup, metadata acquisition and original canonical solve, returning the genuine preparation and a permanently invalidating guard. The actual gymnastic placement consumer owns COM reduction and changing rigid placement. Unsupported authoring retains its existing reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Limb/digit goals, whole-body rotations, unknown top-level context and nonfinite fields cannot obtain proof. Unissued callbacks do not execute or gain preparation. The resolver retains all authored joints and admission, while wrappers, layers, carry, contacts, balance fits, cuts and IK keep ordinary evaluation. No public flag, sample-equality verdict, solver replacement, fixture or action-name branch exists.
 * @evidence contracts/development/implementation.md#efficient-algorithms Construction copies/freezes O(J) direct coordinates once; each supported read copies O(J) output. prepared performs one complete ordinary canonical solve and O(B+T) rig checking for B rig records and T ROM/frame table entries without demanding an unused public pose copy. Additional capture/guard work has no measured speedup claim; ordinary dynamic bases retain their original constant-cost borrowed reads.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Private immutable coefficients establish the fixed canonical source independently of callback identity; identity only locates their genuine constructor. The actual placement consumer checks the returned unchanged guard before reuse. Any observed mismatch permanently invalidates that acquisition, so restoring earlier metadata cannot revive its preparation; changed bodies or unissued callbacks receive no reused preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback and weak entry own one O(J) immutable source until the callback releases. Each prepared acquisition owns one actual resolver preparation and genuine rig checker. The placement consumer replaces its current acquisition on invalidation and releases it with its plan, without query history, FK workspace or external handles.
 */
export function createHumanPostureCurve(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const saved: IAutoMovieMotionHumanPosture | undefined = snapshot(posture);
  if (saved === undefined) return (): IAutoMovieMotionHumanPosture => posture;

  const at: IAutoMovieMotionHumanActionPlan["posture"] = (): IAutoMovieMotionHumanPosture => structuredClone(saved);
  ISSUED.set(at, saved);
  return at;
}

/**
 * Canonical preparation of the constructor-owned constant clinical source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation prepared returns an actual resolver-issued fixed-source preparation and live unchanged-rig guard or undefined. ICaptured states actual preparation ownership and permanent guard invalidation.
 * @evidence contracts/development/design.md#principled-representation ICaptured carries the existing resolver's genuine preparation of the immutable clinical-degree source and a separate callable live rig/ROM guard. Its actual fixed-placement consumer checks that guard before reuse; false permanently ends the acquisition. Public preparation observations cannot alter the private clinical source or its solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepared serves actual fixed gymnastic COM/rigid placement without demanding an unused public pose copy. The existing resolver preparation and rig checker retain their numerical owners; there is no unused displayed-pose or wrapper capability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No writable eligibility flag, callback registration entry, time sample or public solved-pose constructor is exposed. An enclosing dynamic plan is not certified by its private fixed clinical prefix.
 */
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
    const unchanged: (() => boolean) | undefined = prepareHumanPostureRigCheck(body);
    if (unchanged === undefined) return undefined;

    const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, saved);
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
   * An actual captured source's canonical preparation while its rig/ROM stays unchanged.
   */
  export interface ICaptured {
    /** Genuine resolver-issued source; COM/FK/rigid placement remain with that numerical owner. */
    readonly prepared: resolveHumanPosture.IPrepared;

    /** Check before consuming the preparation; false permanently ends its validity. */
    unchanged(): boolean;
  }
}

/** Copy the complete supported authoring before checking or retaining any scalar. */
function snapshot(posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture | undefined {
  try {
    const saved: IAutoMovieMotionHumanPosture = structuredClone(posture);
    if (Object.keys(saved).some((key: string): boolean => !FIELDS.has(key)) ||
      Object.keys(saved.root).some((key: string): boolean => key !== "x" && key !== "y" && key !== "z") ||
      ![saved.root.x, saved.root.y, saved.root.z, saved.yaw, saved.pitch, saved.roll].every(Number.isFinite) ||
      Object.values(saved.limbs).some((goal: IAutoMovieHumanLimbGoal | undefined): boolean => goal !== undefined) ||
      Object.values(saved.digits ?? {}).some((goal: IAutoMovieHumanDigitGoal | undefined): boolean => goal !== undefined) ||
      saved.rotation !== undefined) return undefined;

    for (const joint of Object.values(saved.joints)) {
      if (joint === undefined || joint.length !== 3 ||
        ![joint[0], joint[1], joint[2]].every(Number.isFinite) ||
        Object.keys(joint).some((key: string): boolean => key !== "0" && key !== "1" && key !== "2")) return undefined;
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
  "root", "yaw", "pitch", "roll", "joints", "limbs", "digits", "rotation",
]);

/** Weak membership locates constructor-owned coefficients without retaining released curves. */
const ISSUED: WeakMap<IAutoMovieMotionHumanActionPlan["posture"], IAutoMovieMotionHumanPosture> = new WeakMap();
