import type { IRecoveryChartLeafControls } from "./IRecoveryChartLeafControls";

/**
 * Couple a complete axis-aligned unit-square leaf partition with C0 bicubics.
 * axis 0 edges increase in u; axis 1 edges increase in v. Patch sides are
 * bottom, right, top, left and all side parameters increase. Equal UV scalar
 * endpoint identities share one control; this is parameter identity, not a
 * physical coordinate weld. Each maximal containing interval owns one cubic.
 * Nested fine intervals use de Casteljau restriction expressions in that cubic.
 * Disjoint intervals, including those meeting only at endpoints, keep their
 * own cubic handles. Every patch retains four independent interior controls.
 *
 * Atomic intervals verify one exterior incident and two opposed interior uses.
 * Missing exterior coverage, nonnested overlaps, inconsistent corner equations,
 * cycles, nonfinite arithmetic and control-budget exhaustion throw atomically.
 * boundary contains only master exterior controls, with their nominal affine UV
 * coefficient locations; physical fitted coefficients belong to the caller.
 * Binary64 restriction is algebraically exact before rounding. Canonical point
 * expressions own shared cut endpoints rather than separate restriction paths.
 * This helper supplies coefficient coupling, not source coverage, G1 or a
 * conforming generated mesh: the old four-ID-only engine cannot join unequal
 * intervals without canonical interval sample ownership.
 *
 * @evidence contracts/common.md#principled-implementation Sorted line intervals establish laminar master ownership and a signed atomic boundary incidence. Cubic de Casteljau matrices produce fine coefficient equations, canonical endpoint rows establish hanging corners, and a final dependency traversal rejects cycles.
 * @evidence contracts/common.md#clear-and-simple-design One pure assembly operation owns parameter control identities, linear C0 equations and edge bindings; physical fitting, solver slots and public engine realization remain consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, physical position weld, epsilon comparison, averaged corner equation, normal substitution or anatomy-specific patch supplies coefficients or repairs invalid partitions.
 * @evidence contracts/common.md#meaningful-documentation States side and axis conventions, master ownership, UV identities, row order, fixed-boundary responsibility, binary64 restrictions, explicit refusal and unresolved engine conformity.
 * @evidence contracts/performance.md#efficient-algorithms For L leaves and E unique side intervals, sorting costs O(E log E); line sweeps and constant-degree coefficient assembly cost O(E+L), followed by linear dependency traversal. Output controls are capped by maxControls; retained maps and records use O(E+L+controls) storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal intervals reuse their four control IDs, each maximal edge owns one cubic, and each canonical endpoint restriction row is reused by all fine intervals of that edge. Input leaves are never modified.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local line, identity, restriction and relation registries expire on return or refusal. maxControls bounds actual allocated IDs; returned arrays transfer to the caller and retain no source observations or handles.
 */
