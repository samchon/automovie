import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { Blocking } from "../defense/Blocking";
import { BoutDefense as Reaction } from "../defense/BoutDefense";
import { BoutFootsteps as Footsteps } from "../footwork/BoutFootsteps";
import { BoutFormulaResponse } from "../reactions/BoutFormulaResponse";
import { Rhythm } from "../rhythm/Rhythm";
import type { FilmBodyRig as BodyRig } from "../rig/FilmBodyRig";
import { FilmVector as Vec3 } from "../rig/FilmVector";
import type { Foot } from "../rig/Foot";
import { Strike } from "../striking/Strike";
import { FighterBody } from "./FighterBody";

/**
 * One orthodox fighter's authored frame at any film second.
 *
 * The stance (from an injected stance-origin function) places the feet through
 * a precomputed {@link Footsteps} schedule; the guard sets the trunk, head and
 * hand intents; own attacks add rotation, level change and foot pivots; the
 * opponent's attacks add this fighter's defence or hit reaction.
 *
 * @evidence contracts/common.md#implementation-and-ownership Pure in film time after construction: the footstep schedule (with kicks and checks reserving their leg) is built once, everything else is closed-form, so seek equals playback. The fighter never reads the opponent's pose; cross-body targets are resolved by the bout from both frames.
 * @evidence contracts/common.md#authoring-interface `stance` returns the stance origin (world X/Z metres), heading (radians) and a walk weight in [0, 1] that blends from the fighting stance to an upright walking stance. `reserved` adds further foot reservations (for example the knockdown).
 */
export class Fighter {
  /** Footstep schedule, including reservations. */
  public readonly steps: Footsteps;

  /** Own attacks in film order. */
  public readonly attacks: readonly BoutScript.Action[];

  /** Opponent attacks this fighter answers. */
  public readonly answers: readonly BoutScript.Action[];

  /** Explicit comparison response authority; support scheduling never selects physical acting. */
  public readonly response: BoutFormulaResponse;

  public constructor(
    public readonly id: BoutScript.Fighter,
    public readonly rig: BodyRig,
    private readonly stance: (t: number) => Fighter.Stance,
    input: {
      start: number;
      end: number;
      reserved?: readonly Footsteps.Busy[];
      physical?: boolean;
    },
  ) {
    this.response = new BoutFormulaResponse(id);
    this.attacks = BoutScript.actions.filter(
      (a: BoutScript.Action): boolean => a.actor === id,
    );
    this.answers = BoutScript.actions.filter(
      (a: BoutScript.Action): boolean => a.actor !== id,
    );
    const busy: Footsteps.Busy[] = [...(input.reserved ?? [])];
    for (const action of this.attacks)
      if (action.technique.endsWith("kick")) {
        const [start, end] = Strike.window(action);
        busy.push({
          side: BoutScript.specs[action.technique].side,
          start,
          end,
        });
      }
    for (const action of this.answers)
      if (action.defense === "check") {
        const [start, end] = Reaction.checkWindow(action);
        busy.push({ side: "left", start, end });
      }
    this.steps = new Footsteps({
      start: input.start,
      end: input.end,
      desired: (t: number): Record<Footsteps.Side, Foot.Placement> =>
        Fighter.feet(this.stance(t)),
      heading: (t: number): number => this.stance(t).heading,
      busy,
      duration: 0.18,
      threshold: 0.055,
      overlap: 0.05,
      physical: input.physical,
      height: 0.05,
      lead: "left",
    });
  }

