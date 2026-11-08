import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { KickboxingTiming } from "./KickboxingTiming";
import { PunchShape } from "./PunchShape";
import { StraightLegShape } from "./StraightLegShape";
import { TurnoverShape } from "./TurnoverShape";
import { blendPosture } from "./blendPosture";

/**
 * Shape priors of the strikes in the attacker's own root frame: how the
 * weapon travels from the guard to the receiver's region and back, how the
 * trunk drives it and what the free hands do. The target point is the
 * receiver's actual region, read by the caller and expressed in this frame;
 * the shape only bends its path toward it, and the relational fit closes the
 * remaining gap at contact.
 *
 * ```ts
 * StrikeShape.posture({ measure, guard, rest, spec, follows, seconds, target });
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#surfaces Lines, surfaces and receiver regions.
 * @evidence docs/research/kickboxing/techniques.md#punch-timing Delivery and recovery of punches.
 * @evidence docs/research/kickboxing/techniques.md#kick-timing Chamber, impact and recoil of kicks.
 * @evidence docs/research/kickboxing/techniques.md#guard-during-kicks The kicking-side glove forward at the head line, the other at the cheek.
 * @evidence docs/research/kickboxing/brazilian-kick.md#law The Brazilian kick's chamber, turnover and descent.
 * @evidence docs/research/kickboxing/techniques.md Sections 3, 6 and 7 for the coupled pelvis, trunk and support of punches and kicks.
 */
export namespace StrikeShape {
  /** Depth a landing weapon presses into the struck collider so the geometric query reports contact rather than a tangent graze, metres. */
  export const LANDING_DEPTH: number = 0.01;

  /** Share of the shank from the knee to the shin's striking point: "the lower shin" of the surfaces table, read as its lower 60%. */
  export const SHIN_SHARE: number = 0.6;

  /**
   * The kicking foot's speed at impact as a share of its peak in the
   * extension: Muay Thai linear foot velocity at impact 7.22 m/s against a
   * maximum of 13.24 m/s, metatarsal markers (Gavagan and Sayers 2017,
   * Table 2); the foot peaks before contact and still travels at contact.
   */
  export const IMPACT_SPEED_SHARE: number = 7.22 / 13.24;

  /** End slope of the extension's cubic progress whose impact speed is {@link IMPACT_SPEED_SHARE} of its peak, solved once by bisection. */
  const END_SLOPE: number = (() => {
    // Slope u ↦ p'(u) of the Hermite p(u) = 3u² − 2u³ + k(u³ − u²): zero at
    // the chamber key, k at impact; its peak share k / max p' rises with k.
    const share = (k: number): number => {
      const u: number = Math.max(0, Math.min(1, (6 - 2 * k) / (12 - 6 * k)));
      const peak: number = Math.max(
        k,
        -6 * u * u + 6 * u + k * (3 * u * u - 2 * u),
      );
      return k / peak;
    };
    let low: number = 0;
    let high: number = 1.5;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (low + high) / 2;
      if (share(mid) < IMPACT_SPEED_SHARE) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  })();

  /**
   * Progress of a round kick's extension from the chamber key to impact:
   * it leaves the chamber at rest, peaks before contact and reaches the
   * target still travelling at {@link IMPACT_SPEED_SHARE} of its peak.
   *
   * @param u Time share of the extension in [0, 1].
   * @returns Progress in [0, 1].
   * @evidence docs/research/kickboxing/techniques.md#kick-timing Peak and impact foot speeds of the measured Muay Thai kicks.
   */
  export function extension(u: number): number {
    const x: number = Math.max(0, Math.min(1, u));
    return 3 * x * x - 2 * x * x * x + END_SLOPE * (x * x * x - x * x);
  }

  /**
   * Support-foot turn at impact, radians, read from the Chan rear-oblique
   * frames (rotated support foot, not a measured angle); the Brazilian
   * kick's heel turns toward the target as far as the head kick's.
   */
  const PIVOT: Readonly<Record<KickboxingTechnique.Level, number>> = {
    leg: Math.PI / 4,
    body: Math.PI / 3,
    head: Math.PI / 3,
  };

