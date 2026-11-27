import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import { AutoMovieEngineXpbdMath } from "../AutoMovieEngineXpbdMath";
import type { IAutoMovieXpbdContactRow } from "./IAutoMovieXpbdContactRow";
import type { IAutoMovieXpbdPointImpulse } from "./IAutoMovieXpbdPointImpulse";
import type { IAutoMovieXpbdPointResponse } from "./IAutoMovieXpbdPointResponse";
import type { IAutoMovieXpbdResponder } from "./IAutoMovieXpbdResponder";

/*
 * A contact pair's row along a direction: its generalised inverse mass and the
 * move of both bodies by a multiplier, through their trees where they have one
 * (`respondXpbdArticulation`, Kokkevis 2004; Featherstone 2008, section 7.5,
 * both impulses acting together so a contact within one tree reads its own
 * coupling) and as rigid bodies otherwise.
 * Parameter trees: The pass's articulated response; each body alone when absent.
 * Parameter first: The first body.
 * Parameter second: The second body.
 * Parameter direction: The row's unit world direction, pushing the first body.
 * Parameter armA: The first body's world arm to the contact point, metres.
 * Parameter armB: The second body's world arm to the contact point, metres.
 * Returns: The row.
 */
export function pairXpbdContactRow(
  trees: IAutoMovieXpbdResponder | undefined,
  first: AutoMovieEngineXpbdBody,
  second: AutoMovieEngineXpbdBody,
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
      point: AutoMovieEngineVector3.add(first.center, armA),
      direction,
    });
  if (jointed[1])
    impulses.push({
      body: second,
      point: AutoMovieEngineVector3.add(second.center, armB),
      direction: AutoMovieEngineVector3.scale(direction, -1),
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
      (rigidFirst ? AutoMovieEngineXpbdMath.weight(first, direction, armA) : 0) +
      (rigidSecond ? AutoMovieEngineXpbdMath.weight(second, direction, armB) : 0),
    limit: (scale: number): boolean => response?.limit(scale) === true,
    apply: (scale: number): void => {
      response?.apply(scale);
      const p: IAutoMovieVector3 = AutoMovieEngineVector3.scale(direction, scale);
      if (rigidFirst) AutoMovieEngineXpbdMath.apply(first, null, p, armA, armA);
      if (rigidSecond)
        AutoMovieEngineXpbdMath.apply(second, null, AutoMovieEngineVector3.scale(p, -1), armB, armB);
    },
  };
}
