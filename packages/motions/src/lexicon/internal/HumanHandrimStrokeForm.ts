import type { AutoMovieHumanSide } from "@automovie/interface";

/*
 * The handrim stroke's form: the sides, the gaps and the sampling intervals the
 * push is laid and refused by.
 */
export namespace HumanHandrimStrokeForm {
  /*
   * The two hands that act together in this stroke.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /*
   * The existing motion support bound in metres for a fitted contact.
   */
  export const CONTACT_GAP: number = 0.01;

  /*
   * The staged facing tolerance in degrees for the sitter and the chair.
   */
  export const SEAT_HEADING_GAP: number = 2;

  /*
   * Intervals between the bounded grip-fit samples over the push.
   */
  export const PUSH_INTERVALS: number = 8;

  /*
   * Largest one-sided read interval in seconds for the material angular rate.
   */
  export const RIM_RATE_INTERVAL: number = 0.001;
}
