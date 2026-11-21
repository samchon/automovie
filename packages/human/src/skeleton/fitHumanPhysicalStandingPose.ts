import {
  Quaternion,
  Vector3,
  convexHull2D,
  measurePhysicalJointLimits,
  physicalShapeBounds,
  physicalSupportPoint,
  resolveAutoMovieCenterOfMass,
  solvePhysicalArticulationTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFitHumanPhysicalStandingPose,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Arithmetic allowance for coincident double-precision anchors, metres. */
const ANCHOR_ROUNDOFF: number = 1e-9;

/** Arithmetic allowance for double-precision native angle comparisons, radians. */
const ANGLE_ROUNDOFF: number = 1e-9;

/** Segment frames borrowed for one standing transfer. */
type Poses = Readonly<Record<string, IAutoMovieRigidTransform>>;

/** The public standing transfer outcome. */
type Result = IAutoMovieFitHumanPhysicalStandingPose.IResult;

/** One actual collider vertex in its carrier frame. */
interface IVertex {
  /** The segment which moves the vertex. */
  bone: string;

  /** The vertex relative to the carrier, metres. */
  local: IAutoMovieVector3;

  /** The supporting part of the foot when the profile names it. */
  region?: "heel" | "forefoot";
}

/**
 * Admit a supported Human pose to native joint coordinates once before a
 * simulation. Three actual points on each foot preserve all translational
 * and rotational degrees of freedom as the legs settle into native axes.
 * The authored pelvis, ground plane and collider definitions are retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the actual sole witnesses, the bounded transfer and the preserved frames.
 * @evidence contracts/development/implementation.md#principled-implementation Fits both articulated legs against measured hull points in metres. Independently checks anchor closure, all native joint coordinates, whole-body clearance and the projected mass center.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the Engine articulation solver and its geometry and joint readers with Human's canonical support carriers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unavailable support region, raised or penetrating sole, missed fit or inadmissible resulting pose returns a refusal and supplies no motor goals.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads each sole once before the bounded leg solve. The residual only moves six fixed local points across its probes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each invocation fits the supplied authored pose and retains no cached targets.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All point geometry, poses and residual callbacks are local. No native world is created.
 */
export function fitHumanPhysicalStandingPose(
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
            local: physicalSupportPoint(shape.transform, point),
          });
      }
    }

    const own: IVertex[] = points.filter(
      (point: IVertex): boolean => point.bone === foot,
    );
    const heel: IVertex | undefined = lowest(own, targets, "heel");
    const forefoot: IVertex | undefined = lowest(own, targets, "forefoot");
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
        world: physicalSupportPoint(targets[foot]!, vertex.local),
      });
  }
  if (!support(vertices, targets, floor, tolerance))
    return { kind: "unresolved", reason: "support-plane" };

  const fit: ReturnType<typeof solvePhysicalArticulationTargets> =
    solvePhysicalArticulationTargets({
      profile,
      bones,
      targets,
      tolerance,
      iterations,
      measure: (poses: Poses): number[] =>
        goals.flatMap((goal: (typeof goals)[number]): number[] => {
          const error: IAutoMovieVector3 = Vector3.subtract(
            physicalSupportPoint(poses[goal.bone]!, goal.local),
            goal.world,
          );
          return [error.x, error.y, error.z];
        }),
    });
  const residual: number = fit.residual;
  if (residual > tolerance)
    return { kind: "unresolved", reason: "fit", residual };
  const posed: Poses = fit.targets;
  if (!anchors(profile, posed))
    return { kind: "unresolved", reason: "anchor", residual };
  if (
    profile.joints.some((joint: IAutoMoviePhysicalJoint): boolean =>
      measurePhysicalJointLimits(
        joint,
        posed[joint.parent]!,
        posed[joint.child]!,
      ).some(
        (
          coordinate: ReturnType<typeof measurePhysicalJointLimits>[number],
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
          physicalShapeBounds.lowest(posed[segment.bone]!, shape) <
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
          physicalSupportPoint(posed[segment.bone]!, segment.centerOfMass),
          segment.mass / profile.mass,
        ),
      ),
    { x: 0, y: 0, z: 0 },
  );
  if (
    convexHull2D(base).length < 3 ||
    resolveAutoMovieCenterOfMass.margin(center, base) < 0
  )
    return { kind: "unresolved", reason: "balance", residual };
  return { kind: "fitted", targets: fit.targets, residual };
}

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

/** Check the exact positional anchors before adapting orientation and after fitting. */
function anchors(profile: IAutoMoviePhysicalProfile, poses: Poses): boolean {
  return profile.joints.every((joint: IAutoMoviePhysicalJoint): boolean => {
    const parent: IAutoMovieRigidTransform | undefined = poses[joint.parent];
    const child: IAutoMovieRigidTransform | undefined = poses[joint.child];
    return (
      parent !== undefined &&
      child !== undefined &&
      Vector3.length(
        Vector3.subtract(
          physicalSupportPoint(parent, joint.parentFrame.position),
          physicalSupportPoint(child, joint.childFrame.position),
        ),
      ) <= ANCHOR_ROUNDOFF
    );
  });
}

/** Choose one actual lowest vertex in the given anatomical region. */
function lowest(
  points: readonly IVertex[],
  poses: Poses,
  region: NonNullable<IVertex["region"]>,
): IVertex | undefined {
  let result: IVertex | undefined;
  let height: number = Infinity;
  for (const point of points) {
    if (point.region !== region) continue;
    const pose: IAutoMovieRigidTransform = poses[point.bone]!;
    const y: number =
      pose.position.y + Quaternion.rotateVectorY(pose.rotation, point.local);
    if (y < height) {
      result = point;
      height = y;
    }
  }
  return result;
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
      const world: IAutoMovieVector3 = physicalSupportPoint(
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
