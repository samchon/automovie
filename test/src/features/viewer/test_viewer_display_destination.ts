import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { disposeCrossDissolve } from "../../../../packages/viewer/src/disposeCrossDissolve";
import { disposeFadeToBlack } from "../../../../packages/viewer/src/disposeFadeToBlack";
import { readAutoMovieDisplayDestinationEncoding } from "../../../../packages/viewer/src/readAutoMovieDisplayDestinationEncoding";
import { renderCrossDissolveFrames } from "../../../../packages/viewer/src/renderCrossDissolveFrames";
import { renderFadeToBlackFrame } from "../../../../packages/viewer/src/renderFadeToBlackFrame";
import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { nclose } from "../internal/predicates";

/**
 * Display emission follows supplied attachment encoding and preserves caller cube selection plus configured and effective raster state. These renderer controls observe uniforms, native target identity and operation order; they do not measure GPU storage or transfer parity.
 *
 * Scenarios:
 * 1. Native linear/sRGB responses select the inverse storage transfer even when
 *    the texture label disagrees; incomplete/unknown attachments refuse before
 *    source draws or encoding queries that require a complete destination.
 *    Integer, signed, missing-channel and low-precision attachments refuse;
 *    unsigned-normalized RGBA8+ and homogeneous RGBA16F/32F remain adjacent.
 * 2. Cube face/mip and clipped viewport/scissor survive source mutation, source
 *    refusal and complete-canvas backing restoration at pixel ratio two.
 * 3. Independent raster restoration failures preserve every error and still
 *    attempt later clear/tone/selection owners. Cyclic native target graphs
 *    remain strict object identities rather than recursive comparison inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification Fade and dissolve exercise attachment admission, source callbacks, raster restoration and error aggregation. Wrong encoding, early drawing on refused storage, lost cube selection or incomplete restoration fails their uniform, call-count and state assertions.
 *
 * @evidence contracts/testing.md#independent-expectations WebGL encoding/component/precision constants and authored RGBA profiles determine accepted storage; cube face 3, mip 1 and explicit rectangles determine restoration expectations. Initial state is a before/after preservation oracle, supplemented by independent target identity and authored raster assertions. Supplied context responses and shader uniforms do not prove actual GPU pixels.
 *
 * @evidence contracts/testing.md#distinguishing-cases Linear and sRGB labels disagree deliberately, distinct targets share a UUID, and pixel ratio two separates logical from effective rectangles. Complete and incomplete attachments, missing capabilities, malformed precision, integer/float/normalized profiles, query/source failures and paired restoration errors preserve the existing adjacent and refusal cases. Other tests own dissolve weights, fade timing and actual hardware rendering.
 *
 * @evidence contracts/testing.md#execution-ownership The discoverable named unit entry uses existing in-memory renderer controls and Three.js objects without a browser or GPU. All cases execute directly inside this entry; no dynamic registration or native host is installed.
 */
