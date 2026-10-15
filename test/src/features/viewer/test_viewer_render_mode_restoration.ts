import {
  EDGE_SHELL_NAME,
  POSE_OVERLAY_NAME,
  applyRenderMode,
  collectAutoMovieOwnedResources,
  restoreAutoMovieRenderModeState,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

const caught: (operation: () => void) => unknown = (
  operation: () => void,
): unknown => {
  try {
    operation();
    return undefined;
  } catch (error) {
    return error;
  }
};

/**
 * A failed resource listener cannot retain a structural override or skip its neighboring scene state. Existing real materials and their disposal events exercise that failure while GPU pixels and physical release remain unobserved.
 *
 * Scenarios:
 * 1. Empty and successful restoration sets finish without altering error state.
 * 2. Primary, single, multiple and nested errors retain every independent failure while all later operations still execute.
 * 3. Depth, normal, mask and outline dispose failures still restore original materials, fog, environment, background and non-mesh visibility.
 * 4. Pose geometry disposal failure removes the overlay and restores original mesh visibility and scene state; repeated failed restores keep their original cause without repeating real disposal events.
 * 5. A generic subtree shares geometry and standard/custom shadow materials; the collector names each distinct owner once and adds the shared texture only when decoded textures are owned.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises independent restoration, actual Three disposal events, source-state restoration and owned-resource collection. Failed depth/normal/mask/outline/pose restores must retain their original error and attempt each owned disposal only once; neighboring owners and borrowed scene state must still restore.
 * @evidence contracts/testing.md#independent-expectations Original material/scene object identities and independently recorded dispose events define restoration and ownership. Box resources are actual Three objects without a renderer, so these assertions do not prove hardware pixels, anatomical validity, kernel memory release or physical process shutdown.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/successful restoration, primary/single/multiple/opaque aggregate failures, four material passes plus pose, shared custom-shadow resources, borrowed versus decoded textures and an empty subtree. Shader appearance and actual browser lifecycle remain separate observation obligations.
 * @evidence contracts/testing.md#execution-ownership This named unit entry calls production source through existing exports, with real CPU-side Three objects and their own event listeners. It creates no browser, GPU, native process, Human model, new probe or dynamic test registration.
 */
export function test_viewer_render_mode_restoration(): void {
  const first: Error = new Error("first"),
    second: Error = new Error("second");
  let calls: number = 0;
  restoreAutoMovieRenderModeState([]);
  restoreAutoMovieRenderModeState([
    (): void => {
      calls++;
    },
  ]);
  TestValidator.predicate(
    "primary error remains first",
    caught((): void =>
      restoreAutoMovieRenderModeState(
        [
          (): void => {
            calls++;
          },
        ],
        { error: first },
      ),
    ) === first,
  );
  TestValidator.predicate(
    "single restore failure retains identity",
    caught((): void =>
      restoreAutoMovieRenderModeState([
        (): void => {
          throw first;
        },
        (): void => {
          calls++;
        },
      ]),
    ) === first,
  );
  const aggregate: unknown = caught((): void =>
    restoreAutoMovieRenderModeState([
      (): void => {
        throw new AggregateError([new AggregateError([first]), second]);
      },
      (): void => {
        calls++;
      },
    ]),
  );
  TestValidator.predicate(
    "nested failures flatten in order",
    aggregate instanceof AggregateError &&
      aggregate.errors[0] === first &&
      aggregate.errors[1] === second,
  );
  TestValidator.equals("all independent operations attempted", calls, 4);
  const emptyAggregate: AggregateError = new AggregateError(
    [],
    "opaque failure",
  );
  TestValidator.predicate(
    "empty aggregate is an opaque failure, not success",
    caught((): void =>
      restoreAutoMovieRenderModeState([
        (): void => {
          throw emptyAggregate;
        },
      ]),
    ) === emptyAggregate,
  );
  for (const pass of ["depth", "normal", "mask", "outline"] as const) {
    const scene: THREE.Scene = new THREE.Scene(),
      geometry: THREE.BoxGeometry = new THREE.BoxGeometry(),
      material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(),
      mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    const background: THREE.Color = new THREE.Color(0x123456),
      fog: THREE.Fog = new THREE.Fog(0, 1, 10),
      environment: THREE.Texture = new THREE.Texture(),
      line: THREE.LineSegments = new THREE.LineSegments(
        new THREE.BufferGeometry(),
      );
    scene.background = background;
    scene.fog = fog;
    scene.environment = environment;
    scene.add(mesh, line);
    const mode: ReturnType<typeof applyRenderMode> = applyRenderMode(
        scene,
        pass,
      ),
      override: THREE.Material = mesh.material as THREE.Material;
    let attempts: number = 0;
    override.addEventListener("dispose", (): void => {
      ++attempts;
      throw first;
    });
    const error: unknown = caught((): void => mode.restore());
    TestValidator.predicate("real dispose failure retained", error === first);
    TestValidator.predicate(
      "all scene and material state restored",
      mesh.material === material &&
        scene.background === background &&
        scene.fog === fog &&
        scene.environment === environment &&
        line.visible &&
        scene.getObjectByName(EDGE_SHELL_NAME) === undefined,
    );
    TestValidator.predicate(
      "failed repeat keeps original cause without another disposal",
      caught((): void => mode.restore()) === first && attempts === 1,
    );
    TestValidator.predicate(
      "another same-scene pass cannot reacquire over failed material ownership",
      caught(
        (): ReturnType<typeof applyRenderMode> => applyRenderMode(scene, pass),
      ) === first && attempts === 1,
    );
    geometry.dispose();
    material.dispose();
    environment.dispose();
    line.geometry.dispose();
  }
  const scene: THREE.Scene = new THREE.Scene(),
    geometry: THREE.BoxGeometry = new THREE.BoxGeometry(),
    material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(),
    mesh: THREE.Mesh = new THREE.Mesh(geometry, material),
    bone: THREE.Bone = new THREE.Bone(),
    child: THREE.Bone = new THREE.Bone();
  bone.add(child);
  scene.add(mesh, bone);
  const background: THREE.Color = new THREE.Color(0x112233);
  scene.background = background;
  const pose: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      "pose",
    ),
    overlay: THREE.Object3D = scene.getObjectByName(POSE_OVERLAY_NAME)!;
  const segment: THREE.Line = overlay.children[0] as THREE.Line;
  let poseAttempts: number = 0;
  segment.geometry.addEventListener("dispose", (): void => {
    ++poseAttempts;
    throw first;
  });
  TestValidator.predicate(
    "pose resource failure retained",
    caught((): void => pose.restore()) === first,
  );
  TestValidator.predicate(
    "pose state restored despite disposal",
    mesh.visible &&
      scene.background === background &&
      scene.getObjectByName(POSE_OVERLAY_NAME) === undefined,
  );
  TestValidator.predicate(
    "failed pose repeat keeps its cause without reissuing disposal",
    caught((): void => pose.restore()) === first && poseAttempts === 1,
  );
  TestValidator.predicate(
    "failed outer pose owner refuses another same-scene pass",
    caught(
      (): ReturnType<typeof applyRenderMode> => applyRenderMode(scene, "pose"),
    ) === first && poseAttempts === 1,
  );
  geometry.dispose();
  material.dispose();

  const owned: THREE.Group = new THREE.Group();
  const sharedGeometry: THREE.BoxGeometry = new THREE.BoxGeometry();
  const image: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array(4),
    1,
    1,
  );
  const sharedMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    map: image,
  });
  const shadow: THREE.MeshDepthMaterial = new THREE.MeshDepthMaterial({
    map: image,
  });
  const distance: THREE.MeshDistanceMaterial = new THREE.MeshDistanceMaterial({
    map: image,
  });
  const a: THREE.Mesh = new THREE.Mesh(sharedGeometry, [
    sharedMaterial,
    shadow,
  ]);
  const b: THREE.Mesh = new THREE.Mesh(sharedGeometry, sharedMaterial);
  a.customDepthMaterial = shadow;
  a.customDistanceMaterial = distance;
  b.customDepthMaterial = shadow;
  owned.add(a, b, new THREE.Object3D());
  const collected: ReturnType<typeof collectAutoMovieOwnedResources> =
    collectAutoMovieOwnedResources(owned);
  TestValidator.equals(
    "shared subtree resources have distinct ownership",
    collected.length,
    4,
  );
  TestValidator.predicate(
    "collector includes each actual custom shadow role",
    collected[0] === sharedGeometry &&
      collected.includes(sharedMaterial) &&
      collected.includes(shadow) &&
      collected.includes(distance),
  );
  const decoded: ReturnType<typeof collectAutoMovieOwnedResources> =
    collectAutoMovieOwnedResources(owned, true);
  TestValidator.equals(
    "all material roles share one owned texture",
    decoded.length,
    5,
  );
  TestValidator.predicate(
    "texture follows geometry and all materials",
    decoded[4] === image,
  );
  TestValidator.equals(
    "empty subtree has no release attempts",
    collectAutoMovieOwnedResources(new THREE.Group(), true).length,
    0,
  );
  for (const resource of decoded) resource.dispose();
}
