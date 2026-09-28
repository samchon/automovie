/**
 * How far light travels under the skin before it leaves again, per primary,
 * in metres: the diffuse mean free path Jensen et al. (2001) measured on
 * skin, red 3.67 mm, green 1.37 mm and blue 0.68 mm (their "skin1", index of
 * refraction 1.3). The body's skin material carries it as its
 * `subsurfaceRadius`, so a renderer blurs the skin's diffuse response over
 * that distance: a lit side bleeds soft and red into the shadow where the
 * body curves within a few millimetres (fingers, toes, the rim of a fold),
 * and broad surfaces stay as they were.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Holds the measured scattering distance the body's skin is rendered with.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the skin material's subsurface radius from the measured diffuse mean free path.
 */
export const HUMAN_BODY_SKIN_SCATTERING: { r: number; g: number; b: number } = {
  r: 0.00367,
  g: 0.00137,
  b: 0.00068,
};
