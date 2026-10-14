import { type IAutoMovieCameraClearanceRuntime } from "@automovie/engine";
import { IAutoMovieBeatEndState, IAutoMovieProductionDesign, IAutoMovieShotBuildContext, IAutoMovieShotContract, IAutoMovieWorldDesign } from "@automovie/interface";
import type { IProductionExternalMotionAdoption } from "./IProductionExternalMotionAdoption";

/**
 * Inputs for one selected shot registration and its compiler-owned continuity/clearance context. Node resolves the selected path relative to the project root; path confinement belongs to upstream project admission. Authored execution must remain deterministic but is not sandboxed.
 *
 * @evidence contracts/common.md#principled-implementation Separates source identity and borrowed production context from compiler-owned clearance and the optional preceding full-shot beat state; the assembly clones context before authored execution.
 * @evidence contracts/common.md#clear-and-simple-design One internal parameter shape follows the existing assembleShotSource consumer, retaining the exact nested model, formation, lighting and motion capabilities rather than introducing another host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null previous state means no admitted hard-cut continuity, and clearance remains outside authored context. Node path.resolve accepts absolute paths and this parameter type adds no confinement or deterministic isolation; project/source admission supplies those required path premises.
 * @evidence contracts/common.md#meaningful-documentation Documents source resolution, identity, portable context references, width/height pixels, clearance ownership and null previous state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased parameter shape does not clone context or compile motion; assembleShotSource includes those algorithms and authored computation costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type supplies no shot-result cache or equivalence key; current source effects and previous state are handled by the assembly owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no resource; the attempt owns borrowed context and clearance while authored Node code owns any effects it creates.
 * @author Samchon
 */
export interface IProductionShotAssemblyProps {
  /** Contract and selected defineShot registration id. */
  id: string;

  /** Authored module path resolved relative to sourceRoot; upstream admission owns confinement. */
  path: string;

  /** Exact named registration exported by the selected module. */
  exportName: string;

  /** Normalized source text supplied by the attempt; execution reads the Node module. */
  source: string;

  /** Actual project root for selected source and its imported Node modules. */
  sourceRoot: string;

  /** Borrowed production context, cloned before the source build call. */
  context: {
    /** Exact authored measurable contract and production source binding. */
    contract: IAutoMovieShotContract;

    /** Current model recipes keyed by their production design ids. */
    models: IAutoMovieShotBuildContext["models"];

    /** Current admitted derived artifact inventory exposed to source. */
    derivedArtifacts: IAutoMovieShotBuildContext["derivedArtifacts"];

    /** Production lighting, absent when the production declares none. */
    lighting: IAutoMovieShotBuildContext["lighting"];

    /** Current admitted world design used by source and compilation. */
    world: IAutoMovieWorldDesign;

    /** Authored formation designs keyed by production id. */
    formations: IAutoMovieShotBuildContext["formations"];

    /** Builder-owned model records used to admit source model references. */
    runtimeModels: IAutoMovieShotBuildContext["runtimeModels"];

    /** Compiled formation inventories reused by the source oracle and compiler. */
    formationRuntime: IAutoMovieShotBuildContext["formationRuntime"];

    /** Compiled instance-set inventories reused by the source oracle. */
    instanceSetRuntime: IAutoMovieShotBuildContext["instanceSetRuntime"];

    /** Admitted external motion adoptions assigned to this shot. */
    externalMotions: readonly IProductionExternalMotionAdoption[];

    /** Delivery raster dimensions in pixels for camera framing. */
    frameFormat: Pick<
      IAutoMovieProductionDesign["frameFormat"],
      "width" | "height"
    >;
  };

  /** Compiler-owned snapshot and fixed clock; never exposed to shot source. */
  cameraClearance: IAutoMovieCameraClearanceRuntime;

  /** Prior full-shot closing state at the authoritative hard-cut boundary. */
  previous: IAutoMovieBeatEndState | null;
}
