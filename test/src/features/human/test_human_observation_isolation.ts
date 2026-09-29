import { createHumanObservation } from "@automovie/playground/src/human/observation/createHumanObservation";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Isolating and hiding parts is display state: it changes mesh visibility and
 * nothing else. A viewport that never uses the hooks must draw as before, a
 * companion beside the subject is never touched, and a group published after
 * the hook still obeys it.
 *
 * Scenarios:
 * 1. Before any hook, `apply` writes nothing: a mesh a caller hid stays hidden.
 * 2. `parts` lists the root's meshes by name in scene order and does not list
 *    a companion.
 * 3. `isolate(["a"])` shows only `a`, `isolate(null)` shows all again.
 * 4. `hide(["b"])` hides only `b`; `hide(null)` restores it. Isolation and
 *    hiding compose: an isolated part that is also hidden stays hidden.
 * 5. The companion mesh keeps its own visibility throughout.
 * 6. Negative twin: an unknown part name isolates nothing visible and does not
 *    throw, and a part that is not named stays as the hooks left it.
 * 7. A group swapped in after `isolate` is isolated on the next `apply`.
 * 8. `state` reports the current pass, isolation and hidden names.
 */
export const test_human_observation_isolation = (): void => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit = {
    target: new THREE.Vector3(),
    enableDamping: true,
    minDistance: 0.1,
    maxDistance: 10,
    update: () => {},
  };
  const part = (name: string): THREE.Mesh => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    mesh.name = name;
    return mesh;
  };
  const subject = new THREE.Group();
  const [a, b, c] = ["a", "b", "c"].map(part);
  subject.add(a, b, c);
  const companion = part("face");
  scene.add(subject, companion);
  let roots: THREE.Object3D[] = [subject];
  const { hooks, apply } = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: () => roots,
    clay: new THREE.MeshBasicMaterial(),
    height: () => 600,
  });
  const visible = () => [a, b, c].map((mesh) => mesh.visible);

  b.visible = false;
  apply();
  TestValidator.equals("no hook, no write", visible(), [true, false, true]);

  TestValidator.equals("parts by name", hooks.parts(), ["a", "b", "c"]);

  hooks.isolate(["a"]);
  apply();
  TestValidator.equals("isolate a", visible(), [true, false, false]);
  hooks.isolate(null);
  apply();
  TestValidator.equals("isolate null shows all", visible(), [true, true, true]);

  hooks.hide(["b"]);
  apply();
  TestValidator.equals("hide b", visible(), [true, false, true]);
  hooks.isolate(["b", "c"]);
  apply();
  TestValidator.equals("hidden wins over isolated", visible(), [false, false, true]);
  hooks.hide(null);
  hooks.isolate(null);
  apply();
  TestValidator.equals("both cleared", visible(), [true, true, true]);
  TestValidator.equals("companion untouched", companion.visible, true);

  hooks.isolate(["nothing"]);
  apply();
  TestValidator.equals("unknown name isolates nothing", visible(), [false, false, false]);
  TestValidator.equals("companion still untouched", companion.visible, true);

  hooks.isolate(["c"]);
  const swapped = new THREE.Group();
  const [d, e] = ["c", "d"].map(part);
  swapped.add(d, e);
  roots = [swapped];
  apply();
  TestValidator.equals("a swapped-in group obeys isolation", [d.visible, e.visible], [true, false]);

  hooks.hide(["d"]);
  hooks.pass("normal");
  TestValidator.equals("state", hooks.state(), {
    pass: "normal",
    isolated: ["c"],
    hidden: ["d"],
  });
};
