import type * as THREE from "three";

/**
 * Read the actual selected offscreen color attachment's native transfer.
 * The caller has bound its destination, so explicit internal formats and SDK
 * storage choices are observed rather than inferred from Texture.colorSpace.
 * Byte-product emission supports linear or sRGB storage; an absent or unknown
 * color attachment refuses before a source callback can replace the display.
 * The selected face and mip must form a complete framebuffer: a native color
 * encoding alone cannot prove that the selected image storage exists.
 * The float quad requires unsigned-normalized RGBA channels of at least eight
 * bits, or homogeneous RGBA16F/RGBA32F storage. Integer and signed components,
 * missing channels and lower precision cannot certify the byte identities.
 * Eight unsigned-normalized bits encode all 256 source values. RGBA16F's
 * binary16 rounding changes a normalized byte value by less than 0.063 byte;
 * RGBA32F is finer, so nearest-byte capture retains those same values.
 * This query neither binds nor allocates a target and changes no native state.
 * The installed renderer declaration also admits a WebGL1 context. Require
 * the actual public WebGL2 attachment-query capability before reading its
 * encoding constants; no guessed numeric enum or widened type substitutes.
 */
export const readAutoMovieDisplayDestinationEncoding=(renderer:Pick<THREE.WebGLRenderer,"getContext">):"linear"|"srgb"=>{
  const gl=renderer.getContext();
  if(!("FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING" in gl))
    throw new Error("Display destination encoding requires the public WebGL2 attachment-query profile.");
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)
    throw new Error("The selected display destination framebuffer is incomplete.");
  const componentParameter:unknown=Reflect.get(gl,"FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE");
  const normalizedType:unknown=Reflect.get(gl,"UNSIGNED_NORMALIZED");
  const sizeParameters=["FRAMEBUFFER_ATTACHMENT_RED_SIZE","FRAMEBUFFER_ATTACHMENT_GREEN_SIZE","FRAMEBUFFER_ATTACHMENT_BLUE_SIZE","FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE"].map((name):unknown=>Reflect.get(gl,name));
  if(typeof componentParameter!=="number"||typeof normalizedType!=="number"||!sizeParameters.every((value):value is number=>typeof value==="number"))
    throw new Error("Display destination requires public native component and RGBA precision queries.");
  const component=gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,componentParameter);
  const sizes=sizeParameters.map(parameter=>gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,parameter));
  if(!sizes.every((size):size is number=>typeof size==="number"&&Number.isInteger(size)))
    throw new Error("The selected display destination has no native RGBA precision profile.");
  if(component===normalizedType){
    if(sizes.some(size=>size<8))throw new Error("Display destination requires at least eight unsigned-normalized bits in every RGBA channel.");
  }else if(component===gl.FLOAT){
    if(!sizes.every(size=>size===16)&&!sizes.every(size=>size===32))
      throw new Error("Display destination supports homogeneous RGBA16F or RGBA32F floating storage.");
  }else throw new Error("Display destination components are incompatible with the float byte-product quad.");
  const encoding=gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING);
  if(encoding===gl.LINEAR)return "linear";
  if(encoding===gl.SRGB)return "srgb";
  throw new Error("The selected display destination has no supported linear or sRGB color attachment.");
};
