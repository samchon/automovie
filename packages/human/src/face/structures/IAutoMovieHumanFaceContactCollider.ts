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
 * @evidence contracts/common.md#principled-implementation Registered rigid surface and source closure incidence support signed side queries only within the authored sheet reach, with optional covering thickness limiting soft rest floors.
 * @evidence contracts/common.md#clear-and-simple-design One collider owns surface, invisible closure, reach and cover while the contact evaluator compiles rest/posed signed queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown side beyond reach or at an open rim supplies no invented floor; closure topology and cover do not establish measured anatomy or globally collision-free skin.
 * @evidence contracts/common.md#meaningful-documentation The comment defines dental/globe closure, sheet reach and cover/default zero; members identify resident index domain and metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no mesh-query compilation or signed-distance evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Collider registration defines no query cache; compilation/reuse belong to contact evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns closure indices and scalar parameters; this type opens no spatial-query resource.
 *
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
