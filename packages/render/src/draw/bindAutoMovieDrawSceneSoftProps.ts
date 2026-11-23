import type { IAutoMovieRenderSoftPropFrame } from "@automovie/interface";

import type { IAutoMovieSceneSoftProps } from "../scene/IAutoMovieSceneSoftProps.js";
import { buildSceneSoftProps } from "../scene/buildSceneSoftProps.js";
import { restoreAutoMovieRenderModeOnce } from "../scene/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../scene/restoreAutoMovieRenderModeState.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * Route soft prop surfaces from a producer into the draw subject's scene. Each
 * requested second is read after the subject has placed its other objects, by
 * `seek`, `place` or a transition's `seekShot`, whose output second it reads.
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

    // A transition's outgoing shot reads the producer on the output clock, as
    // every other output-clock reading of a shot placement does.
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
