import type { AuthoredPass } from "../../AuthoredPass";
import { PACKAGE_DOCS_ROOT } from "./PACKAGE_DOCS_ROOT";

/**
 * Names the docs subtree one pass writes into.
 *
 * Construction reads the current manuscript. Naturalness is written, evidenced,
 * and reviewed in its working tree before comment-free promotion to body.
 */
export function passRoot(pass: AuthoredPass): string {
  return `${PACKAGE_DOCS_ROOT}/${pass === "final" ? "naturalness" : "body"}`;
}
