/**
 * Admit component-owned native vertex declarations before the head packs any
 * model part. Interior loops name directed anatomical cycles; attachments name
 * exact skin/interior vertex pairs in the same millimetre frame. The producers
 * supply identities. This consumer never discovers a join by matching XYZ.
 *
 * The operation reads all declarations together, so an attachment can name a
 * later component without depending on evaluation order. It changes no mesh,
 * input array or identity. Ordinary mesh admission still belongs to the engine;
 * this check proves declared residency, directed loop edges and C0 attachment
 * (equal positions), not normals, collision freedom, tissue mechanics or a full
 * manifold union. Compound junctions retain every face and all their owners.
 */
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import type { IPortraitInterior } from "./structures/IPortraitInterior";

/**
 * Validate the live native correspondences consumed by head materialization.
 * Skin is addressed by a null part; every other target uses an interior ID.
 * Named loops may have faces on both sides, as cervical rings of capped enamel
 * do. No face is removed and no collision pair is excluded by this admission.
 *
 * @evidence contracts/common.md#principled-implementation Declared correspondences are checked directly: interior identities are unique, each named loop's vertices are resident and every consecutive pair is an existing directed mesh edge, and each attachment pair has exactly equal coordinates. Nothing is inferred from coincident positions.
 * @evidence contracts/common.md#clear-and-simple-design One read-only pass over all interiors so an attachment can name a later component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses instead of discovering or repairing a join.
 * @evidence contracts/common.md#meaningful-documentation States what is proved (residency, directed loops, C0 attachment) and what is not (normals, collision, manifoldness of the union).
 * @evidence contracts/modeling.md#shared-boundaries It is the admission of the shared native boundaries between skin and interiors: declared vertex pairs must coincide exactly and named cycles must follow directed edges.
 * @evidence contracts/modeling.md#spatial-conventions Skin and interiors share head millimetres; coordinates are compared exactly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source assertPortraitInteriorBindings carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range assertPortraitInteriorBindings admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority assertPortraitInteriorBindings defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping assertPortraitInteriorBindings is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels assertPortraitInteriorBindings defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry assertPortraitInteriorBindings emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation assertPortraitInteriorBindings owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function assertPortraitInteriorBindings(
  skin: Pick<IControlMesh, "positions">,
  interiors: readonly IPortraitInterior[],
): void {
  const byId = new Map(interiors.map((part) => [part.id, part]));
  if (byId.size !== interiors.length)
    throw new Error("Native interiors require unique part identities.");
  const point = (part: string | null, vertex: number): readonly number[] => {
    const owner = part === null ? undefined : byId.get(part);
    if (part !== null && owner === undefined)
      throw new Error(
        "Native attachment target must name a prepared interior.",
      );
    const count =
      part === null ? skin.positions.length : owner!.mesh.positions.length / 3;
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= count)
      throw new Error("Native bindings must name resident vertex identities.");
    const value =
      part === null
        ? skin.positions[vertex]
        : owner!.mesh.positions.slice(3 * vertex, 3 * vertex + 3);
    if (value.length !== 3 || !value.every(Number.isFinite))
      throw new Error("Native bindings require finite millimetre XYZ.");
    return value;
  };
  for (const interior of interiors) {
    const loops = interior.loops ?? [];
    if (loops.length !== 0) {
      const names = new Set<string>();
      const edges = new Set<string>();
      const indices =
        interior.mesh.indices ??
        Array.from(
          { length: interior.mesh.positions.length / 3 },
          (_, id) => id,
        );
      if (indices.length % 3 !== 0)
        throw new Error("Native loops require complete mesh triangles.");
      for (let at = 0; at < indices.length; at += 3)
        for (let corner = 0; corner < 3; ++corner)
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
        loop.vertices.forEach((vertex) => point(interior.id, vertex));
        for (let i = 0; i < loop.vertices.length; ++i)
          if (
            !edges.has(
              `${loop.vertices[i]}/${loop.vertices[(i + 1) % loop.vertices.length]}`,
            )
          )
            throw new Error("Native loops must follow directed mesh edges.");
      }
    }
    for (const attachment of interior.attachments ?? []) {
      const source = point(interior.id, attachment.vertex);
      const target = point(attachment.target.part, attachment.target.vertex);
      if (source.some((value, axis) => value !== target[axis]))
        throw new Error("Native attachment coordinates must agree exactly.");
    }
  }
}
