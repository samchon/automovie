import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit the distance from the displayed hand contact to the lead's skin.
 * Parameter hand: The displayed wrist frame.
 * Parameter contact: The contact offset in the hand frame, metres. Absent uses
 * the wrist origin.
 * Parameter lead: The lead point, outward normal and optional radius, metres.
 * Parameter location: The hand and lead at the film second being checked.
 * On `leadReach` if the distance exceeds 10 mm.
 */
export function admitLeadReach(
  hand: HandFrame,
  contact: IAutoMovieVector3 | undefined,
  lead: LeadFrame,
  location: ILeadLocation,
): void {
  const effector: IAutoMovieVector3 =
    contact === undefined
      ? hand.worldPosition
      : Vector3.add(
          hand.worldPosition,
          Quaternion.rotateVector(hand.worldRotation, contact),
        );
  const skin: IAutoMovieVector3 = Vector3.addScaled(
    lead.point,
    lead.normal,
    lead.radius ?? 0,
  );
  const distance: number = Vector3.distance(effector, skin);
  if (!(distance <= LIMIT))
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "leadReach",
      value: distance,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: LIMIT,
        unit: "m",
      },
      reason: `the displayed ${location.side} hand misses ${location.subject}.${location.point} by ${distance} m at film second ${location.film}`,
      fix: "Stage the handler's path within reach of the lead frame.",
    });
}

/*
 * The displayed hand fields that place its contact point in world metres.
 */
type HandFrame = Pick<
  IAutoMovieResolvedBone,
  "worldPosition" | "worldRotation"
>;

/*
 * The lead geometry that locates its skin in world metres.
 */
type LeadFrame = Pick<
  IAutoMovieMotionHumanMountRider.IHoldGrip,
  "point" | "normal" | "radius"
>;

/*
 * The hand, prop and lead contact named at the failed film second.
 */
interface ILeadLocation {
  side: AutoMovieHumanSide;
  subject: string;
  point: string;
  film: number;
}

/*
 * The displayed lead grip's permitted miss, metres.
 */
const LIMIT: number = 0.01;
