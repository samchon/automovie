import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { AuthoredLayer } from "../../AuthoredLayer";
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
 * The same layer axis runs under `naturalness/`, where the naturalness gate owns
 * the questions a layer can be content-complete while still failing.
 * Both gates ask a unit about its own body; they differ in when.
 */
export function createPrincipleReferences(props: {
  location: string;
  layer: AuthoredLayer;
  gate: "layer" | "naturalness";
}): IEvidenceReference[] {
  const family: string =
    props.gate === "naturalness" ? "naturalness" : "principles";
  const installed: (file: string) => boolean = (file: string): boolean =>
    fs.existsSync(
      path.join(
        props.location,
        ".agents",
        "skills",
        "contracts",
        "story",
        "shared",
        ...family.split("/"),
        file,
      ),
    );
  // The construction family ships one document per layer scope, so a missing
  // one is a broken tree rather than an absent option and must still be
  // selected for the compiler to say so. Only the genuinely optional documents
  // are filtered: `realized.md`, which older trees predate, and the whole
  // naturalness subtree, which is sparse by design.
  const optional: (file: string) => boolean = (file: string): boolean =>
    props.gate === "naturalness" || file === "realized.md";
  return layerFiles(props.layer)
    .filter((file: string): boolean => !optional(file) || installed(file))
    .map(
      (file: string): IEvidenceMarkdownReference =>
        createSharedReference({
          location: props.location,
          file: `${family}/${file}`,
          checklist: true,
          exclusion: false,
        }),
    );
}
