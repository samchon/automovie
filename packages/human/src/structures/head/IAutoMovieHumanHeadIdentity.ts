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
   * Head height: vertex to menton, the lowest point of the chin, head in the Frankfurt plane, millimetres. Stature over head height is about 5.3 at age 2 and 8.0 in late adolescence (Snyder et al. 1977, UM-HSRI-77-17).
   */
  height: number & tags.Minimum<80> & tags.Maximum<320>;

  /**
   * Morphological face height: nasion to gnathion, millimetres.
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

  /** Eye, nose and mouth dimensions. */
  face: IAutoMovieHumanFace;

  /** Independent left and right auricles. */
  earPair: IAutoMovieHumanPair<IAutoMovieHumanEar>;
}
