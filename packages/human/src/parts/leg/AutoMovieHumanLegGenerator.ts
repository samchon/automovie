import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { buildAutoMovieHumanLegCage } from "./buildAutoMovieHumanLegCage";

/**
 * Leg from mid thigh to the ankle, with the knee, as a quad control cage generated from the person's measurements and skeleton.
 *
 * Twelve stations run down the limb at named anatomical levels, denser around the knee so the cage has loops to fold on, each section shaped from the measured girths, the bone axis, the superficial muscles, bony landmarks and fat pads, and scaled so its limit surface keeps the identity's girths; twelve spans narrow to the ankle ring's eight in two patches on the sides of the lower shank. See `buildAutoMovieHumanLegCage` for the topology, `planAutoMovieHumanLegStations` for the levels and girths and `shapeAutoMovieHumanLegSection` for the form.
 *
 * Chart: `u` from 0 at the mid thigh ring to 1 at the ankle ring along the bone axis, `v` counterclockwise about the distal axis from the anterior mark.
 *
 * Rings, in order: `thigh`, `ankle`.
 *
 * @author Samchon
 */
export class AutoMovieHumanLegGenerator implements IAutoMovieHumanPartGenerator<"leg"> {
  /** The part this generator produces. */
  public readonly part = "leg" as const;

  /**
   * Generate one leg's cage.
   *
   * @param props Measurements, skeleton and the side of the leg
   * @returns Cage in the skeleton's model frame and millimetres, with the `thigh` ring first and the `ankle` ring second
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"leg">,
  ): IAutoMovieHumanCage {
    return buildAutoMovieHumanLegCage(props);
  }
}
