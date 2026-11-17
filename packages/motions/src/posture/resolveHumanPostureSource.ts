import type { AutoMovieHumanoidBone, IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import type { IHumanPosture } from "./IHumanPosture";
import { assembleHumanPosture } from "./assembleHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { refitHumanPosture } from "./refitHumanPosture";
import type { resolveHumanPosture } from "./resolveHumanPosture";
import { selectHumanPostureGoals } from "./selectHumanPostureGoals";

/**
 * Assemble, fit and finish a canonical source with independent public output.
 * The companion owned entry serves only constructors whose actual fresh
 * assembly and nonescaping source establish copy-on-write ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ownership boundaries and the shared canonical assembly, goal-selection, limb and digit order. Member facts: continued: States private snapshot/native-reader premises and the curve's explicit constrained continuation policy. owned: Defines actual private-source and reader premises and the fresh-result transfer.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original direct-joint projection, dependency-selected inverse kinematics and final digit fitting; explicit borrowed sources receive a complete independent result. Member facts: continued: Uses identical canonical assembly and current goals; only the actual owned curve selects refitHumanPosture.continued and subsequently admits its actual physical result. owned: The assembler creates every direct joint/root, owned refit transfers only its proven fresh writes or newly issued cache packets, and digits operate on that owned pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One numerical composition serves both entrypoints; only the existing independent versus owned refit and final issuing boundary differ. Member facts: continued: Shares solve with ordinary owned and independent source entrypoints; no separate numerical solver or raw ownership flag is added. owned: Selects the existing owned refit in the same solve composition; the public independent entry selects the independent refit and clones at its boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new solver, numerical flag, target, seed policy, tolerance or eligibility guess is introduced; the actual source constructor chooses its ownership entry. Member facts: continued: Does not change public cold/near selection, source admission, contact policy, target, ROM or tolerance. owned: No supplied base, public ownership switch, private cached result, fixture-specific path or changed numerical rule is accepted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Performs the existing B-bone assembly and demanded fitting once, followed by one complete independent clone for borrowed public input. The owned constructor avoids independent per-limb issuing and the redundant final graph clone; runtime gains are unmeasured. Member facts: continued: Selects prepared current hinged correction before generic cold setup where supported; all actual physical/continuity checks remain and gains are unmeasured. owned: Removes duplicate independent whole-result and per-chain copying inside the actual private constructor while retaining one assembly and all required fitting/admission; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both paths share the same assembly, fitting and digit owners. Owned data comes from actual fresh assembly and private constructor snapshots, never reader identity alone, while raw public inputs retain their prior issuing policy. Member facts: continued: Actual private source construction establishes ownership while exact current values and explicit algorithm policy govern memo equivalence. owned: Reuses original projection, selected goals, limb memory and digit owners. The producer's private snapshot proves source nonaliasing; native reader admission is separate and supplies no numerical proof.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary pose and synchronous reader end with the call; independent outputs own their records and no source, callback, result history or handle is retained here. Member facts: continued: Transfers owned current records to the preparation; the source, reader and callback never enter result history. owned: Transfers owned pose/seed/value records to its synchronous owner, without retaining the source, borrowed reader, outputs or query history.
 */
export function resolveHumanPostureSource(
  body: IHumanBody,
  posture: IHumanPosture,
  base: IAutoMoviePose | undefined,
  near: resolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
): resolveHumanPosture.ISeeded {
  return structuredClone(solve(body, posture, base, near, resolution, requested, projection, refitHumanPosture.independent));
}

/**
 * Actual constructor-owned entry to the same numerical source operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the constructor-owned transfer boundary and its unchanged solver.
 * @evidence contracts/development/design.md#principled-representation Source ownership is expressed by the internal producer call path, with no value supplied as a trusted prepared flag or solved result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only owned serves the resolver's existing no-reader constructor and preparation's private snapshot/native-reader constructor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not infer source ownership from mutable identity, raw JSON, a reader identity or a public annotation.
 */
export namespace resolveHumanPostureSource {
  /**
   * Transfer fresh assembled and fitted records within their owning operation.
   * The caller supplies no borrowed base and either owns the complete reader
   * or has cloned the raw source and admitted a genuine native reader.
   *
   * Defines actual private-source and reader premises and the fresh-result transfer.
   * The assembler creates every direct joint/root, owned refit transfers only its proven fresh writes or newly issued cache packets, and digits operate on that owned pose.
   * Selects the existing owned refit in the same solve composition; the public independent entry selects the independent refit and clones at its boundary.
   * No supplied base, public ownership switch, private cached result, fixture-specific path or changed numerical rule is accepted.
   * Removes duplicate independent whole-result and per-chain copying inside the actual private constructor while retaining one assembly and all required fitting/admission; speedup is unmeasured.
   * Reuses original projection, selected goals, limb memory and digit owners. The producer's private snapshot proves source nonaliasing; native reader admission is separate and supplies no numerical proof.
   * Transfers owned pose/seed/value records to its synchronous owner, without retaining the source, borrowed reader, outputs or query history.
   */
  export function owned(
    body: IHumanBody,
    posture: IHumanPosture,
    near: resolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): resolveHumanPosture.ISeeded {
    return solve(body, posture, undefined, near, resolution, requested, projection, refitHumanPosture.constructed);
  }

  /**
   * Resolve the owned free-curve snapshot with current hinged correction.
   *
   * States private snapshot/native-reader premises and the curve's explicit constrained continuation policy.
   * Uses identical canonical assembly and current goals; only the actual owned curve selects refitHumanPosture.continued and subsequently admits its actual physical result.
   * Shares solve with ordinary owned and independent source entrypoints; no separate numerical solver or raw ownership flag is added.
   * Does not change public cold/near selection, source admission, contact policy, target, ROM or tolerance.
   * Selects prepared current hinged correction before generic cold setup where supported; all actual physical/continuity checks remain and gains are unmeasured.
   * Actual private source construction establishes ownership while exact current values and explicit algorithm policy govern memo equivalence.
   * Transfers owned current records to the preparation; the source, reader and callback never enter result history.
   */
  export function continued(body: IHumanBody, posture: IHumanPosture, near: resolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): resolveHumanPosture.ISeeded {
    return solve(body, posture, undefined, near, resolution, undefined, projection, refitHumanPosture.continued);
  }
}

/** Keep canonical composition and current requested-goal admission in one owner. */
function solve(
  body: IHumanBody,
  raw: IHumanPosture,
  base: IAutoMoviePose | undefined,
  near: resolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  refit: (...args: Parameters<typeof refitHumanPosture>) => ReturnType<typeof refitHumanPosture>,
): resolveHumanPosture.ISeeded {
  const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, raw, base, projection);
  const posture: IHumanPosture = { ...raw, limbs: assembled.limbs };
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const limbs: IHumanPosture["limbs"] = requested === undefined || Object.keys(near).length !== 0
    ? posture.limbs : selectHumanPostureGoals(body, posture, requested);
  const fitted: resolveHumanPosture.ISeeded = refit(body, assembled.pose, limbs, near, read);
  return {
    ...fitted,
    pose: HumanDigitFit.fitted(body, fitted.pose, posture.digits, read, requested),
  };
}
