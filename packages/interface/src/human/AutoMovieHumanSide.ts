/**
 * A person's own anatomical side, independent of camera or scene orientation.
 * Human's limb construction and clinical controls use the same identities.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A person's own anatomical side, independent of camera or scene orientation.
 * @evidence contracts/development/design.md#principled-representation A person's own anatomical side, independent of camera or scene orientation. The closed alternatives are "left", "right".
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanSide is the canonical exchange used by side, AutoMovieHumanLimbRest.arms, AutoMovieHumanLimbRest.legs, AutoMovieHumanLimbRest.create.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by side, AutoMovieHumanLimbRest.arms, AutoMovieHumanLimbRest.legs, AutoMovieHumanLimbRest.create for a person's own anatomical side, independent of camera or scene orientation.
 */
export type AutoMovieHumanSide = "left" | "right";
