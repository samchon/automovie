import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Authored gluteal ptosis, volume and pelvic tone relations. Gonzalez 2006 (doi:10.1007/s00266-005-0051-y) associated age and weight with ptosis, while Babuccu et al. 2004 (doi:10.1007/s00266-004-4010-9) found adult weight rather than age effects. These knots are not a universal causal law.
 *
 * The rows are authored MPFB-derived exterior-skin controls, not muscle or fat
 * compartment measurements. QUADRA_HC's 48 healthy adults have separately
 * segmented left/right gluteus maximus, medius and minimus volumes
 * (doi:10.1038/s41597-025-05997-4), but those supine CT volumes do not give
 * this basis a standing tissue boundary or map a muscle input to a skin
 * projection. In the current body, removing the `buttocksVolume` and
 * `pelvisTone` responses changes a young adult's exterior volume by about
 * 0.7 L without changing the existing groin self-crossings. Thus the gains
 * below are legacy appearance assumptions, not physiological volume gains or
 * contact coefficients; replacing that representation requires independent
 * bone, muscle, fat and standing-skin geometry.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_GLUTEAL: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      // authored age/BMI relation; the source studies disagree on age effects
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
      // authored lift from developed muscle, attenuated with age; gluteal
      // muscle and tissue loss vary by person and are not measured by this row
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
      // Legacy exterior response to the simple muscle input. No measured
      // gluteus volume or standing skin projection is inferred by this row.
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
      // authored age decline in gluteal volume; ptosis is not a direct
      // measurement of muscle or fat volume for an individual
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
      // Legacy pelvis-skin response. This channel is neither a tissue stiffness
      // measurement nor a constraint for anatomical contact or local volume.
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
  ];
