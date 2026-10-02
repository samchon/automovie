import type { IControlMesh } from "../../mesh/structures/IControlMesh";

/**
 * A composed skin may have declared anatomical openings, but no accidental
 * cracks, missing stitches or oppositely assembled component faces. Audit the
 * shared control cage before subdivision could multiply a broken attachment.
 *
 * @evidence contracts/common.md#principled-implementation A composed skin is a valid oriented surface exactly when every undirected edge has two incident faces that traverse it in opposite directions, apart from the declared open edges. The audit counts incident faces per edge and sums a direction sign (+1 when a < b, -1 otherwise), so two consistently wound faces sum to zero; every vertex of every triangle appears as the first endpoint of one edge, so residency is checked for all of them.
 * @evidence contracts/common.md#clear-and-simple-design A declared-opening set and one pass over the cage's edges; no repair is attempted.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses instead of patching: an undeclared or missing opening, a duplicate declaration or a mis-wound pair each throw.
 * @evidence contracts/common.md#meaningful-documentation States what is audited, why it runs before subdivision, and what each refusal means.
 * @evidence contracts/modeling.md#shared-boundaries It is the audit of the shared boundaries: it proves that every seam the components share is a two-face edge and that only the declared openings are free.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping assertPortraitSkinTopology is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels assertPortraitSkinTopology defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry assertPortraitSkinTopology decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#spatial-conventions assertPortraitSkinTopology keeps the caller's unit and frame and converts nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source assertPortraitSkinTopology carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range assertPortraitSkinTopology admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority assertPortraitSkinTopology defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#rendered-observation assertPortraitSkinTopology owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function assertPortraitSkinTopology(
  cage: IControlMesh,
  openings: number[][],
): void {
  const key = (a: number, b: number): string =>
    Math.min(a, b) + "/" + Math.max(a, b);
  const expected = new Set<string>();
  for (const loop of openings) {
    if (loop.length < 3 || new Set(loop).size !== loop.length)
      throw new Error(
        "A declared skin opening needs at least three distinct boundary vertices.",
      );
    for (let i = 0; i < loop.length; i++) {
      const id = key(loop[i], loop[(i + 1) % loop.length]);
      if (expected.has(id))
        throw new Error("Two components declare the same open skin edge.");
      expected.add(id);
    }
  }
  const edges = new Map<string, { count: number; direction: number }>();
  for (let i = 0; i < cage.indices.length; i += 3)
    for (let corner = 0; corner < 3; corner++) {
      const a = cage.indices[i + corner],
        b = cage.indices[i + ((corner + 1) % 3)];
      if (
        !Number.isInteger(a) ||
        a < 0 ||
        a >= cage.positions.length ||
        a === b
      )
        throw new Error(
          "A skin triangle needs distinct resident vertex identities.",
        );
      const id = key(a, b),
        edge = edges.get(id) ?? { count: 0, direction: 0 };
      edge.count++;
      edge.direction += a < b ? 1 : -1;
      edges.set(id, edge);
    }
  for (const [id, edge] of edges) {
    if (edge.count === 1) {
      if (!expected.delete(id))
        throw new Error("A component left an undeclared opening in the skin.");
    } else if (edge.count !== 2 || edge.direction !== 0)
      throw new Error(
        "Attached skin edges need two oppositely wound incident faces.",
      );
  }
  if (expected.size !== 0)
    throw new Error(
      "A declared skin opening is not present in the assembled surface.",
    );
}
