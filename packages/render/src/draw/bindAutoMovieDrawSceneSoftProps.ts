import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";

import type { IAutoMovieSceneSoftProps } from "../scene/IAutoMovieSceneSoftProps.js";
import { buildSceneSoftProps } from "../scene/buildSceneSoftProps.js";
import { restoreAutoMovieRenderModeOnce } from "../scene/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../scene/restoreAutoMovieRenderModeState.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * Route soft prop surfaces from a producer into the draw subject's scene.
 * Each requested second is read after the subject has placed its other objects.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents exact-time reads, placement order and disposal ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The draw host already seeks at the capture cell's second, so this adapter hands that same second to the surface producer and never interpolates particle data.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps the existing subject's scene and presentation data and extends only its seek and disposal boundaries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A placement refusal propagates before a surface read; each successful placement uses the producer's current surfaces and their analysis status.
 * @evidence contracts/development/implementation.md#efficient-algorithms One awaited base seek and one producer call per requested second, plus the current frame's mesh projection.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The mounted mesh owner serves every seek in the subject's lifetime. Surface reads follow the current seek without retaining equivalent-time snapshots.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns the attached soft-prop projection until disposal and independently retires it and the original subject in one attempt.
 */
export function bindAutoMovieDrawSceneSoftProps(
  subject: IAutoMovieDrawScene,
  read: (seconds: number) => readonly IAutoMovieRenderSoftPropFrame[],
): IAutoMovieDrawScene {
  const props: IAutoMovieSceneSoftProps = buildSceneSoftProps(subject.scene);
  let closed: boolean = false;
  return {
    ...subject,
    seek: async (seconds: number): Promise<void> => {
      if (closed) throw new Error("The soft prop draw subject is closed.");
      await subject.seek(seconds);
      if (closed) throw new Error("The soft prop draw subject is closed.");
      props.update(read(seconds));
    },
    dispose: restoreAutoMovieRenderModeOnce((): void => {
      closed = true;
      restoreAutoMovieRenderModeState([
        props.dispose,
        (): void => subject.dispose(),
      ]);
    }),
  };
}
