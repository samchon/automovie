import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanVerdicts } from "../../audit/AutoMovieMotionHumanVerdicts";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedStraddleData } from "./HumanCarriedStraddleData";

/*
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
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(hips.worldRotation);
  const width: number =
    bearer.measure.hipHalfWidth +
    bearer.measure.thighRadius +
    borne.measure.shankRadius;
  return HumanCarriedStraddleData.KNEES.map((knee: AutoMovieHumanoidBone, index: number): number => {
    const point: IAutoMovieVector3 = reading.fit.place(
      reading.mine.get(knee)!.worldPosition,
    );
    return (
      width -
      (index === 0 ? 1 : -1) *
        AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(point, hips.worldPosition),
        ).x
    );
  });
}

/*
 * The exact collision check for the straddling key pose.
 */
export namespace HumanCarriedStraddle {
  /*
   * The measured knee clearance when the side envelope is inconclusive.
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
    return HumanCarriedStraddleData.KNEES.every((knee: AutoMovieHumanoidBone): boolean => {
      const point: IAutoMovieVector3 = reading.fit.place(
        reading.mine.get(knee)!.worldPosition,
      );
      return distance(point, point).distance >= -AutoMovieMotionHumanVerdicts.SKIN;
    });
  }
}
