import type { AutoMovieArchetype } from "@automovie/archetypes";
import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The interval an archetype's colliders cover along a model axis: how a length, a height or a diameter is measured on the produced thing itself.
 *
 * @param archetype The archetype or its colliders at the pose being measured.
 * @param axis The model axis.
 * @param parts The ids of the parts measured; every part when absent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the model axis, optional part selection and pose of the observed colliders.
 * @evidence contracts/development/implementation.md#principled-implementation Unions the projected intervals of the selected physical shapes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal projects each requested shape and takes the endpoint extrema.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads generated collider geometry independently of declared archetype dimensions.
 * @evidence contracts/development/implementation.md#efficient-algorithms Projects each selected collider once per extent query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers measuring several axes reuse their collider snapshot.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the returned interval.
 * @returns The lowest and highest coordinate along the axis, metres.
 */
export function archetypeExtent(
  archetype: AutoMovieArchetype | readonly IAutoMoviePhysicalShape[],
  axis: "x" | "y" | "z",
  parts?: readonly string[],
): { low: number; high: number; size: number } {
  const direction: IAutoMovieVector3 = {
    x: axis === "x" ? 1 : 0,
    y: axis === "y" ? 1 : 0,
    z: axis === "z" ? 1 : 0,
  };
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  let low: number = Infinity;
  let high: number = -Infinity;
  for (const shape of "shapes" in archetype ? archetype.shapes() : archetype) {
    if (parts !== undefined && !parts.includes(shape.id)) continue;
    const [from, to]: readonly [number, number] = AutoMovieEnginePhysics.physicalShapeSpan(
      origin,
      shape,
      direction,
    );
    low = Math.min(low, from);
    high = Math.max(high, to);
  }
  return { low, high, size: high - low };
}
