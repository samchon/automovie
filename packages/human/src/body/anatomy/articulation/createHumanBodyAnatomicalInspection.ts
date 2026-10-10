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
