import type * as THREE from "three";
import { type IAutoMovieSemanticMaskBinding, type IAutoMovieSemanticMaskCoverage, type IAutoMovieScene, type IAutoMovieSemanticMask } from "@automovie/interface";
import type { IAutoMovieRenderSemanticMaskHandle } from "./IAutoMovieRenderSemanticMaskHandle.js";
import { auditAutoMovieSemanticMaskSceneImplementation } from "./semanticMask/internal/auditAutoMovieSemanticMaskSceneImplementation.js";
import { applyAutoMovieSemanticMaskImplementation } from "./semanticMask/internal/applyAutoMovieSemanticMaskImplementation.js";
import { attachAutoMovieSemanticMask as attachAutoMovieSemanticMaskImplementation } from "./semanticMask/internal/attachAutoMovieSemanticMask.js";
import { autoMovieSemanticMaskOf as autoMovieSemanticMaskOfImplementation } from "./semanticMask/internal/autoMovieSemanticMaskOf.js";
import { maskColor as maskColorImplementation } from "./semanticMask/internal/maskColor.js";

/** Public operations for Auto Movie Render Semantic Mask. */
export namespace AutoMovieRenderSemanticMask {
  /** Props for auditing a palette against its built scene. */
  export interface IAuditSceneProps {
    /** The built scene. */
    scene: THREE.Scene;
    /** The design the scene was built from, in its own declaration order. */
    design: IAutoMovieScene;
    /** Palette derived from the same production. */
    mask: IAutoMovieSemanticMask;
  }

  /** Props for painting a built scene with its stable semantic palette. */
  export interface IApplyProps {
    /** The built scene. */
    scene: THREE.Scene;
    /** The design the scene was built from, in its own declaration order. */
    design: IAutoMovieScene;
    /** Palette derived from the same production. */
    mask: IAutoMovieSemanticMask;
  }

  /**
   * Join a supplied palette to assembled scene roots in both directions without
   * painting or mutating the scene. Unresolved lists drawable entries with no
   * claimed object root; unaddressed counts Mesh objects lacking a nearest
   * semantic owner, including hidden geometry. Ownership-only room/opening/slot
   * entries do not require their own drawable. Empty unresolved establishes root
   * membership, while actual visibility, submission and pixels remain separate
   * observations; a cached build audit needs renewal after relevant graph
   * changes.
   */
  export function auditScene(props: IAuditSceneProps): IAutoMovieSemanticMaskCoverage {
    return auditAutoMovieSemanticMaskSceneImplementation(props);
  }

  /**
   * Paint a built scene with its stable semantic palette.
   *
   * An attached palette assigns stable semantic colours instead of a top-level
   * traversal ramp. The nearest claimed root determines each mesh's identity; a
   * correctly rebuilt design can preserve those palette colours despite changed
   * traversal order. A mesh no entry claims is painted the reserved background
   * colour so a segmentation consumer never reads a lit beauty surface as a
   * class. Compiled slots use instanceColor to keep member identities; a supplied
   * baked formation cycle is carried onto replacement materials through the
   * beauty hook. Compilation and delivered pixels remain rendering observations.
   */
  export function apply(props: IApplyProps): IAutoMovieRenderSemanticMaskHandle {
    return applyAutoMovieSemanticMaskImplementation(props);
  }
  /**
   * Hand a built scene the palette its `mask` pass must paint it with.
   *
   * The scene carries it, rather than every caller passing it down, for the same
   * reason a formation's baked cycle rides on its own mesh: the pass boundary
   * that needs it is several calls below whoever knows it. A compiled shot's
   * runtime hands `applyRenderMode` a pass name and nothing else, so a mask that
   * had to arrive as an argument could only arrive by widening every signature
   * between the page and the pass. A scene given no palette keeps the legacy
   * index ramp, which is what an asset turntable and any host without a compiled
   * design draw.
   */
  export function attach(scene: THREE.Scene, binding: IAutoMovieSemanticMaskBinding): void {
    attachAutoMovieSemanticMaskImplementation(scene, binding);
  }

  /** The palette a scene was given, or `null` when it was given none. */
  export function of(scene: THREE.Scene): IAutoMovieSemanticMaskBinding | null {
    return autoMovieSemanticMaskOfImplementation(scene);
  }
  /**
   * The deterministic flat color of mask index `i`: golden-angle hue stepping,
   * full saturation, mid lightness. Adjacent nodes land far apart on the hue
   * wheel, and the same scene always gets the same colors.
   */
  export function colorForIndex(index: number): THREE.Color {
    return maskColorImplementation(index);
  }
}
