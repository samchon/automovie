import type { IAutoMovieHumanPair } from "./IAutoMovieHumanPair";
import type { IAutoMovieHumanEar } from "./IAutoMovieHumanEar";
import type { IAutoMovieHumanFace } from "./IAutoMovieHumanFace";

/**
 * The cranial vault and the frame of the face.
 *
 * Vault shape is a parameter of its own, the cephalic index, because it is not
 * implied by sex or face size: means derived from published lengths and
 * breadths differ by population (about 77 in US adults of European ancestry,
 * Weinberg et al. 2016; about 85 in Chinese workers, Du et al. 2008, Ann Occup
 * Hyg 52(8):773-782) and Chinese children measured on CT range from 73.5 to
 * 105.7 (Liang et al. 2024, BMC Pediatr 24:685). Head breadth follows from
 * length and index, so the document cannot state a breadth that contradicts
 * them.
 */
export interface IAutoMovieHumanHeadIdentity {
  /**
   * Head length: glabella to opisthocranion, the longest midline length of the
   * vault, millimetres. Schema constraints: Minimum: 80; Maximum: 260; retained
   * by Human's schema refinement.
   */
  length: number;

  /**
   * Cephalic index: maximum head breadth (eurion to eurion) over head length,
   * times 100, dimensionless. Schema constraints: Minimum: 60; Maximum: 110;
   * retained by Human's schema refinement.
   */
  cephalicIndex: number;

  /**
   * Head circumference: maximum circumference just above the brow ridges and
   * around the back of the vault, millimetres. Schema constraints: Minimum:
   * 300; Maximum: 700; retained by Human's schema refinement.
   */
  circumference: number;

  /**
   * Head height: menton-to-vertex separation measured perpendicular to the
   * Frankfort plane, millimetres, following [Snyder et al. 1977, measurement
   * 25](https://math.nist.gov/~SRessler/anthrokids/data1977/descrip.htm).
   * Stature over head height is about 5.3 at age 2 and 8.0 in late adolescence
   * (UM-HSRI-77-17). Schema constraints: Minimum: 80; Maximum: 320; retained by
   * Human's schema refinement.
   */
  height: number;

  /**
   * Morphological face height: Euclidean three-dimensional distance from nasion
   * to gnathion, millimetres, following the [FaceBase inter-landmark
   * protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
   * Schema constraints: Minimum: 40; Maximum: 180; retained by Human's schema
   * refinement.
   */
  faceHeight: number;

  /**
   * Face width: zygion to zygion, between the most lateral points of the
   * zygomatic arches, millimetres. Schema constraints: Minimum: 50; Maximum:
   * 200; retained by Human's schema refinement.
   */
  faceWidth: number;

  /**
   * Mandibular width: gonion to gonion, between the angles of the mandible,
   * millimetres. Schema constraints: Minimum: 40; Maximum: 180; retained by
   * Human's schema refinement.
   */
  mandibularWidth: number;

  /**
   * Minimum frontal width: frontotemporale to frontotemporale, the narrowest
   * forehead between the temporal crests, millimetres. Schema constraints:
   * Minimum: 50; Maximum: 160; retained by Human's schema refinement.
   */
  minimumFrontalWidth: number;

  /**
   * Active maximum mouth opening between the upper and lower incisal edges,
   * millimetres, as measured with a ruler in children by Verkouteren et al.
   * (2022, Eur J Oral Sci 130(3):e12869): 42.8 to 55.3 mm from 6 to 18 years.
   * Schema constraints: Minimum: 5; Maximum: 90; retained by Human's schema
   * refinement.
   */
  mouthOpening: number;

  /**
   * Lateral excursion of the lower incisors to one side, millimetres, from the
   * dental midline; 9.1 to 10.4 mm in the same study. Schema constraints:
   * Minimum: 0; Maximum: 25; retained by Human's schema refinement.
   */
  mandibularLaterotrusion: number;

