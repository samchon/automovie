import type { IControlMesh } from "../mesh/structures/IControlMesh";

/**
 * Close explicitly requested, geometrically coincident free rims after their
 * common refinement. Only vertices on the selected boundary components weld,
 * and only exactly equal coordinates identify contact. A reversed duplicate
 * face pair at a commissure is the two sides of its collapsed fold and is
 * removed together. Same-oriented duplicate faces are not valid closure.
 *
 * Original positions and vertex identities remain available to anatomical
 * finishers; resident triangles use the welded representative. Unselected open
 * eyes, the neck crop, ordinary nearby surfaces and their topology stay intact.
 * Coordinates use head millimetres and remain shared with the input; only
 * connectivity/groups and optional per-corner colours are newly assembled.
 * Admitted source triangles and selected degree-two free-boundary components
 * are premises. Surviving selected edges must have two opposite incidences;
 * that local check establishes no global embeddedness or full manifold union.
 *
 * @evidence contracts/common.md#principled-implementation Boundary incidence identifies each seeded simple cycle, exact component-local coordinate keys choose representatives, and rewritten triangles remove collapsed faces/opposed same-material fold pairs before opposite-incidence seam admission.
 * @evidence contracts/common.md#clear-and-simple-design One post-refinement owner rewrites contact connectivity while retaining anatomical position IDs; final normal generation and interior consumers remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance weld joins nearby surfaces, and duplicate orientation, conflicting materials, repeated folds or open selected edges refuse; existing admitted topology and global nonintersection remain separate premises.
 * @evidence contracts/common.md#meaningful-documentation Prose states explicit seeds, exact component-local equality, shared millimetre positions, newly assembled buffers and the local seam check's limits.
 * @evidence contracts/performance.md#efficient-algorithms Edge incidence, boundary traversal, triangle rewrite and final edge verification are linear in input/output topology; triangle-key sorts contain only three IDs and selected components are visited once.
 * @evidence contracts/performance.md#reuse-equivalent-work One edge table serves every seed and selected membership skips repeated component traversal; representative IDs serve both triangle rewriting and final seam checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph/maps and temporary triangles grow with the current mesh during this call; output connectivity and corner colours are caller-owned, with no cache or handle retained.
 */
