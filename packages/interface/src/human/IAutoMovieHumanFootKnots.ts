/**
 * Closed anatomical region names for forefoot, heel, ankle and plantar-contact
 * guide knots.
 *
 * The interface package owns these declarations; AutoMovieHumanFootKnots in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootKnots {
  /** A guide region. */
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
