import { type IAutoMovieAssemblyReveal, type IAutoMovieAssemblyOpeningReveal, type IAutoMovieAssemblyJunction, type IAutoMovieMatchAssemblyJunction, type IAutoMovieResolvedAssembly, type IAutoMovieValidateMaterialAssembly } from "@automovie/interface";
import { assemblyOpeningReveal as assemblyOpeningRevealImplementation } from "./internal/assemblyOpeningReveal";
import { matchAssemblyJunction as matchAssemblyJunctionImplementation } from "./internal/matchAssemblyJunction";
import { resolveMaterialAssembly as resolveMaterialAssemblyImplementation } from "./internal/resolveMaterialAssembly";

/** Public operations for Auto Movie Engine Architecture Assembly. */
export namespace AutoMovieEngineArchitectureAssembly {
  /**
   * Report what a build-up finishes an opening at.
   *
   * An opening is cut at a structural size and used at a finished one. Every
   * layer that continues around the jamb lines both sides of the opening, so the
   * clear width loses twice the wrapping thickness and the clear height the same;
   * the depth each lining reaches is the run of wrapping layers measured inward
   * from that face, and whatever the two linings do not reach is bare jamb.
   *
   * A lining that consumes the opening is refused rather than reported as a
   * negative clear dimension. Testing "not above zero" also refuses a computed
   * `NaN`. The resolved assembly is assumed to carry finite nonnegative
   * thicknesses, including zero-thickness membranes; arbitrary forged
   * negative-infinite layers are outside that premise.
   *
   * Only wrapping layers reachable from a face line the jamb. A layer that claims
   * to wrap from behind one that stops there cannot turn the corner, which is why
   * validation refuses it; measuring the runs rather than the flags means it also
   * cannot narrow an opening here if one ever reaches this function unvalidated.
   * When every layer wraps, the whole build-up is the first face's run and the
   * last face's run is empty.
   *
   * Throws when either structural dimension is not a finite number above zero,
   * and when the lining leaves no positive clear width or height.
   */
  export function AssemblyOpeningReveal(props: IAutoMovieAssemblyOpeningReveal.IProps): IAutoMovieAssemblyReveal {
    return assemblyOpeningRevealImplementation(props);
  }

  /**
   * Report which construction roles survive a junction between two build-ups.
   *
   * Two walls meeting at a corner are two build-ups on one measuring line, and
   * the question a junction asks is not whether they look alike but whether each
   * role reaches across. A role both sides declare is continuous, and the signed
   * spans say whether it actually lines up or merely exists on both sides: an
   * insulation layer that ends where the next one begins is a thermal bridge, and
   * a barrier that stops at a corner is a leak.
   *
   * Roles are matched as declared: the caller decides what a role name means, and
   * a build-up that spends the same role over several layers has those layers
   * summed and spanned together rather than silently reduced to the first one.
   *
   * Spans are compared as numbers on one measuring line, so both build-ups must
   * have been resolved against the same axis and origin; nothing here checks
   * that, because a resolved assembly's axis is host-local and cannot prove two
   * hosts share a line. `overlap` is negative when the spans are apart, and a
   * role is `aligned` when the gap is no larger than `tolerance`. Continuous
   * roles follow the left side's first-appearance order; broken roles list the
   * left side's first, then the right side's. A negative or non-finite tolerance
   * throws an `Error`.
   *
   * @param props.left Build-up on one side of the junction, resolved on the
   *   shared line.
   * @param props.right Build-up on the other side, resolved on the same line as
   *   `left`.
   * @param props.tolerance Greatest metre gap between two spans still counted as
   *   aligned.
   * @returns The continuous roles with their spans and overlap, and the roles
   *   only one side carries.
   */
  export function matchAutoMovieAssemblyJunction(props: IAutoMovieMatchAssemblyJunction.IProps): IAutoMovieAssemblyJunction {
    return matchAssemblyJunctionImplementation(props);
  }

  /**
   * Place a validated build-up on the host's own signed measuring line.
   *
   * This is the step that makes a build-up a dimension rather than a list. The
   * first layer's outer face starts at {@link IAutoMovieMaterialAssembly.offset},
   * each layer advances along the stacking axis in the declared sense, and the
   * summed thickness is the overall dimension the host must be drawn at. A caller
   * that sizes a wall from `total` and cuts an opening through it can then ask
   * {@link assemblyOpeningReveal} what the opening finishes at.
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
   *
   * @param props.assembly Layered build-up to place.
   * @param props.substances Substances the layers may cite, or omitted.
   * @param props.host Host dimension the layers must sum to, or omitted.
   * @returns The placed layers, the total and the assembly's signed extent.
   */
  export function resolveAutoMovieMaterialAssembly(props: IAutoMovieValidateMaterialAssembly.IProps): IAutoMovieResolvedAssembly {
    return resolveMaterialAssemblyImplementation(props);
  }
}
