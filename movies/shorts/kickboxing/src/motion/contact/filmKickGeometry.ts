import {
  type preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { FighterBody } from "../fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";
import type { Strike } from "../striking/Strike";
import { filmContactIntent } from "./filmContactIntent";

/** Turn the current authored shin toward the selected actual receiving surface, preserving its knee bend and swing plane, then map that surface witness onto the receiver. These are clinical IK goals, not a claimed achievable pose or contact. Prepared geometry supplies real surface witnesses; nominal comparison authoring uses the same declared collider centers. */
export function filmKickGeometry(
  source: filmKickGeometry.IContext,
  receiver: filmKickGeometry.IContext,
  action: BoutScript.Action,
  queries?: Geometry.IQueries,
): filmKickGeometry.IDelivery {
  const intent: filmContactIntent.IIntent = filmContactIntent(action);
  if (!intent.kick)
    throw new Error("Kick geometry requires the declared shin technique");
  const authored: Rig.Trunk =
    source.authored ?? source.rig.trunk(FighterBody.pose(source.frame), source.root);
  const hip: V.Value = source.trunk.hipJoints[intent.side];
  const align: V.Value = V.sub(hip, authored.hipJoints[intent.side]);
  const pose: P.ITransform = {
    ...authored.segments[intent.sourceBone]!,
    position: V.vector(
      V.add(V.tuple(authored.segments[intent.sourceBone]!.position), align),
    ),
  };
  const own: P.IShape = source.rig.profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === intent.sourceBone,
  )!.shapes[0]!;
  const targetTrunk: Rig.Trunk =
    intent.relation === null
      ? (receiver.nominal ?? receiver.trunk)
      : receiver.trunk;
  const other: P.IShape = receiver.rig.profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === intent.targetBone,
  )!.shapes[0]!;
  const receiving: Geometry.ICollider = {
    body: receiver.id,
    bone: intent.targetBone,
    shape: other,
    pose: targetTrunk.segments[intent.targetBone]!,
  };
  const target: P.ITransform["position"] = queries
    ? queries.project(receiving, V.vector(hip))
    : physicalSupportPoint(receiving.pose, other.transform.position);
  const ankle: V.Value = V.add(
    V.tuple(authored.segments[`${intent.side}Foot`]!.position),
    align,
  );
  const knee: V.Value = V.tuple(pose.position);

  // A knee strike keeps its folded chamber and carries the knee itself onto
  // the receiving surface; only the round and push kicks aim the shin.
  if (BoutScript.specs[action.technique].shape === "knee") {
    const shift: V.Value = V.sub(V.tuple(target), knee);
    return {
      chamber: { ankle, knee },
      impact: { ankle: V.add(ankle, shift), knee: V.tuple(target) },
      maximumAnkleReach: V.distance(hip, knee) + V.distance(knee, ankle),
      hip,
    };
  }
  const center: V.Value = V.tuple(
    physicalSupportPoint(pose, own.transform.position),
  );
  const from: V.Value = V.sub(center, hip);
  const to: V.Value = V.sub(V.tuple(target), hip);
  if (V.length(from) === 0 || V.length(to) === 0)
    throw new Error(
      "Kick direction requires distinct hip, shin and receiver geometry",
    );
  let axis: P.ITransform["position"] = Vector3.cross(
    V.vector(from),
    V.vector(to),
  );
  const dot: number = V.dot(from, to);

  // At an exactly opposite direction the shortest arc has no unique axis. The
  // current anatomical leg plane selects its continuation, without an angle seed.
  if (Vector3.length(axis) === 0 && dot < 0) {
    axis = Vector3.cross(V.vector(from), V.vector(V.sub(knee, hip)));
    if (Vector3.length(axis) === 0)
      axis = Vector3.cross(V.vector(from), V.vector(V.sub(ankle, hip)));
    if (Vector3.length(axis) === 0) {
      axis = Vector3.cross(
        V.vector(from),
        Quaternion.rotateVector(pose.rotation, { x: 1, y: 0, z: 0 }),
      );
      if (Vector3.length(axis) === 0)
        axis = Vector3.cross(
          V.vector(from),
          Quaternion.rotateVector(pose.rotation, { x: 0, y: 1, z: 0 }),
        );
    }
  }
  const angle: number =
    Math.atan2(
      Vector3.length(Vector3.cross(V.vector(from), V.vector(to))),
      dot,
    ) / Quaternion.DEG2RAD;
  const rotation: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
    axis,
    angle,
  );
  /** A rigid change of aim preserves the provider's actual segment lengths and bend. */
  const turn: (point: V.Value) => V.Value = (point: V.Value): V.Value =>
    V.add(
      hip,
      V.tuple(Quaternion.rotateVector(rotation, V.vector(V.sub(point, hip)))),
    );
  const aimed: P.ITransform = {
    position: V.vector(turn(knee)),
    rotation: Quaternion.multiply(rotation, pose.rotation),
  };
  const striking: Geometry.ICollider = {
    body: source.id,
    bone: intent.sourceBone,
    shape: own,
    pose: aimed,
  };
  const aimedCenter: P.ITransform["position"] = physicalSupportPoint(
    aimed,
    own.transform.position,
  );
  const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
    aimed,
    own,
  );

  // A nearest boundary from inside a capsule can have multiple valid witnesses.
  // Query from beyond the actual bounds in the receiving direction instead; this
  // changes only the seed witness, never the actual receiver target or solver.
  const outside: V.Value = V.add(
    V.tuple(aimedCenter),
    V.scale(
      V.normalize(to),
      V.distance(V.tuple(bounds.min), V.tuple(bounds.max)) +
        V.distance(V.tuple(aimedCenter), V.tuple(target)),
    ),
  );
  const witness: P.ITransform["position"] = queries
    ? queries.project(striking, V.vector(outside))
    : aimedCenter;
  const delta: V.Value = V.sub(V.tuple(target), V.tuple(witness));
  return {
    chamber: { ankle, knee },
    impact: {
      ankle: V.add(turn(ankle), delta),
      knee: V.add(turn(knee), delta),
    },
    maximumAnkleReach: V.distance(hip, knee) + V.distance(knee, ankle),
    hip,
  };
}

/** Borrowed current staging and the resulting provider-derived path landmarks. */
export namespace filmKickGeometry {
  /** One performer in the same scene snapshot. */
  export interface IContext {
    /** Actual scene body identity. */ id: string;
    /** Fixed provider and declared equipment. */ rig: Rig;
    /** Current clinical authoring intent. */ frame: FighterBody.Frame;
    /** Current authored root, metres and unit quaternion. */ root: Rig.Placement;
    /** Actual supplied world carriers or the initial authored FK. */ trunk: Rig.Trunk;
    /** Same-frame authored FK, when already prepared by the owning resolver. */ authored?: Rig.Trunk;
    /** Un-evaded aiming hint for an explicitly planned miss. */ nominal?: Rig.Trunk;
  }
  /** Same-frame anatomical seed; final shared fitting owns actual geometry. */
  export interface IDelivery {
    /** Current authored knee/ankle configuration. */ chamber: Strike.Leg;
    /** Rigidly aimed configuration with its surface witness mapped onto the receiver; shared IK may still report an unreachable goal. */ impact: Strike.Leg;
    /** Sum of this side's actual hip-to-knee and knee-to-ankle spans; ROM can further restrict reach. */ maximumAnkleReach: number;
    /** Current actual hip joint. */ hip: V.Value;
  }
}
