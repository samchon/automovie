/**
 * The conventions by which a face basis and a body basis are joined at the
 * neck. None of them is an anatomical measurement; each is a construction
 * choice that keeps the seam local to the neck, and each is named here so a
 * change is one edit with one meaning.
 *
 * - `skinMaterial` is the material id both bases give their skin. The seam
 *   finds each anatomy's skin surface as the surface that draws it.
 * - `reachMetres` is how far along the body's skin, measured from the retained
 *   loop, the neck follows the face's neck when the two documents ask for
 *   different necks. It is authored to span the visible neck below the collar
 *   and stop before the shoulder slope, so a wider or longer face neck
 *   reshapes the neck and leaves the trapezius, clavicle and shoulder where
 *   the body put them. It has no source; the seam is observed at the
 *   extremes of both bases' neck channels to see whether it holds.
 * - `headBlendMetres` is how far above the face's neck cut, measured up the
 *   neck, the face skin changes from following the body's own skin weights at
 *   the seam to following the head alone. Below it the face's neck skin is
 *   carried by the neck as the body's skin at the collar is, so the two skins
 *   turn together across the seam; above it the jaw, chin and skull are the
 *   head's. It is authored to end at about the chin, whose front stands
 *   15.6 mm above the neutral cut, so the chin is rigid with the head and the
 *   skin under it is not; it has no source and is observed under head turns.
 * - `radialGuard` bounds, as a multiple of the body loop's greatest distance
 *   from the neck axis, which vertices the covered band may take: only skin
 *   close to the neck can lie in the band both anatomies describe, so an arm
 *   raised beside the head is never mistaken for neck.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_SEAM = {
  skinMaterial: "skin",
  reachMetres: 0.04,
  headBlendMetres: 0.015,
  radialGuard: 1.5,
} as const;
