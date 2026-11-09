import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import {
  f1,
  f2,
  m1,
  m2,
} from "../../../../packages/playground/src/human-parameters/index";
import { readTestArguments } from "../../readTestArguments";
import { HumanInputs } from "./HumanInputs";
import { HumanPopulation } from "./HumanPopulation";

/**
 * Prepare immutable named inputs or one caller-owned generated person. Nothing
 * generated here may be modified.
 *
 * Two sets: the core set, which every run reads, holds the four references
 * and six population ends (each sex's small and large corner, a tall light
 * woman and a short heavy man); the extended set adds every other end of
 * {@link HumanPopulation.ENDS}, 66 people in all. An explicit test CLI
 * `--human-people` value takes precedence over the existing
 * `AUTOMOVIE_HUMAN_PEOPLE` value; absent both, the core set remains selected.
 */
export namespace HumanPeople {
  /** A generated person. */
  export interface IPerson {
    /** Name in findings. */
    name: string;

    /** Public inputs. */
    params: IAutoMovieHumanParameters;

    /** The generated body. */
    body: IAutoMovieHumanBodyCalibration;
  }

  /** A generated person with a rig and a pose evaluator. */
  export interface IRigged extends IPerson {
    /** Metres per calibration millimetre. */
    scale: number;

    /** The body's rig. */
    rig: AutoMovieHumanRig.IRig;

    /** The body's clinical pose evaluator. */
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  }

  /** Existing environment selector for named people or the extended set. */
  export const SET_VARIABLE: string = "AUTOMOVIE_HUMAN_PEOPLE";

  /**
   * The names of the set this run reads, without generating anyone: the core
   * set; every person when {@link SET_VARIABLE} is `extended`; or, when it
   * lists names separated by commas (such as `f1` or `f1,m2`), those people
   * only. The test CLI's explicit `--human-people f1` takes precedence over
   * the existing environment value. Explicit arguments permit pure selection
   * tests; zero-argument production tests read the real invocation unchanged.
   *
   * @throws {Error} When the request is malformed or names a person the table does not hold.
   *
   * @evidence contracts/development/testing.md#behavioral-verification The workspace Human selection question reads this actual fixture with explicit argv/environment inputs and logs its zero-argument result from the real invocation, catching CLI precedence or default-population regressions without generating a figure.
   * @evidence contracts/development/testing.md#independent-expectations Literal f1/m2 registry order, the existing ten core people and sixty-six extended people define the oracle; no generated geometry supplies it.
   * @evidence contracts/development/testing.md#distinguishing-cases The owning question covers CLI over the old environment input, absent CLI with named/default/extended values, and invalid CLI preflight. Figure questions retain their geometric expectations after selecting these names.
   * @evidence contracts/development/testing.md#execution-ownership This portable fixture reader shares the pure CLI grammar with actual preflight, reads only supplied or default invocation inputs and writes no environment or global selection state.
   */
  export function names(
    argv: readonly string[] = process.argv.slice(2),
    environment: string | undefined = process.env[SET_VARIABLE],
  ): string[] {
    return select(readTestArguments(argv).humanPeople ?? environment);
  }

  /**
   * Validate a supplied immutable population value and retain registry order. This reads no CLI, environment, generated figure or mutable run configuration.
   *
   * @evidence contracts/development/testing.md#behavioral-verification The workspace Human selection question exercises this actual registry admission directly and through preflight, catching accepted unknown names, reordered selections or duplicate results.
   * @evidence contracts/development/testing.md#independent-expectations Literal named people, stable registry order and the existing core/extended population counts supply expectations independently of this selector.
   * @evidence contracts/development/testing.md#distinguishing-cases Named/duplicate/default/extended values and unknown or empty comma-list members distinguish valid population requests; scenario option grammar belongs to the shared reader's question.
   * @evidence contracts/development/testing.md#execution-ownership This synchronous portable registry query creates input records only and owns no generated person, host, environment mutation or retained selection state.
   */
  export function select(value?: string): string[] {
    if (value !== undefined && value !== "" && value !== "extended") {
      const listed: string[] = value
        .split(",")
        .map((s: string): string => s.trim());
      for (const name of listed) entry(name);
      return [...table().keys()].filter((name: string): boolean =>
        listed.includes(name),
      );
    }
    const extended: boolean = value === "extended";
    return [...table().values()]
      .filter((e: IEntry): boolean => extended || e.core)
      .map((e: IEntry): string => e.name);
  }

  /** Every person of the extended set, whatever this run reads. */
  export function everyone(): string[] {
    return [...table().keys()];
  }

  /** One person's public inputs, without generating it. */
  export function params(name: string): IAutoMovieHumanParameters {
    return entry(name).params;
  }

  /** The sex whose statistics a person's inputs must satisfy. */
  export function sex(name: string): HumanPopulation.Sex {
    return entry(name).sex;
  }

  /**
   * One person, generated by this call: the caller keeps it for as long as it
   * reads it, and nothing outlives the caller.
   */
  export function person(name: string): IPerson {
    const own: IAutoMovieHumanParameters = params(name);
    return {
      name,
      params: own,
      body: AutoMovieHumanBodyLaw.calibrate(own).body,
    };
  }

  /**
   * One person with a rig and pose evaluator, prepared by this call from the
   * person the caller holds, or generated for it from a name.
   */
  export function rigged(who: string | IPerson): IRigged {
    const own: IPerson = typeof who === "string" ? person(who) : who;
    const scale: number =
      0.001 * (HumanInputs.stature(own.params) / own.body.stature);
    return {
      ...own,
      scale,
      rig: AutoMovieHumanRig.prepare(own.body, scale),
      evaluate: AutoMovieHumanSkeleton.prepare(own.params, {
        calibration: own.body,
      }),
    };
  }
}

/** One person of the table. */
interface IEntry {
  /** Name. */
  name: string;

  /** Sex of the statistics its inputs come from. */
  sex: HumanPopulation.Sex;

  /** Whether the core set holds it. */
  core: boolean;

  /** Public inputs. */
  params: IAutoMovieHumanParameters;
}

/** Every person, the references first, built for each call so nothing outlives its test. */
function table(): Map<string, IEntry> {
  const all: IEntry[] = [
    { name: "f1", sex: "female", core: true, params: f1 },
    { name: "f2", sex: "female", core: true, params: f2 },
    { name: "m1", sex: "male", core: true, params: m1 },
    { name: "m2", sex: "male", core: true, params: m2 },
  ];
  return new Map<string, IEntry>(
    [
      ...all,
      ...HumanPopulation.ENDS.map(
        (e: HumanPopulation.IEnd): IEntry => ({
          name: e.name,
          sex: e.sex,
          core: e.core,
          params: HumanPopulation.params(e),
        }),
      ),
    ].map((e: IEntry): [string, IEntry] => [e.name, e]),
  );
}

/** One entry. */
function entry(name: string): IEntry {
  const found: IEntry | undefined = table().get(name);
  if (found === undefined)
    throw new Error(`No Human test person is named ${name}.`);
  return found;
}
