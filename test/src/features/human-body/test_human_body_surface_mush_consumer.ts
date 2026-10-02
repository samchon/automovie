import { createHumanBodyBasisBuilder } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createHumanBodyPosedSurface } from "../../../../packages/human/src/body/basis/createHumanBodyPosedSurface";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { humanBodyMushSurface } from "../internal/humanBodyMushSurface";
import { nclose } from "../internal/predicates";

/**
 * The actual builder filters neutral skinning and preserves the full posed
 * corrective displacement. Sag still differentiates pure skinning.
 *
 * Scenarios:
 * 1. Omitted policy and a neutral document retain the original unsplit skin.
 * 2. A spine-bound corrective of 2 cm in +Z at 60 degrees gives
 *    (0,-sqrt(3)/100,1/100), independently of the neighbouring filter.
 * 3. The mixed vertex0 also receives that corrective, with the independent
 *    half-angle image (0,-1/100,sqrt(3)/100); filtering is active there.
 * 4. Two material regions receive the same final unsplit positions/normals.
 * 5. On a cone apex with 2 cm of tissue, gain .2 and softness .5, a half
 *    identity/quarter-turn skin rotation gives gravity difference
 *    (0,cos(pi/4)-1,sin(pi/4)); filter displacement must not enter that derivative.
 * 6. Sag alone and the channel-driven softness clamps keep that formula.
 */
