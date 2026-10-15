/**
 * The named form coefficients of the head's distance field: dimensionless exponents and fractions of the person's own head and face measurements, so one set serves every identity.
 *
 * Lengths are fractions of face height (`fh`), face width (`fw`) or head height (`hh`) as each field says; exponents are superellipse exponents, 2 for an ellipse, larger for a squarer section.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadForm {
  /** Vault: superellipsoid exponent of the top half behind the forehead. */
  vaultTop: number;

  /** Vault: exponent of the top half over the forehead, higher for a more upright forehead. */
  vaultForehead: number;

  /** Vault: exponent of the lower half, the walls down to the cranial base. */
  vaultBottom: number;

  /** Vault: how far its lower half reaches below tragion at the back, `hh`. */
  mastoid: number;

  /** Vault: how far its lower half reaches below tragion at the temples, `hh`. */
  temple: number;

  /** Vault: how far its front reaches below glabella, under the brows, `hh`. */
  orbitRoof: number;

  /** Vault: fraction of the front semi-axis where the front starts receding into the orbits. */
  recedeStart: number;

  /** Vault: fraction of the front semi-axis where it has receded. */
  recedeEnd: number;

  /** Face: section exponent along the mandible. */
  jawExponent: number;

  /** Face: section exponent between gonion and zygion, over the masseter. */
  ramusExponent: number;

  /** Face: section exponent at zygion, across the cheeks. */
  cheekExponent: number;

  /** Face: section exponent at the eyes, across the orbital rims. */
  orbitExponent: number;

  /** Face: section exponent at glabella, across the brows. */
  browExponent: number;

  /** Face: half-width of the section at the eyes, the lateral orbital rims, `fw`. */
  orbitWidth: number;

  /** Face: depth of the lateral orbital rims behind the cornea, `fh`. */
  orbitSetback: number;

  /** Face: depth of the brows' widest point behind frontotemporale, `fh`. */
  browSetback: number;

  /** Face: setback of the mask's midline at menton, behind it, `fh`. */
  maskChin: number;

  /** Face: setback of the mask's midline at the labiomental fold, behind pogonion, `fh`. */
  maskFold: number;

  /** Face: setback of the mask's midline at stomion, behind subnasale, `fh`. */
  maskMouth: number;

  /** Face: setback of the mask's midline at the nose base, behind nasion, `fh`. */
  maskNose: number;

  /** Face: setback of the mask's midline under the eyes, behind nasion, `fh`. */
  maskEye: number;

  /** Muzzle: pogonion in front of gnathion, `fh`. */
  pogonion: number;

  /** Muzzle: the chin's least depth behind subnasale, `fh`. */
  chin: number;

  /** Muzzle: half-width at menton, `fw`. */
  muzzleMenton: number;

  /** Muzzle: half-width at pogonion, `fw`. */
  muzzleChin: number;

  /** Muzzle: half-width at the labiomental fold, `fw`. */
  muzzleFold: number;

  /** Muzzle: half-width at stomion, `fw`. */
  muzzleMouth: number;

  /** Muzzle: half-width at the nose base, `fw`. */
  muzzleBase: number;

  /** Muzzle: depth from its front to its widest at stomion, `fh`. */
  muzzleDepth: number;

  /** Stem: half-width of the upper neck over the neck circumference's mean radius. */
  stemWidth: number;

  /** Stem: back depth over the mean radius. */
  stemDepth: number;

  /** Stem: front depth over the back depth. */
  stemFront: number;

  /** Relief: zygomatic prominence height, `fh`. */
  malar: number;

  /** Relief: superciliary arch height, `fh`. */
  brow: number;

  /** Relief: temporal fossa depth, `fh`, a hollow. */
  templeHollow: number;

  /** Relief: mandibular angle height, `fh`. */
  gonial: number;

  /** Relief: mental protuberance height, `fh`. */
  mental: number;

  /** Blend width of the vault and face union, `fh`. */
  blend: number;
}
