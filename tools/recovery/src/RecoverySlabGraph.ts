/**
 * Source observation graph for explicit continuation between adjacent plane cuts.
 *
 * @evidence contracts/common.md#principled-implementation Clipped triangle preimages connect across source edges or vertices intersecting the open physical slab; boundary support assigns saved curves to those components. Coordinates are not used to weld distinct source identities.
 * @evidence contracts/common.md#clear-and-simple-design One stateless helper owns connectivity observation and returns local boundary and optional probe ordinals, never source addresses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity matching, largest-component choice or reconstructed source topology is emitted.
 * @evidence contracts/common.md#meaningful-documentation Inputs distinguish private transient triangle support from source-independent curve-graph output.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization traverses nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Namespace initialization retains nothing; the caller owns preparation closures and each query's returned groups.
 */
export namespace RecoverySlabGraph {
  /**
   * Local curve indices in one observed source-preimage component.
   *
   * @evidence contracts/common.md#principled-implementation Disjoint index sets state indexed-source continuation under the supplied binary64 scalar comparisons instead of a geometric-nearest guess.
   * @evidence contracts/common.md#clear-and-simple-design Support and a reason distinguish displayable matched loops from missing or ambiguous source sheets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangle, vertex and edge addresses are absent from this record.
   * @evidence contracts/common.md#meaningful-documentation Before/after are local boundary-support indices, used as saved curve numbers by publication; optional observation probes have a distinct ordinal list. Unsupported groups remain open.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record computes no graph.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns its small index arrays.
   * @author Samchon
   */
  export interface Group {
    /** Local boundary-support indices at the lower cut. */
    before: number[];
    /** Local boundary-support indices at the upper cut. */
    after: number[];
    /** False identifies an open, ambiguous or unsupported source preimage. */
    supported: boolean;
    /** Null for supported continuation; otherwise a local omission reason. */
    reason: string | null;
    /** Private observation-probe ordinals, present only when requested; never curve indices. */
    probes?: number[];
  }

  /**
   * Derive closed-loop continuation and isolate source defects by clipped-slab connectivity.
   * Triangle and edge addresses are transient observation evidence and never leave the result.
   *
   * @evidence contracts/common.md#principled-implementation Union-find joins active triangle preimages across edges and vertices in the open scalar slab of the indexed complex. Boundary loops map through supplied supporting source faces; nonmanifold edge multiplicity, degenerate incidence and components without boundary observations remain unsupported. This observes connectivity, not geometric embedding or exact predicates.
   * @evidence contracts/common.md#clear-and-simple-design One helper owns active triangle components and boundary assignment; source cutting, fitting and engine tessellation retain their existing owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loop with missing or multi-component support is marked unsupported, and source-open or unrepresented contours invalidate only their connected preimage component.
   * @evidence contracts/common.md#meaningful-documentation Defines physical scalar bounds, canonical incidence, support ownership and local output index meaning.
   * @evidence contracts/performance.md#efficient-algorithms For V scalar positions, T triangles and Q boundary records plus their face addresses, validation and indexed incidence cost expected O(V+(T+Q) alpha(T)) time and O(T+Q) storage per slab. Every active triangle is scanned because an unobserved internal component must remain a reported omission.
   * @evidence contracts/performance.md#reuse-equivalent-work Active triangle roots are reused for both boundary cuts and defect supports within one slab; no mutable source cache survives.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Union-find, edge owners and support-root maps expire on return; only curve indices and reason strings escape.
   */
  export function observe(input: {
    triangles: readonly [number, number, number][];
    canon: Int32Array;
    heights: readonly number[];
    beforeMm: number;
    afterMm: number;
    before: readonly ReadonlySet<number>[];
    after: readonly ReadonlySet<number>[];
    defects: readonly ReadonlySet<number>[];
    candidates?: readonly number[];
    probes?: readonly ReadonlySet<number>[];
  }): Group[] {
    return prepare(input)(input);
  }

