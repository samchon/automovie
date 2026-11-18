import { HUMANOID_REST_FRAME, Quaternion, Vector3, hingedArmSwivel, solveDistalTwist, toRigAngle } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * Prepare a straight wrist path in the shoulder parent's moving frame. At
 * each progress the hinge's two analytic roots place the wrist. The free
 * swivel is the closest rotation to the arm's endpoint interpolation, so
 * the arm preserves its bend when the carrier translates or turns. The
 * compiler uses the path only when the whole transport passes the ordinary
 * trajectory admission, with the hard limits checked after projection.
 *
 * @param setup The arm's unchanged rig and clinical domains.
 * @param from The starting shoulder-parent frame and arm coordinates.
 * @param to The destination shoulder-parent frame and arm coordinates.
 * @param contact Hand-local offset of the oriented contact point, when the goal specifies an attitude.
 * @returns The arm's projected coordinates at the progress, or no analytic result at that point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path's frame, the roots and null space chosen, and how the actual trajectory is admitted.
 * @evidence contracts/development/implementation.md#principled-implementation Each target uses the engine's hinge law and exact half-angle coefficients. The swivel that maximizes the quaternion dot product is analytic, and the wrist is checked with rig-projected forward kinematics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare endpoint geometry and hinge source once, then solve at most two branch candidates for a requested progress.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig projection that takes the wrist off its target refuses the analytic candidate. Clearance, speed, contacts and all other terms belong to the unchanged trajectory model.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and at most two analytic branch poses and their single-arm FK per requested point. No posture fit, swivel sweep or collider placement occurs here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares canonical hinge geometry, coordinate encoding and arm placement with the rig and trajectory owners.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The transport keeps endpoint poses and prepared rest geometry. Each actual target, branch and candidate releases before the next call.
 */
