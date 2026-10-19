import type { RecoveryEventRegion } from "./RecoveryEventRegion";
import type { RecoveryEventRegionCells } from "./RecoveryEventRegionCells";
import type { RecoveryEventRegionSource } from "./RecoveryEventRegionSource";
import type { RecoveryEventRegionTopology } from "./RecoveryEventRegionTopology";

type Source = Parameters<typeof RecoveryEventRegion>[0];
type Query = Parameters<ReturnType<typeof RecoveryEventRegion>>[0];
type Result = ReturnType<ReturnType<typeof RecoveryEventRegion>>;

type Node = Result["nodes"][number];

type Occurrence = Result["occurrences"][number];

type Issue = Result["issues"][number];

type PortReference = Query["ports"][number]["reference"];
/**
 * Attach contact and port ownership evidence after component topology is complete.
 *
 * @evidence contracts/common.md#principled-implementation Port address checks, boundary claims and final issue-to-component attachment retain their original sequence.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits query contacts, explicit port supports and actual claimed boundary occurrences.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumes the existing cell and incidence maps instead of repeating clipping or connectivity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned records transfer to the query caller; all port and claim scratch is query-local.
 */
export function RecoveryEventRegionPorts(
  source: Source,
  prepared: ReturnType<typeof RecoveryEventRegionSource>,
  work: ReturnType<typeof RecoveryEventRegionCells>,
  topology: ReturnType<typeof RecoveryEventRegionTopology>,
  query: Query,
): Result {
  const { size, address, pair }: ReturnType<typeof RecoveryEventRegionSource> =
    prepared;
  const {
    result,
    faceCells,
    cellNodes,
    issue,
  }: ReturnType<typeof RecoveryEventRegionCells> = work;
  const {
    edges,
    cellOccurrences,
    vertexComponents,
    vertexCells,
  }: ReturnType<typeof RecoveryEventRegionTopology> = topology;
  for (const [vertex, members] of vertexComponents)
    if (members.size > 1)
      issue("point-contact-between-edge-components", [
        ...vertexCells.get(vertex)!,
      ]);
  for (const cell of result.cells)
    if (cell.dimension < 2)
      result.contacts.push({
        cell: cell.id,
        touchingComponents: [
          ...new Set(
            cellNodes
              .get(cell.id)!
              .flatMap((p: Node): number[] => [
                ...(vertexComponents.get(p.incidenceId) ?? []),
              ]),
          ),
        ].sort((a: number, b: number): number => a - b),
      });
  const portIds: Set<string> = new Set();
  for (const port of query.ports) {
    if (
      !port.id ||
      portIds.has(port.id) ||
      !["before", "after", "physical"].includes(port.side)
    )
      throw new Error(
        "Distinct named ports and explicit boundary sides are required",
      );
    const reference: PortReference = port.reference;
    if (
      reference.kind === "boundary"
        ? !reference.name
        : !(
            Number.isSafeInteger(reference.section) &&
            reference.section >= 0 &&
            (reference.kind === "contact"
              ? Number.isSafeInteger(reference.observation) &&
                reference.observation >= 0
              : (reference.kind === "closed" || reference.kind === "open") &&
                Number.isSafeInteger(reference.curve) &&
                reference.curve >= 0)
          )
    )
      throw new Error("A port requires a typed source-free reference");
    portIds.add(port.id);
    const support: Set<number> = new Set(port.faces);
    if (
      [...support].some(
        (face: number): boolean =>
          !Number.isSafeInteger(face) ||
          face < 0 ||
          face >= source.triangles.length,
      )
    )
      throw new Error("Port support requires original source face addresses");
    const portEdges: Set<string> = new Set(
      (port.edges ?? []).map((edge: readonly [number, number]): string => {
        if (
          edge.length !== 2 ||
          edge.some(
            (v: number): boolean =>
              !Number.isSafeInteger(v) || v < 0 || v >= size,
          )
        )
          throw new Error(
            "Port edges require original source vertex addresses",
          );
        return `e:${pair(address(edge[0]), address(edge[1]))}`;
      }),
    );
    const cells: number[] = [...support]
      .flatMap((face: number): number[] =>
        faceCells.has(face) ? [faceCells.get(face)!] : [],
      )
      .sort((a: number, b: number): number => a - b);
    const components: number[] = [
      ...new Set(
        cells.flatMap((id: number): number[] =>
          result.cells[id].component === null
            ? []
            : [result.cells[id].component!],
        ),
      ),
    ].sort((a: number, b: number): number => a - b);
    const occurrences: string[] = cells
      .flatMap((cell: number): Occurrence[] => cellOccurrences.get(cell) ?? [])
      .filter(
        (row: Occurrence): boolean =>
          (port.side === "physical"
            ? row.physicalBoundary &&
              (!portEdges.size || portEdges.has(row.edge))
            : row.side === port.side) && edges.get(row.edge)!.length === 1,
      )
      .map((row: Occurrence): string => row.id);
    const status: Result["ports"][number]["status"] =
      components.length > 1
        ? "ambiguous"
        : components.length === 1 && occurrences.length
          ? "unique-component"
          : cells.length &&
              cells.every(
                (id: number): boolean => result.cells[id].dimension < 2,
              )
            ? "contact-only"
            : "missing";
    result.ports.push({
      id: port.id,
      reference: port.reference,
      cells,
      components,
      occurrences,
      status,
    });
    if (status === "ambiguous" || status === "missing")
      issue(
        status === "ambiguous"
          ? "port-ambiguous-ownership"
          : "port-missing-ownership",
        cells,
        occurrences,
        [port.id],
      );
  }
  const claims: Map<string, string[]> = new Map();
  const occurrenceById: Map<string, Occurrence> = new Map(
    result.occurrences.map((row: Occurrence): [string, Occurrence] => [
      row.id,
      row,
    ]),
  );
  for (const port of result.ports)
    for (const occurrence of port.occurrences) {
      if (!claims.has(occurrence)) claims.set(occurrence, []);
      claims.get(occurrence)!.push(port.id);
    }
  for (const [id, ports] of claims)
    if (ports.length > 1) {
      const occurrence: Occurrence = occurrenceById.get(id)!;
      issue("overlapping-port-boundary-claims", [occurrence.cell], [id], ports);
    }
  result.issues.forEach((entry: Issue, i: number): void => {
    const components: Set<number> = new Set(
      entry.cells.flatMap((id: number): number[] =>
        result.cells[id].component === null
          ? []
          : [result.cells[id].component!],
      ),
    );
    for (const component of components)
      result.components[component].issueIds.push(i);
  });
  return result;
}
