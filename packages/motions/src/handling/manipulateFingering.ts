import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { manipulate } from "./manipulate";
import { manipulateReach } from "./manipulateReach";

/**
 * The digits of a keyed contact sequence (`manipulate`): each contact's own
 * digit, or the Viterbi path over the five digits of its hand that minimizes
 * the wrist's total travel, the wrist standing where the plan places it for
 * that digit's press (`manipulateReach`, in the rotation the hand keeps for
 * the act), so a difference of two such places is the wrist's travel.
 *
 * @param body The body.
 * @param contacts The contacts with their sites.
 * @param sides Each contact's hand.
 * @param rotation Each hand's rotation for the act, from its rest.
 * @returns Each contact's digit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the choice, its cost and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation An exact Viterbi path (dynamic programming over a chain of five-state stages) minimizing summed wrist travel, Handrix's stated outcome of keeping the wrist still (ElKoura and Singh 2003).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward pass and one back-trace per hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cost is a measured distance, with no weight; a contact that names its digit is kept.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fully authored fingering has one path and returns its digits directly; a single free contact keeps the original first-digit tie. Other sequences retain linear contacts times five squared Viterbi work, with each wrist placed once per stage and fixed digit geometry prepared once per hand.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Adjacent Viterbi stages retain their digit placements for every edge that reads the same contact, digit, hand and fixed rotation; the previous stage is released when the next replaces it.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array and retains nothing.
 */
export function manipulateFingering(
  body: IAutoMovieMotionHumanBody,
  contacts: readonly IAutoMovieMotionHumanManipulate.IContactAt[],
  sides: readonly AutoMovieHumanSide[],
  rotation: Readonly<Record<AutoMovieHumanSide, IAutoMovieQuaternion>>,
): IAutoMovieMotionHumanManipulate.Finger[] {
  type Finger = IAutoMovieMotionHumanManipulate.Finger;
  const out: Finger[] = new Array<Finger>(contacts.length);
  for (const side of ["left", "right"] as const) {
    const mine: number[] = contacts
      .map(
        (_c: IAutoMovieMotionHumanManipulate.IContactAt, i: number): number =>
          i,
      )
      .filter((i: number): boolean => sides[i] === side);
    if (mine.length === 0) continue;

    // Fixed fingering has one path, so its wrist-travel cost cannot change
    // the result. A one-contact free path keeps the original first-digit tie.
    if (mine.length === 1) {
      out[mine[0]!] = contacts[mine[0]!]!.digit ?? manipulate.FINGERS[0];
      continue;
    }
    if (mine.every((index: number): boolean => contacts[index]!.digit !== undefined)) {
      for (const index of mine) out[index] = contacts[index]!.digit!;
      continue;
    }
    const choices: (i: number) => readonly Finger[] = (
      i: number,
    ): readonly Finger[] =>
      contacts[i]!.digit === undefined
        ? manipulate.FINGERS
        : [contacts[i]!.digit!];
    const reach: ReturnType<typeof manipulateReach.prepare> =
      manipulateReach.prepare(body, side, rotation[side]);
    const wristAt: (i: number, f: Finger) => IAutoMovieVector3 = (
      i: number,
      f: Finger,
    ): IAutoMovieVector3 =>
      reach(
        f,
        contacts[i]!.point,
        contacts[i]!.normal,
        contacts[i]!.depth,
      );
    const wrists: (index: number) => Map<Finger, IAutoMovieVector3> = (index: number): Map<Finger, IAutoMovieVector3> =>
      new Map(choices(index).map(
        (finger: Finger): [Finger, IAutoMovieVector3] =>
          [finger, wristAt(index, finger)],
      ));
    let previous: Map<Finger, IAutoMovieVector3> = wrists(mine[0]!);
    let cost: Map<Finger, number> = new Map(
      choices(mine[0]!).map((f: Finger): [Finger, number] => [f, 0]),
    );
    const back: Map<Finger, Finger>[] = [];
    for (let n: number = 1; n < mine.length; n++) {
      const current: Map<Finger, IAutoMovieVector3> = wrists(mine[n]!);
      const next: Map<Finger, number> = new Map();
      const from: Map<Finger, Finger> = new Map();
      for (const f of choices(mine[n]!)) {
        let best: number = Infinity;
        let arg: Finger = f;
        for (const [g, c] of cost) {
          const total: number =
            c +
            Vector3.length(
              Vector3.subtract(current.get(f)!, previous.get(g)!),
            );
          if (total < best) {
            best = total;
            arg = g;
          }
        }
        next.set(f, best);
        from.set(f, arg);
      }
      back.push(from);
      cost = next;
      previous = current;
    }
    let last: Finger = [...cost.entries()].reduce(
      (a: [Finger, number], b: [Finger, number]): [Finger, number] =>
        b[1] < a[1] ? b : a,
    )[0];
    for (let n: number = mine.length - 1; n >= 0; n--) {
      out[mine[n]!] = last;
      if (n > 0) last = back[n - 1]!.get(last)!;
    }
  }
  return out;
}
