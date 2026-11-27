import {
  AutoMovieEngineKinematics,
  AutoMovieEngineMath,
  AutoMovieEnginePhysics,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieFitHumanPhysicalStandingPose, IAutoMoviePhysicalJoint, IAutoMoviePhysicalJointAxis, IAutoMoviePhysicalProfile, IAutoMoviePhysicalSegment, IAutoMoviePhysicalShape, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPhysicalArmRoom } from "./internal/HumanPhysicalArmRoom";
import { HumanPhysicalSolePlant } from "./internal/HumanPhysicalSolePlant";

/** Fit an authored Human standing pose to physical support. */
export namespace AutoMovieHumanPhysicalStandingPose {
  /**
   * Admit a supported Human pose to native joint coordinates once before a
   * simulation. Three actual points on each foot preserve all translational and
   * rotational degrees of freedom as the legs settle into native axes. The ground
   * plane, collider definitions, the pelvis's orientation and its horizontal
   * place are retained.
   *
   * The feet are planted at this handoff. The motion foot model stands a foot on
   * its sockets, which lie on the bounds of the foot's colliders at rest, but the
   * drawn heel hull does not reach that plane: in the quiet Stand its lowest
   * point is 33.8 mm above the floor (m-average; 37.9 mm m-tall) while the
   * forefoot hull touches it. A body handed over that way stands on its forefoot
   * alone and falls. So each foot is turned in the direction of the ankle's
   * flexion axis about its forefoot's bearing point, which keeps its place on the
   * floor, until the heel and forefoot hulls touch the floor together: about 16
   * degrees of dorsiflexion, which leaves the ankle about 38 mm lower and 15 mm
   * further back (m-average; 44 mm lower m-tall, 32 mm f-small). A standing leg
   * is within a few millimetres of full extension and cannot reach that ankle
   * from the authored pelvis, so the body above the feet is set straight down by
   * the drop the most demanding leg needs to stand its knee a shank's length from
   * its planted ankle, about 41 mm (m-average; 46 mm m-tall, 34 mm f-small), and
   * then further by what bends a straight leg's knee 30 degrees (`KNEE`): a
   * nearly straight leg is singular for balance by contact force, which must
   * shift load by joint torque. That leg turns only its shank, by about 2
   * degrees, keeping its thigh; in a symmetric stance both legs do. A leg the
   * drop brings nearer its ankle than that, as the unloaded leg of a weight
   * shift, also bends its knee forward in the plane of its own bend, turning its
   * thigh, until it reaches. The joint solver then gives each shank's turn to the
   * knee's native axes, which turns a thigh mostly about its own length once the
   * shift is wide: after an 80 mm shift by up to 0.8 degrees, its knee moving 0.3
   * degrees about the hip. The pelvis keeps its orientation and horizontal place,
   * and the trunk and head keep their authored shape. Keeping the bearing point,
   * not the ankle, keeps the mass center where the authored stance holds it over
   * the forefoot: turned about the ankle instead, the planted contacts move 15 mm
   * forward under it and m-tall steps out of its stance within a quarter second.
   *
   * The arms are opened at this handoff too. The displayed arm hangs with its
   * forearm resting on the waist, which the motion audit admits as the skin's
   * give, 2 mm inside the spine's hull (m-average; 10 mm m-large). A rigid hull
   * has no give, and a pair the profile does not exclude would be pushed apart on
   * the first substep, so each arm keeps its own shape and turns outward about
   * its shoulder's abduction axis by the least angle that leaves it the fit's
   * tolerance clear of every collider outside it, 0.5 degrees (m-average; 2.1
   * degrees m-large, under 0.01 degrees f-small and m-tall;
   * `HumanPhysicalArmRoom`).
   *
   * The physical pose therefore differs from the authored one by that turn at the
   * feet, those leg turns, that drop of the body and that opening of the arms;
   * the difference is this handoff's correction of the rigid colliders' mismatch
   * with the drawn feet and the soft body, not motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the actual sole witnesses, the bounded transfer and the preserved frames.
   * @evidence contracts/development/implementation.md#principled-implementation Fits both articulated legs against measured hull points in metres. Independently checks anchor closure, all native joint coordinates, whole-body clearance and the projected mass center.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the Engine articulation solver and its geometry and joint readers with Human's canonical support carriers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unavailable support region, a sole above its bearing allowance or below the floor, a missed fit or an inadmissible resulting pose returns a refusal and supplies no motor goals; the body is set down only as far as the planted ankles require, an arm opens only as far as its clearance requires, and the pelvis neither turns nor moves sideways.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads each sole once before the bounded leg solve. The residual only moves six fixed local points across its probes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each invocation fits the supplied authored pose and retains no cached targets.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All point geometry, poses and residual callbacks are local. No native world is created.
   */
  export function fit(
    input: IAutoMovieFitHumanPhysicalStandingPose.IInput,
  ): Result {
    const { profile, targets, floor, tolerance, iterations } = input;
    if (
      !Number.isFinite(floor) ||
      !Number.isFinite(tolerance) ||
      tolerance <= 0 ||
      !Number.isSafeInteger(iterations) ||
      iterations < 1 ||
      iterations > 64 ||
      !Number.isFinite(profile.mass) ||
      profile.mass <= 0 ||
      profile.segments.some(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          !valid(targets[segment.bone]),
      )
    )
      return { kind: "unresolved", reason: "input" };
    if (!anchors(profile, targets))
      return { kind: "unresolved", reason: "anchor" };

    const bones: string[] = [];
    const seeded: Record<string, IAutoMovieRigidTransform> = { ...targets };
    const plans: { side: "left" | "right"; foot: IAutoMovieRigidTransform }[] =
      [];
    const vertices: IVertex[][] = [];
    const goals: (IVertex & { world: IAutoMovieVector3 })[] = [];
    for (const side of ["left", "right"] as const) {
      const leg: readonly string[] = [
        `${side}UpperLeg`,
        `${side}LowerLeg`,
        `${side}Foot`,
        `${side}Toes`,
      ];
      if (
        !leg.every((bone: string, index: number): boolean =>
          profile.joints.some(
            (joint: IAutoMoviePhysicalJoint): boolean =>
              joint.child === bone && joint.parent === (leg[index - 1] ?? "hips"),
          ),
        )
      )
        return { kind: "unresolved", reason: "support-geometry" };
      bones.push(...leg.slice(0, -1));

      const foot: string = `${side}Foot`;
      const points: IVertex[] = [];
      for (const bone of [foot, `${side}Toes`]) {
        const segment: IAutoMoviePhysicalSegment | undefined =
          profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === bone,
          );
        if (!segment || segment.shapes.length === 0)
          return { kind: "unresolved", reason: "support-geometry" };
        for (const shape of segment.shapes) {
          if (shape.kind !== "hull")
            return { kind: "unresolved", reason: "support-geometry" };
          const region: IVertex["region"] =
            bone !== foot
              ? undefined
              : shape.id === `${side}Subtalar` ||
                  shape.id.startsWith(`${side}Subtalar.`)
                ? "heel"
                : shape.id === `${side}Midfoot` ||
                    shape.id.startsWith(`${side}Midfoot.`)
                  ? "forefoot"
                  : undefined;
          for (const point of shape.points)
            points.push({
              bone,
              region,
              local: AutoMovieEnginePhysics.physicalSupportPoint(shape.transform, point),
            });
        }
      }

      const own: IVertex[] = points.filter(
        (point: IVertex): boolean => point.bone === foot,
      );
      if (
        !own.some((point: IVertex): boolean => point.region === "heel") ||
        !own.some((point: IVertex): boolean => point.region === "forefoot")
      )
        return { kind: "unresolved", reason: "support-geometry" };

      // The authored sole bears on the floor as the motion foot model reads
      // it: its lowest hull point within the model's bearing allowance and
      // none below the floor. The hulls are then planted on it.
      const bearing: number =
        Math.min(
          ...own.map(
            (point: IVertex): number =>
              AutoMovieEnginePhysics.physicalSupportPoint(targets[foot]!, point.local).y,
          ),
        ) - floor;
      if (bearing < -tolerance || bearing > BEARING)
        return { kind: "unresolved", reason: "support-plane" };
      // The foot turns on the ankle's own flexion axis, so the native ankle
      // takes the whole turn and no leg twists to supply a sideways part.
      const flexion: IAutoMoviePhysicalJointAxis | undefined = profile.joints
        .find((joint: IAutoMoviePhysicalJoint): boolean => joint.child === foot)
        ?.axes.find(
          (axis: IAutoMoviePhysicalJointAxis): boolean =>
            axis.channel === `${foot}.flexion`,
        );
      if (flexion === undefined)
        return { kind: "unresolved", reason: "support-geometry" };
      const placed: IAutoMovieRigidTransform | undefined =
        HumanPhysicalSolePlant.plant(
          targets[foot]!,
          own,
          floor,
          Quaternion.rotateVector(targets[`${side}LowerLeg`]!.rotation, {
            x: flexion.axis === "x" ? 1 : 0,
            y: flexion.axis === "y" ? 1 : 0,
            z: flexion.axis === "z" ? 1 : 0,
          }),
        );

      if (placed === undefined)
        return { kind: "unresolved", reason: "support-geometry" };
      const planted: Poses = { ...targets, [foot]: placed };
      plans.push({ side, foot: placed });
      const heel: IVertex | undefined = HumanPhysicalSolePlant.lowest(
        own,
        planted,
        "heel",
      );
      const forefoot: IVertex | undefined = HumanPhysicalSolePlant.lowest(
        own,
        planted,
        "forefoot",
      );
      if (!heel || !forefoot || forefoot.local.z - heel.local.z <= tolerance)
        return { kind: "unresolved", reason: "support-geometry" };
      const line: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(forefoot.local, heel.local),
      );
      let lateral: IVertex = heel;
      let span: number = 0;
      for (const vertex of own) {
        const width: number = Vector3.length(
          Vector3.cross(Vector3.subtract(vertex.local, heel.local), line),
        );
        if (width > span) {
          lateral = vertex;
          span = width;
        }
      }
      if (span <= tolerance)
        return { kind: "unresolved", reason: "support-geometry" };

