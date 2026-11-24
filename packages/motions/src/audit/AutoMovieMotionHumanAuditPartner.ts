import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: M.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: M.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: M.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: M.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: M.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: M.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: import { advanceAutoMovieGrid } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";

/**
 * How deep two people's bodies pass into one another: the hand that sinks into
 * a partner's shoulder, the fist that ends inside a head, the two trunks of an
 * embrace run through each other.
 *
 * It is the two-body counterpart of the self-penetration audit and reads the
 * same probes against the same colliders, in both directions, since a small
 * part may lie wholly inside a large one whose own corners stay outside.
 * Nothing is removed from the reading: two bodies share no joint and no rest
 * pose, and a declared contact between them is a statement that the skins meet,
 * never that one body may enter the other. How much a pressed skin gives is the
 * caller's limit to state.
 */
export namespace AutoMovieMotionHumanAuditPartner {
  /**
   * Read how deep two people pass into each other over the whole motion.
   *
   * The result is the one reading both directions at every grid instant gives
   * (`AutoMovieMotionHumanAuditTangle.across` at each instant, each directed
   * pair keeping its deepest, first instant on a tie), from fewer pair
   * readings: a directed pair read at an instant is read again only at the
   * first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`).
   *
   * @param motion The motion.
   * @param one One person.
   * @param other The other person.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    one: IAutoMovieMotionHumanAuditPartner.IPerson,
    other: IAutoMovieMotionHumanAuditPartner.IPerson,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditPartner.IResult {
    const deepest: Map<string, IAutoMovieMotionHumanAuditPartner.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each person's placed segments at every instant and each segment's
    // travel to it: a directed pair read at an instant is next read at the
    // first instant its margin does not certify (`advanceAutoMovieGrid`).
    const people: IPerson[] = [one, other].map(
      (person: IAutoMovieMotionHumanAuditPartner.IPerson): IPerson => {
        const model: M.IModel = person.body.tangle;
        const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
          (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
            HumanColliders.placed(person.body, motion.bones(person.subject, t)),
        );
        return {
          person,
          model,
          frames,
          travelled: Margin.travel(model, frames),
        };
      },
    );
    const directions: IDirection[] = [
      [people[0]!, people[1]!],
      [people[1]!, people[0]!],
    ].map(
      ([from, to]: IPerson[]): IDirection => ({
        from: from!,
        to: to!,
        due: new Int32Array(from!.model.parts.length * to!.model.parts.length),
        recorded: new Float64Array(
          from!.model.parts.length * to!.model.parts.length,
        ).fill(Margin.NANOMETRE),
      }),
    );
    for (let k: number = 0; k < times.length; k++)
      for (const { from, to, due, recorded } of directions) {
        const count: number = to.model.parts.length;
        for (const pair of Margin.entering(
          from.model,
          from.frames[k]!,
          to.model,
          to.frames[k]!,
          {
            due: (index: number): boolean => k >= due[index]!,

            // A pair read here cannot add to its record while both segments
            // travel less than its base plus the depth recorded for it (the
            // nanometre a depth must pass to be recorded at all, before
            // any); a pair whose bounding spheres were apart is not read
            // before the two travel the gap between them.
            heard: (
              index: number,
              base: number,
              apart: boolean,
              depth: number,
            ): void => {
              recorded[index] = Math.max(recorded[index]!, depth);
              const i: number = Math.floor(index / count);
              const j: number = index % count;
              due[index] = advanceAutoMovieGrid(
                k,
                times.length - 1,
                apart ? base : base + recorded[index]!,
                (a: number, b: number): number =>
                  from.travelled[b]![i]! -
                  from.travelled[a]![i]! +
                  (to.travelled[b]![j]! - to.travelled[a]![j]!),
              );
            },
          },
        )) {
          const key: string = `${from.person.subject}|${pair.a}|${pair.b}`;
          const known: IAutoMovieMotionHumanAuditPartner.IPair | undefined =
            deepest.get(key);
          if (known === undefined || pair.depth > known.depth)
            deepest.set(key, {
              subject: from.person.subject,
              part: pair.a,
              other: to.person.subject,
              into: pair.b,
              depth: pair.depth,
              seconds: times[k]!,
            });
        }
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

/**
 * One person as the walk reads them: their model, their placed segments at
 * every grid instant and each segment's travel to it.
 */
interface IPerson {
  person: IAutoMovieMotionHumanAuditPartner.IPerson;
  model: M.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
.IModel;
  frames: IAutoMovieMotionHumanColliders.IPlaced[][];
  travelled: Float64Array[];
}

/**
 * One direction of the reading, the first person's probes in the second's
 * segments, with each directed pair's next due instant and its record (the
 * greatest depth it read, or the nanometre a first record must pass) by its
 * index.
 */
interface IDirection {
  from: IPerson;
  to: IPerson;
  due: Int32Array;
  recorded: Float64Array;
}
