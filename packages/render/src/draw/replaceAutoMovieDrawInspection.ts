import type { IAutoMovieMark } from "@automovie/interface";

import type { IApplyAutoMovieInspectionProps } from "../scene/inspection/IApplyAutoMovieInspectionProps.js";
import type { IAutoMovieInspectionHandle } from "../scene/inspection/IAutoMovieInspectionHandle.js";
import { applyAutoMovieInspection } from "../scene/inspection/internal/applyAutoMovieInspection.js";

/**
 * End the old inspection before placement and bind a new one to its actual
 * objects.
 *
 * @param props The previous handle, actual scene and request, optional renderer
 *   and lifetime kind declarations, and asynchronous placement that returns
 *   current marks.
 * @returns An inspection of the scene graph that placement actually produced.
 * @throws {Error} When placement or inspection fails; the previous handle has
 *   already been restored.
 */
export async function replaceAutoMovieDrawInspection(props: {
  previous: IAutoMovieInspectionHandle | null;
  scene: IApplyAutoMovieInspectionProps["scene"];
  request: IApplyAutoMovieInspectionProps["request"];
  renderer?: IApplyAutoMovieInspectionProps["renderer"];
  markKinds?: IApplyAutoMovieInspectionProps["markKinds"];
  place: () => Promise<readonly IAutoMovieMark[]>;
}): Promise<IAutoMovieInspectionHandle> {
  props.previous?.restore();
  const marks: readonly IAutoMovieMark[] = await props.place();
  return applyAutoMovieInspection({
    scene: props.scene,
    request: props.request,
    marks,
    markKinds: props.markKinds ?? [],
    ...(props.renderer === undefined ? {} : { renderer: props.renderer }),
  });
}
