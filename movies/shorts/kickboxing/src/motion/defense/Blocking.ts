import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";

/**
 * Where each fighter stands and faces during the bout, before footsteps and body motion.
 *
 * The pair shares a slowly drifting centre and axis (BoutScript.geography).
 * Each fighter's stance origin sits on that axis at half the neutral range,
 * displaced toward the opponent by its own attack advance: an attacker steps
 * into the range its technique needs, then returns. Both advances are smooth,
 * so the footstep generator turns them into discrete supported steps.
 *
 * @evidence contracts/common.md#implementation-and-ownership Closed-form in film time (Catmull–Rom geography plus plateau envelopes per attack), so any second evaluates without history and seek equals playback. When both fighters close at once (a counter during the other's recovery) their combined closing is capped at the deeper single need, so the pair is never closer than the attack in flight needs.
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
      const kick: boolean = action.technique.endsWith("kick");
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
   * Smooth geography [centre X, centre Z, axis] by Catmull–Rom interpolation of the keys.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uniform Catmull–Rom interpolation of the authored keys, clamped at both ends.
   * @evidence contracts/common.md#authoring-interface Film seconds in; returns [centre X, centre Z, axis heading] in metres and radians.
   */
  export function geography(t: number): readonly [number, number, number] {
    const keys = BoutScript.geography;
    if (t <= keys[0]![0]) return [keys[0]![1], keys[0]![2], keys[0]![3]];
    const last = keys[keys.length - 1]!;
    if (t >= last[0]) return [last[1], last[2], last[3]];
    let i: number = 0;
    while (keys[i + 1]![0] < t) i++;
    const k0 = keys[Math.max(0, i - 1)]!;
    const k1 = keys[i]!;
    const k2 = keys[i + 1]!;
    const k3 = keys[Math.min(keys.length - 1, i + 2)]!;
    const u: number = (t - k1[0]) / (k2[0] - k1[0]);
    const result: number[] = [];
    for (const c of [1, 2, 3] as const)
      result.push(catmull(k0[c], k1[c], k2[c], k3[c], u));
    return [result[0]!, result[1]!, result[2]!];
  }

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

/** Uniform Catmull–Rom segment between p1 and p2. */
function catmull(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  u: number,
): number {
  const u2: number = u * u;
  const u3: number = u2 * u;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  );
}
