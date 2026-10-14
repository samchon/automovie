import { TestValidator } from "@nestia/e2e";

import { readPlaygroundViewerPublishedSource as read } from "../../../../packages/playground/src/viewer/readPlaygroundViewerPublishedSource";

type State = {
  inputs: Record<string, string>;
  revision: string;
  error?: string;
};

/**
 * A producer publication lock refuses new source admission while the completed receipt remains held. Unlocking refreshes membership that witnessed a lock; a transaction starting during that refresh also refuses admission.
 *
 * Scenarios:
 * 1. A live or retained lock refuses without refreshing or mutating held state.
 * 2. An unlocked completed receipt retains identity; an observed lock requires refresh.
 * 3. A lock appearing during refresh refuses the newly read receipt.
 * 4. Refresh failures propagate rather than certify previously held source.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual publication admission reader with its existing receipt/lock/refresh effects and observes refresh count, retained receipt fields and identity, refusal shells, selected revision and original refresh failure. It detects stale receipt admission after a witnessed lock or mutation of the held receipt.
 * @evidence contracts/testing.md#independent-expectations Authored lock observations and missing-versus-lock digest witnesses determine whether a refresh and refusal are required; held/completed object identities and the independent Error are input premises, not saved outputs. Two lock observations do not prove an atomic filesystem snapshot or retained rendered pixels.
 * @evidence contracts/testing.md#distinguishing-cases Retains a live lock, an unlocked receipt without a witness, post-lock refresh, a lock starting during refresh and refresh failure. Real producer locking, disk membership and renderer rollback remain their owners' responsibilities.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_viewer_publication_admission entry owns all five existing rows and portable injected observations; it installs no consumer, builds no native artifact and starts no process, filesystem, browser or GPU host.
 */
export function test_viewer_publication_admission(): void {
  for (const scenario of [
    {
      locks: [true],
      marker: "missing",
      refreshes: 0,
      refused: true,
      fail: false,
    },
    {
      locks: [false, false],
      marker: "missing",
      refreshes: 0,
      refused: false,
      fail: false,
    },
    {
      locks: [false, false],
      marker: "producer-lock-digest",
      refreshes: 1,
      refused: false,
      fail: false,
    },
    {
      locks: [false, true],
      marker: "producer-lock-digest",
      refreshes: 1,
      refused: true,
      fail: false,
    },
    {
      locks: [false],
      marker: "producer-lock-digest",
      refreshes: 1,
      refused: false,
      fail: true,
    },
  ]) {
    const initial: State = {
      inputs: { publication: scenario.marker },
      revision: "held",
    };
    const published: State = {
      inputs: { publication: "missing" },
      revision: "completed",
    };
    let current: State = initial;
    let refreshes: number = 0;
    let lockReads: number = 0;
    const failure: Error = new Error("disk refresh refused");
    let caught: unknown;
    let result: State | undefined;
    try {
      result = read({
        current: (): State => current,
        lockInput: "publication",
        locked: (): boolean => scenario.locks[lockReads++]!,
        refresh: (): void => {
          ++refreshes;
          if (scenario.fail) throw failure;
          current = published;
        },
      });
    } catch (error) {
      caught = error;
    }
    TestValidator.equals(
      "publication refresh count",
      refreshes,
      scenario.refreshes,
    );
    TestValidator.equals("held receipt stays untouched", initial, {
      inputs: { publication: scenario.marker },
      revision: "held",
    });
    TestValidator.predicate(
      "refresh failure identity",
      scenario.fail ? caught === failure : caught === undefined,
    );
    if (!scenario.fail) {
      TestValidator.equals(
        "publication refusal",
        result?.error !== undefined,
        scenario.refused,
      );
      TestValidator.equals(
        "source revision owner",
        result?.revision,
        refreshes ? "completed" : "held",
      );
      if (!scenario.refused)
        TestValidator.predicate(
          "completed receipt identity",
          result === current,
        );
    }
  }
}
