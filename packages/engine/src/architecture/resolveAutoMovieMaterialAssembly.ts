import {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialLayer,
  IAutoMovieMaterialSubstance,
  IAutoMovieValidation,
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
 * {@link validateAutoMovieMaterialAssembly} throws an `Error` naming its first
 * violation.
 *
 * @param props.assembly Layered build-up to place.
 * @param props.substances Substances the layers may cite, or omitted.
 * @param props.host Host dimension the layers must sum to, or omitted.
 * @returns The placed layers, the total and the assembly's signed extent.
 *
 * @evidence contracts/common.md#principled-implementation A running cursor along one signed axis is a prefix sum of the thicknesses, so each layer's faces are exact consecutive positions; `total` is summed separately so it does not inherit the cursor's sign, and the rounding difference this allows between `end` and the last layer is stated.
 * @evidence contracts/common.md#clear-and-simple-design Resolution is separate from validation so a caller can judge a build-up without placing it, and this function delegates every rule to `validateAutoMovieMaterialAssembly` instead of re-checking any.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No layer, role or sense is special-cased beyond the sign the contract defines, and an invalid build-up throws rather than being clamped into usable numbers.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the placement rule, where positions start, what `total` means for the host, the units and signed coordinates, the ordered extent, the rounding caveat, and the failure effect.
 * @evidence contracts/performance.md#efficient-algorithms One validation pass and one placement pass, both linear in the layer count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one build-up that coordinates no work across calls; callers that place the same build-up repeatedly own any caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned record, one resolved layer per input layer, which the caller owns; nothing else outlives the call.
 */
export const resolveAutoMovieMaterialAssembly = (props: {
  /** Layered build-up to place; validated before any position is computed. */
  assembly: IAutoMovieMaterialAssembly;

  /** Substances the layers may cite; omitted skips reference resolution. */
  substances?: readonly IAutoMovieMaterialSubstance[];

  /** Host dimension the layers must sum to; omitted skips the comparison. */
  host?: IAutoMovieAssemblyHost;
}): IAutoMovieResolvedAssembly => {
  const validated: IAutoMovieValidation =
    validateAutoMovieMaterialAssembly(props);
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `material assembly "${props.assembly.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const { assembly } = props;
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
        center: (start + end) / 2,
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
};
