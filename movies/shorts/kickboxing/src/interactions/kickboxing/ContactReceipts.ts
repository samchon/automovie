import {
  auditAutoMovieOutcome,
  measureAutoMovieContact,
  type IAutoMovieSchedule,
  type preparePhysicalGeometry,
} from "@automovie/engine";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import type { BoutPerformance } from "./BoutPerformance";
import { TouchingStrikes } from "./TouchingStrikes";
import type { IRingCast } from "./IRingCast";

/**
 * The geometric receipts of the bout's contacts and the audit of every
 * outcome against them: for each strike whose outcome touches, the weapon's
 * colliders and the decided region's colliders are measured on the displayed
 * bodies across the frames around contact; the audit reports every decided
 * contact the bodies did not make and every evaded strike that touched the
 * region it should have missed. Sound, marks and spray follow only receipts.
 *
 * ```ts
 * const { receipts, findings } = ContactReceipts.measure(cast, schedule, performance, queries);
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The outcome table decides; the geometry realizes and is audited, never rewriting the outcome.
 * @evidence docs/research/kickboxing/techniques.md#surfaces The weapon surfaces and regions measured.
 */
export namespace ContactReceipts {
  /** Frames either side of contact the measurement scans, at 30 fps: one frame each way. */
  export const FRAMES: number = 1;

  /** One measured contact. */
  export interface IReceipt {
    /** The strike's anchor. */
    anchor: string;

    /** Striker and receiver ids. */
    striker: string;

    /** Receiver id. */
    receiver: string;

    /** The region met. */
    region: string;

    /** The decided outcome. */
    outcome: string;

    /** The technique. */
    technique: KickboxingTechnique.Name;

    /** Seconds of the closest frame. */
    seconds: number;

    /** Least separation, metres; negative is compression. */
    separation: number;

    /** Whether the bodies touched. */
    contact: boolean;
  }

  /**
   * Measure every touching strike and audit all outcomes.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param performance The displayed bodies.
   * @param queries The engine's geometric queries.
   * @returns Receipts and audit findings.
   */
  export function measure(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    performance: BoutPerformance,
    queries: preparePhysicalGeometry.IQueries,
  ): { receipts: IReceipt[]; findings: string[] } {
    const receipts: IReceipt[] = [];
    const findings: string[] = [];
    const frame: number = 1 / 30;
    for (const striker of [cast.a, cast.b]) {
      const receiver: Fighter = striker === cast.a ? cast.b : cast.a;
      for (const touch of TouchingStrikes.touching(schedule, striker.id)) {
        let best: measureAutoMovieContact.IResult | undefined;
        let when: number = touch.entry.contact!;
        const contacts: auditAutoMovieOutcome.IContact[] = [];
        for (let k: number = -FRAMES; k <= FRAMES; k++) {
          const seconds: number = touch.entry.contact! + k * frame;
          const bodies = performance.at(seconds);
          const result = measureAutoMovieContact({
            a: {
              subject: striker.id,
              region: touch.spec.surface,
              profile: striker.body.profile,
              segments: bodies[striker.id]!.segments,
              bones: weaponBones(touch.spec),
            },
            b: {
              subject: receiver.id,
              region: touch.region,
              profile: receiver.body.profile,
              segments: bodies[receiver.id]!.segments,
              bones: regionBones(receiver, touch.region),
            },
            queries,
            seconds,
          });
          if (result.contact) contacts.push(result.contact);
          if (best === undefined || result.separation < best.separation) {
            best = result;
            when = seconds;
          }
        }
        findings.push(
          ...auditAutoMovieOutcome(
            {
              id: touch.entry.intent.anchor!,
              required: [
                {
                  a: { subject: striker.id },
                  b: { subject: receiver.id, region: touch.region },
                  window: {
                    start: touch.entry.contact! - FRAMES * frame,
                    end: touch.entry.contact! + FRAMES * frame,
                  },
                },
              ],
            },
            contacts,
          ),
        );
        receipts.push({
          anchor: touch.entry.intent.anchor!,
          striker: striker.id,
          receiver: receiver.id,
          region: touch.region,
          outcome: touch.outcome,
          technique: touch.spec.name,
          seconds: when,
          separation: best!.separation,
          contact: contacts.length > 0,
        });
      }
    }
    return { receipts, findings };
  }

  /** Segments carrying a technique's weapon surface. */
  function weaponBones(spec: KickboxingTechnique.ISpec): string[] {
    const s: string = spec.side;
    switch (spec.surface) {
      case "knuckles":
        return [`${s}Hand`];
      case "shin":
        return [`${s}LowerLeg`];
      case "instep":
        return [`${s}Midfoot`, `${s}Foot`, `${s}LowerLeg`];
      case "sole":
        return [`${s}Midfoot`, `${s}Foot`];
      case "knee":
        return [`${s}LowerLeg`, `${s}UpperLeg`];
    }
  }

  /** Segments carrying a region's colliders. */
  function regionBones(receiver: Fighter, region: string): string[] {
    const r = receiver.body.regions[region];
    if (!r) throw new Error(`Unknown region ${region}`);
    if (region.startsWith("glove-")) return [r.bone];
    if (region.startsWith("forearm-"))
      return [r.bone, r.bone.replace("LowerArm", "Hand")];
    return [r.bone];
  }
}
