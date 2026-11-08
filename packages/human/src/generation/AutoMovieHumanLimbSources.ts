import type { AutoMovieLoftContract } from "@automovie/engine";

import type { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import type { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanLimbRest } from "./AutoMovieHumanLimbRest";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmSources } from "./arm/AutoMovieHumanArmSources";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanLegSources } from "./leg/AutoMovieHumanLegSources";

/** Invocation-owned independent limb factories, shared by selected originals and later tree assembly. */
export namespace AutoMovieHumanLimbSources {
  /** Same public dimensions and direct rest definitions as production. */
  export interface IInput {
    /** Actual direct numerical rest owner, without whole bind publication. */
    rest: AutoMovieHumanLimbRest.IOutput;

    /** Resolved public measures; no geometry is acquired to obtain them. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Public arm and hand dimensions. */
    arms: AutoMovieHumanArmConstruction.IInputs & { bideltoid: number };

    /** Public foot dimensions. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** Calibration scale. */
    scale: number;

    /** Actual original crotch height, calibration mm. */
    crotch: number;

    /** Invocation-owned findings. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** Complete the genuine coupled parent only at its explicit full demand. */
    completeLeg?: () => void;
  }

  /** Source requests, with no implicit opposite-side or parent preparation. */
  export interface IOutput {
    /** Prepare just this arm/hand source owner. */
    arm(side: Side): AutoMovieHumanArmSources.IOutput;

    /** Prepare just this leg/distal source owner. */
    leg(side: Side): AutoMovieHumanLegSources.IOutput;
  }

  /** Enumerate authored source names without preparing a rest pose, curve, constraint or tree. */
  export function names(): string[] {
    return (["left", "right"] as const).flatMap((side: Side): string[] => [
      "leg." + side,
      "arm." + side,
      "foot." + side,
      ...AutoMovieHumanArmSources.names(side),
      ...AutoMovieHumanFootInterim.names(side),
    ]);
  }

  /** Retain successful actual family owners in this invocation, with failures still visible. */
  export function create(input: IInput): IOutput {
    const arms: Map<Side, AutoMovieHumanArmSources.IOutput> = new Map();
    const legs: Map<Side, AutoMovieHumanLegSources.IOutput> = new Map();
    return {
      arm(side: Side): AutoMovieHumanArmSources.IOutput {
        const previous: AutoMovieHumanArmSources.IOutput | undefined =
          arms.get(side);
        if (previous !== undefined) return previous;
        const actual: AutoMovieHumanArmSources.IOutput =
          AutoMovieHumanArmSources.create({
            side,
            rest: input.rest.arm(side),
            arms: input.arms,
            measures: input.measures,
            scale: input.scale,
          });
        arms.set(side, actual);
        return actual;
      },
      leg(side: Side): AutoMovieHumanLegSources.IOutput {
        const previous: AutoMovieHumanLegSources.IOutput | undefined =
          legs.get(side);
        if (previous !== undefined) return previous;
        const actual: AutoMovieHumanLegSources.IOutput =
          AutoMovieHumanLegSources.create({
            side,
            rest: input.rest.leg(side),
            feet: input.feet,
            measures: input.measures,
            scale: input.scale,
            crotch: input.crotch,
            diagnostics: input.diagnostics,
            completeLeg: input.completeLeg,
          });
        legs.set(side, actual);
        return actual;
      },
    };
  }
}

/** Existing source naming vocabulary. */
type Side = "left" | "right";