export function sealPortraitContactSeams(
  mesh: IControlMesh,
  seeds: readonly number[],
): IControlMesh & { cornerColors?: number[][] } {
  if (seeds.length === 0) return mesh;
  const edges: Map<string, { a: number; b: number; count: number }> = new Map<
    string,
    { a: number; b: number; count: number }
  >();
  for (let i: number = 0; i < mesh.indices.length; i += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = mesh.indices[i + corner],
        b: number = mesh.indices[i + ((corner + 1) % 3)];
      const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
      const old: { a: number; b: number; count: number } | undefined =
        edges.get(key);
      if (old === undefined) edges.set(key, { a, b, count: 1 });
      else old.count++;
    }
  const neighbours: Map<number, number[]> = new Map<number, number[]>();
  for (const { a, b, count } of edges.values())
    if (count === 1) {
      neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
      neighbours.set(b, [...(neighbours.get(b) ?? []), a]);
    }
  const selected: Set<number> = new Set<number>();
  const representatives: Map<number, number> = new Map<number, number>();
  for (const seed of seeds) {
    if (!Number.isInteger(seed) || !neighbours.has(seed))
      throw new Error("A contact seam must start on a resident free boundary.");
    if (selected.has(seed)) continue;
    const queue: number[] = [seed];
    selected.add(seed);
    for (let i: number = 0; i < queue.length; i++) {
      const adjacent: number[] = neighbours.get(queue[i])!;
      if (adjacent.length !== 2)
        throw new Error(
          "A contact seam needs a simple closed boundary population.",
        );
      for (const id of adjacent)
        if (!selected.has(id)) {
          selected.add(id);
          queue.push(id);
        }
    }
    const coordinates: Map<string, number> = new Map<string, number>();
    let merged: boolean = false;
    for (const id of queue) {
      const point: number[] = mesh.positions[id];
      if (point.length !== 3 || !point.every(Number.isFinite))
        throw new Error("Contact seam coordinates must be finite XYZ.");
      const key: string = point.join("/");
      const previous: number | undefined = coordinates.get(key);
      if (previous === undefined) coordinates.set(key, id);
      else {
        representatives.set(id, previous);
        merged = true;
      }
    }
    if (!merged)
      throw new Error(
        "An explicit closed contact needs coincident boundary vertices.",
      );
  }
  const triangles: (number[] | null)[] = [];
  const sourceColors: number[][][] | undefined =
    mesh.colors === undefined ? undefined : ([] as number[][][]);
  const groups: number[] = [];
  const occupied: Map<
    string,
    { triangle: number; oriented: string; group: number }
  > = new Map<string, { triangle: number; oriented: string; group: number }>();
  for (let i: number = 0; i < mesh.indices.length; i += 3) {
    const source: number[] = mesh.indices.slice(i, i + 3);
    const ids: number[] = source.map(
      (id: number): number => representatives.get(id) ?? id,
    );
    if (new Set(ids).size < 3) continue;
    const changed: boolean = source.some((id: number): boolean =>
      selected.has(id),
    );
    if (changed) {
      const key: string = [...ids]
        .sort((a: number, b: number): number => a - b)
        .join("/");
      const at: number = ids.indexOf(Math.min(...ids));
      const oriented: string = [
        ids[at],
        ids[(at + 1) % 3],
        ids[(at + 2) % 3],
      ].join("/");
      const previous:
        | { triangle: number; oriented: string; group: number }
        | undefined = occupied.get(key);
      if (previous !== undefined) {
        if (
          previous.oriented === oriented ||
          previous.group !== mesh.groups[i / 3] ||
          triangles[previous.triangle] === null
        )
          throw new Error(
            "A closed contact cannot merge duplicate orientation, conflicting materials or repeated folds.",
          );
        triangles[previous.triangle] = null;
        continue;
      }
      occupied.set(key, {
        triangle: triangles.length,
        oriented,
        group: mesh.groups[i / 3],
      });
    }
    triangles.push(ids);
    sourceColors?.push(
      source.map((id: number): number[] => [...mesh.colors![id]]),
    );
    groups.push(mesh.groups[i / 3]);
  }
  const output: IControlMesh & { cornerColors?: number[][] } = {
    ...mesh,
    indices: [],
    groups: [],
    ...(sourceColors === undefined ? {} : { cornerColors: [] }),
  };
  triangles.forEach((triangle: number[] | null, i: number): void => {
    if (triangle !== null) {
      output.indices.push(...triangle);
      output.groups.push(groups[i]);
      output.cornerColors?.push(...sourceColors![i]);
    }
  });
  // A declaration of closure is stronger than finding at least one pair.
  // Every surviving selected edge must now have two opposite incident faces.
  const contacts: Map<string, { count: number; direction: number }> = new Map<
    string,
    { count: number; direction: number }
  >();
  const closed: Set<number> = new Set(
    [...selected].map((id: number): number => representatives.get(id) ?? id),
  );
  for (let i: number = 0; i < output.indices.length; i += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = output.indices[i + corner],
        b: number = output.indices[i + ((corner + 1) % 3)];
      if (!closed.has(a) || !closed.has(b)) continue;
      const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
      const old: { count: number; direction: number } = contacts.get(key) ?? {
        count: 0,
        direction: 0,
      };
      contacts.set(key, {
        count: old.count + 1,
        direction: old.direction + (a < b ? 1 : -1),
      });
    }
  if (
    [...contacts.values()].some(
      (edge: { count: number; direction: number }): boolean =>
        edge.count !== 2 || edge.direction !== 0,
    )
  )
    throw new Error(
      "The requested contact leaves an open or inconsistently oriented seam.",
    );
  return output;
}
