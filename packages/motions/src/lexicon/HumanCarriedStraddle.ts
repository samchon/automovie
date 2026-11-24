import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanVerdicts } from "../audit/HumanVerdicts";
import { HumanColliders } from "../posture/HumanColliders";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";

/** A knee at either side of the bearer's pelvis, in left-to-right order. */
const KNEES: readonly AutoMovieHumanoidBone[] = [
  "leftLowerLeg",
  "rightLowerLeg",
];

/**
 * A straddling carry wraps the borne knees outside the bearer's thighs. This
 * measures the two gaps in the bearer's pelvis frame using the hip socket
 * separation and measured thickness of the touching segments. The thighs can
 * swing while the bearer walks without pulling a carried knee through a hip.
 * The sternum and the hands still use their own contacts.
 */
export function HumanCarriedStraddle(
  bearer: IAutoMovieMotionHumanBody,
  borne: IAutoMovieMotionHumanBody,
  reading: HumanCarriedCouplingFit.IRead,
): number[] {
  const hips: IAutoMovieResolvedBone = reading.theirs.get("hips")!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hips.worldRotation);
  const width: number =
    bearer.measure.hipHalfWidth +
    bearer.measure.thighRadius +
    borne.measure.shankRadius;
  return KNEES.map((knee: AutoMovieHumanoidBone, index: number): number => {
    const point: IAutoMovieVector3 = reading.fit.place(
      reading.mine.get(knee)!.worldPosition,
    );
    return (
      width -
      (index === 0 ? 1 : -1) *
        Quaternion.rotateVector(
          inverse,
          Vector3.subtract(point, hips.worldPosition),
        ).x
    );
  });
}

/** The exact collision check for the straddling key pose. */
export namespace HumanCarriedStraddle {
  /**
   * The measured knee clearance when the side envelope is inconclusive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the exact fallback and its two observed points.
   * @evidence contracts/development/implementation.md#principled-implementation Place the three bearer segments once and query both borne knee centres against them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placed collider reader and two short-circuitable point queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the same skin overlap admitted by the partner verdict.
   * @evidence contracts/development/implementation.md#efficient-algorithms Only three fitted segment frames and at most two exact point distances are consumed on fallback.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same winning key registration gives both bodies' bones and the map between them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The collider reader is scoped to this one check.
   */
  export function clear(
    bearer: IAutoMovieMotionHumanBody,
    reading: HumanCarriedCouplingFit.IRead,
  ): boolean {
    const shapes: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
      ["hips", reading.theirs.get("hips")!],
      ["leftUpperLeg", reading.theirs.get("leftUpperLeg")!],
      ["rightUpperLeg", reading.theirs.get("rightUpperLeg")!],
    ]);
    const distance: ReturnType<typeof HumanColliders.reading>["segment"] =
      HumanColliders.reading(bearer, shapes).segment;
    return KNEES.every((knee: AutoMovieHumanoidBone): boolean => {
      const point: IAutoMovieVector3 = reading.fit.place(
        reading.mine.get(knee)!.worldPosition,
      );
      return distance(point, point).distance >= -HumanVerdicts.SKIN;
    });
  }
}
