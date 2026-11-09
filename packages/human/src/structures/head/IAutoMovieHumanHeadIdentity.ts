import { tags } from "typia";

import type { IAutoMovieHumanEar } from "./IAutoMovieHumanEar";
import type { IAutoMovieHumanFace } from "./IAutoMovieHumanFace";
import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/**
 * The cranial vault and the frame of the face.
 *
 * Vault shape is a parameter of its own, the cephalic index, because it is not implied by sex or face size: means derived from published lengths and breadths differ by population (about 77 in US adults of European ancestry, Weinberg et al. 2016; about 85 in Chinese workers, Du et al. 2008, Ann Occup Hyg 52(8):773-782) and Chinese children measured on CT range from 73.5 to 105.7 (Liang et al. 2024, BMC Pediatr 24:685). Head breadth follows from length and index, so the document cannot state a breadth that contradicts them.
 */
export interface IAutoMovieHumanHeadIdentity {
  /**
   * Head length: glabella to opisthocranion, the longest midline length of the vault, millimetres.
   */
  length: number & tags.Minimum<80> & tags.Maximum<260>;

  /**
   * Cephalic index: maximum head breadth (eurion to eurion) over head length, times 100, dimensionless.
   */
  cephalicIndex: number & tags.Minimum<60> & tags.Maximum<110>;

  /**
   * Head circumference: maximum circumference just above the brow ridges and around the back of the vault, millimetres.
   */
  circumference: number & tags.Minimum<300> & tags.Maximum<700>;

  /**
   * Head height: menton-to-vertex separation measured perpendicular to the Frankfort plane, millimetres, following [Snyder et al. 1977, measurement 25](https://math.nist.gov/~SRessler/anthrokids/data1977/descrip.htm). Stature over head height is about 5.3 at age 2 and 8.0 in late adolescence (UM-HSRI-77-17).
   */
  height: number & tags.Minimum<80> & tags.Maximum<320>;

  /**
   * Morphological face height: Euclidean three-dimensional distance from nasion to gnathion, millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
   */
  faceHeight: number & tags.Minimum<40> & tags.Maximum<180>;

  /**
   * Face width: zygion to zygion, between the most lateral points of the zygomatic arches, millimetres.
   */
  faceWidth: number & tags.Minimum<50> & tags.Maximum<200>;

  /**
   * Mandibular width: gonion to gonion, between the angles of the mandible, millimetres.
   */
  mandibularWidth: number & tags.Minimum<40> & tags.Maximum<180>;

  /**
   * Minimum frontal width: frontotemporale to frontotemporale, the narrowest forehead between the temporal crests, millimetres.
   */
  minimumFrontalWidth: number & tags.Minimum<50> & tags.Maximum<160>;

  /**
   * Active maximum mouth opening between the upper and lower incisal edges, millimetres, as measured with a ruler in children by Verkouteren et al. (2022, Eur J Oral Sci 130(3):e12869): 42.8 to 55.3 mm from 6 to 18 years.
   */
  mouthOpening: number & tags.Minimum<5> & tags.Maximum<90>;

  /**
   * Lateral excursion of the lower incisors to one side, millimetres, from the dental midline; 9.1 to 10.4 mm in the same study.
   */
  mandibularLaterotrusion: number & tags.Minimum<0> & tags.Maximum<25>;

  /**
   * Bitragion menton arc: the surface arc from tragion to tragion passing under the chin through the menton, a taut tape, millimetres (ANSUR 1988, Gordon et al. 1989). Absent: ANSUR 1988's women's or men's line on the face width.
   */
  bitragionMentonArc?: number & tags.Minimum<150> & tags.Maximum<500>;

  /**
   * Bitragion subnasale arc: the surface arc from tragion to tragion passing under the nose through the subnasale, a taut tape, millimetres (ANSUR 1988). Absent: ANSUR 1988's line on the face width.
   */
  bitragionSubnasaleArc?: number & tags.Minimum<150> & tags.Maximum<500>;

  /**
   * Submental inclination: the line from the menton tangent to the submental contour, degrees below the Frankfort plane, backward from the menton (Ellenbogen and Karlin's submental tangent). Absent: 20 degrees (declared).
   */
  submentalInclination?: number & tags.Minimum<-30> & tags.Maximum<60>;

  /**
   * Subnasale ahead of the soft-tissue glabella, parallel to the Frankfort plane in the midsagittal plane, millimetres (negative: behind). Absent: the subnasale's forward place closes FaceBase's tragion-subnasale depth.
   */
  subnasaleAheadOfGlabella?: number & tags.Minimum<-40> & tags.Maximum<40>;

  /**
   * Soft-tissue glabella ahead of the soft-tissue nasion, parallel to the Frankfort plane, millimetres. Absent: 1.9 (declared).
   */
  glabellaAheadOfNasion?: number & tags.Minimum<-15> & tags.Maximum<30>;

