import { measureHumanBodySpheresSkinClearance } from "../anatomy/contact/measureHumanBodySpheresSkinClearance";
import { createHumanBodyFemoralHeadsFromAnatomicalMeasurements } from "../anatomy/lower-limb/createHumanBodyFemoralHeadsFromAnatomicalMeasurements";

import type { IConnectedBodyFemoralHeads } from "./IConnectedBodyFemoralHeads";
import type { IReadConnectedBodyHumeralHeadsProps } from "./IReadConnectedBodyHumeralHeadsProps";

/**
 * Read the femoral head spheres a body document's anatomy asks for
 * against its posed skin, or null when it asks for none.
 *
 * Each side's sphere has the document's `anatomy.<side>LowerLimb.thigh.femur
 * .sphereFittedHeadRadius` target or tomographic observation and sits at the posed hip rig centre
 * (`createHumanBodyFemoralHeadsFromAnatomicalMeasurements`); no population
 * radius is substituted for an absent side. A crossed skin has no valid
 * inside, so the reading is then unavailable. The rig centre does not
 * register the person's anatomical head centre, so the room read here is a
 * fit check, not a hip joint.
 *
 * The numerical producer admits either radius branch; enclosing document admission still decides whether an observation has a registered consumer. This compact fit reply keeps radius and clearance scalars rather than the producer's source label or observation record.
 *
 * @evidence contracts/common.md#principled-implementation Specified anatomy radii become posed hip-centred spheres, then the shared capped-skin query measures their clearance; no requested side means no sphere.
 * @evidence contracts/common.md#clear-and-simple-design The preview adapter leaves radius admission and geometric containment with their numerical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing radii are not replaced by a population guess; known crossed skin produces an unavailable reading before clearance.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre geometry, missing-radius behavior, target/observation admission, compact provenance loss, crossing refusal and unregistered hip-centre limitations.
 * @evidence contracts/performance.md#efficient-algorithms For at most two heads, the dominant work is shared skin capping and full triangle clearance and containment; adapter maps are linear in surfaces and heads.
 * @evidence contracts/performance.md#reuse-equivalent-work All heads in one request share the clearance owner's capped skin; no result crosses requests with potentially changed pose or topology.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This synchronous adapter retains no state; returned scalar head records belong to the caller and temporary sphere and skin views become collectible.
 *
 * @author Samchon
 */
export function readConnectedBodyFemoralHeads(
  props: IReadConnectedBodyHumeralHeadsProps,
): IConnectedBodyFemoralHeads | null {
  if (props.document.anatomy === undefined) return null;
  const heads: ReturnType<typeof createHumanBodyFemoralHeadsFromAnatomicalMeasurements> = createHumanBodyFemoralHeadsFromAnatomicalMeasurements({
    measurements: props.document.anatomy,
    bones: props.built.bones,
  });
  if (heads.length === 0) return null;
  if (props.crossings.length !== 0)
    return { status: "skin-crossing", heads: [] };
  const measured: ReturnType<typeof measureHumanBodySpheresSkinClearance> = measureHumanBodySpheresSkinClearance({
    skins: props.basis.surfaces.map((surface: IReadConnectedBodyHumeralHeadsProps["basis"]["surfaces"][number], index: number): Parameters<typeof measureHumanBodySpheresSkinClearance>[0]["skins"][number] => ({
      indices: surface.indices,
      positions: props.built.posedSurfaces[index].positions,
    })),
    spheres: heads.map(({ bone, center, radiusMetres }: ReturnType<typeof createHumanBodyFemoralHeadsFromAnatomicalMeasurements>[number]): Parameters<typeof measureHumanBodySpheresSkinClearance>[0]["spheres"][number] => ({
      id: bone,
      center,
      radiusMetres,
    })),
  });
  return {
    status: "measured",
    heads: heads.map((head: ReturnType<typeof createHumanBodyFemoralHeadsFromAnatomicalMeasurements>[number], index: number): IConnectedBodyFemoralHeads["heads"][number] => ({
      bone: head.bone,
      radiusMetres: head.radiusMetres,
      centerInside: measured[index].centerInside,
      nearestMetres: measured[index].nearestMetres,
      clearanceMetres: measured[index].clearanceMetres,
    })),
  };
}
