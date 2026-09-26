import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareVermilionHeightBasis } from "../../../scripts/face-review/prepareVermilionHeightBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Grid columns x = -20..20 mm by 5 and rows y = -28.75 + 2.5 k mm. */
const X = [-0.02, -0.015, -0.01, -0.005, 0, 0.005, 0.01, 0.015, 0.02];
const Y = [...new Array(21).keys()].map((k) => -0.02875 + 0.0025 * k);
const vertex = (i: number, k: number) => k * X.length + i;
const find = (x: number, y: number) =>
  vertex(
    X.findIndex((one) => Math.abs(one - x) < 1e-9),
    Y.findIndex((one) => Math.abs(one - y) < 1e-9),
  );

/** The lining's vertices behind the slit at x = -5, 0 and 5 mm. */
const lining = (lip: "upper" | "lower", j: number) =>
  X.length * Y.length + (lip === "upper" ? 0 : 3) + j;

/**
 * A grid at z = 0.1 m, the lips the cells within 10 mm across and 7.5 mm of
 * the meeting line bulging half a millimetre forward at the midline, the
 * lips' meeting points on the midline at 1.25 and -1.25 mm. With `slit`
 * the mouth's slit parts the lips within 5 mm of the midline (the cells
 * between the meeting points removed), the lips joined beyond it; each lip's
 * lining folds back from its margin along the slit, half a millimetre away
 * from the other lip and 2 mm behind.
 */
