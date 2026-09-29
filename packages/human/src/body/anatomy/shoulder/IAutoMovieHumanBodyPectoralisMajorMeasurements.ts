import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed pectoralis-major volume, separate from breast and fat.
 *
 * It spans the clavicle, sternum and anterior thorax to insert on the humerus.
 * That cross-group attachment is part of generated anatomy; the body's
 * current rounded chest exterior cannot serve as a measured muscle boundary.
 * This scalar is a muscle-belly volume, not a breast size, skin-depth
 * displacement or arbitrary pectoral morph gain.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyPectoralisMajorMeasurements {
  /** Pectoralis major alone, beneath the separate breast and adipose tissue. */
  readonly muscleBellyVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