export const test_human_body_surface_mush_consumer = (): void => {
  const config = { iterations: 1, blendWidth: 0.5, spreadRings: 1, spreadDecay: 0.7 };
  const fixture = humanBodyBasisFixture();
  const plain = createHumanBodyBasisBuilder(fixture.basis)(fixture.document);
  fixture.basis.surfaces[0].mush = config;
  fixture.basis.surfaces[0].skin.weights.splice(0, 4, 0.5, 0.5, 0, 0);
  fixture.basis.surfaces[0].skin.boneIndices.splice(0, 4, 0, 1, 0, 0);
  const filtered = createHumanBodyBasisBuilder(fixture.basis);
  const neutral = filtered(fixture.document);
  TestValidator.predicate("neutral path preserves positions", neutral.posedSurfaces[0].positions.every((value, i) => value === plain.posedSurfaces[0].positions[i]));
  const pose = [{ bone: "spine" as const, flexion: 60, abduction: null, twist: null }];
  const omitted = structuredClone(fixture.basis); delete omitted.surfaces[0].mush;
  const oldPosed = createHumanBodyBasisBuilder(omitted)({ ...fixture.document, pose });
  TestValidator.predicate("omitted policy keeps its independent half-angle skin image", [-0.1, 1 - Math.sqrt(3) / 2 + 0.1, -0.5 - Math.sqrt(3) / 10].every((value, k) => nclose(oldPosed.posedSurfaces[0].positions[k], value, 1e-12)));
  const before = filtered({ ...fixture.document, pose });
  fixture.basis.correctives!.push({ id: "fold", target: "fold", weight: 1, inputs: [{ bone: "spine", axis: "flexion", side: "positive", onset: 0, full: 60 }] });
  fixture.basis.surfaces[0].targets.fold = [0, 0, 0, 0.02, 4, 0, 0, 0.02];
  const surface = fixture.basis.surfaces[0];
  const split = surface.indices.length / 2;
  surface.regions = [{ id: "skin-a", material: "skin", indices: surface.indices.slice(0, split), uvs: null }, { id: "skin-b", material: "skin", indices: surface.indices.slice(split), uvs: null }];
  const after = createHumanBodyBasisBuilder(fixture.basis)({ ...fixture.document, pose });
  const expected = [0, -Math.sqrt(3) / 100, 1 / 100];
  TestValidator.predicate("pose corrective keeps its full rigid image", expected.every((value, k) => nclose(after.posedSurfaces[0].positions[12 + k] - before.posedSurfaces[0].positions[12 + k], value, 1e-12)));
  TestValidator.predicate("filter is active at mixed corrective witness", [0, 1, 2].some((k) => !nclose(before.posedSurfaces[0].positions[k], oldPosed.posedSurfaces[0].positions[k], 1e-6)));
  TestValidator.predicate("mixed corrective keeps its independent half-angle image", [0, -0.01, Math.sqrt(3) / 100].every((value, k) => nclose(after.posedSurfaces[0].positions[k] - before.posedSurfaces[0].positions[k], value, 1e-12)));
  TestValidator.equals("region population", after.model.parts.length, 2);
  TestValidator.predicate("regions remain meshes", after.model.parts.every((part) => part.geometry.type === "mesh"));
  type Mesh = Extract<IAutoMovieModel["parts"][number]["geometry"], { type: "mesh" }>;
  const points = after.posedSurfaces[0].positions;
  TestValidator.predicate("regions read final shared positions", after.model.parts.every((part) => {
    const positions = (part.geometry as Mesh).mesh.positions;
    return Array.from({ length: positions.length / 3 }, (_, v) => v).every((v) => Array.from({ length: points.length / 3 }, (_, u) => u).some((u) => [0, 1, 2].every((k) => nclose(positions[3 * v + k], points[3 * u + k], 1e-12))));
  }));
  const cone = humanBodyMushSurface(true);
  // The witness lies above, rather than at, the spine pivot, so the filter
  // has a nonzero displacement that could contaminate a gravity derivative.
  cone.positions[13] = 2;
  for (let v = 0; v < 4; v++) cone.skin.weights.splice(v * 4, 4, 1, 0, 0, 0);
  cone.mush = config;
  cone.sag = { lean: {}, gain: 0.2, sweeps: 0, softness: { base: 0.5, channels: { tall: 0.4, width: 0.4 }, range: [0.2, 0.8] } };
  type Input = Parameters<ReturnType<typeof createHumanBodyPosedSurface>>[0];
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const quarter = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const transforms: Input["transforms"] = new Map([
    ["hips", { rest: { position: { x: 0, y: 0, z: 0 }, rotation: identity }, posed: { position: { x: 0, y: 0, z: 0 }, rotation: identity } }],
    ["spine", { rest: { position: { x: 0, y: 1, z: 0 }, rotation: identity }, posed: { position: { x: 0, y: 1, z: 0 }, rotation: quarter } }],
  ]);
  const lean = cone.positions.slice(); lean[13] -= 0.02;
  const input: Input = { shaped: cone.positions, rest: cone.positions, transforms, lean: () => lean, document: fixture.document };
  const withoutSag = createHumanBodyPosedSurface({ ...cone, sag: undefined }, fixture.basis.joints)(input);
  const withSag = createHumanBodyPosedSurface(cone, fixture.basis.joints)(input);
  const gravity = [0, Math.SQRT1_2 - 1, Math.SQRT1_2];
  TestValidator.predicate("sag uses pure skinning gravity", gravity.every((value, k) => nclose(withSag[12 + k] - withoutSag[12 + k], 0.002 * value, 1e-9)));
  const clamp = createHumanBodyPosedSurface(cone, fixture.basis.joints)({ ...input, document: { ...fixture.document, shape: { tall: 1 } } });
  TestValidator.predicate("softness clamp keeps gravity", gravity.every((value, k) => nclose(clamp[12 + k] - withoutSag[12 + k], 0.0032 * value, 1e-9)));
  const lower = createHumanBodyPosedSurface(cone, fixture.basis.joints)({ ...input, document: { ...fixture.document, shape: { width: -1 } } });
  TestValidator.predicate("lower softness clamp", gravity.every((value, k) => nclose(lower[12 + k] - withoutSag[12 + k], 0.0008 * value, 1e-9)));
  const alone = createHumanBodyPosedSurface({ ...cone, mush: undefined }, fixture.basis.joints)(input);
  const pure = createHumanBodyPosedSurface({ ...cone, mush: undefined, sag: undefined }, fixture.basis.joints)(input);
  TestValidator.predicate("filter is active at gravity witness", !nclose(withoutSag[13], pure[13], 1e-6) || !nclose(withoutSag[14], pure[14], 1e-6));
  TestValidator.predicate("sag omission twin", gravity.every((value, k) => nclose(alone[12 + k] - pure[12 + k], 0.002 * value, 1e-9)));
  const restOnly = createHumanBodyPosedSurface(cone, fixture.basis.joints)({ ...input, rest: null });
  TestValidator.predicate("no rest bypasses both policies", restOnly.every((value, i) => nclose(value, pure[i], 1e-12)));
};
