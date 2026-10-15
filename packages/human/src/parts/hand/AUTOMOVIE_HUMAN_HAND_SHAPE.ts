/**
 * Shape coefficients of the hand's sections that no survey measures: how the palm and digits are shaped once the measured breadths, lengths, depths and girths are set.
 *
 * Fitted coefficients were calibrated offline against the MakeHuman CC0 base mesh (hm08, released CC0 in September 2020 by Data Collection AB) blended to the same identity from its CC0 macro targets and carried onto Human's skeleton, by the campaign's shared harness: the hand and the reference were cut by nine planes normal to the wrist-to-dactylion line and the wrist ring, compared by 72 rays per section, and silhouetted from the viewer's eight preset views. Nelder-Mead minimised the mean radial error plus 30 times one minus the mean silhouette IoU over the adult woman and man of 30 (european, average build). This is the block-out: every relief coefficient is off (`thenar`, `hollow`, `hypothenar` and `border` zero, the knuckles level), so the fit decides gross form only; it brought the two hands from 6.35 mm and IoU 0.782 to 5.17 mm and 0.820.
 *
 * Coefficients that place the skin relative to the joint centres are not fitted to the reference, whose joint markers are not anatomical joint centres: carried onto Human's joints they put the reference's palm and fingers about 5 mm palmar of where bone allows. The knuckles' dorsal skin stays at least the metacarpal head's measured dorsal radius plus the dorsal joint capsule above the joint centre, and the fingers' dorsal shares stay conventional.
 */
export const AUTOMOVIE_HUMAN_HAND_SHAPE = {
  palm: {
    /** Share of the palm's thickness at the heads dorsal to the plane of the knuckles' joint centres. The metacarpal head's dorsal articular surface has a 6.9 mm radius of curvature about the joint (Dumont et al. 2009, J Hand Surg Am 34(2):317-325, 40 female joints) and the dorsal capsule and recess over it measure 3.1 to 6.3 mm by ultrasound (Falkowski et al. 2020, Eur J Radiol 124:108842, 100 adults), so the dorsal skin lies at least about 10 mm above the joint centre, 0.37 of a 27 mm female palm. Derived lower bound. */
    dorsal: 0.37,

    /** Growth of the section's superellipse exponent from 2 at the wrist to `2 + arch` at the metacarpal heads, boxier toward the knuckles; the thickness at the heads follows from it and the measured hand circumference. Fitted. */
    arch: 0.836,

    /** Exponent of the breadth's approach from the wrist to the heads, `1 − (1 − level)^widen`: below 1, the palm keeps close to the wrist's breadth and widens toward the heads. Fitted. */
    widen: 0.73,

    /** Knuckle height over the palm's dorsal height at the heads. Level in the block-out. */
    knuckle: 1,

    /** The middle knuckle's height over the others', the largest and highest (Bridgman 1920). Level in the block-out. */
    middleKnuckle: 1,

    /** Height of the knuckle's flanks over its crest. Level in the block-out. */
    knuckleFlank: 1,

    /** Palmar depth at each finger's basal crease over the palm's palmar depth at the heads. Conventional. */
    pad: 0.62,

    /** The thenar eminence's slope over the index line near the wrist, as a share of the section's palmar depth. Off in the block-out. */
    thenar: 0,

    /** Depth of the palm's hollow over the middle and ring lines at mid-palm, as a share of the palmar depth. Off in the block-out. */
    hollow: 0,

    /** The hypothenar eminence over the little finger's line at mid-palm, as a share of the palmar depth. Off in the block-out. */
    hypothenar: 0,

    /** The hypothenar's bulge at the ulnar border itself, as a share of the palmar depth. Off in the block-out. */
    border: 0,
  },
  thumb: {
    /** Breadth of the thumb's knuckle section, inside the thenar's distal slope, over its interphalangeal joint breadth. Fitted. */
    knuckle: 1.001,

    /** Palmar depth of the knuckle section, the thenar's distal end, over the interphalangeal joint depth. Fitted. */
    knucklePalmar: 0.797,

    /** Dorsal height of the knuckle section over the interphalangeal joint depth. Conventional. */
    knuckleDorsal: 0.55,

    /** Breadth of the proximal phalanx section where the web leaves it over the interphalangeal joint breadth. Fitted. */
    phalanx: 0.966,

    /** Height of the thenar eminence's summit above the thumb metacarpal toward the pad, over the interphalangeal joint breadth. Fitted. */
    thenar: 0.967,
  },
  finger: {
    /** Reach of a section's diagonal vertices toward the box corner: 0.71 for an ellipse, 1 for a box. Fitted earlier against the CC0 reference's finger sections sliced in each finger's own frame. */
    square: 0.703,

    /** Share of a shaft section's depth dorsal to the bone axis. Conventional. */
    shaft: 0.34,

    /** Share of a joint section's depth dorsal to the joint centre. Conventional. */
    joint: 0.34,

    /** Share of the distal pad section's depth dorsal to the bone axis, the pad bulging below the flat nail bed. Fitted. */
    pad: 0.327,

    /** Breadth of the distal pad section at 85% of the finger over the distal joint's breadth. Fitted earlier, as `square`. */
    padBreadth: 0.973,

    /** Depth of the distal pad section over the distal joint's depth. Fitted earlier, as `square`. */
    padDepth: 0.979,

    /** Breadth of the section near the tip at 94% of the finger over the distal joint's breadth. Conventional. */
    tipBreadth: 0.78,

    /** Depth of the section near the tip over the distal joint's depth. Conventional. */
    tipDepth: 0.74,
  },
};
