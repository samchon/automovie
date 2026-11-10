import type {
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Interpersonal distance: the gaps people keep, by relationship and purpose,
 * as the chest-to-target gap an approach stops at.
 *
 * Hall (1966, The Hidden Dimension) divides the space around a person into
 * zones by the interaction they afford, each with a close and a far phase:
 * intimate under 0.45 m, personal 0.45 to 1.2 m (close 0.45 to 0.75, far
 * 0.75 to 1.2), social 1.2 to 3.6 m (close 1.2 to 2.1) and public beyond. The
 * named gaps here sit inside those zones:
 *
 * - `intimate` 0.3 m, the middle of the intimate far phase (0.15 to 0.45);
 * - `faceToFace` 0.6 m, the middle of the personal close phase, where two
 *   people stand squared up within arm's reach;
 * - `personal` 1.0 m, the far phase where conversation between acquaintances
 *   happens (Hall; Hayduk 1978, Psychol Bull 85:117, reviews measured
 *   comfortable distances of the same order, larger in front than behind);
 * - `social` 1.6 m, the middle of the social close phase, impersonal business;
 * - `handing`: the gap at which both people's hands meet midway between
 *   their chests with the elbows flexed 35 degrees, the middle of the 20 to
 *   50 degrees the campaign assumes for a comfortable handover (provisional:
 *   Kopnarski et al. 2023 report where a handover happens, not at what
 *   distance), at the handover height midway between the two waists and
 *   chests (provisional).
 *
 * A gap is horizontal, measured from the front of the performer's chest (the
 * sternum region) to the target point: another person's sternum, a prop's
 * point or a free point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanProxemics {
  /** A named gap. */
  export type Band =
    | "intimate"
    | "faceToFace"
    | "personal"
    | "social"
    | "handing";

  /** Hall's zones, metres. */
  export const ZONES: Readonly<
    Record<"intimate" | "personal" | "social", readonly [number, number]>
  > = {
    intimate: [0, 0.45],
    personal: [0.45, 1.2],
    social: [1.2, 3.6],
  };

  /** Fixed named gaps, metres. */
  export const GAPS: Readonly<Record<Exclude<Band, "handing">, number>> = {
    intimate: 0.3,
    faceToFace: 0.6,
    personal: 1.0,
    social: 1.6,
  };

  /** Elbow flexion at a handover, degrees (provisional). */
  export const HANDING_ELBOW: number = 35;

  /**
   * The horizontal reach from the front of the chest to the palm when the
   * elbow is flexed by `HANDING_ELBOW` and the palm is at a height.
   *
   * The shoulder-to-palm distance follows the law of cosines over the upper
   * arm and the forearm plus 0.4 of the hand (the palm's centre), at the
   * interior elbow angle `180 - flexion`; its horizontal share at the height
   * difference is reduced by half the chest depth, the shoulder joint's
   * distance behind the chest's front.
   *
   * @param measure The person.
   * @param height The palm's height, metres.
   * @returns Metres, possibly negative when the palm cannot reach that height ahead.
   */
  export function reach(
    measure: IAutoMovieBodyMeasure,
    height: number,
  ): number {
    const a: number = measure.upperArm;
    const b: number = measure.forearm + 0.4 * measure.hand;
    const flexion: number = (HANDING_ELBOW * Math.PI) / 180;
    const d: number = Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(flexion));
    const dy: number = measure.shoulderHeight - height;
    return Math.sqrt(Math.max(0, d * d - dy * dy)) - measure.chestDepth / 2;
  }

  /**
   * The gap of a request between two people.
   *
   * @param request A named gap or metres.
   * @param self The approaching person.
   * @param other The other person; the approaching person when absent (a prop or point target).
   * @returns Metres; positive.
   * @throws {Error} When a metre request is not positive.
   */
  export function gap(
    request: Band | number,
    self: IAutoMovieBodyMeasure,
    other: IAutoMovieBodyMeasure = self,
  ): number {
    if (typeof request === "number") {
      if (!(request > 0)) throw new Error("An approach gap is positive");
      return request;
    }
    if (request !== "handing") return GAPS[request];
    const height: number =
      (self.waistHeight +
        self.chestHeight +
        other.waistHeight +
        other.chestHeight) /
      4;
    return Math.max(0.05, reach(self, height) + reach(other, height));
  }

  /**
   * Where to stop: the floor point for the feet's midpoint so the front of
   * the chest is `gap` short of the target along the line from the start.
   *
   * @param from The feet's midpoint now, world metres.
   * @param target The target point, world metres.
   * @param gap The gap, metres.
   * @param chest How far the front of the chest stands ahead of the feet's midpoint, metres.
   * @returns The stop point on the floor and the heading to face, degrees.
   */
  export function stop(
    from: IAutoMovieVector3,
    target: IAutoMovieVector3,
    gap: number,
    chest: number,
  ): { at: IAutoMovieVector3; yaw: number } {
    const dx: number = target.x - from.x;
    const dz: number = target.z - from.z;
    const d: number = Math.hypot(dx, dz);
    if (d < 1e-9)
      throw new Error(
        "An approach needs a target away from where the performer stands",
      );
    const back: number = gap + chest;
    return {
      at: {
        x: target.x - (dx / d) * back,
        y: 0,
        z: target.z - (dz / d) * back,
      },
      yaw: (Math.atan2(dx, dz) * 180) / Math.PI,
    };
  }

  /**
   * A body measure scaled to another stature by one ratio, the proportional
   * estimate used when only a partner's height is known: segment lengths of
   * adults scale nearly in proportion to stature (Drillis and Contini, via
   * Winter, Biomechanics and Motor Control of Human Movement, fig. 4.1).
   *
   * @param measure A measure.
   * @param ratio The stature ratio.
   * @returns The scaled measure; mass scales with the cube.
   */
  export function scaled(
    measure: IAutoMovieBodyMeasure,
    ratio: number,
  ): IAutoMovieBodyMeasure {
    const out: IAutoMovieBodyMeasure = { ...measure };
    for (const key of Object.keys(measure) as (keyof IAutoMovieBodyMeasure)[])
      out[key] =
        key === "mass" ? measure[key] * ratio ** 3 : measure[key] * ratio;
    return out;
  }
}
