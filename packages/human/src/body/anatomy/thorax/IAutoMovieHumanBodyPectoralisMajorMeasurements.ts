import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed pectoralis-major volume or MRI fat fraction, separate from breast.
 *
 * It spans the clavicle, sternum and anterior thorax to insert on the humerus.
 * That cross-group attachment is part of generated anatomy; the body's
 * current rounded chest exterior cannot serve as a measured muscle boundary.
 * This scalar is a muscle-belly volume, not a breast size, skin-depth
 * displacement or arbitrary pectoral morph gain.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyPectoralisMajorMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
