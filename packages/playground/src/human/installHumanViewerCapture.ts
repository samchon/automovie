import type { IAutoMovieHumanConstructionNet } from "@automovie/human";
import { AutoMovieHumanoidBone } from "@automovie/interface";
import * as THREE from "three";

import type { HumanViewerPage } from "./HumanViewerPage";
import { IHumanViewerSession } from "./IHumanViewerSession";
import { admitHumanViewerCaptureView } from "./admitHumanViewerCaptureView";
import { drawHumanViewerConstruction } from "./drawHumanViewerConstruction";
import { frameHumanViewerCamera } from "./frameHumanViewerCamera";
import { hashHumanViewerSession } from "./hashHumanViewerSession";
import { humanViewerPartIds } from "./humanViewerPartIds";
import { lightHumanViewer } from "./lightHumanViewer";

/** Framing scale owned by the Human page. */
type Scale = HumanViewerPage.Scale;
/** Accepted documents and their reusable Human instance. */
type IAccepted = HumanViewerPage.IAccepted;
/** Surface/construction composition selected by the page. */
type DisplayMode = HumanViewerPage.DisplayMode;

/** Install camera framing and ordinary page capture. Capture uses the same current scene, selected construction source, and accepted session as interactive display.
 *
 * @evidence contracts/common.md#principled-implementation Frames visible model bounds or bone focus and reads the drawing buffer immediately after each actual render.
 * @evidence contracts/common.md#clear-and-simple-design One camera/capture module owns view planning, restoration and metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the admitted public documents and the same live page instances; no fixture or capture-only geometry is substituted.
 * @evidence contracts/common.md#meaningful-documentation Describes the module's page responsibility and ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms Each requested view renders once; bounds scans traverse only the framed model subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work Session identity controls Human reuse; edits and captures use the current accepted state rather than a second model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Capture restores view, display and relief; the page retains the renderer and does not create a capture renderer.
 */
