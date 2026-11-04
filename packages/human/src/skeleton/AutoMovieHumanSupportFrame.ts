import { prepareAutoMovieSurfaceFrame, placeAutoMovieSurfaceFrame, type IAutoMoviePreparedSurfaceFrame } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanClinicalIk } from "./AutoMovieHumanClinicalIk";
import type { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/** Geometry-derived three-point support frames, independent of any drawing backend. */
export namespace AutoMovieHumanSupportFrame {
  /** One actual rigid vertex carried by its Human bone placement. */
  export interface IPoint {
    /** Exact bone identity in the prepared Human evaluator. */
    bone: Controls.Joint;
    /** Metres relative to the bone's bind joint, as stored by a rigid module. */
    localPoint: Controls.MetrePoint;
  }

  /** Destination support plane and heading in the evaluator's metre frame. */
  export interface IFrame {
    /** Desired centroid of the three actual contact points, metres. */
    origin: [number, number, number];
    /** Heading on the support plane; its component along normal is removed. */
    forward: [number, number, number];
    /** Outward support-plane normal; need not already be normalized. */
    normal: [number, number, number];
  }

  /**
   * Preserve a measured contact triangle while moving it to an explicit support
   * plane. Point zero to point one defines forward; point two must make a
   * nondegenerate triangle. The reference normal chooses its outward side.
   * The returned closure owns copied descriptors and reference coordinates,
   * creates three independent IK point targets, and retains no pose or clock.
   * Fitting these targets constrains translation and all three rotations; it
   * does not establish the clearance of vertices outside the measured triangle.
   * Blended skin vertices require their actual skin evaluator rather than an
   * invented one-bone attachment and are not admitted by this rigid contract.
   */
  export function prepare(
    reference: AutoMovieHumanSkeleton.IOutput,
    contacts: readonly [IPoint, IPoint, IPoint],
    referenceNormal: [number, number, number] = [0, 1, 0],
  ): (frame: IFrame) => AutoMovieHumanClinicalIk.ITarget[] {
    if (!Array.isArray(contacts) || contacts.length !== 3)
      throw new Error("Human support requires exactly three actual contact points");
    const points: IPoint[] = contacts.map((point: IPoint): IPoint => {
      vector(point.localPoint);
      if (typeof point.bone !== "string" || point.bone.length === 0)
        throw new Error("Human support requires exact bone identities");
      return { bone: point.bone, localPoint: [...point.localPoint] };
    });
    const positions: Math3D.Vector[] = points.map((point: IPoint): Math3D.Vector => {
      const placement: AutoMovieHumanSkeleton.IPlacement | undefined = reference.posed.find(
        (row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === point.bone,
      );
      if (placement === undefined)
        throw new Error(`Human support bone is absent: ${point.bone}`);
      vector(placement.position);
      return Math3D.add(placement.position, Math3D.rotate(placement.rotation, point.localPoint));
    });
    vector(referenceNormal);
    const prepared: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(
      [convert(positions[0]!), convert(positions[1]!), convert(positions[2]!)],
      convert(referenceNormal),
    );
    return (frame: IFrame): AutoMovieHumanClinicalIk.ITarget[] => {
      vector(frame.origin);
      vector(frame.normal);
      vector(frame.forward);
      const destinations: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] = placeAutoMovieSurfaceFrame(prepared, {
        origin: convert(frame.origin),
        forward: convert(frame.forward),
        normal: convert(frame.normal),
      });
      return points.map((point: IPoint, index: number): AutoMovieHumanClinicalIk.ITarget => {
        const at: IAutoMovieVector3 = destinations[index]!;
        return {
          bone: point.bone,
          localPoint: [...point.localPoint],
          position: [at.x, at.y, at.z],
        };
      });
    };
  }
}

/** Reject malformed, nonfinite vectors before any constraint is constructed. */
function vector(value: Math3D.Vector): void {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
    throw new Error("Human support requires finite metre/direction triples");
}

/** Adapt the Human tuple frame to the Engine's public vector vocabulary. */
function convert(value: Math3D.Vector): IAutoMovieVector3 {
  return { x: value[0], y: value[1], z: value[2] };
}
