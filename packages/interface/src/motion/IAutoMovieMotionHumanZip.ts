import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Open or close a straight closed-end zipper on a supported stationary pouch.
 *
 * The pouch binds two opposing tab contacts to one independent slider and
 * stationary bracing to its casing. Its lip articulations follow the slider.
 * Positive travel opens the pouch. The shift is in metres from the current
 * travel, so the same action can reverse a partially opened zipper.
 */
export interface IAutoMovieMotionHumanZip {
  /** Subject of the fixed pouch prop. */
  pouch: string;

  /** Contact on the tab face taken by the working thumb. */
  thumb: string;

  /** Contact on the opposite tab face taken by that hand's index finger. */
  index: string;

  /** Stationary casing contact for the opposite index finger. */
  brace: string;

  /**
   * Nonzero signed displacement of the tab relative to its current position,
   * metres.
   */
  travel: number;

  /**
   * Positive stroke duration at unit tempo, seconds. Required: no natural value
   * is defined, so the author sets it (provisional: no timing study was read).
   */
  duration: number;

  /** Hand pulling the tab. Defaults to the right. */
  hand?: AutoMovieHumanSide;
}
