import type {
  AutoMovieRecoverySourceTopologyIssueCode,
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryEventRegionCells,
  IAutoMovieRecoveryEventRegionSource,
  IAutoMovieRecoverySourceCellNode,
} from "@automovie/interface";

type Triangle =
  Parameters<IAutoMovieRecoveryEventRegion.Operation>[0]["triangles"][number];
type Cell = ReturnType<
  ReturnType<IAutoMovieRecoveryEventRegion.Operation>
>["cells"][number];

/** Clip one ordered candidate population into fresh private query cells. */
export function RecoveryEventRegionCells(
  source: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[0],
  prepared: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[1],
  query: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[2],
): ReturnType<IAutoMovieRecoveryEventRegionCells.Operation> {
  const {
    address,
    pair,
    ranks,
    collapsed,
    duplicate,
  }: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation> = prepared;
  const lower: number = query.beforeMm,
    upper: number = query.afterMm;
  if (!(lower < upper))
    throw new Error("Finite increasing event-region bounds are required");
  const result: ReturnType<
    ReturnType<IAutoMovieRecoveryEventRegion.Operation>
  > = {
    incidence: source.incidence,
    boundsMm: [lower, upper],
    coverage: {
      candidateFaces: query.candidates.length,
      outsideCandidates: 0,
      completeness: "caller-premise",
    },
    nodes: [],
    aliases: [],
    cells: [],
    occurrences: [],
    components: [],
    contacts: [],
    ports: [],
    issues: [],
  };
  const nodeMap: Map<string, IAutoMovieRecoverySourceCellNode> = new Map(),
    cellNodes: Map<number, IAutoMovieRecoverySourceCellNode[]> = new Map(),
    faceCells: Map<number, number> = new Map();
  const issue: (
    code: AutoMovieRecoverySourceTopologyIssueCode,
    cells: number[],
    occurrences?: string[],
    ports?: string[],
  ) => number = (
    code: AutoMovieRecoverySourceTopologyIssueCode,
    cells: number[],
    occurrences: string[] = [],
    ports: string[] = [],
  ): number => {
    const id: number = result.issues.length;
    result.issues.push({
      code,
      cells: [...new Set(cells)],
      faces: [
        ...new Set(cells.map((i: number): number => result.cells[i].face)),
      ],
      occurrences,
      ports,
    });
    return id;
  };
  const vertex: (id: number) => IAutoMovieRecoverySourceCellNode = (
    id: number,
  ): IAutoMovieRecoverySourceCellNode => ({
    id: `v:${id}`,
    incidenceId: `v:${address(id)}`,
    vertices: [id],
    scalar: source.heights[id],
  });
  const clip: (
    polygon: IAutoMovieRecoverySourceCellNode[],
    level: number,
    above: boolean,
  ) => IAutoMovieRecoverySourceCellNode[] = (
    polygon: IAutoMovieRecoverySourceCellNode[],
    level: number,
    above: boolean,
  ): IAutoMovieRecoverySourceCellNode[] => {
    const output: IAutoMovieRecoverySourceCellNode[] = [];
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieRecoverySourceCellNode =
          polygon[(i + polygon.length - 1) % polygon.length],
        b: IAutoMovieRecoverySourceCellNode = polygon[i];
      const insideA: boolean = above ? a.scalar >= level : a.scalar <= level,
        insideB: boolean = above ? b.scalar >= level : b.scalar <= level;
      // On-plane endpoints are retained by their own corner occurrence, not emitted twice.
      // Repeated original corners remain repeated; they are evidence of a collapsed face.
      if (insideA !== insideB && a.scalar !== level && b.scalar !== level) {
        const vertices: number[] = [
          ...new Set([...a.vertices, ...b.vertices]),
        ].sort((a: number, b: number): number => a - b);
        if (vertices.length !== 2)
          throw new Error("Scalar clipping lost its original edge support");
        output.push({
          id: `x:${pair(vertices[0], vertices[1])}:${level}`,
          incidenceId: `x:${pair(address(vertices[0]), address(vertices[1]))}:${level}`,
          vertices,
          scalar: level,
        });
      }
      if (insideB) output.push(b);
    }
    return output;
  };
  let previous: number = -1;
  for (const face of query.candidates) {
    if (face <= previous || face >= source.triangles.length)
      throw new Error(
        "Event candidates must be increasing original face addresses",
      );
    previous = face;
    const triangle: Triangle = source.triangles[face],
      heights: number[] = triangle.map(
        (v: number): number => source.heights[v],
      );
    const polygon: IAutoMovieRecoverySourceCellNode[] = clip(
      clip(triangle.map(vertex), lower, true),
      upper,
      false,
    );
    if (!polygon.length) {
      result.coverage.outsideCandidates++;
      continue;
    }
    const min: number = Math.min(...heights),
      max: number = Math.max(...heights);
    // Dimension belongs to the abstract reference triangle, even when source geometry collapses.
    const contactCount: number =
      max === lower && min < lower
        ? heights.filter((h: number): boolean => h === lower).length
        : min === upper && max > upper
          ? heights.filter((h: number): boolean => h === upper).length
          : 3;
    const dimension: Cell["dimension"] =
      contactCount === 1 ? 0 : contactCount === 2 ? 1 : 2;
    const plane: number | undefined =
      dimension < 2
        ? polygon[0].scalar
        : min === max && (min === lower || min === upper)
          ? min
          : undefined;
    const cell: Cell = {
      id: result.cells.length,
      face,
      dimension,
      sourceGeometryRank: ranks[face]! < 1 ? 0 : ranks[face] === 1 ? 1 : 2,
      scalarKind:
        dimension < 2
          ? "boundary-contact"
          : min !== max
            ? "varying"
            : min === lower
              ? "flat-before"
              : min === upper
                ? "flat-after"
                : "flat-interior",
      stratum:
        plane === undefined
          ? { kind: "open-slab", beforeMm: lower, afterMm: upper }
          : { kind: "plane", coordinateMm: plane },
      nodes: polygon.map((p: IAutoMovieRecoverySourceCellNode): string => p.id),
      component: null,
      orientationFlip: null,
    };
    result.cells.push(cell);
    cellNodes.set(cell.id, polygon);
    faceCells.set(face, cell.id);
    for (const node of polygon)
      if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
    if (collapsed.has(face)) issue("collapsed-declared-incidence", [cell.id]);
    if (duplicate.has(face)) issue("duplicate-face-occurrence", [cell.id]);
    if (ranks[face] < 2) issue("source-geometry-rank-below-two", [cell.id]);
    if (min === max) issue("flat-source-face", [cell.id]);
  }
  result.nodes = [...nodeMap.values()];
  result.aliases = result.nodes
    .filter(
      (node: IAutoMovieRecoverySourceCellNode): boolean =>
        node.id !== node.incidenceId,
    )
    .map(
      (
        node: IAutoMovieRecoverySourceCellNode,
      ): ReturnType<
        ReturnType<IAutoMovieRecoveryEventRegion.Operation>
      >["aliases"][number] => ({
        rawNode: node.id,
        incidenceId: node.incidenceId,
      }),
    );

  return { result, lower, upper, nodeMap, cellNodes, faceCells, issue };
}
