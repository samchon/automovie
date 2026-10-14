import type { IControlMesh } from "../../mesh/structures/IControlMesh";

/**
 * A composed skin may have declared anatomical openings, but no accidental
 * cracks, missing stitches or oppositely assembled component faces. Audit the
 * shared control cage before subdivision could multiply a broken attachment.
 * This is an edge-incidence audit, not a vertex-link manifold, self-intersection
 * or anatomical-validity proof. It reads the cage without changing it.
 *
 * @evidence contracts/common.md#principled-implementation Undirected native edge keys collect face counts and signed winding; each singleton must consume one declared opening edge and every other edge must have two opposite incidents. Vertex identity checks reject nonresident or repeated edge endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One expected-opening set and one actual-edge map compare both directions before common subdivision; component stitching remains the assembler's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Openings are caller-declared anatomical boundaries, not tolerated accidental cracks; duplicate expected edges, missing boundaries and incompatible winding refuse, without altering topology or foreign methods.
 * @evidence contracts/common.md#meaningful-documentation The comment states pre-subdivision timing, declared-opening semantics, read-only failure behavior and the limits of an edge-only audit.
 * @evidence contracts/performance.md#efficient-algorithms With T triangles and B declared boundary edges, incidence construction and verification take expected O(T+B) map/set work and O(T+B) storage; scanning all faces is needed to detect an undeclared crack anywhere in the composed cage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each undirected key is shared by its incident faces within this audit; a changed cage/opening population needs a fresh audit and no result is cached across assemblies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Expected edges and actual incidence records are local and bounded by supplied boundary/triangle populations; return and failure release all references without tasks or external resources.
 */
export function assertPortraitSkinTopology(
  cage: IControlMesh,
  openings: number[][],
): void {
  const key: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => Math.min(a, b) + "/" + Math.max(a, b);
  const expected: Set<string> = new Set<string>();
  for (const loop of openings) {
    if (loop.length < 3 || new Set(loop).size !== loop.length)
      throw new Error(
        "A declared skin opening needs at least three distinct boundary vertices.",
      );
    for (let i: number = 0; i < loop.length; i++) {
      const id: string = key(loop[i], loop[(i + 1) % loop.length]);
      if (expected.has(id))
        throw new Error("Two components declare the same open skin edge.");
      expected.add(id);
    }
  }
  const edges: Map<string, { count: number; direction: number }> = new Map<
    string,
    { count: number; direction: number }
  >();
  for (let i: number = 0; i < cage.indices.length; i += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = cage.indices[i + corner],
        b: number = cage.indices[i + ((corner + 1) % 3)];
      if (
        !Number.isInteger(a) ||
        a < 0 ||
        a >= cage.positions.length ||
        a === b
      )
        throw new Error(
          "A skin triangle needs distinct resident vertex identities.",
        );
      const id: string = key(a, b),
        edge: { count: number; direction: number } = edges.get(id) ?? {
          count: 0,
          direction: 0,
        };
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
