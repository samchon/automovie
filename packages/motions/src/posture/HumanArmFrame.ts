import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  type preparePoseResolution,
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
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanColliderCorners } from "./HumanColliderCorners";
import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";

/**
 * What an arm is read against at one instant (`HumanArmGeometry.IFrame`),
 * built from a base: the shoulder's parent, the fingertip, the shapes of the
 * body and of another body in the arm's way, and the arm's own colliders and
 * their probes (the tangle audit's corners) in the frame of the segment each
 * rides on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the per-base shoulder context, actual colliders and canonical probe provenance.
 * @evidence contracts/development/design.md#principled-representation One resolved body and collider placement supply both obstacle selection and segment-local probe frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One frame builder serves trajectory contexts and the public arm Jacobian reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts External part ordering and the audit's original probes, ownership and reach screens remain unchanged.
 */
export namespace HumanArmFrame {
  /**
   * The frame of a base.
   *
   * @param setup The arm.
   * @param base The pose and another body's colliders, the arms of the problem left out of what they hold.
   * @param alone Whether the arm is solved alone, so the other arm is in its way; two arms solved together read each other through their own colliders.
   * @param prepared Optional exact FK reader shared only across arms of this same base's synchronous frame construction, then released; never stored in a frame or cache.
   * @returns The frame, the same record for the same base, arm and solve, which a refined trajectory and its finer reading share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, single/paired-arm selection and the existing per-base frame identity.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the source pose and places its physical colliders once for a newly requested frame; the existing obstacle owner selects from that same placement while audit probes retain their exact segment transforms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Existing base/arm lookup delegates a missing frame to one construction pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all FK admission, external part indices, related exclusions, probe order and strict shoulder-reach comparison; base, body and external placements remain unchanged for the frame's existing lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms One full ordered pose walk and collider placement per newly built frame plus linear part/probe scans; an optional same-base reader avoids identical completed joint/bone math for the second arm while all outputs remain fresh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-base arm construction shares only the supplied synchronous FK reader's exact dependencies. Obstacle/probe passes share placements, each owner reuses its inverse frame (the hand's already computed for the fingertip), bounds reuse local points, and the completed shoulder origin feeds unchanged-frame chain queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only the existing weakly keyed per-base frames; temporary placement and owner-group arrays are released after construction and no new cross-pose cache is introduced.
   */
  export function of(
    setup: G.ISetup,
    base: G.IBase,
    alone: boolean,
    prepared?: ReturnType<typeof preparePoseResolution>,
  ): G.IFrame {
    let kept: Map<string, G.IFrame> | undefined = FRAMES.get(base);
    if (kept === undefined) FRAMES.set(base, (kept = new Map()));
    const key: string = `${setup.bones.upper}|${alone}`;
    let frame: G.IFrame | undefined = kept.get(key);
    if (frame === undefined)
      kept.set(key, (frame = built(setup, base, alone, prepared)));
    return frame;
  }

