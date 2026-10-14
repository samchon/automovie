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
 * Positions are signed metres along the host axis. Negative sense makes a positive-thickness layer advance downward; zero-thickness membranes or rounded increments can have equal endpoints. `extent` orders the assembly ends. `total` sums thicknesses and the overall `end` is offset plus signed total, which can differ from the final accumulated layer end by rounding. Failed validation throws an `Error` naming its first finding.
 *
 * @param props.assembly Layered build-up to place.
 * @param props.substances Substances the layers may cite, or omitted.
 * @param props.host Host dimension the layers must sum to, or omitted.
 * @returns The placed layers, the total and the assembly's signed extent.
 *
 * @evidence contracts/common.md#principled-implementation Accumulates binary64 signed layer endpoints and unsigned total thickness after validation refuses non-finite derived sums/endpoints. Each start reuses the previous computed end; half-start plus half-end computes the centre without overflowing their sum. The separately accumulated overall end can differ from the final layer end by rounding.
 * @evidence contracts/common.md#clear-and-simple-design Resolution is separate from validation so a caller can judge a build-up without placing it, and this function delegates every rule to `validateAutoMovieMaterialAssembly` instead of re-checking any.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No layer, role or sense is special-cased beyond the sign the contract defines, and an invalid build-up throws rather than being clamped into usable numbers.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the placement rule, where positions start, what `total` means for the host, the units and signed coordinates, the ordered extent, the rounding caveat, and the failure effect.
 * @evidence contracts/performance.md#efficient-algorithms Pays O(L + S) validation for L layers and S supplied substance records, then O(L) placement. Substance-index construction is not omitted from the layer-count estimate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one build-up that coordinates no work across calls; callers that place the same build-up repeatedly own any caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned record, one resolved layer per input layer, which the caller owns; nothing else outlives the call.
 */
export const resolveAutoMovieMaterialAssembly: (props: {
  /** Layered build-up to place; validated before any position is computed. */ assembly: IAutoMovieMaterialAssembly;
  /** Substances the layers may cite; omitted skips reference resolution. */ substances?: readonly IAutoMovieMaterialSubstance[];
  /** Host dimension the layers must sum to; omitted skips the comparison. */ host?: IAutoMovieAssemblyHost;
}) => IAutoMovieResolvedAssembly = (props: {
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
};
