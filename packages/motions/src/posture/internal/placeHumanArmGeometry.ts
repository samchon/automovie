import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Attach the existing axis and optional collider probes to a completed arm
 * chain. The chain must be the actual FK of this setup and instant's frame.
 *
 * @param setup The unchanged rig metadata and body measurements.
 * @param at The current frame carrying the fingertip and surface probe offsets.
 * @param chain The completed world joint positions and segment rotations.
 * @param surface Whether to include collider probes after the eight axis
 *   probes.
 * @returns The chain with the same ordered world probes as full arm placement.
 */
export function placeHumanArmGeometry(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  at: IAutoMovieMotionHumanArmGeometry.IFrame,
  chain: Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes">,
  surface: boolean,
): IAutoMovieMotionHumanArmGeometry.IPlaced {
  const {
    shoulder: pu,
    elbow: pl,
    upper: wu,
    lower: wl,
    wrist: ph,
    hand: wh,
  }: Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> = chain;
  const tip: IAutoMovieVector3 = Vector3.add(
    ph,
    Quaternion.rotateVector(wh, at.tip),
  );
  const m: IAutoMovieMotionHumanArmGeometry.ISetup["body"]["measure"] =
    setup.body.measure;
  return {
    probes: [
      [Vector3.lerp(pu, pl, 0.5), m.upperArmRadius],
      [Vector3.lerp(pu, pl, 0.8), (m.upperArmRadius + m.forearmRadius) / 2],
      [pl, m.forearmRadius],
      [Vector3.lerp(pl, ph, 1 / 3), m.forearmRadius * 0.9],
      [Vector3.lerp(pl, ph, 2 / 3), m.forearmRadius * 0.8],
      [ph, m.forearmRadius * 0.7],
      [Vector3.lerp(ph, tip, 0.5), m.forearmRadius * 0.6],
      [tip, m.forearmRadius * 0.4],
      ...(surface
        ? at.surface.map(
            (
              s: IAutoMovieVector3,
              i: number,
            ): readonly [IAutoMovieVector3, number] => {
              const owner: PlaceHumanArmGeometryOwner = at.owners[i]!;
              const origin: IAutoMovieVector3 =
                owner === "upper" ? pu : owner === "lower" ? pl : ph;
              const rotation: IAutoMovieQuaternion =
                owner === "upper" ? wu : owner === "lower" ? wl : wh;
              return [
                Vector3.add(origin, Quaternion.rotateVector(rotation, s)),
                0,
              ];
            },
          )
        : []),
    ],
    shoulder: pu,
    elbow: pl,
    upper: wu,
    lower: wl,
    wrist: ph,
    hand: wh,
  };
}

/** The alternatives of `PlaceHumanArmGeometryOwner`'s site. */
type PlaceHumanArmGeometryOwner = "upper" | "lower" | "hand";
