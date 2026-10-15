import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { fitAutoMovieHumanTrunk } from "./fitAutoMovieHumanTrunk";

/**
 * The trunk: torso and pelvis, the shoulder girdle with the deltoid and the armpit, and the hip and groin with the gluteal region and the upper thigh, open at the neck base, mid upper arms and mid thighs.
 *
 * Generation runs from the skeleton and the measurements alone. A continuous body is laid through the skeleton's landmarks and the measured sections: the back follows the vertebral column's curves, the front lies the measured depth ahead of it, the pelvis hangs from the iliac spines and the hips, the shoulders from the clavicles and acromia. Thirteen loops of twenty-four columns sample it at the trunk's natural lines, superficial muscles and fat lift and sink the loops in their overlap order, the breasts rise from the girth the bust adds, and the shoulder and hip placements shape the openings, the arm stubs with the deltoid and the upper thighs. The sections are then fitted until the subdivided surface measures the identity's chest, underbust, waist, buttock, hip breadth and thigh.
 *
 * Every person gets the same connectivity; only positions follow the measurements.
 *
 * Rings, in order: `neckBase`, `upperArm` left, `upperArm` right, `thigh` left, `thigh` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanTrunkGenerator implements IAutoMovieHumanPartGenerator<"trunk"> {
  public readonly part = "trunk" as const;

  /**
   * Generate the trunk's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its five rings
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"trunk">): IAutoMovieHumanCage {
    return fitAutoMovieHumanTrunk(props.measurements, props.skeleton).cage;
  }
}
