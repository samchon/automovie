import { AutoMovieComposition, type IAutoMovieIntent } from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import type { IRingCast } from "./IRingCast";

/**
 * One exchange as a range cycle: every strike carries its own entry, a
 * step-in, lunge or slide from its launch that brings the attacker from
 * where he stands into that strike's contact range, as a stepping jab
 * carries its own step (IBA); after the last strike he steps back out to
 * outside range. Each of the receiver's answers is aligned to the strike it meets,
 * starting at that strike's launch so its contact coincides with the
 * strike's contact. Strikes are anchored `<id>/<k>`; answers carry the anchor
 * they answer, so outcomes, contacts and reactions find their pair.
 *
 * ```ts
 * exchange(cast, "s01-b04", a.jab().cross().hook(), b.parry().cover().roll());
 * ```
 *
 * @param cast The cast.
 * @param id The beat's anchor, a stable prefix for the strike anchors.
 * @param attack The attacker's chain of strikes and feints.
 * @param defense The receiver's chain of answers, one per strike.
 * @returns The exchange's composition.
 * @throws When the counts differ, a chain mixes subjects or a part is not of its kind.
 * @evidence docs/research/kickboxing/techniques.md#defenses A defense begins at the attack's launch and completes by its contact.
 * @evidence docs/research/kickboxing/techniques.md#reach Each strike enters to its own range; the attacker exits to outside range.
 * @evidence docs/research/kickboxing/exchanges.md#combinations Strikes chain at the combination intervals.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Range: each strike's entry, then the step back out.
 */
export function exchange(
  cast: IRingCast,
  id: string,
  attack: { readonly node: AutoMovieComposition },
  defense: { readonly node: AutoMovieComposition },
): AutoMovieComposition {
  const strikes: IAutoMovieIntent[] = flatten(attack.node);
  const answers: IAutoMovieIntent[] = flatten(defense.node);
  if (strikes.length === 0 || strikes.length !== answers.length)
    throw new Error(
      `Exchange ${id} pairs ${strikes.length} strikes with ${answers.length} answers`,
    );
  const attacker: string = strikes[0]!.subject;
  const receiver: string = answers[0]!.subject;
  const fighters = [cast.a, cast.b];
  const self = fighters.find((f) => f.id === attacker);
  const other = fighters.find((f) => f.id === receiver);
  if (!self || !other || self === other)
    throw new Error(`Exchange ${id} needs both fighters`);
  const techniques: KickboxingTechnique.Name[] = [];
  const anchored: IAutoMovieIntent[] = strikes.map(
    (intent: IAutoMovieIntent, k: number): IAutoMovieIntent => {
      const action: KickboxingAction.IAction = KickboxingAction.read(intent);
      if (intent.subject !== attacker || action.kind !== "strike")
        throw new Error(
          `Exchange ${id}: part ${k} is not ${attacker}'s strike`,
        );
      techniques.push(action.technique);
      return KickboxingAction.intent(attacker, action, `${id}/${k}`);
    },
  );
  const aligned: AutoMovieComposition[] = answers.map(
    (intent: IAutoMovieIntent, k: number): AutoMovieComposition => {
      const action: KickboxingAction.IAction = KickboxingAction.read(intent);
      if (intent.subject !== receiver || action.kind !== "defend")
        throw new Error(
          `Exchange ${id}: answer ${k} is not ${receiver}'s defense`,
        );
      const strike = KickboxingAction.read(anchored[k]!);
      if (strike.kind !== "strike") throw new Error("unreachable");
      const lead: number = KickboxingTiming.delivery(
        strike.technique,
        strike.follows,
      );
      return AutoMovieComposition.at(
        `${id}/${k}`,
        KickboxingAction.intent(receiver, {
          kind: "answer",
          answer: action.answer,
          against: strike.technique,
          lead,
          strike: `${id}/${k}`,
          ...(action.ready === undefined ? {} : { ready: action.ready }),
        }),
        -lead,
      );
    },
  );
  const cycle = KickboxingRange.cycle(
    self.body.measure,
    other.body.measure,
    techniques,
  );
  // Each strike carries its own entry from its launch: a punch's step-in or
  // drag lands with the punch, a kick's switch or slide is done by its
  // chamber key, so the body arrives at that strike's own range.
  const entries: AutoMovieComposition[] = anchored.map(
    (intent: IAutoMovieIntent, k: number): AutoMovieComposition => {
      const strike = KickboxingAction.read(intent);
      if (strike.kind !== "strike") throw new Error("unreachable");
      const lead: number = KickboxingTiming.delivery(
        strike.technique,
        strike.follows,
      );
      // A kick's step is done by its chamber key, so it kicks from a planted
      // support foot; a punch's step lands with the punch.
      const kick: boolean =
        KickboxingTechnique.performed(
          KickboxingTechnique.table[strike.technique],
        ).limb === "leg";
      const seconds: number = kick
        ? Math.min(lead, KickboxingTiming.KICK_CHAMBER)
        : lead;
      return AutoMovieComposition.at(
        `${id}/${k}`,
        KickboxingAction.intent(
          attacker,
          {
            kind: "move",
            movement: "approach",
            steps: ENTRY_STEPS,
            range: cycle.entries[k]!,
            seconds,
          },
          `${id}/${k}/entry`,
        ),
        -lead,
      );
    },
  );
  // After the last strike the attacker steps straight back out to outside
  // range in one push-off beat, the front foot driving him out and the other
  // following; straight back along the line keeps him clear of the referee
  // standing side-on, and the resets take the angles.
  const exit: IAutoMovieIntent = KickboxingAction.intent(attacker, {
    kind: "move",
    movement: "separate",
    steps: ENTRY_STEPS,
    range: cycle.exit,
    seconds: KickboxingTiming.STEP_PERIOD,
  });
  return AutoMovieComposition.parallel(
    AutoMovieComposition.sequence(...anchored, exit),
    ...aligned,
    ...entries,
  );
}

/** Steps of an entry or exit: the lead foot and the following rear foot, so the stance is restored at range. */
const ENTRY_STEPS: number = 2;

/** The intents of a chain, in order; only sequences of intents are exchange material. */
function flatten(node: AutoMovieComposition): IAutoMovieIntent[] {
  if (node.kind === "intent") return [node.intent];
  if (node.kind === "sequence") return node.parts.flatMap(flatten);
  throw new Error(
    `An exchange chain is a sequence of intents, not ${node.kind}`,
  );
}
