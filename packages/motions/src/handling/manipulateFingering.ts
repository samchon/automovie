import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import { manipulate } from "./manipulate";

/**
 * The digits of a keyed contact sequence (`manipulate`): each contact's own
 * digit, or the Viterbi path over the five digits of its hand that minimizes
 * the wrist's total travel, the wrist standing where the digit's flat-hand tip
 * is on the site. The hand keeps one rotation for the act, so the wrist's
 * place for a digit is the site less the digit tip's offset in the hand's
 * rest frame, and a difference of two such places is the wrist's travel.
 *
 * @param body The body.
 * @param contacts The contacts with their sites.
 * @param sides Each contact's hand.
 * @returns Each contact's digit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the choice, its cost and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation An exact Viterbi path (dynamic programming over a chain of five-state stages) minimizing summed wrist travel, Handrix's stated outcome of keeping the wrist still (ElKoura and Singh 2003).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward pass and one back-trace per hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cost is a measured distance, with no weight; a contact that names its digit is kept.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in contacts times the square of the five digits.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array and retains nothing.
 */
export function manipulateFingering(
  body: IHumanBody,
  contacts: readonly manipulate.IContactAt[],
  sides: readonly HumanHand.Side[],
): manipulate.Finger[] {
  type Finger = manipulate.Finger;
  const out: Finger[] = new Array<Finger>(contacts.length);
  for (const side of ["left", "right"] as const) {
    const mine: number[] = contacts
      .map((_c: manipulate.IContactAt, i: number): number => i)
      .filter((i: number): boolean => sides[i] === side);
    if (mine.length === 0) continue;
    const choices: (i: number) => readonly Finger[] = (
      i: number,
    ): readonly Finger[] =>
      contacts[i]!.digit === undefined
        ? manipulate.FINGERS
        : [contacts[i]!.digit!];
    const wristAt: (i: number, f: Finger) => IAutoMovieVector3 = (
      i: number,
      f: Finger,
    ): IAutoMovieVector3 =>
      Vector3.subtract(
        contacts[i]!.point,
        HumanHand.offset(body, side, `${f}Tip` as HumanHand.Surface, "flat")
          .point,
      );
    let cost: Map<Finger, number> = new Map(
      choices(mine[0]!).map((f: Finger): [Finger, number] => [f, 0]),
    );
    const back: Map<Finger, Finger>[] = [];
    for (let n: number = 1; n < mine.length; n++) {
      const next: Map<Finger, number> = new Map();
      const from: Map<Finger, Finger> = new Map();
      for (const f of choices(mine[n]!)) {
        let best: number = Infinity;
        let arg: Finger = f;
        for (const [g, c] of cost) {
          const total: number =
            c +
            Vector3.length(
              Vector3.subtract(wristAt(mine[n]!, f), wristAt(mine[n - 1]!, g)),
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
