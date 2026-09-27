import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { splitSmileRetractionBasis } from "../../../scripts/face-review/splitSmileRetractionBasis";
import { nclose, throwsError } from "../internal/predicates";

const channel = (id: string) => ({
  id,
  kind: "expression" as const,
  minimum: 0,
  maximum: 1,
  positive: id,
  negative: null,
});

/**
 * A two-surface basis whose smiles carry a retraction on the skin: the left
 * smile moves vertex 0 out by 1 mm (the source's) and back by 2 mm (the
 * retraction), vertex 1 back by 2 mm only; the right smile keeps the
 * source's row. The teeth surface's smile rows were never in the source.
 */
const fixture = (): {
  basis: IAutoMovieHumanFaceBasis;
  source: IAutoMovieHumanFaceBasis;
} => {
  const surfaces = (retraction: boolean) => [
    {
      id: "skin",
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2],
      regions: [],
      targets: {
        smileLeft: retraction
          ? [0, 0.001, 0, -0.002, 1, 0, 0, -0.002]
          : [0, 0.001, 0, 0],
        smileRight: [2, 0.001, 0, 0],
      },
    },
    {
      id: "teeth",
      positions: [0, 0, 0],
      indices: [],
      regions: [],
      targets: retraction ? { smileLeft: [0, 0, 0, -0.001] } : {},
    },
  ];
  return {
    basis: {
      id: "smile/2",
      channels: [channel("smileLeft"), channel("smileRight")],
      surfaces: surfaces(true),
    } as never,
    source: {
      id: "smile/1",
      channels: [channel("smileLeft"), channel("smileRight")],
      surfaces: surfaces(false),
    } as never,
  };
};

/**
 * The smile retraction as channels of its own.
 * Scenarios:
 * 1. The left retraction channel carries the published rows less the
 *    source's (vertex 0 back 2 mm, vertex 1 back 2 mm) and the left smile
 *    takes the source's row back; the right retraction carries nothing and
 *    the right smile is unchanged; a surface the source's smile never moved
 *    keeps its rows and adds none; the new channels are expressions in
 *    [0, 1]; together they rebuild the published rows.
 * 2. The basis, documents and control map are restamped and the inputs are
 *    left as they were; a stale revision, a smile missing from either basis
 *    and a retraction channel already present refuse.
 */
export const test_subject_smile_retraction_split = (): void => {
  const { basis, source } = fixture();
  const before = JSON.stringify(basis);
  const input = {
    basis,
    source,
    documents: [
      { id: "a", basis: "smile/2", shape: {}, expression: {} },
    ] as never,
    controls: { basis: "smile/2", controls: [] } as never,
    revision: "smile/3",
    channels: { left: "smileLeft", right: "smileRight" },
    into: { left: "retractLeft", right: "retractRight" },
  };
  const split = splitSmileRetractionBasis(input);
  const skin = split.basis.surfaces[0]!;
  const teeth = split.basis.surfaces[1]!;
  const retract = skin.targets["retractLeft"]!;
  TestValidator.predicate(
    "the split",
    retract.length === 8 &&
      retract[0] === 0 &&
      nclose(retract[1]!, 0, 1e-12) &&
      nclose(retract[3]!, -0.002, 1e-12) &&
      retract[4] === 1 &&
      nclose(retract[7]!, -0.002, 1e-12) &&
      JSON.stringify(skin.targets["smileLeft"]) === "[0,0.001,0,0]" &&
      JSON.stringify(skin.targets["smileRight"]) === "[2,0.001,0,0]" &&
      skin.targets["retractRight"] === undefined &&
      JSON.stringify(teeth.targets["smileLeft"]) === "[0,0,0,-0.001]" &&
      teeth.targets["retractLeft"] === undefined &&
      split.basis.channels
        .filter((one) => one.id.startsWith("retract"))
        .every(
          (one) =>
            one.kind === "expression" && one.minimum === 0 && one.maximum === 1,
        ) &&
      split.receipt.rows["retractLeft"] === 2 &&
      split.receipt.rows["retractRight"] === 0,
  );
  TestValidator.predicate(
    "stamps and refusals",
    split.basis.id === "smile/3" &&
      split.documents[0]!.basis === "smile/3" &&
      split.controls.basis === "smile/3" &&
      split.receipt.source === "smile/2" &&
      JSON.stringify(basis) === before &&
      throwsError(
        () => splitSmileRetractionBasis({ ...input, revision: "smile/2" }),
        "distinct revision",
      ) &&
      throwsError(
        () =>
          splitSmileRetractionBasis({
            ...input,
            channels: { left: "none", right: "smileRight" },
          }),
        "No smile channel",
      ) &&
      throwsError(
        () =>
          splitSmileRetractionBasis({
            ...input,
            basis: split.basis,
            revision: "smile/4",
          }),
        "already has",
      ),
  );
};
