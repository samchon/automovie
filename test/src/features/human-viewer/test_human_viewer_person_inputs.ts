import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

import { classifyHumanViewerInput } from "../../../scripts/human-viewer/classifyHumanViewerInput";
import { readHumanViewerInputs } from "../../../scripts/human-viewer/readHumanViewerInputs";

/**
 * Paired Person files use both published bases and the runtime/composer authorities.
 *
 * Scenarios:
 * 1. A complete paired document enters the person worker domain unchanged;
 *    a file array retains each member's identity and carries no candidate.
 * 2. The same tuple replays the same key. Changing either basis digest,
 *    either anatomy source, the composer source, or the document changes that cache authority.
 * 3. A wrong face basis alone, wrong body basis alone, malformed inner
 *    document, a partial pair with no body, and a candidate Person sidecar each refuse while a valid file
 *    remains present. A sidecar is not silently treated as a published pair.
 */
export const test_human_viewer_person_inputs = (): void => {
  const document: IAutoMovieHumanPersonDocument = {
    id: "whole",
    name: "Analytic person",
    face: { id: "f", name: "Face", basis: "face-published", shape: {}, expression: {} },
    body: { id: "b", name: "Body", basis: "body-published", shape: {} },
  };
  const bases = {
    face: { id: "face-published", digest: "face-digest" },
    body: { id: "body-published", digest: "body-digest" },
  };
  const sources = { face: "face-source", body: "body-source", person: "person-source" };
  const io = (files: Record<string, string | Buffer>) => ({
    names: () => Object.keys(files),
    read: (name: string) => Buffer.from(files[name]!),
  });
  const one = (over: Partial<{ bases: typeof bases; sources: typeof sources; document: IAutoMovieHumanPersonDocument }> = {}) =>
    readHumanViewerInputs({
      io: io({ "one.json": JSON.stringify(over.document ?? document) }),
      bases: over.bases ?? bases,
      sources: over.sources ?? sources,
    });
  const first = one();
  TestValidator.equals("paired classification", classifyHumanViewerInput(document), "person");
  TestValidator.equals("published pair identity", first.documents.map((entry) => [entry.id, entry.domain, entry.basis]), [["file:one", "person", undefined]]);
  TestValidator.equals("the input is retained without an override", first.documents[0]!.document, document);
  TestValidator.equals("the pair is admitted", first.rejected, []);
  TestValidator.equals("cache authority is deterministic", one().documents[0]!.key, first.documents[0]!.key);

  for (const domain of ["face", "body"] as const) {
    const alteredBasis = { ...bases, [domain]: { ...bases[domain], digest: domain + "-new-digest" } };
    TestValidator.predicate(domain + " digest participates", one({ bases: alteredBasis }).documents[0]!.key !== first.documents[0]!.key);
    TestValidator.predicate(domain + " source participates", one({ sources: { ...sources, [domain]: domain + "-new-source" } }).documents[0]!.key !== first.documents[0]!.key);
  }
  TestValidator.predicate("the actual composer source participates", one({ sources: { ...sources, person: "new-composer-source" } }).documents[0]!.key !== first.documents[0]!.key);
  TestValidator.predicate("document participates", one({ document: { ...document, body: { ...document.body, shape: { macroHeight: 1 } } } }).documents[0]!.key !== first.documents[0]!.key);

  const array = readHumanViewerInputs({
    io: io({ "pair.json": JSON.stringify([document, { ...document, id: "other" }]) }),
    bases, sources,
  });
  TestValidator.equals("array members keep identity", array.documents.map((entry) => entry.id), ["file:pair/whole", "file:pair/other"]);

  const refused = readHumanViewerInputs({
    io: io({
      "valid.json": JSON.stringify(document),
      "wrong-face.json": JSON.stringify({ ...document, face: { ...document.face, basis: "other-face" } }),
      "wrong-body.json": JSON.stringify({ ...document, body: { ...document.body, basis: "other-body" } }),
      "malformed.json": JSON.stringify({ ...document, body: 3 }),
      "missing-body.json": JSON.stringify({ id: document.id, name: document.name, face: document.face }),
      "candidate.json": JSON.stringify(document),
      "candidate.basis.json.gz": gzipSync(JSON.stringify({ id: "candidate" })),
    }),
    bases, sources,
  });
  TestValidator.equals("bad pairs do not hide a valid one", refused.documents.map((entry) => entry.id), ["file:valid"]);
  TestValidator.equals("each invalid pair refuses", refused.rejected.map((entry) => entry.file), ["candidate.json", "malformed.json", "missing-body.json", "wrong-body.json", "wrong-face.json"]);
  const reason = (file: string) => refused.rejected.find((entry) => entry.file === file)!.reason;
  TestValidator.predicate("face identity refuses by cause", reason("wrong-face.json").includes("face basis"));
  TestValidator.predicate("body identity refuses by cause", reason("wrong-body.json").includes("body basis"));
  TestValidator.predicate("unsupported candidate pair refuses explicitly", reason("candidate.json").includes("published face and body bases"));
  TestValidator.predicate("malformed inner schema reports a reason", reason("malformed.json").length > 0);
  TestValidator.predicate("an incomplete pair reports its refusal", reason("missing-body.json").length > 0);
};
