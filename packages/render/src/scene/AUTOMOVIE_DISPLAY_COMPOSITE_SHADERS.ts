/**
 * The GLSL ES 1.00 programs of `AutoMovieDisplayCompositor`: a full-frame quad
 * and the composite of a dissolve, a fade and a saved-display copy.
 *
 * The fragment shader reads its sources as display bytes, straight colour, or
 * associated colour when `sourcePremultiplied` says the canvas holds it. It
 * mixes the two sources as associated colour, colour times alpha, with alpha at
 * the same weight, then returns to straight colour, colour divided by the mixed
 * alpha and 0 where that alpha is 0 (Porter and Duff 1984, "Compositing Digital
 * Images", SIGGRAPH), so a transparent source's black darkens no half-covered
 * edge and two opaque sources mix exactly as straight colour. A fade mixes
 * toward opaque black, or with `fadeTransparent` toward a fully transparent
 * pixel, so only alpha falls. `outputPremultiplied` associates the result again
 * for a premultiplied canvas, and `outputSRGB` applies the inverse transfer
 * before a native sRGB destination encodes it. It includes Three's
 * `colorspace_pars_fragment` chunk for `sRGBTransferEOTF`.
 */
export const AUTOMOVIE_DISPLAY_COMPOSITE_SHADERS: {
  /** Full-frame quad through Three's projection and model-view matrices. */
  readonly vertex: string;

  /** The composite, as described above. */
  readonly fragment: string;
} = {
  vertex: `precision highp float;
        uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
        attribute vec3 position; attribute vec2 uv; varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragment: `precision highp float;
        uniform highp sampler2D outgoing; uniform highp sampler2D incoming;
        uniform float alpha; uniform bool fade; uniform bool fadeTransparent;
        uniform bool copyBacking;
        uniform bool sourcePremultiplied; uniform bool outputPremultiplied;
        uniform bool outputSRGB;
        varying vec2 vUv;
        #include <colorspace_pars_fragment>
        vec4 straight(vec4 value) {
          if (sourcePremultiplied) value.rgb = value.a > 0.0 ? value.rgb / value.a : vec3(0.0);
          return floor(clamp(value, 0.0, 1.0) * 255.0 + 0.5);
        }
        void main() {
          vec4 first = texture2D(outgoing, vUv);
          if (copyBacking) { gl_FragColor = first; return; }
          first = straight(first);
          vec4 second = fade ? vec4(0.0, 0.0, 0.0, fadeTransparent ? 0.0 : 255.0) : straight(texture2D(incoming, vUv));
          // Mix associated colour and alpha at one weight, then return to
          // straight colour; for two opaque bytes this is the straight mix.
          vec4 mixed = mix(vec4(first.rgb * first.a / 255.0, first.a), vec4(second.rgb * second.a / 255.0, second.a), alpha);
          vec4 unassociated = mixed.a > 0.0 ? vec4(mixed.rgb * 255.0 / mixed.a, mixed.a) : vec4(0.0);
          vec4 result = floor(clamp(unassociated, 0.0, 255.0) + 0.5) / 255.0;
          if (outputPremultiplied) result.rgb *= result.a;
          if (outputSRGB) result = sRGBTransferEOTF(result);
          gl_FragColor = result;
        }`,
};
