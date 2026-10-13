import { buildInstancedFormation, formationCycleOf, formationCyclePosition } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { createFormationShadowInputs } from "../internal/createFormationShadowInputs";
import { nclose } from "../internal/predicates";

/**
 * Tier changes keep each tier's shared shadow cells on the resolved cadence;
 * a turning locomotion adds distance proportional to the member's pivot radius.
 *
 * Scenarios:
 * 1. Near and far tiers own distinct table cells and both depth/distance
 *    projections; camera selection changes which existing mesh is drawn.
 * 2. A translating quarter turn resolves half the distance and half the angle
 *    at its midpoint, using each take's measured stride for both cells.
 * 3. Seeded phases and opposite seek order preserve the same wrapped sample;
 *    culling hides both shadow/beauty meshes and returning restores the tier.
 */
export const test_viewer_formation_shadow_lod_turn = async (): Promise<void> => {
  const THREE = await import("three");
  const input = createFormationShadowInputs();
  const source = [...input.models.values()][0]!;
  source.profiles![0]!.gaits = [{ name: "swing", period: 1,
    rootBob: { center: 1.5, amplitude: 0, phase: 0 },
    limbs: [{ bone: "hips", phase: 0, duty: 0.5, amplitude: 30, neutral: 0 }] }];
  const near = { ...input.formation.lod[0]!, maxDistance: 10 };
  const far = { ...near, tier: "far" as const, model: "far-box", maxDistance: null };
  input.formation.lod = [near, far];
  input.models = new Map([[near.model, source], [far.model, { ...source, id: "far-box" }]]);
  input.motions = [{ ...input.motions![0]!, gait: "swing", start: 0, end: 1,
    to: { translation: { x: 2, y: 0, z: 0 }, facingOffsetDeg: 90,
      spacingScale: { lateral: 1, depth: 1 } } }];
  const runtime = buildInstancedFormation(input);
  const [nearMesh, farMesh] = runtime.object.children as ThreeTypes.InstancedMesh[];
  const nearCycle = formationCycleOf(nearMesh!)!;
  const farCycle = formationCycleOf(farMesh!)!;
  TestValidator.predicate("distinct tiers keep distinct uniform cells", nearCycle.uniforms !== farCycle.uniforms);
  TestValidator.predicate("each tier has both shadow projections", [nearMesh!, farMesh!].every((mesh) => mesh.customDepthMaterial instanceof THREE.MeshDepthMaterial && mesh.customDistanceMaterial instanceof THREE.MeshDistanceMaterial));
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 3, 6); camera.lookAt(0, 0, 0);
  runtime.update(camera, 900, 0.5);
  TestValidator.equals("the close camera selects the near tier", [nearMesh!.visible, farMesh!.visible], [true, false]);
  for (const cycle of [nearCycle, farCycle]) {
    TestValidator.predicate("the arranged gait has actual ground stride", cycle.active.strideMeters > 0);
    TestValidator.predicate("midpoint travel advances one metre over that stride", nclose(cycle.uniforms.automovieCycleAdvance.value, 1 / cycle.active.strideMeters));
    TestValidator.predicate("midpoint turn advances pi/4 over that stride", nclose(cycle.uniforms.automovieCycleTurn.value, Math.PI / 4 / cycle.active.strideMeters));
  }
  const instance = new THREE.Matrix4(); nearMesh!.getMatrixAt(0, instance);
  const radius = Math.hypot(instance.elements[12]!, instance.elements[14]!);
  const phase = nearMesh!.geometry.getAttribute("automoviePhase").getX(0);
  const cadence = { advance: nearCycle.uniforms.automovieCycleAdvance.value,
    turn: nearCycle.uniforms.automovieCycleTurn.value };
  const raw = phase + cadence.advance + radius * cadence.turn;
  const position = formationCyclePosition(cadence, phase, radius);
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
};
