import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import type { IAutoMovieXpbdContactRow } from "./IAutoMovieXpbdContactRow";
import type { IAutoMovieXpbdPointImpulse } from "./IAutoMovieXpbdPointImpulse";
import type { IAutoMovieXpbdPointResponse } from "./IAutoMovieXpbdPointResponse";
import type { IAutoMovieXpbdResponder } from "./IAutoMovieXpbdResponder";

/**
 * A contact pair's row along a direction: its generalised inverse mass and the
 * move of both bodies by a multiplier, through their trees where they have one
 * (`respondXpbdArticulation`, Kokkevis 2004; Featherstone 2008, section 7.5,
 * both impulses acting together so a contact within one tree reads its own
 * coupling) and as rigid bodies otherwise.
 *
 * @param trees The pass's articulated response; each body alone when absent.
 * @param first The first body.
 * @param second The second body.
 * @param direction The row's unit world direction, pushing the first body.
 * @param armA The first body's world arm to the contact point, metres.
 * @param armB The second body's world arm to the contact point, metres.
 * @returns The row.
 */
export function pairXpbdContactRow(
  trees: IAutoMovieXpbdResponder | undefined,
  first: AutoMovieXpbdBody,
  second: AutoMovieXpbdBody,
  direction: IAutoMovieVector3,
  armA: IAutoMovieVector3,
  armB: IAutoMovieVector3,
): IAutoMovieXpbdContactRow {
  const jointed: readonly boolean[] = [
    trees?.has(first) === true,
    trees?.has(second) === true,
  ];
  const impulses: IAutoMovieXpbdPointImpulse[] = [];
  if (jointed[0])
    impulses.push({
      body: first,
      point: Vector3.add(first.center, armA),
      direction,
    });
  if (jointed[1])
    impulses.push({
      body: second,
      point: Vector3.add(second.center, armB),
      direction: Vector3.scale(direction, -1),
    });
  const response: IAutoMovieXpbdPointResponse | null =
    impulses.length === 0 ? null : trees!.respond(impulses);

  // A body no tree answers for moves rigidly, as it did alone.
  const tree: boolean = response !== null;
  const rigidFirst: boolean = !(tree && jointed[0]);
  const rigidSecond: boolean = !(tree && jointed[1]);
  return {
    weight:
      (response?.weight ?? 0) +
      (rigidFirst ? AutoMovieXpbdMath.weight(first, direction, armA) : 0) +
      (rigidSecond ? AutoMovieXpbdMath.weight(second, direction, armB) : 0),
    limit: (scale: number): boolean => response?.limit(scale) === true,
    apply: (scale: number): void => {
      response?.apply(scale);
      const p: IAutoMovieVector3 = Vector3.scale(direction, scale);
      if (rigidFirst) AutoMovieXpbdMath.apply(first, null, p, armA, armA);
      if (rigidSecond)
        AutoMovieXpbdMath.apply(second, null, Vector3.scale(p, -1), armB, armB);
    },
  };
}
