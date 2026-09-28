import { humanFaceContactFixture } from "./humanFaceContactFixture";

export const GINGIVA_SCALLOP_CENTRES = [2.03, 2.09, 2.15, 2.21, 2.27, 2.33];

/**
 * Six box crowns 0.05 wide and 0.05 deep at `GINGIVA_SCALLOP_CENTRES` whose top faces are
 * open (the root rings): the four inner ones 0.1 tall, the two outer 0.06.
 * Two more crowns stand off the gum at x = 3 (open top, its ring in view)
 * and 3.2 (sealed on its back face, never in view).
 * A gum strip at z = 1.05 in front of the six from y = 0.05 to 0.3, with
 * columns at 1.9, every crown centre, every midpoint between neighbours and
 * 2.5, so each crown shows its lower 0.05 from the front.
 */
const dentition = (offset: number) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const closure: number[] = [];
  GINGIVA_SCALLOP_CENTRES.forEach((c, k) => {
    const top = k === 0 || k === 5 ? 0.06 : 0.1;
    const base = offset + positions.length / 3;
    for (const y of [0, top])
      for (const [x, z] of [
        [c - 0.025, 0.95],
        [c + 0.025, 0.95],
        [c + 0.025, 1],
        [c - 0.025, 1],
      ] as const)
        positions.push(x, y, z);
    const quad = (a: number, b: number, d: number, e: number) =>
      indices.push(base + a, base + b, base + d, base + a, base + d, base + e);
    quad(0, 1, 2, 3);
    quad(3, 2, 6, 7);
    quad(1, 0, 4, 5);
    quad(2, 1, 5, 6);
    quad(0, 3, 7, 4);
    closure.push(base + 4, base + 7, base + 6, base + 4, base + 6, base + 5);
  });
  // Two crowns off the gum: one whose open top nothing covers (its ring
  // already shows) and one sealed on its back face (never in view).
  for (const [c, back] of [
    [3, false],
    [3.2, true],
  ] as const) {
    const base = offset + positions.length / 3;
    for (const y of [0, 0.1])
      for (const [x, z] of [
        [c - 0.025, 0.95],
        [c + 0.025, 0.95],
        [c + 0.025, 1],
        [c - 0.025, 1],
      ] as const)
        positions.push(x, y, z);
    const quad = (a: number, b: number, d: number, e: number) =>
      indices.push(base + a, base + b, base + d, base + a, base + d, base + e);
    quad(0, 1, 2, 3);
    quad(3, 2, 6, 7);
    quad(2, 1, 5, 6);
    quad(0, 3, 7, 4);
    if (back) {
      quad(4, 7, 6, 5);
      closure.push(base + 1, base + 0, base + 4, base + 1, base + 4, base + 5);
    } else {
      quad(1, 0, 4, 5);
      closure.push(base + 4, base + 7, base + 6, base + 4, base + 6, base + 5);
    }
  }
  const columns = [
    1.9,
    ...GINGIVA_SCALLOP_CENTRES.flatMap((c, k) =>
      k === 0 ? [c] : [(GINGIVA_SCALLOP_CENTRES[k - 1]! + c) / 2, c],
    ),
    2.5,
  ];
  const gum = offset + positions.length / 3;
  for (const y of [0.05, 0.3])
    for (const x of columns) positions.push(x, y, 1.05);
  const n = columns.length;
  for (let k = 0; k + 1 < n; ++k)
    indices.push(
      gum + k,
      gum + k + 1,
      gum + n + k + 1,
      gum + k,
      gum + n + k + 1,
      gum + n + k,
    );
  return { positions, indices, closure, gum, columns };
};

/**
 * The analytic contact basis with the scallop dentition added to its teeth
 * (`dentition`): the fixture's upper octahedron is sealed by nothing, so it
 * is gum; its lower one rides the jaw.
 */
export function gingivaScallopFixture() {
  const { basis, document } = humanFaceContactFixture();
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const offset = teeth.positions.length / 3;
  const added = dentition(offset);
  teeth.positions.push(...added.positions);
  teeth.indices.push(...added.indices);
  teeth.regions[0]!.indices.push(...added.indices);
  basis.contact!.colliders![0]!.closure.push(...added.closure);
  return {
    basis,
    document,
    offset,
    added,
    base: {
      basis,
      documents: [document],
      controls: { basis: basis.id, groups: [] },
      revision: "analytic-contact/3",
      norms: [0.08, 0.08, 0.08] as [number, number, number],
      resolution: 0.004,
    },
  };
}
