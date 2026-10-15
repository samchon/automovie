/**
 * Proportions of the hand's skin that its skeleton does not carry, each a ratio to an identity measurement, so a child's broader hand gets its own thicker fingers rather than a scaled adult's.
 *
 * Most values come from the 1987-1988 US Army hand survey, digitised from photographs of the flat right hand of 1,304 women and 1,003 men (Greiner 1991, "Hand Anthropometry of U.S. Army Personnel", NATICK/TR-92/011, summary tables). Its means are pooled over the sexes as ratios to its own measured hand breadth, 79.5 mm in women and 90.4 mm in men, or hand length, 180.7 and 194.1 mm. No child or elderly hand survey of these quantities was read, so the adult ratios are held at every age.
 */
export const AUTOMOVIE_HUMAN_HAND_FORM = {
  /**
   * Breadth of each finger across its proximal and distal interphalangeal joint creases over hand breadth (Greiner 1991: index 19.9 and 17.3 mm in women, 23.0 and 20.1 in men; middle 19.3, 17.1, 22.5, 19.8; ring 18.4, 15.8, 21.4, 18.5; little 16.5, 14.7, 19.2, 17.4). Grade: measured, ratios derived.
   *
   * `nail` is the nail plate's width between the lateral nail grooves over the distal joint breadth, from calipers on 18 men and 20 women aged 21 (Shirato et al. 2017, J Phys Ther Sci 29(11):1914-1919, Table 1: index 10.6 and 9.1 mm, middle 11.4 and 10.0, men and women) against Greiner's distal joint breadths. Ring and little nails were not measured; they hold the mean of the index and middle, conventional.
   */
  fingers: {
    Index: { pip: 0.252, dip: 0.22, nail: 0.527 },
    Middle: { pip: 0.246, dip: 0.217, nail: 0.58 },
    Ring: { pip: 0.234, dip: 0.202, nail: 0.554 },
    Little: { pip: 0.21, dip: 0.189, nail: 0.554 },
  },

  /**
   * The thumb's breadth at its interphalangeal joint over hand breadth (Greiner 1991: 20.6 and 24.0 mm), and its nail width over that breadth (Shirato et al. 2017: 13.6 and 12.1 mm, men and women). Grade: measured, ratios derived.
   */
  thumb: { ip: 0.262, nail: 0.577 },

  /**
   * Joint depth over joint breadth. Greiner's joint circumferences, regressed on the joint breadths in a measured subsample, enclose the breadths as ellipses (Ramanujan's perimeter) whose other axis is this share: 0.89 to 1.02 at the proximal finger joints, 0.79 to 0.89 at the distal ones and 0.92 and 0.95 at the thumb's interphalangeal joint, pooled over the four fingers and both sexes. Grade: derived.
   */
  depth: { pip: 0.953, dip: 0.849, thumb: 0.932 },

  /**
   * Distance of the loop beside the wrist ring from it, over hand length. Conventional: close enough that the ring keeps its girth in the joined surface, far enough to leave the carpus to the palm's loops.
   */
  besideWrist: 0.03,

  /**
   * Hand circumference over metacarpales II and V over hand breadth, pooled over the ANSUR II means of 2.388 in women and 2.406 in men (Gordon et al. 2014, NATICK/TR-15/007). The palm's section at the heads is given the thickness at which its own perimeter equals this circumference. Grade: measured, ratio derived.
   */
  circumference: 2.397,

  /**
   * Fat over the back of a young adult's hand, millimetres: the dorsal superficial, intermediate and deep laminae over the metacarpals by ultrasound, 0.70, 2.16 and 1.48 mm in the 20s, from their losses to over 60 and the shares those losses are (Hung et al. 2022, Aesthet Surg J 42(10):1119-1126). The hand's dorsal form is drawn for this thickness; an identity with less fat loses the difference from the back of the palm, while the knuckle crests, bone under thin skin, stay. Grade: measured, sum derived.
   */
  dorsalFat: 4.34,

  /**
   * Share of the lost dorsal fat that comes from the superficial lamina, the one that also covers the extensor tendons: 0.21 of the 1.90 mm the three laminae lose from the 20s to over 60 (Hung et al. 2022). Between the tendons all of the loss shows, over them only this share, so old hands show their tendons. Grade: derived.
   */
  dorsalFatSuperficialShare: 0.11,

  /**
   * Depth of the web between thumb and index below the wrist crease, over hand length (Greiner 1991, crotch 1 height: 62.8 and 69.1 mm). Grade: measured, ratio derived.
   */
  thumbWeb: 0.352,

  /**
   * Webs between the fingers relative to the palmar creases at the bases of the two fingers they join, in hand lengths beyond the creases' mean level (Greiner 1991, crotch heights 2 to 4 against digit tip-to-wrist-crease length less digit length: index to middle -0.1 and +0.1 mm, middle to ring +1.4 and +1.7, ring to little -4.1 and -3.9). Grade: measured, offsets derived.
   */
  webs: [0, 0.008, -0.021],

  /**
   * Visible nail length from the proximal nail fold to the fingertip over the length of the distal segment from the distal joint centre to the tip (Shirato et al. 2017: thumb 13.7 and 13.5 mm, index 12.3 and 11.8, middle 13.4 and 12.6; against Greiner's distal phalanx link lengths 34.5 and 30.8 for the thumb and 28.4 and 25.5 for the index and middle). Ring and little hold the index and middle mean, conventional. Grade: derived.
   */
  nailLength: { Thumb: 0.418, Index: 0.448, Middle: 0.483, Ring: 0.466, Little: 0.466 },
} as const;
