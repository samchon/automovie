import type { IAutoMovieHumanParameters } from "@automovie/human";

import { HumanPopulationAudit } from "./HumanPopulationAudit";
import { HumanPopulationBuild } from "./HumanPopulationBuild";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import { HumanPopulationEnds } from "./HumanPopulationEnds";
import { HumanPopulationSurvey } from "./HumanPopulationSurvey";

/**
 * Whole adults at the ends of the population, each built from published
 * survey statistics and never from a generated figure.
 *
 * A person is the conditional mean of every surveyed measure given a few
 * driving measures held at their 1st or 99th percentile: the regression form
 * of a boundary manikin (Young et al. 2008, NASA 20080013454). Holding one
 * measure at its end and letting every other take its expected value keeps
 * the person inside the survey's joint distribution, so its tapes move
 * together as real bodies' do. The survey is ANSUR 1988 (Gordon et al. 1989;
 * `packages/human/docs/sources/ansur-1988-boundary-people.md`), the one public
 * body survey that measures the bust span, underbust, natural waist, elbow
 * and knee girths and the head and ear beside the body. Each sex has its own
 * means, standard deviations and correlations.
 *
 * This barrel joins the pieces: {@link HumanPopulationSurvey} the statistics,
 * {@link HumanPopulationConditional} the conditioning,
 * {@link HumanPopulationEnds} the ends, {@link HumanPopulationBuild} the
 * inputs written from an end and {@link HumanPopulationAudit} the checks.
 */
export namespace HumanPopulation {
  /** A surveyed sex; each has its own statistics table. */
  export type Sex = HumanPopulationSurvey.Sex;

  /** One surveyed measure. */
  export type Variable = HumanPopulationSurvey.Variable;

  /** One sex's summary statistics. */
  export type ISurvey = HumanPopulationSurvey.ISurvey;

  /** Measures a population end holds at a standard deviate. */
  export type IDrivers = HumanPopulationEnds.IDrivers;

  /** One population end. */
  export type IEnd = HumanPopulationEnds.IEnd;

  /** One check of a person's inputs. */
  export type IRow = HumanPopulationAudit.IRow;

  /** A relation between a person's inputs that the population bounds. */
  export type IRelation = HumanPopulationAudit.IRelation;

  /** The surveyed measures, in the order of the survey's vectors. */
  export const VARIABLES: typeof HumanPopulationSurvey.VARIABLES =
    HumanPopulationSurvey.VARIABLES;

  /** Normal deviate of the 1st and 99th percentiles. */
  export const Z: number = HumanPopulationSurvey.Z;

  /** Half-width of a population relation's band in standard deviations. */
  export const BAND: number = HumanPopulationSurvey.BAND;

  /** ANSUR 1988 summary statistics per sex. */
  export const SURVEY: typeof HumanPopulationSurvey.SURVEY =
    HumanPopulationSurvey.SURVEY;

  /** ANSUR 1988 body-mass index, kg/m2, mean and SD per sex. */
  export const BMI: typeof HumanPopulationSurvey.BMI =
    HumanPopulationSurvey.BMI;

  /** Adult facial means of the 3D Facial Norms database per sex. */
  export const FACE: typeof HumanPopulationSurvey.FACE =
    HumanPopulationSurvey.FACE;

  /** ANSUR II palm length over hand length per sex. */
  export const PALM: typeof HumanPopulationSurvey.PALM =
    HumanPopulationSurvey.PALM;

  /** The declared body domain. */
  export const DOMAIN: typeof HumanPopulationSurvey.DOMAIN =
    HumanPopulationSurvey.DOMAIN;

  /** Every population end. */
  export const ENDS: readonly IEnd[] = HumanPopulationEnds.ENDS;

  /** Relations between inputs and their sex's bands. */
  export const RELATIONS: readonly IRelation[] = HumanPopulationAudit.RELATIONS;

  /** Survey-defined inputs and the surveyed range each must lie in. */
  export const RANGES: typeof HumanPopulationAudit.RANGES =
    HumanPopulationAudit.RANGES;

  /**
   * Index of a measure in the survey vectors.
   *
   * @param v The measure.
   * @returns Its index.
   */
  export function index(v: Variable): number {
    return HumanPopulationConditional.index(v);
  }

  /**
   * Conditional mean and standard deviation of one measure given known values.
   *
   * @param sex The surveyed sex.
   * @param known Known values by measure index.
   * @param target Index of the measure sought.
   * @returns Its moments given the known values.
   */
  export function conditional(
    sex: Sex,
    known: ReadonlyMap<number, number>,
    target: number,
  ): HumanPopulationConditional.IMoments {
    return HumanPopulationConditional.moments(sex, known, target);
  }

  /**
   * An end's value of every surveyed measure.
   *
   * @param end The end.
   * @returns The measures.
   */
  export function measures(end: IEnd): Record<Variable, number> {
    return HumanPopulationEnds.measures(end);
  }

  /**
   * Each measure's bounds for a sex.
   *
   * @param sex The surveyed sex.
   * @returns `[measure index, least, greatest]` for every measure.
   */
  export function limits(sex: Sex): [number, number, number][] {
    return HumanPopulationEnds.limits(sex);
  }

  /**
   * An end's public inputs.
   *
   * @param end The end.
   * @returns The end's inputs.
   */
  export function params(end: IEnd): IAutoMovieHumanParameters {
    return HumanPopulationBuild.params(end);
  }

  /**
   * Every check of one person's inputs.
   *
   * @param person Name in findings.
   * @param sex The sex whose statistics the inputs must satisfy.
   * @param p The person's inputs.
   * @returns Every row, passing or not.
   */
  export function audit(
    person: string,
    sex: Sex,
    p: IAutoMovieHumanParameters,
  ): IRow[] {
    return HumanPopulationAudit.audit(person, sex, p);
  }

  /**
   * Whether a row passes.
   *
   * @param row The row.
   * @returns Whether its value lies in its bounds.
   */
  export function passes(row: IRow): boolean {
    return HumanPopulationAudit.passes(row);
  }
}
