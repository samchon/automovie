import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModelPart,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The colliders of an archetype: one solid per primitive part, in the model's space, in the shape vocabulary the engine's contact queries read (`IAutoMoviePhysicalProfile.IShape`).
 *
 * A hand closes its fingers on these and a grasp reads a grip's width from them, so each collider is the part's own solid, never a padded one: a box is a box, a sphere a sphere, a capsule a capsule. A cylinder at least four radii long becomes a capsule inside it, its round ends ending where the cylinder ends, which keeps the width across it exact and costs the queries least; a shorter cylinder and a cone become the convex hull of a ring of `SIDES` points on each rim, exact along the part's own X and Z and inside the true circle by less than 4 % of the radius between them. A plane has no solid and gives none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mapping per primitive, its exactness and what a plane gives.
 * @evidence contracts/development/design.md#principled-representation The engine's own collider type, placed in the model's space with the part's transform, so nothing is converted again before a contact query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function over parts; the archetype calls it at its current articulation state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No collider is hand-placed: each follows from its part, so the picture and the contact cannot disagree.
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
   * @returns One collider per primitive part with a volume, its id the part's id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on scale and the ids.
   * @evidence contracts/development/implementation.md#principled-implementation Each primitive maps to the engine shape with the same solid, or to the hull or inner capsule this namespace's doc bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the primitive kinds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A mesh or atlas part gives no collider, since archetypes are built of primitives only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in parts, with a fixed number of hull points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computed on request for one state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    parts: readonly IAutoMovieModelPart[],
  ): IAutoMoviePhysicalProfile.IShape[] {
    const shapes: IAutoMoviePhysicalProfile.IShape[] = [];
    for (const part of parts) {
      if (part.geometry.type !== "primitive") continue;
      const base: {
        id: string;
        material: string;
        transform: IAutoMoviePhysicalProfile.ITransform;
      } = {
        id: part.id,
        material: MATERIAL,
        transform: {
          position: part.transform?.translation ?? { x: 0, y: 0, z: 0 },
          rotation: part.transform?.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
        },
      };
      const shape: AutoMoviePrimitiveShape = part.geometry.shape;
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
