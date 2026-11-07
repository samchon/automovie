import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { FighterBody } from "../motion/fighter/FighterBody";
import { FilmVector as V } from "../motion/rig/FilmVector";
import { filmHeadGuardPoint } from "../motion/rig/filmHeadGuardPoint";
import { Strike } from "../motion/striking/Strike";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import type { BoutTargetSource } from "./BoutTargetSource";

/** Declare head protection separately from forward intent and complete opponent clearance. The shared planner fits these relative witnesses simultaneously; the film neither clips solved poses nor grants collision receipts. */
export function boutGuardPointBounds(
  source: BoutTargetSource,
  id: FilmPlan.ActorId,
  seconds: number,
  authored?: FighterBody.Frame,
): Bound[] {
  if (
    id === "referee" ||
    !BoutScript.actions.some(
      (action: BoutScript.Action): boolean =>
        action.actor === id &&
        BoutScript.specs[action.technique].limb === "leg" &&
        Strike.envelope(action, seconds).active,
    )
  )
    return [];
  const frame: FighterBody.Frame = authored ?? source.frames(seconds)[id];
  const profile: P = source.rigs[id].profile;
  const headShapes: P.IShape[] = profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === "head",
  )!.shapes;
  if (headShapes.length !== 1)
    throw new Error(
      "The film's declared head region requires one provider collider; a changed population needs an explicit relationship budget",
    );
  const head: V.Value = filmHeadGuardPoint(profile, {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): Bound[] => {
      const hand: P.ISegment = profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === `${side}Hand`,
      )!;
      const glove: P.IShape = hand.shapes.find(
        (shape: P.IShape): boolean => shape.material === "glove",
      )!;
      if (glove.kind !== "sphere")
        throw new Error("The film guard requires its declared glove sphere");
      const common: Pick<
        Bound,
        "chain" | "source" | "iterations" | "tolerance"
      > = {
        chain: [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`],
        source: { bone: hand.bone, localPoint: glove.transform.position },
        iterations: Settings.targetIterations,
        tolerance: Settings.targetTolerance,
      };
      const intent: FighterBody.Hand = frame.hands[side];
      const extension: number =
        intent.kind === "guard" ? (intent.extension ?? 0) : 0;
      return [
        {
          ...common,
          id: `guard:${side}:head-height`,
          reference: { body: id, bone: "head", localPoint: V.vector(head) },
          axis: { x: 0, y: 1, z: 0 },
          minimum: -glove.radius,
          maximum: glove.radius,
        },
        // The reference follows the actual candidate head shape and its rotation.
        // Preparation covers its front plane; a full post clears it with the glove rear.
        ...(extension > 0
          ? [
              {
                ...common,
                id: `guard:${side}:forward`,
                reference: { body: id, bone: "head", shape: headShapes[0]!.id },
                axis: {
                  x: Math.cos(frame.heading),
                  y: 0,
                  z: -Math.sin(frame.heading),
                },
                minimum: (2 * extension - 1) * glove.radius,
              },
            ]
          : []),
      ];
    },
  );
}
