import {
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";
import { builtSpaceShellVolume } from "./builtSpaceShellVolume";

/*
 * Check shell indices, finite facet areas, paired edges and positive signed
 * volume.
 *
 * Indices must resolve, computed facet areas must be finite/non-negligible, and
 * each directed edge must appear once with its reverse once. Aggregate computed
 * signed volume must be finite/positive. Nothing is repaired. These checks
 * reject missing/duplicated edges and nonpositive global volume but do not
 * prove every disconnected component's orientation or exclude all
 * self-intersections. Containment's absolute solid-angle test is a separate
 * numerical policy.
 *
 * Vertices must be finite, with at least four vertices and four whole
 * triangles. Vertex-component/count findings do not stop checking; bad triangle
 * count/index, unusable facet area or unmatched edge does. Findings can
 * therefore include a vertex-count finding plus one later structural finding
 * and non-finite component findings.
 * Parameter shell: Shell to check.
 * Parameter path: Violation path of the shell, such as `$input.spaces[0].shell`.
 * Parameter collector: Sink that receives the violations.
 */
export function validateBuiltSpaceShell(
  shell: IAutoMovieSpaceShell,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
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
    (index: number): boolean => index < 0 || index >= shell.vertices.length,
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
    const area: number = Vector3.length(
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
    // Cross products of finite vertices can overflow binary64.
    if (area <= FACET_AREA_EPSILON || overflowsBinary64(area)) {
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
  if (volume <= 0 || overflowsBinary64(volume))
    collector.push(
      "range",
      `${path}.triangles`,
      "shell needs finite positive signed volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
}

/*
 * A facet whose doubled area is this small or smaller bounds nothing.
 */
const FACET_AREA_EPSILON: number = 1e-12;
