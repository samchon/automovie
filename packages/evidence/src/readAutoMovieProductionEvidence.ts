import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createAutoMovieContractBindingManifest } from "./createAutoMovieContractBindingManifest";
import { readAutoMovieContractRules } from "./readAutoMovieContractRules";
import { readAutoMovieProductionPackageIdentity } from "./readAutoMovieProductionPackageIdentity";
import type { IAutoMovieProductionEvidence } from "./IAutoMovieProductionEvidence";
import type { IAutoMovieProductionEvidenceDesignBranch } from "./IAutoMovieProductionEvidenceDesignBranch";
import { sourceBindingOf } from "./readAutoMovieProductionEvidenceInternal/sourceBindingOf";
import { compareCodeUnits } from "./readAutoMovieProductionEvidenceInternal/compareCodeUnits";
import type { IAutoMovieProductionEvidenceDesignOwner } from "./IAutoMovieProductionEvidenceDesignOwner";
import { listMarkdownFiles } from "./readAutoMovieProductionEvidenceInternal/listMarkdownFiles";
import { readMarkdownDocument } from "./readAutoMovieProductionEvidenceInternal/readMarkdownDocument";
import { sourceOwnerBindingsOf } from "./readAutoMovieProductionEvidenceInternal/sourceOwnerBindingsOf";


/**
 * Read one generated project's graph-backed authoring identity synchronously.
 *
 * The caller supplies the same tracked `productionEvidence` object exported by the generated project's typed `lint.config.ts`. The reader refuses a declaration for another root, derives the shape-aware manifest through the evidence factory, then reads only the active design owners and flat local contracts that manifest governs. Source lineage and physical source paths come from the manifest rather than from a second model-to-source table.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation The supplied graph root must match its resolved root; the shape-aware manifest selects design owners, source lineage and local contracts, which are read from controlled populations.
 * @evidence contracts/common.md#clear-and-simple-design One graph-backed reader derives authoring identity without a second design-to-source registry or a prose alarm subsystem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only graph-selected owners enter the result; file/source byte identities remain distinct from semantic review and root comparison is resolved spelling rather than a physical filesystem lock.
 * @evidence contracts/common.md#meaningful-documentation The comment states synchronous generated-project ownership and manifest authority; member types describe exact owner and lineage inventories.
 * @evidence contracts/performance.md#efficient-algorithms Manifest and owner scans include repeated population walks per binding and branch, full source parsing, canonical H2-span hashing and contract metadata inspection. Traversal includes visited non-Markdown entries as well as selected files; heading projection and carrier parsing add the repeated-text costs documented on their helpers. Bindings, directory entries and source/document bytes have no cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each branch's source binding is shared by its document owners; separate graph relationships currently repeat selected-population resolution and no cache equivalence is asserted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result retains configuration, manifest and identity records; synchronous reads close internally and temporary file/source text is released after processing.
 */
export const readAutoMovieProductionEvidence: (props: {
    root: string;
    productionEvidence: IAutoMovieEvidenceConfigProps;
}) => IAutoMovieProductionEvidence = (props: {
  root: string;
  productionEvidence: IAutoMovieEvidenceConfigProps;
}): IAutoMovieProductionEvidence => {
  const root: string = path.resolve(props.root);
  if (path.resolve(props.productionEvidence.location) !== root)
    throw new Error(
      `${props.productionEvidence.location}: productionEvidence belongs to another project root; expected ${root}.`,
    );

  const manifest: IAutoMovieProductionEvidence["manifest"] = createAutoMovieContractBindingManifest(
    props.productionEvidence,
  );
  const packageIdentity: { packageName: string; description: string; } = readAutoMovieProductionPackageIdentity(root, {
    read: (file: string) : string => fs.readFileSync(file, "utf8"),
    stat: fs.lstatSync,
  });
  const designBranches: Set<IAutoMovieProductionEvidence["manifest"]["bindings"][number]["branch"]> = new Set(
    manifest.bindings
      .filter(
        (binding: IAutoMovieProductionEvidence["manifest"]["bindings"][number]) : boolean =>
          binding.host.type === "markdown" &&
          binding.relationship === "checklist" &&
          binding.target.type === "contract" &&
          binding.target.domain === "design",
      )
      .map((binding: IAutoMovieProductionEvidence["manifest"]["bindings"][number]) : IAutoMovieProductionEvidence["manifest"]["bindings"][number]["branch"] => binding.branch),
  );

  const branches: IAutoMovieProductionEvidenceDesignBranch[] = [
    ...designBranches,
  ]
    .map((branch: IAutoMovieProductionEvidence["manifest"]["bindings"][number]["branch"]) : IAutoMovieProductionEvidenceDesignBranch => ({
      branch,
      designStage: manifest.branches.find((entry: IAutoMovieProductionEvidence["manifest"]["branches"][number]) : boolean => entry.name === branch)!
        .stage,
      sourceBinding: sourceBindingOf(root, branch, manifest.bindings),
    }))
    .sort((left: IAutoMovieProductionEvidenceDesignBranch, right: IAutoMovieProductionEvidenceDesignBranch) : number => compareCodeUnits(left.branch, right.branch));
  const designOwners: IAutoMovieProductionEvidenceDesignOwner[] = [];
  for (const branch of branches) {
    const ownerRoot: string = path.join(root, "docs", branch.branch);
    const sourceBinding: ReturnType<typeof sourceBindingOf> = branch.sourceBinding;
    for (const file of listMarkdownFiles(root, ownerRoot)) {
      const document: ReturnType<typeof readMarkdownDocument> = readMarkdownDocument(root, file);
      designOwners.push({
        branch: branch.branch,
        path: document.path,
        title: document.title,
        units: document.units,
        sourceBinding,
      });
    }
  }
  designOwners.sort((left: IAutoMovieProductionEvidenceDesignOwner, right: IAutoMovieProductionEvidenceDesignOwner) : number => compareCodeUnits(left.path, right.path));
  const sourceOwners: IAutoMovieProductionEvidence["sourceOwners"] = sourceOwnerBindingsOf(root, manifest.bindings);

  const contracts: IAutoMovieProductionEvidence["contracts"] = listMarkdownFiles(
    root,
    path.join(root, "docs", "contracts"),
  )
    .map((file: string) : ReturnType<typeof readMarkdownDocument> => readMarkdownDocument(root, file))
    .map((document: ReturnType<typeof readMarkdownDocument>) : IAutoMovieProductionEvidence["contracts"][number] => ({
      path: document.path,
      title: document.title,
      items: document.units,
    }));

  return {
    root,
    ...packageIdentity,
    configuration: props.productionEvidence,
    manifest,
    designBranches: branches,
    designOwners,
    sourceOwners,
    contracts,
    contractRules: readAutoMovieContractRules(
      path.join(root, "docs", "contracts"),
    ),
  };
};