      vertices.push(points);
      for (const vertex of [heel, forefoot, lateral])
        goals.push({
          ...vertex,
          world: AutoMovieEnginePhysics.physicalSupportPoint(placed, vertex.local),
        });
    }

    // A planted ankle lies lower than the authored one, beyond the reach of a
    // standing leg from the authored pelvis. The body above the feet is set
    // straight down by the drop the most demanding leg needs to stand its knee
    // a shank's length from its planted ankle. That leg turns only its shank,
    // keeping its thigh against the hanging hand; a leg the drop brings nearer
    // its ankle bends its knee and turns its thigh to reach
    // (`HumanPhysicalSolePlant.swing`). A nearly straight standing knee gives a
    // joint solver no first-order way along the leg, so this seed is built here
    // and the solver refines it in native axes.
    // The body then goes down further, by what bends a straight leg's knee to
    // `KNEE`; each leg bends forward in its own plane to reach its ankle.
    const drop: number =
      Math.max(
        0,
        ...plans.map((plan: (typeof plans)[number]): number =>
          HumanPhysicalSolePlant.lowering(profile, targets, plan.side, plan.foot),
        ),
      ) + flexion(profile, targets);
    if (!Number.isFinite(drop)) return { kind: "unresolved", reason: "fit" };
    for (const bone of Object.keys(seeded))
      seeded[bone] = {
        position: {
          ...seeded[bone]!.position,
          y: seeded[bone]!.position.y - drop,
        },
        rotation: seeded[bone]!.rotation,
      };
    for (const plan of plans)
      if (!HumanPhysicalSolePlant.swing(profile, seeded, plan.side, plan.foot))
        return { kind: "unresolved", reason: "fit" };

    const fit: ReturnType<typeof AutoMovieEnginePhysics.solvePhysicalArticulationTargets> =
      AutoMovieEnginePhysics.solvePhysicalArticulationTargets({
        profile,
        bones,
        targets: seeded,
        tolerance,
        iterations,
        measure: (poses: Poses): number[] =>
          goals.flatMap((goal: (typeof goals)[number]): number[] => {
            const error: IAutoMovieVector3 = Vector3.subtract(
              AutoMovieEnginePhysics.physicalSupportPoint(poses[goal.bone]!, goal.local),
              goal.world,
            );
            return [error.x, error.y, error.z];
          }),
      });
    const residual: number = fit.residual;
    if (residual > tolerance)
      return { kind: "unresolved", reason: "fit", residual };
    // A forearm resting on the waist is admitted as the skin's give in the
    // display but would start inside a rigid hull: each arm opens at the
    // shoulder by the least abduction that clears it. It opens after the
    // solve, which still turns the thighs the hands hang beside, and turns
    // only the whole arm about its shoulder anchor, so every anchor stays
    // closed; the checks below read the result.
    const posed: Record<string, IAutoMovieRigidTransform> = { ...fit.targets };
    if (!HumanPhysicalArmRoom.open(profile, posed, tolerance))
      return { kind: "unresolved", reason: "fit", residual };
    if (!anchors(profile, posed))
      return { kind: "unresolved", reason: "anchor", residual };
    if (
      profile.joints.some((joint: IAutoMoviePhysicalJoint): boolean =>
        AutoMovieEnginePhysics.measurePhysicalJointLimits(
          joint,
          posed[joint.parent]!,
          posed[joint.child]!,
        ).some(
          (
            coordinate: ReturnType<typeof AutoMovieEnginePhysics.measurePhysicalJointLimits>[number],
          ): boolean => !(coordinate.violation <= ANGLE_ROUNDOFF),
        ),
      )
    )
      return { kind: "unresolved", reason: "joint-limit", residual };

    const base: IAutoMovieVector3[] | undefined = support(
      vertices,
      posed,
      floor,
      tolerance,
    );
    if (
      !base ||
      profile.segments.some((segment: IAutoMoviePhysicalSegment): boolean =>
        segment.shapes.some(
          (shape: IAutoMoviePhysicalShape): boolean =>
            AutoMovieEnginePhysics.physicalShapeBoundsLowest(posed[segment.bone]!, shape) <
            floor - tolerance,
        ),
      )
    )
      return { kind: "unresolved", reason: "support-plane", residual };

    const center: IAutoMovieVector3 = profile.segments.reduce(
      (
        sum: IAutoMovieVector3,
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(
            AutoMovieEnginePhysics.physicalSupportPoint(posed[segment.bone]!, segment.centerOfMass),
            segment.mass / profile.mass,
          ),
        ),
      { x: 0, y: 0, z: 0 },
    );
    if (
      AutoMovieEngineMath.convexHull2D(base).length < 3 ||
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(center, base) < 0
    )
      return { kind: "unresolved", reason: "balance", residual };
    return { kind: "fitted", targets: posed, residual };
  }
}

