/**
 * The named form coefficients of the lofted head: dimensionless exponents and fractions of the person's own face height, so one set serves every identity.
 *
 * Depths named "behind subnasale" are horizontal distances, head in the Frankfort plane, from the true vertical through subnasale, the reference of soft-tissue profile analysis; heights are fractions of face height (`fh`, nasion to gnathion). Exponents are superellipse exponents of a section quadrant: 2 for an ellipse, larger for a squarer turn, smaller toward a diamond.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadForm {
  /** Profile: the cheek plane under the nose at the zygion's level behind subnasale, `fh`, the base the nose rises from. */
  midfaceBehindSubnasale: number;

  /** Profile: the base under the closed lips at stomion behind subnasale, `fh`; the lips rise from it. */
  stomionBehindSubnasale: number;

  /** Profile: soft-tissue B point, the deepest point of the labiomental fold, behind subnasale, `fh`. */
  labiomentalBehindSubnasale: number;

  /** Profile: soft-tissue pogonion behind subnasale, `fh`. */
  pogonionBehindSubnasale: number;

  /** Profile: soft-tissue pogonion above menton, `fh`. */
  pogonionAboveMenton: number;


  /** Profile: exponent of the forehead's arc from glabella to the vertex. */
  forehead: number;

  /** Profile: exponent of the vault's back from opisthocranion to the vertex. */
  vaultBack: number;

  /** Profile: exponent of the occiput's arc from opisthocranion down to the nape. */
  occiput: number;

  /** Breadth: height of the head's widest section above tragion, over the vertex's height above tragion. */
  eurionHeight: number;

  /** Breadth: exponent of the vault's frontal outline from eurion to the vertex. */
  vaultSide: number;

  /** Sections: exponent of the front quadrants at the vertex. */
  frontVault: number;

  /** Sections: exponent of the front quadrants at subnasale, the maxilla's turn from the nose base to the cheeks. */
  frontSubnasale: number;

  /** Sections: exponent of the front quadrants at stomion, the dental arch under the lips. */
  frontStomion: number;

  /** Sections: exponent of the front quadrants at pogonion, the chin's turn to the jaw. */
  frontChin: number;

  /** Sections: exponent of the back quadrants over the vault. */
  backVault: number;

  /** Sections: exponent of the back quadrants at the nape. */
  backNape: number;
}
