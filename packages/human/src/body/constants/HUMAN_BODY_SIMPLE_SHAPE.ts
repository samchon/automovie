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
 * weight change, the gluteal mass and pelvic tone muscle raises and age
 * takes, the adolescent maturity before which training builds no muscle, the
 * redistribution of fat from the limbs to the trunk with age, the WHO
 * android/gynoid split by sex, Deurenberg's age-specific body fat estimates
 * from BMI, age and sex, and the body fat bands below which the rectus,
 * deltoid and scapular relief show (ACE essential fat by sex, visible-abs
 * bands), and the ANSUR II people rows: gluteal projection, hip breadth and
 * depth, thigh and calf fat and a woman's breast position by sex over the
 * body mass index, fitted so that people of the 2012 US Army survey
 * reproduced from their own sex, age, stature, mass and chest and buttock
 * girths read their own buttock depth, waist breadth, depth and girth at the
 * omphalion, thigh and calf girths and bust point height.
 * Stature, mass and the tape measurements are not rows: they are
 * solved by measurement against the basis, with the head allowance, the mass
 * model and the channel each measurement is solved on given here. The body
 * mass index the fat rows read is mass over stature squared.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Holds the relations a simple parameter expands through, as data a user can read and audit.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Fixes the parameter envelope, age nodes, age-specific fat and head mass models, and the term table the expansion evaluates.
 */
