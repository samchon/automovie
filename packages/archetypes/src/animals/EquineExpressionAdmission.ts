import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";

/** Acts whose muzzle touches its target. */
const TOUCHING: ReadonlySet<AutoMovieArchetypeEquineExpressionCue.Act> =
  new Set<AutoMovieArchetypeEquineExpressionCue.Act>([
    "greet",
    "graze",
    "hay",
    "drink",
    "rub",
    "groom",
    "bite",
    "suckle",
  ]);

/** A cue that poses nothing and only marks an instant. */
type Marked =
  | AutoMovieArchetypeEquineExpressionCue.IVocalize
  | AutoMovieArchetypeEquineExpressionCue.ITwitch;

/**
 * The expression layer's cue admission and the readers its channels share: each cue's eased share, a target's world point and a world point in a sample's model space.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is admitted and what is read.
 * @evidence contracts/development/design.md#principled-representation The held cue types and pure readers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeEquineExpression` only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineExpressionAdmission {
  /**
   * A held cue with its channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cues it covers.
   * @evidence contracts/development/design.md#principled-representation A union of cue types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the expression layer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Held = Exclude<AutoMovieArchetypeEquineExpressionCue.Cue, Marked>;

  /**
   * A cue on the head channel that faces a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cues it covers.
   * @evidence contracts/development/design.md#principled-representation A union of cue types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the expression layer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Facing =
    | AutoMovieArchetypeEquineExpressionCue.IAttend
    | AutoMovieArchetypeEquineExpressionCue.IReach;

  /**
   * Any cue on the head channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cues it covers.
   * @evidence contracts/development/design.md#principled-representation A union of cue types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the expression layer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Heading =
    | Facing
    | AutoMovieArchetypeEquineExpressionCue.ICarriage;

  /**
   * A cue's minimum-jerk share at a second: zero outside its window, one when fully held.
   *
   * @param cue The cue.
   * @param seconds The film second.
   * @returns The share, 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk share of the nearer ease.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every held channel.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function envelope(cue: Held, seconds: number): number {
    if (!(seconds > cue.from && seconds < cue.to)) return 0;
    return minimumJerk.share(
      Math.min(
        1,
        (seconds - cue.from) / cue.ease,
        (cue.to - seconds) / cue.ease,
      ),
    );
  }

  /**
   * A target's world point at a second.
   *
   * @param cue The facing cue.
   * @param seconds The film second.
   * @returns The world point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The fixed point or the track's point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the head channel and its clearance check.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function target(cue: Facing, seconds: number): IAutoMovieVector3 {
    return cue.target.kind === "point"
      ? cue.target.point
      : cue.target.at(seconds);
  }

  /**
   * A world point in a sample's model space.
   *
   * @param sample The sample.
   * @param point The world point.
   * @returns The point in its model space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both frames.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of the sample's placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every world target.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function local(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      sample.placement.rotation,
    );
    return Quaternion.rotateVector(
      inverse,
      Vector3.subtract(point, sample.placement.translation),
    );
  }

  /**
   * Admit the cues: finite windows, one cue at a time per channel, and clearances that agree with their acts.
   *
   * @param archetype The animal's producer name, for a refusal.
   * @param cues The cues.
   * @returns The held cues.
   * @throws {AutoMovieArchetypeRefusal} For a malformed window, overlapping cues on a channel or a clearance its act contradicts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the checks and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One pass for windows and clearances, one ordered pass for overlaps per channel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two passes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(C log C).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the layer once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the held cues.
   */
  export function admit(
    archetype: string,
    cues: readonly AutoMovieArchetypeEquineExpressionCue.Cue[],
  ): readonly Held[] {
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis,
        value,
        feasible: null,
        reason,
        fix: "Give each cue a finite window longer than twice its ease, one cue at a time per channel, and a clearance its act allows.",
      });
    };
    const held: Held[] = [];
    for (const cue of cues) {
      if (cue.kind === "vocalize" || cue.kind === "twitch") {
        if (!Number.isFinite(cue.at))
          refuse("at", cue.at, `a ${cue.kind} needs a finite second`);
        continue;
      }
      if (
        ![cue.from, cue.to, cue.ease].every(Number.isFinite) ||
        !(cue.ease > 0 && 2 * cue.ease <= cue.to - cue.from)
      )
        refuse("ease", cue.ease, `a ${cue.kind} cue needs from + 2 ease <= to`);
      if (cue.kind === "reach") {
        const touching: boolean = TOUCHING.has(cue.act);
        if (
          !(
            Number.isFinite(cue.gap) && (touching ? cue.gap === 0 : cue.gap > 0)
          )
        )
          refuse(
            "gap",
            cue.gap,
            touching
              ? `a ${cue.act} touches its target, so its clearance is zero`
              : "a sniff keeps a positive clearance",
          );
      }
      held.push(cue);
    }
    const channel = (cue: Held): string =>
      cue.kind === "attend" || cue.kind === "reach" || cue.kind === "carriage"
        ? "head"
        : cue.kind === "ear"
          ? `${cue.side}Ear`
          : cue.kind;
    const ordered: Held[] = [...held].sort(
      (p: Held, q: Held): number => p.from - q.from,
    );
    const last: Map<string, Held> = new Map();
    for (const cue of ordered) {
      const before: Held | undefined = last.get(channel(cue));
      if (before !== undefined && cue.from < before.to)
        refuse(
          "cues",
          channel(cue),
          `two cues overlap on the ${channel(cue)} channel at ${cue.from} s`,
        );
      last.set(channel(cue), cue);
    }
    return held;
  }
}
