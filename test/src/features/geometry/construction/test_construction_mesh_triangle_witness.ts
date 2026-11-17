import {
  type AutoMovieSolidMeshConstraints,
  AutoMovieSolidMeshPlan,
  insertAutoMovieSolidMeshPoints,
  orientAutoMovieSolidChart as orient,
  probeAutoMovieSolidMesh as probe,
  witnessAutoMovieSolidChartTriangle as witness,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Source-chart coordinate: station mm and phase radians in the recorded cases, plain chart units in the made ones. */
type Point = readonly [number, number];

/** One exact orientation of the input that a case is about, read from the receipt or fixed by dyadic construction. */
interface Premise {
  /** What the sign shows. */ label: string;

  /** Three represented points, in order. */ points: readonly [Point, Point, Point];

  /** The exact sign the input has. */ sign: number;
}

/** A local partition whose every point must enter one triangulation. */
interface Case {
  /** Scenario address. */ name: string;

  /** Original IDs and exact stored chart numbers; interior points are inserted in this order. */ points: ReadonlyMap<number, Point>;

  /** Existing triangle population before insertion. */ triangles: readonly AutoMovieSolidMeshPlan.ITriangle[];

  /** Directed region boundary, held as original constraints. */ boundary: readonly number[];

  /** Exact signs of the input this case reproduces. */ premises: readonly Premise[];

  /** Whether the region planner, from the boundary alone, is held to the same contract. */ plan: boolean;
}

/** The face period of the recorded trunk and plate, also used for the made cases so their lift arithmetic runs. */
const PERIOD: number = 2 * Math.PI;

/** One unit in the last place of a phase in [1, 2): no binary64 number lies strictly between 1.5 - ULP and 1.5. */
const ULP: number = 2 ** -52;

/**
 * Interior insertion keeps every original point when exact signs make thin triangles.
 *
 * Scenarios:
 * 1. The recorded trunk (a point strictly inside a triangle, ulp-collinear
 *    with an edge) and plate (a point exactly on a diagonal beside an
 *    ulp-collinear sliver) partitions triangulate by insertion and by the
 *    region planner with every original point present.
 * 2. A made row of five points one ulp below a source constraint, whose
 *    triangles against that constraint hold no representable interior point,
 *    triangulates by insertion and by the region planner.
 * 3. A made point exactly on an unconstrained diagonal beside a one-ulp
 *    sliver splits both triangles; a grid-like row of five ulp-collinear
 *    points inside a regular triangle inserts and plans.
 * 4. A point exactly on a shared source constraint or an unshared boundary
 *    is refused by name; the same point on an unconstrained diagonal is
 *    inserted.
 * 5. A regular triangle with one interior point splits into three; with none
 *    it plans as itself.
 * 6. The boundary probe and corridor witness find a dyadic thin triangle's
 *    interior; a MIN_VALUE simplex has none, and both refuse it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public insertion, region planner, probe and corridor witness on in-memory charts and inspects the returned triangles' IDs, lifts, exact signs and source edges. It catches a moved, dropped or welded point, a lost or crossed constraint, a nonpositive or overlapping triangle and a silent publication of an unrepresentable simplex; it allows any valid triangulation of the prescribed points.
 * @evidence contracts/development/testing.md#independent-expectations A triangulated disk with V points, b of them on its boundary, has 2V - b - 2 triangles by Euler's relation; every triangle must be exactly positive, no other point may lie in its closed chart triangle, and each directed boundary edge must be used once. The premises are the receipt's recorded exact signs or dyadic arithmetic: no binary64 number lies strictly between 1.5 - 2^-52 and 1.5, and a positive coordinate below MIN_VALUE is not representable. A triangulation that passes all of these is valid whichever diagonals it chose.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a point strictly inside, exactly on an unconstrained diagonal, exactly on a source constraint and on an unshared boundary; mandatory slivers along a constraint against avoidable ones inside a regular triangle; an ordinary split and an unsplit triangle; a representable thin interior and an unrepresentable simplex. test_construction_mesh_plan owns rectangles, holes, periodic rails and the refusal diagnostic; Human skin is not certified here.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory CPU unit test_construction_mesh_triangle_witness, discoverable through --include construction_mesh_triangle_witness, with no source callback, process, renderer, global replacement or fixture file.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios, chart units, the premises each case reproduces, the Euler and exact-sign oracle and the original-ID preservation it pins.
 */
export function test_construction_mesh_triangle_witness(): void {
  const failures: string[] = [];

  // The midpoint of 1.5 - ULP and 1.5 rounds onto one of them, so the two are adjacent binary64 numbers.
  const between: number = 1.5 - ULP / 2;
  if (!(between === 1.5 || between === 1.5 - ULP))
    failures.push("one-ulp premise: a binary64 number lies between 1.5 - 2^-52 and 1.5");
  for (const input of cases()) {
    const unmet: string[] = input.premises
      .filter((premise: Premise): boolean => orient(...premise.points) !== premise.sign)
      .map((premise: Premise): string => premise.label);
    if (unmet.length !== 0) {
      failures.push(`${input.name}: input premise unmet, contract not read: ${unmet.join(", ")}`);
      continue;
    }
    try {
      local(input, failures);
    } catch (error: unknown) {
      failures.push(`${input.name}: ${String(error)}`);
    }
  }
  refusals(failures);
  ordinary(failures);
  capability(failures);
  TestValidator.predicate(
    "Thin-triangle insertion findings: " + failures.join(" | "),
    () => failures.length === 0,
  );
}

/** The recorded partitions verbatim, then the made dyadic and grid-like rows. */
function cases(): Case[] {
  const trunk: Map<number, Point> = new Map([
    [86606, [528, 1.8849555921538756]], [201974, [517, 1.9477874452256716]],
    [201980, [519, 1.9320794819577227]], [201997, [522, 1.9163715186897738]],
    [202023, [525, 1.900663555421825]],
  ]);
  const plate: Map<number, Point> = new Map([
    [442546, [14.0078125, 5.9465860942949655]], [442595, [15.8984375, 6.058785831923172]],
    [442597, [15.8984375, 6.170985569551379]], [442517, [13.0625, 5.8343863566667595]],
    [442516, [14.0078125, 5.8343863566667595]], [444984, [14.953125, 6.058785831923172]],
  ]);
  const row: Map<number, Point> = new Map([
    [0, [512, 1.5]], [1, [518, 0.5]], [2, [524, 1.5]],
    [3, [515, 1.5 - ULP]], [4, [518, 1.5 - ULP]], [5, [521, 1.5 - ULP]],
  ]);
  const diagonal: Map<number, Point> = new Map([
    [20, [516, 1.5]], [21, [520, 0.5]], [22, [524, 1.5]], [23, [512, 1.5 + ULP]], [24, [520, 1.5]],
  ]);

  // Stations 3 mm apart and phases pi/200 apart, as a residual grid's anti-diagonal: one chart line in intent.
  const grid: Map<number, Point> = new Map([[10, [490, 2.1]], [11, [520, 1.6]], [12, [520, 2.3]]]);
  for (let k: number = 0; k < 5; k++) grid.set(13 + k, [500 + 3 * k, ((130 - k) * Math.PI) / 200]);
  const at: (points: ReadonlyMap<number, Point>, ...ids: number[]) => [Point, Point, Point] = (
    points: ReadonlyMap<number, Point>, ...ids: number[]
  ): [Point, Point, Point] => [points.get(ids[0]!)!, points.get(ids[1]!)!, points.get(ids[2]!)!];
  return [
    {
      name: "recorded trunk", points: trunk, boundary: [86606, 201974, 201980], plan: true,
      triangles: [
        { vertices: [86606, 201974, 201997], lifts: [0, 0, 0] },
        { vertices: [201980, 86606, 201997], lifts: [0, 0, 0] },
        { vertices: [201974, 201980, 201997], lifts: [0, 0, 0] },
      ],
      premises: [
        { label: "the refused fan triangle is exactly positive", points: at(trunk, 201997, 86606, 202023), sign: 1 },
        { label: "its recorded float centroid lies on its first side", points: [trunk.get(201997)!, trunk.get(86606)!, [525, 1.9006635554218247]], sign: 0 },
        { label: "the point is strictly inside 86606/201974/201997 (first side)", points: at(trunk, 86606, 201974, 202023), sign: 1 },
        { label: "the point is strictly inside 86606/201974/201997 (second side)", points: at(trunk, 201974, 201997, 202023), sign: 1 },
        { label: "the existing ulp-collinear triangle is exactly positive", points: at(trunk, 201980, 86606, 201997), sign: 1 },
      ],
    },
    {
      name: "recorded plate", points: plate, boundary: [442546, 442595, 442597, 442517, 442516], plan: true,
      triangles: [
        { vertices: [442546, 442595, 442597], lifts: [0, 0, 0] },
        { vertices: [442517, 442546, 442597], lifts: [0, 0, 0] },
        { vertices: [442517, 442516, 442546], lifts: [0, 0, 0] },
      ],
      premises: [
        { label: "the refused fan triangle is exactly positive", points: at(plate, 442517, 442546, 444984), sign: 1 },
        { label: "its recorded float centroid lies outside its third side", points: [plate.get(444984)!, plate.get(442517)!, [14.0078125, 5.946586094294966]], sign: -1 },
        { label: "the source constraint does not see the point", points: at(plate, 442516, 442546, 444984), sign: -1 },
        { label: "the point lies exactly on the diagonal 442546/442597", points: at(plate, 442546, 442597, 444984), sign: 0 },
        { label: "the ulp-collinear triangle beside that diagonal is exactly positive", points: at(plate, 442517, 442546, 442597), sign: 1 },
      ],
    },
    {
      name: "made row under a constraint", points: row, boundary: [0, 1, 2], plan: true,
      triangles: [{ vertices: [0, 1, 2], lifts: [0, 0, 0] }],
      premises: [3, 4, 5].map((id: number): Premise => ({
        label: `point ${id} lies one ulp inside the constraint`, points: at(row, 2, 0, id), sign: 1,
      })).concat([{ label: "the row is exactly collinear", points: at(row, 3, 4, 5), sign: 0 }]),
    },
    {
      name: "made point on a diagonal beside a sliver", points: diagonal, boundary: [20, 21, 22, 23], plan: false,
      triangles: [
        { vertices: [20, 21, 22], lifts: [0, 0, 0] },
        { vertices: [23, 20, 22], lifts: [0, 0, 0] },
      ],
      premises: [
        { label: "the point lies exactly on the diagonal", points: at(diagonal, 20, 22, 24), sign: 0 },
        { label: "the sliver beside it is exactly positive", points: at(diagonal, 23, 20, 22), sign: 1 },
      ],
    },
    {
      name: "grid-like row inside a triangle", points: grid, boundary: [10, 11, 12], plan: true,
      triangles: [{ vertices: [10, 11, 12], lifts: [0, 0, 0] }],
      premises: [],
    },
  ];
}

/** Closed local source boundaries use the same original IDs and zero relative lift. */
function edges(ids: readonly number[]): AutoMovieSolidMeshConstraints.ISegment[] {
  return ids.map((id: number, k: number): AutoMovieSolidMeshConstraints.ISegment =>
    ({ a: id, b: ids[(k + 1) % ids.length]!, turn: 0 }));
}

/** Membership is the closed union of the case's own input triangles, read by exact signs. */
function membership(input: Case): (s: number, t: number) => boolean {
  return (s: number, t: number): boolean =>
    input.triangles.some((triangle: AutoMovieSolidMeshPlan.ITriangle): boolean =>
      triangle.vertices.every((id: number, k: number): boolean => orient(
        input.points.get(id)!, input.points.get(triangle.vertices[(k + 1) % 3]!)!, [s, t],
      ) >= 0),
    );
}

/** Insert into the given population, and plan from the boundary alone where the case asks, without mutating the inputs. */
function local(input: Case, failures: string[]): void {
  const constraints: AutoMovieSolidMeshConstraints.ISegment[] = edges(input.boundary);
  const before: string = JSON.stringify({ points: [...input.points], triangles: input.triangles, constraints });
  const keeps: (s: number, t: number) => boolean = membership(input);
  inspect(input, "insertion", insertAutoMovieSolidMeshPoints(
    input.points, constraints, input.triangles, keeps, PERIOD, true,
  ), failures);
  if (input.plan) {
    const plan: AutoMovieSolidMeshPlan.IPlan | string = AutoMovieSolidMeshPlan.triangulate(
      input.points, constraints, keeps, PERIOD, true,
    );
    inspect(input, "region", typeof plan === "string" ? plan : plan.triangles, failures);
  }
  if (JSON.stringify({ points: [...input.points], triangles: input.triangles, constraints }) !== before)
    failures.push(input.name + ": original points or source constraints mutated");
}

/** A valid triangulation of the disk: Euler's count, every ID, exact positive and empty closed triangles, lifts zero and each boundary edge once. */
function inspect(input: Case, stage: string, made: readonly AutoMovieSolidMeshPlan.ITriangle[] | string, failures: string[]): void {
  const label: string = `${input.name} ${stage}`;
  if (typeof made === "string") {
    failures.push(`${label}: refused: ${made.split("; diagnostic=")[0]}`);
    return;
  }
  const expected: number = 2 * input.points.size - input.boundary.length - 2;
  if (made.length !== expected) failures.push(`${label}: ${made.length} triangles, Euler requires ${expected}`);
  for (const id of input.points.keys())
    if (!made.some((triangle: AutoMovieSolidMeshPlan.ITriangle): boolean => triangle.vertices.includes(id)))
      failures.push(`${label}: original point ${id} lost`);
  for (const triangle of made) {
    const corners: Point[] = triangle.vertices.map((id: number): Point => input.points.get(id)!);
    if (triangle.lifts.some((lift: number): boolean => lift !== 0))
      failures.push(`${label}: triangle ${triangle.vertices.join("/")} changed its cover`);
    if (orient(corners[0]!, corners[1]!, corners[2]!) <= 0)
      failures.push(`${label}: triangle ${triangle.vertices.join("/")} is not exactly positive`);
    for (const [id, point] of input.points)
      if (!triangle.vertices.includes(id) && corners.every((corner: Point, k: number): boolean =>
        orient(corner, corners[(k + 1) % 3]!, point) >= 0))
        failures.push(`${label}: point ${id} lies in triangle ${triangle.vertices.join("/")}`);
  }
  for (const edge of edges(input.boundary)) {
    let forward: number = 0;
    let backward: number = 0;
    for (const triangle of made)
      for (let k: number = 0; k < 3; k++) {
        const id: number = triangle.vertices[k]!;
        const next: number = triangle.vertices[(k + 1) % 3]!;
        if (id === edge.a && next === edge.b) forward++;
        if (id === edge.b && next === edge.a) backward++;
      }
    if (forward !== 1 || backward !== 0)
      failures.push(`${label}: source boundary ${edge.a}->${edge.b} used ${forward} times forward and ${backward} backward`);
  }
}

/** A point exactly on a source constraint or an unshared boundary has no authoritative subdivision; on a free diagonal it does. */
function refusals(failures: string[]): void {
  const square: Map<number, Point> = new Map([[0, [0, 0]], [1, [4, 0]], [2, [4, 4]], [3, [0, 4]], [4, [2, 2]]]);
  const halves: AutoMovieSolidMeshPlan.ITriangle[] = [
    { vertices: [0, 1, 2], lifts: [0, 0, 0] },
    { vertices: [0, 2, 3], lifts: [0, 0, 0] },
  ];
  const all: (u: number, v: number) => boolean = (): boolean => true;
  const constrained: AutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    square, [...edges([0, 1, 2, 3]), { a: 0, b: 2, turn: 0 }], halves, all,
  );
  if (typeof constrained !== "string" || !constrained.includes("authoritative source-edge subdivision"))
    failures.push(`point on a source constraint was not refused by name: ${JSON.stringify(constrained)}`);
  const free: AutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    square, edges([0, 1, 2, 3]), halves, all,
  );
  if (typeof free === "string" || free.length !== 4 ||
    !free.every((triangle: AutoMovieSolidMeshPlan.ITriangle): boolean => triangle.vertices.includes(4)))
    failures.push(`point on a free diagonal did not split both triangles: ${JSON.stringify(free)}`);
  const edge: Map<number, Point> = new Map([[0, [0, 0]], [1, [4, 0]], [2, [0, 4]], [3, [2, 0]]]);
  const unshared: AutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    edge, edges([0, 1, 2]), [{ vertices: [0, 1, 2], lifts: [0, 0, 0] }], all,
  );
  if (typeof unshared !== "string" || !unshared.includes("unshared boundary"))
    failures.push(`point on an unshared boundary was not refused by name: ${JSON.stringify(unshared)}`);
}

