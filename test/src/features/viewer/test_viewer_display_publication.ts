import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { createViewerDisplayPublication } = loadSourceModule<{
  createViewerDisplayPublication: (ports: {
    copy: () => boolean;
    start: (session: string, generation: number) => void;
    release: () => void;
  }) => {
    active: () => boolean;
    prepare: () => boolean;
    commit: (session: string, generation: number) => boolean;
    changed: () => boolean;
    dispose: () => void;
  };
}>(path.resolve(__dirname, "../../../../packages/viewer/src/createViewerDisplayPublication.ts"));

/**
 * A staged candidate cannot start a newer-generation save before activation.
 * The real publication lifecycle is exercised through its owned bitmap ports,
 * without a browser, renderer, artificial pixels or filesystem publication.
 * Scenarios:
 * 1. Refused copies and uncommitted changes start no upload.
 * 2. Repeated staging copies only the latest bitmap; activation reuses it.
 * 3. Active changes and direct commitments copy before starting their identity.
 * 4. Candidate rejection disposes once and forbids every later publication.
 */
export const test_viewer_display_publication = (): void => {
  let accepts = false;
  let copies = 0;
  let releases = 0;
  const starts: Array<[string, number]> = [];
  const ports = {
    copy: (): boolean => { ++copies; return accepts; },
    start: (session: string, generation: number): void => { starts.push([session, generation]); },
    release: (): void => { ++releases; },
  };
  const candidate = createViewerDisplayPublication(ports);
  TestValidator.equals("live lifecycle", candidate.active(), true);
  TestValidator.equals("uncommitted change", candidate.changed(), false);
  TestValidator.equals("refused prepare", candidate.prepare(), false);
  TestValidator.equals("refused direct commit", candidate.commit("page", 2), false);
  TestValidator.equals("refused copies never upload", starts, []);
  accepts = true;
  TestValidator.equals("first staging", candidate.prepare(), true);
  TestValidator.equals("latest staging", candidate.prepare(), true);
  const stagedCopies = copies;
  TestValidator.equals("staging does not publish a generation", starts, []);
  TestValidator.equals("activation admits prepared pixels", candidate.commit("page", 2), true);
  TestValidator.equals("activation does not recopy cleared native pixels", copies, stagedCopies);
  TestValidator.equals("admitted generation", starts, [["page", 2]]);
  TestValidator.equals("active frame cannot become provisional", candidate.prepare(), false);
  accepts = false;
  TestValidator.equals("failed active copy", candidate.changed(), false);
  TestValidator.equals("failed active copy starts no upload", starts.length, 1);
  accepts = true;
  TestValidator.equals("actual active change", candidate.changed(), true);
  TestValidator.equals("active identity retained", starts[1], ["page", 2]);
  TestValidator.equals("direct newer commitment", candidate.commit("page", 3), true);
  TestValidator.equals("direct identity", starts[2], ["page", 3]);
  const rejected = createViewerDisplayPublication(ports);
  TestValidator.equals("rejected candidate can first stage", rejected.prepare(), true);
  const beforeReject = starts.length;
  rejected.dispose(); rejected.dispose();
  TestValidator.equals("rejection releases its one pending bitmap once", releases, 1);
  TestValidator.equals("disposed lifecycle", rejected.active(), false);
  TestValidator.equals("rejected stage", rejected.prepare(), false);
  TestValidator.equals("rejected activation", rejected.commit("page", 4), false);
  TestValidator.equals("rejected change", rejected.changed(), false);
  TestValidator.equals("rejected generation never reaches upload", starts.length, beforeReject);
  TestValidator.equals("retained generation still publishes after candidate rejection", candidate.changed(), true);
  TestValidator.equals("retained generation identity", starts[starts.length - 1], ["page", 3]);
  const direct = createViewerDisplayPublication(ports);
  TestValidator.equals("direct active display preserves commit-copy behavior", direct.commit("direct", 1), true);
  TestValidator.equals("direct display identity", starts[starts.length - 1], ["direct", 1]);
  const retainedStage = createViewerDisplayPublication(ports);
  TestValidator.equals("valid staged snapshot", retainedStage.prepare(), true);
  accepts = false;
  TestValidator.equals("later staged copy refuses", retainedStage.prepare(), false);
  const refusedCopies = copies;
  TestValidator.equals("prior valid staged bitmap remains admissible", retainedStage.commit("retained", 1), true);
  TestValidator.equals("prior valid pixels are reused", copies, refusedCopies);
  TestValidator.equals("retained snapshot identity", starts[starts.length - 1], ["retained", 1]);
};