/** Arithmetic allowance for coincident double-precision anchors, metres. */
const ANCHOR_ROUNDOFF: number = 1e-9;

/** Arithmetic allowance for double-precision native angle comparisons, radians. */
const ANGLE_ROUNDOFF: number = 1e-9;

/**
 * The height above the floor within which an authored sole bears on it, metres:
 * the motion foot model's own allowance (`HumanFoot.BEARING`, under half the
 * 12.9 mm mean minimum toe clearance of normal walking, Winter 1992).
 */
const BEARING: number = 0.006;

/**
 * The stance knee flexion the body is lowered to at this handoff, radians. A
 * standing leg within a few millimetres of full extension is singular: its
 * joint torques cannot shift vertical load, and balance control by contact
 * force needs that, so balancing legs stand with bent knees. 30 degrees keeps
 * each leg's two-link Jacobian conditioned (condition number about 9 for equal
 * thigh and shank) and is the most the ankle allows: the shank leans half the
 * knee's flexion, on top of the sole plant's 16 degrees of dorsiflexion, within
 * the loaded ankle's 39 degrees (`ANKLE_DORSIFLEXION`) with 8 degrees to
 * spare.
 */
const KNEE: number = Math.PI / 6;

/** Segment frames borrowed for one standing transfer. */
type Poses = Readonly<Record<string, IAutoMovieRigidTransform>>;

