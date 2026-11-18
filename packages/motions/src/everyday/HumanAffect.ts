import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAffect,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";

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
 *   American Scientist 84:38), each rising over 35 % of the interval and
 *   falling over the rest, a 3 degree chest and 1.5 degree lumbar flexion and
 *   a 3 degree shoulder lift pulse, over a 5 degree head extension; a laugh
 *   of `seconds` repeats notes while it lasts, rising over its first tenth
 *   and fading over its last third.
 * - `sigh`: a deep inhalation over 40 % of the sigh raising the shoulders 6
 *   degrees and extending the chest 4, then an exhalation that lets the
 *   shoulders fall 2 degrees below rest and the head drop 4, closing back to
 *   rest over the last 15 %.
 * - `yawn`: the jaw opens 25 degrees and the head extends 15 with the chest
 *   extending 5, peaking at 40 % of the yawn (a yawn lasts about six
 *   seconds, Provine 1986, Ethology 72:109; profile provisional).
 * - `cough`: three sharp trunk flexions, the first of 10 degrees at the
 *   chest, 4 at the lumbar spine and 8 at the head and the next two smaller
 *   by the air each expels (53.2, 28.5 and 18.8 %, Harris and Lawson 1968),
 *   from 0.1 s and 0.5 s apart, each rising
 *   in 0.12 s and recovering over 0.38 s, the whole ramped in over its
 *   first 2 % and out over its last 5 % (provisional).
 * - `sneeze`: an inhalation that extends the head 10 degrees and the chest 3
 *   over 70 % of the sneeze and released over the next 5 %, with a sudden
 *   flexion of the head 25 and the chest 10 in 0.1 s, recovering by the
 *   end; a sneeze shorter than the
 *   burst over its last 30 % is refused.
 * - `shiver`: the shoulders hunch 8 degrees and come forward 4, the chest
 *   flexes 3, while the shoulders tremble 1.5 degrees at 4 Hz, a visible
 *   shivering burst rate below the 12 Hz Nyquist limit of a 24 Hz film
 *   (shivering muscle tremor itself is faster, near 10 Hz, and would alias),
 *   ramped in and out over 15 % of the shiver.
 *
 * Amplitudes and timings are provisional, read from no measured source,
 * except where cited; an intensity scales every amplitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, each display's pattern with its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation A namespace of the display union, the scheduled display record, the per-display lengths and pure functions from a display and a time to clinical joint degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the affect displays; the CI affect test and layer callers read `Kind`, `IDisplay`, `LENGTH`, `NOTE`, `angles` and `layer`; it reuses the motions layer and posture types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shortcut present: no consumer or body is special-cased, and the layer type is the shared `IHumanLayer`.
 */
