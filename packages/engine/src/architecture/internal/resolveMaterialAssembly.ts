import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialLayer,
  IAutoMovieResolvedAssembly,
  IAutoMovieResolvedLayer,
  IAutoMovieValidateMaterialAssembly,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateMaterialAssembly } from "./validateMaterialAssembly";

/*
 * Place a validated build-up on the host's own signed measuring line.
 *
 * This is the step that makes a build-up a dimension rather than a list. The
 * first layer's outer face starts at IAutoMovieMaterialAssembly.offset,
 * each layer advances along the stacking axis in the declared sense, and the
 * summed thickness is the overall dimension the host must be drawn at. A caller
 * that sizes a wall from `total` and cuts an opening through it can then ask
 * assemblyOpeningReveal what the opening finishes at.
 *
 * An invalid build-up is refused here rather than resolved into numbers that
 * look usable, the same way a built environment refuses to lower.
 *
 * Positions are signed metres along the host axis. Negative sense makes a
 * positive-thickness layer advance downward; zero-thickness membranes or
 * rounded increments can have equal endpoints. `extent` orders the assembly
 * ends. `total` sums thicknesses and the overall `end` is offset plus signed
 * total, which can differ from the final accumulated layer end by rounding.
 * Failed validation throws an `Error` naming its first finding.
 * Parameter props.assembly: Layered build-up to place.
 * Parameter props.substances: Substances the layers may cite, or omitted.
 * Parameter props.host: Host dimension the layers must sum to, or omitted.
 * Returns: The placed layers, the total and the assembly's signed extent.
 */
export function resolveMaterialAssembly(
  props: IAutoMovieValidateMaterialAssembly.IProps,
): IAutoMovieResolvedAssembly {
  const validated: IAutoMovieValidation =
    validateMaterialAssembly(props);
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `material assembly "${props.assembly.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const assembly: IAutoMovieMaterialAssembly = props.assembly;
  const direction: number = assembly.sense === "positive" ? 1 : -1;
  let cursor: number = assembly.offset;
  let total: number = 0;
  const resolved: IAutoMovieResolvedLayer[] = assembly.layers.map(
    (layer: IAutoMovieMaterialLayer): IAutoMovieResolvedLayer => {
      const start: number = cursor;
      const end: number = cursor + direction * layer.thickness;
      cursor = end;
      total += layer.thickness;
      return {
        id: layer.id,
        role: layer.role,
        substance: layer.substance,
        material: layer.material,
        thickness: layer.thickness,
        start,
        end,
        center: start / 2 + end / 2,
        finish: layer.finish,
        wrapsOpening: layer.wrapsOpening,
      };
    },
  );
  const end: number = assembly.offset + direction * total;
  return {
    id: assembly.id,
    axis: assembly.axis,
    total,
    start: assembly.offset,
    end,
    extent: {
      min: Math.min(assembly.offset, end),
      max: Math.max(assembly.offset, end),
    },
    layers: resolved,
  };
}
