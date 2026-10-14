import * as THREE from "three";

import { constructAutoMovieOwnedResources } from "../../constructAutoMovieOwnedResources.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { publishViewerCompletedFrame } from "../../publishViewerCompletedFrame.js";
import type { IHumanViewportHost } from "../common/IHumanViewportHost.js";
import { addHumanPreviewRig } from "../common/addHumanPreviewRig.js";
import { createHumanPreviewCamera } from "../common/createHumanPreviewCamera.js";
import { createHumanViewportTransfer } from "../common/createHumanViewportTransfer.js";
import { createHumanObservation } from "../common/observation/createHumanObservation.js";

/**
 * Own display state independently of numerical evaluation and file encoding.
 * The host supplies browser IO; this stage owns lighting, camera and clay.
 * Publishing swaps scene membership and marks shadows stale. The caller owns
 * geometry lifetimes, allowing disposable or resident editable buffers.
 * Shadows depend on the published geometry, hair finish and caster toggle,
 * not the orbit camera. Refresh their eight maps at those transitions while
 * the static scene renders without repeated shadow submissions between edits.
 * Native orbit change events and owned model/view/pass/resize transitions mark
 * meaningful display changes. Idle draws still publish their exact facts but
 * need no new encoded bitmap. Hosts without native orbit events retain eager
 * observation; an explicit finish always marks a fresh completed display.
 *
 * @evidence contracts/common.md#principled-implementation Owns a native Y-up metre camera, calibrated authored studio, clay and observation while borrowing displayed groups and browser services. Publication and supported display transitions invalidate shadow maps; current native orbit events distinguish meaningful image requests from idle draws. These display calculations alone prove no observed photographic or anatomical match.
 * @evidence contracts/common.md#clear-and-simple-design Display state and scene membership have one stage owner independent of numerical evaluation/export. Camera fitting, studio calibration, observation and completed-frame transport keep their existing responsibilities without a second viewport runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored light colors/powers, framing and shadow settings remain display conventions rather than measured tissue values. Structural passes retain their declared alpha-card/reading limitations, and absent orbit events deliberately use eager saving instead of manufacturing an unchanged-image claim.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes borrowed group geometry from owned stage materials/subscriptions, static shadow dependencies and completed-display invalidation. Callers stop using stage controls after close; native GPU appearance is unobserved in the current environment.
 * @evidence contracts/performance.md#efficient-algorithms One fixed studio/camera/observation population persists through native animation draws. Eight key shadow maps add actual raster and scene work only when invalidated; observation traversal and full native draws still occur during idle animation, even when duplicate bitmap requests are suppressed.
 * @evidence contracts/performance.md#reuse-equivalent-work Scene/camera/lights/clay persist, shadow refresh follows owned geometry/material/caster transitions and native orbit changes drive display requests. A reused published group still invalidates, and finish deliberately requests fresh completion; no document-name-only pixel cache is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Construction registers clay, orbit listener, resize unsubscribe and animation-loop withdrawal for rollback. Close shares independent loop/listener/observation/shadow/material retirement and detaches borrowed active group; its numerical owner releases group resources and the browser factory later closes renderer/controls. Native closure completion is not a physical allocation census.
 */
