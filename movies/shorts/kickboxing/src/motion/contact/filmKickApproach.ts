import {
  type preparePhysicalGeometry as Geometry,
  projectPhysicalSupportReach,
} from "@automovie/engine";

import { Strike } from "../striking/Strike";
import { filmContactIntent } from "./filmContactIntent";
import { filmKickGeometry } from "./filmKickGeometry";

/** Declare the actual receiver-relative ankle goal together with planted support balls. The side's provider-derived two-link span bounds ankle reach; ROM may make it stricter. Existing kick preparation continuously admits that reach request, and the public bounded projection alone computes root travel. Remaining excess never becomes contact success. */
export function filmKickApproach(
  source: filmKickGeometry.IContext,
  receiver: filmKickGeometry.IContext,
  supports: Parameters<typeof projectPhysicalSupportReach>[0]["supports"],
  policy: Omit<Parameters<typeof projectPhysicalSupportReach>[0], "supports">,
  queries?: Geometry.IQueries,
): ReturnType<typeof projectPhysicalSupportReach> {
  const goals: Parameters<
    typeof projectPhysicalSupportReach
  >[0]["supports"][number][] = [];
  for (const side of ["left", "right"] as const) {
    const leg: (typeof source.frame.legs)[typeof side] =
      source.frame.legs[side];
    if (leg.kind !== "kick" || filmContactIntent(leg.action).relation === null)
      continue;
    const delivery: filmKickGeometry.IDelivery = filmKickGeometry(
      source,
      receiver,
      leg.action,
      queries,
    );
    const distance: number = Math.hypot(
      delivery.impact.ankle[0] - delivery.hip[0],
      delivery.impact.ankle[1] - delivery.hip[1],
      delivery.impact.ankle[2] - delivery.hip[2],
    );
    const weight: number = Strike.kickGuardWeight(
      leg.action,
      source.frame.time,
    );
    const radius: number = Math.max(
      delivery.maximumAnkleReach,
      distance + (delivery.maximumAnkleReach - distance) * weight,
    );
    goals.push({
      origin: { x: delivery.hip[0], y: delivery.hip[1], z: delivery.hip[2] },
      target: {
        x: delivery.impact.ankle[0],
        y: delivery.impact.ankle[1],
        z: delivery.impact.ankle[2],
      },
      radius,
    });
  }
  return goals.length
    ? projectPhysicalSupportReach({
        ...policy,
        supports: [...supports, ...goals],
      })
    : { translation: { x: 0, y: 0, z: 0 }, maximumExcess: 0, converged: true };
}
