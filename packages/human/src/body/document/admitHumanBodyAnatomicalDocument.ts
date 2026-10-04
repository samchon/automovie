import typia from "typia";

import { admitHumanBodyAnatomicalMeasurements } from "../anatomy/measurements/admitHumanBodyAnatomicalMeasurements";
import { liftHumanBodySimpleAnatomicalTargets } from "../anatomy/measurements/liftHumanBodySimpleAnatomicalTargets";
import type { IAutoMovieHumanBodyAnatomicalDocument } from "../structures/IAutoMovieHumanBodyAnatomicalDocument";

/**
 * Admit a complete request for the concrete articular or exterior producer.
 *
 * Exact schema admission requires age, stature and mass before the shared
 * physical-scalar gate runs. This recognizes two executable candidate
 * revisions, not a registry of hypothetical tissue generators. Acquisitions
 * remain intact; registration and the reference identity are inspected later.
 * It reads caller-owned values and certifies no physiological surface.
 *
 * @evidence contracts/common.md#principled-implementation Exact complete schema admission precedes the shared finite physical-value owner, preventing a sparse record from passing as a complete request.
 * @evidence contracts/common.md#clear-and-simple-design Two concrete revisions and the existing simple lift serve the declared tiers; each producer checks its own revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing context is refused rather than filled from a neutral body.
 * @evidence contracts/common.md#meaningful-documentation States the admission order, ownership and distinction from surface qualification.
 * @evidence contracts/modeling.md#parameter-channels The selected tier retains absolute measurements; simple paired targets use the single shared lift without mutating the saved request.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It constructs no anatomical part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The inherited measurement owners define units; no conversion is added here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Admission owns no displayed part.
 * @evidence contracts/anatomy.md#parametric-authority Exact schema rejects legacy shape maps and mesh-level authoring.
 * @evidence contracts/anatomy.md#permitted-range The shared physical-scalar gate refuses nonfinite/nonphysical requests; surface and cohort admission are not inferred by this inspector.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This adapter preserves measurement definitions supplied by their types and scalar admission owner.
 */
export function admitHumanBodyAnatomicalDocument(
  input: unknown,
): IAutoMovieHumanBodyAnatomicalDocument {
  const document = typia.assertEquals<IAutoMovieHumanBodyAnatomicalDocument>(input);
  if (document.generatorRevision !== "articular-head-inspection/1" && document.generatorRevision !== "source-conditioned-exterior/1")
    throw new Error("Unsupported body generatorRevision: " + document.generatorRevision);
  if ([document.id, document.name, document.basis].some((value) => value.trim() === ""))
    throw new Error("Anatomical requests need nonempty id, name and basis.");
  admitHumanBodyAnatomicalMeasurements(
    document.tier === "simple"
      ? liftHumanBodySimpleAnatomicalTargets(document.targets)
      : document.targets,
  );
  return document;
}
