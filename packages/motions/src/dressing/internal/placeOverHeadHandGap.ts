import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangleModel } from "../../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanArmTarget } from "../../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanHand } from "../../compose/AutoMovieMotionHumanHand";
import { HumanPropFrame } from "../../perform/HumanPropFrame";
import { HumanColliders } from "../../posture/HumanColliders";
import { assembleHumanPosture } from "../../posture/internal/assembleHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanWornItem } from "../HumanWornItem";
import type { placeOverHeadPath } from "./placeOverHeadPath";

/** Clearance of both grip shapes against the recipient's upper body. */
export function placeOverHeadHandGap(
  props: placeOverHeadHandGap.IProps,
): placeOverHeadPath.IHandGap {
  const { body, partner, side, other }: placeOverHeadHandGap.IProps = props;
  const otherBones: ReturnType<typeof poseBones> = poseBones(
    body,
    assembleHumanPosture(body, {
      ...props.posture,
      limbs: {},
      joints: {
        ...props.posture.joints,
        ...AutoMovieMotionHumanHand.fingers(other, "relaxed", 0, 1),
      },
    }).pose,
  );
  const holding: readonly IAutoMovieVector3[] = probes(body, props.pose, side);
  const grasping: readonly IAutoMovieVector3[] = probes(
    body,
    otherBones,
    other,
  );
  const upper: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.preparePlaced(partner.body, UPPER)(partner.bones);
  const distances = (
    parts: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): readonly Query[] =>
    parts.flatMap((part: IAutoMovieMotionHumanColliders.IPlaced): Query[] =>
      part.shapes.map(
        (shape: IAutoMoviePhysicalShape): Query =>
          AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(part.pose, shape),
      ),
    );
  const shoulders: readonly Query[] = distances(
    upper.filter((part) => SHOULDERS.has(part.bone)),
  );
  const shoulderGap = (frame: IAutoMovieRigidTransform): number =>
    Math.min(
      nearest(holding, wrist(side, props.holding(frame)), shoulders),
      nearest(grasping, wrist(other, props.grasping(frame)), shoulders),
    );
  const shapes: readonly IAutoMoviePhysicalShape[] = props.shapes;
  if (shapes.length === 0) return { shoulders: shoulderGap };
  const clear: readonly Query[] = distances(upper);
  const heldAt: IAutoMovieRigidTransform = wrist(side, props.holding(ORIGIN));
  const assistedAt: IAutoMovieRigidTransform = wrist(
    other,
    props.grasping(ORIGIN),
  );
  const carried: readonly IAutoMovieVector3[] = holding.map((point) =>
    HumanWornItem.point(heldAt, point),
  );
  const assisted: readonly IAutoMovieVector3[] = [
    ...carried,
    ...grasping.map((point) => HumanWornItem.point(assistedAt, point)),
  ];
  const parts = shapes.map((shape: IAutoMoviePhysicalShape) => ({
    shape,
    bounds: AutoMovieEnginePhysics.physicalShapeBounds(ORIGIN, shape),
    clasp:
      AutoMovieEnginePhysics.physicalShapeSegmentDistance(ORIGIN, shape, props.wear, props.wear) <=
      SHAPE_ROUNDING,
  }));
  return {
    shoulders: shoulderGap,
    sweeps: { assisted: sweep(assisted, false), carried: sweep(carried, true) },
  };

  function wrist(
    hand: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanArmTarget.ITarget,
  ): IAutoMovieRigidTransform {
    return {
      position: AutoMovieMotionHumanArmTarget.goal(body, hand, target).point,
      rotation: target.rotation,
    };
  }

  function sweep(
    points: readonly IAutoMovieVector3[],
    seat: boolean,
  ): placeOverHeadPath.ISweep {
    return {
      gap: (frame: IAutoMovieRigidTransform): number => {
        let gap: number = nearest(points, frame, clear);
        if (gap < AutoMovieMotionHumanAuditSkin.BUILT) return gap;
        for (const { shape, clasp } of parts)
          for (const part of upper) {
            // Only the pieces at the named wear site may meet the neck.
            if (seat && clasp && part.bone === "neck") continue;
            for (const obstacle of part.shapes)
              gap = Math.min(
                gap,
                AutoMovieMotionHumanAuditSkin.BUILT +
                  AutoMovieEnginePhysics.physicalShapePairDistance(frame, shape, part.pose, obstacle),
              );
          }
        return gap;
      },
      radius: (pivot: IAutoMovieVector3): number =>
        Math.max(
          ...points.map((p): number => Vector3.distance(p, pivot)),
          ...parts.map(({ bounds: { min, max } }): number =>
            Math.hypot(
              Math.max(Math.abs(min.x - pivot.x), Math.abs(max.x - pivot.x)),
              Math.max(Math.abs(min.y - pivot.y), Math.abs(max.y - pivot.y)),
              Math.max(Math.abs(min.z - pivot.z), Math.abs(max.z - pivot.z)),
            ),
          ),
        ),
    };
  }
}

