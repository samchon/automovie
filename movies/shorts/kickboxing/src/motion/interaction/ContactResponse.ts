import type { MotionAction } from "../core/MotionAction";
import type { ContactTrace } from "./ContactTrace";

/**
 * Contact-triggered paired kinematic compliance, separated from technique recovery.
 *
 * @evidence contracts/common.md#implementation-and-ownership The query's normal approach value scales bounded authored displacement along its oriented face normal. Sampled-crossing velocity is mean attack-point minus receiver-first-vertex displacement and is only a kinematic proxy under rotation/deformation; translated vertex queries use their point path. A smooth finite excursion returns to zero without inferring mass, impulse, stiffness or injury. Technique modules retract from the actual constrained pose.
 * @evidence contracts/common.md#authoring-interface Input time is elapsed since this contact in the host clock, independent of either actor's action-local origin. Outputs are world offsets and must be converted by the actual root frame before support/IK fitting and reinspection. This owner alone supplies paired normal recoil.
 */
export namespace ContactResponse {
  /**
   * Explicit staging controls; values are not empirical material constants.
   *
   * @evidence contracts/common.md#implementation-and-ownership Independent actor durations and bounded speed-to-displacement scales expose the authored compliance model without importing bag contact means as opponent stiffness or a universal contact freeze.
   * @evidence contracts/common.md#authoring-interface Durations are positive seconds, gains are nonnegative seconds, maximum excursion is nonnegative metres and graze attenuation lies in [0,1]. Both actors still need actual support and IK fitting.
   */
  export interface Config {
    /** Finite attacker recoil/return duration, seconds, positive. */
    attackerSeconds: number;
    /** Finite receiver give/return duration, seconds, positive. */
    receiverSeconds: number;
    /** Approach-speed-to-attacker-excursion scale, seconds, nonnegative. */
    attackerGainSeconds: number;
    /** Authored direct-body/head excursion scale, seconds, nonnegative; no injury calibration. */
    bodyGainSeconds: number;
    /** Authored guard/shin-check excursion scale, seconds, nonnegative. */
    guardGainSeconds: number;
    /** Additional [0,1] attenuation for a glancing contact. */
    grazeFraction: number;
    /** Maximum normal excursion per actor, metres, nonnegative. */
    maximumMetres: number;
  }
  /**
   * World offsets to be fitted to the two independently owned bodies.
   *
   * @evidence contracts/common.md#implementation-and-ownership Opposite normal-axis displacement couples the two reactions to the same contact without making equal impulses or momentum conservation claims.
   * @evidence contracts/common.md#authoring-interface Each vector is world metres; convert through each independent actor root before fitting. Active only reports whether a finite authored response interval remains.
   */
  export interface Sample {
    /** Recoil away from receiver, world metres. */
    attacker: MotionAction.Vec3;
    /** Yield away from attacker, world metres. */
    receiver: MotionAction.Vec3;
    /** Whether either finite response remains in progress. */
    active: boolean;
  }

  /**
   * Sample one immutable contact without retaining clock or actor state.
   *
   * @evidence contracts/common.md#implementation-and-ownership A squared sine over each bounded interval gives zero offset and derivative at both boundaries. The query-specific normal approach value and authored compliance scales determine bounded amplitude; sampled crossings do not measure contact-patch velocity under receiver rotation/deformation. Miss and precontact inputs yield zero. This is authored response, not an integrated rigid-body solver.
   * @evidence contracts/common.md#authoring-interface Throws for malformed controls, elapsed time, speed or event normal. Repeated calls at the same contact/time return equivalent owned vectors; no event or sample is mutated and no handles are retained. Constant work and storage are independent of frame rate.
   */
  export function sample(
    result: ContactTrace.Result,
    sinceContact: number,
    config: Config,
  ): Sample {
    if (!Number.isFinite(sinceContact))
      throw new Error("Contact response requires finite elapsed seconds.");
    if (
      ![config.attackerSeconds, config.receiverSeconds].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      ) ||
      ![
        config.attackerGainSeconds,
        config.bodyGainSeconds,
        config.guardGainSeconds,
        config.maximumMetres,
      ].every(
        (value: number): boolean => Number.isFinite(value) && value >= 0,
      ) ||
      !Number.isFinite(config.grazeFraction) ||
      config.grazeFraction < 0 ||
      config.grazeFraction > 1
    )
      throw new Error("Invalid authored contact response controls.");
    if (!result.event || sinceContact <= 0)
      return { attacker: [0, 0, 0], receiver: [0, 0, 0], active: false };
    const normal: MotionAction.Vec3 = result.event.normal;
    if (
      !normal.every(Number.isFinite) ||
      Math.abs(Math.hypot(...normal) - 1) > 1e-8 ||
      !Number.isFinite(result.approachMetresPerSecond) ||
      result.approachMetresPerSecond < 0
    )
      throw new Error(
        "Contact response requires a nonnegative query approach value and unit world normal.",
      );
    if (
      sinceContact >= Math.max(config.attackerSeconds, config.receiverSeconds)
    )
      return { attacker: [0, 0, 0], receiver: [0, 0, 0], active: false };
    const attenuation: number =
      result.outcome === "graze" ? config.grazeFraction : 1;
    const gain: number =
      result.event.relation === "body" || result.event.relation === "head"
        ? config.bodyGainSeconds
        : config.guardGainSeconds;
    const attacker: number =
      Math.min(
        config.maximumMetres,
        result.approachMetresPerSecond * config.attackerGainSeconds,
      ) *
      attenuation *
      envelope(sinceContact, config.attackerSeconds);
    const receiver: number =
      Math.min(config.maximumMetres, result.approachMetresPerSecond * gain) *
      attenuation *
      envelope(sinceContact, config.receiverSeconds);
    return {
      attacker: [
        normal[0] * attacker,
        normal[1] * attacker,
        normal[2] * attacker,
      ],
      receiver: [
        -normal[0] * receiver,
        -normal[1] * receiver,
        -normal[2] * receiver,
      ],
      active:
        sinceContact < Math.max(config.attackerSeconds, config.receiverSeconds),
    };
  }

  /** Finite smooth displacement with exact zero at both interval endpoints. */
  function envelope(elapsed: number, duration: number): number {
    return elapsed <= 0 || elapsed >= duration
      ? 0
      : Math.sin((Math.PI * elapsed) / duration) ** 2;
  }
}
