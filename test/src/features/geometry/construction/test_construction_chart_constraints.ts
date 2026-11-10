import { AutoMovieSolidMeshConstraints } from "@automovie/engine";

/** One existing chart point and its authoritative mesh identity. */
type Vertex = [number, readonly [number, number]];

/**
 * Shared chart constraints retain their indexed subdivisions and source history.
 *
 * Scenarios:
 * 1. A T junction, reversed partial overlap and supplied four-way crossing split into independently prescribed subedges at three units. Degree four is retained instead of being reduced to one outgoing edge.
 * 2. An unsupplied crossing or two coincident authoritative IDs fail explicitly; no new point, weld or implicit repair is accepted.
 * 3. A periodic seam T junction and its three-period translation have the same indexed edges/turns. Opposite semicircles with the same endpoint IDs remain different constraints, while a full-turn self-edge retains its winding.
 * 4. Invalid period, endpoint, turn, zero span and nonfinite coordinates remain named failures. Inputs and repeated-call output ownership are checked independently.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads indexed subconstraint output and provenance, distinguishing a shared-index arrangement primitive from a simple cycle Map or endpoint-pair cancellation. Production MeshPlan uses this same split owner and face tessellation consumes its plan; this question isolates subdivision rather than proving that complete consumer.
 * @evidence contracts/development/testing.md#independent-expectations Literal expected edges follow line order on horizontal/diagonal segments. The seam interval 5.5 to6.5 splits at6, represented by the original phase0 vertex plus one period. Opposite half-turn arcs differ by their explicit cover integer, independently of coordinate proximity.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes collinear subdivisions, overlaps, both source directions, degree-four crossings, missing authority, periodic winding/translation, three units, empty input and explicit invalid arithmetic. It does not claim complete kept-face triangulation or f1 closure.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_chart_constraints; starts no process, Human generation, host, renderer or external fixture.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A T junction, reversed partial overlap and supplied four-way crossing split into independently prescribed subedges at three units. Degree...).
 */
export function test_construction_chart_constraints(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000]) {
    inspect(
      failures,
      `T junction ${scale}`,
      [
        [0, [0, 0]],
        [1, [4 * scale, 0]],
        [2, [2 * scale, 0]],
        [3, [2 * scale, 2 * scale]],
      ],
      [
        { a: 0, b: 1, turn: 0 },
        { a: 2, b: 3, turn: 0 },
      ],
      "0/2/0:0;1/2/0:0;2/3/0:1",
    );
    inspect(
      failures,
      `overlap ${scale}`,
      [
        [0, [0, 0]],
        [1, [scale, 0]],
        [2, [3 * scale, 0]],
        [3, [4 * scale, 0]],
      ],
      [
        { a: 0, b: 2, turn: 0 },
        { a: 3, b: 1, turn: 0 },
      ],
      "0/1/0:0;1/2/0:0,1;2/3/0:1",
    );
    const cross: Vertex[] = [
      [0, [0, 0]],
      [1, [4 * scale, 4 * scale]],
      [2, [0, 4 * scale]],
      [3, [4 * scale, 0]],
      [4, [2 * scale, 2 * scale]],
    ];
    const diagonal: AutoMovieSolidMeshConstraints.ISegment[] = [
      { a: 0, b: 1, turn: 0 },
      { a: 2, b: 3, turn: 0 },
    ];
    inspect(
      failures,
      `shared crossing ${scale}`,
      cross,
      diagonal,
      "0/4/0:0;1/4/0:0;2/4/0:1;3/4/0:1",
    );
    refuse(
      failures,
      `unshared crossing ${scale}`,
      AutoMovieSolidMeshConstraints.split(new Map(cross.slice(0, 4)), diagonal),
      "cross without a supplied shared vertex",
    );
    for (const turns of [0, 3]) {
      const offset: number = turns * 6 * scale;
      const seam: Vertex[] = [
        [0, [0, 5.5 * scale + offset]],
        [1, [0, 0.5 * scale + offset]],
        [2, [0, offset]],
        [3, [scale, offset]],
      ];
      inspect(
        failures,
        `seam ${scale}/${turns}`,
        seam,
        [
          { a: 0, b: 1, turn: 1 },
          { a: 2, b: 3, turn: 0 },
        ],
        "0/2/1:0;1/2/0:0;2/3/0:1",
        6 * scale,
      );
      inspect(
        failures,
        `reverse seam overlap ${scale}/${turns}`,
        seam.slice(0, 3),
        [
          { a: 0, b: 1, turn: 1 },
          { a: 1, b: 0, turn: -1 },
        ],
        "0/2/1:0,1;1/2/0:0,1",
        6 * scale,
      );
    }
  }
  inspect(
    failures,
    "opposite periodic arcs",
    [
      [0, [0, 0]],
      [1, [0, 3]],
    ],
    [
      { a: 0, b: 1, turn: 0 },
      { a: 0, b: 1, turn: -1 },
    ],
    "0/1/-1:1;0/1/0:0",
    6,
  );
  inspect(
    failures,
    "full turn",
    [[0, [0, 0]]],
    [{ a: 0, b: 0, turn: 1 }],
    "0/0/1:0",
    6,
  );
  inspect(failures, "empty", [], [], "");

  const line: Vertex[] = [
    [0, [0, 0]],
    [1, [4, 0]],
    [2, [2, 0]],
    [3, [2, 0]],
  ];
  const segment: AutoMovieSolidMeshConstraints.ISegment[] = [
    { a: 0, b: 1, turn: 0 },
  ];
  refuse(
    failures,
    "coincident authorities",
    AutoMovieSolidMeshConstraints.split(new Map(line), segment),
    "coincident authoritative vertices",
  );
  for (const period of [0, -1, NaN, Infinity])
    refuse(
      failures,
      `invalid period ${period}`,
      AutoMovieSolidMeshConstraints.split(
        new Map(line.slice(0, 2)),
        segment,
        period,
      ),
      "period",
    );
  refuse(
    failures,
    "missing endpoint",
    AutoMovieSolidMeshConstraints.split(new Map(line.slice(0, 1)), segment),
    "endpoint",
  );
  refuse(
    failures,
    "fractional turn",
    AutoMovieSolidMeshConstraints.split(
      new Map(line.slice(0, 2)),
      [{ a: 0, b: 1, turn: 0.5 }],
      6,
    ),
    "turn",
  );
  refuse(
    failures,
    "nonperiodic turn",
    AutoMovieSolidMeshConstraints.split(new Map(line.slice(0, 2)), [
      { a: 0, b: 1, turn: 1 },
    ]),
    "turn",
  );
  refuse(
    failures,
    "zero span",
    AutoMovieSolidMeshConstraints.split(new Map(line.slice(0, 2)), [
      { a: 0, b: 0, turn: 0 },
    ]),
    "nonzero",
  );
  refuse(
    failures,
    "nonfinite point",
    AutoMovieSolidMeshConstraints.split(
      new Map([
        [0, [NaN, 0]],
        [1, [1, 1]],
      ]),
      segment,
    ),
    "finite",
  );
  refuse(
    failures,
    "long primitive",
    AutoMovieSolidMeshConstraints.split(
      new Map([
        [0, [0, 0]],
        [1, [0, 10]],
      ]),
      segment,
      6,
    ),
    "single-period",
  );
  const membership: Map<number, readonly [number, number]> = new Map([
    [0, [0, 0]],
    [1, [4, 0]],
  ]);
  for (const [point, expected] of [
    [[0, 0], true],
    [[2, 0], true],
    [[4, 0], true],
    [[5, 0], false],
    [[2, Number.MIN_VALUE], false],
  ] as [readonly [number, number], boolean][]) {
    const actual: boolean | string = AutoMovieSolidMeshConstraints.contains(
      membership,
      [{ a: 0, b: 1, turn: 0 }],
      point,
    );
    if (actual !== expected)
      failures.push(
        `constraint membership ${point.join("/")}: ${actual}, expected ${expected}`,
      );
  }
  const periodic: Map<number, readonly [number, number]> = new Map([
    [0, [0, 0]],
  ]);
  if (
    AutoMovieSolidMeshConstraints.contains(
      periodic,
      [{ a: 0, b: 0, turn: 1 }],
      [0, 21],
      6,
    ) !== true ||
    AutoMovieSolidMeshConstraints.contains(
      periodic,
      [{ a: 0, b: 0, turn: 1 }],
      [Number.MIN_VALUE, 21],
      6,
    ) !== false
  )
    failures.push(
      "constraint membership lost its full-turn cover or exact off-edge distinction",
    );
  if (
    typeof AutoMovieSolidMeshConstraints.contains(
      membership,
      [{ a: 0, b: 1, turn: 1 }],
      [2, 0],
    ) !== "string"
  )
    failures.push("constraint membership admitted a nonperiodic turn");
  if (failures.length !== 0)
    throw new Error(`Chart constraint findings:\n${failures.join("\n")}`);
}

