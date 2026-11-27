import { type IAutoMovieRenderApplyInspectionProps, type IAutoMovieRenderDrawScene, type IAutoMovieRenderViewerViewpoint, AutoMovieRenderSubjectViewpoint, AutoMovieRenderInspectionPath } from "@automovie/render";

import type { IAutoMovieViewerInspectorScene } from "../IAutoMovieViewerInspectorScene";

/*
 * What the inspector learns from a subject placed at its first second: the
 * paths of its scene and of the marks it supplies there, those marks, the kinds
 * it declares, its own views and the viewer's named viewpoints, and its raster
 * and clock.
 *
 * Paths are listed before any inspection adds its own objects to the scene, so
 * the caller reads the facts before applying one.
 */
export function readInspectorFacts(props: {
  /*
   * The created subject, placed at `seconds`.
   */
  instance: IAutoMovieRenderDrawScene;

  /*
   * The placed second.
   */
  seconds: number;
}): IAutoMovieViewerInspectorScene.IFacts {
  const { instance }: typeof props = props;
  const marks: NonNullable<IAutoMovieRenderApplyInspectionProps["marks"]> =
    instance.marks?.(props.seconds) ?? [];
  return {
    paths: [
      ...AutoMovieRenderInspectionPath.list(instance.scene).map(
        ({ path }: { path: string }): string => path,
      ),
      ...marks.map(({ path }: { path: string }): string => path),
    ],
    marks,
    markKinds: instance.markKinds ?? [],
    views: [
      ...Object.keys(instance.views ?? {}),
      ...AutoMovieRenderSubjectViewpoint.autoMovieViewerNamedViewpoints().map(
        ({ id }: IAutoMovieRenderViewerViewpoint): string => id,
      ),
    ],
    width: instance.width,
    height: instance.height,
    durationSeconds: instance.durationSeconds,
    fps: instance.fps,
  };
}
