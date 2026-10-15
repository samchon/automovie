import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { fitAutoMovieHumanTrunk } from "./fitAutoMovieHumanTrunk";

/**
 * The trunk: torso and pelvis, the shoulder girdle with the deltoid and the armpit, and the hip and groin with the gluteal region and the upper thigh, open at the neck base, mid upper arms and mid thighs.
 *
 * Generation runs from the skeleton and the measurements alone. A continuous body is laid through the skeleton's landmarks and the measured sections: the back follows the vertebral column's curves, the front lies the measured depth ahead of it, the pelvis hangs from the iliac spines and the hips, the shoulders from the clavicles and acromia. One continuous family of loops, twenty-four columns each, samples it along the trunk's natural lines; the breasts and the gluteus maximus masses rise as smooth fields from the girth the bust adds and the buttock depth; and the shoulder and hip placements shape the openings, the arm stubs with the deltoid and the upper thighs. Every coefficient of this form is in `AUTOMOVIE_HUMAN_TRUNK_FORM`, fitted against MakeHuman CC0 bodies. Superficial muscle relief is not modelled at this stage: the gross form is fitted first. The sections are then fitted until the subdivided surface measures the identity's chest, underbust, waist, buttock, hip breadth and thigh.
 *
 * Every person gets the same connectivity; only positions follow the measurements.
 *
 * Rings, in order: `neckBase`, `upperArm` left, `upperArm` right, `thigh` left, `thigh` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanTrunkGenerator implements IAutoMovieHumanPartGenerator<"trunk"> {
  /** The part this generator produces. */
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
