import type {
  IAutoMovieAngleRange,
  IAutoMovieBoxExcludedSwivels,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistLimit,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { toRigAngle } from "../rom/toRigAngle";
import { readsSwingTwistFrame } from "./readsSwingTwistFrame";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistRegion } from "./swingTwistRegion";
import { swivelArcs } from "./swivelArcs";

/**
 * The arcs of swivels a joint's swing-twist range provably refuses, merged
 * (`swivelArcs.union`), for a joint whose bone-local rotation is a fixed
 * rotation turned about a fixed axis by the swivel: the twist past its rig
 * interval and the swing past the region's greatest radius, each the arc where
 * one sinusoid of the swivel exceeds `MARGIN`, as `swingTwistExcludedSwivels`
 * states them (Tolani, Goswami and Badler 2000, section 3.2.3: a joint limit
 * maps to an interval of the swivel).
 *
 * @param props The joint and its rotation by swivel; `joint` is the frame the
 *   range reads it in.
 * @returns The merged refused arcs, degrees; every swivel when they cover a
 *   turn; none for a joint without a swing-twist gate, without `joint`, or read
 *   on another basis or rest frame than the range's own.
 */
export function swingTwistRefusedArcs(
  props: IAutoMovieBoxExcludedSwivels.IProps,
): IAutoMovieSwivelArcs.IArc[] | "all" {
  const constraint: IAutoMovieJointConstraint | null = props.constraint;
  const gate: IAutoMovieSwingTwistLimit | null | undefined =
    constraint?.swingTwist;
  const joint: IAutoMovieJointRotationFrame | undefined = props.joint;
  if (
    constraint === null ||
    gate === null ||
    gate === undefined ||
    joint === undefined ||
    !readsSwingTwistFrame(props.basis, props.frame, joint)
  )
    return [];
  const u: IAutoMovieVector3 = swingTwistBasis.of(joint.axes).u;

  // The rotation's half-angle readings and its rest direction's cosine at
  // swivels 0, 90 and 180.
  const sampled: ISample[] = [0, 90, 180].map((swivel: number): ISample => {
    const q: IAutoMovieQuaternion = Quaternion.normalize(
      props.rotation(swivel),
    );
    return {
      s: q.x * u.x + q.y * u.y + q.z * u.z,
      w: q.w,
      d: Vector3.dot(u, Quaternion.rotateVector(q, u)),
    };
  });
  const fit = (
    read: (sample: ISample) => number,
  ): IAutoMovieSwivelArcs.ISinusoid => {
    const [zero, quarter, half] = sampled.map(read) as [number, number, number];
    return swivelArcs.fitted(zero, quarter, half);
  };

  const arcs: IAutoMovieSwivelArcs.IArc[] = [];
  const refuse = (f: IAutoMovieSwivelArcs.ISinusoid): boolean => {
    const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
      f,
      MARGIN,
    );
    if (arc === "all") return true;
    if (arc !== null) arcs.push(arc);
    return false;
  };

  // The twist past its rig interval, read on the half twist.
  const twist: IAutoMovieAngleRange = gate.twist;
  const ends: number[] = [twist.min, twist.max].map(
    (clinical: number): number => toRigAngle(clinical, joint.frame?.twist)!,
  );
  const lo: number = (Math.min(...ends) / 2) * Quaternion.DEG2RAD;
  const hi: number = (Math.max(...ends) / 2) * Quaternion.DEG2RAD;
  if (
    hi - lo < Math.PI &&
    refuse(
      fit(
        ({ s, w }: ISample): number =>
          (s * Math.cos(hi) - w * Math.sin(hi)) *
          (s * Math.cos(lo) - w * Math.sin(lo)),
      ),
    )
  )
    return "all";

  // The swing past the region's greatest radius.
  const greatest: number = swingTwistRegion.of(constraint, joint).greatest;
  if (
    greatest < 180 &&
    refuse(
      fit(
        ({ d }: ISample): number => Math.cos(greatest * Quaternion.DEG2RAD) - d,
      ),
    )
  )
    return "all";
  return swivelArcs.union(arcs);
}

/**
 * The rotation's half-angle readings and its rest direction's cosine at one
 * swivel.
 */
interface ISample {
  /** The quaternion's vector part along the rest direction. */
  s: number;

  /** The quaternion's scalar part. */
  w: number;

  /** The rest direction's cosine with its image. */
  d: number;
}

/**
 * How far past a bound, in sine or cosine units, a reading must lie to be
 * refused: the joints' tolerance (`ROM_TOLERANCE`) in radians, past the
 * rounding of every step.
 */
const MARGIN: number = (ROM_TOLERANCE * Math.PI) / 180;
