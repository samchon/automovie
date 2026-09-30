import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

import { classifyHumanViewerInput } from "../../../scripts/human-viewer/classifyHumanViewerInput";
import { readHumanViewerBasisIdentity } from "../../../scripts/human-viewer/readHumanViewerBasisIdentity";
import { readHumanViewerInputs } from "../../../scripts/human-viewer/readHumanViewerInputs";
import { throwsError } from "../internal/predicates";

const basisFile = (id: string) => gzipSync(JSON.stringify({ id, surfaces: [] }));
const bases = {
  face: { id: "face-basis", digest: "f" },
  body: { id: "body-basis", digest: "b" },
};
const io = (files: Record<string, Buffer | string>) => ({
  names: () => Object.keys(files),
  read: (name: string) => Buffer.from(files[name]!),
});

/**
 * Hand-written documents and candidate bases become catalogue entries.
 *
 * Scenarios:
 * 1. A face document (it has `expression`) on the published basis is
 *    `file:<name>` in the face domain, a body document in the body domain,
 *    and an array gives `file:<name>/<id>` per member.
 * 2. A sidecar `<name>.basis.json.gz` becomes the basis the documents must
 *    name: the entry carries `name@digest`, and its key differs from the same
 *    document on the published basis (a changed candidate is a new resident).
 * 3. A document naming the wrong basis, a name with a slash-like character, a
 *    document without an id, a non-object and invalid JSON are each rejected
 *    with a reason while the good files still load.
 * 4. Identity reading takes an escaped id and refuses a file that does not open
 *    with one; classification refuses a non-object.
 */
export const test_human_viewer_inputs = (): void => {
  const face = { id: "a", basis: "face-basis", shape: {}, expression: {} };
  const body = { id: "b", basis: "body-basis", shape: {}, pose: [] };
  const result = readHumanViewerInputs({
    io: io({
      "one.json": JSON.stringify(face),
      "pair.json": JSON.stringify([face, { ...body, id: "second" }]),
      "cand.json": JSON.stringify({ ...face, basis: "candidate-1" }),
      "cand.basis.json.gz": basisFile("candidate-1"),
      "wrong.json": JSON.stringify({ ...face, basis: "other" }),
      "bad name.json": JSON.stringify(face),
      "noid.json": JSON.stringify({ basis: "face-basis", expression: {} }),
      "scalar.json": "3",
      "broken.json": "{",
      "note.txt": "ignored",
    }),
    bases,
    source: "rev",
  });
  const ids = result.documents.map((entry) => entry.id);
  TestValidator.equals("ids", ids, [
    "file:cand",
    "file:one",
    "file:pair/a",
    "file:pair/second",
  ]);
  const byId = Object.fromEntries(result.documents.map((entry) => [entry.id, entry]));
  TestValidator.equals("domains", [byId["file:one"]!.domain, byId["file:pair/second"]!.domain], ["face", "body"]);
  TestValidator.predicate("candidate name", /^cand@[0-9a-f]{12}$/.test(byId["file:cand"]!.basis ?? ""));
  TestValidator.equals("published has no candidate", byId["file:one"]!.basis, undefined);
  const same = readHumanViewerInputs({
    io: io({ "cand.json": JSON.stringify({ ...face, basis: "face-basis" }) }),
    bases,
    source: "rev",
  });
  TestValidator.predicate("keys differ", same.documents[0]!.key !== byId["file:cand"]!.key);
  TestValidator.equals(
    "rejected",
    result.rejected.map((entry) => entry.file),
    ["bad name.json", "broken.json", "noid.json", "scalar.json", "wrong.json"],
  );
  TestValidator.predicate(
    "reasons",
    result.rejected.some((entry) => entry.reason.includes("names basis other")) &&
      result.rejected.some((entry) => entry.reason.includes("needs an id")),
  );

  TestValidator.equals("escaped id", readHumanViewerBasisIdentity(gzipSync('{"id":"a\\"b","x":1}')), 'a"b');
  TestValidator.predicate(
    "identity refusal",
    throwsError(() => readHumanViewerBasisIdentity(gzipSync('{"name":"x"}')), "identity") &&
      throwsError(() => classifyHumanViewerInput([1]), "JSON object") &&
      throwsError(() => classifyHumanViewerInput(null), "JSON object"),
  );
  TestValidator.equals("classify", [classifyHumanViewerInput(face), classifyHumanViewerInput(body)], ["face", "body"]);
};