export namespace HumanAffect {
  /** Each display's own length, seconds. */
  export const LENGTH: Readonly<
    Record<IAutoMovieMotionHumanAffect.Kind, number>
  > = {
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
   * @throws {HumanRefusal} When the length is not positive, or a sneeze's leaves no room for its burst.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units, the clinical-degree output, the empty result outside the display and the refusal; each pattern is documented on the namespace.
   * @evidence contracts/development/implementation.md#principled-implementation Joint-angle pulses under minimum-jerk envelopes, zero with zero velocity at both ends; the laugh note interval is Provine's 210 ms and the yawn length Provine's, other amplitudes and timings provisional as documented. Angles are the rig's clinical degrees per bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over the display, shared with the layer, writes the angles through one ramp, one pulse and one joint writer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: the amplitudes are named in the namespace documentation as cited or provisional, and a length the display cannot fit throws instead of being clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call: at most three pulses for a cough and a fixed set of bones per display.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to reuse across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates one small record per call and retains nothing.
   */
  export function angles(
    kind: IAutoMovieMotionHumanAffect.Kind,
    t: number,
    seconds: number,
    intensity: number = 1,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    admit(kind, seconds);
    if (!(t > 0 && t < seconds)) return {};
    return pattern(kind, t, seconds, intensity);
  }

  /** Refuse a length a display cannot fit: any not positive, and a sneeze too short for its burst to rise within its last `1 - SNEEZE_BUILD`. */
  function admit(kind: IAutoMovieMotionHumanAffect.Kind, seconds: number): void {
    HumanBound.above(
      "seconds",
      seconds,
      kind === "sneeze" ? SNEEZE_BURST / (1 - SNEEZE_BUILD) : 0,
      "s",
    );
  }

  /** Evaluate an admitted display strictly inside its own active interval. */
  function pattern(
    kind: IAutoMovieMotionHumanAffect.Kind,
    t: number,
    seconds: number,
    intensity: number,
    into?: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture["joints"] {
    const u: number = t / seconds;
    const k: number = intensity;
    const joints: IAutoMovieMotionHumanPosture["joints"] = into ?? {};
    const additive: boolean = into !== undefined;
    switch (kind) {
      case "laugh": {
        const e: number = k * ramp(u, 0.1, 0.33);
        const note: number = pulse(t % NOTE, 0.35 * NOTE, 0.65 * NOTE);
        write(joints, additive, "chest", 3 * e * note, 0, 0);
        write(joints, additive, "spine", 1.5 * e * note, 0, 0);
        write(joints, additive, "leftShoulder", 0, 3 * e * note, 0);
        write(joints, additive, "rightShoulder", 0, 3 * e * note, 0);
        write(joints, additive, "head", -5 * e, 0, 0);
        break;
      }
      case "sigh": {
        const inhale: number = minimumJerk.share(u / 0.4);
        const exhale: number = minimumJerk.share((u - 0.4) / 0.6);
        const close: number = 1 - minimumJerk.share((u - 0.85) / 0.15);
        const shoulders: number = k * (6 * inhale - 8 * exhale) * close;
        write(joints, additive, "leftShoulder", 0, shoulders, 0);
        write(joints, additive, "rightShoulder", 0, shoulders, 0);
        write(joints, additive, "chest", -4 * k * inhale * (1 - exhale), 0, 0);
        write(joints, additive, "head", 4 * k * exhale * close, 0, 0);
        break;
      }
      case "yawn": {
        const e: number =
          u < 0.4 ? minimumJerk.share(u / 0.4) : 1 - minimumJerk.share((u - 0.4) / 0.6);
        write(joints, additive, "jaw", 25 * k * e, 0, 0);
        write(joints, additive, "head", -15 * k * e, 0, 0);
        write(joints, additive, "chest", -5 * k * e, 0, 0);
        break;
      }
      case "cough": {
        let p: number = 0;
        COUGHS.forEach((size: number, i: number): void => {
          p = Math.max(p, size * pulse(t - 0.1 - 0.5 * i, 0.12, 0.38));
        });
        const e: number = k * p * ramp(u, 0.02, 0.05);
        write(joints, additive, "chest", 10 * e, 0, 0);
        write(joints, additive, "spine", 4 * e, 0, 0);
        write(joints, additive, "head", 8 * e, 0, 0);
        break;
      }
      case "sneeze": {
        const build: number = minimumJerk.share(u / SNEEZE_BUILD);
        const burst: number = pulse(
          t - SNEEZE_BUILD * seconds,
          SNEEZE_BURST,
          (1 - SNEEZE_BUILD) * seconds - SNEEZE_BURST,
        );
        const end: number = 1 - minimumJerk.share((u - SNEEZE_BUILD) / 0.05);
        write(joints, additive, "head", -10 * k * build * end + 25 * k * burst, 0, 0);
        write(joints, additive, "chest", -3 * k * build * end + 10 * k * burst, 0, 0);
        break;
      }
      case "shiver": {
        const e: number = k * ramp(u, 0.15, 0.15);
        const tremor: number = 1.5 * Math.sin(2 * Math.PI * 4 * t);
        write(joints, additive, "leftShoulder", 4 * e, (8 + tremor) * e, 0);
        write(joints, additive, "rightShoulder", 4 * e, (8 - tremor) * e, 0);
        write(joints, additive, "chest", 3 * e, 0, 0);
        break;
      }
    }
    return joints;
  }

  /**
   * The affect layer.
   *
   * @param displays The displays, in any order; overlapping ones add.
   * @returns The layer, named `affect`.
   * @throws {HumanRefusal} When a display's length is one `angles` refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that displays add in any order and overlap, the layer's name and the refusal; the layer adds clinical degrees to the posture's joints at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation An additive animation layer: each display's angles are summed onto the posture's joints, leaving limb goals untouched so the arms are solved after the trunk and contacts stay.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Every display's length is checked once, when the layer is built; each posture then skips displays outside their window and writes the active ones into one joint copy through the pattern `angles` uses, the default lengths staying in LENGTH.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A length a display cannot fit is refused when the layer is built, before any frame is drawn; every active display is summed by the same formulas as `angles`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the D displays per posture plus the active displays' few bones, with no intermediate angle map.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `angles` and the layer share the pattern; every display and time is evaluated afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer holds the caller's display list for its lifetime and allocates one joint record per posture.
   */
  export function layer(
    displays: readonly IAutoMovieMotionHumanAffect.IDisplay[],
  ): IAutoMovieMotionHumanLayer {
    for (const d of displays) admit(d.kind, d.seconds ?? LENGTH[d.kind]);
    return {
      name: "affect",

      // The jaw and the head, and the spine, the chest and the shoulder
      // girdles: every display's pulse is on those joints.
      channels: ["head", "trunk"],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        for (const d of displays) {
          const length: number = d.seconds ?? LENGTH[d.kind];
          const kind: IAutoMovieMotionHumanAffect.Kind = d.kind;
          const elapsed: number = seconds - d.at;
          const intensity: number = d.intensity ?? 1;
          if (!(elapsed > 0 && elapsed < length)) continue;
          pattern(kind, elapsed, length, intensity, joints);
        }
        return { ...posture, joints };
      },
    };
  }
}

/** An envelope rising on a minimum-jerk ramp over the first `rise` of a display and falling over its last `fall`, shares of its length. */
function ramp(u: number, rise: number, fall: number): number {
  return Math.min(minimumJerk.share(u / rise), minimumJerk.share((1 - u) / fall));
}

/** One pulse at `x` seconds after its start: zero before it, a minimum-jerk rise over `up` seconds and a fall over `down`. */
function pulse(x: number, up: number, down: number): number {
  return x <= 0 ? 0 : x < up ? minimumJerk.share(x / up) : 1 - minimumJerk.share((x - up) / down);
}

/** Write one bone's angles, or add them to the bone's own. */
function write(joints: IAutoMovieMotionHumanPosture["joints"], additive: boolean,
  bone: AutoMovieHumanoidBone, x: number, y: number, z: number): void {
  if (!additive) joints[bone] = [x, y, z];
  else {
    const was: readonly [number, number, number] = joints[bone] ?? ZERO;
    joints[bone] = [was[0] + x, was[1] + y, was[2] + z];
  }
}

/** The angles of a bone the record holds none for. */
const ZERO: readonly [number, number, number] = [0, 0, 0];

/** Each of a bout's three coughs relative to the first: the first three coughs of a bout expel 53.2, 28.5 and 18.8 % of the air (Harris and Lawson 1968, as relayed), so each flexes the trunk by its expulsion's share of the first's. */
const COUGHS: readonly number[] = [1, 28.5 / 53.2, 18.8 / 53.2];

/** The share of a sneeze its inhalation takes (provisional). */
const SNEEZE_BUILD: number = 0.7;

/** How long a sneeze's burst takes to rise, seconds (provisional). */
const SNEEZE_BURST: number = 0.1;
