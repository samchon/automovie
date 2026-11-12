import { minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Affect displays as an additive layer: laughing, sighing, yawning,
 * coughing, sneezing and shivering, each a short pattern of trunk, shoulder,
 * head and jaw angles over any action, starting and ending at zero.
 *
 * These are joint-angle patterns because no body point is brought anywhere:
 * the display is the trunk's and head's own convulsion or stretch, the way
 * an additive animation layer carries breathing or a laugh over locomotion.
 * Planted and gripping limb goals are untouched, and the arms are solved
 * after the trunk, so contacts and held objects stay where they are. Each
 * display is the sum of its pulses under an envelope that rises and falls
 * on minimum-jerk ramps, so it is zero with zero velocity at its start and
 * end.
 *
 * - `laugh`: a train of laugh notes about 210 ms apart (Provine 1996,
 *   American Scientist 84:38), each a 3 degree trunk flexion and 3 degree
 *   shoulder lift pulse, over a 5 degree head extension; a laugh of `seconds`
 *   repeats notes while it lasts, fading over its last third.
 * - `sigh`: a deep inhalation over 40 % of the sigh raising the shoulders 6
 *   degrees and extending the chest 4, then an exhalation that lets the
 *   shoulders fall 2 degrees below rest and the head drop 4.
 * - `yawn`: the jaw opens 25 degrees and the head extends 15 with the chest
 *   extending 5, peaking at 40 % of the yawn (a yawn lasts about six
 *   seconds, Provine 1986, Ethology 72:109; profile provisional).
 * - `cough`: three sharp trunk flexions of 10 degrees with the head 8, 0.5 s
 *   apart, each rising in 0.12 s and recovering over 0.38 s (provisional).
 * - `sneeze`: an inhalation that extends the head 10 degrees over 70 % of
 *   the sneeze, then a sudden flexion of the head 25 and the chest 10 in 0.1
 *   s, recovering by the end (provisional).
 * - `shiver`: the shoulders hunch 8 degrees while they tremble 1.5 degrees
 *   at 4 Hz, a visible shivering burst rate below the 12 Hz Nyquist limit of
 *   a 24 Hz film (shivering muscle tremor itself is faster, near 10 Hz, and
 *   would alias; provisional).
 *
 * Amplitudes and timings are provisional except where cited; an intensity
 * scales every amplitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, each display's pattern with its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation A namespace of the display union, the scheduled display record, the per-display lengths and pure functions from a display and a time to clinical joint degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the affect displays; the CI affect test and layer callers read `Kind`, `IDisplay`, `LENGTH`, `NOTE`, `angles` and `layer`; it reuses the motions layer and posture types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: no consumer or body is special-cased, and the layer type is the shared `IHumanLayer`.
 */
export namespace HumanAffect {
  /**
   * A display, one of the six affect patterns the namespace documents.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the closed set of displays; each one's pattern is documented on the namespace.
   * @evidence contracts/development/design.md#principled-representation A string union over the six displays, so an unknown display cannot be written; `angles` switches over it exhaustively.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `IDisplay`, `LENGTH`, `angles` and the affect test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: one discriminant for all displays, no per-consumer member.
   */
  export type Kind = "laugh" | "sigh" | "yawn" | "cough" | "sneeze" | "shiver";

  /**
   * One display at a film time, as the affect layer schedules it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit (film seconds, seconds, a scale) and the meaning of an absent length or intensity.
   * @evidence contracts/development/design.md#principled-representation A display's kind, its start on the film timebase, its length in seconds and an amplitude scale; positive length is validated at runtime by `angles`, intensity is not range-checked.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `layer` and the affect test; the optional length and intensity default to `LENGTH` and 1.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: the optional members default independently and combine into no meaningless state.
   */
  export interface IDisplay {
    /** The display. */
    kind: Kind;

    /** Film second it starts. */
    at: number;

    /** How long, seconds; the display's own length when absent. */
    seconds?: number;

    /** Amplitude scale; 1 when absent. */
    intensity?: number;
  }

  /** Each display's own length, seconds. */
  export const LENGTH: Readonly<Record<Kind, number>> = {
    laugh: 1.5,
    sigh: 3.5,
    yawn: 6,
    cough: 1.7,
    sneeze: 2,
    shiver: 2,
  };

  /** Interval between laugh notes, seconds (Provine 1996). */
  export const NOTE: number = 0.21;

  /**
   * The joint angles a display adds at a time into it.
   *
   * @param kind The display.
   * @param t Seconds since its start.
   * @param seconds Its length, seconds.
   * @param intensity Amplitude scale.
   * @returns Clinical degrees to add; empty outside the display.
   * @throws {HumanRefusal} When the length is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units, the clinical-degree output, the empty result outside the display and the refusal; each pattern is documented on the namespace.
   * @evidence contracts/development/implementation.md#principled-implementation Joint-angle pulses under minimum-jerk envelopes, zero with zero velocity at both ends; the laugh note interval is Provine's 210 ms and the yawn length Provine's, other amplitudes and timings provisional as documented. Angles are the rig's clinical degrees per bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the display with two local profile helpers (envelope ramp and pulse) shared by its cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: the amplitudes are named in the namespace documentation as cited or provisional, and a non-positive length throws instead of being clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call: at most three pulses for a cough and a fixed set of bones per display.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to reuse across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates one small record per call and retains nothing.
   */
  export function angles(
    kind: Kind,
    t: number,
    seconds: number,
    intensity: number = 1,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    HumanBound.above("seconds", seconds, 0, "s");
    if (!(t > 0 && t < seconds)) return {};
    const u: number = t / seconds;
    const k: number = intensity;
    const ramp = (rise: number, fall: number): number =>
      Math.min(minimumJerk(u / rise).s, minimumJerk((1 - u) / fall).s);
    const pulse = (x: number, up: number, down: number): number =>
      x <= 0
        ? 0
        : x < up
          ? minimumJerk(x / up).s
          : 1 - minimumJerk((x - up) / down).s;
    switch (kind) {
      case "laugh": {
        const e: number = k * ramp(0.1, 0.33);
        const note: number = pulse(t % NOTE, 0.35 * NOTE, 0.65 * NOTE);
        return {
          chest: [3 * e * note, 0, 0],
          spine: [1.5 * e * note, 0, 0],
          leftShoulder: [0, 3 * e * note, 0],
          rightShoulder: [0, 3 * e * note, 0],
          head: [-5 * e, 0, 0],
        };
      }
      case "sigh": {
        const inhale: number = minimumJerk(u / 0.4).s;
        const exhale: number = minimumJerk((u - 0.4) / 0.6).s;
        const close: number = 1 - minimumJerk((u - 0.85) / 0.15).s;
        const shoulders: number = k * (6 * inhale - 8 * exhale) * close;
        return {
          leftShoulder: [0, shoulders, 0],
          rightShoulder: [0, shoulders, 0],
          chest: [-4 * k * inhale * (1 - exhale), 0, 0],
          head: [4 * k * exhale * close, 0, 0],
        };
      }
      case "yawn": {
        const e: number =
          u < 0.4 ? minimumJerk(u / 0.4).s : 1 - minimumJerk((u - 0.4) / 0.6).s;
        return {
          jaw: [25 * k * e, 0, 0],
          head: [-15 * k * e, 0, 0],
          chest: [-5 * k * e, 0, 0],
        };
      }
      case "cough": {
        let p: number = 0;
        for (let i: number = 0; i < 3; i++)
          p = Math.max(p, pulse(t - 0.1 - 0.5 * i, 0.12, 0.38));
        const e: number = k * p * ramp(0.02, 0.05);
        return {
          chest: [10 * e, 0, 0],
          spine: [4 * e, 0, 0],
          head: [8 * e, 0, 0],
        };
      }
      case "sneeze": {
        const build: number = minimumJerk(u / 0.7).s;
        const burst: number = pulse(
          t - 0.7 * seconds,
          0.1,
          0.3 * seconds - 0.1,
        );
        const end: number = 1 - minimumJerk((u - 0.7) / 0.05).s;
        return {
          head: [-10 * k * build * end + 25 * k * burst, 0, 0],
          chest: [-3 * k * build * end + 10 * k * burst, 0, 0],
        };
      }
      case "shiver": {
        const e: number = k * ramp(0.15, 0.15);
        const tremor: number = 1.5 * Math.sin(2 * Math.PI * 4 * t);
        return {
          leftShoulder: [4 * e, (8 + tremor) * e, 0],
          rightShoulder: [4 * e, (8 - tremor) * e, 0],
          chest: [3 * e, 0, 0],
        };
      }
    }
  }

  /**
   * The affect layer.
   *
   * @param displays The displays, in any order; overlapping ones add.
   * @returns The layer, named `affect`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that displays add in any order and overlap, and the layer's name; the layer adds clinical degrees to the posture's joints at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation An additive animation layer: each display's angles are summed onto the posture's joints, leaving limb goals untouched so the arms are solved after the trunk and contacts stay.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The layer only sums; the patterns live in `angles` and the defaults in `LENGTH`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: every display is summed the same way.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the displays per posture, each adding a constant number of bones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; nothing is cached between seconds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer retains only the caller's display list for its lifetime and allocates one joint record per posture.
   */
  export function layer(displays: readonly IDisplay[]): IHumanLayer {
    return {
      name: "affect",
      apply: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const d of displays) {
          const length: number = d.seconds ?? LENGTH[d.kind];
          for (const [bone, a] of Object.entries(
            angles(d.kind, seconds - d.at, length, d.intensity ?? 1),
          ) as [AutoMovieHumanoidBone, readonly [number, number, number]][]) {
            const was: readonly [number, number, number] = joints[bone] ?? [
              0, 0, 0,
            ];
            joints[bone] = [was[0] + a[0], was[1] + a[1], was[2] + a[2]];
          }
        }
        return { ...posture, joints };
      },
    };
  }
}
