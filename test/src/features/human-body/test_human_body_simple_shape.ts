import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  humanBodyClipRing,
  humanBodySurfaceBoundary,
  measureHumanBodySimpleShape,
  measureHumanBodyVolume,
  projectHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * The simple tier expands into the detailed one through the numeric table
 * and measured inversions, and projects back off any detailed shape.
 *
 * Scenarios, on the analytic box at seven tenths of its width and depth,
 * given macro channels (height raises or lowers the top ring by 0.5 m per
 * unit, weight widens or narrows the box, waist widens it too):
 * 1. The volume of the closed box is 0.16 m³; without its top it is capped
 *    and measures the same; its boundary is the top ring and the clip ring
 *    of the closed box is its highest vertex.
 * 2. Every parameter outside its envelope, or not finite, is refused, a
 *    missing required one too; a basis without `macroHeight` or
 *    `macroWeight` is refused, and a tape measurement whose channel the
 *    basis lacks.
 * 3. Term rows by hand: a 25-year-old man at BMI 22 with muscle 0.5 gets
 *    gender 1, age 0, muscle 0.5, ptosis -0.2 (the lift row only), abs
 *    definition 0.244 (Deurenberg 15.95% less 5% essential, 10.95% on the
 *    band) and no flank fat; rows for channels the basis lacks are skipped.
 * 4. Saturation: a 90-year-old at BMI 30 with muscle -1 gets ptosis 1 (the
 *    product 1.2 saturates) and muscle -1 (the sarcopenia row cannot go
 *    below the envelope); age 90 reads the last curve point.
 * 5. Stature: a 1.75 m ring plus the head allowance solves to height -0.5
 *    and a 1.9 m ring to -0.2; a stature the samples do not reach is refused
 *    with the reach.
 * 6. Mass: the solved weight reproduces the requested kilograms when the
 *    result is measured back at the same density, a heavier request solves
 *    heavier, the fat fraction saturates at both ends of its trusted band
 *    without breaking the round trip, and a mass beyond the samples is
 *    refused; a weight channel that shrinks the body as it grows is refused.
 * 7. A waist given in metres is solved on its channel and measured back
 *    with the mass still met (the two are solved against each other); one
 *    beyond the reach is refused.
 * 8. Projection: expanding then projecting returns the sex, age, stature,
 *    mass, muscle and waist requested; a neutral shape projects to the
 *    neutral values (sex 0, age 25, muscle 0).
 * 9. Residue: applied over a shape with detailed edits on named channels
 *    and an unnamed one, the body's own projected values change nothing, a
 *    changed age moves only what age drives while the edits survive as
 *    residue, and an omitted waist leaves the waist channel as it was.
 */
