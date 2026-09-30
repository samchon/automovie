import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import type { IFaceBasisRevisionIo } from "../../../scripts/face-review/IFaceBasisRevisionIo";
import { parseFaceBasisRevisionArguments } from "../../../scripts/face-review/parseFaceBasisRevisionArguments";
import { readFaceBasisStudy } from "../../../scripts/face-review/readFaceBasisStudy";
import { readFaceStudyFile } from "../../../scripts/face-review/readFaceStudyFile";
import { writeFaceBasisRevision } from "../../../scripts/face-review/writeFaceBasisRevision";
import { throwsError } from "../internal/predicates";

const sha = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const memory = (
  files: Record<string, Buffer>,
): IFaceBasisRevisionIo & { files: Record<string, Buffer | string> } => {
  const store: Record<string, Buffer | string> = { ...files };
  return {
    files: store,
    readFileSync: (file) => {
      const found = store[file];
      if (found === undefined) throw new Error("missing " + file);
      return Buffer.from(found);
    },
    writeFileSync: (file, data) => {
      store[file] = typeof data === "string" ? data : Buffer.from(data);
    },
    mkdirSync: () => undefined,
    existsSync: (file) => store[file] !== undefined,
  };
};

/**
 * The shared revision reader and writer serve every basis preparation entry.
 *
 * Scenarios:
 * 1. A study directory of a gzipped basis and two JSON files reads into bytes
 *    and parsed values; a missing file refuses.
 * 2. Arguments give the study, revision and output; a missing argument or an
 *    output that exists refuses (a revision is written once).
 * 3. The writer emits the gzipped basis, the two documents and a receipt that
 *    holds the preparation's receipt, the entry's fields, the recorded time,
 *    each input's SHA-256 and size and the written basis's own digest; the
 *    written basis round-trips to the prepared one.
 */
export const test_subject_face_basis_revision_io = (): void => {
  const basisJson = { id: "b" };
  const inputs = {
    "basis.json.gz": gzipSync(JSON.stringify(basisJson)),
    "subjects.json": Buffer.from('[{"id":"s"}]'),
    "simple-controls.json": Buffer.from('{"c":1}'),
  };
  const io = memory(
    Object.fromEntries(
      Object.entries(inputs).map(([name, bytes]) => [
        path.join("study", name),
        bytes,
      ]),
    ),
  );
  const study = readFaceBasisStudy(io, "study");
  TestValidator.equals("basis", study.basis.json, basisJson as never);
  TestValidator.equals("subjects", study.subjects.json, [{ id: "s" }] as never);
  TestValidator.equals("controls", study.controls.json, { c: 1 } as never);
  TestValidator.equals(
    "bytes kept",
    sha(study.subjects.bytes),
    sha(inputs["subjects.json"]),
  );
  TestValidator.predicate(
    "missing file",
    throwsError(() => readFaceStudyFile(io, "study", "none.json"), "missing"),
  );

  const request = parseFaceBasisRevisionArguments(
    ["study", "rev", "out"],
    io.existsSync,
  );
  TestValidator.equals("arguments", request, {
    studyDirectory: "study",
    revision: "rev",
    output: "out",
  });
  TestValidator.predicate(
    "argument refusals",
    throwsError(
      () => parseFaceBasisRevisionArguments(["study", "rev"], io.existsSync),
      "new output directory",
    ) &&
      throwsError(
        () =>
          parseFaceBasisRevisionArguments(
            ["study", "rev", path.join("study", "subjects.json")],
            io.existsSync,
          ),
        "new output directory",
      ),
  );

  const prepared = {
    basis: { id: "b2" } as never,
    documents: [{ id: "d" }] as never,
    controls: { k: 2 } as never,
    receipt: { kind: "test", note: "kept" },
  };
  const written = writeFaceBasisRevision({
    io,
    output: "out",
    receiptFile: "test-receipt.json",
    prepared,
    inputs: { basis: study.basis, subjects: study.subjects },
    fields: { citations: ["x"] },
    recorded: new Date("2026-01-02T03:04:05.000Z"),
  });
  const basisBytes = io.files[path.join("out", "basis.json.gz")] as Buffer;
  TestValidator.equals(
    "basis round trip",
    JSON.parse(gunzipSync(basisBytes).toString("utf8")),
    { id: "b2" },
  );
  TestValidator.equals("documents", io.files[path.join("out", "subjects.json")], '[\n  {\n    "id": "d"\n  }\n]\n');
  TestValidator.equals("controls", io.files[path.join("out", "simple-controls.json")], '{\n  "k": 2\n}\n');
  TestValidator.equals(
    "receipt",
    JSON.parse(io.files[path.join("out", "test-receipt.json")] as string),
    {
      kind: "test",
      note: "kept",
      citations: ["x"],
      recorded: "2026-01-02T03:04:05.000Z",
      inputs: {
        basis: { sha256: sha(inputs["basis.json.gz"]), bytes: inputs["basis.json.gz"].length },
        subjects: { sha256: sha(inputs["subjects.json"]), bytes: inputs["subjects.json"].length },
      },
      outputs: { basis: { sha256: sha(basisBytes), bytes: basisBytes.length } },
    },
  );
  TestValidator.equals("returned bytes", sha(written.basisBytes), sha(basisBytes));
  const bare = writeFaceBasisRevision({
    io,
    output: "out2",
    receiptFile: "r.json",
    prepared,
    inputs: {},
    recorded: new Date(0),
  });
  TestValidator.equals("no fields", Object.keys(bare.receipt), [
    "kind",
    "note",
    "recorded",
    "inputs",
    "outputs",
  ]);
};
