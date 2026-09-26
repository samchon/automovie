import {
  HUMAN_BODY_MEASUREMENTS,
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  humanBodyClipRing,
  humanBodySimpleShapeMath,
  humanBodySurfaceBoundary,
  measureHumanBodySimpleShape,
  measureHumanBodyVolume,
  projectHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
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
 *    basis lacks (the hip and the three limb girths) or whose rule the
 *    surface cannot answer (the bust rule reads a landmark the box lacks). The stature channel's rule is a
 *    height and every tape channel has a rule.
 * 3. The two Deurenberg regressions at ages 11, 15, 16 and adult, for both
 *    sexes, and their authored fractional-age bridge are checked against
 *    hand arithmetic. Jensen's pediatric head-and-neck share and its bridge
 *    to the adult approximation are also checked by hand, and so is the abs
 *    definition at 11, 15 and 16 through each sex's maturity ramp. Term rows
 *    by hand: a 25-year-old man at BMI 22 with muscle 0.5 gets
 *    gender 1, age 0, muscle 0.5, ptosis -0.2 (the lift row only), abs
 *    definition 0.3025 (Deurenberg 15.95% less 5% essential and the 5
 *    points half a unit of muscle's fat-free mass displaces, 5.95% on the
 *    band, times the muscle curve's 0.5) and no flank fat (its row starts at BMI 22 and the mass
 *    direction leaves the banded depots alone); rows for channels the
 *    basis lacks are skipped.
 * 4. Saturation: a 90-year-old at BMI 30 with muscle -1 gets ptosis 1 (the
 *    product 1.2 saturates) and muscle -1 (the sarcopenia row cannot go
 *    below the envelope); age 90 reads the last curve point.
 * 5. Stature: a 1.75 m ring plus the head allowance solves to height -0.5
 *    and a 1.9 m ring to -0.2; a stature the samples do not reach is refused
 *    with the reach.
 * 6. Mass: the solved weight reproduces the requested kilograms when the
 *    result is measured back at the same age-specific density and head share,
 *    a heavier request solves heavier, the density is bounded at both ends
 *    of its trusted fat band, and an adult or child mass beyond the samples
 *    is refused; a weight channel that shrinks the body as it grows is refused.
 * 7. A waist given in metres is solved on its channel and measured back
 *    with the mass still met (the two are solved against each other); one
 *    beyond the reach is refused.
 * 8. Projection: expanding then projecting returns the sex, age, stature,
 *    mass, muscle and waist requested; a neutral shape projects to the
 *    neutral values (sex 0, age 25, muscle 0), as does a basis without the
 *    identity channels; the curve inverse holds at both ends.
 * 9. Residue: applied over a shape with detailed edits on named channels
 *    and an unnamed one, the body's own projected values change nothing, a
 *    changed age moves only what age drives while the edits survive as
 *    residue, and an omitted waist leaves the waist channel as it was.
 */
export const test_human_body_simple_shape = (): void => {
  const table = HUMAN_BODY_SIMPLE_SHAPE;
  // the two tables agree: the stature channel is read by a height rule and
  // every tape measurement's channel has a rule
  TestValidator.equals(
    "stature rule",
    HUMAN_BODY_MEASUREMENTS[table.solved.stature]?.kind,
    "height",
  );
  for (const entry of table.measurements)
    TestValidator.predicate(
      `rule for ${entry.channel}`,
      HUMAN_BODY_MEASUREMENTS[entry.channel] !== undefined,
    );
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

  const { wide, narrow } = humanBodySimpleFixture.weights;
  const macros = humanBodySimpleFixture.basis;
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

  const fatCases = [
    { ageYears: 11, sex: 1, percent: 20.3 },
    { ageYears: 11, sex: -1, percent: 23.9 },
    { ageYears: 15, sex: 1, percent: 17.5 },
    { ageYears: 15, sex: -1, percent: 21.1 },
    { ageYears: 15.5, sex: 1, percent: 14.2575 },
    { ageYears: 15.5, sex: -1, percent: 21.4575 },
    { ageYears: 16, sex: 1, percent: 11.48 },
    { ageYears: 16, sex: -1, percent: 22.28 },
    { ageYears: 30, sex: 1, percent: 14.7 },
    { ageYears: 30, sex: -1, percent: 25.5 },
  ];
  for (const sample of fatCases)
    TestValidator.predicate(
      `Deurenberg ${sample.ageYears} ${sample.sex}`,
      nclose(humanBodySimpleShapeMath.fat(sample, 20).percent, sample.percent),
    );
  const absRow = table.terms.find((row) => row.channel === "absDefinition")!;
  // the row reads the developed muscle, and the visible fat subtracts the
  // fat-free mass it adds: maturity runs from 12.5 to 16.5 years for a boy
  // and from 10.8 to 14.8 for a girl, so the 11-year-old boy has built none
  // (0), the girl a twentieth (0.05 x 0.213 on the band at 10.45 points),
  // the 15-year-old boy five eighths (0.625 x 0.6375 at 5.625 points), and
  // the rest read their floor of one point
  for (const sample of [
    { ageYears: 11, sex: 1, definition: 0 },
    { ageYears: 11, sex: -1, definition: 0.01065 },
    { ageYears: 15, sex: 1, definition: 0.3984375 },
    { ageYears: 15, sex: -1, definition: 1 },
    { ageYears: 16, sex: 1, definition: 0.875 },
    { ageYears: 16, sex: -1, definition: 1 },
  ])
    TestValidator.predicate(
      `age-specific definition ${sample.ageYears} ${sample.sex}`,
      nclose(
        humanBodySimpleShapeMath.term(
          absRow,
          humanBodySimpleShapeMath.parameters({
            sex: sample.sex,
            ageYears: sample.ageYears,
            statureMetres: 1.5,
            massKilograms: 45,
            muscle: 1,
          }),
        ),
        sample.definition,
      ),
    );
  for (const [ageYears, fraction] of [
    [11, 0.11047128],
    [15, 0.081158],
    [15.5, 0.081079],
    [16, 0.081],
    [30, 0.081],
  ]) {
    TestValidator.predicate(
      `head and neck ${ageYears}`,
      nclose(humanBodySimpleShapeMath.headAndNeckFraction(ageYears), fraction),
    );
    TestValidator.predicate(
      `mass share ${ageYears}`,
      nclose(
        measureHumanBodySimpleShape.mass(0.1, 1, ageYears),
        100 / (1 - fraction),
      ),
    );
  }
  TestValidator.predicate(
    "density floors an out-of-band fat estimate",
    nclose(
      humanBodySimpleShapeMath.density(0),
      table.mass.siri.numerator /
        (table.mass.fatFraction[0] + table.mass.siri.offset),
    ),
  );
  TestValidator.predicate(
    "density ceils an out-of-band fat estimate",
    nclose(
      humanBodySimpleShapeMath.density(100),
      table.mass.siri.numerator /
        (table.mass.fatFraction[1] + table.mass.siri.offset),
    ),
  );

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
  // the limb girths are solved on their own channels, which the box lacks
  for (const [name, value] of [
    ["thighMetres", 0.55],
    ["upperArmMetres", 0.3],
    ["calfMetres", 0.37],
  ] as const)
    TestValidator.error(`a ${name} without its channel`, () =>
      expandHumanBodySimpleShape(basis, { ...base, [name]: value }),
    );
  TestValidator.error("a tape measurement the surface cannot answer", () =>
    expandHumanBodySimpleShape(basis, { ...base, bustMetres: 0.9 }),
  );

  const young = expandHumanBodySimpleShape(basis, base);
  TestValidator.equals("gender", young.macroGender, 1);
  TestValidator.equals("age", young.macroAge, 0);
  TestValidator.equals("muscle", young.macroMuscle, 0.5);
  TestValidator.predicate("ptosis lift", nclose(young.buttocksPtosis, -0.2));
  TestValidator.predicate(
    "abs definition",
    nclose(young.absDefinition, 0.3025),
  );
  // no flank row fires at BMI 22, and the mass direction leaves the banded
  // flank depot alone
  TestValidator.predicate("no flank fat", nclose(young.flankFat, 0));
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
    const bodyMassIndex =
      simple.massKilograms / (simple.statureMetres * simple.statureMetres);
    const fatPercent = humanBodySimpleShapeMath.fat(
      simple,
      bodyMassIndex,
    ).percent;
    const fat = Math.min(
      table.mass.fatFraction[1],
      Math.max(table.mass.fatFraction[0], fatPercent / 100),
    );
    const density = table.mass.siri.numerator / (fat + table.mass.siri.offset);
    return measureHumanBodySimpleShape.mass(
      measureHumanBodySimpleShape.volume(basis, shape),
      density,
      simple.ageYears,
    );
  };
  const reach = [-1, 1].map((weight) =>
    massOf({ macroWeight: weight, macroHeight: -0.5 }, base),
  );
  const requests: IAutoMovieHumanBodySimpleShape[] = [
    { ...base, massKilograms: reach[0] + 0.25 * (reach[1] - reach[0]) },
    { ...base, massKilograms: reach[0] + 0.75 * (reach[1] - reach[0]) },
    // a boy of 11 at BMI 16.5 is in the pediatric regime (15.015% fat)
    { ...base, ageYears: 11, massKilograms: 16.5 * stature * stature },
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
  // met to a tenth of a gram: the direction is solved in rounds and the
  // flank's kink at zero sits between two samples
  solved.forEach((shape, at) =>
    TestValidator.predicate(
      `mass round trip ${at}`,
      nclose(massOf(shape, requests[at]), requests[at].massKilograms, 1e-4),
    ),
  );
  for (const ageYears of [11, 15, 15.5, 16, 30])
    for (const sex of [-1, 1]) {
      const requested: IAutoMovieHumanBodySimpleShape = {
        ...base,
        ageYears,
        sex,
        massKilograms: 20 * stature * stature,
        muscle: 0,
      };
      const expanded = expandHumanBodySimpleShape(basis, requested);
      TestValidator.predicate(
        `regime mass ${ageYears} ${sex}`,
        nclose(massOf(expanded, requested), requested.massKilograms, 1e-4),
      );
      const projected = projectHumanBodySimpleShape(basis, expanded);
      TestValidator.predicate(
        `regime projection ${ageYears} ${sex}`,
        nclose(projected.massKilograms, requested.massKilograms, 0.05) &&
          nclose(projected.ageYears, ageYears) &&
          nclose(projected.sex, sex),
      );
    }
  TestValidator.predicate(
    "heavier solves heavier",
    solved[1].macroWeight > solved[0].macroWeight,
  );
  TestValidator.error("mass beyond the reach", () =>
    expandHumanBodySimpleShape(basis, { ...base, massKilograms: 250 }),
  );
  TestValidator.error("child underweight mass beyond the reach", () =>
    expandHumanBodySimpleShape(basis, {
      ...base,
      ageYears: 11,
      massKilograms: 15.4 * stature * stature,
    }),
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
  // the curve inverse holds at its ends: a feminine extreme reads -1, and
  // the muscle macro at the table's last point (the competition node, 2)
  // reads its last abscissa
  const ends = projectHumanBodySimpleShape(basis, {
    macroGender: -1,
    macroMuscle: 2,
  });
  TestValidator.equals("sex at the first point", ends.sex, -1);
  TestValidator.equals("muscle at the last point", ends.muscle, 2);
  // a basis without the identity channels reads them as neutral
  const plain = projectHumanBodySimpleShape(box, {});
  TestValidator.equals("plain sex", plain.sex, 0);
  TestValidator.equals("plain age", plain.ageYears, 25);
  TestValidator.equals("plain muscle", plain.muscle, 0);
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
