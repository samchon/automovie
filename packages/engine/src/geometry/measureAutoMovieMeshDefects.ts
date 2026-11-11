import { MESH_WELD_GRID } from "../constants/MESH_WELD_GRID";
import type { IAutoMovieMeshDefect } from "./IAutoMovieMeshDefect";

/** Shape state of a triangle with three distinct cells whose aspect is within the limit, or was not asked about. */
const SOUND: number = 0;

/** Shape state of a triangle whose corners weld onto fewer than three cells. */
const DEGENERATE: number = 1;

/** Shape state of a triangle on three distinct cells whose aspect exceeds the limit. */
const SLIVER: number = 2;

/**
 * List every defect of a triangle mesh with the vertices that carry it, so an inspection can draw each one where it is instead of reading a count.
 *
 * `positions` is flat xyz in any one length unit and `indices` holds triangle corners, or is `null` for a non-indexed list whose every three vertices are one triangle. Both are read in place, typed arrays included, and neither is changed. Vertices weld by position: each coordinate is multiplied by `options.weld`, the number of lattice cells per unit of length, and rounded to the nearest whole cell, and vertices in the same cell on all three axes are one corner. The default is `MESH_WELD_GRID`, a nanometre grid when the unit is the metre. Welding by cell is not welding by distance: two points closer than a cell that fall on either side of a rounding boundary stay apart.
 *
 * A triangle whose corners weld onto fewer than three cells is `degenerate` and contributes no edges. Every other triangle contributes its three edges between welded corners. An edge used by exactly one triangle is `open`, by more than two `non-manifold`, and by exactly two that traverse it in the same direction `inconsistent`, which is also what a triangle stored twice reports on all three edges. A non-manifold edge is not tested for winding. `sliver` is reported only when `options.sliver` is given: a triangle on three distinct cells whose aspect, its longest edge squared divided by twice its area, exceeds that limit. The aspect is dimensionless and equals the longest edge over the height standing on it: `2 / sqrt(3)` for an equilateral triangle, 2 for a right isosceles one, and infinite for collinear corners on distinct cells. It is measured on the stored positions, not on the lattice.
 *
 * Defects come in ascending order of the first triangle that carries them. Within one triangle its own `degenerate` or `sliver` defect comes first, then its edges in corner order: corner 0 to 1, 1 to 2, 2 to 0. An edge is listed once, at the first triangle that uses it. The same input always gives the same list.
 *
 * It throws a named `Error` for a position count not divisible by three, a corner count not divisible by three, an index that is not a whole number inside the position buffer, a `weld` or `sliver` that is not positive and finite, a vertex whose lattice coordinate is not finite, and more than 94 906 265 vertices. Only edge incidence is measured: a vertex where two fans touch and surfaces that cross each other are not found here.
 *
 * @param mesh Position and index buffers to measure.
 * @param options `weld` is the lattice's cells per unit of length, default `MESH_WELD_GRID`. `sliver` is the aspect limit above which a triangle is a sliver; absent, no sliver is reported.
 * @returns The defects, empty for a closed, consistently wound mesh without degenerate triangles.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A half-edge incidence census over position-welded corners: an undirected edge of a closed oriented 2-manifold is used by exactly two triangles in opposite directions, so one use, more than two uses and two same-direction uses are each a defect. Direction is recorded as whether the traversal runs from the lower welded id to the higher. Lattice indices are exact integers up to 2^53; past that the product's own binary64 spacing is wider than a cell and vertices weld by their rounded value. The aspect divides by the cross product's length, which is twice the area. Vertex-manifoldness and self-intersection are outside an edge census and remain unmeasured.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, welding, one census pass and one emission pass, with the welding, the aspect and the edge verdict in local helpers. It does not call `weldMeshVertices` or `triangleIndicesOf`, which take `number[]`, fix the grid and copy the index run, where this must read typed arrays in place under a caller's grid. `inspectAutoMovieMeshTopology` keeps the counts and the volume; this owns the located list.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The default grid is the shared `MESH_WELD_GRID` and the sliver limit is the caller's parameter, with no built-in tolerance. Malformed buffers are refused instead of truncated, degenerate triangles are reported instead of dropped, and a vertex with a non-finite coordinate is refused instead of welded with every other such vertex. The vertex bound is the largest count whose square is a safe integer, which the packed keys need to stay exact.
 * @evidence contracts/development/common.md#meaningful-documentation States the buffer layout and unit freedom, the weld rule and its default, each kind's condition, the aspect formula with reference values, the output order, every refusal and what an edge census cannot find.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in vertices V and triangles T. Each vertex costs five hashed lookups that intern its three axis indices, its xy pair and its cell as numbers, and each triangle edge one lookup on the key `low * V + high`; no key is a string, and the packing is collision-free because every interned ordinal is below V. Space is one 32-bit cell id per vertex, one 32-bit edge ordinal per corner, one byte per triangle and two counters and one flag per distinct edge. A `Map` cannot hold more entries than its engine allows, about 16.7 million in V8, which bounds distinct cells and edges below the vertex bound.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call measures the buffers it is given and keeps nothing between calls, so a caller that needs the list twice keeps the first one.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weld tables, the edge table and the typed arrays are local to one call and are garbage once it returns or throws. Only the returned list survives, and it holds vertex indices, not the mesh.
 */
