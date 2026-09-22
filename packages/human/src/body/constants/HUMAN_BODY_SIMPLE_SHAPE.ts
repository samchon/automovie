import type { IAutoMovieHumanBodySimpleShapeTable } from "../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * The expansion of the simple body tier into channel weights, as numbers.
 *
 * Every relation the expansion applies is a row here: a channel, a gain and
 * the piecewise-linear curves over the simple parameters (and two derived
 * ones) whose product the gain scales. A curve is `[x, y]` points in
 * ascending `x`, held flat outside its ends. The rows encode, with their
 * sources pinned in the body study, MakeHuman's age nodes (child 11 years,
 * young 25, old 90), the sarcopenia figure of three to five percent of muscle
 * per decade after thirty, Gonzalez's gluteal ptosis rising with age and
 * weight change, the redistribution of fat from the limbs to the trunk with
 * age, the WHO android/gynoid split by sex, Deurenberg's body fat estimate
 * from BMI, age and sex, and the body fat bands below which the rectus,
 * deltoid and scapular relief show (ACE essential fat by sex, visible-abs
 * bands). Stature, mass and the tape measurements are not rows: they are
 * solved by measurement against the basis, with the head allowance, the mass
 * model and the channel each measurement is solved on given here. The body
 * mass index the fat rows read is mass over stature squared.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Holds the relations a simple parameter expands through, as data a user can read and audit.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Fixes the parameter envelope, the age nodes, the mass model and the term table the expansion evaluates.
 */
