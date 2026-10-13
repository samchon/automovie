import {
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialSubstance,
} from "@automovie/interface";

import { IAutoMovieAssemblyHost } from "./IAutoMovieAssemblyHost";
import { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";
import { IAutoMovieResolvedLayer } from "./IAutoMovieResolvedLayer";
import { validateAutoMovieMaterialAssembly } from "./validateAutoMovieMaterialAssembly";

/**
 * Place a validated build-up on the host's own signed measuring line.
 *
 * This is the step that makes a build-up a dimension rather than a list. The
 * first layer's outer face starts at {@link IAutoMovieMaterialAssembly.offset},
 * each layer advances along the stacking axis in the declared sense, and the
 * summed thickness is the overall dimension the host must be drawn at. A caller
 * that sizes a wall from `total` and cuts an opening through it can then ask
 * {@link autoMovieAssemblyOpeningReveal} what the opening finishes at.
 *
 * An invalid build-up is refused here rather than resolved into numbers that
 * look usable, the same way a built environment refuses to lower.
 *
 * Positions are metres on the host's `axis`: `start` and `end` of each layer
 * are signed coordinates, so with a `negative` sense `end` is below `start`,
 * while `extent` is always ordered. `total` is the sum of thicknesses and the
 * assembly's `end` is `offset` plus the signed total, which can differ from
 * the last layer's `end` by floating-point rounding. A build-up that fails
 * `validateAutoMovieMaterialAssembly` throws an `Error` naming its first
 * violation.
 */
export const resolveAutoMovieMaterialAssembly = (props: {
  /** Layered build-up to place; validated before any position is computed. */
  assembly: IAutoMovieMaterialAssembly;

  /** Substances the layers may cite; omitted skips reference resolution. */
  substances?: readonly IAutoMovieMaterialSubstance[];

  /** Host dimension the layers must sum to; omitted skips the comparison. */
  host?: IAutoMovieAssemblyHost;
}): IAutoMovieResolvedAssembly => {
  const validated = validateAutoMovieMaterialAssembly(props);
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `material assembly "${props.assembly.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const { assembly } = props;
  const direction = assembly.sense === "positive" ? 1 : -1;
  let cursor = assembly.offset;
  const resolved: IAutoMovieResolvedLayer[] = assembly.layers.map((layer) => {
    const start = cursor;
    const end = cursor + direction * layer.thickness;
    cursor = end;
    return {
      id: layer.id,
      role: layer.role,
      substance: layer.substance,
      material: layer.material,
      thickness: layer.thickness,
      start,
      end,
      center: (start + end) / 2,
      finish: layer.finish,
      wrapsOpening: layer.wrapsOpening,
    };
  });
  const total = assembly.layers.reduce(
    (sum, layer) => sum + layer.thickness,
    0,
  );
  const end = assembly.offset + direction * total;
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
};
