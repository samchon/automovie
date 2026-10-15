/**
 * Builds the two height planes of a gable and the one height plane of a lean-to roof from stated support lines.
 * Roof position, slope, thickness and candidate regions are inputs of the calling space owner and are not
 * chosen here. Returned pieces are convex planar regions in planar-domain orientation with their top-face
 * equation, and the vertical thickness is the normal thickness divided by the cosine of the slope.
 */
import { RoofRules } from "./RoofRules";

/** Vertical thickness at slope. */
export const roofVerticalThickness = (rules: RoofRules, slope: number): number =>
  rules.normalThickness / Math.cos(slope);

