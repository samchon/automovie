import { createHumanObservation } from "@automovie/playground/src/human/common/observation/createHumanObservation";
import { getHumanObservationBounds } from "@automovie/playground/src/human/common/observation/getHumanObservationBounds";
import { isHumanObservationAuxiliary } from "@automovie/playground/src/human/common/observation/isHumanObservationAuxiliary";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Display instruments do not become parts or enlarge subject framing, even
 * below an ordinary subject mesh. Bounds retain posed/morphed world vertices.
 *
 * Scenarios:
 * 1. A true ancestor marker excludes its descendants; false and string markers
 *    do not exclude ordinary subject meshes. Isolation and outline leave
 *    auxiliary materials and direct visibility untouched.
 * 2. A far auxiliary descendant contributes no subject depth or camera bound;
 *    replaced roots restore the departed mesh's stage-owned visibility.
 * 3. Empty, transformed morph and instanced populations retain their independent
 *    expected world bounds without recursively admitting descendants.
 */
export const test_human_observation_auxiliary = (): void => {
  const root = new THREE.Group();
  const skin = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  );
  skin.name = "skin";
  const instrument = new THREE.Group();
  instrument.userData.humanObservationAuxiliary = true;
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    allowOverride: false,
    toneMapped: false,
  });
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    markerMaterial,
  );
  marker.name = "marker";
  marker.position.set(100, 100, 100);
  instrument.add(marker);
  skin.add(instrument);
  root.add(skin);
  const ordinary = new THREE.Mesh();
  ordinary.name = "ordinary";
  ordinary.userData.humanObservationAuxiliary = "true";
  root.add(ordinary);
  root.userData.humanObservationAuxiliary = false;
  TestValidator.predicate(
    "ancestor marker inherited",
    isHumanObservationAuxiliary(marker),
  );
  TestValidator.predicate(
    "only boolean true excludes",
    !isHumanObservationAuxiliary(ordinary),
  );
  let roots: THREE.Object3D[] = [root, skin];
  const camera = new THREE.PerspectiveCamera(30, 1);
  camera.position.set(0, 0, 4);
  const observation = createHumanObservation({
    scene: new THREE.Scene(),
    camera,
    orbit: {
      target: new THREE.Vector3(),
      enableDamping: false,
      minDistance: 0,
      maxDistance: 10,
      update: () => {},
    },
    roots: () => roots,
    clay: new THREE.MeshStandardMaterial(),
    height: () => 600,
  });
  TestValidator.equals("instrument is not a part", observation.hooks.parts(), [
    "skin",
    "ordinary",
  ]);
  TestValidator.equals(
    "instrument cannot be isolated",
    observation.hooks.isolate(["marker"]),
    ["marker"],
  );
  observation.hooks.isolate(null);
  observation.hooks.pass("depth");
  observation.apply();
  const depth = observation.override(false) as THREE.ShaderMaterial;
  const radius = Math.sqrt(3) / 2;
  TestValidator.predicate(
    "instrument contributes no depth bound",
    Math.abs(depth.uniforms.near.value - (4 - radius)) < 1e-9 &&
      Math.abs(depth.uniforms.far.value - (4 + radius)) < 1e-9,
  );
  observation.hooks.pass("outline");
  observation.apply();
  TestValidator.predicate(
    "manual swaps preserve auxiliary",
    marker.material === markerMaterial &&
      marker.visible &&
      marker.children.length === 0,
  );
  observation.hooks.hide(["skin"]);
  observation.apply();
  roots = [];
  observation.apply();
  TestValidator.predicate(
    "departed source restored",
    skin.visible &&
      skin.material instanceof THREE.MeshStandardMaterial &&
      skin.children.length === 1,
  );
  observation.hooks.pass("depth");
  observation.apply();
  observation.hooks.view("front");
  TestValidator.predicate(
    "empty population remains empty",
    getHumanObservationBounds([]).isEmpty(),
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 2, 3], 3),
  );
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = [
    new THREE.Float32BufferAttribute([2, 0, 0, 2, 0, 0], 3),
  ];
  const morphed = new THREE.Mesh(geometry);
  morphed.morphTargetInfluences![0] = 0.5;
  morphed.position.set(3, 4, 5);
  const box = getHumanObservationBounds([morphed]);
  TestValidator.predicate(
    "posed bounds use morphed world vertices",
    box.min.distanceTo(new THREE.Vector3(4, 4, 5)) < 1e-9 &&
      box.max.distanceTo(new THREE.Vector3(5, 6, 8)) < 1e-9,
  );
  const instanced = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial(),
    2,
  );
  instanced.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-4, 0, 0));
  instanced.setMatrixAt(1, new THREE.Matrix4().makeTranslation(4, 0, 0));
  const instances = getHumanObservationBounds([instanced]);
  TestValidator.predicate(
    "instances retain their full population",
    instances.min.distanceTo(new THREE.Vector3(-5, -1, -1)) < 1e-9 &&
      instances.max.distanceTo(new THREE.Vector3(5, 1, 1)) < 1e-9,
  );
};
