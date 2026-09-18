import {
  type IAutoMovieHumanFaceGroom,
  resolveHumanFaceGroom,
} from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/** A finish the groom can name without any face having to carry one. */
const finish = {
  id: "study-hair",
  name: "study-hair",
  baseColor: { r: 0.1, g: 0.08, b: 0.06, a: 1, hex: null },
  roughness: 0.4,
  metallic: 0,
  opacity: 1,
  emissive: null,
  baseColorTexture: null,
  doubleSided: true,
};

/** Everything a groom controls except where its locks live. */
const profile = {
  segments: 2,
  widthScale: 1,
  tipWidth: 0.5,
  taperStart: 0,
  seed: 7,
  fibres: 4,
  coverage: 0.9,
};

/**
 * A face of one triangle, so the seat frame is readable by hand: the first edge
 * runs along +X, the surface normal along +Z, and their cross along +Y.
 */
const face = (corners: number[][]): IAutoMovieModel => ({
  id: "scalp",
  name: "scalp",
  origin: "imported",
  parts: [
    {
      id: "Human/skin",
      name: "Human/skin",
      material: "skin",
      geometry: {
        type: "mesh",
        mesh: {
          positions: corners.flat(),
          indices: [0, 1, 2],
          normals: null,
          uvs: null,
          skin: null,
        },
      },
      attachedBone: null,
      transform: null,
    },
  ],
  materials: [],
  skeleton: null,
  body: null,
  asset: null,
});

const groom = (
  cards: IAutoMovieHumanFaceGroom["cards"],
): IAutoMovieHumanFaceGroom => ({
  version: "human-face-groom/1",
  id: "study-groom",
  basis: "study-basis",
  finish,
  profile,
  cards,
});

/**
 * A seated lock is rebuilt from the triangle it names, wherever that now is.
 *
 * The reference triangle puts its first edge on +X and its normal on +Z, so the
 * seat frame is the identity and every expected station is arithmetic on the
 * inputs: a lock seated at the triangle's midpoint of the first edge, standing
 * 0.1 m along the normal, must come back at that point plus that offset, in the
 * millimetres the shared card tessellator reads.
 *
 * The test that matters is the second one. The same groom is resolved against a
 * moved and turned triangle, and the lock has to arrive moved and turned with
 * it, because that is the whole reason a groom names a seat instead of holding
 * a position. Nothing in the groom changes between the two calls.
 *
 * Scenarios:
 * 1. Stations and width come back in millimetres at the seat plus the stored offset.
 * 2. Moving and turning the seating triangle carries the lock with it, unchanged input.
 * 3. Across vectors ride the frame's rotation without picking up the seat's translation.
 * 4. An unindexed surface means consecutive position triples.
 * 5. A lock naming an absent surface, a triangle past the end, a fractional ordinal or a collapsed triangle refuses.
 * 6. An empty groom resolves to an empty card population rather than refusing.
 */
export const test_subject_human_groom_seating = (): void => {
  const reference = face([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ]);
  const card = {
    part: "Human/skin",
    triangle: 0,
    weights: [0.5, 0] as readonly [number, number],
    guide: [
      [0, 0, 0],
      [0, 0, 0.1],
    ] as readonly (readonly [number, number, number])[],
    across: [
      [0, 1, 0],
      [0, 1, 0],
    ] as readonly (readonly [number, number, number])[],
    width: 0.012,
  };
  const seated = resolveHumanFaceGroom({
    groom: groom([card]),
    model: reference,
  });
  TestValidator.equals(
    "the profile and finish travel with the resolved cards",
    { ...seated, cards: seated.cards.length },
    { ...profile, material: "study-hair", cards: 1 },
  );
  TestValidator.equals(
    "stations arrive in millimetres at the seat plus the stored offset",
    seated.cards[0].guide,
    [
      [500, 0, 0],
      [500, 0, 100],
    ],
  );
  TestValidator.equals(
    "across vectors keep their frame direction",
    seated.cards[0].across,
    [
      [0, 1, 0],
      [0, 1, 0],
    ],
  );
  TestValidator.equals(
    "width arrives in millimetres",
    seated.cards[0].width,
    12,
  );

  // The same triangle, slid one metre along Y and turned a quarter turn about
  // Z: its first edge now runs along +Y, so the lock's own +Z offset is
  // unchanged while its seat follows the edge.
  const moved = resolveHumanFaceGroom({
    groom: groom([card]),
    model: face([
      [0, 1, 0],
      [0, 2, 0],
      [-1, 1, 0],
    ]),
  });
  TestValidator.predicate(
    "a moved and turned seat carries its lock with it",
    moved.cards[0].guide.every((station, index) =>
      station.every((value, axis) =>
        nclose(value, [[0, 1500, 0], [0, 1500, 100]][index][axis]),
      ),
    ),
  );
  TestValidator.predicate(
    "across vectors turn with the frame and gain no translation",
    moved.cards[0].across.every((direction) =>
      direction.every((value, axis) => nclose(value, [-1, 0, 0][axis])),
    ),
  );

  const unindexed = face([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ]);
  (
    unindexed.parts[0].geometry as { mesh: { indices: number[] | null } }
  ).mesh.indices = null;
  TestValidator.equals(
    "an unindexed surface means consecutive position triples",
    resolveHumanFaceGroom({ groom: groom([card]), model: unindexed }).cards[0]
      .guide,
    seated.cards[0].guide,
  );

  for (const [reason, broken] of [
    ["names a surface this face does not have", { ...card, part: "Human/hat" }],
    ["names a triangle outside its surface", { ...card, triangle: 1 }],
    ["names a triangle outside its surface", { ...card, triangle: -1 }],
    ["names a triangle outside its surface", { ...card, triangle: 0.5 }],
  ] as const)
    TestValidator.predicate(
      "an unresolvable seat refuses: " + reason,
      throwsError(
        () => resolveHumanFaceGroom({ groom: groom([broken]), model: reference }),
        reason,
      ),
    );
  TestValidator.predicate(
    "a seat on a collapsed triangle refuses",
    throwsError(
      () =>
        resolveHumanFaceGroom({
          groom: groom([card]),
          model: face([
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0],
          ]),
        }),
      "collapsed triangle",
    ),
  );
  TestValidator.equals(
    "an empty groom resolves to no cards",
    resolveHumanFaceGroom({ groom: groom([]), model: reference }).cards,
    [],
  );
};
