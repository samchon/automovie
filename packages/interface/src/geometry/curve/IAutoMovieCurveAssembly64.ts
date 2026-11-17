import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryPublication64 } from "./IAutoMovieCurveBoundaryPublication64";
import type { IAutoMovieCurveParentContext } from "./IAutoMovieCurveParentContext";

/**
 * Data and callback contracts shared by the CurveAssembly64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Named region factories publish physical boundary fields through one resolved context and retain their concrete result type. The constrained generic preserves actual producer results; readonly views do not freeze containers, and dependency/publication validity is checked during assembly.
 * @evidence contracts/development/design.md#principled-representation Named region factories publish physical boundary fields through one resolved context and retain their concrete result type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface generateAutoMovieCurveAssembly64 schedules Factory callbacks and returns Output maps keyed by region and boundary IDs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constrained generic preserves actual producer results; readonly views do not freeze containers, and dependency/publication validity is checked during assembly.
 */
export namespace IAutoMovieCurveAssembly64 {
  /**
   * A factory result exposing every boundary that region owns; concrete consumers may extend it with their generated primitives.
   *
   * @evidence contracts/development/design.md#principled-representation Named boundary fields keep the generating node beside the complete physical coefficients.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A minimal result contract permits region-specific data without engine knowledge.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The assembly verifies publication counts instead of inventing missing boundary output.
   * @evidence contracts/development/common.md#meaningful-documentation States owner publication responsibility and extension by concrete result types.
   */
  export interface Result {
    /**
     * Every owned boundary, paired with the node whose world chart generated it.
     */
    boundaries: readonly {
      /** Node key authenticated as the edge owner when publishing this boundary. */
      bone: string;

      /** Complete transverse position and longitudinal first-variation field. */
      value: IAutoMovieCurveBoundary64;
    }[];
  }

  /**
   * A region callback invoked once after all of its declared incoming operators exist. It receives one resolved parent context before generating local-dependent controls.
   *
   * @evidence contracts/development/design.md#principled-representation Upstream objects are the exact immutable values authenticated by context.bind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One region key and one callback define the unit scheduled by the assembly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The factory must publish all declared outgoing boundaries rather than patching absent inputs afterward.
   * @evidence contracts/development/common.md#meaningful-documentation Explains callback timing, upstream boundary keys and ownership of returned data.
   */
  export interface Factory<T extends IAutoMovieCurveAssembly64.Result> {
    /**
     * Unique caller region key used by incoming and outgoing edge declarations.
     */
    region: string;

    /**
     * Construct this region from the resolved hierarchy and actual incoming values keyed by boundary ID; thrown failures abort assembly without returning a partial output.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The callback receives context-authenticated upstream section positions and full longitudinal derivative fields rather than copied selector metadata.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One method is the scheduling boundary between generic dependency routing and region-owned coefficient generation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default body, missing-boundary substitute or sampled-curve fallback is defined by this signature.
     * @evidence contracts/development/common.md#meaningful-documentation States upstream ID keys, resolved hierarchy timing, concrete result preservation and the effect of a thrown construction failure.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This abstract signature chooses no generation algorithm; each concrete factory owns and documents its coefficient-generation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no calls itself; the assembly scheduler invokes each factory once and shares its published outputs.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature retains no context or field; implementations own any references or resources they keep after the call.
     */
    construct(
      context: IAutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, IAutoMovieCurveBoundary64>,
    ): T;
  }

  /**
   * The completed context, concrete regional results and authentic published operators from one assembly invocation.
   *
   * @evidence contracts/development/design.md#principled-representation All values share the context used for actual construction and binding.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Maps expose results and publications by the same declared region and boundary keys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts ReadonlyMap is a type-level view, not a promise that the returned map containers are frozen.
   * @evidence contracts/development/common.md#meaningful-documentation States shared context identity, lookup keys and map mutability limits.
   */
  export interface Output<T extends IAutoMovieCurveAssembly64.Result> {
    /**
     * The actual hierarchy and publication authority used during this assembly.
     */
    context: IAutoMovieCurveParentContext;

    /**
     * Concrete factory results keyed by region ID; results are retained without cloning.
     */
    regions: ReadonlyMap<string, T>;

    /**
     * Authentic published tokens keyed by boundary ID; bind accepts these same instances.
     */
    operators: ReadonlyMap<string, IAutoMovieCurveBoundaryPublication64>;
  }
}
