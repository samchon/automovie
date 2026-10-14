import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IPortraitHairCard } from "../anatomy/hair/IPortraitHairCard";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import type { IAutoMovieHumanFaceGroom } from "../structures/IAutoMovieHumanFaceGroom";
import type { IAutoMovieHumanFaceGroomCard } from "../structures/IAutoMovieHumanFaceGroomCard";
import { readHumanLocalMeshWorld } from "../../common/mesh/readHumanLocalMeshWorld";

/** How many triangles a mesh holds, counting consecutive triples when unindexed. */
const triangleCount: (mesh: IAutoMovieMesh) => number = (mesh: IAutoMovieMesh): number =>
  (mesh.indices === null ? mesh.positions.length / 3 : mesh.indices.length) / 3;

/** Corner positions of one triangle of a part's own index buffer. */
const seatTriangle: (mesh: IAutoMovieMesh, ordinal: number, positions?: readonly number[]) => IAutoMovieVector3[] = (
  mesh: IAutoMovieMesh,
  ordinal: number,
  positions: readonly number[] = mesh.positions,
): IAutoMovieVector3[] =>
  [0, 1, 2].map((corner: number): IAutoMovieVector3  => {
    const slot: number = ordinal * 3 + corner;
    const vertex: number = (mesh.indices === null ? slot : mesh.indices[slot]) * 3;
    return Vector3.create(
      positions[vertex],
      positions[vertex + 1],
      positions[vertex + 2],
    );
  });

/**
 * Rebuild one surface-seated groom against the face it is currently seated on.
 *
 * Every lock is read back from the triangle it names. The seat is the corner
 * the triangle starts at, offset along its two edges by the weights the card
 * carries. The frame a station rides is ordered `[edge, cross(normal, edge),
 * normal]`, so a station's third component is its height above the surface and
 * the first two run along it. That order is written out because naming the
 * three vectors is not the same as naming the axes they sit on, and a reading
 * taken from the looser phrasing put the normal on the second axis and called a
 * median 28% of every published groom buried inside the head. Because seat and
 * frame are both read from the live surface, an edit that moves the skin moves
 * the hair with it, and nothing outside this function has to know that a shape
 * weight changed.
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
 * Requested parts reconstruct local Float32 publication and ordinary TRS once
 * through readHumanLocalMeshWorld. Seats and the first edge keep original
 * source corner order, so reflected winding cannot exchange authored u/v.
 * The published world winding supplies the outward surface normal. Guide
 * lengths stay authored model metres in this reconstructed orthonormal frame;
 * this follows placement rather than scaling the authored hair dimensions.
 * Basis metadata and inside-triangle weights are not independently admitted
 * here, and successful placement proves no collision, likeness or GPU result.
 *
 * @evidence contracts/common.md#principled-implementation Actual selected resident triangles reconstruct local Float32/TRS world coordinates through the shared owner. Original source corner order preserves u/v seat weights and first edge; published reflected winding determines outward normal, and orthonormal guide coordinates remain authored model-metre distances before millimetre tessellation.
 * @evidence contracts/common.md#clear-and-simple-design One resolver converts surface-seated guides into the existing card profile; shared world publication owns TRS/normal/winding admission and the card tessellator owns ribbons/finish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing parts/triangles, collapsed frames and invalid shared TRS refuse; no transformed seat is guessed or weights exchanged after reflection. Declared basis identity and inside-seat weights remain unchecked here, and placement supplies no clinical/collision/appearance certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives frame order, original weights under reflection, world publication/TRS, fixed authored lengths, metre-to-millimetre conversion and outstanding source/visual limits.
 * @evidence contracts/performance.md#efficient-algorithms P parts build an identity map; each distinct seated mesh publishes/transforms its full attributes once, then G guide/across stations perform fixed vector operations. No full face rebuild occurs, but transformation cost is not merely the selected triangle count.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested part's world mesh serves every lock in this invocation; original source indices and published winding serve different correspondence roles. Changed live geometry/TRS requires a new resolver and no stale seat cache persists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Part/world maps are invocation-local; only resolved cards/profile transfer with borrowed untouched profile fields. No model mutation, renderer handle or asynchronous task is acquired.
 *
 * @author Samchon
 */
