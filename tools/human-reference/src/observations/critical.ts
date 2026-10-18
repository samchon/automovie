import { Skin } from "../geometry/Skin.ts";
import { V3 } from "../geometry/V3.ts";
import { dot } from "../geometry/dot.ts";
import { norm } from "../geometry/norm.ts";
import { CriticalVertex } from "./CriticalVertex.ts";

/**
 * Classifies generic PL height vertices by connected lower and upper links.
 * Equal heights use a private symbolic address order without perturbing physical coordinates.
 * Bremer et al. 2004, sections II.C and III.A: https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
 * The returned manifold flag denotes one cycle; other links remain legacy unresolved observations.
 * The default legacy-link-cycle-v1 policy preserves that classification.
 * Opt-in boundary-regular-path-v1 additionally omits a strict regular boundary fan:
 * a connected simple path, qualified incident faces and radial edge incidence,
 * no tied neighbor height, connected nonempty lower/upper links and opposite boundary-end signs.
 * This is a sufficient local half-disk chart condition, not an embedding certificate.
 * Turner, Robins and Morgan 2024, Definition 4.6: https://doi.org/10.1007/s41468-024-00175-8
 *
 * @evidence contracts/common.md#principled-implementation Lower and upper link connectivity classify generic PL vertices; ties retain the legacy symbolic order. The optional boundary policy admits only a simple path whose incident faces are unique, canonically noncollapsed and finite nonzero-area, whose radial edges have one boundary use or two opposite interior uses, and whose strict lower/upper portions and boundary restriction are regular. Binary64 area checks do not certify geometric embedding.
 * @evidence contracts/common.md#clear-and-simple-design One versioned policy adds conservative boundary regularity to the existing link owner. Returned manifold flags retain their original closed-cycle meaning; positions, event order and default behavior are unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A lower/upper pair of one alone never removes a boundary event. Every failed incidence, duplicate, degeneracy, flat or endpoint check retains its legacy event; no specimen identity or expected population enters the policy.
 * @evidence contracts/common.md#meaningful-documentation States both policy versions, sufficient-condition scope, symbolic ties, binary64 limitations and the unchanged meaning of returned closed-manifold observations.
 * @evidence contracts/performance.md#efficient-algorithms For V positions, T faces and E returned events, construction and local-link traversals cost expected O(V+T), followed by O(E log E) event sorting, with O(V+T+E) storage. The boundary policy adds one source admission scan, one face-incidence scan and linear local degree checks; each face contributes a constant number of link entries.
 * @evidence contracts/performance.md#reuse-equivalent-work Heights and link connectivity are reused for classification. Only the opt-in policy builds shared face-uniqueness and radial-incidence maps, which every boundary candidate reuses during this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All source qualification maps and link graphs are call-local and released after returning private events. No cross-call cache exists; callers discard source addresses before serialization.
 */
