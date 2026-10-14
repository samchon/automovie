import type * as THREE from "three";

import { disposeCrossDissolve } from "./disposeCrossDissolve.js";
import { disposeFadeToBlack } from "./disposeFadeToBlack.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Release both renderer-owned beauty compositors and the renderer independently. A failed resource listener cannot prevent another owner from releasing its resources. Preserve every failure rather than reporting successful cleanup. Compositor release is idempotent; renderer disposal follows its native API. Direct capture hosts retire their scene shadow targets before this call; mounted hosts use releaseMountedViewer for that complete lifecycle.
 *
 * @evidence contracts/common.md#principled-implementation Independently retires dissolve, fade and the supplied renderer in order using the shared restoration failure collector.
 * @evidence contracts/common.md#clear-and-simple-design One release boundary serves direct/mounted hosts while scene shadow retirement remains the caller or releaseMountedViewer responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed compositor remains terminal and retained with its cause, successful sibling owners still retire and native renderer disposal is not proof of kernel release; no retry is invented by this primitive.
 * @evidence contracts/common.md#meaningful-documentation Documents independent owners, failure preservation, compositor sticky behavior and the separate scene-shadow prerequisite.
 * @evidence contracts/performance.md#efficient-algorithms Fixed three-owner coordination delegates each compositor fixed resource set and native renderer disposal without enumerating borrowed scene materials.
 * @evidence contracts/performance.md#reuse-equivalent-work Successful compositor removal and failed terminal retention follow their actual state maps; direct repeated renderer.dispose is not cached here and callers own a terminal once guard.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every independent owner is attempted even after another fails; retained failed compositor rows remain observable and this helper acquires no resource or replacement renderer.
 */
export const releaseViewerRenderer: (renderer: THREE.WebGLRenderer) => void = (
  renderer: THREE.WebGLRenderer,
): void =>
  restoreAutoMovieRenderModeState([
    (): void => {
      disposeCrossDissolve(renderer);
    },
    (): void => {
      disposeFadeToBlack(renderer);
    },
    (): void => {
      renderer.dispose();
    },
  ]);
