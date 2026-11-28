import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/** Section and angular sample count for metre radius reconstruction. */
export namespace IAutoMovieSampleSweepSection {
  /**
   * Borrowed section and angular resolution for one radial profile.
   *
   * The direction walk is sampled, so construct a counterclockwise star about
   * the section origin between probes as well. Non-centred curves are bisected
   * against their polar angle rather than interpolated along walk chords.
   */
  export type IProps = {
    /**
     * One section in metre X/Y axes. Parameterized curves require observed
     * counterclockwise polar progression around the origin.
     */
    section: IAutoMovieSweepSection;

    /**
     * Supply a safe integer of at least three. The radii occupy consecutive
     * evenly spaced angles beginning on the first axis, with no duplicate
     * endpoint.
     */
    count: number;
  };
}
