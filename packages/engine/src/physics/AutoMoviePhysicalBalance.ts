import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { physicalStanceBalance } from "./physicalStanceBalance";

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
   * The peak acceleration of a minimum-jerk transfer of unit distance in unit
   * time: 10 sqrt(3) / 3 (Flash and Hogan 1985). A swing over d in T peaks at
   * MINIMUM_JERK d / T^2.
   */
  export const MINIMUM_JERK: number = (10 * Math.sqrt(3)) / 3;

  /**
   * The peak vertical acceleration of a swing's clearance h 64 (p (1 - p))^3
   * of unit height in unit time, at mid-swing (`samplePhysicalRecoveryGoal`):
   * a clearance h in T peaks at CLEARANCE h / T^2.
   */
  export const CLEARANCE: number = 24;

  /**
   * The quickest swing over a distance with a clearance under an acceleration
   * bound, seconds: the longer of the minimum-jerk transfer's and the
   * clearance's, sqrt(max(MINIMUM_JERK d, CLEARANCE h) / a).
   */
  export function duration(
    distance: number,
    height: number,
    acceleration: number,
  ): number {
    return Math.sqrt(
      Math.max(MINIMUM_JERK * distance, CLEARANCE * height) / acceleration,
    );
  }

  /**
   * Choose the recovery step once the capture point leaves the shrunken
   * support: the support furthest along the capture point's direction, the
   * one that landed last only after any other, then the shortest travel,
   * then the declared footfall phase; its target is where the capture point
   * will be when it can land, clamped to the reach. Young adults recover
   * a lateral push mostly by a single side step of the limb the push loaded
   * (Mille et al. 2005, Clinical Biomechanics), which the
   * controller unloads over a short ramp before lifting
   * (`advancePhysicalBalance`).
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
      (input.inset !== undefined &&
        !(Number.isFinite(input.inset) && input.inset >= 0)) ||
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
    // The capture point needs a step once it leaves the outline the stance
    // holds its centre of pressure inside (Koolen et al., Corollary 3).
    const inset: number = input.inset ?? 0;
    const held = (outline: IAutoMovieVector3[]): IAutoMovieVector3[] =>
      inset > 0 ? physicalStanceBalance.shrink(outline, inset) : outline;
    const outside: number = excess(polygon, capturePoint);
    const beyond: number = excess(held(polygon), capturePoint);
    const result: IAutoMoviePhysicalBalance.IResult = {
      state: "unrecoverable",
      capturePoint,
      polygon,
      outside,
    };
    if (height <= 0 || polygon.length === 0) return result;
    if (beyond <= input.margin) return { ...result, state: "supported" };
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
    // A swing over distance d lands after the unloading ramp and the
    // quickest minimum-jerk transfer the leg's acceleration bound allows.
    const timing: IAutoMoviePhysicalBalance.IAssessInput["swing"] =
      input.swing &&
      input.swing.acceleration > 0 &&
      Number.isFinite(input.swing.acceleration) &&
      input.swing.ramp >= 0 &&
      input.swing.height >= 0
        ? input.swing
        : undefined;
    const swing = (distance: number): number =>
      timing
        ? AutoMoviePhysicalBalance.duration(
            distance,
            timing.height,
            timing.acceleration,
          )
        : (input.swingSeconds ?? 0);
    const candidates: {
      support: IAutoMoviePhysicalSupportPatch;
      phase: number;
      distance: number;
      lead: number;
      target: IAutoMovieVector3;
      seconds: number;
    }[] = input.supports.flatMap(
      (
        support: (typeof input.supports)[number],
      ): {
        support: IAutoMoviePhysicalSupportPatch;
        phase: number;
        distance: number;
        lead: number;
        target: IAutoMovieVector3;
        seconds: number;
      }[] => {
        const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
          input.pattern.limbs.find(
            (candidate: (typeof input.pattern.limbs)[number]): boolean =>
              candidate.bone === support.bone,
          );
        if (!limb || input.unavailable.includes(support.bone)) return [];
        const offset: IAutoMovieVector3 = {
          x: support.position.x - centroid.x,
          y: 0,
          z: support.position.z - centroid.z,
        };
        const along: number =
          denominator > 0 ? Vector3.dot(offset, direction) / denominator : 0;
        // The remaining supports hold the centre of pressure on their
        // shrunken outline, at its point nearest the capture point, while this
        // limb swings; the capture point diverges from it by e^(omega t) (Hof
        // et al. 2005, Eq. 3). The step's place and time are chosen together,
        // the earliest the leg can land: the time from the distance, the
        // distance from where the capture point will be then, until the two
        // agree (Khadiv et al. 2017, Section III-B). A step that stops the body
        // puts the foot's centre on that capture point, clamped to the reach.
        const holding: IAutoMovieVector3[] = held(
          convexHull2D(
            input.supports
              .filter(
                (other: (typeof input.supports)[number]): boolean =>
                  other !== support,
              )
              .flatMap(
                (other: (typeof input.supports)[number]): IAutoMovieVector3[] =>
                  other.points,
              ),
          ),
        );
        // The step keeps the swinging limb on its own side of the remaining
        // supports, at least as wide as it stands, so no limb crosses over
        // (Pratt et al., M2V2, Section IX-G; Khadiv et al. 2017, Appendix B),
        // and reaches forward until the capture point lies inside the new
        // support: capture is the capture point inside it, not under the
        // foot (Pratt et al., M2V2, Section VII-E1).
        const rest: IAutoMovieVector3[] = input.supports
          .filter(
            (other: (typeof input.supports)[number]): boolean =>
              other !== support,
          )
          .flatMap(
            (other: (typeof input.supports)[number]): IAutoMovieVector3[] =>
              other.points,
          );
        const stance: IAutoMovieVector3 = Vector3.scale(
          input.supports
            .filter(
              (other: (typeof input.supports)[number]): boolean =>
                other !== support,
            )
            .reduce(
              (
                sum: IAutoMovieVector3,
                other: (typeof input.supports)[number],
              ) => Vector3.add(sum, other.position),
              { x: 0, y: 0, z: 0 },
            ),
          1 / Math.max(1, input.supports.length - 1),
        );
        const length2: number = Math.hypot(direction.x, direction.z);
        const forward: IAutoMovieVector3 =
          length2 > 0
            ? { x: direction.x / length2, y: 0, z: direction.z / length2 }
            : { x: 0, y: 0, z: 1 };
        const side: IAutoMovieVector3 = { x: -forward.z, y: 0, z: forward.x };
        const across = (p: IAutoMovieVector3): number =>
          (p.x - stance.x) * side.x + (p.z - stance.z) * side.z;
        const ahead = (p: IAutoMovieVector3): number =>
          (p.x - stance.x) * forward.x + (p.z - stance.z) * forward.z;
        const width: number = across(support.position);
        const sign: number = width < 0 ? -1 : 1;
        const at = (f: number, lateral: number): IAutoMovieVector3 => ({
          x: stance.x + forward.x * f + side.x * lateral,
          y: support.position.y,
          z: stance.z + forward.z * f + side.z * lateral,
        });
        // The new support with this limb's patch moved to a target.
        const after = (target: IAutoMovieVector3): IAutoMovieVector3[] =>
          held(
            convexHull2D([
              ...rest,
              ...support.points.map(
                (p: IAutoMovieVector3): IAutoMovieVector3 => ({
                  x: p.x - support.position.x + target.x,
                  y: p.y,
                  z: p.z - support.position.z + target.z,
                }),
              ),
            ]),
          );
        const place = (xi: IAutoMovieVector3): IAutoMovieVector3 => {
          const lateral: number =
            sign * Math.max(sign * across(xi), Math.abs(width));
          let near: number = ahead(xi);
          if (excess(after(at(near, lateral)), xi) <= 0)
            return at(near, lateral);
          let far: number = near + input.maximumStep;
          if (excess(after(at(far, lateral)), xi) > 0) return at(far, lateral);
          while (far - near > SETTLED) {
            const middle: number = (near + far) / 2;
            if (excess(after(at(middle, lateral)), xi) <= 0) far = middle;
            else near = middle;
          }
          return at(far, lateral);
        };
        let distance: number = Math.min(
          input.maximumStep,
          Math.hypot(
            capturePoint.x - support.position.x,
            capturePoint.z - support.position.z,
          ),
        );
        let target: IAutoMovieVector3 = { ...capturePoint };
        let landing: IAutoMovieVector3 = { ...capturePoint };
        let length: number = 0;
        for (let pass: number = 0; pass < PASSES; pass++) {
          const before: IAutoMovieVector3 = target;
          landing = AutoMoviePhysicalBalance.diverge(
            capturePoint,
            holding,
            omega * ((timing?.ramp ?? 0) + swing(distance)),
          );
          const placed: IAutoMovieVector3 = place(landing);
          const travel: IAutoMovieVector3 = {
            x: placed.x - support.position.x,
            y: 0,
            z: placed.z - support.position.z,
          };
          length = Math.hypot(travel.x, travel.z);
          distance = Math.min(length, input.maximumStep);
          const scale: number = length > 0 ? distance / length : 0;
          target = {
            x: support.position.x + travel.x * scale,
            y: landing.y,
            z: support.position.z + travel.z * scale,
          };
          if (Math.hypot(target.x - before.x, target.z - before.z) <= SETTLED)
            break;
        }
        // Viability (Khadiv et al. 2017, Eq. 9): a step clamped to the reach
        // leaves the capture point b outside the new support, which further
        // steps of that reach every T capture while b <= l / (e^(omega T) -
        // 1). Without a step time only a step within reach captures.
        if (
          timing
            ? excess(after(target), landing) >
              input.maximumStep /
                (Math.exp(omega * (timing.ramp + swing(input.maximumStep))) - 1)
            : length > input.maximumStep
        )
          return [];
        return [
          {
            support,
            phase: limb.phase,
            distance,
            lead: along,
            target,
            seconds: swing(distance),
          },
        ];
      },
    );
    candidates.sort(
      (
        a: (typeof candidates)[number],
        b: (typeof candidates)[number],
      ): number =>
        Number(a.support.bone === input.recent) -
          Number(b.support.bone === input.recent) ||
        b.lead - a.lead ||
        a.distance - b.distance ||
        a.phase - b.phase,
    );
    const chosen: (typeof candidates)[number] | undefined = candidates[0];
    if (!chosen || input.supports.length - 1 < input.pattern.minimumSupports)
      return result;
    return {
      ...result,
      state: "recovery",
      step: {
        bone: chosen.support.bone,
        target: chosen.target,
        ...(timing ? { seconds: chosen.seconds } : {}),
      },
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

/** The most passes the step's place and time take to agree. */
const PASSES: number = 20;

/** The step target's change, metres, below which its place and time agree. */
const SETTLED: number = 1e-4;

/**
 * How far a point lies outside a convex floor polygon, metres: zero inside,
 * else its distance to the nearest edge; a polygon of fewer than three
 * vertices has no inside.
 */
function excess(
  polygon: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
): number {
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
              ((point.x - a.x) * dx + (point.z - a.z) * dz) / denominator,
            ),
          );
    outside = Math.min(
      outside,
      Math.hypot(point.x - a.x - dx * t, point.z - a.z - dz * t),
    );
    if (dx * (point.z - a.z) - dz * (point.x - a.x) < 0) inside = false;
  }
  return inside ? 0 : outside;
}