  /**
   * Authored frame at film second t.
   *
   * @evidence contracts/common.md#implementation-and-ownership Starts from the blended guard/walk base, adds breathing and a light rhythmic bounce, then every active own attack and every active answer; finally turns the neck so the face keeps tracking the opponent despite trunk rotation.
   * @evidence contracts/common.md#authoring-interface Returns a fresh frame owned by the caller.
   */
  public frame(t: number, responseSeconds: number = t): FighterBody.Frame {
    const stance: Fighter.Stance = this.stance(t);
    const fight: number = 1 - stance.walk;
    const phase: number = this.id === "a" ? 0 : 1.7;
    const frame: FighterBody.Frame = {
      time: t,
      origin: [stance.origin[0], stance.origin[1]],
      heading: stance.heading,
      turn: 0.55 * fight,
      drop:
        0.075 * fight +
        0.012 +
        0.009 * fight * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.6 * t + phase)),
      shift: [-0.04 * fight, 0],
      pelvis: { tilt: 4 * fight, obliquity: 0, rotation: 0 },
      thoracic: {
        flexion:
          9 * fight + 3 + 1.4 * Math.sin((2 * Math.PI * t) / 2.7 + phase),
        lateral: 0,
        rotation: 10 * fight,
      },
      lumbar: { flexion: 3 * fight, lateral: 0 },
      cervical: { flexion: 9 * fight, lateral: 0, rotation: 0 },
      atlas: { flexion: 6 * fight, rotation: 0 },
      jaw: 0,
      wince: 0,
      girdle: {
        left: { protraction: 4 * fight, elevation: 7 * fight },
        right: { protraction: 4 * fight, elevation: 7 * fight },
      },
      evade: { lateral: 0, flexion: 0, drop: 0, shift: 0 },
      roll: FighterBody.IDENTITY,
      lift: [0, 0, 0],
      hands: {
        left: { kind: "guard", tight: 0 },
        right: { kind: "guard", tight: 0 },
      },
      legs: {
        left: this.leg("left", t),
        right: this.leg("right", t),
      },
      arms: {
        left: {
          shoulder: { flexion: 45, abduction: 15, rotation: 25 },
          elbow: { flexion: 125 },
          forearm: { pronation: 35 },
        },
        right: {
          shoulder: { flexion: 35, abduction: 20, rotation: 30 },
          elbow: { flexion: 135 },
          forearm: { pronation: 35 },
        },
      },
      legPose: {
        left: { hip: { flexion: 20 }, knee: { flexion: 25 } },
        right: { hip: { flexion: 10 }, knee: { flexion: 25 } },
      },
    };
    Fighter.touch(frame, this.id, t);
    Rhythm.apply(frame, this.id, t);
    for (const action of this.attacks) {
      const envelope: Strike.Envelope = Strike.envelope(action, t);
      if (envelope.active) Fighter.attack(frame, action, envelope, t);
    }
    for (const action of this.answers) Reaction.apply(frame, action, t);

    // Keep the face toward the opponent: what the trunk does not turn, the neck turns.
    const needed: number =
      (frame.turn * 180) / Math.PI -
      frame.thoracic.rotation -
      frame.pelvis.rotation;
    frame.cervical.rotation += Math.max(-20, Math.min(20, needed * 0.4));
    frame.atlas.rotation += Math.max(
      -40,
      Math.min(40, needed - Math.max(-20, Math.min(20, needed * 0.4))),
    );
    this.response.apply(frame, responseSeconds);
    return frame;
  }

  /** Planted, swinging or reserved foot intent from the schedule. */
  private leg(side: Footsteps.Side, t: number): FighterBody.Leg {
    const state: Footsteps.State = this.steps.at(side, t);
    if (state.phase !== "busy")
      return { kind: "place", placement: { ...state.placement } };
    const step: Footsteps.Step = state.step!;
    const kick: BoutScript.Action | undefined = this.attacks.find(
      (a: BoutScript.Action): boolean =>
        a.technique.endsWith("kick") &&
        Math.abs(Strike.window(a)[0] - step.start) < 1e-6,
    );
    if (kick)
      return { kind: "kick", action: kick, from: step.from, to: step.to };
    const check: BoutScript.Action | undefined = this.answers.find(
      (a: BoutScript.Action): boolean =>
        a.defense === "check" &&
        Math.abs(Reaction.checkWindow(a)[0] - step.start) < 1e-6,
    );
    if (check)
      return {
        kind: "check",
        from: step.from,
        to: step.to,
        amount: Reaction.checkAmount(check, t),
        progress: state.progress,
      };
    return { kind: "place", placement: { ...step.from } };
  }
}

/**
 * Stance placement and attack overlays of {@link Fighter}.
 */
export namespace Fighter {
  /**
   * Stance origin and heading at a second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain data consumed by `feet` and the footstep generator.
   * @evidence contracts/common.md#authoring-interface Origin in world X/Z metres, heading in radians, walk weight in [0, 1].
   */
  export interface Stance {
    /** World X/Z metres. */
    origin: readonly [number, number];
    /** Heading toward the opponent (or walking direction), radians. */
    heading: number;
    /** 0 = fighting stance, 1 = upright walking stance. */
    walk: number;
  }

  /**
   * Desired placements of both feet for a stance.
   *
   * @evidence contracts/common.md#implementation-and-ownership Linear blend between the orthodox fighting placements (lead ball 0.34 m ahead, rear ball behind and right, heels raised) and parallel walking placements, rotated by the heading.
   * @evidence contracts/common.md#authoring-interface Returns world placements for both feet; pure.
   */
  export function feet(stance: Stance): Record<Footsteps.Side, Foot.Placement> {
    const w: number = stance.walk;
    const local: (
      fight: readonly [number, number, number, number],
      walk: readonly [number, number, number, number],
    ) => Foot.Placement = (
      fight: readonly [number, number, number, number],
      walk: readonly [number, number, number, number],
    ): Foot.Placement => {
      const x: number = Ease.lerp(fight[0], walk[0], w);
      const z: number = Ease.lerp(fight[1], walk[1], w);
      const offset: Vec3.Value = Vec3.rotateY([x, 0, z], stance.heading);
      return {
        ball: [stance.origin[0] + offset[0], stance.origin[1] + offset[2]],
        yaw: stance.heading + Ease.lerp(fight[2], walk[2], w),
        heel: Ease.lerp(fight[3], walk[3], w),
        lift: 0,
      };
    };
    return {
      left: local([0.34, 0.11, 0.3, 0.12], [0.08, 0.11, -0.12, 0]),
      right: local([-0.24, -0.19, 0.85, 0.42], [0.08, -0.11, 0.12, 0]),
    };
  }

