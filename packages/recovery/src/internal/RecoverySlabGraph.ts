import type {
  IAutoMovieRecoverySlabConnectivityGroup,
  IAutoMovieRecoverySlabGraph,
} from "@automovie/interface";

/**
 * Source observation graph for explicit continuation between adjacent plane
 * cuts.
 */
export namespace RecoverySlabGraph {
  /**
   * Derive closed-loop continuation and isolate source defects by clipped-slab
   * connectivity. Triangle and edge addresses are transient observation
   * evidence and never leave the result.
   */
  export function observe(
    input: Parameters<IAutoMovieRecoverySlabGraph.Observe>[0],
  ): ReturnType<IAutoMovieRecoverySlabGraph.Observe> {
    return prepare(input)(input);
  }

  /**
   * Admit immutable source incidence and scalar heights once for multiple
   * slabs. Queries supply complete original face IDs in strictly increasing
   * order, including every face with maximum height above beforeMm and minimum
   * height below afterMm. Omitting candidates observes every source face.
   * Boundary supports retain original IDs. Optional private probes query those
   * same components with a separate ordinal namespace; a probe never supplies a
   * missing physical boundary or makes a hidden component supported.
   */
  export function prepare(
    source: Parameters<IAutoMovieRecoverySlabGraph.Prepare>[0],
  ): ReturnType<IAutoMovieRecoverySlabGraph.Prepare> {
    const count: number = source.triangles.length;
    if (source.canon.length !== source.heights.length)
      throw new Error("A finite aligned scalar chart is required");
    for (const triangle of source.triangles)
      if (
        triangle.length !== 3 ||
        triangle.some(
          (i: number): boolean =>
            i < 0 ||
            i >= source.heights.length ||
            source.canon[i]! < 0 ||
            source.canon[i]! >= source.heights.length,
        )
      )
        throw new Error(
          "Slab triangle addresses do not align with the scalar chart",
        );
    return (
      input: Omit<
        Parameters<IAutoMovieRecoverySlabGraph.Observe>[0],
        "triangles" | "canon" | "heights"
      >,
    ): IAutoMovieRecoverySlabConnectivityGroup[] => {
      if (!(input.beforeMm < input.afterMm))
        throw new Error("Finite increasing slab bounds are required");
      const capacity: number = input.candidates?.length ?? count;
      const parent: Int32Array = new Int32Array(capacity).fill(-1);
      const rank: Uint8Array = new Uint8Array(capacity);
      const slots: Map<number, number> = new Map();
      const root: (i: number) => number = (i: number): number => {
        let result: number = i;
        while (parent[result] !== result) result = parent[result]!;
        while (parent[i] !== i) {
          const next: number = parent[i]!;
          parent[i] = result;
          i = next;
        }
        return result;
      };
      const join: (a: number, b: number) => void = (
        a: number,
        b: number,
      ): void => {
        let u: number = root(a),
          v: number = root(b);
        if (u === v) return;
        if (rank[u]! < rank[v]!) [u, v] = [v, u];
        parent[v] = u;
        if (rank[u] === rank[v]) rank[u] = rank[u]! + 1;
      };
      const edgeOwner: Map<string, { triangle: number; count: number }> =
        new Map();
      const vertexOwner: Map<number, number> = new Map();
      const invalid: Set<number> = new Set();
      let previous: number = -1;
      for (let ti: number = 0; ti < capacity; ti++) {
        const face: number =
          input.candidates === undefined ? ti : input.candidates[ti]!;
        if (face <= previous || face >= count)
          throw new Error(
            "Slab candidates must be increasing original face addresses",
          );
        previous = face;
        slots.set(face, ti);
        const triangle: [number, number, number] = source.triangles[face]!;
        const h: number[] = triangle.map(
          (i: number): number => source.heights[i]!,
        );
        if (
          !(Math.max(...h) > input.beforeMm && Math.min(...h) < input.afterMm)
        )
          continue;
        parent[ti] = ti;
        if (
          new Set(triangle.map((i: number): number => source.canon[i]!))
            .size !== 3
        )
          invalid.add(ti);
        for (let k: number = 0; k < 3; k++) {
          const vertex: number = source.canon[triangle[k]!]!;
          if (h[k]! > input.beforeMm && h[k]! < input.afterMm) {
            const priorVertex: number | undefined = vertexOwner.get(vertex);
            if (priorVertex === undefined) vertexOwner.set(vertex, ti);
            else join(ti, priorVertex);
          }
          if (
            !(
              Math.max(h[k]!, h[(k + 1) % 3]!) > input.beforeMm &&
              Math.min(h[k]!, h[(k + 1) % 3]!) < input.afterMm
            )
          )
            continue;
          const a: number = source.canon[triangle[k]!]!,
            b: number = source.canon[triangle[(k + 1) % 3]!]!;
          const key: string = a < b ? `${a},${b}` : `${b},${a}`;
          const prior: { triangle: number; count: number } | undefined =
            edgeOwner.get(key);
          if (prior === undefined)
            edgeOwner.set(key, { triangle: ti, count: 1 });
          else {
            join(ti, prior.triangle);
            prior.count++;
            if (prior.count > 2) invalid.add(ti);
          }
        }
      }
      const groups: Map<number, IAutoMovieRecoverySlabConnectivityGroup> =
        new Map();
      const roots: (support: ReadonlySet<number>) => Set<number> = (
        support: ReadonlySet<number>,
      ): Set<number> => {
        const result: Set<number> = new Set();
        for (const triangle of support) {
          if (triangle < 0 || triangle >= count)
            throw new Error(
              "Slab boundary support contains an invalid source face",
            );
          const slot: number | undefined = slots.get(triangle);
          if (slot !== undefined && parent[slot] !== -1) result.add(root(slot));
        }
        return result;
      };
      const ensure: (id: number) => IAutoMovieRecoverySlabConnectivityGroup = (
        id: number,
      ): IAutoMovieRecoverySlabConnectivityGroup => {
        if (!groups.has(id))
          groups.set(id, {
            before: [],
            after: [],
            supported: true,
            reason: null,
          });
        return groups.get(id)!;
      };
      let orphan: number = -1;
      for (const side of ["before", "after"] as const) {
        for (let i: number = 0; i < input[side].length; i++) {
          const found: Set<number> = roots(input[side][i]!);
          if (found.size === 1) ensure([...found][0]!)[side].push(i);
          else {
            const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(
              orphan--,
            );
            group[side].push(i);
            group.supported = false;
            group.reason =
              "Boundary support has no unique clipped-slab component";
            for (const id of found) {
              const affected: IAutoMovieRecoverySlabConnectivityGroup =
                ensure(id);
              affected.supported = false;
              affected.reason =
                "A boundary touches multiple clipped-slab components";
            }
          }
        }
      }
      for (let i: number = 0; i < (input.probes?.length ?? 0); i++) {
        const found: Set<number> = roots(input.probes![i]!);
        if (found.size === 1) {
          const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(
            [...found][0]!,
          );
          (group.probes ??= []).push(i);
        } else {
          const affected: number[] = found.size ? [...found] : [orphan--];
          for (const id of affected) {
            const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(id);
            (group.probes ??= []).push(i);
            group.supported = false;
            group.reason =
              "Observation probe has no unique clipped-slab component";
          }
        }
      }
      for (const support of input.defects)
        for (const id of roots(support)) {
          const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(id);
          group.supported = false;
          group.reason =
            "Open, isolated or unrepresented source contour in this slab component";
        }
      for (const triangle of invalid) {
        const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(
          root(triangle),
        );
        group.supported = false;
        group.reason =
          "Degenerate or nonmanifold source incidence in this slab component";
      }
      // A component born and lost inside this slab has no saved boundary loops.
      // Retain its omission instead of silently deleting it from the observation.
      for (let ti: number = 0; ti < capacity; ti++)
        if (parent[ti] !== -1) {
          const group: IAutoMovieRecoverySlabConnectivityGroup = ensure(
            root(ti),
          );
          if (group.before.length === 0 && group.after.length === 0) {
            group.supported = false;
            group.reason ??=
              "Active source component has no represented slab boundary";
          }
        }
      return [...groups.values()];
    };
  }
}
