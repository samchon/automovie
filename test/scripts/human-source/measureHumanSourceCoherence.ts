import { compareHumanSourceNames } from "./compareHumanSourceNames.ts";
import type { IHumanSourceCoherenceSurface } from "./structures/IHumanSourceCoherenceSurface.ts";
import type { IHumanSourceCoherenceTable } from "./structures/IHumanSourceCoherenceTable.ts";
import type { IHumanSourceEditReceipt } from "./structures/IHumanSourceEditReceipt.ts";

/**
 * Read one candidate coordinate table against its reference under an edit receipt.
 *
 * A vertex the receipt does not list must keep its three neutral coordinates
 * bit for bit, and an endpoint row the receipt does not list must exist on
 * both sides with the same three numbers. Equality is `Object.is`, so a sign
 * flip of zero counts: the two generations are parsed from the same JSON
 * number grammar and an untouched value has no reason to differ at all.
 * A vertex listed for every endpoint exempts its row in each of them, and an
 * endpoint listed as re-derived is exempt as a whole.
 * Listed vertices and rows are counted and otherwise not judged, because what
 * an edit should have produced belongs to the stage that made it.
 */
export function measureHumanSourceCoherence(
  reference: IHumanSourceCoherenceTable,
  candidate: IHumanSourceCoherenceTable,
  receipt: IHumanSourceEditReceipt,
): IHumanSourceCoherenceSurface {
  const edited = new Set(receipt.positions
    .filter((entry) => entry.view === candidate.view && entry.surface === candidate.surface)
    .flatMap((entry) => entry.vertices));
  const editedRows = new Map<string, Set<number>>();
  for (const entry of receipt.endpoints) {
    if (entry.view !== candidate.view || entry.surface !== candidate.surface) continue;
    const rows = editedRows.get(entry.endpoint) ?? new Set<number>();
    for (const vertex of entry.vertices) rows.add(vertex);
    editedRows.set(entry.endpoint, rows);
  }
  const everyEndpoint = new Set(receipt.endpointVertices
    .filter((entry) => entry.view === candidate.view && entry.surface === candidate.surface)
    .flatMap((entry) => entry.vertices));
  const rederived = new Set(receipt.rederivedEndpoints
    .filter((entry) => entry.view === candidate.view && entry.surface === candidate.surface)
    .map((entry) => entry.endpoint));
  const mismatched: number[] = [];
  const count = Math.max(reference.positions.length, candidate.positions.length) / 3;
  for (let vertex = 0; vertex < count; vertex++) {
    if (edited.has(vertex)) continue;
    for (let axis = 0; axis < 3; axis++)
      if (!Object.is(reference.positions[3 * vertex + axis], candidate.positions[3 * vertex + axis])) {
        mismatched.push(vertex);
        break;
      }
  }
  const rowsOf = (rows: readonly number[] | undefined): Map<number, number> => {
    const result = new Map<number, number>();
    if (rows !== undefined) for (let at = 0; at < rows.length; at += 4) result.set(rows[at], at);
    return result;
  };
  const mismatchedEndpoints: string[] = [];
  let untouchedRowMismatches = 0;
  for (const name of new Set([...Object.keys(reference.targets), ...Object.keys(candidate.targets)])) {
    if (rederived.has(name)) continue;
    const before = reference.targets[name] ?? [], after = candidate.targets[name] ?? [];
    const beforeRows = rowsOf(before), afterRows = rowsOf(after);
    const listed = editedRows.get(name);
    let wrong = 0;
    for (const vertex of new Set([...beforeRows.keys(), ...afterRows.keys()])) {
      if (listed?.has(vertex) || everyEndpoint.has(vertex)) continue;
      const a = beforeRows.get(vertex), b = afterRows.get(vertex);
      if (a === undefined || b === undefined ||
          !Object.is(before[a + 1], after[b + 1]) || !Object.is(before[a + 2], after[b + 2]) || !Object.is(before[a + 3], after[b + 3])) wrong++;
    }
    if (wrong !== 0) {
      untouchedRowMismatches += wrong;
      mismatchedEndpoints.push(name);
    }
  }
  const after = candidate.indices;
  const indicesEqual = reference.indices === null || after === null
    ? reference.indices === after
    : reference.indices.length === after.length && reference.indices.every((value, at) => value === after[at]);
  return {
    view: candidate.view, surface: candidate.surface,
    vertices: [reference.positions.length / 3, candidate.positions.length / 3],
    indicesEqual,
    editedVertices: edited.size,
    untouchedPositionMismatches: mismatched.length,
    firstMismatchedVertices: mismatched.slice(0, 16),
    endpointsOnlyInReference: Object.keys(reference.targets).filter((name) => candidate.targets[name] === undefined).sort(compareHumanSourceNames),
    endpointsOnlyInCandidate: Object.keys(candidate.targets).filter((name) => reference.targets[name] === undefined).sort(compareHumanSourceNames),
    editedRows: [...editedRows.values()].reduce((total, rows) => total + rows.size, 0),
    untouchedRowMismatches,
    mismatchedEndpoints: mismatchedEndpoints.sort(compareHumanSourceNames),
  };
}
