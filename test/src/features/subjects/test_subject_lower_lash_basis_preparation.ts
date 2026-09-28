import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
  decodePortraitPng,
  encodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareLowerLashBasis } from "../../../scripts/face-review/prepareLowerLashBasis";
import { throwsError } from "../internal/predicates";

/** An 8 by 8 lash texture: rows 0-3 opaque, rows 4-7 strands in the even columns. */
const texture = (): string => {
  const rgba = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; ++y)
    for (let x = 0; x < 8; ++x)
      rgba[4 * (8 * y + x) + 3] = y < 4 || x % 2 === 0 ? 255 : 0;
  return encodePortraitPng({ width: 8, height: 8, rgba });
};

/**
 * Globes whose corneal apex lies at y = 0 on each side. Lash card on the
 * right: an upper unit square (x 1..2, y 0.1..1.1) textured by rows 0-3 and
 * a lower half-height one (y -0.6..-0.1) textured by rows 4-7.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const skin = createPortraitMaterials()[0]!;
  return {
    id: "analytic-lash/1",
    channels: [],
    surfaces: [
      {
        id: "eyes",
        positions: [
          -1, 0, 1, -1.2, -0.5, 0, -0.8, -0.5, 0, 1, 0, 1, 1.2, -0.5, 0, 0.8,
          -0.5, 0,
        ],
        indices: [0, 1, 2, 3, 4, 5],
        targets: {},
        regions: [
          {
            id: "eyes/eye",
            material: "lash",
            indices: [0, 1, 2, 3, 4, 5],
            uvs: null,
          },
        ],
      },
      {
        id: "lashes",
        positions: [
          1, 0.1, 1, 2, 0.1, 1, 2, 1.1, 1, 1, 1.1, 1, 1, -0.6, 1, 2, -0.6, 1, 2,
          -0.1, 1, 1, -0.1, 1,
        ],
        indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
        targets: {},
        regions: [
          {
            id: "lashes/lash",
            material: "lash",
            indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
            uvs: [
              0, 0.5, 1, 0.5, 1, 0, 0, 0.5, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0.5, 0,
              1, 1, 0.5, 0, 0.5,
            ],
          },
        ],
      },
    ],
    materials: [
      {
        ...skin,
        id: "lash",
        name: "lash",
        baseColorTexture: texture(),
        alphaMode: "mask",
        alphaCutoff: 0.5,
      },
    ],
  };
};

/**
 * The lower lash coverage revision.
 * Scenarios:
 * 1. The card splits at the corneal apex into one upper and one lower
 *    region, the lower on a copy of the lash material; the upper lengths
 *    read 1 and 0.5 (area over span).
 * 2. With count 0.25 the target is the upper's coverage 1 times 0.25 times
 *    0.5; the lower card covers more, so whole strands (8-connected
 *    columns) go at even spacing until it does not exceed the target, each
 *    column is either kept whole or cleared whole, and the upper texture is
 *    untouched.
 * 3. With count 1 the lower card is already under its target and keeps
 *    every strand.
 * 4. A repeated revision, a count out of (0, 1], a card with no lower
 *    piece, missing eyes and an untextured lash material refuse.
 */
export const test_subject_lower_lash_basis_preparation = (): void => {
  const basis = head();
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-lash/2",
    lashes: "lashes",
    eyes: "eyes",
    count: 0.25,
  };
  const prepared = prepareLowerLashBasis(base);
  const regions = prepared.basis.surfaces[1]!.regions;
  const { receipt } = prepared;
  TestValidator.predicate(
    "split",
    regions.length === 2 &&
      regions[0]!.indices.join() === "0,1,2,0,2,3" &&
      regions[1]!.indices.join() === "4,5,6,4,6,7" &&
      regions[1]!.material === "lash.lower" &&
      receipt.length.upper === 1 &&
      receipt.length.lower === 0.5 &&
      prepared.documents[0]!.basis === "analytic-lash/2",
  );
  const lower = decodePortraitPng(
    prepared.basis.materials.find((one) => one.id === "lash.lower")!
      .baseColorTexture as string,
  );
  const column = (x: number) =>
    [4, 5, 6, 7].map((y) => lower.rgba[4 * (8 * y + x) + 3]!);
  const kept = [0, 2, 4, 6].filter((x) => column(x).every((a) => a === 255));
  const cleared = [0, 2, 4, 6].filter((x) => column(x).every((a) => a === 0));
  TestValidator.predicate(
    "thinned",
    receipt.lowerCovered.target === 0.125 &&
      receipt.lowerCovered.before > receipt.lowerCovered.target &&
      receipt.lowerCovered.after <= receipt.lowerCovered.target &&
      receipt.clumps.before === 4 &&
      receipt.clumps.kept === kept.length &&
      kept.length + cleared.length === 4 &&
      kept.length > 0 &&
      cleared.length > 0 &&
      prepared.basis.materials[0]!.baseColorTexture ===
        basis.materials[0]!.baseColorTexture &&
      [0, 1, 2, 3].every((y) =>
        [0, 1, 2, 3, 4, 5, 6, 7].every(
          (x) => lower.rgba[4 * (8 * y + x) + 3] === 255,
        ),
      ),
  );
  const full = prepareLowerLashBasis({ ...base, count: 1 }).receipt;
  TestValidator.predicate(
    "within target",
    full.clumps.kept === 4 &&
      full.lowerCovered.after === full.lowerCovered.before,
  );
  const upperOnly = head();
  upperOnly.surfaces[1]!.regions[0]!.indices = [0, 1, 2, 0, 2, 3];
  upperOnly.surfaces[1]!.regions[0]!.uvs =
    upperOnly.surfaces[1]!.regions[0]!.uvs!.slice(0, 12);
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareLowerLashBasis({ ...base, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareLowerLashBasis({ ...base, count: 0 }),
        "count ratio",
      ) &&
      throwsError(
        () => prepareLowerLashBasis({ ...base, basis: upperOnly }),
        "both an upper and a lower piece",
      ) &&
      throwsError(
        () => prepareLowerLashBasis({ ...base, eyes: "absent" }),
        "one textured lash region and the eyes",
      ) &&
      throwsError(
        () =>
          prepareLowerLashBasis({
            ...base,
            basis: {
              ...basis,
              materials: [{ ...basis.materials[0]!, baseColorTexture: null }],
            },
          }),
        "textured material",
      ),
  );
};
