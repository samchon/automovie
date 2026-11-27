import { Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * The bones that reach on past the slide's stop, the head laid on the partner
 * by the neck (`lieTogetherNeck`).
 */
const REACHING: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["neck", "head"]);

/** The slide's convergence, metres: under a tenth of a millimetre of gap left. */
const SETTLED: number = 1e-4;

/**
 * The most advancement steps the slide takes; each closes the whole gap left,
 * so it converges well within them.
 */
const STEPS: number = 32;

/**
 * How far a lying body slides toward a partner across the support before it
 * meets them, and what of the partner lies beneath a point.
 */
export namespace lieTogetherReach {
  /**
   * The slide toward a partner along a horizontal offset, stopped where any
   * part of the body but its head and neck first comes `rest` off the partner.
   * The body's colliders are placed once and translated rigidly along the
   * slide, whose speed bounds the closing speed of every pair, so each step may
   * advance by the whole gap left without passing into the partner:
   * conservative advancement (Mirtich, "Impulse-based Dynamic Simulation of
   * Rigid Body Systems", 1996, ch. 3), exact for a pure translation.
   *
   * @param body The lying body.
   * @param posture Its posture as it settles.
   * @param offset The full horizontal slide, world metres.
   * @param partner The partner's body.
   * @param bones The partner's bones.
   * @param rest The gap kept, metres.
   * @returns The slide, a share of the offset.
   */
  export function slide(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    offset: IAutoMovieVector3,
    partner: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    rest: number,
  ): IAutoMovieVector3 {
    const full: number = Vector3.length(offset);
    if (full < SETTLED) return offset;
    const way: IAutoMovieVector3 = Vector3.scale(offset, 1 / full);
    const mine: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(
        body,
        poseBones(body, resolveHumanPosture(body, posture)),
      ).filter(
        (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !REACHING.has(segment.bone),
      );
    const yours: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(partner, bones);
    const gap = (s: number): number => {
      let least: number = Infinity;
      for (const m of mine) {
        const pose: IAutoMovieMotionHumanColliders.IPlaced["pose"] = {
          ...m.pose,
          position: Vector3.addScaled(m.pose.position, way, s),
        };
        for (const y of yours)
          for (const a of m.shapes)
            for (const b of y.shapes)
              least = Math.min(
                least,
                AutoMovieEnginePhysics.physicalShapePairDistance(pose, a, y.pose, b),
              );
      }
      return least;
    };
    let s: number = 0;
    for (let step: number = 0; step < STEPS && s < full; ++step) {
      const left: number = gap(s) - rest;
      if (left < SETTLED) break;
      s = Math.min(full, s + left);
    }
    return Vector3.scale(way, s);
  }

  /**
   * The partner's surface straight beneath a point: the first of their
   * colliders a ray down from above them meets.
   *
   * @param partner The partner's body.
   * @param bones The partner's bones.
   * @param point The point, world metres.
   * @returns The hit, or undefined where nothing of the partner lies beneath.
   */
  export function beneath(
    partner: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.IHit | undefined {
    const above: number = point.y + partner.measure.chestDepth;
    return HumanColliders.cast(
      partner,
      bones,
      { ...point, y: above },
      { x: 0, y: -1, z: 0 },
      above + partner.measure.chestDepth,
    );
  }
}
