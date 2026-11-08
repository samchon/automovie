import { HumanNodePaths } from "./HumanNodePaths";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";

/** Node-only workspace input boundary; no parameter module enters the published browser graph. */
export namespace HumanNodeInput {
  /**
   * Loads the actual typed f1 authoring module at the executable boundary.
   * The workspace TypeScript module is the trusted input contract, not untrusted JSON;
   * production preparation owns its numeric constraints. No parameter is copied or synthesized.
   */
  export async function of(): Promise<IHumanInspectionPerson> {
    if (person !== null) return person;
    const file: string = HumanNodePaths.resolve("packages/playground/src/human-parameters/f1.ts");
    const inputs: Record<string, IAutoMovieHumanParameters> = require(file);
    const parameters: IAutoMovieHumanParameters | undefined = inputs.f1;
    if (parameters === undefined) throw new Error("The actual typed input module has no f1 export: " + file);
    let calibrated: IAutoMovieHumanBodyCalibration | null = null;
    person = { alias: "f1", parameters, calibration: (): IAutoMovieHumanBodyCalibration => {
      calibrated ??= AutoMovieHumanBodyLaw.calibrate(parameters).body;
      return calibrated;
    } };
    return person;
  }

  /** One actual input per executable process; calibration remains lazy. */
  let person: IHumanInspectionPerson | null = null;
}
