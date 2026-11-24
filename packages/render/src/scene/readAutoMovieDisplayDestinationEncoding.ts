import type * as THREE from "three";

/**
 * Read the actual selected offscreen color attachment's native transfer. The
 * caller has bound its destination, so explicit internal formats and SDK
 * storage choices are observed rather than inferred from Texture.colorSpace.
 * Byte-product emission supports linear or sRGB storage; an absent or unknown
 * color attachment refuses before a source callback can replace the display.
 * The selected face and mip must form a complete framebuffer: a native color
 * encoding alone cannot prove that the selected image storage exists. The float
 * quad requires unsigned-normalized RGBA channels of at least eight bits, or
 * homogeneous RGBA16F/RGBA32F storage. Integer and signed components, missing
 * channels and lower precision cannot certify the byte identities. Eight
 * unsigned-normalized bits encode all 256 source values. RGBA16F's binary16
 * rounding changes a normalized byte value by less than 0.063 byte; RGBA32F is
 * finer, so nearest-byte capture retains those same values. This query neither
 * binds nor allocates a target and changes no native state. The installed
 * renderer declaration also admits a WebGL1 context, so the WebGL2 member of
 * that declared union is selected before its attachment-query constants are
 * read; no guessed numeric enum or widened type substitutes. That selection is
 * a capability probe of the host's runtime WebGL context, not a type check of
 * AutoMovie data, so it reads the context's own member with `in`.
 */
export const readAutoMovieDisplayDestinationEncoding: (
  renderer: Pick<THREE.WebGLRenderer, "getContext">,
) => "linear" | "srgb" = (
  renderer: Pick<THREE.WebGLRenderer, "getContext">,
): "linear" | "srgb" => {
  const gl: ReturnType<THREE.WebGLRenderer["getContext"]> =
    renderer.getContext();
  if (!("FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING" in gl))
    throw new Error(
      "Display destination encoding requires the public WebGL2 attachment-query profile.",
    );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    throw new Error(
      "The selected display destination framebuffer is incomplete.",
    );
  const sizeParameters: number[] = [
    gl.FRAMEBUFFER_ATTACHMENT_RED_SIZE,
    gl.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE,
    gl.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE,
    gl.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE,
  ];
  const component: number = gl.getFramebufferAttachmentParameter(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE,
  );
  const sizes: number[] = sizeParameters.map((parameter: number): number =>
    gl.getFramebufferAttachmentParameter(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      parameter,
    ),
  );  if (component === gl.UNSIGNED_NORMALIZED) {
    if (sizes.some((size: number): boolean => size < 8))
      throw new Error(
        "Display destination requires at least eight unsigned-normalized bits in every RGBA channel.",
      );
  } else if (component === gl.FLOAT) {
    if (
      !sizes.every((size: number): boolean => size === 16) &&
      !sizes.every((size: number): boolean => size === 32)
    )
      throw new Error(
        "Display destination supports homogeneous RGBA16F or RGBA32F floating storage.",
      );
  } else
    throw new Error(
      "Display destination components are incompatible with the float byte-product quad.",
    );
  const encoding: number = gl.getFramebufferAttachmentParameter(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING,
  );
  if (encoding === gl.LINEAR) return "linear";
  if (encoding === gl.SRGB) return "srgb";
  throw new Error(
    "The selected display destination has no supported linear or sRGB color attachment.",
  );
};
