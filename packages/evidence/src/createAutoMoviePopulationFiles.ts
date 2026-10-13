import type { AutoMoviePopulationLayer } from "./AutoMoviePopulationLayer";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";

const FIRST_DELIVERY_GROUP: RegExp = /^001-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Selects authored unit files for one film narrative layer.
 *
 * The returned globs are relative to a claim rooted at `docs` and always use POSIX separators. Treatments are a flat event sequence in every mode. A film pilot narrows the two delivery-partitioned layers to one exact `001-*` directory; complete production and its post-pilot reset select every group.
 *
 * @evidence contracts/common.md#principled-implementation Flat treatments remain complete, while a declared first pilot selects exactly its validated 001-* script or screenplay group.
 * @evidence contracts/common.md#clear-and-simple-design The production-scope selector is separate from physical filesystem admission and delivery index generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete reset retains the complete population; the pilot exception follows scope rather than observed file count.
 * @evidence contracts/common.md#meaningful-documentation Returned POSIX globs are docs-relative, omit group indexes and reject unsupported layer or malformed pilot identity.
 * @evidence contracts/performance.md#efficient-algorithms A fixed branch decision and partition-name regex require time proportional to the supplied name and constant-sized output.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable regex is shared; fresh selectors reflect the current layer and scope without cached project state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one returned selector array and no file handle is acquired.
 */
export function createAutoMoviePopulationFiles(
  layer: AutoMoviePopulationLayer,
  scope: AutoMoviePopulationScope,
): string[] {
  if (layer === "treatments") return ["treatments/???-*.md"];
  if (layer !== "scripts" && layer !== "screenplays")
    throw new Error(`Unsupported scoped authored layer ${String(layer)}.`);

  if (
    scope.mode === "complete-production" ||
    scope.mode === "complete-production-reset"
  )
    return [`${layer}/*/???-*.md`];
  if (scope.mode !== "first-pilot")
    throw new Error(
      `Unsupported authored population scope ${String((scope as { mode?: unknown }).mode)}.`,
    );
  if (
    scope.partitionGroup === undefined ||
    !FIRST_DELIVERY_GROUP.test(scope.partitionGroup)
  )
    throw new Error(
      "A film pilot requires one exact 001-lower-kebab-case script and screenplay partition-group directory.",
    );
  return [`${layer}/${scope.partitionGroup}/???-*.md`];
}
