import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieSceneCollision } from "@automovie/interface";
import {
  AutoMovieRenderHumanPolygon,
  AutoMovieRenderSceneLayout,
} from "@automovie/render";
import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from "three";

import type { IFilm } from "../../IFilm";
import { stage } from "../scenes/stock-court-possession/001-court/stage";

/**
 * Mount the one-camera, ten-second court film in the scaffold's ordinary film
 * registry. Frame placement reads the native performance at the same source
 * second in the Viewer, capture and render.
 *
 * @param route The score cut or the separate held-rebound variant.
 * @returns A 960 by 540 film at 24 frames per second.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the native source clock, delivery grid, and registered hosts using the same placement.
 * @evidence contracts/development/implementation.md#principled-implementation Draws physical actors and props from native state and shifts the film clock by the accepted initial cut. Observes ball and hoop in the adopted camera and keeps the whole-body verdict alongside drawn geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms A mount retains one body surface per actor and one object per physical prop. A seek places each actor and the ball once. Disposal releases the surfaces, prop materials and scene held by this mount.
 */
export function film(route: stage.Route = "score"): IFilm {
  const width = 960;
  const height = 540;
  return {
    durationSeconds: 10,
    fps: 24,
    width,
    height,
    async create(progress) {
      progress?.("Resolving the stock court");
      const { take, cast, canonical, stock, ring, hoop, filmWindow } =
        stage(route);
      const scene = new Scene();
      scene.background = new Color(0x294050);
      const camera = new PerspectiveCamera(40, width / height, 0.1, 65);
      camera.position.set(9.8, 4.5, 7.2);
      camera.lookAt(0.05, 1.55, 2.65);
      scene.add(new HemisphereLight(0xffeed9, 0x889bb0, 2.2));
      const key = new DirectionalLight(0xffe6c7, 2.1);
      key.position.set(2.5, 7, -1.5);
      scene.add(key);
      const floor = new Mesh(
        new PlaneGeometry(65, 65),
        new MeshStandardMaterial({ color: 0x76451e, roughness: 0.77 }),
      );
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      const court = new Group();
      scene.add(court);
      const offense = new Set(["a", "receiver", "a3", "a4", "a5"]);
      const ownership = new Map<
        Object3D,
        Omit<IAutoMovieSceneCollision.IPart, "geometry">
      >();
      const actors = cast.map(({ subject }) => {
        const tint = offense.has(subject) ? 0x5aabc4 : 0xc3442e;
        const display = AutoMovieHumanCanonicalBody.display(
          canonical,
          take.pose(subject, filmWindow.start),
        );
        const surface = AutoMovieRenderHumanPolygon.build(display, {
          partColors: {
            hips: tint,
            spine: tint,
            chest: tint,
            leftShoulder: tint,
            rightShoulder: tint,
          },
        });
        const world = new Group();
        world.name = subject;
        world.matrixAutoUpdate = false;
        world.matrix.copy(
          new Matrix4().fromArray(AutoMovieHumanCanonicalBody.REFLECTION),
        );
        world.add(surface.object);
        let part = 0;
        world.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          ownership.set(object, {
            id: `${subject}/${part++}`,
            group: { id: subject, kind: "deformable-body" },
          });
        });
        court.add(world);
        return { subject, surface };
      });
      const ball = AutoMovieRenderSceneLayout.buildModel(stock).object;
      ball.name = "court-ball-root";
      const basket = AutoMovieRenderSceneLayout.buildModel(ring).object;
      basket.name = "court-hoop-root";
      basket.position.set(
        hoop.frame.position.x,
        hoop.frame.position.y,
        hoop.frame.position.z,
      );
      basket.quaternion.set(
        hoop.frame.rotation.x,
        hoop.frame.rotation.y,
        hoop.frame.rotation.z,
        hoop.frame.rotation.w,
      );
      court.add(ball, basket);

      return {
        scene,
        camera,
        inspectionCamera: () => [
          { path: "ball", target: ball },
          { path: "hoop", target: basket },
        ],
        inspectionLayers: (sample) => [
          {
            id: "court",
            localSeconds: sample.time.filmSeconds,
            root: court,
            ownership,
          },
        ],
        humanPerformance: () => ({
          performance: take,
          paths: Object.fromEntries(
            actors.map(({ subject }) => [subject, subject]),
          ),
        }),
        seek(seconds) {
          const raw = filmWindow.start + seconds;
          for (const { subject, surface } of actors)
            surface.setPose(
              AutoMovieHumanCanonicalBody.display(
                canonical,
                take.pose(subject, raw),
              ),
            );
          const held = take.prop("ball", raw);
          ball.position.set(held.position.x, held.position.y, held.position.z);
          ball.quaternion.set(
            held.rotation.x,
            held.rotation.y,
            held.rotation.z,
            held.rotation.w,
          );
          scene.updateMatrixWorld(true);
        },
        dispose() {
          for (const { surface } of actors) surface.dispose();
          for (const root of [ball, basket, floor])
            root.traverse((object) => {
              if (!(object instanceof Mesh)) return;
              object.geometry.dispose();
              for (const material of Array.isArray(object.material)
                ? object.material
                : [object.material])
                material.dispose();
            });
          scene.clear();
        },
      };
    },
  };
}
