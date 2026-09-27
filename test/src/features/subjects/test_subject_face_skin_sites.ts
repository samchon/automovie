import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  type IFaceSkinSiteNorms,
  faceSkinSiteFields,
  faceSkinSiteRatios,
  faceSkinSites,
} from "../../../scripts/face-review/faceSkinSites";
import { nclose, throwsError } from "../internal/predicates";

/** A closed box's corners and its outward counter-clockwise faces. */
const box = (
  offset: number,
  [x0, y0, z0]: readonly [number, number, number],
  [x1, y1, z1]: readonly [number, number, number],
) => ({
  positions: [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ].flat(),
  indices: [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [3, 7, 6],
    [3, 6, 2],
    [0, 4, 7],
    [0, 7, 3],
    [1, 2, 6],
    [1, 6, 5],
  ]
    .flat()
    .map((v) => v + offset),
});

/** The midline profile's depth by height (centimetres to metres). */
const PROFILE: [number, number][] = [
  [14, 0.07],
  [13, 0.09],
  [12, 0.105],
  [11, 0.12],
  [10, 0.128],
  [9, 0.134],
  [8, 0.138],
  [7, 0.141],
  [6, 0.143],
  [5, 0.144],
  [4, 0.142],
  [3, 0.14],
  [2, 0.145],
  [1, 0.152],
  [0, 0.16],
  [-1, 0.15],
  [-2, 0.15],
  [-3, 0.152],
  [-4, 0.149],
  [-5, 0.143],
  [-6, 0.144],
  [-7, 0.143],
  [-8, 0.138],
  [-9, 0.1],
  [-10, 0.09],
];
const COLUMNS = [-0.04, -0.029, -0.02, 0, 0.02, 0.029, 0.04];

/**
 * A synthetic head: a forward-facing height field (the profile, receding as
 * 10 x^2 to the sides), a back plate 5 cm behind the origin and two ear
 * slabs whose lower corners the ear-lobe channels move.
 */
