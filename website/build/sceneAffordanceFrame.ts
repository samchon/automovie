import { ArchetypeFrame } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { SceneArchetype } from "../src/scenes/package/SceneArchetype";

/**
 * Read a placed prop's affordance where the take displays it: the model is
 * articulated to the performance's state for that prop at that second, and
 * the affordance's model frame is composed with the prop's displayed frame.
 *
 * @param performance The planned performance.
 * @param model The prop's archetype model, at rest.
 * @param subject The prop's scene id.
 * @param id The affordance id.
 * @param seconds The film second.
 * @returns The articulated affordance and its world frame in metres.
 */
export function sceneAffordanceFrame(
  performance: IAutoMovieMotionHumanPerformance,
  model: SceneArchetype.Model,
  subject: string,
  id: string,
  seconds: number,
): sceneAffordanceFrame.IPlaced {
  const root: IAutoMovieRigidTransform = performance.prop(subject, seconds);
  const site: IAutoMovieAffordance = model
    .articulate(performance.state(subject, seconds))
    .affordance(id);
  return {
    site,
    pose: ArchetypeFrame.compose(
      {
        translation: root.position,
        rotation: root.rotation,
        scale: { x: 1, y: 1, z: 1 },
      },
      site.frame,
    ),
  };
}
export namespace sceneAffordanceFrame {
  /** An affordance as the take displays it. */
  export interface IPlaced {
    /** The affordance of the articulated model, in model coordinates. */
    site: IAutoMovieAffordance;

    /** Its frame in the world, metres. */
    pose: IAutoMovieTransform;
  }
}