/** Compare exact indexed provenance, then verify borrowed inputs and owned output arrays. */
function inspect(
  failures: string[],
  label: string,
  values: Vertex[],
  segments: AutoMovieSolidMeshConstraints.ISegment[],
  expected: string,
  period?: number,
): void {
  const before: string = JSON.stringify({ values, segments });
  const vertices: Map<number, readonly [number, number]> = new Map(values);
  const made: AutoMovieSolidMeshConstraints.IEdge[] | string =
    AutoMovieSolidMeshConstraints.split(vertices, segments, period);
  if (typeof made === "string") {
    failures.push(`${label}: ${made}`);
    return;
  }
  const actual: string = signature(made);
  if (actual !== expected)
    failures.push(`${label}: ${actual}, expected ${expected}`);
  if (JSON.stringify({ values, segments }) !== before)
    failures.push(`${label}: input mutation`);
  if (made.length !== 0) {
    made[0]!.sources.push(999);
    const repeated: AutoMovieSolidMeshConstraints.IEdge[] | string =
      AutoMovieSolidMeshConstraints.split(vertices, segments, period);
    if (typeof repeated === "string" || signature(repeated) !== expected)
      failures.push(`${label}: retained mutable output`);
  }
}

/** Canonical endpoint/turn/source labels form an independent finite collection oracle. */
function signature(edges: AutoMovieSolidMeshConstraints.IEdge[]): string {
  return edges
    .map(
      (edge: AutoMovieSolidMeshConstraints.IEdge): string =>
        `${edge.a}/${edge.b}/${edge.turn}:${edge.sources.join(",")}`,
    )
    .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
    .join(";");
}

/** A failed premise is a named result, never a repaired or partly accepted constraint set. */
function refuse(
  failures: string[],
  label: string,
  result: AutoMovieSolidMeshConstraints.IEdge[] | string,
  expected: string,
): void {
  if (typeof result !== "string" || !result.includes(expected))
    failures.push(
      `${label}: expected ${expected}, received ${JSON.stringify(result)}`,
    );
}
