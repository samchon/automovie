import {
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** Display the public Human result through the existing viewer implementation.
 * loadGenerated consumes result.model and inspects result.parameters. generate
 * calls the public stub and reports its failure; untrusted JSON has no runtime
 * admission yet. No old result, recovered sample or fabricated geometry is used.
 *
 * @evidence contracts/common.md#principled-implementation Existing buildModel and mountViewer consume the exact public model while the corresponding parameters are inspected separately.
 * @evidence contracts/common.md#clear-and-simple-design One page owns the existing viewer mount and typed result; the browser entry mounts it once and optionally fetches JSON for inspection without runtime admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unimplemented public generator throws; no old model, unchecked JSON cast or successful empty result replaces it.
 * @evidence contracts/common.md#meaningful-documentation States typed result consumption, unavailable JSON admission and honest generator failure.
 * @evidence contracts/performance.md#efficient-algorithms A result builds one viewer object; camera motion reuses it without regeneration.
 * @evidence contracts/performance.md#reuse-equivalent-work Model and parameter inspection share the same accepted result object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One mount, controls and current model belong to the page; replacement joins sticky model retirement, disposal joins cleanup and stops the viewer, and the browser entry aborts its optional fetch and requests disposal on pagehide.
 */
export function mountHumanViewerPage(root: HTMLElement): {
  load: (candidate: unknown) => Promise<{ accepted: false; cause: string }>;
  loadGenerated: (result: IAutoMovieHumanGenerated) => Promise<void>;
  generate: (parameters: IAutoMovieHumanParameters) => Promise<void>;
  save: () => string;
  snapshot: () => object;
  setPass: (pass: "surface" | "overlay" | "construction") => void;
  dispose: () => Promise<void>;
} {
  const status: HTMLParagraphElement = document.createElement("p");
  status.id = "human-status";
  status.textContent = "Human 생성은 아직 구현되지 않았습니다.";
  const input: HTMLPreElement = document.createElement("pre");
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "70vh";
  root.replaceChildren(status, canvas, input);
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    35,
    1,
    0.001,
    1000,
  );
  camera.position.set(3, 1, 3);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(2, 4, 3);
  scene.add(light);
  const controls: OrbitControls = new OrbitControls(camera, canvas);
  let mount: ReturnType<typeof mountViewer>;
  try {
    mount = mountViewer(canvas, scene, camera, (): void => {
      controls.update();
    });
  } catch (error) {
    controls.dispose();
    throw error;
  }
  let current:
    | {
        result: IAutoMovieHumanGenerated;
        object: THREE.Group;
        close: () => Promise<void>;
      }
    | undefined;
  let closed: boolean = false;
  let pending: boolean = false;
  let closing: Promise<void> | undefined;
  const loadGenerated: (
    result: IAutoMovieHumanGenerated,
  ) => Promise<void> = async (
    result: IAutoMovieHumanGenerated,
  ): Promise<void> => {
    if (closed || pending) throw new Error("Human viewer is closed or busy");
    pending = true;
    try {
      if (current !== undefined) {
        current.object.removeFromParent();
        await current.close();
        current = undefined;
      }
      if (closed)
        throw new Error("Human viewer closed during result replacement");
      const built: ReturnType<typeof buildModel> = buildModel(result.model);
      const close: () => Promise<void> = createAutoMovieResourceRetirement(
        collectAutoMovieOwnedResources(built.object).map(
          (resource: { dispose(): void }): (() => void) =>
            (): void =>
              resource.dispose(),
        ),
      );
      current = { result, object: built.object, close };
      scene.add(built.object);
      input.textContent = JSON.stringify(result.parameters, null, 2);
      const box: THREE.Box3 = new THREE.Box3().setFromObject(built.object);
      if (!box.isEmpty()) {
        const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
        const distance: number = box.getSize(new THREE.Vector3()).length();
        controls.target.copy(centre);
        camera.position
          .copy(centre)
          .add(new THREE.Vector3(distance, distance / 2, distance));
        controls.update();
      }
      status.textContent =
        "생성된 Human 모델과 실제 입력 파라미터를 표시합니다.";
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      pending = false;
    }
  };
  return {
    load: async (
      candidate: unknown,
    ): Promise<{ accepted: false; cause: string }> => {
      input.textContent = JSON.stringify(candidate, null, 2);
      const cause: string =
        "외부 JSON의 Human 런타임 입력 검증은 아직 구현되지 않았습니다.";
      status.textContent = cause;
      return { accepted: false, cause };
    },
    loadGenerated,
    generate: async (parameters: IAutoMovieHumanParameters): Promise<void> => {
      try {
        await loadGenerated(AutoMovieHuman.generate(parameters));
      } catch (error) {
        status.textContent =
          error instanceof Error ? error.message : String(error);
        throw error;
      }
    },
    save: (): string => {
      if (current === undefined)
        throw new Error("No generated Human is loaded");
      return JSON.stringify(current.result.parameters, null, 2);
    },
    snapshot: (): object => ({
      status: current === undefined ? "unimplemented" : "loaded",
      parameters: current?.result.parameters,
    }),
    setPass: (pass: "surface" | "overlay" | "construction"): void => {
      if (pass !== "surface")
        throw new Error(
          "Human construction output is not part of this contract",
        );
    },
    dispose: (): Promise<void> => {
      closed = true;
      closing ??= (async (): Promise<void> => {
        try {
          current?.object.removeFromParent();
          await current?.close();
          current = undefined;
        } finally {
          try {
            controls.dispose();
          } finally {
            try {
              mount.stop();
            } finally {
              root.replaceChildren();
            }
          }
        }
      })();
      return closing;
    },
  };
}
