import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { planAutoMovieHumanNeckCut } from "../../junction/planAutoMovieHumanNeckCut";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { loftAutoMovieHumanNeck } from "./loftAutoMovieHumanNeck";

/**
 * Generate the lower neck between its shared base and straight tube cut.
 *
 * The head owns the complete jaw floor, cervical turn and circumference proxy
 * plane. The lower neck never travels outside its endpoints to fit that plane.
 * The chart retains u from base to cut and v from the anterior midline.
 *
 * @author Samchon
 */
export class AutoMovieHumanNeckGenerator implements IAutoMovieHumanPartGenerator<"neck"> {
  /** The part this generator produces. */
  public readonly part = "neck" as const;

  /** Generate the cage and its two shared rings. */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"neck">): IAutoMovieHumanCage {
    const shape: (site: "neckBase" | "neckTop") => IAutoMovieHumanRingShape = (site: "neckBase" | "neckTop"): IAutoMovieHumanRingShape =>
      shapeAutoMovieHumanRing({skeleton: props.skeleton, measurements: props.measurements,
        site, side: null, part: "neck"});
    const base: IAutoMovieHumanRingShape = shape("neckBase");
    const top: IAutoMovieHumanRingShape = shape("neckTop");
    return loftAutoMovieHumanNeck({base, top, plan: planAutoMovieHumanNeckCut(props.skeleton, base)});
  }
}
