import { IAutoMovieHumanLipForm } from "../../junction/IAutoMovieHumanLipForm";

/**
 * The named form coefficients of the lofted head: dimensionless exponents and fractions of the person's own face height, so one set serves every identity.
 *
 * Besides the cranium's and the face's sections, the form places the face's network: where its lattice's openings and rows fall on the person's features ({@link IAutoMovieHumanHeadForm.ILayout}) and where the loops of the lids and the lips run inside them ({@link IAutoMovieHumanHeadForm.IEyelids}, {@link IAutoMovieHumanHeadForm.ILips}). Every placement is a share of a feature's own measurement or a few millimetres at a margin, so fitting the network to a reference changes coefficients, never the network's structure.
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

  /** Sections: exponent of the front quadrants at zygion's level, the cheeks' turn from the face to its side. */
  frontCheek: number;

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

  /** Where the face's lattice, its openings and its rows fall on the person's features. */
  layout: IAutoMovieHumanHeadForm.ILayout;

  /** Where the loops of the lids run inside each eye's opening. */
  eyelids: IAutoMovieHumanHeadForm.IEyelids;

  /** Where the loops of the lips run inside the mouth's opening. */
  lips: IAutoMovieHumanHeadForm.ILips;

  /** The features' gross forms over the block-out: the nose, the lips, the orbits and brows, and the masses on the side of the face. */
  relief: IAutoMovieHumanHeadForm.IRelief;
}
export namespace IAutoMovieHumanHeadForm {
  /**
   * Placement of the face's lattice. Its column lines are spaced smoothly between the midline, the eye openings' medial edges, the mouth opening's edges, the eye openings' lateral edges and the face's edges, each edge set on the face's surface at its feature's own level; its rows are spaced evenly between heights set on the features.
   */
  export interface ILayout {
    /** Half the face's angle about the spine inside which its dense columns lie, degrees. */
    faceHalf: number;

    /** Trichion, the hairline at the midline and the top of the face's rows, above nasion, over face height. */
    trichion: number;

    /** The eye opening: its top above and its bottom below the eye's centre, its medial edge inside endocanthion and its lateral edge beyond exocanthion, over palpebral fissure length. */
    eyeOpening: {
      above: number;
      below: number;
      medial: number;
      lateral: number;
    };

    /** The mouth opening: its top below subnasale and its bottom below stomion over face height, and its edges beyond cheilion over half the mouth's width. */
    mouthOpening: { top: number; bottom: number; lateral: number };

    /** Share of the way from a two-to-one reduction's dense side to its sparse one at which its interior vertices lie. */
    reduction: number;
  }

  /**
   * Placement of the lids' loops, from the opening's rim inward: the intermediate orbital loop, an orbital envelope on the face, the anterior and posterior margins on their reference spheres. The margin currently uses the fissure-length input as its transverse span; that is not an independent validation of the source's three-dimensional chord. Eye clearance remains a separate geometric check.
   */
  export interface IEyelids {
    /** Share of the way from the opening's rim to the orbital envelope at which the intermediate loop runs. */
    orbit: number;

    /** Slope of the canthal line in the head's transverse-height plane, degrees. */
    canthalTilt: number;

    /** Upper arc's share of the input fissure height before its vertical margin allowance. */
    upper: number;

    /** Half the vertical separation of the upper and lower margin nodes at each canthus, head-frame millimetres; it creates a short edge rather than a single clinical landmark. */
    canthus: number;

    /** Anterior margin's radial allowance over the reference lid sphere, millimetres; this historical property name does not establish the distance to the posterior margin. */
    marginThickness: number;

    /** Posterior margin's radial allowance over the reference lid sphere, millimetres; ellipsoidal-eye clearance requires independent verification. */
    contact: number;

    /** How far the posterior margin closes over the anterior's opening, a share. */
    posteriorOpen: number;

    /** Orbital envelope expansions beyond the aperture on its medial, lateral, superior and inferior sides, over the generated transverse aperture span. These are reference-fitted geometric reaches, not clinical orbital-rim measurements. */
    envelope: { medial: number; lateral: number; above: number; below: number };
  }

  /**
   * Placement of the lips' loops, from the opening's rim inward: the loop of orbicularis oris, the vermilion border through the cupid's bow, the closed lips' meeting line and the pocket behind them.
   */
  export type ILips = IAutoMovieHumanLipForm;

  /**
   * The features' relief over the block-out. Heights and spreads are shares of face height (`fh`), fissure length, nose width or mouth width as each says; the bony and muscular terms reach the skin through the soft tissue over their sites, which softens them further.
   */
  export interface IRelief {
    /** The nose: pronasale above subnasale over nose height; the exponent of the zero-end-slope dorsum basis t^p(1+p(1-t)) from nasion to the tip; half-breadth at the bridge and at the alae over nose width; and the alar lobes' height over the tip's, centre off the midline and spread over nose width, and reach along the nose's height. */
    nose: {
      tipAboveSubnasale: number;
      dorsumCurve: number;
      bridge: number;
      ala: number;
      alaHeight: number;
      alaOffset: number;
      alaSpread: number;
      alaDepth: number;
    };

    /** The lips' conventional anterior crest reach over face height, consumed by the shared spatial oral arch. */
    lips: IAutoMovieHumanLipForm.IRelief;

    /** The orbital opening: half-breadth, half-height above and below the eye's centre over fissure length; the share inside which the lids lie fully on their dome and beyond which the face is untouched; the breadth of its hollow that the soft tissue softens and the deepest the lids sink, over fissure length; and the lids' thickness over the globe, millimetres. */
    orbit: {
      across: number;
      up: number;
      down: number;
      inner: number;
      outer: number;
      breadth: number;
      sink: number;
      lid: number;
    };

    /** The superciliary arch: height over `fh`, and its level above the eye's centre over fissure length. */
    brow: { height: number; level: number };

    /** The zygoma's body: height over `fh`, its centre outward and below the eye's centre over fissure length. */
    malar: { height: number; out: number; below: number };

    /** The zygomatic arch: height and half-width over `fh`, and its root's rise above tragion over `fh`. */
    arch: { height: number; width: number; root: number };

    /** The temporal hollow: depth, centre above zygion and behind it, and spread, over `fh`. */
    temple: { depth: number; above: number; behind: number; spread: number };

    /** The masseter: height, its centre in front of gonion, and its vertical and horizontal spread, over `fh`. */
    masseter: { height: number; forward: number; up: number; across: number };

    /** Buccal fat over `fh`: an adult lean face's slight hollow, its gain with body fat and in a small face, its centre above stomion and spread. */
    buccal: {
      adult: number;
      fat: number;
      growth: number;
      above: number;
      spread: number;
    };

    /** Share of the brow's, the zygoma's and the jaw's prominence left at the least lean mass. */
    robust: number;
  }
}
