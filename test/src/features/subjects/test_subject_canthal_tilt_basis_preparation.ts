import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  faceCanthalTiltDegrees,
  faceFissureCorners,
  prepareCanthalTiltBasis,
} from "../../../scripts/face-review/prepareCanthalTiltBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * An analytic eye: lid skin at z = 1.1 around a diamond opening with
 * endocanthion M (0.2, 0), the lids' apices U (0.5, 0.1) and D (0.5, -0.1)
 * and exocanthion L (0.8, 0), in front of a globe quad at z = 1 over the
 * window [0, 1] x [-0.3, 0.3]; the eye's centre (0.5, 0, 1). `raise` lifts L
 * by 0.06; the dimorphism endpoints only nudge an outer corner in depth.
 */
const eye = (): IAutoMovieHumanFaceBasis => {
  const skin = [
    [0, -0.3],
    [1, -0.3],
    [1, 0.3],
    [0, 0.3],
    [0.2, 0],
    [0.5, -0.1],
    [0.8, 0],
    [0.5, 0.1],
  ].flatMap(([x, y]) => [x!, y!, 1.1]);
  // outer A B C D = 0 1 2 3, diamond M Dn L U = 4 5 6 7
  const ring = [
    0, 1, 5, 0, 5, 4, 1, 6, 5, 1, 2, 6, 2, 7, 6, 2, 3, 7, 3, 4, 7, 3, 0, 4,
  ];
  const globe = [0, -0.3, 1, 1, -0.3, 1, 1, 0.3, 1, 0, 0.3, 1];
  const region = (id: string, indices: number[]) => ({
    id,
    material: "skin",
    indices,
    uvs: null,
  });
  return {
    id: "analytic-eye/1",
    channels: [
      {
        id: "sex",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "male",
        negative: "female",
      },
      {
        id: "lateral",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "raise",
        negative: null,
      },
      {
        id: "far",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "elsewhere",
        negative: null,
      },
      {
        id: "blink",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "shut",
        negative: null,
      },
    ],
    landmarks: { ids: ["eye"], positions: [0.5, 0, 1], targets: {} },
    surfaces: [
      {
        id: "skin",
        positions: skin,
        indices: ring,
        targets: {
          male: [1, 0, 0, 0.001],
          female: [1, 0, 0, -0.001],
          raise: [6, 0, 0.06, 0],
          elsewhere: [0, 0, 0, 0.01],
        },
        regions: [region("skin/all", ring)],
      },
      {
        id: "globe",
        positions: globe,
        indices: [0, 1, 2, 0, 2, 3],
        targets: { shut: [0, 0, 0, -1, 1, 0, 0, -1, 2, 0, 0, -1, 3, 0, 0, -1] },
        regions: [region("globe/all", [0, 1, 2, 0, 2, 3])],
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin",
    ),
  };
};

/**
 * Canthal tilt read on the fissure and set to a published sex difference.
 * Scenarios:
 * 1. The fissure's corners are the centroids of its last 0.02, to within
 *    two and a half of its 0.002 pixels: the level
 *    diamond gives (0.2 + 2b/3, 0) and (0.8 - 2b/3, 0) and no tilt; seen as
 *    a left eye (centre at negative x) the ends swap; a hidden globe and a
 *    degenerate triangle show nothing and are skipped.
 * 2. A women-minus-men difference of 4 degrees moves the male target by
 *    -a and the female by +a of the raise field: the women's tilt is
 *    +2 degrees, the men's -2, and `a` is the closed form
 *    tan(2 deg) (0.6 - 4b/3) / ((1 - 2b/0.9) 0.06).
 * 3. Documents and controls are restamped; a repeated revision, an empty
 *    field or corner list, a one-sided dimorphism, a field without an
 *    endpoint, a missing target, surface or eye landmark, a globe outside
 *    the window and a field that does not move the fissure (asked to
 *    narrow the difference) refuse.
 */
export const test_subject_canthal_tilt_basis_preparation = (): void => {
  const basis = eye();
  const skin = basis.surfaces[0]!;
  const globe = basis.surfaces[1]!;
  const b = 0.02;
  const read = (
    centre: [number, number, number],
    flip = 1,
    globeIndices = globe.indices,
  ) =>
    faceFissureCorners({
      skin: {
        positions: skin.positions.map((v, i) => (i % 3 === 0 ? flip * v : v)),
        indices: skin.indices,
      },
      globe: {
        positions: globe.positions.map((v, i) => (i % 3 === 0 ? flip * v : v)),
        indices: globeIndices,
      },
      centre,
      half: [0.35, 0.15],
      resolution: 0.002,
      band: b,
    });
  const level = read([0.5, 0, 1])!;
  const mirrored = read([-0.5, 0, 1], -1);
  TestValidator.predicate(
    "corners",
    nclose(level.medial[0], 0.2 + (2 * b) / 3, 0.005) &&
      nclose(level.lateral[0], 0.8 - (2 * b) / 3, 0.005) &&
      nclose(level.medial[1], 0, 0.002) &&
      nclose(level.lateral[1], 0, 0.002) &&
      nclose(faceCanthalTiltDegrees(level), 0, 0.3) &&
      mirrored !== null &&
      nclose(mirrored.medial[0], -level.medial[0], 0.003) &&
      nclose(mirrored.lateral[0], -level.lateral[0], 0.003) &&
      read([0.5, 0, 1], 1, []) === null &&
      read([0.5, 0, 1], 1, [0, 0, 1, 0, 1, 2, 0, 2, 3]) !== null,
  );

  const base = {
    basis,
    documents: [
      {
        id: "eye",
        name: "Analytic eye",
        basis: basis.id,
        shape: { sex: 0.5 },
        expression: {},
      },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-eye/2",
    dimorphism: "sex",
    targets: { men: "male", women: "female" },
    field: ["lateral"],
    skin: "skin",
    globe: "globe",
    eyes: ["eye"],
    half: [0.35, 0.15] as [number, number],
    resolution: 0.002,
    band: b,
    corners: [{ label: "eye", shape: {} }],
    difference: 4,
  };
  const prepared = prepareCanthalTiltBasis(base);
  const [corner] = prepared.receipt.corners;
  const expected =
    (Math.tan((2 * Math.PI) / 180) * (0.6 - (4 * b) / 3)) /
    ((1 - (2 * b) / 0.9) * 0.06);
  TestValidator.predicate(
    "sex difference",
    nclose(corner!.before.men, 0, 0.3) &&
      nclose(corner!.before.women, 0, 0.3) &&
      nclose(corner!.after.women - corner!.after.men, 4, 0.05) &&
      nclose(corner!.after.women, 2, 0.3) &&
      nclose(corner!.after.men, -2, 0.3) &&
      nclose(prepared.receipt.factor, expected, 0.03),
  );
  TestValidator.equals(
    "restamped",
    [
      prepared.basis.id,
      prepared.documents[0]!.basis,
      prepared.controls.basis,
      prepared.receipt.source,
    ],
    ["analytic-eye/2", "analytic-eye/2", "analytic-eye/2", "analytic-eye/1"],
  );

  const edit = (change: (candidate: IAutoMovieHumanFaceBasis) => void) => {
    const candidate = eye();
    change(candidate);
    return candidate;
  };
  const refuse = (change: object, message: string) =>
    throwsError(() => prepareCanthalTiltBasis({ ...base, ...change }), message);
  TestValidator.predicate(
    "refusals",
    refuse({ revision: basis.id }, "distinct revision") &&
      refuse({ corners: [] }, "corners and a field") &&
      refuse({ field: [] }, "corners and a field") &&
      refuse(
        { basis: edit((one) => (one.channels[0]!.negative = null)) },
        "two-sided",
      ) &&
      refuse({ dimorphism: "none" }, "two-sided") &&
      refuse({ dimorphism: "blink" }, "two-sided") &&
      refuse({ field: ["blink"] }, "no shape channel") &&
      refuse({ field: ["none"] }, "no shape channel") &&
      refuse({ targets: { men: "absent", women: "female" } }, "absent") &&
      refuse({ skin: "none" }, "No surface none") &&
      refuse({ eyes: ["none"] }, "No eye landmark") &&
      refuse(
        { basis: edit((one) => delete one.landmarks) },
        "No eye landmark",
      ) &&
      refuse(
        {
          basis: edit((one) =>
            one.surfaces[1]!.positions.forEach((_, i, all) => {
              if (i % 3 === 0) all[i] = all[i]! + 10;
            }),
          ),
        },
        "no palpebral fissure",
      ) &&
      refuse({ field: ["far"], difference: -4 }, "does not move"),
  );
};
