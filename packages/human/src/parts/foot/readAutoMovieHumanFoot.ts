import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { networkAutoMovieHumanFoot } from "./networkAutoMovieHumanFoot";
import { planAutoMovieHumanFoot } from "./planAutoMovieHumanFoot";

/**
 * Read one foot's shared landmarks, bone fulcrum, cut and local form plan.
 *
 * The horizontal pternion-to-acropodion direction and the standing up axis
 * define one local millimetre frame for generation and attachments. The right
 * foot reflects its lateral coordinate in that same definition. Source and
 * dependent placements consume these transforms rather than copying positions.
 *
 * @param props The person's resolved dimensions, rest skeleton and foot side
 * @returns Borrowed measurements and the derived local plan and transforms
 * @throws Error when the skeleton lacks the foot or its length axis is invalid
 */
export function readAutoMovieHumanFoot(
  props: IAutoMovieHumanPartGenerator.IProps<"foot">,
): readAutoMovieHumanFoot.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const side: AutoMovieHumanSide = props.side;
  const sign: number = side === "left" ? 1 : -1;
  const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
  const leg: IAutoMovieHumanIdentity.ILeg =
    side === "left" ? body.leftLeg : body.rightLeg;
  const landmarks: IAutoMovieHumanLandmarks.ISide =
    side === "left"
      ? props.skeleton.landmarks.left
      : props.skeleton.landmarks.right;
  const ankle: IAutoMovieHumanSkeleton.IJoint | undefined =
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
        j.bone === (side === "left" ? "leftFoot" : "rightFoot"),
    );
  if (ankle === undefined) throw new Error(`skeleton lacks the ${side} foot`);
  const base: IAutoMovieVector3 = V.of(ankle.position.x, 0, ankle.position.z);
  const forward: IAutoMovieVector3 = V.normalize(
    V.of(
      landmarks.acropodion.position.x - landmarks.pternion.position.x,
      0,
      landmarks.acropodion.position.z - landmarks.pternion.position.z,
    ),
  );
  const up: IAutoMovieVector3 = V.of(0, 1, 0);
  const lateral: IAutoMovieVector3 = V.cross(up, forward);
  const toModelDirection: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    V.offset(V.of(0, 0, 0), [lateral, sign * p.x], [up, p.y], [forward, p.z]);
  const toLocalDirection: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    V.of(sign * V.dot(p, lateral), V.dot(p, up), V.dot(p, forward));
  const toLocal: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => toLocalDirection(V.offset(p, [base, -1]));
  const toModel: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => V.offset(base, [toModelDirection(p), 1]);
  const layout: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton: props.skeleton,
    measurements: props.measurements,
    site: "ankle",
    side,
    part: "foot",
  });
  const origin: IAutoMovieVector3 = toLocal(layout.frame.origin);
  const local: IAutoMovieVector3[] = layout.directions.map(
    (d: IAutoMovieVector3): IAutoMovieVector3 => toLocalDirection(d),
  );
  // the sweep turns counterclockwise about the downward axis: front, medial (-x), back, lateral
  const turnOf: (d: IAutoMovieVector3) => number = (
    d: IAutoMovieVector3,
  ): number =>
    Math.round((Math.atan2(-d.x, d.z) / (2 * Math.PI)) * layout.count);
  const sense: 1 | -1 = turnOf(local[1]!) === 1 ? 1 : -1;
  const plan: IAutoMovieHumanFootPlan = planAutoMovieHumanFoot({
    leg,
    landmarks,
    toLocal,
    ankle: { origin, radii: [] },
    joint: toLocal(ankle.tail),
  });
  return {
    side,
    plan,
    layout,
    base,
    origin,
    toLocal,
    toModel,
    toModelDirection,
    ring: { origin, positions: layout.positions.map(toLocal), sense },
    axes: {
      x: V.offset(V.of(0, 0, 0), [lateral, 1000 * sign]),
      y: V.of(0, 1000, 0),
      z: V.offset(V.of(0, 0, 0), [forward, 1000]),
    },
  };
}

/** The foot's single shared local construction frame. */
export namespace readAutoMovieHumanFoot {
  export interface IOutput {
    /** Side whose lateral coordinate the local frame follows. */
    side: AutoMovieHumanSide;
    /** Source form in local millimetres. */
    plan: IAutoMovieHumanFootPlan;
    /** Shared ankle cut in model millimetres. */
    layout: IAutoMovieHumanRingShape;
    /** Model-frame origin of the local frame, millimetres. */
    base: IAutoMovieVector3;
    /** Ankle-ring centre in the local frame, millimetres. */
    origin: IAutoMovieVector3;
    /** Shared source section in its declared order. */
    ring: networkAutoMovieHumanFoot.IRing;
    /** Model displacement of one local metre, in millimetres. */
    axes: { x: IAutoMovieVector3; y: IAutoMovieVector3; z: IAutoMovieVector3 };
    /** Model-millimetre point to local millimetres. */
    toLocal: (point: IAutoMovieVector3) => IAutoMovieVector3;
    /** Local-millimetre point to model millimetres. */
    toModel: (point: IAutoMovieVector3) => IAutoMovieVector3;
    /** Local direction to a model direction, without translation or scale. */
    toModelDirection: (direction: IAutoMovieVector3) => IAutoMovieVector3;
  }
}
