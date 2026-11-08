import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";

/** One admitted same-FK point definition shared by clinical IK, leg seeding and grounding. */
export namespace AutoMovieHumanTargetPoint {
  /** Derived endpoints are measured from actual posed joint centres. */
  export type IWitness =
    | {
        /** Extension beyond the endpoint. */ kind: "ray";
        /** Same-FK origin. */ from: Controls.Joint;
        /** Nonnegative extension, metres. */ distance: number;
      }
    | {
        /** Interpolation toward another endpoint. */ kind: "blend";
        /** Same-FK endpoint. */ other: Controls.Joint;
        /** Closed-unit share toward other. */ weight: number;
      };
  /** A rigid local point or a derived endpoint, never both. */
  export interface IPoint {
    /** Canonical Human endpoint. */ bone: Controls.Joint;
    /** Rigid offset in bind-relative metres. */ localPoint?: Controls.MetrePoint;
    /** Actual geometric derivation. */ witness?: IWitness;
  }
  /** Check descriptors before projection selection or FK evaluation. */
  export function valid(point: IPoint): boolean {
    if (
      !point ||
      !Controls.isJoint(point.bone) ||
      (point.localPoint !== undefined && !finite(point.localPoint, 3))
    )
      return false;
    if (point.witness === undefined) return true;
    if (
      !point.witness ||
      typeof point.witness !== "object" ||
      point.localPoint !== undefined
    )
      return false;
    return point.witness.kind === "ray"
      ? Controls.isJoint(point.witness.from) &&
          Number.isFinite(point.witness.distance) &&
          point.witness.distance >= 0
      : point.witness.kind === "blend" &&
          Controls.isJoint(point.witness.other) &&
          Number.isFinite(point.witness.weight) &&
          point.witness.weight >= 0 &&
          point.witness.weight <= 1;
  }
  /** Every joint required by a prepared projection. */
  export function references(point: IPoint): Controls.Joint[] {
    return point.witness
      ? [
          point.bone,
          point.witness.kind === "ray"
            ? point.witness.from
            : point.witness.other,
        ]
      : [point.bone];
  }
  /** Measure without clamping a missing frame or replacing a degenerate ray. */
  export function resolve(
    placements: ReadonlyMap<string, Skeleton.IPlacement>,
    point: IPoint,
  ): Controls.MetrePoint {
    const at: Skeleton.IPlacement | undefined = placements.get(point.bone);
    if (
      !at ||
      !finite(at.position, 3) ||
      !finite(at.rotation, 4) ||
      Math.abs(Math.hypot(...at.rotation) - 1) > 1e-6
    )
      throw new Error(
        `Clinical IK target is missing or invalid: ${point.bone}`,
      );
    if (point.witness) {
      const other: string =
        point.witness.kind === "ray" ? point.witness.from : point.witness.other;
      const witness: Skeleton.IPlacement | undefined = placements.get(other);
      if (!witness || !finite(witness.position, 3))
        throw new Error(`Clinical IK witness is missing or invalid: ${other}`);
      if (point.witness.kind === "blend")
        return M.add(
          at.position,
          M.times(M.sub(witness.position, at.position), point.witness.weight),
        );
      const direction: M.Vector = M.sub(at.position, witness.position);
      const length: number = Math.hypot(...direction);
      if (length === 0) throw new Error("Clinical IK ray is degenerate");
      return M.add(
        at.position,
        M.times(direction, point.witness.distance / length),
      );
    }
    return point.localPoint === undefined
      ? [...at.position]
      : M.add(at.position, M.rotate(at.rotation, point.localPoint));
  }
}

/** Dense finite coordinate arrays; holes never skip admission. */
function finite(value: readonly number[], length: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === length &&
    Array.from({ length }, (_: unknown, index: number): boolean =>
      Number.isFinite(value[index]),
    ).every(Boolean)
  );
}