export function test_viewer_display_destination(): void {
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
      createDisplayCompositionRenderer(64, 32),
    cube: THREE.WebGLCubeRenderTarget = new THREE.WebGLCubeRenderTarget(16);
  const sameNumbers: (
    actual: readonly number[],
    expected: readonly number[],
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 0),
    );
  const sameState: (
    actual: ReturnType<typeof host.state>,
    expected: ReturnType<typeof host.state>,
  ) => boolean = (
    actual: ReturnType<typeof host.state>,
    expected: ReturnType<typeof host.state>,
  ): boolean =>
    actual.target === expected.target &&
    actual.face === expected.face &&
    actual.mip === expected.mip &&
    actual.autoClear === expected.autoClear &&
    actual.color === expected.color &&
    nclose(actual.alpha, expected.alpha, 0) &&
    actual.scissorTest === expected.scissorTest &&
    actual.currentScissorTest === expected.currentScissorTest &&
    sameNumbers(actual.viewport, expected.viewport) &&
    sameNumbers(actual.scissor, expected.scissor) &&
    sameNumbers(actual.currentViewport, expected.currentViewport) &&
    sameNumbers(actual.currentScissor, expected.currentScissor);
  TestValidator.equals(
    "default destination has no target identity",
    host.state().target,
    null,
  );
  const depth: THREE.DepthTexture = new THREE.DepthTexture(16, 16);
  cube.depthTexture = depth;
  TestValidator.predicate(
    "depth attachment creates the native ownership cycle under observation",
    depth.renderTarget === cube,
  );
  host.renderer.setPixelRatio(2);
  host.renderer.setViewport(new THREE.Vector4(1, 2, 3, 4));
  host.renderer.setScissor(new THREE.Vector4(5, 6, 7, 8));
  host.renderer.setScissorTest(true);
  cube.viewport.set(2, 3, 8, 9);
  cube.scissor.set(4, 5, 6, 7);
  cube.scissorTest = true;
  host.renderer.setRenderTarget(cube, 3, 1);
  const before: ReturnType<typeof host.state> = host.state(),
    authored: { viewport: number[]; scissor: number[]; test: boolean } = {
      viewport: cube.viewport.toArray(),
      scissor: cube.scissor.toArray(),
      test: cube.scissorTest,
    };
  const otherTarget: THREE.WebGLCubeRenderTarget =
    new THREE.WebGLCubeRenderTarget(16);
  otherTarget.texture.uuid = cube.texture.uuid;
  host.renderer.setRenderTarget(otherTarget);
  TestValidator.predicate(
    "equal texture UUIDs do not equate distinct native targets",
    host.state().target !== before.target,
  );
  host.renderer.setRenderTarget(cube, 3, 1);
  host.nativeEncoding.value = 0x8c40;
  let callbacks: number = 0;
  renderFadeToBlackFrame(
    host.renderer,
    (): void => {
      callbacks++;
      host.renderer.setViewport(new THREE.Vector4(9, 9, 9, 9));
      host.renderer.setScissorTest(false);
    },
    1,
  );
  TestValidator.equals(
    "native sRGB attachment selects inverse transfer",
    host.rendered[0]!.srgb,
    true,
  );
  TestValidator.equals(
    "composite targets actual caller face and mip",
    [
      host.rendered[0]!.target === cube,
      host.rendered[0]!.face,
      host.rendered[0]!.mip,
    ],
    [true, 3, 1],
  );
  TestValidator.predicate(
    "clipped native destination raster is restored before emission",
    sameNumbers(host.rendered[0]!.viewport, authored.viewport) &&
      sameNumbers(host.rendered[0]!.scissor, authored.scissor) &&
      host.rendered[0]!.scissorTest,
  );
  TestValidator.predicate(
    "full saved canvas restores beyond caller crop",
    sameNumbers(host.rendered[1]!.viewport, [0, 0, 64, 32]) &&
      !host.rendered[1]!.scissorTest,
  );
  TestValidator.predicate(
    "all configured and effective caller state survives",
    sameState(host.state(), before),
  );
  TestValidator.predicate(
    "target authored rectangles are retained",
    sameNumbers(cube.viewport.toArray(), authored.viewport) &&
      sameNumbers(cube.scissor.toArray(), authored.scissor) &&
      cube.scissorTest === authored.test,
  );
  host.nativeEncoding.value = 0x2601;
  cube.texture.colorSpace = THREE.SRGBColorSpace;
  renderCrossDissolveFrames(
    host.renderer,
    (): void => {
      callbacks++;
      host.renderer.setViewport(new THREE.Vector4(7, 7, 7, 7));
    },
    (): void => {
      callbacks++;
      TestValidator.predicate(
        "incoming source reuses original logical viewport",
        sameNumbers(
          host.renderer.getViewport(new THREE.Vector4()).toArray(),
          before.viewport,
        ),
      );
    },
    0.5,
  );
  TestValidator.equals(
    "actual linear storage wins over sRGB texture label",
    host.rendered.at(-2)!.srgb,
    false,
  );
  TestValidator.predicate(
    "dissolve restores selected state",
    sameState(host.state(), before),
  );
  const encodingQueries: number = host.calls.filter(
    (call: string): boolean => call === "encoding",
  ).length;
  host.nativeFramebufferStatus.value = 0x8cd6;
  let incomplete: boolean = false;
  try {
    renderFadeToBlackFrame(
      host.renderer,
      (): void => {
        callbacks++;
      },
      0.5,
    );
  } catch {
    incomplete = true;
  }
  TestValidator.predicate(
    "incomplete selected storage refuses before source or encoding",
    incomplete &&
      callbacks === 3 &&
      host.calls.filter((call: string): boolean => call === "encoding")
        .length === encodingQueries,
  );
  TestValidator.predicate(
    "incomplete destination keeps target and raster state",
    sameState(host.state(), before),
  );
  incomplete = false;
  try {
    renderCrossDissolveFrames(
      host.renderer,
      (): void => {
        callbacks++;
      },
      (): void => {
        callbacks++;
      },
      0.5,
    );
  } catch {
    incomplete = true;
  }
  TestValidator.predicate(
    "dissolve also refuses incomplete destination before both sources",
    incomplete && callbacks === 3,
  );
  host.nativeFramebufferStatus.value = 0x8cd5;
  TestValidator.equals(
    "adjacent complete native destination remains readable",
    readAutoMovieDisplayDestinationEncoding(host.renderer),
    "linear",
  );
  const statusFailure: Error = new Error("native framebuffer status");
  host.errors.set("framebufferStatus", statusFailure);
  let statusObserved: unknown;
  try {
    renderFadeToBlackFrame(
      host.renderer,
      (): void => {
        callbacks++;
      },
      0.5,
    );
  } catch (error) {
    statusObserved = error;
  }
  TestValidator.predicate(
    "native status failure preserves identity before source mutation",
    statusObserved === statusFailure && callbacks === 3,
  );
  TestValidator.equals(
    "status failure retains exact caller target",
    host.renderer.getRenderTarget() === cube,
    true,
  );
  host.errors.clear();
  const refusesProfile: (title: string) => void = (title: string): void => {
    let refusal: unknown;
    try {
      renderCrossDissolveFrames(
        host.renderer,
        (): void => {
          callbacks++;
        },
        (): void => {
          callbacks++;
        },
        0.5,
      );
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(title, refusal instanceof Error && callbacks === 3);
    TestValidator.predicate(
      "profile refusal preserves selected target and every raster field",
      sameState(host.state(), before),
    );
  };
  for (const key of [
    "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE",
    "UNSIGNED_NORMALIZED",
    "FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE",
  ]) {
    const original: unknown = host.nativeColourConstants.get(key);
    host.nativeColourConstants.delete(key);
    const queriesBefore: number = host.calls.filter(
      (call: string): boolean => call === "component" || call === "precision",
    ).length;
    refusesProfile(
      "missing public native capability refuses before attachment queries",
    );
    TestValidator.equals(
      "unavailable capability performs no component or precision query",
      host.calls.filter(
        (call: string): boolean => call === "component" || call === "precision",
      ).length,
      queriesBefore,
    );
    host.nativeColourConstants.set(key, original);
  }
  for (const value of [undefined, "8", 8.5, NaN, Infinity]) {
    host.nativeChannelBits.value = [8, 8, 8, value];
    refusesProfile("unknown or nonintegral native channel precision refuses");
  }
  for (const bits of [
    [4, 4, 4, 4],
    [8, 8, 0, 0],
    [8, 8, 8, 7],
  ]) {
    host.nativeChannelBits.value = bits;
    refusesProfile("missing or sub-byte unsigned-normalized channels refuse");
  }
  host.nativeChannelBits.value = [8, 8, 8, 8];
  for (const component of [0x1404, 0x1405, 0x8f9c, 0]) {
    host.nativeComponent.value = component;
    refusesProfile(
      "integer signed and unknown components refuse the float byte writer",
    );
  }
  host.nativeComponent.value = 0x1406;
  for (const bits of [
    [8, 8, 8, 8],
    [16, 16, 16, 0],
    [16, 16, 32, 32],
    [24, 24, 24, 24],
  ]) {
    host.nativeChannelBits.value = bits;
    refusesProfile("unproven or missing floating RGBA precision refuses");
  }
  for (const bits of [
    [16, 16, 16, 16],
    [32, 32, 32, 32],
  ]) {
    host.nativeChannelBits.value = bits;
    TestValidator.equals(
      "adjacent homogeneous floating RGBA storage remains readable",
      readAutoMovieDisplayDestinationEncoding(host.renderer),
      "linear",
    );
  }
  host.nativeComponent.value = 0x8c17;
  for (const bits of [
    [8, 8, 8, 8],
    [16, 16, 16, 16],
  ]) {
    host.nativeChannelBits.value = bits;
    TestValidator.equals(
      "adjacent complete unsigned-normalized RGBA storage remains readable",
      readAutoMovieDisplayDestinationEncoding(host.renderer),
      "linear",
    );
  }
  host.nativeChannelBits.value = [8, 8, 8, 8];
  for (const operation of ["component", "precision"]) {
    const failure: Error = new Error(operation);
    host.errors.set(operation, failure);
    let observed: unknown;
    try {
      renderFadeToBlackFrame(
        host.renderer,
        (): void => {
          callbacks++;
        },
        0.5,
      );
    } catch (error) {
      observed = error;
    }
    TestValidator.predicate(
      "native storage query failure retains identity and untouched source",
      observed === failure && callbacks === 3,
    );
    host.errors.clear();
  }
  host.nativeEncoding.value = 0;
  let refused: boolean = false;
  try {
    renderFadeToBlackFrame(
      host.renderer,
      (): void => {
        callbacks++;
      },
      0.5,
    );
  } catch {
    refused = true;
  }
  TestValidator.predicate(
    "unknown attachment refuses before source callbacks",
    refused && callbacks === 3,
  );
  TestValidator.predicate(
    "unknown encoding leaves caller state intact",
    sameState(host.state(), before),
  );
  const queryFailure: Error = new Error("native encoding query");
  host.errors.set("encoding", queryFailure);
  let queryObserved: unknown;
  try {
    renderFadeToBlackFrame(
      host.renderer,
      (): void => {
        callbacks++;
      },
      0.5,
    );
  } catch (error) {
    queryObserved = error;
  }
  TestValidator.predicate(
    "native query failure precedes source mutation",
    queryObserved === queryFailure && callbacks === 3,
  );
  host.errors.clear();
  host.nativeEncoding.value = 0x2601;
  const source: Error = new Error("source refusal");
  let caught: unknown;
  try {
    renderFadeToBlackFrame(
      host.renderer,
      (): void => {
        host.renderer.setScissorTest(false);
        throw source;
      },
      0.5,
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate("source failure keeps identity", caught === source);
  TestValidator.predicate(
    "failed source restores complete caller state",
    sameState(host.state(), before),
  );
  const viewportFailure: Error = new Error("viewport restore"),
    scissorFailure: Error = new Error("scissor restore");
  host.errors.set("viewport", viewportFailure);
  host.errors.set("scissor", scissorFailure);
  caught = undefined;
  const restorationStart: number = host.calls.length;
  try {
    renderFadeToBlackFrame(host.renderer, (): undefined => undefined, 0.5);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "independent raster errors remain visible",
    caught instanceof AggregateError &&
      caught.errors.includes(viewportFailure) &&
      caught.errors.includes(scissorFailure),
  );
  TestValidator.predicate(
    "late field restorations still run in the failing call",
    host.calls.slice(restorationStart).includes("restoreTone") &&
      host.calls.slice(restorationStart).includes("restoreExposure"),
  );
  host.errors.clear();
  TestValidator.equals(
    "pure native linear encoding observation",
    readAutoMovieDisplayDestinationEncoding(host.renderer),
    "linear",
  );
  host.nativeWebGL2.value = false;
  const queries: number = host.calls.filter(
    (call: string): boolean => call === "encoding",
  ).length;
  let unsupported: boolean = false;
  try {
    readAutoMovieDisplayDestinationEncoding(host.renderer);
  } catch {
    unsupported = true;
  }
  TestValidator.predicate(
    "unsupported WebGL1 profile refuses before native query",
    unsupported &&
      host.calls.filter((call: string): boolean => call === "encoding")
        .length === queries,
  );
  host.nativeWebGL2.value = true;
  TestValidator.equals(
    "adjacent supported native profile remains readable",
    readAutoMovieDisplayDestinationEncoding(host.renderer),
    "linear",
  );
  cube.dispose();
  otherTarget.dispose();
  depth.dispose();
  disposeFadeToBlack(host.renderer);
  disposeCrossDissolve(host.renderer);
}