/** The prepared signed distance to a fixed partner shape. */
type Query = ReturnType<typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance>;

/** Roundoff in locating the wear socket on an adjoining collider surface. */
const SHAPE_ROUNDING: number = 1e-9;

/** Prepared witnesses are read in the frame of the loop or the wrist. */
function nearest(
  points: readonly IAutoMovieVector3[],
  frame: IAutoMovieRigidTransform,
  distances: readonly Query[],
): number {
  let result: number = Infinity;
  for (const point of points) {
    const at: IAutoMovieVector3 = HumanWornItem.point(frame, point);
    for (const gap of distances) result = Math.min(result, gap(at, at));
  }
  return result;
}

/** The local frame on which the two rigid grasps are laid. */
const ORIGIN: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: Quaternion.identity(),
};

/** The partner-facing colliders bordering the loop's descent past the neck. */
const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "chest",
  "upperChest",
  "leftShoulder",
  "rightShoulder",
  "leftUpperArm",
  "rightUpperArm",
]);

/** The head, neck and shoulders that bracket the whole descent. */
const UPPER: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  ...SHOULDERS,
  "neck",
  "head",
]);

/** The tangle model's own hand and digit probes in the wrist's frame. */
function probes(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
): IAutoMovieVector3[] {
  const name: AutoMovieHumanoidBone = `${side}Hand`;
  const wrist: IAutoMovieRigidTransform = HumanPropFrame.bone(bones.get(name)!);
  return HumanColliders.placed(body, bones).flatMap(
    (
      part: IAutoMovieMotionHumanColliders.IPlaced,
      i: number,
    ): IAutoMovieVector3[] => {
      if (AutoMovieMotionHumanAuditTangleModel.group(part.bone) !== name)
        return [];
      const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
        wrist,
        part.pose,
      );
      const model: IAutoMovieMotionHumanAuditTangleModel.IPart =
        body.tangle.parts[i]!;
      return model.probes.map(
        (point: IAutoMovieVector3): IAutoMovieVector3 =>
          HumanWornItem.point(local, point),
      );
    },
  );
}

/** The two grip poses and the partner at the start of the action. */
export namespace placeOverHeadHandGap {
  /** A grip target on a candidate loop frame. */
  export type Target = (
    frame: IAutoMovieRigidTransform,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;

  /** The grip witnesses on the dresser and the recipient's authored frame. */
  export interface IProps {
    body: IAutoMovieMotionHumanBody;
    shapes: readonly IAutoMoviePhysicalShape[];
    wear: IAutoMovieVector3;
    posture: IAutoMovieMotionHumanPosture;
    pose: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    side: AutoMovieHumanSide;
    other: AutoMovieHumanSide;
    holding: Target;
    grasping: Target;
    partner: {
      body: IAutoMovieMotionHumanBody;
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    };
  }
}
