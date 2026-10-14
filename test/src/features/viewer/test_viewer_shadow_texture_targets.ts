import { measureAutoMovieRenderTextureTarget } from "@automovie/engine";
import { readAutoMovieShadowTextureTargets, type IAutoMovieShadowTextureHost } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Exercises retained CPU shadow target profiles and distinct prospective factory bounds.
 *
 * Scenarios:
 * 1. Empty and ambient scopes contrast directional/spot plans and the point plan's six square faces with a clamped X edge.
 * 2. Atlas viewport clamping and VSM map/blur color-plus-depth arithmetic preserve their independent products.
 * 3. Hidden noncasting point storage stays reported while enabled casting point VSM refuses beside supported PCF and disabled policy.
 * 4. Matching retained products replace plans; changed extent, sample, mip, depth, color or face facts separate retained and prospective phases.
 * 5. Clearing active slots retains planned bounds; disabled policy with cleared slots reports no rows, and observation never disposes caller depth.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual shadow profile observation and Engine target accounting, comparing supported light roles, cube faces, atlas extents, color/depth representation and phase populations.
 * @evidence contracts/testing.md#independent-expectations Authored extents, six cube faces and color-plus-depth texel arithmetic independently judge reported profiles. Retained/planned rows are bounds, not observed simultaneous driver allocations.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts absent/ambient/casting/hidden/noncasting lights, PCF/VSM refusal, matching retained products and changed independent attachment facts; observation must not request disposal.
 * @evidence contracts/testing.md#execution-ownership The named entry supplies existing typed capabilities and real CPU Three target/depth objects, explicitly disposes owned wrappers and observes public events without a GPU/context or new driver.
 */
