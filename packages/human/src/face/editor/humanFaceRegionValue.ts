import { resolveHumanFaceDocument } from "../document/resolveHumanFaceDocument";
import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { assertRegion } from "./assertRegion";
import { humanFaceRegions } from "./humanFaceRegions";


/**
 * Read the actual combined profile, including an explicitly requested side.
 * Missing optional profiles remain absent rather than becoming invented data.
 *
 * @evidence contracts/common.md#principled-implementation Shared region/side admission precedes complete document interpretation; a clone of the resolved side or common recipe profile reflects the same defaults/control/detail precedence as construction. Optional absence stays undefined.
 * @evidence contracts/common.md#clear-and-simple-design The accessor selects one owner from the existing resolver instead of merging overrides independently; returned cloning protects editor consumers from source aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid side/region refuses and absent optional profile is not invented. Full resolver constraints still apply; this profile read does not admit final mesh/anatomy/appearance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives combined profile, explicit side selection, preserved absence and cloned ownership; reading may fail broader document constraints.
 * @evidence contracts/performance.md#efficient-algorithms Complete document resolution and its population-dependent clones/geometry constraints precede another selected-profile clone; total cost follows document/profile size rather than just a region lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared interpretation guarantees builder/editor precedence agreement; changed document controls/details need fresh resolution and no mutable profile cache is kept.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The selected clone transfers, other resolved data is local, and no history stack, model cache or external handle is retained.
 */
export function humanFaceRegionValue<
  K extends (typeof humanFaceRegions)[number],
>(
  document: IAutoMovieHumanFaceDocument,
  region: K,
  side?: "right" | "left",
): IAutoMovieHumanFaceRecipe[K] {
  assertRegion(region, side);
  const face: ReturnType<typeof resolveHumanFaceDocument> = resolveHumanFaceDocument(document);
  if (
    side !== undefined &&
    (region === "eye" || region === "ear" || region === "cheek")
  )
    return structuredClone(
      face[side][region as "eye" | "ear" | "cheek"],
    ) as IAutoMovieHumanFaceRecipe[K];
  return structuredClone(face.recipe[region]);
}
