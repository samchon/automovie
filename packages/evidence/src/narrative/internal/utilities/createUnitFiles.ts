import type { AuthoredLayer } from "../../AuthoredLayer";
import type { NarrativeScope } from "../../NarrativeScope";
import { createBriefFiles } from "../../createBriefFiles";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingsFiles } from "../../createSettingsFiles";

/**
 * Selects authored unit files relative to the body root.
 *
 * Settings accepts the legacy flat layout, numbered subject folders or the
 * scaffold's domain folders, and a short's brief the domain folders. The
 * settings outline remains outside canon selectors. Narrative layers retain
 * their release partition or film folders and delegate to their own selector.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Settings and brief use their dedicated canon selectors excluding outline navigation, while narrative layers delegate to the scope-validating partition and film-folder selector; all outputs remain relative to the body root.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This dispatcher owns the authored-layer distinction and delegates narrative pilot/complete-work rules rather than repeating their validation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Legacy flat settings and exact first-part pilots are supported layouts/scopes; invalid narrative scope is rejected by the shared selector rather than widened to a matching fixture.
 * @evidence contracts/development/common.md#meaningful-documentation The prose names supported settings layouts, outline exclusion and partitioned or film-folder narrative selection relative to the body root.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each branch returns at most two selectors; narrative branches also validate scope text, so cost/storage are bounded by the selected scope/path text and independent of manuscript size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same settings/narrative selector helpers serve hosts and references; fresh returned selector arrays keep config mutations local and no filesystem membership is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the one- or two-string result; this dispatcher opens no handle, starts no task and retains no population state.
 */
export function createUnitFiles(
  layer: AuthoredLayer,
  scope: NarrativeScope,
): string[] {
  if (layer === "settings") return createSettingsFiles();
  if (layer === "brief") return createBriefFiles();
  return createNarrativeUnitFiles({ layer, scope });
}
