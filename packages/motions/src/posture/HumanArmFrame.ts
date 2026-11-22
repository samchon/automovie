import { Quaternion, Vector3, preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { HumanGrip } from "../handling/HumanGrip";
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
   * @param prepared Optional exact FK reader, or its lazy factory, shared only across arms of this same base's synchronous frame construction, then released. A factory is called only when a frame is missing; neither form is stored in a frame or cache.
   * @returns The frame, the same record for the same base, arm and solve, which a refined trajectory and its finer reading share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, single/paired-arm selection and the existing per-base frame identity.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the source pose and places its physical colliders once for a newly requested frame; the existing obstacle owner selects from that same placement while audit probes retain their exact segment transforms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Existing base/arm lookup delegates a missing frame to one construction pass, requesting an optional lazy reader only on that miss.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all FK admission, external part indices, related exclusions, probe order and strict shoulder-reach comparison; base, body and external placements remain unchanged for the frame's existing lifetime.
   * @evidence contracts/development/implementation.md#efficient-algorithms One full ordered pose walk and collider placement per newly built frame plus linear part/probe scans; a body segment whose extent sphere lies beyond the arm's reach of the shoulder places none of its corners, which the reach filter would drop; an optional same-base reader avoids identical completed joint/bone math for the second arm while all outputs remain fresh. Cache hits never invoke a lazy factory or allocate its FK maps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-base arm construction shares only the supplied synchronous FK reader's exact dependencies. Obstacle/probe passes share placements, each owner reuses its inverse frame (the hand's already computed for the fingertip), bounds reuse local points, and the completed shoulder origin feeds unchanged-frame chain queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only the existing weakly keyed per-base frames; temporary placement and owner-group arrays are released after construction and no new cross-pose cache is introduced.
   */
  export function of(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    base: G.IBase,
    alone: boolean,
    prepared?:
      | ReturnType<typeof preparePoseResolution>
      | (() => ReturnType<typeof preparePoseResolution>),
  ): IAutoMovieMotionHumanArmGeometry.IFrame {
    let kept: Map<string, IAutoMovieMotionHumanArmGeometry.IFrame> | undefined =
      FRAMES.get(base);
    if (kept === undefined) FRAMES.set(base, (kept = new Map()));
    const key: string = `${setup.bones.upper}|${alone}`;
    let frame: IAutoMovieMotionHumanArmGeometry.IFrame | undefined =
      kept.get(key);
    if (frame === undefined) {
      const reader: ReturnType<typeof preparePoseResolution> | undefined =
        typeof prepared === "function" ? prepared() : prepared;
      kept.set(key, (frame = built(setup, base, alone, reader)));
    }
    return frame;
  }

  /** The frame of a base, built. */
  function built(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    base: G.IBase,
    alone: boolean,
    prepared?: ReturnType<typeof preparePoseResolution>,
  ): IAutoMovieMotionHumanArmGeometry.IFrame {
    const body: IAutoMovieMotionHumanBody = setup.body;
    const bones: IAutoMovieMotionHumanArmGeometry.ISetup["bones"] = setup.bones;
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, base.pose, prepared);
    const side: "left" | "right" = bones.upper.startsWith("left")
      ? "left"
      : "right";
    const parent: IAutoMovieResolvedBone = resolved.get(
      G.parent(body, bones.upper),
    )!;
    const hand: IAutoMovieResolvedBone = resolved.get(bones.hand)!;
    // The middle fingertip: the distal phalanx's end, its joint carried by
    // the phalanx's own tip offset (`HumanGrip.chain`), the point the speed
    // bound reads. The distal joint alone stood a phalanx short of it.
    const distal: IAutoMovieResolvedBone | undefined = resolved.get(
      `${side}MiddleDistal`,
    );
    const end: IAutoMovieVector3 =
      distal === undefined
        ? hand.worldPosition
        : Vector3.add(
            distal.worldPosition,
            Quaternion.rotateVector(
              distal.worldRotation,
              HumanGrip.chain(body, side, "Middle").tip,
            ),
          );
    const unturn: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
    const tip: IAutoMovieVector3 = Quaternion.rotateVector(
      unturn,
      Vector3.subtract(end, hand.worldPosition),
    );
    const model: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);

    // Frame part indices keep the audit's own parts first, then each placed
    // external segment once. External parts share no own-body reference or
    // joint exclusions, even when their bone names match the body's. One
    // segment is one part however many goals of the group name it: two arms
    // laid on one partner each read the partner's colliders, equal records
    // that would otherwise be two parts and count each contact twice.
    const others: IAutoMovieMotionHumanColliders.IPlaced[] = [];
    const parts: Map<IAutoMovieMotionHumanColliders.IPlaced, number> =
      new Map();
    const placedKeys: Map<string, number> = new Map();
    const shapeIds: Map<
      IAutoMovieMotionHumanColliders.IPlaced["shapes"],
      number
    > = new Map();
    for (const segment of base.others) {
      if (parts.has(segment)) continue;
      const p: IAutoMovieMotionHumanColliders.IPlaced["pose"]["position"] =
        segment.pose.position;
      const q: IAutoMovieMotionHumanColliders.IPlaced["pose"]["rotation"] =
        segment.pose.rotation;
      let shapeId: number | undefined = shapeIds.get(segment.shapes);
      if (shapeId === undefined)
        shapeIds.set(segment.shapes, (shapeId = shapeIds.size));
      const key: string = `${segment.bone}|${shapeId}|${p.x}|${p.y}|${p.z}|${q.x}|${q.y}|${q.z}|${q.w}`;
      let part: number | undefined = placedKeys.get(key);
      if (part === undefined) {
        part = model.parts.length + others.length;
        others.push(segment);
        placedKeys.set(key, part);
      }
      parts.set(segment, part);
    }
    const resting: ReadonlySet<number> = new Set(
      (base.rests ?? [])
        .map(
          (
            segment: IAutoMovieMotionHumanColliders.IPlaced,
          ): number | undefined => parts.get(segment),
        )
        .filter(
          (part: number | undefined): part is number => part !== undefined,
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
    // The performer's own segments the hand is laid on rest with it too.
    const restsOwn: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      base.restsOwn ?? [],
    );
    const restingAll: ReadonlySet<number> =
      restsOwn.size === 0
        ? resting
        : new Set([
            ...resting,
            ...model.parts.flatMap(
              (
                part: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number],
                i: number,
              ): number[] => (restsOwn.has(part.bone) ? [i] : []),
            ),
          ]);
    const shapes: IAutoMovieMotionHumanArmGeometry.IShape[] = [];
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, resolved);
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
    // Segments no human body carries (a prop, an animal) follow the other
    // bodies' parts, each named by its subject and part (`subject:part`).
    const externals: readonly IAutoMovieMotionHumanColliders.IExternal[] =
      base.externals ?? [];
    externals.forEach(
      (segment: IAutoMovieMotionHumanColliders.IExternal, i: number): void => {
        for (const shape of segment.shapes)
          shapes.push(
            S.bounded(
              `${segment.subject}:${segment.part}`,
              model.parts.length + others.length + i,
              segment.pose,
              shape,
            ),
          );
      },
    );

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
    const colliders: IAutoMovieMotionHumanArmGeometry.IFrame["colliders"] = [];
    const corners: IAutoMovieMotionHumanArmGeometry.IFrame["body"] = [];
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const frames: Record<"upper" | "lower" | "hand", IAutoMovieResolvedBone> = {
      upper: resolved.get(bones.upper)!,
      lower: resolved.get(bones.lower)!,
      hand,
    };
    const inverses: Partial<
      Record<"upper" | "lower" | "hand", IAutoMovieQuaternion>
    > = { hand: unturn };

    // The body's segments whose corners the arm is read against, the other
    // arm's left out where it is solved too: their corners are placed once
    // the arm's own reach is known (below), so a segment that lies beyond
    // it places none.
    const obstacles: number[] = [];
    placed.forEach(
      (segment: IAutoMovieMotionHumanColliders.IPlaced, i: number): void => {
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
          const arm: boolean =
            segment.bone === `${other}UpperArm` ||
            segment.bone === `${other}LowerArm` ||
            AutoMovieMotionHumanAuditTangleModel.group(segment.bone) ===
              `${other}Hand`;
          if (!alone && arm) return;
          obstacles.push(i);
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
      },
    );
    const of: (owner: "upper" | "lower" | "hand") => {
      centre: IAutoMovieVector3;
      radius: number;
    } = (
      owner: "upper" | "lower" | "hand",
    ): { centre: IAutoMovieVector3; radius: number } => sphere(byOwner[owner]);
    const bounds: IAutoMovieMotionHumanArmGeometry.IFrame["bounds"] = {
      upper: of("upper"),
      lower: of("lower"),
      hand: of("hand"),
    };

    // The body's corners the arm can come near at all: within its own
    // length, its widest segment and the pairs' reach of the shoulder.
    const shoulder: IAutoMovieVector3 = frames.upper.worldPosition;
    const length: number =
      Vector3.distance(frames.lower.worldPosition, shoulder) +
      Vector3.distance(hand.worldPosition, frames.lower.worldPosition) +
      Vector3.distance(end, hand.worldPosition);
    const around: number =
      length +
      Math.max(bounds.upper.radius, bounds.lower.radius, bounds.hand.radius) +
      NEAR;

    // Every probe of a segment lies within its extent of the segment's
    // origin (`AutoMovieMotionHumanAuditTangleModel.IPart.extent`), so a
    // segment whose origin is farther than that beyond `around` has no
    // corner the filter below keeps, and none is placed.
    for (const i of obstacles) {
      const segment: IAutoMovieMotionHumanColliders.IPlaced = placed[i]!;
      const part: AutoMovieMotionHumanAuditTangleModel.IModel["parts"][number] =
        model.parts[i]!;
      if (
        Vector3.distance(segment.pose.position, shoulder) - part.extent >=
        around + MARGIN
      )
        continue;
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
    }
    externals.forEach(
      (segment: IAutoMovieMotionHumanColliders.IExternal, i: number): void => {
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
              part: model.parts.length + others.length + i,
              corner: corner++,
              bone: `${segment.subject}:${segment.part}`,
            });
      },
    );
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
    const near: IAutoMovieMotionHumanArmGeometry.IFrame["body"] =
      corners.filter(
        (c: IAutoMovieMotionHumanArmGeometry.IFrame["body"][number]): boolean =>
          Vector3.distance(c.point, shoulder) < around,
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
      resting: restingAll,
      bounds,
      colliders,
      shapes,
      body: near,
    };
  }
}

/** How near a body's corner must come to a segment of the arm to be read against it, metres: the pairs' reach (`HumanArmTrajectoryTerms.REACH`). */
const NEAR: number = HumanArmTrajectoryTerms.REACH;

/** The slack a segment's sphere test keeps over the corner filter, metres: far below any probe's spacing, far above the rounding of a rotated probe's length, so the test leaves out only segments none of whose corners the filter keeps. */
const MARGIN: number = 1e-9;

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
  for (const p of points) {
    radius = Math.max(radius, Vector3.distance(p, centre));
  }
  return { centre, radius };
}

/** The frames built, by base and then by arm and solve, kept while the base is held. */
const FRAMES: WeakMap<
  G.IBase,
  Map<string, IAutoMovieMotionHumanArmGeometry.IFrame>
> = new WeakMap();