  /**
   * Bitragion menton arc: the surface arc from tragion to tragion passing under
   * the chin through the menton, a taut tape, millimetres (ANSUR 1988, Gordon
   * et al. 1989). Absent: ANSUR 1988's women's or men's line on the face width.
   * Schema constraints: Minimum: 150; Maximum: 500; retained by Human's schema
   * refinement.
   */
  bitragionMentonArc?: number;

  /**
   * Bitragion subnasale arc: the surface arc from tragion to tragion passing
   * under the nose through the subnasale, a taut tape, millimetres (ANSUR
   * 1988). Absent: ANSUR 1988's line on the face width. Schema constraints:
   * Minimum: 150; Maximum: 500; retained by Human's schema refinement.
   */
  bitragionSubnasaleArc?: number;

  /**
   * Submental inclination: the line from the menton tangent to the submental
   * contour, degrees below the Frankfort plane, backward from the menton
   * (Ellenbogen and Karlin's submental tangent). Absent: 20 degrees (declared).
   * Schema constraints: Minimum: -30; Maximum: 60; retained by Human's schema
   * refinement.
   */
  submentalInclination?: number;

  /**
   * Subnasale ahead of the soft-tissue glabella, parallel to the Frankfort
   * plane in the midsagittal plane, millimetres (negative: behind). Absent: the
   * subnasale's forward place closes FaceBase's tragion-subnasale depth. Schema
   * constraints: Minimum: -40; Maximum: 40; retained by Human's schema
   * refinement.
   */
  subnasaleAheadOfGlabella?: number;

  /**
   * Soft-tissue glabella ahead of the soft-tissue nasion, parallel to the
   * Frankfort plane, millimetres. Absent: 1.9 (declared). Schema constraints:
   * Minimum: -15; Maximum: 30; retained by Human's schema refinement.
   */
  glabellaAheadOfNasion?: number;

  /**
   * Soft-tissue glabella above the soft-tissue nasion, normal to the Frankfort
   * plane, millimetres. Absent: 0.14 of the face height (declared). Schema
   * constraints: Minimum: -10; Maximum: 60; retained by Human's schema
   * refinement.
   */
  glabellaAboveNasion?: number;

  /**
   * Soft pogonion ahead of the soft-tissue glabella, parallel to the Frankfort
   * plane, millimetres (negative: behind). With `pogonionAboveMenton`, places
   * the chin's most prominent point. Absent: Legan and Burstone's facial
   * convexity from the subnasale at a declared height. Schema constraints:
   * Minimum: -60; Maximum: 40; retained by Human's schema refinement.
   */
  pogonionAheadOfGlabella?: number;

  /**
   * Soft pogonion above the menton, normal to the Frankfort plane, millimetres.
   * Absent: as `pogonionAheadOfGlabella`. Schema constraints: Minimum: 0;
   * Maximum: 60; retained by Human's schema refinement.
   */
  pogonionAboveMenton?: number;

  /**
   * Tragion to nasion, the three-dimensional distance (FaceBase upper facial
   * depth t-n), the mean of both sides, millimetres. Absent: FaceBase's women's
   * or men's ratio of means on the head length. Schema constraints: Minimum:
   * 70; Maximum: 180; retained by Human's schema refinement.
   */
  tragionNasionDepth?: number;

  /**
   * Tragion to subnasale, the three-dimensional distance (FaceBase middle
   * facial depth t-sn), the mean of both sides, millimetres. Absent: as
   * `tragionNasionDepth`. Schema constraints: Minimum: 70; Maximum: 180;
   * retained by Human's schema refinement.
   */
  tragionSubnasaleDepth?: number;

  /**
   * Tragion to gnathion, the three-dimensional distance (FaceBase lower facial
   * depth t-gn), the mean of both sides, millimetres. Absent: as
   * `tragionNasionDepth`. Schema constraints: Minimum: 80; Maximum: 200;
   * retained by Human's schema refinement.
   */
  tragionGnathionDepth?: number;

