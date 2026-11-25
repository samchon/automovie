import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSkydive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * Belly-to-earth terminal speed, metres per second (provisional: about 120 mph,
 * the figure the USPA Skydiver's Information Manual teaches for a stable
 * arch).
 */
const TERMINAL: number = 53;

/**
 * The forward speed the exit leaves the edge with, metres per second
 * (provisional: a step off).
 */
const EXIT: number = 1;

/**
 * Seconds the canopy takes to open (provisional: a ram-air canopy's snatch to
 * full inflation).
 */
const OPEN: number = 3;

/**
 * The open canopy's sink and forward speeds, metres per second (provisional: a
 * student canopy).
 */
const SINK: number = 5;
const FORWARD: number = 10;

/** The turn rate a held toggle gives, degrees per second (provisional). */
const TURN: number = 30;

/** The height the flare starts at, metres (provisional). */
const FLARE: number = 3;

/**
 * The sink and forward speeds at touchdown after the flare, metres per second
 * (provisional).
 */
const TOUCH_SINK: number = 1.5;
const TOUCH_FORWARD: number = 2;

/**
 * A parachute jump's hips path, closed form phase by phase: the freefall falls
 * with quadratic drag toward `TERMINAL` (`v = vt tanh(g t / vt)`, `drop = vt^2
 * / g ln cosh(g t / vt)`) gliding at the exit and track speed along a heading
 * turning at the freefall rate; the opening eases the speeds to the canopy's
 * over `OPEN`; the canopy sinks and flies forward at constant speeds along a
 * heading the held toggles turn; the flare eases them to the touchdown speeds
 * from `FLARE` to the ground. An eased speed's distance is the minimum-jerk
 * share's integral, `2.5 u^4 - 3 u^5 + u^6`.
 */
export namespace skydivePath {
  /** One instant of the path. */
  export interface IAt {
    /** The hips, world metres. */
    hips: IAutoMovieVector3;

    /** The heading, degrees. */
    heading: number;

    /** The phase. */
    phase: Phase;

    /** Progress through it, 0 to 1. */
    share: number;
  }

  /** The flight's phases. */
  export type Phase = "freefall" | "opening" | "canopy" | "flare";

  /** The path. */
  export interface IPath {
    /** The opening's start, the deployment. */
    deploy: number;

    /** The canopy's full inflation. */
    open: number;

    /** The flare's start. */
    flare: number;

    /** The touchdown. */
    touchdown: number;

    /** The touchdown's horizontal velocity, metres per second. */
    landing: IAutoMovieVector3;

    /** The path at a time, clamped to the flight. */
    at(seconds: number): IAt;
  }

