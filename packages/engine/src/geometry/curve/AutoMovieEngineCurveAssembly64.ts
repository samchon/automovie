import type {
  IAutoMovieCurveBoundary64,
  IAutoMovieCurveBoundaryEdge64,
  IAutoMovieCurveHierarchyFrame64,
} from "@automovie/interface";

import type { AutoMovieEngineCurveParentContext } from "./AutoMovieEngineCurveParentContext";
import { generateCurveAssembly64 } from "./internal/generateCurveAssembly64";

/** Assemble procedural curve regions that share named boundaries. */
export namespace AutoMovieEngineCurveAssembly64 {
  /**
   * Run each region after its incoming boundaries are published. Invalid
   * graphs, publication failures and callback errors throw without returning
   * a partial assembly. Callers own any callback side effects.
   */
  export function generate<T extends IRegionResult>(props: IProps<T>): IResult<T> {
    return generateCurveAssembly64(props);
  }

  /** Inputs and factories for one assembly. */
  export interface IProps<T extends IRegionResult> {
    /** Local rigid frames, with each parent before its children. */
    frames: readonly IAutoMovieCurveHierarchyFrame64[];

    /** Directed boundary edges, each connecting two declared factories. */
    edges: readonly IAutoMovieCurveBoundaryEdge64[];

    /** Region callbacks retaining their concrete result type. */
    factories: readonly IFactory<T>[];
  }

  /** A factory with one unique caller-defined region key. */
  export interface IFactory<T extends IRegionResult> {
    /** Region key used by its incoming and outgoing edges. */
    region: string;

    /** Construct this region from the resolved frames and upstream boundaries. */
    construct(
      context: AutoMovieEngineCurveParentContext,
      upstream: ReadonlyMap<string, IAutoMovieCurveBoundary64>,
    ): T;
  }

  /** Every boundary owned by a generated region. */
  export interface IRegionResult {
    /** Each owned boundary with the node that generated it. */
    boundaries: readonly IOwnedBoundary[];
  }

  /** A generated boundary and the node whose chart produced it. */
  export interface IOwnedBoundary {
    /** Node authenticated against the routing edge when publishing. */
    bone: string;

    /** Complete section and longitudinal first-variation coefficients. */
    value: IAutoMovieCurveBoundary64;
  }

  /** Completed region assembly and its boundary publication authority. */
  export interface IResult<T extends IRegionResult> {
    /** Resolved hierarchy and authentic boundary binder used by the factories. */
    context: AutoMovieEngineCurveParentContext;

    /** Original factory results keyed by region. */
    regions: ReadonlyMap<string, T>;

    /** Original publication tokens keyed by boundary ID. */
    operators: ReadonlyMap<string, AutoMovieEngineCurveParentContext.IPublication>;
  }
}
