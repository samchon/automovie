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
 */
export namespace AutoMoviePhysicalBalance {
  /**
   * The peak acceleration of a minimum-jerk transfer of unit distance in unit
   * time: 10 sqrt(3) / 3 (Flash and Hogan 1985). A swing over d in T peaks at
   * MINIMUM_JERK d / T^2.
   */
  export const MINIMUM_JERK: number = (10 * Math.sqrt(3)) / 3;

  /**
   * The peak vertical acceleration of a swing's clearance h 16 (p (1 - p))^2 of
   * unit height in unit time, at lift-off and touchdown
   * (`samplePhysicalRecoveryGoal`): a clearance h in T peaks at CLEARANCE h /
   * T^2.
   */
  export const CLEARANCE: number = 32;

  /** The shortest swing, seconds (Khadiv et al. 2017, Section V). */
  export const MINIMUM_SWING: number = 0.3;

  /**
   * The quickest swing over a distance with a clearance under an acceleration
   * bound, seconds: the longer of the minimum-jerk transfer's and the
   * clearance's, sqrt(max(MINIMUM_JERK d, CLEARANCE h) / a), and no shorter
   * than `MINIMUM_SWING`.
   */
  export function duration(
    distance: number,
    height: number,
    acceleration: number,
  ): number {
    return Math.max(
      MINIMUM_SWING,
      Math.sqrt(
        Math.max(MINIMUM_JERK * distance, CLEARANCE * height) / acceleration,
      ),
    );
  }

