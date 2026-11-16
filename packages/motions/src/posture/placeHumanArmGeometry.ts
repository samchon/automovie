import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * Attach the existing axis and optional collider probes to a completed arm
 * chain. The chain must be the actual FK of this setup and instant's frame.
 *
 * @param setup The unchanged rig metadata and body measurements.
 * @param at The current frame carrying the fingertip and surface probe offsets.
 * @param chain The completed world joint positions and segment rotations.
 * @param surface Whether to include collider probes after the eight axis probes.
 * @returns The chain with the same ordered world probes as full arm placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States matching-chain provenance, body/frame input roles, probe ordering, optional surface probes and world-geometry result.
 * @evidence contracts/development/implementation.md#principled-implementation A hand-local fingertip and each segment-local surface probe are transformed by their actual completed chain frames; axis probes retain the existing interpolation positions and measured-body radius scaling.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner attaches probes only; HumanArmGeometry.chain owns the actual parent-first FK, so chain-only consumers can omit this unused observation phase without copying motion calculations or creating an import cycle.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing coarse interpolation/radius-taper coefficients are unchanged conventions rather than claimed anatomical measurements; frame surface-owner indices remain aligned, and actual joint transforms are supplied rather than approximated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight axis probes plus O(P) selected surface transforms remain. Disabled surface skips its mapper/result array; enabled surface selects origin/rotation by scalar references without a temporary pair per probe. Full placement still owns its fixed chain wrapper and requested probe output; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the same completed chain that the full placed result exposes; every selected world probe is actually transformed for this candidate and no result is retained across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state; the caller owns the new placed wrapper and eight-plus-P probe array, sharing its completed chain vectors with the output and corresponding probe entries.
 */
export function placeHumanArmGeometry(
  setup: G.ISetup,
  at: G.IFrame,
  chain: Omit<G.IPlaced, "probes">,
  surface: boolean,
): G.IPlaced {
  const {
    shoulder: pu,
    elbow: pl,
    upper: wu,
    lower: wl,
    wrist: ph,
    hand: wh,
  }: Omit<G.IPlaced, "probes"> = chain;
  const tip: IAutoMovieVector3 = Vector3.add(
    ph,
    Quaternion.rotateVector(wh, at.tip),
  );
  const m: G.ISetup["body"]["measure"] = setup.body.measure;
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
              const owner: "upper" | "lower" | "hand" = at.owners[i]!;
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
