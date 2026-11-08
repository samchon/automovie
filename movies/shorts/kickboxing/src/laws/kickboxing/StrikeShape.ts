import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { KickboxingTiming } from "./KickboxingTiming";
import { PunchShape } from "./PunchShape";
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
   * Support-foot turn at impact, radians, read from the Chan rear-oblique
   * frames (rotated support foot, not a measured angle) and the Brazilian
   * kick's "heel turns toward the target".
   */
  const PIVOT: Readonly<
    Record<KickboxingTechnique.Level | "turnover", number>
  > = {
    leg: Math.PI / 4,
    body: Math.PI / 3,
    head: Math.PI / 3,
    turnover: Math.PI / 2,
  };

  /** Whole-body lean away from the Brazilian kick at the turnover, radians: the trunk "leans back" read as thirty degrees. */
  const TURNOVER_ROLL: number = Math.PI / 6;

  /** Pelvis obliquity of the turnover, degrees: half the channel's forty-five-degree hike range read as the hip rolling over. */
  const TURNOVER_HIKE: number = 22;

  /** Hip flexion of the round-kick chamber, degrees, by level: thigh toward the target height (PLOS Fig. 3 chamber). */
  const CHAMBER_HIP: Readonly<Record<KickboxingTechnique.Level, number>> = {
    leg: 45,
    body: 80,
    head: 95,
  };

  /** Knee flexion of the chamber, degrees: the folded shank of PLOS Fig. 3 B. */
  const CHAMBER_KNEE: number = 110;

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
      const out: number =
        t <= delivery
          ? ease(t / delivery)
          : 1 - ease((t - delivery) / KickboxingTiming.HAND_RECOVERY);
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
        return teep(input, phase, progress, amount);
      case "knee":
        return knee(input, phase, progress, amount);
      case "feint":
        throw new Error("A feint performs another technique");
    }
  }

  /** A round kick, including the switch kick and the Brazilian kick. */
  function roundKick(
    input: IInput,
    spec: KickboxingTechnique.ISpec,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard, rest } = input;
    const side: "left" | "right" = spec.side;
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: measure.hip - guard.drop,
      z: sign * measure.hipHalfWidth,
    };
    const chamber: { point: IAutoMovieVector3; knee: IAutoMovieVector3 } = fold(
      hip,
      CHAMBER_HIP[
        spec.disguise
          ? KickboxingTechnique.table[spec.disguise].level
          : spec.level
      ],
      sign,
      measure,
    );
    const turnover: boolean = spec.line === "descending";
    const target: IAutoMovieVector3 = input.target ?? chamber.knee;
    // The shin crosses the target toward the kicker's other side; the
    // descending kick arrives from above it instead.
    const across: IAutoMovieVector3 = turnover
      ? Vector3.normalize({ x: 0.2, y: -1, z: -sign * 0.3 })
      : { x: 0, y: 0, z: -sign };
    const impact = {
      knee: Vector3.subtract(
        target,
        Vector3.scale(across, measure.shank * SHIN_SHARE),
      ),
      point: Vector3.add(
        target,
        Vector3.scale(across, measure.shank * (1 - SHIN_SHARE)),
      ),
    };
    if (turnover)
      impact.knee = Vector3.add(impact.knee, {
        x: 0,
        y: measure.headRadius,
        z: 0,
      });
    const chamberShare: number =
      KickboxingTiming.KICK_CHAMBER / KickboxingTiming.KICK_IMPACT;
    let foot: { point: IAutoMovieVector3; knee: IAutoMovieVector3 };
    let reach: number;
    if (phase === "out" && progress <= chamberShare) {
      const s: number = ease(progress / chamberShare);
      foot = {
        point: Vector3.lerp(rest[side], chamber.point, s),
        knee: chamber.knee,
      };
      reach = 0;
    } else if (phase === "out") {
      const s: number = ease((progress - chamberShare) / (1 - chamberShare));
      // The descending kick's folded leg first carries the foot a shank above
      // the target, then opens and drops it onto the target from above
      // (brazilian-kick.md#law: the knee climbs, the lower leg drops).
      const apex: IAutoMovieVector3 = Vector3.add(target, {
        x: 0,
        y: measure.shank,
        z: 0,
      });
      foot = {
        point: !turnover
          ? Vector3.lerp(chamber.point, impact.point, s)
          : s < 0.5
            ? Vector3.lerp(chamber.point, apex, ease(s * 2))
            : Vector3.lerp(apex, impact.point, ease(s * 2 - 1)),
        knee: Vector3.lerp(chamber.knee, impact.knee, s),
      };
      reach = s;
    } else if (progress <= 0.5) {
      const s: number = ease(progress / 0.5);
      foot = {
        point: Vector3.lerp(impact.point, chamber.point, s),
        knee: Vector3.lerp(impact.knee, chamber.knee, s),
      };
      reach = 1 - s;
    } else {
      const s: number = ease((progress - 0.5) / 0.5);
      foot = {
        point: Vector3.lerp(chamber.point, rest[side], s),
        knee: chamber.knee,
      };
      reach = 0;
    }
    const lift: number =
      phase === "out"
        ? Math.min(1, progress / chamberShare)
        : progress <= 0.5
          ? 1
          : 1 - ease((progress - 0.5) / 0.5);
    const turn: number =
      (turnover ? PIVOT.turnover : PIVOT[spec.level]) *
      Math.max(reach, lift * 0.5);
    const lean: number = LEAN[spec.level] * Math.max(reach, lift * 0.5);
    // The kicking-side glove reaches forward along the head line; the other guards the cheek.
    const head: number = measure.head - guard.drop;
    const forward: { point: IAutoMovieVector3 } = {
      point: {
        x: measure.armReach * 0.75,
        y: head,
        z: sign * measure.headRadius,
      },
    };
    // The turnover rolls the hips over: the body leans away from the kick and
    // the kicking hip rises (brazilian-kick.md#law), up to the pelvis's
    // obliquity range's half.
    const over: number = turnover ? Math.max(reach, lift * 0.5) : 0;
    const kicked: IBoutPosture = {
      ...guard,
      roll: guard.roll + sign * TURNOVER_ROLL * over,
      pelvis: {
        ...guard.pelvis,
        obliquity: guard.pelvis.obliquity + TURNOVER_HIKE * over,
      },
      yaw: guard.yaw + sign * turn,
      thoracic: {
        ...guard.thoracic,
        lateralFlexion: guard.thoracic.lateralFlexion - sign * lean,
      },
      hands: { ...guard.hands, [side]: forward },
      feet: { ...guard.feet, [side]: foot },
      pivot: sign * turn,
    };
    return blendPosture(guard, kicked, amount * Math.max(lift, reach), rest);
  }

  /** The lead-leg teep: knee up, sole driven forward to the stomach, recoil. */
  function teep(
    input: IInput,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard, rest } = input;
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: measure.hip - guard.drop,
      z: measure.hipHalfWidth,
    };
    const chamber = fold(hip, CHAMBER_HIP.body, 1, measure);
    const aim: IAutoMovieVector3 =
      input.target ??
      Vector3.add(hip, { x: measure.thigh + measure.shank, y: 0, z: 0 });
    const end: IAutoMovieVector3 = Vector3.subtract(aim, {
      x: measure.foot / 2 - LANDING_DEPTH,
      y: 0,
      z: 0,
    });
    const out: number = phase === "out" ? ease(progress) : 1 - ease(progress);
    const point: IAutoMovieVector3 =
      phase === "out" && progress < 0.6
        ? Vector3.lerp(rest.left, chamber.point, ease(progress / 0.6))
        : phase === "out"
          ? Vector3.lerp(chamber.point, end, ease((progress - 0.6) / 0.4))
          : progress < 0.5
            ? Vector3.lerp(end, chamber.point, ease(progress / 0.5))
            : Vector3.lerp(
                chamber.point,
                rest.left,
                ease((progress - 0.5) / 0.5),
              );
    const kicked: IBoutPosture = {
      ...guard,
      shift: { forward: -measure.headRadius * out, left: 0 },
      thoracic: {
        ...guard.thoracic,
        flexion: guard.thoracic.flexion - 10 * out,
      },
      feet: { ...guard.feet, left: { point } },
    };
    return blendPosture(guard, kicked, amount, rest);
  }

  /** The clinch knee: both gloves behind the receiver's head, the rear knee driven up into his stomach. */
  function knee(
    input: IInput,
    phase: "out" | "back",
    progress: number,
    amount: number,
  ): IBoutPosture {
    const { measure, guard, rest } = input;
    const hip: IAutoMovieVector3 = {
      x: 0,
      y: measure.hip - guard.drop,
      z: -measure.hipHalfWidth,
    };
    const target: IAutoMovieVector3 =
      input.target ?? Vector3.add(hip, { x: measure.thigh, y: 0, z: 0 });
    const kneePoint: IAutoMovieVector3 = Vector3.subtract(target, {
      x: LANDING_DEPTH,
      y: 0,
      z: 0,
    });
    const ankle: IAutoMovieVector3 = Vector3.add(kneePoint, {
      x: -measure.shank * 0.6,
      y: -measure.shank * 0.8,
      z: 0,
    });
    const out: number = phase === "out" ? ease(progress) : 1 - ease(progress);
    const grip: IAutoMovieVector3 = input.clinch ?? guard.hands.left.point;
    const kneed: IBoutPosture = {
      ...guard,
      thoracic: { ...guard.thoracic, flexion: guard.thoracic.flexion + 10 },
      hands: {
        left: {
          point: Vector3.add(grip, { x: 0, y: 0, z: measure.gloveRadius }),
        },
        right: {
          point: Vector3.add(grip, { x: 0, y: 0, z: -measure.gloveRadius }),
        },
      },
      feet: {
        ...guard.feet,
        right: { point: Vector3.lerp(rest.right, ankle, out), knee: kneePoint },
      },
    };
    return blendPosture(guard, kneed, amount * Math.min(1, out * 2), rest);
  }

  /** The folded chamber of a leg at a hip flexion, raised beside the hip toward the front. */
  function fold(
    hip: IAutoMovieVector3,
    flexion: number,
    sign: 1 | -1,
    measure: IFighterMeasure,
  ): { point: IAutoMovieVector3; knee: IAutoMovieVector3 } {
    const f: number = (flexion * Math.PI) / 180;
    const thigh: IAutoMovieVector3 = {
      x: Math.sin(f),
      y: -Math.cos(f),
      z: sign * 0.25,
    };
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.scale(Vector3.normalize(thigh), measure.thigh),
    );
    const k: number = f + Math.PI - (CHAMBER_KNEE * Math.PI) / 180;
    const shank: IAutoMovieVector3 = {
      x: -Math.sin(Math.PI - k) * 0.6,
      y: -Math.cos(Math.PI - k),
      z: 0,
    };
    return {
      knee,
      point: Vector3.add(
        knee,
        Vector3.scale(Vector3.normalize(shank), measure.shank),
      ),
    };
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
