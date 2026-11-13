import { type AutoMovieSolidMeshConstraints, type AutoMovieSolidMeshIncidence, probeAutoMovieSolidMesh } from "@automovie/engine";

/** One chart point. */
type Chart = [number, number];

/**
 * A boundary walk's face is found beside any of its edges, not only its first.
 *
 * Scenarios:
 * 1. Open square: the walk `(0, 1) -> (1, 1) -> (1, 2) -> (0, 2)`, counter-clockwise, with no other constraint. The probe stands inside
 *    the square, beside the first edge.
 * 2. A sliver along the first edge: the same walk with a constraint from `(0.25, 1 + 2^-52)` to `(0.75, 1 + 2^-52)`, one unit in the last
 *    place above the first edge, as a rail's vertex stood 7e-15 off its face's station line beside f1's ear band. No double lies between
 *    the two, so no probe beside the first edge is admitted; the probe must still stand inside the square, beside another edge, and not
 *    between the two lines.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls probeAutoMovieSolidMesh on hand-built constraint graphs and reads only the returned point or refusal.
 * @evidence contracts/development/testing.md#independent-expectations The square's interior and the sliver's empty gap follow from the coordinates: 1 + 2^-52 is the double after 1, so no represented point lies strictly between y = 1 and the sliver.
 * @evidence contracts/development/testing.md#distinguishing-cases The open square passes with a probe beside the first edge alone; the sliver separates a search beside the first edge from one beside every edge of the walk.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include construction_mesh_probe. It generates no person and starts no renderer, host or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Open square: the walk `(0, 1) -> (1, 1) -> (1, 2) -> (0, 2)`).
 */
export function test_construction_mesh_probe(): void {
  const failures: string[] = [];
  const square: Chart[] = [
    [0, 1],
    [1, 1],
    [1, 2],
    [0, 2],
  ];
  const sliver: Chart[] = [
    [0.25, 1 + 2 ** -52],
    [0.75, 1 + 2 ** -52],
  ];
  for (const [name, extra] of [
    ["open square", []],
    ["sliver along the first edge", [sliver]],
  ] as const) {
    const vertices: Map<number, Chart> = new Map();
    square.forEach((p: Chart, k: number): void => void vertices.set(k, p));
    const edges: AutoMovieSolidMeshConstraints.ISegment[] = square.map((_: Chart, k: number): AutoMovieSolidMeshConstraints.ISegment => ({ a: k, b: (k + 1) % 4, turn: 0 }));
    for (const segment of extra) {
      const a: number = vertices.size;
      vertices.set(a, segment[0]!);
      vertices.set(a + 1, segment[1]!);
      edges.push({ a, b: a + 1, turn: 0 });
    }
    const walk: AutoMovieSolidMeshIncidence.IWalk = { vertices: [0, 1, 2, 3], lifts: [0, 0, 0, 0], winding: 0 };
    const probe: readonly [number, number] | string = probeAutoMovieSolidMesh(vertices, edges, walk, undefined);
    if (typeof probe === "string") {
      failures.push(`${name}: refused: ${probe}`);
      continue;
    }
    if (!(probe[0] > 0 && probe[0] < 1 && probe[1] > 1 && probe[1] < 2)) failures.push(`${name}: probe ${JSON.stringify(probe)} is not inside the square`);
    if (extra.length > 0 && probe[1] <= 1 + 2 ** -52 && probe[0] >= 0.25 && probe[0] <= 0.75) failures.push(`${name}: probe ${JSON.stringify(probe)} stands between the first edge and the sliver`);
  }
  if (failures.length > 0) throw new Error(`${failures.length} probe failures:\n${failures.join("\n")}`);
}
