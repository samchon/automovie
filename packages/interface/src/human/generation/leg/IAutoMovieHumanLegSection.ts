import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegAxis } from "./IAutoMovieHumanLegAxis";

/** Type contracts exchanged by AutoMovieHumanLegSection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegSection {
  /** One station's section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One station's section.
   * @evidence contracts/development/design.md#principled-representation `frame`: The section plane. `local`: Points in the plane, `[x, z, lift]`, one per phase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegSection.of. Also types AutoMovieHumanLegChain.section, AutoMovieHumanLegChain.here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `local`; callers supply the complete record.
   */
  export interface ISection {
    /** The section plane. */
    frame: IAutoMovieHumanLegAxis.IFrame;

    /** Points in the plane, `[x, z, lift]`, one per phase. */
    local: AutoMovieVector3Tuple[];
  }

  /** The centre argument of AutoMovieHumanLegSection.of. The section at station s, canonical.
  @param law The leg's section law.
  @param frames The leg's frames.
  @param centre The centre line: the chart origin's offset from the frame origin at a station.
  @param strip The root strip from the crotch ring down the law's crotch reach: its ring at a share of the reach, 0 at the crotch ring, composed by the leg chain (`AutoMovieHumanLimbRootStrip`).
  @param ankle The root strip from the foot's ankle ring up the law's ankle reach: its ring at a share of the reach, 0 at the ankle ring.
  @param s The station.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section at station s, canonical.
 * @evidence contracts/development/design.md#principled-representation The section at station s, canonical. The callable takes s and returns [number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegSection.OfCentre is the canonical exchange used by AutoMovieHumanLegSection.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.
 */
  export type OfCentre = (s: number) => [number, number];

  /** The strip argument of AutoMovieHumanLegSection.of. The section at station s, canonical.
  @param law The leg's section law.
  @param frames The leg's frames.
  @param centre The centre line: the chart origin's offset from the frame origin at a station.
  @param strip The root strip from the crotch ring down the law's crotch reach: its ring at a share of the reach, 0 at the crotch ring, composed by the leg chain (`AutoMovieHumanLimbRootStrip`).
  @param ankle The root strip from the foot's ankle ring up the law's ankle reach: its ring at a share of the reach, 0 at the ankle ring.
  @param s The station.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section at station s, canonical.
 * @evidence contracts/development/design.md#principled-representation The section at station s, canonical. The callable takes w and returns AutoMovieVector3Tuple[].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegSection.OfStrip is the canonical exchange used by AutoMovieHumanLegSection.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.
 */
  export type OfStrip = (w: number) => AutoMovieVector3Tuple[];

  /** The ankle argument of AutoMovieHumanLegSection.of. The section at station s, canonical.
  @param law The leg's section law.
  @param frames The leg's frames.
  @param centre The centre line: the chart origin's offset from the frame origin at a station.
  @param strip The root strip from the crotch ring down the law's crotch reach: its ring at a share of the reach, 0 at the crotch ring, composed by the leg chain (`AutoMovieHumanLimbRootStrip`).
  @param ankle The root strip from the foot's ankle ring up the law's ankle reach: its ring at a share of the reach, 0 at the ankle ring.
  @param s The station.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section at station s, canonical.
 * @evidence contracts/development/design.md#principled-representation The section at station s, canonical. The callable takes w and returns AutoMovieVector3Tuple[].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegSection.OfAnkle is the canonical exchange used by AutoMovieHumanLegSection.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSection.of for the section at station s, canonical.
 */
  export type OfAnkle = (w: number) => AutoMovieVector3Tuple[];
}
