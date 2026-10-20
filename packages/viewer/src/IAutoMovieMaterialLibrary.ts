import type * as THREE from "three";

/**
 * A shot-owned table of model-declared materials lent to non-model drawables.
 *
 * @evidence contracts/common.md#principled-implementation Material ids resolve against admitted complete model declarations before one shared runtime material is built per requested identity; null requests the borrowing renderer's default.
 * @evidence contracts/common.md#clear-and-simple-design Resolve lends materials while dispose closes the shot-owned table; texture clones stay in the separate shot texture cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting or missing declarations refuse in the producer instead of selecting whichever model appears first.
 * @evidence contracts/common.md#meaningful-documentation States borrowing rules, null default semantics, library material ownership and separate texture-cache retirement order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The library interface executes no declaration search or material build.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It exposes shared materials, but identity admission and cache behavior belong to buildAutoMovieMaterialLibrary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no material; its producer and dispose callback own the shot's runtime material lifetime.
 */
export interface IAutoMovieMaterialLibrary {
  /**
   * Return the one built material selected by an id, or `undefined` for the
   * renderer-owned default selected by `null`.
   *
   * The returned object remains owned by this library. A surface builder may
   * borrow it but must not dispose it.
   *
   * @evidence contracts/common.md#principled-implementation Resolves only admitted requested ids to their one library-owned material; null selects a renderer-owned default and unknown or disposed requests refuse.
   * @evidence contracts/common.md#clear-and-simple-design A synchronous resolver is the borrowing surface's entire material capability, keeping declaration search and construction out of drawables.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unrequested material never falls back to a similarly named or first-built entry.
   * @evidence contracts/common.md#meaningful-documentation Documents null/undefined default meaning and the returned object's borrowed ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The producer implements one Map lookup, with no mesh or model traversal during resolution.
   * @evidence contracts/performance.md#reuse-equivalent-work Every request for the same admitted id borrows the same built material for this shot.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resolution lends an existing object and transfers no disposal responsibility to the surface.
   */
  resolve: (material: string | null) => THREE.Material | undefined;

  /**
   * Release every material built by this library, exactly once.
   *
   * Texture instances remain owned by the shot texture cache and are released
   * separately, after the materials that refer to them.
   *
   * @evidence contracts/common.md#principled-implementation Independently attempts every built material and preserves a single failure or ordered aggregate while marking the library closed before release begins.
   * @evidence contracts/common.md#clear-and-simple-design Material retirement closes this library alone; texture-cache disposal follows under the shot owner's separate lifetime.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed material release stays a failure on repeated calls rather than being replaced with a successful no-op or silently skipping later materials.
   * @evidence contracts/common.md#meaningful-documentation States exact-once material retirement and separate texture ownership and ordering.
   * @evidence contracts/performance.md#efficient-algorithms Attempts one operation per distinct material and deletes successful entries, with failure collection proportional to owned material count.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated disposal shares the first completion or stored failure identity and never repeats physical disposal attempts.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful material references leave the library; failed materials remain retained with the stored failure while the external shot cache continues owning texture wrappers.
   */
  dispose: () => void;
}
