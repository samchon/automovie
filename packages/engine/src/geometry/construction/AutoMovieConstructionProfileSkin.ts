import type { AutoMovieConstructionProfileBody } from "./AutoMovieConstructionProfileBody";
import { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * Close actual collapsed profile tips through the drawn source boundary.
 *
 * Every ring arc must still occur in its own face's actual open mesh record,
 * and every tip address must remain in the analytic kept region. A complete
 * removed tip stays absent; a cutting loop meeting the original cap strip or
 * a partial or missing original ring is diagnosed
 * without a replacement fan. The actual tip Point0 requires no physical2.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Consumes explicit whole-loop collapsed roles, exact shared ring indices and each face's published native boundary before the existing orientation-aware fan emitter.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Profile end admission stays separate from legacy chain poles; both reuse SolidMesh vertex/close instead of adding another triangulator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not close regular ends, infer topology from chord positions, cap a partial trim or supply zero jets at singular tips. Boundary observations are mesh-consumption checks rather than a continuum collapse proof.
 * @evidence contracts/development/common.md#meaningful-documentation States source Point0, actual pole station, retained-side selection, partial refusal and the callback exception policy.
 * @evidence contracts/development/implementation.md#efficient-algorithms With no ends, returns in O(1). Otherwise O(B) open records build pair sets. Each end indexes E arcs and scans S cut segments once across its unique faces, then E exact tip-membership predicates retain their reached cycle/source costs, up to O(E(S+L)) for L loops; admitted fan emission is O(E).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses existing ring IDs and the registered owner. Within one end/strip each face's unchanged cuts are scanned once, while actual phase-specific kept predicates remain separate; bottom/top strips never share that decision. One actual tip point is read per retained end.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Pair sets, each end's local face set and fan arrays are synchronous scratch; cut results are never reused across different station/regular strips. Mesh retains admitted apex/triangle data and source ownership.
 */
export function AutoMovieConstructionProfileSkin(
  body: AutoMovieSolidBody.IBody,
  ends: readonly AutoMovieConstructionProfileBody.IEnd[],
  open: readonly (readonly AutoMovieSolidMesh.IOpen[])[],
  report: (node: string, contract: string, detail: string) => void,
): void {
  if (ends.length === 0) return;
  const pairs: Set<string>[] = open.map(
    (list: readonly AutoMovieSolidMesh.IOpen[]): Set<string> => {
      const edges: Set<string> = new Set();
      for (const boundary of list)
        for (let k: number = 0; k < boundary.vertices.length; k++)
          edges.add(
            pair(
              boundary.vertices[k]!,
              boundary.vertices[(k + 1) % boundary.vertices.length]!,
            ),
          );
      return edges;
    },
  );
  for (const end of ends) {
    const first: number = Math.min(end.station, end.regular);
    const last: number = Math.max(end.station, end.regular);
    const faces: Set<number> = new Set(
      end.checks.map((arc: (typeof end.checks)[number]): number => arc.face),
    );
    if (
      [...faces].some((face: number): boolean =>
        body.faces[face]!.cycles.some(
          (cut: (typeof body.faces)[number]["cycles"][number]): boolean =>
            cut.chart.some(
              (p: [number, number], i: number): boolean =>
                Math.min(p[0], cut.chart[(i + 1) % cut.chart.length]![0]) <=
                  last &&
                Math.max(p[0], cut.chart[(i + 1) % cut.chart.length]![0]) >=
                  first,
            ),
        ),
      )
    ) {
      report(
        end.surface.name,
        "profile pole",
        "An actual cutting loop meets the original collapsed-cap strip; a trimmed cap patch is not supported.",
      );
      continue;
    }
    const kept: boolean[] = end.checks.map(
      (arc: (typeof end.checks)[number]): boolean =>
        AutoMovieSolidBody.kept(body.faces[arc.face]!, end.station, arc.phase),
    );
    if (kept.every((value: boolean): boolean => !value)) continue;
    if (
      !kept.every(Boolean) ||
      end.checks.some(
        (arc: (typeof end.checks)[number]): boolean =>
          !pairs[arc.face]?.has(pair(arc.from, arc.to)),
      )
    ) {
      report(
        end.surface.name,
        "profile pole",
        "The actual collapsed tip has no complete retained source ring in the drawn faces.",
      );
      continue;
    }
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, end.surface);
    const apex: number = AutoMovieSolidMesh.vertex(
      body.mesh,
      end.surface.point!(end.station, 0),
      owner,
      end.station,
      0,
    );
    const triangles: [number, number, number][] = end.vertices.map(
      (id: number, k: number): [number, number, number] => [
        id,
        end.vertices[(k + 1) % end.vertices.length]!,
        apex,
      ],
    );
    AutoMovieSolidMesh.close(body.mesh, triangles, end.surface, false);
  }
}

/** Shared IDs, never positional coincidence, define a consumed boundary arc. */
function pair(a: number, b: number): string {
  return Math.min(a, b) + "/" + Math.max(a, b);
}
