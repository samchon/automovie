/**
 * Base shape of each leg station's cross-section, as linear functions of the station's relative fat thickness `t`, its subcutaneous fat over its mean radius.
 *
 * `aspect` is breadth over depth of the section's base ellipse, `posterior` how far its centre lies behind the bone axis in half depths and `lateral` how far it lies lateral to the axis in mean radii, beyond the femoral shaft's lean, each `base + perFat · t`, so fat rounds and moves a section as it thickens. The superficial relief of `AUTOMOVIE_HUMAN_LEG_RELIEF` adds to this base.
 *
 * Values are fitted, not measured. The fat terms are our least-squares fit, with no relief, of the leg's limit cross-sections about the bone axis to those of the MakeHuman CC0 hm08 base mesh blended from its CC0 macro targets at the same identity (MakeHuman repository commit a8bc2d54, released CC0 in September 2020), aligned on our skeleton by the campaign's calibration harness and cut in our own station planes, with each reference section scaled to our girth there so that the measured girths stay the identity's, over eight people: a woman and a man of 30 of average build, women of 30 of low and high adiposity, men of 30 of high adiposity and of high muscularity, a man of 80 and a girl of 11. The base terms were then refitted on the lofted leg with its relief, over the four lean 20-year-old gate identities of the harness (a slim model woman and man, a lean muscular woman and man): the residual of each harness section against the reference scaled to our girth was read as its first and second harmonics, the offset forward and medially and the excess depth, and each station's base aspect, posterior and lateral terms moved against them, every step followed by fairing: each inner station's terms moved half way toward the line through its neighbours' at its place along the leg, a second-difference penalty that keeps the section family from stepping between stations, which the loft shows as bands. The girth-normalised mean radial difference is 4.6 to 5.0 mm, against 5.5 to 6.9 mm before the refit and 4.0 to 5.1 mm unfaired. The four junction stations keep their shared ring shape and carry no fitted value. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_LEG_SECTIONS: Record<
  string,
  {
    aspect: [number, number];
    posterior: [number, number];
    lateral: [number, number];
  }
> = {
  "lower thigh": {
    aspect: [0.841, 0.075],
    posterior: [-0.153, -0.8],
    lateral: [-0.303, -0.3],
  },
  "vastus medialis": {
    aspect: [0.847, 0.175],
    posterior: [-0.035, -0.175],
    lateral: [-0.175, -0.33],
  },
  suprapatella: {
    aspect: [0.849, 0.45],
    posterior: [0.104, -0.35],
    lateral: [-0.06, 0.105],
  },
  midpatella: {
    aspect: [0.846, 0.625],
    posterior: [0.202, 0.275],
    lateral: [-0.002, -0.165],
  },
  "patellar tendon": {
    aspect: [0.834, 0.55],
    posterior: [0.371, 0.325],
    lateral: [0.08, 0.48],
  },
  "upper calf": {
    aspect: [0.82, 0.15],
    posterior: [0.483, -0.2],
    lateral: [0.139, 0.48],
  },
  "calf maximum": {
    aspect: [0.8, 0.05],
    posterior: [0.537, -0.05],
    lateral: [0.196, 0.48],
  },
  "lower calf": {
    aspect: [0.759, -0.15],
    posterior: [0.544, 0],
    lateral: [0.289, 0.36],
  },
  "calcaneal tendon": {
    aspect: [0.73, -0.025],
    posterior: [0.542, 0],
    lateral: [0.354, 0.6],
  },
};
