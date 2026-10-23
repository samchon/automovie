import type {
  IEvidenceCheckAnalysis,
  IEvidenceGraphClaim,
  IEvidenceInventory,
} from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionGateKey } from "../IProductionGateKey";
import type { IProductionPassValidation } from "../IProductionPassValidation";
import type { IProductionPassValidationScope } from "../IProductionPassValidationScope";
import { stripNaturalnessComments } from "../stripNaturalnessComments";
import type { IProductionTopologyDocument } from "./topology/IProductionTopologyDocument";
import { collectTopologyDocuments } from "./topology/collectTopologyDocuments";
import { compareTopologyIdentity } from "./topology/compareTopologyIdentity";

/** Compares captured logical counterparts, including every supplied working index. */
export function pendingNaturalnessTransfers(
  scope: IProductionPassValidationScope,
  analysis: IEvidenceCheckAnalysis,
): IProductionPassValidation["pendingNaturalnessTransfers"] {
  const pending: IProductionPassValidation["pendingNaturalnessTransfers"] = [];
  const versions: Map<string, Set<string>> = new Map();
  const remember: (inventory: IEvidenceInventory) => void = (
    inventory: IEvidenceInventory,
  ): void => {
    for (const source of inventory.sources) {
      const values: Set<string> = versions.get(source.id) ?? new Set();
      values.add(source.content);
      versions.set(source.id, values);
    }
  };
  for (const claim of analysis.graphInput.claims) {
    remember(claim.inventory);
    for (const reference of claim.references) remember(reference.inventory);
  }
  for (const layer of ["scripts", "screenplay"] as const) {
    if (
      !scope.requiredPasses.some(
        (key: IProductionGateKey): boolean =>
          key.layer === layer && key.pass === "naturalness",
      )
    )
      continue;
    const documents: (
      pass: "construction" | "naturalness",
    ) => IProductionTopologyDocument[] = (
      pass: "construction" | "naturalness",
    ): IProductionTopologyDocument[] => {
      const owner: IProductionClaimOwner | undefined = scope.owners.find(
        (entry: IProductionClaimOwner): boolean =>
          entry.layer === layer &&
          entry.pass === pass &&
          entry.authored === true,
      );
      const input: IEvidenceGraphClaim | undefined =
        analysis.graphInput.claims.find(
          (claim: IEvidenceGraphClaim): boolean => claim.index === owner?.index,
        );
      return input === undefined
        ? []
        : collectTopologyDocuments(input.inventory, layer);
    };
    const working: IProductionTopologyDocument[] = documents("naturalness");
    const body: Map<string, IProductionTopologyDocument> = new Map(
      documents("construction").map(
        (
          document: IProductionTopologyDocument,
        ): [string, IProductionTopologyDocument] => [
          document.relative,
          document,
        ],
      ),
    );
    const seen: Set<string> = new Set();
    for (const document of working) {
      const file: string = document.relative;
      seen.add(file);
      const target: IProductionTopologyDocument | undefined = body.get(file);
      let reason: string | undefined;
      if (
        versions.get(document.source.id)?.size !== 1 ||
        (target !== undefined && versions.get(target.source.id)?.size !== 1)
      )
        reason = "Captured manuscript versions disagree.";
      else if (target === undefined)
        reason =
          "The corresponding body file is missing from the captured construction inputs.";
      else if (
        file.endsWith("/index.md") &&
        compareTopologyIdentity([target], [document], "Working index", true)
          .length !== 0
      )
        reason =
          "Provided working index heading identity differs from its body counterpart.";
      else {
        try {
          const expected: Buffer<ArrayBufferLike> = stripNaturalnessComments(
            Buffer.from(document.source.content),
          );
          if (!expected.equals(Buffer.from(target.source.content)))
            reason =
              "Body differs from the working text with every HTML comment removed.";
        } catch (error: unknown) {
          reason = error instanceof Error ? error.message : String(error);
        }
      }
      if (reason !== undefined) pending.push({ layer, file, reason });
    }
    for (const file of body.keys())
      if (!file.endsWith("/index.md") && !seen.has(file))
        pending.push({
          layer,
          file,
          reason:
            "The selected body file has no naturalness working counterpart.",
        });
  }
  return pending;
}
