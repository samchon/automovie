import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IPortraitHairCard } from "../anatomy/hair/IPortraitHairCard";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import type { IAutoMovieHumanFaceGroom } from "../structures/IAutoMovieHumanFaceGroom";
import type { IAutoMovieHumanFaceGroomCard } from "../structures/IAutoMovieHumanFaceGroomCard";

/** How many triangles a mesh holds, counting consecutive triples when unindexed. */
const triangleCount = (mesh: IAutoMovieMesh): number =>
  (mesh.indices === null ? mesh.positions.length / 3 : mesh.indices.length) / 3;

/** Corner positions of one triangle of a part's own index buffer. */
const seatTriangle = (
  mesh: IAutoMovieMesh,
  ordinal: number,
): IAutoMovieVector3[] =>
  [0, 1, 2].map((corner) => {
    const slot = ordinal * 3 + corner;
    const vertex = (mesh.indices === null ? slot : mesh.indices[slot]) * 3;
    return Vector3.create(
      mesh.positions[vertex],
      mesh.positions[vertex + 1],
      mesh.positions[vertex + 2],
    );
  });

/**
 * Rebuild one surface-seated groom against the face it is currently seated on.
 *
 * Every lock is read back from the triangle it names: the seat is that
 * triangle's barycentric point now, and the frame is that triangle's first
 * edge, normal and their cross product now. Because both are read from the
 * live surface, an edit that moves the skin moves the hair with it, and nothing
 * outside this function has to know that a shape weight changed.
 *
 * The result is a procedural groom profile, so the shared card tessellator
 * handles taper, fibres and curl exactly as it does for an authored hairstyle.
 * Stations convert to the millimetre space that tessellator reads; the groom
 * itself stores metres, because that is what the surface it rides is measured
 * in.
 *
 * Seats are validated rather than clamped. A part that is not in this model, a
 * triangle ordinal past the end of its buffer, and a seat whose triangle has
 * collapsed are all refusals, because each one would otherwise place a lock at
 * a silently wrong point on the head instead of reporting that the groom and
 * the face do not belong together.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Places authored hair locks on the named facial surface they grow from.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Resolves seated guide stations into head-space strips through the shared card construction.
 * @author Samchon
 */
export function resolveHumanFaceGroom(props: {
  groom: IAutoMovieHumanFaceGroom;
  model: IAutoMovieModel;
}): IPortraitHairShape {
  const meshes = new Map<string, IAutoMovieMesh>();
  for (const part of props.model.parts)
    if (part.geometry.type === "mesh") meshes.set(part.id, part.geometry.mesh);
  const resolve = (card: IAutoMovieHumanFaceGroomCard): IPortraitHairCard => {
    const mesh = meshes.get(card.part);
    if (mesh === undefined)
      throw new Error(
        "A seated hair lock names a surface this face does not have: " +
          card.part,
      );
    if (
      !Number.isInteger(card.triangle) ||
      card.triangle < 0 ||
      card.triangle >= triangleCount(mesh)
    )
      throw new Error(
        "A seated hair lock names a triangle outside its surface: " +
          card.part +
          "#" +
          card.triangle,
      );
    const [a, b, c] = seatTriangle(mesh, card.triangle);
    const edge = Vector3.subtract(b, a);
    const reach = Vector3.subtract(c, a);
    const normal = Vector3.cross(edge, reach);
    if (!(Vector3.length(normal) > 0))
      throw new Error(
        "A seated hair lock rests on a collapsed triangle: " +
          card.part +
          "#" +
          card.triangle,
      );
    const axes = [
      Vector3.normalize(edge),
      Vector3.normalize(Vector3.cross(normal, edge)),
      Vector3.normalize(normal),
    ];
    const seat = Vector3.add(
      a,
      Vector3.add(
        Vector3.scale(edge, card.weights[0]),
        Vector3.scale(reach, card.weights[1]),
      ),
    );
    const spread = (
      local: readonly [number, number, number],
    ): IAutoMovieVector3 =>
      axes.reduce(
        (total, axis, index) =>
          Vector3.add(total, Vector3.scale(axis, local[index])),
        Vector3.create(0, 0, 0),
      );
    // Local metres ride the live frame; the tessellator reads millimetres.
    const millimetres = (point: IAutoMovieVector3): [number, number, number] => [
      point.x * 1000,
      point.y * 1000,
      point.z * 1000,
    ];
    return {
      guide: card.guide.map((local) =>
        millimetres(Vector3.add(seat, spread(local))),
      ),
      // Across vectors are directions, so they ride the frame without the seat.
      across: card.across.map((local) => {
        const direction = spread(local);
        return [direction.x, direction.y, direction.z] as [
          number,
          number,
          number,
        ];
      }),
      width: card.width * 1000,
    };
  };
  return {
    ...props.groom.profile,
    material: props.groom.finish.id,
    cards: props.groom.cards.map(resolve),
  };
}
