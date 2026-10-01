import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Arm-length corrections from the ANSUR II arm span, as authored data of the
 * simple body table.
 *
 * The source neutral's arms are short for its height. With the elbows and
 * wrists straightened and both arms raised to the lateral plane, the
 * reproduced women's fingertip-to-fingertip span stands at 1.136 of their
 * acromial height and the men's at 1.232, where the ANSUR II means are 1.244
 * and 1.259 (4,082 men and 1,986 women, `span` over `acromialheight`, the
 * 2012 U.S. Army working databases, as summarised by the repository's
 * `anthropometry-percentiles.json` receipt). The source's own sexual
 * dimorphism of the arm is therefore about nine percent where the survey's is
 * about one, and the survey measured a span, not segment lengths.
 *
 * Three channels move the arm's reach and each is an independent endpoint of
 * the source: the upper arm, the forearm and the hand. Their weights are one
 * value per sex, applied to all three, because the span fixes the sum of the
 * reach and the survey's segment tapes (acromion to radiale, radiale to
 * stylion) start and stop at skeletal landmarks the rig's joint centres do not
 * coincide with by amounts this table does not measure. The value is solved from the
 * measured reach of the channels at full weight (the span gains 0.138 m from
 * the upper arm, 0.077 m from the forearm and 0.088 m from the hand): 0.48
 * closes the women's 0.144 m span gap and 0.135 closes the men's 0.041 m. On
 * 28 survey people the women's span over acromial height then stands 0.026
 * above each person's own survey value on average (0.110 below before) and the
 * men's 0.019 above (0.016 below before), so the men gain nothing in
 * scatter. The survey's people are 17 and older, so the rows rise from
 * nothing at 11 to the full value at 17, as the leg rows do, and fade past 60.
 *
 * This is one military sample, not a universal growth law, and the segment
 * split is unresolved: it matches the measured span, not each segment.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_ARM_LENGTH: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    "measureUpperarmLength",
    "measureLowerarmLength",
    "handScaleLeft",
    "handScaleRight",
  ].map((channel) => ({
    channel,
    gain: 1,
    curves: [
      {
        parameter: "sex" as const,
        points: [
          [-1, 0.48],
          [1, 0.135],
        ] as [number, number][],
      },
      {
        parameter: "ageYears" as const,
        points: [
          [11, 0],
          [17, 1],
          [60, 1],
          [80, 0],
        ] as [number, number][],
      },
    ],
  }));
