// Ported from IHMC Open Robotics Software (Apache-2.0), 201903_Stable:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/
// ReferenceCentroidalMomentumPivotLocationsCalculator.java
// setSymmetricEntryCMPConstantOffsets l.262-280,
// computeSupportFootReferenceCMPsDuringSingleSupport l.404-439,
// computeFootstepCentroid l.505-511, addPredictedContactPointsToPolygon
// l.522-544, computeEntryCMPForSupportFoot l.546-554, computeEntryCMP
// l.578-610, computeExitCMPForSupportFoot l.612-627, computeExitCMP
// l.658-718, constrainCMPAccordingToSupportPolygonAndUserOffsets l.735-760
// and computeFinalCMPBetweenSupportFeet l.766-797.
// See vendor/ihmc/NOTICE.
import { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * The reference pivots of IHMC's 201903 ICP planner with two pivots per support
 * (`ReferenceCentroidalMomentumPivotLocationsCalculator`): the support foot's
 * entry and exit pivots and the final pivot between two feet.
 *
 * A foot is its sole frame on the floor and its support polygon's vertices in
 * that frame (x forward, y to the left, metres), as the reference's
 * `supportFootPolygonsInSoleZUpFrame` and a footstep's predicted contact points
 * or default foot polygon (l.522-544). Pivots are world floor points.
 */
export namespace physicalIcpPlannerCmps {
  /** A foot on the floor. */
  export interface IFoot {
    /** Which foot, for the sign of the inside offsets. */
    side: "left" | "right";

    /** The sole frame on the floor. */
    frame: Polygon.IFrame;

    /** The support polygon's vertices in the sole frame, any order, metres. */
    polygon: readonly Polygon.IPoint[];
  }

  /** The pivot parameters. */
  export interface IParameters {
    /**
     * The entry pivot's offset from the foot's centroid, forward and inside,
     * metres.
     */
    entryOffset: Polygon.IPoint;

    /** The exit pivot's offset, forward and inside, metres. */
    exitOffset: Polygon.IPoint;

    /** The entry pivot's forward offset bounds, metres. */
    entryBounds: { min: number; max: number };

    /** The exit pivot's forward offset bounds, metres. */
    exitBounds: { min: number; max: number };

    /** The share of the step length added to the forward offset. */
    stepLengthFactor: number;

    /** How far inside the foot's edges a pivot stays, metres. */
    safeDistance: number;

    /**
     * Where between the first foot's centroid and the second's the final pivot
     * sits, 0.5 for the feet's joint centroid.
     */
    chicken: number;
  }

  /**
   * The support foot's entry pivot when no previous foot is known: its centroid
   * offset forward by the step-length share toward the sole origin plus the
   * entry offset, clamped to the entry bounds, then the inside offset,
   * projected onto the foot shrunk by the safe distance
   * (`computeEntryCMPForSupportFoot` l.546-554, `computeEntryCMP` l.578-610
   * with no previous centroid or exit pivot, as l.413-414 calls it).
   *
   * @param foot The support foot.
   * @param parameters The parameters.
   * @returns The entry pivot.
   */
  export function entry(foot: IFoot, parameters: IParameters): Tools.IFloor {
    return Polygon.world(
      foot.frame,
      constrain(
        foot,
        { x: 0, y: 0 },
        inside(foot.side, parameters.entryOffset),
        parameters.entryBounds,
        parameters,
      ),
    );
  }

  /**
   * The support foot's exit pivot toward the upcoming foot, the last one of the
   * plan: the foot's only vertex when it has no area, else its centroid offset
   * forward by the step-length share toward the upcoming foot's centroid plus
   * the exit offset, clamped to the exit bounds, then the inside offset,
   * projected onto the foot shrunk by the safe distance
   * (`computeExitCMPForSupportFoot` l.612-627, `computeExitCMP` l.658-718). The
   * toe placements (l.671-709) need a step after the upcoming one, which a last
   * step never has.
   *
   * @param foot The support foot.
   * @param upcoming The upcoming foot's centroid on the floor.
   * @param parameters The parameters.
   * @returns The exit pivot.
   */
  export function exit(
    foot: IFoot,
    upcoming: Tools.IFloor,
    parameters: IParameters,
  ): Tools.IFloor {
    const hull: Polygon.IPoint[] = Polygon.hull(foot.polygon);
    if (Polygon.area(hull) === 0.0) return Polygon.world(foot.frame, hull[0]!);
    return Polygon.world(
      foot.frame,
      constrain(
        foot,
        Polygon.local(foot.frame, upcoming),
        inside(foot.side, parameters.exitOffset),
        parameters.exitBounds,
        parameters,
      ),
    );
  }

  /**
   * A foot's support centroid on the floor (`computeFootstepCentroid`
   * l.505-511).
   *
   * @param foot The foot.
   * @returns Its centroid.
   */
  export function centroid(foot: IFoot): Tools.IFloor {
    return Polygon.world(
      foot.frame,
      Polygon.centroid(Polygon.hull(foot.polygon)),
    );
  }

  /**
   * The final pivot between two feet (`computeFinalCMPBetweenSupportFeet`
   * l.766-797): with the chicken fraction clamped to [0, 1], up to 0.5 it moves
   * from the first foot's centroid to the centroid of both feet's joint hull,
   * beyond 0.5 on to the second foot's centroid.
   *
   * @param first The first foot.
   * @param second The second foot.
   * @param parameters The parameters.
   * @returns The final pivot.
   */
  export function between(
    first: IFoot,
    second: IFoot,
    parameters: IParameters,
  ): Tools.IFloor {
    const a: Tools.IFloor = centroid(first);
    const b: Tools.IFloor = centroid(second);

    // The joint hull in the first sole's frame, a rigid copy of the
    // reference's world hull.
    const joint: Polygon.IPoint[] = Polygon.hull([
      ...first.polygon,
      ...second.polygon.map(
        (p: Polygon.IPoint): Polygon.IPoint =>
          Polygon.local(first.frame, Polygon.world(second.frame, p)),
      ),
    ]);
    const middle: Tools.IFloor = Polygon.world(
      first.frame,
      Polygon.centroid(joint),
    );
    const chicken: number = Math.min(Math.max(parameters.chicken, 0.0), 1.0);
    return chicken <= 0.5
      ? Tools.interpolate(a, middle, chicken * 2.0)
      : Tools.interpolate(middle, b, (chicken - 0.5) * 2.0);
  }
}

/**
 * A user offset with its inside part signed for the side
 * (`setSymmetricEntryCMPConstantOffsets` l.262-280: `negateIfLeftSide`).
 */
function inside(
  side: "left" | "right",
  offset: Polygon.IPoint,
): Polygon.IPoint {
  return { x: offset.x, y: side === "left" ? -offset.y : offset.y };
}

/**
 * The pivot from the foot's centroid, the step-length share toward the
 * considered point and the offset, clamped forward, then projected onto the
 * foot shrunk by the safe distance, in the sole frame
 * (`constrainCMPAccordingToSupportPolygonAndUserOffsets` l.743-760).
 */
function constrain(
  foot: physicalIcpPlannerCmps.IFoot,
  consider: Polygon.IPoint,
  offset: Polygon.IPoint,
  bounds: { min: number; max: number },
  parameters: physicalIcpPlannerCmps.IParameters,
): Polygon.IPoint {
  const hull: Polygon.IPoint[] = Polygon.hull(foot.polygon);
  const center: Polygon.IPoint = Polygon.centroid(hull);
  const forward: number = Math.min(
    Math.max(
      parameters.stepLengthFactor * (consider.x - center.x) + offset.x,
      bounds.min,
    ),
    bounds.max,
  );
  return Polygon.project(Polygon.shrink(hull, parameters.safeDistance), {
    x: center.x + forward,
    y: center.y + offset.y,
  });
}
