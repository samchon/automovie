import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { HumanOnce } from "./HumanOnce";
import { HumanPopulation } from "./HumanPopulation";
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

/**
 * The people the Human tests read, each generated once per run and only when a
 * test first asks for them. Nothing generated here may be modified.
 *
 * Two sets: the core set, which every run reads, holds the four references
 * and six population ends (each sex's small and large corner, a tall light
 * woman and a short heavy man); the extended set adds every other end of
 * {@link HumanPopulation.ENDS}, 36 people in all. Set
 * `AUTOMOVIE_HUMAN_PEOPLE=extended` to run every test over the extended set,
 * locally or nightly.
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

  /** The environment variable that selects the extended set. */
  export const SET_VARIABLE: string = "AUTOMOVIE_HUMAN_PEOPLE";

  /** The names of the set this run reads, without generating anyone. */
  export function names(): string[] {
    const extended: boolean = process.env[SET_VARIABLE] === "extended";
    return [...table().values()].filter((e: IEntry): boolean => extended || e.core).map((e: IEntry): string => e.name);
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

  /** One person, generated on first use. */
  export function person(name: string): IPerson {
    return persons.read(name, (): IPerson => {
      const own: IAutoMovieHumanParameters = params(name);
      return { name, params: own, body: AutoMovieHumanBodyLaw.calibrate(own).body };
    });
  }

  /** One person with a rig and pose evaluator, prepared on first use. */
  export function rigged(name: string): IRigged {
    return riggeds.read(name, (): IRigged => {
      const own: IPerson = person(name);
      const scale: number =
        0.001 * (own.params.body.controls.height.value! / own.body.stature);
      return {
        ...own,
        scale,
        rig: AutoMovieHumanRig.prepare(own.body, scale),
        evaluate: AutoMovieHumanSkeleton.prepare(own.params, {
          calibration: own.body,
        }),
      };
    });
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

/** Both successful geometry and the identical native failure are shared by every test consumer. */
const persons: HumanOnce<HumanPeople.IPerson> = new HumanOnce();
/** Preparing a rig also preserves its exact failed outcome instead of retrying it per region. */
const riggeds: HumanOnce<HumanPeople.IRigged> = new HumanOnce();
let people: Map<string, IEntry> | null = null;

/** Every person, the references first. */
function table(): Map<string, IEntry> {
  const all: IEntry[] = [
    { name: "f1", sex: "female", core: true, params: f1 },
    { name: "f2", sex: "female", core: true, params: f2 },
    { name: "m1", sex: "male", core: true, params: m1 },
    { name: "m2", sex: "male", core: true, params: m2 },
  ];
  people ??= new Map<string, IEntry>(
    [
      ...all,
      ...HumanPopulation.ENDS.map(
        (e: HumanPopulation.IEnd): IEntry => ({ name: e.name, sex: e.sex, core: e.core, params: HumanPopulation.params(e) }),
      ),
    ].map((e: IEntry): [string, IEntry] => [e.name, e]),
  );
  return people;
}

/** One entry. */
function entry(name: string): IEntry {
  const found: IEntry | undefined = table().get(name);
  if (found === undefined) throw new Error(`No Human test person is named ${name}.`);
  return found;
}
