import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanLimbPlan } from "../IAutoMovieHumanLimbPlan";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { fieldAutoMovieHumanLimbRelief } from "../fieldAutoMovieHumanLimbRelief";
import { loftAutoMovieHumanLimb } from "../loftAutoMovieHumanLimb";
import { networkAutoMovieHumanLimb } from "../networkAutoMovieHumanLimb";
import { planAutoMovieHumanLeg } from "./planAutoMovieHumanLeg";

/**
 * Leg from mid thigh to the ankle, with the knee: one sweep along the femur and tibia, lofted through thirteen stations.
 *
 * Stations run down the limb at named anatomical levels, denser around the knee so the cage has rows to fold on, each section shaped from the measured girths, the bone axis and the fat (`planAutoMovieHumanLegStations`, `shapeAutoMovieHumanLegSection`), with the superficial muscles, bony landmarks and fat pads over them as relief (`reliefAutoMovieHumanLeg`). `loftAutoMovieHumanLimb` sweeps them into the cage, holding every station's girth on the limit surface; twelve vertices run around the leg down to the calcaneal tendon, turning to the ankle ring's eight on the medial and lateral sides of the lower shank.
 *
 * Chart: `u` from 0 at the mid thigh ring to 1 at the ankle ring along the bones, `v` counterclockwise about the distal axis from the anterior mark.
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
    return loftAutoMovieHumanLimb(planAutoMovieHumanLeg(props));
  }

  /**
   * The leg's relief: its superficial forms, `AUTOMOVIE_HUMAN_LEG_RELIEF` laid on the skin by `fieldAutoMovieHumanLimbRelief`.
   *
   * @param props Measurements, skeleton and the side of the leg
   * @returns Displacement, millimetres, outward positive, at a point of the leg's skin
   */
  public relief(
    props: IAutoMovieHumanPartGenerator.IProps<"leg">,
  ): (point: IAutoMovieHumanPartGenerator.IReliefPoint<"leg">) => number {
    const plan: IAutoMovieHumanLimbPlan = planAutoMovieHumanLeg(props);
    const limb: (u: number, v: number) => number = fieldAutoMovieHumanLimbRelief(
      plan,
      networkAutoMovieHumanLimb(plan).value,
    );
    return (point: IAutoMovieHumanPartGenerator.IReliefPoint<"leg">): number =>
      limb(point.coordinate.u, point.coordinate.v);
  }
}