export const HUMAN_BODY_SIMPLE_SHAPE: IAutoMovieHumanBodySimpleShapeTable = {
  /** Inclusive envelope of each simple parameter; outside it the expansion refuses. */
  limits: {
    sex: [-1, 1],
    ageYears: [11, 90],
    statureMetres: [1.2, 2.2],
    massKilograms: [25, 250],
    muscle: [-1, 1],
    waistMetres: [0.4, 2],
    hipsMetres: [0.5, 2],
    bustMetres: [0.5, 2],
    shoulderMetres: [0.2, 0.7],
  },
  identity: { sex: "macroGender", ageYears: "macroAge", muscle: "macroMuscle" },
  solved: {
    stature: "macroHeight",
    // a kilogram is the weight macro's field, which covers the whole skin
    // smoothly; the regional fat fields, stacked on it past their authored
    // reach, stood as shelves at the knee and the elbow on the sheet
    mass: {
      range: "macroWeight",
      direction: [{ channel: "macroWeight", gain: 1, curves: [] }],
    },
  },
  measurements: [
    { parameter: "waistMetres", channel: "measureWaistCirc" },
    { parameter: "hipsMetres", channel: "measureHipsCirc" },
    { parameter: "bustMetres", channel: "measureBustCirc" },
    { parameter: "shoulderMetres", channel: "measureShoulderDist" },
  ],
  /**
   * Stature is the basis's height rule (its clip ring above the ground) plus
   * the head above the ring, measured on the face basis this body is cut
   * from: crown 0.1388 m over the ring's highest vertex at -0.0808 m
   * (`mpfb-connected-head-2026-09-17-clipped`).
   */
  stature: { headAboveRingMetres: 0.2196 },
  /**
   * Body mass from the skin volume: density from the body fat fraction by
   * Siri's equation `fat = 4.95 / density - 4.50`, and the head and neck
   * segment, which lies above the ring, as 8.1% of body mass (Dempster's
   * segment table as given by Winter).
   */
  mass: {
    siri: { numerator: 4.95, offset: 4.5 },
    headAndNeckFraction: 0.081,
    /** The fat fraction the density model is trusted over. */
    fatFraction: [0.05, 0.5],
  },
  /**
   * Deurenberg 1991: `fat% = 1.20 BMI + 0.23 age - 10.8 sex01 - 5.4` with
   * sex01 one for men; and the essential fat each sex carries (ACE), which
   * the definition gates subtract so one band serves both sexes.
   */
  fat: {
    bodyMassIndex: 1.2,
    ageYears: 0.23,
    male: -10.8,
    intercept: -5.4,
    essentialBySex: [
      [-1, 13],
      [1, 5],
    ],
  },
  /** Channel weight = Σ rows gain · Π curve(parameter); missing channels are skipped. */
  terms: [
    {
      channel: "macroGender",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      channel: "macroAge",
      gain: 1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [11, -1],
            [25, 0],
            [90, 1],
          ],
        },
      ],
    },
    {
      channel: "macroMuscle",
      gain: 1,
      curves: [
        {
          parameter: "muscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      // sarcopenia: about thirty percent of muscle between 30 and 80
      channel: "macroMuscle",
      gain: -0.3,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [80, 1],
          ],
        },
      ],
    },
    ...[
      "upperarmMuscleLeft",
      "upperarmMuscleRight",
      "upperarmShoulderMuscleLeft",
      "upperarmShoulderMuscleRight",
      "lowerarmMuscleLeft",
      "lowerarmMuscleRight",
      "upperlegMuscleLeft",
      "upperlegMuscleRight",
      "lowerlegMuscleLeft",
      "lowerlegMuscleRight",
      "torsoMusclePectoral",
      "torsoMuscleDorsi",
    ].map(
      // the regional muscle the macro does not carry to a bodybuilder's bulk
      (channel): Term => ({
        channel,
        gain: 0.7,
        curves: [
          {
            parameter: "muscle",
            points: [
              [-1, -1],
              [1, 1],
            ],
          },
        ],
      }),
    ),
    {
      // gluteal ptosis with age, more on a heavier body
      channel: "buttocksPtosis",
      gain: 1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [40, 0.15],
            [60, 0.5],
            [80, 0.9],
            [90, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [18, 0.7],
            [25, 1],
            [35, 1.4],
          ],
        },
      ],
    },
    {
      // a young muscular body lifts
      channel: "buttocksPtosis",
      gain: -0.4,
      curves: [
        {
          parameter: "muscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 1],
            [50, 0],
          ],
        },
      ],
    },
    {
      channel: "stomachOverhang",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [30, 0.4],
            [35, 0.8],
            [40, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [20, 0.8],
            [60, 1],
          ],
        },
      ],
    },
    {
      // android fat: the flanks, more on men and with age
      channel: "flankFat",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [27, 0.5],
            [35, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 0.6],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0.8],
            [65, 1],
          ],
        },
      ],
    },
    ...["outerThighFatLeft", "outerThighFatRight"].map(
      (channel): Term => ({
        // gynoid fat: the outer thighs, more on women, less with age
        channel,
        gain: 1,
        curves: [
          {
            parameter: "bodyMassIndex",
            points: [
              [22, 0],
              [28, 0.6],
              [35, 1],
            ],
          },
          {
            parameter: "sex",
            points: [
              [-1, 1],
              [1, 0.3],
            ],
          },
          {
            parameter: "ageYears",
            points: [
              [25, 1],
              [70, 0.6],
            ],
          },
        ],
      }),
    ),
    {
      channel: "absDefinition",
      gain: 1,
      curves: [
        {
          parameter: "muscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [5, 1],
            [9, 0.8],
            [14, 0],
          ],
        },
      ],
    },
    ...[
      "deltoidDefinitionLeft",
      "deltoidDefinitionRight",
      "scapularDefinition",
    ].map(
      (channel): Term => ({
        channel,
        gain: 1,
        curves: [
          {
            parameter: "muscle",
            points: [
              [0, 0],
              [1, 1],
            ],
          },
          {
            parameter: "excessFatPercent",
            points: [
              [8, 1],
              [16, 0],
            ],
          },
        ],
      }),
    ),
    {
      // the skeleton reads through where little more than essential fat covers it
      channel: "skeletalProminence",
      gain: 1,
      curves: [
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0],
          ],
        },
      ],
    },
    {
      // firmness falls with age
      channel: "macroFirmness",
      gain: -1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [50, 0.5],
            [80, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
      ],
    },
  ],
};