  /** The frame of a base, built. */
  function built(
    setup: G.ISetup,
    base: G.IBase,
    alone: boolean,
    prepared?: ReturnType<typeof preparePoseResolution>,
  ): G.IFrame {
    const body: IHumanBody = setup.body;
    const bones: G.ISetup["bones"] = setup.bones;
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, base.pose, prepared);
    const side: "left" | "right" = bones.upper.startsWith("left")
      ? "left"
      : "right";
    const parent: IAutoMovieResolvedBone = resolved.get(
      G.parent(body, bones.upper),
    )!;
    const hand: IAutoMovieResolvedBone = resolved.get(bones.hand)!;
    const distal: IAutoMovieResolvedBone =
      resolved.get(`${side}MiddleDistal`) ?? hand;
    const unturn: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
    const tip: IAutoMovieVector3 = Quaternion.rotateVector(
      unturn,
      Vector3.subtract(distal.worldPosition, hand.worldPosition),
    );
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);

    // Frame part indices keep the audit's own parts first, then each placed
    // external segment once. External parts share no own-body reference or
    // joint exclusions, even when their bone names match the body's.
    const others: HumanColliders.IPlaced[] = [...new Set(base.others)];
    const parts: ReadonlyMap<HumanColliders.IPlaced, number> = new Map(
      others.map(
        (
          segment: HumanColliders.IPlaced,
          i: number,
        ): readonly [HumanColliders.IPlaced, number] =>
          [segment, model.parts.length + i] as const,
      ),
    );
    const own: Map<AutoMovieHumanoidBone, number> = new Map();
    model.parts.forEach(
      (
        part: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number],
        i: number,
      ): void => {
        if (!own.has(part.bone)) own.set(part.bone, i);
      },
    );
    const shapes: G.IShape[] = [];
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(
      body,
      resolved,
    );
    for (const segment of [
      ...HumanArmClearance.obstacles(
        body,
        resolved,
        alone ? [side === "left" ? "right" : "left"] : [],
        placed,
      ),
      ...others,
    ]) {
      const part: number = parts.get(segment) ?? own.get(segment.bone) ?? -1;
      for (const shape of segment.shapes)
        shapes.push(S.bounded(segment.bone, part, segment.pose, shape));
    }

    // The arm's own colliders and their probes, the audit's corners, each
    // carried into the frame of the arm's segment it rides on.
    const surface: IAutoMovieVector3[] = [];
    const byOwner: Record<"upper" | "lower" | "hand", IAutoMovieVector3[]> = {
      upper: [],
      lower: [],
      hand: [],
    };
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
    const inverses: Partial<
      Record<"upper" | "lower" | "hand", IAutoMovieQuaternion>
    > = { hand: unturn };
    placed.forEach((segment: HumanColliders.IPlaced, i: number): void => {
      const owner: "upper" | "lower" | "hand" | null =
        segment.bone === bones.upper
          ? "upper"
          : segment.bone === bones.lower
            ? "lower"
            : AutoMovieMotionHumanAuditTangleModel.group(segment.bone) ===
                bones.hand
              ? "hand"
              : null;
      if (owner === null) {
        // The body's corners, the other arm's left out where it is solved too.
        const arm: boolean =
          segment.bone === `${other}UpperArm` ||
          segment.bone === `${other}LowerArm` ||
          AutoMovieMotionHumanAuditTangleModel.group(segment.bone) ===
            `${other}Hand`;
        if (!alone && arm) return;
        const part: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number] =
          model.parts[i]!;
        for (let corner: number = 0; corner < part.surface; corner++) {
          const probe: IAutoMovieVector3 = part.probes[corner]!;
          corners.push({
            point: Vector3.add(
              segment.pose.position,
              Quaternion.rotateVector(segment.pose.rotation, probe),
            ),
            part: i,
            corner,
            bone: segment.bone,
          });
        }
        return;
      }
      const by: IAutoMovieResolvedBone = frames[owner];
      const inverse: IAutoMovieQuaternion =
        inverses[owner] ?? Quaternion.inverse(by.worldRotation);
      inverses[owner] = inverse;
      colliders.push({
        owner,
        bone: segment.bone,
        part: i,
        pose: {
          ...segment.pose,
          position: Quaternion.rotateVector(
            inverse,
            Vector3.subtract(segment.pose.position, by.worldPosition),
          ),
          rotation: Quaternion.multiply(inverse, segment.pose.rotation),
        },
        shapes: segment.shapes,
      });
      const part: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number] =
        model.parts[i]!;
      for (let corner: number = 0; corner < part.surface; corner++) {
        const probe: IAutoMovieVector3 = part.probes[corner]!;
        segments.push(i);
        indices.push(corner);
        owners.push(owner);
        const point: IAutoMovieVector3 = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(
            Vector3.add(
              segment.pose.position,
              Quaternion.rotateVector(segment.pose.rotation, probe),
            ),
            by.worldPosition,
          ),
        );
        surface.push(point);
        byOwner[owner].push(point);
      }
    });
    for (const segment of others) {
      let corner: number = 0;
      for (const shape of segment.shapes)
        for (const probe of HumanColliderCorners(shape))
          corners.push({
            point: Vector3.add(
              segment.pose.position,
              Quaternion.rotateVector(
                segment.pose.rotation,
                Vector3.add(
                  shape.transform.position,
                  Quaternion.rotateVector(shape.transform.rotation, probe),
                ),
              ),
            ),
            part: parts.get(segment)!,
            corner: corner++,
            bone: segment.bone,
          });
    }
    const of: (owner: "upper" | "lower" | "hand") => {
      centre: IAutoMovieVector3;
      radius: number;
    } = (
      owner: "upper" | "lower" | "hand",
    ): { centre: IAutoMovieVector3; radius: number } => sphere(byOwner[owner]);
    const bounds: G.IFrame["bounds"] = {
      upper: of("upper"),
      lower: of("lower"),
      hand: of("hand"),
    };

    // The body's corners the arm can come near at all: within its own
    // length, its widest segment and the pairs' reach of the shoulder.
    const shoulder: IAutoMovieVector3 = frames.upper.worldPosition;
    const length: number =
      Vector3.length(Vector3.subtract(frames.lower.worldPosition, shoulder)) +
      Vector3.length(
        Vector3.subtract(hand.worldPosition, frames.lower.worldPosition),
      ) +
      Vector3.length(
        Vector3.subtract(distal.worldPosition, hand.worldPosition),
      );
    const around: number =
      length +
      Math.max(bounds.upper.radius, bounds.lower.radius, bounds.hand.radius) +
      NEAR;
    const delta: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const near: G.IFrame["body"] = corners.filter(
      (c: G.IFrame["body"][number]): boolean => {
        delta.x = c.point.x - shoulder.x;
        delta.y = c.point.y - shoulder.y;
        delta.z = c.point.z - shoulder.z;
        return Vector3.length(delta) < around;
      },
    );
    return {
      parent: {
        rotation: parent.worldRotation,
        position: parent.worldPosition,
      },
      shoulder,
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
function sphere(points: readonly IAutoMovieVector3[]): {
  centre: IAutoMovieVector3;
  radius: number;
} {
  const scale: number = 1 / Math.max(1, points.length);
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (const p of points) {
    x += p.x * scale;
    y += p.y * scale;
    z += p.z * scale;
  }
  const centre: IAutoMovieVector3 = { x, y, z };
  let radius: number = 0;
  const delta: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const p of points) {
    delta.x = p.x - centre.x;
    delta.y = p.y - centre.y;
    delta.z = p.z - centre.z;
    radius = Math.max(radius, Vector3.length(delta));
  }
  return { centre, radius };
}

/** The frames built, by base and then by arm and solve, kept while the base is held. */
const FRAMES: WeakMap<G.IBase, Map<string, G.IFrame>> = new WeakMap();
