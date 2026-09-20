import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
import { deriveCenterOfMass } from "./deriveCenterOfMass";

/**
 * The model's center of mass: its declared {@link IAutoMovieBody.centerOfMass}
 * when given, else the volume-weighted centroid derived from geometry
 * ({@link deriveCenterOfMass}). `null` when neither is available (no body and no
 * primitive volume to weigh). The single entry point support/balance checks use
 * so an explicit COM (a weighted base) always wins over the geometric one.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-weight-cues Resolves the authoritative center-of-mass proxy used for weight cues.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Gives support checks one declared-or-derived center rather than competing calculations.
 * @author Samchon
 */
export const bodyCenterOfMass = (
  model: IAutoMovieModel,
): IAutoMovieVector3 | null =>
  model.body?.centerOfMass ?? deriveCenterOfMass(model);
