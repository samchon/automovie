import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareCranialBreadthBasis } from "../../../scripts/face-review/prepareCranialBreadthBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Vertices placed where the frame's weights are known. */
const POINTS: [number, number, number][] = [
  [0.07, 0.05, 0.03], // 0: the euryon: every step is one
  [-0.07, 0.05, 0.03], // 1: the other side, mirrored
  [0.06, 0.05, 0.03], // 2: halfway across from the brows' end: 0.5
  [0.07, 0.025, 0.03], // 3: halfway up from the ear bottom: 0.5
  [0.07, 0.05, 0.07], // 4: halfway into the fade toward the brow's end: 0.5
  [0.05, 0.05, 0.03], // 5: at the brows' lateral end: stays
  [0.07, 0, 0.03], // 6: at the ear bottom: stays
  [0.07, 0.05, 0.11], // 7: at the brow's end: stays
  [0, 0.05, 0.03], // 8: on the midline: stays
  [0.08, 0.025, 0.04], // 9: auricle, its nearest skin is vertex 3
  [0.08, 0.01, 0.03], // 10: auricle, its nearest skin is vertex 6
  [-0.08, 0.025, 0.04], // 11: auricle of the other side, nearest skin is 12
  [-0.07, 0.025, 0.03], // 12: the other side of vertex 3
  [0.07, 0.02, 0.08], // 13: the face below the ear top, ahead of the ears: stays
];
const AURICLES = [9, 10, 11];
const fixture = (): IAutoMovieHumanFaceBasis =>
  ({
    id: "cranial/1",
    channels: [],
    surfaces: [
      {
        id: "skin",
        positions: POINTS.flat(),
        indices: [],
        targets: {},
        regions: [],
      },
      {
        id: "eyes",
        positions: [0.07, 0.05, 0.03],
        indices: [],
        targets: {},
        regions: [],
      },
    ],
  }) as never;
const frame = {
  side: 0.07,
  euryon: 0.05,
  depth: 0.03,
  earBottom: 0,
  earTop: 0.03,
  earFront: 0.06,
  browSide: 0.05,
  front: 0.11,
};

/**
 * A control for the neurocranium's breadth apart from the face, and a neutral
 * set to a stated breadth.
 * Scenarios:
 * 1. A weight of one moves the euryon vertex the whole unit away from the
 *    midline on either side; halfway across from the brows' end, halfway up
 *    from the ear bottom and halfway toward the ear front each move half of
 *    it (smoothstep); the brows' end, the ear bottom, the ear front (the face)
 *    and the midline stay, and an auricle vertex takes the whole displacement of
 *    its nearest non-auricle vertex, the skin it sits on, on either side, so
 *    one whose root does not move stays too. The narrower endpoint is the mirror.
 * 2. The neutral takes `(neutral breadth - 2 side) / (2 unit)` of the rows, so
 *    the euryon reads exactly the stated breadth and the vertices without a
 *    row and the other surfaces keep their positions, while a document gains
 *    the negative of that weight beside its own shape and so keeps its
 *    geometry. The revision restamps and leaves the source as it was.
 * 3. A neutral that equals the source breadth bakes nothing and migrates
 *    each document by zero.
 * 4. A stale revision, a frame out of order, a unit or neutral not positive,
 *    an envelope not holding both directions or not admitting the migration
 *    weight, a channel already present, a document already setting it and a
 *    missing surface refuse.
 */