/** The public standing transfer outcome. */
type Result = IAutoMovieFitHumanPhysicalStandingPose.IResult;

/** One actual collider vertex in its carrier frame. */
type IVertex = HumanPhysicalSolePlant.IVertex;

/** Validate one complete world transform before passing it to the solver. */
function valid(pose: IAutoMovieRigidTransform | undefined): boolean {
  return (
    pose !== undefined &&
    [pose.position.x, pose.position.y, pose.position.z].every(
      Number.isFinite,
    ) &&
    Math.abs(
      Math.hypot(
        pose.rotation.x,
        pose.rotation.y,
        pose.rotation.z,
        pose.rotation.w,
      ) - 1,
    ) <= ANGLE_ROUNDOFF
  );
}

/**
 * Check the exact positional anchors before adapting orientation and after
 * fitting.
 */
function anchors(profile: IAutoMoviePhysicalProfile, poses: Poses): boolean {
  return profile.joints.every((joint: IAutoMoviePhysicalJoint): boolean => {
    const parent: IAutoMovieRigidTransform | undefined = poses[joint.parent];
    const child: IAutoMovieRigidTransform | undefined = poses[joint.child];
    return (
      parent !== undefined &&
      child !== undefined &&
      Vector3.length(
        Vector3.subtract(
          AutoMovieEnginePhysics.physicalSupportPoint(parent, joint.parentFrame.position),
          AutoMovieEnginePhysics.physicalSupportPoint(child, joint.childFrame.position),
        ),
      ) <= ANCHOR_ROUNDOFF
    );
  });
}