export function RecoveryChartLeafControls(
  input: IRecoveryChartLeafControls.Input,
): IRecoveryChartLeafControls.Result {
  if (
    !input ||
    !Array.isArray(input.leaves) ||
    !input.leaves.length ||
    !Number.isSafeInteger(input.maxControls) ||
    input.maxControls < 1
  )
    throw new Error(
      "A nonempty leaf partition and a positive safe control budget are required",
    );
  const names: Set<string> = new Set();
  const lines: Map<
    string,
    {
      axis: 0 | 1;
      line: number;
      intervals: Map<
        string,
        {
          start: number;
          end: number;
          uses: { patch: number; side: 0 | 1 | 2 | 3 }[];
          master?: string;
        }
      >;
    }
  > = new Map();
  const sideKeys: string[][] = [];
  for (let p: number = 0; p < input.leaves.length; p++) {
    const leaf: (typeof input.leaves)[number] = input.leaves[p]!;
    if (
      !leaf ||
      typeof leaf.id !== "string" ||
      !leaf.id.trim() ||
      names.has(leaf.id) ||
      !Array.isArray(leaf.bounds) ||
      leaf.bounds.length !== 4 ||
      ![0, 1, 2, 3].every(
        (k: number): boolean =>
          Number.isFinite(leaf.bounds[k]) &&
          leaf.bounds[k]! >= 0 &&
          leaf.bounds[k]! <= 1,
      ) ||
      !(leaf.bounds[0] < leaf.bounds[1] && leaf.bounds[2] < leaf.bounds[3])
    )
      throw new Error(
        "Leaf names must be unique and every normalized rectangle must have positive widths",
      );
    names.add(leaf.id);
    sideKeys.push([]);
    for (const side of [0, 1, 2, 3] as const) {
      const axis: 0 | 1 = side % 2 === 0 ? 0 : 1;
      const line: number =
        leaf.bounds[side === 0 ? 2 : side === 1 ? 1 : side === 2 ? 3 : 0]!;
      const start: number = leaf.bounds[2 * axis]!,
        end: number = leaf.bounds[2 * axis + 1]!;
      const lineKey: string = `${axis}:${line}`,
        intervalKey: string = `${start}:${end}`;
      if (!lines.has(lineKey))
        lines.set(lineKey, { axis, line, intervals: new Map() });
      const group: NonNullable<ReturnType<typeof lines.get>> =
        lines.get(lineKey)!;
      if (!group.intervals.has(intervalKey))
        group.intervals.set(intervalKey, { start, end, uses: [] });
      group.intervals.get(intervalKey)!.uses.push({ patch: p, side });
      sideKeys[p]![side] = `${lineKey}:${intervalKey}`;
    }
  }
  for (const axis of [0, 1])
    for (const line of [0, 1])
      if (!lines.has(`${axis}:${line}`))
        throw new Error(
          "The leaf partition omits an entire unit-square boundary",
        );
  const masters: {
    key: string;
    axis: 0 | 1;
    line: number;
    start: number;
    end: number;
  }[] = [];
  for (const [lineKey, group] of lines) {
    const intervals: [
      string,
      typeof group.intervals extends Map<string, infer T> ? T : never,
    ][] = [...group.intervals.entries()];
    intervals.sort(
      (a: (typeof intervals)[number], b: (typeof intervals)[number]): number =>
        a[1].start - b[1].start || b[1].end - a[1].end,
    );
    const stack: (typeof intervals)[number][] = [];
    const events: Map<number, [number, number]> = new Map();
    for (const entry of intervals) {
      const [key, interval]: typeof entry = entry;
      while (stack.length && stack.at(-1)![1].end <= interval.start)
        stack.pop();
      if (stack.length && interval.end > stack.at(-1)![1].end)
        throw new Error(
          "Collinear leaf edges overlap without a nested master interval",
        );
      if (!stack.length)
        masters.push({
          key: `${lineKey}:${key}`,
          axis: group.axis,
          line: group.line,
          start: interval.start,
          end: interval.end,
        });
      interval.master = `${lineKey}:${stack.length ? stack[0]![0] : key}`;
      stack.push(entry);
      for (const use of interval.uses)
        for (const [point, delta] of [
          [interval.start, 1],
          [interval.end, -1],
        ]) {
          const event: [number, number] = events.get(point!) ?? [0, 0];
          event[use.side < 2 ? 0 : 1] += delta!;
          events.set(point!, event);
        }
    }
    const points: number[] = [...events.keys()].sort(
      (a: number, b: number): number => a - b,
    );
    const exterior: boolean = group.line === 0 || group.line === 1;
    if (exterior && (points[0] !== 0 || points.at(-1) !== 1))
      throw new Error("The leaf partition leaves an exterior boundary gap");
    let positive: number = 0,
      negative: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const event: [number, number] = events.get(points[i]!)!;
      positive += event[0];
      negative += event[1];
      if (i + 1 === points.length) break;
      if (
        exterior
          ? positive + negative !== 1
          : positive + negative !== 0 && (positive !== 1 || negative !== 1)
      )
        throw new Error(
          "Atomic leaf edge coverage has a gap, overlap or unopposed interior incident",
        );
      if (
        exterior &&
        (group.axis === 0
          ? group.line === 0
            ? negative !== 0
            : positive !== 0
          : group.line === 0
            ? positive !== 0
            : negative !== 0)
      )
        throw new Error(
          "An exterior leaf edge has an invalid incident direction",
        );
    }
    if (positive !== 0 || negative !== 0)
      throw new Error("Atomic leaf edge events do not close");
  }
  let controls: number = 0;
  const ids: Map<string, number> = new Map();
  const allocate: (key: string) => number = (key: string): number => {
    const old: number | undefined = ids.get(key);
    if (old !== undefined) return old;
    if (controls >= input.maxControls)
      throw new Error("Leaf coefficient assembly exceeds maxControls");
    ids.set(key, controls);
    return controls++;
  };
  const corner: (u: number, v: number) => number = (
    u: number,
    v: number,
  ): number => allocate(`corner:${u}:${v}`);
  for (const leaf of input.leaves)
    for (const u of [leaf.bounds[0], leaf.bounds[1]])
      for (const v of [leaf.bounds[2], leaf.bounds[3]]) corner(u, v);
  const edges: ReturnType<typeof RecoveryChartLeafControls>["edges"] = [];
  const masterEdges: Map<string, (typeof edges)[number]> = new Map();
  const relationMap: Map<number, { id: number; weight: number }[]> = new Map();
  const register: (
    id: number,
    row: readonly number[],
    source: readonly number[],
  ) => void = (
    id: number,
    row: readonly number[],
    source: readonly number[],
  ): void => {
    const combined: Map<number, number> = new Map();
    for (let k: number = 0; k < 4; k++) {
      const value: number = (combined.get(source[k]!) ?? 0) + row[k]!;
      if (!Number.isFinite(value))
        throw new Error("A restricted edge coefficient became nonfinite");
      if (value === 0) combined.delete(source[k]!);
      else combined.set(source[k]!, value);
    }
    const terms: { id: number; weight: number }[] = [...combined]
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0])
      .map(
        ([control, weight]: [number, number]): {
          id: number;
          weight: number;
        } => ({ id: control, weight }),
      );
    if (terms.length === 1 && terms[0]!.id === id && terms[0]!.weight === 1)
      return;
    const previous: { id: number; weight: number }[] | undefined =
      relationMap.get(id);
    if (
      previous &&
      (previous.length !== terms.length ||
        previous.some(
          (term: { id: number; weight: number }, k: number): boolean =>
            term.id !== terms[k]!.id || term.weight !== terms[k]!.weight,
        ))
    )
      throw new Error(
        "One UV corner or edge control has conflicting affine relations",
      );
    if (!previous) relationMap.set(id, terms);
  };
  const split: (matrix: number[][], t: number) => [number[][], number[][]] = (
    matrix: number[][],
    t: number,
  ): [number[][], number[][]] => {
    const triangle: number[][][] = [
      matrix.map((row: number[]): number[] => [...row]),
    ];
    for (let level: number = 1; level < 4; level++) {
      const previous: number[][] = triangle.at(-1)!,
        next: number[][] = [];
      for (let i: number = 0; i + 1 < previous.length; i++)
        next.push(
          [0, 1, 2, 3].map(
            (k: number): number =>
              (1 - t) * previous[i]![k]! + t * previous[i + 1]![k]!,
          ),
        );
      triangle.push(next);
    }
    return [
      triangle.map((row: number[][]): number[] => row[0]!),
      triangle.map((row: number[][]): number[] => row.at(-1)!).reverse(),
    ];
  };
  const identity: number[][] = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  const pointRows: Map<string, number[]> = new Map();
  const boundaryMap: Map<number, { control: number; u: number; v: number }> =
    new Map();
  for (const master of masters) {
    const a: number =
      master.axis === 0
        ? corner(master.start, master.line)
        : corner(master.line, master.start);
    const b: number =
      master.axis === 0
        ? corner(master.end, master.line)
        : corner(master.line, master.end);
    const edge: (typeof edges)[number] = {
      id: `edge.${edges.length}`,
      axis: master.axis,
      line: master.line,
      start: master.start,
      end: master.end,
      controlIds: [
        a,
        allocate(`handle:${master.key}:1`),
        allocate(`handle:${master.key}:2`),
        b,
      ],
    };
    edges.push(edge);
    masterEdges.set(master.key, edge);
    if (master.line === 0 || master.line === 1)
      for (let k: number = 0; k < 4; k++) {
        const varying: number =
          k === 0
            ? master.start
            : k === 3
              ? master.end
              : master.start + (master.end - master.start) * (k / 3);
        const value: { control: number; u: number; v: number } = {
          control: edge.controlIds[k]!,
          u: master.axis === 0 ? varying : master.line,
          v: master.axis === 0 ? master.line : varying,
        };
        const previous: typeof value | undefined = boundaryMap.get(
          value.control,
        );
        if (previous && (previous.u !== value.u || previous.v !== value.v))
          throw new Error(
            "One outer master control has conflicting UV locations",
          );
        boundaryMap.set(value.control, value);
      }
  }
  const intervalControls: Map<string, [number, number, number, number]> =
    new Map();
  const intervalBindings: Map<
    string,
    { edge: string; start: number; end: number }
  > = new Map();
  for (const [lineKey, group] of lines)
    for (const [key, interval] of group.intervals) {
      const fullKey: string = `${lineKey}:${key}`,
        edge: (typeof edges)[number] = masterEdges.get(interval.master!)!;
      const normalized: number[] = [interval.start, interval.end].map(
        (q: number): number =>
          q === edge.start
            ? 0
            : q === edge.end
              ? 1
              : (q - edge.start) / (edge.end - edge.start),
      );
      if (
        !(
          normalized[0]! >= 0 &&
          normalized[1]! <= 1 &&
          normalized[0]! < normalized[1]!
        ) ||
        (interval.start !== edge.start && normalized[0] === 0) ||
        (interval.end !== edge.end && normalized[1] === 1)
      )
        throw new Error(
          "A nested edge interval has no representable canonical phase mapping",
        );
      intervalBindings.set(fullKey, {
        edge: edge.id,
        start: normalized[0]!,
        end: normalized[1]!,
      });
      if (fullKey === interval.master) {
        intervalControls.set(fullKey, edge.controlIds);
        continue;
      }
      const a: number =
        group.axis === 0
          ? corner(interval.start, group.line)
          : corner(group.line, interval.start);
      const b: number =
        group.axis === 0
          ? corner(interval.end, group.line)
          : corner(group.line, interval.end);
      const target: [number, number, number, number] = [
        a,
        allocate(`fine:${fullKey}:1`),
        allocate(`fine:${fullKey}:2`),
        b,
      ];
      const prefix: number[][] =
        normalized[1] === 1 ? identity : split(identity, normalized[1]!)[0];
      const matrix: number[][] =
        normalized[0] === 0
          ? prefix
          : split(prefix, normalized[0]! / normalized[1]!)[1];
      // Pin both endpoint rows to their one canonical point evaluation path.
      for (const [slot, point, phase] of [
        [0, interval.start, normalized[0]!],
        [3, interval.end, normalized[1]!],
      ]) {
        const pointKey: string = `${edge.id}:${point}`;
        if (!pointRows.has(pointKey))
          pointRows.set(pointKey, split(identity, phase!)[0][3]!);
        matrix[slot!] = pointRows.get(pointKey)!;
      }
      for (let k: number = 0; k < 4; k++)
        register(target[k]!, matrix[k]!, edge.controlIds);
      intervalControls.set(fullKey, target);
    }
  const patches: ReturnType<typeof RecoveryChartLeafControls>["patches"] = [],
    bindings: ReturnType<typeof RecoveryChartLeafControls>["bindings"] = [];
  const sideSlots: readonly (readonly number[])[] = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ];
  for (let p: number = 0; p < input.leaves.length; p++) {
    const leaf: (typeof input.leaves)[number] = input.leaves[p]!,
      controlIds: number[] = new Array(16).fill(-1);
    for (const side of [0, 1, 2, 3] as const) {
      const key: string = sideKeys[p]![side]!,
        source: [number, number, number, number] = intervalControls.get(key)!;
      for (let k: number = 0; k < 4; k++) {
        const slot: number = sideSlots[side]![k]!;
        if (controlIds[slot] !== -1 && controlIds[slot] !== source[k])
          throw new Error(
            "Patch corner identity conflicts between its incident sides",
          );
        controlIds[slot] = source[k]!;
      }
      bindings.push({ patch: leaf.id, side, ...intervalBindings.get(key)! });
    }
    for (const slot of [5, 6, 9, 10])
      controlIds[slot] = allocate(`interior:${leaf.id}:${slot}`);
    patches.push({ id: leaf.id, controlIds });
  }
  const state: Uint8Array = new Uint8Array(controls);
  for (const id of relationMap.keys())
    if (state[id] !== 2) {
      const stack: { id: number; next: number }[] = [{ id, next: 0 }];
      state[id] = 1;
      while (stack.length) {
        const frame: { id: number; next: number } = stack.at(-1)!,
          terms: { id: number; weight: number }[] = relationMap.get(frame.id)!;
        if (frame.next === terms.length) {
          state[frame.id] = 2;
          stack.pop();
          continue;
        }
        const target: number = terms[frame.next++]!.id;
        if (!relationMap.has(target)) continue;
        if (state[target] === 1)
          throw new Error(
            "Leaf coefficient relations contain a dependency cycle",
          );
        if (state[target] === 0) {
          state[target] = 1;
          stack.push({ id: target, next: 0 });
        }
      }
    }
  for (const control of boundaryMap.keys())
    if (relationMap.has(control))
      throw new Error(
        "An outer master control is dependent and cannot be fixed independently",
      );
  return {
    controls,
    patches,
    relations: [...relationMap].map(
      ([id, terms]: [number, { id: number; weight: number }[]]): {
        id: number;
        terms: { id: number; weight: number }[];
      } => ({ id, terms }),
    ),
    edges,
    bindings,
    boundary: [...boundaryMap.values()],
  };
}
