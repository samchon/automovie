import { TestValidator } from "@nestia/e2e";
import { AutoMovieHumanSplineCurve } from "../../../../packages/human/src/lofting/AutoMovieHumanSplineCurve";
import { AutoMovieHumanTrunkTapes as Tape } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkTapes";
import { AutoMovieHumanLoftChain as After } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftJet as Jet } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftJet";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLoftHorizontal as Horizontal } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftHorizontal";
import { AutoMovieHumanNeckCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanNeckCourse";
import { AutoMovieHumanNeckConstruction as Neck } from "../../../../packages/human/src/generation/AutoMovieHumanNeckConstruction";
import { HumanMeasurementSite as Reader } from "../../features/internal/HumanMeasurementSite";
import type { HumanAnatomy } from "../../features/internal/HumanAnatomy";

/**
 * Body measurement operators preserve world planes, nonplanar courses and Y jets.
 *
 * Scenarios:
 * 1. A nonlinear lifted tube retains its specified second station jets.
 * 2. Omitted second jets retain the original cubic interpretation.
 * 3. A tilted conical course is cut at world height rather than projected.
 * 4. Nonzero lift curvature forbids the flat-course shortcut even at zero keys.
 * 5. A four-contact three-dimensional course retains its physical length.
 * 6. Physical cardinal contacts differ from material quadrants on an asymmetric shape.
 * 7. An independently triangulated continuation reads the generated collar's tape.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the production loft evaluator, horizontal-plane evaluator, collar registration and 3D size solve; the independent final-triangle reader measures the generated collar. Known bad cubic-only Y interpolation, projected courses and material-quadrant addresses must disagree with the same independently specified shapes that sound construction satisfies. Findings are collected across the complete fixture round before failing.
 * @evidence contracts/testing.md#independent-expectations The lifted tube has the explicit physical polynomial s plus 50u squared plus 150u cubed minus 350u fourth plus 170u fifth, from independently prescribed end jets. The tilted cone's plane is the polar curve r=25-4cos(theta), integrated from its analytic speed. The R20 course has length four times integral hypot(10pi,40t-30t squared) over zero to one. Composite Simpson with 16384 subdivisions supplies reference lengths. The 1024-phase polygon's sub-0.002 mm chord error and 4096-phase course's sub-0.001 mm chord error bound the numeric allowances; 0.03 mm covers raw 256-point collar construction, spline resampling and the independent reader's 360 rays. No generated person, fitted body ratio or existing worst-case limit supplies an expectation.
 * @evidence contracts/testing.md#distinguishing-cases Covers present and missing second jets, interior hidden curvature, tilted and projected courses, nonplanar and projected perimeter, both physical lateral cardinal rays, asymmetric phase registration, fixed contact heights and the final triangle consumer. Whole-person anatomical validity, EventJoin and pose appearance remain with the nine-person anatomy and visual rounds.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_trunk_measurement. It builds synthetic arrays and one collar component without invoking HumanPeople preparation, a whole-person generator, a server, a process or a GPU. The independent triangle reader is test-only and is not imported by production closure code.
 */
export function test_human_trunk_measurement(): void {
  const failures: string[] = [];

  /** Keep every observation in this fixture round before the final assertion. */
  const assert: (name: string, condition: boolean) => void = (name: string, condition: boolean): void => { if (!condition) failures.push(name); };
  const count: number = 64;
  const coefficients: number[] = AutoMovieHumanSplineCurve.interpolate(Array.from({ length: count }, (_: unknown, j: number): [number, number] => [20 * Math.cos(2 * Math.PI * j / count), 20 * Math.sin(2 * Math.PI * j / count)]));
  const zero: number[] = coefficients.map((): number => 0);
  const chain: Chain = { name: "synthetic lifted tube", basis: "spline", order: count, samples: 512, rule: "polar", layers: [
    { y: 0, coefficients, slopes: zero, lift: Array<number>(count).fill(0), liftSlopes: Array<number>(count).fill(0), liftCurvatures: Array<number>(count).fill(0.01) },
    { y: 100, coefficients, slopes: zero, lift: Array<number>(count).fill(20), liftSlopes: Array<number>(count).fill(0), liftCurvatures: Array<number>(count).fill(0.02) },
  ] };
  const expected: (station: number) => number = (station: number): number => {
    const u: number = station / 100;
    return station + 50 * u ** 2 + 150 * u ** 3 - 350 * u ** 4 + 170 * u ** 5;
  };
  let oldWorst: number = 0;
  let newWorst: number = 0;
  for (let station: number = 0; station <= 100; station += 5) {
    oldWorst = Math.max(oldWorst, Math.abs(After.ring({ ...chain, layers: chain.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, liftCurvatures: undefined })) }, station, [0.7])[0]![1] - expected(station)));
    newWorst = Math.max(newWorst, Math.abs(After.ring(chain, station, [0.7])[0]![1] - expected(station)));
  }
  assert("old Y second jets ignored: red", oldWorst > 4);
  assert("new Y quintic: green", newWorst < 1e-9);
  const legacy: Chain = { ...chain, layers: chain.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, liftCurvatures: undefined })) };
  for (let station: number = 0; station <= 100; station += 5)
    assert("absent second jet preserves cubic", Math.abs(After.ring(legacy, station, [0.7])[0]![1] - (station + 20 * (3 * (station / 100) ** 2 - 2 * (station / 100) ** 3))) < 1e-10);

  const framed: Chain = { ...chain, layers: chain.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, curvatures: zero, frame: { origin: [0, layer.y, 0], u: [1, 0, 0], v: [0, 0, 1] }, frameSlopes: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] }, frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] } })) };
  for (let station: number = 0; station <= 100; station += 5) {
    const u: number = station / 100;
    const jet: Jet.IJet = Jet.at(framed, station, 0.7);
    const first: number = 1 + (100 * u + 450 * u ** 2 - 1400 * u ** 3 + 850 * u ** 4) / 100;
    const second: number = (100 + 900 * u - 4200 * u ** 2 + 3400 * u ** 3) / 10000;
    assert("exact jet point follows the same nonlinear Y", Math.abs(jet.p[1] - expected(station)) < 1e-9);
    assert("exact jet first derivative", Math.abs(jet.s[1] - first) < 1e-9);
    assert("exact jet second derivative", Math.abs(jet.ss[1] - second) < 1e-9);
    assert("exact jet and displayed ring agree", Math.abs(jet.p[1] - After.ring(framed, station, [0.7])[0]![1]) < 1e-9);
  }

  const tilted: Chain = { name: "tilted conical course", basis: "spline", order: count, samples: 512, rule: "polar", layers: [0, 100].map((s: number): Chain.ILayer => ({
    y: s,
    coefficients: coefficients.map((value: number): number => value * (20 + s / 10) / 20),
    slopes: coefficients.map((value: number): number => value / 200),
    lift: AutoMovieHumanSplineCurve.interpolate(Array.from({ length: count }, (_: unknown, j: number): [number, number] => [40 * Math.cos(2 * Math.PI * j / count), 0])).slice(0, count),
    liftSlopes: Array<number>(count).fill(0),
  })) };
  const actual: number = Tape.perimeter(Horizontal.points([tilted], 50, 1024).map((point: [number, number, number]): Tape.Point => [point[0], point[2]]));
  const projected: number = Tape.perimeter(After.ring(tilted, 50, Array.from({ length: 1024 }, (_: unknown, i: number): number => 2 * Math.PI * i / 1024)).map((point: [number, number, number]): Tape.Point => [point[0], point[2]]));
  const independent: number = integrate((t: number): number => Math.sqrt((25 - 4 * Math.cos(t)) ** 2 + (4 * Math.sin(t)) ** 2), 0, 2 * Math.PI);
  assert("tilted projection is red", Math.abs(projected - independent) > 0.9);
  assert("actual horizontal plane is green", Math.abs(actual - independent) < 0.002);

  const hidden: Chain = { ...tilted, layers: tilted.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, lift: Array<number>(count).fill(0), liftSlopes: Array<number>(count).fill(0), liftCurvatures: Array<number>(count).fill(0.01) })) };
  let low: number = 0;
  let high: number = 100;
  for (let k: number = 0; k < 80; k++) {
    const mid: number = (low + high) / 2;
    const u: number = mid / 100;
    if (mid + 50 * u ** 2 * (1 - u) ** 2 < 50) low = mid;
    else high = mid;
  }
  const hiddenExpected: number = 2 * Math.PI * (20 + (low + high) / 20);
  const hiddenActual: number = Tape.perimeter(Horizontal.points([hidden], 50, 1024).map((point: [number, number, number]): Tape.Point => [point[0], point[2]]));
  assert("hidden curvature cannot take the flat-course fast path", Math.abs(hiddenActual - hiddenExpected) < 0.002);

  const contacts: [number, number, number, number] = [-10, 0, 10, 0];
  const points: Course.Vec3[] = Array.from({ length: 4096 }, (_: unknown, i: number): Course.Vec3 => {
    const t: number = 2 * Math.PI * i / 4096;
    return [20 * Math.cos(t), Course.height(contacts, t), 20 * Math.sin(t)];
  });
  const expectedCourse: number = 4 * integrate((t: number): number => Math.hypot(10 * Math.PI, 40 * t - 30 * t * t), 0, 1);
  const course: number = Course.length(points);
  const projectedCourse: number = Tape.perimeter(points.map((point: Course.Vec3): Tape.Point => [point[0], point[2]]));
  assert("projected neck course is red", Math.abs(projectedCourse - expectedCourse) > 5);
  assert("3D course is green", Math.abs(course - expectedCourse) < 0.001);
  const factor: number = Course.scale(expectedCourse, points, [0, 0, 0]);
  assert("3D sizing retains known radius", Math.abs(factor - 1) < 1e-5);

  // Ellipse material quadrants do not identify its geometric cardinal rays.
  const asymmetric: Course.Vec3[] = Array.from({ length: 4096 }, (_: unknown, i: number): Course.Vec3 => {
    const t: number = 2 * Math.PI * i / 4096;
    return [30 * Math.cos(t) + 5 * Math.cos(2 * t), 10 * Math.cos(t), 20 * Math.sin(t)];
  });
  const cardinal: [Course.Vec3, Course.Vec3, Course.Vec3, Course.Vec3] = Course.contacts(asymmetric, [0, 0, 0]);
  assert("old material left has the wrong ray", Math.abs(asymmetric[1024]![0]) > 4.9);
  assert("actual left cardinal ray", Math.abs(cardinal[1][0]) < 1e-9 && cardinal[1][2] > 0);
  assert("actual right cardinal ray", Math.abs(cardinal[3][0]) < 1e-9 && cardinal[3][2] < 0);
  const registered: [Course.Vec3, Course.Vec3, Course.Vec3, Course.Vec3] = Course.contacts(Course.register(asymmetric, [0, 0, 0]), [0, 0, 0]);
  for (let k: number = 0; k < 4; k++) assert("registration preserves the fixed physical contact heights", Math.abs(registered[k]![1] - cardinal[k]![1]) < 0.001);

  const collar: Chain = Neck.generate({ top: 100, neck: 280, neckBase: 300, sex: 1, scale: 1 });
  const top: number = collar.layers[collar.layers.length - 1]!.y;
  const origin: [number, number, number] = After.axis(collar, top);
  const boundary: [number, number, number][] = After.ring(collar, top, Array.from({ length: 1024 }, (_: unknown, i: number): number => 2 * Math.PI * i / 1024));
  const fixed: [Course.Vec3, Course.Vec3, Course.Vec3, Course.Vec3] = Course.contacts(boundary, origin);
  const skin: HumanAnatomy.ISkin = collarMesh(boundary);
  const read: Reader.IReading = Reader.read(skin, { owner: "neck", basis: "model-convention", pose: "bind", definition: "Synthetic continuation of the generated shared collar", geometry: { kind: "course", origin, normal: [0, 1, 0], front: [1, 0, 0], contacts: fixed } });
  assert("independent final-triangle reader closes the generated collar", Number.isFinite(read.girth) && Math.abs(read.girth - 300) < 0.03);

  TestValidator.predicate("all body measurement fixtures: " + failures.join("; "), failures.length === 0);
}

/** A sound stationary collar continued across its shared boundary in both directions. */
function collarMesh(boundary: readonly Course.Vec3[]): HumanAnatomy.ISkin {
  const positions: number[] = [];
  const indices: number[] = [];
  const count: number = boundary.length;
  for (const offset of [-5, 5])
    for (const point of boundary) positions.push(point[0], point[1] + offset, point[2]);
  for (let i: number = 0; i < count; i++) {
    const j: number = (i + 1) % count;
    indices.push(i, j, i + count, j, j + count, i + count);
  }
  return { name: "pure collar continuation", P: Float64Array.from(positions), I: Uint32Array.from(indices), tri: new Int32Array(indices.length / 3), chains: ["head"], joints: new Map() };
}

/** Composite Simpson reference integral of an independently specified speed. */
function integrate(fn: (value: number) => number, low: number, high: number): number {
  const steps: number = 16384;
  const h: number = (high - low) / steps;
  let total: number = fn(low) + fn(high);
  for (let i: number = 1; i < steps; i++) total += (i % 2 ? 4 : 2) * fn(low + h * i);
  return total * h / 3;
}

