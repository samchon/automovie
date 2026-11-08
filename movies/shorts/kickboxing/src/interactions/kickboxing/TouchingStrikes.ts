import {
  Vector3,
  type IAutoMovieSchedule,
  type preparePhysicalGeometry,
  type resolveAutoMovieRelationalGoal,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingDefense } from "../../laws/kickboxing/KickboxingDefense";
import { KickboxingOutcome } from "../../laws/kickboxing/KickboxingOutcome";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import type { BoutLaws } from "./BoutLaws";

/**
 * The strikes whose outcome makes the bodies touch, the region each meets,
 * and the receiver's regions with the struck one moved to the strike's drawn
 * contact point on its surface: what the relational fit bends a weapon onto
 * and what the contact audit measures.
 *
 * ```ts
 * for (const touch of TouchingStrikes.touching(schedule, "a"))
 *   TouchingStrikes.landing(receiver, touch, queries);
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#outcomes Landed, parried, blocked and checked strikes touch.
 * @evidence docs/research/kickboxing/techniques.md#surfaces The weapon meets the receiver's actual region or defending limb.
 */
export namespace TouchingStrikes {
  /** A strike whose outcome makes the bodies touch, with the region it meets. */
  export interface ITouch {
    /** The strike's entry. */
    entry: IAutoMovieSchedule.IEntry;

    /** Its technique. */
    spec: KickboxingTechnique.ISpec;

    /** Its outcome. */
    outcome: KickboxingOutcome.Outcome;

    /** The receiver's region the weapon meets. */
    region: string;

    /** The answer's entry. */
    answer: IAutoMovieSchedule.IEntry;
  }

  /**
   * The receiver's regions with the struck one moved along its surface by
   * the strike's drawn contact offset: tangent to the region's outward
   * direction, along the bone's own long axis where that axis is not the
   * outward one, then projected back onto the nearest of the bone's
   * declared colliders, so the point stays on the region's surface.
   *
   * @param receiver The receiver.
   * @param strike The touching strike.
   * @param queries The engine's geometric queries.
   * @returns The regions the relational fit reads.
   */
  export function landing(
    receiver: Fighter,
    strike: ITouch,
    queries: preparePhysicalGeometry.IQueries,
  ): Readonly<Record<string, resolveAutoMovieRelationalGoal.IRegion>> {
    const drawn = (strike.entry.state as BoutLaws.IState | undefined)?.strike;
    const region = receiver.body.regions[strike.region];
    if (!drawn || !region || drawn.point === 0) return receiver.body.regions;
    const out: IAutoMovieVector3 = Vector3.normalize(region.localPoint);
    const axis: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const along: IAutoMovieVector3 = Vector3.subtract(
      axis,
      Vector3.scale(out, Vector3.dot(axis, out)),
    );
    if (Vector3.length(along) < 1e-6) return receiver.body.regions;
    const moved: IAutoMovieVector3 = Vector3.add(
      region.localPoint,
      Vector3.scale(Vector3.normalize(along), drawn.point),
    );
    const segment = receiver.body.profile.segments.find(
      (s: P.ISegment) => s.bone === region.bone,
    );
    if (!segment) return receiver.body.regions;
    let best: IAutoMovieVector3 = moved;
    let nearest: number = Infinity;
    for (const shape of segment.shapes) {
      const p: IAutoMovieVector3 = queries.project(
        {
          body: receiver.id,
          bone: region.bone,
          shape,
          pose: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
        moved,
      );
      const d: number = Vector3.length(Vector3.subtract(p, moved));
      if (d < nearest) {
        nearest = d;
        best = p;
      }
    }
    return {
      ...receiver.body.regions,
      [strike.region]: { bone: region.bone, localPoint: best },
    };
  }

  /**
   * A fighter's touching strikes: every strike whose answer's outcome touches, with the region the defense table gives.
   *
   * @param schedule The schedule.
   * @param subject The striker's id.
   * @returns His touching strikes in time order.
   * @evidence docs/research/kickboxing/exchanges.md#outcomes Landed, parried, blocked and checked strikes touch.
   */
  export function touching(
    schedule: IAutoMovieSchedule,
    subject: string,
  ): ITouch[] {
    const answers: Map<string, IAutoMovieSchedule.IEntry> = new Map();
    for (const entry of schedule.entries) {
      if (entry.intent.capability !== "answer") continue;
      const action = KickboxingAction.read(entry.intent);
      if (action.kind === "answer") answers.set(action.strike, entry);
    }
    const result: ITouch[] = [];
    for (const entry of schedule.entries) {
      if (
        entry.subject !== subject ||
        entry.intent.capability !== "strike" ||
        entry.intent.anchor === undefined
      )
        continue;
      const answer = answers.get(entry.intent.anchor);
      if (!answer || answer.outcome === undefined) continue;
      const outcome = answer.outcome as KickboxingOutcome.Outcome;
      if (!KickboxingOutcome.touches(outcome)) continue;
      const action = KickboxingAction.read(entry.intent);
      const defend = KickboxingAction.read(answer.intent);
      if (action.kind !== "strike" || defend.kind !== "answer") continue;
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[action.technique];
      const region: string | null = KickboxingDefense.contact(
        defend.answer,
        spec,
      );
      if (region === null) continue;
      result.push({ entry, spec, outcome, region, answer });
    }
    return result;
  }
}
