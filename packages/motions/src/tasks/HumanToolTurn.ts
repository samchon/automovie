import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A held tool's working pose turned about a fixed world axis through a
 * pivot (`useTool`): a hammer's head raised about the grip, a screwdriver
 * turned about its own line through the work point.
 *
 * @param pose The working pose: the grip's world point, metres, and the hand's world rotation.
 * @param axis The world axis the pose turns about; need not be unit length.
 * @param about The world point the axis passes through, metres.
 * @returns For a turn in degrees (right-handed about `axis`), the turned grip and hand rotation, fresh records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is turned, the frames and units of every input and the turn's sense.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid rotation about a line: the grip goes to `about + q (grip - about)` and the hand's rotation to `q r`, with `q` the axis-angle quaternion, so the tool turns with the hand as one body.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The axis is prepared once; each turn is one quaternion, one rotated offset and one product.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pose and the pivot are read at each call, so the turn is always of the pose the caller holds.
 * @evidence contracts/development/implementation.md#efficient-algorithms The axis's normalisation is done once for every turn (`Quaternion.prepareAxisAngle`); each turn costs constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each turn is its own angle's; nothing is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds the pose, the axis and the pivot until the plan that owns it is dropped; each result is fresh.
 */
export function HumanToolTurn(
  pose: { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  axis: IAutoMovieVector3,
  about: IAutoMovieVector3,
): (degrees: number) => { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } {
  const turning: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle(axis);
  return (degrees: number): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
    const turn: IAutoMovieQuaternion = turning(degrees);
    const orbit: IAutoMovieVector3 = Vector3.subtract(pose.grip, about);
    return {
      grip: Vector3.add(about, Quaternion.rotateVector(turn, orbit)),
      rotation: Quaternion.multiply(turn, pose.rotation),
    };
  };
}
