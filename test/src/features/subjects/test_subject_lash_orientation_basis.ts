import { type IAutoMovieHumanFaceBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  eyelashSagittalAngle,
  hingeEyelashRegion,
} from "../../../scripts/face-review/hingeEyelashRegion";
import { prepareLashOrientationBasis } from "../../../scripts/face-review/prepareLashOrientationBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A flat lash card, 5 columns by 3 rows: columns at x = side * (0.01 + 0.005 c)
 * (medial to lateral), rows r at y = 0.005 r and z = lean * 0.005 r, so the
 * root-to-tip chord (0, 0.01, 0.01 lean) lies atan(lean) degrees from the
 * upward vertical toward the front. UV u = 0.1 + 0.2 c, v = 0.8 - 0.3 r.
 */
const card = (offset: number, side: number, lean: number) => {
  const positions: number[] = [];
  const uvOf: [number, number][] = [];
  for (let r = 0; r < 3; ++r)
    for (let c = 0; c < 5; ++c) {
      positions.push(side * (0.01 + 0.005 * c), 0.005 * r, lean * 0.005 * r);
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

/** The lid skin just below each root, 0.5 mm away, on both sides. */
const skin = [1, -1].flatMap((side) =>
  [0, 1, 2, 3, 4].flatMap((c) => [side * (0.01 + 0.005 * c), -0.0005, 0]),
);

/**
 * Lash cards turned about their roots to a measured central direction.
 * Scenarios:
 * 1. The sagittal angle is 0 straight up, 90 forward, 135 forward and down,
 *    and 0 for a direction with no sagittal part.
 * 2. Two mirrored cards of different lean (0 and 1, so 0 and 45 degrees) both
 *    reach a 90 degree target on their own: each card has its own `before`,
 *    the turns are 45 and 90, the roots stay, chord lengths stay, and the
 *    tip row of the flat card lies straight forward.
 * 3. A target equal to a card's own angle turns that card by nothing
 *    (negative twin of 2).
 * 4. With a level margin and `inward` 1, a card whose columns stand at 80, 130, 138,
 *    130 and 120 degrees and whose centre is turned to 95 (delta -43)
 *    carries the 130 and 120 columns only to 90 (turns -40 and -30), turns the
 *    centre fully, leaves the 80 column (already below the floor) alone,
 *    counts four limited columns (the three limited and the untouched one), and without a floor every column takes
 *    the full -43 (so the 120 column ends at 77 degrees).
 * 5. On a margin rising 0.2 per unit along +x, with every chord leaning 0.02
 *    toward -x (the side the margin's inward normal points away from the
 *    chord), the unlimited turn leaves tips pointing back across the aperture
 *    (positive frontal component along the inward normal) and the limited
 *    turn leaves every tip at or below zero, at zero for the column that
 *    stopped, with the unlimited turn untouched by the limit.
 * 6. A curled card whose tip row stands at 143 degrees but whose middle row
 *    stands at 108 degrees: the unlimited turn to 95 carries the middle row
 *    up across the aperture (positive y, about 60 degrees), and the limited
 *    turn stops it at the margin (y at most zero, zero for the stopped
 *    column), because the limit reads every vertex of the column and not only
 *    the root-to-tip chord.
 * 7. The basis revision moves only the named region, restamps documents and
 *    controls, leaves the input untouched and keeps the other region; a
 *    repeated revision, a missing lash or skin surface, a missing or
 *    unmapped region and a region sharing vertices with another refuse.
 */
export const test_subject_lash_orientation_basis = (): void => {
  TestValidator.predicate(
    "angles",
    nclose(eyelashSagittalAngle([0, 1, 0]), 0) &&
      nclose(eyelashSagittalAngle([0, 0, 1]), 90) &&
      nclose(eyelashSagittalAngle([0, -1, 1]), 135) &&
      nclose(eyelashSagittalAngle([1, 0, 0]), 0),
  );

  const a = card(0, 1, 0);
  const b = card(15, -1, 1);
  const input = {
    positions: [...a.positions, ...b.positions],
    indices: [...a.indices, ...b.indices],
    uvs: [...a.uvs, ...b.uvs],
    skin,
  };
  const turned = hingeEyelashRegion({ ...input, target: 90 });
  const moved = (vertex: number): number[] => turned.moved.get(vertex)!;
  const before = turned.cards.map((one) => one.before).sort((p, q) => p - q);
  const turns = turned.cards.map((one) => one.delta).sort((p, q) => p - q);
  const staysRooted = [0, 1, 2, 3, 4, 15, 16, 17, 18, 19].every(
    (v) =>
      Math.hypot(
        moved(v)[0]! - input.positions[3 * v]!,
        moved(v)[1]! - input.positions[3 * v + 1]!,
        moved(v)[2]! - input.positions[3 * v + 2]!,
      ) < 1e-12,
  );
  const chordBefore = Math.hypot(
    input.positions[3 * 27]! - input.positions[3 * 17]!,
    input.positions[3 * 27 + 1]! - input.positions[3 * 17 + 1]!,
    input.positions[3 * 27 + 2]! - input.positions[3 * 17 + 2]!,
  );
  const chordAfter = Math.hypot(
    moved(27)[0]! - moved(17)[0]!,
    moved(27)[1]! - moved(17)[1]!,
    moved(27)[2]! - moved(17)[2]!,
  );
  TestValidator.predicate(
    "cards",
    turned.cards.length === 2 &&
      turned.cards.every(
        (one) => one.columns === 5 && nclose(one.after, 90, 1e-9),
      ) &&
      nclose(before[0]!, 0, 1e-9) &&
      nclose(before[1]!, 45, 1e-9) &&
      nclose(turns[0]!, 45, 1e-9) &&
      nclose(turns[1]!, 90, 1e-9) &&
      staysRooted &&
      nclose(moved(10)[1]!, 0, 1e-12) &&
      nclose(moved(10)[2]!, 0.01, 1e-12) &&
      nclose(chordAfter, chordBefore, 1e-12) &&
      turned.moved.size === 30,
  );

  const same = hingeEyelashRegion({ ...input, target: 0 });
  TestValidator.predicate(
    "no turn",
    same.cards.some((one) => nclose(one.delta, 0, 1e-9)) &&
      nclose(same.moved.get(10)![2]!, 0, 1e-12) &&
      nclose(same.moved.get(10)![1]!, 0.01, 1e-12),
  );

  const fanned = (() => {
    const angles = [80, 130, 138, 130, 120];
    const positions: number[] = [];
    const uvOf: [number, number][] = [];
    for (let r = 0; r < 3; ++r)
      for (let c = 0; c < 5; ++c) {
        const a = (angles[c]! * Math.PI) / 180;
        positions.push(0.01 + 0.005 * c, 0.005 * r * Math.cos(a), 0.005 * r * Math.sin(a));
        uvOf.push([0.1 + 0.2 * c, 0.8 - 0.3 * r]);
      }
    const indices: number[] = [];
    const uvs: number[] = [];
    for (let r = 0; r < 2; ++r)
      for (let c = 0; c < 4; ++c)
        for (const v of [5 * r + c, 5 * r + c + 1, 5 * r + c + 6, 5 * r + c, 5 * r + c + 6, 5 * r + c + 5]) {
          indices.push(v);
          uvs.push(...uvOf[v]!);
        }
    return { positions, indices, uvs, skin: skin.slice(0, 15) };
  })();
  const angleAfter = (run: ReturnType<typeof hingeEyelashRegion>, column: number): number => {
    const tipVertex = 10 + column;
    const p = run.moved.get(tipVertex)!;
    return eyelashSagittalAngle([0, p[1] - fanned.positions[3 * column + 1]!, p[2] - fanned.positions[3 * column + 2]!]);
  };
  const limitedRun = hingeEyelashRegion({ ...fanned, target: 95, inward: 1 });
  const freeRun = hingeEyelashRegion({ ...fanned, target: 95 });
  TestValidator.predicate(
    "floor",
    nclose(limitedRun.cards[0]!.delta, -43, 1e-9) &&
      limitedRun.cards[0]!.limited === 4 &&
      nclose(angleAfter(limitedRun, 0), 80, 1e-9) &&
      nclose(angleAfter(limitedRun, 1), 90, 1e-6) &&
      nclose(angleAfter(limitedRun, 2), 95, 1e-9) &&
      nclose(angleAfter(limitedRun, 3), 90, 1e-6) &&
      nclose(angleAfter(limitedRun, 4), 90, 1e-6) &&
      freeRun.cards[0]!.limited === 0 &&
      nclose(angleAfter(freeRun, 4), 77, 1e-9) &&
      nclose(angleAfter(freeRun, 0), 37, 1e-9),
  );

  const sloped = (() => {
    const positions: number[] = [];
    const uvOf: [number, number][] = [];
    const a = (130 * Math.PI) / 180;
    for (let r = 0; r < 3; ++r)
      for (let c = 0; c < 5; ++c) {
        const x = 0.01 + 0.005 * c;
        positions.push(x - 0.01 * r, 0.2 * 0.005 * c + 0.005 * r * Math.cos(a), 0.005 * r * Math.sin(a));
        uvOf.push([0.1 + 0.2 * c, 0.8 - 0.3 * r]);
      }
    const indices: number[] = [];
    const uvs: number[] = [];
    for (let r = 0; r < 2; ++r)
      for (let c = 0; c < 4; ++c)
        for (const v of [5 * r + c, 5 * r + c + 1, 5 * r + c + 6, 5 * r + c, 5 * r + c + 6, 5 * r + c + 5]) {
          indices.push(v);
          uvs.push(...uvOf[v]!);
        }
    return { positions, indices, uvs, skin: skin.slice(0, 15) };
  })();
  const inwardDot = (run: ReturnType<typeof hingeEyelashRegion>, column: number): number => {
    const tipPoint = run.moved.get(10 + column)!;
    const rootPoint = [sloped.positions[3 * column]!, sloped.positions[3 * column + 1]!];
    const norm = Math.hypot(0.2, 1);
    return ((tipPoint[0] - rootPoint[0]!) * -0.2 + (tipPoint[1] - rootPoint[1]!)) / norm;
  };
  const freeSloped = hingeEyelashRegion({ ...sloped, target: 95 });
  const limitedSloped = hingeEyelashRegion({ ...sloped, target: 95, inward: 1 });
  const dots = [0, 1, 2, 3, 4].map((c) => inwardDot(limitedSloped, c));
  TestValidator.predicate(
    "sloped margin",
    [0, 1, 2, 3, 4].some((c) => inwardDot(freeSloped, c) > 1e-6) &&
      dots.every((d) => d <= 1e-6) &&
      dots.some((d) => Math.abs(d) < 1e-6) &&
      limitedSloped.cards[0]!.limited > 0 &&
      freeSloped.cards[0]!.limited === 0,
  );

  const curled = (() => {
    const positions: number[] = [];
    const uvOf: [number, number][] = [];
    const rows = [
      [0, 0],
      [-0.001, 0.003],
      [0.01 * Math.cos((143 * Math.PI) / 180), 0.01 * Math.sin((143 * Math.PI) / 180)],
    ];
    for (let r = 0; r < 3; ++r)
      for (let c = 0; c < 5; ++c) {
        positions.push(0.01 + 0.005 * c, rows[r]![0]!, rows[r]![1]!);
        uvOf.push([0.1 + 0.2 * c, 0.8 - 0.3 * r]);
      }
    const indices: number[] = [];
    const uvs: number[] = [];
    for (let r = 0; r < 2; ++r)
      for (let c = 0; c < 4; ++c)
        for (const v of [5 * r + c, 5 * r + c + 1, 5 * r + c + 6, 5 * r + c, 5 * r + c + 6, 5 * r + c + 5]) {
          indices.push(v);
          uvs.push(...uvOf[v]!);
        }
    return { positions, indices, uvs, skin: skin.slice(0, 15) };
  })();
  const bulge = hingeEyelashRegion({ ...curled, target: 95 });
  const kept = hingeEyelashRegion({ ...curled, target: 95, inward: 1 });
  const midY = (run: ReturnType<typeof hingeEyelashRegion>, column: number): number =>
    run.moved.get(5 + column)![1]!;
  const tipY = (run: ReturnType<typeof hingeEyelashRegion>, column: number): number =>
    run.moved.get(10 + column)![1]!;
  TestValidator.predicate(
    "curled card",
    [0, 1, 2, 3, 4].every((c) => midY(bulge, c) > 1e-4) &&
      [0, 1, 2, 3, 4].every((c) => midY(kept, c) <= 1e-9 && tipY(kept, c) <= 1e-9) &&
      [0, 1, 2, 3, 4].some((c) => Math.abs(midY(kept, c)) < 1e-9) &&
      kept.cards[0]!.limited === 5 &&
      bulge.cards[0]!.limited === 0,
  );

  const lower = card(30, 1, 0);
  const basis: IAutoMovieHumanFaceBasis = {
    id: "analytic-lash/1",
    channels: [],
    surfaces: [
      {
        id: "lash",
        positions: [...a.positions, ...b.positions, ...lower.positions],
        indices: [...a.indices, ...b.indices, ...lower.indices],
        targets: {},
        regions: [
          {
            id: "lash/upper",
            material: "lash",
            indices: [...a.indices, ...b.indices],
            uvs: [...a.uvs, ...b.uvs],
          },
          {
            id: "lash/lower",
            material: "lash",
            indices: lower.indices,
            uvs: lower.uvs,
          },
          { id: "lash/bare", material: "lash", indices: [0, 1, 6], uvs: null },
        ],
      },
      {
        id: "skin",
        positions: skin,
        indices: [0, 1, 5],
        targets: {},
        regions: [],
      },
    ],
    materials: [],
  };
  const unchanged = JSON.stringify(basis);
  const base = {
    basis,
    documents: [
      { id: "d", name: "d", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-lash/2",
    surface: "lash",
    skin: "skin",
    lids: [{ region: "lash/lower", target: 90 }],
  };
  const prepared = prepareLashOrientationBasis(base);
  const positions = prepared.basis.surfaces[0]!.positions;
  TestValidator.predicate(
    "revision",
    prepared.basis.id === "analytic-lash/2" &&
      prepared.documents[0]!.basis === "analytic-lash/2" &&
      prepared.controls.basis === "analytic-lash/2" &&
      JSON.stringify(basis) === unchanged &&
      prepared.receipt.lids[0]!.vertices === 15 &&
      nclose(prepared.receipt.lids[0]!.cards[0]!.after, 90, 1e-9) &&
      nclose(positions[3 * 40 + 2]!, 0.01, 1e-12) &&
      nclose(positions[3 * 10 + 2]!, 0, 1e-12) &&
      nclose(positions[3 * 10 + 1]!, 0.01, 1e-12),
  );
  const overlapping: IAutoMovieHumanFaceBasis = {
    ...basis,
    surfaces: [
      {
        ...basis.surfaces[0]!,
        regions: [
          ...basis.surfaces[0]!.regions,
          { id: "lash/overlap", material: "lash", indices: [30, 31, 32], uvs: null },
        ],
      },
      basis.surfaces[1]!,
    ],
  };
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareLashOrientationBasis({ ...base, revision: basis.id }),
      "distinct",
    ) &&
      throwsError(
        () => prepareLashOrientationBasis({ ...base, surface: "none" }),
        "lash and skin",
      ) &&
      throwsError(
        () => prepareLashOrientationBasis({ ...base, skin: "none" }),
        "lash and skin",
      ) &&
      throwsError(
        () =>
          prepareLashOrientationBasis({
            ...base,
            lids: [{ region: "none", target: 90 }],
          }),
        "No mapped",
      ) &&
      throwsError(
        () =>
          prepareLashOrientationBasis({
            ...base,
            lids: [{ region: "lash/bare", target: 90 }],
          }),
        "No mapped",
      ) &&
      throwsError(
        () => prepareLashOrientationBasis({ ...base, basis: overlapping }),
        "shares vertices",
      ),
  );
};
