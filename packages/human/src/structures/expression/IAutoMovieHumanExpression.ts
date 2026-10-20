import { IAutoMovieHumanActionUnitActivation } from "./IAutoMovieHumanActionUnitActivation";

/**
 * A facial expression of one person at one instant, as intensities of FACS action units.
 *
 * Expression is facial articulation, as much a joint as the jaw: each unit pulls the face surface along the anatomy of its muscle, and units add where their muscles meet, as at the mouth corner. Emotions are combinations, for example happiness is cheek raiser plus lip corner puller (AU6+12) and surprise is both brow raisers, upper lid raiser and jaw drop (AU1+2+5+26) in the EMFACS prototypes. Units not listed are at rest; an empty list is the neutral face.
 *
 * Each unit and side must be unique; bilateral and unilateral entries must not overlap. Jaw units are bilateral. No admission implementation is supplied.
 */
export interface IAutoMovieHumanExpression {
  /** Acting units with their intensity and side. */
  units: IAutoMovieHumanActionUnitActivation[];
}
