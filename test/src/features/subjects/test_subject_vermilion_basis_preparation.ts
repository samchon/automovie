import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceUpperVermilionHeight,
  prepareVermilionBasis,
} from "../../../scripts/face-review/prepareVermilionBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Rows of a strip at z = 0.1 m, in millimetres of height. */
const ROWS = [-20, -10, 0, 5, 10, 20];

/**
 * A strip swept across x = -1..1 mm. Its lip region spans rows 0 to 10 mm,
 * stomion superius is vertex 4 (row 0 mm), and the top lip row (vertices 8
 * and 9) is labrale superius, so the vermilion is 10 mm. `height` raises
 * that row 4 mm per unit and lowers it 2 mm per unit on its negative side;
 * ancestry `a` raises it 2 mm and ancestry `b` only lowers the bottom row.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const positions: number[] = [];
  for (const y of ROWS)
    positions.push(-0.001, y / 1000, 0.1, 0.001, y / 1000, 0.1);
  const strip = (from: number, to: number) => {
    const indices: number[] = [];
    for (let k = from; k < to; ++k)
      indices.push(2 * k, 2 * k + 1, 2 * k + 3, 2 * k, 2 * k + 3, 2 * k + 2);
    return indices;
  };
  const lips = strip(2, 4);
  const rest = [...strip(0, 2), ...strip(4, ROWS.length - 1)];
  const top = (dy: number) => [8, 0, dy, 0, 9, 0, dy, 0];
  return {
    id: "strip/1",
    channels: [
      {
        id: "height",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "height.positive",
        negative: "height.negative",
      },
      {
        id: "a",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "a.positive",
        negative: null,
      },
      {
        id: "b",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "b.positive",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions,
        indices: [...rest, ...lips],
        targets: {
          "height.positive": top(0.004),
          "height.negative": top(-0.002),
          "a.positive": top(0.002),
          "b.positive": [0, 0, -0.001, 0, 1, 0, -0.001, 0],
        },
        regions: [
          { id: "skin/skin", material: "skin", indices: rest, uvs: null },
          { id: "skin/lips", material: "skin", indices: lips, uvs: null },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
};

/**
 * Moving each ancestry's vermilion border to its norms.
 * Scenarios:
 * 1. The strip reads 10 mm of vermilion at x = 0, none when stomion sits
 *    above the lips, and none when every crossing lies behind the depth.
 * 2. Ancestry `a` (12 mm) against norms of 8 and 9 mm falls 3.5 mm short on
 *    average, which the negative side (2 mm per unit) meets at -1.75; `b`
 *    (10 mm) against 12 mm meets it on the positive side (4 mm per unit) at
 *    +0.5. Each corner then sits at its ancestry's mean, and the neutral
 *    keeps 10 mm.
 * 3. The documents and controls name the new revision.
 * 4. A repeated revision, no ancestries, an ancestry without norms, a
 *    one-sided field, an unknown region and an unknown lip surface refuse.
 */
export const test_subject_vermilion_basis_preparation = (): void => {
  const basis = head();
  const skin = basis.surfaces[0]!;
  const lips = skin.regions.find((one) => one.id === "skin/lips")!.indices;
  const read = (y: number, z: number, depth = 0.004) =>
    faceUpperVermilionHeight({
      positions: skin.positions,
      triangles: lips,
      stomion: { y, z },
      depth,
    });
  TestValidator.predicate(
    "reading",
    nclose(read(0, 0.1)!, 0.01, 1e-12) &&
      read(0.02, 0.1) === null &&
      read(0, 0.2, 0.001) === null,
  );
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "strip/2",
    channel: "height",
    skin: "skin",
    region: "skin/lips",
    lips: { surface: "skin", upper: 4, lower: 5 },
    ancestries: [
      {
        channel: "a",
        norms: [
          { label: "a1", shape: { a: 1 }, targetMetres: 0.008 },
          { label: "a2", shape: { a: 1 }, targetMetres: 0.009 },
        ],
      },
      {
        channel: "b",
        norms: [{ label: "b1", shape: { b: 1 }, targetMetres: 0.012 }],
      },
    ],
    depth: 0.004,
  };
  const prepared = prepareVermilionBasis(base);
  const [a, b] = prepared.receipt.ancestries;
  TestValidator.predicate(
    "factors",
    nclose(a!.factor, -1.75, 1e-9) &&
      nclose(b!.factor, 0.5, 1e-9) &&
      a!.corners.every(
        (one) =>
          nclose(one.beforeMetres, 0.012, 1e-12) &&
          nclose(one.afterMetres, 0.0085, 1e-9),
      ) &&
      nclose(b!.corners[0]!.afterMetres, 0.012, 1e-9),
  );
  const top = prepared.basis.surfaces[0]!.targets;
  TestValidator.predicate(
    "neutral kept",
    top["height.positive"]!.join() ===
      skin.targets["height.positive"]!.join() &&
      prepared.basis.surfaces[0]!.positions.join() === skin.positions.join(),
  );
  TestValidator.equals(
    "restamped",
    [prepared.basis.id, prepared.documents[0]!.basis, prepared.controls.basis],
    ["strip/2", "strip/2", "strip/2"],
  );
  const refuse = (change: object, message: string) =>
    throwsError(() => prepareVermilionBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ ancestries: [] }, "norms for each ancestry") &&
      refuse(
        { ancestries: [{ channel: "a", norms: [] }] },
        "norms for each ancestry",
      ) &&
      refuse({ channel: "a" }, "two-sided shape channel") &&
      refuse({ region: "absent" }, "No region") &&
      refuse(
        { lips: { surface: "absent", upper: 0, lower: 1 } },
        "No lip surface",
      ),
  );
};
