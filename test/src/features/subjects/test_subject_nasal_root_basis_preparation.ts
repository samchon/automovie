import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareNasalRootBasis } from "../../../scripts/face-review/prepareNasalRootBasis";
import { throwsError } from "../internal/predicates";

/**
 * Two surfaces and a channel whose positive moves vertices 0 and 2 of the
 * skin and vertex 1 of the brow, and whose negative moves a different skin
 * vertex and a third surface the positive does not reach, with an envelope
 * of [-1.46, 1]; a one-sided channel beside it.
 */
const fixture = (): IAutoMovieHumanFaceBasis =>
  ({
    id: "root/1",
    channels: [
      {
        id: "root",
        kind: "shape",
        minimum: -1.46,
        maximum: 1,
        positive: "root.positive",
        negative: "root.negative",
      },
      {
        id: "half",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "half.positive",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        indices: [0, 1, 2],
        targets: {
          "root.positive": [0, 0, 0.001, 0.003, 2, 0, 0, 0.002],
          "root.negative": [1, 0, -0.002, -0.003],
        },
        regions: [],
      },
      {
        id: "brow",
        positions: [0, 0, 0, 1, 0, 0],
        indices: [],
        targets: { "root.positive": [1, 0.001, 0, 0] },
        regions: [],
      },
      {
        id: "lash",
        positions: [0, 0, 0],
        indices: [],
        targets: { "root.negative": [0, 0, 0, -0.001] },
        regions: [],
      },
    ],
  }) as never;

/**
 * The nasal root's prominence as one axis: its negative endpoint the
 * positive's displacement reversed.
 * Scenarios:
 * 1. Every surface the positive moves gets the positive's rows negated as
 *    its negative, in the positive's vertex order; the skin's old negative
 *    row (a vertex the positive does not move) is gone, and a surface only
 *    the old negative moved loses its rows. The receipt counts each
 *    surface's new and removed rows.
 * 2. The negative side's envelope returns to -1, the positive's stays, the
 *    positive rows are untouched, and the basis, documents and control map
 *    are restamped to the revision, the source unchanged.
 * 3. The source's id or a blank revision, a missing or one-sided channel,
 *    and a positive that moves nothing refuse.
 */
export const test_subject_nasal_root_basis_preparation = (): void => {
  const source = fixture();
  const before = JSON.stringify(source);
  const prepared = prepareNasalRootBasis({
    basis: source,
    documents: [
      { id: "a", basis: "root/1", shape: { root: -1.2 }, expression: {} },
    ] as never,
    controls: { basis: "root/1", controls: [] } as never,
    revision: "root/2",
    channel: "root",
  });
  const [skin, brow, lash] = prepared.basis.surfaces;
  TestValidator.equals(
    "negated rows",
    [skin!.targets["root.negative"], brow!.targets["root.negative"]],
    [
      [0, -0, -0.001, -0.003, 2, -0, -0, -0.002],
      [1, -0.001, -0, -0],
    ],
  );
  TestValidator.predicate(
    "removed",
    lash!.targets["root.negative"] === undefined &&
      JSON.stringify(prepared.receipt.surfaces) ===
        JSON.stringify([
          { surface: "skin", rows: 2, removed: 1 },
          { surface: "brow", rows: 1, removed: 0 },
          { surface: "lash", rows: 0, removed: 1 },
        ]),
  );
  const channel = prepared.basis.channels[0]!;
  TestValidator.predicate(
    "envelope and stamps",
    channel.minimum === -1 &&
      channel.maximum === 1 &&
      JSON.stringify(skin!.targets["root.positive"]) ===
        JSON.stringify([0, 0, 0.001, 0.003, 2, 0, 0, 0.002]) &&
      prepared.basis.id === "root/2" &&
      prepared.documents[0]!.basis === "root/2" &&
      prepared.controls.basis === "root/2" &&
      prepared.receipt.source === "root/1" &&
      JSON.stringify(source) === before,
  );
  const input = {
    basis: source,
    documents: [],
    controls: { basis: "root/1", controls: [] } as never,
    revision: "root/2",
    channel: "root",
  };
  const silent = fixture();
  delete silent.surfaces[0]!.targets["root.positive"];
  delete silent.surfaces[1]!.targets["root.positive"];
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareNasalRootBasis({ ...input, revision: "root/1" }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareNasalRootBasis({ ...input, revision: " " }),
        "distinct revision",
      ) &&
      throwsError(
        () => prepareNasalRootBasis({ ...input, channel: "none" }),
        "No two-sided",
      ) &&
      throwsError(
        () => prepareNasalRootBasis({ ...input, channel: "half" }),
        "No two-sided",
      ) &&
      throwsError(
        () => prepareNasalRootBasis({ ...input, basis: silent }),
        "moves no surface",
      ),
  );
};
