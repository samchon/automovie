import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

/**
 * The colliders a test prop's grasp closes the fingers on, read from its
 * handles: a sphere of each handle's declared radius at the handle's point,
 * the part a hand grips there. A grasp closes on a prop's colliders and
 * refuses a prop without them (`HumanGrasp.at`), so a prop authored for a
 * test by its handles alone declares these.
 *
 * @param affordances The prop's affordances; those without a radius are skipped.
 * @returns The shapes, in the prop's frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each shape is and why a test prop needs it.
 * @evidence contracts/development/design.md#principled-representation The engine's own shape record, one per handle, sized by the handle's own radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function the grasping specs share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No size is invented: the radius is the handle's.
 */
export function motionHandleShapes(
  affordances: readonly IAutoMovieAffordance[],
): IAutoMoviePhysicalShape[] {
  return affordances.flatMap(
    (a: IAutoMovieAffordance): IAutoMoviePhysicalShape[] =>
      a.radius === undefined
        ? []
        : [
            {
              id: a.id,
              material: "handle",
              transform: {
                position: a.frame.translation,
                rotation: AutoMovieEngineQuaternion.identity(),
              },
              kind: "sphere",
              radius: a.radius,
            },
          ],
  );
}