export function createHumanPreviewStage(props: IHumanViewportHost): {
  settleRetirements: () => Promise<void>;
  close: () => Promise<void>;
  restoreObservation: () => void;
  publish: (group: THREE.Group) => void;
  fitView: () => void;
  cameraView: (degrees: number) => void;
  observe: ReturnType<typeof createHumanObservation>["hooks"];
  setClay: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
  finish: () => void;
  renderer: () => unknown;
} {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): ReturnType<typeof createHumanPreviewStage> => {
      const { renderer, canvas }: IHumanViewportHost = props;
      renderer.setPixelRatio(Math.min(props.pixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.LinearToneMapping;
      renderer.shadowMap.enabled = true;
      // Three r186 maps the removed soft mode to PCF on its first shadow draw.
      // Select that canonical mode before a direct renderer can draw the preview.
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
      scene.background = new THREE.Color(0x1c252e);
      const shadowLights: THREE.DirectionalLight[] = addHumanPreviewRig({
        scene,
        renderer,
        scale: 1,
      });
      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        30,
        1,
        0.01,
        10,
      );
      const orbit: ReturnType<IHumanViewportHost["orbit"]> =
        props.orbit(camera);
      let displayDirty: boolean = true;
      const invalidateDisplay: () => void = (): void => {
        displayDirty = true;
      };
      own({
        dispose: (): void =>
          orbit.removeEventListener?.("change", invalidateDisplay),
      });
      orbit.addEventListener?.("change", invalidateDisplay);
      orbit.target.set(0, -0.015, 0);
      orbit.enableDamping = true;
      orbit.minDistance = 0.12;
      orbit.maxDistance = 2;
      const clay: THREE.MeshStandardMaterial = own(
        new THREE.MeshStandardMaterial({
          color: 0x999999,
          roughness: 0.75,
          side: THREE.DoubleSide,
        }),
      );
      let active: THREE.Group | undefined;
      let clayEnabled: boolean = false;
      const observation: ReturnType<typeof createHumanObservation> =
        createHumanObservation({
          scene,
          camera,
          orbit,
          roots: (): THREE.Group<THREE.Object3DEventMap>[] =>
            active === undefined ? [] : [active],
          clay,
          height: (): number => canvas.getBoundingClientRect().height,
          invalidateShadows: (): void => {
            renderer.shadowMap.needsUpdate = true;
          },
          invalidateDisplay,
        });
      const {
        cameraView,
        fitView,
        resize: resizeCamera,
      }: {
        cameraView: (degrees: number) => void;
        fitView: () => void;
        resize: (width: number, height: number) => void;
      } = createHumanPreviewCamera({
        camera,
        orbit,
        model: (): THREE.Group<THREE.Object3DEventMap> | undefined => active,
        setSize: (width: number, height: number): void =>
          renderer.setSize(width, height, false),
      });
      cameraView(0);
      const publish: (group: THREE.Group) => void = (
        group: THREE.Group,
      ): void => {
        invalidateDisplay();
        renderer.shadowMap.needsUpdate = true;
        if (active === group) return;
        if (active !== undefined) scene.remove(active);
        active = group;
        scene.add(group);
      };
      const resize: () => void = (): void => {
        invalidateDisplay();
        const rect: Pick<DOMRect, "width" | "height"> =
          canvas.getBoundingClientRect();
        resizeCamera(rect.width, rect.height);
      };
      const stopResize: () => void = props.observeResize(resize);
      own({ dispose: stopResize });
      resize();
      let freezes: number = 0;
      const render: () => void = (): void => {
        if (freezes === 0) orbit.update();
        observation.apply();
        scene.overrideMaterial = observation.override(clayEnabled);
        const changed: boolean | undefined =
          orbit.addEventListener === undefined ? undefined : displayDirty;
        displayDirty = false;
        renderer.render(scene, camera);
        publishViewerCompletedFrame(canvas, {
          camera,
          scene,
          pass:
            observation.hooks.state().pass === "beauty" && clayEnabled
              ? "clay"
              : observation.hooks.state().pass,
          control: transfer,
          requiresApplication: true,
          changed,
        });
      };
      const finish: () => void = (): void => {
        invalidateDisplay();
        render();
        renderer.getContext().finish();
      };
      const transfer: ReturnType<typeof createHumanViewportTransfer> =
        createHumanViewportTransfer({
          camera,
          observe: observation.hooks,
          clay: (): boolean => clayEnabled,
          shadows: (): boolean =>
            shadowLights.some(
              (light: THREE.DirectionalLight): boolean => light.castShadow,
            ),
          setClay: (value: boolean): void => {
            invalidateDisplay();
            clayEnabled = value;
            renderer.shadowMap.needsUpdate = true;
          },
          setShadows: (value: boolean): void => {
            invalidateDisplay();
            for (const light of shadowLights) light.castShadow = value;
            renderer.shadowMap.needsUpdate = true;
          },
          finish,
          freeze: (): (() => void) => {
            ++freezes;
            let released: boolean = false;
            return (): void => {
              if (!released) {
                released = true;
                --freezes;
              }
            };
          },
        });
      own({ dispose: (): void => renderer.setAnimationLoop(null) });
      renderer.setAnimationLoop(render);
      const close: () => Promise<void> = createAutoMovieResourceRetirement([
        (): void => renderer.setAnimationLoop(null),
        (): void => orbit.removeEventListener?.("change", invalidateDisplay),
        stopResize,
        (): Promise<void> => observation.close(),
        (): void => {
          if (active !== undefined) scene.remove(active);
        },
        (): void => {
          active = undefined;
        },
        (): void => clay.dispose(),
        ...shadowLights.flatMap(
          (light: THREE.DirectionalLight): (() => void)[] => [
            (): void => light.shadow.map?.dispose(),
            (): void => light.shadow.mapPass?.dispose(),
          ],
        ),
      ]);

      return {
        /** Await the observation owner's temporary-material retirement outcomes. */
        settleRetirements: (): Promise<void> => observation.settleRetirements(),
        /** Retire this stage's loop, scene references and materials without closing its borrowed renderer. */
        close,
        /** Restore display-owned materials before the numerical owner releases a resident. */
        restoreObservation: observation.restore,
        publish,
        fitView: (): void => {
          invalidateDisplay();
          fitView();
        },
        cameraView: (degrees: number): void => {
          invalidateDisplay();
          cameraView(degrees);
        },
        observe: observation.hooks,
        setClay: (enabled: boolean): void => {
          invalidateDisplay();
          clayEnabled = enabled;
          renderer.shadowMap.needsUpdate = true;
        },
        // A cast-shadow boundary can resemble a crease in the anatomical surface.
        // Toggle only the shadow casters: direct light, materials, geometry and the
        // saved document stay fixed, so the two views isolate that ambiguity.
        // Changing the light's shadow count also refreshes Three's shader variant.
        setShadows: (enabled: boolean): void => {
          invalidateDisplay();
          for (const light of shadowLights) light.castShadow = enabled;
          renderer.shadowMap.needsUpdate = true;
        },
        finish,
        renderer: (): unknown => {
          const gl: {
              finish: () => void;
              getExtension: (
                name: string,
              ) => { UNMASKED_RENDERER_WEBGL: number } | null;
              getParameter: (parameter: number) => unknown;
              RENDERER: number;
            } = renderer.getContext(),
            extension: { UNMASKED_RENDERER_WEBGL: number } | null =
              gl.getExtension("WEBGL_debug_renderer_info");
          return gl.getParameter(
            extension?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER,
          );
        },
      };
    },
  );
}
