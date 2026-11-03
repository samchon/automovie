import { Singleton } from "tstl";

import * as examples from "../../../playground/src/human-parameters";
import { AutoMovieHumanBodyLaw } from "../../src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../../src/structures/IAutoMovieHumanParameters";
import type { IHumanDebugPerson } from "./IHumanDebugPerson";

/**
 * The people the viewer shows: every typed example `packages/playground/src/human-parameters`
 * exports, by its export name.
 *
 * The list is the module's own exports, so a new typed example is a person here with no list to
 * edit. A person's calibration is the current source's `AutoMovieHumanBodyLaw.calibrate` of its
 * public inputs, computed on first use and kept by a `Singleton` for the module's lifetime; a page
 * load is one module lifetime, so a source edit followed by a reload calibrates again.
 */
export namespace HumanDebugPeople {
  /** Every alias in the module's export order. */
  export function aliases(): string[] {
    return Object.keys(examples);
  }

  /**
   * One person by alias, or the first exported person for null.
   *
   * @param alias Export name, or null.
   * @returns The person; an unknown alias throws naming every known one.
   */
  export function of(alias: string | null): IHumanDebugPerson {
    const name: string = alias ?? aliases()[0]!;
    const parameters: IAutoMovieHumanParameters | undefined = (
      examples as Record<string, IAutoMovieHumanParameters>
    )[name];
    if (parameters === undefined)
      throw new Error(
        "Unknown Human person " + name + "; known: " + aliases().join(", "),
      );
    let found: IHumanDebugPerson | undefined = PEOPLE.get(name);
    if (found === undefined) {
      const calibration: Singleton<IAutoMovieHumanBodyCalibration> =
        new Singleton(
          (): IAutoMovieHumanBodyCalibration =>
            AutoMovieHumanBodyLaw.calibrate(parameters).body,
        );
      found = {
        alias: name,
        parameters,
        calibration: (): IAutoMovieHumanBodyCalibration => calibration.get(),
      };
      PEOPLE.set(name, found);
    }
    return found;
  }

  /** People already asked for, by alias. */
  const PEOPLE: Map<string, IHumanDebugPerson> = new Map();
}
