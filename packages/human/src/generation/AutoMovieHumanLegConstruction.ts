import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegChain } from "./leg/AutoMovieHumanLegChain";
import { AutoMovieHumanLegStand } from "./leg/AutoMovieHumanLegStand";

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
 * - {@link AutoMovieHumanLegCrotchRoot}, {@link AutoMovieHumanLegCrotchFillet}
 *   and {@link AutoMovieHumanLegCrotchSlope}: the trunk's ring, the fold's
 *   rounded corners and the carried slope (owner: the trunk);
 * - {@link AutoMovieHumanLegChain} and {@link AutoMovieHumanLegReflection}: the
 *   chain `leg.<side>` and the right side as the left's reflection;
 * - {@link AutoMovieHumanLegStand}: the feet moved under the stance.
 */
export namespace AutoMovieHumanLegConstruction {
  /** Tape measures a leg reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Calf tape. */
    calf: number;

    /** Knee tape. */
    knee: number;

    /** Thigh tape. */
    thigh: number;

    /** Hip tape, which spreads the legs. */
    hip: number;

    /** Masculine-feminine control, which brings the knees in as it rises. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /**
     * Gluteal furrow height, the gluteal fold's lowest point over the floor
     * (ANSUR 1988), in calibration millimetres: the thigh tape's station (ISO
     * 8559-1 5.3.20, just below the fold) and the infragluteal fold's centre.
     * Absent, both stand at their declared places on the thigh.
     */
    furrow?: number;
  }

  /**
   * Calibration whose legs are generated from its own foot and trunk.
   *
   * @param calibration Calibration holding `trunk`, `foot.*` and leg chains, whose rows are replaced; not modified.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the legs are lofted on.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    // The body law's shared list: a leg records where it degrades.
    const found: AutoMovieHumanLoftContract.IDiagnostic[] = calibration.diagnostics ?? [];
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          c.name === "leg.left"
            ? AutoMovieHumanLegChain.of(calibration, "left", inputs, skeleton, found)
            : c.name === "leg.right"
              ? AutoMovieHumanLegChain.of(calibration, "right", inputs, skeleton, found)
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
    inputs: IInputs,
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
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
    inputs: IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    // The body law's shared list: a leg records where it degrades.
    const found: AutoMovieHumanLoftContract.IDiagnostic[] = calibration.diagnostics ?? [];
    const chains: IAutoMovieHumanLoftChain[] = [
      AutoMovieHumanLegChain.of(calibration, "right", inputs, skeleton, found),
      AutoMovieHumanLegChain.of(calibration, "left", inputs, skeleton, found),
    ];
    return {
      ...calibration,
      chains: [...calibration.chains, ...chains],
    };
  }
}
