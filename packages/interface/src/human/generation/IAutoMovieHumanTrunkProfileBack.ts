/**
 * Type contracts exchanged by AutoMovieHumanTrunkProfileBack; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanTrunkProfileBack {
  /** The profile. */
  export interface IProfile {
    /** The forward place of the back midline at a height, mm. */
    at: (y: number) => number;

    /**
     * The landmark stations the profile runs through, `[height, forward
     * place]`, mm.
     */
    marks: [number, number][];
  }

  /**
   * The lumbar argument of AutoMovieHumanTrunkProfileBack.apexes. The heights
   * of the lordosis' and the kyphosis' apexes on a profile: the most anterior
   * and the most posterior point of the back's midline between two heights,
   * scanned every 2 mm.
   *
   * @param profile The profile.
   * @param lumbar Lower and upper height of the lumbar span, mm.
   * @param thoracic Lower and upper height of the thoracic span, mm.
   * @returns The lumbar apex's and the thoracic apex's heights, mm.
   */
  export type ApexesLumbar = readonly [number, number];

  /**
   * The thoracic argument of AutoMovieHumanTrunkProfileBack.apexes. The heights
   * of the lordosis' and the kyphosis' apexes on a profile: the most anterior
   * and the most posterior point of the back's midline between two heights,
   * scanned every 2 mm.
   *
   * @param profile The profile.
   * @param lumbar Lower and upper height of the lumbar span, mm.
   * @param thoracic Lower and upper height of the thoracic span, mm.
   * @returns The lumbar apex's and the thoracic apex's heights, mm.
   */
  export type ApexesThoracic = readonly [number, number];

  /**
   * Result of AutoMovieHumanTrunkProfileBack.apexes. The heights of the
   * lordosis' and the kyphosis' apexes on a profile: the most anterior and the
   * most posterior point of the back's midline between two heights, scanned
   * every 2 mm.
   *
   * @param profile The profile.
   * @param lumbar Lower and upper height of the lumbar span, mm.
   * @param thoracic Lower and upper height of the thoracic span, mm.
   * @returns The lumbar apex's and the thoracic apex's heights, mm.
   */
  export type ApexesResult = [number, number];
}