export function measureAutoMovieMeshDefects(
  mesh: { positions: ArrayLike<number>; indices: ArrayLike<number> | null },
  options?: { weld?: number; sliver?: number },
): IAutoMovieMeshDefect[] {
  /** Flat xyz buffer, read in place. */
  const positions: ArrayLike<number> = mesh.positions;

  /** Triangle corners, or null when every three vertices are one triangle. */
  const indices: ArrayLike<number> | null = mesh.indices;

  /** Lattice cells per unit of length. */
  const weld: number = options?.weld ?? MESH_WELD_GRID;

  /** Aspect limit, or undefined when slivers are not asked about. */
  const sliver: number | undefined = options?.sliver;

  // Refuse malformed buffers and options before anything is allocated.
  if (positions.length % 3 !== 0)
    throw new Error(
      `measureAutoMovieMeshDefects: positions hold ${positions.length} components, not whole xyz triples`,
    );

  /** Vertices in the position buffer. */
  const vertexCount: number = positions.length / 3;

  /** Triangle corners in the index run, or in the position run for a non-indexed list. */
  const cornerCount: number = indices === null ? vertexCount : indices.length;
  if (cornerCount % 3 !== 0)
    throw new Error(
      `measureAutoMovieMeshDefects: ${cornerCount} triangle corners are not in threes`,
    );
  if (!(Number.isFinite(weld) && weld > 0))
    throw new Error(
      `measureAutoMovieMeshDefects: weld ${weld} is not a positive finite cell count`,
    );
  if (sliver !== undefined && !(Number.isFinite(sliver) && sliver > 0))
    throw new Error(
      `measureAutoMovieMeshDefects: sliver limit ${sliver} is not a positive finite aspect`,
    );

  // Every packed key is at most `vertexCount * vertexCount - 1`, so the keys are exact integers only while that square is a safe integer.
  if (vertexCount * vertexCount > Number.MAX_SAFE_INTEGER)
    throw new Error(
      `measureAutoMovieMeshDefects: ${vertexCount} vertices exceed the 94906265 that edge keys stay exact for`,
    );

  /** The stored vertex index at a corner slot, which for a non-indexed list is the slot itself. */
  const vertexAt: (slot: number) => number = (slot: number): number =>
    indices === null ? slot : indices[slot]!;

  /** Welded corner id of every vertex. */
  const cellOf: Int32Array = weldCells(positions, vertexCount, weld);

  /** Triangles in the measured run. */
  const triangleCount: number = cornerCount / 3;

  /** Shape state per triangle: `SOUND`, `DEGENERATE` or `SLIVER`. */
  const shape: Uint8Array = new Uint8Array(triangleCount);

  /** Per corner slot, the ordinal of the edge leaving that corner; unread for a degenerate triangle. */
  const edgeOf: Int32Array = new Int32Array(cornerCount);

  /** Edge ordinal by packed pair of welded ids, lower id first. */
  const edges: Map<number, number> = new Map();

  /** Per edge ordinal, how many triangles use the edge. */
  const uses: number[] = [];

  /** Per edge ordinal, how many of those uses run from the lower welded id to the higher. */
  const forward: number[] = [];

  /** The current triangle's stored vertex indices, reused across triangles. */
  const corner: [number, number, number] = [0, 0, 0];

  /** The current triangle's welded ids, reused across triangles. */
  const cell: [number, number, number] = [0, 0, 0];

  // Census: classify each triangle's shape and count every edge's uses and directions.
  for (let triangle: number = 0; triangle < triangleCount; ++triangle) {
    for (let k: number = 0; k < 3; ++k) {
      /** Stored vertex index of this corner, admitted before it addresses a buffer. */
      const vertex: number = vertexAt(3 * triangle + k);
      if (!(Number.isInteger(vertex) && vertex >= 0 && vertex < vertexCount))
        throw new Error(
          `measureAutoMovieMeshDefects: index ${vertex} at corner ${3 * triangle + k} is not one of the ${vertexCount} vertices`,
        );
      corner[k] = vertex;
      cell[k] = cellOf[vertex]!;
    }

    // Two corners in one cell leave no triangle and no edge between them, so the triangle stays out of the edge table.
    if (cell[0] === cell[1] || cell[1] === cell[2] || cell[2] === cell[0]) {
      shape[triangle] = DEGENERATE;
      continue;
    }
    for (let k: number = 0; k < 3; ++k) {
      /** Welded id the edge leaves. */
      const from: number = cell[k]!;

      /** Welded id the edge reaches. */
      const to: number = cell[(k + 1) % 3]!;

      /** Ordinal of the undirected edge, new when it equals the count so far. */
      const edge: number = intern(
        edges,
        Math.min(from, to) * vertexCount + Math.max(from, to),
      );
      if (edge === uses.length) {
        uses.push(0);
        forward.push(0);
      }
      uses[edge] = uses[edge]! + 1;
      if (from < to) forward[edge] = forward[edge]! + 1;
      edgeOf[3 * triangle + k] = edge;
    }
    if (
      sliver !== undefined &&
      aspectOf(positions, corner[0], corner[1], corner[2]) > sliver
    )
      shape[triangle] = SLIVER;
  }

  /** The located defects, in the documented order. */
  const defects: IAutoMovieMeshDefect[] = [];

  /** Per edge ordinal, 1 once its first using triangle is reached, so a defective edge is listed there only. */
  const listed: Uint8Array = new Uint8Array(uses.length);

  // Emission: walking triangles in ascending order puts every defect at its first carrying triangle.
  for (let triangle: number = 0; triangle < triangleCount; ++triangle) {
    /** First corner slot of this triangle. */
    const base: number = 3 * triangle;
    if (shape[triangle] !== SOUND)
      defects.push({
        kind: shape[triangle] === DEGENERATE ? "degenerate" : "sliver",
        vertices: [vertexAt(base), vertexAt(base + 1), vertexAt(base + 2)],
      });
    if (shape[triangle] === DEGENERATE) continue;
    for (let k: number = 0; k < 3; ++k) {
      /** Ordinal of the edge leaving corner `k`. */
      const edge: number = edgeOf[base + k]!;
      if (listed[edge] === 1) continue;
      listed[edge] = 1;

      /** The edge's defect class, or null for a sound edge. */
      const kind: IAutoMovieMeshDefect.Kind | null = edgeKindOf(
        uses[edge]!,
        forward[edge]!,
      );
      if (kind === null) continue;

      // The first using triangle names the edge's two ends by its own stored indices and traversal.
      defects.push({
        kind,
        vertices: [vertexAt(base + k), vertexAt(base + ((k + 1) % 3))],
      });
    }
  }
  return defects;
}

