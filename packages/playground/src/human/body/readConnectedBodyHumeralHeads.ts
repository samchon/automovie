import { createHumanBodyHumeralHeads } from "@automovie/human/body/anatomy/shoulder/createHumanBodyHumeralHeads";
import { measureHumanBodySpheresSkinClearance } from "@automovie/human/body/anatomy/contact/measureHumanBodySpheresSkinClearance";
import { projectHumanBodySimpleShape } from "@automovie/human/body/simple/projectHumanBodySimpleShape";
import { resolveHumanBodyAnatomy } from "@automovie/human/body/anatomy/resolveHumanBodyAnatomy";

import type { IConnectedBodyMeasuredAnatomy } from "./IConnectedBodyMeasuredAnatomy";
import type { IConnectedBodyUnavailableAnatomy } from "./IConnectedBodyUnavailableAnatomy";
import type { IReadConnectedBodyHumeralHeadsProps } from "./IReadConnectedBodyHumeralHeadsProps";
import { packHumanBodyHumeralHeadReading } from "./packHumanBodyHumeralHeadReading";

/**
 * Read both humeral heads of one evaluated body and their room under its
 * skin.
 *
 * A crossed skin has no valid inside, so any crossing makes the reading
 * unavailable. Otherwise age, sex and stature come from the simple projection
 * of the body's shape, whose stature is the whole person's, and each side's
 * radius is the document's entered measurement or the adult CT estimate; a
 * body outside that CT domain has no estimate. The clearance is measured
 * against the build's posed skin. The body editor and the person editor read
 * the same body through this one owner.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reports each humeral head's radius source and skin room for the evaluated body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Refuses the reading on a crossed skin or outside the CT domain instead of inventing a radius.
 * @author Samchon
 */
export function readConnectedBodyHumeralHeads(
  props: IReadConnectedBodyHumeralHeadsProps,
): IConnectedBodyMeasuredAnatomy | IConnectedBodyUnavailableAnatomy {
  if (props.crossings.length !== 0) return { status: "unavailable", reason: "skin-crossing" };
  // the shown body's weights, with the document's anatomy solved in
  const shape = resolveHumanBodyAnatomy(props.basis, props.document.shape, props.document.anatomy);
  const simple = projectHumanBodySimpleShape(props.basis, props.whole, shape, []);
  const heads = createHumanBodyHumeralHeads({
    ageYears: simple.ageYears,
    sex: simple.sex,
    statureMetres: simple.statureMetres,
    bones: props.built.bones,
    radii: props.document.humeralHeads,
  });
  if (heads.length === 0) return { status: "unavailable", reason: "ct-domain" };
  const measured = measureHumanBodySpheresSkinClearance({
    skins: props.basis.surfaces.map((surface, index) => ({
      indices: surface.indices,
      positions: props.built.posedSurfaces[index].positions,
    })),
    spheres: heads.map(({ bone, center, radiusMetres }) => ({ id: bone, center, radiusMetres })),
  });
  return packHumanBodyHumeralHeadReading(heads, measured);
}
