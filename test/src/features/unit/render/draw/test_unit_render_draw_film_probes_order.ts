import type { IAutoMovieFilmShading } from "@automovie/interface";
import { AutoMovieFilmIndirectStage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createProbeRendererDouble } from "./createProbeRendererDouble";

/**
 * A probe bake is reused only for a second whose revision names the same lit
 * set, so seconds captured in forward or reverse order draw the same: a reused
 * bake equals what a new bake would produce, and a changed revision bakes
 * afresh from the scene as it stands.
 *
 * The recording renderer reads back, for every cube, a radiance fixed by the
 * scene's state: the intensity of its one light, which the shot raises at its
 * midpoint and whose revision the film changes at the same instant.
 *
 * Scenarios:
 *
 * 1. Drawing the seconds of a shot forward (two seconds at revision "dim", two at
 *    "bright") bakes once per revision, and every draw's probe texture equals a
 *    fresh bake of its own second's scene.
 * 2. Drawing the same seconds in reverse order gives each second the same probe
 *    texture as in forward order.
 * 3. Two draws with an equal revision run no second bake, and the probe texture is
 *    the same object.
 * 4. Changing only the box, the spacing or the layer bakes again, because the key
 *    covers the whole request.
 */
export function test_unit_render_draw_film_probes_order(): void {
  const light: THREE.PointLight = new THREE.PointLight(0xffffff, 10);
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(
    light,
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  );
  const seconds: number[] = [0.5, 1.0, 1.5, 2.0];
  const place: (at: number) => string = (at: number): string => {
    light.intensity = at < 1.25 ? 10 : 40;
    return at < 1.25 ? "dim" : "bright";
  };
  const probes: (
    revision: string,
    extra?: Partial<IAutoMovieFilmShading.IProbes>,
  ) => IAutoMovieFilmShading.IProbes = (
    revision: string,
    extra: Partial<IAutoMovieFilmShading.IProbes> = {},
  ): IAutoMovieFilmShading.IProbes => ({
    min: { x: 0, y: 1, z: 0 },
    max: { x: 1, y: 1, z: 0 },
    spacing: 1,
    layer: 1,
    revision,
    ...extra,
  });
  const draw: (
    stage: AutoMovieFilmIndirectStage,
    double: createProbeRendererDouble.IDouble,
    request: IAutoMovieFilmShading.IProbes,
  ) => number[] = (
    stage: AutoMovieFilmIndirectStage,
    double: createProbeRendererDouble.IDouble,
    request: IAutoMovieFilmShading.IProbes,
  ): number[] => {
    stage.draw(
      {
        renderer: double.renderer,
        scene,
        camera: new THREE.PerspectiveCamera(),
        shading: { probes: request },
        optics: true,
        seconds: 1,
        width: 8,
        height: 8,
        sample: 0,
      },
      (): void => {},
    );
    return Array.from(
      (stage.uniforms.uFilmProbes!.value as THREE.DataTexture).image
        .data as Float32Array,
    );
  };

  // The read-back follows the scene: radiance is the light's intensity, back faces none.
  const reader: () => createProbeRendererDouble.IDouble =
    (): createProbeRendererDouble.IDouble =>
      createProbeRendererDouble({
        texel: (read: number): number => (read % 2 === 0 ? light.intensity : 0),
      });

  // A fresh bake of each second.
  const fresh: Map<number, number[]> = new Map(
    seconds.map((at: number): [number, number[]] => {
      const revision: string = place(at);
      return [
        at,
        draw(new AutoMovieFilmIndirectStage(), reader(), probes(revision)),
      ];
    }),
  );

  // 1 and 2. Forward and reverse.
  for (const order of [seconds, [...seconds].reverse()]) {
    const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
    const double: createProbeRendererDouble.IDouble = reader();
    let equal: boolean = true;
    for (const at of order) {
      const revision: string = place(at);
      equal &&=
        JSON.stringify(draw(stage, double, probes(revision))) ===
        JSON.stringify(fresh.get(at));
    }
    TestValidator.predicate(
      `${order[0] === seconds[0] ? "forward" : "reverse"} order matches fresh bakes, baking once per revision`,
      equal && double.reads() === 2 * 2 * 2,
    );
    stage.dispose();
  }

  // 3. Equal revisions reuse the bake.
  const stage: AutoMovieFilmIndirectStage = new AutoMovieFilmIndirectStage();
  const double: createProbeRendererDouble.IDouble = reader();
  place(0.5);
  draw(stage, double, probes("dim"));
  const texture: unknown = stage.uniforms.uFilmProbes!.value;
  const reads: number = double.reads();
  draw(stage, double, probes("dim"));
  TestValidator.predicate(
    "an equal revision runs no second bake",
    double.reads() === reads && stage.uniforms.uFilmProbes!.value === texture,
  );

  // 4. The whole request is the key.
  let rebakes: boolean = true;
  for (const extra of [
    { max: { x: 2, y: 1, z: 0 } },
    { spacing: 0.5 },
    { layer: 2 },
  ] as Partial<IAutoMovieFilmShading.IProbes>[]) {
    const before: number = double.reads();
    draw(stage, double, probes("dim", extra));
    rebakes &&= double.reads() > before;
  }
  TestValidator.predicate(
    "a changed box, spacing or layer bakes again",
    rebakes,
  );
  stage.dispose();
}
