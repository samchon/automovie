import type {
  IAutoMovieHumanFootSource,
  IAutoMovieHumanLegSourceFamily,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanSiteRegionControls,
  IAutoMovieHumanWalkPart,
} from "@automovie/interface";

import { AutoMovieHumanFootSource } from "../foot/AutoMovieHumanFootSource";
import { AutoMovieHumanSiteRegionControls } from "../limb/AutoMovieHumanSiteRegionControls";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanLegRegion } from "./AutoMovieHumanLegRegion";
import { AutoMovieHumanLegWalk } from "./AutoMovieHumanLegWalk";

/**
 * One leg family authors its local calf/ankle law before the full proximal
 * source is requested.
 *
 * @evidence contracts/common.md#principled-implementation LegWalk's pure bone/site chart supplies a common calf-to-cap C2 scalar law, intentionally replacing whole-leg natural coupling there. Full leg and foot consume its same angle parameter, axis and qualified jets; actual parent completion remains explicit.
 * @evidence contracts/common.md#clear-and-simple-design The regional controls and the explicit pair-binding scope have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A complete-parent request cannot return the uncoupled base while completion is pending or failed; source errors are not cached as successful alternatives.
 * @evidence contracts/common.md#meaningful-documentation Distal reading does not assert successful proximal contact or a completed trunk; the final trunk publishes its returned pair to assembly.
 * @evidence contracts/performance.md#efficient-algorithms Cold ankle demand closes only calf-and-later site constraints and no thigh or upper-body constraint. Full demand prepares the remaining original controls and actual coupled work. Intermediate rows are shape laws rather than additional measurements.
 * @evidence contracts/performance.md#reuse-equivalent-work Proximal-only trial changes preserve the same immutable distal authority and therefore do not invalidate the foot's unchanged generating input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The explicit binding closure owns a single independent base and retains no trial result.
 */
export namespace AutoMovieHumanLegSourceFamily {
  /**
   * Prepare the lower regional field and return explicit base and attachment
   * operations.
   *
   * @evidence contracts/common.md#principled-implementation Builds the original bone/site chart directly, authors one common bounded calf/ankle law and passes it to full leg and regional foot consumers. The full resolver requires a genuinely published coupled result.
   * @evidence contracts/common.md#clear-and-simple-design The region, binding and completion are distinct requests.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute the base after failed completion or translate a failed parent into valid foot geometry.
   * @evidence contracts/common.md#meaningful-documentation The ankle capability qualifies only its retained interval; full-parent errors remain observable when that separate stage is requested.
   * @evidence contracts/performance.md#efficient-algorithms Local demand omits proximal tape solves; whole demand shares those already solved local tuples and the same prepared frame. No loft is prepared here.
   * @evidence contracts/performance.md#reuse-equivalent-work The final reparent and ankle owner share the base's same distal authority; a new family is required for a changed source epoch.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The regional record retains only the calf coefficients and the caller's explicit assembly request.
   */
  export function create(
    input: IAutoMovieHumanLegSourceFamily.IInput,
  ): IAutoMovieHumanLegSourceFamily.IOutput {
    const chart: IAutoMovieHumanWalkPart.ISource | string =
      AutoMovieHumanLegWalk.source(
        input.name,
        input.bones,
        input.law,
        input.gap,
      );
    if (typeof chart === "string") throw new Error(chart);
    const controls: IAutoMovieHumanSiteRegionControls.IOutput =
      AutoMovieHumanSiteRegionControls.create(chart.input, "calf");
    const distal: IAutoMovieHumanFootSource.IRegion = AutoMovieHumanLegRegion(
      controls.local,
      controls.field ?? undefined,
    );
    const ankleStation: number = chart.station(2, 1);
    const current: IAutoMovieHumanLegSourceFamily.IOutput["current"] =
      (): IAutoMovieHumanLegWalk.IDefinition => ({
        ...AutoMovieHumanSiteViewPart.fromControls(
          controls.prepare(chart.input),
        ),
        ankleStation,
        distal,
      });
    const prepareBinding: IAutoMovieHumanLegSourceFamily.IOutput["prepareBinding"] =
      () => {
        const base: IAutoMovieHumanLegWalk.IDefinition = current();
        return (definition, station) =>
          AutoMovieHumanLegWalk.reparent(base, { definition, station });
      };
    const ankle: IAutoMovieHumanLegSourceFamily.IAnkle = {
      ankleStation,
      source: AutoMovieHumanFootSource.fromRegion(
        distal,
        input.complete ??
          (() => {
            throw new Error(
              `The actual coupled ${input.name} parent was not requested`,
            );
          }),
      ),
    };
    return {
      current,
      ankle: () => ankle,
      prepareBinding,
      bind: (definition, station) => prepareBinding()(definition, station),
    };
  }
}