  /**
   * Prepare the path.
   *
   * @param p The jump.
   * @param hips The hips at the exit, world metres.
   * @param yaw The exit heading, degrees.
   * @param ground The landing ground's height, world metres.
   * @returns The path.
   * @throws {HumanRefusal} If the exit is not above the deployment, the
   *   deployment leaves too little height for the canopy to open and slow the
   *   body before the flare, or the toggles overlap.
   */
  export function prepare(
    p: IAutoMovieMotionHumanSkydive.IParams,
    hips: IAutoMovieVector3,
    yaw: number,
    ground: number,
  ): IPath {
    const g: number = AutoMovieGravity.STANDARD;
    const height: number = hips.y - ground;
    if (!(p.deploy > 0 && height > p.deploy))
      throw refusal(
        "deploy",
        p.deploy,
        `the exit is ${height.toFixed(1)} m up, not above the ${p.deploy} m deployment`,
      );
    const fall: number = height - p.deploy;
    const deploy: number =
      (TERMINAL / g) * Math.acosh(Math.exp((fall * g) / (TERMINAL * TERMINAL)));
    const speed: number = TERMINAL * Math.tanh((g * deploy) / TERMINAL);
    const opening: number = (OPEN * (speed + SINK)) / 2;
    if (p.deploy < opening + FLARE)
      throw refusal(
        "deploy",
        p.deploy,
        `a deployment at ${p.deploy} m leaves too little height: the canopy needs ${(opening + FLARE).toFixed(1)} m to open and slow the body before the flare`,
      );
    const open: number = deploy + OPEN;
    const flare: number = open + (p.deploy - opening - FLARE) / SINK;
    const flareTime: number = (2 * FLARE) / (SINK + TOUCH_SINK);
    const touchdown: number = flare + flareTime;
    const glide: number = EXIT + (p.track ?? 0);
    const spin: number = p.turn ?? 0;
    const toggles: readonly IAutoMovieMotionHumanSkydive.IToggle[] = [
      ...(p.toggles ?? []),
    ].sort(
      (
        a: IAutoMovieMotionHumanSkydive.IToggle,
        b: IAutoMovieMotionHumanSkydive.IToggle,
      ): number => a.at - b.at,
    );
    toggles.forEach(
      (toggle: IAutoMovieMotionHumanSkydive.IToggle, i: number): void => {
        if (
          !(toggle.at >= 0 && toggle.hold > 0) ||
          (i > 0 && toggles[i - 1]!.at + toggles[i - 1]!.hold > toggle.at)
        )
          throw refusal(
            `toggles[${i}]`,
            toggle,
            "toggle pulls start after opening, last a while and do not overlap",
          );
      },
    );

    // The freefall's end, the opening's end and the canopy's arcs.
    const ffHeading: number = yaw + spin * deploy;
    const ffEnd: IAutoMovieVector3 = Vector3.add(hips, {
      ...arc(glide, yaw, spin, deploy),
      y: -fall,
    });
    const openEnd: IAutoMovieVector3 = Vector3.add(ffEnd, {
      ...Vector3.scale(
        HumanFrame.forward(ffHeading),
        OPEN * eased(glide, FORWARD, 1),
      ),
      y: -OPEN * eased(speed, SINK, 1),
    });
    const canopyAt = (s: number): ICanopy => {
      let heading: number = ffHeading;
      let offset: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let t: number = 0;
      for (const toggle of toggles) {
        if (toggle.at >= s) break;
        offset = Vector3.add(offset, arc(FORWARD, heading, 0, toggle.at - t));
        const held: number = Math.min(toggle.hold, s - toggle.at);
        const rate: number = toggle.side === "left" ? TURN : -TURN;
        offset = Vector3.add(offset, arc(FORWARD, heading, rate, held));
        heading += rate * held;
        t = toggle.at + held;
      }
      offset = Vector3.add(
        offset,
        arc(FORWARD, heading, 0, Math.max(0, s - t)),
      );
      return { offset: { ...offset, y: -SINK * s }, heading };
    };
    const flareStart: ICanopy = canopyAt(flare - open);

    const at = (seconds: number): IAt => {
      const t: number = Math.max(0, Math.min(touchdown, seconds));
      if (t < deploy) {
        const drop: number =
          ((TERMINAL * TERMINAL) / g) * Math.log(Math.cosh((g * t) / TERMINAL));
        return {
          hips: Vector3.add(hips, { ...arc(glide, yaw, spin, t), y: -drop }),
          heading: yaw + spin * t,
          phase: "freefall",
          share: t / deploy,
        };
      }
      if (t < open) {
        const u: number = (t - deploy) / OPEN;
        return {
          hips: Vector3.add(ffEnd, {
            ...Vector3.scale(
              HumanFrame.forward(ffHeading),
              OPEN * eased(glide, FORWARD, u),
            ),
            y: -OPEN * eased(speed, SINK, u),
          }),
          heading: ffHeading,
          phase: "opening",
          share: u,
        };
      }
      if (t < flare) {
        const c: ICanopy = canopyAt(t - open);
        return {
          hips: Vector3.add(openEnd, c.offset),
          heading: c.heading,
          phase: "canopy",
          share: (t - open) / Math.max(1e-6, flare - open),
        };
      }
      const u: number = (t - flare) / flareTime;
      return {
        hips: Vector3.add(Vector3.add(openEnd, flareStart.offset), {
          ...Vector3.scale(
            HumanFrame.forward(flareStart.heading),
            flareTime * eased(FORWARD, TOUCH_FORWARD, u),
          ),
          y: -flareTime * eased(SINK, TOUCH_SINK, u),
        }),
        heading: flareStart.heading,
        phase: "flare",
        share: u,
      };
    };
    return {
      deploy,
      open,
      flare,
      touchdown,
      landing: Vector3.scale(
        HumanFrame.forward(flareStart.heading),
        TOUCH_FORWARD,
      ),
      at,
    };
  }

  /** The canopy's offset from full inflation and its heading at a time under it. */
  interface ICanopy {
    /** Offset from the opened canopy's hips, metres. */
    offset: IAutoMovieVector3;

    /** Heading, degrees. */
    heading: number;
  }

  /**
   * The horizontal offset of a constant speed along a heading turning at a
   * constant rate, over a time.
   */
  function arc(
    speed: number,
    heading: number,
    rate: number,
    seconds: number,
  ): IAutoMovieVector3 {
    if (Math.abs(rate) < 1e-9)
      return Vector3.scale(HumanFrame.forward(heading), speed * seconds);
    const w: number = (rate * Math.PI) / 180;
    const h0: number = (heading * Math.PI) / 180;
    const h1: number = h0 + w * seconds;
    return {
      x: (speed / w) * (Math.cos(h0) - Math.cos(h1)),
      y: 0,
      z: (speed / w) * (Math.sin(h1) - Math.sin(h0)),
    };
  }

  /**
   * The distance share of a speed eased from one value to another by minimum
   * jerk, per unit time, at progress u.
   */
  function eased(from: number, to: number, u: number): number {
    const w: number = Math.max(0, Math.min(1, u));
    return from * w + (to - from) * (2.5 * w ** 4 - 3 * w ** 5 + w ** 6);
  }

  /** The jump's refusal. */
  function refusal(axis: string, value: unknown, reason: string): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis,
      value,
      reason,
      fix: "deploy higher or jump from higher",
    });
  }
}
