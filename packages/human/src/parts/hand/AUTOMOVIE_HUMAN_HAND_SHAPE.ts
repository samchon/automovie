/**
 * Shape coefficients of the hand's sections that no survey measures: how the palm and digits are shaped once the measured breadths, lengths, depths and girths are set.
 *
 * Fitted coefficients were calibrated offline against the MakeHuman CC0 base mesh (hm08, released CC0 in September 2020 by Data Collection AB) blended to the same identity from its CC0 macro targets and carried onto Human's skeleton, by the campaign's shared harness: the hand and the reference were cut by nine planes normal to the wrist-to-dactylion line and the wrist ring, compared by 72 rays per section, and silhouetted from the viewer's eight preset views. Nelder-Mead minimised the mean radial error plus 30 times one minus the mean silhouette IoU over the adult woman and man of 30 (european, average build). The block-out fitted gross form with every relief coefficient off, bringing the two hands from 6.35 mm and IoU 0.782 to 5.17 mm and 0.820; the relief was then fitted on top, bounded so the knuckles do not sink and the palm does not bulge, to 4.89 mm and 0.830 with the conventional hollow and knuckle rise below.
 *
 * The lofted hand refitted the palm's form, thumb and finger-pad coefficients and its layout on the four lean 20-year-old gate identities (a slim model woman and man, a lean muscular woman and man) by the same harness and objective, bounded within 30% of the drawing's values, with our hand moved 4 mm palmar for the comparison only: that is the reference's systematic offset at the palm and the fingers (below), so the fit sees form rather than offset; the four hands went from 3.7 to 4.2 mm and IoU 0.83 to 0.84 on that comparison. Coefficients that place the skin relative to the joint centres are not fitted to the reference, whose joint markers are not anatomical joint centres: carried onto Human's joints they put the reference's palm and fingers about 5 mm palmar of where bone allows. The knuckles' dorsal skin stays at least the metacarpal head's measured dorsal radius plus the dorsal joint capsule above the joint centre, and the fingers' dorsal shares stay conventional.
 */
