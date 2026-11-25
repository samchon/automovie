import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicsCache,
} from "@automovie/interface";

import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";

/**
 * Keep, after one completed fixed step, everything a later edit resumes from
 * (`restorePhysicalSimulationCheckpoint` reads it back): the native world's
 * snapshot, the controller's contact and target state and the balance
 * controller's recovery state, each under the step in the cache.
 *
 * The contact ledger itself is not copied: the controller record keeps its
 * length and, for each episode still open, its metadata and the count of its
 * samples so far, so samples the episode gains later never reach a resumed run.
 * Plans, handoffs and recovery state are cloned, so later steps cannot change
 * them; the sets and lists are copied into new arrays.
 *
 * @param input The run's cache, written; its world and binding after the step;
 *   the open contact episodes by pair key and the softened tracking's end
 *   seconds by body/bone key, both read; and the completed step.
 */
export function capturePhysicalSimulationCheckpoint(input: {
  cache: IAutoMoviePhysicsCache;
  world: AutoMovieXpbdWorld;
  bound: Pick<
    Bound,
    | "released"
    | "contactReleased"
    | "planned"
    | "supportPlanned"
    | "contactTargets"
    | "handoffs"
  >;
  active: ReadonlyMap<string, IAutoMovieContactReceipt>;
  softened: ReadonlyMap<string, number>;
  step: number;
}): void {
  const { cache, world, bound, active, softened, step } = input;
  cache.checkpoints.set(step, world.takeSnapshot());
  cache.controllerCheckpoints.set(step, {
    contactCount: cache.contacts.length,
    episodes: [...active.values()].map(
      (
        value: IAutoMovieContactReceipt,
      ): {
        receipt: Omit<IAutoMovieContactReceipt, "samples">;
        sampleCount: number;
      } => {
        const { samples, ...receipt }: IAutoMovieContactReceipt = value;
        return {
          receipt: structuredClone(receipt),
          sampleCount: samples!.length,
        };
      },
    ),
    active: [...active].map(
      ([key, receipt]: [string, IAutoMovieContactReceipt]): [
        string,
        string,
      ] => [key, receipt.id],
    ),
    softened: [...softened],
    released: [...bound.released],
    contactReleased: [...bound.contactReleased],
    balanceTargets: structuredClone(Object.fromEntries(bound.planned)),
    supportTargets: structuredClone(Object.fromEntries(bound.supportPlanned)),
    contactTargets: structuredClone(Object.fromEntries(bound.contactTargets)),
    handoffs: structuredClone(Object.fromEntries(bound.handoffs)),
    ownershipCount: cache.ownership.length,
  });
  cache.balanceCheckpoints.set(step, structuredClone(cache.recovery));
}
