import {
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  hingedArmSwivel,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
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
import { HumanArmTrajectoryDistal } from "./HumanArmTrajectoryDistal";
import { HumanArmTrajectoryLiftTurn } from "./HumanArmTrajectoryLiftTurn";

/**
 * Prepare a straight wrist path in the shoulder parent's moving frame. A hand
 * on an attitude turns from its start to its end attitude over the path's
 * progress, starting once a hand low over a surface has lifted clear of it
 * (`HumanArmTrajectoryLiftTurn`). At each progress the hinge's two analytic
 * roots place the wrist. The free swivel is the closest rotation to the arm's
 * endpoint interpolation, so the arm preserves its bend when the carrier
 * translates or turns. The compiler uses the path only when the whole transport
 * passes the ordinary trajectory admission, with the hard limits checked after
 * projection.
 *
 * @param setup The arm's unchanged rig and clinical domains.
 * @param from The starting shoulder-parent frame and arm coordinates.
 * @param to The destination shoulder-parent frame and arm coordinates.
 * @param contact Hand-local offset of the oriented contact point, when the goal
 *   specifies an attitude.
 * @returns The arm's projected coordinates at the progress, or no analytic
 *   result at that point.
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
    Quaternion.multiply(
      Quaternion.inverse(to.frame.parent.rotation),
      finish.hand,
    ),
  );
  const startPoint: IAutoMovieVector3 =
    contact === undefined
      ? start.wrist
      : Vector3.add(start.wrist, Quaternion.rotateVector(start.hand, contact));
  const endPoint: IAutoMovieVector3 =
    contact === undefined
      ? end
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
  const anatomical: IAutoMovieAngleRange | null | undefined =
    setup.constraint.lower?.flexion;
  const frame: IAutoMovieAxisFrame | undefined =
    HUMANOID_REST_FRAME[setup.bones.lower]?.flexion;
  const rad: number = Math.PI / 180;
  const fromAngle: number | null = AutoMovieEngineKinematics.toRigAngle(anatomical?.min ?? null, frame);
  const toAngle: number | null = AutoMovieEngineKinematics.toRigAngle(anatomical?.max ?? null, frame);
  const flexion: IAutoMovieHingedChainGeometry["range"] =
    fromAngle === null || toAngle === null
      ? undefined
      : {
          min: Math.min(fromAngle, toAngle) * rad,
          max: Math.max(fromAngle, toAngle) * rad,
        };
  // The tolerance is the arm's length times the square root of machine
  // epsilon, the distance resolution after recovering a bend with acos.
  const precision: number =
    (Vector3.length(setup.rest.lower.translation) +
      Vector3.length(setup.rest.hand.translation)) *
    Math.sqrt(Number.EPSILON);

  // A hand that starts low over a surface turns only once the path has
  // lifted it clear (`HumanArmTrajectoryLiftTurn`), the turn then made over
  // the rest of the progress.
  const lifted: number =
    contact === undefined
      ? 0
      : HumanArmTrajectoryLiftTurn(
          from.frame,
          G.placed(setup, from.frame, from.coordinates),
          startPoint,
          endPoint,
        );
  return (
    progress: number,
    reference: readonly number[],
  ): number[] | undefined => {
    const hand: IAutoMovieQuaternion | undefined =
      contact === undefined
        ? undefined
        : Quaternion.slerp(
            start.hand,
            rotation,
            Math.max(0, (progress - lifted) / (1 - lifted)),
          );
    const point: IAutoMovieVector3 = Vector3.lerp(
      startPoint,
      endPoint,
      progress,
    );
    const wrist: IAutoMovieVector3 =
      contact === undefined || hand === undefined
        ? point
        : Vector3.subtract(point, Quaternion.rotateVector(hand, contact));
    const target: IAutoMovieHingedArmSwivel.IPreparedTarget = source.target(
      wrist,
      flexion,
    );
    const wanted: IAutoMovieQuaternion = G.shoulder(setup, reference);

    // The branch kept is the one nearest the reference among those whose
    // pose passes the checks below, the first on a tie: the branches are
    // tried nearest first, in their order on a tie, and the first that
    // passes is that one, so a farther branch is never posed for nothing.
    const reached: IReached[] = [];
    for (const branch of target.branches() ?? []) {
      if (branch.shortfall > precision) continue;
      const turn: IAutoMovieHingedArmSwivel.IHarmonic | undefined =
        target.harmonic?.(branch.theta);
      if (turn === undefined) continue;
      const cos: number = dot(wanted, turn.cosine);
      const sin: number = dot(wanted, turn.sine);
      reached.push({
        theta: branch.theta,
        turn,
        cos,
        sin,
        match: Math.hypot(cos, sin),
      });
    }
    reached.sort((p: IReached, q: IReached): number => q.match - p.match);
    for (const root of reached) {
      const upper: IAutoMovieQuaternion = root.turn.pose()(
        (2 * Math.atan2(root.sin, root.cos)) / rad,
      ).upper;
      const arm: IAutoMovieMotionHumanArmClearance.IArm = G.arm(
        setup,
        reference,
        upper,
      );
      const c: number[] = G.encode(setup, {
        ...arm,
        lower: [
          (root.theta / rad) * (frame?.sign ?? 1) + (frame?.neutral ?? 0),
          arm.lower[1],
          arm.lower[2],
        ],
      });
      const placed: Chain = G.chain(setup, from.frame, c);
      if (Vector3.distance(placed.wrist, wrist) > precision) continue;
      if (hand !== undefined) {
        HumanArmTrajectoryDistal(setup, placed.upper, hand, c);
        const shown: Chain = G.chain(setup, from.frame, c);
        if (
          1 - Math.abs(dot(hand, shown.hand)) > Math.sqrt(Number.EPSILON) ||
          Vector3.distance(shown.wrist, wrist) > precision
        )
          continue;
      }
      return c;
    }
    return undefined;
  };
}

/** A hinge root that reaches the wrist, read against the reference shoulder. */
interface IReached {
  /** The root's hinge flexion, radians. */
  theta: number;

  /** Its shoulder swivel harmonic. */
  turn: IAutoMovieHingedArmSwivel.IHarmonic;

  /** The reference shoulder's dot with the harmonic's cosine coefficient. */
  cos: number;

  /** The reference shoulder's dot with the harmonic's sine coefficient. */
  sin: number;

  /** How near the reference the root's best swivel comes: the two dots' norm. */
  match: number;
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
