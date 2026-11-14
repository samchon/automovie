/**
 * The kick's form: every coefficient of its contact solve, its carriage of
 * the body and its chamber, each with its source or marked provisional where
 * no study gives the value.
 */
export namespace KickForm {
  /** Knee flexion band at contact by technique, degrees: not locked, not jammed (kickboxing research of #3201: "a bent knee can remain at delivery"). */
  export const FLEXION: Readonly<
    Record<"round" | "push", readonly [number, number]>
  > = { round: [5, 40], push: [5, 35] };

  /** Share of the shank from the knee at which the round kick's shin lands: the lower shin (kickboxing research of #3201, surfaces table). */
  export const SHIN_SHARE: number = 0.7;

  /**
   * Where the target lies from the turned pelvis's forward toward the
   * kicking side at contact, degrees, by height band. A full turnover would
   * put it at 90 degrees and lift the leg by abduction alone, but the rig's
   * hip abducts at most 45 degrees (`DEFAULT_HUMANOID_ROM`), so higher kicks
   * rise more through the hip's flexion with less turnover. Provisional: no
   * study gives the angle.
   */
  export const AZIMUTH: Readonly<Record<"low" | "middle" | "high", number>> = {
    low: 35,
    middle: 25,
    high: 15,
  };

  /** The least lean of the whole body away from the target, degrees (provisional reading of coaching photographs of low kicks). */
  export const LEAN_LEAST: number = 5;

  /** The most lean of the whole body away from the target, degrees (provisional reading of coaching photographs of head kicks). */
  export const LEAN_MOST: number = 40;

  /** The step between the leans a kick tries, least first, degrees (provisional: fine enough that the next lean changes the hip's height by under a tenth of the thigh). */
  export const LEAN_STEP: number = 5;

  /** Support heel raise and the most the support foot turns on its ball at contact, degrees (provisional reading of the pivot on the ball). */
  export const PIVOT: { readonly raise: number; readonly turn: number } = {
    raise: 15,
    turn: 60,
  };

  /** The push kick's impact speed share: it drives through rather than snaps (provisional, no measured teep). */
  export const PUSH_SPEED_SHARE: number = 0.8;

  /** Knee flexion at the chamber key, degrees: the heel folded toward the thigh (provisional reading of coaching photographs; inside the knee's 150 degree range). */
  export const CHAMBER_FLEXION: number = 115;

  /** The push kick's backward tip of the body at contact, degrees (provisional reading of coaching photographs of the teep). */
  export const PUSH_PITCH: number = 8;

  /** Share of the way the root travels from its entry to over the support ankle at contact (provisional: the centre of mass stays inside the support foot's length). */
  export const CENTRE_SHARE: number = 0.8;

  /** The most the support foot steps up toward a target beyond reach, as a share of the stance length (provisional). */
  export const STEP_SHARE: number = 0.5;

  /**
   * The most the support foot steps back from a target too close, as a share
   * of the stature: a step, so no longer than the longest single backward
   * step measured, 75.4 % (SD 3.2) of height in younger women (Schulz,
   * Ashton-Miller and Alexander 2007, Clin Biomech 22:689, "Back Only"
   * maximum step length).
   */
  export const STEP_BACK_SHARE: number = 0.754;

  /** The least horizontal distance along the line the kicking hip keeps from the planned point when the support foot steps up, as a share of the thigh (provisional: within a thigh's length the knee passes the target and the thigh, not the shin or the foot, meets it). */
  export const STEP_ROOM_SHARE: number = 1;

  /** How many times a contact raises the support foot's step-up by what the fitted leg still lacks (provisional: each round removes the lack the last fit measured, so a second round only absorbs what the hip's range of motion changed). */
  export const STEP_ROUNDS: number = 4;

  /** Share of the chamber phase by which the extension's unit overlaps the chamber's, so the ankle rounds the chamber point instead of resting on it (Flash and Hogan 1985 fit via-point movements by such overlapping units; the share is provisional). */
  export const VIA_OVERLAP: number = 0.4;

  /** The most the fitted leg may miss its solved ankle, and the support ball its plant, for a kick to count as reached, metres (the limb fit's own convergence scale). */
  export const TOLERANCE: number = 1e-3;

  /** The most the fitted leg's weapon surface may lie from the planned point for a kick to count as reached, metres: the capture verdicts' extension bound. */
  export const RESIDUAL: number = 0.015;

  /**
   * The round kick's travel at contact, as weights on the horizontal axis
   * across the line (toward the support side), on the line, and on the
   * vertical by height band: the shin arrives mostly across, slightly
   * forward, cutting down into a low kick and rising into a high one
   * (provisional readings of the kickboxing research of #3201).
   */
  export const TRAVEL: {
    readonly across: number;
    readonly along: number;
    readonly vertical: Readonly<Record<"low" | "middle" | "high", number>>;
  } = {
    across: 0.85,
    along: 0.35,
    vertical: { low: -0.25, middle: 0, high: 0.1 },
  };

  /** The height bands' upper bounds: low below this share of the waist height, middle below this share of the shoulder height (provisional). */
  export const BAND: { readonly low: number; readonly middle: number } = {
    low: 0.85,
    middle: 1.02,
  };

  /** Share of the leg's full length a kick treats as its comfortable range when it reads a target's standing distance (provisional). */
  export const RANGE_SHARE: number = 0.9;

  /** The upward weight of the round kick's knee bend direction beside its travel, so the knee leads above the shin (provisional). */
  export const BEND_RISE: number = 0.3;

  /** How far the knee's bend hint sits from the solved knee, as a share of the thigh (provisional). */
  export const HINT_SHARE: number = 0.25;

  /** How long past the planned contact the leg stays a weapon, seconds (provisional: the through-travel's settling). */
  export const WEAPON_TAIL: number = 0.1;

  /** The foot capsule's radius as a share of the ankle height (provisional: half the foot's depth). */
  export const FOOT_RADIUS_SHARE: number = 0.5;

  /** The aim tracker's observation step, seconds: one film frame at 24 frames a second, as the punch reads its target. */
  export const TRACK_STEP: number = 1 / 24;

  /** The aim tracker's shortest correction unit, seconds, as the punch's. */
  export const TRACK_SHORTEST: number = 0.04;

  /** Share of the recoil over which the foot returns from its contact rotation to its chamber rotation, the first of the stroke's two return units ({@link StrikingStroke}). */
  export const RECHAMBER_SHARE: number = 0.45;
}
