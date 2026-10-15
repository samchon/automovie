import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { buildAutoMovieHumanArmCage } from "./buildAutoMovieHumanArmCage";

/**
 * Arm from mid upper arm to the wrist, with the elbow: eleven loops of eight control points along the humerus and forearm bones.
 *
 * Loops sit at the upper cut, the biceps peak, the narrowing above the elbow, the epicondyles, the joint line, and down the forearm at its upper swell, maximum girth, the end of the bellies, the flattened tendinous half and the wrist; three of them gather around the elbow for flexion. Each loop's radii come from the identity's upper arm, forearm and wrist circumferences, a fat layer from body fat, the bony breadths of the elbow and wrist, and superficial muscle relief scaled by muscularity (see `sectionAutoMovieHumanArm`). The cage is fitted so its limit surface passes through those sections and reproduces the three measured girths.
 *
 * The chart runs `u` from mid upper arm (0) to the wrist (1) along the bones and `v` counterclockwise about the distal axis from the anterior mark, which turns a quarter turn down the mid-prone forearm to the palmar surface of the wrist.
 *
 * Rings, in order: `upperArm`, `wrist`.
 *
 * @author Samchon
 */
export class AutoMovieHumanArmGenerator implements IAutoMovieHumanPartGenerator<"arm"> {
  public readonly part = "arm" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"arm">,
  ): IAutoMovieHumanCage {
    return buildAutoMovieHumanArmCage(
      props.measurements,
      props.skeleton,
      props.side,
    );
  }
}
