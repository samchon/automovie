import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import path from "node:path";
import { gzipSync } from "node:zlib";

import type { IFaceBasisRevisionIo } from "./IFaceBasisRevisionIo";
import type { IFaceStudyFile } from "./IFaceStudyFile";

/** What a preparation function returns: the revised study and its own receipt. */
export interface IFaceBasisRevisionPrepared<R extends object = object> {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: R;
}

const digest = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

/**
 * Write a prepared basis revision and its receipt into a new directory.
 *
 * The directory receives `basis.json.gz` (level-9 gzip of the compact JSON),
 * `subjects.json`, `simple-controls.json` and `receiptFile`. The receipt is the
 * preparation's own receipt, then the entry's `fields` (citations and other
 * facts only the entry knows), the time it was `recorded`, the SHA-256 and
 * size of every input file the run read and of the basis it wrote, so a stale
 * or substituted input is detectable later. The time is the caller's, which is
 * the only clock in a revision, and the digests are of the bytes as written.
 * Returns the written basis bytes and the receipt for a caller that reports them.
 */
export function writeFaceBasisRevision<R extends object>(props: {
  io: IFaceBasisRevisionIo;
  output: string;
  receiptFile: string;
  prepared: IFaceBasisRevisionPrepared<R>;
  inputs: Record<string, IFaceStudyFile<unknown>>;
  fields?: Record<string, unknown>;
  recorded: Date;
}): { basisBytes: Buffer; receipt: R } {
  const { io, output, prepared } = props;
  io.mkdirSync(output, { recursive: true });
  const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
    level: 9,
  });
  io.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
  io.writeFileSync(
    path.join(output, "subjects.json"),
    JSON.stringify(prepared.documents, null, 2) + "\n",
  );
  io.writeFileSync(
    path.join(output, "simple-controls.json"),
    JSON.stringify(prepared.controls, null, 2) + "\n",
  );
  const receipt = {
    ...prepared.receipt,
    ...props.fields,
    recorded: props.recorded.toISOString(),
    inputs: Object.fromEntries(
      Object.entries(props.inputs).map(([name, file]) => [
        name,
        { sha256: digest(file.bytes), bytes: file.bytes.length },
      ]),
    ),
    outputs: {
      basis: { sha256: digest(basisBytes), bytes: basisBytes.length },
    },
  };
  io.writeFileSync(
    path.join(output, props.receiptFile),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  return { basisBytes, receipt: receipt as R };
}
