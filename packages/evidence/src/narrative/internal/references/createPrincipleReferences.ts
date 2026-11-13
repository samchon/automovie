import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import { createContractDirectory } from "../utilities/createContractDirectory";
import { createSharedReference } from "./createSharedReference";
import { layerFiles } from "./layerFiles";

/**
 * Creates the principle checklists every unit of one layer answers for itself.
 *
 * A settings H2 answers the common and settings checklists; a narrative unit
 * also answers the narrative checklist, which settings cannot: it inherits no
 * unit and stages no turn. A script or screenplay unit additionally answers the
 * realized checklist, whose questions need literal text to be asked of: a
 * treatment fixes which exchange happens, and only a layer that writes the
 * words can be asked whether this speaker could have said them. No item may be
 * excluded, because each binds wherever its condition applies.
 *
 * The same layer axis runs under `naturalness/`, the expression questions a
 * script can fail while being content-complete. Scripts construction
 * selects them beside its principles, so both families ask a unit about its
 * own body in the same pass.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Common, inherited narrative, realized-text and layer-specific files become non-excludable per-unit H2 checklists in the selected principles or expression family; only declared optional family files are filtered by installation, probed in the shared skills tree that createContractDirectory resolves, where createSharedReference also roots the references.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One layer axis is reused for both families, while family admission remains distinct from language modules and population obligations; the owning tree is decided by createContractDirectory, not rebuilt here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Required construction files stay selected when missing so native compilation diagnoses the broken tree; sparse expression files and older realized contracts are the explicit compatibility cases.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains who can answer each scope, why literal-text questions apply only to realized layers, and which construction selects the expression family.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four layer-file candidates require a bounded number of optional-file probes and fixed-size reference constructions; no manuscript traversal occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work layerFiles and createSharedReference centralize scope and address semantics; optional-file existence refreshes per configuration build rather than persisting an old contract population.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Intermediate file lists and returned references have a fixed family bound; config owns the result and synchronous existence checks retain no handle or running task.
 */
export function createPrincipleReferences(props: {
  contracts: IContractLocation;
  layer: AuthoredLayer;
  family: "principles" | "naturalness";
}): IEvidenceReference[] {
  const installed: (file: string) => boolean = (file: string): boolean =>
    fs.existsSync(
      path.join(
        createContractDirectory(props.contracts, "shared"),
        "shared",
        props.family,
        file,
      ),
    );
  // The construction family ships one document per layer scope, so a missing
  // one is a broken tree rather than an absent option and must still be
  // selected for the compiler to say so. Only the genuinely optional documents
  // are filtered: `realized.md`, which older trees predate, and the whole
  // expression subtree, which is sparse by design.
  const optional: (file: string) => boolean = (file: string): boolean =>
    props.family === "naturalness" || file === "realized.md";
  return layerFiles(props.layer)
    .filter((file: string): boolean => !optional(file) || installed(file))
    .map(
      (file: string): IEvidenceMarkdownReference =>
        createSharedReference({
          contracts: props.contracts,
          file: `${props.family}/${file}`,
          checklist: true,
          exclusion: false,
        }),
    );
}
