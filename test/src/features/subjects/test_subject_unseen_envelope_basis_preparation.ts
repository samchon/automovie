import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import type { IFaceUnseenIndex } from "../../../scripts/face-review/faceUnseenNorms";
import { prepareUnseenEnvelopeBasis } from "../../../scripts/face-review/prepareUnseenEnvelopeBasis";
import { throwsError } from "../internal/predicates";

/** Rows of a strip at z = 0.1 m, in millimetres of height. */
const ROWS = [-20, -12, -1, 1, 5.85, 10, 20];

/**
 * A strip swept across x = -1..1 mm with the lips' contact pair at rows 1
 * and -1 mm. `sept` moves the 10 mm row 2 mm per unit either way; `lost`
 * lifts the 5.85 mm row 2 mm per unit and has no negative rows on the
 * surface; `never` lifts the 1 mm row.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const positions: number[] = [];
  for (const y of ROWS)
    positions.push(-0.001, y / 1000, 0.1, 0.001, y / 1000, 0.1);
  const indices: number[] = [];
  for (let k = 0; k + 1 < ROWS.length; ++k)
    indices.push(2 * k, 2 * k + 1, 2 * k + 3, 2 * k, 2 * k + 3, 2 * k + 2);
  const row = (k: number, dy: number) => [2 * k, 0, dy, 0, 2 * k + 1, 0, dy, 0];
  const channel = (id: string) => ({
    id,
    kind: "shape" as const,
    minimum: -1,
    maximum: 1,
    positive: `${id}.positive`,
    negative: `${id}.negative`,
  });
  return {
    id: "strip/1",
    channels: [channel("sept"), channel("lost"), channel("never")],
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: {
          "sept.positive": row(5, 0.002),
          "sept.negative": row(5, -0.002),
          "lost.positive": row(4, 0.002),
          "never.positive": row(3, 0.001),
          "never.negative": row(3, -0.001),
        },
        regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
    // Only the lips' contact pair is read.
    contact: {
      lips: { surface: "skin", upper: 6, lower: 4 },
    } as unknown as IAutoMovieHumanFaceBasis["contact"],
  };
};

const index = (
  id: IFaceUnseenIndex["id"],
  channel: string,
): IFaceUnseenIndex => ({
  id,
  norm: "nasolabial",
  definition: id,
  channels: [channel],
  resolution: 0,
  spread: 1,
});

/**
 * Extending each unseen reading's control over its adult interval.
 * Scenarios:
 * 1. The reading of `sept` (the 10 mm row) asked for 4 to 15 reaches 15 at
 *    +2.5; toward 4 its row would sink through the 5.85 mm row past
 *    -2.075, so it stops at the last step before, -2.05.
 * 2. `lost`'s reading can no longer be read past 8.5 mm (+1.325), so it
 *    stops at the last step read, +1.3; its negative rows lie elsewhere,
 *    so that side keeps -1.
 * 3. `never`'s reading is never read, so it keeps its envelope; a second
 *    index on `sept` and an index without an interval extend nothing.
 * 4. Documents and controls name the new revision.
 * 5. A repeated revision, an unknown surface and no lip contact refuse.
 */
export const test_subject_unseen_envelope_basis_preparation = (): void => {
  const basis = head();
  const base = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id } as never,
    revision: "strip/2",
    surface: "skin",
    indices: [
      index("nasolabial", "sept"),
      index("nasalProtrusion", "sept"),
      index("cephalicIndex", "lost"),
      index("nasofrontal", "never"),
      index("earLengthLeft", "sept"),
    ],
    intervals: {
      nasolabial: [4, 15] as [number, number],
      nasalProtrusion: [0, 100] as [number, number],
      cephalicIndex: [0, 100] as [number, number],
      nasofrontal: [0, 100] as [number, number],
    },
    measure: (positions: readonly number[]) => {
      const y = (vertex: number) => 1000 * positions[3 * vertex + 1]!;
      return {
        nasolabial: y(10),
        nasalProtrusion: y(10),
        cephalicIndex: y(8) > 8.5 + 1e-9 ? null : y(8),
        nasofrontal: null,
      };
    },
    step: 0.05,
    reach: 3,
  };
  const prepared = prepareUnseenEnvelopeBasis(base);
  const envelope = (id: string) => {
    const one = prepared.basis.channels.find((channel) => channel.id === id)!;
    return [one.minimum, one.maximum];
  };
  TestValidator.equals(
    "envelopes",
    [envelope("sept"), envelope("lost"), envelope("never")],
    [
      [-2.05, 2.5],
      [-1, 1.3],
      [-1, 1],
    ],
  );
  TestValidator.predicate(
    "once, stamps",
    prepared.receipt.envelopes.map((one) => one.reading).join() ===
      "nasolabial,cephalicIndex,nasofrontal" &&
      prepared.basis.id === "strip/2" &&
      prepared.documents[0]!.basis === "strip/2" &&
      (prepared.controls as { basis: string }).basis === "strip/2",
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareUnseenEnvelopeBasis({ ...base, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareUnseenEnvelopeBasis({ ...base, surface: "none" }),
        "No surface",
      ) &&
      throwsError(
        () =>
          prepareUnseenEnvelopeBasis({
            ...base,
            basis: { ...basis, contact: undefined },
          }),
        "no lip contact",
      ),
  );
};
