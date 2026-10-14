import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";

/**
 * Generates one skin part as a control cage with its boundary rings, from resolved measurements and the skeleton.
 *
 * Each part has one generator class in its own module under `parts/<part>`, refined alone from every side before it is joined. Generators never import each other: they meet only through the rings the junction joins, so replacing one, as a species profile replaces a human ear with an elf ear, leaves every other part unchanged. A generator reads detailed measurements and the skeleton only, never traits, and emits the same connectivity for every identity; only positions follow the measurements.
 *
 * @template Part The skin part this generator produces
 * @author Samchon
 */
export interface IAutoMovieHumanPartGenerator<Part extends AutoMovieHumanPart> {
  /** The part this generator produces. */
  readonly part: Part;

  /**
   * Generate the part's cage.
   *
   * @param props Measurements, skeleton and, for a bilateral part, the side
   * @returns Cage in the skeleton's model frame and millimetres, with one ring per junction site of the part, in the site order the part documents
   */
  generate(props: IAutoMovieHumanPartGenerator.IProps<Part>): IAutoMovieHumanCage;
}
export namespace IAutoMovieHumanPartGenerator {
  /**
   * What one generation reads. The inputs are not mutated.
   *
   * @template Part The skin part being generated
   * @author Samchon
   */
  export interface IProps<Part extends AutoMovieHumanPart> {
    /** Resolved measurements of the person. */
    measurements: IAutoMovieHumanMeasurements;

    /** The person's skeleton, which places the part and its ring frames. */
    skeleton: IAutoMovieHumanSkeleton;

    /** Which side to generate for a bilateral part; null for the trunk, neck and head. */
    side: Side<Part>;
  }

  /**
   * The side argument a part takes: a side for the bilateral arm, hand, leg, foot and ear, null otherwise.
   *
   * @template Part The skin part being generated
   */
  export type Side<Part extends AutoMovieHumanPart> = Part extends
    | "arm"
    | "hand"
    | "leg"
    | "foot"
    | "ear"
    ? AutoMovieHumanSide
    : null;
}
