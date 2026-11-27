import { type AutoMovieEnginePhysicsGjkTypes, AutoMovieEnginePhysics } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

/**
 * The link pair's certificate the planner and the penetration audits read
 * before any probe (`HumanAuditModel` serves it to the planner, and the audits'
 * `AutoMovieMotionHumanAuditTangleMargin` reads it directly).
 *
 * Two convex solids' signed distance bounds every point depth between them: a
 * point of one lies no nearer the other than the solids do, and a point inside
 * the other at a depth `d` needs a translation of at least `d` to leave, so no
 * probe of a segment lies deeper in a shape than the pair passes into each
 * other, and none nearer than they stand apart where they are apart (the
 * link-pair reading of trajopt and tesseract, one GJK per pair past the broad
 * phase, sound for the audit's probe reading). A segment's probes lie in its
 * shapes up to the model's `offset`, so a pair's bound is the least of its
 * shapes' distances less that.
 */
export namespace HumanLinkCertificate {
  /**
   * A lower bound on the signed distance from every probe of a segment to a
   * convex shape. A cast, the solid the segment's shapes sweep between two read
   * waypoints widened by their stray (`AutoMovieEnginePhysics.physicalShapeGjkCast`), bounds every
   * probe over the interval the same way. Where the solids meet, no bound is
   * given.
   *
   * @param solids The segment's shapes as solids, or their casts.
   * @param offset How far the segment's probes lie outside its own shapes, at
   *   most, metres (`IAutoMovieMotionHumanAuditTangleModel.IPart.offset`).
   * @param shape The shape read against, a solid.
   * @param floor The bound the caller asks whether the pair keeps, metres: the
   *   reading stops once it is settled.
   * @returns Metres; negative infinity where the solids meet.
   */
  export function certify(
    solids: readonly AutoMovieEnginePhysicsGjkTypes.ISolid[],
    offset: number,
    shape: AutoMovieEnginePhysicsGjkTypes.ISolid,
    floor: number,
  ): number {
    let least: number = Infinity;
    for (const solid of solids) {
      least = Math.min(
        least,
        AutoMovieEnginePhysics.physicalShapeGjk(solid, shape, floor + offset).lower - offset,
      );
      if (least < floor) return least;
    }
    return least;
  }

  /**
   * How far two placed segments stand clear of each other's probes, both ways:
   * the least distance between their shapes less the larger of their probes'
   * offsets, so no probe of either lies inside the other while it is positive,
   * nor enters it while the two travel less than it. Negative infinity where
   * their shapes meet.
   *
   * @param a One segment, placed.
   * @param aPart Its segment of the tangle model.
   * @param b The other, placed.
   * @param bPart Its segment of the tangle model.
   * @returns Metres.
   */
  export function clearance(
    a: IAutoMovieMotionHumanColliders.IPlaced,
    aPart: IAutoMovieMotionHumanAuditTangleModel.IPart,
    b: IAutoMovieMotionHumanColliders.IPlaced,
    bPart: IAutoMovieMotionHumanAuditTangleModel.IPart,
  ): number {
    const offset: number = Math.max(aPart.offset, bPart.offset);
    const theirs: AutoMovieEnginePhysicsGjkTypes.ISolid[] = b.shapes.map(
      (
        shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
      ): AutoMovieEnginePhysicsGjkTypes.ISolid => AutoMovieEnginePhysics.physicalShapeGjkSolid(b.pose, shape),
    );
    let least: number = Infinity;
    for (const shape of a.shapes) {
      const solid: AutoMovieEnginePhysicsGjkTypes.ISolid = AutoMovieEnginePhysics.physicalShapeGjkSolid(
        a.pose,
        shape,
      );
      for (const other of theirs) {
        least = Math.min(
          least,
          AutoMovieEnginePhysics.physicalShapeGjk(solid, other, offset).lower - offset,
        );
        if (!(least > 0)) return least;
      }
    }
    return least;
  }
}
