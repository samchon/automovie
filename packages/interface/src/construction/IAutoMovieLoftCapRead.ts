import type { IAutoMovieLoftSectionJet } from "./IAutoMovieLoftSectionJet";

/** Original-cap station preparation shared by the cap reader and loft jet cache. */
export namespace IAutoMovieLoftCapRead {
  /**
   * Prepared local section and actual frame derivatives at a station owned by
   * an original cap. The native callback takes polar radians and returns fresh
   * local vectors. The three copied frame rows are value, first and second
   * physical-station derivatives, each packed as [origin.xyz, u.xyz, v.xyz].
   * The origin uses mm, unitless and 1/mm. The axes use unitless, 1/mm and
   * 1/mm².
   *
   * A station outside original cap ownership returns null. The collapsed tip,
   * unavailable scalar derivatives, absent axis derivative callback or a
   * missing or malformed axis jet cause LoftCapRead.jet to throw. The loft jet
   * cache retains the prepared callback and rows.
   */
  export type IJetResult = {
    /**
     * Evaluate local [u,v] position and partials at finite polar phase phi in
     * radians; the closure retains its prepared scalar geometry and returns
     * fresh mutable vectors. Numeric admission failures throw.
     */
    native: (phi: number) => IAutoMovieLoftSectionJet;

    /**
     * Three copied rows in value, first-station and second-station order, each
     * [origin.xyz, u.xyz, v.xyz]. Origin units are mm, unitless and 1/mm; axis
     * units are unitless, 1/mm and 1/mm². Consumers preserve these mutable rows
     * while the station plan is cached.
     */
    f: number[][];
  } | null;
}
