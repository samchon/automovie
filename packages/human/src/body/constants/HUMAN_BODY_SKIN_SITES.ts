import type { IAutoMovieHumanBodySkinSites } from "../structures/IAutoMovieHumanBodySkinSites";

/**
 * Skin albedo by anatomical site, predicted from the cheek.
 *
 * The International Skin Spectra Archive (Lu et al. 2025) measured the same
 * subjects' reflectance spectra at the cheek and at body sites. Integrated
 * under D65 and the CIE 1931 2° observer to linear sRGB (the reduction the
 * face's cheek norms use) and averaged per ancestry group and sex, each
 * site is fitted per channel against the cheek in logarithms,
 * `albedo = exp(a) · cheek^b`: pigment absorbs multiplicatively, so a site
 * follows the cheek as a power. The fit runs across the 12 to 16 group
 * means rather than across individuals, because one cheek reading measures
 * a person's pigmentation with noise and the individual-level fit regresses
 * toward the archive's mean (it overpredicted the darkest group's inner arm
 * by a third in green and blue). Every group is lighter and less red on the
 * protected inner arm than on the sun-exposed outer arm; the palm's exponent
 * is the smallest, so the darker the cheek, the lighter the palm relatively.
 *
 * The archive has no trunk or leg site. The trunk, the thighs and the rest of
 * the covered skin take the protected inner arm, constitutive pigmentation;
 * the forearms take the exposed outer arm, the shanks and the backs of the
 * feet half of each, the soles the palm. Those unmeasured site assignments
 * are authored proxies, not spectral observations of the trunk or legs.
 * The skin over the elbow and the
 * knee, wrinkled over the bone with the joint straight, is darker and redder
 * than the limb around it and lightens as flexion stretches it (the
 * prominences below). The prominence ratios come from 53 Korean women in
 * Lee et al. 2024 (doi:10.3390/jcm13092500); applying them to other sexes and
 * pigmentation is an authored extrapolation, not population validation.
 * The fits, their group means and
 * coefficients of determination are in the body study's skin-sites receipt.
 */
export const HUMAN_BODY_SKIN_SITES: IAutoMovieHumanBodySkinSites = {
  material: "skin",
  sites: {
    // inner arm, 16 group means, R² 0.98 / 0.97 / 0.97
    protected: [
      [-0.1967, 0.7988],
      [0.0631, 0.954],
      [0.0936, 1.0072],
    ],
    // outer arm, 16 group means, R² 0.98 / 0.95 / 0.95
    exposed: [
      [-0.132, 1.007],
      [0.0765, 1.0976],
      [-0.1482, 1.012],
    ],
    // side of the neck, 12 group means, R² 0.95 / 0.95 / 0.94
    neck: [
      [0.0233, 1.0777],
      [0.2457, 1.1598],
      [0.0285, 1.0711],
    ],
    // back of the hand, 16 group means, R² 0.98 / 0.96 / 0.96
    dorsal: [
      [-0.1051, 1.0125],
      [0.0699, 1.0921],
      [-0.1322, 1.0063],
    ],
    // palm, 12 group means, R² 0.74 / 0.86 / 0.92
    palmar: [
      [-0.5201, 0.37],
      [-0.599, 0.4821],
      [-0.6205, 0.5601],
    ],
  },
  // a shank is half exposed, and so is the back of a foot
  shankExposure: 0.5,
  // the palm faces the way its fingers flex: full past 0.4 of the
  // way along that direction, none short of -0.1
  palmarFacing: [-0.1, 0.4],
  // the sole faces down
  soleFacing: [0.3, 0.7],
  // the sites meet over a band: each sweep takes a vertex half way to its
  // neighbours' mean
  // Lee et al. 2024 (doi:10.3390/jcm13092500), 53 Korean women, CM-2500d
  // spectrophotometer: L*a*b* read off the figure, D65 to linear sRGB. The
  // extended elbow and knee against the upper arm and thigh they are
  // compared with (57/12.4/22.1 and 64/9.9/22.1 against 68/5.6/16.7 and
  // 68/5.3/18.9), the folded ones (63/10.2/21.8, 67/7.6/19.8) likewise.
  // Applying one cohort's ratios to every sex and cheek pigment is an
  // authored extrapolation, not a measured cross-population relation.
  prominences: [
    {
      bone: "LowerArm",
      sigmaMetres: 0.025,
      reachMetres: 0.06,
      extended: [0.809, 0.604, 0.506],
      folded: [0.955, 0.791, 0.688],
      foldedAtDegrees: 90,
    },
    {
      bone: "LowerLeg",
      sigmaMetres: 0.035,
      reachMetres: 0.08,
      extended: [0.976, 0.824, 0.761],
      folded: [1.018, 0.945, 0.934],
      foldedAtDegrees: 90,
    },
  ],
  sweeps: 12,
  // the face's skin is the cheek colour, and the body keeps it at the
  // neck's cut, blending to the neck's own over this band
  collarMetres: 0.04,
};
