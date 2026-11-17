/** Type contracts exchanged by AutoMovieHumanFootKnots; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootKnots {
  /** A guide region.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide region.
   * @evidence contracts/development/design.md#principled-representation A guide region. The closed alternatives are "crestForefoot", "crestAnkle", "lateralForefoot", "lateralHeel", "lateralColumn", "medialForefoot", "medialNavicular", "medialColumn", "contactLateralBall", "contactLateralMidfoot", "contactLateralHeel", "contactMedialBall", "contactMedialMidfoot", "contactMedialHeel", "heelCornerLateral", "heelCornerMedial", "achillesLateral", "achillesMedial".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootKnots.knots. Also types AutoMovieHumanFootKnots.GUIDES.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootKnots.GUIDES, AutoMovieHumanFootKnots.knots, AutoMovieHumanFootKnots.guide for a guide region.
   */
  export type Region =
    | "crestForefoot"
    | "crestAnkle"
    | "lateralForefoot"
    | "lateralHeel"
    | "lateralColumn"
    | "medialForefoot"
    | "medialNavicular"
    | "medialColumn"
    | "contactLateralBall"
    | "contactLateralMidfoot"
    | "contactLateralHeel"
    | "contactMedialBall"
    | "contactMedialMidfoot"
    | "contactMedialHeel"
    | "heelCornerLateral"
    | "heelCornerMedial"
    | "achillesLateral"
    | "achillesMedial";
}
