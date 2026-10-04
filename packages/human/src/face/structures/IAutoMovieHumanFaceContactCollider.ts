/**
 * One rigid collider surface of a face basis's oral contact.
 *
 * Colliders are the dental arches and the globes. `closure` triangles seal
 * each crown at its root ring or a globe at its posterior pole; `reachMetres`
 * is the distance within which an open gum sheet's orientation still tells
 * its sides apart; and `coverMetres` is the thinnest soft tissue that lies
 * over the surface (a lid over a globe; zero, the default, where mucosa meets
 * the surface itself, as lips on teeth).
 *
 * @evidence contracts/common.md#principled-implementation Closure triangles and the sheet reach make the rigid surface's inside decidable instead of guessing from vertex proximity.
 * @evidence contracts/common.md#clear-and-simple-design One named record holds the collider surface, its closure, reach and cover.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure and distances are shared basis data, never a per-person tolerance.
 * @evidence contracts/common.md#meaningful-documentation States what each field closes or measures, its unit and the cover default.
 * @evidence contracts/modeling.md#spatial-conventions Closure entries are resident vertex indices; reach and cover are metres in the Y-up head frame.
 * @evidence contracts/modeling.md#shared-boundaries Closure triangles complete each rigid surface so soft tissue is held outside it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record addresses an existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Closure triangles are collision topology and never visible geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated form.
 * @evidence contracts/anatomy.md#anatomical-source The cover is the least soft tissue thickness over the surface, a lid over a globe and zero where mucosa meets teeth.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value; the contact owner refuses penetration by name.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactCollider {
  /** ID of the rigid collider surface. */
  surface: string;

  /** Flat oriented closure triangles over the surface's resident vertices. */
  closure: number[];

  /** Distance within which an open sheet's orientation separates its sides, in metres. */
  reachMetres: number;

  /** Least covering soft tissue thickness, in metres; omission means zero. */
  coverMetres?: number;
}
