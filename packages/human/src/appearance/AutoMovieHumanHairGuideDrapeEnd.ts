/**
 * Where lying hair ends over a bump, centred on the bump: the drape, a local
 * 45 degree fall from each bump of the head (`AutoMovieHumanHairEnvelopeDrape`),
 * rises more than {@link DRAPE} mm over the skin, as over the auricle, and
 * the strand is cut short there, as a short cut is above the ear, instead of
 * standing off the side of the head. The test reads the drape, not the
 * envelope: that is a mean over 0.15 radian, which bridges the concave nape
 * under the occiput by more than the limit, and lying hair tested on it ended
 * there and bared the undercoat down the nape.
 */
export namespace AutoMovieHumanHairGuideDrapeEnd {
  /** Rise of the draped envelope over the scalp at which lying hair ends, mm (convention). */
  export const DRAPE: number = 5;

  /**
   * Whether lying hair ends at a point.
   *
   * @param lies Whether the strand lies on the head here
   * @param draped The draped radius there, or 0 where the head does not drape
   * @param over The envelope's radius there
   * @param skin The head skin's radius there
   * @returns True when the strand ends
   */
  export function ends(
    lies: boolean,
    draped: number,
    over: number,
    skin: number,
  ): boolean {
    return lies && (draped > 0 ? draped : over) - skin > DRAPE;
  }
}
