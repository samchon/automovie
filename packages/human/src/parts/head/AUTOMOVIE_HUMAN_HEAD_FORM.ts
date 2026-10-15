import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * The lofted head's form coefficients.
 *
 * The network's placement is conventional unless a property says otherwise: chosen on renders of the gate identities, pending a fit to reference faces.
 *
 * The profile's depths below subnasale are conventional shares of face height behind it, pending a measured soft-tissue profile; the exponents are calibrated against the sections of the MakeHuman CC0 reference heads at the four gate identities.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_HEAD_FORM: IAutoMovieHumanHeadForm = {
  midfaceBehindSubnasale: 0.115,
  stomionBehindSubnasale: 0.012,
  labiomentalBehindSubnasale: 0.05,
  pogonionBehindSubnasale: 0.025,
  pogonionAboveMenton: 0.1,
  forehead: 2.35,
  vaultBack: 1.86,
  occiput: 1.65,
  eurionHeight: 0.34,
  vaultSide: 2.25,
  frontVault: 2.2,
  frontCheek: 2.4,
  frontSubnasale: 2.0,
  frontStomion: 1.8,
  frontChin: 1.7,
  backVault: 2.2,
  backNape: 2.3,
  layout: {
    /** Past the zygomatic arches. */
    faceHalf: 60,
    /** Trichion-nasion 72.2 mm in Kenyan men and 67.5 in women (Virdi et al. 2019), about 0.57 of face height. Grade: derived. */
    trichion: 0.57,
    /** The opening reaches the brow above and the cheek's top below, and holds the canthi with a margin inside and the orbit's lateral rim beyond. */
    eyeOpening: { above: 0.55, below: 0.6, medial: 0.1, lateral: 0.5 },
    /** The opening runs from under the columella to the labiomental fold and out to the nasolabial folds. */
    mouthOpening: { top: 0.02, bottom: 0.15, lateral: 0.3 },
    /** Nearer the dense side keeps a reduction's four quads closer in size. */
    reduction: 0.3,
  },
  eyelids: {
    orbit: 0.5,
    /** About 3 degrees, between the 0.8 to 2.4 of Caucasian and the 4.9 to 6.0 of Chinese young adults (Gao et al. 2025, periocular 3D photographs), pending a measured tilt in the identity. */
    canthalTilt: 3,
    /** The upper lid rests 1 to 2 mm over the iris and the lower at its lower edge. */
    upper: 0.45,
    canthus: 0.3,
    /** About 2 mm, pending a measured value. */
    marginThickness: 2,
    /** So the eyeball never shows through the lid. */
    contact: 0.3,
    posteriorOpen: 0.94,
    /** The loops round each canthus stay open rather than meeting in a crease. */
    sulcus: { upper: 1.9, lower: 2.0, widen: 4, gap: 2.5 },
  },
  lips: {
    orbicularis: 0.5,
    /** Crista philtri 13.3 and 11.8 mm apart over mouths of 50.9 and 48.1 mm (3D Facial Norms; Weinberg et al. 2016). Grade: derived. */
    philtrum: 0.26,
    commissure: 0.5,
    meeting: { back: 1.5, open: 0.25, narrow: 0.97 },
    pocket: { back: 8, open: 2.5, narrow: 0.85 },
  },
};
