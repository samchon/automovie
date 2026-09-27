import {
  type IAutoMovieHumanBodyMeasurement,
  evaluateHumanBodyMeasurement,
  measureHumanBodyBasisChannels,
  measureHumanBodySection,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Girths are closed section loops and channels report them in metres.
 *
 * Scenarios:
 * 1. A horizontal plane through the analytic box yields the perimeter
 *    2(0.2 + 0.4) = 1.2 and the breadth 0.2, independent of height; a plane
 *    above or below the box yields null.
 * 2. With two boxes cut by one plane, the loop whose centroid is nearest the
 *    seed answers, so the seed picks the limb.
 * 3. An open surface (the box without its top and bottom, cut lengthwise)
 *    has no closed loop and answers null.
 * 4. `measureHumanBodyBasisChannels` reports per-endpoint RMS, peak and
 *    vertex counts by hand sums, evaluates the waist rule (min girth) at the
 *    neutral 1.2, +1 = 1.4 and -1 = 1.12, the height rule as 2 m and 2.5 m,
 *    and reports null values for a rule whose landmarks the basis lacks and no
 *    measurement for a channel without a rule.
 * 5. An empty surface population is refused.
 * 6. A tape bridges concavities: a prism whose unit-square section has a
 *    notch 0.5 deep and 0.2 wide in one side reports the contour perimeter
 *    3.8 + 2 * hypot(0.1, 0.5) and the tape girth 4 (the square's), cut
 *    across a vertical prism and across one lying along X, so both plane
 *    frames are exercised; on the convex box the girth equals the perimeter.
 * 7. A girth at a skin landmark follows it. On a column whose middle ring
 *    (0.4 by 0.4, at 1 m) is wider than its ends (0.2 by 0.4), a rule at a
 *    middle-ring vertex reads 1.6 at rest and still 1.6 with the ring lifted
 *    to 1.5 m, where a rule at half the segment reads the taper below the
 *    ring, 2 (2 (0.1 + 0.1 / 1.5) + 0.4) = 1.4667. A vertex outside its surface,
 *    a surface the basis lacks and a horizontal plane along a horizontal
 *    segment answer null.
 * 8. A girth taken where the section reaches furthest back: on a column whose
 *    widest ring (0.5 by 0.4, at 0.6 m) is not the one standing furthest
 *    back (0.2 wide, from 0.35 behind to 0.2 in front, at 1.4 m), the
 *    largest girth reads the wide ring's 1.8 and the rearmost the back
 *    ring's 1.5.
 */
export const test_human_body_measurement = (): void => {
  const { basis } = humanBodyBasisFixture();
  const surface = basis.surfaces[0];
  const up = { x: 0, y: 1, z: 0 };
  for (const height of [0.5, 1, 1.5]) {
    const section = measureHumanBodySection(
      surface.positions,
      surface.indices,
      { point: { x: 0, y: height, z: 0 }, normal: up },
      { x: 0, y: height, z: 0 },
    );
    TestValidator.predicate(
      "box girth at " + height,
      section !== null &&
        nclose(section.perimeter, 1.2) &&
        nclose(section.girth, 1.2) &&
        nclose(section.breadth, 0.2) &&
        nclose(section.centroid.y, height),
    );
  }
  TestValidator.equals(
    "plane above the box",
    measureHumanBodySection(
      surface.positions,
      surface.indices,
      { point: { x: 0, y: 3, z: 0 }, normal: up },
      { x: 0, y: 3, z: 0 },
    ),
    null,
  );
  const shifted = surface.positions.map((value, index) =>
    index % 3 === 0 ? value + 1 : value,
  );
  const twoBoxes = [...surface.positions, ...shifted];
  const twoIndices = [...surface.indices, ...surface.indices.map((i) => i + 8)];
  const near = measureHumanBodySection(
    twoBoxes,
    twoIndices,
    { point: { x: 0.9, y: 1, z: 0 }, normal: up },
    { x: 0.9, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "seed selects the nearer loop",
    near !== null && nclose(near.centroid.x, 1),
  );
  const openIndices = surface.indices.slice(0, 24);
  TestValidator.equals(
    "open surface cut lengthwise has no closed loop",
    measureHumanBodySection(
      surface.positions,
      openIndices,
      { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } },
      { x: 0, y: 1, z: 0 },
    ),
    null,
  );
  const measured = measureHumanBodyBasisChannels(basis);
  const width = measured.find((channel) => channel.id === "width")!;
  // wide moves all 8 vertices by 0.05; RMS over 8 resident vertices is 0.05.
  TestValidator.predicate(
    "positive endpoint scale",
    nclose(width.positive.displacement, 0.05) &&
      nclose(width.positive.peak, 0.05) &&
      width.positive.vertices === 8,
  );
  TestValidator.predicate(
    "negative endpoint scale",
    width.negative !== null &&
      nclose(width.negative.displacement, 0.02) &&
      width.negative.vertices === 8,
  );
  TestValidator.equals("channel without a rule", width.measurement, null);
  const waist = humanBodyBasisFixture();
  waist.basis.channels[0].id = "measureWaistCirc";
  waist.basis.correctives![0].inputs[0] = {
    side: "positive",
    channel: "measureWaistCirc",
  };
  const rules = measureHumanBodyBasisChannels(waist.basis);
  const girth = rules.find(
    (channel) => channel.id === "measureWaistCirc",
  )!.measurement!;
  TestValidator.predicate(
    "waist girth rule at neutral and both ends",
    girth.kind === "girth" &&
      nclose(girth.neutral!, 1.2) &&
      nclose(girth.positive!, 1.4) &&
      nclose(girth.negative!, 1.12),
  );
  const tall = humanBodyBasisFixture();
  tall.basis.channels[1].id = "macroHeight";
  tall.basis.correctives![0].inputs[1] = {
    side: "positive",
    channel: "macroHeight",
  };
  const height = measureHumanBodyBasisChannels(tall.basis).find(
    (channel) => channel.id === "macroHeight",
  )!.measurement!;
  TestValidator.predicate(
    "height rule reads the highest vertex above the ground",
    height.kind === "height" &&
      nclose(height.neutral!, 2) &&
      nclose(height.positive!, 2.5) &&
      height.negative === null,
  );
  const missing = humanBodyBasisFixture();
  missing.basis.channels[0].id = "measureUpperlegHeight";
  missing.basis.correctives![0].inputs[0] = {
    side: "positive",
    channel: "measureUpperlegHeight",
  };
  const distance = measureHumanBodyBasisChannels(missing.basis).find(
    (channel) => channel.id === "measureUpperlegHeight",
  )!.measurement!;
  TestValidator.equals(
    "rule without its landmarks reports null values",
    [distance.kind, distance.neutral, distance.positive, distance.negative],
    ["distance", null, null, null],
  );
  const spanned = humanBodyBasisFixture();
  spanned.basis.channels[1].id = "measureNapetowaistDist";
  spanned.basis.correctives![0].inputs[1] = {
    side: "positive",
    channel: "measureNapetowaistDist",
  };
  spanned.basis.landmarks.ids[2] = "joint-neck";
  spanned.basis.joints[1].tail = "joint-neck";
  const nape = measureHumanBodyBasisChannels(spanned.basis).find(
    (channel) => channel.id === "measureNapetowaistDist",
  )!.measurement!;
  TestValidator.predicate(
    "distance rule follows the raised landmark",
    nclose(nape.neutral!, 1) && nclose(nape.positive!, 1.5),
  );
  let refused = false;
  try {
    measureHumanBodyBasisChannels({ ...basis, surfaces: [] });
  } catch {
    refused = true;
  }
  TestValidator.predicate("empty surfaces refuse", refused);
  // 6. a notched prism: the contour dips into the notch, the tape does not
  const notched = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0.6, 1],
    [0.5, 0.5],
    [0.4, 1],
    [0, 1],
  ];
  const prism = (along: "y" | "x") => {
    const positions: number[] = [];
    for (const level of [0, 2])
      for (const [a, b] of notched)
        positions.push(...(along === "y" ? [a, level, b] : [level, a, b]));
    const indices: number[] = [];
    const n = notched.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, j, n + j, i, n + j, n + i);
    }
    return { positions, indices };
  };
  const contour = 3.8 + 2 * Math.hypot(0.1, 0.5);
  for (const along of ["y", "x"] as const) {
    const { positions, indices } = prism(along);
    const normal = along === "y" ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const point =
      along === "y" ? { x: 0.5, y: 1, z: 0.5 } : { x: 1, y: 0.5, z: 0.5 };
    const section = measureHumanBodySection(
      positions,
      indices,
      { point, normal },
      point,
    );
    TestValidator.predicate(
      "a tape bridges the notch across a prism along " + along,
      section !== null &&
        nclose(section.perimeter, contour) &&
        nclose(section.girth, 4),
    );
  }

  // a column of three rings, the middle one wider, which `lift` raises
  const ring = (y: number, halfWidth: number) => [
    [-halfWidth, y, -0.2],
    [halfWidth, y, -0.2],
    [halfWidth, y, 0.2],
    [-halfWidth, y, 0.2],
  ];
  const column = [...ring(0, 0.1), ...ring(1, 0.2), ...ring(2, 0.1)].flat();
  const sides = (a: number, b: number) =>
    [0, 1, 2, 3].flatMap((i) => {
      const j = (i + 1) % 4;
      return [a + i, b + j, a + j, a + i, b + i, b + j];
    });
  const columnBasis = {
    ...basis,
    channels: [
      ...basis.channels,
      {
        id: "lift",
        kind: "shape" as const,
        group: "torso",
        mirror: null,
        minimum: 0,
        maximum: 1,
        positive: "lifted",
        negative: null,
      },
    ],
    landmarks: {
      ids: ["joint-pelvis", "joint-spine-2", "joint-side"],
      positions: [0, 0, 0, 0, 2, 0, 1, 0, 0],
      targets: {},
    },
    surfaces: [
      {
        ...surface,
        positions: column,
        indices: [
          ...sides(0, 4),
          ...sides(4, 8),
          ...[8, 10, 9, 8, 11, 10, 0, 2, 3, 0, 1, 2],
        ],
        targets: { lifted: [4, 5, 6, 7].flatMap((v) => [v, 0, 0.5, 0]) },
      },
    ],
  };
  const leveled = (
    vertex: number,
    surfaceIndex = 0,
    to = "joint-spine-2",
  ): IAutoMovieHumanBodyMeasurement => ({
    kind: "girth",
    from: "joint-pelvis",
    to,
    level: { surface: surfaceIndex, vertex },
    horizontal: true,
  });
  const half: IAutoMovieHumanBodyMeasurement = {
    kind: "girth",
    from: "joint-pelvis",
    to: "joint-spine-2",
    range: [0.5, 0.5],
    steps: 1,
    pick: "max",
    horizontal: true,
  };
  TestValidator.predicate(
    "a girth at the middle ring's vertex",
    nclose(evaluateHumanBodyMeasurement(columnBasis, {}, leveled(5))!, 1.6),
  );
  TestValidator.predicate(
    "the landmark girth follows the lifted ring",
    nclose(
      evaluateHumanBodyMeasurement(columnBasis, { lift: 1 }, leveled(5))!,
      1.6,
    ),
  );
  TestValidator.predicate(
    "a fixed fraction reads the taper below it",
    nclose(
      evaluateHumanBodyMeasurement(columnBasis, { lift: 1 }, half)!,
      2 * (2 * (0.1 + 0.1 / 1.5) + 0.4),
    ),
  );
  TestValidator.equals(
    "a vertex outside its surface",
    evaluateHumanBodyMeasurement(columnBasis, {}, leveled(12)),
    null,
  );
  TestValidator.equals(
    "a surface the basis lacks",
    evaluateHumanBodyMeasurement(columnBasis, {}, leveled(5, 1)),
    null,
  );
  TestValidator.equals(
    "a horizontal plane along a horizontal segment",
    evaluateHumanBodyMeasurement(columnBasis, {}, leveled(5, 0, "joint-side")),
    null,
  );

  // a column whose widest ring and rearmost ring stand at different heights
  const box = (y: number, x: number, back: number, front: number) => [
    [-x, y, back],
    [x, y, back],
    [x, y, front],
    [-x, y, front],
  ];
  const humped = [
    ...box(0, 0.1, -0.2, 0.2),
    ...box(0.6, 0.25, -0.2, 0.2),
    ...box(1.4, 0.1, -0.35, 0.2),
    ...box(2, 0.1, -0.2, 0.2),
  ].flat();
  const humpedBasis = {
    ...columnBasis,
    surfaces: [
      {
        ...columnBasis.surfaces[0],
        positions: humped,
        indices: [
          ...sides(0, 4),
          ...sides(4, 8),
          ...sides(8, 12),
          ...[12, 14, 13, 12, 15, 14, 0, 2, 3, 0, 1, 2],
        ],
        targets: {},
      },
    ],
  };
  const band = (pick: "max" | "rearmost"): IAutoMovieHumanBodyMeasurement => ({
    kind: "girth",
    from: "joint-pelvis",
    to: "joint-spine-2",
    range: [0, 1],
    steps: 11,
    pick,
    horizontal: true,
  });
  TestValidator.predicate(
    "the largest girth is the wide ring's",
    nclose(evaluateHumanBodyMeasurement(humpedBasis, {}, band("max"))!, 1.8),
  );
  TestValidator.predicate(
    "the rearmost girth is the back ring's",
    nclose(
      evaluateHumanBodyMeasurement(humpedBasis, {}, band("rearmost"))!,
      1.5,
    ),
  );
};
