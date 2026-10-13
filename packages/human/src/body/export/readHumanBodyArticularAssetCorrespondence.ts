import type { Primitive } from "@gltf-transform/core";
import typia from "typia";

import { readHumanStaticPartCorrespondence } from "../../common/export/readHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularAssetCorrespondence } from "./IAutoMovieHumanBodyArticularAssetCorrespondence";

/**
 * Join candidate qualification to its actual primitive source-ID partition.
 * Absent body metadata is legacy; an unsupported present claim or incomplete ID join refuses. The common reader alone admits actual element intervals, then this reader matches all candidate IDs in order and copies qualification. Returned common geometry is already an owned clone. Source provenance is syntactic/report metadata rather than independent personal or clinical anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Present candidate metadata passes exact typia schema, nonempty reference basis and complete ordered ID equality against the common reader's actual primitive partition.
 * @evidence contracts/common.md#clear-and-simple-design Namespace admission and body ID joining augment the shared element-binding reader without duplicating Float32 interval rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported schema, missing geometry or mismatched candidate order refuses; report provenance cannot certify authentic acquisition, whole bones or personal centres.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes legacy absence, present refusal, copied output ownership and mathematical candidate versus clinical qualification.
 * @evidence contracts/performance.md#efficient-algorithms Common accessor admission walks actual attributes/indices; body joining and qualification cloning add linear metadata/member work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same common interval owner serves articular, atlas and assembly readers, with no stale cache of mutable primitive extras.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned geometry/qualification are owned copies; schema and join temporaries expire with no retained Primitive, writer or external task.
 */
export function readHumanBodyArticularAssetCorrespondence(
  primitive: Primitive,
): IAutoMovieHumanBodyArticularAssetCorrespondence | undefined {
  const extras: ReturnType<Primitive["getExtras"]> = primitive.getExtras();
  if (!Object.hasOwn(extras, "automovieArticularInspection")) return undefined;
  const qualification: IAutoMovieHumanBodyArticularAssetCorrespondence["qualification"] = typia.assertEquals<
    IAutoMovieHumanBodyArticularAssetCorrespondence["qualification"]
  >(extras.automovieArticularInspection);
  const geometry: ReturnType<typeof readHumanStaticPartCorrespondence> = readHumanStaticPartCorrespondence(primitive);
  if (
    geometry === undefined ||
    qualification.reference.basis.trim() === "" ||
    qualification.parts.length !== geometry.parts.length ||
    qualification.parts.some(
      (part: typeof qualification.parts[number], index: number): boolean => part.id !== geometry.parts[index].id,
    )
  )
    throw new Error(
      "Articular qualification must match its actual source part partition.",
    );
  return { geometry, qualification: structuredClone(qualification) };
}
