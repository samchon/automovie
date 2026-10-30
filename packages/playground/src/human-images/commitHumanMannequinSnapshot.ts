import { createHash } from "node:crypto";

import type { IHumanMannequinSnapshot } from "../human-stickman/IHumanMannequinSnapshot.ts";
import type { IHumanViewerCommitment } from "../human/IHumanViewerCommitment.ts";

/** Commit the actual Mannequin model, construction and input projections.
 * Model includes ordered geometry/world matrices, material/texture tables,
 * marker world placement and live pose/expression/motion/time. Construction
 * includes generated section geometry with referenced material/texture values
 * and the posed rig. Input includes parameters, pose/expression/motion/time,
 * root placement and hint settings. Geometry/marker visibility, camera and
 * lighting remain separate capture state.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 consumes JSON.stringify UTF-8 text of the three explicit projections, preserving array order and existing JSON semantics. Section material indices are expanded to their actual values and referenced textures; geometry/marker visibility is omitted without removing hidden buffers.
 * @evidence contracts/common.md#clear-and-simple-design One hash definition is shared by worker and parent receipt admission, without serializing another model format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No names/counts substitute for buffers; hidden geometry remains committed and visibility is preserved in the raw snapshot and capture metadata.
 * @evidence contracts/common.md#meaningful-documentation States model, construction and actual-input digest domains and why display state is separate.
 * @evidence contracts/performance.md#efficient-algorithms Three sequential hashes cost their projected JSON byte lengths, including repeated material/texture values expanded for section references; geometry/marker projection and section filtering also traverse their records. Returns three fixed-size digests without rendering.
 * @evidence contracts/performance.md#reuse-equivalent-work The same original snapshot serves all digests; no body law, geometry producer or renderer runs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only digests escape; temporary field projections reference caller-owned arrays and become collectible on return.
 */
export function commitHumanMannequinSnapshot(
  snapshot: IHumanMannequinSnapshot,
): IHumanViewerCommitment {
  const geometry: Array<
    Omit<
      IHumanMannequinSnapshot["geometry"][number],
      "visible" | "effectiveVisible"
    >
  > = snapshot.geometry.map(
    (
      part: IHumanMannequinSnapshot["geometry"][number],
    ): Omit<typeof part, "visible" | "effectiveVisible"> => {
      const {
        visible: _visible,
        effectiveVisible: _effectiveVisible,
        ...data
      }: typeof part = part;
      return data;
    },
  );
  return {
    modelSha256: digest({
      geometry,
      materials: snapshot.materials,
      textures: snapshot.textures,
      markers: snapshot.markers.map(
        ({
          visible: _visible,
          effectiveVisible: _effectiveVisible,
          ...marker
        }: IHumanMannequinSnapshot["markers"][number]): Omit<
          IHumanMannequinSnapshot["markers"][number],
          "visible" | "effectiveVisible"
        > => marker,
      ),
      pose: snapshot.controller.pose,
      expression: snapshot.controller.expression,
      motion: snapshot.controller.motion,
      localTimeSeconds: snapshot.controller.time,
    }),
    constructionSha256: digest({
      sections: geometry
        .filter((part: (typeof geometry)[number]): boolean =>
          part.hierarchy.includes("human.polygon.sections"),
        )
        .map((part: (typeof geometry)[number]): object => ({
          ...part,
          materials: part.materials.map((index: number): object => {
            const material: IHumanMannequinSnapshot.IMaterial =
              snapshot.materials[index];
            return {
              ...material,
              map:
                material.map === null ? null : snapshot.textures[material.map],
              alphaMap:
                material.alphaMap === null
                  ? null
                  : snapshot.textures[material.alphaMap],
            };
          }),
        })),
      rig: snapshot.rig,
    }),
    actualInputSha256: digest({
      parameters: snapshot.parameters,
      pose: snapshot.controller.pose,
      expression: snapshot.controller.expression,
      motion: snapshot.controller.motion,
      localTimeSeconds: snapshot.controller.time,
      root: snapshot.root,
      hint: snapshot.hint,
    }),
  };
}

/** SHA-256 of the existing JSON representation, with no alternate geometry serializer.
 *
 * Node SHA-256 consumes the exact JSON.stringify UTF-8 text of the supplied actual snapshot projection.
 * One digest primitive serves the three explicit commitment domains.
 * No scalar counts, supplied digests or regenerated geometry substitute for actual data.
 * Returns lowercase hexadecimal over existing JSON semantics.
 * One linear serialization/hash, with no second explicit Buffer.
 * Uses caller-owned snapshot data and does not invoke the body law or renderer.
 * Only a fixed-size digest escapes; the temporary JSON text becomes collectible after hashing.
 */
function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}
