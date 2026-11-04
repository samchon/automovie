import type { AuthoredLayer } from "../../AuthoredLayer";
import type { NarrativeScope } from "../../NarrativeScope";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingsFiles } from "../../createSettingsFiles";

/**
 * Selects authored unit files relative to body, revision, or the naturalness working tree.
 *
 * Settings accepts the legacy flat layout or numbered subject folders. Its
 * dedicated outline remains outside canon selectors. Narrative layers retain
 * their release partition or flat short screenplay and delegate to their own selector.
 * `referenceLocation` qualifies lineage targets against the revision snapshot;
 * both logical passes host the same current manuscript paths.
 *
 * @evidence contracts/common.md#principled-implementation Settings uses its dedicated flat/classified canon selector excluding outline navigation, while narrative layers delegate to the scope-validating partition/flat-short selector; all outputs remain relative to the selected pass root.
 * @evidence contracts/common.md#clear-and-simple-design This dispatcher owns the authored-layer distinction and delegates narrative pilot/complete-work rules rather than repeating their validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy flat settings and exact first-part pilots are supported layouts/scopes; invalid narrative scope is rejected by the shared selector rather than widened to a matching fixture.
 * @evidence contracts/common.md#meaningful-documentation The prose names supported settings layouts, outline exclusion, partitioned or flat-short narrative selection and revision-reference qualification.
 * @evidence contracts/performance.md#efficient-algorithms Each branch returns at most two selectors; narrative branches also validate scope text, so cost/storage are bounded by the selected scope/path text and independent of manuscript size.
 * @evidence contracts/performance.md#reuse-equivalent-work The same settings/narrative selector helpers serve hosts and references; fresh returned selector arrays keep config mutations local and no filesystem membership is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the one- or two-string result; this dispatcher opens no handle, starts no task and retains no population state.
 */
export function createUnitFiles(
  layer: AuthoredLayer,
  scope: NarrativeScope,
): string[] {
  if (layer === "settings") return createSettingsFiles();
  return createNarrativeUnitFiles(layer, scope);
}
