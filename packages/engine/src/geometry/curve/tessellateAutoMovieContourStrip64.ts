import { AutoMovieContourLoftCurves64 } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 } from "./AutoMovieCurveMath64";
import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/** Per-call work and qualification, independent of renderable geometry. */
type Observation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;

/**
 * Finds a fixed-seam periodic tiling and reports sheet qualification separately from displayable geometry.
 * The first seam lies on its exterior; the other starts at its nearest existing knot.
 * This discrete dynamic-program optimum does not certify a global cyclic optimum or injectivity.
 * Each walk may contain an explicitly doubled branch slit with distinct sheet ownership.
 * If no qualified path exists, its finite positive-area candidate remains displayable with an unqualified observation.
 * A zero-length slit retains distinct sheet identities; only its zero-area tiles are omitted, with explicit partial-output diagnostics.
 * The optional observer receives input sizes, search work, qualification and diagnostics; elapsed time is measured only when requested.
 *
 * @evidence contracts/common.md#principled-implementation Two interior-progress bits exclude repeated modulo crossedges on simple rings. Best-first conflict search reuses this recurrence as a lower-bound solver: duplicate-face and overfull-edge conflicts forbid at least one contributing transition; a residual link failure excludes its complete current path. A proven invalid or physically collapsed boundary prunes impossible qualification. Zero-area transitions retain the periodic walk without merging sheet identities; publication omits only those primitives and preserves the finite remainder with explicit unqualified diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Two oriented walks and a triangle receiver define the operation; vertex identity belongs to the receiver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sheet keys or object identity define topology; no coordinate weld, density compensation, original mesh or shading normal repairs a tiling. Quality failure preserves finite indexed positive-area geometry and its observer diagnostics; an unrepresentable primitive is not declared qualified.
 * @evidence contracts/common.md#meaningful-documentation States seam selection, branch support, zero-slit partial finite publication and omitted primitive counts, optional observation and timing, and the absence of a global cyclic or fold guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Each constrained four-state grid costs O(nm), followed by expected O(n+m) admission. Simple rings need one solve. For Q subproblems of maximum constraint depth D, work is O(Q(nm+DlogD+logQ)); retained paths and constraints cost O(Q(n+m+D)), with one O(nm) grid per solve. D is at most the transition count. Exhaustive slit search can be exponential and has no implicit geometric budget.
 * @evidence contracts/performance.md#reuse-equivalent-work Tile areas and sheet identities are shared by every constrained solve; each grid is evaluated once and reused during its backtrack. Equivalent forbidden-transition sets are not solved twice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Grids expire after each solve, and the per-strip heap, paths and graph maps expire after success or failure; no global cache is retained.
 */
