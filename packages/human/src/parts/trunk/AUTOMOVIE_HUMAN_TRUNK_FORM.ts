import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";

/**
 * The trunk's form coefficients for the human profile.
 *
 * Started from anatomical accounts (transverse sections in Gray 1918, "Anatomy of the Human Body", for the back's depth behind the column; Gray's descriptions of the gluteus maximus and the mammae; Richer's plates of the trunk, 1890, "Anatomie artistique") and fitted by Levenberg-Marquardt least squares against MakeHuman CC0 reference bodies: the hm08 base mesh with its CC0 macro targets (CC0 1.0, makehumancommunity/makehuman at a8bc2d54), blended for a woman and a man of 30 at average build and a man of 70 at heavier build, scaled to our stature and retargeted onto our skeleton by the shared calibration harness. Each reference was first measured like anthropometry at our own levels (convex-hull tape girths and breadths and depths of the chest, underbust, natural waist and buttock, hip breadth and thigh at the gluteal furrow), and our trunk was generated for identities carrying those measurements, so the fit compares shape alone: the residual is the radial distance between the two sections from our section's centroid, 72 rays at each of nine planes normal to the hips-to-neck axis between the thigh ring and the neck base. Bounds keep the coefficients anatomically ordered (the front at the inframammary fold and the axilla never ahead of the chest point, the costal breadth inside the chest's), because outside them the fit traded bands and bulges for score. Superficial muscle relief is off while the gross form is fitted. Grade: fitted to a CC0 reference.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FORM: IAutoMovieHumanTrunkForm = {
  behind: {
    lumbar: 0.3509,
    waist: 0.2262,
    thorax: 0.3015,
    axilla: 0.3083,
  },
  widest: {
    pelvis: 0.5995,
    waist: 0.4571,
    chest: 0.4207,
  },
  squareness: {
    front: {
      buttock: 1.7,
      waist: 1.7,
      costal: 4.5,
      chest: 2.7046,
    },
    back: {
      buttock: 2.45,
      waist: 2.08,
      costal: 2.3589,
      chest: 2.2055,
    },
  },
  front: {
    spine: 0.0375,
    spineFat: 0.3,
    buttock: 0.006,
    buttockToWaist: 0,
    iliac: 1.1,
    navel: 0.8309,
    pubis: 0.0699,
    costal: 0.2843,
    fold: 0,
    axilla: 0,
  },
  back: {
    fold: 0.0652,
    upperButtock: 0,
    upperBack: 0.1329,
  },
  half: {
    gluteal: 0.8,
    trochanter: 0.0044,
    crestBelow: 0.0157,
    crest: 0.5715,
    costal: 0.95,
    axilla: 1.08,
    axillaMuscle: 0.05,
  },
  gluteal: {
    projection: 0.2449,
    across: 0.4233,
    below: 0.004,
    width: 0.3039,
    above: 0.0364,
    under: 0.032,
    outward: 0.3,
  },
  breast: {
    projection: 0.1,
    angle: 43.8656,
    spread: 17.5672,
    fill: 0.613,
    above: 0.0499,
    below: 0.01,
    drop: 0.5,
    lateral: 0.25,
  },
  thigh: {
    breadth: 0.5,
    front: 0.0047,
    medial: 3.289,
    lateral: 1.6,
  },
  collar: 0.012,
};
