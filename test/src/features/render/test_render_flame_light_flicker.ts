import { createLight } from "@automovie/archetypes";
import {
  compileAutoMovieFlameFlicker,
  compilePracticalLightMotion,
  sampleAutoMovieFlame,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieFlameCue,
  IAutoMovieModel,
  IAutoMoviePointLight,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  buildModel,
  buildScene,
  prepareAutoMovieFlames,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { renderFixtureIdentity } from "../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A bound flame's applier drives the practical light it motivates: the light
 * flickers with the flame inside `on`, is dark outside it and stands at the
 * emitter, so every host that applies the shot's flames, the Viewer, a capture
 * and the delivered video, shows the light the shot compiled.
 *
 * Scenarios:
 *
 * 1. A 1.2 cd point light bound to a candle flame that burns over [0.5, 2) of a 3
 *    s shot, its clip compiled by `compilePracticalLightMotion` with the
 *    flame's flicker, is dark after `apply` at 0.25 s, 2 s and 2.9 s.
 * 2. At 0.5 s, 1 s, 1.37 s and 1.995 s its intensity is `I_on × A(k) / Ā`, with
 *    `k` the last 1/120 s key at or before the second, `A` the flame's
 *    silhouette area at `k` and `Ā` the mean area over the keys inside [0.5,
 *    2); those intensities are not all equal, so the light flickers.
 * 3. The light stands at the candle's `light` socket and keeps its colour.
 * 4. Applying 1.37 s after 0.5 s and after 2.9 s gives the same intensity, so a
 *    seek and a sequential run light the room alike.
 * 5. A bound flame whose built light `resolveLight` cannot find is refused when
 *    the flames are prepared.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the light, the cue, the sampled seconds and the intensity, placement and refusal each scenario pins.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the flames through the public preparer with buildScene's own light index, calls apply and reads the built THREE.PointLight; a host-side flame that leaves its light at the staged intensity, ignores `on`, or reads the wrong key fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected intensity is issue #4094's light coupling, `I_on · A(t) / Ā` on the 1/120 s step grid and 0 outside `on`, recomputed here from the engine's flame shape sampler rather than read from the compiled track or the applier.
 * @evidence contracts/development/testing.md#distinguishing-cases Seconds before, inside, at the end of and after `on`, a key boundary and seconds between keys, two orders of application, and a light the resolver lacks. The compiled track's own keys belong to test_film_flame_cues; the flame's luminance and faces to test_render_flame_emission.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph built by buildScene; no renderer.
 */
export function test_render_flame_light_flicker(): void {
  const candle: IAutoMovieModel = createLight({ id: "candle", kind: "candle" });
  const socket: IAutoMovieAffordance = candle.affordances!.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === "light",
  )!;
  const light: IAutoMoviePointLight = {
    id: "candle-light",
    type: "point",
    transform: renderFixtureIdentity,
    color: { r: 1, g: 0.6, b: 0.3, a: null, hex: null },
    intensity: 1.2,
    range: 6,
  };
  const scene: IAutoMovieScene = {
    id: "table",
    name: null,
    nodes: [renderFixtureNode("candle-1", candle.id)],
    cameras: [],
    lights: [light],
  };
  const cue: IAutoMovieFlameCue = {
    id: "wick",
    node: "candle-1",
    emitter: "light",
    seed: 3,
    size: { kind: "small", height: 0.03, radius: 0.006 },
    on: [0.5, 2],
    light: "candle-glow",
  };
  const clip: IAutoMovieClip = compilePracticalLightMotion({
    id: "candle-glow",
    duration: 3,
    light,
    prop: scene.nodes[0]!,
    emitter: socket,
    on: cue.on,
    flicker: compileAutoMovieFlameFlicker(cue, 3),
  });
  const object: ReturnType<typeof buildModel> = buildModel(candle);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const built: THREE.Light = mounted.lights.get("candle-light")!;
  const flames: ReturnType<typeof prepareAutoMovieFlames> =
    prepareAutoMovieFlames({
      shot: { flames: [cue], lightMotions: [clip], duration: 3 },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
      resolveLight: (id: string): THREE.Light | undefined =>
        mounted.lights.get(id),
    });
  const at: (seconds: number) => number = (seconds: number): number => {
    flames.apply(seconds);
    return built.intensity;
  };

  // The coupling recomputed: keys every 1/120 s, the mean over [0.5, 2).
  const area: (k: number) => number = (k: number): number =>
    sampleAutoMovieFlame(cue, k / 120).area;
  let sum: number = 0;
  for (let k: number = 60; k < 240; ++k) sum += area(k);
  const mean: number = sum / 180;
  const expected: (seconds: number) => number = (seconds: number): number =>
    (1.2 * area(Math.floor(seconds * 120 + 1e-9))) / mean;

  // 1. Dark outside `on`, its end included.
  TestValidator.predicate(
    "the light is dark before, at the end of and after the flame's interval",
    [0.25, 2, 2.9].every((seconds: number): boolean => at(seconds) === 0),
  );

  // 2. The flicker inside `on`.
  const inside: number[] = [0.5, 1, 1.37, 1.995];
  const read: number[] = inside.map(at);
  TestValidator.predicate(
    `the light holds I_on · A / Ā at the key in force (${read.map((value: number): string => value.toFixed(4)).join(", ")})`,
    read.every((value: number, index: number): boolean =>
      nclose(value, expected(inside[index]!), 1e-9),
    ) && new Set(read).size > 1,
  );

  // 3. Placement and colour.
  mounted.scene.updateMatrixWorld(true);
  const position: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    built.matrixWorld,
  );
  TestValidator.predicate(
    "the light stands at the candle's socket in its colour",
    position.distanceTo(
      new THREE.Vector3(
        socket.frame.translation.x,
        socket.frame.translation.y,
        socket.frame.translation.z,
      ),
    ) <= 1e-9 &&
      built.color.r === 1 &&
      nclose(built.color.g, 0.6, 1e-7) &&
      nclose(built.color.b, 0.3, 1e-7),
  );

  // 4. Seek order.
  at(0.5);
  const forward: number = at(1.37);
  at(2.9);
  TestValidator.equals("a seek lights as a sequence does", at(1.37), forward);
  flames.dispose();

  // 5. A light the resolver lacks.
  TestValidator.error("a bound flame needs its built light", (): void => {
    prepareAutoMovieFlames({
      shot: { flames: [cue], lightMotions: [clip], duration: 3 },
      scene,
      models: [candle],
      resolveNode: (): ReturnType<typeof buildModel> => object,
      resolveLight: (): THREE.Light | undefined => undefined,
    });
  });
}
