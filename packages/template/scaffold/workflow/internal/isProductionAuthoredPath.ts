import path from "node:path";

import { canonicalProductionPath } from "../canonicalProductionPath";

/** Identifies physical and logical authoring inputs that cannot be global engineering. */
export function isProductionAuthoredPath(filename: string): boolean {
  const portable: string = filename.replaceAll("\\", "/");
  const lexical: string = (
    /^[A-Za-z]:\//u.test(portable)
      ? path.win32.normalize(portable)
      : path.resolve(portable)
  ).replaceAll("\\", "/");
  const physical: string = canonicalProductionPath(filename);
  const boundary: RegExp =
    /\/(?:docs\/(?:body|revision|naturalness|review|evidence|instructions)|\.agents\/skills\/contracts\/story)(?:\/|$)/iu;
  return boundary.test(lexical) || boundary.test(physical);
}
