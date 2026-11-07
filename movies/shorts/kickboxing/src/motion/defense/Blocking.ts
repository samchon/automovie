import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { BoutTechnique } from "../choreography/BoutTechnique";
import { BoutRing } from "../footwork/BoutRing";

/**
 * Where each fighter stands and faces during the bout, before footsteps and body motion.
 *
 * The pair shares the centre and axis the ring-generalship laws derive (BoutRing).
 * Each fighter's stance origin sits on that axis at half the neutral range,
 * displaced toward the opponent by its own attack advance: an attacker steps
 * into the range its technique needs, then returns. Both advances are smooth,
 * so the footstep generator turns them into discrete supported steps.
 *
 * @evidence contracts/common.md#implementation-and-ownership Pure in film time (the precomputed ring-generalship track plus plateau envelopes per attack), so any second evaluates without history and seek equals playback. When both fighters close at once (a counter during the other's recovery) their combined closing is capped at the deeper single need, so the pair is never closer than the attack in flight needs.
 * @evidence contracts/common.md#authoring-interface Returns world X/Z metres and headings in radians (three.js sign, 0 faces +X). Valid for the exchanges up to the knockout; the aftermath owns later placement.
 */
export namespace Blocking {
  /**
   * A stance origin on the canvas and the heading it faces.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain data produced by `pair`; no behaviour.
   * @evidence contracts/common.md#authoring-interface Origin is world X/Z metres; heading is radians facing the opponent.
   */
  export interface Frame {
    /** World X/Z of the stance origin, metres. */
    origin: readonly [number, number];
    /** World heading toward the opponent, radians. */
    heading: number;
  }

  /**
   * Both fighters' frames and the shared geography.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain data produced by `pair`, carrying both frames and the shared geography they came from.
   * @evidence contracts/common.md#authoring-interface World X/Z metres and radians; distance is the stance-origin separation in metres.
   */
  export interface Pair {
    /** Fighter A. */
    a: Frame;
    /** Fighter B. */
    b: Frame;
    /** Pair centre, world X/Z metres. */
    centre: readonly [number, number];
    /** World heading from A toward B, radians. */
    axis: number;
    /** Stance-origin distance, metres. */
    distance: number;
  }

  /**
   * Pair placement at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Sums per-attack plateau advances (kicks arrive before the leg unloads and hold until it lands), caps simultaneous closing, blends the opening approach and places both origins on the geography axis.
   * @evidence contracts/common.md#authoring-interface Any film second; pure, so seek and playback agree. Valid for the bout; the aftermath owns placement after the knockout.
   */
  export function pair(t: number): Pair {
    const [cx, cz, axis] = geography(t);
    const advance: Record<BoutScript.Fighter, number> = { a: 0, b: 0 };
    for (const action of BoutScript.actions) {
      const spec = BoutScript.specs[action.technique];
      const kick: boolean = BoutScript.specs[action.technique].limb === "leg";
      // A punch that lands clean drives into the face or ribs instead of stopping
      // at the guard, so it steps in deeper than the technique's range.
      const deeper: number =
        kick || action.defense !== "hit"
          ? 0
          : spec.target === "head"
            ? 0.18
            : 0.06;
      const need: number = Math.max(
        0,
        BoutScript.neutralRange - spec.range + deeper,
      );

      // A kick steps in first and only then unloads the leg; a punch's step lands just
      // before the fist so the rear foot has followed by contact. The attacker steps
      // back out right after recovering, so the pair is only in range while an
      // exchange is live.
      const arrive: number = kick
        ? action.at - spec.windup - 0.04
        : action.at - 0.16;
      const start: number =
        arrive - (kick ? 0.3 + 0.55 * need : 0.26 + 0.3 * need + spec.windup);
      const end: number = action.at + spec.recovery + (kick ? 0.5 : 0.35);
      if (t <= start || t >= end) continue;
      const hold: number = kick
        ? action.at + spec.recovery + 0.08
        : action.at + 0.12;
      const weight: number = Ease.plateau(
        t,
        start,
        arrive,
        hold,
        Math.max(end, hold + 0.4),
      );
      advance[action.actor] = Math.max(advance[action.actor], need * weight);
    }

    // Cap simultaneous closing to the larger single need, so a fighter stepping in
    // during the other's attack never jams it inside its own range.
    const total: number = advance.a + advance.b;
    const allowed: number = Math.max(advance.a, advance.b);
    const factor: number = total > 1e-9 ? allowed / total : 0;
    let half: number = BoutScript.neutralRange / 2;
    let a: number = half - advance.a * factor;
    let b: number = half - advance.b * factor;

    // Opening: approach from the corners' line, touch gloves at 1.0 s, separate.
    if (t < 2.4) {
      const open: number = opening(t);
      const blend: number = 1 - Ease.ramp(t, 1.7, 2.4);
      half = open / 2;
      a = Ease.lerp(a, half, blend);
      b = Ease.lerp(b, half, blend);
    }
    const ux: number = Math.cos(axis);
    const uz: number = -Math.sin(axis);
    return {
      a: { origin: [cx - ux * a, cz - uz * a], heading: axis },
      b: { origin: [cx + ux * b, cz + uz * b], heading: axis + Math.PI },
      centre: [cx, cz],
      axis,
      distance: a + b,
    };
  }

  /**
   * Pair centre and axis [centre X, centre Z, axis] from the ring-generalship
   * laws applied to the composed exchanges.
   *
   * @evidence contracts/common.md#implementation-and-ownership Samples the precomputed ring-generalship track; seek and playback read the same samples.
   * @evidence contracts/common.md#authoring-interface Film seconds in; returns [centre X, centre Z, axis heading] in metres and radians.
   */
  export function geography(t: number): readonly [number, number, number] {
    const state: BoutRing.IState = BoutRing.sample(TRACK, 0, t);
    return [state.centre[0], state.centre[1], state.axis];
  }

  /** The bout's ring-generalship track from the bell to one second past the knockout. */
  export const TRACK: readonly BoutRing.IState[] = Object.freeze(
    BoutRing.simulate({
      spans: BoutRing.spans(BoutScript.actions, BoutScript.groups, BoutScript.TOUCHED),
      busy: BoutScript.actions.map((action: BoutScript.Action): readonly [number, number] => [
        action.at - BoutScript.specs[action.technique].windup,
        action.at + BoutTechnique.HOLD + action.parameters.recovery,
      ]),
      origin: 0,
      end: BoutScript.KNOCKOUT + 1,
      range: BoutScript.neutralRange,
      initial: { centre: [0, 0], axis: 0 },
    }),
  );

  /** Opening stance-origin distance before the first exchange, metres. */
  function opening(t: number): number {
    // 2.7 m apart at the bell, glove touch at 1.0 s (lead arms extended), back to range by 1.9 s.
    if (t <= 0.15) return 2.7;
    if (t <= 0.95) return Ease.lerp(2.7, 1.42, Ease.smooth((t - 0.15) / 0.8));
    if (t <= 1.15) return 1.42;
    return Ease.lerp(
      1.42,
      BoutScript.neutralRange,
      Ease.smooth((t - 1.15) / 0.75),
    );
  }
}
