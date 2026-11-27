import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieMotionTake,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanPerformance } from "@automovie/motions";
import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawScene,
  IAutoMovieDrawSubject,
} from "@automovie/render";
import {
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
} from "three";

import { replayMotionTake } from "../../src/executable/motionTake/replayMotionTake";
import { createMotionTakeSource } from "./source";

/** Draw the tracked ball and catching hand from uninterrupted or reopened owner state. */
export const subjects: AutoMovieDrawSubjects = (
  props: unknown,
): Record<string, IAutoMovieDrawSubject> => ({
  stage: {
    create: async (): Promise<IAutoMovieDrawScene> => {
      const source: ReturnType<typeof createMotionTakeSource> =
        createMotionTakeSource();
      const take: IAutoMovieMotionTake | null =
        props === undefined || props === null ? null : AutoMovieEngineFilm.admitMotionTake(props);
      const performance: AutoMovieMotionHumanPerformance =
        take === null
          ? new AutoMovieMotionHumanPerformance(source.human["staged-catch"]!)
          : replayMotionTake(source, take.anchor).source;
      const scene: Scene = new Scene();
      const camera: PerspectiveCamera = new PerspectiveCamera(
        17,
        160 / 96,
        0.1,
        20,
      );
      camera.position.set(4, 1.3, 1.1);
      camera.lookAt(0, 1.3, 1.1);
      const geometry: SphereGeometry = new SphereGeometry(0.075, 12, 8);
      const ball: Mesh<SphereGeometry, MeshBasicMaterial> = new Mesh(
        geometry,
        new MeshBasicMaterial({ color: 0x44bbff }),
      );
      const hand: Mesh<SphereGeometry, MeshBasicMaterial> = new Mesh(
        geometry,
        new MeshBasicMaterial({ color: 0xffbb44 }),
      );
      scene.add(ball, hand);
      return {
        scene,
        camera,
        durationSeconds: performance.duration,
        fps: 24,
        width: 160,
        height: 96,
        seek: async (seconds: number): Promise<void> => {
          const position: IAutoMovieVector3 = performance.prop(
            "foam-ball",
            seconds,
          ).position;
          const wrist: IAutoMovieVector3 = performance
            .bones("catcher", seconds)
            .get("rightHand")!.worldPosition;
          ball.position.set(position.x, position.y, position.z);
          hand.position.set(wrist.x, wrist.y, wrist.z);
        },
        dispose: (): void => {
          geometry.dispose();
          ball.material.dispose();
          hand.material.dispose();
        },
      };
    },
  },
});
