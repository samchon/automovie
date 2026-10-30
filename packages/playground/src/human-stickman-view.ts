import * as THREE from "three";

import { AutoMovieHumanSkeleton } from "../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../human/src/structures/pose/IAutoMovieHumanPose";
import { mountViewer } from "../../viewer/src/mountViewer";
import { f1, f2, m1, m2 } from "./human-parameters";
import { HUMAN_CARTOON_EXPRESSIONS } from "./human-stickman/HUMAN_CARTOON_EXPRESSIONS";
import { HUMAN_STICKMAN_POSES } from "./human-stickman/HUMAN_STICKMAN_POSES";
import { HumanStickmanController } from "./human-stickman/HumanStickmanController";
import { attachHumanMannequinControls } from "./human-stickman/attachHumanMannequinControls";
import { attachHumanMannequinSkin } from "./human-stickman/attachHumanMannequinSkin";
import { buildHumanPolygon } from "./human-stickman/buildHumanPolygon";
import { buildHumanPolygonHints } from "./human-stickman/buildHumanPolygonHints";
import { buildHumanStickman } from "./human-stickman/buildHumanStickman";
import { humanMannequinPartColors } from "./human-stickman/humanMannequinPartColors";
import { observeHumanMannequinCompletion } from "./human-stickman/observeHumanMannequinCompletion";
import { readHumanMannequinSnapshot } from "./human-stickman/readHumanMannequinSnapshot";
import { traceHumanViewerPhase } from "./human/traceHumanViewerPhase";

/**
 * Human stickman page: the generated Human's rule-derived skeleton as a
 * rod-and-ball figure, posed by `params.pose` with range-of-motion clamping.
 *
 * Query: `alias` (f1, f2, m1, m2; default f1), `pose` (rest, demo, limit;
 * default rest), `clamp=0` to apply the pose without clamping, `skin=1` to
 * overlay the neutral skin translucently (it stays in rest pose; `garment=0`
 * hides the underwear), `view` (front, side, back, oblique; default front).
 * `window.__humanStickman.ready` follows the original mount's completed draw
 * and becomes false when controller, ancestor/root, camera or display controls
 * differ from that completed draw, or on failure, context loss or disposal; `completion`
 * records its actual sequence and optional elapsed seconds. The
 * `clamped` lists the fields the clamp changed. `style=polygon` draws the rigid
 * low-polygon volume and a cartoon face using the same posed skeleton.
 * `expression=neutral|happy|angry|surprised` selects ordinary AU examples;
 * `pass=surface|overlay|construction` shows skin, generating sections and bones.
 * `framing=face` uses the head polygon bounds independently of expression.
 * The same page exposes one controller for pose, expression, play, pause,
 * seek and reset; motions are authored examples without contact or physics.
 * Snapshots return actual geometry arrays and world placements only while the
 * public controls still match the completed draw; changes require a new draw.
 *
 * @evidence contracts/common.md#principled-implementation Existing skeleton generation owns pose and limits; polygon and face builders consume its posed placement once, and expression demos use existing public AU values.
 * @evidence contracts/common.md#clear-and-simple-design One existing page and mount serve both styles and their diagnostic passes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Polygon modules remain a rigid diffusion-hint blockout; unsupported facial actions are exposed and optional realistic skin remains a rest overlay.
 * @evidence contracts/common.md#meaningful-documentation States query controls, posed ownership, expression examples and stable face framing.
 * @evidence contracts/performance.md#efficient-algorithms Body shape, rest joints and geometry are prepared once; explicit poses and lazy clip preparation reuse the existing clinical pose evaluator, while the public Human clock advances logical time and Three refreshes accepted placements without rebuilding shape.
 * @evidence contracts/performance.md#reuse-equivalent-work All passes share the selected posed output, with fixed head bounds across expressions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One page owns one mount and its builder resources; pagehide and initialization failure retire each acquired observer, mount, builder, optional skin and grid owner once.
 */
