import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** Preserve enabled authored or recovered endpoints during coupled contact fitting. A moving foot can track its path while remaining unavailable to carry the body. */
export function physicalContactSupportGoals(
  body: Simulation.IBody,
  target: Simulation.ITarget,
  poses: Readonly<Record<string, P.ITransform>>,
): {
  bone: string;
  localPoint?: IAutoMovieVector3;
  point: IAutoMovieVector3;
}[] {
  return (body.supportTracking?.pattern.limbs ?? [])
    .filter(
      (
        limb: NonNullable<
          Simulation.IBody["supportTracking"]
        >["pattern"]["limbs"][number],
      ): boolean => (target.supportStrength?.[limb.bone] ?? 0) > 0,
    )
    .map(
      (
        limb: NonNullable<
          Simulation.IBody["supportTracking"]
        >["pattern"]["limbs"][number],
      ): {
        bone: string;
        localPoint?: IAutoMovieVector3;
        point: IAutoMovieVector3;
      } => ({
        bone: limb.bone,
        localPoint: limb.localPoint,
        point: physicalSupportPoint(poses[limb.bone]!, limb.localPoint),
      }),
    );
}
