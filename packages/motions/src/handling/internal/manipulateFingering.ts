import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../../everyday/internal/typeText";
import { manipulate } from "./manipulate";
import { manipulateReach } from "./manipulateReach";

/**
 * The digits of a keyed contact sequence (`manipulate`): each contact's own
 * digit, or the Viterbi path over the five digits of its hand that minimizes
 * the travel of the limiting part over each stroke, accounting for the lift and
 * descent of a reused digit. The wrist stands where the plan places it for that
 * digit's press (`manipulateReach`, in the rotation the hand keeps for the
 * act), so a difference of two such places is the wrist's travel.
 *
 * @param body The body.
 * @param contacts The contacts with their sites.
 * @param sides Each contact's hand.
 * @param rotation Each hand's rotation for the act, from its rest.
 * @returns Each contact's digit.
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
    if (
      mine.every(
        (index: number): boolean => contacts[index]!.digit !== undefined,
      )
    ) {
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
      manipulateReach.prepare(body, side, rotation[side], manipulate.FINGERS);
    const wristAt: (i: number, f: Finger) => IAutoMovieVector3 = (
      i: number,
      f: Finger,
    ): IAutoMovieVector3 =>
      reach(f, contacts[i]!.point, contacts[i]!.normal, contacts[i]!.depth);
    const wrists: (index: number) => Map<Finger, IAutoMovieVector3> = (
      index: number,
    ): Map<Finger, IAutoMovieVector3> =>
      new Map(
        choices(index).map((finger: Finger): [Finger, IAutoMovieVector3] => [
          finger,
          wristAt(index, finger),
        ]),
      );
    let previous: Map<Finger, IAutoMovieVector3> = wrists(mine[0]!);
    let cost: Map<Finger, number> = new Map(
      choices(mine[0]!).map((f: Finger): [Finger, number] => [f, 0]),
    );
    const back: Map<Finger, Finger>[] = [];
    for (let n: number = 1; n < mine.length; n++) {
      const current: Map<Finger, IAutoMovieVector3> = wrists(mine[n]!);
      const released: IAutoMovieMotionHumanManipulate.IContactAt =
        contacts[mine[n - 1]!]!;
      const pressed: IAutoMovieMotionHumanManipulate.IContactAt =
        contacts[mine[n]!]!;
      const lift: number = released.depth + typeText.HOVER;
      const drop: number = pressed.depth + typeText.HOVER;
      const sequential: number = Math.hypot(
        Vector3.distance(pressed.point, released.point),
        lift + drop,
      );
      const concurrent: number = Math.max(lift, drop);
      const next: Map<Finger, number> = new Map();
      const from: Map<Finger, Finger> = new Map();
      for (const f of choices(mine[n]!)) {
        let best: number = Infinity;
        let arg: Finger = f;
        for (const [g, c] of cost) {
          const travel: number = Vector3.distance(
            current.get(f)!,
            previous.get(g)!,
          );
          // Distinct digits can release and descend concurrently. A reused
          // tip must travel through its hover plane between both key bottoms.
          const tip: number = f === g ? sequential : concurrent;
          const total: number = c + Math.max(travel, tip);
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
