import type { AutoMovieComposition } from "@automovie/engine";

import { VerticalCamera } from "../../../src/entities/cameras/vertical-camera/VerticalCamera";
import type { Student } from "../../../src/entities/cast/student/Student";
import type { IStageProp } from "../../../src/entities/props/IStageProp";
import type { IStageSet } from "../../../src/entities/sets/IStageSet";
import type { IFilm } from "../../../src/IFilm";
import { StageMount } from "../../../src/interactions/staging/StageMount";

/**
 * A motion rehearsal as a film the capture command can draw: the motion's
 * performers, props and set mounted through the same stage the films use,
 * with the rehearsal's own camera shots (a side view and a front or
 * three-quarter view of each variant) on the 720 × 1280 vertical raster at 24 fps.
 *
 * ```ts
 * export const giveRoom = (): IFilm => rehearsal({ set, students, props: [], duration: 8, compose: (camera) => ... });
 * ```
 */
export function rehearsal(input: {
  set: IStageSet;
  students: Student[];
  props: IStageProp[];
  duration: number;
  compose: (camera: VerticalCamera) => AutoMovieComposition;
  effects?: (resolved: StageMount.IResolved) => StageMount.IEffect[];
}): IFilm {
  return {
    durationSeconds: input.duration,
    fps: 24,
    width: 720,
    height: 1280,
    create: async () => {
      const camera: VerticalCamera = new VerticalCamera();
      const mounted = StageMount.mount({
        set: input.set,
        students: input.students,
        props: input.props,
        camera,
        composition: input.compose(camera),
        duration: input.duration,
        ...(input.effects === undefined ? {} : { effects: input.effects }),
      });
      return { scene: mounted.scene, camera: mounted.camera, seek: mounted.seek, dispose: mounted.dispose };
    },
  };
}