/**
 * Welded corner id of every vertex: vertices whose three rounded lattice indices agree share one id, numbered from zero in first-seen order.
 *
 * Each axis interns its lattice index to an ordinal below the vertex count, then the xy pair and the cell are interned from two such ordinals packed as `first * vertexCount + second`. Both factors are below the vertex count, so distinct pairs never share a key. A `Map` treats `-0` and `0` as one key, so a coordinate that rounds to negative zero welds with zero.
 *
 * @param positions Flat xyz buffer.
 * @param vertexCount Vertices in it, whose square is a safe integer.
 * @param weld Lattice cells per unit of length, positive and finite.
 * @returns One id per vertex.
 */
function weldCells(
  positions: ArrayLike<number>,
  vertexCount: number,
  weld: number,
): Int32Array {
  /** The result, one welded id per vertex. */
  const cellOf: Int32Array = new Int32Array(vertexCount);

  /** Ordinal by lattice index, one table per axis. */
  const axes: [Map<number, number>, Map<number, number>, Map<number, number>] =
    [new Map(), new Map(), new Map()];

  /** Ordinal by packed x and y ordinals. */
  const pairs: Map<number, number> = new Map();

  /** Welded id by packed pair ordinal and z ordinal. */
  const cells: Map<number, number> = new Map();

  /** The current vertex's three axis ordinals, reused across vertices. */
  const ordinal: [number, number, number] = [0, 0, 0];
  for (let vertex: number = 0; vertex < vertexCount; ++vertex) {
    for (let axis: number = 0; axis < 3; ++axis) {
      /** Nearest whole cell along this axis. */
      const lattice: number = Math.round(positions[3 * vertex + axis]! * weld);

      // A NaN, an infinity, a hole in the buffer and a product past the binary64 range all have no cell.
      if (!Number.isFinite(lattice))
        throw new Error(
          `measureAutoMovieMeshDefects: vertex ${vertex} has no lattice cell, its component ${axis} is ${positions[3 * vertex + axis]}`,
        );
      ordinal[axis] = intern(axes[axis]!, lattice);
    }
    cellOf[vertex] = intern(
      cells,
      intern(pairs, ordinal[0] * vertexCount + ordinal[1]) * vertexCount +
        ordinal[2],
    );
  }
  return cellOf;
}