async function bootstrapHumanStickman(): Promise<void> {
  traceHumanViewerPhase("mannequin.module.ready", "mannequin");
  const query: URLSearchParams = new URLSearchParams(location.search);
  const people: Record<string, IAutoMovieHumanParameters> = { f1, f2, m1, m2 };
  const base: IAutoMovieHumanParameters | undefined =
    people[query.get("alias") ?? "f1"];
  if (base === undefined) throw new Error("Unknown alias");
  const poseName: string = Object.hasOwn(
    HUMAN_STICKMAN_POSES,
    query.get("pose") ?? "",
  )
    ? query.get("pose")!
    : "rest";
  const params: IAutoMovieHumanParameters = {
    ...base,
    pose: HUMAN_STICKMAN_POSES[poseName]!,
    expression:
      HUMAN_CARTOON_EXPRESSIONS[query.get("expression") ?? ""] ??
      base.expression,
  };
  const style: string =
    query.get("style") === "polygon" ? "polygon" : "stickman";
  let pass: string = query.get("pass") ?? "surface";
  if (!["surface", "overlay", "construction"].includes(pass))
    throw new Error("Unknown display pass");
  let hintMode: string = query.get("hint") ?? "off";
  let hintDetail: string = query.get("detail") ?? "major";
  if (
    !["off", "parts", "joints", "combined"].includes(hintMode) ||
    !["major", "all"].includes(hintDetail)
  )
    throw new Error("Unknown Mannequin hint mode/detail");
  const disposers: Array<(() => void) | (() => Promise<void>)> = [];
  const gridDisposers: (() => void)[] = [];
  let viewer: ReturnType<typeof mountViewer> | undefined;
  let closeCompletion: (() => void) | undefined;
  let retirement: Promise<void> | undefined;

  /** Retire each acquired page owner once, including initialization before a mount exists. */
  const retire: () => Promise<void> = (): Promise<void> => {
    if (retirement !== undefined) return retirement;
    const immediateFailures: unknown[] = [];
    try { closeCompletion?.(); }
    catch (error: unknown) { immediateFailures.push(error); }
    closeCompletion = undefined;
    retirement = (async (): Promise<void> => {
      const operations: Array<(() => void) | (() => Promise<void>)> = [
        (): void => { viewer?.stop(); },
        ...disposers.splice(0),
        ...gridDisposers.splice(0),
      ];
      const results: PromiseSettledResult<unknown>[] = await Promise.allSettled(
        operations.map((dispose: (() => void) | (() => Promise<void>)): Promise<unknown> => Promise.resolve().then(dispose)),
      );
      const failures: unknown[] = [...immediateFailures];
      for (const result of results)
        if (result.status === "rejected") failures.push(result.reason);
      if (failures.length)
        throw new AggregateError(failures, "Mannequin resource retirement failed");
    })();
    return retirement;
  };
  try {

    // Skeleton posed by params.pose.
    const clamp: boolean = query.get("clamp") !== "0";
    traceHumanViewerPhase("mannequin.prepare.begin", "mannequin");
    const prepared: ReturnType<typeof AutoMovieHumanSkeleton.prepare> =
      AutoMovieHumanSkeleton.prepare(base, { neckSurface: style === "polygon" });
    traceHumanViewerPhase("mannequin.prepare.ready", "mannequin");
    const bodyPreparations: number = 1;
    let evaluatorCalls: number = 0;
    const evaluatePose: HumanStickmanController.IOptions["evaluatePose"] = (
      pose: IAutoMovieHumanPose,
    ): AutoMovieHumanSkeleton.IOutput => {
      evaluatorCalls++;
      return prepared(pose, clamp);
    };
    const rest: AutoMovieHumanSkeleton.IOutput = evaluatePose({});
    traceHumanViewerPhase("mannequin.build.begin", "mannequin");
    const stickman: ReturnType<typeof buildHumanStickman> =
      buildHumanStickman(rest);
    disposers.push((): void => stickman.dispose());
    const polygon: ReturnType<typeof buildHumanPolygon> | undefined =
      style === "polygon" ? buildHumanPolygon(rest) : undefined;
    if (polygon !== undefined) disposers.push((): void => polygon.dispose());
    const palette: Readonly<Record<string, number>> = humanMannequinPartColors(
      rest.bones.map((bone: AutoMovieHumanSkeleton.IBone): string => bone.bone),
    );
    const hints: ReturnType<typeof buildHumanPolygonHints> | undefined =
      polygon === undefined
        ? undefined
        : buildHumanPolygonHints(rest, {
            diameterPixels: 18,
            color: 0xffe66b,
            detail: hintDetail as "major" | "all",
          });
    if (hints !== undefined) disposers.push((): void => hints.dispose());
    applyHints();

    // The controller takes builder ownership on entry, including constructor failure.
    disposers.length = 0;
    const controller: HumanStickmanController = new HumanStickmanController({
      rest,
      evaluatePose,
      polygon,
      stickman,
      hints,
      expression: params.expression,
    });
    disposers.push((): void => controller.dispose());
    controller.setPose(params.pose ?? {});
    traceHumanViewerPhase("mannequin.build.ready", "mannequin");
    if (polygon !== undefined) {
      polygon.surface.visible = pass !== "construction";
      polygon.sections.visible = pass !== "surface";
    }
    stickman.object.visible = polygon === undefined || pass !== "surface";
    if (polygon !== undefined)
      stickman.object.traverse((part: THREE.Object3D): void => {
        if (!(part instanceof THREE.Mesh)) return;
        for (const material of ([] as THREE.Material[]).concat(part.material)) {
          material.depthTest = false;
          material.transparent = true;
          material.opacity = 0.7;
        }
        part.renderOrder = 3;
      });

    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f3f6);
    scene.add(controller.object);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.2));
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 4, 2);
    scene.add(sun);
    const grid: THREE.GridHelper = new THREE.GridHelper(
      4,
      40,
      0xb8c0cc,
      0xd5dbe4,
    );
    gridDisposers.push((): void => grid.geometry.dispose());
    for (const material of ([] as THREE.Material[]).concat(grid.material))
      gridDisposers.push((): void => material.dispose());
    scene.add(grid);
    if (query.get("framing") === "face") grid.visible = false;

    // Optional translucent skin remains an independently owned rest overlay.
    if (query.get("skin") === "1")
      await attachHumanMannequinSkin({ query, params, scene, disposers });

    // Face framing excludes expression marks so all AU examples share one camera.
    scene.updateMatrixWorld(true);
    const box: THREE.Box3 =
      polygon !== undefined && query.get("framing") === "face"
        ? new THREE.Box3(
            new THREE.Vector3(...polygon.head.min),
            new THREE.Vector3(...polygon.head.max),
          ).applyMatrix4(polygon.head.object.matrixWorld)
        : new THREE.Box3().setFromObject(polygon?.object ?? stickman.object);
    const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
    const size: number = box.getSize(new THREE.Vector3()).length();
    const directions: Record<string, [number, number, number]> = {
      front: [1, 0, 0],
      side: [0, 0, 1],
      back: [-1, 0, 0],
      oblique: [Math.SQRT1_2, 0, Math.SQRT1_2],
    };
    const dir: [number, number, number] = directions[
      query.get("view") ?? "front"
    ] ?? [1, 0, 0];
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      30,
      1,
      0.05,
      50,
    );
    const distance: number = (size * 0.62) / Math.tan((15 * Math.PI) / 180);
    camera.position
      .copy(centre)
      .add(new THREE.Vector3(...dir).multiplyScalar(distance));
    camera.lookAt(centre);

    const canvas: HTMLCanvasElement =
      document.querySelector<HTMLCanvasElement>("#view")!;
    const completion: ReturnType<typeof observeHumanMannequinCompletion> =
      observeHumanMannequinCompletion(canvas, scene, camera, (): string => {
        /** Observe the borrowed local/world authorities, including external ancestors, without updating them. */
        const placement: (object: THREE.Object3D) => object[] = (
          object: THREE.Object3D,
        ): object[] => {
          const chain: object[] = [];
          for (
            let node: THREE.Object3D | null = object;
            node !== null;
            node = node.parent
          )
            chain.push({
              position: node.position.toArray(),
              quaternion: node.quaternion.toArray(),
              scale: node.scale.toArray(),
              matrix: node.matrix.elements,
              matrixAutoUpdate: node.matrixAutoUpdate,
              matrixWorldAutoUpdate: node.matrixWorldAutoUpdate,
              matrixWorld: node.matrixWorldAutoUpdate
                ? null
                : node.matrixWorld.elements,
            });
          return chain;
        };
        return JSON.stringify({
          controller: controller.state,
          root: placement(controller.object),
          camera: placement(camera),
          projection: camera.projectionMatrix.elements,
          zoom: camera.zoom,
          lens: [camera.fov, camera.near, camera.far],
          up: camera.up.toArray(),
          light: {
            position: sun.position.toArray(),
            target: sun.target.position.toArray(),
            intensity: sun.intensity,
          },
          target: centre.toArray(),
          canvas: [canvas.width, canvas.height],
          pass,
          hintMode,
          hintDetail,
          visibility: [
            grid.visible,
            polygon?.surface.visible,
            polygon?.sections.visible,
            stickman.object.visible,
            hints?.object.visible,
          ],
        });
      });
    closeCompletion = completion.dispose;
    const state: {
      ready: boolean;
      completion: typeof completion.state;
      fail: (error: unknown) => void;
      pose: string;
      clamped: AutoMovieHumanSkeleton.IClamp[];
      style: string;
      pass: string;
      expression: IAutoMovieHumanParameters["expression"];
      unsupported: readonly string[];
      controller: HumanStickmanController;
      snapshot: () => unknown;
      dispose: () => Promise<void>;
    } = {
      get ready(): boolean {
        return completion.state.ready;
      },
      completion: completion.state,
      fail: completion.fail,
      pose: poseName,
      clamped: controller.state.clamped,
      style,
      pass,
      expression: params.expression,
      unsupported: controller.state.unsupported,
      controller,
      snapshot: (): unknown => {
        if (
          viewer === undefined || !completion.state.ready ||
          completion.state.error !== null ||
          completion.state.closed ||
          viewer.renderer.getContext().isContextLost()
        )
          throw new Error("Mannequin has no active completed draw");
        return readHumanMannequinSnapshot({
          scene,
          controller,
          camera,
          canvas,
          renderer: viewer.renderer,
          completion: completion.state,
          sun,
          rest,
          parameters: base,
          target: centre,
          style,
          pass,
          preparations: bodyPreparations,
          evaluations: evaluatorCalls,
          hint: {
            mode: hintMode,
            detail: hintDetail,
            diameterPixels: hints?.object.userData.humanHint?.diameterPixels ?? 0,
            color: hints?.object.userData.humanHint?.color ?? 0,
            xray: hints?.object.userData.humanHint?.xray === true,
          },
        });
      },
      dispose: retire,
    };
    Object.assign(window, { __humanStickman: state });
    viewer = mountViewer(
      canvas,
      scene,
      camera,
      (elapsedSeconds: number): void => {
        completion.begin();
        controller.update(elapsedSeconds);
        controls.update();
      },
      { preserveDrawingBuffer: true, pixelRatio: 1 },
    );
    window.addEventListener(
      "pagehide",
      (): void => {
        void state.dispose().catch(console.error);
      },
      { once: true },
    );

    /** Apply display-only materials and marker selection while retaining the fixed visual bindings. */
    function applyHints(): void {
      polygon?.setPartColors(
        hintMode === "parts" || hintMode === "combined" ? palette : undefined,
      );
      hints?.setDetail(hintDetail as "major" | "all");
      if (hints !== undefined)
        hints.object.visible = hintMode === "joints" || hintMode === "combined";
    }

    const controls: ReturnType<typeof attachHumanMannequinControls> =
      attachHumanMannequinControls({
        query,
        poseName,
        style,
        clamp,
        rest,
        controller,
        polygon,
        stickman,
        scene,
        grid,
        camera,
        centre,
        directions,
        distance,
        applyHints,
        state,
        display: {
          get pass(): string {
            return pass;
          },
          set pass(value: string) {
            pass = value;
          },
          get hintMode(): string {
            return hintMode;
          },
          set hintMode(value: string) {
            hintMode = value;
          },
          get hintDetail(): string {
            return hintDetail;
          },
          set hintDetail(value: string) {
            hintDetail = value;
          },
        },
      });
    disposers.push(controls.dispose);
  } catch (error: unknown) {
    try { await retire(); }
    catch (cleanup: unknown) {
      throw new AggregateError([error, cleanup], "Mannequin initialization and retirement failed");
    }
    throw error;
  }
}

void bootstrapHumanStickman().catch((error: unknown): void => {
  (
    window as Window & { __humanStickman?: { fail: (error: unknown) => void } }
  ).__humanStickman?.fail(error);
  console.error(error);
  const status: HTMLElement | null = document.getElementById("status");
  if (status !== null)
    status.textContent =
      "Human 표시 실패: " +
      (error instanceof Error ? error.message : String(error));
});
