import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceLidCreaseDepth,
  faceSkinNormals,
  prepareLidCreaseBasis,
} from "../../../scripts/face-review/prepareLidCreaseBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A flat patch in the plane z = 0.1 facing +z (two triangles), whose fold
 * channel's negative presses vertex 0 in by 2 mm and slides it up by 1,
 * and vertex 1 out by 1 mm; a second surface is moved by the same target.
 */
const fixture = (): IAutoMovieHumanFaceBasis =>
  ({
    id: "lid/1",
    channels: [
      {
        id: "fold",
        kind: "shape",
        minimum: -0.3,
        maximum: 1,
        positive: "fold.incr",
        negative: "fold.decr",
      },
      {
        id: "gaze",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "gaze",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions: [0, 0, 0.1, 0.01, 0, 0.1, 0, 0.01, 0.1, 0.01, 0.01, 0.1],
        indices: [0, 1, 2, 2, 1, 3],
        targets: {
          "fold.decr": [0, 0, 0.001, -0.002, 1, 0.0005, 0, 0.001],
          "fold.incr": [0, 0, 0, 0.001],
        },
        regions: [],
      },
      {
        id: "lashes",
        positions: [0, 0, 0.1],
        indices: [],
        targets: { "fold.decr": [0, 0, 0.001, 0] },
        regions: [],
      },
    ],
  }) as never;

/**
 * The upper lid's crease as its fold's concave side.
 * Scenarios:
 * 1. The skin's negative rows stay as drawn (the cleft slides up behind the
 *    fold), the side's minimum becomes the given one, and the receipt gives
 *    the deepest inward part along the normal (2 mm) and the largest part
 *    along the skin (1 mm); the normals are the triangles' unit normal, and a
 *    vertex no triangle uses has none.
 * 2. The positive endpoint and other surfaces' rows stay; the basis,
 *    documents and control map are restamped and the source is untouched.
 * 3. A stale revision, a minimum outside [-1, 0), a missing surface, a
 *    channel without a negative and a negative not moving the skin refuse.
 */
export const test_subject_lid_crease_basis_preparation = (): void => {
  const source = fixture();
  const before = JSON.stringify(source);
  const input = {
    basis: source,
    documents: [
      { id: "a", basis: "lid/1", shape: {}, expression: {} },
    ] as never,
    controls: { basis: "lid/1", controls: [] } as never,
    revision: "lid/2",
    skin: "skin",
    channels: ["fold"],
    minimum: -0.72,
  };
  const prepared = prepareLidCreaseBasis(input);
  const skin = prepared.basis.surfaces[0]!;
  const rows = skin.targets["fold.decr"]!;
  const channel = prepared.basis.channels[0]!;
  const receipt = prepared.receipt.channels[0]!;
  const normals = faceSkinNormals([...skin.positions, 0, 0, 0.2], skin.indices);
  const alone = faceLidCreaseDepth([4, 0, 0, -0.003], normals);
  TestValidator.predicate(
    "the cleft kept",
    JSON.stringify(rows) ===
      JSON.stringify(fixture().surfaces[0]!.targets["fold.decr"]) &&
      nclose(receipt.depth, 0.002, 1e-12) &&
      nclose(receipt.slide, 0.001, 1e-12) &&
      receipt.rows === 2 &&
      channel.minimum === -0.72 &&
      channel.maximum === 1 &&
      prepared.receipt.minimum === -0.72 &&
      normals.slice(0, 3).join() === "0,0,1" &&
      normals.slice(12).join() === "0,0,0" &&
      alone.depth === 0 &&
      alone.slide === 0.003,
  );
  TestValidator.predicate(
    "the rest stays",
    JSON.stringify(skin.targets["fold.incr"]) === "[0,0,0,0.001]" &&
      JSON.stringify(prepared.basis.surfaces[1]!.targets["fold.decr"]) ===
        "[0,0,0.001,0]" &&
      prepared.basis.id === "lid/2" &&
      prepared.documents[0]!.basis === "lid/2" &&
      prepared.controls.basis === "lid/2" &&
      prepared.receipt.source === "lid/1" &&
      JSON.stringify(source) === before,
  );
  const noSkinRows = fixture();
  delete noSkinRows.surfaces[0]!.targets["fold.decr"];
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareLidCreaseBasis({ ...input, revision: "lid/1" }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareLidCreaseBasis({ ...input, minimum: 0 }),
        "[-1, 0)",
      ) &&
      throwsError(
        () => prepareLidCreaseBasis({ ...input, minimum: -1.1 }),
        "[-1, 0)",
      ) &&
      throwsError(
        () => prepareLidCreaseBasis({ ...input, skin: "none" }),
        "No surface",
      ) &&
      throwsError(
        () => prepareLidCreaseBasis({ ...input, channels: ["gaze"] }),
        "negative endpoint",
      ) &&
      throwsError(
        () => prepareLidCreaseBasis({ ...input, basis: noSkinRows }),
        "moves no skin",
      ),
  );
};
