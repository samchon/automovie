import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IRecoveryDiskChart } from "./IRecoveryDiskChart";
import { prepareRecoveryDiskBoundary } from "./prepareRecoveryDiskBoundary";

/**
 * Divide one coherent private triangle disk into four physical-arclength sides.
 * A maximum boundary turn meeting cornerDegrees anchors the chart, with stable
 * physical-key ties followed by the complete coherent cyclic key-word context;
 * indistinguishable contexts fail. Without a feature the smallest key anchors it.
 * Repeated physical keys require exactly equal coordinates; private occurrences
 * retain distinct ordinals, including paired cut edges and their observations.
 * Quarter observations subdivide only the unique incident boundary triangles.
 * Coordinates remain millimetres in the input frame, and input arrays are immutable.
 * Sides are bottom/right/top/left, with top and left reversed for increasing UV.
 * Invalid incidence, links, orientation or unrepresentable subdivision throws an
 * explicit unsupported error. PL geometry is preserved in real arithmetic;
 * binary64 interpolation and global source embedding are not certified.
 * Keys, triangles and corner diagnostics remain private fitting observations.
 * Partial boundary-arc authority and all field/consumer publication belong elsewhere.
 *
 * @evidence contracts/common.md#principled-implementation Connected coherent edge incidence, one complete boundary, disk Euler characteristic and manifold vertex links admit a disk. Stable boundary turns choose one anchor; exact dyadic sums of measured edge lengths define quarters, and edge subdivision preserves each original affine triangle in real arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One observation helper owns disk admission, corner selection, new boundary identities and private face subdivision; boundary fitting, harmonic maps and generated surfaces are separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positional or key weld, guessed topology, source normal transfer, anatomical control or consumer mesh is produced. Private vertex ordinals retain occurrence identity; repeated physical keys must agree exactly in position. Unresolved topology, anchor context or arithmetic fails explicitly without changing source arrays.
 * @evidence contracts/common.md#meaningful-documentation States physical units, corner policy, side orientation, private output lifetime, unsupported conditions and real-arithmetic versus binary64 geometry preservation.
 * @evidence contracts/performance.md#efficient-algorithms V vertices and F triangles require O(V+F) incidence/link work and storage. B cyclic key-word ranks require O(B log² B) comparisons and O(B) storage. Boundary lengths add O(BW) integer bit work/storage with W at most 2098 plus ceil(log2 B) bits from binary64 dyadic sums; at most three inserted vertices and three extra triangles are produced.
 * @evidence contracts/performance.md#reuse-equivalent-work One edge registry serves topology, coherent boundary admission and unique incident-face subdivision. Exact prefix lengths are reused for all three quarter targets; no source extraction or fitting is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local incidence, links and arithmetic buffers expire on return or failure. The caller owns copied private coordinates/keys and at most F+3 triangles; no state, handles or source topology reaches a generated-field consumer here.
 */