export function critical(
  skin: Pick<Skin, "vertices" | "triangles" | "canon">,
  axis: V3 = [0, 1, 0],
  scalarHeights?: readonly number[],
  policy:
    | "legacy-link-cycle-v1"
    | "boundary-regular-path-v1" = "legacy-link-cycle-v1",
): CriticalVertex[] {
  if (
    policy !== "legacy-link-cycle-v1" &&
    policy !== "boundary-regular-path-v1"
  )
    throw new Error("Unknown PL critical classification policy");
  const direction: V3 = norm(axis);
  if (dot(direction, direction) === 0)
    throw new Error("Critical height axis is zero");
  if (
    scalarHeights &&
    (scalarHeights.length !== skin.vertices.length ||
      !scalarHeights.every(Number.isFinite))
  )
    throw new Error("PL scalar chart must align with source vertices");
  const heights: readonly number[] =
    scalarHeights ??
    skin.vertices.map((point: V3): number => dot(point, direction));
  const boundaryPolicy: boolean = policy === "boundary-regular-path-v1";
  const invalidStars: Set<number> = new Set();
  const invalidAliases: Set<number> = new Set();
  const faces: Set<string> = new Set();
  const radialEdges: Map<string, { uses: number; orientation: number }> =
    new Map();
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a},${b}` : `${b},${a}`);
  if (boundaryPolicy) {
    if (skin.canon.length !== skin.vertices.length)
      throw new Error(
        "Boundary classification needs aligned canonical addresses",
      );
    for (let i: number = 0; i < skin.vertices.length; i++) {
      const canonical: number = skin.canon[i]!;
      if (
        !Number.isFinite(heights[i]) ||
        skin.vertices[i]!.length !== 3 ||
        !skin.vertices[i]!.every(Number.isFinite) ||
        canonical < 0 ||
        canonical >= skin.vertices.length
      )
        throw new Error(
          "Boundary classification needs finite positions and scalar heights",
        );
      if (
        skin.canon[canonical] !== canonical ||
        heights[i] !== heights[canonical] ||
        skin.vertices[i]!.some(
          (x: number, k: number): boolean => x !== skin.vertices[canonical]![k],
        )
      )
        invalidAliases.add(canonical);
    }
  }
  const links: Map<number, Map<number, Set<number>>> = new Map();
  const edge = (vertex: number, a: number, b: number): void => {
    if (!links.has(vertex)) links.set(vertex, new Map());
    const link: Map<number, Set<number>> = links.get(vertex)!;
    if (!link.has(a)) link.set(a, new Set());
    if (!link.has(b)) link.set(b, new Set());
    link.get(a)!.add(b);
    link.get(b)!.add(a);
  };
  for (const triangle of skin.triangles) {
    if (
      boundaryPolicy &&
      (triangle.length !== 3 ||
        triangle.some(
          (i: number): boolean =>
            !Number.isSafeInteger(i) || i < 0 || i >= skin.vertices.length,
        ))
    )
      throw new Error(
        "Boundary classification needs valid source face addresses",
      );
    const t: number[] = triangle.map((i: number): number => skin.canon[i]);
    if (boundaryPolicy) {
      const id: string = [...t]
        .sort((a: number, b: number): number => a - b)
        .join(",");
      const a: V3 = skin.vertices[t[0]]!,
        b: V3 = skin.vertices[t[1]]!,
        c: V3 = skin.vertices[t[2]]!;
      const u: number[] = b.map((x: number, i: number): number => x - a[i]!);
      const v: number[] = c.map((x: number, i: number): number => x - a[i]!);
      const area: number = Math.hypot(
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      );
      if (
        new Set(t).size !== 3 ||
        faces.has(id) ||
        !(area > 0 && Number.isFinite(area))
      )
        for (const vertex of t) invalidStars.add(vertex);
      faces.add(id);
      // Count source uses before Set-based links can erase duplicate or collapsed incidence.
      for (let k: number = 0; k < 3; k++) {
        const p: number = t[k]!,
          q: number = t[(k + 1) % 3]!;
        const key: string = edgeKey(p, q);
        if (!radialEdges.has(key))
          radialEdges.set(key, { uses: 0, orientation: 0 });
        const incident: { uses: number; orientation: number } =
          radialEdges.get(key)!;
        incident.uses++;
        incident.orientation += p < q ? 1 : p > q ? -1 : 0;
      }
    }
    if (new Set(t).size !== 3) continue;
    for (let k: number = 0; k < 3; k++)
      edge(t[k], t[(k + 1) % 3], t[(k + 2) % 3]);
  }
  const events: CriticalVertex[] = [];
  for (const [vertex, link] of links) {
    const level: number = heights[vertex];
    const below = (other: number): boolean =>
      heights[other] < level || (heights[other] === level && other < vertex);
    const components = (lower: boolean): number => {
      const seen: Set<number> = new Set();
      let count: number = 0;
      for (const start of link.keys()) {
        if (seen.has(start) || below(start) !== lower) continue;
        count++;
        seen.add(start);
        const queue: number[] = [start];
        for (let k: number = 0; k < queue.length; k++)
          for (const other of link.get(queue[k])!)
            if (!seen.has(other) && below(other) === lower) {
              seen.add(other);
              queue.push(other);
            }
      }
      return count;
    };
    const lower: number = components(true),
      upper: number = components(false);
    const first: number = link.keys().next().value!;
    const connected: Set<number> = new Set([first]);
    const queue: number[] = [first];
    for (let k: number = 0; k < queue.length; k++)
      for (const other of link.get(queue[k])!)
        if (!connected.has(other)) {
          connected.add(other);
          queue.push(other);
        }
    const manifold: boolean =
      connected.size === link.size &&
      [...link.values()].every(
        (neighbours: Set<number>): boolean => neighbours.size === 2,
      );
    const flat: boolean = [...link.keys()].some(
      (other: number): boolean => heights[other] === level,
    );
    if (
      boundaryPolicy &&
      lower === 1 &&
      upper === 1 &&
      !flat &&
      !invalidStars.has(vertex) &&
      !invalidAliases.has(vertex) &&
      connected.size === link.size
    ) {
      const ends: number[] = [...link.keys()].filter(
        (other: number): boolean => link.get(other)!.size === 1,
      );
      const path: boolean =
        ends.length === 2 &&
        [...link.values()].every(
          (neighbors: Set<number>): boolean =>
            neighbors.size === 1 || neighbors.size === 2,
        );
      const opposite: boolean =
        path &&
        ((heights[ends[0]!]! < level && heights[ends[1]!]! > level) ||
          (heights[ends[0]!]! > level && heights[ends[1]!]! < level));
      const incidence: boolean =
        opposite &&
        [...link.keys()].every((other: number): boolean => {
          const radial: { uses: number; orientation: number } | undefined =
            radialEdges.get(edgeKey(vertex, other));
          return (
            !invalidAliases.has(other) &&
            radial !== undefined &&
            (link.get(other)!.size === 1
              ? radial.uses === 1
              : radial.uses === 2 && radial.orientation === 0)
          );
        });
      // A simple path split into one strict lower and one strict upper interval has
      // exactly one sign transition. Its cone is a half-disk with a regular boundary
      // restriction, so the scalar is a local boundary-preserving chart coordinate.
      if (incidence) continue;
    }
    if (lower !== 1 || upper !== 1 || !manifold)
      events.push({
        vertex,
        level,
        p: skin.vertices[vertex],
        lower,
        upper,
        flat,
        manifold,
      });
  }
  return events.sort(
    (a: CriticalVertex, b: CriticalVertex): number =>
      a.level - b.level || a.vertex - b.vertex,
  );
}
