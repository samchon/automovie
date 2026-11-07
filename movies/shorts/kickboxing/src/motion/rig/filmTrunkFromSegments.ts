import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmBodyRig as Rig } from "./FilmBodyRig";
import { FilmVector as V } from "./FilmVector";
import { filmHeadGuardPoint } from "./filmHeadGuardPoint";

/** Read choreography landmarks and collision carriers from one coherent world pose. Clinical authoring and physical target fitting use the same geometry reader; neither invents a second shoulder, head or hip frame. */
export function filmTrunkFromSegments(
  segments: Readonly<Record<string, P.ITransform>>,
  profile: Pick<P, "segments">,
): Rig.Trunk {
  const at: (bone: string) => V.Value = (bone: string): V.Value =>
    V.tuple(segments[bone]!.position);
  const chest: P.ITransform["rotation"] = segments.chest!.rotation;
  return {
    hips: at("hips"),
    chest: at("chest"),
    neck: at("neck"),
    head: at("head"),
    headCenter: filmHeadGuardPoint(profile, segments.head!),
    shoulders: { left: at("leftUpperArm"), right: at("rightUpperArm") },
    hipJoints: { left: at("leftUpperLeg"), right: at("rightUpperLeg") },
    chestRotation: [chest.x, chest.y, chest.z, chest.w],
    segments,
  };
}
