import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMoviePrimitiveShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";

/**
 * Actual primitive or declared convex-cell colliders in the model's space, using the engine's contact-query vocabulary.
 *
 * A hand closes its fingers on these and a grasp reads a grip's width from them, so each collider is the part's own solid, never a padded one: a box is a box, a sphere a sphere, a capsule a capsule. A cylinder at least four radii long becomes a capsule inside it, its round ends ending where the cylinder ends, which keeps the width across it exact and costs the queries least; a shorter cylinder and a cone become the convex hull of a ring of `SIDES` points on each rim, exact along the part's own X and Z and inside the true circle by less than 4 % of the radius between them. A plane has no solid and gives none.
 * A declared cell uses its exact local generating points under the visible part's current rigid transform; separate wall cells preserve cavities. An arbitrary mesh or atlas still has no inferred collider.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States primitive approximation bounds, exact actual-cell correspondence, current rigid placement, absent arbitrary-mesh inference and planar null output.
 * @evidence contracts/development/design.md#principled-representation The engine's own collider type, placed in the model's space with the part's transform, so nothing is converted again before a contact query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function over parts; the archetype calls it at its current articulation state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each collider follows a declared solid part's frame. Arbitrary visual detail supplies no collider unless its part declares a convex cell.
 */
export namespace ArchetypeShapes {
  /** The contact material every archetype collider cites, which the consumer's profile supplies. */
  export const MATERIAL: string = "archetype";

  /** How many points lie on each rim of a hulled cylinder or cone. */
  export const SIDES: number = 12;

  /**
   * The colliders of parts.
   *
   * @param parts The model's parts at their current transforms, with unit scale.
   * @param cells Explicit actual convex cells bound to their visible parts; omitted for primitives.
   * @returns One collider per supported solid part, preserving its id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on scale and the ids.
   * @evidence contracts/development/implementation.md#principled-implementation Declared actual cells use the same local hull boundary as their visible polyhedron, under the part's current TRS. Primitives retain their original exact or explicitly bounded shape mappings.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit declared cell correspondence first; otherwise use the unchanged primitive-kind switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A replaced declared-cell geometry is refused. Arbitrary mesh/atlas parts still give no collider; no whole-shell envelope fills an opening.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in parts plus the total declared cell corners; primitive hull point counts remain fixed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computed on request for one state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent collider point buffers so a caller cannot mutate the source cell through its collider. Retains no request data or handle.
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
        shapes.push({
          ...base,
          kind: "hull",
          points: cell.points.map(
            (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
          ),
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
          else
            shapes.push({
              ...base,
              kind: "hull",
              points: [
                ...ring(shape.radius, shape.height / 2),
                ...ring(shape.radius, -shape.height / 2),
              ],
            });
          break;
        case "cone":
          shapes.push({
            ...base,
            kind: "hull",
            points: [
              ...ring(shape.radius, shape.height / 2),
              { x: 0, y: -shape.height / 2, z: 0 },
            ],
          });
          break;
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