  /** Share of the arm's reach the kicking-side glove holds forward at the head line: three quarters, the extended guard read from the PLOS impact frame. */
  const GUARD_REACH: number = 0.75;

  /** Trunk lean away from a round kick at impact, degrees: the thoracic side-bend range, by level. */
  const LEAN: Readonly<Record<KickboxingTechnique.Level, number>> = {
    leg: 5,
    body: 10,
    head: 15,
  };

  /** Inputs of one strike's posture. */
  export interface IInput {
    /** The attacker's measure. */
    measure: IFighterMeasure;

    /** The attacker's guard posture. */
    guard: IBoutPosture;

    /** Body-frame ankle points of his planted feet now. */
    rest: Record<"left" | "right", IAutoMovieVector3>;

    /** The technique. */
    spec: KickboxingTechnique.ISpec;

    /** The previous punch of the same combination. */
    follows?: KickboxingTechnique.Name;

    /** Seconds since the strike's launch. */
    seconds: number;

    /** The receiver region's point in the attacker's root frame, or null for a feint. */
    target: IAutoMovieVector3 | null;

    /** For the clinch knee: the receiver's head-back point in the attacker's root frame. */
    clinch?: IAutoMovieVector3;

    /** A kick's drawn return to the replant, seconds, inside the measured recoil; the measured recoil when absent. */
    recoil?: number;

    /** Seconds the kicking leg stays out after contact before its return: a habit's linger; none when absent. */
    hold?: number;
  }

  /**
   * The attacker's posture during a strike, or null once it has fully returned.
   *
   * @param input The strike and the instant.
   * @returns The posture.
   * @evidence docs/research/kickboxing/techniques.md#laws The family laws.
   */
  export function posture(input: IInput): IBoutPosture | null {
    const shown: KickboxingTechnique.ISpec = KickboxingTechnique.performed(
      input.spec,
    );
    const delivery: number = KickboxingTiming.delivery(
      input.spec.name,
      input.follows,
    );
    const t: number = input.seconds;
    if (input.spec.shows) {
      // A feint shows its share and returns along the same path.
      const share: number = input.spec.shows.share;
      const fraction: number =
        t <= delivery ? t / delivery : Math.max(0, 2 - t / delivery);
      if (t >= 2 * delivery) return null;
      return family(
        { ...input, spec: shown },
        shown,
        share * ease(fraction),
        "out",
        fraction,
      );
    }
    if (shown.family === "punch") {
      const out: number = PunchShape.amount(
        t,
        delivery,
        PunchShape.path(input, shown),
      );
      if (t >= delivery + KickboxingTiming.HAND_RECOVERY) return null;
      return PunchShape.posture(input, shown, Math.max(0, out));
    }
    const end: number = delivery + KickboxingTiming.KICK_RECOIL;
    if (t >= end) return null;
    // Kicks follow keys: launch, chamber key, impact, back to chamber, replant.
    const phase: "out" | "back" = t <= delivery ? "out" : "back";
    const hold: number = input.hold ?? 0;
    const recoil: number = Math.min(
      input.recoil ?? KickboxingTiming.KICK_RECOIL,
      KickboxingTiming.KICK_RECOIL - hold,
    );
    const progress: number =
      t <= delivery
        ? t / delivery
        : Math.max(0, Math.min(1, (t - delivery - hold) / recoil));
    return family(input, shown, 1, phase, progress);
  }

  function family(
    input: IInput,
    shown: KickboxingTechnique.ISpec,
    amount: number,
    phase: "out" | "back",
    progress: number,
  ): IBoutPosture {
    switch (shown.family) {
      case "punch":
        return PunchShape.posture(input, shown, amount);
      case "round-kick":
        return roundKick(input, shown, phase, progress, amount);
      case "push-kick":
        return StraightLegShape.teep(input, phase, progress, amount);
      case "knee":
        return StraightLegShape.knee(input, phase, progress, amount);
      case "feint":
        throw new Error("A feint performs another technique");
    }
  }