export function resolveHumanFaceGroom(props: {
  groom: IAutoMovieHumanFaceGroom;
  model: IAutoMovieModel;
}): IPortraitHairShape {
  const meshes: Map<string, { source: IAutoMovieMesh; transform: IAutoMovieModelPart["transform"] }> = new Map();
  const worlds: Map<string, IAutoMovieMesh> = new Map();
  for (const part of props.model.parts)
    if (part.geometry.type === "mesh") meshes.set(part.id, { source: part.geometry.mesh, transform: part.transform });
  const resolve: (card: IAutoMovieHumanFaceGroomCard) => IPortraitHairCard = (card: IAutoMovieHumanFaceGroomCard): IPortraitHairCard => {
    const part: { source: IAutoMovieMesh; transform: IAutoMovieModelPart["transform"]; } | undefined = meshes.get(card.part);
    if (part === undefined)
      throw new Error(
        "A seated hair lock names a surface this face does not have: " +
          card.part,
      );
    if (
      !Number.isInteger(card.triangle) ||
      card.triangle < 0 ||
      card.triangle >= triangleCount(part.source)
    )
      throw new Error(
        "A seated hair lock names a triangle outside its surface: " +
          card.part +
          "#" +
          card.triangle,
      );
    let world: IAutoMovieMesh | undefined = worlds.get(card.part);
    if (world === undefined) {
      world = readHumanLocalMeshWorld(part.source, part.transform);
      worlds.set(card.part, world);
    }
    // Seat weights and the first edge retain the original source corner order.
    // The published triangle order supplies outward winding after reflection.
    const [a, b, c]: IAutoMovieVector3[] = seatTriangle(part.source, card.triangle, world.positions);
    const published: IAutoMovieVector3[] = seatTriangle(world, card.triangle);
    const edge: IAutoMovieVector3 = Vector3.subtract(b, a);
    const reach: IAutoMovieVector3 = Vector3.subtract(c, a);
    const normal: IAutoMovieVector3 = Vector3.cross(Vector3.subtract(published[1], published[0]), Vector3.subtract(published[2], published[0]));
    if (!(Vector3.length(normal) > 0))
      throw new Error(
        "A seated hair lock rests on a collapsed triangle: " +
          card.part +
          "#" +
          card.triangle,
      );
    const axes: IAutoMovieVector3[] = [
      Vector3.normalize(edge),
      Vector3.normalize(Vector3.cross(normal, edge)),
      Vector3.normalize(normal),
    ];
    const seat: IAutoMovieVector3 = Vector3.add(
      a,
      Vector3.add(
        Vector3.scale(edge, card.weights[0]),
        Vector3.scale(reach, card.weights[1]),
      ),
    );
    const spread: (local: readonly [number, number, number]) => IAutoMovieVector3 = (
      local: readonly [number, number, number],
    ): IAutoMovieVector3 =>
      axes.reduce(
        (total: IAutoMovieVector3, axis: IAutoMovieVector3, index: number): IAutoMovieVector3  =>
          Vector3.add(total, Vector3.scale(axis, local[index])),
        Vector3.create(0, 0, 0),
      );
    // Local metres ride the live frame; the tessellator reads millimetres.
    const millimetres: (point: IAutoMovieVector3) => [number, number, number] = (
      point: IAutoMovieVector3,
    ): [number, number, number] => [
      point.x * 1000,
      point.y * 1000,
      point.z * 1000,
    ];
    return {
      guide: card.guide.map((local: readonly [number, number, number]): [number, number, number]  =>
        millimetres(Vector3.add(seat, spread(local))),
      ),
      // Across vectors are directions, so they ride the frame without the seat.
      across: card.across.map((local: readonly [number, number, number]): [number, number, number]  => {
        const direction: IAutoMovieVector3 = spread(local);
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
