import {
  type preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { BoutTechnique } from "../choreography/BoutTechnique";
import type { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { FighterBody } from "../fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";
import type { Strike } from "../striking/Strike";
import { filmHighestKnee } from "../rig/filmHighestKnee";
import { filmContactIntent } from "./filmContactIntent";
import { filmFeatureDirection } from "./filmFeatureDirection";

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
  const moved: (bone: string) => P.ITransform = (bone: string): P.ITransform => ({
    ...authored.segments[bone]!,
    position: V.vector(V.add(V.tuple(authored.segments[bone]!.position), align)),
  });
  const pose: P.ITransform = moved(intent.sourceBone);
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
  const spec: BoutTechnique.ISpec = BoutTechnique.get(action.technique);
  // A feature is the receiving surface seen from its own side of the
  // receiver's body; otherwise the surface faces the kicking hip.
  const center: P.ITransform["position"] = physicalSupportPoint(
    receiving.pose,
    other.transform.position,
  );
  const viewpoint: V.Value = spec.feature
    ? V.add(
        V.tuple(center),
        filmFeatureDirection(spec.feature, receiver.frame.heading, intent.receiverSide),
      )
    : hip;
  const target: P.ITransform["position"] = queries
    ? queries.project(receiving, V.vector(viewpoint))
    : center;
  const ankle: V.Value = V.tuple(moved(`${intent.side}Foot`).position);
  const knee: V.Value = V.tuple(moved(`${intent.side}LowerLeg`).position);

  // A knee strike keeps its folded chamber and carries the knee itself onto
  // the receiving surface; only the round and push kicks aim the shin.
  if (spec.shape === "knee") {
    const shift: V.Value = V.sub(V.tuple(target), knee);
    return {
      chamber: { ankle, knee },
      impact: { ankle: V.add(ankle, shift), knee: V.tuple(target) },
      maximumAnkleReach: V.distance(hip, knee) + V.distance(knee, ankle),
      hip,
    };
  }
  const strikingCenter: V.Value = V.tuple(
    physicalSupportPoint(pose, own.transform.position),
  );
  const from: V.Value = V.sub(strikingCenter, hip);
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
    position: V.vector(turn(V.tuple(pose.position))),
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
  const impactAnkle: V.Value = V.add(turn(ankle), delta);
  const impact: Strike.Leg = {
    ankle: impactAnkle,
    // A question-mark kick turns the knee over the guard: of every knee the
    // thigh and shank allow for this ankle, it takes the highest, so the
    // lower leg comes down onto the target.
    knee:
      spec.shape === "question-mark"
        ? filmHighestKnee(hip, impactAnkle, V.distance(hip, knee), V.distance(knee, ankle))
        : V.add(turn(knee), delta),
  };
  return {
    chamber: { ankle, knee },
    impact,
    // A descending kick passes over the receiver's head before it falls: the
    // impact configuration raised about the hip until the ankle clears the
    // top of the receiver's head collider.
    ...(spec.line === "descending"
      ? { over: raise(hip, impact, headTop(receiver, targetTrunk) - impact.ankle[1]) }
      : {}),
    maximumAnkleReach: V.distance(hip, knee) + V.distance(knee, ankle),
    hip,
  };
}

/** Highest point of the receiver's head colliders, world metres. */
function headTop(receiver: filmKickGeometry.IContext, trunk: Rig.Trunk): number {
  return Math.max(
    ...receiver.rig.profile.segments
      .filter((segment: P.ISegment): boolean => segment.bone === "head")
      .flatMap((segment: P.ISegment): number[] =>
        segment.shapes.map((shape: P.IShape): number => physicalShapeBounds(trunk.segments.head!, shape).max.y),
      ),
  );
}

/** A leg configuration rotated about the hip in its own vertical plane until the ankle rises by `lift` metres, or as far as the leg's span allows. */
function raise(hip: V.Value, leg: Strike.Leg, lift: number): Strike.Leg {
  const span: V.Value = V.sub(leg.ankle, hip);
  const radius: number = V.length(span);
  if (radius === 0 || lift <= 0) return leg;
  const horizontal: V.Value = [span[0], 0, span[2]];
  const axis: V.Value = V.length(horizontal) === 0 ? [1, 0, 0] : V.normalize([horizontal[2], 0, -horizontal[0]]);
  const before: number = Math.asin(Math.max(-1, Math.min(1, span[1] / radius)));
  const after: number = Math.asin(Math.max(-1, Math.min(1, (span[1] + lift) / radius)));
  const rotation: P.ITransform["rotation"] = Quaternion.fromAxisAngle(V.vector(axis), (after - before) / Quaternion.DEG2RAD);
  const turn = (point: V.Value): V.Value =>
    V.add(hip, V.tuple(Quaternion.rotateVector(rotation, V.vector(V.sub(point, hip)))));
  return { ankle: turn(leg.ankle), knee: turn(leg.knee) };
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
    /** For a descending line, the configuration that passes over the receiver's head before the impact. */ over?: Strike.Leg;
    /** Sum of this side's actual hip-to-knee and knee-to-ankle spans; ROM can further restrict reach. */ maximumAnkleReach: number;
    /** Current actual hip joint. */ hip: V.Value;
  }
}
