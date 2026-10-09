import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";
import crypto from "node:crypto";
import fs from "node:fs";

import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";

/**
 * Admit and pin an existing numerical attachment preparation document.
 * Normal face-document admission owns its scalar and optical feasibility.
 * Source preparation needs explicit independent eyes; omission still means
 * retained native globes to ordinary face consumers and creates no dimensions
 * here. Every supplied field and original basis identity stays unchanged.
 * The raw content enters generation identity before composition and is
 * reobserved by the publication owner's input verifier. This context supplies
 * authoring values on a new host, never model admission for its original basis.
 */
export function readHumanSourceAttachmentDocument(
  file: string | undefined,
  inputs: IHumanSourceGenerationInput[],
): IAutoMovieHumanFaceBasisDocument {
  if (file === undefined)
    throw new Error(
      "Source generation requires --attachment-document with an existing explicit optical preparation context.",
    );
  const bytes = fs.readFileSync(file);
  const document = parseHumanFaceBasisDocument(bytes.toString("utf8"));
  if (
    document.eyes === undefined ||
    [document.id, document.name, document.basis].some(
      (value) => value.trim() === "",
    )
  )
    throw new Error(
      "Source attachment context needs its original nonempty identities and explicit independent eyes.",
    );
  inputs.push({
    role: "explicit numerical attachment source document",
    path: "attachment-document/input",
    revision: null,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  });
  return document;
}
