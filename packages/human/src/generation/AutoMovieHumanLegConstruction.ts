import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanCalibrationBone,
  IAutoMovieHumanLegConstruction,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanLegChain } from "./AutoMovieHumanLegChain";
import { AutoMovieHumanLegStand } from "./AutoMovieHumanLegStand";

/**
 * Both legs generated on their own bones, from the ankle ring, the crotch
 * ring, the calf, knee, thigh and hip tapes and the masculine-feminine
 * control, by one construction in the left leg's frame and a reflection.
 *
 * This file only composes. The foot places the ankle ring, the trunk places
 * the crotch ring, and the skeleton places the hip, the knee and the ankle
 * before any limb; the leg starts on the one ring and ends on the other. Each
 * rule lives in its own piece under `leg/`:
 *
 * - {@link AutoMovieHumanLegBones}, {@link AutoMovieHumanLegCrotchHeight} and
 *   {@link AutoMovieHumanLegStations}: the joints, the crotch height and the
 *   stations, from the inputs at their published definitions;
 * - {@link AutoMovieHumanLegAxis}: the section planes along the bones;
 * - {@link AutoMovieHumanLegLaw}: the fitted section law (until the span pieces
 *   replace it) and {@link AutoMovieHumanLegSection}, a station's section;
 * - {@link AutoMovieHumanLegAnkleSeam}: the foot's ring, read as the leg's
 *   start (owner: the foot);
 * - {@link AutoMovieHumanLegCrotchRoot} and {@link AutoMovieHumanLegCrotchFillet}:
 *   the trunk's ring with its jet and the fold's rounded corners (owner: the
 *   trunk), joined to the leg's own section by the root strip
 *   (`AutoMovieHumanLimbRootStrip`) the leg chain composes;
 * - {@link AutoMovieHumanLegChain} and {@link AutoMovieHumanLegReflection}: the
 *   chain `leg.<side>` and the right side as the left's reflection;
 * - {@link AutoMovieHumanLegStand}: the feet moved under the stance.
 */
export namespace AutoMovieHumanLegConstruction {
  /**
   * Calibration whose legs are generated from its own foot and trunk.
   *
   * @param calibration Calibration holding `trunk`, `foot.*` and leg chains, whose rows are replaced; not modified.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the legs are lofted on.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanLegConstruction.IInputs,
    skeleton: readonly IAutoMovieHumanCalibrationBone[],
  ): IAutoMovieHumanBodyCalibration {
    // The body law's shared list: a leg records where it degrades.
    const found: IAutoMovieLoftContract.IDiagnostic[] =
      calibration.diagnostics ?? [];
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieLoftChain): IAutoMovieLoftChain =>
          c.name === "leg.left"
            ? AutoMovieHumanLegChain.of(
                calibration,
                "left",
                inputs,
                skeleton,
                found,
              )
            : c.name === "leg.right"
              ? AutoMovieHumanLegChain.of(
                  calibration,
                  "right",
                  inputs,
                  skeleton,
                  found,
                )
              : c,
      ),
    };
  }

  /**
   * Calibration with the feet moved rigidly under the stance.
   *
   * @param calibration Calibration holding the foot family and trunk; not modified.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton: each foot stands under its ankle. Absent, the stance is read from the prior's line here.
   */
  export function stand(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanLegConstruction.IInputs,
    skeleton?: readonly IAutoMovieHumanCalibrationBone[],
  ): IAutoMovieHumanBodyCalibration {
    return AutoMovieHumanLegStand.of(calibration, inputs, skeleton);
  }

  /**
   * Calibration with both legs added, for a body that holds none.
   *
   * @param calibration Calibration holding `trunk` and the feet, stood.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the legs are lofted on.
   */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanLegConstruction.IInputs,
    skeleton: readonly IAutoMovieHumanCalibrationBone[],
  ): IAutoMovieHumanBodyCalibration {
    // The body law's shared list: a leg records where it degrades.
    const found: IAutoMovieLoftContract.IDiagnostic[] =
      calibration.diagnostics ?? [];
    const chains: IAutoMovieLoftChain[] = [
      AutoMovieHumanLegChain.of(calibration, "right", inputs, skeleton, found),
      AutoMovieHumanLegChain.of(calibration, "left", inputs, skeleton, found),
    ];
    return {
      ...calibration,
      chains: [...calibration.chains, ...chains],
    };
  }
}
