import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";
import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";
import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/** Body identity and synchronous element-box lookup for shared placement resolution. */
export namespace IAutoMovieResolveBuiltPlacementBody {
  /**
   * Body identity and synchronous element-box lookup for shared placement resolution.
   *
   * Element parts come from the supplied lookup, permitting one-element measurement or a batch table. Their union has element-origin-point basis when both corners are equal and element-geometry-bounds otherwise. A point can arise from the world-origin fallback or genuine degenerate geometry. Populations delegate to {@link builtInstanceSetPlacementBounds}: compact layouts use an envelope law, explicit layouts fold stored transforms, and along-route throws.
   *
   * Null, undefined or empty part answers resolve to null; the existing part lookups use them for undeclared or transform-only elements. An undeclared population id also returns null.
   *
   * @evidence contracts/development/design.md#principled-representation Element lookup results are world-metre part boxes; null, undefined and empty results mean unresolved, while populations use the environment's existing layout union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Bounds, overlap and support queries inject either a single-element lookup or a shared part table; returned element solids retain those borrowed boxes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback is called synchronously and not retained, its exceptions propagate, and along-route population bounds throw; finite ordered proxy boxes remain a caller premise.
   * @evidence contracts/development/common.md#meaningful-documentation Body identity and synchronous element-box lookup for shared placement resolution. Element lookup results are world-metre part boxes; null, undefined and empty results mean unresolved, while populations use the environment's existing layout union.
   */
  export type IProps = {
    /** Borrowed population definitions; element geometry is supplied by parts instead. */
    environment: IAutoMovieBuiltEnvironment;

    /** Element/population identity to resolve; an unresolved population or null, undefined or empty element-part lookup returns null. */
    target: IAutoMovieBuiltPlacementBodyLocator;

    /**
     * Synchronous borrowed world-metre part-box lookup by element id. Null,
     * undefined or empty means unresolved; returned boxes are retained in the result,
     * while the callback itself is not retained. Lookup exceptions propagate.
     */
    parts: (
      elementId: string,
    ) => readonly IAutoMovieSubjectBox[] | null | undefined;
  };
}
