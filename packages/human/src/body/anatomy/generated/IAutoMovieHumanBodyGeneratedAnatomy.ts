import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedSkin } from "./IAutoMovieHumanBodyGeneratedSkin";
import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";

/**
 * Resolution report for the connected exterior and individually named parts.
 *
 * A one-piece render skin cannot certify its bones, muscles and adipose. Each internal component reports its own held-out surface validation or a precise unavailable reason. This is generated output, never an authored mesh cache in the body document.
 *
 * @evidence contracts/common.md#principled-implementation The connected skin and every catalogue part independently report validated resolution or a precise unavailable cause.
 * @evidence contracts/common.md#clear-and-simple-design A mapped part record derives exhaustive identity from the maintained catalogue while skin remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A one-piece render cannot certify internal tissues, and generated output never becomes a document mesh cache.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish exterior validation from complete per-part availability reporting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resolution inventory declares output coverage without generating anatomical surfaces.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Catalogue keys describe completeness but coordinate no repeated generator work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The report type creates no retained anatomical cache or runtime resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGeneratedAnatomy {
  /** Single connected body exterior with its own validation. */
  readonly skin: IAutoMovieHumanBodyAnatomicalResolution<
    "skin",
    IAutoMovieHumanBodyGeneratedSkin
  >;

  /** Every named internal component reports a resolved value or refusal. */
  readonly parts: {
    readonly [Id in AutoMovieHumanBodyPartId]: IAutoMovieHumanBodyPartResolution<Id>;
  };
}
