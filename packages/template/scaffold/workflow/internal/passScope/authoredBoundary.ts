import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";

/** Authored directories in another package remain unknown even when empty. */
export function authoredBoundary(filename: string): boolean {
  return /\/docs\/(?:(?:body|revision|naturalness|review\/(?:draft|final))\/(?:settings|treatments|scripts|screenplay)|evidence\/(?:construction|naturalness)\/(?:files|units)\/(?:settings|treatments|scripts|screenplay))(?:\/|$)/.test(
    canonical(filename),
  );
}
