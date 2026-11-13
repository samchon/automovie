import type { Archetype } from "@automovie/archetypes";
import { physicalShapeSpan } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The interval an archetype's colliders cover along a model axis: how a length, a height or a diameter is measured on the produced thing itself.
 *
 * @param archetype The archetype.
 * @param axis The model axis.
 * @param parts The ids of the parts measured; every part when absent.
 * @returns The lowest and highest coordinate along the axis, metres.
 */
export function archetypeExtent(
  archetype: Archetype,
  axis: "x" | "y" | "z",
  parts?: readonly string[],
): { low: number; high: number; size: number } {
  const direction: IAutoMovieVector3 = {
    x: axis === "x" ? 1 : 0,
    y: axis === "y" ? 1 : 0,
    z: axis === "z" ? 1 : 0,
  };
  const origin: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  let low: number = Infinity;
  let high: number = -Infinity;
  for (const shape of archetype.shapes()) {
    if (parts !== undefined && !parts.includes(shape.id)) continue;
    const [from, to]: readonly [number, number] = physicalShapeSpan(
      origin,
      shape,
      direction,
    );
    low = Math.min(low, from);
    high = Math.max(high, to);
  }
  return { low, high, size: high - low };
}