export const AUTOMOVIE_HUMAN_HAND_SHAPE = {
  palm: {
    /** Share of the palm's thickness at the heads dorsal to the plane of the knuckles' joint centres. The metacarpal head's dorsal articular surface has a 6.9 mm radius of curvature about the joint (Dumont et al. 2009, J Hand Surg Am 34(2):317-325, 40 female joints) and the dorsal capsule and recess over it measure 3.1 to 6.3 mm by ultrasound (Falkowski et al. 2020, Eur J Radiol 124:108842, 100 adults), so the dorsal skin lies at least about 10 mm above the joint centre, 0.37 of a 27 mm female palm. Derived lower bound. */
    dorsal: 0.37,

    /** Growth of the section's superellipse exponent from 2 at the wrist to `2 + arch` at the metacarpal heads, boxier toward the knuckles; the thickness at the heads follows from it and the measured hand circumference. Fitted. */
    arch: 0.8008,

    /** Exponent of the breadth's approach from the wrist to the heads, `1 − (1 − level)^widen`: below 1, the palm keeps close to the wrist's breadth and widens toward the heads. Fitted. */
    widen: 0.85,

    /** Rise of each extensor tendon over the back of the palm, as a share of the dorsal height. Conventional: the tendons of a lean young hand show as faint ridges in photographs. */
    tendon: 0.04,

    /** Knuckle height over the palm's dorsal height at the heads, the metacarpal heads standing above the valleys between them. Conventional: the reference fit, bounded below by level knuckles, ends at the bound, because the reference's palmar-sunk skin would put the crest inside the head; a 5% rise reads as the knuckles of the anatomy plates and photographs at a cost of 0.1 mm. */
    knuckle: 1.05,

    /** The middle knuckle's height over the others', the largest and highest (Bridgman 1920). Fitted. */
    middleKnuckle: 1.06,

    /** Palmar depth at each finger's basal crease over the palm's palmar depth at the heads. Conventional. */
    pad: 0.62,

    /** Depth of the thenar crease below the plain section at mid-palm, where the palm meets the eminence, as a share of the palmar depth. Conventional. */
    crease: 0.04,

    /** The thenar eminence's slope over the index line near the wrist, as a share of the section's palmar depth. Fitted. */
    thenar: 0.7805,

    /** Depth of the palm's hollow over the middle and ring lines at mid-palm, as a share of the palmar depth. Conventional: the reference has none and the fit, bounded at no hollow, ends there, but the hollow between the thenar and hypothenar eminences is the palm's form in anatomy (Gray 1918, Bridgman 1920) and in photographs, at a cost of 0.1 mm. */
    hollow: 0.1558,

    /** The hypothenar eminence over the little finger's line at mid-palm, as a share of the palmar depth. Fitted. */
    hypothenar: 0.4474,

    /** The hypothenar's bulge at the ulnar border itself, as a share of the palmar depth. Fitted. */
    border: 0.3825,
  },
  thumb: {
    /** Breadth of the thenar section over the metacarpal's middle over the interphalangeal joint breadth. Conventional. */
    mass: 1.224,

    /** Breadth of the thumb's knuckle section, inside the thenar's distal slope, over its interphalangeal joint breadth. Fitted. */
    knuckle: 1.001,

    /** Palmar depth of the knuckle section, the thenar's distal end, over the interphalangeal joint depth. Fitted. */
    knucklePalmar: 0.797,

    /** Dorsal height of the knuckle section over the interphalangeal joint depth. Conventional. */
    knuckleDorsal: 0.55,

    /** Breadth of the proximal phalanx section where the web leaves it over the interphalangeal joint breadth. Fitted. */
    phalanx: 0.9773,

    /** Height of the thenar eminence's summit above the thumb metacarpal toward the pad, on the thenar section, over the interphalangeal joint breadth. Fitted. */
    thenar: 0.6966,
  },
  finger: {
    /** Reach of a section's diagonal vertices toward the box corner: 0.71 for an ellipse, 1 for a box. Fitted earlier against the CC0 reference's finger sections sliced in each finger's own frame. */
    square: 0.7376,

    /** Share of a shaft section's depth dorsal to the bone axis. Conventional. */
    shaft: 0.34,

    /** Share of a joint section's depth dorsal to the joint centre. Conventional. */
    joint: 0.34,

    /** Share of the distal pad section's depth dorsal to the bone axis, the pad bulging below the flat nail bed. Fitted. */
    pad: 0.327,

    /** Breadth of the distal pad section at 85% of the finger over the distal joint's breadth. Fitted earlier, as `square`. */
    padBreadth: 0.9443,

    /** Depth of the distal pad section over the distal joint's depth. Fitted earlier, as `square`. */
    padDepth: 0.9617,

    /** Rise of a finger joint's dorsal crest, the knuckle over the head of the phalanx, as a share of the joint's dorsal height. Conventional. */
    crest: 0.12,

    /** Inset of a finger joint's palmar flexion crease, as a share of the joint's palmar depth. Conventional. */
    crease: 0.1,

    /** Bulge of the distal pad's pulp under the tip, as a share of the pad's palmar depth. Conventional. */
    pulp: 0.12,
  },
  /**
   * Where the hand's network places its stations and digits, in hand lengths unless stated. Conventional: chosen so the palm's slices fall at the carpus, mid-palm, the heads and the fingers' roots, and checked against renders and the reference.
   */
  layout: {
    /** The carpus station, where the twenty columns begin. */
    carpus: 0.1,
    /** The mid-palm station, where the thumb's opening ends. */
    midPalm: 0.3,
    /** The heads' plane, proximal of the knuckle line. */
    heads: 0.05,
    /** The fingers' roots plane, distal of the knuckle line. */
    roots: 0.025,
    /** Each finger's sweep starts this far beyond the farther of its webs. */
    root: 0.02,
    /** Share of the border's half-breadth where the radial and ulnar corners lie on the roots' slice. */
    corner: 0.85,
    /** Where the thumb's sweep starts along its metacarpal. */
    thumbStart: 0.4467,
    /** Tension of the fingers' and thumb's bridges. */
    tension: 0.8219,
    thumbTension: 0.5227,
    /** Breadth of each web between two fingers, where each finger's own web curve runs, in hand lengths. Conventional: about 3 mm, so the web is one narrow face wide and its four corners are valence-five vertices instead of two of valence six. */
    web: 0.015,
    /** Palmar offset of each web's crotch from the knuckles' joint plane, in hand lengths, so the web's margin lies at the fingers' palmar skin: the normal web slopes about 45 degrees from the metacarpal heads on the dorsum to the middle of the proximal phalanx on the palm ("the normal web space slopes 45 degrees in a dorsal to palmar direction from the metacarpal heads to the midproximal phalanx", Green's Operative Hand Surgery, 7th ed., 2017, "Deformities of the Hand and Fingers"). Conventional: about 6 mm, the palmar half-depth of a finger's root; the crotch's distal level stays the crease's. */
    webPalmar: 0.03,
  },
};
