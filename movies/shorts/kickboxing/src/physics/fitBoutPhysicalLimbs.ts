import { solvePhysicalFloorChainTarget } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { filmGuard } from "../motion/contact/filmGuard";
import type { FighterBody } from "../motion/fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { FilmVector as V } from "../motion/rig/FilmVector";
import { boutPhysicalTrunk } from "./boutPhysicalTrunk";

/** Aim free limbs after all actors' support fitting; shared bounded IK owns each actual joint update. */
export function fitBoutPhysicalLimbs(
  rig: Rig,
  admitted: Record<string, P.ITransform>,
  request: Rig.Request,
  frame: FighterBody.Frame,
): Record<string, P.ITransform> {
  let targets: Record<string, P.ITransform> = admitted;
  for (const side of ["left", "right"] as const) {
    const handIntent: FighterBody.Hand = frame.hands[side];
    const posting: boolean =
      handIntent.kind === "guard" && (handIntent.extension ?? 0) > 0;
    // Prepare from the ordinary guard at this same authored frame. Extending to an
    // occupied maximum-reach endpoint first traps a local fit on its far side.
    // The subsequent simultaneous fit owns the actual forward/protection bounds.
    const arm: Rig.Goal | undefined =
      posting && handIntent.kind === "guard"
        ? filmGuard(
            {
              rig,
              trunk: boutPhysicalTrunk(targets, rig.profile),
              forward: V.rotateY([1, 0, 0], frame.heading),
              left: V.rotateY([0, 0, 1], frame.heading),
            },
            side,
            handIntent.tight,
            0,
            handIntent.reach ?? 0,
          )
        : request.arms?.[side];
    if (arm) {
      const hand: P.ISegment = rig.profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === `${side}Hand`,
      )!;
      const glove: P.IShape | undefined = hand.shapes.find(
        (shape: P.IShape): boolean => shape.material === "glove",
      );
      const input: Parameters<typeof solvePhysicalFloorChainTarget>[0] = {
        profile: rig.profile,
        targets,
        chain: [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`],
        contacts: [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`],
        localPoint: glove?.transform.position,
        goal: V.vector(arm.point),
        endpointHeight: arm.point[1],
        floor: 0,
        iterations: 24,
        tolerance: 0.00025,
      };
      const fitted: ReturnType<typeof solvePhysicalFloorChainTarget> =
        solvePhysicalFloorChainTarget(input);
      targets = fitted.targets;
    }
    const leg: Rig.Goal | undefined = request.legs?.[side];
    if (
      leg &&
      frame.legs[side].kind !== "place" &&
      frame.legs[side].kind !== "pose"
    ) {
      const input: Parameters<typeof solvePhysicalFloorChainTarget>[0] = {
        profile: rig.profile,
        targets,
        chain: [
          `${side}UpperLeg`,
          `${side}LowerLeg`,
          `${side}Foot`,
          `${side}Subtalar`,
          `${side}Midfoot`,
        ],
        contacts: [`${side}Foot`, `${side}Subtalar`, `${side}Midfoot`],
        endpointBone: `${side}Foot`,
        goal: V.vector(leg.point),
        endpointHeight: leg.point[1],
        floor: 0,
        iterations: 24,
        tolerance: 0.00025,
      };
      const fitted: ReturnType<typeof solvePhysicalFloorChainTarget> =
        solvePhysicalFloorChainTarget(input);
      targets = fitted.targets;
    }
  }
  return targets;
}
