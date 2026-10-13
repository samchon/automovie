import type { IControlMesh } from "../mesh/structures/IControlMesh";
import type { IPortraitInterior } from "./structures/IPortraitInterior";

/**
 * Validate the live native correspondences consumed by head materialization.
 * Skin is addressed by a null part; every other target uses an interior ID.
 * Named loops may have faces on both sides, as cervical rings of capped enamel
 * do. No face is removed and no collision pair is excluded by this admission.
 * Producers supply all identities; coordinate equality verifies declared joins
 * rather than discovering them. Cross-component targets resolve against the
 * complete prepared population, independent of producer order. All coordinates
 * are head millimetres and inputs remain unchanged. Residency, directed edges
 * and exact C0 joins establish neither normals, collision freedom, mechanics nor
 * a manifold union; ordinary mesh admission remains with the engine.
 *
 * @evidence contracts/common.md#principled-implementation One complete ID map resolves declared targets, resident finite XYZ checks admit named vertices, directed triangle-edge sets admit loops and exact coordinate equality verifies C0 attachment pairs.
 * @evidence contracts/common.md#clear-and-simple-design This consumer owns cross-interior declaration admission before metric packing; producers own native topology and the engine owns ordinary mesh validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate search invents joins, no face or collision pair is removed, and loop admission is not promoted to a manifold or nonintersection certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives null-skin addressing, millimetres, producer order independence, unchanged inputs and the exact scope of admitted loops and joins.
 * @evidence contracts/performance.md#efficient-algorithms Interior lookup is O(P); each interior with loops builds its directed edge set once in O(T), then residency/edge checks follow declared loop vertices and attachment pairs.
 * @evidence contracts/performance.md#reuse-equivalent-work One ID map serves all cross-part targets and one edge set per interior serves its loops; no admission is reused after topology or coordinates change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The ID map borrows interiors for this call; per-interior edge/name sets and temporary coordinate slices are released at return or throw, with no retained resources.
 */
export function assertPortraitInteriorBindings(
  skin: Pick<IControlMesh, "positions">,
  interiors: readonly IPortraitInterior[],
): void {
  const byId: Map<string, IPortraitInterior> = new Map(interiors.map((part: IPortraitInterior): [string, IPortraitInterior] => [part.id, part]));
  if (byId.size !== interiors.length)
    throw new Error("Native interiors require unique part identities.");
  const point: (part: string | null, vertex: number) => readonly number[] = (part: string | null, vertex: number): readonly number[] => {
    const owner: IPortraitInterior | undefined = part === null ? undefined : byId.get(part);
    if (part !== null && owner === undefined)
      throw new Error(
        "Native attachment target must name a prepared interior.",
      );
    const count: number =
      part === null ? skin.positions.length : owner!.mesh.positions.length / 3;
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= count)
      throw new Error("Native bindings must name resident vertex identities.");
    const value: readonly number[] =
      part === null
        ? skin.positions[vertex]
        : owner!.mesh.positions.slice(3 * vertex, 3 * vertex + 3);
    if (value.length !== 3 || !value.every(Number.isFinite))
      throw new Error("Native bindings require finite millimetre XYZ.");
    return value;
  };
  for (const interior of interiors) {
    const loops: NonNullable<IPortraitInterior["loops"]> = interior.loops ?? [];
    if (loops.length !== 0) {
      const names: Set<string> = new Set<string>();
      const edges: Set<string> = new Set<string>();
      const indices: number[] =
        interior.mesh.indices ??
        Array.from(
          { length: interior.mesh.positions.length / 3 },
          (_: unknown, id: number): number => id,
        );
      if (indices.length % 3 !== 0)
        throw new Error("Native loops require complete mesh triangles.");
      for (let at: number = 0; at < indices.length; at += 3)
        for (let corner: number = 0; corner < 3; ++corner)
          edges.add(
            `${indices[at + corner]}/${indices[at + ((corner + 1) % 3)]}`,
          );
      for (const loop of loops) {
        if (loop.name.trim().length === 0 || names.has(loop.name))
          throw new Error("Native loops require distinct nonblank names.");
        names.add(loop.name);
        if (
          loop.vertices.length < 3 ||
          new Set(loop.vertices).size !== loop.vertices.length
        )
          throw new Error(
            "Native loops require at least three distinct vertices.",
          );
        loop.vertices.forEach((vertex: number): readonly number[] => point(interior.id, vertex));
        for (let i: number = 0; i < loop.vertices.length; ++i)
          if (
            !edges.has(
              `${loop.vertices[i]}/${loop.vertices[(i + 1) % loop.vertices.length]}`,
            )
          )
            throw new Error("Native loops must follow directed mesh edges.");
      }
    }
    for (const attachment of interior.attachments ?? []) {
      const source: readonly number[] = point(interior.id, attachment.vertex);
      const target: readonly number[] = point(attachment.target.part, attachment.target.vertex);
      if (source.some((value: number, axis: number): boolean => value !== target[axis]))
        throw new Error("Native attachment coordinates must agree exactly.");
    }
  }
}
