/**
 * Anatomical direction on a body cross-section, named as in the anatomical position.
 *
 * On a limb the names keep their anatomical meaning whatever the rest pose does to the limb: the anterior of the wrist is the palmar surface, the forearm's flexor compartment, even though the palm faces down in the T-pose. Medial is toward the body's midline and lateral away from it.
 *
 * @author Samchon
 */
export type AutoMovieHumanDirection =
  | "anterior"
  | "posterior"
  | "medial"
  | "lateral"
  | "superior"
  | "inferior";