  /**
   * A round kick, including the switch kick and the Brazilian kick. The
   * body turns by the support pivot while the kick travels, so every goal
   * the receiver or the facing line fixes (the target, the planted foot,
   * the forward glove) is stated in the guard's frame and turned into the
   * body's frame of the instant.
   */
  function roundKick(
    input: IInput,
    spec: KickboxingTechnique.ISpec,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard } = input;
    const side: "left" | "right" = spec.side;
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const turnover: boolean = spec.line === "descending";
    const chamberShare: number =
      KickboxingTiming.KICK_CHAMBER / KickboxingTiming.KICK_IMPACT;
    const lift: number =
      phase === "out"
        ? Math.min(1, progress / chamberShare)
        : progress <= 0.5
          ? 1
          : 1 - ease((progress - 0.5) / 0.5);
    const reach: number =
      phase === "out"
        ? progress <= chamberShare
          ? 0
          : extension((progress - chamberShare) / (1 - chamberShare))
        : progress <= 0.5
          ? 1 - ease(progress / 0.5)
          : 0;
    const drive: number = Math.max(reach, lift * 0.5);
    const turn: number = PIVOT[spec.level] * drive;
    const local = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      unturn(p, sign * turn);
    const rest: IAutoMovieVector3 = local(input.rest[side]);
    // The turnover rises onto the straightened support, tilts the pelvis back
    // and hikes the kicking hip (brazilian-kick.md#law).
    const over: number = turnover ? drive : 0;
    const drop: number = guard.drop * (1 - over);
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: turnover ? TurnoverShape.hip(measure) - drop : measure.hip - drop,
      z: sign * measure.hipHalfWidth,
    };
    const folded: { point: IAutoMovieVector3; knee: IAutoMovieVector3 } =
      StraightLegShape.fold(
        hip,
        StraightLegShape.CHAMBER_HIP[
          spec.disguise
            ? KickboxingTechnique.table[spec.disguise].level
            : spec.level
        ],
        sign,
        measure,
      );
    const target: IAutoMovieVector3 =
      input.target === null ? folded.knee : local(input.target);
    // The shin crosses the target toward the kicker's other side; the
    // descending kick's instep comes down onto it from the highest knee.
    const impact: { knee: IAutoMovieVector3; point: IAutoMovieVector3 } =
      turnover
        ? TurnoverShape.impact(hip, target, measure)
        : {
            knee: Vector3.add(target, {
              x: 0,
              y: 0,
              z: sign * measure.shank * SHIN_SHARE,
            }),
            point: Vector3.add(target, {
              x: 0,
              y: 0,
              z: -sign * measure.shank * (1 - SHIN_SHARE),
            }),
          };
    // The descending kick's chamber keeps climbing: the folded lower leg
    // hangs under the turnover's knee, above the receiver's shoulder line,
    // before the foot rises over the target.
    const chamber: { point: IAutoMovieVector3; knee: IAutoMovieVector3 } =
      turnover
        ? {
            knee: impact.knee,
            point: Vector3.add(
              impact.knee,
              Vector3.subtract(folded.point, folded.knee),
            ),
          }
        : folded;
    let foot: { point: IAutoMovieVector3; knee: IAutoMovieVector3 };
    // The chamber's rise from the planted foot is the posture's own blend
    // from the guard by the lift, so the goal is the chamber itself.
    if (phase === "out" && progress <= chamberShare)
      foot = { point: chamber.point, knee: chamber.knee };
    else if (phase === "out") {
      // The descending kick's knee climbs while the folded lower leg rises
      // over the target, then the foot drops onto it from above
      // (brazilian-kick.md#law: the knee climbs, the lower leg drops).
      const top: IAutoMovieVector3 = TurnoverShape.apex(
        impact.knee,
        target,
        measure,
      );
      foot = {
        point: !turnover
          ? Vector3.lerp(chamber.point, impact.point, reach)
          : reach < 0.5
            ? Vector3.lerp(chamber.point, top, ease(reach * 2))
            : Vector3.lerp(top, impact.point, ease(reach * 2 - 1)),
        knee: Vector3.lerp(
          chamber.knee,
          impact.knee,
          turnover ? ease(Math.min(1, reach * 2)) : reach,
        ),
      };
    } else if (progress <= 0.5) {
      const s: number = ease(progress / 0.5);
      foot = {
        point: Vector3.lerp(impact.point, chamber.point, s),
        knee: Vector3.lerp(impact.knee, chamber.knee, s),
      };
    } else
      foot = {
        point: Vector3.lerp(chamber.point, rest, ease((progress - 0.5) / 0.5)),
        knee: chamber.knee,
      };
    // The turnover's trunk leans only by the pelvis's tilt and hike, the
    // lumbar spine flexing back over the kick to keep the head up.
    const lean: number = turnover ? 0 : LEAN[spec.level] * drive;
    // The kicking-side glove reaches forward along the head line toward the
    // receiver: from the head, carried back as the turnover tilts the trunk,
    // straight ahead at its height, as far as the arm reaches from its
    // shoulder along that ray; the other guards the chin.
    const tilt: number = (TurnoverShape.TILT * over * Math.PI) / 180;
    const forward: { point: IAutoMovieVector3 } = {
      point: local(
        reachAlong(
          {
            x: -(measure.head - measure.hip) * Math.sin(tilt),
            y:
              measure.hip +
              (measure.head - measure.hip) * Math.cos(tilt) -
              drop,
            z: sign * measure.headRadius,
          },
          {
            x: -(measure.shoulder - measure.hip) * Math.sin(tilt),
            y:
              measure.hip +
              (measure.shoulder - measure.hip) * Math.cos(tilt) -
              drop,
            z: sign * measure.shoulderHalfWidth,
          },
          measure.armReach * GUARD_REACH,
        ),
      ),
    };
    const kicked: IBoutPosture = {
      ...guard,
      drop,
      pelvis: {
        ...guard.pelvis,
        tilt: guard.pelvis.tilt - TurnoverShape.TILT * over,
        obliquity: guard.pelvis.obliquity + sign * TurnoverShape.HIKE * over,
      },
      yaw: guard.yaw + sign * turn,
      thoracic: {
        ...guard.thoracic,
        lateralFlexion: guard.thoracic.lateralFlexion - sign * lean,
      },
      lumbar: {
        ...guard.lumbar,
        flexion: guard.lumbar.flexion + TurnoverShape.COUNTER * over,
      },
      hands: { ...guard.hands, [side]: forward },
      feet: { ...guard.feet, [side]: foot },
      pivot: sign * turn,
    };
    return blendPosture(
      guard,
      kicked,
      amount * Math.max(lift, reach),
      input.rest,
    );
  }

  /**
   * The point on the forward ray from `head` (along +X, the facing toward
   * the receiver) whose distance from `shoulder` is `reach`: the glove held
   * forward at the head line as far as the arm reaches, never folded back
   * into the face.
   */
  function reachAlong(
    head: IAutoMovieVector3,
    shoulder: IAutoMovieVector3,
    reach: number,
  ): IAutoMovieVector3 {
    const p: IAutoMovieVector3 = Vector3.subtract(head, shoulder);
    // |p + s·x̂| = reach, the forward root.
    const s: number =
      -p.x +
      Math.sqrt(Math.max(0, p.x * p.x - Vector3.dot(p, p) + reach * reach));
    return { x: head.x + s, y: head.y, z: head.z };
  }

  /** A guard-frame point in the frame of a body turned further by `angle` about +Y (right-handed). */
  function unturn(p: IAutoMovieVector3, angle: number): IAutoMovieVector3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
