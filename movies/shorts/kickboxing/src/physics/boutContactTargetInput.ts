import type {
  preparePhysicalGeometry as Geometry,
  planPhysicalContactTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { FighterBody } from "../motion/fighter/FighterBody";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import type { BoutTargetSource } from "./BoutTargetSource";
import { boutContactBindings } from "./boutContactBindings";
import { boutGuardPointBounds } from "./boutGuardPointBounds";
import { boutSupportPattern } from "./boutSupportPattern";

/** Preserve body references and original support promises until the actual receiver dependency has been resolved. */
export function boutContactTargetInput(
  source: BoutTargetSource,
  id: FilmPlan.ActorId,
  seconds: number,
  targets: Readonly<Record<string, P.ITransform>>,
  actual: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
  geometry: Geometry.IQueries,
  frame: FighterBody.Frame,
  goals: Readonly<Record<string, IAutoMovieVector3>>,
): Parameters<typeof planPhysicalContactTargets>[0] {
  const profiles: Record<string, P> = Object.fromEntries(
    Object.entries(source.rigs).map(
      ([body, rig]: [string, BoutTargetSource["rigs"][FilmPlan.ActorId]]): [
        string,
        P,
      ] => [body, rig.profile],
    ),
  );
  const pattern: IAutoMovieFootfallPattern = boutSupportPattern(
    source.rigs[id],
    id,
    frame,
  );
  const supports: NonNullable<
    Parameters<typeof planPhysicalContactTargets>[0]["supports"]
  > = pattern.limbs.flatMap(
    (
      limb: IAutoMovieFootfallPattern["limbs"][number],
      index: number,
    ): NonNullable<
      Parameters<typeof planPhysicalContactTargets>[0]["supports"]
    >[number][] => {
      const side: "left" | "right" = index === 0 ? "left" : "right";
      const leg: FighterBody.Leg = frame.legs[side];
      return leg.kind === "place" && leg.placement.lift === 0
        ? [
            {
              bone: limb.bone,
              localPoint: limb.localPoint,
              point: goals[limb.bone]!,
              patch: {
                contacts: limb.contacts ?? [limb.bone],
                floorPoints: limb.floorPoints,
                floor: Settings.supportPlane,
              },
            },
          ]
        : [];
    },
  );
  return {
    body: id,
    profiles,
    targets,
    actual,
    bindings: boutContactBindings(source, id, seconds),
    pointBounds: boutGuardPointBounds(source, id, seconds, frame),
    supports,
    selfAvoidance: {
      iterations: Settings.targetIterations,
      tolerance: Settings.targetTolerance,
    },
    geometry,
    floor: Settings.supportPlane,
  };
}