export async function test_viewer_shadow_texture_targets(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const host: IAutoMovieShadowTextureHost = {
    shadowMap: { enabled: true, type: THREE.PCFShadowMap },
    capabilities: { maxTextureSize: 512 },
  };
  TestValidator.equals("an empty scope has no product", readAutoMovieShadowTextureTargets("empty", host, new Map()), []);
  TestValidator.equals("ambient light invents no punctual target", readAutoMovieShadowTextureTargets("ambient", host, new Map([["ambient", new THREE.AmbientLight()]])), []);
  const directional: ThreeTypes.DirectionalLight = new THREE.DirectionalLight(); directional.castShadow = true;
  const spot: ThreeTypes.SpotLight = new THREE.SpotLight(); spot.castShadow = true;
  const point: ThreeTypes.PointLight = new THREE.PointLight(); point.castShadow = true;
  point.shadow.mapSize.set(1024, 128);
  const lights: Map<string, ThreeTypes.Light> = new Map<string, ThreeTypes.Light>([["dir", directional], ["spot", spot], ["point", point]]);
  const pcf: import("@automovie/engine").IAutoMovieRenderTextureTarget[] = readAutoMovieShadowTextureTargets("pcf", host, lights);
  TestValidator.equals("all three PCF kinds require one map", pcf.map((row: import("@automovie/engine").IAutoMovieRenderTextureTarget): string[] => [row.shadow!.light, row.shadow!.role]), [["dir", "map"], ["spot", "map"], ["point", "map"]]);
  const cube: import("@automovie/engine").IAutoMovieRenderTextureTarget = pcf.find((row: import("@automovie/engine").IAutoMovieRenderTextureTarget): boolean => row.shadow!.light === "point")!;
  TestValidator.equals("the cube uses its clamped x-edge for six square faces", [cube.width, cube.height, cube.faces], [512, 512, 6]);
  TestValidator.equals("cube bytes are independent face times color-plus-depth texels", measureAutoMovieRenderTextureTarget(cube), 512 * 512 * 6 * (4 + 4));
  directional.shadow.getFrameExtents().set(2, 3);
  directional.shadow.mapSize.set(4, 4);
  const smallHost: IAutoMovieShadowTextureHost = { shadowMap: host.shadowMap, capabilities: { maxTextureSize: 5 } };
  const atlas: import("@automovie/engine").IAutoMovieRenderTextureTarget[] = readAutoMovieShadowTextureTargets("atlas", smallHost, new Map([["dir", directional]]), { enabled: true, type: "vsm" });
  TestValidator.equals("atlas extents clamp viewports before multiplying", atlas.map((row: import("@automovie/engine").IAutoMovieRenderTextureTarget): (number | boolean | readonly ("r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | undefined)[] | undefined)[] => [row.width, row.height, row.formats, row.depthTexture]), [[4, 3, ["rg16f"], true], [4, 3, ["rg16f"], false]]);
  TestValidator.equals("both VSM products include their distinct four-byte depth companion", atlas.map(measureAutoMovieRenderTextureTarget), [4 * 3 * (4 + 4), 4 * 3 * (4 + 4)]);
  TestValidator.predicate("factory observation leaves requested map size intact", nclose(directional.shadow.mapSize.x, 4, 0) && nclose(directional.shadow.mapSize.y, 4, 0));
  const pointTarget: ThreeTypes.WebGLCubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
  const pointDepth: ThreeTypes.CubeDepthTexture = new THREE.CubeDepthTexture(512, THREE.UnsignedIntType);
  TestValidator.equals("native cube depth preserves its source's six face descriptors", pointDepth.images.map((face: ThreeTypes.DepthTextureImageData): (number | undefined)[] => [face.width, face.height, face.depth]), Array.from({ length: 6 }, (): number[] => [512, 512, 1]));
  TestValidator.predicate("cube image descriptors remain the actual texture source", pointDepth.source.data === pointDepth.image);
  // Native r186 CubeDepthTexture extends DepthTexture and its shadow factory assigns it here. The SDK slot incorrectly narrows the generic image to one descriptor; this boundary cast preserves the native six-face object/source.
  pointTarget.depthTexture = pointDepth as unknown as ThreeTypes.DepthTexture;
  let pointDepthDisposals: number = 0;
  pointDepth.addEventListener("dispose", (): number => ++pointDepthDisposals);
  point.shadow.map = pointTarget;
  TestValidator.equals("a matching retained cube replaces its planned product", readAutoMovieShadowTextureTargets("cube-matching", host, lights).length, 3);
  point.visible = false; point.castShadow = false;
  const mixed: import("@automovie/engine").IAutoMovieRenderTextureTarget[] = readAutoMovieShadowTextureTargets("mixed", host, lights, { enabled: true, type: "vsm" });
  TestValidator.equals("VSM active maps and blur plus the hidden retained cube coexist", mixed.length, 5);
  TestValidator.equals("hidden noncasting cube facts remain actual", mixed.find((row: import("@automovie/engine").IAutoMovieRenderTextureTarget): boolean => row.shadow!.light === "point")!.faces, 6);
  point.castShadow = true;
  TestValidator.predicate("enabled casting point VSM refuses before returning a success profile", throwsError((): import("@automovie/engine").IAutoMovieRenderTextureTarget[] => readAutoMovieShadowTextureTargets("invalid", host, lights, { enabled: true, type: "vsm" }), "cannot cast a VSM shadow"));
  const disabled: import("@automovie/engine").IAutoMovieRenderTextureTarget[] = readAutoMovieShadowTextureTargets("disabled", host, lights, { enabled: false, type: "vsm" });
  TestValidator.equals("disabled shadows retain only the existing map", disabled.length, 1);
  point.shadow.map = null;
  TestValidator.equals("observing the retained cube preserves its depth owner", pointDepthDisposals, 0);
  pointDepth.dispose(); pointTarget.dispose();
  TestValidator.equals("the typed cube depth owner is explicitly disposed once", pointDepthDisposals, 1);
  TestValidator.equals("disabled policy with cleared slots reports no retained or planned rows", readAutoMovieShadowTextureTargets("released", host, lights, { enabled: false, type: "vsm" }), []);
  host.shadowMap.type = THREE.VSMShadowMap;
  TestValidator.predicate("native VSM fallback shares point refusal", throwsError((): import("@automovie/engine").IAutoMovieRenderTextureTarget[] => readAutoMovieShadowTextureTargets("native-invalid", host, lights), "cannot cast a VSM shadow"));
  host.shadowMap.type = THREE.PCFShadowMap;
  const vsmMap: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>> = new THREE.WebGLRenderTarget(512, 512, { format: THREE.RGFormat, type: THREE.HalfFloatType });
  vsmMap.depthTexture = new THREE.DepthTexture(512, 512, THREE.FloatType);
  const vsmBlur: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>> = new THREE.WebGLRenderTarget(512, 512, { format: THREE.RGFormat, type: THREE.HalfFloatType });
  spot.shadow.map = vsmMap; spot.shadow.mapPass = vsmBlur;
  host.shadowMap.type = THREE.VSMShadowMap;
  TestValidator.equals("matching retained native VSM products need no duplicate phases", readAutoMovieShadowTextureTargets("vsm-matching", host, new Map([["spot", spot]])).length, 2);
  spot.castShadow = false;
  TestValidator.equals("a noncasting light preserves both retained VSM products", readAutoMovieShadowTextureTargets("vsm-retained", host, new Map([["spot", spot]])).length, 2);
  vsmMap.depthTexture.dispose(); vsmMap.dispose(); vsmBlur.dispose();
  spot.shadow.map = null; spot.shadow.mapPass = null;
  host.shadowMap.type = THREE.PCFShadowMap;
  const matchedLight: ThreeTypes.DirectionalLight = new THREE.DirectionalLight(); matchedLight.castShadow = true;
  const makeTarget: () => ThreeTypes.WebGLRenderTarget = (): ThreeTypes.WebGLRenderTarget => {
    const target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>> = new THREE.WebGLRenderTarget(512, 512);
    target.depthTexture = new THREE.DepthTexture(512, 512, THREE.UnsignedIntType);
    return target;
  };
  const matched: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>> = makeTarget(); matchedLight.shadow.map = matched;
  let disposals: number = 0; matched.addEventListener("dispose", (): number => ++disposals);
  const matching: import("@automovie/engine").IAutoMovieRenderTextureTarget[] = readAutoMovieShadowTextureTargets("matching", host, new Map([["dir", matchedLight]]));
  TestValidator.equals("matching retained product does not add a duplicate plan", matching.length, 1);
  TestValidator.equals("observation disposes no caller product", disposals, 0);
  TestValidator.equals("active slot retirement preserves a planned first-allocation bound", ((): number => { matchedLight.shadow.map = null; return readAutoMovieShadowTextureTargets("retired", host, new Map([["dir", matchedLight]])).length; })(), 1);
  matched.depthTexture!.dispose(); matched.dispose();
  const changes: ((target: ThreeTypes.WebGLRenderTarget) => void)[] = [
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => target.setSize(256, 512),
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => target.setSize(512, 256),
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.samples = 4; },
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.texture.generateMipmaps = true; },
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.depthTexture!.type = THREE.UnsignedShortType; },
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.depthTexture!.dispose(); target.depthTexture = null; },
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.textures.push(new THREE.Texture()); },
    (target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>>): void => { target.texture.type = THREE.HalfFloatType; },
  ];
  for (const change of changes) {
    const target: ThreeTypes.WebGLRenderTarget<ThreeTypes.Texture<unknown, ThreeTypes.TextureEventMap>> = makeTarget(); change(target); matchedLight.shadow.map = target;
    TestValidator.equals("a changed allocation fact retains actual and planned phases", readAutoMovieShadowTextureTargets("changed", host, new Map([["dir", matchedLight]])).length, 2);
    target.depthTexture?.dispose(); target.dispose();
  }
  const differentFaces: ThreeTypes.WebGLCubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
  const differentDepth: ThreeTypes.CubeDepthTexture = new THREE.CubeDepthTexture(512, THREE.UnsignedIntType);
  // The same native cube/declaration mismatch is confined to the SDK slot.
  differentFaces.depthTexture = differentDepth as unknown as ThreeTypes.DepthTexture;
  let differentDepthDisposals: number = 0;
  differentDepth.addEventListener("dispose", (): number => ++differentDepthDisposals);
  matchedLight.shadow.map = differentFaces;
  TestValidator.equals("a different face population remains separate from the 2D plan", readAutoMovieShadowTextureTargets("faces", host, new Map([["dir", matchedLight]])).length, 2);
  TestValidator.equals("a mismatched factory profile still preserves caller depth", differentDepthDisposals, 0);
  differentDepth.dispose(); differentFaces.dispose(); matchedLight.shadow.map = null;
  TestValidator.equals("the mismatched cube's typed depth owner retires once", differentDepthDisposals, 1);
  matchedLight.castShadow = false;
  TestValidator.equals("a noncasting absent slot has no planned factory", readAutoMovieShadowTextureTargets("noncasting", host, new Map([["dir", matchedLight]])), []);
}