/** A regular triangle splits into three around a strict interior point and plans as itself without one. */
function ordinary(failures: string[]): void {
  const points: Map<number, Point> = new Map([[0, [0, 0]], [1, [4, 0]], [2, [0, 4]], [3, [1, 1]]]);
  const inside: (u: number, v: number) => boolean = (u: number, v: number): boolean => u > 0 && v > 0 && u + v < 4;
  const split: AutoMovieSolidMeshPlan.ITriangle[] | string = insertAutoMovieSolidMeshPoints(
    points, edges([0, 1, 2]), [{ vertices: [0, 1, 2], lifts: [0, 0, 0] }], inside,
  );
  if (typeof split === "string" || split.length !== 3 ||
    !split.every((triangle: AutoMovieSolidMeshPlan.ITriangle): boolean => triangle.vertices.includes(3)))
    failures.push(`ordinary interior point did not split its triangle into three: ${JSON.stringify(split)}`);
  const alone: Map<number, Point> = new Map([[0, [0, 0]], [1, [4, 0]], [2, [0, 4]]]);
  const plan: AutoMovieSolidMeshPlan.IPlan | string = AutoMovieSolidMeshPlan.triangulate(alone, edges([0, 1, 2]), inside);
  if (typeof plan === "string" || plan.triangles.length !== 1 ||
    ![0, 1, 2].every((id: number): boolean => plan.triangles[0]!.vertices.includes(id)))
    failures.push("ordinary triangle did not plan as itself");
}

