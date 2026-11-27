import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanContactWindow } from "../../law/internal/HumanContactWindow";
import { HumanFoot } from "./HumanFoot";

/*
 * A planted sole contributes its bearing outline, and a named region
 * contributes its touching point.
 */
export function HumanSupportPatch(
  body: IAutoMovieMotionHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  contact: IAutoMovieMotionHumanContactWindow,
  support?: IAutoMovieRigidTransform,
): IAutoMovieVector3[] {
  if (
    contact.region === undefined &&
    (contact.material === undefined || contact.support.kind === "ground") &&
    (contact.part === "leftFoot" || contact.part === "rightFoot")
  )
    return HumanFoot.base(body, bones, [
      contact.part === "leftFoot" ? "left" : "right",
    ]);
  if (contact.material !== undefined && support !== undefined)
    return (contact.material.patch ?? [contact.material.point]).map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          support.position,
          Quaternion.rotateVector(support.rotation, point),
        ),
    );
  return [HumanSupportPatch.point(body, bones, contact)];
}

/*
 * The geometry of a declared contact on the displayed body, shared by motion
 * and its audit.
 */
export namespace HumanSupportPatch {
  /*
   * The authored region, or the part's canonical touching surface.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    contact: IAutoMovieMotionHumanContactWindow,
  ): IAutoMovieHumanoidSurfaces.IFrame {
    return body.surfaces.regions[
      contact.region ?? HumanContactWindow.REGIONS[contact.part]
    ];
  }

  /*
   * Place the touching surface's centre in world metres.
   */
  export function point(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    contact: IAutoMovieMotionHumanContactWindow,
  ): IAutoMovieVector3 {
    const surface: IAutoMovieHumanoidSurfaces.IFrame = frame(body, contact);
    return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      surface,
      bones.get(surface.bone)!,
    ).point;
  }
}
