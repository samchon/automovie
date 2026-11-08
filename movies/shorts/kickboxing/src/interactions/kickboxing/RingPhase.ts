import {
  AutoMovieComposition,
  type IAutoMovieIntent,
  resolveAutoMovieSchedule,
} from "@automovie/engine";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { boutTiming } from "./boutTiming";

/**
 * A fifteen-second phase of the round: the scene's exchanges in order with
 * the footwork between them, timed so the phase fills its window exactly.
 * The scene names each reset's movements (circle, press and give, pivot,
 * centre, escape); the phase gives every reset the same share of the time
 * the exchanges leave, in whole steps, and absorbs the remainder below one
 * step as a held guard before the last exchange, so absolute time is only
 * the screenplay's phase boundary.
 *
 * ```ts
 * RingPhase.fill(15, [
 *   RingPhase.reset([a, "circle"]),
 *   exchange(cast, "s01-b04", a.jab().cross().hook(), b.parry().cover().roll()),
 * ]);
 * ```
 *
 * @evidence docs/research/kickboxing/exchanges.md#activity Movement between attacks fills about half of a round; exchanges are 3.4 ± 1.2 s apart.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements The movements of the resets.
 * @evidence docs/research/kickboxing/ring-generalship.md#step Whole steps at two per second.
 */
export namespace RingPhase {
  /** The capability name of a reset placeholder. */
  const PLACEHOLDER: number = 0;

  /**
   * A reset: movements of one or both fighters performed together; the phase gives it its steps.
   *
   * @param moves Each mover and his movement.
   * @returns The reset's placeholder composition.
   * @evidence docs/research/kickboxing/ring-generalship.md#movements Circle, press, give, pivot, centre and escape.
   */
  export function reset(
    ...moves: [Fighter, KickboxingAction.Movement][]
  ): AutoMovieComposition {
    return AutoMovieComposition.parallel(
      ...moves.map(([fighter, movement]) =>
        KickboxingAction.intent(fighter.id, {
          kind: "move",
          movement,
          steps: PLACEHOLDER,
        }),
      ),
    );
  }

  /**
   * The phase's composition, filling `seconds` exactly.
   *
   * @param seconds The window's length, from the screenplay's phase boundaries.
   * @param parts Exchanges, resets and any other parts, in screenplay order.
   * @param last When set, the anchor whose contact must land exactly at the window's end; the parts after it may run past the end.
   * @returns The phase's sequence.
   * @throws When the exchanges leave less than two steps for each reset.
   * @evidence docs/research/kickboxing/ring-generalship.md#step A reset is at least two steps, so both feet restore the stance.
   */
  export function fill(
    seconds: number,
    parts: readonly AutoMovieComposition[],
    last?: string,
  ): AutoMovieComposition {
    const resets: number = parts.filter(isReset).length;
    if (resets === 0)
      throw new Error("A phase needs a reset to fill its window");
    const fixed: number = parts
      .filter((p) => !isReset(p))
      .reduce((sum, p) => sum + measure(p, last), 0);
    const share: number = (seconds - fixed) / resets;
    const steps: number = Math.floor(
      share / KickboxingTiming.STEP_PERIOD + 1e-9,
    );
    if (steps < 2)
      throw new Error(
        `An overfull phase leaves ${share.toFixed(2)} s per reset`,
      );
    const remainder: number =
      seconds - fixed - resets * steps * KickboxingTiming.STEP_PERIOD;
    const filled: AutoMovieComposition[] = parts.map((p) =>
      isReset(p) ? assign(p, steps) : p,
    );
    // The remainder is a held guard of both fighters before the last part.
    const movers: string[] = [
      ...new Set(
        parts
          .filter(isReset)
          .flatMap(intents)
          .map((i) => i.subject),
      ),
    ];
    const hold: AutoMovieComposition = AutoMovieComposition.parallel(
      ...movers.map((subject) =>
        KickboxingAction.intent(subject, {
          kind: "phase",
          phase: "guard",
          seconds: remainder,
        }),
      ),
    );
    return AutoMovieComposition.sequence(
      ...filled.slice(0, -1),
      hold,
      filled[filled.length - 1]!,
    );
  }

  /** Seconds a part takes in sequence, or until the anchor's contact when it holds the anchor. */
  function measure(part: AutoMovieComposition, last?: string): number {
    const schedule = resolveAutoMovieSchedule(part, { timing: boutTiming });
    const anchor =
      last === undefined
        ? undefined
        : schedule.entries.find((e) => e.intent.anchor === last);
    if (anchor) return anchor.contact ?? anchor.start;
    return schedule.duration;
  }

  function isReset(part: AutoMovieComposition): boolean {
    return (
      part.kind === "parallel" &&
      part.parts.length > 0 &&
      part.parts.every((p) => {
        if (p.kind !== "intent" || p.intent.capability !== "move") return false;
        const action: KickboxingAction.IAction = KickboxingAction.read(
          p.intent,
        );
        return action.kind === "move" && action.steps === PLACEHOLDER;
      })
    );
  }

  function intents(part: AutoMovieComposition): IAutoMovieIntent[] {
    return part.kind === "intent"
      ? [part.intent]
      : part.kind === "at"
        ? intents(part.part)
        : part.parts.flatMap(intents);
  }

  function assign(
    part: AutoMovieComposition,
    steps: number,
  ): AutoMovieComposition {
    return AutoMovieComposition.parallel(
      ...intents(part).map((intent) => {
        const action: KickboxingAction.IAction = KickboxingAction.read(intent);
        if (action.kind !== "move") throw new Error("unreachable");
        return KickboxingAction.intent(intent.subject, { ...action, steps });
      }),
    );
  }
}
