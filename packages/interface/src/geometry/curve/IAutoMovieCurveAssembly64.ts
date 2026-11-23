import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryPublication64 } from "./IAutoMovieCurveBoundaryPublication64";
import type { IAutoMovieCurveParentContext } from "./IAutoMovieCurveParentContext";

/** Data and callback contracts shared by the CurveAssembly64 operations. */
export namespace IAutoMovieCurveAssembly64 {
  /**
   * A factory result exposing every boundary that region owns; concrete
   * consumers may extend it with their generated primitives.
   */
  export interface Result {
    /**
     * Every owned boundary, paired with the node whose world chart generated
     * it.
     */
    boundaries: readonly {
      /** Node key authenticated as the edge owner when publishing this boundary. */
      bone: string;

      /** Complete transverse position and longitudinal first-variation field. */
      value: IAutoMovieCurveBoundary64;
    }[];
  }

  /**
   * A region callback invoked once after all of its declared incoming operators
   * exist. It receives one resolved parent context before generating
   * local-dependent controls.
   */
  export interface Factory<T extends IAutoMovieCurveAssembly64.Result> {
    /** Unique caller region key used by incoming and outgoing edge declarations. */
    region: string;

    /**
     * Construct this region from the resolved hierarchy and actual incoming
     * values keyed by boundary ID; thrown failures abort assembly without
     * returning a partial output.
     */
    construct(
      context: IAutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, IAutoMovieCurveBoundary64>,
    ): T;
  }

  /**
   * The completed context, concrete regional results and authentic published
   * operators from one assembly invocation.
   */
  export interface Output<T extends IAutoMovieCurveAssembly64.Result> {
    /** The actual hierarchy and publication authority used during this assembly. */
    context: IAutoMovieCurveParentContext;

    /**
     * Concrete factory results keyed by region ID; results are retained without
     * cloning.
     */
    regions: ReadonlyMap<string, T>;

    /**
     * Authentic published tokens keyed by boundary ID; bind accepts these same
     * instances.
     */
    operators: ReadonlyMap<string, IAutoMovieCurveBoundaryPublication64>;
  }
}
