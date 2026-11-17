import type {
  AutoMovieHumanSide,
  IAutoMovieHumanArmSources,
  IAutoMovieHumanLegSources,
  IAutoMovieHumanLimbSources,
} from "@automovie/interface";

import { AutoMovieHumanArmSources } from "./arm/AutoMovieHumanArmSources";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanLegSources } from "./leg/AutoMovieHumanLegSources";

/** Invocation-owned independent limb factories, shared by selected originals and later tree assembly. */
export namespace AutoMovieHumanLimbSources {
  /** Enumerate authored source names without preparing a rest pose, curve, constraint or tree. */
  export function names(): string[] {
    return (["left", "right"] as const).flatMap(
      (side: AutoMovieHumanSide): string[] => [
        "leg." + side,
        "arm." + side,
        "foot." + side,
        ...AutoMovieHumanArmSources.names(side),
        ...AutoMovieHumanFootInterim.names(side),
      ],
    );
  }

  /** Retain successful actual family owners in this invocation, with failures still visible. */
  export function create(
    input: IAutoMovieHumanLimbSources.IInput,
  ): IAutoMovieHumanLimbSources.IOutput {
    const arms: Map<AutoMovieHumanSide, IAutoMovieHumanArmSources.IOutput> =
      new Map();
    const legs: Map<AutoMovieHumanSide, IAutoMovieHumanLegSources.IOutput> =
      new Map();
    return {
      arm(side: AutoMovieHumanSide): IAutoMovieHumanArmSources.IOutput {
        const previous: IAutoMovieHumanArmSources.IOutput | undefined =
          arms.get(side);
        if (previous !== undefined) return previous;
        const actual: IAutoMovieHumanArmSources.IOutput =
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
      leg(side: AutoMovieHumanSide): IAutoMovieHumanLegSources.IOutput {
        const previous: IAutoMovieHumanLegSources.IOutput | undefined =
          legs.get(side);
        if (previous !== undefined) return previous;
        const actual: IAutoMovieHumanLegSources.IOutput =
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
