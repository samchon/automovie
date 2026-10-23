import type {
  IEvidenceCheckAnalysis,
  IEvidenceGraphClaim,
  IEvidenceSourceFile,
} from "@wrtnlabs/evidence";
import path from "node:path";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionGateKey } from "../IProductionGateKey";
import type { IProductionPassValidation } from "../IProductionPassValidation";
import type { IProductionPassValidationScope } from "../IProductionPassValidationScope";
import { canonicalProductionPath as canonical } from "../canonicalProductionPath";
import { stripNaturalnessComments } from "../stripNaturalnessComments";

/** Compares the captured working/body inputs; never reopens a mutable manuscript. */
export function pendingNaturalnessTransfers(
  root: string,
  scope: IProductionPassValidationScope,
  analysis: IEvidenceCheckAnalysis,
): IProductionPassValidation["pendingNaturalnessTransfers"] {
  const pending: IProductionPassValidation["pendingNaturalnessTransfers"] = [];
  const sources: Map<string, Set<string>> = new Map<string, Set<string>>();
  for (const claim of analysis.graphInput.claims)
    for (const source of claim.inventory.sources) {
      const key: string = canonical(source.physicalPath);
      const values: Set<string> = sources.get(key) ?? new Set<string>();
      values.add(source.content);
      sources.set(key, values);
    }
  for (const layer of ["scripts", "screenplay"] as const) {
    if (
      !scope.requiredPasses.some(
        (key: IProductionGateKey): boolean =>
          key.layer === layer && key.pass === "naturalness",
      )
    )
      continue;
    const workingRoot: string = canonical(
      path.resolve(root, "docs/naturalness", layer),
    );
    const bodyRoot: string = canonical(path.resolve(root, "docs/body", layer));
    const seen: Set<string> = new Set<string>();
    const owner: IProductionClaimOwner | undefined = scope.owners.find(
      (entry: IProductionClaimOwner): boolean =>
        entry.layer === layer &&
        entry.pass === "naturalness" &&
        entry.authored === true,
    );
    const hosts: IEvidenceSourceFile[] =
      analysis.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean => claim.index === owner?.index,
      )?.inventory.sources ?? [];
    for (const source of hosts) {
      const working: string = canonical(source.physicalPath);
      if (seen.has(working)) continue;
      seen.add(working);
      const file: string = working.slice(workingRoot.length + 1);
      const target: string = canonical(
        path.resolve(root, "docs/body", layer, file),
      );
      let reason: string | undefined;
      if (!working.startsWith(`${workingRoot}/`))
        reason = "Naturalness host is outside its working tree.";
      else if (
        sources.get(working)?.size !== 1 ||
        (sources.get(target)?.size ?? 0) > 1
      )
        reason = "Captured manuscript versions disagree.";
      else if (!sources.has(target))
        reason =
          "The corresponding body file is missing from the captured construction inputs.";
      else {
        try {
          const expected: Buffer<ArrayBufferLike> = stripNaturalnessComments(
            Buffer.from(source.content),
          );
          if (!expected.equals(Buffer.from([...sources.get(target)!][0])))
            reason =
              "Body differs from the working text with every HTML comment removed.";
        } catch (error: unknown) {
          reason = error instanceof Error ? error.message : String(error);
        }
      }
      if (reason !== undefined) pending.push({ layer, file, reason });
    }
    const construction: IProductionClaimOwner | undefined = scope.owners.find(
      (entry: IProductionClaimOwner): boolean =>
        entry.layer === layer &&
        entry.pass === "construction" &&
        entry.authored === true,
    );
    const bodies: IEvidenceSourceFile[] =
      analysis.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean =>
          claim.index === construction?.index,
      )?.inventory.sources ?? [];
    const missing: Set<string> = new Set<string>();
    for (const source of bodies) {
      const body: string = canonical(source.physicalPath);
      if (!body.startsWith(`${bodyRoot}/`)) continue;
      const file: string = body.slice(bodyRoot.length + 1);
      if (!seen.has(`${workingRoot}/${file}`) && !missing.has(file)) {
        missing.add(file);
        pending.push({
          layer,
          file,
          reason:
            "The selected body file has no naturalness working counterpart.",
        });
      }
    }
  }
  return pending;
}
