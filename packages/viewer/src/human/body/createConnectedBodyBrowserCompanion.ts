import * as THREE from "three";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IConnectedBodyFrame } from "./IConnectedBodyFrame.js";
import { createConnectedBodyRenderer } from "./createConnectedBodyRenderer.js";
import type { createConnectedBodyViewport } from "./createConnectedBodyViewport.js";

/**
 * Own a browser companion's prepared GPU frames and texture loading.
 * Publication uses the body's current companion seam and an identity placement
 * because numerical head output already uses the body's metre frame. Hiding
 * detaches the display without retiring its reusable numerical resident.
 * Close hides the last published companion and settles every owned resident.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the connected-body numerical-frame renderer for a display-only companion, publishing through the body's existing companion seam with identity placement because transferred geometry is already body-local.
 * @evidence contracts/common.md#clear-and-simple-design Viewer owns TextureLoader and Three placement while the Playground owner retains worker requests, document serialization and generation/status decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same resident-frame path prepares every companion; no source-specific mesh, fitted transform or bundled raw body data is introduced.
 * @evidence contracts/common.md#meaningful-documentation States prepared-frame ownership, body-frame identity placement, hide-versus-retirement semantics and final close behavior.
 * @evidence contracts/performance.md#efficient-algorithms Preparation cost follows the existing body renderer's topology/material admission; publication adds constant-size companion membership and matrix writes without another geometry conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains one body renderer and texture loader across companion generations, allowing the numerical renderer to reuse admitted resident buffers; hiding preserves that resident until replacement or close.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The companion owner retains prepared/resident groups and their texture caches through the numerical renderer; close independently hides borrowed scene membership and retires that renderer with one memoized completion, without disposing the body's GPU context.
 */
export function createConnectedBodyBrowserCompanion(props: {
  /** Resolve the body's companion seam only when publication or hide needs it. */
  viewport: () => Pick<ReturnType<typeof createConnectedBodyViewport>, "companion">;
}): Omit<ReturnType<typeof createConnectedBodyRenderer>, "publish" | "close"> & {
  /** Publish prepared body-local geometry into the companion display. */
  publish: (frame: IConnectedBodyFrame) => void;

  /** Detach the shown companion while preserving its reusable resident. */
  hide: () => void;

  /** Detach and retire this companion's numerical GPU resources once. */
  close: () => Promise<void>;
} {
  const loader: THREE.TextureLoader = new THREE.TextureLoader();
  const renderer: ReturnType<typeof createConnectedBodyRenderer> =
    createConnectedBodyRenderer({
      loadTexture: (asset: string): Promise<THREE.Texture> => loader.loadAsync(asset),
      maxAnisotropy: 8,
    });
  let displayed: ReturnType<typeof props.viewport>["companion"] | undefined;
  const hide: () => void = (): void => {
    displayed?.show(undefined);
    displayed = undefined;
  };
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    hide,
    (): Promise<void> => renderer.close(),
  ]);
  return {
    ...renderer,
    publish: (frame: IConnectedBodyFrame): void => {
      const next: ReturnType<typeof props.viewport>["companion"] = props.viewport().companion;
      const group: THREE.Group = renderer.publish(frame);
      if (displayed !== undefined && displayed !== next) displayed.show(undefined);
      next.show(group);
      next.place(new THREE.Matrix4());
      displayed = next;
    },
    hide,
    close,
  };
}