const head = (): IAutoMovieHumanFaceBasis => {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [y, z] of PROFILE)
    for (const x of COLUMNS) positions.push(x, y / 100, z - 10 * x * x);
  const at = (row: number, column: number) => row * COLUMNS.length + column;
  for (let row = 0; row + 1 < PROFILE.length; ++row)
    for (let column = 0; column + 1 < COLUMNS.length; ++column) {
      // Rows run downward, so (column, row + 1, column + 1) is
      // counter-clockwise seen from the front.
      const [a, b, c, d] = [
        at(row, column),
        at(row, column + 1),
        at(row + 1, column + 1),
        at(row + 1, column),
      ];
      indices.push(a, d, c, a, c, b);
    }
  const back = positions.length / 3;
  positions.push(-0.05, -0.1, -0.05, 0.05, -0.1, -0.05, 0, 0.14, -0.05);
  indices.push(back, back + 2, back + 1);
  const ears = (["left", "right"] as const).map((side) => {
    const [x0, x1] = side === "left" ? [0.07, 0.074] : [-0.074, -0.07];
    const slab = box(positions.length / 3, [x0, -0.02, 0.03], [x1, 0.03, 0.05]);
    const first = positions.length / 3;
    positions.push(...slab.positions);
    indices.push(...slab.indices);
    return {
      side,
      rows: [0, 1, 4, 5].flatMap((k) => [first + k, 0, -0.001, 0]),
    };
  });
  const stomionUpper = at(
    PROFILE.findIndex(([y]) => y === -3),
    3,
  );
  const stomionLower = at(
    PROFILE.findIndex(([y]) => y === -4),
    3,
  );
  return {
    id: "head/1",
    channels: ears.map(({ side }) => ({
      id: `${side}EarLobe`,
      kind: "shape" as const,
      minimum: 0,
      maximum: 1,
      positive: `${side}Lobe`,
      negative: null,
    })),
    surfaces: [
      {
        id: "Human",
        positions,
        indices,
        targets: Object.fromEntries(
          ears.map(({ side, rows }) => [`${side}Lobe`, rows]),
        ),
        regions: [
          {
            id: "Human/skin",
            material: "skin",
            indices,
            uvs: null,
          },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
    landmarks: {
      ids: ["joint-l-eye", "joint-r-eye"],
      positions: [0.029, 0.034, 0.118, -0.029, 0.034, 0.118],
      targets: {},
    },
    articulation: {
      eyes: [
        { id: "leftEye", center: "joint-l-eye", gaze: [] },
        { id: "rightEye", center: "joint-r-eye", gaze: [] },
      ],
    },
    contact: {
      lips: { surface: "Human", upper: stomionUpper, lower: stomionLower },
    },
  } as unknown as IAutoMovieHumanFaceBasis;
};

const group = (mean: [number, number, number], subjects: number) => ({
  subjects,
  mean,
});

/**
 * Where the skin site norms sit on a head and the fields they make.
 * Scenarios:
 * 1. On the synthetic head the nose tip is the profile's most anterior
 *    vertex (0, 0, 16 cm); the frontal plane turns upward past 45 degrees at
 *    11 cm and the glabella is the most anterior point below it (5 cm), so
 *    the forehead sits at 8 cm; the menton is the lowest front vertex (-10
 *    cm) and the chin the most anterior in the lower half below the stomion
 *    (-7 cm); each lobule is its slab's lower corners' centroid; each cheek
 *    lies on its globe's column at the row nearest halfway between the
 *    globes and the stomion (0 cm). A basis without contact, an ear-lobe
 *    channel or a globe landmark, or whose lobe channel moves no auricle,
 *    refuses.
 * 2. An Asian woman's forehead is the subject-weighted mean of the Chinese
 *    and Japanese women's; a site measured on fewer than 30 subjects is
 *    left out; a group without a sex's record gives its whole group; an
 *    unrecorded ancestry gives none; a missing group refuses.
 * 3. The fields: one sphere per site with a ratio at its centre, gain the
 *    ratio, radius the distance to the nearest other site; the cheek and
 *    sites without ratios add none.
 */
export const test_subject_face_skin_sites = (): void => {
  const sites = faceSkinSites(head());
  const place = (site: string, side: string | null = null) =>
    sites.find((one) => one.site === site && one.side === side)!.center;
  const near = (a: readonly number[], b: readonly number[]) =>
    a.every((value, k) => nclose(value, b[k]!, 1e-9));
  TestValidator.predicate(
    "sites",
    sites.length === 7 &&
      near(place("noseTip"), [0, 0, 0.16]) &&
      near(place("forehead"), [0, 0.08, 0.138]) &&
      near(place("chin"), [0, -0.07, 0.143]) &&
      near(place("earLobe", "left"), [0.072, -0.02, 0.04]) &&
      near(place("earLobe", "right"), [-0.072, -0.02, 0.04]) &&
      near(place("cheek", "left"), [0.029, 0, 0.16 - 10 * 0.029 ** 2]) &&
      near(place("cheek", "right"), [-0.029, 0, 0.16 - 10 * 0.029 ** 2]),
  );
  const lobeless = head();
  lobeless.channels = lobeless.channels.filter(
    (one) => one.id !== "rightEarLobe",
  );
  const unmoved = head();
  unmoved.surfaces[0]!.targets["leftLobe"] = [0, 0, 0.001, 0];
  const blind = head();
  blind.landmarks!.ids = ["joint-l-eye", "other"];
  TestValidator.predicate(
    "an incomplete basis refuses",
    throwsError(
      () => faceSkinSites({ ...head(), contact: undefined }),
      "Skin sites need",
    ) &&
      throwsError(() => faceSkinSites(lobeless), "No rightEarLobe channel") &&
      throwsError(() => faceSkinSites(unmoved), "No left lobule") &&
      throwsError(() => faceSkinSites(blind), "No landmark joint-r-eye"),
  );
  const norms: IFaceSkinSiteNorms = {
    groups: {
      CN: {
        forehead: {
          all: group([0.9, 0.9, 0.8], 300),
          F: group([0.92, 0.9, 0.82], 60),
        },
        earLobe: { all: group([1.05, 1.05, 1.05], 20) },
      },
      JP: {
        forehead: { all: group([0.9, 0.9, 0.84], 118) },
        earLobe: { all: group([1, 1, 1], 5) },
      },
      CA: { chin: { all: group([0.97, 0.92, 0.92], 324) } },
      AF: {},
    },
  };
  const asian = faceSkinSiteRatios(
    { ancestry: "asian", sex: "female" },
    norms,
  )!;
  const european = faceSkinSiteRatios(
    { ancestry: "european", sex: null },
    norms,
  )!;
  TestValidator.predicate(
    "ratios",
    nclose(asian.forehead!.ratio[0], (0.92 * 60 + 0.9 * 118) / 178, 1e-12) &&
      asian.forehead!.subjects === 178 &&
      asian.earLobe === undefined &&
      asian.chin === undefined &&
      faceSkinSiteRatios({ ancestry: null, sex: "male" }, norms) === null &&
      JSON.stringify(Object.keys(european)) === '["chin"]' &&
      european.chin!.subjects === 324 &&
      european.chin!.ratio.every((value, k) =>
        nclose(value, [0.97, 0.92, 0.92][k]!, 1e-12),
      ) &&
      throwsError(
        () =>
          faceSkinSiteRatios({ ancestry: "asian", sex: null }, { groups: {} }),
        "lack the group CN",
      ),
  );
  const fields = faceSkinSiteFields(sites, {
    forehead: { ratio: [0.9, 0.9, 0.8], subjects: 100 },
    earLobe: { ratio: [1.05, 1.05, 1.05], subjects: 100 },
  });
  const distance = (a: readonly number[], b: readonly number[]) =>
    Math.hypot(...a.map((value, k) => value - b[k]!));
  TestValidator.predicate(
    "fields",
    JSON.stringify(fields.map((one) => one.name)) ===
      JSON.stringify(["forehead", "earLobe-left", "earLobe-right"]) &&
      near(fields[0]!.center, place("forehead")) &&
      nclose(
        fields[0]!.radius[0],
        Math.min(
          ...sites
            .filter((one) => one.site !== "forehead")
            .map((one) => distance(one.center, place("forehead"))),
        ),
        1e-12,
      ) &&
      fields[0]!.radius.every((value) => value === fields[0]!.radius[0]) &&
      JSON.stringify(fields[1]!.gain) === "[1.05,1.05,1.05]" &&
      fields.every((one) => one.strength === 1),
  );
};
