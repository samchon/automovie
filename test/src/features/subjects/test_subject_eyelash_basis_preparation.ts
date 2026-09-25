import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
  decodePortraitPng,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  type IEyelashCard,
  type IEyelashNorm,
  drawEyelashTexture,
  faceEyelashAlong,
  faceEyelashCards,
  faceEyelashLift,
  prepareEyelashBasis,
} from "../../../scripts/face-review/prepareEyelashBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A flat lash card 5 columns by 3 rows: columns at x = 0.01 + 0.005c
 * (medial to lateral), rows at y = 0.005r in z = 0, so the card is 20 mm
 * along the lid and 10 mm from root to tip; UV u = 0.1 + 0.2c,
 * v = 0.8 - 0.3r, so 10 mm across the card is 0.6 of the texture. `side`
 * mirrors x, making a second card on the same UV strip.
 */
const card = (offset: number, side = 1) => {
  const positions: number[] = [];
  const uvOf: [number, number][] = [];
  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 5; ++c) {
      positions.push(side * (0.01 + 0.005 * c), 0.005 * r, 0);
      uvOf.push([0.1 + 0.2 * c, 0.8 - 0.3 * r]);
    }
  const indices: number[] = [];
  const uvs: number[] = [];
  const at = (r: number, c: number) => 5 * r + c;
  for (let r = 0; r < 2; ++r)
    for (let c = 0; c < 4; ++c)
      for (const v of [
        at(r, c),
        at(r, c + 1),
        at(r + 1, c + 1),
        at(r, c),
        at(r + 1, c + 1),
        at(r + 1, c),
      ]) {
        indices.push(offset + v);
        uvs.push(...uvOf[v]!);
      }
  return { positions, indices, uvs };
};

/** The lid's skin just below each root, 0.5 mm away. */
const skin = [0, 1, 2, 3, 4].flatMap((c) => [0.01 + 0.005 * c, -0.0005, 0]);

const norm = (change: Partial<IEyelashNorm> = {}): IEyelashNorm => ({
  region: "lash/upper",
  material: "lash",
  count: 5,
  length: { medial: 5, central: 5, lateral: 5 },
  diameter: 0.1,
  growing: 0,
  ...change,
});

/** Rows of the drawn texture that hold any coverage. */
const covered = (rgba: Uint8Array, size: number) => {
  const rows = new Set<number>();
  for (let y = 0; y < size; ++y)
    for (let x = 0; x < size; ++x)
      if (rgba[4 * (y * size + x) + 3]! > 0) rows.add(y);
  return rows;
};

/**
 * Lash cards redrawn from lash anatomy.
 * Scenarios:
 * 1. A card's root edge is its long row by the lid's skin, its tip edge the
 *    other, one vertex per column and in the same order; a mirrored card on
 *    the same UV strip is drawn once; a card that is not a grid (a single
 *    triangle) and a boundary of two loops (a ring) refuse.
 * 2. The helpers read a polyline by its vertices and lift a UV point to the
 *    card's surface, skipping a triangle with no UV area and answering null
 *    outside the card.
 * 3. Five 5 mm lashes of 0.1 mm run from the root row (v = 0.8, texture row
 *    80) 30 texture rows toward the tip and no farther, with partial
 *    coverage; growing lashes, each some share of that, stay within it; a
 *    lash longer than the card stops at its tip row (20); a lash of no
 *    length draws nothing.
 * 4. The basis's lash material takes the new texture and blends it, a
 *    blended brow material blends its own, the documents and controls name
 *    the revision, and a repeated revision, a missing surface, an unmapped
 *    region and an unknown lash or blended material refuse.
 */
