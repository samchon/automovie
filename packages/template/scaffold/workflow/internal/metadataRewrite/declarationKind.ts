import { ACKNOWLEDGEMENT } from "./ACKNOWLEDGEMENT";
import type { EvidenceDeclarationKind } from "./EvidenceDeclarationKind";
import { REVIEW } from "./REVIEW";

/** Classifies one exact structural evidence declaration. */
export function declarationKind(
  line: string,
): EvidenceDeclarationKind | undefined {
  if (
    !line.includes("<!--") &&
    !line.includes("-->") &&
    ACKNOWLEDGEMENT.test(line)
  )
    return "acknowledgement";
  if (!line.includes("<!--") && !line.includes("-->") && REVIEW.test(line))
    return "review";
  return undefined;
}
