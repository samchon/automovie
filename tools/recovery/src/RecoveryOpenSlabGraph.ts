import type { IRecoveryOpenSlabGraph } from "./IRecoveryOpenSlabGraph.ts";
import { RecoverySlabGraph as G } from "./RecoverySlabGraph.ts";

/**
 * Observe ordinary open-arc transport without exporting source addresses.
 *
 * @evidence contracts/common.md#principled-implementation Qualified manifold incidence and clipped source-boundary paths distinguish two endpoint continuations within one critical-free slab component.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns immutable source topology; each query delegates sheet connectivity to RecoverySlabGraph and publishes only local arc ordinals and reversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate proximity, invented closure, component selection or copied source mesh supplies a generated surface.
 * @evidence contracts/common.md#meaningful-documentation Records private support premises, unsupported topology and source orientation qualification separately.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization traverses nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Namespace initialization creates no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Preparation and query callers own all retained values.
 */
export namespace RecoveryOpenSlabGraph {
  /**
   * Saved open-arc endpoint ordinals and private observation support.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed record retains the ordinary open-slab observer contract without inferring closure or endpoint correspondence.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Arc = IRecoveryOpenSlabGraph.Arc;
  /**
   * Source-free pair transport, unresolved groups and orientation diagnostics.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed record retains the ordinary open-slab observer contract without inferring closure or endpoint correspondence.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Result = IRecoveryOpenSlabGraph.Result;
  /**
   * Immutable private source incidence and precomputed scalar heights.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed record retains the ordinary open-slab observer contract without inferring closure or endpoint correspondence.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Source = IRecoveryOpenSlabGraph.Source;
  /**
   * One critical-free slab query with complete candidate support.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed record retains the ordinary open-slab observer contract without inferring closure or endpoint correspondence.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Query = IRecoveryOpenSlabGraph.Query;

  /**
   * Prepare boundary incidence once and observe critical-free ordinary open pairs.
   * Binary64 zero-area checks and combinatorial paths do not certify embedding.
   * Source winding conflicts warn separately from undirected sheet admission.
   * The producer must supply every critical-event face as a defect; this helper
   * alone does not certify a height-product structure from endpoint counts.
   *
   * @evidence contracts/common.md#principled-implementation Link-cycle/path admission qualifies strict-interior source vertices; nonmanifold edges matter only when crossing the open slab. Candidate-local boundary segments join only at strict-interior source vertices. Two simple paths each meeting one endpoint per cut must belong to the same admitted one-to-one sheet component.
   * @evidence contracts/common.md#clear-and-simple-design The existing slab owner supplies component/probe membership; this helper adds source-boundary transport and endpoint permutation only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every boundary component, invalid source face and hidden sheet survives as probe or defect evidence. No proximity correspondence, invented endpoint, normal copying or aperture closure is used.
   * @evidence contracts/common.md#meaningful-documentation States immutable source lifetime, critical-free producer premise, strict-interior joins, source-free output and separate orientation qualification.
   * @evidence contracts/performance.md#efficient-algorithms Preparation uses expected O(V+T) time and storage for source incidence and link traversals. A query uses only A candidate faces, their B boundary edges and Q support addresses, costing expected O((A+B+Q) alpha(A+B)) time and O(A+B+Q) storage; no full-source query scan occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work The extraction-scoped closure reuses source admission, boundary incidence, invalid-face observations and prepared sheet connectivity across slabs; changing source requires a new preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Source and O(V+T) incidence live until the extraction discards the closure. Boundary union-find, probes and maps expire per query; only local ordinals and diagnostics escape.
   */
  export function prepare(source: Source): (input: Query) => Result {
    const size: number = source.vertices.length;
    if (source.canon.length !== size || source.heights.length !== size)
      throw new Error("Open slab source arrays must align");
    for (let i: number = 0; i < size; i++) {
      const p: readonly number[] | undefined = source.vertices[i];
      const c: number = source.canon[i]!;
      if (
        !Array.isArray(p) ||
        p.length !== 3 ||
        ![0, 1, 2].every((k: number): boolean => Number.isFinite(p[k])) ||
        !Number.isFinite(source.heights[i]) ||
        c < 0 ||
        c >= size ||
        source.canon[c] !== c
      )
        throw new Error(
          "Open slab source needs finite positions and idempotent canonical addresses",
        );
    }
    for (let i: number = 0; i < size; i++) {
      const p: readonly number[] = source.vertices[i]!;
      const c: number = source.canon[i]!;
      if (
        source.heights[i] !== source.heights[c] ||
        p.some((x: number, k: number): boolean => x !== source.vertices[c]![k])
      )
        throw new Error(
          "Open slab aliases must have identical positions and scalar heights",
        );
    }
    const sheet: ReturnType<typeof G.prepare> = G.prepare(source);
    const invalid: Set<number> = new Set();
    const invalidVertices: Set<number> = new Set();
    const invalidEdges: Set<string> = new Set();
    const winding: Set<number> = new Set();
    const edges: Map<
      string,
      { a: number; b: number; faces: number[]; sign: number }
    > = new Map();
    const links: Map<number, Map<number, Set<number>>> = new Map();
    const faces: Map<string, number> = new Map();
    const edgeKey: (a: number, b: number) => string = (
      a: number,
      b: number,
    ): string => (a < b ? `${a},${b}` : `${b},${a}`);
    for (let ti: number = 0; ti < source.triangles.length; ti++) {
      const triangle: readonly number[] = source.triangles[ti]!;
      const ids: number[] = triangle.map(
        (i: number): number => source.canon[i]!,
      );
      const face: string = [...ids]
        .sort((a: number, b: number): number => a - b)
        .join(",");
      const prior: number | undefined = faces.get(face);
      if (prior !== undefined) {
        invalid.add(prior);
        invalid.add(ti);
      } else faces.set(face, ti);
      const a: readonly number[] = source.vertices[triangle[0]!]!;
      const u: number[] = source.vertices[triangle[1]!]!.map(
        (x: number, k: number): number => x - a[k]!,
      );
      const v: number[] = source.vertices[triangle[2]!]!.map(
        (x: number, k: number): number => x - a[k]!,
      );
      const area: number = Math.hypot(
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      );
      if (new Set(ids).size !== 3 || !Number.isFinite(area) || area === 0)
        invalid.add(ti);
      for (let k: number = 0; k < 3; k++) {
        const at: number = ids[k]!,
          next: number = ids[(k + 1) % 3]!,
          other: number = ids[(k + 2) % 3]!;
        const key: string = edgeKey(at, next);
        if (!edges.has(key))
          edges.set(key, {
            a: Math.min(at, next),
            b: Math.max(at, next),
            faces: [],
            sign: 0,
          });
        const edge: NonNullable<ReturnType<typeof edges.get>> = edges.get(key)!;
        edge.faces.push(ti);
        edge.sign += at < next ? 1 : at > next ? -1 : 0;
        if (!links.has(at)) links.set(at, new Map());
        const link: Map<number, Set<number>> = links.get(at)!;
        if (!link.has(next)) link.set(next, new Set());
        if (!link.has(other)) link.set(other, new Set());
        link.get(next)!.add(other);
        link.get(other)!.add(next);
      }
    }
    for (const [key, edge] of edges) {
      if (edge.faces.length > 2 || edge.a === edge.b) invalidEdges.add(key);
      if (edge.faces.length === 2 && edge.sign !== 0)
        for (const face of edge.faces) winding.add(face);
    }
    for (const [vertex, link] of links) {
      const first: number = link.keys().next().value!;
      const seen: Set<number> = new Set([first]),
        queue: number[] = [first];
      for (let i: number = 0; i < queue.length; i++)
        for (const next of link.get(queue[i]!)!)
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
      const ends: number = [...link.values()].filter(
        (neighbors: Set<number>): boolean => neighbors.size === 1,
      ).length;
      if (
        seen.size !== link.size ||
        (ends !== 0 && ends !== 2) ||
        [...link.values()].some(
          (neighbors: Set<number>): boolean =>
            neighbors.size < 1 || neighbors.size > 2,
        )
      )
        invalidVertices.add(vertex);
    }
    const boundary: { a: number; b: number; face: number; key: string }[] = [];
    const byFace: Map<number, number[]> = new Map();
    for (const [key, edge] of edges)
      if (edge.faces.length === 1) {
        const face: number = edge.faces[0]!;
        if (!byFace.has(face)) byFace.set(face, []);
        byFace.get(face)!.push(boundary.length);
        boundary.push({ a: edge.a, b: edge.b, face, key });
      }
    return (input: Query): Result => {
      if (
        !Number.isFinite(input.beforeMm) ||
        !Number.isFinite(input.afterMm) ||
        !(input.beforeMm < input.afterMm)
      )
        throw new Error("Open slab bounds must be finite and increasing");
      const active: number[] = [];
      const localInvalid: Set<number> = new Set();
      let previous: number = -1,
        orientationWarnings: number = 0;
      for (const face of input.candidates) {
        if (
          !Number.isSafeInteger(face) ||
          face <= previous ||
          face >= source.triangles.length
        )
          throw new Error(
            "Open slab candidates must be increasing original face addresses",
          );
        previous = face;
        const heights: number[] = source.triangles[face]!.map(
          (i: number): number => source.heights[i]!,
        );
        if (
          !(
            Math.max(...heights) > input.beforeMm &&
            Math.min(...heights) < input.afterMm
          )
        )
          continue;
        if (invalid.has(face)) localInvalid.add(face);
        const vertices: number[] = source.triangles[face]!.map(
          (i: number): number => source.canon[i]!,
        );
        for (let k: number = 0; k < 3; k++) {
          if (
            invalidVertices.has(vertices[k]!) &&
            heights[k]! > input.beforeMm &&
            heights[k]! < input.afterMm
          )
            localInvalid.add(face);
          if (
            invalidEdges.has(edgeKey(vertices[k]!, vertices[(k + 1) % 3]!)) &&
            Math.max(heights[k]!, heights[(k + 1) % 3]!) > input.beforeMm &&
            Math.min(heights[k]!, heights[(k + 1) % 3]!) < input.afterMm
          )
            localInvalid.add(face);
        }
        if (winding.has(face)) orientationWarnings++;
        for (const ei of byFace.get(face) ?? []) {
          const edge: (typeof boundary)[number] = boundary[ei]!;
          if (
            Math.max(source.heights[edge.a]!, source.heights[edge.b]!) >
              input.beforeMm &&
            Math.min(source.heights[edge.a]!, source.heights[edge.b]!) <
              input.afterMm
          )
            active.push(ei);
        }
      }
      const parent: Int32Array = Int32Array.from(
        active,
        (_: number, i: number): number => i,
      );
      const rank: Uint8Array = new Uint8Array(active.length);
      const root: (i: number) => number = (i: number): number => {
        let r: number = i;
        while (parent[r] !== r) r = parent[r]!;
        while (parent[i] !== i) {
          const next: number = parent[i]!;
          parent[i] = r;
          i = next;
        }
        return r;
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
      const vertexOwner: Map<number, number> = new Map();
      const nodes: [string, string][] = [];
      const contacts: Map<string, number[]> = new Map();
      const ends: { side: "before" | "after"; slot: number }[] = [];
      for (let slot: number = 0; slot < active.length; slot++) {
        const edge: (typeof boundary)[number] = boundary[active[slot]!]!;
        const pair: string[] = [];
        for (const vertex of [edge.a, edge.b]) {
          const h: number = source.heights[vertex]!;
          if (h > input.beforeMm && h < input.afterMm) {
            pair.push(`v:${vertex}`);
            const prior: number | undefined = vertexOwner.get(vertex);
            if (prior === undefined) vertexOwner.set(vertex, slot);
            else join(slot, prior);
          } else {
            const side: "before" | "after" =
              h <= input.beforeMm ? "before" : "after";
            const level: number =
              side === "before" ? input.beforeMm : input.afterMm;
            // Cut-plane vertices remain distinct contacts per edge: only strict-interior vertices join.
            pair.push(`${side}:${active[slot]}`);
            const address: string = `${side}:${h === level ? `v:${vertex}` : `e:${edge.key}`}`;
            if (!contacts.has(address)) contacts.set(address, []);
            contacts.get(address)!.push(slot);
            ends.push({ side, slot });
          }
        }
        nodes.push(pair as [string, string]);
      }
      const components: {
        faces: Set<number>;
        degrees: Map<string, number>;
        edges: number;
        before: number;
        after: number;
      }[] = [];
      const ordinal: Map<number, number> = new Map();
      for (let slot: number = 0; slot < active.length; slot++) {
        const r: number = root(slot);
        if (!ordinal.has(r)) {
          ordinal.set(r, components.length);
          components.push({
            faces: new Set(),
            degrees: new Map(),
            edges: 0,
            before: 0,
            after: 0,
          });
        }
        const component: (typeof components)[number] =
          components[ordinal.get(r)!]!;
        const edge: (typeof boundary)[number] = boundary[active[slot]!]!;
        component.faces.add(edge.face);
        component.edges++;
        for (const node of nodes[slot]!)
          component.degrees.set(node, (component.degrees.get(node) ?? 0) + 1);
      }
      for (const end of ends)
        components[ordinal.get(root(end.slot))!]![end.side]++;
      const valid: boolean[] = components.map(
        (component: (typeof components)[number]): boolean =>
          component.before === 1 &&
          component.after === 1 &&
          component.degrees.size === component.edges + 1 &&
          [...component.degrees.values()].every(
            (degree: number): boolean => degree === 1 || degree === 2,
          ) &&
          [...component.degrees.values()].filter(
            (degree: number): boolean => degree === 1,
          ).length === 2,
      );
      const endpoint: (
        end: Arc["ends"][number],
        side: "before" | "after",
      ) => number | undefined = (
        end: Arc["ends"][number],
        side: "before" | "after",
      ): number | undefined => {
        if (
          ![end.a, end.b].every(
            (i: number): boolean =>
              Number.isSafeInteger(i) &&
              i >= 0 &&
              i < size &&
              source.canon[i] === i,
          )
        )
          throw new Error(
            "Open arc endpoints must be canonical source addresses",
          );
        const key: string = `${side}:${end.a === end.b ? `v:${end.a}` : `e:${edgeKey(end.a, end.b)}`}`;
        const found: Set<number> = new Set(
          (contacts.get(key) ?? []).map(
            (slot: number): number => ordinal.get(root(slot))!,
          ),
        );
        return found.size === 1 ? found.values().next().value : undefined;
      };
      const groups: G.Group[] = sheet({
        beforeMm: input.beforeMm,
        afterMm: input.afterMm,
        before: input.before.map((arc: Arc): ReadonlySet<number> => arc.faces),
        after: input.after.map((arc: Arc): ReadonlySet<number> => arc.faces),
        defects: [...input.defects, localInvalid],
        candidates: input.candidates,
        probes: components.map(
          (component: (typeof components)[number]): ReadonlySet<number> =>
            component.faces,
        ),
      });
      const result: Result = {
        pairs: [],
        unresolved: [],
        diagnostics: orientationWarnings
          ? [
              `Source material orientation is inconsistent on ${orientationWarnings} candidate faces; generated parameter normals do not establish source outwardness.`,
            ]
          : [],
      };
      for (const group of groups) {
        let reason: string | null = group.supported
          ? null
          : (group.reason ?? "Unsupported source sheet component");
        const probes: number[] = group.probes ?? [];
        if (
          reason === null &&
          (group.before.length !== 1 || group.after.length !== 1)
        )
          reason = "Ordinary open transport requires one arc on each cut";
        if (
          reason === null &&
          (probes.length !== 2 ||
            probes[0] === probes[1] ||
            probes.some((i: number): boolean => !valid[i]))
        )
          reason =
            "Ordinary open transport requires exactly two simple boundary paths across the slab";
        if (reason === null) {
          const before: Arc = input.before[group.before[0]!]!,
            after: Arc = input.after[group.after[0]!]!;
          const a: number | undefined = endpoint(before.ends[0], "before"),
            b: number | undefined = endpoint(before.ends[1], "before");
          const c: number | undefined = endpoint(after.ends[0], "after"),
            d: number | undefined = endpoint(after.ends[1], "after");
          if (
            a === undefined ||
            b === undefined ||
            c === undefined ||
            d === undefined ||
            a === b ||
            c === d ||
            !probes.includes(a) ||
            !probes.includes(b)
          )
            reason =
              "Open endpoints have no unique pair of source-boundary paths";
          else if (a === c && b === d)
            result.pairs.push({
              before: group.before[0]!,
              after: group.after[0]!,
              reverseAfter: false,
            });
          else if (a === d && b === c)
            result.pairs.push({
              before: group.before[0]!,
              after: group.after[0]!,
              reverseAfter: true,
            });
          else
            reason =
              "Open endpoint transport does not preserve its two boundary paths";
        }
        if (reason !== null)
          result.unresolved.push({
            before: [...group.before],
            after: [...group.after],
            reason,
          });
      }
      result.pairs.sort(
        (a: Result["pairs"][number], b: Result["pairs"][number]): number =>
          a.before - b.before || a.after - b.after,
      );
      return result;
    };
  }
}
