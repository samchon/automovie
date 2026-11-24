import {
  AUTOMOVIE_DISPLAY_COMPOSITE_SHADERS,
  AUTOMOVIE_FILM_RESPONSE_SHADERS,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { planAutoMovieChromiumLaunch } from "automovie";
import { type Browser, chromium } from "playwright";
import * as THREE from "three";

/** One full-frame draw of a shipped fragment shader over 1 × 1 textures. */
interface IDraw {
  /** Whether the program is GLSL ES 3.00, which takes a version line. */
  glsl3: boolean;

  /** Vertex and fragment sources, includes already resolved. */
  vertex: string;
  fragment: string;

  /** Sampler name to one RGBA texel, bytes or floats. */
  textures: Record<string, { float: boolean; texel: number[] }>;

  /** Uniform name to its value: a number, a bool, an int or a matrix. */
  uniforms: Record<
    string,
    { type: "1f" | "1i" | "3f" | "Matrix3fv" | "Matrix4fv"; value: number[] }
  >;
}

/**
 * The page side: compile each draw with WebGL2, upload its texels, draw a
 * full-frame quad into a 1 × 1 RGBA8 framebuffer and read the byte back. Plain
 * JavaScript in a string, so the bundler cannot rewrite it before it runs in
 * the page.
 */
const PAGE: string = `(draws) => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (gl === null) throw new Error("no WebGL2 context");
  const compile = (kind, source) => {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  return draws.map((draw) => {
    const prefix = draw.glsl3 ? "#version 300 es\\n" : "";
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, prefix + draw.vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, prefix + draw.fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const quad = (name, size, values) => {
      const at = gl.getAttribLocation(program, name);
      if (at < 0) return;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
    };
    quad("position", 3, [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    quad("uv", 2, [0, 0, 1, 0, 0, 1, 1, 1]);
    Object.entries(draw.textures).forEach(([name, source], unit) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (source.float)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(source.texel));
      else
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(source.texel));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.uniform1i(gl.getUniformLocation(program, name), unit);
    });
    for (const [name, uniform] of Object.entries(draw.uniforms)) {
      const at = gl.getUniformLocation(program, name);
      if (uniform.type.startsWith("Matrix")) gl["uniform" + uniform.type](at, false, uniform.value);
      else gl["uniform" + uniform.type](at, ...uniform.value);
    }
    // The target is bound on a unit no sampler reads, so no draw reads it.
    const target = gl.createTexture();
    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    gl.viewport(0, 0, 1, 1);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const pixel = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return Array.from(pixel);
  });
}`;

/** The identity of a 3 × 3 and a 4 × 4 matrix, column-major. */
const IDENTITY3: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const IDENTITY4: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** A compositor draw of two source bytes, or a fade of one, at a weight. */
function composite(
  outgoing: number[],
  incoming: number[] | null,
  alpha: number,
  transparent: boolean,
): IDraw {
  return {
    glsl3: false,
    vertex: AUTOMOVIE_DISPLAY_COMPOSITE_SHADERS.vertex,
    fragment: AUTOMOVIE_DISPLAY_COMPOSITE_SHADERS.fragment.replace(
      "#include <colorspace_pars_fragment>",
      THREE.ShaderChunk.colorspace_pars_fragment,
    ),
    textures: {
      outgoing: { float: false, texel: outgoing },
      incoming: { float: false, texel: incoming ?? [0, 0, 0, 0] },
    },
    uniforms: {
      projectionMatrix: { type: "Matrix4fv", value: IDENTITY4 },
      modelViewMatrix: { type: "Matrix4fv", value: IDENTITY4 },
      alpha: { type: "1f", value: [alpha] },
      fade: { type: "1i", value: [incoming === null ? 1 : 0] },
      fadeTransparent: { type: "1i", value: [transparent ? 1 : 0] },
      copyBacking: { type: "1i", value: [0] },
      sourcePremultiplied: { type: "1i", value: [0] },
      outputPremultiplied: { type: "1i", value: [0] },
      outputSRGB: { type: "1i", value: [0] },
    },
  };
}

/**
 * A response-stage final pass over one linear texel of associated colour, with
 * no glare, an identity response, no tone curve and no grade.
 */
function respond(texel: number[], alpha: boolean): IDraw {
  return {
    glsl3: true,
    vertex: AUTOMOVIE_FILM_RESPONSE_SHADERS.vertex,
    fragment: AUTOMOVIE_FILM_RESPONSE_SHADERS.final,
    textures: {
      tLinear: { float: true, texel },
      tDepth: { float: true, texel: [0.5, 0, 0, 1] },
    },
    uniforms: {
      uGlareWeights: { type: "3f", value: [0, 0, 0] },
      uGlareStrength: { type: "1f", value: [0] },
      uResponse: { type: "Matrix3fv", value: IDENTITY3 },
      uCurve: { type: "1i", value: [0] },
      uGrade: { type: "1i", value: [0] },
      uSlope: { type: "3f", value: [1, 1, 1] },
      uOffset: { type: "3f", value: [0, 0, 0] },
      uPower: { type: "3f", value: [1, 1, 1] },
      uSaturation: { type: "1f", value: [1] },
      uAlpha: { type: "1i", value: [alpha ? 1 : 0] },
    },
  };
}

/**
 * The shipped GPU programs that carry alpha, the display compositor's
 * transition blend and the film response stage's final pass, keep colour
 * associated with alpha on a real WebGL2 rasterizer.
 *
 * Scenarios:
 *
 * 1. The compositor dissolves white at alpha 255 with a pixel of alpha 0 at weight
 *    0.5 into white at alpha 127 or 128, not the grey near 128 a
 *    straight-colour mix gives.
 * 2. It dissolves two pixels of alpha 0 into colour 0 and alpha 0.
 * 3. A transparent fade at its midpoint keeps an opaque pixel's colour within one
 *    code value and halves its alpha to 127 or 128.
 * 4. Two opaque pixels mix as straight colour: `(200, 100, 0)` and `(0, 100, 200)`
 *    at 0.5 give `(100, 100, 100, 255)`.
 * 5. The response stage's final pass, carrying alpha, turns linear associated grey
 *    0.1070205 at alpha 0.5, straight linear 0.214041, into sRGB 0.5 at alpha
 *    0.5 associated again: bytes 64 and 127 or 128.
 * 6. Opaque, it encodes linear 0.318547 as sRGB 0.6, byte 153, at alpha 255, and
 *    carrying alpha it keeps a texel of alpha 0 at colour 0 and alpha 0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Compiles `AUTOMOVIE_DISPLAY_COMPOSITE_SHADERS` and `AUTOMOVIE_FILM_RESPONSE_SHADERS.final`, the exact sources `AutoMovieDisplayCompositor` and `AutoMovieFilmResponseStage` compile, in headless Chromium on the SwiftShader backend `automovie capture` and `automovie render` launch, draws them over known texels and reads the framebuffer bytes. A compositor that mixes straight colour gives grey 128 in scenario 1; a final pass that responds associated colour gives byte 46 in scenario 5, and one that never associates again gives 128.
 * @evidence contracts/development/testing.md#independent-expectations Porter and Duff's associated-colour algebra: half of white at full coverage is white at half coverage, and a fade scaling associated colour and alpha together keeps the straight colour. The sRGB transfer of IEC 61966-2-1 maps straight linear ((0.5 + 0.055) / 1.055)^2.4 = 0.214041 to 0.5, so its association with alpha 0.5 is 0.25, byte 64, and ((0.6 + 0.055) / 1.055)^2.4 = 0.318547 to 0.6, byte 153; associated linear 0.1070205 encodes to 0.3627, whose half is byte 46.
 * @evidence contracts/development/testing.md#distinguishing-cases Half-covered against empty and opaque pixels, a dissolve against a fade, and the response's opaque path against its alpha path at full, half and zero coverage; the CPU byte mirror belongs to `test_draw_alpha_dissolve_blend`, the stage's mode switch to `test_draw_film_optics_alpha` and the delivered frames to `test_draw_drawn_video_alpha`.
 * @evidence contracts/development/testing.md#execution-ownership A GPU integration test: it launches the Playwright Chromium headless shell the test package pins, with `planAutoMovieChromiumLaunch`'s software switches, and fails when that browser is not installed (`npx playwright install chromium-headless-shell`); its texels and expectations are in memory and it writes no file.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the bytes it must give.
 */
export async function test_draw_alpha_blend_gpu(): Promise<void> {
  const plan: ReturnType<typeof planAutoMovieChromiumLaunch> =
    planAutoMovieChromiumLaunch("software", process.env);
  const browser: Browser = await chromium.launch({
    headless: true,
    args: plan.args,
    ...(plan.executablePath === undefined
      ? {}
      : { executablePath: plan.executablePath }),
  });
  try {
    const page: Awaited<ReturnType<Browser["newPage"]>> =
      await browser.newPage();
    const [half, empty, faded, opaque, associated, plain, clear] =
      (await page.evaluate(
        `(${PAGE})(${JSON.stringify([
          composite([255, 255, 255, 255], [0, 0, 0, 0], 0.5, false),
          composite([10, 20, 30, 0], [40, 50, 60, 0], 0.5, false),
          composite([40, 120, 200, 255], null, 0.5, true),
          composite([200, 100, 0, 255], [0, 100, 200, 255], 0.5, false),
          respond([0.1070205, 0.1070205, 0.1070205, 0.5], true),
          respond([0.318547, 0.318547, 0.318547, 1], false),
          respond([0, 0, 0, 0], true),
        ])})`,
      )) as number[][];
    const halfAlpha: (value: number | undefined) => boolean = (
      value: number | undefined,
    ): boolean => value === 127 || value === 128;

    // 1-4. The compositor.
    TestValidator.equals(
      "a dissolve over nothing keeps white at half coverage",
      [...half!.slice(0, 3), halfAlpha(half![3])],
      [255, 255, 255, true],
    );
    TestValidator.equals("two empty pixels stay empty", empty, [0, 0, 0, 0]);
    TestValidator.equals(
      "a transparent fade lowers alpha and keeps the colour",
      [
        ...[40, 120, 200].map(
          (expected: number, channel: number): boolean =>
            Math.abs(faded![channel]! - expected) <= 1,
        ),
        halfAlpha(faded![3]),
      ],
      [true, true, true, true],
    );
    TestValidator.equals(
      "opaque pixels mix as straight colour",
      opaque,
      [100, 100, 100, 255],
    );

    // 5-6. The response stage's final pass.
    TestValidator.equals(
      "associated colour is responded straight and associated again",
      [...associated!.slice(0, 3), halfAlpha(associated![3])],
      [64, 64, 64, true],
    );
    TestValidator.equals(
      "an opaque texel is encoded as it is held",
      plain,
      [153, 153, 153, 255],
    );
    TestValidator.equals("a texel of alpha 0 stays empty", clear, [0, 0, 0, 0]);
  } finally {
    await browser.close();
  }
}