/** The probe and witness find a representable thin interior and refuse an unrepresentable one. */
function capability(failures: string[]): void {
  const dyadic: Map<number, Point> = new Map([[0, [0, 0]], [1, [4, 4]], [2, [4, 4 + 2 ** -40]]]);
  const boundary: AutoMovieSolidMeshConstraints.ISegment[] = edges([0, 1, 2]);
  const found: Point | string = probe(dyadic, boundary, { vertices: [0, 1, 2], lifts: [0, 0, 0], winding: 0 }, PERIOD);
  if (typeof found === "string" || ![0, 1, 2].every((id: number, k: number): boolean =>
    orient(dyadic.get(id)!, dyadic.get((k + 1) % 3)!, found) > 0))
    failures.push(`dyadic thin triangle: probe found no strict interior: ${JSON.stringify(found)}`);
  else if (!boundary.some((edge: AutoMovieSolidMeshConstraints.ISegment): boolean =>
    witness(dyadic, boundary, edge, found, PERIOD) === true))
    failures.push("dyadic thin triangle: no exact empty-corridor witness");
  const tiny: Map<number, Point> = new Map([[0, [0, 0]], [1, [Number.MIN_VALUE, 0]], [2, [0, Number.MIN_VALUE]]]);
  if (typeof probe(tiny, boundary, { vertices: [0, 1, 2], lifts: [0, 0, 0], winding: 0 }, undefined) !== "string")
    failures.push("unrepresentable simplex invented an interior witness");
  if (typeof AutoMovieSolidMeshPlan.triangulate(tiny, boundary, (): boolean => true) !== "string")
    failures.push("unrepresentable simplex was silently published or dropped");
}
