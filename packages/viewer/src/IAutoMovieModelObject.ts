import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieExpressionTarget } from "./IAutoMovieExpressionTarget";
import type { IAutoMovieViewerFrame } from "./IAutoMovieViewerFrame";

/**
 * A built model: its `three.js` root object and a lookup of its bones.
 *
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Keeps this model surface in the compiled transform hierarchy.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes the same hierarchy for render visibility and culling.
 * @author Samchon
 */
export interface IAutoMovieModelObject {
  /**
   * Root group; add this to a scene (or a node group) to display the model.
   *
   * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Keeps this model root in the compiled transform hierarchy.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes that hierarchy for render visibility and culling.
   */
  object: THREE.Group;

  /**
   * Bones by humanoid slot, for posing. Empty for a non-rigged object.
   *
   * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Preserves the compiled bone hierarchy for pose playback.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes that hierarchy as runtime bone objects.
   */
  bones: ReadonlyMap<AutoMovieHumanoidBone, THREE.Object3D>;

  /**
   * Parts by {@link IAutoMovieModelPart.id}, for a caller that has to move one.
   *
   * A prop's articulation joint names the part that rides it, and the only way
   * to make that reference true on screen is to reparent that part under the
   * joint's own object. Found by id rather than by traversing for a name,
   * because a part's `name` is optional and a model may carry two parts sharing
   * one, so a name search would move whichever it reached first.
   *
   * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Keeps this model surface in the compiled transform hierarchy.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes the same hierarchy for render visibility and culling.
   */
  parts: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Optional expression sinks: morph managers, VRM expression managers, etc.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Exposes the expression sinks that own resolved expression channels.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-gaze-expression-attention Materializes those channels at the runtime expression boundary.
   */
  expressionTargets?: readonly IAutoMovieExpressionTarget[];

  /**
   * Optional imported-runtime flush after pose and expression are written.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Flushes imported runtime state only after the exact frame sample is written.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Keeps the imported runtime on the frame's shared motion-clock sample.
   */
  afterAutoMovieFrame?: (frame: IAutoMovieViewerFrame) => void;
}
