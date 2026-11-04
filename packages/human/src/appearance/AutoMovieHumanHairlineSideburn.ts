/**
 * The sideburn, centred on the vertical in front of the tragus: the margin
 * reaches eye level there (convention of this prototype, from the adult
 * profile: sideburns reaching the level of the eyes), over two knots 8 and 6
 * degrees apart behind the temporal peak.
 */
export namespace AutoMovieHumanHairlineSideburn {
  /** Azimuths the sideburn begins and ends at, degrees (convention). */
  export const AZIMUTHS: [number, number] = [76, 86];

  /** Azimuth gaps behind the temporal peak and between the two knots, degrees (convention). */
  export const GAPS: [number, number] = [8, 6];

  /**
   * The sideburn's knots `[azimuth degrees, height above the eyes mm]`.
   *
   * @param peak The temporal peak's azimuth, degrees
   * @returns Two knots at eye level
   */
  export function knots(peak: number): Array<[number, number]> {
    const first: number = Math.max(AZIMUTHS[0], peak + GAPS[0]);
    return [
      [first, 0],
      [Math.max(AZIMUTHS[1], first + GAPS[1]), 0],
    ];
  }
}
