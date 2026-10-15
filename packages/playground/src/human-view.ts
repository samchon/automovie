import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME } from "@automovie/engine";
import {
  AutoMovieHuman,
  AutoMovieHumanConverter,
  IAutoMovieHumanAppearance,
  IAutoMovieHumanConstructionNet,
  IAutoMovieHumanExpression,
  IAutoMovieHumanIdentity,
  IAutoMovieHumanPose,
  IAutoMovieHumanTraits,
} from "@automovie/human";
import {
  AutoMovieHumanoidBone,
  IAutoMovieExpression,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  AutoMovieTextureCache,
  IAutoMovieModelObject,
  applyExpression,
  applyPose,
  buildModel,
  materialTextureBindings,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { HUMAN_VIEWER_CHOICES } from "./human/HUMAN_VIEWER_CHOICES";
import { HumanViewerPaddleHandGenerator } from "./human/HumanViewerPaddleHandGenerator";
import { IHumanViewerSession } from "./human/IHumanViewerSession";
import { createHumanViewerDocumentForm } from "./human/createHumanViewerDocumentForm";
import { createHumanViewerExpressionEditor } from "./human/createHumanViewerExpressionEditor";
import { createHumanViewerPoseEditor } from "./human/createHumanViewerPoseEditor";
import { drawHumanViewerConstruction } from "./human/drawHumanViewerConstruction";
import { admitHumanViewerCaptureView } from "./human/admitHumanViewerCaptureView";
import { frameHumanViewerCamera } from "./human/frameHumanViewerCamera";
import { hashHumanViewerSession } from "./human/hashHumanViewerSession";

// Human inspection page: the current AutoMovieHuman output through the normal
// viewer, with part isolation, preset views, the public documents as controls,
// save/resume and preset capture. Agents drive it through `window.__automovieHuman`.

/** Local storage key of the saved session. */
const STORAGE_KEY: string = "automovie.human.session";
/** Model id of the displayed person. */
const MODEL_ID: string = "human";
/** Frame margins: whole body nearly touches the frame, a close-up keeps air. */
const MARGIN: Record<"whole" | "close", number> = { whole: 1.1, close: 1.25 };

type Scale = "whole" | "close";
interface IAccepted {
  session: IHumanViewerSession;
  human: AutoMovieHuman;
  model: IAutoMovieModel;
  skeleton: IAutoMovieSkeleton;
  pose: IAutoMoviePose;
  expression: IAutoMovieExpression;
}

const converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();
const DEFAULT_TRAITS: IAutoMovieHumanTraits = {
  version: 1,
  sex: "female",
  age: 30,
  stature: null,
  population: "european",
  build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
};

/** Convert traits into a session, keeping the given pose and expression. */
const sessionFromTraits = (
  traits: IAutoMovieHumanTraits,
  keep?: Pick<IHumanViewerSession, "pose" | "expression">,
): IHumanViewerSession => ({
  format: "automovie-human-session",
  version: 1,
  traits: structuredClone(traits),
  identity: AutoMovieHuman.fromTraits({
    id: MODEL_ID,
    traits,
    converter,
  }).getIdentity(),
  pose: structuredClone(keep?.pose ?? { version: 1, joints: [] }),
  expression: structuredClone(keep?.expression ?? { version: 1, units: [] }),
  appearance: converter.toAppearance(traits),
});

/** How the skin is assembled: each part's own cage alone, or the joined person. */
let assembly: "parts" | "joined" = "parts";

/** Which hand generator builds the person: the profile's own, or the paddle that demonstrates a part swap. */
let hand: "profile" | "paddle" = "profile";

/** Admit every document of a session; throws the package's refusal unchanged. */
const admit = (session: IHumanViewerSession): IAccepted => {
  if (
    session === null ||
    typeof session !== "object" ||
    session.format !== "automovie-human-session" ||
    session.version !== 1
  )
    throw new Error(
      "Not a Human session: expected format automovie-human-session, version 1.",
    );
  const human: AutoMovieHuman = new AutoMovieHuman({
    id: MODEL_ID,
    identity: session.identity,
    parts:
      hand === "paddle"
        ? { hand: new HumanViewerPaddleHandGenerator() }
        : undefined,
  });
  return {
    session: structuredClone(session),
    human,
    model: human.getModel({ appearance: session.appearance, assembly }),
    skeleton: human.getSkeleton(),
    pose: human.pose({ pose: session.pose }),
    expression: human.express({ expression: session.expression }),
  };
};

// ── scene ───────────────────────────────────────────────────────────────────
const canvas: HTMLCanvasElement = document.querySelector("#view")!;
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.6));
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(2, 4, 3);
scene.add(sun);
const grid: THREE.GridHelper = new THREE.GridHelper(6, 60, 0xb8c0cc, 0xd5dbe4);
scene.add(grid);
// The floor grid stands between an eye below the floor and the subject, so every render
// from below hides it; the scene's hook runs before visibility is read, in the viewer's
// own loop and in captures alike.
scene.onBeforeRender = (
  _renderer: THREE.WebGLRenderer,
  _scene: THREE.Scene,
  eye: THREE.Camera,
): void => {
  grid.visible =
    eye.getWorldPosition(new THREE.Vector3()).y > grid.position.y;
};
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  30,
  1,
  0.01,
  100,
);
const controls: OrbitControls = new OrbitControls(camera, canvas);
let frames: number = 0;
const handle: ReturnType<typeof mountViewer> = mountViewer(
  canvas,
  scene,
  camera,
  (): void => {
    controls.update();
    ++frames;
  },
);
const resize = (): void => {
  const width: number = canvas.clientWidth || 1;
  const height: number = canvas.clientHeight || 1;
  handle.renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
new ResizeObserver(resize).observe(canvas);
const rendererName: string = ((): string => {
  const gl: WebGLRenderingContext | WebGL2RenderingContext =
    handle.renderer.getContext();
  const info: WEBGL_debug_renderer_info | null = gl.getExtension(
    "WEBGL_debug_renderer_info",
  );
  return String(
    gl.getParameter(info !== null ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
})();

// ── state ───────────────────────────────────────────────────────────────────
let current: IAccepted;
let object: IAutoMovieModelObject | null = null;
let bonesHelper: THREE.SkeletonHelper | null = null;
let traitsDraft: IAutoMovieHumanTraits = structuredClone(DEFAULT_TRAITS);
/** Hidden part ids; a rebuilt model keeps hiding the ids it still has. */
const hidden: Set<string> = new Set();
let view: {
  view: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle;
  scale: Scale;
  focus: AutoMovieHumanoidBone;
  /** Framing margin overriding the scale's own. */
  margin?: number;
} = {
  view: "front",
  scale: "whole",
  focus: "head",
};
let showBones: boolean = false;
/** Whether the skeleton's stick figure shows while the model has skin; off by default so markers never poke through the skin. */
let showStick: boolean = false;

const status = (text: string): void => {
  document.querySelector("#status")!.textContent = text;
};
const error = (cause: unknown): void => {
  document.querySelector("#error")!.textContent =
    cause === null
      ? ""
      : cause instanceof Error
        ? cause.message
        : String(cause);
};

/** Release the GPU resources of a built model that is being replaced. */
const dispose = (root: THREE.Object3D): void =>
  root.traverse((node: THREE.Object3D): void => {
    const mesh: THREE.Mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) m.dispose();
  });

/** Decoded images of the displayed person's textures, such as its irises; replaced and released with the person. */
let textures: AutoMovieTextureCache | null = null;

/** Settles once the displayed person's textures are on its materials; a capture waits for it. */
let textured: Promise<void> = Promise.resolve();

/**
 * Display an accepted person and rebuild the controls from its documents.
 *
 * The model is shown at once with flat materials, and again with its textures once the images it carries are decoded, which is asynchronous; a newer person displayed meanwhile wins and the older textures are released.
 */
const show = (accepted: IAccepted): void => {
  display(accepted, undefined);
  renderPanels();
  textured = texture(accepted).catch((cause: unknown): void => error(cause));
};

/** Decode the images the person's materials sample and display it with them, unless another person replaced it meanwhile. */
const texture = async (accepted: IAccepted): Promise<void> => {
  const bindings: ReturnType<typeof materialTextureBindings> =
    accepted.model.materials.flatMap(materialTextureBindings);
  if (bindings.length === 0) return;
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
    (asset: string): Promise<THREE.Texture> =>
      Promise.reject(
        new Error(`The Human page carries no texture asset "${asset}".`),
      ),
  );
  try {
    await cache.prime(bindings, accepted.model.images ?? []);
  } catch (cause) {
    void cache.dispose();
    throw cause;
  }
  if (current !== accepted) {
    void cache.dispose();
    return;
  }
  const previous: AutoMovieTextureCache | null = textures;
  textures = cache;
  display(accepted, cache.resolve);
  void previous?.dispose();
};

// ── construction net ────────────────────────────────────────────────────────
/** How the person is drawn: the surface alone, the construction net over the opaque surface, or the net over a ghosted body. The net is the rest construction, so it matches the surface in the rest pose. */
type DisplayMode = "surface" | "overlay" | "net";
const DISPLAY_MODES: readonly DisplayMode[] = ["surface", "overlay", "net"];
let displayMode: DisplayMode = "surface";
/** The shown person's construction nets, read on first use. */
let nets: IAutoMovieHumanConstructionNet[] | null = null;
let construction: THREE.Group | null = null;
const GHOST: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: 0xbbbbbb,
  roughness: 0.9,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  side: THREE.DoubleSide,
});
/** Draw the shown person in the current display mode. */
const applyDisplayMode = (): void => {
  if (construction !== null) {
    scene.remove(construction);
    dispose(construction);
    construction = null;
  }
  if (object === null) return;
  object.object.traverse((node: THREE.Object3D): void => {
    const mesh: THREE.Mesh = node as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    mesh.userData.surfaceMaterial ??= mesh.material;
    mesh.material =
      displayMode === "net"
        ? GHOST
        : (mesh.userData.surfaceMaterial as THREE.Material);
  });
  if (displayMode === "surface") return;
  nets ??= current.human.inspect();
  construction = drawHumanViewerConstruction({
    nets,
    occluded: displayMode === "overlay",
  });
  scene.add(construction);
};

