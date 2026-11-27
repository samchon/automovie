import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanDigitFit } from "../HumanDigitFit";
import type { HumanLimbPair } from "../HumanLimbPair";
import { assembleHumanPosture } from "./assembleHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { refitHumanPosture } from "./refitHumanPosture";
import { selectHumanPostureGoals } from "./selectHumanPostureGoals";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Assemble, fit and finish a canonical source with independent public output.
 * The companion owned entry serves only constructors whose actual fresh
 * assembly and nonescaping source establish copy-on-write ownership.
 */
export function resolveHumanPostureSource(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  base: IAutoMoviePose | undefined,
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  return structuredClone(
    solve(
      body,
      posture,
      base,
      near,
      resolution,
      requested,
      projection,
      refitHumanPosture,
    ),
  );
}

/** Actual constructor-owned entry to the same numerical source operation. */
export namespace resolveHumanPostureSource {
  /**
   * A posture's direct part, assembled once: what does not depend on which limb
   * goals are then fitted. It carries the authored posture, the canonical pose
   * of its root and clamped direct joints before any fit, and its own limb
   * goals in world terms; no fitted joint, seed or flag, and fits read the
   * pose's records without writing them. `fit` and the composition every
   * resolve runs read all three members.
   */
  export interface IAssembled {
    /**
     * The posture as authored; its root, heading and rotation turn goals given
     * later, and its digits are fitted after the limbs.
     */
    posture: IAutoMovieMotionHumanPosture;

    /**
     * The root and every rig bone's clamped direct joint, before any limb fit;
     * fits share its records and leave them unchanged.
     */
    pose: IAutoMoviePose;

    /**
     * The posture's own limb goals, world goals turned by its whole-body
     * rotation.
     */
    limbs: IAutoMovieMotionHumanPosture["limbs"];

    /**
     * The pose whose joints stood in for unset bones, when the assembly was
     * made on one.
     */
    base?: IAutoMoviePose;
  }