  /**
   * Soft-tissue glabella above the soft-tissue nasion, normal to the Frankfort plane, millimetres. Absent: 0.14 of the face height (declared).
   */
  glabellaAboveNasion?: number & tags.Minimum<-10> & tags.Maximum<60>;

  /**
   * Soft pogonion ahead of the soft-tissue glabella, parallel to the Frankfort plane, millimetres (negative: behind). With `pogonionAboveMenton`, places the chin's most prominent point. Absent: Legan and Burstone's facial convexity from the subnasale at a declared height.
   */
  pogonionAheadOfGlabella?: number & tags.Minimum<-60> & tags.Maximum<40>;

  /**
   * Soft pogonion above the menton, normal to the Frankfort plane, millimetres. Absent: as `pogonionAheadOfGlabella`.
   */
  pogonionAboveMenton?: number & tags.Minimum<0> & tags.Maximum<60>;

  /**
   * Tragion to nasion, the three-dimensional distance (FaceBase upper facial depth t-n), the mean of both sides, millimetres. Absent: FaceBase's women's or men's ratio of means on the head length.
   */
  tragionNasionDepth?: number & tags.Minimum<70> & tags.Maximum<180>;

  /**
   * Tragion to subnasale, the three-dimensional distance (FaceBase middle facial depth t-sn), the mean of both sides, millimetres. Absent: as `tragionNasionDepth`.
   */
  tragionSubnasaleDepth?: number & tags.Minimum<70> & tags.Maximum<180>;

  /**
   * Tragion to gnathion, the three-dimensional distance (FaceBase lower facial depth t-gn), the mean of both sides, millimetres. Absent: as `tragionNasionDepth`.
   */
  tragionGnathionDepth?: number & tags.Minimum<80> & tags.Maximum<200>;

  /**
   * Upper lip protrusion: labrale superius ahead of the subnasale-soft pogonion line, millimetres (Legan and Burstone). Absent: their norm, 3.
   */
  upperLipProtrusion?: number & tags.Minimum<-10> & tags.Maximum<20>;

  /**
   * Lower lip protrusion: labrale inferius ahead of the subnasale-soft pogonion line, millimetres (Legan and Burstone). Absent: their norm, 2.
   */
  lowerLipProtrusion?: number & tags.Minimum<-10> & tags.Maximum<20>;

  /**
   * Bitragion breadth: the straight distance between the right and left tragion (ANSUR), millimetres. Absent: FaceBase's women's or men's ratio of means t-t / eu-eu on the head breadth.
   */
  bitragionBreadth?: number & tags.Minimum<90> & tags.Maximum<200>;

  /**
   * Nasal bridge length: nasion to pronasale, a straight distance in the midsagittal plane (Farkas, n-prn), millimetres. Absent: FaceBase's ratio of means n-prn / n-sn on the nose height.
   */
  nasalBridgeLength?: number & tags.Minimum<20> & tags.Maximum<80>;

  /**
   * Tragion to top of head: the vertical distance from the tragion to the top of the head with the head in the Frankfort plane (ANSUR II), millimetres. Absent: ANSUR II's women's or men's line on the head circumference.
   */
  tragionTopOfHead?: number & tags.Minimum<80> & tags.Maximum<180>;

  /**
   * Upper facial height: nasion to stomion, the three-dimensional distance (FaceBase n-sto), millimetres. With `upperLipHeight`, places the stomion. Absent: Legan and Burstone's Sn-Stms / Stmi-Me' of one half.
   */
  upperFacialHeight?: number & tags.Minimum<40> & tags.Maximum<120>;

  /**
   * Upper lip height: subnasale to stomion, the three-dimensional distance (FaceBase sn-sto), millimetres. Absent: as `upperFacialHeight`.
   */
  upperLipHeight?: number & tags.Minimum<8> & tags.Maximum<40>;

  /**
   * Bitragion coronal arc: the surface arc from tragion to tragion over the top of the head in the coronal plane, a taut tape (ANSUR 1988), millimetres. Absent: ANSUR 1988's women's or men's line on the head circumference.
   */
  bitragionCoronalArc?: number & tags.Minimum<250> & tags.Maximum<450>;

  /**
   * Cervical arrow apex: the deepest point of the cervical lordosis on the back's midline skin, Stagnara's flèche cervicale read against a plumb line, standing, as its horizontal distance behind the tragion, millimetres. With `cervicalArrowApexBelowTragion`, places the nape's datum. Absent: the nape is left to the posterior outline's minimum energy.
   */
  cervicalArrowApexBehindTragion?: number & tags.Minimum<0> & tags.Maximum<150>;

  /**
   * Cervical arrow apex below the tragion, vertical, standing, millimetres. Absent: as `cervicalArrowApexBehindTragion`.
   */
  cervicalArrowApexBelowTragion?: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Eye, nose and mouth dimensions. */
  face: IAutoMovieHumanFace;

  /** Independent left and right auricles. */
  earPair: IAutoMovieHumanPair<IAutoMovieHumanEar>;
}
