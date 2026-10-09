import type { IAutoMovieHumanBodyLayerThicknessAnchor } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessAnchor";

/**
 * Preserve the existing fourteen thickness anchors and their qualification.
 * Stoerchle et al. (2018, Scientific Reports 8:16268, Table 5) measured
 * fibrous-inclusive segment SAT means in ten men aged 20–31, BMI 20–28.4,
 * with B-mode ultrasound while lying. Derraik et al. (2014, PLoS ONE
 * 9:e86637) measured skin through the epidermis to the SAT boundary in
 * adults with diabetes; equal-weight sex means below are authored choices.
 * Neither study measures every vertex, another population or an individual.
 * The 1.9 mm atlas shell default is authored, not a clinical population mean.
 * Values and protocols are retained from the historical thickness owner;
 * changing language supplies no new anatomical qualification.
 * Sources: https://doi.org/10.1038/s41598-018-34213-0 and
 * https://doi.org/10.1371/journal.pone.0086637.
 */
export function readHumanBodyLayerThicknessAnchors(): IAutoMovieHumanBodyLayerThicknessAnchor[] {
  const subcutaneous: Record<string, number> = {
    neck: 1.50,
    anteriorTrunk: 4.69,
    posteriorTrunk: 3.76,
    upperArm: 3.00,
    forearm: 1.15,
    hand: 0.33,
    buttocks: 12.04,
    thigh: 5.72,
    leg: 2.80,
    foot: 0.39,
    head: 1.27,
  };
  return [
    ...Object.entries(subcutaneous).map(([site, value]): IAutoMovieHumanBodyLayerThicknessAnchor => ({
      layer: "subcutaneous", site, metres: value / 1000, kind: "measured",
      source: "Stoerchle, Mueller, Sengeis, Lackner, Holasek, Fuerhapter-Rieger, 2018, Scientific Reports 8: Measurement of mean subcutaneous fat thickness: eight standardised ultrasound sites compared to 216 randomly selected sites",
      protocol: "B-mode ultrasound thickness of subcutaneous adipose tissue with embedded fibrous structures included; mean over randomly placed sites of one body segment (Lund and Browder segments), participants lying",
      population: "10 men, 20 to 31 years, BMI 20.0 to 28.4; no women, no older adults",
    })),
    ...(["abdomen", "thigh"] as const).map((site): IAutoMovieHumanBodyLayerThicknessAnchor => ({
      layer: "skin", site,
      metres: (site === "abdomen" ? (2.10 + 1.99) / 2 : (1.89 + 1.65) / 2) / 1000,
      kind: "measured",
      source: "Derraik, Rademaker, Cutfield, Pinto, Tregurtha, Faherty, Peart, Drury et al., 2014, PLoS ONE 9(1) e86637: Effects of Age, Gender, BMI, and Anatomical Site on Skin Thickness in Children and Adults with Diabetes",
      protocol: "Ultrasound dermal thickness with a linear array transducer; model-adjusted means of men (n=61) and women (n=79) averaged with equal weight",
      population: "140 adults with type 1 or type 2 diabetes, 20 to 85 years; not a healthy reference sample",
    })),
    {
      layer: "skin", site: "every segment other than trunk and thigh",
      metres: 1.9 / 1000, kind: "authored",
      source: "Authored: mean distance between the outer and inner sheets of the BodyParts3D skin FJ2810 (shell volume over outer area)",
      protocol: "Geometric mean thickness of one modelled skin shell, not a tissue measurement",
      population: "one male atlas individual; an authored default, not a population value",
    },
  ];
}
