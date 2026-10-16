import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { fieldAutoMovieHumanDeltoid } from "../fieldAutoMovieHumanDeltoid";
import { loftAutoMovieHumanLimb } from "../loftAutoMovieHumanLimb";
import { IAutoMovieHumanLimbPlan } from "../IAutoMovieHumanLimbPlan";
import { planAutoMovieHumanArm } from "./planAutoMovieHumanArm";

/** Share of the stations' chord length at station `i`. */
const arcShare: (plan: IAutoMovieHumanLimbPlan, i: number) => number = (plan: IAutoMovieHumanLimbPlan, i: number): number => {
  let to: number = 0;
  let total: number = 0;
  plan.stations.forEach((s: IAutoMovieHumanLimbPlan.IStation, k: number): void => {
    if (k === 0) return;
    const d: number = Math.hypot(
      s.centre.x - plan.stations[k - 1]!.centre.x,
      s.centre.y - plan.stations[k - 1]!.centre.y,
      s.centre.z - plan.stations[k - 1]!.centre.z,
    );
    total += d;
    if (k <= i) to += d;
  });
  return to / total;
};

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
  public readonly part: "arm" = "arm" as const;

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

  /**
   * The lower end of the deltoid, the field the trunk's shoulder branch shares (`fieldAutoMovieHumanDeltoid`). The arm's own superficial masses are already part of its girth-fitted sweep.
   *
   * @param props Measurements, skeleton and the side of the arm
   * @returns Displacement, millimetres, outward positive, at a point of the arm's skin
   */
  public relief(
    props: IAutoMovieHumanPartGenerator.IProps<"arm">,
  ): (point: IAutoMovieHumanPartGenerator.IReliefPoint<"arm">) => number {
    const plan: IAutoMovieHumanLimbPlan = planAutoMovieHumanArm(props);
    const deltoid: ReturnType<typeof fieldAutoMovieHumanDeltoid> = fieldAutoMovieHumanDeltoid(props);
    // the shoulder branch does not read the deltoid yet, so the arm takes it in over the rows next to the ring instead of stepping at the ring
    const start: number = plan.stations[2]!.rows > 0 ? arcShare(plan, 2) : 0;
    return (point: IAutoMovieHumanPartGenerator.IReliefPoint<"arm">): number => {
      const t: number = Math.min(1, Math.max(0, point.coordinate.u / start));
      return t * t * (3 - 2 * t) * deltoid(point.position);
    };
  }
}
