import { ArchetypeMarks } from "@automovie/archetypes";
import type { IAutoMovieMark } from "@automovie/engine";
import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieModelObject,
  applyAutoMovieInspection,
  buildModel,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";

import type { IGalleryAdapter } from "../IGalleryAdapter";
import type { IGalleryRequest } from "../structures/IGalleryRequest";
import type { IGalleryView } from "../structures/IGalleryView";
import { GalleryArchetype } from "./GalleryArchetype";

/**
 * The gallery's drawing: one subject on a floor grid, turned by an orbiting
 * camera.
 *
 * Everything drawn comes from the packages. A model is built by `render`'s
 * `buildModel`, the affordance marks by `ArchetypeMarks` and drawn by
 * `render`'s inspection, and the
 * canvas loop is `viewer`'s `mountViewer`. This module owns only the camera's
 * orbit and where the affordance ids are placed over the canvas.
 */
export namespace GalleryStage {
  /**
   * Side in metres of one cell of the floor grid for a subject of a size:
   * a quarter metre under furniture and vehicles, five centimetres under
   * what is carried, one under what is held in the fingers.
   */
  const cell = (size: number): number =>
    size > 1 ? 0.25 : size > 0.25 ? 0.05 : 0.01;

  /** The camera's distance from a subject, in diagonals of the subject's box: far enough that the whole box and its marks fit the view. */
  const DISTANCE: number = 2.2;

  /** Pixels one character of an affordance id advances, at the tag's 12 px monospaced face. */
  const TAG_ADVANCE: number = 7.3;

  /** Pixels of padding and margin around an affordance id. */
  const TAG_PADDING: number = 14;

  /** Pixels from one line of affordance ids to the next. */
  const TAG_LINE: number = 19;

  /** The direction each named view looks from, as azimuth and elevation in degrees. */
  const VIEWS: Readonly<
    Record<IGalleryAdapter.View, readonly [number, number]>
  > = {
    front: [0, 5],
    back: [180, 5],
    left: [90, 5],
    right: [-90, 5],
    top: [0, 89],
    quarter: [35, 22],
  };

  /** What is drawn now, and how to release it. */
  interface IContent {
    /** The object in the scene. */
    object: THREE.Object3D;

    /** The affordance marks, when the subject has any. */
    marks: IAutoMovieMark[];

    /** Where each affordance id is placed, in the world. */
    anchors: { id: string; at: THREE.Vector3 }[];

    /** Release the object's geometry and materials. */
    release(): void;
  }

  /**
   * Start drawing into a canvas.
   *
   * @param canvas The canvas.
   * @param labels The element over the canvas that holds the affordance ids.
   * @returns The stage.
   */
  export function mount(
    canvas: HTMLCanvasElement,
    labels: HTMLElement,
  ): IGalleryAdapter.IStage {
    const scene: THREE.Scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key: THREE.DirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.8,
    );
    key.position.set(1.5, 3, 2.5);
    scene.add(key, key.target);

