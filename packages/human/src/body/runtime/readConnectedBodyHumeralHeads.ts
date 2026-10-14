import { measureHumanBodySpheresSkinClearance } from "../anatomy/contact/measureHumanBodySpheresSkinClearance";
import { resolveHumanBodyAnatomy } from "../anatomy/resolveHumanBodyAnatomy";
import { createHumanBodyHumeralHeads } from "../anatomy/shoulder/createHumanBodyHumeralHeads";
import { projectHumanBodySimpleShape } from "../simple/projectHumanBodySimpleShape";
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
 * @evidence contracts/common.md#principled-implementation The resolved shape is projected to identity inputs, each shoulder radius is measured or domain-bounded prior, and actual posed skin supplies clearance.
 * @evidence contracts/common.md#clear-and-simple-design The runtime adapter coordinates existing projection, radius and clearance owners for both body and person previews.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crossed skin and unsupported prior domains remain unavailable; the rig-centred fit reading does not certify anatomical joint registration.
 * @evidence contracts/common.md#meaningful-documentation The comment states source precedence, adult prior limits, posed-skin authority and the shared editor path.
 * @evidence contracts/performance.md#efficient-algorithms Shape resolution and whole-person projection precede shared skin capping; at most two sphere queries scan the same triangles, while adapter storage scales with surfaces.
 * @evidence contracts/performance.md#reuse-equivalent-work Both shoulders share one resolved shape, identity projection and clearance request; no cross-call result is cached for mutable document/build inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function owns only synchronous temporaries and its fresh scalar reading; no task, GPU resource or retained cache survives completion.
 *
 * @author Samchon
 */
export function readConnectedBodyHumeralHeads(
  props: IReadConnectedBodyHumeralHeadsProps,
): IConnectedBodyMeasuredAnatomy | IConnectedBodyUnavailableAnatomy {
  if (props.crossings.length !== 0)
    return { status: "unavailable", reason: "skin-crossing" };
  // the shown body's weights, with the document's anatomy solved in
  const shape: Record<string, number> = resolveHumanBodyAnatomy(
    props.basis,
    props.document.shape,
    props.document.anatomy,
  );
  const simple: ReturnType<typeof projectHumanBodySimpleShape> =
    projectHumanBodySimpleShape(props.basis, props.whole, shape, []);
  const heads: ReturnType<typeof createHumanBodyHumeralHeads> =
    createHumanBodyHumeralHeads({
      ageYears: simple.ageYears,
      sex: simple.sex,
      statureMetres: simple.statureMetres,
      bones: props.built.bones,
      radii: props.document.humeralHeads,
    });
  if (heads.length === 0) return { status: "unavailable", reason: "ct-domain" };
  const measured: ReturnType<typeof measureHumanBodySpheresSkinClearance> =
    measureHumanBodySpheresSkinClearance({
      skins: props.basis.surfaces.map(
        (
          surface: IReadConnectedBodyHumeralHeadsProps["basis"]["surfaces"][number],
          index: number,
        ): Parameters<
          typeof measureHumanBodySpheresSkinClearance
        >[0]["skins"][number] => ({
          indices: surface.indices,
          positions: props.built.posedSurfaces[index].positions,
        }),
      ),
      spheres: heads.map(
        ({
          bone,
          center,
          radiusMetres,
        }: ReturnType<typeof createHumanBodyHumeralHeads>[number]): Parameters<
          typeof measureHumanBodySpheresSkinClearance
        >[0]["spheres"][number] => ({
          id: bone,
          center,
          radiusMetres,
        }),
      ),
    });
  return packHumanBodyHumeralHeadReading(heads, measured);
}
