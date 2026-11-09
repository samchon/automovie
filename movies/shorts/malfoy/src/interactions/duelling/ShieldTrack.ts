import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { BodyFrame } from "../../laws/body/BodyFrame";
import { DuelLaw } from "../../laws/duelling/DuelLaw";
import type { IStageWorld } from "../staging/IStageWorld";

/**
 * Every shield charm's surface over the film: it grows from the caster's
 * raised wand tip to full size by the shield's contact, stands where it
 * formed facing the caster's heading while the wand stays raised, and fades
 * over 0.4 s at the end. Its plane is what blocks spells and fragments.
 *
 * ```ts
 * const shields = ShieldTrack.resolve(schedule);
 * ShieldTrack.at(shields[0], 32.1); // { centre, facing, size, opacity }
 * ```
 *
 * @evidence docs/body/settings/props/shield.md#surface 1.5 × 1.8 m oval, near edge at the wand tip, facing the wand's direction, lower edge 0.1 m up.
 * @evidence docs/body/settings/props/shield.md#lifecycle Grows in 0.25 s (Carina) or 0.4 s (Harry), holds at most 3 s, fades over 0.4 s.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Resolved once; `at` is pure.
 * @evidence contracts/development/common.md#meaningful-documentation States the lifecycle.
 */
export namespace ShieldTrack {
  /** One shield. */
  export interface IShield {
    /** Caster id. */
    caster: string;

    /** Second the gesture ends and growth begins. */
    grow: number;

    /** Second it is full size. */
    full: number;

    /** Second it begins to fade. */
    fade: number;

    /** Second it is gone. */
    gone: number;

    /** Centre of the surface, world metres. */
    centre: IAutoMovieVector3;

    /** Heading its outer face looks, radians. */
    facing: number;
  }

  /** Every shield of a schedule. */
  export function resolve(schedule: IAutoMovieSchedule): IShield[] {
    return schedule.entries
      .filter((e) => e.intent.capability === "shield" && e.contact !== undefined)
      .map((e) => {
        const step = e.state as IStageWorld.IStudentStep;
        const heading: number = step.to.heading;
        const hand: IAutoMovieVector3 = step.to.hands.right.point ?? BodyFrame.toWorld(step.to.position, heading, { forward: 0.5, left: -0.15, up: 1.3 });
        const tip: IAutoMovieVector3 = BodyFrame.toWorld(hand, heading, { forward: 0.24, left: 0, up: 0 });
        return {
          caster: e.subject,
          grow: e.start + step.lead + DuelLaw.GESTURE,
          full: e.contact!,
          fade: e.end - DuelLaw.SHIELD_FADE,
          gone: e.end,
          centre: { x: tip.x, y: 1.0, z: tip.z },
          facing: heading,
        };
      });
  }

  /** A shield's look at a second: its scale share and opacity share, both 0 when absent. */
  export function at(shield: IShield, seconds: number): { scale: number; opacity: number } {
    if (seconds < shield.grow || seconds >= shield.gone) return { scale: 0, opacity: 0 };
    const scale: number = Math.min(1, (seconds - shield.grow) / Math.max(0.01, shield.full - shield.grow));
    const opacity: number = seconds < shield.fade ? 1 : Math.max(0, (shield.gone - seconds) / (shield.gone - shield.fade));
    return { scale, opacity };
  }

  /** Whether a straight move from a to b crosses a standing shield at a second; returns the crossing point. */
  export function blocks(shield: IShield, seconds: number, a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 | undefined {
    if (at(shield, seconds).scale < 1) return undefined;
    const n: IAutoMovieVector3 = BodyFrame.forward(shield.facing);
    const da: number = (a.x - shield.centre.x) * n.x + (a.z - shield.centre.z) * n.z;
    const db: number = (b.x - shield.centre.x) * n.x + (b.z - shield.centre.z) * n.z;
    if (da * db > 0) return undefined;
    const k: number = da / (da - db);
    const p: IAutoMovieVector3 = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
    const side: IAutoMovieVector3 = BodyFrame.left(shield.facing);
    const lateral: number = (p.x - shield.centre.x) * side.x + (p.z - shield.centre.z) * side.z;
    return Math.abs(lateral) <= 0.75 && p.y <= 1.9 ? p : undefined;
  }
}
