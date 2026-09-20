import type { AutoMovieHumanFaceOverride } from "../AutoMovieHumanFaceOverride";
import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Replace only one exact detailed profile. The incoming profile is bound to the
 * current basis revision; unrelated traits, sides and profiles remain untouched.
 * Undefined removes the selected override and restores inherited interpretation.
 * Geometry and complete schema admission still precede editor publication.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Preserves unrelated settings when a region is replaced or reset to inheritance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Rejects stale-basis replacement and keeps one explicit override owner.
 */
export function replaceHumanFaceRegion<
  K extends (typeof humanFaceRegions)[number],
>(props: {
  document: IAutoMovieHumanFaceDocument;
  basisId: string;
  region: K;
  side?: "right" | "left";
  value: AutoMovieHumanFaceOverride<IAutoMovieHumanFaceRecipe[K]> | undefined;
}): IAutoMovieHumanFaceDocument {
  assertRegion(props.region, props.side);
  if (props.basisId !== props.document.basis.id)
    throw new Error(
      "Region replacement belongs to a different face basis revision.",
    );
  const document = structuredClone(props.document);
  const value = structuredClone(props.value);
  if (props.side !== undefined) {
    const asymmetry = (document.asymmetry ??= {});
    const selected = (asymmetry[props.side] ??= {});
    // assertRegion restricts this owner to the three independently paired profiles.
    Object.assign(selected, { [props.region]: value });
    if (value === undefined)
      delete selected[props.region as "eye" | "ear" | "cheek"];
  } else {
    const detail = (document.detail ??= {});
    Object.assign(detail, { [props.region]: value });
    if (value === undefined) delete detail[props.region];
  }
  return document;
}

function assertRegion(region: string, side?: string): void {
  if (!(humanFaceRegions as readonly string[]).includes(region))
    throw new Error("Unknown anatomical face region.");
  if (
    side !== undefined &&
    ((side !== "right" && side !== "left") ||
      (region !== "eye" && region !== "ear" && region !== "cheek"))
  )
    throw new Error(
      "Only eyes, cheeks and pinnae have independent side-profile overrides.",
    );
}
