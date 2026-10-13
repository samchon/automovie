import type { IHumanViewerSettleable } from "./IHumanViewerSettleable.js";

/**
 * Read until the off-request work the reading starts has all finished: each
 * finished sidecar or view read can start an admission, so the loop ends only
 * when one reading leaves every owner idle.
 */
export async function settleHumanViewerInputs<T>(
  read: () => T,
  owners: readonly IHumanViewerSettleable[],
): Promise<T> {
  for (;;) {
    const value = read();
    if (owners.every((owner) => !owner.busy())) return value;
    await Promise.all(owners.map((owner) => owner.settled()));
  }
}
