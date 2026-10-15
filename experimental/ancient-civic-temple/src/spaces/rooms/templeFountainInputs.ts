import { templeLevels as y } from "../templeLevels";
import { templeCourtyardPlan } from "./templeCourtyardPlan";

/**
 * Arithmetic centre of room boundaries and member inputs in m, without proving a completed fountain.
 */

export const templeFountainInputs = () => {
  const rimHeight = y.courtyard + 0.52;
  const waterHeight = rimHeight - 0.08;
  return {
    center: {
      x: (templeCourtyardPlan.west + templeCourtyardPlan.east) / 2, y: y.courtyard,
      z: (templeCourtyardPlan.north + templeCourtyardPlan.south) / 2
    },
    outerDiameter: 2,
    rimHeight,
    waterHeight,
    jetTop: waterHeight + 0.65,
  };
};
