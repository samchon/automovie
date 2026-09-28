import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareMentalHeightBasis } from "../../../scripts/face-review/prepareMentalHeightBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Seven skin vertices down the midline at heights 10, 0, -10, -20, -30, -40
 * and -40 mm (the fold at 0, menton at -30, the neck below), one triangle
 * fan, and a channel `open`.
 */
const fixture = (): IAutoMovieHumanFaceBasis => {
  const heights = [0.01, 0, -0.01, -0.02, -0.03, -0.04, -0.04];
  const positions = heights.flatMap((y, v) => [v === 6 ? 0.01 : 0, y, 0.1]);
  const indices = [0, 1, 2, 2, 3, 4, 4, 5, 6];
  return {
    id: "chin/1",
    channels: [
      {
        id: "open",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "openT",
        negative: null,
      },
    ],
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
  };
};

/**
 * A control for the chin's height below the labiomental fold.
 * Scenarios:
 * 1. The skin below the fold moves up (shorter) by its carry times the unit
 *    times its depth below the fold over menton's: menton carried whole by
 *    the unit (6 mm), a vertex 10 mm below the fold by 2 mm, one half
 *    carried at 20 mm by 2 mm, the neck's vertex carried a fifth at 40 mm by
 *    1.6 mm; the fold and above, and an uncarried vertex, have no row;
 *    taller is shorter's negative.
 * 2. The channel spans the envelope with its description; the revision
 *    restamps documents and controls.
 * 3. A repeated revision, a unit of zero, an envelope missing a direction,
 *    a fold not above menton, a channel the basis has, a missing surface, a
 *    carry of the wrong length and a carry moving nothing refuse.
 */
export const test_subject_mental_height_basis_preparation = (): void => {
  const basis = fixture();
  const input = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id } as never,
    revision: "chin/2",
    skin: "skin",
    channel: "mental",
    carry: [1, 1, 1, 0.5, 1, 0.2, 0],
    fold: 0,
    menton: -0.03,
    unit: 0.006,
    envelope: [-2, 2] as [number, number],
  };
  const prepared = prepareMentalHeightBasis(input);
  const rows = (name: string) => {
    const flat = prepared.basis.surfaces[0]!.targets[name]!;
    const out = new Map<number, number[]>();
    for (let i = 0; i < flat.length; i += 4)
      out.set(flat[i]!, [flat[i + 1]!, flat[i + 2]!, flat[i + 3]!]);
    return out;
  };
  const shorter = rows("mental.shorter");
  const taller = rows("mental.taller");
  const up = (v: number, dy: number) =>
    nclose(shorter.get(v)![1]!, dy, 1e-12) &&
    shorter.get(v)![0] === 0 &&
    shorter.get(v)![2] === 0;
  TestValidator.predicate(
    "rows",
    up(2, 0.002) &&
      up(3, 0.002) &&
      up(4, 0.006) &&
      up(5, 0.0016) &&
      [0, 1, 6].every((v) => !shorter.has(v)) &&
      [...shorter].every(([v, d]) =>
        taller.get(v)!.every((one, k) => one === -d[k]!),
      ) &&
      prepared.receipt.rows === 4,
  );
  TestValidator.predicate(
    "channel, stamps",
    prepared.basis.channels.some(
      (one) =>
        one.id === "mental" &&
        one.description ===
          "The chin's height below the labiomental fold, shorter to taller, 6 mm per unit at menton; the skin the mandible carries scales toward the fold." &&
        one.minimum === -2 &&
        one.maximum === 2 &&
        one.positive === "mental.taller" &&
        one.negative === "mental.shorter",
    ) &&
      prepared.basis.id === "chin/2" &&
      prepared.documents[0]!.basis === "chin/2" &&
      (prepared.controls as { basis: string }).basis === "chin/2" &&
      basis.surfaces[0]!.targets["mental.shorter"] === undefined,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareMentalHeightBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, unit: 0 }),
        "unit must be positive",
      ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, envelope: [0, 1] }),
        "both directions",
      ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, fold: -0.03 }),
        "fold lies above menton",
      ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, channel: "open" }),
        "already has a channel open",
      ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, skin: "none" }),
        "No surface none",
      ) &&
      throwsError(
        () => prepareMentalHeightBasis({ ...input, carry: [1] }),
        "one weight per skin vertex",
      ) &&
      throwsError(
        () =>
          prepareMentalHeightBasis({ ...input, carry: [0, 0, 0, 0, 0, 0, 0] }),
        "carries no skin",
      ),
  );
};
