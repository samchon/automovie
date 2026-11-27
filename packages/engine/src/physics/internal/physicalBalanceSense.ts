import type { AutoMovieEnginePhysicalBalanceTypes } from "../AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import { physicalStanceBalance } from "../physicalStanceBalance";
import type { physicalStanceSeat } from "../physicalStanceSeat";
import { physicalSupportFootprint } from "./physicalSupportFootprint";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSwingReference } from "../physicalSwingReference";

/**
 * What the balance controller reads of one body this substep, shared by its
 * phases (`advancePhysicalBalance`): the segments' actual state, the supports'
 * measured loads, the authored placements and the policy's limbs. Every reading
 * is a function of the input alone; nothing here writes a body or the
 * recovery's state, and a reading that depends on the state takes the part of
 * it that it reads as an argument.
 *
 * @param input The body's profile, segments, policy, authored placements and
 *   endpoint velocities, the endpoints authored motion owns, the present local
 *   seconds, the substep, gravity's magnitude, the floor's height and the
 *   supports.
 * @returns The readings: the mass centre's position and velocity and the root
 *   segment found now, the rest computed when asked for.
 */
export function physicalBalanceSense(
  input: AutoMovieEnginePhysicalBalanceTypes.Sense.IInput,
): AutoMovieEnginePhysicalBalanceTypes.Sense.ISense {
  const limbs: readonly AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb[] =
    input.policy.pattern.limbs;
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of input.profile.segments) {
    const rigid: AutoMovieXpbdBody = input.segments.get(segment.bone)!;
    center = Vector3.add(
      center,
      Vector3.scale(
        Vector3.add(
          rigid.translation(),
          Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
        ),
        segment.mass / input.profile.mass,
      ),
    );
    velocity = Vector3.add(
      velocity,
      Vector3.scale(
        rigid.velocityAtPoint(
          Vector3.add(
            rigid.translation(),
            Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
          ),
        ),
        segment.mass / input.profile.mass,
      ),
    );
  }

  // The root segment: the one no joint has as its child.
  const root: IAutoMoviePhysicalSegment = input.profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !input.profile.joints.some((joint) => joint.child === segment.bone),
  )!;

  const limb = (bone: string): AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb =>
    limbs.find(
      (candidate: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb): boolean =>
        candidate.bone === bone,
    )!;
  const authored = (bone: string): IAutoMovieVector3 =>
    physicalSupportPoint(input.targets[bone]!, limb(bone).localPoint);
  const actual = (bone: string): IAutoMovieVector3 => {
    const rigid: AutoMovieXpbdBody = input.segments.get(bone)!;
    return physicalSupportPoint(
      { position: rigid.translation(), rotation: rigid.rotation() },
      limb(bone).localPoint,
    );
  };
  const footprint = (
    of: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb,
    state: Readonly<
      Pick<IAutoMoviePhysicalRecoveryState, "seating" | "offsets">
    >,
    at?: IAutoMovieVector3,
  ): IAutoMoviePhysicalSupportPatch => {
    // A seated foot bears with its outline where it is planted: its authored
    // pose moved by its landed offset. An unseated one bears on its face at
    // its present pose, the edge it rolled onto (`physicalStanceBalance
    // .support`).
    const seat = state.seating?.[of.bone];
    const offset: IAutoMovieVector3 =
      at !== undefined
        ? Vector3.subtract(at, authored(of.bone))
        : (state.offsets[of.bone] ?? { x: 0, y: 0, z: 0 });
    const points: IAutoMovieVector3[] = physicalSupportFootprint(
      input.profile,
      at !== undefined || (seat && (seat.flat ?? 1) > 0)
        ? Object.fromEntries(
            (of.contacts ?? [of.bone]).flatMap((carrier: string) =>
              input.targets[carrier]
                ? [
                    [
                      carrier,
                      {
                        position: Vector3.add(
                          input.targets[carrier]!.position,
                          { x: offset.x, y: 0, z: offset.z },
                        ),
                        rotation: input.targets[carrier]!.rotation,
                      },
                    ],
                  ]
                : [],
            ),
          )
        : input.segments,
      of,
      input.floor,
    );
    if (points.length === 0) {
      const standing: IAutoMovieVector3 = actual(of.bone);
      points.push({ x: standing.x, y: input.floor, z: standing.z });
    }
    return {
      bone: of.bone,
      points,
      position: Vector3.scale(
        points.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => Vector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / points.length,
      ),
    };
  };

  return {
    ...input,
    limbs,
    center,
    velocity,
    weight: input.profile.mass * input.gravity,
    root: { segment: root, body: input.segments.get(root.bone)! },
    limb,
    load: (bone: string): number =>
      (input.supports.find(
        (support: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
          support.bone === bone,
      )?.impulse ?? 0) / input.dt,
    touching: (bone: string): boolean =>
      (input.supports.find(
        (support: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
          support.bone === bone,
      )?.samples.length ?? 0) > 0,
    grounded: (of: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb): boolean =>
      physicalSupportFootprint.grounded(
        input.profile,
        input.segments,
        of,
        input.floor,
      ),
    spread: (bone: string): number => {
      const segment: IAutoMoviePhysicalSegment | undefined =
        input.profile.segments.find(
          (candidate: IAutoMoviePhysicalSegment): boolean =>
            candidate.bone === bone,
        );
      const goal: IAutoMovieRigidTransform | undefined = input.targets[bone];
      const rigid: AutoMovieXpbdBody | undefined = input.segments.get(bone);
      if (!segment || !goal || !rigid) return 0;
      const vertices: IAutoMovieVector3[] = physicalSupportFootprint
        .colliders(segment)
        .flatMap(
          (shape): IAutoMovieVector3[] =>
            physicalSupportFootprint.corners(shape) ?? [],
        );
      if (vertices.length === 0) return 0;
      const planted: number[] = vertices.map(
        (vertex: IAutoMovieVector3): number =>
          physicalSupportPoint(goal, vertex).y,
      );
      const lowest: number = Math.min(...planted);
      const pose: IAutoMovieRigidTransform = {
        position: rigid.translation(),
        rotation: rigid.rotation(),
      };
      const heights: number[] = vertices
        .filter(
          (_: IAutoMovieVector3, index: number): boolean =>
            planted[index]! <= lowest + physicalStanceBalance.LIFT,
        )
        .map(
          (vertex: IAutoMovieVector3): number =>
            physicalSupportPoint(pose, vertex).y,
        );
      return Math.max(...heights) - Math.min(...heights);
    },
    authored,
    actual,
    latch: (
      of: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb,
    ): NonNullable<physicalStanceSeat.ISeat["anchor"]> => ({
      point: actual(of.bone),
      rotation: { ...input.segments.get(of.bone)!.rotation() },
    }),
    legMass: (of: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb): number =>
      [...new Set([...of.chain, ...(of.contacts ?? [])])].reduce(
        (sum: number, bone: string): number =>
          sum +
          (input.profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === bone,
          )?.mass ?? 0),
        0,
      ),
    hang: (of: AutoMovieEnginePhysicalBalanceTypes.Sense.ILimb): number => {
      const at: IAutoMovieVector3 = actual(of.bone);
      const shift: IAutoMovieVector3 = Vector3.subtract(at, authored(of.bone));
      return physicalSwingReference.hang({
        profile: input.profile,
        carriers: of.contacts ?? [of.bone],
        planned: (bone: string): IAutoMovieRigidTransform | undefined => {
          const goal: IAutoMovieRigidTransform | undefined =
            input.targets[bone];
          return goal
            ? {
                position: Vector3.add(goal.position, shift),
                rotation: goal.rotation,
              }
            : undefined;
        },
        endpoint: at,
        planted: (bone: string): IAutoMovieRigidTransform | undefined =>
          input.targets[bone],
        rest: authored(of.bone),
      });
    },
    footprint,
    inset: (
      bone: string,
      offsets: IAutoMoviePhysicalRecoveryState["offsets"],
    ): IAutoMovieVector3 => {
      const patch: IAutoMoviePhysicalSupportPatch = footprint(
        limb(bone),
        { offsets },
        Vector3.add(authored(bone), offsets[bone] ?? { x: 0, y: 0, z: 0 }),
      );
      const endpoint: IAutoMovieVector3 = Vector3.add(
        authored(bone),
        offsets[bone] ?? { x: 0, y: 0, z: 0 },
      );
      return {
        x: patch.position.x - endpoint.x,
        y: 0,
        z: patch.position.z - endpoint.z,
      };
    },
  };
}
