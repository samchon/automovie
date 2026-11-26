import type {
  IAutoMovieHumanFootSource,
  IAutoMovieHumanLegSourceFamily,
  IAutoMovieHumanLegWalk,
  IAutoMovieHumanSiteRegionControls,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanWalkPart,
  IAutoMovieViewPart,
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
 * @evidence contracts/common.md#clear-and-simple-design Base, latest coupled definition and ankle capability have one invocation owner instead of a preview leg or cross-request cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A complete-parent request cannot return the uncoupled base while completion is pending or failed; source errors are not cached as successful alternatives.
 * @evidence contracts/common.md#meaningful-documentation Distal reading does not assert successful proximal contact or a completed trunk; current/bind preserve the existing production assembly order.
 * @evidence contracts/performance.md#efficient-algorithms Cold ankle demand closes only calf-and-later site constraints and no thigh or upper-body constraint. Full demand prepares the remaining original controls and actual coupled work. Intermediate rows are shape laws rather than additional measurements.
 * @evidence contracts/performance.md#reuse-equivalent-work Proximal-only trial changes preserve the same immutable distal authority and therefore do not invalidate the foot's unchanged generating input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One body context owns a base, latest coupled definition and one ankle owner; replaced contexts share no result.
 */
export namespace AutoMovieHumanLegSourceFamily {
  /**
   * Own the lazy base and explicit completion without a global registry.
   *
   * @evidence contracts/common.md#principled-implementation Builds the original bone/site chart directly, authors one common bounded calf/ankle law and passes it to full leg and regional foot consumers. The full resolver requires a genuinely published coupled result.
   * @evidence contracts/common.md#clear-and-simple-design Three small demand methods close one production family's lifetime.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute the base after failed completion or translate a failed parent into valid foot geometry.
   * @evidence contracts/common.md#meaningful-documentation The ankle capability qualifies only its retained interval; full-parent errors remain observable when that separate stage is requested.
   * @evidence contracts/performance.md#efficient-algorithms Local demand omits proximal tape solves; whole demand shares those already solved local tuples and the same prepared frame. No loft is prepared here.
   * @evidence contracts/performance.md#reuse-equivalent-work The final reparent and ankle owner share the base's same distal authority; a new family is required for a changed source epoch.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps only the base, latest trial and one ankle owner for this context; no earlier trial list or process survives it.
   */
  export function create(
    input: IAutoMovieHumanLegSourceFamily.IInput,
  ): IAutoMovieHumanLegSourceFamily.IOutput {
    let initial: IAutoMovieHumanLegWalk.IDefinition | undefined;
    let coupled: IAutoMovieHumanLegWalk.IDefinition | undefined;
    let ankle: IAutoMovieHumanLegSourceFamily.IAnkle | undefined;
    let completing: boolean = false;
    let local: { value: ILocal } | { error: unknown } | undefined;
    function regional(): ILocal {
      if (local !== undefined) {
        if ("error" in local) throw local.error;
        return local.value;
      }
      try {
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
        const distal: IAutoMovieHumanFootSource.IRegion =
          AutoMovieHumanLegRegion.fromControls(controls.local);
        const value: ILocal = { chart, controls, distal };
        local = { value };
        return value;
      } catch (error: unknown) {
        local = { error };
        throw error;
      }
    }
    function base(): IAutoMovieHumanLegWalk.IDefinition {
      if (initial !== undefined) return initial;
      const region: ILocal = regional();
      initial = {
        ...AutoMovieHumanSiteViewPart.fromControls(
          region.controls.prepare(region.chart.input),
        ),
        ankleStation: region.chart.station(2, 1),
        distal: region.distal,
      };
      return initial;
    }
    function full(): IAutoMovieViewPart {
      if (completing)
        throw new Error(
          `The actual coupled ${input.name} completion was reentered before publication`,
        );
      completing = true;
      try {
        input.complete?.();
        if (coupled === undefined || coupled.part === null)
          throw new Error(
            `The actual coupled ${input.name} parent is unresolved: ${JSON.stringify(coupled?.diagnostics ?? [])}`,
          );
        return coupled.part;
      } finally {
        completing = false;
      }
    }
    return {
      current: (): IAutoMovieHumanLegWalk.IDefinition => coupled ?? base(),
      ankle(): IAutoMovieHumanLegSourceFamily.IAnkle {
        if (ankle !== undefined) return ankle;
        const region: ILocal = regional();
        ankle = {
          ankleStation: region.chart.station(2, 1),
          source: AutoMovieHumanFootSource.fromRegion(region.distal, full),
        };
        return ankle;
      },
      bind(
        parent: IAutoMovieHumanSourceDefinition,
        station: number,
      ): IAutoMovieHumanLegWalk.IDefinition {
        coupled = AutoMovieHumanLegWalk.reparent(base(), {
          definition: parent,
          station,
        });
        return coupled;
      },
    };
  }
}

/**
 * One actual bone chart and its independently prepared calf/ankle scalar
 * family.
 */
interface ILocal {
  /** Original unsolved site inputs and bone/share station map. */
  chart: IAutoMovieHumanWalkPart.ISource;

  /**
   * Shared local C2 coefficients, independent site constraints and full-source
   * connection.
   */
  controls: IAutoMovieHumanSiteRegionControls.IOutput;

  /**
   * Same bounded contact authority retained by the leg and foot, without
   * full-parent demand.
   */
  distal: IAutoMovieHumanFootSource.IRegion;
}
