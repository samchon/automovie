import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed deltoid volume or MRI fat fraction, distinct from skin relief.
 *
 * Its clavicular, acromial and scapular-spine origins converge on the humeral
 * deltoid tuberosity. A whole-muscle volume does not reveal their separate
 * bellies or the skin shift during humeral elevation. A future generator must
 * resolve those bony attachments and the muscle's own volume before using it
 * to support the axillary or shoulder surface.
 * @author Samchon
 */
export type IAutoMovieHumanBodyDeltoidMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
