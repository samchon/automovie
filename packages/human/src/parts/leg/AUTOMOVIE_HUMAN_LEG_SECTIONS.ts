/**
 * Base shape of each leg station's cross-section, as linear functions of the station's relative fat thickness `t`, its subcutaneous fat over its mean radius.
 *
 * `aspect` is breadth over depth of the section's base ellipse and `posterior` how far its centre lies behind the bone axis in half depths, each `base + perFat · t`, so fat rounds and moves a section as it thickens. The superficial relief of `AUTOMOVIE_HUMAN_LEG_RELIEF` adds to this base.
 *
 * Values are fitted, not measured: our least-squares fit of the leg's limit cross-sections, normalised by their mean radius, at the same fractions of thigh and shank length, to those of the MakeHuman CC0 base mesh with its CC0 macro targets (MakeHuman 1.1 data, hm08 base mesh, released CC0 in September 2020) over 54 people: both sexes, child, young and old, and minimum, average and maximum muscle and weight, each matched to the converter's identity of the same sex, age, muscularity and adiposity. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_LEG_SECTIONS: Record<
  string,
  { aspect: [number, number]; posterior: [number, number] }
> = {
  "mid thigh": { aspect: [1.12, 0], posterior: [0.1, 0] },
  "lower thigh": { aspect: [1.12, 0], posterior: [0.08, 0] },
  "vastus medialis": { aspect: [1.1, 0], posterior: [0.05, 0] },
  suprapatella: { aspect: [1.06, 0], posterior: [0.03, 0] },
  midpatella: { aspect: [1.02, 0], posterior: [0.0, 0] },
  "patellar tendon": { aspect: [1.0, 0], posterior: [0.08, 0] },
  "upper calf": { aspect: [1.06, 0], posterior: [0.45, 0] },
  "calf maximum": { aspect: [1.06, 0], posterior: [0.55, 0] },
  "lower calf": { aspect: [1.02, 0], posterior: [0.5, 0] },
  "calcaneal tendon": { aspect: [1.0, 0], posterior: [0.4, 0] },
  "above the ankle": { aspect: [1.02, 0], posterior: [0.28, 0] },
  ankle: { aspect: [1.02, 0], posterior: [0.22, 0] },
};
