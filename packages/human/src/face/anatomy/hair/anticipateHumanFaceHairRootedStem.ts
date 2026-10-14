import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedLookahead } from "./IHumanFaceHairRootedLookahead";
import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";
import { escapeHumanFaceHairRootedStem } from "./escapeHumanFaceHairRootedStem";
import { humanFaceHairConstructionTurn } from "./humanFaceHairConstructionTurn";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

/**
 * Decide, one station ahead, whether a rooted stem must begin turning now to clear a surface on its heading.
 *
 * Under the construction curvature a stem turns at most turn(h) per nominal chord h, so turning by θ takes about θ / turn(h) chords. The look-ahead follows the stem's own default continuation, chord by chord, over one chord plus the arc of a quarter turn: each simulated chord turns toward the outward normal at its station by the construction turn, as the integrator's stem does, so skin that curves into the path is found even where a straight ray along the heading would miss it. The first surface a simulated chord reaches gives, with the station's skin normal, the maximum-margin escape direction.
 *
 * The deferred plan is then checked as the integrator would admit it: keep the heading for this chord, then chords of length h each turning toward the escape direction by at most turn(h) from the previous chord until it is reached, every chord unobstructed along its whole length (an unclipped exterior interval). The heading is kept while deferring is admissible; otherwise this station begins the turn by its full construction turn, because waiting would leave no admissible turn. Whether the turned chord is itself admissible stays with the integrator's interval, progress rule and empty-cone refusal. The returned decision names which case applied, so a stem refusal can report it.
 *
 * Each station turns at most its construction turn, so the turn is spread over the stations before an obstacle instead of becoming a kink. Nothing is admitted here; the exterior interval still certifies every real chord. Every ray spends one unit of the shared lock budget. Inputs are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Curved default continuation casts locate the first blocker, then a turn-bounded deferred path is ray-checked before choosing clear, deferred or turned.
 * @evidence contracts/common.md#clear-and-simple-design This preview chooses timing while the integrator's exterior interval and progress checks still admit actual chords.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every ray spends the same lock budget and exhaustion throws; the quarter-turn lookahead horizon is a numerical construction policy, not proof of all future clearance.
 * @evidence contracts/common.md#meaningful-documentation Nominal step is metres, directions are unit, returned plan names the chosen case and blocker normal is null when clear.
 * @evidence contracts/performance.md#efficient-algorithms Preview cost follows lookahead distance divided by step plus angular-turn chord count and the ray query cost; budget limits casts, while contact samples also incur query work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing collider readers are borrowed and local cast logic is shared by search and deferred-plan checks; independent stations currently replay their previews.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller budget is mutated, with vectors and decision records caller-owned; no preview history or query index survives in a module cache.
 */
export function anticipateHumanFaceHairRootedStem(
  props: IHumanFaceHairRootedLookahead,
): IHumanFaceHairRootedLookaheadDecision {
  const turn: number = humanFaceHairConstructionTurn(props.step);
  const radius: number = props.step / turn;
  const cast: (
    from: IAutoMovieVector3,
    along: IAutoMovieVector3,
    range: number,
  ) => ReturnType<typeof props.raycaster.nearestHit> = (
    from: IAutoMovieVector3,
    along: IAutoMovieVector3,
    range: number,
  ): ReturnType<typeof props.raycaster.nearestHit> => {
    if (props.budget.remaining === 0)
      throw new Error(
        "Numerical hair exhausted its rooted transition budget during look-ahead.",
      );
    props.budget.remaining--;
    return props.raycaster.nearestHit(
      [from.x, from.y, from.z],
      [along.x, along.y, along.z],
      range,
    );
  };
  // Follow the stem's own default continuation (each chord turning toward
  // the outward normal at its station by the construction turn) over one chord
  // plus the arc of a quarter turn, so skin curving into the path is found
  // even when a straight ray along the heading would miss it.
  let blocking: IAutoMovieVector3 | undefined;
  {
    let at: IAutoMovieVector3 = props.point;
    let along: IAutoMovieVector3 = props.heading;
    for (
      let travelled: number = 0;
      travelled < props.step + (Math.PI / 2) * radius;
      travelled += props.step
    ) {
      const hit: ReturnType<typeof cast> = cast(at, along, props.step);
      if (hit !== null) {
        const reached: ReturnType<typeof props.contact.sample> =
          props.contact.sample(
            Vector3.add(at, Vector3.scale(along, hit.distance)),
          );
        blocking = Vector3.normalize(
          Vector3.create(
            reached.normal[0],
            reached.normal[1],
            reached.normal[2],
          ),
        );
        break;
      }
      at = Vector3.add(at, Vector3.scale(along, props.step));
      along = limitHumanFaceHairTurn({
        before: along,
        direction: props.contact.outward(at, props.contact.sample(at)),
        step: props.step,
      });
    }
  }
  if (blocking === undefined)
    return { direction: props.heading, plan: "clear", blocking: null };
  const escape: IAutoMovieVector3 = escapeHumanFaceHairRootedStem(
    props.normal,
    blocking,
  );
  // Chords needed to rotate the whole angle from the heading to the escape
  // direction, plus the chord that follows it; a quarter turn bounds the angle
  // the look-ahead range was chosen for.
  const angle: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(props.before, escape))),
  );
  const chords: number = Math.ceil(Math.min(angle, Math.PI) / turn) + 2;
  const admissible: (first: IAutoMovieVector3) => boolean = (
    first: IAutoMovieVector3,
  ): boolean => {
    let at: IAutoMovieVector3 = props.point;
    let along: IAutoMovieVector3 = first;
    for (let chord: number = 0; chord < chords; chord++) {
      if (cast(at, along, props.step) !== null) return false;
      at = Vector3.add(at, Vector3.scale(along, props.step));
      along = limitHumanFaceHairTurn({
        before: along,
        direction: escape,
        step: props.step,
      });
    }
    return true;
  };
  if (admissible(props.heading))
    return { direction: props.heading, plan: "deferred", blocking };
  return {
    direction: limitHumanFaceHairTurn({
      before: props.before,
      direction: escape,
      step: props.step,
    }),
    plan: "turned",
    blocking,
  };
}
