import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanAuditTangle,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangle } from "./AutoMovieMotionHumanAuditTangle";

/**
 * How deep two people's bodies pass into one another: the hand that sinks
 * into a partner's shoulder, the fist that ends inside a head, the two
 * trunks of an embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins
 * meet, never that one body may enter the other. How much a pressed skin
 * gives is the caller's limit to state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, why in both directions and why nothing is exempt.
 * @evidence contracts/development/implementation.md#principled-implementation Interior depth of one body's probes in the other's convex colliders, the measure the self-penetration audit owns.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk of the film's grid that keeps each pair's deepest instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pair, part or contact window is left unread.
 * @evidence contracts/development/implementation.md#efficient-algorithms The pose reader rejects distant segments by bounding spheres before any probe is transformed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates each pose to `AutoMovieMotionHumanAuditTangle.across`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing of its own; the body models are the self-penetration audit's.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Both directions at every instant of the grid.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A grid loop over two directed readings and one sort.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads both ends of the film and exempts nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each person's bones are posed once per instant and shared by both directions.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid is `AutoMovieMotionHumanAuditMotion.grid`, the pose reading `AutoMovieMotionHumanAuditTangle.across`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    for (const t of HumanAuditMotion.grid(0, motion.duration, rate)) {
      const mine: ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =
        motion.bones(one.subject, t);
      const theirs: ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =
        motion.bones(other.subject, t);
      const read = (
        from: IAutoMovieMotionHumanAuditPartner.IPerson,
        to: IAutoMovieMotionHumanAuditPartner.IPerson,
        pairs: IAutoMovieMotionHumanAuditTangle.IPair[],
      ): void => {
        for (const pair of pairs) {
          const key: string = `${from.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.subject,
              part: pair.a,
              other: to.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: t,
            });
        }
      };
      read(
        one,
        other,
        AutoMovieMotionHumanAuditTangle.across(
          one.body,
          mine,
          other.body,
          theirs,
        ),
      );
      read(
        other,
        one,
        AutoMovieMotionHumanAuditTangle.across(
          other.body,
          theirs,
          one.body,
          mine,
        ),
      );
    }
    const pairs: IAutoMovieMotionHumanAuditPartner.IPair[] = [
      ...deepest.values(),
    ].sort(
      (
        x: IAutoMovieMotionHumanAuditPartner.IPair,
        y: IAutoMovieMotionHumanAuditPartner.IPair,
      ): number => y.depth - x.depth,
    );
    const top: IAutoMovieMotionHumanAuditPartner.IPair | undefined = pairs[0];
    return {
      worst:
        top === undefined
          ? { value: 0, seconds: 0, where: "none" }
          : {
              value: top.depth,
              seconds: top.seconds,
              where: `${top.subject} ${top.part} in ${top.other} ${top.into}`,
            },
      pairs,
    };
  }
}
