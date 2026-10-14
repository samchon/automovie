import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyBasisDocument } from "../../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "../generated/IAutoMovieHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyArticularCandidate } from "../generated/IAutoMovieHumanBodyArticularCandidate";
import { createHumanBodyFemoralHeadsFromAnatomicalMeasurements } from "../lower-limb/createHumanBodyFemoralHeadsFromAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { createHumanBodyHumeralHeadsFromAnatomicalMeasurements } from "../shoulder/createHumanBodyHumeralHeadsFromAnatomicalMeasurements";

/**
 * Compile explicit articular targets of a body document's anatomy against one neutral reference body rig.
 *
 * The real body builder supplies the reference transforms once. The document's humeral and femoral sphere-fitted head radii are the inputs; its shape and other measurements do not generate that reference. Imaging radii cannot be placed as individual anatomy until the acquisition and centre have been registered. Even standing imaging has no such registration in this inspector. Target spheres remain mathematical candidates and certify neither complete bones nor exterior skin. The inspector owns its assembly admission snapshot alongside the compiled rig; later edits to the caller's source cannot change only one of those owners.
 *
 * @evidence contracts/common.md#principled-implementation A basis builder supplies one neutral rig and admitted radius targets supply analytic spheres; outputs explicitly remain unvalidated and unregistered to individual imaging centres.
 * @evidence contracts/common.md#clear-and-simple-design The returned closure keeps basis compilation and lazy neutral evaluation together while humeral and femoral owners interpret their own measurement paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The neutral reference document is the stated inspection frame; no body skin or population radius fills an absent target, and missing targets refuse.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies target-only semantics, centre-registration limits, neutral reference transforms and the separately owned admission snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Compilation follows basis size and clones assembly bytes once; the first successful request builds a neutral body, while later requests reuse it and scan its bones for at most four head candidates.
 * @evidence contracts/performance.md#reuse-equivalent-work One closure reuses its builder and lazy reference only for the same compiled basis; admission reads an assembly clone so caller source edits cannot desynchronize it from compiled geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The inspector closure retains one compiled builder, assembly snapshot and at most one neutral body; their byte size follows basis complexity and all become collectible when the closure is released.
 */
export function createHumanBodyAnatomicalInspection(
  input: IAutoMovieHumanBodyBasis,
): (
  document: IAutoMovieHumanBodyBasisDocument,
) => IAutoMovieHumanBodyAnatomicalInspection {
  const basis: string = input.id;
  const anatomicalAssembly: IAutoMovieHumanBodyAnatomicalAssembly | undefined =
    structuredClone(input.anatomicalAssembly);
  const build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild = createHumanBodyBasisBuilder(input);
  let reference: IAutoMovieHumanBodyBuild | undefined;
  return (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyAnatomicalInspection => {
    const document: IAutoMovieHumanBodyBasisDocument =
      admitHumanBodyBasisDocument(inputDocument, anatomicalAssembly);
    if (document.basis !== basis)
      throw new Error(
        "Body document basis must match the compiled reference: " + basis,
      );
    // admission has refused observed radii: no acquisition centre or posture
    // is registered for an imaged head
    const targets: IAutoMovieHumanBodyAnatomicalMeasurements | undefined =
      document.anatomy;
    if (targets === undefined)
      throw new Error("missing-anatomical-input:articular-head-radius");
    reference ??= build({
      id: basis + "/articular-reference",
      name: "Neutral reference rig",
      basis,
      shape: {},
    });
    const heads: (
      | ReturnType<
          typeof createHumanBodyHumeralHeadsFromAnatomicalMeasurements
        >[number]
      | ReturnType<
          typeof createHumanBodyFemoralHeadsFromAnatomicalMeasurements
        >[number]
    )[] = [
      ...createHumanBodyHumeralHeadsFromAnatomicalMeasurements({
        measurements: targets,
        bones: reference.bones,
      }),
      ...createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
        measurements: targets,
        bones: reference.bones,
      }),
    ];
    if (heads.length === 0)
      throw new Error("missing-anatomical-input:articular-head-radius");
    return {
      generatorRevision: "articular-head-inspection/1",
      reference: { basis, evaluation: "neutral-reference" },
      requested: structuredClone(targets),
      skin: { status: "unavailable", reason: "geometry-not-validated" },
      candidates: heads.map(
        (
          head: (typeof heads)[number],
        ): IAutoMovieHumanBodyArticularCandidate => ({
          part:
            head.bone === "leftUpperArm"
              ? "leftHumerus"
              : head.bone === "rightUpperArm"
                ? "rightHumerus"
                : head.bone === "leftUpperLeg"
                  ? "leftFemur"
                  : "rightFemur",
          bone: head.bone,
          center: { ...head.center },
          radiusMetres: head.radiusMetres,
          source: "target",
          registration: "reference-rig-only",
          partResolution: {
            status: "unavailable",
            reason: "geometry-not-validated",
          },
        }),
      ),
    };
  };
}
