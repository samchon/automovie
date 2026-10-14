import type { IHumanViewerSettleable } from "./IHumanViewerSettleable.js";

/**
 * Read until the off-request work the reading starts has all finished: each finished sidecar or view read can start an admission, so the loop ends only when one reading leaves every owner idle.
 *
 * @evidence contracts/common.md#principled-implementation Reads and then joins current background owners until one read starts no outstanding work, accounting for completed sidecars that initiate later admissions.
 * @evidence contracts/common.md#clear-and-simple-design The loop observes existing busy/settled capabilities without owning another job scheduler or cancelling the background owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time and a previous settled read cannot declare newly started admission complete; any owner rejection propagates.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies read-triggered follow-up work and the all-idle termination condition.
 * @evidence contracts/performance.md#efficient-algorithms For R rounds and O owners, fixed-state scans/join lists cost O(R*O) plus actual reads/tasks; R has no independent cap while new work keeps arriving.
 * @evidence contracts/performance.md#reuse-equivalent-work The loop waits on already running tasks instead of duplicating them, then rereads because their completion may have changed the catalogue or begun admissions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success joins every current task; Promise.all can reject while a sibling remains pending, whose owner keeps cleanup responsibility. Only the latest value/join list is local and cancellation or worker/file retirement remains owner-controlled.
 */
export async function settleHumanViewerInputs<T>(
  read: () => T,
  owners: readonly IHumanViewerSettleable[],
): Promise<T> {
  for (;;) {
    const value: T = read();
    if (owners.every((owner: IHumanViewerSettleable): boolean => !owner.busy()))
      return value;
    await Promise.all(
      owners.map(
        (owner: IHumanViewerSettleable): Promise<void> => owner.settled(),
      ),
    );
  }
}
