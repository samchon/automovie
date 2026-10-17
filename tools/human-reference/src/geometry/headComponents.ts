import { Mesh } from "./Mesh.ts";
import { components } from "./components.ts";

/**
 * Connected head triangle components sorted by triangle count; largest-skin interpretation needs source qualification.
 *
 * @evidence contracts/common.md#principled-implementation Triangle-connected components are ranked by triangle count; interpreting the largest as skin requires qualified source inputs.
 * @evidence contracts/common.md#clear-and-simple-design Connectivity is reused from components rather than inferred by geometric proximity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(vertices + triangles) component work plus component ranking and O(triangles) stored memberships.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned triangle memberships are owned results; temporary component labels are released.
 */
export function headComponents(head: Mesh): { c: number; tris: number[] }[] {
  const result: ReturnType<typeof components> = components(
    head.vertices.length,
    head.triangles,
  );
  const triangles: number[][] = Array.from(
    { length: result.count },
    (): number[] => [],
  );
  head.triangles.forEach((t: [number, number, number], i: number): void => {
    triangles[result.comp[t[0]]].push(i);
  });
  return triangles
    .map((tris: number[], c: number): { c: number; tris: number[] } => ({
      c,
      tris,
    }))
    .sort(
      (a: { tris: number[] }, b: { tris: number[] }): number =>
        b.tris.length - a.tris.length,
    );
}
