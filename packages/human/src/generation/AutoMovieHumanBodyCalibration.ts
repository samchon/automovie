import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanFeatureChain } from "../network/IAutoMovieHumanFeatureChain";
import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanBodyRegions } from "./AutoMovieHumanBodyRegions";
import { AutoMovieHumanContactSmoothing } from "./AutoMovieHumanContactSmoothing";
import { AutoMovieHumanCornerSmoothing } from "./AutoMovieHumanCornerSmoothing";
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import { AutoMovieHumanLipSmoothing } from "./AutoMovieHumanLipSmoothing";
import { AutoMovieHumanSectionLoops } from "./AutoMovieHumanSectionLoops";
import { AutoMovieHumanStationContinuity } from "./AutoMovieHumanStationContinuity";
import { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";

import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyRegion } from "./IAutoMovieHumanBodyRegion";
import { AutoMovieHumanBodySpecimenCalibration } from "./calibration/AutoMovieHumanBodySpecimenCalibration";
import { AutoMovieHumanEarCalibration } from "./calibration/AutoMovieHumanEarCalibration";
import { AutoMovieHumanEyeCalibration } from "./calibration/AutoMovieHumanEyeCalibration";

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
 * reaches it. The limbs are generated, so they exist for the rules only as
 * the contact sections the rules read, and are generated again from the
 * repaired trunk. These are stand-ins at f1's controls:
 * `AutoMovieHumanBodyLaw` generates them from the inputs of whoever is asked
 * for.
 *
 * `AutoMovieHumanBodyLaw` maps it to the calibration of any parameter set.
 */
export const AutoMovieHumanBodyCalibration: IAutoMovieHumanBodyCalibration =
  ((): IAutoMovieHumanBodyCalibration => {
    const regions: IAutoMovieHumanBodyRegion[] = [
      AutoMovieHumanTorsoCalibration,
      AutoMovieHumanEarCalibration,
      AutoMovieHumanEyeCalibration,
    ];
    const tapes: AutoMovieHumanLegConstruction.IInputs = {
      calf: AutoMovieHumanBodySpecimenCalibration.controls.calf!,
      knee: AutoMovieHumanBodySpecimenCalibration.controls.knee!,
      thigh: AutoMovieHumanBodySpecimenCalibration.controls.thigh!,
      hip: AutoMovieHumanBodySpecimenCalibration.controls.hip!,
      sex: AutoMovieHumanBodySpecimenCalibration.controls.masculineFeminine!,
      fat: AutoMovieHumanBodySpecimenCalibration.controls.fat!,
      muscularity: AutoMovieHumanBodySpecimenCalibration.controls.muscularity!,
      scale: 1,
    };
    const foot: AutoMovieHumanFootConstruction.IDimensions =
      AutoMovieHumanFootConstruction.expected(
        AutoMovieHumanBodySpecimenCalibration.controls.height!,
        tapes.sex,
        tapes.fat,
        tapes.muscularity,
        1,
      );
    const feet: AutoMovieHumanFootConstruction.IInputs = {
      left: foot,
      right: foot,
      fat: tapes.fat,
      muscularity: tapes.muscularity,
      scale: 1,
    };
    const controls: Record<string, number | undefined> =
      AutoMovieHumanBodySpecimenCalibration.controls;
    const hand: AutoMovieHumanArmConstruction.IHand =
      AutoMovieHumanArmConstruction.expected(
        controls.height!,
        controls.handCircumference!,
        1,
      );
    const arms: AutoMovieHumanArmConstruction.IInputs = {
      upper: controls.upperArmLength!,
      lower: controls.lowerArmLength!,
      bicep: controls.bicep!,
      elbow: controls.elbow!,
      forearm: controls.forearm!,
      wrist: controls.wrist!,
      circumference: controls.handCircumference!,
      sex: controls.masculineFeminine!,
      left: hand,
      right: hand,
      scale: 1,
    };
    const column: AutoMovieHumanTrunkConstruction.IInputs = {
      hip: controls.hip!,
      highHip: controls.highHip!,
      waist: controls.waist!,
      underbust: controls.underbust!,
      chest: controls.chest!,
      bustSpan: controls.bustSpan!,
      neckBase: controls.neckBase!,
      acrossShoulder: controls.acrossShoulder!,
      bicep: controls.bicep!,
      sex: controls.masculineFeminine!,
      scale: 1,
    };
    const crotch: AutoMovieHumanLegPrior.ICrotch =
      AutoMovieHumanLegPrior.PRIOR.crotch;
    const floor: number =
      crotch.offset +
      crotch.height * controls.height! +
      crotch.inseam * controls.inseam! +
      crotch.thigh * controls.thigh! +
      crotch.sex * controls.masculineFeminine!;
    const merged: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanLegConstruction.add(
        AutoMovieHumanFootConstruction.add(
          AutoMovieHumanArmConstruction.add(
            AutoMovieHumanTrunkConstruction.apply(
              AutoMovieHumanBodyRegions.merge(regions),
              column,
              floor,
            ),
            arms,
          ),
          feet,
        ),
        tapes,
      );
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
    return AutoMovieHumanEventJoin.reconcile(
      AutoMovieHumanLegConstruction.apply(
        AutoMovieHumanLegConstruction.stand(
          AutoMovieHumanFootConstruction.apply(
            AutoMovieHumanArmConstruction.apply(
              AutoMovieHumanTrunkConstruction.apply(
                {
                  ...repaired,
                  chains: repaired.chains.map(
                    (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
                      generated.get(c.name) ?? c,
                  ),
                },
                column,
                floor,
              ),
              arms,
            ),
            feet,
          ),
          tapes,
        ),
        tapes,
      ),
    );
  })();
