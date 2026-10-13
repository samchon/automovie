import { measureAutoMovieRenderTextureTarget } from "@automovie/engine";
import { readAutoMovieShadowTextureTargets, type IAutoMovieShadowTextureHost } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as ThreeTypes from "three";

import { throwsError } from "../internal/predicates";

/**
 * Shadow storage describes actual native objects and required factory products,
 * with cube face population and retained-versus-planned phases kept distinct.
 * These are public renderer facts and native CPU target objects, without a GPU.
 *
 * Scenarios:
 * 1. Empty and ambient-only scopes have no punctual product; all three admitted
 *    PCF kinds require a map, and a point cube ignores its requested y-edge.
 * 2. Native atlas extents clamp each viewport to the hardware maximum, and VSM
 *    requires both RGHalf map/float-depth and blur/D24-renderbuffer products.
 * 3. A hidden noncasting point retains its actual cube; unsupported enabled
 *    casting point/VSM refuses beside supported PCF and disabled VSM inputs.
 * 4. Matching actual products are counted once. Changes to each independent
 *    allocation fact preserve the actual row and add a separate planned bound.
 * 5. Retiring actual slots leaves only active planned bounds; disabled release
 *    yields no storage rows. Observation never disposes caller-owned objects.
 */
export const test_viewer_shadow_texture_targets = async (): Promise<void> => {
  const THREE = await import("three");
  const host: IAutoMovieShadowTextureHost = {
    shadowMap: { enabled: true, type: THREE.PCFShadowMap },
    capabilities: { maxTextureSize: 512 },
  };
  TestValidator.equals("an empty scope has no product", readAutoMovieShadowTextureTargets("empty", host, new Map()), []);
  TestValidator.equals("ambient light invents no punctual target", readAutoMovieShadowTextureTargets("ambient", host, new Map([["ambient", new THREE.AmbientLight()]])), []);
  const directional = new THREE.DirectionalLight(); directional.castShadow = true;
  const spot = new THREE.SpotLight(); spot.castShadow = true;
  const point = new THREE.PointLight(); point.castShadow = true;
  point.shadow.mapSize.set(1024, 128);
  const lights = new Map<string, ThreeTypes.Light>([["dir", directional], ["spot", spot], ["point", point]]);
  const pcf = readAutoMovieShadowTextureTargets("pcf", host, lights);
  TestValidator.equals("all three PCF kinds require one map", pcf.map((row) => [row.shadow!.light, row.shadow!.role]), [["dir", "map"], ["spot", "map"], ["point", "map"]]);
  const cube = pcf.find((row) => row.shadow!.light === "point")!;
  TestValidator.equals("the cube uses its clamped x-edge for six square faces", [cube.width, cube.height, cube.faces], [512, 512, 6]);
  TestValidator.equals("cube bytes are independent face times color-plus-depth texels", measureAutoMovieRenderTextureTarget(cube), 512 * 512 * 6 * (4 + 4));
  directional.shadow.getFrameExtents().set(2, 3);
  directional.shadow.mapSize.set(4, 4);
  const smallHost: IAutoMovieShadowTextureHost = { shadowMap: host.shadowMap, capabilities: { maxTextureSize: 5 } };
  const atlas = readAutoMovieShadowTextureTargets("atlas", smallHost, new Map([["dir", directional]]), { enabled: true, type: "vsm" });
  TestValidator.equals("atlas extents clamp viewports before multiplying", atlas.map((row) => [row.width, row.height, row.formats, row.depthTexture]), [[4, 3, ["rg16f"], true], [4, 3, ["rg16f"], false]]);
  TestValidator.equals("both VSM products include their distinct four-byte depth companion", atlas.map(measureAutoMovieRenderTextureTarget), [4 * 3 * (4 + 4), 4 * 3 * (4 + 4)]);
  TestValidator.equals("factory observation leaves requested map size intact", [directional.shadow.mapSize.x, directional.shadow.mapSize.y], [4, 4]);
  const pointTarget = new THREE.WebGLCubeRenderTarget(512);
  const pointDepth = new THREE.CubeDepthTexture(512, THREE.UnsignedIntType);
  TestValidator.equals("native cube depth preserves its source's six face descriptors", pointDepth.images.map((face) => [face.width, face.height, face.depth]), Array.from({ length: 6 }, () => [512, 512, 1]));
  TestValidator.predicate("cube image descriptors remain the actual texture source", pointDepth.source.data === pointDepth.image);
  // Native r186 CubeDepthTexture extends DepthTexture and its shadow factory
  // assigns it here. The SDK slot incorrectly narrows the generic image to one
  // descriptor; this boundary cast preserves the native six-face object/source.
  pointTarget.depthTexture = pointDepth as unknown as ThreeTypes.DepthTexture;
  let pointDepthDisposals = 0;
  pointDepth.addEventListener("dispose", () => ++pointDepthDisposals);
  point.shadow.map = pointTarget;
  TestValidator.equals("a matching retained cube replaces its planned product", readAutoMovieShadowTextureTargets("cube-matching", host, lights).length, 3);
  point.visible = false; point.castShadow = false;
  const mixed = readAutoMovieShadowTextureTargets("mixed", host, lights, { enabled: true, type: "vsm" });
  TestValidator.equals("VSM active maps and blur plus the hidden retained cube coexist", mixed.length, 5);
  TestValidator.equals("hidden noncasting cube facts remain actual", mixed.find((row) => row.shadow!.light === "point")!.faces, 6);
  point.castShadow = true;
  TestValidator.predicate("enabled casting point VSM refuses before returning a success profile", throwsError(() => readAutoMovieShadowTextureTargets("invalid", host, lights, { enabled: true, type: "vsm" }), "cannot cast a VSM shadow"));
  const disabled = readAutoMovieShadowTextureTargets("disabled", host, lights, { enabled: false, type: "vsm" });
  TestValidator.equals("disabled shadows retain only the existing map", disabled.length, 1);
  point.shadow.map = null;
  TestValidator.equals("observing the retained cube preserves its depth owner", pointDepthDisposals, 0);
  pointDepth.dispose(); pointTarget.dispose();
  TestValidator.equals("the typed cube depth owner is explicitly disposed once", pointDepthDisposals, 1);
  TestValidator.equals("disabled release removes all native storage rows", readAutoMovieShadowTextureTargets("released", host, lights, { enabled: false, type: "vsm" }), []);
  host.shadowMap.type = THREE.VSMShadowMap;
  TestValidator.predicate("native VSM fallback shares point refusal", throwsError(() => readAutoMovieShadowTextureTargets("native-invalid", host, lights), "cannot cast a VSM shadow"));
  host.shadowMap.type = THREE.PCFShadowMap;
  const vsmMap = new THREE.WebGLRenderTarget(512, 512, { format: THREE.RGFormat, type: THREE.HalfFloatType });
  vsmMap.depthTexture = new THREE.DepthTexture(512, 512, THREE.FloatType);
  const vsmBlur = new THREE.WebGLRenderTarget(512, 512, { format: THREE.RGFormat, type: THREE.HalfFloatType });
  spot.shadow.map = vsmMap; spot.shadow.mapPass = vsmBlur;
  host.shadowMap.type = THREE.VSMShadowMap;
  TestValidator.equals("matching retained native VSM products need no duplicate phases", readAutoMovieShadowTextureTargets("vsm-matching", host, new Map([["spot", spot]])).length, 2);
  spot.castShadow = false;
  TestValidator.equals("a noncasting light preserves both retained VSM products", readAutoMovieShadowTextureTargets("vsm-retained", host, new Map([["spot", spot]])).length, 2);
  vsmMap.depthTexture.dispose(); vsmMap.dispose(); vsmBlur.dispose();
  spot.shadow.map = null; spot.shadow.mapPass = null;
  host.shadowMap.type = THREE.PCFShadowMap;
  const matchedLight = new THREE.DirectionalLight(); matchedLight.castShadow = true;
  const makeTarget = (): ThreeTypes.WebGLRenderTarget => {
    const target = new THREE.WebGLRenderTarget(512, 512);
    target.depthTexture = new THREE.DepthTexture(512, 512, THREE.UnsignedIntType);
    return target;
  };
  const matched = makeTarget(); matchedLight.shadow.map = matched;
  let disposals = 0; matched.addEventListener("dispose", () => ++disposals);
  const matching = readAutoMovieShadowTextureTargets("matching", host, new Map([["dir", matchedLight]]));
  TestValidator.equals("matching retained product does not add a duplicate plan", matching.length, 1);
  TestValidator.equals("observation disposes no caller product", disposals, 0);
  TestValidator.equals("active slot retirement preserves a planned first-allocation bound", (() => { matchedLight.shadow.map = null; return readAutoMovieShadowTextureTargets("retired", host, new Map([["dir", matchedLight]])).length; })(), 1);
  matched.depthTexture!.dispose(); matched.dispose();
  const changes: ((target: ThreeTypes.WebGLRenderTarget) => void)[] = [
    (target) => target.setSize(256, 512),
    (target) => target.setSize(512, 256),
    (target) => { target.samples = 4; },
    (target) => { target.texture.generateMipmaps = true; },
    (target) => { target.depthTexture!.type = THREE.UnsignedShortType; },
    (target) => { target.depthTexture!.dispose(); target.depthTexture = null; },
    (target) => { target.textures.push(new THREE.Texture()); },
    (target) => { target.texture.type = THREE.HalfFloatType; },
  ];
  for (const change of changes) {
    const target = makeTarget(); change(target); matchedLight.shadow.map = target;
    TestValidator.equals("a changed allocation fact retains actual and planned phases", readAutoMovieShadowTextureTargets("changed", host, new Map([["dir", matchedLight]])).length, 2);
    target.depthTexture?.dispose(); target.dispose();
  }
  const differentFaces = new THREE.WebGLCubeRenderTarget(512);
  const differentDepth = new THREE.CubeDepthTexture(512, THREE.UnsignedIntType);
  // The same native cube/declaration mismatch is confined to the SDK slot.
  differentFaces.depthTexture = differentDepth as unknown as ThreeTypes.DepthTexture;
  let differentDepthDisposals = 0;
  differentDepth.addEventListener("dispose", () => ++differentDepthDisposals);
  matchedLight.shadow.map = differentFaces;
  TestValidator.equals("a different face population remains separate from the 2D plan", readAutoMovieShadowTextureTargets("faces", host, new Map([["dir", matchedLight]])).length, 2);
  TestValidator.equals("a mismatched factory profile still preserves caller depth", differentDepthDisposals, 0);
  differentDepth.dispose(); differentFaces.dispose(); matchedLight.shadow.map = null;
  TestValidator.equals("the mismatched cube's typed depth owner retires once", differentDepthDisposals, 1);
  matchedLight.castShadow = false;
  TestValidator.equals("a noncasting absent slot has no planned factory", readAutoMovieShadowTextureTargets("noncasting", host, new Map([["dir", matchedLight]])), []);
};
