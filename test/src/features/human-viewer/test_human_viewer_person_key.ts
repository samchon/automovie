import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanViewerPersonKey } from "../../../scripts/human-viewer/humanViewerPersonKey";

/**
 * A composed packet has one numerical identity across published and file inputs.
 *
 * Scenarios:
 * 1. Equal admitted input tuples replay the same key without mutation.
 * 2. Either basis, either isolated runtime, the compositor or the document
 *    independently changes the packet key.
 * 3. Tuple boundaries distinguish adjacent short diagnostic digests whose
 *    naive concatenation would collide.
 */
export const test_human_viewer_person_key = (): void => {
  const document: IAutoMovieHumanPersonDocument = {
    id: "whole",
    name: "Whole person",
    face: { id: "face", name: "Face", basis: "face-basis", shape: {}, expression: {} },
    body: { id: "body", name: "Body", basis: "body-basis", shape: {} },
  };
  const bases = { face: { digest: "face-bytes" }, body: { digest: "body-bytes" } };
  const sources = { face: "face-code", body: "body-code", person: "composition-code" };
  const props = { document, bases, sources };
  const before = JSON.stringify(props);
  const original = humanViewerPersonKey(props);
  TestValidator.equals("same tuple replays", humanViewerPersonKey(props), original);
  for (const domain of ["face", "body"] as const) {
    TestValidator.predicate(domain + " basis participates", humanViewerPersonKey({
      ...props, bases: { ...bases, [domain]: { digest: domain + "-new-bytes" } },
    }) !== original);
  }
  for (const domain of ["face", "body", "person"] as const) {
    TestValidator.predicate(domain + " runtime participates", humanViewerPersonKey({
      ...props, sources: { ...sources, [domain]: domain + "-new-code" },
    }) !== original);
  }
  TestValidator.predicate("document participates", humanViewerPersonKey({
    ...props, document: { ...document, body: { ...document.body, id: "other-body" } },
  }) !== original);
  const first = humanViewerPersonKey({ ...props, sources: { ...sources, face: "a", body: "bc" } });
  const second = humanViewerPersonKey({ ...props, sources: { ...sources, face: "ab", body: "c" } });
  TestValidator.predicate("tuple boundaries preserve authority", first !== second);
  TestValidator.equals("inputs remain caller-owned", JSON.stringify(props), before);
};
