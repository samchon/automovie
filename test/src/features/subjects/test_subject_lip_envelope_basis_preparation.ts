import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceSupportFaults,
  faceVermilionRatios,
  prepareLipEnvelopeBasis,
} from "../../../scripts/face-review/prepareLipEnvelopeBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Rows of a strip at z = 0.1 m, in millimetres of height. */
const ROWS = [-20, -12, -1, 1, 6, 10, 20];

/**
 * A strip swept across x = -1..1 mm (the mouth 2 mm wide). Its lip region
 * spans rows -12 to 10 mm; the lips' contact pair is vertex 6 (row 1 mm)
 * above vertex 4 (row -1 mm), so stomion is at 0, the upper vermilion 10 mm
 * (ratio 5) and the lower 12 mm (ratio 6). `up` raises the top row 2 mm
 * per unit and lowers the upper contact 1 mm per unit, or lowers the top
 * row 2 mm per unit; `low` lowers the bottom row 2 mm per unit and lifts
 * the lower contact 0.8 mm per unit, or raises the bottom row 2 mm per
 * unit.
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
  const lips = strip(1, 5);
  const rest = [...strip(0, 1), ...strip(5, ROWS.length - 1)];
  const row = (k: number, dy: number) => [2 * k, 0, dy, 0, 2 * k + 1, 0, dy, 0];
  return {
    id: "strip/1",
    channels: [
      {
        id: "up",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "up.positive",
        negative: "up.negative",
      },
      {
        id: "low",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "low.positive",
        negative: "low.negative",
      },
      {
        id: "one",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "one.positive",
        negative: null,
      },
      {
        id: "elsewhere",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "elsewhere.positive",
        negative: "elsewhere.negative",
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions,
        indices: [...rest, ...lips],
        targets: {
          "up.positive": [...row(5, 0.002), ...row(3, -0.001)],
          "up.negative": row(5, -0.002),
          "low.positive": [...row(1, -0.002), ...row(2, 0.0008)],
          "low.negative": row(1, 0.002),
          "one.positive": row(5, 0.001),
        },
        regions: [
          { id: "skin/skin", material: "skin", indices: rest, uvs: null },
          { id: "skin/lips", material: "skin", indices: lips, uvs: null },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
    // Only the lips' contact pair is read.
    contact: {
      lips: { surface: "skin", upper: 6, lower: 4 },
    } as unknown as IAutoMovieHumanFaceBasis["contact"],
  };
};

/**
 * Spanning the vermilion heights adults show.
 * Scenarios:
 * 1. The strip reads vermilion ratios of 5 and 6; with stomion above the
 *    lips, or every crossing behind the depth, there is no reading.
 * 2. Asked for an upper ratio down to 3.5 and up to 8: the negative side
 *    crosses 3.5 at -1.5; the positive side would reach 8 at +2.4, but its
 *    upper contact passes the lower past +2, so it stops at the last step
 *    (of 0.25) that keeps the lips apart, +1.9.
 * 3. Asked for 2.5: the top row sinks level with the row below it at -2,
 *    past which the reading stops changing, so the side ends there.
 * 4. The lower side asked for 0.5 runs to `reach` (3) without reaching it;
 *    asked for 6.5 above, already past at +1, it keeps +1. Asked for 100,
 *    the lower contact meets the upper at +2.5, so it stops at +2.25.
 * 5. Documents and controls name the new revision; other channels keep
 *    their envelopes, and a control whose endpoints move nothing on the
 *    surface is not extended.
 * 6. A triangle turned over and a pair that come to cross count as faults;
 *    pairs sharing a vertex do not.
 * 7. A repeated revision, an unknown surface or region, no lip contact and
 *    a one-sided or unknown channel refuse.
 */
