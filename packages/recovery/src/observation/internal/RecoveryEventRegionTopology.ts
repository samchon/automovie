import type {
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryEventRegionCells,
  IAutoMovieRecoveryEventRegionSource,
  IAutoMovieRecoveryEventRegionTopology,
  IAutoMovieRecoverySourceHalfedge,
} from "@automovie/interface";

/*
 * Observe component incidence, orientation parity, links and boundary cycles in
 * one query.
 */
export function RecoveryEventRegionTopology(
  _source: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[0],
  prepared: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[1],
  work: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[2],
): ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation> {
  const {
    address,
    pair,
    sourceEdges,
    collapsed,
  }: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation> = prepared;
  const {
    result,
    lower,
    upper,
    nodeMap,
    cellNodes,
    issue,
  }: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation> = work;
  const parent: number[] = result.cells.map((_: Cell, i: number): number => i);
  const rank: Uint8Array = new Uint8Array(parent.length);
  const root: (id: number) => number = (id: number): number => {
    let r: number = id;
    while (parent[r] !== r) r = parent[r];
    while (parent[id] !== id) {
      const next: number = parent[id];
      parent[id] = r;
      id = next;
    }
    return r;
  };
  const join: (a: number, b: number) => void = (a: number, b: number): void => {
    let u: number = root(a),
      v: number = root(b);
    if (u === v) return;
    if (rank[u] < rank[v] || (rank[u] === rank[v] && u > v)) [u, v] = [v, u];
    parent[v] = u;
    if (rank[u] === rank[v]) rank[u]++;
  };
  const edges: Map<string, IAutoMovieRecoverySourceHalfedge[]> = new Map(),
    cellOccurrences: Map<number, IAutoMovieRecoverySourceHalfedge[]> =
      new Map();
  for (const cell of result.cells) {
    if (cell.dimension !== 2) continue;
    const nodes: Node[] = cellNodes.get(cell.id)!;
    for (let i: number = 0; i < nodes.length; i++) {
      const a: Node = nodes[i],
        b: Node = nodes[(i + 1) % nodes.length],
        support: number[] = [...new Set([...a.vertices, ...b.vertices])];
      const side: IAutoMovieRecoverySourceHalfedge["side"] =
        a.scalar === lower && b.scalar === lower
          ? "before"
          : a.scalar === upper && b.scalar === upper
            ? "after"
            : "physical";
      const edge: string =
        support.length <= 2
          ? `e:${pair(address(support[0]), address(support.at(-1)!))}`
          : `f:${cell.face}:${side}`;
      const occurrence: IAutoMovieRecoverySourceHalfedge = {
        id: `${cell.id}.${i}`,
        cell: cell.id,
        face: cell.face,
        from: a.id,
        to: b.id,
        edge,
        side,
        physicalBoundary: sourceEdges.get(edge) === 1,
        component: -1,
      };
      result.occurrences.push(occurrence);
      if (!edges.has(edge)) edges.set(edge, []);
      edges.get(edge)!.push(occurrence);
      if (!cellOccurrences.has(cell.id)) cellOccurrences.set(cell.id, []);
      cellOccurrences.get(cell.id)!.push(occurrence);
    }
  }
  for (const uses of edges.values())
    for (let i: number = 1; i < uses.length; i++)
      join(uses[0].cell, uses[i].cell);
  const components: Map<number, Component> = new Map();
  for (const cell of result.cells)
    if (cell.dimension === 2) {
      const r: number = root(cell.id);
      if (!components.has(r)) {
        const component: Component = {
          id: result.components.length,
          cells: [],
          faces: [],
          classification: "unclassified",
          topology: {
            vertices: 0,
            edges: 0,
            faces: 0,
            euler: null,
            manifold: false,
            orientable: null,
            inputOrientationConsistent: true,
            boundaryCycles: 0,
            genus: null,
          },
          cycles: [],
          unresolvedBoundary: [],
          issueIds: [],
        };
        components.set(r, component);
        result.components.push(component);
      }
      const component: Component = components.get(r)!;
      cell.component = component.id;
      component.cells.push(cell.id);
      component.faces.push(cell.face);
    }
  const componentOccurrences: Map<number, IAutoMovieRecoverySourceHalfedge[]> =
    new Map();
  for (const occurrence of result.occurrences) {
    occurrence.component = result.cells[occurrence.cell].component!;
    if (!componentOccurrences.has(occurrence.component))
      componentOccurrences.set(occurrence.component, []);
    componentOccurrences.get(occurrence.component)!.push(occurrence);
  }
  const incidence: (raw: string) => string = (raw: string): string =>
    nodeMap.get(raw)!.incidenceId;
  const vertexComponents: Map<string, Set<number>> = new Map(),
    vertexCells: Map<string, Set<number>> = new Map();
  for (const component of result.components) {
    const uses: IAutoMovieRecoverySourceHalfedge[] =
      componentOccurrences.get(component.id) ?? [];
    const byEdge: Map<string, IAutoMovieRecoverySourceHalfedge[]> = new Map(),
      vertices: Set<string> = new Set();
    for (const use of uses) {
      if (!byEdge.has(use.edge)) byEdge.set(use.edge, []);
      byEdge.get(use.edge)!.push(use);
      for (const raw of [use.from, use.to]) {
        const id: string = incidence(raw);
        vertices.add(id);
        if (!vertexComponents.has(id)) vertexComponents.set(id, new Set());
        vertexComponents.get(id)!.add(component.id);
        if (!vertexCells.has(id)) vertexCells.set(id, new Set());
        vertexCells.get(id)!.add(use.cell);
      }
    }
    const boundary: IAutoMovieRecoverySourceHalfedge[] = [],
      adjacency: Map<number, { cell: number; flip: boolean }[]> = new Map();
    let manifold: boolean = true,
      simpleCells: boolean = true;
    for (const cell of component.cells) {
      const ids: string[] = cellNodes
        .get(cell)!
        .map((p: Node): string => p.incidenceId);
      if (
        ids.length < 3 ||
        collapsed.has(result.cells[cell].face) ||
        new Set(ids).size !== ids.length
      ) {
        simpleCells = false;
        manifold = false;
        issue("repeated-cell-incidence-vertex", [cell]);
      }
    }
    for (const rows of byEdge.values()) {
      if (rows.length === 1) boundary.push(rows[0]);
      if ((sourceEdges.get(rows[0].edge) ?? 0) > 2)
        issue(
          "nonmanifold-source-edge",
          rows.map((r: IAutoMovieRecoverySourceHalfedge): number => r.cell),
          rows.map((r: IAutoMovieRecoverySourceHalfedge): string => r.id),
        );
      if (rows.length > 2) {
        manifold = false;
        issue(
          "nonmanifold-edge-incidence",
          rows.map((r: IAutoMovieRecoverySourceHalfedge): number => r.cell),
          rows.map((r: IAutoMovieRecoverySourceHalfedge): string => r.id),
        );
      }
      if (rows.length === 2) {
        const same: boolean =
          incidence(rows[0].from) === incidence(rows[1].from);
        if (same) component.topology.inputOrientationConsistent = false;
        for (let i: number = 0; i < 2; i++) {
          if (!adjacency.has(rows[i].cell)) adjacency.set(rows[i].cell, []);
          adjacency
            .get(rows[i].cell)!
            .push({ cell: rows[1 - i].cell, flip: same });
        }
      }
    }
    const flips: Map<number, boolean> = new Map();
    let orientable: boolean = true;
    for (const start of component.cells)
      if (!flips.has(start)) {
        flips.set(start, false);
        const queue: number[] = [start];
        for (let i: number = 0; i < queue.length; i++) {
          const current: boolean = flips.get(queue[i])!;
          for (const link of adjacency.get(queue[i]) ?? []) {
            const next: boolean = current !== link.flip;
            if (!flips.has(link.cell)) {
              flips.set(link.cell, next);
              queue.push(link.cell);
            } else if (flips.get(link.cell) !== next) orientable = false;
          }
        }
      }
    const boundaryVertices: Set<string> = new Set(
      boundary.flatMap((row: IAutoMovieRecoverySourceHalfedge): string[] => [
        incidence(row.from),
        incidence(row.to),
      ]),
    );
    const links: Map<string, { a: string; b: string }[]> = new Map();
    for (const cell of component.cells) {
      const rows: IAutoMovieRecoverySourceHalfedge[] =
        cellOccurrences.get(cell) ?? [];
      for (let i: number = 0; i < rows.length; i++) {
        const id: string = incidence(rows[i].from);
        if (!links.has(id)) links.set(id, []);
        links.get(id)!.push({
          a: rows[(i + rows.length - 1) % rows.length].edge,
          b: rows[i].edge,
        });
      }
    }
    for (const [vertex, rows] of links) {
      const graph: Map<string, string[]> = new Map();
      for (const edge of rows) {
        if (!graph.has(edge.a)) graph.set(edge.a, []);
        if (!graph.has(edge.b)) graph.set(edge.b, []);
        graph.get(edge.a)!.push(edge.b);
        graph.get(edge.b)!.push(edge.a);
      }
      const queue: string[] = [graph.keys().next().value!],
        seen: Set<string> = new Set(queue);
      for (let i: number = 0; i < queue.length; i++)
        for (const next of graph.get(queue[i])!)
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
      const degrees: number[] = [...graph.values()].map(
          (list: string[]): number => list.length,
        ),
        ends: number = degrees.filter((d: number): boolean => d === 1).length;
      if (
        seen.size !== graph.size ||
        degrees.some((d: number): boolean => d < 1 || d > 2) ||
        ends !== (boundaryVertices.has(vertex) ? 2 : 0)
      ) {
        manifold = false;
        issue(
          "nonmanifold-vertex-link",
          [...vertexCells.get(vertex)!].filter(
            (id: number): boolean =>
              result.cells[id].component === component.id,
          ),
        );
      }
    }
    const boundaryAt: Map<string, IAutoMovieRecoverySourceHalfedge[]> =
      new Map();
    for (const row of boundary)
      for (const id of [incidence(row.from), incidence(row.to)]) {
        if (!boundaryAt.has(id)) boundaryAt.set(id, []);
        boundaryAt.get(id)!.push(row);
      }
    const visited: Set<string> = new Set();
    for (const first of boundary)
      if (!visited.has(first.id)) {
        const queue: IAutoMovieRecoverySourceHalfedge[] = [first],
          members: Set<string> = new Set([first.id]),
          expanded: Set<string> = new Set();
        for (let i: number = 0; i < queue.length; i++)
          for (const vertex of [
            incidence(queue[i].from),
            incidence(queue[i].to),
          ])
            if (!expanded.has(vertex)) {
              expanded.add(vertex);
              for (const next of boundaryAt.get(vertex)!)
                if (!members.has(next.id)) {
                  members.add(next.id);
                  queue.push(next);
                }
            }
        for (const row of queue) visited.add(row.id);
        if (
          queue.some(
            (row: IAutoMovieRecoverySourceHalfedge): boolean =>
              incidence(row.from) === incidence(row.to) ||
              [incidence(row.from), incidence(row.to)].some(
                (id: string): boolean => boundaryAt.get(id)!.length !== 2,
              ),
          )
        ) {
          component.unresolvedBoundary.push(
            ...queue.map((r: IAutoMovieRecoverySourceHalfedge): string => r.id),
          );
          issue(
            "boundary-is-not-a-simple-cycle",
            queue.map((r: IAutoMovieRecoverySourceHalfedge): number => r.cell),
            queue.map((r: IAutoMovieRecoverySourceHalfedge): string => r.id),
          );
          continue;
        }
        const cycle: Component["cycles"][number] = {
          occurrences: [],
          nodes: [],
          orientation: manifold && orientable ? "coherent" : "unqualified",
        };
        let row: IAutoMovieRecoverySourceHalfedge = first,
          at: string = incidence(
            orientable && flips.get(first.cell) ? first.to : first.from,
          );
        do {
          const direction: 1 | -1 = incidence(row.from) === at ? 1 : -1;
          cycle.occurrences.push({ id: row.id, direction });
          cycle.nodes.push(at);
          at = incidence(direction === 1 ? row.to : row.from);
          row = boundaryAt
            .get(at)!
            .find(
              (candidate: IAutoMovieRecoverySourceHalfedge): boolean =>
                candidate.id !== row.id,
            )!;
        } while (row.id !== first.id);
        component.cycles.push(cycle);
      }
    const euler: number | null = simpleCells
      ? vertices.size - byEdge.size + component.cells.length
      : null;
    const closedBoundary: boolean = component.unresolvedBoundary.length === 0;
    // Twice the genus is an integer count; an odd one names no surface.
    const twiceGenus: number | null =
      manifold && orientable && closedBoundary && euler !== null
        ? 2 - component.cycles.length - euler
        : null;
    const genus: number | null =
      twiceGenus !== null && twiceGenus % 2 === 0 ? twiceGenus / 2 : null;
    component.topology = {
      vertices: vertices.size,
      edges: byEdge.size,
      faces: component.cells.length,
      euler,
      manifold,
      orientable: manifold ? orientable : null,
      inputOrientationConsistent: component.topology.inputOrientationConsistent,
      boundaryCycles: component.cycles.length,
      genus: genus !== null && genus >= 0 ? genus : null,
    };
    for (const cell of component.cells)
      result.cells[cell].orientationFlip =
        manifold && orientable ? flips.get(cell)! : null;
    if (!orientable) issue("orientation-parity-obstruction", component.cells);
    if (!component.topology.inputOrientationConsistent)
      issue("input-face-directions-inconsistent", component.cells);
  }

  return { edges, cellOccurrences, vertexComponents, vertexCells, incidence };
}
type Node = ReturnType<
  ReturnType<IAutoMovieRecoveryEventRegion.Operation>
>["nodes"][number];
type Cell = ReturnType<
  ReturnType<IAutoMovieRecoveryEventRegion.Operation>
>["cells"][number];

type Component = ReturnType<
  ReturnType<IAutoMovieRecoveryEventRegion.Operation>
>["components"][number];