export const test_subject_cranial_breadth_basis_preparation = (): void => {
  const source = fixture();
  const before = JSON.stringify(source);
  const input = {
    basis: source,
    documents: [
      {
        id: "a",
        basis: "cranial/1",
        shape: { headWidth: 0.25 },
        expression: {},
      },
    ] as never,
    controls: { basis: "cranial/1", controls: [] } as never,
    revision: "cranial/2",
    skin: "skin",
    channel: "cranialBreadth",
    frame,
    auricles: AURICLES,
    unit: 0.005,
    envelope: [-2, 3] as [number, number],
    neutralBreadth: 0.15,
  };
  const prepared = prepareCranialBreadthBasis(input);
  const skin = prepared.basis.surfaces[0]!;
  const rows = (name: string) => {
    const flat = skin.targets[name]!;
    const out = new Map<number, number>();
    for (let i = 0; i < flat.length; i += 4) out.set(flat[i]!, flat[i + 1]!);
    return out;
  };
  const broader = rows("cranialBreadth.broader");
  const narrower = rows("cranialBreadth.narrower");
  TestValidator.predicate(
    "weights",
    nclose(broader.get(0)!, 0.005, 1e-12) &&
      nclose(broader.get(1)!, -0.005, 1e-12) &&
      [2, 3, 4, 9].every((v) => nclose(broader.get(v)!, 0.0025, 1e-12)) &&
      nclose(broader.get(12)!, -0.0025, 1e-12) &&
      nclose(broader.get(11)!, -0.0025, 1e-12) &&
      [5, 6, 7, 8, 10, 13].every((v) => !broader.has(v)) &&
      [...broader].every(([v, dx]) => narrower.get(v) === -dx),
  );
  const baked = skin.positions;
  TestValidator.predicate(
    "neutral",
    nclose(prepared.receipt.bakedWeight, 1, 1e-12) &&
      nclose(2 * baked[0]!, 0.15, 1e-12) &&
      nclose(baked[3]!, -0.075, 1e-12) &&
      [5, 6, 7, 8, 10, 13].every((v) => baked[3 * v] === POINTS[v]![0]) &&
      nclose(baked[27]!, 0.0825, 1e-12) &&
      POINTS.every(
        (point, v) =>
          baked[3 * v + 1] === point[1] && baked[3 * v + 2] === point[2],
      ) &&
      prepared.basis.surfaces[1]!.positions[0] === 0.07 &&
      prepared.documents[0]!.shape["headWidth"] === 0.25 &&
      nclose(prepared.documents[0]!.shape["cranialBreadth"]!, -1, 1e-12) &&
      JSON.stringify(source) === before,
  );
  const channel = prepared.basis.channels[0]!;
  TestValidator.predicate(
    "channel and stamps",
    channel.id === "cranialBreadth" &&
      channel.minimum === -2 &&
      channel.maximum === 3 &&
      channel.positive === "cranialBreadth.broader" &&
      channel.negative === "cranialBreadth.narrower" &&
      prepared.basis.id === "cranial/2" &&
      prepared.documents[0]!.basis === "cranial/2" &&
      prepared.controls.basis === "cranial/2" &&
      prepared.receipt.rows === 8,
  );
  const unchanged = prepareCranialBreadthBasis({
    ...input,
    neutralBreadth: 0.14,
  });
  TestValidator.predicate(
    "no bake",
    unchanged.receipt.bakedWeight === 0 &&
      unchanged.basis.surfaces[0]!.positions.every(
        (value, i) => value === POINTS.flat()[i],
      ) &&
      unchanged.documents[0]!.shape["cranialBreadth"] === 0,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareCranialBreadthBasis({ ...input, revision: "cranial/1" }),
      "distinct revision",
    ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            frame: { ...frame, earBottom: 0.05 },
          }),
        "order as a head",
      ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            frame: { ...frame, browSide: 0.07 },
          }),
        "order as a head",
      ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            frame: { ...frame, earFront: 0.03 },
          }),
        "order as a head",
      ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            frame: { ...frame, front: 0.05 },
          }),
        "order as a head",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, unit: 0 }),
        "positive",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, neutralBreadth: 0 }),
        "positive",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, envelope: [0, 2] }),
        "both directions",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, envelope: [-0.5, 3] }),
        "keeps each document",
      ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            basis: prepared.basis,
            revision: "cranial/3",
          }),
        "already has",
      ) &&
      throwsError(
        () =>
          prepareCranialBreadthBasis({
            ...input,
            documents: [
              {
                id: "b",
                basis: "cranial/1",
                shape: { cranialBreadth: 0.1 },
                expression: {},
              },
            ] as never,
          }),
        "already sets",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, auricles: [] }),
        "name vertices",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, auricles: [99] }),
        "name vertices",
      ) &&
      throwsError(
        () => prepareCranialBreadthBasis({ ...input, skin: "none" }),
        "No surface",
      ),
  );
};
