import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitNasalRimSection } from "./createPortraitNasalRimSection";

/**
 * Attach an exterior section to resident outer IDs and return its inner loop.
 * The host supplies the band's skin material group. The returned loop is used
 * directly by vestibular lining and optional curve refinement, so there is no
 * second independently positioned aperture. All ring winding follows the cut.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Connects nasal exterior tissue to resident host skin and returns the same inner aperture to the lining.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Appends crest/rim rings and oriented skin-band triangles against validated outer IDs and one registered material group.
 */
export function appendPortraitNasalRimSection(
  cage: IControlMesh,
  outer: readonly number[],
  section: ReturnType<typeof createPortraitNasalRimSection>,
  group: number,
): number[] {
  if (
    outer.length < 3 ||
    new Set(outer).size !== outer.length ||
    section.rim.length !== outer.length ||
    section.crest.length !== outer.length ||
    outer.some(
      (id) => !Number.isInteger(id) || id < 0 || id >= cage.positions.length,
    ) ||
    !Number.isInteger(group) ||
    group < 0 ||
    [...section.rim, ...section.crest].some(
      (p) => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error(
      "A nasal skin band needs resident outer IDs and aligned finite rings.",
    );
  let previous = [...outer];
  for (const points of [section.crest, section.rim]) {
    const current = points.map((p) => {
      const id = cage.positions.length;
      cage.positions.push([...p]);
      return id;
    });
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      cage.indices.push(
        previous[i],
        previous[j],
        current[i],
        previous[j],
        current[j],
        current[i],
      );
      cage.groups.push(group, group);
    }
    previous = current;
  }
  return previous;
}