  /**
   * Assemble a posture's direct part (`assembleHumanPosture`).
   *
   * @param body The performer's body.
   * @param posture The posture.
   * @param base A pose whose joints replace clinical zero for unset bones.
   * @param projection A projector the caller passes along; the body's own
   *   projects.
   * @returns The assembly.
   *
   *   Root, heading, direct joints and their ROM projection do not depend on the
   *   limb goals, so one assembly serves every fit of the same direct posture.
   *   One O(B) assembly and projection; the caller owns the result and nothing
   *   is retained.
   */
  export function assemble(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    base?: IAutoMoviePose,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAssembled {
    const assembled: ReturnType<typeof assembleHumanPosture> =
      assembleHumanPosture(body, posture, base, projection);
    return {
      posture,
      pose: assembled.pose,
      limbs: assembled.limbs,
      ...(base === undefined ? {} : { base }),
    };
  }

  /**
   * Fit limb goals and the assembly's digits on an assembly, as the owned
   * resolve does after assembling.
   *
   * @param body The performer's body.
   * @param assembled The assembly; left unchanged.
   * @param limbs Goals replacing the assembled posture's own, authored in the
   *   same world as they are (turned here by the posture's whole-body
   *   rotation); absent, the posture's own.
   * @param near Each limb's nearby fit to continue.
   * @param resolution Optional FK reader or lazy supplier of the same
   *   synchronous evaluation.
   * @returns The pose with the goals and digits fitted, and each fitted limb's
   *   seed and value.
   *
   *   The same ordered refit and digit fit as `owned`, so fitting the posture's
   *   own goals on its assembly is the owned resolve of that posture. Each call
   *   pays its fits only; the assembly's records are shared, never written.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    assembled: IAssembled,
    limbs?: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    assess?: HumanLimbPair.Assessment,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return fitted(
      body,
      limbs === undefined
        ? assembled
        : {
            ...assembled,
            limbs: turnHumanPosture({ ...assembled.posture, limbs }).limbs,
          },
      near,
      resolution,
      requested,
      assess === undefined
        ? refitHumanPosture.constructed
        : (
            ...args: Parameters<typeof refitHumanPosture>
          ): ReturnType<typeof refitHumanPosture> =>
            refitHumanPosture.constructed(...args, assess),
    );
  }

  /**
   * Transfer fresh assembled and fitted records within their owning operation.
   * The caller supplies no borrowed base, and its reader is absent or lent:
   * assembly creates every result record from the raw demands, which it only
   * reads, and a native reader lends exact FK alone, so no result record
   * aliases the caller's.
   *
   * Defines actual private-source and reader premises and the fresh-result
   * transfer. The assembler creates every direct joint/root, the refit writes
   * only the records it solves, and digits operate on that owned pose. Selects
   * `refitHumanPosture.constructed` in the same solve composition; the public
   * entry selects the plain refit and clones at its boundary. No supplied base,
   * public ownership switch, private cached result, fixture-specific path or
   * changed numerical rule is accepted. Omits the public entry's whole-result
   * clone while retaining one assembly and all required fitting/admission;
   * speedup is unmeasured. Reuses original projection, selected goals and digit
   * owners. Every fit is solved afresh; native reader admission supplies no
   * numerical proof. Transfers owned pose/seed/value records to its synchronous
   * owner, without retaining the source, borrowed reader, outputs or query
   * history.
   */
  export function owned(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return solve(
      body,
      posture,
      undefined,
      near,
      resolution,
      requested,
      projection,
      refitHumanPosture.constructed,
    );
  }

  /**
   * Resolve the owned free-curve snapshot with current hinged correction.
   *
   * States private snapshot/native-reader premises and the curve's explicit
   * constrained continuation policy. Uses identical canonical assembly and
   * current goals; only the actual owned curve selects
   * refitHumanPosture.continued and subsequently admits its actual physical
   * result. Shares solve with ordinary owned and independent source
   * entrypoints; no separate numerical solver or raw ownership flag is added.
   * Does not change public cold/near selection, source admission, contact
   * policy, target, ROM or tolerance. Selects prepared current hinged
   * correction before generic cold setup where supported; all actual
   * physical/continuity checks remain and gains are unmeasured. Actual private
   * source construction establishes ownership while exact current values and
   * explicit algorithm policy govern memo equivalence. Transfers owned current
   * records to the preparation; the source, reader and callback never enter
   * result history.
   */
  export function continued(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return solve(
      body,
      posture,
      undefined,
      near,
      resolution,
      undefined,
      projection,
      refitHumanPosture.continued,
    );
  }
}

/** Keep canonical composition and current requested-goal admission in one owner. */
function solve(
  body: IAutoMovieMotionHumanBody,
  raw: IAutoMovieMotionHumanPosture,
  base: IAutoMoviePose | undefined,
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  refit: (
    ...args: Parameters<typeof refitHumanPosture>
  ) => ReturnType<typeof refitHumanPosture>,
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  return fitted(
    body,
    resolveHumanPostureSource.assemble(body, raw, base, projection),
    near,
    resolution,
    requested,
    refit,
  );
}

/**
 * The second half of the composition: the assembly's goals fitted in order,
 * then its digits.
 */
function fitted(
  body: IAutoMovieMotionHumanBody,
  assembled: resolveHumanPostureSource.IAssembled,
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  refit: (
    ...args: Parameters<typeof refitHumanPosture>
  ) => ReturnType<typeof refitHumanPosture>,
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  const posture: IAutoMovieMotionHumanPosture = {
    ...assembled.posture,
    limbs: assembled.limbs,
  };
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const limbs: IAutoMovieMotionHumanPosture["limbs"] =
    requested === undefined || Object.keys(near).length !== 0
      ? posture.limbs
      : selectHumanPostureGoals(body, posture, requested);
  const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = refit(
    body,
    assembled.pose,
    limbs,
    near,
    read,
  );
  return {
    ...solved,
    pose: HumanDigitFit.fitted(
      body,
      solved.pose,
      posture.digits,
      read,
      requested,
    ),
  };
}