export const HUMAN_BODY_SIMPLE_SHAPE: IAutoMovieHumanBodySimpleShapeTable = {
  /** Inclusive envelope of each simple parameter; outside it the expansion refuses. */
  limits: {
    sex: [-1, 1],
    ageYears: [11, 90],
    statureMetres: [1.2, 2.2],
    massKilograms: [25, 250],
    // to 2: the source's competition node, a fat-free mass index near the
    // natural limit of 25 (Kouri et al. 1995) at an athlete's mass index
    muscle: [-1, 2],
    waistMetres: [0.4, 2],
    hipsMetres: [0.5, 2],
    bustMetres: [0.5, 2],
    shoulderMetres: [0.2, 0.7],
    thighMetres: [0.2, 1.2],
    upperArmMetres: [0.12, 0.7],
    calfMetres: [0.15, 0.8],
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
    { parameter: "thighMetres", channel: "measureThighCirc" },
    { parameter: "upperArmMetres", channel: "measureUpperarmCirc" },
    { parameter: "calfMetres", channel: "measureCalfCirc" },
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
   * segment, which lies above the ring. Jensen's 1989 polynomial regression
   * (12 boys ages 4–20, 89 annual observations) supplies its child share;
   * Dempster's adult table as given by Winter supplies 8.1% for adults. The
   * Jensen curve (R² 0.76, regression error 0.0094 fraction) gives 8.1158%
   * at 15, almost the adult value. The small 15–16 interpolation joins
   * distinct study populations for a continuous
   * editor response; it is an authored bridge, not a measured growth curve.
   * The boy-only pediatric data also approximate girls here. Segment
   * boundaries may not coincide exactly with this basis's clip ring.
   * Source: https://doi.org/10.1016/0021-9290(89)90004-3, Table 1.
   */
  mass: {
    siri: { numerator: 4.95, offset: 4.5 },
    headAndNeck: {
      pediatric: {
        intercept: 0.27881,
        ageYearsCoefficient: -0.021152,
        ageYearsSquaredCoefficient: 0.00053168,
      },
      adultFraction: 0.081,
      transitionAgeYears: [15, 16],
      // Both segments end at the suprasternal notch and C7, but this basis's
      // clip ring stands 9 to 11 cm above the sternoclavicular joint, so the
      // skin keeps that neck. Measured on 24 simple-tier bodies (both sexes,
      // 11 to 70 years, body mass index 18 to 32) it is 1.7 to 3.0 % of the
      // volume, 2.35 % at an index of 24 and inversely with the index, with
      // little dependence on age or sex; the volume share stands for the
      // mass share (the difference, about a tenth of a point, is the neck's
      // density against the body's and the head outside the volume)
      keptNeck: { fraction: 0.0235, bodyMassIndex: 24 },
    },
    /** The fat fraction the density model is trusted over. */
    fatFraction: [0.05, 0.5],
  },
  /**
   * Deurenberg, Weststrate and Seidell 1991, with sex01 one for men: children
   * through 15 use `1.51 BMI - 0.70 age - 3.6 sex01 + 1.4`; ages 16 and above
   * use `1.20 BMI + 0.23 age - 10.8 sex01 - 5.4`. Between 15 and 16, blend
   * both equations' predictions at the requested age to avoid a jump. That
   * blend is an authored continuity rule, not a third fitted equation. The
   * child fit has R² 0.38 and SEE 4.4 percentage points (adult: R² 0.79,
   * SEE 4.1); neither predicts an individual's measured composition. The
   * sex-specific essential fat (ACE) is subtracted for the definition gates.
   * Source: https://doi.org/10.1079/BJN19910073.
   */
  fat: {
    pediatric: {
      bodyMassIndex: 1.51,
      ageYears: -0.7,
      male: -3.6,
      intercept: 1.4,
    },
    adult: {
      bodyMassIndex: 1.2,
      ageYears: 0.23,
      male: -10.8,
      intercept: -5.4,
    },
    transitionAgeYears: [15, 16],
    essentialBySex: [
      [-1, 13],
      [1, 5],
    ],
    // a trained body carries more fat-free mass at the same mass index: the
    // median young man's fat-free mass index is 18.9 and the young woman's
    // 15.4 (Schutz et al. 2002), natural male athletes average 21.8 (Kouri
    // et al. 1995); a unit of muscle takes an average young man at a mass
    // index of 24 to that 21.8, and a woman by the same share of her median
    muscleFatFreeMassIndex: [
      [-1, 1.8],
      [1, 2.2],
    ],
  },
  /**
   * Training builds little muscle before puberty: children's strength gains
   * are neural rather than hypertrophic (Faigenbaum et al. 2009; Lloyd et al.
   * 2014), and the muscle spurt follows peak height velocity, at 11.8 years
   * in girls and 13.5 in boys (Baxter-Jones et al. 2008), the lean mass
   * gained fastest in the year after it and the spurt lasting about two years
   * (Tanner et al. 1981). The ramp runs from a year before peak height
   * velocity to three years after it: an authored bridge over those
   * findings, not a fitted curve.
   */
  maturity: {
    startAgeYears: [
      [-1, 10.8],
      [1, 12.5],
    ],
    endAgeYears: [
      [-1, 14.8],
      [1, 16.5],
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
            [2, 2],
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
            parameter: "developedMuscle",
            points: [
              [-1, -1],
              [1, 1],
              [2, 1.43],
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
      // a muscular body lifts, less as the muscle ages: the gluteus maximus
      // carries the fold, and it loses three to five percent a decade after
      // thirty (sarcopenia), so an old muscular body keeps part of the lift
      channel: "buttocksPtosis",
      gain: -0.4,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 1],
            [60, 0.6],
            [90, 0.35],
          ],
        },
      ],
    },
    {
      // gluteal muscle mass, both ways from the average: the muscle a body
      // carries shows as the buttock's projection
      channel: "buttocksVolume",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      // and it atrophies with age (sarcopenia after thirty; the skin
      // envelope, fat and muscle all diminish with age, Gonzalez)
      channel: "buttocksVolume",
      gain: -0.4,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.45],
            [90, 1],
          ],
        },
      ],
    },
    {
      // the pelvic soft tissue's tone: raised by muscle, lost with age, the
      // lost tone lowering the gluteal mass as a whole (global tissue ptosis)
      channel: "pelvisTone",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      channel: "pelvisTone",
      gain: -0.6,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.5],
            [90, 1],
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
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          // the rectus shows in outline at about 10-12 percent fat on a man
          // and 20-22 on a woman and distinctly below about 9 and 16: over
          // each sex's essential fat, one band (consumer body-composition
          // guidance, not a clinical study)
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [5, 0.7],
            [9, 0.3],
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
            parameter: "developedMuscle",
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
      // the breast descends with age, most across menopause, and with body mass (Regnault grades; post-menopause and BMI are independent risk factors)
      channel: "breastTransDownUp",
      gain: -0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [45, 0.3],
            [55, 0.7],
            [80, 1],
          ],
        },
      ],
    },
    {
      // heavier breasts descend further
      channel: "breastTransDownUp",
      gain: -0.3,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.7],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the lower pole fills as the gland involutes to fat
      channel: "breastVolumeVertDownUp",
      gain: -0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [50, 0.4],
            [70, 0.9],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and loses projection
      channel: "breastPoint",
      gain: -0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.7],
            [85, 1],
          ],
        },
      ],
    },
    {
      // breast volume tracks body fat (the breast is largely adipose)
      channel: "macroCupsize",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [18, -0.6],
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // an adipose male chest (pseudogynecomastia) with body mass, held back by the pectoral muscle
      channel: "macroCupsize",
      gain: 0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [26, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
        {
          parameter: "developedMuscle",
          points: [
            [-1, 1],
            [0, 1],
            [1, 0.4],
          ],
        },
      ],
    },
    {
      // the abdominal wall's tone: raised by muscle
      channel: "stomachTone",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      // lost with age (diastasis and laxity)
      channel: "stomachTone",
      gain: -0.5,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.6],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and with abdominal fat
      channel: "stomachTone",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the navel lowers as abdominal fat grows
      channel: "stomachNavelDownUp",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [35, 0.7],
            [45, 1],
          ],
        },
      ],
    },
    {
      // submental fat with body mass
      channel: "neckDouble",
      gain: 0.8,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.5],
            [40, 1],
          ],
        },
      ],
    },
    {
      // and with age as the neck's skin loosens
      channel: "neckDouble",
      gain: 0.3,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [40, 0],
            [80, 1],
          ],
        },
      ],
    },
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatLeft",
      gain: 0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.4],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatLeft",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatRight",
      gain: 0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.4],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatRight",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // a trained upper body widens from the latissimus and deltoids into a
      // V over a narrower waist, more on a man (swimmers' wide shoulders and
      // narrow pelvis; the latissimus drives every stroke)
      channel: "torsoVshape",
      gain: 0.6,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 0.5],
            [1, 1],
          ],
        },
      ],
    },
    {
      // the superficial musculature shows through thin subcutaneous fat:
      // an average body at low fat shows some of it, a muscular one all of
      // it, and it is gone well before the fat bands where the belly and the
      // hips keep their fat longest
      channel: "musculatureDefinition",
      gain: 1,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, 0],
            [0, 0.35],
            [1, 1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0.15],
            [16, 0],
          ],
        },
      ],
    },
    {
      // the same relief over the breast mound, gated by sex
      channel: "chestDefinition",
      gain: 1,
      curves: [
        {
          // over the breast mound the gland and its fat cover the pectoralis
          parameter: "sex",
          points: [
            [-1, 0.15],
            [1, 1],
          ],
        },
        {
          parameter: "developedMuscle",
          points: [
            [-1, 0],
            [0, 0.35],
            [1, 1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0.15],
            [16, 0],
          ],
        },
      ],
    },
    {
      // the skeleton reads through where little more than essential fat
      // covers it and little muscle does: a lean athlete's ribs and spine sit
      // under the latissimus and the erectors, an emaciated body's do not
      channel: "skeletalProminence",
      gain: 1,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, 1],
            [0, 0.8],
            [1, 0.25],
            [2, 0.1],
          ],
        },
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
    // The ANSUR II people rows (below): reproduced from their own sex, age,
    // stature, mass and chest and buttock girths, the survey's people read
    // buttocks, waists at the omphalion, thighs, crotches and (men's) hip
    // joints out of place. These rows are the channel weights over the body
    // mass index that minimize those unpinned residuals, fitted on all 300
    // surveyed people with the stature, the tape pins and the mass re-solved.
    // Each channel also pays for the ridge its field raises (its 1 to 4 cm
    // heat-diffusion band above a plain scale field's), since a fit that
    // matches tapes cannot see its surface: without that cost the women's
    // buttocks stood as pointed pads, and with it neither sex keeps a gluteal
    // projection or belly row. The rows fade to zero past the survey's
    // support, over the body mass index and over age, where they crossed the
    // census's extreme bodies (the study README).
    {
      // ANSUR II people: hipScaleHoriz, women
      channel: "hipScaleHoriz",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.143],
            [22, -0.119],
            [26, -0.342],
            [30, -0.544],
            [35, -0.789],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: hipScaleDepth, women
      channel: "hipScaleDepth",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.053],
            [22, 0.0],
            [26, 0.068],
            [30, 0.168],
            [35, 0.268],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: upperlegFatLeft, women
      channel: "upperlegFatLeft",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: upperlegFatRight, women
      channel: "upperlegFatRight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: lowerlegFatLeft, women
      channel: "lowerlegFatLeft",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: lowerlegFatRight, women
      channel: "lowerlegFatRight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: breastTransDownUp, women
      channel: "breastTransDownUp",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.594],
            [22, -0.257],
            [26, 0.083],
            [30, 0.411],
            [40, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: hipScaleVert, women. The reproduced women's crotch
      // stood below theirs; a shorter pelvis raises the crotch by 20 mm per
      // unit with stature, girths and mass re-solved, but also lowers the
      // buttock and points it, so under the fit's surface cost it stays
      // small. It fades as the other rows do past the survey's support (a
      // thin woman of 90 folded her thigh)
      channel: "hipScaleVert",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.102],
            [22, -0.143],
            [26, -0.145],
            [30, -0.1],
            [35, -0.037],
            [45, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureWristCirc, women. The reproduced women's wrists
      // stood thin, most when lean (-30 mm at a body mass index of 18, -5 at
      // 35, over 126 people). The mass the wrist and ankle rows add is taken
      // back over the whole body by the mass solve: together they narrowed a
      // surveyed woman's waist at the omphalion by 7.6 mm and a man's by 1.4.
      // It fades like the other rows
      channel: "measureWristCirc",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.586],
            [22, 0.517],
            [26, 0.403],
            [30, 0.256],
            [35, 0.103],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureAnkleCirc, women. The reproduced women's ankles
      // stood thin, most when heavy (-14 mm at a body mass index of 18, -45 at
      // 35, over 126 people). The mass the wrist and ankle rows add is taken
      // back over the whole body by the mass solve: together they narrowed a
      // surveyed woman's waist at the omphalion by 7.6 mm and a man's by 1.4.
      // It fades like the other rows
      channel: "measureAnkleCirc",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.253],
            [22, 0.423],
            [26, 0.559],
            [30, 0.68],
            [35, 0.808],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureWristCirc, men. The reproduced men's wrists
      // stood thin when lean and thick when heavy (-34 mm at a body mass index
      // of 18, +17 at 35, over 128 people). The mass the wrist and ankle rows
      // add is taken back over the whole body by the mass solve: together they
      // narrowed a surveyed woman's waist at the omphalion by 7.6 mm and a
      // man's by 1.4. It fades like the other rows
      channel: "measureWristCirc",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.645],
            [22, 0.413],
            [26, 0.151],
            [30, -0.098],
            [35, -0.323],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureAnkleCirc, men. The reproduced men's ankles
      // thickened less with the body mass index than theirs (+13 mm at a body
      // mass index of 18, -19 at 35, over 128 people). The mass the wrist and
      // ankle rows add is taken back over the whole body by the mass solve:
      // together they narrowed a surveyed woman's waist at the omphalion by 7.6
      // mm and a man's by 1.4. It fades like the other rows
      channel: "measureAnkleCirc",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.249],
            [22, -0.104],
            [26, 0.031],
            [30, 0.184],
            [35, 0.359],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleHoriz, women. The waist section stood too
      // wide and too flat; fitted with the other rows.
      channel: "torsoScaleHoriz",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, -0.181],
            [26, -0.377],
            [30, -0.544],
            [35, -0.702],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleDepth, women. The waist section stood too
      // wide and too flat; fitted with the other rows.
      channel: "torsoScaleDepth",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.137],
            [22, 0.202],
            [26, 0.214],
            [30, 0.166],
            [35, 0.112],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureUpperlegHeight, men. The reproduced men's hip
      // joint stood 51 mm above the survey's trochanterion and their knee 29 mm
      // high: the legs about 5 cm long for their stature, the pelvis and buttock
      // high with them. Both leg segments shorten together with the stature re-
      // solved; the survey's people are 17 and older, so the row rises from
      // nothing at 11 to its full value at 17.
      channel: "measureUpperlegHeight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.094],
            [22, -0.05],
            [26, -0.23],
            [30, -0.436],
            [35, -0.639],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureLowerlegHeight, men. The reproduced men's hip
      // joint stood 51 mm above the survey's trochanterion and their knee 29 mm
      // high: the legs about 5 cm long for their stature, the pelvis and buttock
      // high with them. Both leg segments shorten together with the stature re-
      // solved; the survey's people are 17 and older, so the row rises from
      // nothing at 11 to its full value at 17.
      channel: "measureLowerlegHeight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.094],
            [22, -0.05],
            [26, -0.23],
            [30, -0.436],
            [35, -0.639],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleHoriz, men. The waist section stood too wide
      // and too flat; fitted with the other rows.
      channel: "torsoScaleHoriz",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.377],
            [22, -0.179],
            [26, 0.045],
            [30, 0.309],
            [35, 0.551],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleDepth, men. The waist section stood too wide
      // and too flat; fitted with the other rows.
      channel: "torsoScaleDepth",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.46],
            [22, -0.327],
            [26, -0.105],
            [30, 0.224],
            [35, 0.49],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: hipScaleVert, men. A taller pelvis lowers the
      // reproduced men's crotch, fitted with the other rows.
      channel: "hipScaleVert",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.088],
            [22, 0.088],
            [26, 0.082],
            [30, 0.111],
            [35, 0.09],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
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
