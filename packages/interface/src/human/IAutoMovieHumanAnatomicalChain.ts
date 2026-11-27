import type { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/** Reusable anatomical chain selection; no activity or film catalogue. */
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
      /**
       * Digit identity within the selected hand or foot; the region determines
       * the allowed vocabulary.
       */
      digit: "thumb" | "index" | "middle" | "ring" | "little";
    }
  | {
      /** Discriminant selecting the anatomical chain family. */
      region: "toe";
      /** Person's own anatomical side, independent of camera orientation. */
      side: AutoMovieHumanSide;
      /**
       * Digit identity within the selected hand or foot; the region determines
       * the allowed vocabulary.
       */
      digit: "hallux" | "second" | "third" | "fourth" | "fifth";
    };
