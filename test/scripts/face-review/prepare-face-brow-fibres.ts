/**
 * Internal connected-host/fibre preparation, from the test CWD:
 *
 * ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-face-brow-fibres.ts STUDY REQUEST.json OUTPUT.json
 *
 * REQUEST is derived preparation data with an exact document and explicit probe
 * attachment/boundary/profile conventions. It is not a new geometry-editing user
 * channel. No distribution or physical value is invented by the command. OUTPUT
 * retains the original model plus the probe, its unsigned separation reports and
 * source/study/request provenance. It is never a published basis replacement.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { parseFaceBrowPreparationArguments } from "./parseFaceBrowPreparationArguments";
import { prepareFaceBrowFibres } from "./prepareFaceBrowFibres";
import { readFaceBasisStudy } from "./readFaceBasisStudy";

const args = parseFaceBrowPreparationArguments(process.argv.slice(2), fs.existsSync);
const inputs = readFaceBasisStudy(fs, args.study);
const requestBytes = fs.readFileSync(args.request);
const request = JSON.parse(requestBytes.toString("utf8")) as Omit<Parameters<typeof prepareFaceBrowFibres>[0], "basis">;
const prepared = prepareFaceBrowFibres({ ...request, basis: inputs.basis.json });
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const output = { diagnosticOnly: true, model: prepared.model, certificates: prepared.certificates,
  frame: { origin: prepared.frame.origin, tangent: prepared.frame.tangent, across: prepared.frame.across, normal: prepared.frame.normal },
  provenance: { ...prepared.provenance, inputBasisSha256: digest(inputs.basis.bytes), requestSha256: digest(requestBytes),
    producer: "prepare-face-brow-fibres.ts", document: request.document } };
fs.mkdirSync(path.dirname(args.output), { recursive: true });
fs.writeFileSync(args.output, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ output: args.output, parts: prepared.parts.length,
  certificates: prepared.certificates, provenance: prepared.provenance }, null, 2));
