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

  /** Midface: its front behind nasion, `fh`. */
  midfaceFront: number;

  /** Midface: its top above the eyes' centres, `fh`. */
  midfaceTop: number;

  /** Midface: its bottom below subnasale, `fh`. */
  midfaceBottom: number;

  /** Midface: exponent of its horizontal section, the cheeks' turn from the front to the sides. */
  cheekExponent: number;

  /** Midface: exponent of its vertical section. */
  midfaceExponent: number;

  /** Jaw: its centre above the mandible's lower border, the line from gonion to menton, `fh`. */
  jawLift: number;

  /** Jaw: its upper semi-axis across the mandibular plane, `fh`. */
  jawTop: number;

  /** Jaw: exponent of its horizontal section. */
  jawExponent: number;

  /** Jaw: exponent of its vertical section, higher for a flatter lower border. */
  jawBorder: number;

  /** Jaw: half-width at pogonion, `fw`. */
  chinWidth: number;

  /** Jaw: how the jaw narrows from the gonia to the chin, the exponent of its taper along its depth. */
  jawTaper: number;

  /** Jaw: pogonion in front of gnathion, `fh`. */
  pogonion: number;

  /** Jaw: the chin's least depth behind subnasale, `fh`. */
  chin: number;

  /** Muzzle: half-width at stomion, `fw`. */
  muzzleMouth: number;

  /** Muzzle: depth from its front to its centre, `fh`. */
  muzzleDepth: number;

  /** Muzzle: its top above subnasale, `fh`. */
  muzzleTop: number;

  /** Muzzle: exponent of its vertical section. */
  muzzleExponent: number;

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

  /** Relief: buccal fat over the cheek below the zygoma in an adult face, `fh`. */
  buccal: number;

  /** Relief: added buccal fat per unit the face's height falls short of the adult's share of head height, `fh`; the full cheeks of a small face under a large vault. */
  buccalGrowth: number;

  /** Blend width of the unions of the head's masses, `fh`. */
  blend: number;
}
