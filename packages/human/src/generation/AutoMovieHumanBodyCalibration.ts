import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanFeatureChain } from "../network/IAutoMovieHumanFeatureChain";
import { AutoMovieHumanBodyRegions } from "./AutoMovieHumanBodyRegions";
import { AutoMovieHumanContactSmoothing } from "./AutoMovieHumanContactSmoothing";
import { AutoMovieHumanCornerSmoothing } from "./AutoMovieHumanCornerSmoothing";
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import { AutoMovieHumanLipSmoothing } from "./AutoMovieHumanLipSmoothing";
import { AutoMovieHumanSectionLoops } from "./AutoMovieHumanSectionLoops";
import { AutoMovieHumanStationContinuity } from "./AutoMovieHumanStationContinuity";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyRegion } from "./IAutoMovieHumanBodyRegion";
import { AutoMovieHumanEarCalibration } from "./calibration/AutoMovieHumanEarCalibration";
import { AutoMovieHumanEyeCalibration } from "./calibration/AutoMovieHumanEyeCalibration";
import { AutoMovieHumanFootCalibration } from "./calibration/AutoMovieHumanFootCalibration";
import { AutoMovieHumanTorsoCalibration } from "./calibration/AutoMovieHumanTorsoCalibration";
import { AutoMovieHumanVermilionCalibration } from "./calibration/AutoMovieHumanVermilionCalibration";

/**
 * The calibration specimen's body: the union of the region calibrations
 * under `calibration/`, each owned by its own observation fitter, with
 * their trims applied, then six continuity rules on the fitted sections,
 * in order:
 *
 * 1. `AutoMovieHumanSectionLoops` smooths away the loops and spikes the
 *    fitter left inside chains (the blade at each helix root, the rims'
 *    ripples);
 * 2. `AutoMovieHumanContactSmoothing` low-passes the sections the fitter
 *    rang around contact rings (crotch, head rings, webs);
 * 3. `AutoMovieHumanLipSmoothing` low-passes the lip sections around the
 *    external vermilion boundary;
 * 4. `AutoMovieHumanCornerSmoothing` tapers the oral line and the upper-lid
 *    crease where they end, at the commissures and the lateral canthi;
 * 5. `AutoMovieHumanStationContinuity` averages layers denser than the
 *    observation noise and makes the station curvature continuous;
 * 6. `AutoMovieHumanEventJoin` moves every event child onto its parent's
 *    ring and re-slopes it into the parent's tangent plane, since
 *    independently fitted end layers crease the shared rings.
 *
 * Rules 1 to 5 repair fitted rows. A chain a region stores as key sections
 * (`networks`) is smooth by construction and skips them; only the event join
 * reaches it.
 *
 * `AutoMovieHumanBodyLaw` maps it to the calibration of any parameter set.
 */
export const AutoMovieHumanBodyCalibration: IAutoMovieHumanBodyCalibration =
  ((): IAutoMovieHumanBodyCalibration => {
    const regions: IAutoMovieHumanBodyRegion[] = [
      AutoMovieHumanTorsoCalibration,
      AutoMovieHumanFootCalibration,
      AutoMovieHumanEarCalibration,
      AutoMovieHumanEyeCalibration,
    ];
    const merged: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanBodyRegions.merge(regions);
    const generated: Map<string, IAutoMovieHumanLoftChain> = new Map(
      regions
        .flatMap((r: IAutoMovieHumanBodyRegion): string[] =>
          (r.networks ?? []).map((n: IAutoMovieHumanFeatureChain): string => n.name),
        )
        .map((name: string): [string, IAutoMovieHumanLoftChain] => [
          name,
          merged.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === name)!,
        ]),
    );
    const repaired: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanStationContinuity.apply(
        AutoMovieHumanCornerSmoothing.apply(
          AutoMovieHumanLipSmoothing.apply(
            AutoMovieHumanContactSmoothing.apply(
              AutoMovieHumanSectionLoops.apply(merged),
            ),
            AutoMovieHumanVermilionCalibration,
          ),
          AutoMovieHumanVermilionCalibration,
        ),
      );
    return AutoMovieHumanEventJoin.reconcile({
      ...repaired,
      chains: repaired.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          generated.get(c.name) ?? c,
      ),
    });
  })();
