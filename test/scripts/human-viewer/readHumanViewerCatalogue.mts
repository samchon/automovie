/**
 * Read the immutable numerical study inputs and name their model-cache keys.
 * The server owns source watching; this reader owns basis identity, document
 * population and digest composition. It never reads reference photographs.
 * A basis without its opening identity refuses before catalogue publication.
 *
 * @evidence contracts/common.md#principled-implementation Document, basis and source digests identify the numerical generation independently of display state.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue reading is one responsibility separated from HTTP and browser lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Published subjects and standard states supply the population without consumer-specific cases.
 * @evidence contracts/common.md#meaningful-documentation Describes immutable inputs, cache authority and identity refusal.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { readHumanViewerInputs } from "./readHumanViewerInputs";

export function readHumanViewerCatalogue(props: {
  basisFiles: { face: string; body: string };
  documentsFile: string;
  /** Directory of hand-written documents and candidate bases, absent or empty when unused. */
  inputsDirectory?: string;
  /** Identity and digest of a basis file; the server supplies a memoized reader so the tens of megabytes are hashed once. */
  basisOf?: (file: string) => { id: string; digest: string };
  /** The digests the page reloads on and each domain's builds depend on. */
  revisions: { browser: string; face: string; body: string };
}): HumanViewerCatalogue {
  const hash = (bytes: string | Buffer): string =>
    createHash("sha256").update(bytes).digest("hex");
  const sources = props.revisions;
  const bases = Object.fromEntries(
    Object.entries(props.basisFiles).map(([domain, file]) => {
      if (props.basisOf !== undefined) return [domain, props.basisOf(file)];
      const bytes = fs.readFileSync(file);
      return [
        domain,
        { id: readHumanViewerBasisIdentity(bytes), digest: hash(bytes) },
      ];
    }),
  );
  const subjects = JSON.parse(
    fs.readFileSync(props.documentsFile, "utf8"),
  ) as Extract<
    HumanViewerCatalogue["documents"][number],
    { domain: "face" }
  >["document"][];
  const faces = [
    {
      id: "connected-reference",
      name: "CC0 connected reference",
      basis: bases.face.id,
      shape: {},
      expression: {},
    },
    ...subjects,
  ];
  const inputs =
    props.inputsDirectory !== undefined && fs.existsSync(props.inputsDirectory)
      ? readHumanViewerInputs({
          io: {
            names: () => fs.readdirSync(props.inputsDirectory!),
            read: (name) => fs.readFileSync(path.join(props.inputsDirectory!, name)),
          },
          bases: bases as Record<"face" | "body", { id: string; digest: string }>,
          sources,
        })
      : { documents: [], rejected: [] };
  return {
    revision: sources.browser,
    rejected: inputs.rejected,
    documents: [
      ...faces.map((document) => ({
        id: document.id,
        domain: "face" as const,
        document,
        key: hash(JSON.stringify(document) + bases.face.digest + sources.face),
      })),
      ...Object.entries(standardBodyReviewStates()).map(([name, state]) => {
        const document = {
          id: "body:" + name,
          name,
          basis: bases.body.id,
          ...state,
        };
        return {
          id: document.id,
          domain: "body" as const,
          document,
          key: hash(JSON.stringify(document) + bases.body.digest + sources.body),
        };
      }),
      ...inputs.documents,
    ],
  };
}