export const test_subject_eyelash_basis_preparation = (): void => {
  const one = card(0);
  const mirrored = card(15, -1);
  const cards = faceEyelashCards({
    positions: [...one.positions, ...mirrored.positions],
    indices: [...one.indices, ...mirrored.indices],
    uvs: [...one.uvs, ...mirrored.uvs],
    skin,
  });
  const [first] = cards;
  const medialFirst = first!.root[0]![0] < 0.5;
  TestValidator.predicate(
    "cards",
    cards.length === 1 &&
      first!.root.length === 5 &&
      first!.tip.length === 5 &&
      first!.root.every((p) => nclose(p[1], 0.8, 1e-12)) &&
      first!.tip.every((p) => nclose(p[1], 0.2, 1e-12)) &&
      first!.root.every((p, k) => nclose(p[0], first!.tip[k]![0], 1e-12)) &&
      first!.lateralFirst === !medialFirst,
  );
  const triangle = {
    positions: [0, 0, 0, 0.01, 0, 0, 0, 0.01, 0],
    indices: [0, 1, 2],
    uvs: [0, 0, 1, 0, 0, 1],
  };
  // A 3 by 3 grid of quads without its centre quad has two boundary loops.
  const ring = (() => {
    const positions: number[] = [];
    for (let r = 0; r < 4; ++r)
      for (let c = 0; c < 4; ++c) positions.push(0.01 * c, 0.01 * r, 0);
    const indices: number[] = [];
    for (let r = 0; r < 3; ++r)
      for (let c = 0; c < 3; ++c)
        if (r !== 1 || c !== 1) {
          const v = 4 * r + c;
          indices.push(v, v + 1, v + 5, v, v + 5, v + 4);
        }
    return {
      positions,
      indices,
      uvs: indices.flatMap((v) => [
        positions[3 * v]! * 10,
        positions[3 * v + 1]! * 10,
      ]),
    };
  })();
  TestValidator.predicate(
    "card refusals",
    throwsError(
      () => faceEyelashCards({ ...triangle, skin }),
      "four corners",
    ) && throwsError(() => faceEyelashCards({ ...ring, skin }), "one loop"),
  );

  const flat: IEyelashCard = {
    root: [
      [0, 0],
      [1, 0],
    ],
    tip: [
      [0, 1],
      [1, 1],
    ],
    triangles: [
      {
        uv: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        xyz: [
          [9, 9, 9],
          [9, 9, 9],
          [9, 9, 9],
        ],
      },
      {
        uv: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        xyz: [
          [0, 0, 0],
          [2, 0, 0],
          [0, 2, 0],
        ],
      },
    ],
    lateralFirst: false,
  };
  const lifted = faceEyelashLift(flat, [0.25, 0.25]);
  TestValidator.predicate(
    "helpers",
    faceEyelashAlong(
      [
        [0, 0],
        [1, 0],
        [1, 3],
      ],
      0.75,
    ).every((value, k) => nclose(value, [1, 1.5][k]!, 1e-12)) &&
      lifted !== null &&
      lifted.every((value, k) => nclose(value, [0.5, 0.5, 0][k]!, 1e-12)) &&
      faceEyelashLift(flat, [0.9, 0.9]) === null,
  );

  const size = 100;
  const drawn = drawEyelashTexture({ cards, norm: norm(), size, seed: 3 });
  const rows = covered(drawn, size);
  let partial = false;
  for (let i = 3; i < drawn.length; i += 4)
    if (drawn[i]! > 0 && drawn[i]! < 255) partial = true;
  const long = covered(
    drawEyelashTexture({
      cards,
      norm: norm({ length: { medial: 30, central: 30, lateral: 30 } }),
      size,
      seed: 3,
    }),
    size,
  );
  const growing = covered(
    drawEyelashTexture({ cards, norm: norm({ growing: 1 }), size, seed: 3 }),
    size,
  );
  const none = covered(
    drawEyelashTexture({
      cards,
      norm: norm({ length: { medial: 0, central: 0, lateral: 0 } }),
      size,
      seed: 3,
    }),
    size,
  );
  TestValidator.predicate(
    "fibres",
    rows.has(79) &&
      rows.has(52) &&
      !rows.has(47) &&
      Math.min(...rows) >= 48 &&
      partial &&
      Math.min(...long) >= 18 &&
      long.has(21) &&
      growing.size > 0 &&
      Math.min(...growing) >= 48 &&
      none.size === 0,
  );

  const basis: IAutoMovieHumanFaceBasis = {
    id: "analytic-lash/1",
    channels: [
      {
        id: "lift",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "up",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "lash",
        positions: [...one.positions, ...mirrored.positions],
        indices: [...one.indices, ...mirrored.indices],
        targets: { up: [0, 0, 0.001, 0] },
        regions: [
          {
            id: "lash/upper",
            material: "lash",
            indices: [...one.indices, ...mirrored.indices],
            uvs: [...one.uvs, ...mirrored.uvs],
          },
          { id: "lash/bare", material: "lash", indices: [0, 1, 6], uvs: null },
        ],
      },
      {
        id: "skin",
        positions: [...skin, 0.03, 0.001, -0.01],
        indices: [0, 4, 5],
        targets: {},
        regions: [
          { id: "skin/all", material: "skin", indices: [0, 4, 5], uvs: null },
        ],
      },
    ],
    materials: [
      ...createPortraitMaterials().filter((material) => material.id === "skin"),
      {
        id: "lash",
        name: "lash",
        baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
        roughness: 0.5,
        metallic: 0,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
        alphaMode: "mask",
        alphaCutoff: 0.2,
      },
      {
        id: "brow",
        name: "brow",
        baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
        roughness: 0.5,
        metallic: 0,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
        alphaMode: "mask",
        alphaCutoff: 0.15,
      },
    ],
  };
  const base = {
    basis,
    documents: [
      { id: "d", name: "d", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-lash/2",
    surface: "lash",
    skin: "skin",
    norms: [norm()],
    blended: ["brow"],
    size,
    seed: 3,
  };
  const prepared = prepareEyelashBasis(base);
  const material = prepared.basis.materials.find((one) => one.id === "lash")!;
  const brow = prepared.basis.materials.find((one) => one.id === "brow")!;
  const image = decodePortraitPng(material.baseColorTexture as string);
  TestValidator.predicate(
    "material",
    material.alphaMode === "blend" &&
      material.alphaCutoff === undefined &&
      brow.alphaMode === "blend" &&
      brow.alphaCutoff === undefined &&
      image.width === size &&
      image.rgba.every((value, i) => value === drawn[i]) &&
      prepared.receipt.lids[0]!.cards === 1 &&
      prepared.receipt.lids[0]!.drawn > 0 &&
      basis.materials[1]!.alphaMode === "mask",
  );
  TestValidator.equals(
    "restamped",
    [
      prepared.basis.id,
      prepared.documents[0]!.basis,
      prepared.controls.basis,
      prepared.receipt.source,
    ],
    [
      "analytic-lash/2",
      "analytic-lash/2",
      "analytic-lash/2",
      "analytic-lash/1",
    ],
  );
  const refuse = (change: object, message: string) =>
    throwsError(() => prepareEyelashBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ surface: "none" }, "lash and skin") &&
      refuse({ skin: "none" }, "lash and skin") &&
      refuse({ norms: [norm({ region: "lash/bare" })] }, "No mapped") &&
      refuse({ norms: [norm({ region: "none" })] }, "No mapped") &&
      refuse({ norms: [norm({ material: "none" })] }, "No material") &&
      refuse({ blended: ["none"] }, "No material none"),
  );
};
