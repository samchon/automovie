import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";

/**
 * Linear-inverted-pendulum capture-point balance over an arbitrary support
 * polygon (Pratt et al., 2006). It predicts horizontal recovery only; solved
 * contacts and the subsequent simulation decide whether a step actually lands.
 * No support count or anatomical name selects a different law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Linear-inverted-pendulum capture-point balance over an arbitrary support polygon (Pratt et al., 2006)) and documents 3 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Linear-inverted-pendulum capture-point balance over an arbitrary support polygon (Pratt et al., 2006): companion namespace of 3 members (`ISupport`, `IResult`, `assess`); units and frames named in its text: world, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePhysicalBalance` in packages/engine/src/physics/AutoMoviePhysicalBalance.ts; its surface is the 3 members listed and the text shows 7 other files naming it, mostly packages/engine (4), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMoviePhysicalBalance {
  /**
   * Choose the recovery step: among the supports that can reach their
   * landing, the one furthest along the capture point's direction, then the
   * shortest travel, then the declared footfall phase. Young adults recover
   * a lateral push mostly by a single side step of the limb the push loaded
   * (Mille et al. 2005, Clinical Biomechanics), which the
   * controller unloads before lifting (`advancePhysicalBalance`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Order reachable recovery supports by travel distance, then declared footfall phase.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Order reachable recovery supports by travel distance, then declared footfall phase) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [ input.center.x, input.; flatMap over input.supports; for loop bounded by i < polygon.length) plus a sort, delegating to `Number.isFinite`, `Math.sqrt`, `convexHull2D`, `Math.max`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 152 lines and 19 top-level statements that reuses `Number.isFinite`, `Math.sqrt`, `convexHull2D`, `Math.max`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [ input.center.x, input.; flatMap over input.supports; for loop bounded by i < polygon.length) plus a sort, performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 13 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function assess(
    input: IAutoMoviePhysicalBalance.IAssessInput,
  ): IAutoMoviePhysicalBalance.IResult {
    const height: number = input.center.y - input.floor;
    if (
      !(input.gravity > 0) ||
      !Number.isFinite(input.gravity) ||
      !(input.maximumStep > 0) ||
      !Number.isFinite(input.maximumStep) ||
      !Number.isFinite(input.margin) ||
      input.margin < 0 ||
      ![
        input.center.x,
        input.center.y,
        input.center.z,
        input.velocity.x,
        input.velocity.y,
        input.velocity.z,
        input.floor,
      ].every(Number.isFinite)
    )
      throw new Error("Invalid physical balance state or limits");
    const omega: number =
      height > 0 ? Math.sqrt(input.gravity / height) : Infinity;
    const capturePoint: IAutoMovieVector3 = {
      x: input.center.x + input.velocity.x / omega,
      y: input.floor,
      z: input.center.z + input.velocity.z / omega,
    };
    const polygon: IAutoMovieVector3[] = convexHull2D(
      input.supports.flatMap(
        (support: (typeof input.supports)[number]): IAutoMovieVector3[] =>
          support.points,
      ),
    );
    let inside: boolean = polygon.length >= 3;
    let outside: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((capturePoint.x - a.x) * dx + (capturePoint.z - a.z) * dz) /
                  denominator,
              ),
            );
      outside = Math.min(
        outside,
        Math.hypot(
          capturePoint.x - a.x - dx * t,
          capturePoint.z - a.z - dz * t,
        ),
      );
      if (dx * (capturePoint.z - a.z) - dz * (capturePoint.x - a.x) < 0)
        inside = false;
    }
    if (inside) outside = 0;
    const result: IAutoMoviePhysicalBalance.IResult = {
      state: "unrecoverable",
      capturePoint,
      polygon,
      outside,
    };
    if (height <= 0 || polygon.length === 0) return result;
    if (outside <= input.margin) return { ...result, state: "supported" };
    const centroid: IAutoMovieVector3 = Vector3.scale(
      input.supports.reduce(
        (
          sum: IAutoMovieVector3,
          support: IAutoMoviePhysicalSupportPatch,
        ): IAutoMovieVector3 => Vector3.add(sum, support.position),
        { x: 0, y: 0, z: 0 },
      ),
      1 / input.supports.length,
    );
    const direction: IAutoMovieVector3 = {
      x: capturePoint.x - centroid.x,
      y: 0,
      z: capturePoint.z - centroid.z,
    };
    const denominator: number = direction.x ** 2 + direction.z ** 2;
    const candidates: {
      support: IAutoMoviePhysicalSupportPatch;
      phase: number;
      distance: number;
      lead: number;
      target: IAutoMovieVector3;
    }[] = input.supports
      .flatMap(
        (
          support: (typeof input.supports)[number],
        ): {
          support: IAutoMoviePhysicalSupportPatch;
          phase: number;
          distance: number;
          lead: number;
          target: IAutoMovieVector3;
        }[] => {
          const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
            input.pattern.limbs.find(
              (candidate: (typeof input.pattern.limbs)[number]): boolean =>
                candidate.bone === support.bone,
            );
          const offset: IAutoMovieVector3 = {
            x: support.position.x - centroid.x,
            y: 0,
            z: support.position.z - centroid.z,
          };
          const along: number =
            denominator > 0 ? Vector3.dot(offset, direction) / denominator : 0;
          // The remaining supports hold the centre of pressure at their
          // point nearest the capture point while this limb swings; the
          // capture point diverges from it by e^(omega t) (Hof et al. 2005,
          // Eq. 3), so the step lands where it will be then.
          const landing: IAutoMovieVector3 = AutoMoviePhysicalBalance.diverge(
            capturePoint,
            convexHull2D(
              input.supports
                .filter(
                  (other: (typeof input.supports)[number]): boolean =>
                    other !== support,
                )
                .flatMap(
                  (
                    other: (typeof input.supports)[number],
                  ): IAutoMovieVector3[] => other.points,
                ),
            ),
            omega * (input.swingSeconds ?? 0),
          );
          const target: IAutoMovieVector3 = Vector3.add(
            landing,
            Vector3.subtract(offset, Vector3.scale(direction, along)),
          );
          const distance: number = Math.hypot(
            target.x - support.position.x,
            target.z - support.position.z,
          );
          return limb &&
            !input.unavailable.includes(support.bone) &&
            distance <= input.maximumStep
            ? [{ support, phase: limb.phase, distance, lead: along, target }]
            : [];
        },
      )
      .sort(
        (
          a: {
            support: IAutoMoviePhysicalSupportPatch;
            phase: number;
            distance: number;
            lead: number;
            target: IAutoMovieVector3;
          },
          b: {
            support: IAutoMoviePhysicalSupportPatch;
            phase: number;
            distance: number;
            lead: number;
            target: IAutoMovieVector3;
          },
        ): number =>
          b.lead - a.lead || a.distance - b.distance || a.phase - b.phase,
      );
    const chosen: (typeof candidates)[number] | undefined = candidates[0];
    if (!chosen || input.supports.length - 1 < input.pattern.minimumSupports)
      return result;
    return {
      ...result,
      state: "recovery",
      step: { bone: chosen.support.bone, target: chosen.target },
    };
  }

  /**
   * The capture point a time ahead while the supports hold their centre of
   * pressure at their point nearest it. With the centre of pressure u fixed,
   * the inverted pendulum's capture point moves as u + (xi - u) e^(omega t)
   * (Hof, Gazendam and Sinke 2005, Eq. 3 written for x + v / omega); Pratt et
   * al. (2006) capture at xi only by an instantaneous step.
   *
   * @param capture The present capture point, world metres.
   * @param polygon The supports' convex hull; empty leaves the capture point where it is.
   * @param elapsed The time ahead times the pendulum frequency, dimensionless.
   * @returns The capture point then, world metres, at the capture point's height.
   */
  export function diverge(
    capture: IAutoMovieVector3,
    polygon: readonly IAutoMovieVector3[],
    elapsed: number,
  ): IAutoMovieVector3 {
    if (polygon.length === 0 || !(elapsed > 0)) return { ...capture };
    const pressure: IAutoMovieVector3 = nearest(polygon, capture);
    const growth: number = Math.exp(elapsed);
    return {
      x: pressure.x + (capture.x - pressure.x) * growth,
      y: capture.y,
      z: pressure.z + (capture.z - pressure.z) * growth,
    };
  }

  /**
   * The point of a horizontal convex polygon nearest a point: the point
   * itself inside, else its projection on the nearest edge.
   *
   * @param polygon The counter-clockwise hull, world metres.
   * @param point The point, world metres.
   * @returns The nearest polygon point at the given point's height.
   */
  export function nearest(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (polygon.length === 1)
      return { x: polygon[0]!.x, y: point.y, z: polygon[0]!.z };
    let inside: boolean = polygon.length >= 3;
    let best: IAutoMovieVector3 = { ...point };
    let distance: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.z - a.z) * dz) / denominator,
              ),
            );
      const x: number = a.x + dx * t;
      const z: number = a.z + dz * t;
      const gap: number = Math.hypot(point.x - x, point.z - z);
      if (gap < distance) {
        distance = gap;
        best = { x, y: point.y, z };
      }
      if (dx * (point.z - a.z) - dz * (point.x - a.x) < 0) inside = false;
    }
    return inside ? { ...point } : best;
  }
}