/** Measure flat true heel and forefoot support and reject any sole penetration. */
function support(
  feet: readonly IVertex[][],
  poses: Poses,
  floor: number,
  tolerance: number,
): IAutoMovieVector3[] | undefined {
  const base: IAutoMovieVector3[] = [];
  for (const patch of feet) {
    let heel: boolean = false;
    let front: boolean = false;
    for (const point of patch) {
      const world: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalSupportPoint(
        poses[point.bone]!,
        point.local,
      );
      const gap: number = world.y - floor;
      if (gap < -tolerance) return undefined;
      if (gap > tolerance) continue;
      base.push(world);
      heel ||= point.region === "heel";
      front ||= point.region === "forefoot";
    }
    if (!heel || !front) return undefined;
  }
  return base;
}

/**
 * How far a straight leg's hip must come down for its knee to bend by `KNEE`:
 * L1 + L2 - sqrt(L1^2 + L2^2 + 2 L1 L2 cos KNEE), with the thigh and shank
 * lengths read between the hip, knee and ankle anchors of the left leg.
 */
function flexion(profile: IAutoMoviePhysicalProfile, targets: Poses): number {
  const anchor = (child: string): IAutoMovieVector3 | undefined => {
    const joint: IAutoMoviePhysicalJoint | undefined = profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === child,
    );
    return joint && targets[joint.parent]
      ? AutoMovieEnginePhysics.physicalSupportPoint(targets[joint.parent]!, joint.parentFrame.position)
      : undefined;
  };
  const hip: IAutoMovieVector3 | undefined = anchor("leftUpperLeg");
  const knee: IAutoMovieVector3 | undefined = anchor("leftLowerLeg");
  const ankle: IAutoMovieVector3 | undefined = anchor("leftFoot");
  if (!hip || !knee || !ankle) return 0;
  const thigh: number = Vector3.length(Vector3.subtract(knee, hip));
  const shank: number = Vector3.length(Vector3.subtract(ankle, knee));
  return (
    thigh +
    shank -
    Math.sqrt(
      thigh * thigh + shank * shank + 2 * thigh * shank * Math.cos(KNEE),
    )
  );
}
