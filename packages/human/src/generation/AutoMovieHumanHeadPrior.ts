/**
 * Named constants of the head and ear construction, shared by every person and
 * both sides.
 *
 * Each `curves` channel holds one value per knot; a natural spline carries it
 * along the head's normalized station, which runs 0 at the neck ring, 1 at the
 * menton, 2 at the subnasale, 3 at eye level and 4 at the vertex. The curves and
 * ratios are fitted by `test/src/executable/human-score/fitHeadPrior.ts` and the
 * bumps by `fitHeadRelief.ts`; the nose, lips and auricle follow the facial
 * proportions of Farkas's anthropometry, in the measures they scale with.
 */
export namespace AutoMovieHumanHeadPrior {
  /** Ratios from public inputs to the construction's own lengths. */
  export interface IRatios {
    /** Menton above the neck ring, per neck length. */
    neck: number;

    /** Vertex above the menton, per head height. */
    height: number;

    /** Eye level above the menton, per face height. */
    face: number;

    /** Nasion above eye level, per face height. */
    nasion: number;

    /** Nasion above the nose tip, per nose height. */
    bridge: number;

    /** Nose tip above the subnasale, per nose height. */
    tip: number;

    /** Greatest vault length, per head length. */
    length: number;

    /** Greatest vault breadth, per head breadth. */
    breadth: number;

    /** Face half-width key, per half face width. */
    zygomatic: number;

    /** Jaw half-width key, per half mandibular width. */
    gonial: number;

    /** Forehead half-width key, per half minimum frontal width. */
    frontal: number;

    /** Tape round the vault, per head circumference. */
    circumference: number;

    /** Skull centre ahead of the neck ring's centre, per neck radius. */
    forward: number;
  }

  /** Curve values at the knots. */
  export interface ICurves {
    /** Skull axis ahead of the skull centre, in half head lengths. */
    axis: readonly number[];

    /** Front apex ahead of the axis, in half lengths over the cap. */
    front: readonly number[];

    /** Back apex behind the axis, in half lengths over the cap. */
    back: readonly number[];

    /** Back body half-width, in half breadths over the cap. */
    width: readonly number[];

    /** Face shield's widest place ahead of the axis, in half lengths over the cap. */
    waist: readonly number[];

    /** Face shield half-width, in half face widths over the cap. */
    face: readonly number[];

    /** Back body's squareness: its exponent is `4 + 2 tanh` of this. */
    squareBack: readonly number[];

    /** The shield's squareness, likewise. */
    squareFace: readonly number[];
  }

  /** The auricle. */
  export interface IEar {
    /** Length along the ear per the ear length input. */
    lengthRatio: number;

    /** Chord per the breadth input. */
    breadthRatio: number;

    /** Ear's centre below eye level, in ear lengths. */
    drop: number;

    /** Ear's line behind the skull centre at its own centre, millimetres. */
    forward: number;

    /** Lean of the ear's line back from the vertical, radians. */
    lean: number;

    /** Egg's wider top: chord growth per unit height along the ear. */
    egg: number;

    /** Stand off the head, in protrusions, as a quadratic along the ear. */
    stand: readonly number[];

    /** Free end of the lobe, in ear lengths. */
    lobeFree: number;

    /** Free end of the helix, in ear lengths. */
    topFree: number;

    /** Below the top, where the section splits round the pocket, in ear lengths. */
    splitFree: number;

    /** Below the top, where the pocket closes, in ear lengths. */
    roofFree: number;

    /** Posterior root behind the anterior root, in chords. */
    root: number;

    /** Helix tube's half thickness, millimetres for a 31 mm ear. */
    rim: number;

    /** Where rings start along the ear, from its bottom. */
    lobeFrom: number;

    /** Over how much of the ear the rings fade in. */
    lobeBlend: number;

    /** Chord fraction where the rim starts, behind the helix root. */
    frontRim: number;

