import {
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";

import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";

/**
 * Place the local AP radius on the world back source in their common
 * root/angle parameter: X=back+radius, anterior=back+2radius. World Y stays
 * physical station. Shared scalar values and both jets at the union of knots
 * give piecewise-polynomial addition, not another fit in physical height.
 * Radial shape, named points and pole values stay owned by their inputs;
 * binary64 copying does not certify final loft fidelity or a smooth cap.
 *
 * @evidence contracts/common.md#principled-implementation Adds piecewise quintic scalar owners in their identical engine parameter. The union of their knots and both jets determines the sum on every common span; the independent physical-height coordinate remains an identity. Binary64 replay is checked, not interval-certified.
 * @evidence contracts/common.md#clear-and-simple-design Owns only world placement of the existing local AP radius. TrunkViewPart retains anatomical sites, fullness and radial shape; the engine retains scalar preparation and evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no reference residual, fixture selector, substituted curve evaluator or endpoint recentering. Invalid shared spans return the original source failure rather than a fallback axis.
 * @evidence contracts/common.md#meaningful-documentation States fixed chart directions, millimetre-to-metre ownership, common-parameter jets, pole defaults and the limits of the polynomial identity.
 * @evidence contracts/performance.md#efficient-algorithms For n combined input knots, prepares a fixed number of scalar sources, sorts their union and scans those small authored lists when assigning identities. These scans cost O(n squared) time and O(n) retained output; no loft or surface is sampled.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned axis declaration is shared by original source observation and the production tree through SiteViewPart. No mutable global cache or equivalence inference is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each call owns its temporary prepared curves and returned axis/back record. Temporaries become unreachable on return; the caller owns the result, with no process, renderer or external handle.
 */
export namespace AutoMovieHumanTrunkAxis {
  /**
   * One declaration shared by the original part and production tree.
   *
   * @evidence contracts/common.md#principled-implementation Pairs the actual metre axis with the calibration-mm world-back source used to derive it; neither record asserts final surface fidelity.
   * @evidence contracts/common.md#clear-and-simple-design Holds the two outputs of one placement operation without a second geometry owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no sampled replacement, person selector or fallback result.
   * @evidence contracts/common.md#meaningful-documentation Both fields document units, frame and source ownership.
   * @evidence contracts/performance.md#efficient-algorithms The record stores references to the two O(n)-sized declarations and performs no computation itself.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers share this call's axis declaration rather than reconstructing placement.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains these plain data until its source result is released; there is no cache or external resource.
   */
  export interface IResult {
    /** Fixed +X/+Z level planes; coordinate lengths and endpoint stations are metres. */
    axis: IAutoMovieConstructionParallelAxis;
    /** Actual world-back declaration, calibration mm, in the radial source parameter. */
    back: IAutoMovieViewPart.IOutline;
  }

  /**
   * Add actual source values and parameter jets without recentering their
   * first values. At a closure, an unspecified back jet is minus the radial
   * jet so the axis has zero parameter jets. Back values and explicit jets
   * must already be authored for the radius-selected parameter. This factory
   * replaces any input back.parameter; it does not reparameterize another
   * existing scalar curve or transfer jets from a different parameter.
   *
   * @param back World-X knots, calibration mm, spanning the same endpoints, with jets in the selected radial parameter's normalized span. The current production caller supplies no parameter or authored back jets.
   * @param radius Actual positive AP outline, including bounds and pole jets.
   * @param ends Actual radial closing endpoints, calibration mm.
   * @returns Shared metre axis and back declaration, or the source failure.
   *
   * @evidence contracts/common.md#principled-implementation Interprets supplied back knots/jets in the radius-selected parameter, reads both engine-prepared sources, merges their partitions and adds both jets with the same normalized span. It does not preserve an independently parameterized back curve. Y has two physical-station endpoints; missing pole back jets cancel radial jets while explicit jets keep their authored meaning only in the selected parameter.
   * @evidence contracts/common.md#clear-and-simple-design Returns one placement record or a source failure string. The existing ConstructionView adapter performs the single unit conversion, and SiteViewPart supplies loft/tree consumption.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sample, fit, clamp or move named values to make an axis pass. Shared station span and a positive finite parameter span are explicit admissions; scalar failures propagate.
   * @evidence contracts/common.md#meaningful-documentation Documents the polynomial-addition premise, endpoint jet convention, units, failure return and lack of final G2 certification; the analytic coordinate test exercises the same public axis path.
   * @evidence contracts/performance.md#efficient-algorithms Uses a fixed number of preparations plus a sorted union of n knots; identity lookup scans give O(n squared) time and O(n) space for the small authored trunk lists. No full Human or mesh is constructed.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepares each source once per call and reads those same preparations at every union knot. The returned axis is the actual observer/tree declaration, with no persistent cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary preparations belong to this synchronous call and leave scope on success or failure. Returned plain declarations belong to the caller; no host or task is acquired.
   */
  export function create(
    back: IAutoMovieViewPart.IOutline,
    radius: IAutoMovieViewPart.IOutline,
    ends: AutoMovieViewOutline.IEnds,
  ): IResult | string {
    const radial:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      radius,
      ends,
    );
    if ("detail" in radial) return radial.detail;
    if (
      back.knots[0]?.station !== radial.domain[0] ||
      back.knots.at(-1)?.station !== radial.domain[1]
    )
      return "Trunk back and radius need the same declared station span";
    const span: number =
      AutoMovieViewParameter.at(radial.parameter, radial.domain[1]) -
      AutoMovieViewParameter.at(radial.parameter, radial.domain[0]);
    if (!(Number.isFinite(span) && span > 0))
      return "Trunk source parameter has no positive finite span";
    const world: IAutoMovieViewPart.IOutline = {
      ...back,
      parameter: radial.parameter,
      knots: back.knots.map(
        (knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
          ...knot,
        }),
      ),
    };
    for (const end of ["bottom", "top"] as const) {
      const station: number | undefined = ends[end];
      if (station === undefined) continue;
      const knot: IAutoMovieViewPart.IKnot | undefined = world.knots.find(
        (k: IAutoMovieViewPart.IKnot): boolean => k.station === station,
      );
      const reading: AutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(radial, station);
      if (knot === undefined || typeof reading === "string")
        return typeof reading === "string"
          ? reading
          : "Trunk back misses its radial closing station";
      if (knot.jet === undefined)
        knot.jet = {
          first: -reading.parameterJet[0] * span,
          second: -reading.parameterJet[1] * span * span,
        };
    }
    const prepared:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(world);
    if ("detail" in prepared) return prepared.detail;
    const stations: number[] = [
      ...new Set(
        [...world.knots, ...radial.knots].map(
          (k: IAutoMovieViewPart.IKnot): number => k.station,
        ),
      ),
    ].sort((a: number, b: number): number => a - b);
    const centre: IAutoMovieViewPart.IOutline = {
      parameter: radial.parameter,
      knots: [],
    };
    for (const station of stations) {
      const a: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
        prepared,
        station,
      );
      const b: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
        radial,
        station,
      );
      if (typeof a === "string") return a;
      if (typeof b === "string") return b;
      const site: string =
        world.knots.find(
          (k: IAutoMovieViewPart.IKnot): boolean => k.station === station,
        )?.site ??
        radial.knots.find(
          (k: IAutoMovieViewPart.IKnot): boolean => k.station === station,
        )!.site;
      centre.knots.push({
        site,
        station,
        value: a.value + b.value,
        jet: {
          first: (a.parameterJet[0] + b.parameterJet[0]) * span,
          second: (a.parameterJet[1] + b.parameterJet[1]) * span * span,
        },
      });
    }
    const identity: IAutoMovieViewPart.IOutline = {
      knots: radial.domain.map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: "height",
          station,
          value: station,
        }),
      ),
    };
    const zero: IAutoMovieViewPart.IOutline = {
      knots: radial.domain.map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: "median",
          station,
          value: 0,
        }),
      ),
    };
    return {
      back: world,
      axis: {
        type: "parallel",
        origin: {
          x: AutoMovieHumanConstructionView.length(centre),
          y: AutoMovieHumanConstructionView.length(identity),
          z: AutoMovieHumanConstructionView.length(zero),
        },
        u: { x: 1, y: 0, z: 0 },
        v: { x: 0, y: 0, z: 1 },
      },
    };
  }
}
