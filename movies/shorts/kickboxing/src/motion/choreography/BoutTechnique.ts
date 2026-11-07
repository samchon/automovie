/**
 * Registered striking techniques: timing, reserved limb, the receiver region
 * and attacker surface the strike relates, its line of travel, guard rule and
 * deception, declared once per technique. Choreography, motion, outcome
 * resolution, sound and audits read these entries instead of branching on
 * technique names.
 */
export namespace BoutTechnique {
  /** The performer's own side, orthodox stance. */
  export type Side = "left" | "right";

  /** Limb class a technique reserves for its whole window. */
  export type Limb = "arm" | "leg";

  /** Receiver region whose actual colliders the weapon relates to. */
  export type Target = "head" | "body" | "leg";

  /** Narrower actual collider region within a target: `jaw-neck` lies behind the ear where jaw meets neck. */
  export type Feature = "jaw-neck";

  /** Attacker surface that meets the receiver. */
  export type Surface = "fist" | "shin" | "instep" | "sole" | "knee";

  /**
   * Line of travel into the target, relative to the receiver's standing frame:
   * `straight` along the attacker–target line, `arc` around it in a horizontal
   * plane, `rising` from below and `descending` from above. Evasions and
   * parries are valid against particular lines.
   */
  export type Line = "straight" | "arc" | "rising" | "descending";

  /**
   * Hand rule while the technique is active. `cheeks` keeps both gloves on the
   * attacker's own head line. `forward` extends the kicking-side glove along
   * the attacker's own head line toward the receiver and keeps the other glove
   * on it. `clinch` relates both gloves to the receiver's head-back surface.
   */
  export type Guard = "cheeks" | "forward" | "clinch";

  /**
   * When the weapon's goal stops following the receiver. `launch` latches the
   * receiver point when the strike starts (punches, push kick, knee); `chamber`
   * latches it at the chamber key, so a kick commits to what the receiver
   * shows then. After latching, the weapon travels to the latched point and
   * any later evasion or guard relates to that actual swept line.
   */
  export type Aim = "launch" | "chamber";

  /**
   * Shape prior: the technique's own-frame chamber, path and recoil law that
   * the relational fitting only bends toward the latched target. Each prior is
   * one performance module whose phase keys derive from cited kinematics
   * (e.g. the roundhouse phase sequence of Gavagan and Sayers 2017).
   */
  export type Shape = "straight" | "hook" | "uppercut" | "round" | "question-mark" | "push" | "knee";

  /** Performance family owning the relations of the limb path and trunk drive. */
  export type Family = "punch" | "round-kick" | "push-kick" | "knee" | "feint";

  /** Registered technique name. */
  export type Name =
    | "jab"
    | "cross"
    | "hook"
    | "uppercut"
    | "body-cross"
    | "body-hook"
    | "low-kick"
    | "body-kick"
    | "high-kick"
    | "switch-kick"
    | "brazilian-kick"
    | "teep"
    | "knee"
    | "feint-jab"
    | "feint-low-kick"
    | "feint-body-kick";

  /** One registered technique. */
  export interface ISpec {
    /** Registry key. */ readonly name: Name;
    /** Performance family. */ readonly family: Family;
    /** Striking side. */ readonly side: Side;
    /** Reserved limb class. */ readonly limb: Limb;
    /** Seconds from launch to contact or deepest feint. */ readonly windup: number;
    /** Seconds from the end of the contact hold to the limb's return at full commitment. */ readonly recovery: number;
    /** Stance-origin distance at contact, metres; footwork closes to it from the live opponent position. */ readonly range: number;
    /** Receiver region. */ readonly target: Target;
    /** Narrower receiver feature, when the region is too coarse. */ readonly feature?: Feature;
    /** Attacker surface related to the receiver region. */ readonly surface: Surface;
    /** Line of travel. */ readonly line: Line;
    /** When the goal latches the receiver point. */ readonly aim: Aim;
    /** Own-frame shape prior bent toward the target. */ readonly shape: Shape;
    /** False for feints: no receipt, binding, impact sound or jolt. */ readonly contact: boolean;
    /** Hand rule while active. */ readonly guard: Guard;
    /** Technique whose chamber this one shares, so a receiver can read it as that technique. */ readonly disguise?: Name;
    /** The real technique a feint shows, and the shown fraction of its wind-up. */ readonly shows?: { readonly of: Name; readonly fraction: number };
  }

