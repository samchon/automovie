import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { IPlaygroundViewerPublicationReader } from "../../../../packages/playground/src/viewer/IPlaygroundViewerPublicationReader";
import { loadSourceModule } from "../internal/loadSourceModule";

type State = { inputs: Record<string, string>; revision: string; error?: string };
type Read = (props: IPlaygroundViewerPublicationReader<State>) => State;
const read = loadSourceModule<{ readPlaygroundViewerPublishedSource: Read }>(
  path.resolve(__dirname, "../../../../packages/playground/src/viewer/readPlaygroundViewerPublishedSource.ts"),
).readPlaygroundViewerPublishedSource;

/**
 * A producer publication lock refuses new source admission while a completed
 * disk receipt remains held. Unlocking refreshes intermediate membership;
 * a transaction starting during that refresh also refuses admission.
 *
 * Scenarios:
 * 1. A live or retained lock refuses without refreshing or mutating held state.
 * 2. An unlocked completed receipt retains identity; an observed lock requires refresh.
 * 3. A lock appearing during refresh refuses the newly read receipt.
 * 4. Refresh failures propagate rather than certify previously held source.
 */
export function test_viewer_publication_admission(): void {
  for (const scenario of [
    { locks: [true], marker: "missing", refreshes: 0, refused: true, fail: false },
    { locks: [false, false], marker: "missing", refreshes: 0, refused: false, fail: false },
    { locks: [false, false], marker: "producer-lock-digest", refreshes: 1, refused: false, fail: false },
    { locks: [false, true], marker: "producer-lock-digest", refreshes: 1, refused: true, fail: false },
    { locks: [false], marker: "producer-lock-digest", refreshes: 1, refused: false, fail: true },
  ]) {
    const initial: State = { inputs: { publication: scenario.marker }, revision: "held" };
    const published: State = { inputs: { publication: "missing" }, revision: "completed" };
    let current = initial;
    let refreshes = 0;
    let lockReads = 0;
    const failure = new Error("disk refresh refused");
    let caught: unknown;
    let result: State | undefined;
    try {
      result = read({
        current: () => current, lockInput: "publication",
        locked: () => scenario.locks[lockReads++]!,
        refresh: () => { ++refreshes; if (scenario.fail) throw failure; current = published; },
      });
    } catch (error) { caught = error; }
    TestValidator.equals("publication refresh count", refreshes, scenario.refreshes);
    TestValidator.equals("held receipt stays untouched", initial, { inputs: { publication: scenario.marker }, revision: "held" });
    TestValidator.predicate("refresh failure identity", scenario.fail ? caught === failure : caught === undefined);
    if (!scenario.fail) {
      TestValidator.equals("publication refusal", result?.error !== undefined, scenario.refused);
      TestValidator.equals("source revision owner", result?.revision, refreshes ? "completed" : "held");
      if (!scenario.refused) TestValidator.predicate("completed receipt identity", result === current);
    }
  }
}
