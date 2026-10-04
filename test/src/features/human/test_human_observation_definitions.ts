import { HUMAN_OBSERVATION_PASSES } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import { createHumanObservation } from "@automovie/playground/src/human/common/observation/createHumanObservation";
import { getHumanObservationPassDefinition } from "@automovie/playground/src/human/common/observation/getHumanObservationPassDefinition";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Shared pass definitions control the actual materials while preserving the
 * historical flat bookmark. Source restoration precedes disposal and retains
 * requested observation state for the next published group.
 *
 * Scenarios:
 * 1. Every pass has a reading; lit passes are beauty/clay/flat and the others
 *    are structural or base-colour projections without light response.
 * 2. Albedo and outline alternate without retaining one another's replacements;
 *    returning to beauty restores the exact original material and child tree.
 * 3. Restoration precedes source disposal, restores owned hiding, leaves caller
 *    hiding alone, and preserves requested hooks; unknown names refuse.
 */
export const test_human_observation_definitions = (): void => {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  const source = new THREE.MeshStandardMaterial({ color: 0x2468ac });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), source);
  mesh.name = "skin";
  const hidden = new THREE.Mesh();
  hidden.name = "caller-hidden";
  hidden.visible = false;
  root.add(mesh, hidden);
  scene.add(root);
  const clay = new THREE.MeshStandardMaterial();
  const observation = createHumanObservation({
    scene,
    camera: new THREE.PerspectiveCamera(),
    orbit: {
      target: new THREE.Vector3(),
      enableDamping: false,
      minDistance: 0,
      maxDistance: 10,
      update: () => {},
    },
    roots: () => [root],
    clay,
    height: () => 0,
  });
  for (const pass of HUMAN_OBSERVATION_PASSES) {
    const definition = getHumanObservationPassDefinition(pass);
    TestValidator.predicate(
      `${pass} carries a reading`,
      definition.reading.length > 20,
    );
    TestValidator.equals(
      `${pass} light scope`,
      definition.lightScope,
      ["beauty", "clay", "flat"].includes(pass) ? "authored" : "none",
    );
    observation.hooks.pass(pass);
    observation.apply();
    const override = observation.override(false);
    if (pass === "flat")
      TestValidator.predicate(
        "flat retains lit faceted grey",
        override instanceof THREE.MeshStandardMaterial &&
          override.flatShading &&
          override.color.getHex() === 0x999999 &&
          override.roughness === 0.75,
      );
    if (pass === "albedo")
      TestValidator.predicate(
        "albedo retains authored colour without a global override",
        override === null &&
          mesh.material instanceof THREE.MeshBasicMaterial &&
          mesh.material.color.getHex() === 0x2468ac &&
          !mesh.material.toneMapped,
      );
  }
  const altered = getHumanObservationPassDefinition("flat");
  altered.parameters.color = 0xff0000;
  TestValidator.equals(
    "a caller cannot mutate the shared definition",
    getHumanObservationPassDefinition("flat").parameters.color,
    0x999999,
  );
  observation.hooks.pass("albedo");
  observation.apply();
  let cloneDisposals = 0;
  (mesh.material as THREE.Material).addEventListener("dispose", () => {
    ++cloneDisposals;
  });
  observation.hooks.pass("outline");
  observation.apply();
  TestValidator.equals("albedo released before outline", cloneDisposals, 1);
  TestValidator.equals("one outline hull", mesh.children.length, 1);
  // Raycasting an inspection hull must not introduce a second part hit.
  const hits: THREE.Intersection[] = [];
  mesh.children[0].raycast(new THREE.Raycaster(), hits);
  TestValidator.equals("hull has no selection hits", hits.length, 0);
  observation.hooks.pass("albedo");
  observation.apply();
  TestValidator.equals("albedo removes hull", mesh.children.length, 0);
  observation.hooks.isolate([]);
  observation.apply();
  TestValidator.equals("stage hides source", mesh.visible, false);
  observation.restore();
  TestValidator.predicate(
    "restore returns original ownership",
    mesh.material === source && mesh.visible && !hidden.visible,
  );
  TestValidator.equals("restore retains hooks", observation.hooks.state(), {
    pass: "albedo",
    isolated: [],
    hidden: [],
  });
  let sourceDisposals = 0;
  source.addEventListener("dispose", () => {
    ++sourceDisposals;
  });
  (mesh.material as THREE.Material).dispose();
  TestValidator.equals(
    "numerical disposal reaches original once",
    sourceDisposals,
    1,
  );
  observation.hooks.isolate(null);
  observation.hooks.pass("beauty");
  observation.apply();
  TestValidator.predicate(
    "beauty restores source tree",
    mesh.material === source && mesh.children.length === 0,
  );
  let refusal = "";
  try {
    observation.hooks.pass("missing" as never);
  } catch (error) {
    refusal = (error as Error).message;
  }
  TestValidator.predicate(
    "unknown named pass refuses",
    refusal.includes("missing"),
  );
  TestValidator.equals(
    "unknown retains previous pass",
    observation.hooks.state().pass,
    "beauty",
  );
};
