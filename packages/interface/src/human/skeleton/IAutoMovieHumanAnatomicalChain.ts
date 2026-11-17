import type { AutoMovieHumanSide } from "../AutoMovieHumanSide";

/** Reusable anatomical chain selection; no activity or film catalogue.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Reusable anatomical chain selection; no activity or film catalogue.
 * @evidence contracts/development/design.md#principled-representation Reusable anatomical chain selection; no activity or film catalogue. Alternatives are a record with region, side; a record with region; a record with region, side, digit; a record with region, side, digit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.chain.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanRigControls.chain for reusable anatomical chain selection; no activity or film catalogue.
 */
export type IAutoMovieHumanAnatomicalChain =
  | {
      /** Discriminant selecting the anatomical chain family. */
      region: "arm" | "leg" | "eyes";
      /** Person's own anatomical side, independent of camera orientation. */
      side: AutoMovieHumanSide;
    }
  | {
      /** Discriminant selecting the anatomical chain family. */
      region: "spine" | "neck" | "pelvis";
    }
  | {
      /** Discriminant selecting the anatomical chain family. */
      region: "finger";
      /** Person's own anatomical side, independent of camera orientation. */
      side: AutoMovieHumanSide;
      /** Digit identity within the selected hand or foot; the region determines the allowed vocabulary. */
      digit: "thumb" | "index" | "middle" | "ring" | "little";
    }
  | {
      /** Discriminant selecting the anatomical chain family. */
      region: "toe";
      /** Person's own anatomical side, independent of camera orientation. */
      side: AutoMovieHumanSide;
      /** Digit identity within the selected hand or foot; the region determines the allowed vocabulary. */
      digit: "hallux" | "second" | "third" | "fourth" | "fifth";
    };