export function installHumanViewerCapture(page: HumanViewerPage): void {
  /** World box of the visible meshes below `root`. */
  function visibleBox(root: THREE.Object3D): THREE.Box3 {
    const box: THREE.Box3 = new THREE.Box3();
    root.traverseVisible((node: THREE.Object3D): void => {
      if ((node as THREE.Mesh).isMesh) box.expandByObject(node);
    });
    return box;
  }
  page.visibleBox = visibleBox;

  /** World position of a point along a bone: its joint, or a share of the way to its first child bone's joint. */
  function pointOf(
    point: admitHumanViewerCaptureView.IPoint,
  ): THREE.Vector3 | undefined {
    const bone: THREE.Object3D | undefined = page.object?.bones.get(
      point.bone as AutoMovieHumanoidBone,
    );
    if (bone === undefined) return undefined;
    const at: THREE.Vector3 = bone.getWorldPosition(new THREE.Vector3());
    const child: THREE.Object3D | undefined = bone.children.find(
      (c: THREE.Object3D): boolean => (c as THREE.Bone).isBone === true,
    );
    if (child === undefined || point.along === 0) return at;
    return at.lerp(child.getWorldPosition(new THREE.Vector3()), point.along);
  }
  page.pointOf = pointOf;

  /** Frame the current view and light it; returns false when nothing visible is in focus. */
  function frame(): boolean {
    if (page.closed || page.object === null) return false;
    page.object.object.updateMatrixWorld(true);
    let box: THREE.Box3;
    if (page.view.point !== undefined) {
      // a focus point frames a cube of the radius around it, whatever lies there
      const at: THREE.Vector3 | undefined = page.pointOf(page.view.point);
      if (at === undefined) return false;
      box = new THREE.Box3().setFromCenterAndSize(
        at,
        new THREE.Vector3().setScalar(
          2 * (page.view.radius ?? page.JOINT_MARGIN),
        ),
      );
    } else {
      const root: THREE.Object3D | undefined =
        page.view.scale === "whole"
          ? page.object.object
          : page.object.bones.get(page.view.focus);
      if (root === undefined) return false;
      box = page.visibleBox(root);
      if (page.view.scale !== "whole") {
        // the skin is one skinned mesh beside the bones, so a close view also frames the focus bone's joints
        const joints: THREE.Box3 = new THREE.Box3();
        root.traverse((node: THREE.Object3D): void => {
          if ((node as THREE.Bone).isBone)
            joints.expandByPoint(node.getWorldPosition(new THREE.Vector3()));
        });
        if (!joints.isEmpty())
          box.union(joints.expandByScalar(page.JOINT_MARGIN));
      }
    }
    // Every mode uses the same selected net and control bounds, including the
    // surface-only pass where those objects are intentionally not drawn.
    if (page.view.scale === "whole") {
      const point: THREE.Vector3 = new THREE.Vector3();
      for (const net of page.curveDisplay?.nets ?? page.nets ?? []) {
        if (page.hidden.has(humanViewerPartIds.construction(net))) continue;
        const buffers: number[][] = [
          net.cage.positions,
          ...net.curves.map(
            (curve: IAutoMovieHumanConstructionNet.ICurve): number[] =>
              curve.points,
          ),
        ];
        for (const positions of buffers)
          for (let i: number = 0; i < positions.length; i += 3)
            box.expandByPoint(
              point.set(positions[i]!, positions[i + 1]!, positions[i + 2]!),
            );
      }
    }
    if (box.isEmpty()) return false;
    page.controls.target.copy(
      frameHumanViewerCamera({
        camera: page.camera,
        box,
        view: page.view.view,
        margin:
          page.view.point !== undefined
            ? 1
            : (page.view.margin ?? page.MARGIN[page.view.scale]),
      }),
    );
    page.controls.update();
    lightHumanViewer({
      light: page.view.light ?? page.pageLight,
      sun: page.sun,
      hemisphere: page.hemisphere,
      camera: page.camera,
      target: page.controls.target,
    });
    return true;
  }
  page.frame = frame;

  // ── capture ─────────────────────────────────────────────────────────────────
  /** The drawn frame as base64 PNG; a net or overlay frame carries the construction legend in its corner. */
  function keyed(mode: DisplayMode): string {
    if (mode === "surface" && page.curveDisplay?.surface !== "hidden")
      return page.canvas.toDataURL("image/png").split(",")[1]!;
    const copy: HTMLCanvasElement = document.createElement("canvas");
    copy.width = page.canvas.width;
    copy.height = page.canvas.height;
    const context: CanvasRenderingContext2D = copy.getContext("2d")!;
    context.drawImage(page.canvas, 0, 0);
    drawHumanViewerConstruction.key(
      context,
      page.curveDisplay?.metadata.constructionSource === "curve-design",
      page.curveDisplay?.metadata.showControlPoints !== false,
    );
    return copy.toDataURL("image/png").split(",")[1]!;
  }
  page.keyed = keyed;

  /** File tag of a view: a preset's name, or its angles. */
  function viewTag(
    v: frameHumanViewerCamera.View | frameHumanViewerCamera.IAngle,
  ): string {
    return typeof v === "string" ? v : `az${v.azimuth}_el${v.elevation}`;
  }
  page.viewTag = viewTag;

  /** File tag of a view's focus point and light, empty when it names neither. */
  function extraTag(v: HumanViewerPage["view"]): string {
    return (
      (v.point !== undefined
        ? `_${v.point.bone}${v.point.along === 0 ? "" : `-at${v.point.along}`}-r${v.radius}`
        : "") +
      (v.light !== undefined
        ? `_light-${v.light.relative}-az${v.light.azimuth}_el${v.light.elevation}`
        : "")
    );
  }
  page.extraTag = extraTag;

  /**
   * Capture views at each scale. A view is a preset name or angles admitted by `admitHumanViewerCaptureView`; an angle view with a focus bone is captured once, close on that bone. Omitted views take every preset, omitted scales `whole` and `close`.
   */
  async function capture(props: {
    name: string;
    views?: unknown[];
    scales?: Scale[];
    focus?: AutoMovieHumanoidBone;
    modes?: DisplayMode[];
    relief?: boolean;
  }): Promise<{
    files: string[];
    metadata: string;
  }> {
    if (!/^[A-Za-z0-9._-]+$/.test(props.name))
      throw new Error("Capture name must match [A-Za-z0-9._-]+.");
    const bones: string[] = page.current.skeleton.bones.map(
      (b: { bone: string }): string => b.bone,
    );
    const views: (
      | frameHumanViewerCamera.View
      | admitHumanViewerCaptureView.IAngleView
    )[] = (props.views ?? [...frameHumanViewerCamera.VIEWS]).map(
      (
        input: unknown,
        i: number,
      ):
        | frameHumanViewerCamera.View
        | admitHumanViewerCaptureView.IAngleView => {
        const admitted: admitHumanViewerCaptureView.IResult =
          admitHumanViewerCaptureView(input, bones);
        if (admitted.success === false)
          throw new Error(`views[${i}]: ${admitted.errors.join("; ")}`);
        return admitted.view;
      },
    );
    if (page.closed) throw new Error("The Human page is closed.");
    const accepted: IAccepted = page.current;
    await page.textured;
    if (page.closed || page.current !== accepted)
      throw new Error("The Human changed before capture was ready.");
    if (page.textureState.status !== "ready")
      throw new Error("The current Human textures are not ready for capture.");
    const capturedSession: IHumanViewerSession = structuredClone(
      accepted.session,
    );
    const documentsHash: string = await hashHumanViewerSession(capturedSession);
    if (
      page.closed ||
      page.current !== accepted ||
      JSON.stringify(page.current.session) !== JSON.stringify(capturedSession)
    )
      throw new Error("The Human documents changed before capture was ready.");
    const constructionMetadata: Record<string, unknown> =
      page.curveControls?.captureMetadata() ?? {
        constructionSource: "current-skin",
      };
    const previous: HumanViewerPage["view"] = { ...page.view };
    const shots: {
      file: string;
      png: string;
    }[] = [];
    const records: unknown[] = [];
    const focus: AutoMovieHumanoidBone = props.focus ?? page.view.focus;
    const plan: {
      view: typeof page.view;
      tag: string;
    }[] = [];
    for (const scale of props.scales ?? (["whole", "close"] as Scale[]))
      for (const v of views) {
        if (
          typeof v !== "string" &&
          (v.focus !== undefined || v.point !== undefined)
        )
          continue;
        plan.push({
          view: {
            view: v,
            scale,
            focus,
            ...(typeof v !== "string" && v.margin !== undefined
              ? { margin: v.margin }
              : {}),
            ...(typeof v !== "string" && v.light !== undefined
              ? { light: v.light }
              : {}),
          },
          tag: scale === "whole" ? "whole" : `close-${focus}`,
        });
      }
    for (const v of views)
      if (
        typeof v !== "string" &&
        (v.focus !== undefined || v.point !== undefined)
      )
        plan.push({
          view: {
            view: v,
            scale: "close",
            focus: (v.focus ?? v.point!.bone) as AutoMovieHumanoidBone,
            ...(v.margin !== undefined ? { margin: v.margin } : {}),
            ...(v.point !== undefined
              ? { point: v.point, radius: v.radius }
              : {}),
            ...(v.light !== undefined ? { light: v.light } : {}),
          },
          tag: v.point !== undefined ? "point" : `close-${v.focus}`,
        });
    const modes: DisplayMode[] = props.modes ?? ["surface"];
    for (const mode of modes)
      if (!page.DISPLAY_MODES.includes(mode))
        throw new Error(
          `unknown display mode "${String(mode)}"; modes are ${page.DISPLAY_MODES.join(", ")}`,
        );
    const previousMode: DisplayMode = page.displayMode;
    const previousRelief: boolean = page.relief;
    try {
      page.relief = props.relief ?? page.relief;
      page.applyRelief();
      // A current-skin surface-only capture needs no inspection. A multi-pass
      // capture resolves its ordinary construction once before any framing so
      // all modes share the same bounds, camera and light.
      if (
        modes.some((mode: DisplayMode): boolean => mode !== "surface") &&
        page.curveDisplay === null
      )
        page.nets ??= page.current.human.inspect();
      for (const mode of modes) {
        page.displayMode = mode;
        page.applyDisplayMode();
        for (const step of plan) {
          page.view = step.view;
          if (!page.frame())
            throw new Error(
              `Nothing visible to frame for ${page.view.scale} ${page.view.focus}.`,
            );
          page.handle.renderer.render(page.scene, page.camera);
          page.handle.completeFrame();
          // Read the drawing buffer in the same task as the draw, before it clears.
          const png: string = page.keyed(mode);
          const file: string = `${props.name}-${mode === "surface" ? "" : `${mode}-`}${step.tag}-${page.viewTag(page.view.view)}${page.extraTag(page.view)}${page.relief ? "" : "_norelief"}.png`;
          shots.push({ file, png });
          records.push({
            file,
            mode,
            displayedSurface:
              page.curveDisplay?.surface === "hidden" || mode === "construction"
                ? "hidden"
                : mode === "net"
                  ? (capturedSession.surfaceMeasurements === undefined
                    ? "ghosted-existing-skin" : "ghosted-generated-rest-surface")
                  : (capturedSession.surfaceMeasurements === undefined
                    ? "existing-skin" : "generated-rest-surface"),
            displayedConstruction:
              mode === "surface" && page.curveDisplay?.surface !== "hidden"
                ? "none"
                : constructionMetadata.constructionSource,
            comparisonQualification:
              constructionMetadata.constructionSource === "curve-design"
                ? "Existing skin is generated independently from these design curves."
                : capturedSession.surfaceMeasurements === undefined
                  ? "Current skin and its own generating construction."
                  : "Partial physical-rest surface and construction share generated coefficients; missing charts remain open.",
            view: page.view.view,
            scale: page.view.scale,
            focus: page.view.scale === "whole" ? null : page.view.focus,
            margin: page.view.margin ?? page.MARGIN[page.view.scale],
            point: page.view.point ?? null,
            radius: page.view.radius ?? null,
            light: page.view.light ?? page.pageLight,
            relief: page.relief,
            skinFinish: page.skinFinish,
            textures: page.observeTextures(),
            camera: {
              position: page.camera.position.toArray(),
              target: page.controls.target.toArray(),
              fov: page.camera.fov,
            },
          });
        }
      }
    } finally {
      page.displayMode = previousMode;
      page.applyDisplayMode();
      page.relief = previousRelief;
      page.applyRelief();
      page.view = previous;
      page.frame();
    }
    const response: Response = await fetch("/__automovie/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: props.name,
        shots,
        metadata: {
          page: "human.html",
          renderer: page.rendererName,
          canvas: { width: page.canvas.width, height: page.canvas.height },
          documentsHash,
          documents: capturedSession,
          construction: constructionMetadata,
          assembly: capturedSession.surfaceMeasurements === undefined ? page.assembly : "generated-rest-field",
          hand: page.hand,
          showStick: page.showStick,
          showBones: page.showBones,
          hiddenParts: [...page.hidden].sort((a: string, b: string): number =>
            a.localeCompare(b),
          ),
          shots: records,
        },
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as {
      files: string[];
      metadata: string;
    };
  }
  page.capture = capture;
}
