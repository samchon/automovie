import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { loftAutoMovieHumanLimb } from "../loftAutoMovieHumanLimb";
import { planAutoMovieHumanArm } from "./planAutoMovieHumanArm";

/**
 * Arm from mid upper arm to the wrist, with the elbow: one sweep along the humerus and forearm bones, lofted through thirteen stations.
 *
 * Stations sit at the upper cut, the biceps peak, the narrowing above the elbow, the epicondyles, the joint line, and down the forearm at its upper swell, maximum girth, the end of the bellies, the flattened tendinous half and the wrist; three of them gather around the elbow for flexion. Each station's section comes from the identity's upper arm, forearm and wrist circumferences, a fat layer from body fat and the bony breadths of the elbow and wrist (`sectionAutoMovieHumanArm`), and the superficial muscles and bony landmarks lie over the sections as relief scaled by muscularity (`AUTOMOVIE_HUMAN_ARM_RELIEF`). `planAutoMovieHumanArm` lays the stations along the bones and `loftAutoMovieHumanLimb` sweeps them into the cage, holding every station's girth on the limit surface.
 *
 * The chart runs `u` from mid upper arm (0) to the wrist (1) along the bones and `v` counterclockwise about the distal axis from the anterior mark, which turns a quarter turn down the mid-prone forearm to the palmar surface of the wrist.
 *
 * Rings, in order: `upperArm`, `wrist`.
 *
 * @author Samchon
 */
export class AutoMovieHumanArmGenerator implements IAutoMovieHumanPartGenerator<"arm"> {
  /** The part this generator produces. */
  public readonly part = "arm" as const;

  /**
   * Generate one arm's cage.
   *
   * @param props Measurements, skeleton and the side of the arm
   * @returns Cage in the skeleton's model frame and millimetres, with the `upperArm` ring first and the `wrist` ring second
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"arm">,
  ): IAutoMovieHumanCage {
    return loftAutoMovieHumanLimb(planAutoMovieHumanArm(props));
  }
}
