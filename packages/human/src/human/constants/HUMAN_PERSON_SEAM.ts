/**
 * The conventions by which a face basis and a body basis are joined at the
 * neck. Every length the seam uses is measured from the two bases; what is
 * fixed here are the names of the materials and the thresholds of the
 * measurements, each stated with what it means, so a change is one edit with
 * one meaning.
 *
 * - `skinMaterial` is the material id both bases give their skin. The seam
 *   finds each anatomy's skin surface as the surface that draws it.
 * - `neckShare` is the fraction of the skin around the collar that the neck
 *   and head bones must still carry for the skin to count as neck. The seam's
 *   reach is the geodesic distance from the retained collar within which the
 *   body's own skin weights say the neck (or head) is the dominant bone for at
 *   least this share of the vertices, that is, the extent of the neck as the
 *   body's rig defines it (`measureHumanNeckReach`). Half means the neck
 *   carries the majority of the skin inside the reach.
 * - `jawShare` is the weight above which the face's mandible attachment
 *   counts as carrying a vertex: a vertex the jaw carries more than half is
 *   the mandible's skin. The face skin's neck ends, and its head-carried skin
 *   begins, at the lowest such vertex (`createHumanPersonFaceSkin`), which is
 *   the chin's underside in the face's own shape.
 * - `minimumBlendMetres` is a numerical floor on that length (one
 *   millimetre), so a face whose jaw-carried skin reaches the cut still has a
 *   defined blend.
 * - `hairCullMetres` is the distance beyond which a hair vertex is taken to
 *   be clear of the body without asking the signed query (five centimetres,
 *   about a hand's thickness). It bounds the cost of the hair contact and
 *   changes an answer only for a vertex buried deeper than it.
 * - `radialGuard` bounds, as a multiple of the body loop's greatest distance
 *   from the neck axis, which vertices the covered band may take: only skin
 *   close to the neck can lie in the band both anatomies describe, so an arm
 *   raised beside the head is never mistaken for neck.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_SEAM = {
  skinMaterial: "skin",
  neckShare: 0.5,
  jawShare: 0.5,
  minimumBlendMetres: 0.001,
  hairCullMetres: 0.05,
  radialGuard: 1.5,
} as const;