    /** Rings: height, distance in from the rim, width, millimetres for a 31 mm ear. */
    helix: readonly number[];

    /** See {@link helix}. */
    scapha: readonly number[];

    /** See {@link helix}. */
    antihelix: readonly number[];

    /** Bumps: height, place along the chord, place along the ear, widths. */
    concha: readonly number[];

    /** See {@link concha}. */
    tragus: readonly number[];

    /** See {@link concha}. */
    antitragus: readonly number[];
  }

  /** One named plane or hollow of the face. */
  export interface IBump {
    /** Anatomical name. */
    name: string;

    /** Station it is placed from. */
    anchor: string;

    /** Height above the anchor, millimetres per 108 mm of face height. */
    rise: number;

    /** Place off the midline, in half face widths. */
    lateral: number;

    /** Half-height, likewise millimetres. */
    tall: number;

    /** Half-width, likewise millimetres. */
    wide: number;

    /** Height, millimetres; negative is a hollow. */
    height: number;

    /** Height per unit of the masculine-feminine control. */
    sex: number;
  }

  /** The face's reliefs. */
  export interface IFace {
    /** Tip's lead past the subnasale: a line in the protrusion input. */
    projection: readonly number[];

    /** Nose profile along the dorsum: fractions from the tip (0) to the nasion (1). */
    profileKnots: readonly number[];

    /** Share of the tip's height at each fraction. */
    profile: readonly number[];

    /** Half-width of the dorsum per half nose width, by the same fractions. */
    dorsum: readonly number[];

    /** Tip's ball: half-heights below and above in nose heights, half-width in half nose widths. */
    tipBall: readonly number[];

    /** Alar lobes: height, height above the subnasale per nose height, reach, widths. */
    ala: readonly number[];

    /** Nasal sill under the tip: share of the lead, height, half-height, half-width. */
    sill: readonly number[];

    /** Stomion below the subnasale, per subnasale to menton. */
    stomion: number;

    /** Half mouth width per half the width input. */
    mouth: number;

    /** Border heights per the vermilion inputs. */
    vermilion: number;

    /** Lips' forward lead: upper, lower, millimetres. */
    lips: readonly number[];

    /** Oral fissure's depth and half-height. */
    fissure: readonly number[];

    /** Lips' rest gap per mouth opening. */
    gape: number;

    /** Jaw joint's fullness per laterotrusion. */
    joint: number;

    /** Philtrum's depth and half-width. */
    philtrum: readonly number[];

    /** Named planes and hollows. */
    bumps: readonly IBump[];

    /** Lid margin's centre behind the nasion's skin. */
    eyeRecess: number;

    /** Globe centre above the margin's. */
    globeRise: number;

    /** Globe radius, millimetres. */
    radius: number;

    /** Fissure length on the margin per the length input. */
    fissureLength: number;

    /**
     * Lid margin's harmonics 1 to 3 per coordinate, `[a1, b1, a2, b2, a3, b3]`:
     * x in millimetres, y per half the fissure height, z per half its length.
     */
    margin: readonly (readonly number[])[];

    /** Margin's centre ahead of the globe's. */
    marginForward: number;

    /** Nostril's half-sizes, across and along, per half nose width. */
    nostrilSize: readonly number[];

    /** Nostril centre: below the tip in nose heights, lateral in half nose widths. */
    nostrilCentre: readonly number[];
  }

  /** The whole prior. */
  export interface IPrior {
    /** Stations of the curves' keys. */
    knots: readonly number[];

    /**
     * Hump of the section planes' tilt about the lateral axis, nose side down:
     * height in radians, its station, its widths below and above.
     */
    tilt: readonly number[];

    /** Input ratios. */
    ratios: IRatios;

    /** Section curves. */
    curves: ICurves;

    /** Face reliefs. */
    face: IFace;

    /** Auricle. */
    ear: IEar;
  }

