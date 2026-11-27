import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

/*
 * A standing weight shift's checks and clock: a foot keeps its plant when its
 * solved ankle stays within `PLANT_DISTANCE` of the entry's and its rotation
 * within half a degree; the shift is reached at `duration`, released after its
 * hold and returned over `returnSeconds` when it returns.
 */
export namespace shiftStandingWeightSteps {
  /*
   * Maximum ankle drift from the displayed plant at a fit witness, metres.
   */
  export const PLANT_DISTANCE: number = 0.003;

  /*
   * Minimum absolute unit-quaternion dot product for 0.5 degrees of foot turn.
   */
  export const PLANT_TURN: number = Math.cos(Math.PI / 720);

  /*
   * Whether a solved foot stays within the plant tolerance of its entry.
   * Parameter bone: The solved foot bone's world pose.
   * Parameter entry: The entry foot's ankle and rotation.
   * Returns: Whether it keeps its plant.
   */
  export function plants(
    bone: Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">,
    entry: Pick<IAutoMovieMotionHumanEntryState.IFoot, "ankle" | "rotation">,
  ): boolean {
    const a: IAutoMovieQuaternion = bone.worldRotation;
    const b: IAutoMovieQuaternion = entry.rotation;
    return (
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(bone.worldPosition, entry.ankle)) <=
        PLANT_DISTANCE &&
      Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w) >= PLANT_TURN
    );
  }

  /*
   * The shift's clock instants.
   * Parameter seconds: The transfer's seconds.
   * Parameter hold: The hold's seconds.
   * Parameter returnSeconds: The return's seconds; none when the shift is held.
   * Returns: `shifted` at the transfer's end and, returning, `release` after
   * the hold and `returned` at the end.
   */
  export function instants(
    seconds: number,
    hold: number,
    returnSeconds?: number,
  ): IAutoMovieMotionClockInstant[] {
    return returnSeconds === undefined
      ? [{ name: "shifted", seconds }]
      : [
          { name: "shifted", seconds },
          { name: "release", seconds: seconds + hold },
          { name: "returned", seconds: seconds + hold + returnSeconds },
        ];
  }
}