  /**
   * Admit immutable source incidence and scalar heights once for multiple slabs.
   * Queries supply complete original face IDs in strictly increasing order, including
   * every face with maximum height above beforeMm and minimum height below afterMm.
   * Omitting candidates observes every source face. Boundary supports retain original IDs.
   * Optional private probes query those same components with a separate ordinal namespace;
   * a probe never supplies a missing physical boundary or makes a hidden component supported.
   *
   * @evidence contracts/common.md#principled-implementation One-time finite scalar and source-address admission precedes the same clipped-source union-find used by observe. Candidate-local slots preserve original face order and incidence; all active components remain represented even when absent from saved boundaries.
   * @evidence contracts/common.md#clear-and-simple-design The closure owns source admission while query-local compact arrays and a face-to-slot map own slab connectivity. Source IDs remain private; outputs separate boundary indices, optional probe ordinals and omission reasons.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller must supply every face meeting strict open-slab overlap; query validation checks ordering and addresses without replacing that completeness premise. There is no geometric proximity match, source repair or whole-mesh cache.
   * @evidence contracts/common.md#meaningful-documentation States immutable input lifetime, strict candidate inclusion, original face support IDs, independent probe ordinals, complete default traversal and hidden-component retention.
   * @evidence contracts/performance.md#efficient-algorithms Admission costs O(V+T) time and constant extra storage. A query with A candidates and Q boundary records plus face addresses costs expected O((A+Q) alpha(A)) time and O(A+Q) storage. Compact arrays and final component discovery use A entries; no V or T scan occurs with candidates.
   * @evidence contracts/performance.md#reuse-equivalent-work Finite scalar and address checks are reused by queries on the same immutable source. Each query reuses its roots for both boundary cuts and defects, then releases all query maps.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The extraction owns the closure and source references until finished. Compact union-find and support maps expire per query, and only curve index arrays and reason strings escape.
   */
  export function prepare(source: {
    triangles: readonly [number, number, number][];
    canon: Int32Array;
    heights: readonly number[];
  }): (
    input: Omit<
      Parameters<typeof observe>[0],
      "triangles" | "canon" | "heights"
    >,
  ) => Group[] {
    const count: number = source.triangles.length;
    if (source.canon.length !== source.heights.length)
      throw new Error("A finite aligned scalar chart is required");
    for (let i: number = 0; i < source.heights.length; i++)
      if (!Number.isFinite(source.heights[i]))
        throw new Error("A finite aligned scalar chart is required");
    for (const triangle of source.triangles)
      if (
        triangle.length !== 3 ||
        triangle.some(
          (i: number): boolean =>
            !Number.isSafeInteger(i) ||
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
        Parameters<typeof observe>[0],
        "triangles" | "canon" | "heights"
      >,
    ): Group[] => {
      if (
        !Number.isFinite(input.beforeMm) ||
        !Number.isFinite(input.afterMm) ||
        !(input.beforeMm < input.afterMm)
      )
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
        if (!Number.isSafeInteger(face) || face <= previous || face >= count)
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
      const groups: Map<number, Group> = new Map();
      const roots: (support: ReadonlySet<number>) => Set<number> = (
        support: ReadonlySet<number>,
      ): Set<number> => {
        const result: Set<number> = new Set();
        for (const triangle of support) {
          if (
            !Number.isSafeInteger(triangle) ||
            triangle < 0 ||
            triangle >= count
          )
            throw new Error(
              "Slab boundary support contains an invalid source face",
            );
          const slot: number | undefined = slots.get(triangle);
          if (slot !== undefined && parent[slot] !== -1) result.add(root(slot));
        }
        return result;
      };
      const ensure: (id: number) => Group = (id: number): Group => {
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
            const group: Group = ensure(orphan--);
            group[side].push(i);
            group.supported = false;
            group.reason =
              "Boundary support has no unique clipped-slab component";
            for (const id of found) {
              const affected: Group = ensure(id);
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
          const group: Group = ensure([...found][0]!);
          (group.probes ??= []).push(i);
        } else {
          const affected: number[] = found.size ? [...found] : [orphan--];
          for (const id of affected) {
            const group: Group = ensure(id);
            (group.probes ??= []).push(i);
            group.supported = false;
            group.reason =
              "Observation probe has no unique clipped-slab component";
          }
        }
      }
      for (const support of input.defects)
        for (const id of roots(support)) {
          const group: Group = ensure(id);
          group.supported = false;
          group.reason =
            "Open, isolated or unrepresented source contour in this slab component";
        }
      for (const triangle of invalid) {
        const group: Group = ensure(root(triangle));
        group.supported = false;
        group.reason =
          "Degenerate or nonmanifold source incidence in this slab component";
      }
      // A component born and lost inside this slab has no saved boundary loops.
      // Retain its omission instead of silently deleting it from the observation.
      for (let ti: number = 0; ti < capacity; ti++)
        if (parent[ti] !== -1) {
          const group: Group = ensure(root(ti));
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
