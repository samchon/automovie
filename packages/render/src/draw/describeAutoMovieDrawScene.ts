import type { IAutoMovieMark } from "@automovie/engine";
import * as THREE from "three";

import type { IAutoMovieCaptureSubject } from "../capture/IAutoMovieCaptureSubject.js";
import { AUTO_MOVIE_INSPECTION_PALETTE } from "../scene/inspection/AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IAutoMovieInspectionPath } from "../scene/inspection/IAutoMovieInspectionPath.js";
import { listAutoMovieInspectionPaths } from "../scene/inspection/listAutoMovieInspectionPaths.js";
import type { IAutoMovieViewerViewpoint } from "../scene/subjectViewpoint/IAutoMovieViewerViewpoint.js";
import { autoMovieViewerNamedViewpoints } from "../scene/subjectViewpoint/autoMovieViewerNamedViewpoints.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * Describe a created subject as a capture plans against it, from the scene as `create` left it: no second is sought, because a subject need not hold every second, such as a case that samples only its own instants.
 *
 * Named instants are the subject's own, copied. Views are the subject's own names, then the inspection's named viewpoints. Drawables are the inspection paths of the drawn objects, one world box per distinct path, the union of the boxes of every object sharing it; an object with an empty box is left out. Mark kinds are those the subject supplies at second 0, then `trail`, `trail/now`, `edge` and every `defect/<kind>`, the kinds the inspection draws from its own sampling and measurement; a subject whose kinds appear only later in its run lists them only at second 0's, which is a stated limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where each member comes from, the order of names and kinds, the union rule and the limit on kinds.
 * @evidence contracts/development/implementation.md#principled-implementation Paths come from the inspection's own path listing and boxes from three.js's `Box3.setFromObject` on world matrices brought up to date, so a sweep groups by the boxes the inspection draws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Views, drawables, kinds, then one literal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measured kinds are read from the inspection's palette, not restated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the drawn objects' vertices for the boxes and in the subject's marks at second 0.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Done once per page.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records; the boxes are dropped.
 */
export function describeAutoMovieDrawScene(
  name: string,
  scene: IAutoMovieDrawScene,
): IAutoMovieCaptureSubject {
  // Boxes per distinct path, in world space.
  scene.scene.updateMatrixWorld(true);
  const boxes: Map<string, THREE.Box3> = new Map();
  const entries: IAutoMovieInspectionPath[] = listAutoMovieInspectionPaths(
    scene.scene,
  );
  for (const entry of entries) {
    const box: THREE.Box3 = new THREE.Box3().setFromObject(entry.object);
    if (box.isEmpty()) continue;
    const known: THREE.Box3 | undefined = boxes.get(entry.path);
    if (known === undefined) boxes.set(entry.path, box);
    else known.union(box);
  }

  // Kinds the subject supplies, then those the inspection measures.
  const supplied: string[] = (scene.marks?.(0) ?? []).map(
    (mark: IAutoMovieMark): string => mark.kind,
  );
  const measured: string[] = [
    "trail",
    "trail/now",
    "edge",
    ...Object.keys(AUTO_MOVIE_INSPECTION_PALETTE.defect).map(
      (kind: string): string => `defect/${kind}`,
    ),
  ];

  return {
    name,
    durationSeconds: scene.durationSeconds,
    fps: scene.fps,
    width: scene.width,
    height: scene.height,
    views: [
      ...Object.keys(scene.views ?? {}),
      ...autoMovieViewerNamedViewpoints().map(
        (viewpoint: IAutoMovieViewerViewpoint): string => viewpoint.id,
      ),
    ],
    drawables: [...boxes].map(
      ([path, box]: [
        string,
        THREE.Box3,
      ]): IAutoMovieCaptureSubject.IDrawable => ({
        path,
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      }),
    ),
    marks: [...new Set<string>([...supplied, ...measured])],
    ...(scene.instants === undefined
      ? {}
      : {
          instants: scene.instants.map(
            (instant: {
              seconds: number;
              label: string;
            }): IAutoMovieCaptureSubject.IInstant => ({
              seconds: instant.seconds,
              label: instant.label,
            }),
          ),
        }),
  };
}
