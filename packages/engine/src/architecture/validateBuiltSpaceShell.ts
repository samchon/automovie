import { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtSpaceShellVolume } from "./builtSpaceShellVolume";

/** A facet whose doubled area is this small or smaller bounds nothing. */
const FACET_AREA_EPSILON: number = 1e-12;

/**
 * Check shell indices, finite facet areas, paired edges and positive signed volume.
 *
 * Indices must resolve, computed facet areas must be finite/non-negligible, and each directed edge must appear once with its reverse once. Aggregate computed signed volume must be finite/positive. Nothing is repaired. These checks reject missing/duplicated edges and nonpositive global volume but do not prove every disconnected component's orientation or exclude all self-intersections. Containment's absolute solid-angle test is a separate numerical policy.
 *
 * Vertices must be finite, with at least four vertices and four whole triangles. Vertex-component/count findings do not stop checking; bad triangle count/index, unusable facet area or unmatched edge does. Findings can therefore include a vertex-count finding plus one later structural finding and non-finite component findings.
 *
 * @param shell Shell to check.
 * @param path Violation path of the shell, such as `$input.spaces[0].shell`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Counts each directed edge and its reverse once, refuses non-finite or negligible computed cross-product length and requires finite positive signed volume. These are local pairing and aggregate-orientation checks under binary64 arithmetic; they do not certify full manifold topology, non-self-intersection or every component's orientation.
 * @evidence contracts/common.md#clear-and-simple-design The shell half of building space validation, separated from `validateBuiltEnvironment` so that file stays one orchestration, and it reuses the shared volume measure the containment queries read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shell is repaired, re-wound or special-cased; the early stops exist because a later test would only restate the first failure, as documented.
 * @evidence contracts/common.md#meaningful-documentation The documentation states each condition and why it matters, the count floors, the check order and where it stops, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms Linear in vertices and triangle indices: one index scan, one pass building the directed-edge counts in a hash map, one pass over those edges, and one volume sum.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one shell per call; each space's shell is checked once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local edge map has at most three entries per triangle. Findings include at most one vertex-count and one later structural/volume finding, plus one per non-finite component; the caller owns them.
 */
export const validateBuiltSpaceShell: (shell: IAutoMovieSpaceShell, path: string, collector: ViolationCollector) => void = (
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
    const area: number = Vector3.length(Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)));
    if (!Number.isFinite(area) || area <= FACET_AREA_EPSILON) {
      collector.push(
        "range",
        `${path}.triangles[${face}]`,
        `shell triangle ${face / 3} needs finite non-negligible area`,
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
  if (!Number.isFinite(volume) || volume <= 0)
    collector.push(
      "range",
      `${path}.triangles`,
      "shell needs finite positive signed volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
};
