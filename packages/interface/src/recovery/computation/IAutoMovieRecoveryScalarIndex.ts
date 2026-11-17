
/**
 * Prepare height intervals once; the caller keeps source arrays unchanged until queries finish. Results contain original face IDs in ascending order. Plane queries include both endpoints; slab queries require positive overlap with the open interval, retaining internal components.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Returns ascending original face indices whose closed height intervals include the finite query level. Returns ascending original face indices with positive overlap with the finite open interval (before,after).
 * @evidence contracts/development/design.md#principled-representation Returns ascending original face indices whose closed height intervals include the finite query level.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoveryOrderedCuts, RecoveryAtlasObservationSource share IAutoMovieRecoveryScalarIndex's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryScalarIndex {
/**
 * Prepare height intervals once; the caller keeps source arrays unchanged until queries finish. Results contain original face IDs in ascending order. Plane queries include both endpoints; slab queries require positive overlap with the open interval, retaining internal components.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Returns ascending original face indices whose closed height intervals include the finite query level. Returns ascending original face indices with positive overlap with the finite open interval (before,after).
 * @evidence contracts/development/design.md#principled-representation Returns ascending original face indices whose closed height intervals include the finite query level.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoveryOrderedCuts, RecoveryAtlasObservationSource share IAutoMovieRecoveryScalarIndex's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Create = (triangles: readonly (readonly [number, number, number])[],
heights: readonly number[]) => {
 
   /** Returns ascending original face indices whose closed height intervals include the finite query level. */
cut: (level: number) => readonly number[];
 
   /** Returns ascending original face indices with positive overlap with the finite open interval (before,after). */
slab: (before: number, after: number) => readonly number[];
  };
}

