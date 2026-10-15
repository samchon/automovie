import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * The lofted head's form coefficients.
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
  frontSubnasale: 2.0,
  frontStomion: 1.8,
  frontChin: 2.0,
  backVault: 2.2,
  backNape: 2.3,
};
