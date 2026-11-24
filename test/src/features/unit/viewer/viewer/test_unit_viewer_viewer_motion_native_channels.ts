import type {
  IAutoMovieClip,
  IAutoMovieNodeChannel,
  IAutoMovieTrack,
} from "@automovie/interface";
import { applyObjectMotion, applyObjectMotions } from "@automovie/render";
import { strict as assert } from "node:assert";
import * as THREE from "three";

function track(
  path: IAutoMovieNodeChannel["path"],
  values: number[],
  times: number[] = [0, 2],
): IAutoMovieTrack {
  return {
    channel: { kind: "node", node: "marker", path },
    times,
    values,
    interpolation: "linear",
  };
}
function clip(id: string, ...tracks: IAutoMovieTrack[]): IAutoMovieClip {
  return { id, name: null, duration: 2, loop: false, tracks };
}
function mesh(weights: number[]): THREE.Mesh {
  const result: THREE.Mesh = new THREE.Mesh();
  result.morphTargetInfluences = weights;
  return result;
}

/**
 * 1. Apply a rigid marker's four channels to its native transform and nested meshes.
 * 2. Switch translation authority at the later key while scale keeps its own author.
 */
export function test_unit_viewer_viewer_motion_native_channels(): void {
  const marker: THREE.Group = new THREE.Group();
  const short: THREE.Mesh = mesh([0]);
  const long: THREE.Mesh = mesh([0, 0, 1]);
  const nested: THREE.Group = new THREE.Group();
  nested.add(long);
  marker.add(short, nested, new THREE.Object3D());
  function resolve(id: string): THREE.Object3D | undefined {
    return id === "marker" ? marker : undefined;
  }
  const move: IAutoMovieTrack = track("translation", [0, 0, 0, 2, 4, 6]);
  const scale: IAutoMovieTrack = track("scale", [1, 1, 1, 2, 2, 2]);
  const motion: IAutoMovieClip = clip(
    "base",
    move,
    scale,
    track("rotation", [0, 0, 0, 1, 0, 1, 0, 0]),
    track("weights", [0, 0, 1, 0.5]),
    {
      ...move,
      channel: { kind: "node", node: "unresolved", path: "translation" },
      values: [0, 0, 0, -2, -4, -6],
    },
    {
      ...move,
      channel: {
        kind: "pointer",
        pointer: "/lights/fill/color",
        valueType: "vec3",
      },
      values: [1, 1, 1, 0, 0, 0],
    },
  );
  applyObjectMotion(motion, 1, resolve);
  assert.deepEqual(marker.position.toArray(), [1, 2, 3]);
  assert.deepEqual(marker.scale.toArray(), [1.5, 1.5, 1.5]);
  const expected: THREE.Quaternion = new THREE.Quaternion(
    0,
    Math.SQRT1_2,
    0,
    Math.SQRT1_2,
  );
  assert.ok(
    marker.quaternion
      .toArray()
      .every(
        (v: number, i: number): boolean =>
          Math.abs(v - expected.toArray()[i]!) <= Number.EPSILON,
      ),
  );
  assert.deepEqual(short.morphTargetInfluences, [0.5]);
  assert.deepEqual(long.morphTargetInfluences, [0.5, 0.25, 1]);
  const late: IAutoMovieClip = clip(
    "later",
    track("translation", [8, 0, 0], [1]),
  );
  const tied: IAutoMovieClip = clip(
    "last",
    track("translation", [9, 0, 0], [1]),
  );
  marker.position.x = -1;
  applyObjectMotions([late], 0, resolve);
  assert.equal(marker.position.x, -1);
  applyObjectMotions([motion, late], 0, resolve);
  assert.deepEqual(marker.position.toArray(), [0, 0, 0]);
  applyObjectMotions([motion, late, tied], 2, resolve);
  assert.deepEqual(marker.position.toArray(), [9, 0, 0]);
  assert.deepEqual(marker.scale.toArray(), [2, 2, 2]);
  applyObjectMotions(
    [
      { ...tied, id: "z" },
      { ...late, id: "a" },
    ],
    2,
    resolve,
  );
  assert.deepEqual(marker.position.toArray(), [8, 0, 0]);
  assert.deepEqual(marker.scale.toArray(), [2, 2, 2]);
}
