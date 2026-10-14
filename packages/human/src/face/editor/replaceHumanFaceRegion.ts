import type { AutoMovieHumanFaceEditableEyeOverride } from "../AutoMovieHumanFaceEditableEyeOverride";
import type { AutoMovieHumanFaceEditableOverride } from "../AutoMovieHumanFaceEditableOverride";
import type { AutoMovieHumanFaceOverride } from "../AutoMovieHumanFaceOverride";
import { assertHumanFaceEditableDetail } from "../document/assertHumanFaceEditableDetail";
import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { assertRegion } from "./assertRegion";
import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Replace only one exact detailed profile. The incoming profile is bound to the
 * current basis revision; unrelated traits, sides and profiles remain untouched.
 * Undefined removes the selected override and restores inherited interpretation.
 * The result refuses nonempty source geometry arrays in editable detail,
 * including free relief, section and hair-card guides. Source cards in the
 * separately named legacy hair-layer scalar transaction are the exception.
 * Geometry and complete schema admission still precede editor publication.
 *
 * @evidence contracts/common.md#principled-implementation Exact current basis id and region/side ownership select one cloned override; undefined removes that selection so existing inheritance resolves it. Immutable-detail admission prevents new source geometry arrays while later editor build owns complete schema/geometry acceptance.
 * @evidence contracts/common.md#clear-and-simple-design One transaction updates either the common detail or admitted side profile; shared region and editable-population owners provide the rules instead of a second merge/resolution system.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrong basis revision or prohibited nonempty arrays refuse, and unrelated profiles remain untouched. No stale region is fitted to another basis or silently redirected to an opposite side; typed scalar/enum completeness is not checked here.
 * @evidence contracts/common.md#meaningful-documentation Prose gives exact revision, one-profile ownership, undefined inheritance, immutable population restriction and later schema/geometry admission; returned document/value are cloned.
 * @evidence contracts/performance.md#efficient-algorithms Whole document and incoming profile clone costs follow their actual populations, then editable admission traverses override/source guide data; changing one region is not constant overall.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared admission rules and source revision prevent divergent editor interpretation; each mutable transaction owns its copies rather than cached replacement success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new document retains owned arrays/objects; failed local clones become collectible and no model/history/resource is acquired here.
 */
export function replaceHumanFaceRegion<
  K extends (typeof humanFaceRegions)[number],
>(props: {
  document: IAutoMovieHumanFaceDocument;
  basisId: string;
  region: K;
  side?: "right" | "left";
  value:
    | (K extends "hairLayers" | "skinColour"
        ? AutoMovieHumanFaceOverride<IAutoMovieHumanFaceRecipe[K]>
        : K extends "eye"
          ? AutoMovieHumanFaceEditableEyeOverride
          : AutoMovieHumanFaceEditableOverride<IAutoMovieHumanFaceRecipe[K]>)
    | undefined;
}): IAutoMovieHumanFaceDocument {
  assertRegion(props.region, props.side);
  if (props.basisId !== props.document.basis.id)
    throw new Error(
      "Region replacement belongs to a different face basis revision.",
    );
  const document: IAutoMovieHumanFaceDocument = structuredClone(props.document);
  const value: typeof props.value = structuredClone(props.value);
  if (props.side !== undefined) {
    const asymmetry: NonNullable<IAutoMovieHumanFaceDocument["asymmetry"]> =
      (document.asymmetry ??= {});
    const selected: NonNullable<
      NonNullable<IAutoMovieHumanFaceDocument["asymmetry"]>["left"]
    > = (asymmetry[props.side] ??= {});
    // assertRegion restricts this owner to the three independently paired profiles.
    Object.assign(selected, { [props.region]: value });
    if (value === undefined)
      delete selected[props.region as "eye" | "ear" | "cheek"];
  } else {
    const detail: NonNullable<IAutoMovieHumanFaceDocument["detail"]> =
      (document.detail ??= {});
    Object.assign(detail, { [props.region]: value });
    if (value === undefined) delete detail[props.region];
  }
  assertHumanFaceEditableDetail(document);
  return document;
}
