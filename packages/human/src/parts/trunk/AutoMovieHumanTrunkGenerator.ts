import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { loftAutoMovieHumanTrunk } from "./loftAutoMovieHumanTrunk";

/**
 * The trunk: torso and pelvis, the shoulder girdle with the deltoid and the armpit, and the hip and groin with the gluteal region and the upper thigh, open at the neck base, mid upper arms and mid thighs.
 *
 * Generation runs from the skeleton and measurements. A horizontal sweep carries the measured torso sections through the axilla; a generated curve network joins it to the shared neck ring through the acromia. Shoulder and hip bridges connect the openings to arm and thigh tubes. The upper trunk uses twelve angular columns, while the pelvic transition adds columns for the groin. Form coefficients in `AUTOMOVIE_HUMAN_TRUNK_FORM` come from the reference-mesh fits. The joined limit surface holds the chest and waist girths and the shared junction rings; other section measurements belong to the profile and are not asserted as exact displaced-skin measurements. This generator adds no superficial muscle relief.
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
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"trunk">,
  ): IAutoMovieHumanCage {
    return loftAutoMovieHumanTrunk(props.measurements, props.skeleton);
  }
}
