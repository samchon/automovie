import { AutoMovieHumanPopulation } from "../structures/AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";

/**
 * What every estimator of the default converter reads about the person being converted: the admitted traits and the stature and body mass index the converter resolved from them first.
 *
 * Stature is resolved before anything else because nearly every regression is on it, and old age separates two statures: the bones keep the length they reached at the end of growth while the spine loses height, so limb lengths regress on the peak stature and only the trunk takes the loss.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConversionContext {
  /** Which sex's statistics the estimators read. */
  sex: AutoMovieHumanSex;

  /** Age in years. */
  age: number;

  /** Reference population for the head and face means. */
  population: AutoMovieHumanPopulation;

  /** Build offsets, each zero at the population mean. */
  build: IAutoMovieHumanTraits.IBuild;

  /** Standing stature now, millimetres: the peak stature minus the old-age spinal loss. */
  stature: number;

  /** Stature at the end of growth, millimetres; equal to `stature` before the spine starts losing height. */
  peakStature: number;

  /** Median stature of the sex at this age before any old-age loss, millimetres; a child taller than it is scaled up from the median child. */
  medianStature: number;

  /** Spinal height lost since the end of growth, millimetres; zero before middle age. */
  spinalLoss: number;

  /** Body mass index the adult regressions read, kilograms per square metre. */
  bmi: number;

  /** Departure of `bmi` from the sex's reference mean, kilograms per square metre. */
  bmiOffset: number;

  /** Fat mass index less the median person's of the same sex and age, kilograms per square metre. */
  fatIndexOffset: number;

  /** Appendicular lean mass index less the median person's of the same sex and age, kilograms per square metre. */
  leanIndexOffset: number;
}
