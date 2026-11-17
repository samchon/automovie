import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "./IHumanPosture";
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
 * fixed observes that same preparation when a canonical pose is needed. Its
 * canonical solve supplies a root-frame pose and its unchanged rig/ROM
 * checker. Every shape derivative is zero because all copied coefficients
 * are constant for all seconds, including any ROM-clamped coordinates.
 * A composed reader must separately establish that no stage changes that
 * articulation before carrying this fact into a physical history.
 * located constructs the performance's error-location wrapper itself; it
 * preserves a native source's coefficients because its body forwards every
 * input and result unchanged and alters only a thrown HumanRefusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete copied source ownership, fresh output records, constant clinical-degree coefficients for all real seconds, ordinary unsupported fallback, prepared's actual resolver token and fixed's rootless canonical pose/current-rig guard. located forwards all four posture arguments and the exact result, adding only the existing HumanRefusal location; companion types document their preparation/pose and invalidation members. Public borrowed Base.still remains separate and receives no proof.
 * @evidence contracts/development/implementation.md#principled-implementation A constant direct-joint function composed with an unchanged deterministic ROM projector is constant, so its complete root-frame FK has exactly zero linear and angular shape rates. fixed runs the ordinary complete resolver on that actual immutable source; no observed sample or caller assertion establishes constancy.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor owns the full finite joint-only snapshot and weak registration; prepared owns provenance lookup, actual canonical preparation and the genuine rig/ROM lifetime guard. fixed observes that actual preparation without a second solve. located owns the actual transparent error wrapper and propagates only its known source's immutable payload. Unsupported authoring retains its existing reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Limb/digit goals, whole-body rotations, unknown top-level context and nonfinite fields cannot obtain proof. Arbitrary wrappers, layers, carry, contacts, balance fits, cuts and IK have no registration and must use ordinary evaluation. No public flag, sample-equality verdict, solver replacement, fixture or action-name branch exists.
 * @evidence contracts/development/implementation.md#efficient-algorithms Construction copies/freezes O(J) direct coordinates once; each supported read copies O(J) output. prepared performs one complete ordinary canonical solve and O(B+T) rig checking for B rig records and T ROM/frame table entries. fixed alone demands its lazy public pose copy. located adds constant wrapper work and shares its genuine source payload. Additional capture/guard work has no measured speedup claim; ordinary dynamic bases retain their original constant-cost borrowed reads.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Private immutable coefficients establish whole-curve equivalence independently of callback identity; identity only locates their genuine constructor. Canonical physical facts require the returned unchanged guard at consumption, and changed bodies or unissued callbacks receive no proof.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback and weak entry own one O(J) immutable source until the callback releases. Each located wrapper retains only its original callback, location and any shared immutable payload until release. Each prepared acquisition owns one actual resolver preparation and genuine rig checker; fixed alone materializes an independent canonical pose. Consumers release the current acquisition on replacement/release, without query history, FK workspace or external handles.
 */
export function createHumanPostureCurve(
  posture: IHumanPosture,
): IHumanActionPlan["posture"] {
  const saved: IHumanPosture | undefined = snapshot(posture);
  if (saved === undefined) return (): IHumanPosture => posture;

  const at: IHumanActionPlan["posture"] = (): IHumanPosture => structuredClone(saved);
  ISSUED.set(at, saved);
  return at;
}

/**
 * Canonical observation of the constructor-owned constant clinical curve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation prepared returns an actual resolver-issued fixed-source preparation and live unchanged-rig guard or undefined; fixed returns its ordinary canonical rootless pose. located owns the exact refusal-location wrapper while preserving its native source's complete constant payload. Companion types state actual token/pose ownership and guard invalidation.
 * @evidence contracts/development/design.md#principled-representation ICaptured carries the existing resolver's genuine preparation of the immutable clinical-degree source, and IConstant observes its actual canonical root-frame articulation. Each requires its live rig/ROM guard while consuming those facts. Public preparation/pose mutation changes only an independent observation and cannot alter the private source or its solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepared serves actual fixed gymnastic COM/rigid placement without demanding an unused public pose copy; fixed serves native displayed-shape preparation. Each returns its existing numerical owner plus the rig checker. located serves actual performance placement, whose original error wrapper otherwise loses source provenance. Authoring, refusal-location and canonical preparation/pose types retain their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No writable eligibility flag, callback registration entry, time sample or public solved-pose constructor is exposed. A consumer must retain original curve provenance and independently prove all intervening composition preserves articulation.
 */
export namespace createHumanPostureCurve {
  /** Construct the existing error-location wrapper without changing source values. */
  export function located(
    source: IHumanActionPlan["posture"],
    where: HumanRefusal.IWhere,
  ): IHumanActionPlan["posture"] {
    const at: IHumanActionPlan["posture"] = (
      seconds: number,
      channels?: Parameters<IHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IHumanActionPlan["posture"]>[2],
      projection?: Parameters<IHumanActionPlan["posture"]>[3],
    ): IHumanPosture => {
      try {
        return source(seconds, channels, resolution, projection);
      } catch (error) {
        throw error instanceof HumanRefusal ? error.locate(where) : error;
      }
    };
    const saved: IHumanPosture | undefined = ISSUED.get(source);
    if (saved !== undefined) ISSUED.set(at, saved);
    return at;
  }

  /** Prepare the immutable constant source once; foreign readers have no provenance. */
  export function prepared(
    body: IHumanBody,
    source: IHumanActionPlan["posture"],
  ): ICaptured | undefined {
    const saved: IHumanPosture | undefined = ISSUED.get(source);
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

  /** Observe the same actual preparation only when a canonical root-frame pose is needed. */
  export function fixed(
    body: IHumanBody,
    source: IHumanActionPlan["posture"],
  ): IConstant | undefined {
    const captured: ICaptured | undefined = prepared(body, source);
    return captured === undefined ? undefined : {
      pose: { ...captured.prepared.pose, root: null },
      unchanged: captured.unchanged,
    };
  }

  /** An actual captured source's canonical preparation while its rig/ROM stays unchanged. */
  export interface ICaptured {
    /** Genuine resolver-issued source; COM/FK/rigid placement remain with that numerical owner. */
    readonly prepared: resolveHumanPosture.IPrepared;

    /** Check before consuming the preparation; false permanently ends its validity. */
    unchanged(): boolean;
  }

  /** One actual canonical constant articulation while its rig/ROM stays unchanged. */
  export interface IConstant {
    /** Independent canonical root-frame pose; all its shape rates are exactly zero. */
    readonly pose: IAutoMoviePose;

    /** Check before consuming the pose; false permanently ends this observation's validity. */
    unchanged(): boolean;
  }
}

/** Copy the complete supported authoring before checking or retaining any scalar. */
function snapshot(posture: IHumanPosture): IHumanPosture | undefined {
  try {
    const saved: IHumanPosture = structuredClone(posture);
    if (Object.keys(saved).some((key: string): boolean => !FIELDS.has(key)) ||
      Object.keys(saved.root).some((key: string): boolean => key !== "x" && key !== "y" && key !== "z") ||
      ![saved.root.x, saved.root.y, saved.root.z, saved.yaw, saved.pitch, saved.roll].every(Number.isFinite) ||
      Object.values(saved.limbs).some((goal: IHumanPosture.IGoal | undefined): boolean => goal !== undefined) ||
      Object.values(saved.digits ?? {}).some((goal: IHumanPosture.IDigitGoal | undefined): boolean => goal !== undefined) ||
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
const ISSUED: WeakMap<IHumanActionPlan["posture"], IHumanPosture> = new WeakMap();
