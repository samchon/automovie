import type { AutoMovieCurveParentContext } from "./AutoMovieCurveParentContext";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Contracts for constructing caller-owned curve regions in boundary dependency order. The engine routes exact fields; callers assign region and node meaning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents publication responsibility, upstream map keys and returned ownership.
 * @evidence contracts/development/design.md#principled-representation Represents Contracts for constructing caller-owned curve regions in boundary dependency order: companion namespace of 3 members (`Result`, `Factory`, `Output`); units and frames named in its text: world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieCurveAssembly64` in packages/engine/src/geometry/curve/IAutoMovieCurveAssembly64.ts; its surface is the 3 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
      value: C.Boundary;
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
  export interface Factory<T extends Result> {
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
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
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
