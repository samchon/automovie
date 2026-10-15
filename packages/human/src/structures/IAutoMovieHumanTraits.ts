import { tags } from "typia";

import { AutoMovieHumanPopulation } from "./AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "./AutoMovieHumanSex";

/**
 * A beginner's description of a person: sex, age, stature, reference population and build.
 *
 * Traits never reach modeling. A converter ({@link IAutoMovieHumanConverter}) expands them deterministically into a detailed {@link IAutoMovieHumanIdentity} and a default {@link IAutoMovieHumanAppearance}, using population statistics where they exist, and the person is built from that identity alone. Keep the traits as editing history beside the saved identity: the identity is the canonical state, so a later converter revision never changes a saved person.
 *
 * Build traits are normalized offsets: zero is the reference population's mean for the given sex and age, the sign states the direction, and one is a large but living departure that a converter documents in its own units.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTraits {
  /** Document version. Saved documents of another version are not migrated. */
  version: 1;

  /** Which sex's statistics the converter reads. */
  sex: AutoMovieHumanSex;

  /**
   * Age in years, fractional for infants. No upper limit is imposed; a converter documents the ages its data covers and how it treats the rest.
   */
  age: number & tags.Minimum<0>;

  /**
   * Stature in millimetres, or null for the reference population's median at the given sex and age.
   */
  stature: (number & tags.Minimum<400> & tags.Maximum<2500>) | null;

  /** Reference population whose means the converter starts from. */
  population: AutoMovieHumanPopulation;

  /** Build offsets from the population mean. */
  build: IAutoMovieHumanTraits.IBuild;
}
export namespace IAutoMovieHumanTraits {
  /**
   * Build as four independent offsets, each zero at the population mean.
   *
   * Adiposity and muscularity stay separate because body mass index mixes fat and lean mass: a muscular person and a fat person of equal index differ in where volume sits and in muscle relief.
   *
   * @author Samchon
   */
  export interface IBuild {
    /** Body fat: positive is fatter, negative leaner. */
    adiposity: number & tags.Minimum<-1> & tags.Maximum<1>;

    /** Lean mass: positive is more muscular, negative less. */
    muscularity: number & tags.Minimum<-1> & tags.Maximum<1>;

    /**
     * Skeletal frame: positive is a narrower frame with longer limbs for the stature, negative a broader, shorter-limbed frame.
     */
    slimness: number & tags.Minimum<-1> & tags.Maximum<1>;

    /**
     * Facial neoteny: positive moves the face toward child-like proportions (a vault large relative to the face, larger eyes relative to the face, a shorter nose, a smaller mouth), negative toward a more mature face.
     */
    cuteness: number & tags.Minimum<-1> & tags.Maximum<1>;
  }
}