export function HumanArmTrajectoryEffector(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  from: HumanArmTrajectoryEffector.IEnd,
  to: HumanArmTrajectoryEffector.IEnd,
  contact?: IAutoMovieVector3,
): (progress: number, reference: readonly number[]) => number[] | undefined {
  const start: Chain = G.chain(setup, from.frame, from.coordinates);
  const finish: Chain = G.chain(setup, to.frame, to.coordinates);
  const away: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(to.frame.parent.rotation),
    Vector3.subtract(finish.wrist, to.frame.parent.position),
  );
  const end: IAutoMovieVector3 = Vector3.add(
    from.frame.parent.position,
    Quaternion.rotateVector(from.frame.parent.rotation, away),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    from.frame.parent.rotation,
    Quaternion.multiply(Quaternion.inverse(to.frame.parent.rotation), finish.hand),
  );
  const startPoint: IAutoMovieVector3 = contact === undefined ? start.wrist
    : Vector3.add(start.wrist, Quaternion.rotateVector(start.hand, contact));
  const endPoint: IAutoMovieVector3 = contact === undefined ? end
    : Vector3.add(end, Quaternion.rotateVector(rotation, contact));
  const root: IAutoMovieHingedChainGeometry["upper"] = {
    worldPosition: start.shoulder,
    worldRotation: Quaternion.multiply(
      from.frame.parent.rotation,
      setup.rest.upper.rotation,
    ),
  };
  const source: IAutoMovieHingedArmSwivel.IPrepared = hingedArmSwivel.prepare({
    upper: root,
    midOffset: setup.rest.lower.translation,
    midRest: setup.rest.lower.rotation,
    endOffset: setup.rest.hand.translation,
    hinge: setup.basis(setup.bones.lower, "arm transport hinge").flexion,
  });
  const anatomical: IAutoMovieAngleRange | null | undefined = setup.constraint.lower?.flexion;
  const frame: IAutoMovieAxisFrame | undefined = HUMANOID_REST_FRAME[setup.bones.lower]?.flexion;
  const rad: number = Math.PI / 180;
  const fromAngle: number | null = toRigAngle(anatomical?.min ?? null, frame);
  const toAngle: number | null = toRigAngle(anatomical?.max ?? null, frame);
  const flexion: IAutoMovieHingedChainGeometry["range"] = fromAngle === null || toAngle === null
    ? undefined
    : { min: Math.min(fromAngle, toAngle) * rad, max: Math.max(fromAngle, toAngle) * rad };
  // The tolerance is the arm's length times the square root of machine
  // epsilon, the distance resolution after recovering a bend with acos.
  const precision: number =
    (Vector3.length(setup.rest.lower.translation) +
      Vector3.length(setup.rest.hand.translation)) *
    Math.sqrt(Number.EPSILON);
  return (
    progress: number,
    reference: readonly number[],
  ): number[] | undefined => {
    const hand: IAutoMovieQuaternion | undefined = contact === undefined
      ? undefined : Quaternion.slerp(start.hand, rotation, progress);
    const point: IAutoMovieVector3 = Vector3.lerp(startPoint, endPoint, progress);
    const wrist: IAutoMovieVector3 = contact === undefined || hand === undefined ? point
      : Vector3.subtract(point, Quaternion.rotateVector(hand, contact));
    const target: IAutoMovieHingedArmSwivel.IPreparedTarget = source.target(
      wrist,
      flexion,
    );
    const wanted: IAutoMovieQuaternion = G.shoulder(setup, reference);
    let best: number[] | undefined;
    let nearest: number = -Infinity;
    for (const branch of target.branches() ?? []) {
      if (branch.shortfall > precision) continue;
      const turn: IAutoMovieHingedArmSwivel.IHarmonic | undefined =
        target.harmonic?.(branch.theta);
      if (turn === undefined) continue;
      const cos: number = dot(wanted, turn.cosine);
      const sin: number = dot(wanted, turn.sine);
      const match: number = Math.hypot(cos, sin);
      if (match <= nearest) continue;
      const upper: IAutoMovieQuaternion = turn.pose()(
        (2 * Math.atan2(sin, cos)) / rad,
      ).upper;
      const arm: IAutoMovieMotionHumanArmClearance.IArm = G.arm(
        setup,
        reference,
        upper,
      );
      const c: number[] = G.encode(setup, {
        ...arm,
        lower: [
          (branch.theta / rad) * (frame?.sign ?? 1) + (frame?.neutral ?? 0),
          arm.lower[1],
          arm.lower[2],
        ],
      });
      const placed: Chain = G.chain(setup, from.frame, c);
      if (Vector3.distance(placed.wrist, wrist) > precision) continue;
      if (hand !== undefined) {
        // Pronation belongs to the forearm. Assigning all the axial turn
        // to the wrist would reject even the first small approach step.
        const split: ReturnType<typeof solveDistalTwist.withProjection> = solveDistalTwist.withProjection({
          joint: { bone: setup.bones.lower, flexion: c[3]!, abduction: c[4]!, twist: c[5]! },
          effector: { bone: setup.bones.hand, flexion: c[6]!, abduction: c[7]!, twist: c[8]! },
          above: Quaternion.multiply(placed.upper, setup.rest.lower.rotation),
          lowerBasis: setup.basis(setup.bones.lower, "contact transport forearm"),
          lowerFrame: HUMANOID_REST_FRAME[setup.bones.lower],
          effectorRest: setup.rest.hand.rotation,
          effectorBasis: setup.basis(setup.bones.hand, "contact transport wrist"),
          effectorFrame: HUMANOID_REST_FRAME[setup.bones.hand],
          rotation: hand,
          skeleton: setup.body.skeleton,
        });
        // A null clinical axis contributes the rest rotation in
        // jointToQuaternionOnBasis. The arm chart stores clinical degrees,
        // so its representation of that same rotation is the frame neutral.
        c[5] = split.joint.twist ?? HUMANOID_REST_FRAME[setup.bones.lower]?.twist?.neutral ?? 0;
        c[6] = split.projection.joint.flexion ?? HUMANOID_REST_FRAME[setup.bones.hand]?.flexion?.neutral ?? 0;
        c[7] = split.projection.joint.abduction ?? HUMANOID_REST_FRAME[setup.bones.hand]?.abduction?.neutral ?? 0;
        c[8] = split.projection.joint.twist ?? HUMANOID_REST_FRAME[setup.bones.hand]?.twist?.neutral ?? 0;
        const shown: Chain = G.chain(setup, from.frame, c);
        if (1 - Math.abs(dot(hand, shown.hand)) > Math.sqrt(Number.EPSILON) ||
          Vector3.distance(shown.wrist, wrist) > precision) continue;
      }
      best = c;
      nearest = match;
    }
    return best;
  };
}

/** The geometry of an arm before placing any collision probes. */
type Chain = ReturnType<typeof G.chain>;

/** Endpoint types of the carrier-relative arm course. */
export namespace HumanArmTrajectoryEffector {
  /** The endpoint's shoulder frame and the arm placed in it. */
  export interface IEnd {
    /** This endpoint's shoulder-parent frame. */
    frame: IAutoMovieMotionHumanArmGeometry.IFrame;

    /** The trajectory chart's nine coordinates. */
    coordinates: readonly number[];
  }
}

/** Inner product of unit quaternions or their half-angle coefficients. */
function dot(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}
