

/**
 * World-space phase readings independent of physical-station derivative availability.
 *
 * @evidence contracts/development/design.md#principled-representation A point and first/nullable second phase derivative use one fixed physical station and one normalized piece coordinate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ProfilePhase supplies PreparedConstructionProfile.phase without requiring complete station total2.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null second order remains distinct from zero; unavailable first order is refused by the reader.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies derivative variables and partial-capability behavior.
 */
export namespace IAutoMovieConstructionProfilePhase {
  /**
     * Actual world value and phase derivatives at one fixed physical station.
     *
     * ProfilePhase maps original local derivatives through the station's plane
     * and scales them by the signed piece-clock span and its square. Each query
     * returns fresh mutable vectors after checking their finite components.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives world millimetres, normalized derivative units, fresh ownership and nullable second order.
     * @evidence contracts/development/design.md#principled-representation The same point and two phase orders preserve a fixed station while allowing second order to remain unavailable.
     * @evidence contracts/development/design.md#minimal-and-owned-surface PreparedConstructionProfile.phase returns precisely the point and phase capability consumed by profile readers.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader validates finite coordinates and frame vectors but does not infer absent derivatives from nearby samples.
     */
    export interface IReading {
      /** World point, kernel millimetres. */
      p: [number, number, number];

      /** First derivative per normalized piece coordinate. */
      t: [number, number, number];

      /** Second derivative in millimetres per squared normalized piece coordinate, or null where the owner supplies no phase2. */
      tt: [number, number, number] | null;
    }
}