  /** The population's prior. */
  export const PRIOR: IPrior = {
    knots: [0, 0.35, 0.7, 1, 1.15, 1.3, 1.45, 1.6, 1.8, 2, 2.35, 2.7, 3, 3.25, 3.5, 3.75, 4],
    tilt: [-0.245, 1.3, 0.62, 0.52],
    ratios: {
      neck: 0.5806,
      height: 1.0573,
      face: 1.1399,
      nasion: 0.0463,
      bridge: 0.9056,
      tip: 0.4598,
      length: 1.0961,
      breadth: 1.0499,
      zygomatic: 1.1705,
      gonial: 1.0144,
      frontal: 1.6423,
      circumference: 0.9747,
      forward: 0.8043,
    },
    curves: {
      axis: [0.1488, 0.0809, 0.0121, -0.0547, -0.1006, -0.1047, -0.0365, 0.0408, 0.082, 0.0836, 0.041, -0.0224, -0.0704, -0.0883, -0.1135, -0.1215, -0.0643],
      front: [-4.1391, -4.1844, -4.0968, -3.463, -2.3938, -0.5702, 0.0029, -0.1552, -0.3689, -0.3507, -0.2256, -0.1085, 0.0315, 0.2958, 0.4702, 0.6066, 0.9232],
      back: [0.0894, 0.0403, -0.0145, -0.0566, -0.0706, -0.0747, -0.0031, 0.1014, 0.124, 0.0893, 0.0605, 0.0948, 0.1368, 0.1504, 0.1228, 0.1157, 0.0755],
      width: [0.1302, 0.0948, 0.0573, 0.0281, 0.0369, 0.0573, 0.0737, 0.0916, 0.0861, 0.062, 0.0774, 0.1324, 0.1905, 0.2685, 0.3514, 0.4356, 0.5249],
      waist: [-0.6473, -0.617, -0.5866, -0.5557, -0.5244, -0.4926, -0.4599, -0.4301, -0.4007, -0.3703, -0.3422, -0.3166, -0.2946, -0.2793, -0.274, -0.2731, -0.2686],
      face: [-2.3875, -2.2599, -2.1054, -1.8816, -1.5831, -1.1955, -0.7379, -0.3573, -0.2235, -0.1801, -0.1246, -0.0616, 0.0032, 0.1026, 0.2439, 0.425, 0.6419],
      squareBack: [-2.0908, -2.3439, -2.5893, -2.8029, -2.9446, -2.9874, -2.9062, -2.7207, -2.4572, -2.1462, -1.8353, -1.6577, -1.7262, -1.8577, -1.9319, -1.9546, -1.9602],
      squareFace: [-1.4748, -1.5681, -1.6577, -1.7353, -1.7875, -1.7939, -1.734, -1.5756, -1.2081, -0.6686, -0.1866, -0.0073, -0.1909, -0.5242, -0.9098, -1.1608, -1.2314],
    },
    face: {
      projection: [12.5, 1.1],
      profileKnots: [-0.3, 0, 0.2, 0.55, 1, 1.25],
      profile: [0, 0.82, 0.86, 0.6, 0.2, 0],
      dorsum: [0.7, 0.66, 0.6, 0.52, 0.48, 0.5],
      tipBall: [0.3, 0.46, 0.72],
      ala: [11, 0.24, 0.74, 0.21, 0.42],
      sill: [0.3, 0.16, 0.22, 1],
      stomion: 0.27,
      mouth: 1,
      vermilion: 1,
      lips: [2.6, 2.8],
      fissure: [1.8, 0.9],
      gape: 0.012,
      joint: 0.09,
      philtrum: [0.9, 3.2],
      bumps: [
        { name: "socket", anchor: "eye", rise: 1.0857, lateral: 0.3348, tall: 11.5469, wide: 12.1505, height: -3.9182, sex: 0.0177 },
        { name: "brow", anchor: "eye", rise: 12.308, lateral: 0.4848, tall: 6.6517, wide: 22.198, height: 2.0685, sex: -0.9479 },
        { name: "glabella", anchor: "nasion", rise: 9.8294, lateral: -0.0027, tall: 7.1657, wide: 11.9363, height: 0.814, sex: -0.5566 },
        { name: "root", anchor: "nasion", rise: -1.9389, lateral: 0, tall: 7.9698, wide: 12.067, height: -0.6, sex: -0.2 },
        { name: "infraorbital", anchor: "eye", rise: -19.3805, lateral: 0.4475, tall: 9.2867, wide: 14.0913, height: 1.4757, sex: 0.3617 },
        { name: "malar", anchor: "eye", rise: -22.8177, lateral: 0.9161, tall: 15.5685, wide: 16.9835, height: 0.0689, sex: -2.3169 },
        { name: "nasolabial", anchor: "subnasale", rise: -13.8311, lateral: 0.2922, tall: 13.2918, wide: 12.4769, height: -4.7683, sex: 1.551 },
        { name: "buccal", anchor: "stomion", rise: -0.4533, lateral: 0.6763, tall: 18.9175, wide: 13.8898, height: -2.9103, sex: 0.2186 },
        { name: "jaw", anchor: "menton", rise: 27.4045, lateral: 0.8262, tall: 14.6409, wide: 14.1332, height: -3.2993, sex: -1.386 },
        { name: "chinSide", anchor: "menton", rise: 10.4724, lateral: 0.5183, tall: 9.5716, wide: 12.2754, height: -3.0045, sex: -0.5996 },
        { name: "mental", anchor: "menton", rise: 22.6451, lateral: 0.0007, tall: 11.1951, wide: 16.9119, height: 3.6095, sex: 0.8344 },
        { name: "sublabial", anchor: "stomion", rise: -17.5599, lateral: 0, tall: 5.5418, wide: 14.5368, height: -1.3, sex: 0 },
        { name: "temple", anchor: "eye", rise: 27.8865, lateral: 0.9302, tall: 22.5017, wide: 13.8798, height: -0.639, sex: -1.0628 },
        { name: "forehead", anchor: "eye", rise: 45.6137, lateral: 0.4138, tall: 19.6071, wide: 30.629, height: -1.5542, sex: -2.0315 },
        { name: "submental", anchor: "menton", rise: -12.0339, lateral: -0.0035, tall: 9.7448, wide: 20.0075, height: -0.0842, sex: -0.2212 },
      ],
      eyeRecess: 13.5,
      globeRise: 2.2,
      radius: 11.392,
      fissureLength: 0.85,
      margin: [
        [-1.6, 1.27, -3.3, -0.14, -0.7, -0.1],
        [0.28, 1, 0.08, 0.01, 0.08, 0.033],
        [1, 0.03, -0.034, -0.02, 0.062, 0.018],
      ],
      marginForward: 6.26,
      nostrilSize: [0.26, 0.15],
      nostrilCentre: [0.34, 0.52],
    },
    ear: {
      lengthRatio: 1.02,
      breadthRatio: 1,
      drop: 0.36,
      forward: -16,
      lean: 0.2,
      egg: 0.12,
      stand: [0.5, 0.155, -0.195],
      lobeFree: 0.04,
      topFree: 0.22,
      splitFree: 0.09,
      roofFree: 0.06,
      root: 0.55,
      rim: 1.7,
      lobeFrom: 0.62,
      lobeBlend: 0.3,
      frontRim: 0.2,
      helix: [2.2, 2.5, 2.2],
      scapha: [-1.8, 6.5, 2.4],
      antihelix: [2.2, 11.5, 2.6],
      concha: [-8.5, 0.34, -0.12, 0.2, 0.34],
      tragus: [2.4, 0.1, -0.2, 0.07, 0.12],
      antitragus: [1.8, 0.42, -0.55, 0.1, 0.1],
    },
  };
}
