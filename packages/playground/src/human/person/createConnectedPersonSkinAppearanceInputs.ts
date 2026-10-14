import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { HUMAN_FACE_SKIN_APPEARANCE } from "@automovie/human/face/anatomy/skin/HUMAN_FACE_SKIN_APPEARANCE";
import { HUMAN_FACE_SKIN_REGION_APPEARANCE } from "@automovie/human/face/anatomy/skin/HUMAN_FACE_SKIN_REGION_APPEARANCE";

import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List reflectance of the source's named continuous skin areas. The face
 * owner's registered host and area membership decide the population; missing
 * anatomical names are never guessed. The source owner's identity gain seeds
 * an absent record and changes no albedo until an authored strength is given.
 * No patch centre, radius or personal vertex selection is editable here.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty registered skin areas on actual lip/ocular hosts receive owner-defined reflectance descriptors, with identity gain/zero strength seeding and whole-area removal preserving source appearance.
 * @evidence contracts/common.md#clear-and-simple-design The function transports named-area appearance metadata while source membership/continuity, material albedo admission and person history remain downstream owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing anatomical membership is not guessed, renderer gain is not pigment concentration and controls expose no personal vertex, radius or patch placement.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies registered-area provenance, host selection, algebraic identity seed and absence of editable placement geometry.
 * @evidence contracts/performance.md#efficient-algorithms A Set of at most three actual host ids supports constant expected checks while one pass filters r area records and emits t descriptors per retained area; default reads traverse their p key segments, O(r+rtp) metadata work/output plus label/path text, without visiting area vertices beyond reading length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fixed host Set is reused within the current catalogue pass; no prior descriptors are retained because source area membership and owner metadata determine each result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary host/entry arrays are call-owned and returned descriptors borrow the small owner identity record; no surface mesh, worker or renderer allocation is acquired, and catalogue refresh/close bounds retained metadata.
 *
 * @author Samchon
 */
export function createConnectedPersonSkinAppearanceInputs(
  basis: IAutoMovieHumanFaceBasis,
): IConnectedPersonInputDescriptor[] {
  const hosts: Set<string> = new Set(
    [
      basis.contact?.lips.surface,
      basis.periocular?.left.cage?.surface,
      basis.periocular?.right.cage?.surface,
    ].filter((id: string | undefined): id is string => id !== undefined),
  );
  return Object.entries(basis.skinRegions ?? {})
    .filter(
      ([, area]: [
        string,
        NonNullable<IAutoMovieHumanFaceBasis["skinRegions"]>[string],
      ]): boolean =>
        area.vertices.length > 0 && hosts.has(basis.surfaces[area.surface]?.id),
    )
    .flatMap(
      ([name]: [
        string,
        NonNullable<IAutoMovieHumanFaceBasis["skinRegions"]>[string],
      ]): IConnectedPersonInputDescriptor[] =>
        HUMAN_FACE_SKIN_APPEARANCE.map(
          (
            trait: (typeof HUMAN_FACE_SKIN_APPEARANCE)[number],
          ): IConnectedPersonInputDescriptor => {
            const root: string[] = ["face", "skinAppearance", name];
            const value: unknown = trait.path.reduce<unknown>(
              (node: unknown, key: string): unknown =>
                typeof node === "object" && node !== null
                  ? (node as Record<string, unknown>)[key]
                  : undefined,
              HUMAN_FACE_SKIN_REGION_APPEARANCE,
            );
            return {
              path: [...root, ...trait.path],
              group: "Skin reflectance · " + name,
              label: trait.label,
              unit: trait.unit,
              minimum: trait.minimum,
              maximum: trait.maximum,
              minimumExclusive: trait.minimumExclusive,
              maximumExclusive: trait.maximumExclusive,
              step: null,
              ownerDefault: typeof value === "number" ? value : null,
              seed: HUMAN_FACE_SKIN_REGION_APPEARANCE,
              seedPath: root,
              removePath: root,
              omission: "the source area's unmodified reflectance",
              removable: true,
              qualification: trait.qualification,
            };
          },
        ),
    );
}
