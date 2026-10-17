import {
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as S } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { AutoMovieLegFactory } from "../family/AutoMovieLegFactory";
import type { AutoMovieLegFamily } from "../family/AutoMovieLegFamily";
import type { IAutoMovieLegIdentityBridge64 as B } from "./IAutoMovieLegIdentityBridge64";
import { resolveAutoMovieLegIdentity64 } from "./resolveAutoMovieLegIdentity64";

/** Bridge one resolved public specimen into the physical leg family.
 * Each side resolves independent measurements with the same shared laws.
 * The caller supplies a matching 55-bone rest context and actual pelvis thigh
 * operators. Construction emits world-mm curves and lower-leg-owned ankle
 * P/fullJ; no source reference or saved generated network is loaded.
 *
 * @author Samchon
 */
export function createAutoMovieLegIdentityFactory64(props: {
  /** Resolved public dimensions for the same specimen as skeleton and context. */
  measurements: H;

  /** Actual complete rest skeleton; this factory does not generate another one. */
  skeleton: S;

  /** Per-side physical overrides; omitted members retain qualified resolver priors. */
  additional?: Partial<Record<"left" | "right", Partial<B.Independent>>>;
}): R.Factory & {
  /** Resolve semantic dimensions using the currently supplied actual thigh cuts. */
  resolve(
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMovieLegIdentity64>;
} {
  const input: typeof props = structuredClone(props);
  const resolve: (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ) => ReturnType<typeof resolveAutoMovieLegIdentity64> = (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMovieLegIdentity64> =>
    resolveAutoMovieLegIdentity64({ ...input, context, upstream });
  return {
    region: "legs",
    resolve,
    construct(
      context: Context,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): R.Result {
      const resolved: ReturnType<typeof resolve> = resolve(context, upstream);
      const groups: R.Result["groups"][number][] = [];
      const boundaries: R.Result["boundaries"][number][] = [];
      for (const side of ["left", "right"] as const) {
        // Resolve one side's measurements through the same bilateral kernel and
        // keep its actual family; no second equation or saved output is substituted.
        const family: AutoMovieLegFamily = new AutoMovieLegFactory(
          resolved[side].detailed,
        )
          .families(context, upstream)
          .get(side)!;
        groups.push({ part: "leg", side, primitives: family.curves(side) });
        boundaries.push({
          bone: side + "LowerLeg",
          value: family.boundary(side + ".ankle.midTube"),
        });
      }
      return { groups, boundaries };
    },
  };
}
