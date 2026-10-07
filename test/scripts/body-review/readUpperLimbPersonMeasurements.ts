import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonGenerationBuild,
} from "@automovie/human";
import { findHumanSkinLandmark } from "@automovie/human/common/basis/findHumanSkinLandmark";
import { humanPhysicalSourceDomain } from "@automovie/human/common/basis/humanPhysicalSourceDomain";
import { joinHumanPersonSkin } from "@automovie/human/human/measure/joinHumanPersonSkin";

import type { IUpperLimbObservationMeasurement } from "./IUpperLimbObservationMeasurement";

/**
 * Read metacarpale II–V on the actual performed Float32 person skin and the
 * shoulder–elbow–wrist rig segments on that same evaluation.
 *
 * The source owns skin-landmark and source-partition registration. The person
 * skin join owns sample identity and Float32 conversion. Rig centres are not
 * humeral, radial or ulnar anatomical endpoints. The performed breadth is a
 * Euclidean landmark chord in the current pose; it is not an ANSUR acquisition
 * when that document does not place the hand flat with fingers together.
 * Missing registration stays unavailable. Nothing fits the requested values
 * or treats a reading as a quality verdict.
 */
export function readUpperLimbPersonMeasurements(
  view: IAutoMovieHumanPersonBodyView,
  built: IAutoMovieHumanPersonGenerationBuild,
): IUpperLimbObservationMeasurement[] {
  const result: IUpperLimbObservationMeasurement[] = [];
  const domain = humanPhysicalSourceDomain(built.model.id, view.id);
  const skin = {
    ...built.model,
    parts: built.model.parts.filter(
      (part) =>
        part.geometry.type === "mesh" &&
        part.geometry.mesh.physicalVertices?.sources.some(
          (source) => source.domain === domain,
        ),
    ),
  };
  for (const side of ["left", "right"] as const) {
    const references = [`metacarpale-ii-${side}`, `metacarpale-v-${side}`];
    const points = references.map((name) => {
      const landmark = findHumanSkinLandmark(view.body, name);
      if (landmark === undefined) return null;
      const sample =
        view.body.surfaces[landmark.surface]?.sourcePartition?.samples[
          landmark.vertex
        ];
      return sample === undefined
        ? null
        : (joinHumanPersonSkin(skin, sample)?.anchor ?? null);
    });
    const a = points[0],
      b = points[1];
    result.push({
      quantity: `${side} performed metacarpale II–V chord`,
      references,
      millimetres:
        a === null || b === null
          ? null
          : 1000 * Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
      unavailable:
        a === null || b === null
          ? "Skin landmark or final source sample is not registered."
          : null,
    });
    for (const [from, to] of [
      [`${side}UpperArm`, `${side}LowerArm`],
      [`${side}LowerArm`, `${side}Hand`],
    ]) {
      const head = built.bones.find((bone) => bone.bone === from)?.posed
        .position;
      const tail = built.bones.find((bone) => bone.bone === to)?.posed.position;
      result.push({
        quantity: `${from}→${to} posed rig-centre distance`,
        references: [from, to],
        millimetres:
          head === undefined || tail === undefined
            ? null
            : 1000 *
              Math.hypot(head.x - tail.x, head.y - tail.y, head.z - tail.z),
        unavailable:
          head === undefined || tail === undefined
            ? "The final consumer has no requested rig frame."
            : null,
      });
    }
  }
  return result;
}
