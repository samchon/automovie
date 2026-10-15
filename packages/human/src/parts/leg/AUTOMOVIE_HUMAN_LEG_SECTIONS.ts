/**
 * Base shape of each leg station's cross-section, as linear functions of the station's relative fat thickness `t`, its subcutaneous fat over its mean radius.
 *
 * `aspect` is breadth over depth of the section's base ellipse, `posterior` how far its centre lies behind the bone axis in half depths and `lateral` how far it lies lateral to the axis in mean radii, beyond the femoral shaft's lean, each `base + perFat · t`, so fat rounds and moves a section as it thickens. The superficial relief of `AUTOMOVIE_HUMAN_LEG_RELIEF` adds to this base.
 *
 * Values are fitted, not measured: our least-squares fit, with no relief, of the leg's limit cross-sections about the bone axis to those of the MakeHuman CC0 hm08 base mesh blended from its CC0 macro targets at the same identity (MakeHuman repository commit a8bc2d54, released CC0 in September 2020), aligned on our skeleton by the campaign's calibration harness and cut in our own station planes, with each reference section scaled to our girth there so that the measured girths stay the identity's; over eight people: a woman and a man of 30 of average build, women of 30 of low and high adiposity, men of 30 of high adiposity and of high muscularity, a man of 80 and a girl of 11. The two ring stations keep their shared ring shape and carry no fitted value. Mean absolute radial difference after the fit 4.1 mm. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_LEG_SECTIONS: Record<
  string,
  {
    aspect: [number, number];
    posterior: [number, number];
    lateral: [number, number];
  }
> = {
  "mid thigh": {
    aspect: [1.12, 0],
    posterior: [0.1, 0],
    lateral: [0, 0],
  },
  "lower thigh": {
    aspect: [0.807, 0.075],
    posterior: [-0.208, -0.8],
    lateral: [-0.27, -0.3],
  },
  "vastus medialis": {
    aspect: [0.925, 0.175],
    posterior: [-0.088, -0.175],
    lateral: [-0.165, -0.33],
  },
  suprapatella: {
    aspect: [0.822, 0.45],
    posterior: [0.105, -0.35],
    lateral: [-0.112, 0.105],
  },
  midpatella: {
    aspect: [0.77, 0.625],
    posterior: [0.075, 0.275],
    lateral: [0.03, -0.165],
  },
  "patellar tendon": {
    aspect: [0.831, 0.55],
    posterior: [0.405, 0.325],
    lateral: [0.075, 0.48],
  },
  "upper calf": {
    aspect: [0.879, 0.15],
    posterior: [0.531, -0.2],
    lateral: [0.128, 0.48],
  },
  "calf maximum": {
    aspect: [0.929, 0.05],
    posterior: [0.525, -0.05],
    lateral: [0.12, 0.48],
  },
  "lower calf": {
    aspect: [0.951, -0.15],
    posterior: [0.525, 0],
    lateral: [0.15, 0.36],
  },
  "calcaneal tendon": {
    aspect: [0.875, -0.025],
    posterior: [0.45, 0],
    lateral: [0.18, 0.6],
  },
  "above the ankle": {
    aspect: [0.795, -0.25],
    posterior: [0.424, -0.175],
    lateral: [0.18, 0.54],
  },
  ankle: {
    aspect: [1.02, 0],
    posterior: [0.22, 0],
    lateral: [0, 0],
  },
};
