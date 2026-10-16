import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { loftAutoMovieHumanHead } from "./loftAutoMovieHumanHead";

/**
 * Generates the head: the cranial vault and the one continuous face surface, open at the neck top and at both ear attachments.
 *
 * The head is lofted ({@link loftAutoMovieHumanHead}): sections from under the vertex to the neck-top ring through guide curves the landmarks and measurements fix, and the face laid out over them as a network of quads whose concentric loops round the eyes and the mouth are the lines along which expressions fold. Every person gets the same connectivity; only positions follow the measurements.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  /** The part this generator produces. */
  public readonly part = "head" as const;

  /**
   * Generate the head's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its three rings
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"head">,
  ): IAutoMovieHumanCage {
    return loftAutoMovieHumanHead(props.measurements, props.skeleton);
  }
}
