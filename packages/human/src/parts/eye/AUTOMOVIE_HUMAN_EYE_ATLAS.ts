/**
 * The eyeball's texture layout: a polar map centred on the pupil, the one layout every eye's images are painted for.
 *
 * A point of the globe at azimuth φ about the line of sight, counterclockwise from the person's left seen from the front, and at radial parameter ρ samples the image at `(0.5 + ρ cos φ, 0.5 + ρ sin φ)`. ρ runs from the pupil's centre over the iris to the limbus, down the limbal wall, and back over the sclera to the posterior pole on the image's inscribed circle, each stretch in proportion to its own arc. The map has no seam, so no texture or normal splits anywhere on the globe; its one singular point is the posterior pole, which the orbit hides. The iris takes the inner disc of the image at a fixed share whatever the eye's size, so one image serves every eye of the same iris colour and its pixels go where a viewer looks.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_EYE_ATLAS = {
  /** ρ at the iris root, where the iris meets the limbal wall. */
  iris: 0.2,

  /** ρ at the limbus, the top of the limbal wall where the sclera starts. */
  limbus: 0.215,

  /** ρ at the posterior pole, the image's inscribed circle. */
  pole: 0.5,
} as const;
