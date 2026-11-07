import {
  physicalSupportPoint,
  planPhysicalFloorSupportTargets,
  projectPhysicalTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { FighterBody } from "../motion/fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { FilmVector as V } from "../motion/rig/FilmVector";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import { boutSupportPattern } from "./boutSupportPattern";

/** Bind screenplay endpoints to the shared native-coordinate fitter; no solver or pose correction is implemented here. */
export function fitBoutPhysicalTargets(
  rig: Rig,
  authored: Record<string, P.ITransform>,
  request: Rig.Request,
  frame: FighterBody.Frame,
): ReturnType<typeof planPhysicalFloorSupportTargets> {
  const targets: Record<string, P.ITransform> = projectPhysicalTargets(
    rig.profile,
    authored,
  ).targets;
  const pattern: IAutoMovieFootfallPattern = boutSupportPattern(
    rig,
    "target",
    frame,
  );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
        index: number,
      ): [string, IAutoMovieVector3] => {
        const side: "left" | "right" = index === 0 ? "left" : "right";
        const goal: Rig.Goal | undefined = request.legs?.[side];
        // The clinical leg point is an ankle; its ball aim is the actual support witness.
        return [
          limb.bone,
          goal?.aim?.bone === "ball"
            ? V.vector(goal.aim.point)
            : physicalSupportPoint(authored[limb.bone]!, limb.localPoint),
        ];
      },
    ),
  );
  return planPhysicalFloorSupportTargets({
    profile: rig.profile,
    targets,
    pattern,
    goals,
    planted: (["left", "right"] as const)
      .filter(
        (side: "left" | "right"): boolean =>
          frame.legs[side].kind === "place" &&
          frame.legs[side].placement.lift === 0,
      )
      .map((side: "left" | "right"): string => `${side}Midfoot`),
    floor: Settings.supportPlane,
    maximumRootDrop: 0.18,
    passes: 6,
    iterations: 24,
    tolerance: Settings.targetTolerance,
  });
}