  /**
   * Upper lip protrusion: labrale superius ahead of the subnasale-soft pogonion
   * line, millimetres (Legan and Burstone). Absent: their norm, 3. Schema
   * constraints: Minimum: -10; Maximum: 20; retained by Human's schema
   * refinement.
   */
  upperLipProtrusion?: number;

  /**
   * Lower lip protrusion: labrale inferius ahead of the subnasale-soft pogonion
   * line, millimetres (Legan and Burstone). Absent: their norm, 2. Schema
   * constraints: Minimum: -10; Maximum: 20; retained by Human's schema
   * refinement.
   */
  lowerLipProtrusion?: number;

  /**
   * Bitragion breadth: the straight distance between the right and left tragion
   * (ANSUR), millimetres. Absent: FaceBase's women's or men's ratio of means
   * t-t / eu-eu on the head breadth. Schema constraints: Minimum: 90; Maximum:
   * 200; retained by Human's schema refinement.
   */
  bitragionBreadth?: number;

  /**
   * Nasal bridge length: nasion to pronasale, a straight distance in the
   * midsagittal plane (Farkas, n-prn), millimetres. Absent: FaceBase's ratio of
   * means n-prn / n-sn on the nose height. Schema constraints: Minimum: 20;
   * Maximum: 80; retained by Human's schema refinement.
   */
  nasalBridgeLength?: number;

  /**
   * Tragion to top of head: the vertical distance from the tragion to the top
   * of the head with the head in the Frankfort plane (ANSUR II), millimetres.
   * Absent: ANSUR II's women's or men's line on the head circumference. Schema
   * constraints: Minimum: 80; Maximum: 180; retained by Human's schema
   * refinement.
   */
  tragionTopOfHead?: number;

  /**
   * Upper facial height: nasion to stomion, the three-dimensional distance
   * (FaceBase n-sto), millimetres. With `upperLipHeight`, places the stomion.
   * Absent: Legan and Burstone's Sn-Stms / Stmi-Me' of one half. Schema
   * constraints: Minimum: 40; Maximum: 120; retained by Human's schema
   * refinement.
   */
  upperFacialHeight?: number;

  /**
   * Upper lip height: subnasale to stomion, the three-dimensional distance
   * (FaceBase sn-sto), millimetres. Absent: as `upperFacialHeight`. Schema
   * constraints: Minimum: 8; Maximum: 40; retained by Human's schema
   * refinement.
   */
  upperLipHeight?: number;

  /**
   * Bitragion coronal arc: the surface arc from tragion to tragion over the top
   * of the head in the coronal plane, a taut tape (ANSUR 1988), millimetres.
   * Absent: ANSUR 1988's women's or men's line on the head circumference.
   * Schema constraints: Minimum: 250; Maximum: 450; retained by Human's schema
   * refinement.
   */
  bitragionCoronalArc?: number;

  /**
   * Cervical arrow apex: the deepest point of the cervical lordosis on the
   * back's midline skin, Stagnara's flèche cervicale read against a plumb line,
   * standing, as its horizontal distance behind the tragion, millimetres. With
   * `cervicalArrowApexBelowTragion`, places the nape's datum. Absent: the nape
   * is left to the posterior outline's minimum energy. Schema constraints:
   * Minimum: 0; Maximum: 150; retained by Human's schema refinement.
   */
  cervicalArrowApexBehindTragion?: number;

  /**
   * Cervical arrow apex below the tragion, vertical, standing, millimetres.
   * Absent: as `cervicalArrowApexBehindTragion`. Schema constraints: Minimum:
   * 0; Maximum: 150; retained by Human's schema refinement.
   */
  cervicalArrowApexBelowTragion?: number;

  /** Eye, nose and mouth dimensions. */
  face: IAutoMovieHumanFace;

  /** Independent left and right auricles. */
  earPair: IAutoMovieHumanPair<IAutoMovieHumanEar>;
}
