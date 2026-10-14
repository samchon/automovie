import type { IAutoMovieModel } from "@automovie/interface";
import { type IAutoMovieFormationCycle, buildInstancedFormation, formationCycleOf, formationCyclePosition } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose } from "../internal/predicates";

/**
 * Tier changes preserve resolved cadence in each tier's shared shadow cells; turning adds cycle distance proportional to the member's pivot radius.
 *
 * Scenarios:
 * 1. Near and far tiers own distinct table cells and depth/distance materials; camera selection changes the existing mesh visibility.
 * 2. A translating quarter turn resolves half-distance and half-angle at its midpoint using the supplied derived stride.
 * 3. Seeded phases and opposite seek order preserve the wrapped sample; culling hides the tier and returning restores its visibility.
 *
 * @evidence contracts/testing.md#behavioral-verification Updates the established formation through movement, turn, near/far camera and away/back views, reading native batch visibility, cycle values and depth/distance material state; catches stale turned transforms and shadow cycle cells detached from their visible tier.
 * @evidence contracts/testing.md#independent-expectations Literal camera positions and authored one-metre travel/quarter turn distinguish admission and LOD transitions; modulo phase arithmetic uses the supplied Engine stride/cadence premise and therefore does not independently establish gait derivation or conservative geometric coverage.
 * @evidence contracts/testing.md#distinguishing-cases Covers moving/turned near and far tiers, culling away and return with shadow synchronization; chunk boundary populations and independent release failures remain separate cases.
 * @evidence contracts/testing.md#execution-ownership This named asynchronous unit uses existing source and the original generic formation fixture with actual CPU-side Three camera/batch objects, releases the owner and starts no browser, GPU, native process or new Human figure.
 */
export async function test_viewer_formation_shadow_lod_turn(): Promise<void> {
  const THREE: typeof ThreeTypes = await import("three");
  const input: ReturnType<typeof createFormationShadowInputs> = createFormationShadowInputs();
  const source: IAutoMovieModel = [...input.models.values()][0]!;
  source.profiles![0]!.gaits = [{ name: "swing", period: 1,
    rootBob: { center: 1.5, amplitude: 0, phase: 0 },
    limbs: [{ bone: "hips", phase: 0, duty: 0.5, amplitude: 30, neutral: 0 }] }];
  const near: { maxDistance: number; tier: "hero" | "near" | "far"; recipe: string; recipeDigest: string; model: string; } = { ...input.formation.lod[0]!, maxDistance: 10 };
  const far: { tier: "far"; model: string; maxDistance: null; recipe: string; recipeDigest: string; } = { ...near, tier: "far" as const, model: "far-box", maxDistance: null };
  input.formation.lod = [near, far];
  input.models = new Map([[near.model, source], [far.model, { ...source, id: "far-box" }]]);
  input.motions = [{ ...input.motions![0]!, gait: "swing", start: 0, end: 1,
    to: { translation: { x: 2, y: 0, z: 0 }, facingOffsetDeg: 90,
      spacingScale: { lateral: 1, depth: 1 } } }];
  const runtime: ReturnType<typeof buildInstancedFormation> = buildInstancedFormation(input);
  const [nearMesh, farMesh]: ThreeTypes.InstancedMesh<ThreeTypes.BufferGeometry<ThreeTypes.NormalBufferAttributes, ThreeTypes.BufferGeometryEventMap>, ThreeTypes.Material<ThreeTypes.MaterialEventMap> | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[], ThreeTypes.Object3DEventMap>[] = runtime.object.children as ThreeTypes.InstancedMesh[];
  const nearCycle: IAutoMovieFormationCycle = formationCycleOf(nearMesh!)!;
  const farCycle: IAutoMovieFormationCycle = formationCycleOf(farMesh!)!;
  TestValidator.predicate("distinct tiers keep distinct uniform cells", nearCycle.uniforms !== farCycle.uniforms);
  TestValidator.predicate("each tier has both shadow projections", [nearMesh!, farMesh!].every((mesh: ThreeTypes.InstancedMesh<ThreeTypes.BufferGeometry<ThreeTypes.NormalBufferAttributes, ThreeTypes.BufferGeometryEventMap>, ThreeTypes.Material<ThreeTypes.MaterialEventMap> | ThreeTypes.Material<ThreeTypes.MaterialEventMap>[], ThreeTypes.Object3DEventMap>): boolean => mesh.customDepthMaterial instanceof THREE.MeshDepthMaterial && mesh.customDistanceMaterial instanceof THREE.MeshDistanceMaterial));
  const camera: ThreeTypes.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 3, 6); camera.lookAt(0, 0, 0);
  runtime.update(camera, 900, 0.5);
  TestValidator.equals("the close camera selects the near tier", [nearMesh!.visible, farMesh!.visible], [true, false]);
  for (const cycle of [nearCycle, farCycle]) {
    TestValidator.predicate("the arranged gait has actual ground stride", cycle.active.strideMeters > 0);
    TestValidator.predicate("midpoint travel advances one metre over that stride", nclose(cycle.uniforms.automovieCycleAdvance.value, 1 / cycle.active.strideMeters));
    TestValidator.predicate("midpoint turn advances pi/4 over that stride", nclose(cycle.uniforms.automovieCycleTurn.value, Math.PI / 4 / cycle.active.strideMeters));
  }
  const instance: ThreeTypes.Matrix4 = new THREE.Matrix4(); nearMesh!.getMatrixAt(0, instance);
  const radius: number = Math.hypot(instance.elements[12]!, instance.elements[14]!);
  const phase: number = nearMesh!.geometry.getAttribute("automoviePhase").getX(0);
  const cadence: { advance: number; turn: number; } = { advance: nearCycle.uniforms.automovieCycleAdvance.value,
    turn: nearCycle.uniforms.automovieCycleTurn.value };
  const raw: number = phase + cadence.advance + radius * cadence.turn;
  const position: number = formationCyclePosition(cadence, phase, radius);
  TestValidator.predicate("member radius and phase compose before wrap", nclose(position, raw - Math.floor(raw)));
  camera.position.set(0, 3, 80); camera.lookAt(0, 0, 0);
  runtime.update(camera, 900, 0.5);
  TestValidator.equals("the distant camera selects the far tier", [nearMesh!.visible, farMesh!.visible], [false, true]);
  runtime.update(camera, 900, 1); runtime.update(camera, 900, 0.5);
  TestValidator.predicate("reverse seeks reproduce the same cadence", nclose(nearCycle.uniforms.automovieCycleAdvance.value, cadence.advance) && nclose(nearCycle.uniforms.automovieCycleTurn.value, cadence.turn));
  camera.lookAt(0, 3, 160); runtime.update(camera, 900, 0.5);
  TestValidator.equals("chunk culling applies to both pass projections", [nearMesh!.visible, farMesh!.visible], [false, false]);
  camera.lookAt(0, 0, 0); runtime.update(camera, 900, 0.5);
  TestValidator.equals("returning restores the existing far mesh", [nearMesh!.visible, farMesh!.visible], [false, true]);
  runtime.dispose();
}
