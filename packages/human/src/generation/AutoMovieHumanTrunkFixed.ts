import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "./AutoMovieHumanBodyLaw";
import type { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";

/**
 * The trunk solve's fixed inputs of one person, from the person's typed
 * parameters alone: what a standalone trunk or shoulder piece, its test and its
 * viewer entry are built from, without composing the rest of the body again.
 *
 * The tapes, courses and controls are the public inputs at their definitions
 * in calibration millimetres; the body law calibrates at its own stature, so
 * a calibration millimetre is a world millimetre here (scale 1), and an
 * unknown input takes the default the body law gives it. The neck
 * chain `head` and the crotch ring's height are the ones the body law gives
 * the same person: the trunk stands between them and owns neither. A caller
 * that reads the solve many times caches `AutoMovieHumanTrunkSolver.solve(of(p))`
 * once (a `Singleton` of `tstl` in the tests and the viewer).
 */
export namespace AutoMovieHumanTrunkFixed {
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
    const anatomy: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);

    return {
      biacromial: anatomy.biacromialBreadth,
      acromion: anatomy.acromialHeight,
      axilla: anatomy.axillaHeight,
      female: anatomy.sex === AutoMovieHumanSex.Female,
      hip: anatomy.hipCircumference,
      highHip: anatomy.highHipCircumference,
      waist: anatomy.waistCircumference,
      underbust: anatomy.underbustCircumference,
      chest: anatomy.chestCircumference,
      bustSpan: anatomy.bustPointWidth,
      neckBase: anatomy.neckBaseCircumference,
      acrossShoulder: anatomy.acrossBackShoulderWidth,
      bicep: anatomy.upperArmCircumference,
      neckToWaist: anatomy.backNeckToWaist,
      shoulderToApex: anatomy.sideNeckToBustPoint,
      upperArm: anatomy.upperArmLength,
      sex: AutoMovieHumanBodyLaw.slider(params, "masculineFeminine"),
      fat: AutoMovieHumanBodyLaw.slider(params, "fat"),
      muscularity: AutoMovieHumanBodyLaw.slider(params, "muscularity"),
      scale: 1,
    };
  }
}
