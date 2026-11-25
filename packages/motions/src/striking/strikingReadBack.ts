import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The refusal of a strike, a defence or a stopped limb's ride that is read back
 * while it is being planned: planning it reads another performer, and placing
 * that performer reads this action again at the same instant, most often
 * through a reaction synced to this action's hit in the struck performer's own
 * chain. The strikers' chains are placed before the struck performer's, so a
 * reaction synced to a hit is composed in a chain of its own after the
 * strikers' chains.
 *
 * @param action The action read back: `punch`, `kick`, `defend` or the stopped
 *   limb's ride.
 * @param subject The performer who acts; absent, the performance locates the
 *   refusal.
 * @returns The refusal, with the sync as its axis.
 */
export function strikingReadBack(
  action: string,
  subject?: string,
): HumanRefusal {
  return new HumanRefusal({
    kind: "participant",
    ...(subject === undefined ? {} : { performer: subject, act: action }),
    axis: "sync",
    value: action,
    feasible: null,
    reason: `the ${action} reads another performer whose placement reads the ${action} back at the same instant`,
    fix: "compose the reaction synced to this hit in a chain of its own, after the strikers' chains",
  });
}
