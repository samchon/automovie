/** Shared source-conditioned four-digit group law; no specimen control table.
 * Original source cubics, actual h and C0 sides remain independently archived.
 * This new linear-station/quintic-vector approximation is not source reduction.
 */
export namespace HumanFourGroupRules {
  /** Common source-observed regular band in the feature coordinate between
   * thumb and pinky branch events. These are observation bounds, not ports. */
  export const observedFraction: readonly [number,number] = [0.4639686848053073, 0.7916359091319994];

  /** Rows tau^0,tau^1. Forty channels: four shared vector positions (8),
   * independent incoming/outgoing vector tangents (16), and two vector
   * zero-first-jet residuals per arc (16). Native guide roots establish
   * +U,+V,-U,-V correspondence; original within-arc physical h is preserved
   * in identification and is not declared transported material phase. */
  export const coefficients: readonly (readonly number[])[] = [
  [
    0.8571863871780565,
    0.005239047337824328,
    0.0008903726287877028,
    0.059548414637572156,
    -0.4788175614899836,
    -0.0008073163554666862,
    0.001156844880132346,
    -0.0877012877280321,
    -2.1198649747815694,
    0.27882542271028377,
    -0.5148029432216708,
    0.08516511799308074,
    -0.813338302118953,
    0.039417792760072956,
    -0.5194905588492587,
    -0.03359870419482025,
    -0.3340685503361458,
    -0.11685346044905948,
    -0.7146215601380748,
    -0.17663790265548962,
    1.2721802623410747,
    -0.04924113097294299,
    0.8479385476409442,
    -0.13108133823362067,
    -0.22167410247878383,
    0.16718933398070845,
    0.7122939255433006,
    0.15019424458162378,
    0.031840169908596255,
    0.022879918429037603,
    0.06571573555527589,
    0.016227221008057624,
    0.07696344594095228,
    -0.9982789123446841,
    2.4849959405589863,
    -0.3973568300122009,
    -5.2163304440469105,
    0.0010162269733308693,
    -3.0389391342962613,
    -1.325594884522492
  ],
  [
    -0.28722763495759995,
    -0.014952376403633463,
    -0.0015048525662810786,
    -0.01212660146262634,
    0.009400017907792824,
    2.8249073144581693e-05,
    -0.008386962080852878,
    -0.016975021830769987,
    2.8002694185212604,
    -0.18246987094300787,
    -0.05827711678050296,
    0.1915377618675609,
    0.12773282395093696,
    -0.047185242349868525,
    0.0029584810533692663,
    0.021044066264675254,
    -0.15513992199617,
    0.02752633760653775,
    0.1566900305597167,
    0.10037910367870144,
    -0.3800498575039244,
    -0.030560111971186743,
    1.632681823557515,
    0.6363590371171004,
    0.21603060333755053,
    -0.6199783509228729,
    -1.0998829791094353,
    -0.08304928911750271,
    0.09884773714049355,
    -0.18967527431547954,
    -0.26715048888343174,
    0.07018763283566644,
    -0.8095972257546477,
    0.03900881059052212,
    -0.8683963751839268,
    0.4579137294800385,
    10.879748041646671,
    -1.4410619136692047,
    12.185050254650363,
    2.2903418316045343
  ]
];

  /** Source feature proxy from thumb01-hand, middle01-hand, thumb02-thumb01.
   * The common owner evaluates this once, then shares its actual feature object.
   * RMS3.720/max4.606mm; held-out max6.247mm. No clinical/native exact claim. */
  export const thumbFeature: readonly [number,number,number] = [0.8606506658563131, 0.22889147612880748, 0.7299081519917563];

  /** Source pinky feature proxy from pinky01-hand,middle01-hand,index01-hand.
   * RMS2.179/max3.913mm; held-out max4.912mm. JN's unresolved source microbands
   * remain conditional geometric observations, not certified smooth saddles. */
  export const pinkyFeature: readonly [number,number,number] = [1.1412900728277056, -0.32920125710148446, 0.4107936244223801];
}
