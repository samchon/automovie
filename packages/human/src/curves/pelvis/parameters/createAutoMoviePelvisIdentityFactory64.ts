import {
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as S } from "../../../skeleton/IAutoMovieHumanSkeleton";
import { createPelvisCurveFactory } from "../family/createPelvisCurveFactory";
import type { IAutoMoviePelvisIdentityBridge64 as B } from "./IAutoMoviePelvisIdentityBridge64";
import { resolveAutoMoviePelvisIdentity64 } from "./resolveAutoMoviePelvisIdentity64";

/** Capture an owned clone of one public specimen and optional physical observations. Resolve against the current parent context and upstream waist on each call, then invoke the external R6b generator; no geometry cache or saved network is shared. This conventional public form has no inherited native-reference acceptance, and the V17 rational interior is a separate owner.
 *
 * @author Samchon
 */
export function createAutoMoviePelvisIdentityFactory64(props: {
  /** Named physical measurement input resolved before generation; no generated curve or reference control table is an input.
   */
  measurements: H;

  /** Actual 55-bone specimen in millimetres; its hips and upper-leg origins own placement.
   */
  skeleton: S;

  /** Optional independent physical observations; omitted fields use the resolver's explicit conventions and invalid supplied values reject.
   */
  additional?: Partial<B.Independent>;
}): {
  /** Regional dispatch identifier; this factory publishes pelvis curves.
   */
  region: string;

  /** Resolve physical station parameters from this specimen and current upstream waist without generating an independent saved network.
   */
  resolve(
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMoviePelvisIdentity64>;

  /** Generate the current family from the actual parent context and upstream waist; unsupported parent rotation or vertical side placement rejects.
   */
  construct(
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<ReturnType<typeof createPelvisCurveFactory>["construct"]>;
} {
  const input: typeof props = structuredClone(props);
  const resolve: (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ) => ReturnType<typeof resolveAutoMoviePelvisIdentity64> = (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMoviePelvisIdentity64> =>
    resolveAutoMoviePelvisIdentity64({ ...input, context, upstream });
  return {
    region: "pelvis",
    resolve,

    /** Resolve this owned specimen against the current waist, then construct
     * external R6b curves and complete physical-mm thigh operators. Resolution
     * and parent-domain failures propagate before a result is returned.
     */
    construct(
      context: Context,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): ReturnType<ReturnType<typeof createPelvisCurveFactory>["construct"]> {
      const resolved: ReturnType<typeof resolve> = resolve(context, upstream);
      return createPelvisCurveFactory({
        measurements: resolved.measurements,
        nativeBoneOriginsMm: resolved.nativeBoneOriginsMm,
        epoch: "external-r6b",
        waistId: "waist.midTube",
        thighIds: { left: "left.thigh.midTube", right: "right.thigh.midTube" },
        bones: {
          construction: "hips",
          left: "leftUpperLeg",
          right: "rightUpperLeg",
        },
      }).construct(context, upstream);
    },
  };
}
