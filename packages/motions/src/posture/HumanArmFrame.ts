import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";

/**
 * What an arm is read against at one instant (`HumanArmGeometry.IFrame`),
 * built from a base: the shoulder's parent, the fingertip, the shapes of the
 * body and of another body in the arm's way, and the arm's own colliders and
 * their probes (the tangle audit's corners) in the frame of the segment each
 * rides on.
 */
export namespace HumanArmFrame {
  /**
   * The frame of a base.
   *
   * @param setup The arm.
   * @param base The pose and another body's colliders, the arms of the problem left out of what they hold.
   * @param alone Whether the arm is solved alone, so the other arm is in its way; two arms solved together read each other through their own colliders.
   * @returns The frame.
   */
  export function of(setup: G.ISetup, base: G.IBase, alone: boolean): G.IFrame {
    const body: IHumanBody = setup.body;
    const bones: G.ISetup["bones"] = setup.bones;
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, base.pose);
    const side: "left" | "right" = bones.upper.startsWith("left") ? "left" : "right";
    const parent: IAutoMovieResolvedBone = resolved.get(G.parent(body, bones.upper))!;
    const hand: IAutoMovieResolvedBone = resolved.get(bones.hand)!;
    const distal: IAutoMovieResolvedBone = resolved.get(`${side}MiddleDistal`) ?? hand;
    const tip: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(distal.worldPosition, hand.worldPosition),
    );
    const model: AutoMovieMotionHumanAuditTangleModel.IModel = AutoMovieMotionHumanAuditTangleModel.model(body);

    // The shapes in the arm's way: the body's, the other arm's when this one
    // is solved alone, and another body's, which the audit has no part for.
    const others: ReadonlySet<HumanColliders.IPlaced> = new Set(base.others);
    const shapes: G.IShape[] = [];
    for (const segment of [
      ...HumanArmClearance.obstacles(body, resolved, alone ? [side === "left" ? "right" : "left"] : []),
      ...base.others,
    ])
      for (const shape of segment.shapes)
        shapes.push(
          G.bounded(
            segment.bone,
            others.has(segment) ? -1 : model.parts.findIndex((p: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number]): boolean => p.bone === segment.bone),
            segment.pose,
            shape,
          ),
        );

    // The arm's own colliders and their probes, the audit's corners, each
    // carried into the frame of the arm's segment it rides on.
    const surface: IAutoMovieVector3[] = [];
    const owners: ("upper" | "lower" | "hand")[] = [];
    const segments: number[] = [];
    const indices: number[] = [];
    const colliders: G.IFrame["colliders"] = [];
    const corners: G.IFrame["body"] = [];
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const frames: Record<"upper" | "lower" | "hand", IAutoMovieResolvedBone> = {
      upper: resolved.get(bones.upper)!,
      lower: resolved.get(bones.lower)!,
      hand,
    };
    HumanColliders.placed(body, resolved).forEach((segment: HumanColliders.IPlaced, i: number): void => {
      const owner: "upper" | "lower" | "hand" | null =
        segment.bone === bones.upper
          ? "upper"
          : segment.bone === bones.lower
            ? "lower"
            : AutoMovieMotionHumanAuditTangleModel.group(segment.bone) === bones.hand
              ? "hand"
              : null;
      if (owner === null) {
        // The body's corners, the other arm's left out where it is solved too.
        const arm: boolean =
          segment.bone === `${other}UpperArm` || segment.bone === `${other}LowerArm` || AutoMovieMotionHumanAuditTangleModel.group(segment.bone) === `${other}Hand`;
        if (!alone && arm) return;
        model.parts[i]!.probes.slice(0, model.parts[i]!.surface).forEach((probe: IAutoMovieVector3, corner: number): void => {
          corners.push({
            point: Vector3.add(segment.pose.position, Quaternion.rotateVector(segment.pose.rotation, probe)),
            part: i,
            corner,
            bone: segment.bone,
          });
        });
        return;
      }
      const by: IAutoMovieResolvedBone = frames[owner];
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(by.worldRotation);
      colliders.push({
        owner,
        bone: segment.bone,
        part: i,
        pose: {
          ...segment.pose,
          position: Quaternion.rotateVector(inverse, Vector3.subtract(segment.pose.position, by.worldPosition)),
          rotation: Quaternion.multiply(inverse, segment.pose.rotation),
        },
        shapes: segment.shapes,
      });
      model.parts[i]!.probes.slice(0, model.parts[i]!.surface).forEach((probe: IAutoMovieVector3, corner: number): void => {
        segments.push(i);
        indices.push(corner);
        owners.push(owner);
        surface.push(
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(Vector3.add(segment.pose.position, Quaternion.rotateVector(segment.pose.rotation, probe)), by.worldPosition),
          ),
        );
      });
    });
    const of = (owner: "upper" | "lower" | "hand"): { centre: IAutoMovieVector3; radius: number } =>
      sphere(surface.filter((_: IAutoMovieVector3, i: number): boolean => owners[i] === owner));
    const bounds: G.IFrame["bounds"] = { upper: of("upper"), lower: of("lower"), hand: of("hand") };

    // The body's corners the arm can come near at all: within its own
    // length, its widest segment and the pairs' reach of the shoulder.
    const shoulder: IAutoMovieVector3 = frames.upper.worldPosition;
    const length: number =
      Vector3.length(Vector3.subtract(frames.lower.worldPosition, shoulder)) +
      Vector3.length(Vector3.subtract(hand.worldPosition, frames.lower.worldPosition)) +
      Vector3.length(Vector3.subtract(distal.worldPosition, hand.worldPosition));
    const around: number = length + Math.max(bounds.upper.radius, bounds.lower.radius, bounds.hand.radius) + NEAR;
    const near: G.IFrame["body"] = corners.filter((c: G.IFrame["body"][number]): boolean => Vector3.length(Vector3.subtract(c.point, shoulder)) < around);
    return {
      parent: { rotation: parent.worldRotation, position: parent.worldPosition },
      tip,
      surface,
      owners,
      segments,
      corners: indices,
      related: model.related,
      bounds,
      colliders,
      shapes,
      body: near,
    };
  }
}

/** How near a body's corner must come to a segment of the arm to be read against it, metres: the pairs' reach (`HumanArmTrajectoryTerms.REACH`). */
const NEAR: number = HumanArmTrajectoryTerms.REACH;

/** A sphere about points: their mean and the farthest one's distance. */
function sphere(points: readonly IAutoMovieVector3[]): { centre: IAutoMovieVector3; radius: number } {
  let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const p of points) centre = Vector3.add(centre, Vector3.scale(p, 1 / Math.max(1, points.length)));
  let radius: number = 0;
  for (const p of points) radius = Math.max(radius, Vector3.length(Vector3.subtract(p, centre)));
  return { centre, radius };
}
