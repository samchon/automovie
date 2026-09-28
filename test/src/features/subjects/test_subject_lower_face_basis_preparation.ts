import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareLowerFaceBasis } from "../../../scripts/face-review/prepareLowerFaceBasis";
import { nclose, throwsError } from "../internal/predicates";

/** The designed profile of test_subject_face_midsagittal, in millimetres. */
const PROFILE: [number, number][] = [
  [20, 140],
  [0, 160],
  [-2, 157],
  [-11, 145],
  [-12, 144.8],
  [-20, 146],
  [-26, 148],
  [-30, 144],
  [-34, 147],
  [-38, 149],
  [-44, 141],
  [-50, 143],
  [-60, 142],
  [-64, 139],
  [-68, 130],
  [-70, 120],
  [-70.2, 110],
  [-72, 90],
  [-90, 80],
];

/**
 * The profile swept across x = -1..1 mm, its seam vertices (index 7, y -30)
 * the stomion pair, and a `chin` channel whose positive endpoint lowers every
 * vertex below the fold (y < -44) by 10 mm.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const positions: number[] = [];
  for (const [y, z] of PROFILE)
    positions.push(-0.001, y / 1000, z / 1000, 0.001, y / 1000, z / 1000);
  const indices: number[] = [];
  for (let k = 0; k + 1 < PROFILE.length; ++k) {
    const a = 2 * k;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  const lowered: number[] = [];
  PROFILE.forEach(([y], k) => {
    if (y < -44)
      for (const v of [2 * k, 2 * k + 1]) lowered.push(v, 0, -0.01, 0);
  });
  return {
    id: "analytic-profile/1",
    channels: [
      {
        id: "chin",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "chin.positive",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: { "chin.positive": lowered },
        regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
};

/**
 * Lengthening the lower face to norms.
 * Scenarios:
 * 1. The strip's lower face (subnasale -11 to its level underside at -70)
 *    is 59 mm; against norms of 63 and 67 mm the mean shortfall is 6 mm,
 *    which the chin endpoint (10 mm per unit) meets at a factor of 0.6, and
 *    both corners then sit at 65 mm.
 * 2. The documents and controls name the new revision.
 * 3. A repeated revision, no norms, an unknown or expression channel and an
 *    unknown lip surface refuse.
 */
export const test_subject_lower_face_basis_preparation = (): void => {
  const basis = head();
  const base = {
    basis,
    documents: [
      { id: "one", name: "one", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-profile/2",
    channel: "chin",
    skin: "skin",
    lips: { surface: "skin", upper: 14, lower: 15 },
    norms: [
      { label: "short", shape: {}, targetMetres: 0.063 },
      { label: "long", shape: {}, targetMetres: 0.067 },
    ],
    profile: {
      nose: [-0.02, 0.02] as [number, number],
      chinDepth: 0.03,
      level: 0.1,
      step: 0.00025,
    },
  };
  const prepared = prepareLowerFaceBasis(base);
  TestValidator.predicate(
    "factor",
    nclose(prepared.receipt.factor, 0.6, 0.03) &&
      prepared.receipt.corners.every(
        (one) =>
          nclose(one.beforeMetres, 0.059, 0.0008) &&
          nclose(one.afterMetres, 0.065, 0.0003),
      ),
  );
  TestValidator.equals(
    "restamped",
    [prepared.basis.id, prepared.documents[0]!.basis, prepared.controls.basis],
    ["analytic-profile/2", "analytic-profile/2", "analytic-profile/2"],
  );
  const refuse = (change: object, message: string) =>
    throwsError(() => prepareLowerFaceBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ norms: [] }, "at least one norm") &&
      refuse({ channel: "absent" }, "no shape channel") &&
      refuse(
        { lips: { surface: "absent", upper: 0, lower: 1 } },
        "No lip surface",
      ),
  );
};