export function tessellateAutoMovieContourStrip64(
  rawA: AutoMovieCurveMath64.V[],
  rawB: AutoMovieCurveMath64.V[],
  emit: (
    a: AutoMovieCurveMath64.V,
    b: AutoMovieCurveMath64.V,
    c: AutoMovieCurveMath64.V,
  ) => void,
  identity?: (point: AutoMovieCurveMath64.V) => string | undefined,
  observe?: (observation: Observation) => void,
  observeWork: boolean = false,
): void {
  const started: number | null = observeWork ? performance.now() : null;
  let dpCalls: number = 0,
    expandedConflicts: number = 0,
    peakQueue: number = 0;
  const diagnostics: Set<string> = new Set();
  for (const ring of [rawA, rawB])
    if (
      !AutoMovieContourLoftCurves64.hasArea(ring) ||
      ring.some(
        (p: AutoMovieCurveMath64.V): boolean => !p.every(Number.isFinite),
      )
    )
      throw new Error(
        "A contour strip needs two finite area-spanning boundaries",
      );
  const a: AutoMovieCurveMath64.V[] =
    AutoMovieContourLoftCurves64.exterior(rawA);
  let offset: number = 0;
  let best: number = Infinity;
  rawB.forEach((p: AutoMovieCurveMath64.V, i: number): void => {
    const d: number = Math.hypot(
      p[0] - a[0][0],
      p[1] - a[0][1],
      p[2] - a[0][2],
    );
    if (d < best) {
      best = d;
      offset = i;
    }
  });
  const b: AutoMovieCurveMath64.V[] = [
    ...rawB.slice(offset),
    ...rawB.slice(0, offset),
  ];
  const n: number = a.length;
  const m: number = b.length;
  const stride: number = m + 1;
  const area = (
    p: AutoMovieCurveMath64.V,
    q: AutoMovieCurveMath64.V,
    r: AutoMovieCurveMath64.V,
  ): number => {
    const u: AutoMovieCurveMath64.V = AutoMovieCurveMath64.sub(q, p);
    const v: AutoMovieCurveMath64.V = AutoMovieCurveMath64.sub(r, p);
    const value: number =
      Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ) / 2;
    return value;
  };
  const areas: Float64Array = new Float64Array((n + 1) * stride * 2).fill(
    Infinity,
  );
  for (let i: number = 0; i <= n; i++)
    for (let j: number = 0; j <= m; j++) {
      if (i < n) {
        const value: number = area(a[i], a[(i + 1) % n], b[j % m]);
        if (value >= 0 && Number.isFinite(value))
          areas[(i * stride + j) * 2] = value;
      }
      if (j < m) {
        const value: number = area(a[i % n], b[(j + 1) % m], b[j]);
        if (value >= 0 && Number.isFinite(value))
          areas[(i * stride + j) * 2 + 1] = value;
      }
    }
  interface Path {
    tiles: [
      AutoMovieCurveMath64.V,
      AutoMovieCurveMath64.V,
      AutoMovieCurveMath64.V,
    ][];
    steps: number[];
    forbidden: Set<number>;
    score: number;
    serial: number;
  }
  let serial: number = 0;
  const solve = (forbidden: Set<number>): Path | undefined => {
    dpCalls++;
    const cost: Float64Array = new Float64Array((n + 1) * stride * 4).fill(
      Infinity,
    );
    const way: Uint8Array = new Uint8Array(cost.length);
    cost[0] = 0;
    for (let i: number = 0; i <= n; i++)
      for (let j: number = 0; j <= m; j++) {
        for (let flags: number = 0; flags < 4; flags++) {
          const current: number = cost[(i * stride + j) * 4 + flags];
          if (!Number.isFinite(current)) continue;
          for (const direction of [1, 2] as const) {
            if (direction === 1 ? i === n : j === m) continue;
            const step: number = (i * stride + j) * 2 + direction - 1;
            if (forbidden.has(step)) continue;
            const next: number =
              flags |
              (direction === 1
                ? j > 0 && j < m
                  ? 1
                  : 0
                : i > 0 && i < n
                  ? 2
                  : 0);
            const cell: number =
              ((i + (direction === 1 ? 1 : 0)) * stride +
                j +
                (direction === 2 ? 1 : 0)) *
                4 +
              next;
            const candidate: number = current + areas[step];
            if (
              candidate < cost[cell] ||
              (candidate === cost[cell] &&
                direction === 1 &&
                way[cell] % 2 === 0)
            ) {
              cost[cell] = candidate;
              way[cell] = flags * 2 + direction;
            }
          }
        }
      }
    let i: number = n;
    let j: number = m;
    let flags: number = 3;
    const score: number = cost[(n * stride + m) * 4 + flags];
    if (!Number.isFinite(score)) return undefined;
    const tiles: [
      AutoMovieCurveMath64.V,
      AutoMovieCurveMath64.V,
      AutoMovieCurveMath64.V,
    ][] = [];
    const steps: number[] = [];
    while (i || j) {
      const predecessor: number = way[(i * stride + j) * 4 + flags];
      if (!predecessor)
        throw new Error("Periodic contour predecessor is unresolved");
      flags = Math.floor((predecessor - 1) / 2);
      if (predecessor % 2 === 1) {
        steps.push(((i - 1) * stride + j) * 2);
        tiles.push([a[(i - 1) % n], a[i % n], b[j % m]]);
        i--;
      } else {
        steps.push((i * stride + j - 1) * 2 + 1);
        tiles.push([a[i % n], b[j % m], b[(j - 1) % m]]);
        j--;
      }
    }
    return { tiles, steps, forbidden, score, serial: serial++ };
  };
  const nodes: Map<string | AutoMovieCurveMath64.V, number> = new Map();
  const representatives: Map<number, AutoMovieCurveMath64.V> = new Map();
  const node = (p: AutoMovieCurveMath64.V): number => {
    const key: string | AutoMovieCurveMath64.V | undefined =
      identity === undefined ? p : identity(p);
    if (key === undefined)
      throw new Error("A contour tile lacks its declared sheet identity");
    if (!nodes.has(key)) nodes.set(key, nodes.size);
    const id: number = nodes.get(key)!;
    const previous: AutoMovieCurveMath64.V | undefined =
      representatives.get(id);
    if (
      previous !== undefined &&
      previous.some((x: number, k: number): boolean => x !== p[k])
    )
      throw new Error(
        "One contour sheet identity has conflicting physical points",
      );
    representatives.set(id, p);
    return id;
  };
  const edgeKey = (p: number, q: number): string =>
    p < q ? `${p},${q}` : `${q},${p}`;
  const boundaries: Map<string, { uses: number; orientation: number }> =
    new Map();
  const boundaryProblems: string[] = [];
  for (const [ring, orientation] of [
    [a, 1],
    [b, -1],
  ] as [AutoMovieCurveMath64.V[], number][])
    ring.forEach((p: AutoMovieCurveMath64.V, k: number): void => {
      const next: AutoMovieCurveMath64.V = ring[(k + 1) % ring.length];
      const u: number = node(p),
        v: number = node(next);
      if (p.every((x: number, axis: number): boolean => x === next[axis]))
        boundaryProblems.push(
          "The supplied contour walk has a zero-length physical edge; distinct sheet identities remain separate",
        );
      if (u === v) return;
      const key: string = edgeKey(u, v);
      if (!boundaries.has(key))
        boundaries.set(key, { uses: 0, orientation: 0 });
      const edge: { uses: number; orientation: number } = boundaries.get(key)!;
      edge.uses++;
      edge.orientation += orientation * (u < v ? 1 : -1);
    });
  const boundaryVertices: Set<number> = new Set();
  for (const [key, boundary] of boundaries) {
    if (
      boundary.uses !== 1 &&
      !(boundary.uses === 2 && boundary.orientation === 0)
    )
      boundaryProblems.push(
        "The supplied contour walk has unqualified boundary incidence",
      );
    if (boundary.uses === 1)
      for (const id of key.split(",").map(Number)) boundaryVertices.add(id);
  }
  let conflict: number[] = [];
  const admit = (path: Path): void => {
    const tiles: Path["tiles"] = path.tiles;
    const fail = (rows: number[], reason: string): never => {
      conflict = [
        ...new Set(rows.map((row: number): number => path.steps[row])),
      ].sort((a: number, b: number): number => a - b);
      throw new Error(reason);
    };
    const faces: Map<string, number> = new Map();
    const edges: Map<
      string,
      { uses: number; orientation: number; rows: number[] }
    > = new Map();
    const links: Map<number, Map<number, Set<number>>> = new Map();
    for (let ti: number = 0; ti < tiles.length; ti++) {
      const tile: Path["tiles"][number] = tiles[ti];
      const ids: number[] = tile.map(node);
      const face: string = [...ids]
        .sort((p: number, q: number): number => p - q)
        .join(",");
      const measure: number = area(...tile);
      if (new Set(ids).size !== 3 || !(measure > 0 && Number.isFinite(measure)))
        fail([ti], "A contour tiling has a repeated or unresolved-area face");
      const previous: number | undefined = faces.get(face);
      if (previous !== undefined)
        fail([previous, ti], "A contour tiling repeats a sheet face");
      faces.set(face, ti);
      for (let k: number = 0; k < 3; k++) {
        const p: number = ids[k],
          q: number = ids[(k + 1) % 3],
          r: number = ids[(k + 2) % 3];
        const key: string = edgeKey(p, q);
        if (!edges.has(key))
          edges.set(key, { uses: 0, orientation: 0, rows: [] });
        const edge: { uses: number; orientation: number; rows: number[] } =
          edges.get(key)!;
        edge.uses++;
        edge.orientation += p < q ? 1 : -1;
        edge.rows.push(ti);
        if (!links.has(p)) links.set(p, new Map());
        const link: Map<number, Set<number>> = links.get(p)!;
        if (!link.has(q)) link.set(q, new Set());
        if (!link.has(r)) link.set(r, new Set());
        link.get(q)!.add(r);
        link.get(r)!.add(q);
      }
    }
    for (const [key, edge] of edges) {
      const boundary: { uses: number; orientation: number } | undefined =
        boundaries.get(key);
      const exterior: boolean = boundary?.uses === 1;
      const expected: number = exterior ? 1 : 2;
      if (edge.uses > expected)
        fail(
          edge.rows.slice(0, expected + 1),
          "A contour tiling repeats a sheet edge",
        );
      if (
        edge.uses !== expected ||
        edge.orientation !== (exterior ? boundary!.orientation : 0)
      )
        fail(
          edge.uses === expected
            ? edge.rows
            : tiles.map((_: unknown, i: number): number => i),
          "A contour tiling leaves an unpaired oriented sheet edge",
        );
    }
    for (const key of boundaries.keys())
      if (!edges.has(key))
        fail(
          tiles.map((_: unknown, i: number): number => i),
          "A contour walk has unsupported boundary incidence",
        );
    for (const [vertex, link] of links) {
      const first: number = link.keys().next().value!;
      const seen: Set<number> = new Set([first]),
        queue: number[] = [first];
      for (let k: number = 0; k < queue.length; k++)
        for (const next of link.get(queue[k])!)
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
      const ends: number = [...link.values()].filter(
        (neighbors: Set<number>): boolean => neighbors.size === 1,
      ).length;
      if (
        seen.size !== link.size ||
        [...link.values()].some(
          (neighbors: Set<number>): boolean =>
            neighbors.size < 1 || neighbors.size > 2,
        ) ||
        ends !== (boundaryVertices.has(vertex) ? 2 : 0)
      )
        fail(
          tiles.map((_: unknown, i: number): number => i),
          "A contour tiling pinches its sheet vertex link",
        );
    }
  };
  const heap: Path[] = [];
  const before = (a: Path, b: Path): boolean =>
    a.score < b.score || (a.score === b.score && a.serial < b.serial);
  const push = (path: Path): void => {
    heap.push(path);
    let at: number = heap.length - 1;
    peakQueue = Math.max(peakQueue, heap.length);
    while (at > 0) {
      const parent: number = Math.floor((at - 1) / 2);
      if (!before(heap[at], heap[parent])) break;
      [heap[at], heap[parent]] = [heap[parent], heap[at]];
      at = parent;
    }
  };
  const pop = (): Path => {
    const first: Path = heap[0],
      last: Path = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let at: number = 0;
      while (at * 2 + 1 < heap.length) {
        let child: number = at * 2 + 1;
        if (child + 1 < heap.length && before(heap[child + 1], heap[child]))
          child++;
        if (!before(heap[child], heap[at])) break;
        [heap[at], heap[child]] = [heap[child], heap[at]];
        at = child;
      }
    }
    return first;
  };
  const initial: Path | undefined = solve(new Set());
  if (initial === undefined)
    throw new Error("No finite-area periodic contour path exists");
  const publish = (path: Path, qualified: boolean): void => {
    const finite: Path["tiles"] = path.tiles.filter(
      (_: Path["tiles"][number], i: number): boolean =>
        areas[path.steps[i]] > 0,
    );
    if (finite.length === 0)
      throw new Error("No finite positive-area contour primitive exists");
    const omitted: number = path.tiles.length - finite.length;
    if (omitted)
      diagnostics.add(
        `Zero-area contour primitive count omitted: ${omitted}; retained finite tile count: ${finite.length}`,
      );
    for (const tile of finite) emit(...tile);
    observe?.({
      n,
      m,
      dpCalls,
      expandedConflicts,
      peakQueue,
      elapsedMs: started === null ? null : performance.now() - started,
      qualified: qualified && omitted === 0,
      diagnostics: [...diagnostics],
    });
  };
  if (boundaryProblems.length) {
    for (const reason of boundaryProblems) diagnostics.add(reason);
    diagnostics.add(
      "Finite candidate retained without a manifold boundary claim",
    );
    publish(initial, false);
    return;
  }
  push(initial);
  const visited: Set<string> = new Set([""]);
  while (heap.length) {
    const path: Path = pop();
    conflict = [];
    let failure: Error | undefined;
    try {
      admit(path);
    } catch (error: unknown) {
      failure =
        error instanceof Error
          ? error
          : new Error(String(error), { cause: error });
    }
    if (failure === undefined) {
      publish(path, true);
      return;
    }
    expandedConflicts++;
    diagnostics.add(`Rejected search candidate: ${failure.message}`);
    if (!conflict.length) throw failure;
    for (const step of conflict) {
      const forbidden: Set<number> = new Set([...path.forbidden, step]);
      const key: string = [...forbidden]
        .sort((a: number, b: number): number => a - b)
        .join(",");
      if (visited.has(key)) continue;
      visited.add(key);
      const next: Path | undefined = solve(forbidden);
      if (next !== undefined) push(next);
    }
  }
  diagnostics.add(
    "No qualified periodic path exists; the finite candidate remains displayable and unqualified",
  );
  publish(initial, false);
}
