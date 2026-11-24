import { Quaternion, applyLightOverride } from "@automovie/engine";
import {
  IAutoMovieAreaLight,
  IAutoMovieLight,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { applyLightState, buildLight } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose, vclose } from "../../../internal/predicates";

/** A window panel aimed into the room along world −X. */
const WINDOW: IAutoMovieAreaLight = {
  id: "north-window",
  type: "area",
  transform: {
    translation: { x: 4, y: 2.2, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: { x: 1, y: 1, z: 1 },
  },
  color: { r: 0.9, g: 0.94, b: 1, a: null, hex: null },
  intensity: 12,
  width: 2.4,
  height: 1.8,
};

/** The direction a `three.js` light actually emits: its own local −Z. */
const emitted: (light: THREE.Object3D) => IAutoMovieVector3 = (
  light: THREE.Object3D,
): IAutoMovieVector3 => {
  light.updateMatrixWorld(true);
  const forward: THREE.Vector3 = new THREE.Vector3(0, 0, -1).applyQuaternion(
    light.getWorldQuaternion(new THREE.Quaternion()),
  );
  return { x: forward.x, y: forward.y, z: forward.z };
};

/**
 * A rectangular area source reaches `three.js` as a panel with real extent.
 *
 * Scenarios:
 *
 * 1. An area light builds a `RectAreaLight` carrying its exact width, height,
 *    colour, intensity and placement, and emits along the −Z its staged
 *    rotation aimed, with no target child of its own.
 * 2. A second panel also retains its native class, width and lack of a target.
 * 3. The one writer that maps light values writes the panel extent too, so a host
 *    that rebuilds state per frame cannot lose it, and the punctual kinds are
 *    untouched by the new arm.
 * 4. Folding a shot's lighting over an area light keeps its extent and its staged
 *    shadow policy, and gives it no `range`: the panel's falloff comes from its
 *    own area, so no channel writes one.
 */
export function test_unit_viewer_viewer_area_light(): void {
  const built: THREE.RectAreaLight = buildLight(WINDOW) as THREE.RectAreaLight;
  TestValidator.equals(
    "the panel reaches Three.js whole",
    namedFacts([
      ["kind", (): boolean => built instanceof THREE.RectAreaLight],
      ["width", (): boolean => nclose(built.width, 2.4)],
      ["height", (): boolean => nclose(built.height, 1.8)],
      ["intensity", (): boolean => nclose(built.intensity, 12)],
      ["color", (): boolean => nclose(built.color.g, 0.94)],
      [
        "placement",
        (): boolean =>
          vclose(
            {
              x: built.position.x,
              y: built.position.y,
              z: built.position.z,
            },
            { x: 4, y: 2.2, z: 0 },
          ),
      ],
      ["aim", (): boolean => vclose(emitted(built), { x: -1, y: 0, z: 0 })],
      // RectAreaLight owns no target child; an invented target would alter the top-level mask palette index and duplicate its aim.
      ["noTarget", (): boolean => built.children.length === 0],
      ["noShadow", (): boolean => built.castShadow === false],
    ]),
    {
      kind: true,
      width: true,
      height: true,
      intensity: true,
      color: true,
      placement: true,
      aim: true,
      noTarget: true,
      noShadow: true,
    },
  );

  // Repeated construction is observed through panel properties, not global initializer calls.
  const second: THREE.RectAreaLight = buildLight({
    ...WINDOW,
    id: "south-window",
  }) as THREE.RectAreaLight;
  TestValidator.equals(
    "a second panel retains its own extent and native class",
    namedFacts([
      ["kind", (): boolean => second instanceof THREE.RectAreaLight],
      ["width", (): boolean => nclose(second.width, 2.4)],
      ["noTarget", (): boolean => second.children.length === 0],
    ]),
    { kind: true, width: true, noTarget: true },
  );

  const rewritten: THREE.RectAreaLight = new THREE.RectAreaLight(
    0xffffff,
    1,
    1,
    1,
  );
  applyLightState(rewritten, { ...WINDOW, width: 5, height: 0.25 });
  TestValidator.predicate(
    "the one value writer owns the extent too",
    nclose(rewritten.width, 5) && nclose(rewritten.height, 0.25),
  );

  // A panel value applied to a punctual instance changes shared fields without inventing panel extent.
  const mismatched: THREE.PointLight = new THREE.PointLight();
  applyLightState(mismatched, WINDOW);
  TestValidator.predicate(
    "an area value written onto a punctual light touches only shared fields",
    nclose(mismatched.intensity, 12) &&
      nclose(mismatched.distance, 0) &&
      !("width" in mismatched) &&
      !("height" in mismatched),
  );

  const folded: IAutoMovieLight = applyLightOverride(
    { ...WINDOW, castShadow: false } as IAutoMovieLight,
    { intensity: 3 },
  );
  TestValidator.predicate(
    "folding a shot's lighting keeps the panel and adds no falloff",
    folded.type === "area" &&
      nclose(folded.width, 2.4) &&
      nclose(folded.height, 1.8) &&
      nclose(folded.intensity, 3) &&
      folded.castShadow === false &&
      !("range" in folded),
  );
}