export function RecoveryDiskChart(
  input: IRecoveryDiskChart.Input,
): IRecoveryDiskChart.Result {
  const fail: (reason: string) => never = (reason: string): never => {
    throw new Error(`Unsupported disk chart: ${reason}`);
  };
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const count: number = input.verticesMm.length;
  if (
    count < 3 ||
    !input.triangles.length ||
    input.vertexKeys.length !== count ||
    input.vertexKeys.some(
      (key: string): boolean => typeof key !== "string" || !key.length,
    ) ||
    input.verticesMm.some(
      (p: C.Vector): boolean => p.length !== 3 || !p.every(Number.isFinite),
    ) ||
    !(
      input.cornerDegrees > 0 &&
      input.cornerDegrees < 180 &&
      Number.isFinite(input.cornerDegrees)
    )
  )
    fail(
      "finite positions, physical keys and a corner threshold in (0,180) are required",
    );
  const physicalPositions: Map<string, C.Vector> = new Map();
  const admitPhysicalKey: (key: string, point: C.Vector) => void = (
    key: string,
    point: C.Vector,
  ): void => {
    const previous: C.Vector | undefined = physicalPositions.get(key);
    if (
      previous &&
      !previous.every((x: number, k: number): boolean => x === point[k])
    )
      fail("one physical key has conflicting coordinates");
    physicalPositions.set(key, point);
  };
  input.vertexKeys.forEach((key: string, id: number): void =>
    admitPhysicalKey(key, input.verticesMm[id]!),
  );
  const boundary: Set<number> = new Set(input.boundaryCycle);
  if (
    input.boundaryCycle.length < 3 ||
    boundary.size !== input.boundaryCycle.length ||
    input.boundaryCycle.some(
      (id: number): boolean =>
        !Number.isSafeInteger(id) || id < 0 || id >= count,
    )
  )
    fail("one unrepeated complete boundary cycle is required");
  type Edge = { a: number; b: number; face: number };
  const edges: Map<string, Edge[]> = new Map(),
    faces: Set<string> = new Set(),
    used: Set<number> = new Set();
  const adjacent: number[][] = Array.from(input.triangles, (): number[] => []);
  const links: Map<number, Set<number>>[] = Array.from(
    input.verticesMm,
    (): Map<number, Set<number>> => new Map(),
  );
  const normal: (
    a: C.Vector,
    b: C.Vector,
    c: C.Vector,
  ) => [number, number, number] = (
    a: C.Vector,
    b: C.Vector,
    c: C.Vector,
  ): [number, number, number] => {
    const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
      v: number[] = c.map((x: number, k: number): number => x - a[k]!);
    const n: [number, number, number] = [
      u[1]! * v[2]! - u[2]! * v[1]!,
      u[2]! * v[0]! - u[0]! * v[2]!,
      u[0]! * v[1]! - u[1]! * v[0]!,
    ];
    const length: number = Math.hypot(...n);
    if (!(length > 0 && Number.isFinite(length)))
      fail("a private triangle is degenerate or its normal is unrepresentable");
    return [n[0] / length, n[1] / length, n[2] / length];
  };
  const normals: C.Vector[] = [];
  input.triangles.forEach(
    (triangle: readonly [number, number, number], face: number): void => {
      if (
        triangle.length !== 3 ||
        new Set(triangle).size !== 3 ||
        triangle.some(
          (id: number): boolean =>
            !Number.isSafeInteger(id) || id < 0 || id >= count,
        )
      )
        fail("private triangle addresses are invalid");
      const word: string = [...triangle]
        .sort((a: number, b: number): number => a - b)
        .join(":");
      if (faces.has(word)) fail("duplicate private triangles are unsupported");
      faces.add(word);
      normals.push(
        normal(
          input.verticesMm[triangle[0]]!,
          input.verticesMm[triangle[1]]!,
          input.verticesMm[triangle[2]]!,
        ),
      );
      for (let k: number = 0; k < 3; k++) {
        const a: number = triangle[k]!,
          b: number = triangle[(k + 1) % 3]!,
          c: number = triangle[(k + 2) % 3]!;
        used.add(a);
        const key: string = edgeKey(a, b),
          rows: Edge[] = edges.get(key) ?? [];
        rows.push({ a, b, face });
        edges.set(key, rows);
        for (const [x, y] of [
          [b, c],
          [c, b],
        ]) {
          const neighbors: Set<number> = links[a]!.get(x) ?? new Set();
          neighbors.add(y);
          links[a]!.set(x, neighbors);
        }
      }
    },
  );
  if (used.size !== count)
    fail("unused vertices do not belong to the supplied disk");
  let boundaryEdges: number = 0;
  for (const rows of edges.values()) {
    if (rows.length === 1) boundaryEdges++;
    else if (
      rows.length !== 2 ||
      rows[0]!.a !== rows[1]!.b ||
      rows[0]!.b !== rows[1]!.a
    )
      fail("edge incidence is nonmanifold or winding is incoherent");
    else {
      adjacent[rows[0]!.face]!.push(rows[1]!.face);
      adjacent[rows[1]!.face]!.push(rows[0]!.face);
    }
  }
  if (
    boundaryEdges !== input.boundaryCycle.length ||
    count - edges.size + input.triangles.length !== 1
  )
    fail("the complete topology is not a one-boundary genus-zero disk");
  for (let i: number = 0; i < input.boundaryCycle.length; i++) {
    const a: number = input.boundaryCycle[i]!,
      b: number = input.boundaryCycle[(i + 1) % input.boundaryCycle.length]!,
      rows: Edge[] | undefined = edges.get(edgeKey(a, b));
    if (rows?.length !== 1 || rows[0]!.a !== a || rows[0]!.b !== b)
      fail(
        "the supplied boundary disagrees with coherent source triangle incidence",
      );
  }
  const reached: Set<number> = new Set([0]),
    queue: number[] = [0];
  for (let i: number = 0; i < queue.length; i++)
    for (const next of adjacent[queue[i]!]!)
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
  if (reached.size !== input.triangles.length)
    fail("source faces are not one edge-connected disk");
  for (let id: number = 0; id < count; id++) {
    const link: Map<number, Set<number>> = links[id]!,
      starts: number[] = [...link.keys()],
      visited: Set<number> = new Set([starts[0]!]),
      walk: number[] = [starts[0]!];
    for (let k: number = 0; k < walk.length; k++)
      for (const next of link.get(walk[k]!)!)
        if (!visited.has(next)) {
          visited.add(next);
          walk.push(next);
        }
    const ends: number = [...link.values()].filter(
      (neighbors: Set<number>): boolean => neighbors.size === 1,
    ).length;
    if (
      visited.size !== link.size ||
      [...link.values()].some(
        (neighbors: Set<number>): boolean =>
          neighbors.size < 1 || neighbors.size > 2,
      ) ||
      (boundary.has(id) ? ends !== 2 : ends !== 0)
    )
      fail("a source vertex link is not a boundary path or interior circle");
  }
  const {
    turns,
    features,
    anchor,
    cycle,
    units,
    total,
    scaled,
    perimeterMm,
    quarterMm,
  }: ReturnType<typeof prepareRecoveryDiskBoundary> =
    prepareRecoveryDiskBoundary(input, fail);
  const verticesMm: C.Vector[] = input.verticesMm.map(
      (p: C.Vector): C.Vector => [...p],
    ),
    vertexKeys: string[] = [...input.vertexKeys];
  const insertedBoundaryVertices: ReturnType<
      typeof RecoveryDiskChart
    >["insertedBoundaryVertices"] = [],
    cuts: Map<string, { id: number; offset: bigint }[]> = new Map();
  const corners: number[] = [cycle[0]!];
  let prefix: bigint = 0n,
    edge: number = 0;
  for (let quarter: number = 1; quarter < 4; quarter++) {
    const target: bigint = BigInt(quarter) * total;
    while (4n * (prefix + units[edge]!) < target) {
      prefix += units[edge]!;
      edge++;
    }
    const a: number = cycle[edge]!,
      b: number = cycle[(edge + 1) % cycle.length]!;
    if (target === 4n * prefix) {
      corners.push(a);
      continue;
    }
    if (target === 4n * (prefix + units[edge]!)) {
      corners.push(b);
      continue;
    }
    const offset: bigint = target - 4n * prefix,
      denominator: bigint = 4n * units[edge]!,
      forward: boolean = input.vertexKeys[a]! < input.vertexKeys[b]!;
    const first: number = forward ? a : b,
      last: number = forward ? b : a,
      numerator: bigint = forward ? offset : denominator - offset;
    const num: ReturnType<typeof scaled> = scaled(numerator),
      den: ReturnType<typeof scaled> = scaled(denominator),
      fraction: number =
        (num.mantissa / den.mantissa) * 2 ** (num.shift - den.shift);
    if (!(fraction > 0 && fraction < 1 && Number.isFinite(fraction)))
      fail("an interior boundary quarter is not representable");
    const key: string = `disk-boundary:${JSON.stringify([input.vertexKeys[first], input.vertexKeys[last]])}:${fraction}`;
    const point: C.Vector = [0, 1, 2].map(
      (k: number): number =>
        input.verticesMm[first]![k]! +
        fraction * (input.verticesMm[last]![k]! - input.verticesMm[first]![k]!),
    ) as [number, number, number];
    if (
      !point.every(Number.isFinite) ||
      [first, last].some((id: number): boolean =>
        point.every(
          (x: number, k: number): boolean => x === input.verticesMm[id]![k],
        ),
      )
    )
      fail("a new boundary observation collapses to an endpoint");
    admitPhysicalKey(key, point);
    const id: number = verticesMm.length;
    verticesMm.push(point);
    vertexKeys.push(key);
    corners.push(id);
    insertedBoundaryVertices.push({
      id,
      key,
      edgeKeys: [input.vertexKeys[first]!, input.vertexKeys[last]!],
      fractionFromFirst: fraction,
      pointMm: point,
    });
    const word: string = edgeKey(a, b),
      rows: { id: number; offset: bigint }[] = cuts.get(word) ?? [];
    rows.push({ id, offset });
    cuts.set(word, rows);
  }
  const triangles: [number, number, number][] = [];
  input.triangles.forEach(
    (triangle: readonly [number, number, number], face: number): void => {
      const children: [number, number, number][] = [[...triangle]];
      for (let k: number = 0; k < 3; k++) {
        const a: number = triangle[k]!,
          b: number = triangle[(k + 1) % 3]!,
          rows: { id: number; offset: bigint }[] | undefined = cuts.get(
            edgeKey(a, b),
          );
        if (!rows) continue;
        if (edges.get(edgeKey(a, b))!.length !== 1)
          fail("a proposed subdivision is not on a unique boundary face");
        const child: number = children.findIndex(
          (item: [number, number, number]): boolean =>
            item.some(
              (id: number, i: number): boolean =>
                id === a && item[(i + 1) % 3] === b,
            ),
        );
        if (child < 0)
          fail(
            "the original boundary segment lost its incident private triangle",
          );
        const current: [number, number, number] = children[child]!,
          at: number = current.indexOf(a),
          opposite: number = current[(at + 2) % 3]!;
        const path: number[] = [
          a,
          ...rows
            .sort((x: { offset: bigint }, y: { offset: bigint }): number =>
              x.offset < y.offset ? -1 : x.offset > y.offset ? 1 : 0,
            )
            .map((row: { id: number }): number => row.id),
          b,
        ];
        children.splice(
          child,
          1,
          ...path
            .slice(1)
            .map((id: number, i: number): [number, number, number] => [
              path[i]!,
              id,
              opposite,
            ]),
        );
      }
      for (const child of children) {
        const n: C.Vector = normal(
          verticesMm[child[0]]!,
          verticesMm[child[1]]!,
          verticesMm[child[2]]!,
        );
        if (
          !(
            n.reduce(
              (sum: number, value: number, k: number): number =>
                sum + value * normals[face]![k]!,
              0,
            ) > 0
          )
        )
          fail("a subdivided private triangle changed coherent winding");
        triangles.push(child);
      }
    },
  );
  const expanded: number[] = [];
  for (let i: number = 0; i < cycle.length; i++) {
    const a: number = cycle[i]!,
      b: number = cycle[(i + 1) % cycle.length]!;
    expanded.push(
      a,
      ...(cuts.get(edgeKey(a, b)) ?? []).map(
        (row: { id: number }): number => row.id,
      ),
    );
  }
  const indices: number[] = corners.map((id: number): number =>
    expanded.indexOf(id),
  );
  if (
    new Set(corners).size !== 4 ||
    indices.some(
      (value: number, i: number): boolean =>
        value < 0 || (i > 0 && value <= indices[i - 1]!),
    )
  )
    fail("four ordered distinct chart corners were not established");
  const sides: [number[], number[], number[], number[]] = [
    expanded.slice(indices[0], indices[1]! + 1),
    expanded.slice(indices[1], indices[2]! + 1),
    expanded.slice(indices[2], indices[3]! + 1).reverse(),
    [...expanded.slice(indices[3]), expanded[0]!].reverse(),
  ];
  return {
    verticesMm,
    triangles,
    vertexKeys,
    sides,
    insertedBoundaryVertices,
    cornerRule: {
      anchorKey: input.vertexKeys[cycle[0]!]!,
      anchorTurningDegrees: turns[anchor]!,
      featureThresholdDegrees: input.cornerDegrees,
      selection: features.length
        ? "maximum-qualified-turn-then-key"
        : "minimum-key-without-qualified-turn",
      quarterLengthsMm: [quarterMm, quarterMm, quarterMm, quarterMm],
      perimeterMm,
    },
  };
}
