import {
  createHairCardShadowMaterial,
  hairFibreShadowOpacity,
} from "@automovie/playground/src/human/hairCardShadow";
import {
  disposeHumanPreview,
  prepareHumanPreview,
} from "@automovie/playground/src/human/previewScene";
import { buildMaterial } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Fibre cards shadow what their fibres stop, not everything behind them.
 *
 * Scenarios:
 * 1. A white fibre stops only what its two keratin surfaces reflect,
 *    `1 - (1 - f)^2` with `f = ((1.55 - 1) / (1.55 + 1))^2`; a darker one stops
 *    more, monotonically, and a black one nearly all. Out-of-range colours
 *    clamp and a negative or non-finite one is refused.
 * 2. The shadow material thresholds the texel's fibre coverage (its alpha)
 *    times the fibre opacity of its colour times the finish colour, after
 *    the card's own alpha test.
 * 3. The preview gives a single `:hair-cards` finish, and a single blended
 *    finish with a texture (the lash and brow cards), that material, leaves
 *    other meshes (a blended finish without a texture among them) to the
 *    renderer's own, and releases it with the preview.
 * 4. The viewer names a built material by its name or, unnamed, its id.
 */
export const test_subject_human_preview_hair_shadow = (): void => {
  const reflected = ((1.55 - 1) / (1.55 + 1)) ** 2;
  const grey = (value: number) => hairFibreShadowOpacity([value, value, value]);
  TestValidator.predicate(
    "white fibre stops its surface reflections",
    nclose(grey(1), 1 - (1 - reflected) ** 2, 1e-12),
  );
  const ladder = [1, 0.5, 0.1, 0.03, 0.01, 0.001].map(grey);
  TestValidator.predicate(
    "darker fibres stop more",
    ladder.every((value, k) => k === 0 || value > ladder[k - 1]!) &&
      ladder.at(-1)! > 0.85 &&
      ladder.at(-1)! < 1,
  );
  TestValidator.predicate(
    "colours clamp",
    grey(2) === grey(1) && grey(0) === grey(1e-4),
  );
  TestValidator.predicate(
    "invalid colours refused",
    throwsError(() => hairFibreShadowOpacity([-0.1, 0, 0])) &&
      throwsError(() => hairFibreShadowOpacity([Number.NaN, 0, 0])),
  );
  TestValidator.predicate(
    "channels weigh by luminance",
    hairFibreShadowOpacity([1, 0.01, 1]) >
      hairFibreShadowOpacity([0.01, 1, 0.01]) &&
      hairFibreShadowOpacity([0.01, 1, 1]) <
        hairFibreShadowOpacity([1, 0.01, 1]),
  );

  const colour = new THREE.Color(0.2, 0.1, 0.05);
  const shadow = createHairCardShadowMaterial(colour);
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    fragmentShader: THREE.ShaderLib.depth.fragmentShader,
    vertexShader: THREE.ShaderLib.depth.vertexShader,
  };
  shadow.onBeforeCompile(
    shader as unknown as THREE.WebGLProgramParametersWithUniforms,
    undefined as unknown as THREE.WebGLRenderer,
  );
  const test = shader.fragmentShader.indexOf("#include <alphatest_fragment>");
  const threshold = shader.fragmentShader.indexOf(
    "diffuseColor.a * hairFibreShadowOpacity( diffuseColor.rgb * hairPigment ) <= hairThreshold",
  );
  TestValidator.predicate(
    "shadow thresholds the fibre opacity after the alpha test",
    test >= 0 &&
      threshold > test &&
      shader.fragmentShader.includes("float hairFibreShadowOpacity(") &&
      shader.fragmentShader.indexOf("uniform vec3 hairPigment;") <
        shader.fragmentShader.indexOf("void main() {") &&
      (shader.uniforms.hairPigment!.value as THREE.Color).equals(colour) &&
      shadow.customProgramCacheKey() === "hair-card-shadow",
  );

  const named = (name: string) => {
    const material = new THREE.MeshPhysicalMaterial({ color: colour });
    material.name = name;
    return material;
  };
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(),
    named("numerical-hair:scalp:hair-cards"),
  );
  const skin = new THREE.Mesh(new THREE.BoxGeometry(), named("skin"));
  const mixed = new THREE.Mesh(new THREE.BoxGeometry(), [
    named("a:hair-cards"),
    named("skin"),
  ]);
  const blended = (map: THREE.Texture | null) => {
    const material = named("Human.eyelashes01");
    material.transparent = true;
    material.map = map;
    return new THREE.Mesh(new THREE.BoxGeometry(), material);
  };
  const lash = blended(new THREE.Texture());
  const film = blended(null);
  const group = new THREE.Group();
  group.add(hair, skin, mixed, lash, film);
  prepareHumanPreview(group);
  TestValidator.predicate(
    "only a single fibre-card finish casts through its fibres",
    hair.customDepthMaterial instanceof THREE.MeshDepthMaterial &&
      lash.customDepthMaterial instanceof THREE.MeshDepthMaterial &&
      skin.customDepthMaterial === undefined &&
      mixed.customDepthMaterial === undefined &&
      film.customDepthMaterial === undefined &&
      hair.castShadow,
  );
  const kept = hair.customDepthMaterial;
  prepareHumanPreview(group);
  TestValidator.predicate(
    "preparing again keeps the shadow material",
    hair.customDepthMaterial === kept,
  );
  let released = false;
  kept!.addEventListener("dispose", () => {
    released = true;
  });
  disposeHumanPreview(group);
  TestValidator.predicate("the shadow material is released", released);

  const base = {
    id: "fibre:hair-cards",
    name: null,
    baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
    roughness: 0.5,
    metallic: 0,
    opacity: 1,
    emissive: null,
    baseColorTexture: null,
  };
  TestValidator.equals(
    "an unnamed material carries its id",
    buildMaterial(base).name,
    "fibre:hair-cards",
  );
  TestValidator.equals(
    "a named material carries its name",
    buildMaterial({ ...base, name: "strands" }).name,
    "strands",
  );
};
