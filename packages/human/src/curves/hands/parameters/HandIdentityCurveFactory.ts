import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { HandCurveFactory } from "../family/HandCurveFactory";
import type { IHandCurveMeasurements as P } from "../family/IHandCurveMeasurements";
import { HandBoneGaugeContext } from "./HandBoneGaugeContext";
import { deriveHandCurveMeasurements } from "./deriveHandCurveMeasurements";

/** Generate neutral Human hands from resolved public dimensions and their matching 55-bone skeleton.
 *
 * The converter derives a semantic recipe, and the gauge adapter preserves the generated thumb opposition before actual Hand-parent placement. The legacy nativeA selector preserves supplied directions; it does not make this output an anatomical A pose. This class generates base curves and owned wrist sections, not skin or nails.
 */
export class HandIdentityCurveFactory implements R.Factory {
  /** Identifies both side groups as the hands region for assembly ownership. */
  public readonly region: string = "hands";

  /** Derived physical recipe for inspection; the retained family clones it at construction, so later mutations do not alter that family. */
  public readonly detailed: P.Bilateral;

  /** Owns the cloned recipe and common cubic construction equations. */
  private readonly family: HandCurveFactory;

  /** Derive both sides from one resolved identity/skeleton pair; incompatible lengths, landmarks or rest-chain structure throw before a family is retained. */
  public constructor(
    measurements: IAutoMovieHumanMeasurements,
    skeleton: IAutoMovieHumanSkeleton,
    options: deriveHandCurveMeasurements.Options = {},
  ) {
    this.detailed = deriveHandCurveMeasurements(
      measurements,
      skeleton,
      options,
    );
    this.family = new HandCurveFactory(this.detailed, "nativeA");
  }

  /** Construct through the explicit bone-gauge adapter and publish both wrist operators in world millimetres. Incoming sections must be empty because hands own the wrist boundaries consumed by arms. */
  public construct(
    context: HandBoneGaugeContext.Parent,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    return this.family.construct(new HandBoneGaugeContext(context), upstream);
  }
}
