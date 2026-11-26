import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/internal/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalBalanceAssessment as Assessment } from "./physicalBalanceAssessment";

/**
 * One limb's recovery step (`AutoMoviePhysicalBalance.assess`): where it lands,
 * when, and whether it captures and can be unloaded at once.
 */
export namespace physicalBalanceCandidate {
  /** One limb's planned step. */
  export interface ICandidate {
    /** The limb's support. */
    support: IAutoMoviePhysicalSupportPatch;

    /** Its declared footfall phase. */
    phase: number;

    /** The step's length, metres. */
    distance: number;

    /** The limb's lead along the capture point's direction. */
    lead: number;

    /** The footstep. */
    target: IAutoMovieVector3;

    /** The swing's duration, seconds. */
    seconds: number;

    /** Whether the capture point lands inside the new support. */
    viable: boolean;

    /** How far past the new support it lands, metres. */
    violation: number;

    /** Whether the remaining supports already hold the centre of pressure. */
    unloadable: boolean;
  }

  /** Plan one limb's step; none for a limb that may not step. */
  export function candidate(
    scope: Assessment.IAssessment,
    support: IAutoMoviePhysicalSupportPatch,
  ): ICandidate[] {
    const {
      input,
      capturePoint,
      omega,
      timing,
      centroid,
      direction,
      denominator,
    }: Assessment.IAssessment = scope;
    const held = (outline: IAutoMovieVector3[]): IAutoMovieVector3[] =>
      Assessment.held(scope, outline);
    const swing = (distance: number): number =>
      Assessment.swing(scope, distance);
    const until = (distance: number): number =>
      Assessment.until(scope, distance);
    const {
      excess,
      PASSES,
      SETTLED,
    }: Pick<typeof Assessment, "excess" | "PASSES" | "SETTLED"> = Assessment;
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
        (other: (typeof input.supports)[number]): boolean => other !== support,
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
          (sum: IAutoMovieVector3, other: (typeof input.supports)[number]) =>
            Vector3.add(sum, other.position),
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
      const fixed: number = sign * Math.max(sign * lateral, Math.abs(width));
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
        omega * until(distance),
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
    const violation: number = excess(after(target), landing);
    const viable: boolean = violation <= SETTLED;
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
        violation,
        unloadable,
        seconds: swing(distance),
      },
    ];
  }
}
