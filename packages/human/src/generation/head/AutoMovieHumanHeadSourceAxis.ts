import { AutoMovieViewOutline, AutoMovieViewParallelAxis, type AutoMovieViewAxis } from "@automovie/engine";
import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";

/**
 * Author a head part's parallel planes from their original coordinate curves.
 * The engine owns interpolation and retains this exact metre declaration
 * for the head tree; no frame function is sampled back into another axis.
 *
 * @evidence contracts/common.md#principled-implementation Converts authored coordinate curves and their root/angle endpoints once, then uses the engine's common source-axis factory.
 * @evidence contracts/common.md#clear-and-simple-design One unit adapter supplies both actual source frames and declarative tree replay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer knots or tangents from an existing axis, rotate the planes, fit a reference or replace an admission failure.
 * @evidence contracts/common.md#meaningful-documentation States source ownership, metre serialization, millimetre evaluation and explicit failure.
 * @evidence contracts/performance.md#efficient-algorithms Linear conversion and three engine source preparations in the authored knot count.
 * @evidence contracts/performance.md#reuse-equivalent-work Factory metadata retains the same declaration for the tree without reevaluating frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned axis owns its copied declaration through the engine; no global Human cache is retained.
 */
export namespace AutoMovieHumanHeadSourceAxis {
  /**
   * Prepare authored world-mm origin curves and fixed unit chart directions.
   *
   * @evidence contracts/common.md#principled-implementation Preserves each original coordinate parameter and fixed basis through the engine's mm-to-metre source conversion and factory.
   * @evidence contracts/common.md#clear-and-simple-design Returns the actual factory axis or throws its named source failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never reconstructs an axis from sampled frames or suppresses a failed source premise.
   * @evidence contracts/common.md#meaningful-documentation States units and the distinction between authored source curves and arbitrary frame functions.
   * @evidence contracts/performance.md#efficient-algorithms O(n) source conversion followed by the engine's linear preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work The tree later retrieves the original declaration from this exact axis identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned axis and its owned engine metadata survive.
   */
  export function of(origin: AutoMovieViewParallelAxis.IOrigin, u: [number, number, number], v: [number, number, number]): AutoMovieViewAxis.IAxis {
    const declaration: IAutoMovieConstructionParallelAxis = {
      type: "parallel",
      origin: { x: AutoMovieViewOutline.scale(origin.x, 0.001, 0.001), y: AutoMovieViewOutline.scale(origin.y, 0.001, 0.001), z: AutoMovieViewOutline.scale(origin.z, 0.001, 0.001) },
      u: { x: u[0], y: u[1], z: u[2] },
      v: { x: v[0], y: v[1], z: v[2] },
    };
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewParallelAxis.from(declaration);
    if (typeof axis === "string") throw new Error(`Head source axis: ${axis}`);
    return axis;
  }
}
