/**
 * Shape coefficients of the hand's sections that no survey measures: how the palm's relief and the digits' sections are shaped once the measured breadths, lengths and depths are set.
 *
 * Fitted coefficients were calibrated offline against the MakeHuman CC0 base mesh (hm08, released CC0 in September 2020 by Data Collection AB) with its caucasian male and female young, child and old macro targets: both hands were refined, sliced at matching stations in each hand's own frame (wrist joint to middle knuckle, little to index knuckle) and normalised by each hand's knuckle span, and the coefficients minimised the squared difference of the sampled quantities by Nelder-Mead over all six reference hands against Human's men and women of 25, 11 and 85 years. The palm was sampled at 35, 50, 65, 80 and 92% of the way from the wrist to the middle knuckle, at seven positions across from beyond the little finger's line to the index line: thickness, dorsal and palmar relief against the middle of the section, and the ulnar border of the silhouette; the root mean square difference fell from 0.082 to 0.060 knuckle spans. The fingers were sliced at 30, 40, 62, 75 and 85% of each finger from its knuckle: depth over breadth, the reach along the diagonals over an ellipse's, and breadth over that at the middle joint; the sum of squares fell from 0.0127 to 0.0121. The six reference hands differ in these normalised quantities by about 0.01 at most, so the fit gives constants rather than functions of the measurements. Coefficients that place the surface relative to the joint centres, such as how much of the palm lies dorsal to the knuckles, are not fitted, because the reference's joint markers are not anatomical joint centres; they stay conventional and say so.
 */
export const AUTOMOVIE_HUMAN_HAND_SHAPE = {
  palm: {
    /** Palm thickness at the metacarpal heads over hand breadth. Fitted. */
    thickness: 0.35,

    /** Share of the palm's thickness dorsal to the plane of the knuckles' joint centres: a metacarpal head with thin extensor cover above, the volar plate, flexor tendons and palmar pad below. Conventional. */
    dorsal: 0.4,

    /** Growth of the section's superellipse exponent from 2 at the wrist to `2 + arch` at the metacarpal heads, boxier toward the knuckles. Fitted. */
    arch: 0.693,

    /** Exponent of the breadth's approach from the wrist to the heads, `1 − (1 − level)^widen`: below 1, the palm keeps close to the wrist's breadth and widens toward the heads. Fitted. */
    widen: 0.608,

    /** Knuckle height over the palm's dorsal height at the heads. Conventional. */
    knuckle: 1.1,

    /** The middle knuckle's height over the others', the largest and highest (Bridgman 1920). Conventional. */
    middleKnuckle: 1.055,

    /** Height of the knuckle's flanks over its crest. Conventional. */
    knuckleFlank: 0.84,

    /** Palmar depth at each finger's basal crease over the palm's palmar depth at the heads. Conventional. */
    pad: 0.62,

    /** The thenar eminence's slope over the index line near the wrist, as a share of the section's palmar depth. Fitted. */
    thenar: 0.336,

    /** Depth of the palm's hollow over the middle and ring lines at mid-palm, as a share of the palmar depth. Fitted. */
    hollow: 0.316,

    /** The hypothenar eminence over the little finger's line at mid-palm, as a share of the palmar depth. Fitted. */
    hypothenar: 0.18,

    /** The hypothenar's bulge at the ulnar border itself, as a share of the palmar depth. Fitted. */
    border: 0.005,
  },
  thumb: {
    /** Breadth of the thumb's knuckle section, inside the thenar's distal slope, over its interphalangeal joint breadth. Fitted. */
    knuckle: 1.3,

    /** Palmar depth of the knuckle section, the thenar's distal end, over the interphalangeal joint depth. Fitted. */
    knucklePalmar: 0.85,

    /** Dorsal height of the knuckle section over the interphalangeal joint depth. Fitted. */
    knuckleDorsal: 0.55,

    /** Breadth of the proximal phalanx section where the web leaves it over the interphalangeal joint breadth. Fitted. */
    phalanx: 1.06,

    /** Height of the thenar eminence's summit above the thumb metacarpal toward the pad, over the interphalangeal joint breadth. Fitted. */
    thenar: 0.7,
  },
  finger: {
    /** Reach of a section's diagonal vertices toward the box corner: 0.71 for an ellipse, 1 for a box. Fitted. */
    square: 0.703,

    /** Share of a shaft section's depth dorsal to the bone axis. Conventional. */
    shaft: 0.45,

    /** Share of a joint section's depth dorsal to the joint centre. Conventional. */
    joint: 0.455,

    /** Share of the distal pad section's depth dorsal to the bone axis, the pad bulging below the flat nail bed. Conventional. */
    pad: 0.41,

    /** Breadth of the distal pad section at 85% of the finger over the distal joint's breadth. Fitted. */
    padBreadth: 0.973,

    /** Depth of the distal pad section over the distal joint's depth. Fitted. */
    padDepth: 0.979,

    /** Breadth of the section near the tip at 94% of the finger over the distal joint's breadth. Conventional. */
    tipBreadth: 0.78,

    /** Depth of the section near the tip over the distal joint's depth. Conventional. */
    tipDepth: 0.74,
  },
};
