import { repaintExecutionContentDigest } from "./repaintExecutionContentDigest";
import { repaintExecutionNonBlank } from "./repaintExecutionNonBlank";
import { repaintExecutionUuid } from "./repaintExecutionUuid";
import { IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintRuntimeIdentity } from "@automovie/interface";
import { canonicalAutoMovieRepaintRuntimeIdentity } from "./renditionIdentity";

/**
 * Requires trimmed namespace/shot, UUIDv4 request, canonical digest/runtime identity, safe seed and an ordinal offset that cannot overflow maximumAttempts.
 *
 * @evidence contracts/common.md#principled-implementation Requires trimmed namespace/shot, UUIDv4 request, canonical digest/runtime identity, safe seed and an ordinal offset that cannot overflow maximumAttempts.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Temporary parsed/canonical identity is local; no claim, timer or provider work starts here.
 * @evidence contracts/performance.md#efficient-algorithms Canonical runtime parsing/serialization scales with identity text; the remaining numeric and regex checks precede clock/provider effects.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary parsed/canonical identity is local; no claim, timer or provider work starts here.
 */
export const repaintExecutionAssertRepaintExecutionIdentity: (props: { productionId: string; shot: string; requestId: string; ordinalOffset?: number; requestFingerprint: string; compileFingerprint: string; sourceRenderFingerprint: string; adapterIdentity: string; seed: number; policy: IAutoMovieRepaintExecutionPolicy; }) => void = (props: {
  productionId: string;
  shot: string;
  requestId: string;
  ordinalOffset?: number;
  requestFingerprint: string;
  compileFingerprint: string;
  sourceRenderFingerprint: string;
  adapterIdentity: string;
  seed: number;
  policy: IAutoMovieRepaintExecutionPolicy;
}): void => {
  repaintExecutionNonBlank(props.productionId, "production id");
  repaintExecutionNonBlank(props.shot, "shot");
  repaintExecutionUuid(props.requestId, "request id");
  repaintExecutionContentDigest(props.requestFingerprint, "request fingerprint");
  repaintExecutionContentDigest(props.compileFingerprint, "compile fingerprint");
  repaintExecutionContentDigest(props.sourceRenderFingerprint, "source render fingerprint");
  let runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;
  try {
    runtimeIdentity = JSON.parse(
      props.adapterIdentity,
    ) as IAutoMovieRepaintRuntimeIdentity;
  } catch {
    throw new Error("Repaint adapter identity must be canonical runtime JSON.");
  }
  if (
    canonicalAutoMovieRepaintRuntimeIdentity(runtimeIdentity) !==
    props.adapterIdentity
  )
    throw new Error("Repaint adapter identity must be canonical runtime JSON.");
  if (Number.isSafeInteger(props.seed) === false)
    throw new Error("Repaint seed must be a safe integer.");
  if (
    props.ordinalOffset !== undefined &&
    (Number.isSafeInteger(props.ordinalOffset) === false ||
      props.ordinalOffset < 0 ||
      props.ordinalOffset >
        Number.MAX_SAFE_INTEGER - props.policy.maximumAttempts)
  )
    throw new Error(
      "Repaint ordinal offset must be a non-negative safe integer.",
    );
};
