/**
 * A named direction from which a review looks at the displayed human.
 *
 * The set is the one the facial review contract requires (front, the
 * anatomical left and right oblique and profile, back) plus the two poles.
 * Left and right are the figure's, not the viewer's: the figure faces +Z, so
 * its anatomical left lies toward +X and a camera on that side sees the left
 * profile. The body editor uses the same names and directions as the face
 * editor so their observation records compare.
 */
export const HUMAN_OBSERVATION_VIEWS = [
  "front",
  "left-three-quarter",
  "left",
  "back",
  "right-three-quarter",
  "right",
  "top",
  "bottom",
] as const;

/** One of `HUMAN_OBSERVATION_VIEWS`. */
export type HumanObservationView = (typeof HUMAN_OBSERVATION_VIEWS)[number];
