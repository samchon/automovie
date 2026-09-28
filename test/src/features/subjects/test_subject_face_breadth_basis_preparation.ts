import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareFaceBreadthBasis } from "../../../scripts/face-review/prepareFaceBreadthBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Vertices placed where the frame's weights are known. */
const POINTS: [number, number, number][] = [
  [0.03, 0.01, 0.1], // 0: within the canthus: stays
  [0.07, 0.01, 0.1], // 1: past the side, at full height and depth
  [-0.07, 0.01, 0.1], // 2: the other side, mirrored
  [0.055, 0.01, 0.1], // 3: halfway across: smoothstep 0.5
  [0.07, 0.035, 0.1], // 4: halfway up to the brows: 0.5
  [0.07, 0.05, 0.1], // 5: at the brows: stays
  [0.07, -0.015, 0.1], // 6: halfway down to the mouth: 0.5
  [0.07, 0.01, 0.025], // 7: halfway into the fade behind the ears: 0.5
  [0.07, 0.01, 0.0], // 8: behind the fade: stays
];
const fixture = (): IAutoMovieHumanFaceBasis =>
  ({
    id: "breadth/1",
    channels: [],
    surfaces: [
      {
        id: "skin",
        positions: POINTS.flat(),
        indices: [],
        targets: {},
        regions: [],
      },
    ],
  }) as never;
const frame = {
  canthus: 0.04,
  side: 0.07,
  brow: 0.05,
  zygion: 0.02,
  tip: 0,
  mouth: -0.03,
  ear: 0.04,
  behind: 0.03,
};

/**
 * A control for the face's breadth beside the eyes.
 * Scenarios:
 * 1. Narrower moves a vertex past the face's side, between the zygion and
 *    the nasal tip and in front of the ears, the whole unit toward the
 *    midline on either side; halfway across from the canthus, halfway up
 *    to the brows, halfway down to the mouth and halfway into the fade
 *    behind the ears each move half of it (smoothstep); the eyes' span,
 *    the brows' height and the skull behind stay. Broader is the mirror.
 * 2. The channel spans its envelope; the revision restamps and leaves the
 *    source as it was.
 * 3. A stale revision, a side inside the canthus, heights out of order, a
 *    fade or unit not positive, an envelope not holding both directions, a
 *    channel already present and a missing surface refuse.
 */
export const test_subject_face_breadth_basis_preparation = (): void => {
  const source = fixture();
  const before = JSON.stringify(source);
  const input = {
    basis: source,
    documents: [
      { id: "a", basis: "breadth/1", shape: {}, expression: {} },
    ] as never,
    controls: { basis: "breadth/1", controls: [] } as never,
    revision: "breadth/2",
    skin: "skin",
    channel: "faceBreadth",
    frame,
    unit: 0.004,
    envelope: [-2, 2] as [number, number],
  };
  const prepared = prepareFaceBreadthBasis(input);
  const skin = prepared.basis.surfaces[0]!;
  const rows = (name: string) => {
    const flat = skin.targets[name]!;
    const out = new Map<number, number>();
    for (let i = 0; i < flat.length; i += 4) out.set(flat[i]!, flat[i + 1]!);
    return out;
  };
  const narrower = rows("faceBreadth.narrower");
  const broader = rows("faceBreadth.broader");
  TestValidator.predicate(
    "narrower and broader",
    nclose(narrower.get(1)!, -0.004, 1e-12) &&
      nclose(narrower.get(2)!, 0.004, 1e-12) &&
      [3, 4, 6, 7].every((v) => nclose(narrower.get(v)!, -0.002, 1e-12)) &&
      [0, 5, 8].every((v) => !narrower.has(v)) &&
      [...narrower].every(([v, dx]) => broader.get(v) === -dx),
  );
  const channel = prepared.basis.channels[0]!;
  TestValidator.predicate(
    "channel and stamps",
    channel.id === "faceBreadth" &&
      channel.minimum === -2 &&
      channel.maximum === 2 &&
      channel.positive === "faceBreadth.broader" &&
      channel.negative === "faceBreadth.narrower" &&
      prepared.basis.id === "breadth/2" &&
      prepared.documents[0]!.basis === "breadth/2" &&
      prepared.controls.basis === "breadth/2" &&
      prepared.receipt.rows === 6 &&
      JSON.stringify(source) === before,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareFaceBreadthBasis({ ...input, revision: "breadth/1" }),
      "distinct revision",
    ) &&
      throwsError(
        () =>
          prepareFaceBreadthBasis({
            ...input,
            frame: { ...frame, side: 0.03 },
          }),
        "beyond the outer canthus",
      ) &&
      throwsError(
        () =>
          prepareFaceBreadthBasis({ ...input, frame: { ...frame, tip: 0.03 } }),
        "descend in turn",
      ) &&
      throwsError(
        () =>
          prepareFaceBreadthBasis({ ...input, frame: { ...frame, behind: 0 } }),
        "positive",
      ) &&
      throwsError(
        () => prepareFaceBreadthBasis({ ...input, unit: 0 }),
        "positive",
      ) &&
      throwsError(
        () => prepareFaceBreadthBasis({ ...input, envelope: [0, 2] }),
        "both directions",
      ) &&
      throwsError(
        () =>
          prepareFaceBreadthBasis({
            ...input,
            basis: prepared.basis,
            revision: "breadth/3",
          }),
        "already has",
      ) &&
      throwsError(
        () => prepareFaceBreadthBasis({ ...input, skin: "none" }),
        "No surface",
      ),
  );
};
