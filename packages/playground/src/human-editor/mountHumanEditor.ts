import {
  AutoMovieHuman,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import {
  AutoMovieTextureCache,
  type IAutoMovieModelObject,
  type IAutoMovieViewerHandle,
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
  materialTextureBindings,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { f1, f2, m1, m2 } from "../human-parameters";
import { HumanEditorMeasureFields } from "./HumanEditorMeasureFields";

/** Mount the ordinary parameter editor with generic model rendering.
 * Draft controls retain their public units and generate only after Apply.
 * Construction parts, diagnostic passes and capture services belong to Human's
 * unpublished development application. This editor owns one displayed model,
 * its texture cache and orbit controls, releasing them before replacement.
 *
 * @evidence contracts/common.md#principled-implementation Public typed body measures (`body.anatomy`, each shown with its resolved value) update a detached draft; Apply passes it to the generator and generic model renderer, with no diagnostic construction parts.
 * @evidence contracts/common.md#clear-and-simple-design This page owns end-user edits and one displayed model; Human development diagnostics remain in the unpublished application.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four typed examples initialize ordinary inputs; generation follows the public generator without result substitutions or person-specific geometry.
 * @evidence contracts/common.md#meaningful-documentation Documents Apply-only generation, public units and ownership of the displayed model, texture cache and controls.
 * @evidence contracts/performance.md#efficient-algorithms Each Apply runs one generator and builds one model; camera fitting traverses its objects and controls scale with body fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Camera motion redraws the existing model; editing and example selection update only the draft until Apply.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacement retires owned model resources and textures; page disposal aborts handlers and releases controls and renderer. A synchronous generation already running must complete before page shutdown can progress.
 */
export function mountHumanEditor(root: HTMLElement): () => Promise<void> {
  const examples: Record<string, IAutoMovieHumanParameters> = {
    f1,
    f2,
    m1,
    m2,
  };
  const events: AbortController = new AbortController();
  let fieldEvents: AbortController = new AbortController();
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color("#eef1f5");
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    30,
    1,
    0.01,
    100,
  );
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const sidebar: HTMLElement = document.createElement("aside");
  sidebar.className = "human-sidebar";
  const title: HTMLHeadingElement = document.createElement("h1");
  title.textContent = "Human 파라미터 편집";
  const description: HTMLParagraphElement = document.createElement("p");
  description.textContent = "치수는 mm 단위입니다. 값을 편집한 뒤 적용하세요.";
  const example: HTMLSelectElement = document.createElement("select");
  example.setAttribute("aria-label", "시작 예시");
  for (const alias of Object.keys(examples)) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = alias;
    option.textContent = alias;
    example.append(option);
  }
  const apply: HTMLButtonElement = document.createElement("button");
  apply.textContent = "적용";
  apply.className = "primary";
  const save: HTMLButtonElement = document.createElement("button");
  save.textContent = "파라미터 저장";
  const fields: HTMLDivElement = document.createElement("div");
  fields.id = "human-fields";
  const status: HTMLParagraphElement = document.createElement("p");
  status.setAttribute("role", "status");
  const viewport: HTMLDivElement = document.createElement("div");
  viewport.id = "human-viewport";
  viewport.append(canvas);
  sidebar.append(title, description, example, apply, save, fields, status);
  root.replaceChildren(sidebar, viewport);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 0.6));
  const light: THREE.DirectionalLight = new THREE.DirectionalLight(
    0xffffff,
    2.2,
  );
  light.position.set(4, 5, 3);
  scene.add(light);
  const controls: OrbitControls = new OrbitControls(camera, canvas);
  let draft: IAutoMovieHumanParameters = structuredClone(f1);
  let displayed: IAutoMovieModelObject | undefined;
  let retirement: (() => Promise<void>) | undefined;
  let closed: boolean = false;
  let busy: boolean = false;
  let dirty: boolean = true;
  let width: number = 0;
  let height: number = 0;
  const mount: IAutoMovieViewerHandle = mountViewer(
    canvas,
    scene,
    camera,
    (): boolean => {
      const nextWidth: number = canvas.clientWidth;
      const nextHeight: number = canvas.clientHeight;
      if (nextWidth !== width || nextHeight !== height) {
        width = Math.max(nextWidth, 1);
        height = Math.max(nextHeight, 1);
        mount.renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        dirty = true;
      }
      if (dirty) {
        mount.renderer.render(scene, camera);
        dirty = false;
      }
      return true;
    },
  );
  controls.addEventListener("change", (): void => {
    dirty = true;
  });

  /** Refresh detached typed controls without parsing an unchecked JSON input. */
  function refresh(): void {
    fieldEvents.abort();
    fieldEvents = new AbortController();
    fields.replaceChildren();
    HumanEditorMeasureFields.append(fields, draft, fieldEvents.signal);
  }

  /** Retire before generation so a failed edit never displays an older result. */
  async function generate(): Promise<void> {
    if (closed || busy) return;
    busy = true;
    apply.disabled = true;
    example.disabled = true;
    const textures: AutoMovieTextureCache = new AutoMovieTextureCache(
      (asset: string): Promise<THREE.Texture> =>
        Promise.reject(new Error("Missing carried texture: " + asset)),
    );
    try {
      await retirement?.();
      displayed = undefined;
      retirement = undefined;
      dirty = true;
      status.textContent = "생성 중입니다.";
      await new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          setTimeout(resolve, 0, undefined);
        },
      );
      if (closed) return;
      const generated: ReturnType<typeof AutoMovieHuman.generate> =
        AutoMovieHuman.generate(structuredClone(draft));
      generated.model.parts = generated.model.parts.filter(
        (
          part: ReturnType<
            typeof AutoMovieHuman.generate
          >["model"]["parts"][number],
        ): boolean => !part.id.startsWith("human.construction."),
      );
      await textures.prime(
        generated.model.materials.flatMap(materialTextureBindings),
        generated.model.images ?? [],
      );
      if (closed) {
        await textures.dispose();
        return;
      }
      displayed = buildModel(generated.model, textures.resolve);
      const object: THREE.Group = displayed.object;
      retirement = createAutoMovieResourceRetirement([
        (): void => {
          object.removeFromParent();
        },
        ...collectAutoMovieOwnedResources(object).map(
          (resource: { dispose(): void }): (() => void) =>
            (): void => {
              resource.dispose();
            },
        ),
        (): Promise<void> => textures.dispose(),
      ]);
      scene.add(object);
      object.updateMatrixWorld(true);
      const bounds: THREE.Box3 = new THREE.Box3().setFromObject(object);
      const center: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
      const extent: number = bounds.getSize(new THREE.Vector3()).length();
      controls.target.copy(center);
      camera.position
        .copy(center)
        .add(new THREE.Vector3(extent * 0.8, extent * 0.15, extent * 0.8));
      controls.update();
      dirty = true;
      status.textContent = "편집한 파라미터를 적용했습니다.";
    } catch (error) {
      if (displayed === undefined) await textures.dispose();
      status.textContent =
        error instanceof Error ? error.message : String(error);
    } finally {
      busy = false;
      apply.disabled = closed;
      example.disabled = closed;
    }
  }
  example.addEventListener(
    "change",
    (): void => {
      draft = structuredClone(examples[example.value]!);
      refresh();
    },
    { signal: events.signal },
  );
  apply.addEventListener(
    "click",
    (): void => {
      void generate();
    },
    { signal: events.signal },
  );
  save.addEventListener(
    "click",
    (): void => {
      const url: string = URL.createObjectURL(
        new Blob([JSON.stringify(draft, null, 2)], {
          type: "application/json",
        }),
      );
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = url;
      link.download = "human-parameters.json";
      link.click();
      URL.revokeObjectURL(url);
    },
    { signal: events.signal },
  );
  refresh();
  status.textContent = "예시를 고르고 파라미터를 편집한 뒤 적용하세요.";
  return async (): Promise<void> => {
    closed = true;
    events.abort();
    fieldEvents.abort();
    controls.dispose();
    await retirement?.();
    mount.stop();
    root.replaceChildren();
  };
}