  /** Seconds a weapon holds at full extension after contact. */
  export const HOLD: number = 0.035;

  /** Fraction of a round kick's wind-up spent reaching its chamber; shared by the kick relations and the feints and disguises that copy it. */
  export const CHAMBER: number = 0.45;

  /** A punch relates the glove to a head or body region along its line. */
  function punch(
    name: Name,
    side: Side,
    line: Line,
    target: "head" | "body",
    windup: number,
    recovery: number,
    range: number,
  ): ISpec {
    const shape: Shape = line === "arc" ? "hook" : line === "rising" ? "uppercut" : "straight";
    return { name, family: "punch", side, limb: "arm", windup, recovery, range, target, surface: "fist", line, aim: "launch", shape, contact: true, guard: "cheeks" };
  }

  /** A round kick relates the shin to a region along an arc, with the kicking-side forward guard. */
  function roundKick(
    name: Name,
    side: Side,
    target: Target,
    windup: number,
    recovery: number,
    range: number,
    variant: Partial<Pick<ISpec, "disguise" | "feature" | "surface" | "line" | "shape">> = {},
  ): ISpec {
    return { name, family: "round-kick", side, limb: "leg", windup, recovery, range, target, surface: "shin", line: "arc", aim: "chamber", shape: "round", contact: true, guard: "forward", ...variant };
  }

  /** A feint shows the first part of a real technique and returns along the same path, so its timing derives from that technique. */
  function feint(name: Name, of: ISpec, fraction: number): ISpec {
    const windup: number = of.windup * fraction;
    return { ...of, name, family: "feint", windup, recovery: windup, contact: false, shows: { of: of.name, fraction } };
  }

  const jab: ISpec = punch("jab", "left", "straight", "head", 0.14, 0.18, 1.08);
  const lowKick: ISpec = roundKick("low-kick", "right", "leg", 0.3, 0.4, 0.95);
  const bodyKick: ISpec = roundKick("body-kick", "right", "body", 0.34, 0.45, 0.9);

  /** Every technique the choreography may name. */
  export const registry: Readonly<Record<Name, ISpec>> = Object.freeze({
    jab,
    cross: punch("cross", "right", "straight", "head", 0.18, 0.22, 1.04),
    hook: punch("hook", "left", "arc", "head", 0.21, 0.25, 0.9),
    uppercut: punch("uppercut", "left", "rising", "head", 0.2, 0.24, 0.88),
    "body-cross": punch("body-cross", "right", "straight", "body", 0.23, 0.27, 0.92),
    "body-hook": punch("body-hook", "left", "arc", "body", 0.23, 0.27, 0.88),
    "low-kick": lowKick,
    "body-kick": bodyKick,
    "high-kick": roundKick("high-kick", "right", "head", 0.44, 0.5, 0.8),
    "switch-kick": roundKick("switch-kick", "left", "body", 0.42, 0.45, 0.9),
    // The head version of the question-mark kick: the knee turns over the
    // guard and the instep and distal shin descend behind the ear.
    "brazilian-kick": roundKick("brazilian-kick", "right", "head", 0.5, 0.52, 0.82, {
      disguise: "body-kick",
      feature: "jaw-neck",
      surface: "instep",
      line: "descending",
      shape: "question-mark",
    }),
    teep: { name: "teep", family: "push-kick", side: "left", limb: "leg", windup: 0.26, recovery: 0.32, range: 1.2, target: "body", surface: "sole", line: "straight", aim: "launch", shape: "push", contact: true, guard: "cheeks" },
    knee: { name: "knee", family: "knee", side: "right", limb: "leg", windup: 0.3, recovery: 0.34, range: 0.5, target: "body", surface: "knee", line: "rising", aim: "launch", shape: "knee", contact: true, guard: "clinch" },
    "feint-jab": feint("feint-jab", jab, 0.7),
    "feint-low-kick": feint("feint-low-kick", lowKick, 0.5),
    "feint-body-kick": feint("feint-body-kick", bodyKick, 0.75),
  });

  /** One registered technique. */
  export function get(name: Name): ISpec {
    return registry[name];
  }
}
