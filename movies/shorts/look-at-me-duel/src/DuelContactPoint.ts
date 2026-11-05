import type { AutoMovieHumanClinicalIk } from "@automovie/human";

/**
 * One actual visible rigid surface witness carried by a generated bone.
 * @evidence contracts/common.md#implementation-and-ownership The selector measures this point on actual emitted triangles or vertices. It is not a joint-centre substitute. Its carrier remains fixed during a held contact.
 * @evidence contracts/common.md#authoring-interface Bone-local coordinates are metres. Apply the current public drawing bone matrix once to obtain the current world surface point; recreate if geometry changes.
 */
export interface DuelContactPoint {
  bone: AutoMovieHumanClinicalIk.ITarget["bone"];
  localPoint: [number, number, number];
}
