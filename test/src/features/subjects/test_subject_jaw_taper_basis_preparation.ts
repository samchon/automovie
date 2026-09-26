import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareJawTaperBasis } from "../../../scripts/face-review/prepareJawTaperBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A strip facing sideways at x = 40 mm (its triangles in the y-z plane) at
 * heights 0, -10, -20, -30 and -40 mm, and one vertex at -20 mm facing
 * forward at x = 10 mm (its triangle in the x-y plane), and a vertex in no
 * triangle: the mouth's line at 0 and menton at -30.
 */
const fixture = (): IAutoMovieHumanFaceBasis => {
  const side = [0, -0.01, -0.02, -0.03, -0.04].flatMap((y) => [
    [0.04, y, 0.1],
    [0.04, y, 0.09],
  ]);
  const positions = [
    ...side.flat(),
    0.01,
    -0.02,
    0.12,
    0.02,
    -0.02,
    0.12,
    0.01,
    -0.03,
    0.12,
    0.03,
    -0.02,
    0.11,
  ];
  const indices: number[] = [];
  for (let k = 0; k < 4; ++k)
    indices.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
  indices.push(10, 11, 12);
  return {
    id: "jaw/1",
    channels: [],
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: {},
        regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  } as never;
};

/**
 * A control for the jaw's taper from the mouth's line to the chin.
 * Scenarios:
 * 1. Tapering moves the skin facing sideways toward the midline by its
 *    carry times the unit times its depth below the mouth's line over
 *    the chin's level's (20 mm down), then its full unit to menton (30 mm)
 *    and back to nothing at the neck's rim: the side 10 mm below the line
 *    by half of the unit's 4 mm, at the level and at menton by all of it,
 *    halfway from menton to the rim by half, half carried at the level by
 *    half; the line and above, an uncarried vertex, the skin
 *    facing forward and a vertex without a surface have no row; squaring is tapering's negative.
 * 2. The channel spans the envelope with its description; the revision
 *    restamps documents and controls.
 * 3. A repeated revision, a unit outside (0, 1), an envelope missing a
 *    direction or closing the jaw, a chin's level not between the mouth's
 *    line and menton (either way), a neck's rim not below menton, a
 *    channel the basis has, a missing surface, a carry of the wrong length
 *    and a carry moving nothing refuse.
 */
export const test_subject_jaw_taper_basis_preparation = (): void => {
  const basis = fixture();
  const carry = [1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 0, 1, 1, 1, 1];
  const input = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id } as never,
    revision: "jaw/2",
    skin: "skin",
    channel: "taper",
    carry,
    top: 0,
    level: -0.02,
    menton: -0.03,
    rim: -0.05,
    unit: 0.1,
    envelope: [-4, 3] as [number, number],
  };
  const prepared = prepareJawTaperBasis(input);
  const rows = (name: string) => {
    const flat = prepared.basis.surfaces[0]!.targets[name]!;
    const out = new Map<number, number[]>();
    for (let i = 0; i < flat.length; i += 4)
      out.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    return out;
  };
  const narrower = rows("taper.narrower");
  const wider = rows("taper.wider");
  const moved = (v: number, dx: number) =>
    nclose(narrower.get(v)![0]!, dx, 1e-12) &&
    narrower.get(v)![1] === 0 &&
    narrower.get(v)![2] === 0;
  TestValidator.predicate(
    "rows",
    moved(2, -0.002) &&
      moved(3, -0.002) &&
      moved(4, -0.5 * 0.004) &&
      moved(6, -0.004) &&
      moved(8, -0.002) &&
      [0, 1, 9, 10, 11, 12, 13].every((v) => !narrower.has(v)) &&
      [...narrower].every(([v, d]) =>
        wider.get(v)!.every((one, k) => one === -d[k]!),
      ) &&
      prepared.receipt.rows === 7,
  );
  TestValidator.predicate(
    "channel, stamps",
    prepared.basis.channels.some(
      (one) =>
        one.id === "taper" &&
        one.description ===
          "The jaw's taper from the mouth's line to the chin, tapered to square, 10 percent narrower per unit at menton, nothing at the mouth's line; the skin the mandible carries." &&
        one.minimum === -4 &&
        one.maximum === 3 &&
        one.positive === "taper.wider" &&
        one.negative === "taper.narrower",
    ) &&
      prepared.basis.id === "jaw/2" &&
      prepared.documents[0]!.basis === "jaw/2" &&
      (prepared.controls as { basis: string }).basis === "jaw/2" &&
      basis.surfaces[0]!.targets["taper.narrower"] === undefined,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareJawTaperBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, unit: 1 }),
        "between zero and one",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, envelope: [0, 1] }),
        "both directions",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, envelope: [-10, 1] }),
        "close the jaw",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, top: -0.02 }),
        "chin's level lies between",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, level: -0.035 }),
        "chin's level lies between",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, rim: -0.03 }),
        "neck's rim lies below menton",
      ) &&
      throwsError(
        () =>
          prepareJawTaperBasis({
            ...input,
            basis: {
              ...basis,
              channels: [{ id: "taper" }],
            } as never,
          }),
        "already has a channel taper",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, skin: "none" }),
        "No surface none",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, carry: [1] }),
        "one weight per skin vertex",
      ) &&
      throwsError(
        () => prepareJawTaperBasis({ ...input, carry: carry.map(() => 0) }),
        "carries no skin",
      ),
  );
};
