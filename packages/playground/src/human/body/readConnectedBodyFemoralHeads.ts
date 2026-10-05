import {
  createHumanBodyFemoralHeadsFromAnatomicalMeasurements,
  measureHumanBodySpheresSkinClearance,
} from "@automovie/human";

import type { IConnectedBodyFemoralHeads } from "./IConnectedBodyFemoralHeads";
import type { IReadConnectedBodyHumeralHeadsProps } from "./IReadConnectedBodyHumeralHeadsProps";

/**
 * Read the femoral head target spheres a body document's anatomy asks for
 * against its posed skin, or null when it asks for none.
 *
 * Each side's sphere has the document's `anatomy.<side>LowerLimb.thigh.femur
 * .sphereFittedHeadRadius` target and sits at the posed hip rig centre
 * (`createHumanBodyFemoralHeadsFromAnatomicalMeasurements`); no population
 * radius is substituted for an absent side. A crossed skin has no valid
 * inside, so the reading is then unavailable. The rig centre does not
 * register the person's anatomical head centre, so the room read here is a
 * fit check, not a hip joint.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Connects the document's femoral head targets to a skin-room reading on the actual posed body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Reports measured or unavailable femoral heads without inventing a radius.
 * @author Samchon
 */
export function readConnectedBodyFemoralHeads(props: IReadConnectedBodyHumeralHeadsProps): IConnectedBodyFemoralHeads | null {
  if (props.document.anatomy === undefined) return null;
  const heads = createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
    measurements: props.document.anatomy,
    bones: props.built.bones,
  });
  if (heads.length === 0) return null;
  if (props.crossings.length !== 0) return { status: "skin-crossing", heads: [] };
  const measured = measureHumanBodySpheresSkinClearance({
    skins: props.basis.surfaces.map((surface, index) => ({
      indices: surface.indices,
      positions: props.built.posedSurfaces[index].positions,
    })),
    spheres: heads.map(({ bone, center, radiusMetres }) => ({ id: bone, center, radiusMetres })),
  });
  return {
    status: "measured",
    heads: heads.map((head, index) => ({
      bone: head.bone,
      radiusMetres: head.radiusMetres,
      centerInside: measured[index].centerInside,
      nearestMetres: measured[index].nearestMetres,
      clearanceMetres: measured[index].clearanceMetres,
    })),
  };
}
