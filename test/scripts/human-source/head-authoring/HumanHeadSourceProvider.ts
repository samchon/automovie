import { evaluateHumanHeadSourceEarSections } from "./evaluateHumanHeadSourceEarSections.ts";
import { evaluateHumanHeadSourceEnvelope } from "./evaluateHumanHeadSourceEnvelope.ts";
import { evaluateHumanHeadSourceNasalEnvelope } from "./evaluateHumanHeadSourceNasalEnvelope.ts";
import { evaluateHumanHeadSourceNasalSections } from "./evaluateHumanHeadSourceNasalSections.ts";
import type { IHumanHeadSourceAuthoring } from "./structures/IHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceEvaluation } from "./structures/IHumanHeadSourceEvaluation.ts";
import type { IHumanHeadSourceRecipe } from "./structures/IHumanHeadSourceRecipe.ts";

/** The one shared native head source formula called by all normal TS producers.
 * Captured licensed geometry and ancestral supports remain in Blender metres.
 * Head/cervical chart, connected nasal exterior, paired pinnae and original
 * nasal cap extrusion run in that order. No person-fit vertices, subprocess,
 * source mutation or independently reconstructed endpoint formula is used.
 * Geometry admission, whole-generation publication and current hardware views
 * belong to the downstream source compiler and normal human consumers.
 */
export class HumanHeadSourceProvider {
  private readonly polygons: number[][];

  constructor(readonly authoring: IHumanHeadSourceAuthoring) {
    const sample = authoring.sample;
    this.polygons = Array.from(sample.loopStart, (start, ordinal) =>
      Array.from(sample.loopVertex.subarray(start, start + sample.loopTotal[ordinal])),
    );
  }

  /** Evaluate one original native state without changing its arrays or recipe. */
  evaluate(
    nativeXYZ: Float64Array,
    numericRecipe: IHumanHeadSourceRecipe,
    nativeJointWitness: Float64Array,
  ): IHumanHeadSourceEvaluation {
    const sample = this.authoring.sample;
    if (nativeXYZ.length !== 3 * sample.manifest.vertices || nativeJointWitness.length !== 3 * sample.manifest.landmarkIds.length)
      throw new Error("Head provider needs the original native population and this state's exact joint witness.");
    if (!nativeXYZ.every(Number.isFinite) || !nativeJointWitness.every(Number.isFinite))
      throw new Error("Head provider refuses nonfinite current native XYZ or joint witness.");
    const [headPositions, headJoints, envelope] = evaluateHumanHeadSourceEnvelope(nativeXYZ, nativeJointWitness, this.authoring, numericRecipe.head);
    let positions = headPositions, joints = headJoints;
    if (numericRecipe.nasalExterior !== undefined) {
      const guide = this.authoring.profiles.nasalExteriorGuide;
      if (guide === undefined) throw new Error("Requested nasal exterior has no authored native source guide, including zero requests.");
      const [exterior, exteriorJoints, record] = evaluateHumanHeadSourceNasalEnvelope(positions, joints, guide, numericRecipe.nasalExterior);
      positions = exterior; joints = exteriorJoints; envelope.nasalExterior = record;
    }
    const [ears, earRecords] = evaluateHumanHeadSourceEarSections(positions, this.polygons, this.authoring.profiles.earGuide, numericRecipe.ears);
    const [complete, cells, nasalRecords] = evaluateHumanHeadSourceNasalSections(ears, this.polygons, this.authoring.profiles, numericRecipe.nose);
    return { positions: complete, joints, polygons: cells, envelope, ears: earRecords, nasal: nasalRecords };
  }
}
