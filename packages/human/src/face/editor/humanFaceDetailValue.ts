import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { humanFaceDetailDefinition } from "./humanFaceDetailDefinition";
import { humanFaceRegionValue } from "./humanFaceRegionValue";
import type { IAutoMovieHumanFaceDetailChannel as IAutoMovieHumanFaceDetailChannelImported } from "../../index";


/**
 * Read one present scalar from the final applied anatomical profile.
 * The complete document resolves first; a missing optional path yields undefined.
 *
 * @evidence contracts/common.md#principled-implementation Exact catalogue path traversal reads the fully resolved region/side so intermediate and detailed inheritance match construction. Typed admitted profile objects establish path/scalar shape; this accessor is not independent hostile-object schema validation.
 * @evidence contracts/common.md#clear-and-simple-design Definition lookup, full region interpretation and leaf traversal have separate shared owners, avoiding a second edit-precedence formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown ids/invalid sides propagate shared refusals and missing optional paths remain undefined; no guessed neutral or copied opposite-side scalar fills absence.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes final applied value from raw override and missing optional paths; returned number is a scalar copy and resolution may reject the whole document.
 * @evidence contracts/performance.md#efficient-algorithms D path steps are small, but catalogue lookup and complete document/profile resolution plus clones dominate; reading one scalar is not O(D) overall.
 * @evidence contracts/performance.md#reuse-equivalent-work This reader shares canonical definition and region resolution with writers/builders; mutable document edits are interpreted anew rather than reusing old leaf values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar/undefined transfers; resolved profile/document temporaries become collectible and no model/history/resource is retained.
 */
export function humanFaceDetailValue(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  side?: "right" | "left",
): number | undefined {
  const definition: IAutoMovieHumanFaceDetailChannelImported = humanFaceDetailDefinition(id);
  let value: unknown = humanFaceRegionValue(document, definition.region, side);
  for (const key of definition.path) {
    if (value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value as number | undefined;
}