export const test_subject_lip_envelope_basis_preparation = (): void => {
  const basis = head();
  const skin = basis.surfaces[0]!;
  const lips = skin.regions.find((one) => one.id === "skin/lips")!.indices;
  const skinSet = new Set(
    skin.regions.find((one) => one.id === "skin/skin")!.indices,
  );
  const reading = faceVermilionRatios({
    positions: skin.positions,
    lips,
    skin: skinSet,
    contact: { upper: 6, lower: 4 },
    depth: 0.004,
  });
  TestValidator.predicate(
    "reading",
    nclose(reading.upper, 5, 1e-9) &&
      nclose(reading.lower, 6, 1e-9) &&
      throwsError(
        () =>
          faceVermilionRatios({
            positions: skin.positions.map((v, i) =>
              i % 3 === 1 && (i - 1) / 3 === 6 ? 0.05 : v,
            ),
            lips,
            skin: skinSet,
            contact: { upper: 6, lower: 12 },
            depth: 0.004,
          }),
        "no outer midline",
      ) &&
      throwsError(
        () =>
          faceVermilionRatios({
            positions: skin.positions,
            lips,
            skin: skinSet,
            contact: { upper: 6, lower: 4 },
            depth: -0.001,
          }),
        "no outer midline",
      ),
  );
  const base = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, controls: [] } as never,
    revision: "strip/2",
    surface: "skin",
    lips: "skin/lips",
    skin: "skin/skin",
    channels: { upper: "up", lower: "low" },
    depth: 0.004,
    step: 0.25,
    reach: 3,
  };
  const crossing = prepareLipEnvelopeBasis({
    ...base,
    intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
  });
  const envelope = (
    prepared: ReturnType<typeof prepareLipEnvelopeBasis>,
    id: string,
  ) => {
    const one = prepared.basis.channels.find((channel) => channel.id === id)!;
    return [one.minimum, one.maximum];
  };
  TestValidator.equals(
    "crossing, closing, reach, inside",
    [envelope(crossing, "up"), envelope(crossing, "low")],
    [
      [-1.5, 1.9],
      [-3, 1],
    ],
  );
  const plateau = prepareLipEnvelopeBasis({
    ...base,
    intervals: { upper: [2.5, 5.5], lower: [5.5, 100] },
  });
  TestValidator.equals(
    "plateau, lower closing",
    [envelope(plateau, "up")[0], envelope(plateau, "low")[1]],
    [-2, 2.25],
  );
  const still = prepareLipEnvelopeBasis({
    ...base,
    channels: { upper: "elsewhere", lower: "low" },
    intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
  });
  TestValidator.equals("still", envelope(still, "elsewhere"), [-1, 1]);
  TestValidator.predicate(
    "stamps",
    crossing.basis.id === "strip/2" &&
      crossing.documents[0]!.basis === "strip/2" &&
      (crossing.controls as { basis: string }).basis === "strip/2" &&
      crossing.receipt.envelopes[0]!.faults[1] > 0 &&
      envelope(crossing, "one").join() === "0,1",
  );
  // Two triangles 10 microns apart, 1 cm across; the second turned over,
  // and pushed through the first.
  const source = [
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0.2, 0.2, 0.001, 0.4, 0.2, 0.001, 0.2, 0.4,
    0.001,
  ].map((v) => v / 100);
  const moved = [...source];
  moved[11] = -0.005;
  const flipped = [...source];
  [flipped[12], flipped[15]] = [0.002, 0.004];
  [flipped[13], flipped[16]] = [0.004, 0.002];
  const indices = [0, 1, 2, 3, 4, 5];
  const shared = [0, 1, 2, 0, 4, 5];
  TestValidator.equals(
    "faults",
    [
      faceSupportFaults({
        source,
        positions: moved,
        indices,
        triangles: [0, 3],
      }),
      faceSupportFaults({
        source,
        positions: flipped,
        indices,
        triangles: [0, 3],
      }),
      faceSupportFaults({
        source,
        positions: moved,
        indices: shared,
        triangles: [0, 3],
      }),
    ],
    [1, 1, 0],
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () =>
        prepareLipEnvelopeBasis({
          ...base,
          revision: basis.id,
          intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
        }),
      "distinct revision",
    ) &&
      throwsError(
        () =>
          prepareLipEnvelopeBasis({
            ...base,
            surface: "none",
            intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
          }),
        "No surface",
      ) &&
      throwsError(
        () =>
          prepareLipEnvelopeBasis({
            ...base,
            lips: "none",
            intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
          }),
        "No region",
      ) &&
      throwsError(
        () =>
          prepareLipEnvelopeBasis({
            ...base,
            basis: { ...basis, contact: undefined },
            intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
          }),
        "no lip contact",
      ) &&
      throwsError(
        () =>
          prepareLipEnvelopeBasis({
            ...base,
            channels: { upper: "one", lower: "low" },
            intervals: { upper: [3.5, 8], lower: [0.5, 6.5] },
          }),
        "two-sided",
      ),
  );
};