  /**
   * Choose the recovery step once the capture point leaves the shrunken
   * support: a capturing step before one that is not, one whose remaining
   * supports already hold the commanded centre of pressure before one that must
   * first be unloaded, the one that landed last only after any other, then the
   * shortest travel, the lead along the capture point's direction and the
   * declared footfall phase; its target is where the capture point will be when
   * it can land, clamped to the reach. Young adults recover a lateral push
   * mostly by a single side step of the limb the push loaded (Mille et al.
   * 2005, Clinical Biomechanics), which the controller unloads over a short
   * ramp before lifting (`advancePhysicalBalance`).
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
      x: input.center.x + input.velocity.x / omega + (input.spin?.x ?? 0),
      y: input.floor,
      z: input.center.z + input.velocity.z / omega + (input.spin?.z ?? 0),
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
      beyond,
    };
    if (height <= 0 || polygon.length === 0) return result;
    if (beyond <= input.margin && !input.force)
      return { ...result, state: "supported" };
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
    // A swing under way lands its elapsed time sooner than a fresh one.
    const spent: number = Math.max(0, timing?.elapsed ?? 0);
    const candidates: {
      support: IAutoMoviePhysicalSupportPatch;
      phase: number;
      distance: number;
      lead: number;
      target: IAutoMovieVector3;
      seconds: number;
      viable: boolean;
      unloadable: boolean;
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
        viable: boolean;
        unloadable: boolean;
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
        // The body's own axes: its heading and its side (the root's yaw), so a
        // diagonal step does not turn the side the limb must keep.
        const facing: IAutoMovieVector3 = input.heading ?? direction;
        const length2: number = Math.hypot(facing.x, facing.z);
        const forward: IAutoMovieVector3 =
          length2 > 0
            ? { x: facing.x / length2, y: 0, z: facing.z / length2 }
            : { x: 0, y: 0, z: 1 };
        const side: IAutoMovieVector3 = { x: -forward.z, y: 0, z: forward.x };
        const across = (p: IAutoMovieVector3): number =>
          (p.x - stance.x) * side.x + (p.z - stance.z) * side.z;
        const width: number = across(support.position);
        const sign: number = width < 0 ? -1 : 1;
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
        // The step puts the foot's middle on the capture point at landing,
        // the limb kept on its own side so it never crosses over: stopping
        // puts the centre of pressure on the capture point (Koolen et al.,
        // Section II-G), and the capture point then lies inside the new
        // support by the foot's own margin rather than on its edge (Pratt et
        // al., M2V2, Sections VII-C2, VII-E1 and IX-G). Out of reach, or when
        // the side clamp leaves the capture point outside, the shortest step
        // that still captures, forward, backward or aside.
        const keep = (p: IAutoMovieVector3): IAutoMovieVector3 => {
          const lateral: number = across(p);
          const fixed: number =
            sign * Math.max(sign * lateral, Math.abs(width));
          return {
            x: p.x + side.x * (fixed - lateral),
            y: p.y,
            z: p.z + side.z * (fixed - lateral),
          };
        };
        const place = (xi: IAutoMovieVector3): IAutoMovieVector3 => {
          if (excess(after(support.position), xi) <= 0)
            return { ...support.position };
          // Toward the capture point as seen on the limb's own side, so the
          // reach is not spent on a crossing the side clamp would undo.
          const aim: IAutoMovieVector3 = keep(xi);
          const gap: number = Math.hypot(
            aim.x - support.position.x,
            aim.z - support.position.z,
          );
          const aimed: IAutoMovieVector3 = { ...aim, y: support.position.y };
          if (gap <= input.maximumStep && excess(after(aimed), xi) <= 0)
            return aimed;
          const toward: IAutoMovieVector3 =
            gap > 0
              ? {
                  x: (aim.x - support.position.x) / gap,
                  y: 0,
                  z: (aim.z - support.position.z) / gap,
                }
              : forward;
          const step = (d: number): IAutoMovieVector3 =>
            keep({
              x: support.position.x + toward.x * d,
              y: support.position.y,
              z: support.position.z + toward.z * d,
            });
          let near: number = 0;
          let far: number = input.maximumStep;
          if (excess(after(step(far)), xi) > 0) return step(far);
          while (far - near > SETTLED) {
            const middle: number = (near + far) / 2;
            if (excess(after(step(middle)), xi) <= 0) far = middle;
            else near = middle;
          }
          return step(far);
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
            omega * Math.max(0, (timing?.ramp ?? 0) + swing(distance) - spent),
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
        // One-step capture with finite feet (Koolen et al., Eq. 25): this
        // limb's step, clamped to the reach, leaves the capture point at its
        // landing inside the new support. A step is asked for either way, and
        // the body steps again or falls by its physics (Khadiv et al. 2017,
        // Section III-B: viability is soft). Without a step time only a step
        // within reach captures.
        const viable: boolean = excess(after(target), landing) <= SETTLED;
        if (!timing && !viable) return [];
        // A limb whose remaining supports already hold the commanded centre
        // of pressure gives up its load at once; another first has the
        // centre of pressure moved off it (Pratt et al., M2V2, Section
        // VII-A: the leg is unloaded before it swings).
        const unloadable: boolean =
          input.pressure !== undefined &&
          holding.length >= 3 &&
          excess(holding, input.pressure) <= 0;
        return [
          {
            support,
            phase: limb.phase,
            distance,
            lead: along,
            target,
            viable,
            unloadable,
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
        Number(b.viable) - Number(a.viable) ||
        // Unloading ranks capturing steps only: a limb that can leave the
        // commanded centre of pressure but cannot capture is no help, as a
        // rear foot under a forward push, already unloaded but unable to
        // extend the support toward the push.
        Number(b.viable && b.unloadable) - Number(a.viable && a.unloadable) ||
        Number(a.support.bone === input.recent) -
          Number(b.support.bone === input.recent) ||
        a.distance - b.distance ||
        b.lead - a.lead ||
        a.phase - b.phase,
    );
    const chosen: (typeof candidates)[number] | undefined = candidates[0];
    if (!chosen || input.supports.length - 1 < input.pattern.minimumSupports)
      return result;
    // A capturing step shorter than the margin is no step: the margin is the
    // centre-of-pressure law's buffer, so the body holds in double support
    // (Pratt et al., M2V2, Section VII-E1: stop in double support).
    if (timing && chosen.viable && chosen.distance < (input.inset ?? 0))
      return { ...result, state: "supported" };
    return {
      ...result,
      state: "recovery",
      step: {
        bone: chosen.support.bone,
        target: chosen.target,
        ...(timing ? { seconds: chosen.seconds, viable: chosen.viable } : {}),
      },
    };
  }

  /**
   * The step a request plans next while its limb has not lifted: the best
   * step when its own limb has none, or when the best captures and its own
   * does not; but once its limb has begun unloading, only its own, its place
   * and time planned again and its limb kept, none when its own has no step.
   * A step is committed at its trigger and adapted, never handed to another
   * limb (design-4017-landing, decision 2; Khadiv et al. 2017 and Griffin et
   * al. 2017 adapt throughout but never cancel): moving the request after its
   * load has started to leave bounds both limbs' ramps at once.
   *
   * @param input Whether the requested limb has begun unloading, its own
   *   limb's step if it has one, and the best step over every limb.
   * @returns The step to request, or undefined to keep the request as it is.
   */
  export function retarget(input: {
    unloading: boolean;
    own?: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>;
    best: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>;
  }): IAutoMoviePhysicalBalance.IResult["step"] {
    if (input.unloading) return input.own;
    return input.own === undefined ||
      (input.best.viable === true && input.own.viable !== true)
      ? input.best
      : input.own;
  }

  /**
   * The capture point a time ahead while the supports hold their centre of
   * pressure at their point nearest it. With the centre of pressure u fixed,
   * the inverted pendulum's capture point moves as u + (xi - u) e^(omega t)
   * (Hof, Gazendam and Sinke 2005, Eq. 3 written for x + v / omega); Pratt et
   * al. (2006) capture at xi only by an instantaneous step.
   *
   * @param capture The present capture point, world metres.
   * @param polygon The supports' convex hull; empty leaves the capture point
   *   where it is.
   * @param elapsed The time ahead times the pendulum frequency, dimensionless.
   * @returns The capture point then, world metres, at the capture point's
   *   height.
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
   * The point of a horizontal convex polygon nearest a point: the point itself
   * inside, else its projection on the nearest edge.
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
 * else its distance to the nearest edge; a polygon of fewer than three vertices
 * has no inside.
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
