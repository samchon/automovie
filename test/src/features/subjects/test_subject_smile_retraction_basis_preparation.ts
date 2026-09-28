import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareSmileRetractionBasis } from "../../../scripts/face-review/prepareSmileRetractionBasis";
import { nclose, throwsError } from "../internal/predicates";

const XS = [-0.02, -0.01, 0, 0.01, 0.02];
/** Rows of five vertices at x = -20..20 mm, z = 0.1, at the given heights. */
const ROWS = [0.012, 0.006, 0.002, -0.002, -0.006, -0.012];
const at = (row: number, column: number) => row * XS.length + column;

/**
 * A face strip: skin rows at 12 and 6 mm above and below the mouth, the
 * upper lip at 2 mm and the lower at -2 mm (the lips' region, meeting at
 * their middle vertices), and one crown point 2 mm behind the upper lip's
 * middle. Each smile channel moves one skin vertex sideways already.
 */
const fixture = (): IAutoMovieHumanFaceBasis => {
  const positions = ROWS.flatMap((y) => XS.flatMap((x) => [x, y, 0.1]));
  const quad = (r: number): number[] =>
    XS.slice(1).flatMap((_, c) => [
      at(r, c),
      at(r + 1, c),
      at(r, c + 1),
      at(r, c + 1),
      at(r + 1, c),
      at(r + 1, c + 1),
    ]);
  const skin = [...quad(0), ...quad(1), ...quad(3), ...quad(4)];
  const lips = quad(2);
  return {
    id: "smile/1",
    channels: [
      {
        id: "smileLeft",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "smileLeft",
        negative: null,
      },
      {
        id: "smileRight",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "smileRight",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions,
        indices: [...skin, ...lips],
        targets: {
          smileLeft: [at(0, 4), 0.001, 0, 0],
          smileRight: [at(0, 0), -0.001, 0, 0],
        },
        regions: [
          { id: "skin/skin", material: "skin", indices: skin, uvs: null },
          { id: "skin/lips", material: "lips", indices: lips, uvs: null },
        ],
      },
      {
        id: "teeth",
        positions: [0, 0.002, 0.098],
        indices: [],
        targets: {},
        regions: [],
      },
    ],
    contact: { lips: { surface: "skin", upper: at(2, 2), lower: at(3, 2) } },
  } as never;
};

/**
 * The smile carries the lips back onto the teeth.
 * Scenarios:
 * 1. With both sides at full weight the lips move straight back by their
 *    lip's retraction at the midline, half of it a quarter turn out (x = 10
 *    mm) and none at the corners; the upper lip's middle column stops 0.5
 *    mm off the crown 2 mm behind it (1.5 mm back, the column held), the
 *    lower lip's goes its whole 3 mm.
 * 2. Each side's channel carries its share: half at the midline, all of it
 *    on its own side and none on the other; the channels' own rows stay.
 * 3. The skin between the lips and the reach follows as a membrane, less
 *    than the lip it touches, and the skin beyond the reach stays.
 * 4. The basis, documents and control map are restamped, the source is
 *    left as it was, and a stale revision, a negative retraction, a reach
 *    upside down, a negative margin, no midline, a channel or the teeth
 *    missing refuse.
 */
export const test_subject_smile_retraction_basis_preparation = (): void => {
  const source = fixture();
  const before = JSON.stringify(source);
  const input = {
    basis: source,
    documents: [
      { id: "a", basis: "smile/1", shape: {}, expression: {} },
    ] as never,
    controls: { basis: "smile/1", controls: [] } as never,
    revision: "smile/2",
    skin: "skin",
    lips: "skin/lips",
    channels: { left: "smileLeft", right: "smileRight" },
    retraction: { upper: 0.004, lower: 0.003 },
    reach: { upper: 0.009, lower: -0.009 },
    margin: 0,
    midline: 0.005,
    teeth: { surface: "teeth", gap: 0.0005 },
  };
  const prepared = prepareSmileRetractionBasis(input);
  const skin = prepared.basis.surfaces[0]!;
  const rows = (name: string) => {
    const flat = skin.targets[name]!;
    const out = new Map<number, number[]>();
    for (let i = 0; i < flat.length; i += 4)
      out.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    return out;
  };
  const [left, right] = [rows("smileLeft"), rows("smileRight")];
  const back = (v: number) =>
    -((left.get(v)?.[2] ?? 0) + (right.get(v)?.[2] ?? 0));
  TestValidator.predicate(
    "retraction",
    nclose(back(at(2, 2)), 0.0015, 1e-12) &&
      nclose(back(at(3, 2)), 0.003, 1e-12) &&
      nclose(back(at(2, 3)), 0.002, 1e-12) &&
      nclose(back(at(3, 1)), 0.0015, 1e-12) &&
      back(at(2, 4)) === 0 &&
      back(at(3, 0)) === 0 &&
      prepared.receipt.held === 1 &&
      prepared.receipt.lips === 10,
  );
  TestValidator.predicate(
    "shares",
    nclose(-left.get(at(2, 2))![2]!, 0.00075, 1e-12) &&
      nclose(-right.get(at(2, 2))![2]!, 0.00075, 1e-12) &&
      nclose(-left.get(at(2, 3))![2]!, 0.002, 1e-12) &&
      right.get(at(2, 3)) === undefined &&
      left.get(at(0, 4))![0] === 0.001 &&
      right.get(at(0, 0))![0] === -0.001,
  );
  TestValidator.predicate(
    "membrane",
    back(at(1, 2)) > 0 &&
      back(at(1, 2)) < back(at(2, 2)) &&
      back(at(4, 2)) > 0 &&
      back(at(4, 2)) < back(at(3, 2)) &&
      back(at(0, 2)) === 0 &&
      back(at(5, 2)) === 0 &&
      prepared.receipt.skin === 6,
  );
  const noTeeth = fixture();
  noTeeth.surfaces.pop();
  TestValidator.predicate(
    "stamps and refusals",
    prepared.basis.id === "smile/2" &&
      prepared.documents[0]!.basis === "smile/2" &&
      prepared.controls.basis === "smile/2" &&
      prepared.receipt.source === "smile/1" &&
      JSON.stringify(source) === before &&
      throwsError(
        () => prepareSmileRetractionBasis({ ...input, revision: "smile/1" }),
        "distinct revision",
      ) &&
      throwsError(
        () =>
          prepareSmileRetractionBasis({
            ...input,
            retraction: { upper: -1, lower: 0 },
          }),
        "zero or more",
      ) &&
      throwsError(
        () =>
          prepareSmileRetractionBasis({
            ...input,
            reach: { upper: -0.009, lower: 0.009 },
          }),
        "lower reach",
      ) &&
      throwsError(
        () => prepareSmileRetractionBasis({ ...input, margin: -1 }),
        "margin",
      ) &&
      throwsError(
        () => prepareSmileRetractionBasis({ ...input, midline: 0 }),
        "margin",
      ) &&
      throwsError(
        () =>
          prepareSmileRetractionBasis({
            ...input,
            channels: { left: "none", right: "smileRight" },
          }),
        "No smile channel",
      ) &&
      throwsError(
        () => prepareSmileRetractionBasis({ ...input, basis: noTeeth }),
        "No surface teeth",
      ),
  );
};
