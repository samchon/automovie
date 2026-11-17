import type { AutoMovieHumanoidBone, IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanDigitFit } from "./HumanDigitFit";
import type { IHumanPosture } from "./IHumanPosture";
import { assembleHumanPosture } from "./assembleHumanPosture";
import { deriveHumanPosture } from "./deriveHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { refitHumanPosture } from "./refitHumanPosture";
import type { resolveHumanPosture } from "./resolveHumanPosture";
import { selectHumanPostureGoals } from "./selectHumanPostureGoals";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Assemble, fit and finish a canonical source with independent public output.
 * The companion owned entry serves only constructors whose actual fresh
 * assembly and nonescaping source establish copy-on-write ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ownership boundaries and the shared canonical assembly, goal-selection, limb and digit order. Member facts: assemble: Defines the posture's direct part and that one assembly serves every fit of it. fit: Defines replacement goals, their turning, the unchanged assembly and the seeded result. continued: States private snapshot/native-reader premises and the curve's explicit constrained continuation policy. owned: Defines actual private-source and reader premises and the fresh-result transfer.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original direct-joint projection, dependency-selected inverse kinematics and final digit fitting; explicit borrowed sources receive a complete independent result. Member facts: assemble: Root, heading, direct joints and their ROM projection do not depend on the limb goals, so they are computed apart from the fits. fit: The owned resolve's own ordered refit and digit fit on the assembly's pose; a goal given later is turned by the posture's whole-body rotation as the assembly turns the posture's own. continued: Uses identical canonical assembly and current goals; only the actual owned curve selects refitHumanPosture.continued and subsequently admits its actual physical result. owned: The assembler creates every direct joint/root, owned refit transfers only its proven fresh writes or newly issued cache packets, and digits operate on that owned pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One numerical composition serves both entrypoints; only the existing independent versus owned refit and final issuing boundary differ. Member facts: assemble: One delegation to assembleHumanPosture, keeping the posture beside its result. fit: The second half every entry runs, with the constructed refit. continued: Shares solve with ordinary owned and independent source entrypoints; no separate numerical solver or raw ownership flag is added. owned: Selects the existing owned refit in the same solve composition; the public independent entry selects the independent refit and clones at its boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new solver, numerical flag, target, seed policy, tolerance or eligibility guess is introduced; the actual source constructor chooses its ownership entry. Member facts: assemble: Every direct joint is still clamped; nothing fitted is stored. fit: Every goal is solved from its own inputs on the shared records, which the refit never writes; no fitted answer is kept between calls. continued: Does not change public cold/near selection, source admission, contact policy, target, ROM or tolerance. owned: No supplied base, public ownership switch, private cached result, fixture-specific path or changed numerical rule is accepted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Performs the existing B-bone assembly and demanded fitting once, followed by one complete independent clone for borrowed public input. The owned constructor avoids independent per-limb issuing and the redundant final graph clone; runtime gains are unmeasured. Member facts: assemble: One O(B) assembly and projection. fit: The fits and digits of one call, with no assembly; speedup is unmeasured. continued: Selects prepared current hinged correction before generic cold setup where supported; all actual physical/continuity checks remain and gains are unmeasured. owned: Removes duplicate independent whole-result and per-chain copying inside the actual private constructor while retaining one assembly and all required fitting/admission; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both paths share the same assembly, fitting and digit owners. Owned data comes from actual fresh assembly and private constructor snapshots, never reader identity alone, while raw public inputs retain their prior issuing policy. Member facts: assemble: The caller holds the assembly as a value and passes it to each fit. fit: Fits of one direct posture share its assembly because the assembly does not depend on limb goals. A completed cold fit handed in is taken for another assembly only when both have the same leg goals value for value, the same root, and the very same record objects at every index each leg's fit reads (its chain, toes and their ancestors), since a limb fit is a function of exactly those; the taken pose is the completed one with the records the assemblies differ in replaced, which the ordinary fit would build record for record. continued: Actual private source construction establishes ownership while exact current values and explicit algorithm policy govern memo equivalence. owned: Reuses original projection, selected goals, limb memory and digit owners. The producer's private snapshot proves source nonaliasing; native reader admission is separate and supplies no numerical proof.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary pose and synchronous reader end with the call; independent outputs own their records and no source, callback, result history or handle is retained here. Member facts: assemble: Retains nothing; the caller owns the assembly. fit: Retains nothing; results share the assembly's untouched records. continued: Transfers owned current records to the preparation; the source, reader and callback never enter result history. owned: Transfers owned pose/seed/value records to its synchronous owner, without retaining the source, borrowed reader, outputs or query history.
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
   * A posture's direct part, assembled once: what does not depend on which
   * limb goals are then fitted. It carries the authored posture, the
   * canonical pose of its root and clamped direct joints before any fit, and
   * its own limb goals in world terms; no fitted joint, seed or flag, and
   * fits read the pose's records without writing them. `fit` and the
   * composition every resolve runs read all three members.
   */
  export interface IAssembled {
    /** The posture as authored; its root, heading and rotation turn goals given later, and its digits are fitted after the limbs. */
    posture: IHumanPosture;

    /** The root and every rig bone's clamped direct joint, before any limb fit; fits share its records and leave them unchanged. */
    pose: IAutoMoviePose;

    /** The posture's own limb goals, world goals turned by its whole-body rotation. */
    limbs: IHumanPosture["limbs"];

    /** The pose whose joints stood in for unset bones, when the assembly was made on one. */
    base?: IAutoMoviePose;
  }

  /**
   * Assemble a posture's direct part (`assembleHumanPosture`).
   *
   * @param body The performer's body.
   * @param posture The posture.
   * @param base A pose whose joints replace clinical zero for unset bones.
   * @param projection A projector the caller passes along; the body's own projects.
   * @returns The assembly.
   *
   * Root, heading, direct joints and their ROM projection do not depend on
   * the limb goals, so one assembly serves every fit of the same direct
   * posture. One O(B) assembly and projection; the caller owns the result and
   * nothing is retained.
   */
  export function assemble(
    body: IHumanBody,
    posture: IHumanPosture,
    base?: IAutoMoviePose,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAssembled {
    const assembled: ReturnType<typeof assembleHumanPosture> = assembleHumanPosture(body, posture, base, projection);
    return { posture, pose: assembled.pose, limbs: assembled.limbs, ...(base === undefined ? {} : { base }) };
  }

  /**
   * Fit limb goals and the assembly's digits on an assembly, as the owned
   * resolve does after assembling.
   *
   * @param body The performer's body.
   * @param assembled The assembly; left unchanged.
   * @param limbs Goals replacing the assembled posture's own, authored in the same world as they are (turned here by the posture's whole-body rotation); absent, the posture's own.
   * @param near Each limb's nearby fit to continue.
   * @param resolution Optional FK reader or lazy supplier of the same synchronous evaluation.
   * @returns The pose with the goals and digits fitted, and each fitted limb's seed and value.
   *
   * The same ordered refit and digit fit as `owned`, so fitting the posture's
   * own goals on its assembly is the owned resolve of that posture. Each call
   * pays its fits only; the assembly's records are shared, never written.
   * With `solved`, a completed cold fit of another assembly, a cold fit of
   * this assembly's own goals is taken from it when every limb's fit reads
   * exactly what it read there (`deriveHumanPosture.inherited`), and solved
   * as ever otherwise.
   */
  export function fit(
    body: IHumanBody,
    assembled: IAssembled,
    limbs?: IHumanPosture["limbs"],
    near: resolveHumanPosture.INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    solved?: deriveHumanPosture.ISolved,
  ): resolveHumanPosture.ISeeded {
    if (solved !== undefined && limbs === undefined && Object.keys(near).length === 0) {
      const taken: resolveHumanPosture.ISeeded | undefined = deriveHumanPosture.inherited(body, assembled, solved);
      if (taken !== undefined) return taken;
    }
    return fitted(
      body,
      limbs === undefined ? assembled
        : { ...assembled, limbs: turnHumanPosture({ ...assembled.posture, limbs }).limbs },
      near, resolution, undefined, refitHumanPosture.constructed,
    );
  }

  /**
   * Transfer fresh assembled and fitted records within their owning operation.
   * The caller supplies no borrowed base, and its reader is absent or native
   * (`prepareHumanPoseResolution.isNativeSource`): assembly creates every
   * result record from the raw demands, which it only reads, and a native
   * reader lends exact FK alone, so no result record aliases the caller's.
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
  return fitted(body, resolveHumanPostureSource.assemble(body, raw, base, projection), near, resolution, requested, refit);
}

/** The second half of the composition: the assembly's goals fitted in order, then its digits. */
function fitted(
  body: IHumanBody,
  assembled: resolveHumanPostureSource.IAssembled,
  near: resolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  refit: (...args: Parameters<typeof refitHumanPosture>) => ReturnType<typeof refitHumanPosture>,
): resolveHumanPosture.ISeeded {
  const posture: IHumanPosture = { ...assembled.posture, limbs: assembled.limbs };
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const limbs: IHumanPosture["limbs"] = requested === undefined || Object.keys(near).length !== 0
    ? posture.limbs : selectHumanPostureGoals(body, posture, requested);
  const solved: resolveHumanPosture.ISeeded = refit(body, assembled.pose, limbs, near, read);
  return {
    ...solved,
    pose: HumanDigitFit.fitted(body, solved.pose, posture.digits, read, requested),
  };
}
