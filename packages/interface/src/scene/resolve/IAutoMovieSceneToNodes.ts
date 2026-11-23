import type { IAutoMoviePropSpec } from "../../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../../model/IAutoMovieModel";
import type { IAutoMovieScene } from "../IAutoMovieScene";

/** Data and callback contracts shared by the SceneToNodes operations. */
export namespace IAutoMovieSceneToNodes {
  /**
   * Lower scene rest placements, cameras/lights and registered
   * skeleton/prop-articulation subtrees into general nodes. Supplied registries
   * must resolve each required model and may not conflict; explicit
   * partial-model callers retain placements while omitting unregistered
   * subtrees. composeScene separately rejects duplicate ids, missing parents
   * and cycles.
   */
  export type IProps = {
    /** The staged scene to lower. */
    scene: IAutoMovieScene;
    /** Placed models by model id; omit for a placements-only lowering. */
    models?: Record<string, IAutoMovieModel>;
    /**
     * Forged props by prop node id (= model id, the staging join `forgeProp`
     * gates). A placement resolving here lowers its articulation joints under
     * the placement group, the placement pass `IAutoMoviePropSpec` promises.
     */
    props?: Record<string, IAutoMoviePropSpec>;
    /**
     * Permit a partial registry, retaining placements but omitting unregistered
     * model subtrees. Only resolver callers that deliberately own a subset
     * (such as articulated-prop inspection) should use this escape hatch.
     */
    allowPartialModels?: boolean;
  };
}
