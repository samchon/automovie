import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A shot's muzzle rise: the held hand turns about the horizontal axis square to
 * the bore (`bore × up`, carrying the muzzle up), or about the tool's own side
 * (`axis × edge` in the hand) when the bore stands vertical, by `rise` degrees
 * over the shot's progress.
 *
 * @param rotation The held hand's rotation at the shot.
 * @param axis The tool's bore axis in the hand.
 * @param edge The tool's edge direction in the hand.
 * @param rise The muzzle's rise, degrees.
 * @returns The bore, the rise's axis and the hand's rotation at a progress.
 */
export function humanWeaponFireRecoil(
  rotation: IAutoMovieQuaternion,
  axis: IAutoMovieVector3,
  edge: IAutoMovieVector3,
  rise: number,
): humanWeaponFireRecoil.IRecoil {
  const bore: IAutoMovieVector3 = Quaternion.rotateVector(rotation, axis);
  const across: IAutoMovieVector3 = Vector3.cross(bore, { x: 0, y: 1, z: 0 });
  const about: IAutoMovieVector3 =
    Vector3.length(across) < 1e-6
      ? Quaternion.rotateVector(rotation, Vector3.cross(axis, edge))
      : Vector3.normalize(across);
  return {
    bore,
    about,
    turned: (progress: number): IAutoMovieQuaternion =>
      Quaternion.multiply(
        Quaternion.fromAxisAngle(about, rise * Math.min(1, progress)),
        rotation,
      ),
  };
}

/** The muzzle rise. */
export namespace humanWeaponFireRecoil {
  /** The bore, the rise's axis and the turning hand. */
  export interface IRecoil {
    /** The bore in the world, unit. */
    bore: IAutoMovieVector3;

    /** The axis the muzzle rises about, unit. */
    about: IAutoMovieVector3;

    /**
     * The hand's rotation at a progress, clamped at the rise.
     *
     * @param progress The shot's progress.
     * @returns The hand's world rotation.
     */
    turned(progress: number): IAutoMovieQuaternion;
  }
}