export const test_human_body_simple_shape = (): void => {
  const table = HUMAN_BODY_SIMPLE_SHAPE;
  const { basis: box } = humanBodyBasisFixture();
  const surface = box.surfaces[0];
  const volume = measureHumanBodyVolume(surface.positions, surface.indices);
  TestValidator.predicate("closed box volume", nclose(volume, 0.16));
  // the fixture lists the two top triangles before the two bottom ones
  const open = [...surface.indices.slice(0, 24), ...surface.indices.slice(30)];
  TestValidator.predicate(
    "capped open box volume",
    nclose(measureHumanBodyVolume(surface.positions, open), 0.16),
  );
  TestValidator.equals(
    "boundary of the open box",
    humanBodySurfaceBoundary(open),
    [4, 5, 6, 7],
  );
  TestValidator.equals(
    "clip ring of the closed box",
    humanBodyClipRing(surface),
    [4],
  );

  const wide = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
    v,
    surface.positions[v * 3] > 0 ? 0.05 : -0.05,
    0,
    0,
  ]);
  const narrow = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
    v,
    surface.positions[v * 3] > 0 ? -0.02 : 0.02,
    0,
    0,
  ]);
  const deep = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
    v,
    0,
    0,
    surface.positions[v * 3 + 2] > 0 ? 0.03 : -0.03,
  ]);
  const macros = (
    weightPositive: number[],
    weightNegative: number[],
  ): IAutoMovieHumanBodyBasis => ({
    ...box,
    channels: [
      ...box.channels,
      ...[
        ["macroGender", -1],
        ["macroAge", -1],
        ["macroMuscle", -1],
        ["macroFirmness", -1],
        ["buttocksPtosis", -1],
        ["absDefinition", 0],
        ["flankFat", 0],
      ].map(([id, minimum]) => ({
        id: String(id),
        kind: "shape" as const,
        group: "macro",
        mirror: null,
        minimum: Number(minimum),
        maximum: 1,
        positive: "wideTall",
        negative: minimum === 0 ? null : "wideTall",
      })),
      {
        id: "macroHeight",
        kind: "shape",
        group: "macro",
        mirror: null,
        minimum: -1,
        maximum: 1,
        positive: "raised",
        negative: "lowered",
      },
      {
        id: "macroWeight",
        kind: "shape",
        group: "macro",
        mirror: null,
        minimum: -1,
        maximum: 1,
        positive: "grown",
        negative: "shrunk",
      },
      {
        id: "measureWaistCirc",
        kind: "shape",
        group: "torso",
        mirror: null,
        minimum: -1,
        maximum: 1,
        positive: "deep",
        negative: "shallow",
      },
    ],
    correctives: [],
    surfaces: [
      {
        ...surface,
        // seven tenths of the box's width and depth put its body mass index
        // reach at about 13 to 31, a human band
        positions: surface.positions.map((value, at) =>
          at % 3 === 1 ? value : value * 0.7,
        ),
        targets: {
          ...surface.targets,
          lowered: [4, 0, -0.5, 0, 5, 0, -0.5, 0, 6, 0, -0.5, 0, 7, 0, -0.5, 0],
          grown: weightPositive,
          shrunk: weightNegative,
          deep,
          shallow: deep.map((value, at) => (at % 4 === 0 ? value : -value / 3)),
        },
      },
    ],
  });
  const basis = macros(wide, narrow);
  const head = table.stature.headAboveRingMetres;
  const stature = 1.75 + head;
  const base: IAutoMovieHumanBodySimpleShape = {
    sex: 1,
    ageYears: 25,
    statureMetres: stature,
    massKilograms: 22 * stature * stature,
    muscle: 0.5,
  };

  for (const name of Object.keys(table.limits) as (keyof typeof table.limits)[])
    for (const value of [
      table.limits[name][0] - 0.001,
      table.limits[name][1] + 0.001,
      Number.NaN,
    ])
      TestValidator.error(`${name} ${value} refused`, () =>
        expandHumanBodySimpleShape(basis, { ...base, [name]: value }),
      );
  TestValidator.error("a missing required value", () =>
    expandHumanBodySimpleShape(basis, {
      ...base,
      muscle: undefined as unknown as number,
    }),
  );
  for (const id of ["macroHeight", "macroWeight"])
    TestValidator.error(`basis without ${id}`, () =>
      expandHumanBodySimpleShape(
        {
          ...basis,
          channels: basis.channels.filter((channel) => channel.id !== id),
        },
        base,
      ),
    );
  TestValidator.error("a tape measurement without its channel", () =>
    expandHumanBodySimpleShape(basis, { ...base, hipsMetres: 1 }),
  );

  const young = expandHumanBodySimpleShape(basis, base);
  TestValidator.equals("gender", young.macroGender, 1);
  TestValidator.equals("age", young.macroAge, 0);
  TestValidator.equals("muscle", young.macroMuscle, 0.5);
  TestValidator.predicate("ptosis lift", nclose(young.buttocksPtosis, -0.2));
  TestValidator.predicate("abs definition", nclose(young.absDefinition, 0.244));
  TestValidator.predicate("flank fat", nclose(young.flankFat, 0));
  TestValidator.equals("skipped row", young.stomachOverhang, undefined);
  TestValidator.predicate(
    "stature 1.75 m ring",
    nclose(young.macroHeight, -0.5),
  );

  const old = expandHumanBodySimpleShape(basis, {
    ...base,
    ageYears: 90,
    statureMetres: 1.9 + head,
    massKilograms: 30 * (1.9 + head) * (1.9 + head),
    muscle: -1,
  });
  TestValidator.equals("ptosis saturates", old.buttocksPtosis, 1);
  TestValidator.equals("muscle saturates", old.macroMuscle, -1);
  TestValidator.equals("age at the last point", old.macroAge, 1);
  TestValidator.predicate("stature 1.9 m ring", nclose(old.macroHeight, -0.2));
  TestValidator.error("stature beyond the reach", () =>
    expandHumanBodySimpleShape(basis, { ...base, statureMetres: 1.2 }),
  );

  const massOf = (
    shape: Record<string, number>,
    simple: IAutoMovieHumanBodySimpleShape,
  ): number => {
    const parameters = HUMAN_BODY_SIMPLE_SHAPE.fat;
    const bodyMassIndex =
      simple.massKilograms / (simple.statureMetres * simple.statureMetres);
    const fatPercent =
      parameters.bodyMassIndex * bodyMassIndex +
      parameters.ageYears * simple.ageYears +
      (parameters.male * (simple.sex + 1)) / 2 +
      parameters.intercept;
    const fat = Math.min(
      table.mass.fatFraction[1],
      Math.max(table.mass.fatFraction[0], fatPercent / 100),
    );
    const density = table.mass.siri.numerator / (fat + table.mass.siri.offset);
    return measureHumanBodySimpleShape.mass(
      measureHumanBodySimpleShape.volume(basis, shape),
      density,
    );
  };
  const reach = [-1, 1].map((weight) =>
    massOf({ macroWeight: weight, macroHeight: -0.5 }, base),
  );
  const requests: IAutoMovieHumanBodySimpleShape[] = [
    { ...base, massKilograms: reach[0] + 0.25 * (reach[1] - reach[0]) },
    { ...base, massKilograms: reach[0] + 0.75 * (reach[1] - reach[0]) },
    // the fat fraction floors: a boy of 11 at BMI 15.4 estimates 4.8% fat
    { ...base, ageYears: 11, massKilograms: 15.4 * stature * stature },
    // and ceils: a woman of 90 at BMI 30 estimates 51% fat
    {
      ...base,
      sex: -1,
      ageYears: 90,
      massKilograms: 30 * stature * stature,
    },
  ].filter(
    (simple) =>
      simple.massKilograms >= reach[0] && simple.massKilograms <= reach[1],
  );
  TestValidator.equals("the box reaches every request", requests.length, 4);
  const solved = requests.map((simple) =>
    expandHumanBodySimpleShape(basis, simple),
  );
  solved.forEach((shape, at) =>
    TestValidator.predicate(
      `mass round trip ${at}`,
      nclose(massOf(shape, requests[at]), requests[at].massKilograms, 1e-6),
    ),
  );
  TestValidator.predicate(
    "heavier solves heavier",
    solved[1].macroWeight > solved[0].macroWeight,
  );
  TestValidator.error("mass beyond the reach", () =>
    expandHumanBodySimpleShape(basis, { ...base, massKilograms: 250 }),
  );
  TestValidator.error("a weight channel that shrinks", () =>
    expandHumanBodySimpleShape(macros(narrow, wide), base),
  );

  const waistOf = (shape: Record<string, number>): number =>
    measureHumanBodySimpleShape.channel(basis, shape, "measureWaistCirc")!;
  const waistReach = [-1, 1].map((weight) =>
    waistOf({ ...solved[0], measureWaistCirc: weight }),
  );
  const waist = waistReach[0] + 0.3 * (waistReach[1] - waistReach[0]);
  const belted = expandHumanBodySimpleShape(basis, {
    ...requests[0],
    waistMetres: waist,
  });
  TestValidator.predicate(
    "waist solved on its channel",
    nclose(waistOf(belted), waist, 1e-3),
  );
  TestValidator.predicate(
    "mass kept under the waist",
    nclose(massOf(belted, requests[0]), requests[0].massKilograms, 0.05),
  );
  TestValidator.error("waist beyond the reach", () =>
    expandHumanBodySimpleShape(basis, {
      ...requests[0],
      waistMetres: waistReach[1] + 0.1,
    }),
  );

  const projected = projectHumanBodySimpleShape(basis, belted);
  for (const name of [
    "sex",
    "ageYears",
    "statureMetres",
    "massKilograms",
    "muscle",
    "waistMetres",
  ] as const)
    TestValidator.predicate(
      `projection returns ${name}`,
      nclose(
        projected[name]!,
        { ...requests[0], waistMetres: waist }[name]!,
        // the girth and the mass are solved against each other in two
        // passes, so they meet their requests to the third digit
        name === "massKilograms" ? 0.05 : name === "waistMetres" ? 1e-3 : 1e-4,
      ),
    );
  const neutral = projectHumanBodySimpleShape(basis, {});
  TestValidator.equals("neutral sex", neutral.sex, 0);
  TestValidator.equals("neutral age", neutral.ageYears, 25);
  TestValidator.equals("neutral muscle", neutral.muscle, 0);

  const edited: Record<string, number> = {
    ...belted,
    buttocksPtosis: 0.35,
    macroFirmness: -0.4,
    width: 0.3,
  };
  // on the box every channel moves the walls, so the edits change what the
  // body measures; the values that change nothing are the body's own
  const own = projectHumanBodySimpleShape(basis, edited, ["waistMetres"]);
  const same = expandHumanBodySimpleShape(basis, own, edited);
  for (const [id, value] of Object.entries(edited))
    TestValidator.predicate(
      `the body's own values keep ${id}`,
      nclose(same[id] ?? 0, value, 1e-4),
    );
  const older = expandHumanBodySimpleShape(
    basis,
    { ...own, ageYears: 60 },
    edited,
  );
  TestValidator.predicate("age moved", nclose(older.macroAge, 35 / 65, 1e-4));
  const bare = expandHumanBodySimpleShape(basis, own);
  const bareOlder = expandHumanBodySimpleShape(basis, { ...own, ageYears: 60 });
  TestValidator.predicate(
    "the ptosis edit survives under the age's own ptosis",
    // the residue plus the age's own ptosis saturates at the envelope
    nclose(
      older.buttocksPtosis,
      Math.min(1, 0.35 + (bareOlder.buttocksPtosis - bare.buttocksPtosis)),
      1e-4,
    ),
  );
  TestValidator.predicate(
    "the firmness edit survives under the age's own firmness",
    nclose(
      older.macroFirmness,
      -0.4 + (bareOlder.macroFirmness - bare.macroFirmness),
      1e-4,
    ),
  );
  const unbelted = expandHumanBodySimpleShape(
    basis,
    { ...own, waistMetres: undefined, ageYears: 60 },
    edited,
  );
  TestValidator.predicate(
    "an omitted waist keeps its channel",
    nclose(unbelted.measureWaistCirc, edited.measureWaistCirc, 1e-4),
  );
  TestValidator.equals("an unnamed channel passes through", older.width, 0.3);
};
