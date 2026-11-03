import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyLaw } from "./AutoMovieHumanBodyLaw";
import type { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import { AutoMovieHumanBodySpecimenCalibration } from "./calibration/AutoMovieHumanBodySpecimenCalibration";

/**
 * The trunk solve's fixed inputs of one person, from the person's typed
 * parameters alone: what a standalone trunk or shoulder piece, its test and its
 * viewer entry are built from, without composing the rest of the body again.
 *
 * The tapes, courses and controls are the public inputs at their definitions
 * in calibration millimetres; the body law calibrates at its own stature, so
 * a calibration millimetre is a world millimetre here (scale 1), and an
 * unknown input takes the specimen's value as the body law does. The neck
 * chain `head` and the crotch ring's height are the ones the body law gives
 * the same person: the trunk stands between them and owns neither. A caller
 * that reads the solve many times caches `AutoMovieHumanTrunkSolver.solve(of(p))`
 * once (a `Singleton` of `tstl` in the tests and the viewer).
 */
export namespace AutoMovieHumanTrunkFixed {
  /** A public body control the trunk reads. */
  type Control =
    | "hip"
    | "highHip"
    | "waist"
    | "underbust"
    | "chest"
    | "bustSpan"
    | "neckBase"
    | "acrossShoulder"
    | "bicep"
    | "neckToWaist"
    | "shoulderToApex"
    | "frontInterscyeLength"
    | "upperArmLength"
    | "masculineFeminine"
    | "fat"
    | "muscularity";

  /**
   * The fixed inputs of a person's trunk solve.
   *
   * @param params The person's typed parameters.
   * @returns The inputs, stature, crotch height and neck chain the solver reads.
   */
  export function of(params: IAutoMovieHumanParameters): AutoMovieHumanTrunkSolver.IFixed {
    const body: IAutoMovieHumanBodyCalibration = AutoMovieHumanBodyLaw.calibrate(params).body;
    const chain = (name: string): IAutoMovieHumanLoftChain => {
      const found: IAutoMovieHumanLoftChain | undefined = body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === name);
      if (found === undefined) throw new Error(`The body law gave no chain ${name}`);
      return found;
    };

    return { inputs: inputs(params), stature: body.stature, crotch: chain("trunk").layers[0]!.y, neck: chain("head") };
  }

  /**
   * The trunk's tapes, courses and controls of a person, as the body law
   * passes them.
   *
   * @param params The person's typed parameters.
   * @returns The inputs in calibration millimetres.
   */
  export function inputs(params: IAutoMovieHumanParameters): IAutoMovieHumanTrunkInputs {
    const value = (name: Control): number => {
      const given: number | null = params.body.controls[name].value;
      return given === null ? AutoMovieHumanBodySpecimenCalibration.controls[name]! : given;
    };

    return {
      hip: value("hip"),
      highHip: value("highHip"),
      waist: value("waist"),
      underbust: value("underbust"),
      chest: value("chest"),
      bustSpan: value("bustSpan"),
      neckBase: value("neckBase"),
      acrossShoulder: value("acrossShoulder"),
      bicep: value("bicep"),
      neckToWaist: value("neckToWaist"),
      shoulderToApex: value("shoulderToApex"),
      frontInterscyeLength: value("frontInterscyeLength"),
      upperArm: value("upperArmLength"),
      sex: value("masculineFeminine"),
      fat: value("fat"),
      muscularity: value("muscularity"),
      scale: 1,
    };
  }
}
