import type { IAutoMoviePropSpec } from "../../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../../model/IAutoMovieModel";
import type { IAutoMovieScene } from "../IAutoMovieScene";

/**
 * Data and callback contracts shared by the SceneToNodes operations.
 *
 * @evidence contracts/development/design.md#principled-representation The staged scene and optional model/prop registries define rest-placement node lowering, with explicit partial-model permission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface sceneToNodes uses existing scene, model and prop contracts; composeScene separately owns graph id, parent and cycle admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Partial registries preserve placements but omit unregistered subtrees only when explicitly allowed; this cannot claim complete model expansion.
 * @evidence contracts/development/common.md#meaningful-documentation Documents registry identity, omitted-registry behavior and partial lowering ownership.
 */
export namespace IAutoMovieSceneToNodes {
  /**
   * Lower scene rest placements, cameras/lights and registered skeleton/prop-articulation subtrees into general nodes. Supplied registries must resolve each required model and may not conflict; explicit partial-model callers retain placements while omitting unregistered subtrees. composeScene separately rejects duplicate ids, missing parents and cycles.
   *
   * @evidence contracts/development/design.md#principled-representation The staged scene and optional model/prop registries define rest-placement node lowering, with explicit partial-model permission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface sceneToNodes uses existing scene, model and prop contracts; composeScene separately owns graph id, parent and cycle admission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Partial registries preserve placements but omit unregistered subtrees only when explicitly allowed; this cannot claim complete model expansion.
   * @evidence contracts/development/common.md#meaningful-documentation Documents registry identity, omitted-registry behavior and partial lowering ownership.
   */
  export type IProps = {
    /** The staged scene to lower. */
    scene: IAutoMovieScene;
    /** Placed models by model id; omit for a placements-only lowering. */
    models?: Record<string, IAutoMovieModel>;
    /**
     * Forged props by prop node id (= model id, the staging join `forgeProp`
     * gates). A placement resolving here lowers its articulation joints under the
     * placement group, the placement pass `IAutoMoviePropSpec` promises.
     */
    props?: Record<string, IAutoMoviePropSpec>;
    /**
     * Permit a partial registry, retaining placements but omitting unregistered
     * model subtrees. Only resolver callers that deliberately own a subset (such
     * as articulated-prop inspection) should use this escape hatch.
     */
    allowPartialModels?: boolean;
  };
}
