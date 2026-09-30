import { createHumanObservation } from "@automovie/playground/src/human/observation/createHumanObservation";
import type { HumanObservationPass } from "@automovie/playground/src/human/observation/HumanObservationPass";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * A structural pass is a material override on the scene, and the outline pass
 * adds a back-face rim that must appear and disappear with it.
 *
 * Scenarios:
 * 1. With no pass, the override is the viewport's clay toggle: none when off,
 *    the clay material when on.
 * 2. The `clay` pass draws the clay material whatever the toggle says.
 * 3. `normal`, `depth`, `flat` and `wire` each return their own material kind:
 *    normal, a depth shader whose range is the subject's (near = the camera's
 *    distance to the subject minus its radius, far = plus), flat shading, and
 *    wireframe. The hardware depth would read as flat black, so the linear
 *    range is pinned.
 * 4. The outline rim is two CSS pixels wide on screen: at a distance of 4 m,
 *    a 30 degree field and a 600 px surface, 2 * 2 * 4 * tan(15 degrees) / 600
 *    metres. The outline pass returns no scene override, swaps each displayed mesh's
 *    material for a plain white one and gives it one rim child that shares its
 *    geometry; the rim follows the mesh's visibility, and returning to beauty
 *    removes every rim and gives every mesh its own material back.
 * 5. Negative twin: a pass other than outline creates no rim, and applying the
 *    outline twice does not stack rims.
 * 6. A rim of a discarded group is forgotten when the group is replaced.
 * 7. Negative twin: an unknown pass name throws with the name and leaves the
 *    previous pass in force, instead of silently drawing the product frame.
 */
export const test_human_observation_passes = (): void => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const orbit = {
    target: new THREE.Vector3(),
    enableDamping: true,
    minDistance: 0.1,
    maxDistance: 10,
    update: () => {},
  };
  const clay = new THREE.MeshStandardMaterial();
  const mesh = (name: string): THREE.Mesh => {
    const made = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x336699 }),
    );
    made.name = name;
    return made;
  };
  const first = new THREE.Group();
  const [a, b] = ["a", "b"].map(mesh);
  first.add(a, b);
  scene.add(first);
  let roots: THREE.Object3D[] = [first];
  const { hooks, override, apply } = createHumanObservation({
    scene,
    camera,
    orbit,
    roots: () => roots,
    clay,
    height: () => 600,
  });

  TestValidator.equals("beauty, clay off", override(false), null);
  TestValidator.equals("beauty, clay on", override(true), clay);
  hooks.pass("clay");
  TestValidator.equals("clay pass, toggle off", override(false), clay);

  const pick = (pass: HumanObservationPass): THREE.Material => {
    hooks.pass(pass);
    return override(false)!;
  };
  TestValidator.predicate(
    "normal pass",
    (pick("normal") as THREE.MeshNormalMaterial).isMeshNormalMaterial === true,
  );
  const depth = pick("depth") as THREE.ShaderMaterial;
  camera.position.set(0, 0, 4);
  apply();
  const radius = Math.sqrt(3) / 2;
  TestValidator.predicate(
    "depth pass spans the subject's own range",
    depth.isShaderMaterial === true &&
      Math.abs(depth.uniforms.near.value - (4 - radius)) < 1e-6 &&
      Math.abs(depth.uniforms.far.value - (4 + radius)) < 1e-6,
  );
  TestValidator.predicate(
    "flat pass shades by face",
    (pick("flat") as THREE.MeshStandardMaterial).flatShading === true,
  );
  TestValidator.predicate(
    "wire pass",
    (pick("wire") as THREE.MeshBasicMaterial).wireframe === true,
  );
  hooks.pass("outline");
  TestValidator.equals("outline uses no scene override", override(false), null);

  const rims = (group: THREE.Group): THREE.Mesh[] =>
    group.children.flatMap((child) =>
      child.children.filter((rim) => (rim as THREE.Mesh).isMesh),
    ) as THREE.Mesh[];
  hooks.pass("wire");
  apply();
  TestValidator.equals("no rim outside the outline pass", rims(first).length, 0);

  hooks.pass("outline");
  apply();
  apply();
  TestValidator.equals("one rim per mesh, not stacked", rims(first).length, 2);
  TestValidator.predicate(
    "meshes are drawn white under the outline pass",
    [a, b].every(
      (mesh) => (mesh.material as THREE.MeshBasicMaterial).color.getHex() === 0xffffff,
    ),
  );
  const shell = (a.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
  TestValidator.predicate(
    "the rim is two screen pixels wide at the subject's distance",
    Math.abs(
      shell.uniforms.thickness.value -
        (2 * 2 * 4 * Math.tan(Math.PI / 12)) / 600,
    ) < 1e-9,
  );
  TestValidator.predicate(
    "the rim shares its mesh's geometry",
    a.children[0] instanceof THREE.Mesh &&
      (a.children[0] as THREE.Mesh).geometry === a.geometry,
  );
  hooks.isolate(["a"]);
  apply();
  TestValidator.equals(
    "the rim follows the mesh's visibility",
    [
      (a.children[0] as THREE.Mesh).visible,
      (b.children[0] as THREE.Mesh).visible,
    ],
    [true, false],
  );

  const second = new THREE.Group();
  const c = mesh("a");
  second.add(c);
  roots = [second];
  apply();
  TestValidator.equals("the new group gets its own rim", rims(second).length, 1);

  hooks.pass("beauty");
  apply();
  TestValidator.equals("beauty removes the rims", rims(second).length, 0);
  let refusal = "";
  try {
    hooks.pass("shiny" as never);
  } catch (error) {
    refusal = (error as Error).message;
  }
  TestValidator.predicate("unknown pass is refused by name", refusal.includes("shiny"));
  TestValidator.equals("previous pass stays", hooks.state().pass, "beauty");
  TestValidator.predicate(
    "beauty gives every mesh its own material back",
    (c.material as THREE.MeshBasicMaterial).color.getHex() !== 0xffffff &&
      (a.material as THREE.MeshBasicMaterial).color.getHex() !== 0xffffff,
  );
};
