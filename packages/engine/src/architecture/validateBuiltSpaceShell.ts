import { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtSpaceShellVolume } from "./builtSpaceShellVolume";

/** A facet whose doubled area is this small or smaller bounds nothing. */
const FACET_AREA_EPSILON: number = 1e-12;

/**
 * Hold a closed boundary shell to exactly what makes its inside a fact.
 *
 * Three things are checked and nothing is repaired. Every index must name a
 * vertex the shell carries, and every face must have area, because a face
 * nobody can look up or that is a line contributes a solid angle of nothing to
 * a query that would then answer confidently. The surface must be closed: each
 * directed edge appears exactly once and its own reverse exactly once, so a
 * missing facet is a hole through which inside leaks into outside, and a
 * duplicated one is a facet counted twice. And the enclosed volume must be
 * positive, which is how "wound counter-clockwise seen from outside" is
 * actually checked: a shell turned inside out passes every local test and
 * answers the exact opposite of the truth for every point in the building.
 *
 * Vertices must also be finite, there must be at least 4 of them, and the
 * index list must hold at least 4 whole triangles. The checks run in that
 * order and stop at the first structural failure: a bad count, a bad index, a
 * degenerate facet or an open edge each end the check after one violation
 * under `path`, because every later test reads what that one refused.
 *
 * @param shell Shell to check.
 * @param path Violation path of the shell, such as `$input.spaces[0].shell`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Closure is the edge-manifold condition that every directed edge is matched by exactly one reverse edge, counted in a hash map, and orientation is the sign of the divergence-theorem volume from `builtSpaceShellVolume`, which is positive exactly for an outward-wound closed surface; a facet is degenerate when its cross product, twice its area, is at most 1e-12.
 * @evidence contracts/common.md#clear-and-simple-design The shell half of building space validation, separated from `validateBuiltEnvironment` so that file stays one orchestration, and it reuses the shared volume measure the containment queries read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shell is repaired, re-wound or special-cased; the early stops exist because a later test would only restate the first failure, as documented.
 * @evidence contracts/common.md#meaningful-documentation The documentation states each condition and why it matters, the count floors, the check order and where it stops, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms Linear in vertices and triangle indices: one index scan, one pass building the directed-edge counts in a hash map, one pass over those edges, and one volume sum.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one shell per call; each space's shell is checked once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The edge map is local and released on return, bounded by three entries per triangle; at most one structural violation plus one per non-finite vertex component is appended.
 */
export const validateBuiltSpaceShell = (
  shell: IAutoMovieSpaceShell,
  path: string,
  collector: ViolationCollector,
): void => {
  shell.vertices.forEach((vertex: IAutoMovieVector3, index: number): void =>
    collector.finiteVector(`${path}.vertices[${index}]`, vertex, "shell vertex"),
  );
  if (shell.vertices.length < 4)
    collector.push(
      "range",
      `${path}.vertices`,
      `a closed shell needs at least 4 vertices, but had ${shell.vertices.length}`,
      shell.vertices.length,
    );
  if (shell.triangles.length < 12 || shell.triangles.length % 3 !== 0) {
    collector.push(
      "range",
      `${path}.triangles`,
      `a closed shell needs at least 4 triangles as whole index triples, but had ${shell.triangles.length} indices`,
      shell.triangles.length,
    );
    return;
  }
  const bad: number = shell.triangles.findIndex(
    (index: number): boolean =>
      Number.isSafeInteger(index) === false ||
      index < 0 ||
      index >= shell.vertices.length,
  );
  if (bad !== -1) {
    collector.push(
      "range",
      `${path}.triangles[${bad}]`,
      `shell triangle index must name one of the ${shell.vertices.length} vertices, but was ${shell.triangles[bad]}`,
      shell.triangles[bad],
    );
    return;
  }
  const edges: Map<string, number> = new Map();
  for (let face: number = 0; face < shell.triangles.length; face += 3) {
    const corners: number[] = [
      shell.triangles[face]!,
      shell.triangles[face + 1]!,
      shell.triangles[face + 2]!,
    ];
    const a: IAutoMovieVector3 = shell.vertices[corners[0]!]!;
    const b: IAutoMovieVector3 = shell.vertices[corners[1]!]!;
    const c: IAutoMovieVector3 = shell.vertices[corners[2]!]!;
    if (
      Vector3.length(
        Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
      ) <= FACET_AREA_EPSILON
    ) {
      collector.push(
        "range",
        `${path}.triangles[${face}]`,
        `shell triangle ${face / 3} encloses no area, so it bounds nothing`,
        corners,
      );
      return;
    }
    for (let corner: number = 0; corner < 3; ++corner) {
      const key: string = `${corners[corner]}>${corners[(corner + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  for (const [key, count] of edges)
    if (count !== 1 || edges.get(key.split(">").reverse().join(">")) !== 1) {
      collector.push(
        "type",
        `${path}.triangles`,
        `shell is not closed: directed edge ${key} is not matched by exactly one facet and one opposite facet`,
        key,
      );
      return;
    }
  const volume: number = builtSpaceShellVolume(shell);
  if (volume <= 0)
    collector.push(
      "range",
      `${path}.triangles`,
      "shell encloses no positive volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
};