  /**
   * Opening courtesy: both lead gloves reach and meet at 1.0 s, then withdraw.
   *
   * @evidence contracts/common.md#implementation-and-ownership Lead glove point goal at the pair centre, 1.28 m high, 7 cm off it per side so the two gloves press together, blended in and out around 1.0 s.
   * @evidence contracts/common.md#authoring-interface Mutates the frame; no effect outside 0.45–1.55 s.
   */
  export function touch(
    frame: FighterBody.Frame,
    id: BoutScript.Fighter,
    t: number,
  ): void {
    const amount: number = touchWeight(t);
    if (amount <= 0) return;
    const pair: Blocking.Pair = Blocking.pair(1.0);
    const axis: Vec3.Value = Vec3.rotateY([1, 0, 0], pair.axis);
    const side: number = id === "a" ? -1 : 1;
    frame.hands.left = {
      kind: "point",
      point: Vec3.add(
        [pair.centre[0], 1.28, pair.centre[1]],
        Vec3.scale(axis, side * 0.07),
      ),
      amount,
    };
    frame.girdle.left.protraction += 8 * amount;
  }

  /** Common authored approach, contact and withdrawal phase for the opening glove touch. */
  export function touchWeight(seconds: number): number {
    return Ease.plateau(seconds, 0.45, 0.92, 1.08, 1.55);
  }

  /**
   * Add one own attack's trunk, level and foot-pivot contribution.
   *
   * @evidence contracts/common.md#implementation-and-ownership Adds the technique's trunk turn, level change, weight shift and foot pivot with the body leading the fist, then marks the hand as attacking; kicks delegate to the roundhouse overlay.
   * @evidence contracts/common.md#authoring-interface Mutates the attacker's frame for one active action; extension comes from Strike.envelope.
   */
  export function attack(
    frame: FighterBody.Frame,
    action: BoutScript.Action,
    envelope: Strike.Envelope,
    t: number,
  ): void {
    const e: number = envelope.extension;

    // Hips and trunk arrive before the fist.
    const b: number = Math.min(1, e * 1.3);
    const side: Footsteps.Side = BoutScript.specs[action.technique].side;
    const pivot: (foot: Footsteps.Side, yaw: number, heel: number) => void = (
      foot: Footsteps.Side,
      yaw: number,
      heel: number,
    ): void => {
      const leg: FighterBody.Leg = frame.legs[foot];
      if (leg.kind === "place") {
        leg.placement.yaw += yaw;
        leg.placement.heel = Math.max(leg.placement.heel, heel);
      }
    };
    switch (action.technique) {
      case "jab":
        frame.turn += 0.12 * b;
        frame.shift[0] += 0.05 * b;
        frame.thoracic.rotation -= 6 * b;
        frame.girdle.left.protraction += 13 * e;
        break;
      case "cross":
        frame.turn -= 0.72 * b;
        frame.shift[0] += 0.045 * b;
        frame.thoracic.rotation += 14 * b;
        frame.girdle.right.protraction += 15 * e;
        frame.hands.left = { kind: "guard", tight: 0.6 * e };
        pivot("right", -0.6 * e, 0.32 + 0.3 * e);
        break;
      case "hook":
        frame.turn += 0.5 * b;
        frame.thoracic.rotation -= 14 * b;
        frame.drop += 0.03 * b;
        frame.shift[0] -= 0.02 * e;
        pivot("left", 0.55 * e, 0.3 * e);
        break;
      case "uppercut":
        frame.drop +=
          0.07 * Math.sin(Math.PI * envelope.windup) * (1 - envelope.recovery);
        frame.turn += 0.25 * e;
        frame.thoracic.flexion -= 6 * e;
        pivot("left", 0.35 * e, 0.25 * e);
        break;
      case "body-cross":
        frame.drop += 0.15 * b;
        frame.turn -= 0.55 * b;
        frame.thoracic.rotation += 10 * b;
        frame.shift[0] += 0.03 * b;
        frame.thoracic.flexion += 10 * e;
        frame.lumbar.lateral -= 6 * e;
        frame.hands.left = { kind: "guard", tight: 0.7 * e };
        pivot("right", -0.5 * e, 0.32 + 0.25 * e);
        break;
      case "body-hook":
        frame.drop += 0.14 * b;
        frame.turn += 0.42 * b;
        frame.thoracic.rotation -= 10 * b;
        frame.thoracic.flexion += 8 * e;
        frame.lumbar.lateral += 9 * e;
        pivot("left", 0.5 * e, 0.3 * e);
        break;
      case "low-kick":
      case "body-kick":
      case "high-kick":
        kick(frame, action, t);
        return;
    }
    const [begin] = Strike.window(action);
    FighterBody.assign(
      frame,
      side,
      { kind: "attack", action, extension: e },
      Ease.ramp(t, begin, begin + 0.1),
    );
    frame.jaw = Math.max(
      frame.jaw,
      6 * Ease.pulse(envelope.local, -0.08, 0, 0.2),
    );
  }

