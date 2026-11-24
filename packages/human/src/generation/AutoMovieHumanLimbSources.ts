import type {
  AutoMovieHumanSide,
  IAutoMovieHumanArmSources,
  IAutoMovieHumanLegSources,
  IAutoMovieHumanLimbSources,
} from "@automovie/interface";

import { AutoMovieHumanArmSources } from "./arm/AutoMovieHumanArmSources";
import { AutoMovieHumanFootInterim } from "./foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanLegSources } from "./leg/AutoMovieHumanLegSources";

/**
 * Invocation-owned independent limb factories, shared by selected originals and
 * later tree assembly.
 */
export namespace AutoMovieHumanLimbSources {
  /**
   * Enumerate authored source names without preparing a rest pose, curve,
   * constraint or tree.
   */
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

  /** Prepare the requested family from this invocation's resolved inputs. */
  export function create(
    input: IAutoMovieHumanLimbSources.IInput,
  ): IAutoMovieHumanLimbSources.IOutput {
    return {
      arm(side: AutoMovieHumanSide): IAutoMovieHumanArmSources.IOutput {
        return AutoMovieHumanArmSources.create({
          side,
          rest: input.rest.arm(side),
          arms: input.arms,
          measures: input.measures,
          scale: input.scale,
        });
      },
      leg(side: AutoMovieHumanSide): IAutoMovieHumanLegSources.IOutput {
        const complete: IAutoMovieHumanLimbSources.IInput["completeLeg"] =
          input.completeLeg;
        return AutoMovieHumanLegSources.create({
          side,
          rest: input.rest.leg(side),
          feet: input.feet,
          measures: input.measures,
          scale: input.scale,
          crotch: input.crotch,
          diagnostics: input.diagnostics,
          completeLeg:
            complete === undefined ? undefined : () => complete(side),
        });
      },
    };
  }
}