/** Put the person's model in the scene, posed and expressed, replacing the one shown. */
const display = (
  accepted: IAccepted,
  resolveTexture: AutoMovieTextureCache["resolve"] | undefined,
): void => {
  current = accepted;
  if (object !== null) {
    scene.remove(object.object);
    dispose(object.object);
  }
  if (bonesHelper !== null) {
    scene.remove(bonesHelper);
    bonesHelper.dispose();
    bonesHelper = null;
  }
  object = buildModel(accepted.model, resolveTexture);
  scene.add(object.object);
  applyPose(
    object,
    accepted.pose,
    accepted.skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
  applyExpression(object, accepted.expression);
  object.object.updateMatrixWorld(true);
  if (showBones) {
    bonesHelper = new THREE.SkeletonHelper(object.object);
    scene.add(bonesHelper);
  }
  applyVisibility();
  nets = null;
  applyDisplayMode();
  error(null);
};

/** Admit a candidate session; on refusal keep the last valid person. */
const accept = (candidate: IHumanViewerSession, note: string): boolean => {
  try {
    show(admit(candidate));
    status(note);
    return true;
  } catch (cause) {
    error(cause);
    return false;
  }
};

const applyVisibility = (): void => {
  if (object === null) return;
  const parts: Array<{ id: string; material: string | null }> =
    current.model.parts;
  const skinned: boolean = parts.some((p): boolean => p.material === "skin");
  const stick: Set<string> = new Set(
    parts
      .filter((p): boolean => p.material?.startsWith("stick.") === true)
      .map((p): string => p.id),
  );
  for (const [id, part] of object.parts)
    part.visible = !hidden.has(id) && (showStick || !skinned || !stick.has(id));
};

/** World box of the visible meshes below `root`. */
const visibleBox = (root: THREE.Object3D): THREE.Box3 => {
  const box: THREE.Box3 = new THREE.Box3();
  root.traverseVisible((node: THREE.Object3D): void => {
    if ((node as THREE.Mesh).isMesh) box.expandByObject(node);
  });
  return box;
};

/** Distance a close view keeps around the focus bone's joints, metres, so the skin around them is in frame. */
const JOINT_MARGIN: number = 0.06;

/** Frame the current view; returns false when nothing visible is in focus. */
const frame = (): boolean => {
  if (object === null) return false;
  const root: THREE.Object3D | undefined =
    view.scale === "whole" ? object.object : object.bones.get(view.focus);
  if (root === undefined) return false;
  object.object.updateMatrixWorld(true);
  const box: THREE.Box3 = visibleBox(root);
  if (view.scale !== "whole") {
    // the skin is one skinned mesh beside the bones, so a close view also frames the focus bone's joints
    const joints: THREE.Box3 = new THREE.Box3();
    root.traverse((node: THREE.Object3D): void => {
      if ((node as THREE.Bone).isBone)
        joints.expandByPoint(node.getWorldPosition(new THREE.Vector3()));
    });
    if (!joints.isEmpty()) box.union(joints.expandByScalar(JOINT_MARGIN));
  }
  if (box.isEmpty()) return false;
  controls.target.copy(
    frameHumanViewerCamera({
      camera,
      box,
      view: view.view,
      margin: view.margin ?? MARGIN[view.scale],
    }),
  );
  controls.update();
  return true;
};

// ── capture ─────────────────────────────────────────────────────────────────
/** The drawn frame as base64 PNG; a net or overlay frame carries the construction legend in its corner. */
const keyed = (mode: DisplayMode): string => {
  if (mode === "surface") return canvas.toDataURL("image/png").split(",")[1]!;
  const copy: HTMLCanvasElement = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  const context: CanvasRenderingContext2D = copy.getContext("2d")!;
  context.drawImage(canvas, 0, 0);
  drawHumanViewerConstruction.key(context);
  return copy.toDataURL("image/png").split(",")[1]!;
};
/** File tag of a view: a preset's name, or its angles. */
const viewTag = (
  v: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle,
): string =>
  typeof v === "string" ? v : `az${v.azimuth}_el${v.elevation}`;

/**
 * Capture views at each scale. A view is a preset name or angles admitted by `admitHumanViewerCaptureView`; an angle view with a focus bone is captured once, close on that bone. Omitted views take every preset, omitted scales `whole` and `close`.
 */
const capture = async (props: {
  name: string;
  views?: unknown[];
  scales?: Scale[];
  focus?: AutoMovieHumanoidBone;
  modes?: DisplayMode[];
}): Promise<{ files: string[]; metadata: string }> => {
  if (!/^[A-Za-z0-9._-]+$/.test(props.name))
    throw new Error("Capture name must match [A-Za-z0-9._-]+.");
  const bones: string[] = current.skeleton.bones.map(
    (b: { bone: string }): string => b.bone,
  );
  const views: (
    | frameHumanViewerCamera.View
    | admitHumanViewerCaptureView.IAngleView
  )[] = (props.views ?? [...frameHumanViewerCamera.VIEWS]).map(
    (
      input: unknown,
      i: number,
    ): frameHumanViewerCamera.View | admitHumanViewerCaptureView.IAngleView => {
      const admitted: admitHumanViewerCaptureView.IResult =
        admitHumanViewerCaptureView(input, bones);
      if (admitted.success === false)
        throw new Error(`views[${i}]: ${admitted.errors.join("; ")}`);
      return admitted.view;
    },
  );
  await textured;
  const previous: typeof view = { ...view };
  const shots: { file: string; png: string }[] = [];
  const records: unknown[] = [];
  const focus: AutoMovieHumanoidBone = props.focus ?? view.focus;
  const plan: { view: typeof view; tag: string }[] = [];
  for (const scale of props.scales ?? (["whole", "close"] as Scale[]))
    for (const v of views) {
      if (typeof v !== "string" && v.focus !== undefined) continue;
      plan.push({
        view: {
          view: v,
          scale,
          focus,
          ...(typeof v !== "string" && v.margin !== undefined
            ? { margin: v.margin }
            : {}),
        },
        tag: scale === "whole" ? "whole" : `close-${focus}`,
      });
    }
  for (const v of views)
    if (typeof v !== "string" && v.focus !== undefined)
      plan.push({
        view: {
          view: v,
          scale: "close",
          focus: v.focus as AutoMovieHumanoidBone,
          ...(v.margin !== undefined ? { margin: v.margin } : {}),
        },
        tag: `close-${v.focus}`,
      });
  const modes: DisplayMode[] = props.modes ?? ["surface"];
  for (const mode of modes)
    if (!DISPLAY_MODES.includes(mode))
      throw new Error(
        `unknown display mode "${String(mode)}"; modes are ${DISPLAY_MODES.join(", ")}`,
      );
  const previousMode: DisplayMode = displayMode;
  for (const mode of modes) {
    displayMode = mode;
    applyDisplayMode();
    for (const step of plan) {
      view = step.view;
      if (!frame())
        throw new Error(
          `Nothing visible to frame for ${view.scale} ${view.focus}.`,
        );
      handle.renderer.render(scene, camera);
      // Read the drawing buffer in the same task as the draw, before it clears.
      const png: string = keyed(mode);
      const file: string = `${props.name}-${mode === "surface" ? "" : `${mode}-`}${step.tag}-${viewTag(view.view)}.png`;
      shots.push({ file, png });
      records.push({
        file,
        mode,
        view: view.view,
      scale: view.scale,
      focus: view.scale === "whole" ? null : view.focus,
      margin: view.margin ?? MARGIN[view.scale],
      camera: {
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        fov: camera.fov,
      },
    });
    }
  }
  displayMode = previousMode;
  applyDisplayMode();
  view = previous;
  frame();
  const response: Response = await fetch("/__automovie/capture", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: props.name,
      shots,
      metadata: {
        page: "human.html",
        renderer: rendererName,
        canvas: { width: canvas.width, height: canvas.height },
        documentsHash: await hashHumanViewerSession(current.session),
        documents: current.session,
        hiddenParts: [...hidden].sort((a: string, b: string): number =>
          a.localeCompare(b),
        ),
        shots: records,
      },
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as { files: string[]; metadata: string };
};

// ── panels ──────────────────────────────────────────────────────────────────
const button = (label: string, onClick: () => void): HTMLButtonElement => {
  const b: HTMLButtonElement = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
};
const mount = (selector: string, ...children: HTMLElement[]): void => {
  document.querySelector(selector)!.replaceChildren(...children);
};
const withDocument = <
  K extends "identity" | "pose" | "expression" | "appearance",
>(
  key: K,
  value: IHumanViewerSession[K],
): void => {
  accept({ ...current.session, [key]: value }, `Updated the ${key}.`);
};

const renderViews = (): void => {
  const presets: HTMLDivElement = document.createElement("div");
  presets.className = "row";
  for (const v of frameHumanViewerCamera.VIEWS)
    presets.appendChild(
      button(v, (): void => {
        view = { ...view, view: v };
        frame();
      }),
    );
  const scale: HTMLSelectElement = document.createElement("select");
  scale.add(new Option("whole body", "whole"));
  scale.add(new Option("close (focus bone)", "close"));
  scale.value = view.scale;
  scale.addEventListener("change", (): void => {
    view = { ...view, scale: scale.value as Scale };
    frame();
  });
  const focus: HTMLSelectElement = document.createElement("select");
  for (const b of current.skeleton.bones) focus.add(new Option(b.bone, b.bone));
  focus.value = view.focus;
  focus.addEventListener("change", (): void => {
    view = { ...view, focus: focus.value as AutoMovieHumanoidBone };
    frame();
  });
  const bones: HTMLLabelElement = document.createElement("label");
  const check: HTMLInputElement = document.createElement("input");
  check.type = "checkbox";
  check.checked = showBones;
  check.addEventListener("change", (): void => {
    showBones = check.checked;
    show(current);
  });
  bones.append(check, " bone lines");
  const sticks: HTMLLabelElement = document.createElement("label");
  const stickCheck: HTMLInputElement = document.createElement("input");
  stickCheck.type = "checkbox";
  stickCheck.checked = showStick;
  stickCheck.addEventListener("change", (): void => {
    showStick = stickCheck.checked;
    applyVisibility();
  });
  sticks.append(stickCheck, " stick figure");
  const name: HTMLInputElement = document.createElement("input");
  name.value = "human";
  name.title = "Capture name, the prefix of every file";
  const run: HTMLButtonElement = button("Capture presets", (): void => {
    run.disabled = true;
    capture({ name: name.value })
      .then((r: { files: string[]; metadata: string }): void =>
        status(`Captured ${r.files.length} views; metadata ${r.metadata}`),
      )
      .catch(error)
      .finally((): void => {
        run.disabled = false;
      });
  });
  const skin: HTMLSelectElement = document.createElement("select");
  skin.add(new Option("parts alone", "parts"));
  skin.add(new Option("joined skin", "joined"));
  skin.value = assembly;
  skin.addEventListener("change", (): void => {
    assembly = skin.value as typeof assembly;
    accept(current.session, `Skin: ${skin.value}.`);
  });
  const hands: HTMLSelectElement = document.createElement("select");
  hands.add(new Option("profile hand", "profile"));
  hands.add(new Option("paddle hand (swap)", "paddle"));
  hands.value = hand;
  hands.addEventListener("change", (): void => {
    hand = hands.value as typeof hand;
    accept(current.session, `Hand: ${hands.value}.`);
  });
  const shown: HTMLSelectElement = document.createElement("select");
  for (const mode of DISPLAY_MODES) shown.add(new Option(mode, mode));
  shown.value = displayMode;
  shown.addEventListener("change", (): void => {
    displayMode = shown.value as DisplayMode;
    applyDisplayMode();
  });
  const row: HTMLDivElement = document.createElement("div");
  row.className = "row";
  row.append(scale, focus, skin, hands, shown, bones, sticks);
  const captureRow: HTMLDivElement = document.createElement("div");
  captureRow.className = "row";
  captureRow.append(name, run);
  const renderer: HTMLDivElement = document.createElement("div");
  renderer.textContent = `WebGL: ${rendererName}`;
  mount("#views", presets, row, captureRow, renderer);
};

const renderParts = (): void => {
  if (object === null) return;
  const list: HTMLDivElement = document.createElement("div");
  list.className = "parts";
  const filter: HTMLInputElement = document.createElement("input");
  filter.placeholder = "filter part ids";
  const matching = (): string[] =>
    current.model.parts
      .map((p: { id: string }): string => p.id)
      .filter((id: string): boolean => id.includes(filter.value.trim()));
  const fill = (): void => {
    list.replaceChildren();
    for (const id of matching()) {
      const label: HTMLLabelElement = document.createElement("label");
      const box: HTMLInputElement = document.createElement("input");
      box.type = "checkbox";
      box.checked = !hidden.has(id);
      box.addEventListener("change", (): void => {
        if (box.checked) hidden.delete(id);
        else hidden.add(id);
        applyVisibility();
      });
      label.append(box, ` ${id}`);
      list.appendChild(label);
    }
  };
  filter.addEventListener("input", fill);
  const set = (show: (id: string) => boolean): void => {
    for (const p of current.model.parts)
      if (show(p.id)) hidden.delete(p.id);
      else hidden.add(p.id);
    applyVisibility();
    fill();
  };
  const row: HTMLDivElement = document.createElement("div");
  row.className = "row";
  row.append(
    button("all", (): void => set((): boolean => true)),
    button("none", (): void => set((): boolean => false)),
    button("only matching", (): void => {
      const keep: Set<string> = new Set(matching());
      set((id: string): boolean => keep.has(id));
    }),
  );
  fill();
  mount("#parts", filter, row, list);
};

const renderPanels = (): void => {
  const s: IHumanViewerSession = current.session;
  renderViews();
  renderParts();
  const convert: HTMLButtonElement = button("Convert traits", (): void => {
    try {
      accept(
        sessionFromTraits(traitsDraft, s),
        "Converted the traits into identity and appearance.",
      );
    } catch (cause) {
      error(cause);
    }
  });
  mount(
    "#traits",
    createHumanViewerDocumentForm<IAutoMovieHumanTraits>({
      document: traitsDraft,
      spec: {
        hidden: ["version"],
        nullable: ["stature"],
        choices: {
          sex: HUMAN_VIEWER_CHOICES.sex,
          population: HUMAN_VIEWER_CHOICES.population,
        },
      },
      onChange: (t: IAutoMovieHumanTraits): void => {
        traitsDraft = t;
        renderPanels();
      },
    }),
    convert,
  );
  mount(
    "#identity",
    createHumanViewerDocumentForm<IAutoMovieHumanIdentity>({
      document: s.identity,
      spec: {
        hidden: ["version"],
        choices: { "pigmentation.iris": HUMAN_VIEWER_CHOICES.iris },
      },
      onChange: (d: IAutoMovieHumanIdentity): void =>
        withDocument("identity", d),
    }),
  );
  mount(
    "#pose",
    createHumanViewerPoseEditor({
      skeleton: current.skeleton,
      pose: s.pose,
      onChange: (d: IAutoMovieHumanPose): void => withDocument("pose", d),
    }),
  );
  mount(
    "#expression",
    createHumanViewerExpressionEditor({
      units: HUMAN_VIEWER_CHOICES.actionUnits,
      expression: s.expression,
      onChange: (d: IAutoMovieHumanExpression): void =>
        withDocument("expression", d),
    }),
  );
  type Wear = IAutoMovieHumanAppearance.IUnderwear;
  const style = (
    label: string,
    bottom: Wear["bottom"],
    top: Wear["top"],
  ): createHumanViewerDocumentForm.IStyleOption<IAutoMovieHumanAppearance> => ({
    label,
    matches: (a: IAutoMovieHumanAppearance): boolean =>
      a.underwear.bottom === bottom && a.underwear.top === top,
    apply: (a: IAutoMovieHumanAppearance): IAutoMovieHumanAppearance => ({
      ...a,
      underwear: { ...a.underwear, bottom, top },
    }),
  });
  mount(
    "#appearance",
    createHumanViewerDocumentForm<IAutoMovieHumanAppearance>({
      document: s.appearance,
      spec: {
        hidden: ["version"],
        colors: ["underwear.color"],
        choices: {
          "hair.style": HUMAN_VIEWER_CHOICES.hairStyle,
          "hair.color": HUMAN_VIEWER_CHOICES.hairColor,
          "hair.curl": HUMAN_VIEWER_CHOICES.curl,
          "hair.hairline": HUMAN_VIEWER_CHOICES.hairline,
          "brows.color": HUMAN_VIEWER_CHOICES.hairColor,
          "lashes.color": HUMAN_VIEWER_CHOICES.hairColor,
        },
        styles: {
          "underwear.bottom": {
            label: "underwear style",
            covers: ["underwear.bottom", "underwear.top"],
            options: [
              style("briefs", "briefs", "none"),
              style("boxer briefs", "boxerBriefs", "none"),
              style("briefs and bra", "briefs", "bra"),
              style("boxer briefs and bra", "boxerBriefs", "bra"),
            ],
          },
        },
      },
      onChange: (d: IAutoMovieHumanAppearance): void =>
        withDocument("appearance", d),
    }),
  );
  const text: HTMLTextAreaElement = document.createElement("textarea");
  text.value = JSON.stringify(s, null, 2);
  mount(
    "#json",
    text,
    button("Apply JSON", (): void => {
      try {
        accept(
          JSON.parse(text.value) as IHumanViewerSession,
          "Applied the JSON documents.",
        );
      } catch (cause) {
        error(cause);
      }
    }),
  );
};

// ── session ─────────────────────────────────────────────────────────────────
const save = (): void => {
  const text: string = JSON.stringify(current.session, null, 2);
  localStorage.setItem(STORAGE_KEY, text);
  const link: HTMLAnchorElement = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  link.download = "human-session.json";
  link.click();
  URL.revokeObjectURL(link.href);
  void hashHumanViewerSession(current.session).then((hash: string): void =>
    status(
      `Saved to local storage and human-session.json (documents ${hash.slice(0, 12)}).`,
    ),
  );
};
const open: HTMLInputElement = document.createElement("input");
open.type = "file";
open.accept = "application/json,.json";
open.addEventListener("change", (): void => {
  const file: File | undefined = open.files?.[0];
  if (file === undefined) return;
  file
    .text()
    .then((text: string): void => {
      accept(JSON.parse(text) as IHumanViewerSession, `Resumed ${file.name}.`);
    })
    .catch(error);
  open.value = "";
});
mount(
  "#session",
  button("Save", save),
  open,
  button("Reset to default", (): void => {
    accept(sessionFromTraits(DEFAULT_TRAITS), "Reset to the default person.");
  }),
);

// ── boot ────────────────────────────────────────────────────────────────────
const stored: string | null = localStorage.getItem(STORAGE_KEY);
let resumed: boolean = false;
if (stored !== null) {
  try {
    resumed = accept(
      JSON.parse(stored) as IHumanViewerSession,
      "Resumed the saved session from local storage.",
    );
  } catch (cause) {
    error(cause);
  }
}
if (!resumed)
  accept(sessionFromTraits(DEFAULT_TRAITS), "Showing the default person.");
traitsDraft = structuredClone(current!.session.traits);
renderPanels();
resize();
frame();

(window as unknown as { __automovieHuman: unknown }).__automovieHuman = {
  renderer: rendererName,
  frames: (): number => frames,
  session: (): IHumanViewerSession => structuredClone(current.session),
  hash: (): Promise<string> => hashHumanViewerSession(current.session),
  load: (session: IHumanViewerSession): boolean =>
    accept(session, "Loaded a session."),
  loadTraits: (props: {
    traits: IAutoMovieHumanTraits;
    statureScale?: number;
  }): boolean => {
    try {
      const traits: IAutoMovieHumanTraits = structuredClone(props.traits);
      if (props.statureScale !== undefined)
        traits.stature =
          sessionFromTraits({ ...traits, stature: null }).identity.body
            .stature * props.statureScale;
      traitsDraft = traits;
      return accept(sessionFromTraits(traits), "Loaded traits.");
    } catch (cause) {
      error(cause);
      return false;
    }
  },
  error: (): string => document.querySelector("#error")!.textContent ?? "",
  save,
  setHidden: (ids: string[]): void => {
    hidden.clear();
    for (const id of ids) hidden.add(id);
    applyVisibility();
    renderParts();
  },
  setHand: (next: "profile" | "paddle"): boolean => {
    hand = next;
    return accept(current.session, `Hand: ${next}.`);
  },
  setStick: (next: boolean): void => {
    showStick = next;
    applyVisibility();
  },
  setDisplay: (next: DisplayMode): void => {
    displayMode = next;
    applyDisplayMode();
  },
  setAssembly: (next: "parts" | "joined"): boolean => {
    assembly = next;
    return accept(current.session, `Skin: ${next}.`);
  },
  parts: (): string[] =>
    current.model.parts.map((p: { id: string }): string => p.id),
  setView: (next: Partial<typeof view>): boolean => {
    view = { ...view, ...next };
    return frame();
  },
  capture,
};
