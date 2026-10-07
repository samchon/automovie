import { HUMAN_SOURCE_REPORTED_ENDPOINTS } from "./HUMAN_SOURCE_REPORTED_ENDPOINTS.ts";
import type { IHumanSourceRefitInput } from "./structures/IHumanSourceRefitInput.ts";

/** A published part vertex is an exact twin of MPFB's refit only within float storage. */
const TWIN_METRES = 1e-6;

/**
 * Compare a bound part's rows with MPFB's own refit of the part where the
 * published part is its exact twin: every published vertex must match a
 * distinct refit vertex at neutral within float storage. The report gives, per
 * reported body endpoint, the largest difference between the part's row and
 * the refit's displacement minus the anchor carry. A part with no matching
 * refit level, or one whose neutral changed after extraction, says so.
 */
export function checkHumanSourcePartRefit(
  input: IHumanSourceRefitInput,
): string {
  const { id, count, positions, row, anchorOf, sample, offset } = input;
  const recorded = sample.manifest.parts.find((p) => p.id === id);
  const level =
    recorded === undefined
      ? undefined
      : Object.keys(recorded.vertices).find(
          (l) => recorded.vertices[l] === count,
        );
  const values =
    level === undefined ? undefined : sample.partPositions.get(id)?.get(level);
  if (values === undefined) return "no refit level matches";
  const states = new Map(
    sample.manifest.partStates.map((name, i) => [name, i]),
  );
  const at = (state: number, q: number, c: number): number => {
    const base = 3 * (state * count + q);
    return c === 0
      ? values[base]
      : c === 1
        ? values[base + 2] - offset
        : -values[base + 1];
  };
  const map = new Int32Array(count);
  const used = new Set<number>();
  let worstTwin = 0;
  for (let v = 0; v < count; v++) {
    let best = Number.POSITIVE_INFINITY;
    for (let q = 0; q < count; q++) {
      const d = Math.hypot(
        at(0, q, 0) - positions[3 * v],
        at(0, q, 1) - positions[3 * v + 1],
        at(0, q, 2) - positions[3 * v + 2],
      );
      if (d < best) {
        best = d;
        map[v] = q;
      }
    }
    used.add(map[v]);
    worstTwin = Math.max(worstTwin, best);
  }
  if (used.size !== count || worstTwin > TWIN_METRES)
    return "no exact refit twin (neutral changed after extraction)";
  const report = HUMAN_SOURCE_REPORTED_ENDPOINTS.filter((name) =>
    states.has(name),
  ).map((name) => {
    const s = states.get(name)!;
    const anchor = anchorOf(name);
    let worst = 0;
    for (let v = 0; v < count; v++) {
      const q = map[v];
      const truth = [0, 1, 2].map((c) => at(s, q, c) - at(0, q, c) - anchor[c]);
      worst = Math.max(
        worst,
        Math.hypot(...row(name, v).map((x, c) => x - truth[c])),
      );
    }
    return `${name} ${(worst * 1000).toFixed(2)} mm`;
  });
  return `against MPFB refit ${report.join(", ")}`;
}
