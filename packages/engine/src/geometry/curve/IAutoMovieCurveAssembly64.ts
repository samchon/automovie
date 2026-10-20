import type { AutoMovieCurveParentContext } from "./AutoMovieCurveParentContext";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Contracts for constructing caller-owned curve regions in boundary dependency order. The engine routes exact fields; callers assign region and node meaning.
 *
 * @evidence contracts/common.md#principled-implementation Factories consume the actual bound upstream boundary objects from one parent context.
 * @evidence contracts/common.md#clear-and-simple-design Result, Factory and Output separate construction callbacks from retained assembly results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The graph declares no anatomical catalogue or sampled display substitute.
 * @evidence contracts/common.md#meaningful-documentation Documents publication responsibility, upstream map keys and returned ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace declares contracts rather than traversing the graph.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Construct-once scheduling is implemented by generateAutoMovieCurveAssembly64.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These types create no context or retained result maps.
 */
export namespace IAutoMovieCurveAssembly64 {
  /**
   * A factory result exposing every boundary that region owns; concrete consumers may extend it with their generated primitives.
   *
   * @evidence contracts/common.md#principled-implementation Named boundary fields keep the generating node beside the complete physical coefficients.
   * @evidence contracts/common.md#clear-and-simple-design A minimal result contract permits region-specific data without engine knowledge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The assembly verifies publication counts instead of inventing missing boundary output.
   * @evidence contracts/common.md#meaningful-documentation States owner publication responsibility and extension by concrete result types.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The result interface performs no coefficient scan.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It does not cache construction results itself.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller receives the result object; this declaration adds no retention.
   */
  export interface Result {
    /**
     * Every owned boundary, paired with the node whose world chart generated it.
     */
    boundaries: readonly {
      /** Node key authenticated as the edge owner when publishing this boundary. */
      bone: string;

      /** Complete transverse position and longitudinal first-variation field. */
      value: C.Boundary;
    }[];
  }

  /**
   * A region callback invoked once after all of its declared incoming operators exist. It receives one resolved parent context before generating local-dependent controls.
   *
   * @evidence contracts/common.md#principled-implementation Upstream objects are the exact immutable values authenticated by context.bind.
   * @evidence contracts/common.md#clear-and-simple-design One region key and one callback define the unit scheduled by the assembly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory must publish all declared outgoing boundaries rather than patching absent inputs afterward.
   * @evidence contracts/common.md#meaningful-documentation Explains callback timing, upstream boundary keys and ownership of returned data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface does not schedule callbacks or choose graph traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The assembly owns construct-once execution, not the callback type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no callback or context.
   */
  export interface Factory<T extends Result> {
    /**
     * Unique caller region key used by incoming and outgoing edge declarations.
     */
    region: string;

    /**
     * Construct this region from the resolved hierarchy and actual incoming values keyed by boundary ID; thrown failures abort assembly without returning a partial output.
     *
     * @evidence contracts/common.md#principled-implementation The callback receives context-authenticated upstream section positions and full longitudinal derivative fields rather than copied selector metadata.
     * @evidence contracts/common.md#clear-and-simple-design One method is the scheduling boundary between generic dependency routing and region-owned coefficient generation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No default body, missing-boundary substitute or sampled-curve fallback is defined by this signature.
     * @evidence contracts/common.md#meaningful-documentation States upstream ID keys, resolved hierarchy timing, concrete result preservation and the effect of a thrown construction failure.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This abstract signature chooses no generation algorithm; each concrete factory owns and documents its coefficient-generation cost.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no calls itself; the assembly scheduler invokes each factory once and shares its published outputs.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature retains no context or field; implementations own any references or resources they keep after the call.
     */
    construct(
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): T;
  }

  /**
   * The completed context, concrete regional results and authentic published operators from one assembly invocation.
   *
   * @evidence contracts/common.md#principled-implementation All values share the context used for actual construction and binding.
   * @evidence contracts/common.md#clear-and-simple-design Maps expose results and publications by the same declared region and boundary keys.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts ReadonlyMap is a type-level view, not a promise that the returned map containers are frozen.
   * @evidence contracts/common.md#meaningful-documentation States shared context identity, lookup keys and map mutability limits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The output type performs no map construction or traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Consumers can reuse the returned results; no hidden global assembly cache exists.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the completed context/maps and releases them by dropping references.
   */
  export interface Output<T extends Result> {
    /**
     * The actual hierarchy and publication authority used during this assembly.
     */
    context: AutoMovieCurveParentContext;

    /**
     * Concrete factory results keyed by region ID; results are retained without cloning.
     */
    regions: ReadonlyMap<string, T>;

    /**
     * Authentic published tokens keyed by boundary ID; bind accepts these same instances.
     */
    operators: ReadonlyMap<string, C.Operator>;
  }
}
