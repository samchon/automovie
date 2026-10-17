import { faceTypes } from "./faceTypes.ts";

/**
 * Concatenates indexed patch meshes for display, offsetting indices while keeping coincident sheets distinct.
 * Actual generating lines accompany the same patch bytes. This operation neither welds collars nor
 * certifies an assembled face; large arrays are appended iteratively to avoid argument-stack limits.
 *
 * @evidence contracts/common.md#principled-implementation Disjoint index offsets preserve each patch's oriented triangles and topology ownership exactly.
 * @evidence contracts/common.md#clear-and-simple-design Display concatenation performs no geometric inference or collar repair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coincident coordinates are never silently welded, and unassembled boundaries remain declared limits.
 * @evidence contracts/common.md#meaningful-documentation States topology preservation, large-array behavior and the absence of assembly acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Every vertex, normal, triangle and construction line is appended once, taking linear time and output space.
 * @evidence contracts/performance.md#reuse-equivalent-work Coordinate and line objects are reused immutably while triangle indices are newly offset; no cache spans calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned display arrays retain input references; no process, file or persistent state is acquired.
 */
export function mergeFacePatches(patches: faceTypes.Result[]): {
  vertices: faceTypes.Point[];
  triangles: [number, number, number][];
  normals: faceTypes.Point[];
  construction: {
    representation: string;
    lines: faceTypes.Line[];
    sections: never[];
  };
  limits: string[];
} {
  const vertices: faceTypes.Point[] = [],
    triangles: [number, number, number][] = [],
    normals: faceTypes.Point[] = [],
    lines: faceTypes.Line[] = [];
  for (const patch of patches) {
    const offset: number = vertices.length;
    for (const vertex of patch.vertices) vertices.push(vertex);
    for (const normal of patch.normals) normals.push(normal);
    for (const triangle of patch.triangles)
      triangles.push([
        triangle[0] + offset,
        triangle[1] + offset,
        triangle[2] + offset,
      ]);
    for (const line of patch.construction.lines) lines.push(line);
  }
  return {
    vertices,
    triangles,
    normals,
    construction: {
      representation: "cubic-Hermite-local-face",
      lines,
      sections: [],
    },
    limits: [
      "Regional candidate patches have separate topology namespaces; this display concatenation performs no hidden weld or collar trim.",
      ...patches.flatMap(
        (patch: faceTypes.Result): string[] => patch.qualification.limits,
      ),
    ],
  };
}