const fixture = (slit: boolean): IAutoMovieHumanFaceBasis => {
  const inLips = (x: number, y: number) =>
    Math.abs(x) <= 0.01 && Math.abs(y) <= 0.0075;
  const positions = Y.flatMap((y) =>
    X.flatMap((x) => [
      x,
      y,
      0.1 + (inLips(x, y) ? 0.0005 * (1 - Math.abs(x) / 0.01) : 0),
    ]),
  );
  for (const y of [0.00175, -0.00175])
    for (const x of [-0.005, 0, 0.005]) positions.push(x, y, 0.098);
  const indices: number[] = [];
  const lips: number[] = [];
  for (let k = 0; k + 1 < Y.length; ++k)
    for (let i = 0; i + 1 < X.length; ++i) {
      const xs = [X[i]!, X[i + 1]!];
      const ys = [Y[k]!, Y[k + 1]!];
      if (
        slit &&
        xs.every((x) => Math.abs(x) <= 0.005) &&
        ys.every((y) => Math.abs(y) < 0.002)
      )
        continue;
      const cell = [
        vertex(i, k),
        vertex(i + 1, k),
        vertex(i + 1, k + 1),
        vertex(i, k),
        vertex(i + 1, k + 1),
        vertex(i, k + 1),
      ];
      indices.push(...cell);
      if (xs.every((x) => ys.every((y) => inLips(x, y)))) lips.push(...cell);
    }
  for (const j of [0, 1]) {
    const [a, b] = [
      find(-0.005 + 0.005 * j, 0.00125),
      find(0.005 * j, 0.00125),
    ];
    const [c, d] = [
      find(-0.005 + 0.005 * j, -0.00125),
      find(0.005 * j, -0.00125),
    ];
    const strip = [
      a,
      lining("upper", j + 1),
      b,
      a,
      lining("upper", j),
      lining("upper", j + 1),
      c,
      d,
      lining("lower", j + 1),
      c,
      lining("lower", j + 1),
      lining("lower", j),
    ];
    indices.push(...strip);
    lips.push(...strip);
  }
  return {
    id: "mouth/1",
    channels: [],
    contact: {
      lips: { upper: find(0, 0.00125), lower: find(0, -0.00125) },
    },
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: {},
        regions: [
          { id: "skin/skin", material: "skin", indices, uvs: null },
          { id: "skin/lips", material: "skin", indices: lips, uvs: null },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  } as never;
};

/**
 * A control per lip for the height of its vermilion.
 * Scenarios:
 * 1. Each lip is the lips' vertices nearer its meeting point along the
 *    surface, its vermilion the part not folded back behind the slit.
 *    Thinner moves each upper vermilion vertex over the slit toward its
 *    column's lowest vermilion point by the unit of its distance (the one
 *    5 mm above it by a fifth of that), the lower lip's toward its column's
 *    highest; the vermilion toward the joined commissures and the skin
 *    beyond each lip follow part of the way, less further out; the lining,
 *    the other lip, the skin beyond the margin across and past the reach
 *    have no row; fuller is thinner's negative.
 * 2. Each channel spans its envelope with its description; the revision
 *    restamps documents and controls.
 * 3. A repeated revision, a unit outside (0, 1), an envelope missing a
 *    direction or closing the vermilion, a missing surface or region, a
 *    basis without lip contact, lips missing a meeting point, lips joined
 *    along their whole margin, a channel the basis has and a reach on the
 *    wrong side refuse.
 */
export const test_subject_vermilion_height_basis_preparation = (): void => {
  const basis = fixture(true);
  const input = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id } as never,
    revision: "mouth/2",
    skin: "skin",
    lips: "skin/lips",
    sides: [
      {
        channel: "upperV",
        lip: "upper" as const,
        reach: 0.015,
        envelope: [-3, 2] as [number, number],
      },
      {
        channel: "lowerV",
        lip: "lower" as const,
        reach: -0.015,
        envelope: [-3, 1] as [number, number],
      },
    ],
    unit: 0.2,
    column: 0.001,
    margin: 0.005,
  };
  const prepared = prepareVermilionHeightBasis(input);
  const rows = (name: string) => {
    const flat = prepared.basis.surfaces[0]!.targets[name]!;
    const out = new Map<number, number>();
    for (let i = 0; i < flat.length; i += 4) out.set(flat[i]!, flat[i + 2]!);
    return out;
  };
  const upper = rows("upperV.thinner");
  const lower = rows("lowerV.thinner");
  const above = upper.get(find(0, 0.00875))!;
  const higher = upper.get(find(0, 0.01125))!;
  TestValidator.predicate(
    "rows",
    nclose(upper.get(find(0, 0.00625))!, -0.2 * 0.005, 1e-12) &&
      upper.get(find(0.005, 0.00375))! < 0 &&
      upper.get(find(0.005, 0.00375))! > -0.2 * 0.005 &&
      !upper.has(find(0, 0.00125)) &&
      !upper.has(lining("upper", 1)) &&
      !lower.has(lining("lower", 1)) &&
      nclose(lower.get(find(0, -0.00625))!, 0.2 * 0.005, 1e-12) &&
      lower.get(find(0, -0.00875))! > 0 &&
      lower.get(find(0, -0.00875))! < 0.2 * 0.005 &&
      above < 0 &&
      higher < 0 &&
      higher > above &&
      above > upper.get(find(0, 0.00625))! &&
      !upper.has(find(0, -0.00625)) &&
      !upper.has(find(0.02, 0.00875)) &&
      !upper.has(find(0, 0.01625)) &&
      [...rows("upperV.fuller")].every(([v, d]) => d === -upper.get(v)!),
  );
  TestValidator.predicate(
    "channels, stamps",
    prepared.basis.channels.some(
      (one) =>
        one.id === "upperV" &&
        one.description ===
          "The upper vermilion's height, thinner to fuller, 20 percent of its height per unit toward or away from the lips' meeting line; the lip's skin follows." &&
        one.minimum === -3 &&
        one.maximum === 2 &&
        one.positive === "upperV.fuller" &&
        one.negative === "upperV.thinner",
    ) &&
      prepared.basis.channels.some(
        (one) => one.id === "lowerV" && one.minimum === -3 && one.maximum === 1,
      ) &&
      prepared.basis.id === "mouth/2" &&
      prepared.documents[0]!.basis === "mouth/2" &&
      (prepared.controls as { basis: string }).basis === "mouth/2" &&
      prepared.receipt.sides.length === 2,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareVermilionHeightBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareVermilionHeightBasis({ ...input, unit: 1 }),
        "between zero and one",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            sides: [{ ...input.sides[0]!, envelope: [0, 1] }],
          }),
        "both directions",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            sides: [{ ...input.sides[0]!, envelope: [-5, 1] }],
          }),
        "close the vermilion",
      ) &&
      throwsError(
        () => prepareVermilionHeightBasis({ ...input, skin: "none" }),
        "No surface none",
      ) &&
      throwsError(
        () => prepareVermilionHeightBasis({ ...input, lips: "skin/none" }),
        "No region skin/none",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            basis: { ...basis, contact: undefined } as never,
          }),
        "no lip contact",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            basis: {
              ...basis,
              contact: {
                lips: { upper: find(0, 0.00125), lower: find(0.02, 0.02125) },
              },
            } as never,
          }),
        "both lips' meeting points",
      ) &&
      throwsError(
        () => prepareVermilionHeightBasis({ ...input, basis: fixture(false) }),
        "The upper lip has no free margin",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            sides: [input.sides[0]!, { ...input.sides[1]!, channel: "upperV" }],
          }),
        "already has a channel upperV",
      ) &&
      throwsError(
        () =>
          prepareVermilionHeightBasis({
            ...input,
            sides: [{ ...input.sides[0]!, reach: -0.015 }],
          }),
        "reaches nowhere",
      ),
  );
};