    // The viewport's colours follow the page's theme through two custom
    // properties, read again whenever the theme changes.
    const paint = (): void => {
      const style: CSSStyleDeclaration = getComputedStyle(canvas);
      scene.background = new THREE.Color(
        style.getPropertyValue("--am-viewport").trim() || "#eef1f5",
      );
      gridColor.set(
        style.getPropertyValue("--am-viewport-grid").trim() || "#c3c8d0",
      );
    };
    const gridColor: THREE.Color = new THREE.Color();
    const gridMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
      color: gridColor,
    });
    let grid: THREE.LineSegments | null = null;
    paint();

    // The constructor copies the colour, so the material is handed the
    // colour object itself and a later repaint recolours the grid.
    gridMaterial.color = gridColor;
    const themed: MutationObserver = new MutationObserver(paint);
    themed.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    // The camera orbits a target at a distance; every control changes these
    // four numbers and the frame loop places the camera from them.
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      35,
      1,
      0.01,
      100,
    );
    const target: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
    let azimuth: number = VIEWS.quarter[0];
    let elevation: number = VIEWS.quarter[1];
    let distance: number = 3;
    let reach: number = 3;

    let gridCell: number = 0.25;
    let content: IContent | null = null;
    let inspection: IAutoMovieInspectionHandle | null = null;
    const tags: Map<string, HTMLElement> = new Map();
    const projected: THREE.Vector3 = new THREE.Vector3();

    const viewer: IAutoMovieViewerHandle = mountViewer(
      canvas,
      scene,
      camera,
      (): void => {
        const a: number = THREE.MathUtils.degToRad(azimuth);
        const e: number = THREE.MathUtils.degToRad(elevation);
        camera.position.set(
          target.x + distance * Math.cos(e) * Math.sin(a),
          target.y + distance * Math.sin(e),
          target.z + distance * Math.cos(e) * Math.cos(a),
        );
        camera.lookAt(target);
        camera.updateMatrixWorld(true);

        // Each affordance id sits over its contact, hidden when the contact
        // is behind the camera.
        const width: number = canvas.clientWidth;
        const height: number = canvas.clientHeight;
        const placed: { x: number; y: number; w: number }[] = [];
        for (const anchor of content?.anchors ?? []) {
          const tag: HTMLElement | undefined = tags.get(anchor.id);
          if (tag === undefined) continue;
          projected.copy(anchor.at).project(camera);
          tag.style.display = projected.z > 1 || projected.z < -1 ? "none" : "";
          if (tag.style.display === "none") continue;

          // Contacts that project onto one place would stack their ids on
          // top of each other, so an id moves down a line until it is clear
          // of the ones placed before it.
          const w: number = anchor.id.length * TAG_ADVANCE + TAG_PADDING;
          const x: number = ((projected.x + 1) / 2) * width;
          let y: number = ((1 - projected.y) / 2) * height;
          const natural: number = y;
          for (let tries: number = 1; tries <= 10; tries++) {
            const hit: boolean = placed.some(
              (other: { x: number; y: number; w: number }): boolean =>
                x < other.x + other.w &&
                other.x < x + w &&
                Math.abs(y - other.y) < TAG_LINE,
            );
            if (!hit) break;

            // One line down, one up, two down, two up: the nearest free line.
            y =
              natural +
              (tries % 2 === 1 ? 1 : -1) * Math.ceil(tries / 2) * TAG_LINE;
          }
          placed.push({ x, y, w });
          tag.style.transform = `translate(${x}px, ${y}px)`;
        }
      },
    );

    // Dragging turns the camera; the wheel and a pinch change its distance.
    let dragging: { x: number; y: number } | null = null;
    const down = (event: PointerEvent): void => {
      dragging = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent): void => {
      if (dragging === null) return;
      orbit(
        -(event.clientX - dragging.x) * 0.4,
        (event.clientY - dragging.y) * 0.4,
        1,
      );
      dragging = { x: event.clientX, y: event.clientY };
    };
    const up = (): void => {
      dragging = null;
    };
    const wheel = (event: WheelEvent): void => {
      // The page scrolls as usual unless the pointer is held to zoom, so a
      // reader scrolling past the canvas is not caught in it.
      if (
        !event.ctrlKey &&
        !event.shiftKey &&
        document.activeElement !== canvas
      )
        return;
      event.preventDefault();
      orbit(0, 0, event.deltaY > 0 ? 1.1 : 1 / 1.1);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });

    function orbit(byAzimuth: number, byElevation: number, zoom: number): void {
      azimuth = (azimuth + byAzimuth) % 360;
      elevation = Math.min(89, Math.max(-20, elevation + byElevation));
      distance = Math.min(reach * 6, Math.max(reach * 0.15, distance * zoom));
    }

    /** Put the camera back on the whole subject and lay the floor under it. */
    const frame = (object: THREE.Object3D): void => {
      const box: THREE.Box3 = new THREE.Box3().setFromObject(object);
      box.expandByPoint(new THREE.Vector3(box.min.x, 0, box.min.z));
      const size: number = Math.max(
        0.05,
        box.getSize(new THREE.Vector3()).length(),
      );
      box.getCenter(target);
      reach = size * DISTANCE;
      distance = reach;
      [azimuth, elevation] = VIEWS.quarter;
      camera.near = Math.max(0.002, size / 200);
      camera.far = size * 40;
      camera.updateProjectionMatrix();

      gridCell = cell(size);
      const floor: THREE.Box3 = box
        .clone()
        .expandByScalar(Math.max(2 * gridCell, size * 0.15));
      const lines: number[] = [];
      for (
        let x: number = Math.ceil(floor.min.x / gridCell) * gridCell;
        x <= floor.max.x;
        x += gridCell
      )
        lines.push(x, 0, floor.min.z, x, 0, floor.max.z);
      for (
        let z: number = Math.ceil(floor.min.z / gridCell) * gridCell;
        z <= floor.max.z;
        z += gridCell
      )
        lines.push(floor.min.x, 0, z, floor.max.x, 0, z);
      if (grid !== null) {
        grid.removeFromParent();
        grid.geometry.dispose();
      }
      grid = new THREE.LineSegments(
        new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.Float32BufferAttribute(lines, 3),
        ),
        gridMaterial,
      );
      grid.name = "ground";
      scene.add(grid);
    };

    const clear = (): void => {
      inspection?.restore();
      inspection = null;
      content?.object.removeFromParent();
      content?.release();
      content = null;
      for (const tag of tags.values()) tag.remove();
      tags.clear();
    };

    return {
      show: async (
        request: IGalleryRequest,
        reframe: boolean,
      ): Promise<IGalleryView> => {
        // Let the page paint its busy state before the synchronous build.
        await new Promise((resolve: (value: void) => void): void => {
          setTimeout(resolve, 30);
        });
        const made: { content: IContent; view: Omit<IGalleryView, "grid"> } =
          archetype(request);
        clear();
        content = made.content;
        scene.add(content.object);
        content.object.updateMatrixWorld(true);
        if (reframe || grid === null) frame(content.object);

        if (request.affordances && content.marks.length !== 0) {
          inspection = applyAutoMovieInspection({
            scene,
            request: parseAutoMovieInspectionRequest(
              (name: string): string | null =>
                name === "marks" ? "affordance/*" : null,
            ),
            marks: content.marks,
          });
          for (const anchor of content.anchors) {
            const tag: HTMLElement = document.createElement("span");
            tag.className = "am-viewport-tag";
            tag.textContent = anchor.id;
            labels.append(tag);
            tags.set(anchor.id, tag);
          }
        }
        return { ...made.view, grid: gridCell };
      },
      orbit,
      view: (name: IGalleryAdapter.View): void => {
        [azimuth, elevation] = VIEWS[name];
        distance = reach;
      },
      unmount: (): void => {
        themed.disconnect();
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("wheel", wheel);
        clear();
        if (grid !== null) grid.geometry.dispose();
        gridMaterial.dispose();
        viewer.stop();
      },
    };
  }

  /** An archetype's model with its affordance marks. */
  function archetype(request: IGalleryRequest): {
    content: IContent;
    view: Omit<IGalleryView, "grid">;
  } {
    const built: GalleryArchetype.IBuilt = GalleryArchetype.build(request);
    const model: IAutoMovieModelObject = buildModel(built.archetype);
    model.object.name = "subject";
    const box: THREE.Box3 = new THREE.Box3().setFromObject(model.object);
    // An arrow a fifth of the model's diagonal, never longer than the
    // package's own, so a mug's contacts are not drawn larger than the mug.
    const arrow: number = Math.max(
      0.01,
      Math.min(
        ArchetypeMarks.ARROW,
        0.2 * box.getSize(new THREE.Vector3()).length(),
      ),
    );
    return {
      content: {
        object: model.object,
        marks: ArchetypeMarks.of(
          "subject",
          built.archetype.affordances,
          undefined,
          arrow,
        ),
        anchors: built.archetype.affordances.map((affordance) => ({
          id: affordance.id,
          at: new THREE.Vector3(
            affordance.frame.translation.x,
            affordance.frame.translation.y,
            affordance.frame.translation.z,
          ),
        })),
        release: (): void =>
          model.object.traverse((object: THREE.Object3D): void => {
            if (!(object instanceof THREE.Mesh)) return;
            (object.geometry as THREE.BufferGeometry).dispose();
            for (const material of [object.material].flat())
              (material as THREE.Material).dispose();
          }),
      },
      view: built.view,
    };
  }
}
