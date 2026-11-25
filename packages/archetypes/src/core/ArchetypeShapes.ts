import { physicalHullFaces } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMoviePrimitiveShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";

/**
 * Primitive or declared convex-cell colliders in the model's space, using the
 * engine's contact-query vocabulary.
 *
 * A hand closes its fingers on these and a grasp reads a grip's width from
 * them, so each collider is the part's own solid, never a padded one: a box is
 * a box, a sphere a sphere, a capsule a capsule. A cylinder at least four radii
 * long becomes a capsule inside it, its round ends ending where the cylinder
 * ends, which keeps the width across it exact and costs the queries least; a
 * shorter cylinder and a cone become the convex hull of a ring of `SIDES`
 * points on each rim, exact along the part's own X and Z and inside the true
 * circle by less than 4 % of the radius between them. A plane has no solid and
 * gives none. A declared cell uses its exact local generating points under the
 * visible part's current rigid transform; separate wall cells preserve
 * cavities. An arbitrary mesh or atlas still has no inferred collider.
 */
export namespace ArchetypeShapes {
  /**
   * The contact material every archetype collider cites, which the consumer's
   * profile supplies.
   */
  export const MATERIAL: string = "archetype";

  /** How many points lie on each rim of a hulled cylinder or cone. */
  export const SIDES: number = 12;

  /**
   * The colliders of parts.
   *
   * @param parts The model's parts at their current transforms, with unit
   *   scale.
   * @param cells Explicit convex cells bound to their visible parts; omitted
   *   for primitives.
   * @returns One collider per supported solid part, preserving its id.
   */
  export function of(
    parts: readonly IAutoMovieModelPart[],
    cells: AutoMovieArchetypeConvexCell.Table = new Map(),
  ): IAutoMoviePhysicalShape[] {
    const shapes: IAutoMoviePhysicalShape[] = [];
    for (const part of parts) {
      const base: {
        id: string;
        material: string;
        transform: IAutoMovieRigidTransform;
      } = {
        id: part.id,
        material: MATERIAL,
        transform: {
          position: part.transform?.translation ?? { x: 0, y: 0, z: 0 },
          rotation: part.transform?.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
        },
      };
      const cell: AutoMovieArchetypeConvexCell.ICell | undefined = cells.get(
        part.id,
      );
      if (cell !== undefined) {
        if (part.geometry !== cell.geometry)
          throw new Error(
            `Convex cell ${part.id} no longer matches its visible geometry`,
          );
        const points: IAutoMovieVector3[] = cell.points.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
        );
        shapes.push({
          ...base,
          kind: "hull",
          points,
          hull: physicalHullFaces(points),
        });
        continue;
      }
      if (part.geometry.type !== "primitive") continue;
      const shape: IAutoMoviePrimitiveShape = part.geometry.shape;
      switch (shape.type) {
        case "box":
          shapes.push({
            ...base,
            kind: "box",
            halfExtents: {
              x: shape.width / 2,
              y: shape.height / 2,
              z: shape.depth / 2,
            },
          });
          break;
        case "sphere":
          shapes.push({ ...base, kind: "sphere", radius: shape.radius });
          break;
        case "capsule":
          shapes.push({
            ...base,
            kind: "capsule",
            radius: shape.radius,
            halfLength: shape.height / 2,
          });
          break;
        case "cylinder":
          if (shape.height >= 4 * shape.radius)
            shapes.push({
              ...base,
              kind: "capsule",
              radius: shape.radius,
              halfLength: shape.height / 2 - shape.radius,
            });
          else {
            const points: IAutoMovieVector3[] = [
              ...ring(shape.radius, shape.height / 2),
              ...ring(shape.radius, -shape.height / 2),
            ];
            shapes.push({
              ...base,
              kind: "hull",
              points,
              hull: physicalHullFaces(points),
            });
          }
          break;
        case "cone": {
          const points: IAutoMovieVector3[] = [
            ...ring(shape.radius, shape.height / 2),
            { x: 0, y: -shape.height / 2, z: 0 },
          ];
          shapes.push({
            ...base,
            kind: "hull",
            points,
            hull: physicalHullFaces(points),
          });
          break;
        }
        case "plane":
          break;
      }
    }
    return shapes;
  }
}

/**
 * The points of a circle about the local Y axis.
 *
 * @param radius The circle's radius, metres.
 * @param y Its height on the local Y axis, metres.
 * @returns `ArchetypeShapes.SIDES` points, the first on `+X`.
 */
function ring(radius: number, y: number): IAutoMovieVector3[] {
  return Array.from(
    { length: ArchetypeShapes.SIDES },
    (_: unknown, k: number): IAutoMovieVector3 => {
      const angle: number = (2 * Math.PI * k) / ArchetypeShapes.SIDES;
      return { x: radius * Math.cos(angle), y, z: radius * Math.sin(angle) };
    },
  );
}