/**
 * The ordinal of a key in an interning table, assigned from zero in first-seen order.
 *
 * @param table Ordinal by key; a new key is added with the table's size as its ordinal.
 * @param key Key to look up.
 * @returns The key's ordinal, which equals the table's former size when the key is new.
 */
function intern(table: Map<number, number>, key: number): number {
  /** The ordinal already assigned, if any. */
  const known: number | undefined = table.get(key);
  if (known !== undefined) return known;

  /** The next free ordinal. */
  const next: number = table.size;
  table.set(key, next);
  return next;
}

/**
 * A triangle's aspect: its longest edge squared divided by twice its area, dimensionless.
 *
 * Twice the area is the length of the cross product of two edge vectors. With `L` the longest edge and `h` the height standing on it, twice the area is `L h`, so the aspect is `L / h`. Collinear corners give a zero cross product and an infinite aspect.
 *
 * @param positions Flat xyz buffer.
 * @param a First corner's vertex index.
 * @param b Second corner's vertex index.
 * @param c Third corner's vertex index.
 * @returns The aspect, at least `2 / sqrt(3)`.
 */
function aspectOf(
  positions: ArrayLike<number>,
  a: number,
  b: number,
  c: number,
): number {
  /** Edge vector from `a` to `b`. */
  const ab: [number, number, number] = [
    positions[3 * b]! - positions[3 * a]!,
    positions[3 * b + 1]! - positions[3 * a + 1]!,
    positions[3 * b + 2]! - positions[3 * a + 2]!,
  ];

  /** Edge vector from `a` to `c`. */
  const ac: [number, number, number] = [
    positions[3 * c]! - positions[3 * a]!,
    positions[3 * c + 1]! - positions[3 * a + 1]!,
    positions[3 * c + 2]! - positions[3 * a + 2]!,
  ];

  /** Squared length of the longest of the three edges, the third being `ac - ab`. */
  const longest: number = Math.max(
    ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2,
    ac[0] ** 2 + ac[1] ** 2 + ac[2] ** 2,
    (ac[0] - ab[0]) ** 2 + (ac[1] - ab[1]) ** 2 + (ac[2] - ab[2]) ** 2,
  );

  /** Twice the area: the length of `ab x ac`. */
  const twiceArea: number = Math.hypot(
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  );
  return longest / twiceArea;
}

/**
 * The defect class of an edge from its incidence, or null when it is sound.
 *
 * @param uses Triangles using the edge, at least one.
 * @param forward How many of them traverse it from the lower welded id to the higher.
 * @returns `open` for one use, `non-manifold` for more than two, `inconsistent` for two in the same direction, null for two in opposite directions.
 */
function edgeKindOf(
  uses: number,
  forward: number,
): IAutoMovieMeshDefect.Kind | null {
  if (uses === 1) return "open";
  if (uses > 2) return "non-manifold";
  return forward === 1 ? null : "inconsistent";
}