  /** Roundhouse trunk, pivot and forward protective arm. */
  function kick(
    frame: FighterBody.Frame,
    action: BoutScript.Action,
    t: number,
  ): void {
    const [start] = Strike.window(action);
    const k: number = Strike.kickGuardWeight(action, t);
    const right: boolean = BoutScript.specs[action.technique].side === "right";
    const sign: number = right ? -1 : 1;
    const scale: number =
      action.technique === "high-kick"
        ? 1
        : action.technique === "body-kick"
          ? 0.75
          : 0.5;
    const support: Footsteps.Side = right ? "left" : "right";
    const lean: number =
      action.technique === "high-kick"
        ? 1
        : action.technique === "body-kick"
          ? 0.6
          : 0.25;
    // Human's hip abduction stops at 40°, so the lead-leg head kick keeps the stance's
    // own hip turn and raises the leg through flexion toward the front-side diagonal.
    frame.turn += sign * (right ? 1.1 + 0.4 * scale : -0.2) * k;
    // The support hip admits only 20° of adduction, so a lead-leg head kick tilts the
    // pelvis moderately and lifts the leg through hip flexion and abduction instead.
    frame.pelvis.obliquity += sign * (8 + (right ? 45 : 14) * lean) * k;
    // The hiked pelvis tips the trunk away from the kicking leg (positive lateral
    // flexion bends toward the person's left). A rear-leg kick bends the spine back
    // over the support foot, leaving about 17° of lean for a body kick; the head
    // kick lets the spine follow the pelvis into a full lean-back.
    if (right) {
      frame.lumbar.lateral += sign * (5 + 12 * lean) * k;
      frame.thoracic.lateral += sign * 9 * lean * k;
    } else {
      frame.lumbar.lateral += -sign * (5 + 10 * lean) * k;
      frame.thoracic.lateral += -sign * 9 * lean * k;
    }

    // Seed the kicking leg near a roundhouse shape (hip flexed, abducted, internally
    // rotated) so the solver never falls into an extended or externally rotated branch.
    const kicking: "left" | "right" = BoutScript.specs[action.technique].side;
    frame.legPose[kicking] = {
      hip: {
        flexion: Ease.lerp(20, 60, k),
        abduction: Ease.lerp(0, 36, k),
        rotation: Ease.lerp(0, -25, k),
      },
      knee: { flexion: Ease.lerp(25, 70, k) },
    };
    frame.thoracic.rotation += sign * 12 * k;
    // Body and low kicks sink into the support knee; the head kick rises onto the ball of the support foot.
    frame.drop += (lean > 0.9 ? -0.05 : 0.04) * k;

    // Weight moves over the support foot: forward onto the lead foot for a rear-leg
    // kick, back onto the rear foot for a lead-leg kick.
    frame.shift[0] += (right ? 0.05 : -0.1) * k;
    frame.shift[1] += (right ? 0.03 : -0.07) * k;
    const leg: FighterBody.Leg = frame.legs[support];
    if (leg.kind === "place") {
      // The rear foot already points 49° out, so a lead-leg kick pivots it only a little
      // further; hip and tibial rotation could not follow a larger twist.
      leg.placement.yaw += sign * (right ? 1.25 : 0.35) * k;
      leg.placement.heel = Math.max(
        leg.placement.heel,
        (right ? 0.35 + 0.25 * lean : 0.42) * k,
      );
    }
    FighterBody.assign(
      frame,
      right ? "left" : "right",
      { kind: "guard", tight: 0.8 * k },
      Ease.ramp(t, start, start + 0.1),
    );
    FighterBody.assign(
      frame,
      right ? "right" : "left",
      { kind: "guard", tight: 0.8 * k, extension: k },
      Ease.ramp(t, start, start + 0.1),
    );
    frame.jaw = Math.max(
      frame.jaw,
      7 * Ease.pulse(t, action.at - 0.1, action.at, action.at + 0.25),
    );
  }
}
