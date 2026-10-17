import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { createAutoMovieFeetCurveFactory64 } from "../family/createAutoMovieFeetCurveFactory64";
import type { IAutoMovieFootIdentityBridge64 as I } from "./IAutoMovieFootIdentityBridge64";
import { resolveAutoMovieFootIdentity64 } from "./resolveAutoMovieFootIdentity64";

/**
 * Bind a copied public specimen and optional physical foot measurements to the family.
 *
 * The caller resolves measurements and its 55-bone skeleton once. Each build then
 * queries the current context and actual leg-owned ankles, so parent changes carry
 * the foot rather than translating saved output controls. Semantic inputs are
 * cloned on entry; current upstream geometry is consumed without being rewritten.
 * Invalid recipes or incompatible upstream placement throw during resolution/build.
 */
export function createAutoMovieIdentityFootFactory64(props: {
  /** Measurements of the same public identity used to generate skeleton. */
  measurements: IAutoMovieHumanMeasurements;

  /** Actual shared rest skeleton; no regional skeleton is generated here. */
  skeleton: IAutoMovieHumanSkeleton;

  /** Independent side measurements; omitted fields use declared geometric rules. */
  additional?: Partial<Record<"left" | "right", Partial<I.Independent>>>;

  /** Optional instance prefix for the canonical ankle IDs, followed by a colon. */
  namespace?: string;
}): R.Factory & {
  /** Inspect the same semantic recipe that construct resolves from current parents. */
  resolve(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMovieFootIdentity64>;
} {
  const inputs: typeof props = structuredClone(props);
  function resolve(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMovieFootIdentity64> {
    return resolveAutoMovieFootIdentity64({ ...inputs, context, upstream });
  }
  return {
    region: "feet",
    resolve,
    construct(
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): R.Result {
      const dimensions: ReturnType<typeof resolve> = resolve(context, upstream);
      return createAutoMovieFeetCurveFactory64(dimensions.parameters).construct(
        context,
        upstream,
      );
    },
  };
}
