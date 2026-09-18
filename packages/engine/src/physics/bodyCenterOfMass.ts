import { IAutoMovieModel, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
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

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** How much a transform's scale multiplies a solid's volume. */
const scaleVolume = (t: IAutoMovieTransform): number =>
  t.scale.x * t.scale.y * t.scale.z;

/** Apply a full TRS transform to a local point. */
const applyTransform = (
  t: IAutoMovieTransform,
  p: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.add(
    t.translation,
    Quaternion.rotateVector(t.rotation, {
      x: p.x * t.scale.x,
      y: p.y * t.scale.y,
      z: p.z * t.scale.z,
    }),
  );
