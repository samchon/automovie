import type { IAutoMoviePropSpec, IAutoMovieScene } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";

/**
 * Compiled prop declarations and already-built scene objects used to lower
 * articulation. The builder reparents referenced parts while preserving their
 * world placement and retains joint rest transforms for subsequent restoration.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Supplies declared prop joints and their actual built model parts.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Keeps scene placement, part identity and joint ownership explicit during attachment.
 * @author Samchon
 */
export interface IBuildPropArticulationProps {
  /**
   * Compiled scene whose placement groups have already been constructed.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Supplies the scene placement identities the prop joints extend.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Retains the existing placement boundary before articulation lowering.
   */
  scene: IAutoMovieScene;

  /**
   * Shot registry whose prop node identities match the compiled scene's models.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Supplies the authored joint and mesh references without synthesizing drivers.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Resolves each prop through its declared registry identity.
   */
  props: readonly IAutoMoviePropSpec[];

  /**
   * Existing placement groups by scene node id, borrowed for adding joint trees.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Selects the exact placed object under which its declared joints are lowered.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Keeps articulation attached to the existing scene placement.
   */
  nodeObjects: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Existing built models by scene node id; named parts may be reparented by the
   * builder, while unresolved parts or placements are refused.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Supplies the actual named part moved by each authored joint.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Preserves part world transforms when transferring them to their articulation frame.
   */
  modelObjects: ReadonlyMap<string, IAutoMovieModelObject>;
}
