import type { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";

/**
 * The landmark rows of the leg's section, as one table: the eight guides'
 * `[rho, rho_theta, rho_thetatheta]` and the sixteen sectors' `[fullness]`
 * (a thigh and a shank compartment after each guide), the medians over the
 * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
 * left leg (the legs stand within 3.7 degrees of vertical). A guide's values
 * are read about each section's area centroid by least squares of a quadratic
 * over +-12 degrees about its angle, `rho` in units of the section's girth
 * over 2 pi and its derivatives in the section angle (radians); a sector's
 * fullness is its bulge against the quintic Hermite arc of its two guides'
 * jets, normal to its chord at its middle (`AutoMovieHumanChordArc`), outward
 * positive. The thigh rows stand at 0.25 to 1 of the thigh from the hip centre
 * (0.18 is the crotch ring), the shank rows at 0.07 to 0.9 of the shank from
 * the knee centre. `AutoMovieHumanLegGuides` carries every channel between its
 * rows by the natural cubic spline (C2). Each entry's note gives the
 * structures it runs over and the largest held-out deviation of a person's
 * value from the median of the other three.
 */
export namespace AutoMovieHumanLegSectionRows {
  /** A guide: its section angle (0 forward, increasing toward lateral on the left leg) and its rows. */
  export interface IGuide {
    /** The guide's name. */
    name: string;

    /** Section angle, radians. */
    angle: number;

    /** The landmark rows, `[rho, rho_theta, rho_thetatheta]`. */
    rows: readonly AutoMovieHumanLegProfile.IRow[];
  }

  /** A sector after a guide: its thigh and its shank compartment's rows, `[fullness]`. */
  export interface ISector {
    /** The thigh compartment's name. */
    thigh: string;

    /** The shank compartment's name. */
    shank: string;

    /** The thigh compartment's rows. */
    thighRows: readonly AutoMovieHumanLegProfile.IRow[];

    /** The shank compartment's rows. */
    shankRows: readonly AutoMovieHumanLegProfile.IRow[];
  }

  /** The eight guides by increasing angle, 0 to 315 degrees; each owns its point, tangent and curvature in every section it crosses, which both neighbouring sectors copy (G2 across the guide). */
  export const GUIDES: readonly IGuide[] = [
    // anterior, 0 degrees: the rectus femoris crest on the thigh and the tibial crest, the anterior border on the shank; held-out deviation 0.0129 to 0.0615 (thigh), 0.0211 to 0.0799 (shank).
    {
      name: "anterior",
      angle: 0,
      rows: [
        { segment: "shank", share: 0.07, values: [1.0988, 0.0411, -0.6686] },
        { segment: "shank", share: 0.15, values: [1.0695, 0.066, -0.7805] },
        { segment: "shank", share: 0.25, values: [1.0396, 0.1253, -0.3777] },
        { segment: "shank", share: 0.35, values: [1.0269, 0.2272, -0.4977] },
        { segment: "shank", share: 0.5, values: [1.0182, 0.2184, -0.4756] },
        { segment: "shank", share: 0.65, values: [1.0346, 0.141, -0.4342] },
        { segment: "shank", share: 0.8, values: [1.0877, 0.1047, -0.3056] },
        { segment: "shank", share: 0.9, values: [1.1409, -0.0007, -0.8041] },
        { segment: "thigh", share: 0.25, values: [1.0265, 0.1408, -0.0281] },
        { segment: "thigh", share: 0.35, values: [1.0196, 0.1652, -0.1947] },
        { segment: "thigh", share: 0.5, values: [1.0421, 0.1507, -0.2669] },
        { segment: "thigh", share: 0.65, values: [1.0521, 0.0298, -0.1999] },
        { segment: "thigh", share: 0.8, values: [1.0533, 0.0009, -0.395] },
        { segment: "thigh", share: 0.9, values: [1.068, 0.0986, -0.4384] },
        { segment: "thigh", share: 1, values: [1.1131, 0.1449, -1.0537] },
      ],
    },

    // anterolateral, 45 degrees: the anterolateral maximum, where the rectus femoris meets the vastus lateralis on the thigh and the anterior compartment's lateral edge, the tibialis anterior and the extensor mass on the shank; held-out deviation 0.031 to 0.074 (thigh), 0.0117 to 0.0767 (shank).
    {
      name: "anterolateral",
      angle: 0.785398,
      rows: [
        { segment: "shank", share: 0.07, values: [0.9354, -0.2992, 0.565] },
        { segment: "shank", share: 0.15, values: [0.981, -0.1344, -0.0487] },
        { segment: "shank", share: 0.25, values: [1.0278, -0.1683, -0.2167] },
        { segment: "shank", share: 0.35, values: [1.0349, -0.1801, -0.0537] },
        { segment: "shank", share: 0.5, values: [1.0393, -0.157, -0.2079] },
        { segment: "shank", share: 0.65, values: [1.0337, -0.1315, -0.1826] },
        { segment: "shank", share: 0.8, values: [1.0383, -0.222, -0.223] },
        { segment: "shank", share: 0.9, values: [0.9723, -0.3221, 0.0617] },
        { segment: "thigh", share: 0.25, values: [1.03, -0.1394, -0.0877] },
        { segment: "thigh", share: 0.35, values: [1.0457, -0.1198, -0.1945] },
        { segment: "thigh", share: 0.5, values: [1.0571, -0.1361, -0.2999] },
        { segment: "thigh", share: 0.65, values: [1.0395, -0.0884, -0.2947] },
        { segment: "thigh", share: 0.8, values: [1.005, -0.09, 0.0015] },
        { segment: "thigh", share: 0.9, values: [0.9802, -0.2157, 0.1094] },
        { segment: "thigh", share: 1, values: [0.9398, -0.3824, 0.4723] },
      ],
    },

    // lateral, 90 degrees: the iliotibial band, flat on the thigh and the fibular line between the extensor and the peroneal mass on the shank; held-out deviation 0.0149 to 0.043 (thigh), 0.0206 to 0.0402 (shank).
    {
      name: "lateral",
      angle: 1.570796,
      rows: [
        { segment: "shank", share: 0.07, values: [0.8993, 0.1946, 0.5469] },
        { segment: "shank", share: 0.15, values: [0.928, 0.12, 0.2946] },
        { segment: "shank", share: 0.25, values: [0.9451, 0.0122, 0.3037] },
        { segment: "shank", share: 0.35, values: [0.9554, -0.0102, 0.2559] },
        { segment: "shank", share: 0.5, values: [0.9702, 0.0023, 0.088] },
        { segment: "shank", share: 0.65, values: [0.954, -0.023, 0.2044] },
        { segment: "shank", share: 0.8, values: [0.8897, -0.0722, 0.3923] },
        { segment: "shank", share: 0.9, values: [0.8117, -0.0032, 0.5051] },
        { segment: "thigh", share: 0.25, values: [0.9452, -0.0426, 0.1866] },
        { segment: "thigh", share: 0.35, values: [0.9606, -0.0396, 0.1761] },
        { segment: "thigh", share: 0.5, values: [0.9465, -0.0898, 0.1832] },
        { segment: "thigh", share: 0.65, values: [0.9298, -0.1167, 0.268] },
        { segment: "thigh", share: 0.8, values: [0.9394, 0.0015, 0.5826] },
        { segment: "thigh", share: 0.9, values: [0.9482, 0.1628, 0.192] },
        { segment: "thigh", share: 1, values: [0.9223, 0.25, -0.0865] },
      ],
    },

    // posterolateral, 135 degrees: the biceps femoris on the thigh and the lateral head of the gastrocnemius on the shank; held-out deviation 0.0092 to 0.0855 (thigh), 0.0102 to 0.0479 (shank).
    {
      name: "posterolateral",
      angle: 2.356194,
      rows: [
        { segment: "shank", share: 0.07, values: [1.0332, 0.0567, -0.1161] },
        { segment: "shank", share: 0.15, values: [1.0266, 0.0326, -0.1929] },
        { segment: "shank", share: 0.25, values: [0.988, 0.0402, -0.0104] },
        { segment: "shank", share: 0.35, values: [0.9787, 0.0226, -0.0153] },
        { segment: "shank", share: 0.5, values: [0.9799, 0.0097, -0.0067] },
        { segment: "shank", share: 0.65, values: [0.9855, 0.065, -0.0144] },
        { segment: "shank", share: 0.8, values: [0.9212, 0.1672, 0.4002] },
        { segment: "shank", share: 0.9, values: [0.9029, 0.1246, 0.004] },
        { segment: "thigh", share: 0.25, values: [0.9546, 0.0561, 0.2049] },
        { segment: "thigh", share: 0.35, values: [0.9692, 0.0217, -0.0816] },
        { segment: "thigh", share: 0.5, values: [0.9416, 0.0762, 0.0653] },
        { segment: "thigh", share: 0.65, values: [0.9534, 0.1276, -0.0101] },
        { segment: "thigh", share: 0.8, values: [0.9868, 0.031, 0.322] },
        { segment: "thigh", share: 0.9, values: [0.9761, -0.0281, 0.6467] },
        { segment: "thigh", share: 1, values: [0.9888, 0.0643, 0.5558] },
      ],
    },

    // posterior, 180 degrees: the hamstring cleft on the thigh and the cleft between the gastrocnemius heads, then the Achilles midline on the shank; held-out deviation 0.0093 to 0.0393 (thigh), 0.0079 to 0.0502 (shank).
    {
      name: "posterior",
      angle: 3.141593,
      rows: [
        { segment: "shank", share: 0.07, values: [1.0218, -0.1444, -0.4632] },
        { segment: "shank", share: 0.15, values: [1.0259, -0.0103, -0.1061] },
        { segment: "shank", share: 0.25, values: [1.0046, 0.0118, 0.0948] },
        { segment: "shank", share: 0.35, values: [0.9858, 0.0243, 0.1954] },
        { segment: "shank", share: 0.5, values: [0.9793, 0.0083, 0.1161] },
        { segment: "shank", share: 0.65, values: [1.0103, 0.0102, -0.02] },
        { segment: "shank", share: 0.8, values: [1.0907, 0.1109, -0.5334] },
        { segment: "shank", share: 0.9, values: [1.1846, 0.3356, -1.8249] },
        { segment: "thigh", share: 0.25, values: [1.0465, 0.1027, -0.258] },
        { segment: "thigh", share: 0.35, values: [0.999, 0.0635, 0.0826] },
        { segment: "thigh", share: 0.5, values: [1.0209, 0.0889, -0.0545] },
        { segment: "thigh", share: 0.65, values: [1.0543, 0.0635, -0.3035] },
        { segment: "thigh", share: 0.8, values: [1.0218, -0.0321, 0.0225] },
        { segment: "thigh", share: 0.9, values: [0.996, -0.0828, -0.0178] },
        { segment: "thigh", share: 1, values: [0.9926, -0.1697, -0.2676] },
      ],
    },

    // posteromedial, 225 degrees: the posteromedial maximum, the semitendinosus and semimembranosus on the thigh and the medial head of the gastrocnemius on the shank; held-out deviation 0.0221 to 0.0571 (thigh), 0.0057 to 0.0577 (shank).
    {
      name: "posteromedial",
      angle: 3.926991,
      rows: [
        { segment: "shank", share: 0.07, values: [0.9468, 0.15, 0.3508] },
        { segment: "shank", share: 0.15, values: [0.9618, -0.0327, 0.4617] },
        { segment: "shank", share: 0.25, values: [1.0146, -0.0069, 0.0605] },
        { segment: "shank", share: 0.35, values: [1.0206, 0.0253, -0.0025] },
        { segment: "shank", share: 0.5, values: [1.0235, 0.0616, -0.1059] },
        { segment: "shank", share: 0.65, values: [1.0084, -0.0116, -0.0088] },
        { segment: "shank", share: 0.8, values: [1.03, -0.2061, -0.1009] },
        { segment: "shank", share: 0.9, values: [0.9464, -0.4872, 0.5836] },
        { segment: "thigh", share: 0.25, values: [1.0234, -0.1372, -0.0322] },
        { segment: "thigh", share: 0.35, values: [1.0459, 0.0187, -0.234] },
        { segment: "thigh", share: 0.5, values: [1.0555, -0.0199, -0.2185] },
        { segment: "thigh", share: 0.65, values: [1.0396, -0.1047, -0.2322] },
        { segment: "thigh", share: 0.8, values: [1.0213, -0.0449, -0.2341] },
        { segment: "thigh", share: 0.9, values: [1.0312, 0.0578, -0.3393] },
        { segment: "thigh", share: 1, values: [1.0067, 0.1734, -0.3931] },
      ],
    },

    // medial, 270 degrees: the adductors and the gracilis on the thigh and the soleus' medial edge and the tibia's medial border on the shank; held-out deviation 0.0245 to 0.0744 (thigh), 0.0124 to 0.0812 (shank).
    {
      name: "medial",
      angle: 4.712389,
      rows: [
        { segment: "shank", share: 0.07, values: [0.996, -0.134, -0.4571] },
        { segment: "shank", share: 0.15, values: [0.9919, 0.0283, -0.1462] },
        { segment: "shank", share: 0.25, values: [0.9978, -0.0638, -0.0847] },
        { segment: "shank", share: 0.35, values: [1.019, -0.0535, -0.1966] },
        { segment: "shank", share: 0.5, values: [1.0183, -0.0772, -0.1832] },
        { segment: "shank", share: 0.65, values: [1.0045, -0.0263, -0.1475] },
        { segment: "shank", share: 0.8, values: [0.8971, -0.1068, 0.268] },
        { segment: "shank", share: 0.9, values: [0.7789, 0.029, 0.3268] },
        { segment: "thigh", share: 0.25, values: [0.943, -0.0068, 0.3631] },
        { segment: "thigh", share: 0.35, values: [0.9817, -0.0873, 0.1999] },
        { segment: "thigh", share: 0.5, values: [0.971, -0.1367, 0.0996] },
        { segment: "thigh", share: 0.65, values: [0.9285, -0.1072, 0.1472] },
        { segment: "thigh", share: 0.8, values: [0.9516, -0.0823, 0.1876] },
        { segment: "thigh", share: 0.9, values: [0.9671, -0.2205, -0.1075] },
        { segment: "thigh", share: 1, values: [0.9849, -0.2464, -0.4072] },
      ],
    },

    // anteromedial, 315 degrees: the vastus medialis and the sartorius on the thigh and the edge of the subcutaneous medial tibial face on the shank; held-out deviation 0.0208 to 0.0704 (thigh), 0.019 to 0.0855 (shank).
    {
      name: "anteromedial",
      angle: 5.497787,
      rows: [
        { segment: "shank", share: 0.07, values: [0.9025, 0.1251, 1.038] },
        { segment: "shank", share: 0.15, values: [0.9639, -0.0021, 0.3813] },
        { segment: "shank", share: 0.25, values: [0.9228, 0.0017, 0.6429] },
        { segment: "shank", share: 0.35, values: [0.8998, -0.1235, 0.6287] },
        { segment: "shank", share: 0.5, values: [0.9164, -0.1473, 0.3781] },
        { segment: "shank", share: 0.65, values: [0.9329, -0.0521, 0.4858] },
        { segment: "shank", share: 0.8, values: [0.9213, 0.2008, 0.4007] },
        { segment: "shank", share: 0.9, values: [0.9385, 0.3424, 0.304] },
        { segment: "thigh", share: 0.25, values: [0.9772, 0.0197, -0.0676] },
        { segment: "thigh", share: 0.35, values: [0.9405, -0.0321, 0.1691] },
        { segment: "thigh", share: 0.5, values: [0.9091, 0.0458, 0.4643] },
        { segment: "thigh", share: 0.65, values: [0.9517, 0.1657, 0.1795] },
        { segment: "thigh", share: 0.8, values: [0.9679, 0.1229, 0.1171] },
        { segment: "thigh", share: 0.9, values: [0.9267, 0.1874, 0.4579] },
        { segment: "thigh", share: 1, values: [0.8528, 0.1491, 1.2404] },
      ],
    },
  ];

  /** The eight sectors, sector `j` following guide `j`; each owns 33 of the section's 264 knot spans. */
  export const SECTORS: readonly ISector[] = [
    // thigh quadricepsAnterior: rectus femoris with the front of the vastus lateralis, between the anterior (0 degrees) and the anterolateral guide (45 degrees); held-out deviation 0.0014 to 0.0117.
    // shank tibialisAnterior: front of the anterior compartment beside the tibial crest, between the anterior (0 degrees) and the anterolateral guide (45 degrees); held-out deviation 0.002 to 0.018.
    {
      thigh: "quadricepsAnterior",
      shank: "tibialisAnterior",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0072] },
        { segment: "thigh", share: 0.35, values: [0.0063] },
        { segment: "thigh", share: 0.5, values: [0.0074] },
        { segment: "thigh", share: 0.65, values: [0.0031] },
        { segment: "thigh", share: 0.8, values: [0.0024] },
        { segment: "thigh", share: 0.9, values: [0.0062] },
        { segment: "thigh", share: 1, values: [0.0096] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0115] },
        { segment: "shank", share: 0.15, values: [-0.0028] },
        { segment: "shank", share: 0.25, values: [0.0049] },
        { segment: "shank", share: 0.35, values: [0.0094] },
        { segment: "shank", share: 0.5, values: [0.006] },
        { segment: "shank", share: 0.65, values: [0.0033] },
        { segment: "shank", share: 0.8, values: [0.0069] },
        { segment: "shank", share: 0.9, values: [0.0046] },
      ],
    },

    // thigh vastusLateralis: vastus lateralis, between the anterolateral (45 degrees) and the lateral guide (90 degrees); held-out deviation 0.0003 to 0.0071.
    // shank extensorMass: extensor mass, the tibialis anterior and the extensor digitorum, between the anterolateral (45 degrees) and the lateral guide (90 degrees); held-out deviation 0.0017 to 0.015.
    {
      thigh: "vastusLateralis",
      shank: "extensorMass",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0003] },
        { segment: "thigh", share: 0.35, values: [-0.0007] },
        { segment: "thigh", share: 0.5, values: [-0.0016] },
        { segment: "thigh", share: 0.65, values: [0.0003] },
        { segment: "thigh", share: 0.8, values: [0.0038] },
        { segment: "thigh", share: 0.9, values: [-0.0018] },
        { segment: "thigh", share: 1, values: [-0.0052] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.003] },
        { segment: "shank", share: 0.15, values: [-0.0025] },
        { segment: "shank", share: 0.25, values: [-0.0013] },
        { segment: "shank", share: 0.35, values: [-0.0007] },
        { segment: "shank", share: 0.5, values: [-0.0008] },
        { segment: "shank", share: 0.65, values: [-0.0005] },
        { segment: "shank", share: 0.8, values: [0.0008] },
        { segment: "shank", share: 0.9, values: [0] },
      ],
    },

    // thigh iliotibialBand: iliotibial band over the lateral intermuscular septum, flat, between the lateral (90 degrees) and the posterolateral guide (135 degrees); held-out deviation 0.0028 to 0.0133.
    // shank peroneals: peroneal muscles over the fibula, between the lateral (90 degrees) and the posterolateral guide (135 degrees); held-out deviation 0.0023 to 0.0053.
    {
      thigh: "iliotibialBand",
      shank: "peroneals",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0016] },
        { segment: "thigh", share: 0.35, values: [0.0021] },
        { segment: "thigh", share: 0.5, values: [0.0001] },
        { segment: "thigh", share: 0.65, values: [-0.0027] },
        { segment: "thigh", share: 0.8, values: [0.0081] },
        { segment: "thigh", share: 0.9, values: [0.013] },
        { segment: "thigh", share: 1, values: [0.0116] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0074] },
        { segment: "shank", share: 0.15, values: [0.0062] },
        { segment: "shank", share: 0.25, values: [0.0043] },
        { segment: "shank", share: 0.35, values: [0.0032] },
        { segment: "shank", share: 0.5, values: [0.0024] },
        { segment: "shank", share: 0.65, values: [0] },
        { segment: "shank", share: 0.8, values: [0.0013] },
        { segment: "shank", share: 0.9, values: [0.0027] },
      ],
    },

    // thigh bicepsFemoris: biceps femoris, between the posterolateral (135 degrees) and the posterior guide (180 degrees); held-out deviation 0.0009 to 0.0067.
    // shank gastrocnemiusLateral: lateral head of the gastrocnemius and the soleus under it, between the posterolateral (135 degrees) and the posterior guide (180 degrees); held-out deviation 0.0015 to 0.0167.
    {
      thigh: "bicepsFemoris",
      shank: "gastrocnemiusLateral",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0003] },
        { segment: "thigh", share: 0.35, values: [-0.0004] },
        { segment: "thigh", share: 0.5, values: [0.001] },
        { segment: "thigh", share: 0.65, values: [0.0001] },
        { segment: "thigh", share: 0.8, values: [0.0067] },
        { segment: "thigh", share: 0.9, values: [0.0101] },
        { segment: "thigh", share: 1, values: [0.0092] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0021] },
        { segment: "shank", share: 0.15, values: [0.001] },
        { segment: "shank", share: 0.25, values: [0.0029] },
        { segment: "shank", share: 0.35, values: [0.0029] },
        { segment: "shank", share: 0.5, values: [0.0017] },
        { segment: "shank", share: 0.65, values: [0.0032] },
        { segment: "shank", share: 0.8, values: [0.0041] },
        { segment: "shank", share: 0.9, values: [-0.0173] },
      ],
    },

    // thigh hamstringMedial: semitendinosus and the semimembranosus, between the posterior (180 degrees) and the posteromedial guide (225 degrees); held-out deviation 0.0013 to 0.0042.
    // shank gastrocnemiusMedial: medial head of the gastrocnemius, the lower and larger, between the posterior (180 degrees) and the posteromedial guide (225 degrees); held-out deviation 0.002 to 0.0269.
    {
      thigh: "hamstringMedial",
      shank: "gastrocnemiusMedial",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0041] },
        { segment: "thigh", share: 0.35, values: [0.0012] },
        { segment: "thigh", share: 0.5, values: [0.0005] },
        { segment: "thigh", share: 0.65, values: [-0.0005] },
        { segment: "thigh", share: 0.8, values: [0.0024] },
        { segment: "thigh", share: 0.9, values: [-0.0026] },
        { segment: "thigh", share: 1, values: [-0.0146] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [-0.004] },
        { segment: "shank", share: 0.15, values: [0.0051] },
        { segment: "shank", share: 0.25, values: [0.0034] },
        { segment: "shank", share: 0.35, values: [0.0034] },
        { segment: "shank", share: 0.5, values: [0] },
        { segment: "shank", share: 0.65, values: [0.0022] },
        { segment: "shank", share: 0.8, values: [0.0043] },
        { segment: "shank", share: 0.9, values: [0.015] },
      ],
    },

    // thigh gracilisMagnus: gracilis and the adductor magnus, between the posteromedial (225 degrees) and the medial guide (270 degrees); held-out deviation 0.001 to 0.0223.
    // shank soleusMedial: soleus' medial part, between the posteromedial (225 degrees) and the medial guide (270 degrees); held-out deviation 0.0005 to 0.0055.
    {
      thigh: "gracilisMagnus",
      shank: "soleusMedial",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0018] },
        { segment: "thigh", share: 0.35, values: [0.0039] },
        { segment: "thigh", share: 0.5, values: [0.0017] },
        { segment: "thigh", share: 0.65, values: [0.0006] },
        { segment: "thigh", share: 0.8, values: [0.002] },
        { segment: "thigh", share: 0.9, values: [0.0045] },
        { segment: "thigh", share: 1, values: [0.0065] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0064] },
        { segment: "shank", share: 0.15, values: [0.0018] },
        { segment: "shank", share: 0.25, values: [0.0034] },
        { segment: "shank", share: 0.35, values: [0.0008] },
        { segment: "shank", share: 0.5, values: [0.0016] },
        { segment: "shank", share: 0.65, values: [0.0001] },
        { segment: "shank", share: 0.8, values: [0.0005] },
        { segment: "shank", share: 0.9, values: [-0.0021] },
      ],
    },

    // thigh adductorLongus: adductor longus with the sartorius, between the medial (270 degrees) and the anteromedial guide (315 degrees); held-out deviation 0.0016 to 0.0079.
    // shank medialBorder: medial border of the tibia, between the medial (270 degrees) and the anteromedial guide (315 degrees); held-out deviation 0.0015 to 0.0094.
    {
      thigh: "adductorLongus",
      shank: "medialBorder",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [0.0029] },
        { segment: "thigh", share: 0.35, values: [0.0017] },
        { segment: "thigh", share: 0.5, values: [0.0006] },
        { segment: "thigh", share: 0.65, values: [-0.002] },
        { segment: "thigh", share: 0.8, values: [0.0004] },
        { segment: "thigh", share: 0.9, values: [-0.0037] },
        { segment: "thigh", share: 1, values: [0.0012] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0025] },
        { segment: "shank", share: 0.15, values: [0.0026] },
        { segment: "shank", share: 0.25, values: [0.0036] },
        { segment: "shank", share: 0.35, values: [0.0048] },
        { segment: "shank", share: 0.5, values: [0.0029] },
        { segment: "shank", share: 0.65, values: [0.0042] },
        { segment: "shank", share: 0.8, values: [0.0001] },
        { segment: "shank", share: 0.9, values: [-0.0019] },
      ],
    },

    // thigh vastusMedialis: vastus medialis, between the anteromedial (315 degrees) and the anterior guide (0 degrees); held-out deviation 0.0024 to 0.0129.
    // shank tibialFace: subcutaneous medial tibial face, flat, between the anteromedial (315 degrees) and the anterior guide (0 degrees); held-out deviation 0.0016 to 0.0103.
    {
      thigh: "vastusMedialis",
      shank: "tibialFace",
      thighRows: [
        { segment: "thigh", share: 0.25, values: [-0.0012] },
        { segment: "thigh", share: 0.35, values: [-0.0027] },
        { segment: "thigh", share: 0.5, values: [0.0036] },
        { segment: "thigh", share: 0.65, values: [0.0059] },
        { segment: "thigh", share: 0.8, values: [0.0041] },
        { segment: "thigh", share: 0.9, values: [0.0031] },
        { segment: "thigh", share: 1, values: [0.0083] },
      ],
      shankRows: [
        { segment: "shank", share: 0.07, values: [0.0092] },
        { segment: "shank", share: 0.15, values: [-0.0042] },
        { segment: "shank", share: 0.25, values: [0.0012] },
        { segment: "shank", share: 0.35, values: [-0.0024] },
        { segment: "shank", share: 0.5, values: [-0.0048] },
        { segment: "shank", share: 0.65, values: [-0.0022] },
        { segment: "shank", share: 0.8, values: [0.0051] },
        { segment: "shank", share: 0.9, values: [0.0032] },
      ],
    },
  ];
}
