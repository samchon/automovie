import { AutoMovieComposition, type IAutoMovieIntent } from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import type { IRingCast } from "./IRingCast";

/**
 * One exchange: the attacker steps in to the range his strikes need while
 * his first strike is delivered, as a stepping jab carries its own step
 * (IBA), throws them, and each of the receiver's answers is aligned to the strike it meets,
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
 * @evidence docs/research/kickboxing/techniques.md#reach The attacker closes to the shortest range his combination needs before the first launch.
 * @evidence docs/research/kickboxing/exchanges.md#combinations Strikes chain at the combination intervals.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Range: the attacker steps in before an exchange.
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
  const range: number = KickboxingRange.combination(
    self.body.measure,
    other.body.measure,
    techniques,
  );
  const first = KickboxingAction.read(anchored[0]!);
  const seconds: number =
    first.kind === "strike" ? KickboxingTiming.delivery(first.technique) : 0;
  // A later kick that needs more room than the combination's range takes it
  // while it chambers: the support foot slides back to that kick's own range.
  // Punches never step back inside a combination.
  const room: AutoMovieComposition[] = anchored.flatMap(
    (intent: IAutoMovieIntent, k: number): AutoMovieComposition[] => {
      const strike = KickboxingAction.read(intent);
      if (k === 0 || strike.kind !== "strike") return [];
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[strike.technique];
      if (spec.limb !== "leg" || spec.shows) return [];
      const own: number = KickboxingRange.of(
        self.body.measure,
        other.body.measure,
        strike.technique,
      );
      if (own <= range) return [];
      const lead: number = KickboxingTiming.delivery(
        strike.technique,
        strike.follows,
      );
      const chamber: number = Math.min(lead, KickboxingTiming.KICK_CHAMBER);
      return [
        AutoMovieComposition.at(
          `${id}/${k}`,
          KickboxingAction.intent(attacker, {
            kind: "move",
            movement: "separate",
            steps: APPROACH_STEPS,
            range: own,
            seconds: chamber,
          }),
          -lead,
        ),
      ];
    },
  );
  return AutoMovieComposition.parallel(
    AutoMovieComposition.sequence(...anchored),
    ...aligned,
    ...room,
    KickboxingAction.intent(
      attacker,
      {
        kind: "move",
        movement: "approach",
        steps: APPROACH_STEPS,
        range,
        seconds,
      },
      `${id}/approach`,
    ),
  );
}

/** Steps of the step-in: the lead foot and the following rear foot, so the stance is restored at range. */
const APPROACH_STEPS: number = 2;

/** The intents of a chain, in order; only sequences of intents are exchange material. */
function flatten(node: AutoMovieComposition): IAutoMovieIntent[] {
  if (node.kind === "intent") return [node.intent];
  if (node.kind === "sequence") return node.parts.flatMap(flatten);
  throw new Error(
    `An exchange chain is a sequence of intents, not ${node.kind}`,
  );
}
