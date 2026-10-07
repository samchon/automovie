import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyBasisDocument } from "../../document/admitHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "../generated/IAutoMovieHumanBodyAnatomicalInspection";
import { createHumanBodyFemoralHeadsFromAnatomicalMeasurements } from "../lower-limb/createHumanBodyFemoralHeadsFromAnatomicalMeasurements";
import { createHumanBodyHumeralHeadsFromAnatomicalMeasurements } from "../shoulder/createHumanBodyHumeralHeadsFromAnatomicalMeasurements";

/**
 * Compile explicit articular targets of a body document's anatomy against one
 * neutral reference body rig.
 *
 * The real body builder supplies the reference transforms once. The
 * document's humeral and femoral sphere-fitted head radii are the inputs;
 * its shape and other measurements do not generate that reference. Imaging radii cannot be placed as individual anatomy until
 * the acquisition and centre have been registered. Even standing imaging has
 * no such registration in this inspector. Target spheres remain mathematical
 * candidates and certify neither complete bones nor exterior skin. The
 * inspector owns its assembly admission snapshot alongside the compiled rig;
 * later edits to the caller's source cannot change only one of those owners.
 *
 * @evidence contracts/common.md#principled-implementation Uses the admitted body builder's neutral transforms and existing target-radius placement owners; observation registration is refused before placement and no prior fills omitted radii.
 * @evidence contracts/common.md#clear-and-simple-design A compiled reference and one request evaluator supply concrete articular candidates without a generic estimator registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested body dimensions are replaced by reference weights and no missing tissue is represented as a resolved neutral.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes neutral reference, requested context, candidate placement and unregistered acquisitions.
 * @evidence contracts/modeling.md#part-identity-and-grouping Composes only explicit side-specific head candidates, each naming its unresolved complete bone.
 * @evidence contracts/modeling.md#parameter-channels Absolute target radii remain side-specific; other complete-request measurements are preserved without inferred conversion to morph weights.
 * @evidence contracts/modeling.md#spatial-conventions Existing head owners convert radius millimetres to metres and place copied centres in the body's common reference frame.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This evaluator emits analytic candidate records; the model adapter tessellates them.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no tissue boundary or registered contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The candidate model adapter owns the displayed surface; this owner computes its reference and numerical qualification.
 * @evidence contracts/anatomy.md#anatomical-source Reference rig centres are source approximations; no population or held-out tissue evidence is inferred from sphere placement.
 * @evidence contracts/anatomy.md#permitted-range Shared scalar/placement admission checks physical numbers; individual acquisition and posture registration refuse, and whole anatomy remains unavailable.
 * @evidence contracts/anatomy.md#parametric-authority Only named articular-radius targets are consumed geometrically; no authored centre or vertex enters the request.
 */
export function createHumanBodyAnatomicalInspection(
  input: IAutoMovieHumanBodyBasis,
) {
  const basis = input.id;
  const anatomicalAssembly = structuredClone(input.anatomicalAssembly);
  const build = createHumanBodyBasisBuilder(input);
  let reference: ReturnType<typeof build> | undefined;
  return (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyAnatomicalInspection => {
    const document = admitHumanBodyBasisDocument(
      inputDocument,
      anatomicalAssembly,
    );
    if (document.basis !== basis)
      throw new Error(
        "Body document basis must match the compiled reference: " + basis,
      );
    // admission has refused observed radii: no acquisition centre or posture
    // is registered for an imaged head
    const targets = document.anatomy;
    if (targets === undefined)
      throw new Error("missing-anatomical-input:articular-head-radius");
    reference ??= build({
      id: basis + "/articular-reference",
      name: "Neutral reference rig",
      basis,
      shape: {},
    });
    const heads = [
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
      candidates: heads.map((head) => ({
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
      })),
    };
  };
}
