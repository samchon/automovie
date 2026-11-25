/**
 * Independent width, plantar-depth and dorsal-depth shares relative to the web
 * section. Runtime construction and admission remain with
 * AutoMovieHumanFootToeTaper in Human.
 */
export namespace IAutoMovieHumanFootToeTaper {
  /**
   * Independent dimensionless half-width, plantar-depth and dorsal-depth shares
   * relative to the values at the toe web, in that order. These are scale
   * factors, not a position or derivative jet.
   */
  export type AtResult = [
    halfWidthShare: number,
    plantarDepthShare: number,
    dorsalDepthShare: number,
  ];
}
