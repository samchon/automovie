import { Transform } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { createHumanPostureCurve } from "../posture/createHumanPostureCurve";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Read the compiled canonical articulation of an actual native held curve.
 * The displayed owner calls this only before any composition has changed the
 * raw result of this exact source callback. Layers, carries and overlays keep
 * their original evaluator, and outer stops/transitions/clamps still execute.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact source-callback provenance, unchanged direct source observation, native reader requirement, current rig guard, fresh full world pose and ordinary unsupported fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Actual immutable complete no-goal clinical coefficients compose with one unchanged deterministic ROM projection. Their canonical root-frame articulation is constant; actual current raw root/Euler placement uses the existing transform and heading owners, without a time-sampled equivalence claim.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure createHumanPostureCurve owns source provenance and the actual canonical solve; this displayed consumer owns its private compiled observation and returns independent world outputs. The caller still owns every subsequent displayed stage.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown/wrapped callbacks or foreign readers return undefined, and altered composition never calls this entry. No caller readiness flag, missing derivative assumption, omitted clamp/contact stage, fixture switch or approximate pose replay is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Acquire one actual canonical solve per native source/body epoch; subsequent calls perform full rig checking, one O(B) independent pose copy and constant root placement. Avoids repeated direct assembly/projection and independent issuing; gains remain unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact callback identity locates the constructor's actual immutable coefficients, not a sampled answer. Current complete rig/ROM guards establish compiled equivalence, and mismatch reacquires the original resolver under the new epoch. Root values come from the actual unmodified source read.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak source and body keys own one private O(B) canonical observation per live pair; invalidation replaces that observation without a linked history. Public poses/nested roots are fresh and no query time, source output, FK loan, handle or task is retained.
 */
export function prepareHumanFixedPose(
  body: IHumanBody,
  source: IHumanActionPlan["posture"],
  raw: IHumanPosture,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
): IAutoMoviePose | undefined {
  if (!prepareHumanPoseResolution.isNativeSource(resolution)) return undefined;
  let bodies: WeakMap<IHumanBody, createHumanPostureCurve.IConstant> | undefined = FIXED.get(source);
  let fixed: createHumanPostureCurve.IConstant | undefined = bodies?.get(body);
  if (fixed !== undefined && !fixed.unchanged()) {
    bodies!.delete(body);
    fixed = undefined;
  }
  if (fixed === undefined) {
    fixed = createHumanPostureCurve.fixed(body, source);
    if (fixed === undefined) return undefined;
    if (bodies === undefined) { bodies = new WeakMap(); FIXED.set(source, bodies); }
    bodies.set(body, fixed);
  }
  const pose: IAutoMoviePose = structuredClone(fixed.pose);
  pose.root = Transform.of(structuredClone(raw.root), resolveHumanPosture.heading(raw));
  return pose;
}

/** Compiled immutable coefficients are owned by live source/body epochs, never query times. */
const FIXED: WeakMap<IHumanActionPlan["posture"], WeakMap<IHumanBody, createHumanPostureCurve.IConstant>> = new WeakMap();
