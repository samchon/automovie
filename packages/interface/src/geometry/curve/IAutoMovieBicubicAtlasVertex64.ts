import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Mutable allocation cursor and analytic patch-jet callback used by atlas vertices.
 *
 * @evidence contracts/development/design.md#principled-representation A safe global index cursor is separate from millimetre analytic queries and dimensionless normalized normals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The atlas emitter supplies these contracts to each patch's vertex owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Jet regularity only qualifies the evaluated normal, not position finiteness or whole-surface immersion.
 * @evidence contracts/development/common.md#meaningful-documentation Cursor and callback contracts define mutation, chart coordinates, units and exception propagation.
 */
export namespace IAutoMovieBicubicAtlasVertex64 {
  /**
   * Global append cursor shared by all patch vertex owners in one generator run.
   *
   * @evidence contracts/development/design.md#principled-representation nextIndex is a nonnegative safe global render index initialized from vertexOffset; allocation checks that the increment remains safe.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The atlas emitter shares one mutable cursor with every patch vertex closure to preserve append-only indexing across chunks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reusing a shared vertex does not increment the cursor or allocate another render receipt.
   * @evidence contracts/development/common.md#meaningful-documentation Defines index scope, initialization, mutation and safe-integer admission.
   */
  export type ICursor = {
    /** Next unused global render index, including vertexOffset; incremented only after a new vertex position is admitted. Preserve this object across chunk changes. */
    nextIndex: number;
  };

  /**
   * Synchronous analytic query of an admitted prepared root patch. p is its
   * zero-based input ordinal and u,v are dimensionless unit-square coordinates.
   * The emitter's implementation captures prepared plans and allocates fresh
   * position/normal tuples; callers must preserve plans throughout use. Errors
   * propagate to patch emission, which records local unprocessed work.
   *
   * @evidence contracts/development/design.md#principled-representation Position uses model millimetres; the dimensionless normal is normalized du cross dv and regular reports only a finite positive cross-product norm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The vertex owner calls this callback to obtain first-owner analytic normals independently from canonical shared positions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A false regular flag publishes a zero normal, without fabricating a tangent plane or claiming geometric regularity elsewhere.
   * @evidence contracts/development/common.md#meaningful-documentation Defines ordinal/parameter inputs, output units, retained plans and error propagation.
   */
  export type IJet = (
      p: number,
      u: number,
      v: number,
    ) => {
      /** Analytic root-grid position in model millimetres, before the vertex owner converts to metres or substitutes a canonical shared position. */
      position: AutoMovieVector3Tuple;

      /** Unit du cross dv in model coordinates when regular, otherwise [0,0,0]; not an outward-orientation certificate. */
      normal: AutoMovieVector3Tuple;

      /** Whether the evaluated analytic normal has finite positive length. This flag does not independently validate position finiteness or global immersion. */
      regular: boolean;
    };
}
