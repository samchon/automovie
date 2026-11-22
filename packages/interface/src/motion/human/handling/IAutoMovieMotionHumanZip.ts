import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Open or close a straight closed-end zipper on a supported stationary pouch.
 *
 * The pouch binds two opposing tab contacts to one independent slider and
 * stationary bracing to its casing. Its lip articulations follow the slider.
 * Positive travel opens the pouch. The shift is in metres from the current
 * travel, so the same action can reverse a partially opened zipper.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the three contacts, model binding, sign, origin and timing.
 * @evidence contracts/development/design.md#principled-representation One signed scalar addresses a straight slider while model-owned followers determine the open side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law reads the prop, opposing tab sites, stationary support, signed travel, duration and working side.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored model contacts and stop limits determine the fingertip goals and final state.
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

  /** Nonzero signed displacement of the tab relative to its current position, metres. */
  travel: number;

  /** Positive stroke duration at unit tempo, seconds. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** Hand pulling the tab. Defaults to the right. */
  side?: AutoMovieHumanSide;
}
