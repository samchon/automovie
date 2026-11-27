import type { IAutoMovieMark } from "@automovie/interface";
import type { IAutoMovieRenderReplaceDrawInspectionProps } from "../IAutoMovieRenderReplaceDrawInspectionProps";

import type { IAutoMovieRenderInspectionHandle } from "../../scene/IAutoMovieRenderInspectionHandle";
import { applyInspection } from "../../scene/inspection/internal/applyInspection";

/*
 * End the old inspection before placement and bind a new one to its actual
 * objects.
 * Parameter props: The previous handle, actual scene and request, optional renderer
 * and lifetime kind declarations, and asynchronous placement that returns
 * current marks.
 * Returns: An inspection of the scene graph that placement actually produced.
 * When placement or inspection fails; the previous handle has
 * already been restored.
 */
export async function replaceDrawInspection(props: IAutoMovieRenderReplaceDrawInspectionProps): Promise<IAutoMovieRenderInspectionHandle> {
  props.previous?.restore();
  const marks: readonly IAutoMovieMark[] = await props.place();
  return applyInspection({
    scene: props.scene,
    request: props.request,
    marks,
    markKinds: props.markKinds ?? [],
    ...(props.renderer === undefined ? {} : { renderer: props.renderer }),
  });
}
