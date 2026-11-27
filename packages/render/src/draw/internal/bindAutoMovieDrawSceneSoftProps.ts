import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";

import type { IAutoMovieRenderSceneSoftProps } from "../../scene/IAutoMovieRenderSceneSoftProps.js";
import { buildSceneSoftProps } from "../../scene/internal/buildSceneSoftProps.js";
import { restoreAutoMovieRenderModeOnce } from "../../scene/internal/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../../scene/internal/restoreAutoMovieRenderModeState.js";
import type { IAutoMovieRenderDrawScene } from "../IAutoMovieRenderDrawScene.js";

/*
 * Route soft prop surfaces from a producer into the draw subject's scene. The
 * producer is read right after the subject has placed its other objects, by
 * `seek`, `place` or `seekShot`, with the output second, and describes that
 * placement, as every reader of a draw subject does: after `seekShot`, the
 * placed shot at its own shot-local time.
 */
export function bindAutoMovieDrawSceneSoftProps(
  subject: IAutoMovieRenderDrawScene,
  read: (seconds: number) => readonly IAutoMovieRenderSoftPropFrame[],
): IAutoMovieRenderDrawScene {
  const props: IAutoMovieRenderSceneSoftProps = buildSceneSoftProps(subject.scene);
  let closed: boolean = false;
  return {
    ...subject,
    seek: async (seconds: number): Promise<void> => {
      if (closed) throw new Error("The soft prop draw subject is closed.");
      await subject.seek(seconds);
      if (closed) throw new Error("The soft prop draw subject is closed.");
      props.update(read(seconds));
    },
    ...(subject.place === undefined
      ? {}
      : {
          place: (seconds: number): void => {
            if (closed)
              throw new Error("The soft prop draw subject is closed.");
            subject.place!(seconds);
            props.update(read(seconds));
          },
        }),

    // A shot placement reads the producer right after it, with the output
    // second, so the producer describes the shot just placed.
    ...(subject.seekShot === undefined
      ? {}
      : {
          seekShot: async (
            shot: string,
            time: number,
            seconds: number,
          ): Promise<void> => {
            if (closed)
              throw new Error("The soft prop draw subject is closed.");
            await subject.seekShot!(shot, time, seconds);
            if (closed)
              throw new Error("The soft prop draw subject is closed.");
            props.update(read(seconds));
          },
        }),
    dispose: restoreAutoMovieRenderModeOnce((): void => {
      closed = true;
      restoreAutoMovieRenderModeState([
        props.dispose,
        (): void => subject.dispose(),
      ]);
    }),
  };
}
