import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalShapeNearest,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as A } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "./HumanColliders";
import { HumanJacobian } from "./HumanJacobian";
import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * Another fixed body's collision inequalities in a whole-body contact fit.
 * The same probes as the partner audit are read in both directions: the
 * fitted body's probes in its partner's shapes and the partner's probes in
 * its shapes. A partner is fixed for one solve; a moving partner supplies a
 * new body/pose input through the contact path's goals at that second.
 *
 * Nonpenetration is the shapes' zero signed-distance boundary. A declared
 * contact is supplied by the fit's effector goals and may meet that boundary;
 * it grants no exception to another probe, bone or body part. Own-body joint
 * adjacency and reference overlaps have no meaning between two bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both readings, the fixed-input contract, contact semantics and the signed distance's units.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's signed point-to-shape distance and normal give a collision inequality; its derivative is the moving point's analytic velocity along that normal, negated for a fixed probe against a moving shape by rigid-motion covariance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One posed collider list per body, two directed readings per part pair, and one deepest probe per shape.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the audit's probes without self-body reference or adjacent-part exemptions, keeps partner identity in every key, and introduces no clearance or body-specific adjustment.
 * @evidence contracts/development/implementation.md#efficient-algorithms Bounding spheres spare exact queries only beyond the caller's active-set reach; a far reading is an explicit lower bound and is never linearised as an exact shape query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanColliders, the audit's cached probe models, HumanShapeFraming, physicalShapeNearest and HumanJacobian.velocity.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one reading and retains no state or cross-solve pose cache.
 */
export namespace HumanFitExternal {
  /** A partner held fixed during one geometric solve. */
  export interface IPartner {
    /** The partner's actual body and collider profile. */
    body: IHumanBody;
    /** Its fixed world pose; the caller supplies a new one at a new time. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /** One part's closest probe to one shape, with the moving body's slope. */
  export interface IGap {
    /** Partner, direction, fitted part, partner part and shape: unique even when bone names match. */
    key: string;
    /** The signed gap, metres, or a positive sphere lower bound outside the active reach. */
    distance: number;
    /** Whether the exact shape query was required; only exact readings are linearised. */
    exact: boolean;
    /** The fitted body's bone carrying the point whose velocity differentiates this gap. */
    bone: AutoMovieHumanoidBone;
    /** Its point, world metres: the moving probe or the closest moving surface point. */
    point?: IAutoMovieVector3;
    /** The gap's gradient in that point, world unit direction. */
    normal?: IAutoMovieVector3;
  }

  /**
   * Both directed readings against each fixed partner, keyed by frame parts.
   *
   * @param body The fitted body.
   * @param bones Its actual posed bones.
   * @param partners The fixed external bodies.
   * @param near The fit's existing active-set reach, metres; not a clearance.
   * @returns The gaps; negative distances are penetrations.
   */
  export function read(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    partners: readonly IPartner[],
    near: number,
  ): Map<string, IGap> {
    const model: A.IModel = A.model(body);
    const own: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    if (own.length !== model.parts.length)
      throw new Error(
        "External collision fitting needs the fitted body's complete pose",
      );
    const ownProbes: IAutoMovieVector3[][] = own.map(
      (part: HumanColliders.IPlaced, i: number): IAutoMovieVector3[] =>
        world(model.parts[i]!, part),
    );
    const out: Map<string, IGap> = new Map();
    partners.forEach((partner: IPartner, p: number): void => {
      const other: A.IModel = A.model(partner.body);
      const fixed: HumanColliders.IPlaced[] = HumanColliders.placed(
        partner.body,
        partner.bones,
      );
      if (fixed.length !== other.parts.length)
        throw new Error(
          "External collision fitting needs each partner's complete pose",
        );
      const fixedProbes: IAutoMovieVector3[][] = fixed.map(
        (part: HumanColliders.IPlaced, j: number): IAutoMovieVector3[] =>
          world(other.parts[j]!, part),
      );
      own.forEach((a: HumanColliders.IPlaced, i: number): void => {
        const probes: IAutoMovieVector3[] = ownProbes[i]!;
        fixed.forEach((b: HumanColliders.IPlaced, j: number): void => {
          const theirs: IAutoMovieVector3[] = fixedProbes[j]!;
          b.shapes.forEach((shape, s: number): void => {
            const key: string = `${p}:forward:${i}:${j}:${s}`;
            out.set(
              key,
              gap(
                key,
                a.bone,
                probes,
                model.parts[i]!,
                a,
                b,
                shape,
                near,
                false,
              ),
            );
          });
          a.shapes.forEach((shape, s: number): void => {
            const key: string = `${p}:reverse:${i}:${j}:${s}`;
            out.set(
              key,
              gap(
                key,
                a.bone,
                theirs,
                other.parts[j]!,
                b,
                a,
                shape,
                near,
                true,
              ),
            );
          });
        });
      });
    });
    return out;
  }

  /**
   * An exact gap's analytic row slope in solved units.
   *
   * @param gap The exact pair reading.
   * @param motions The fitted body's variable motions.
   * @param units Each variable's solved unit.
   * @param mm Millimetres in a metre, the existing rows' unit.
   * @returns Millimetres per solved unit.
   */
  export function slope(
    gap: IGap,
    motions: readonly HumanJacobian.IMotion[],
    units: readonly number[],
    mm: number,
  ): number[] {
    if (!gap.exact || gap.point === undefined || gap.normal === undefined)
      throw new Error("A sphere-only collision bound has no exact gap slope");
    return motions.map(
      (motion: HumanJacobian.IMotion, i: number): number =>
        Vector3.dot(
          HumanJacobian.velocity(motion, gap.bone, gap.point!),
          gap.normal!,
        ) *
        units[i]! *
        mm,
    );
  }
}

/** An audit part's probes carried by its actual collider frame. */
function world(
  part: A.IPart,
  placed: HumanColliders.IPlaced,
): IAutoMovieVector3[] {
  return part.probes.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        placed.pose.position,
        Quaternion.rotateVector(placed.pose.rotation, point),
      ),
  );
}

/** One directed probe-to-shape reading, with the moving shape's sign reversed. */
function gap(
  key: string,
  bone: AutoMovieHumanoidBone,
  probes: readonly IAutoMovieVector3[],
  part: A.IPart,
  probeFrame: HumanColliders.IPlaced,
  shapeFrame: HumanColliders.IPlaced,
  shape: HumanColliders.IPlaced["shapes"][number],
  near: number,
  reverse: boolean,
): HumanFitExternal.IGap {
  const framed: HumanShapeFraming.IFramed = HumanShapeFraming.of(
    shapeFrame.pose,
    shape,
  );
  const lower: number =
    Vector3.length(
      Vector3.subtract(A.centre(probeFrame, part), framed.centre),
    ) -
    part.radius -
    framed.radius;
  if (lower > near) return { key, bone, distance: lower, exact: false };
  let best: HumanFitExternal.IGap | undefined;
  for (const probe of probes) {
    if (
      best !== undefined &&
      Vector3.length(Vector3.subtract(probe, framed.centre)) - framed.radius >=
        best.distance
    )
      continue;
    const nearest = physicalShapeNearest(shapeFrame.pose, shape, probe, probe);
    if (best === undefined || nearest.distance < best.distance)
      best = {
        key,
        bone,
        distance: nearest.distance,
        exact: true,
        point: reverse ? nearest.point : probe,
        normal: reverse ? Vector3.scale(nearest.normal, -1) : nearest.normal,
      };
  }
  if (best === undefined)
    throw new Error("An external collision part needs its audit probes");
  return best;
}
