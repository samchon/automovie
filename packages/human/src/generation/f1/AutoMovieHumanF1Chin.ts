import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";

/**
 * f1's chin, a family of its own merged on the trunk.
 *
 * The trunk's level sections fold under the chin, and the trunk leaves the chin out past a cone about its course; this family carries
 * that skin and 3 mm more inside the cone, on a course forward under the chin at 1,484 mm that turns up and runs out through
 * pogonion. Each section is the reference's skin in that region, closed by its chord, which lies inside the trunk.
 *
 * Source: test/.shots/family-conic-convert/2026-11-14T06-14-38.342Z, converted and fitted by `test/src/reference-conics/FamilyConicConvertChin.ts`; both ends capped 4 mm past
 * their last section. 210 independent numbers.
 */
export const AutoMovieHumanF1Chin: AutoMovieHumanConicLoft.IFamily = {
  name: "chin",
  centres: [[59,1484,0],[96,1484,0],[115.1021637550902,1501.1176749720112,0]],
  halves: [17.1249],
  up: [0,1,0],
  pitch: 0.6095,
  layout: {"mirror":false,"anchors":[{"kind":"u","guide":true,"pick":"max"},{"kind":"m","level":1},{"kind":"v","guide":true,"pick":"max"},{"kind":"m","level":1},{"kind":"u","guide":true,"pick":"min"},{"kind":"m","level":1},{"kind":"v","guide":true,"pick":"min"},{"kind":"m","level":1}]},
  knots: [3,6.78,10.56,14.33,18.11,21.89,25.67,29.44,33.22,37],
  values: [
    [36.29,43.6,47.52,49.4,51.28,53.76,56.23,57.21,50.7,65.69],
    [-0.07,0.1,0.17,0.48,0.3,-1.15,-0.07,2.97,-0.6,5.05],
    [0.4138,0.4137,0.4145,0.4142,0.4147,0.4146,0.4436,0.4592,0.4411,0.4794],
    [4.97,7.85,9.64,10.69,12.5,13.86,11.46,12.11,11.03,11.88],
    [31.46,36.02,37.99,39.18,39,38.61,35.85,35.24,32.78,32.47],
    [0.3846,0.3852,0.3825,0.3615,0.3832,0.3704,0.3861,0.34,0.3877,0.351],
    [-5.7,-5.84,-6.44,-7.02,-7.54,-7.8,-8.22,-7.79,-9.27,-9.02],
    [-0.27,0.02,-0.07,0.49,-0.48,-0.03,-1.71,0.21,-0.61,-0.8],
    [0.3884,0.4114,0.4096,0.3903,0.3813,0.3875,0.357,0.3513,0.3866,0.3439],
    [5.08,7.95,9.77,10.51,11.52,16.49,10.07,12.78,11.18,11.65],
    [-31.23,-35.55,-37.54,-38.79,-38.64,-39.8,-35.77,-36.3,-33.62,-33.19],
    [0.4144,0.4141,0.4143,0.413,0.4168,0.4103,0.449,0.4296,0.4374,0.4645],
    [0.5123,0.4914,0.5163,0.4695,0.5575,0.3769,0.7943,0.2115,0.2322,0.3812],
    [0.4981,0.5013,0.4975,0.5044,0.4931,0.5199,0.4264,0.6497,0.675,0.578],
    [0.7297,0.5312,0.4263,0.3197,0.3039,0.2756,0.1738,0.2305,0.1528,0.1148],
    [0.2597,0.4369,0.5489,0.6095,0.6273,0.62,0.564,0.6169,0.6382,0.6855],
    [0.3169,0.4613,0.5402,0.6284,0.6319,0.6533,0.5413,0.6875,0.6916,0.7202],
    [0.7083,0.4931,0.3974,0.2686,0.2543,0.3326,0.1503,0.23,0.1579,0.1173],
    [0.5067,0.4953,0.5091,0.4827,0.5327,0.4385,0.7385,0.5938,0.8116,0.8138],
    [0.4946,0.5038,0.4927,0.5135,0.4748,0.5566,0.3565,0.5543,0.3438,0.2392],
  ],
  tips: [{"from":3,"tip":-1},{"from":37,"tip":41}],
};
