import type * as THREE from "three";

/**
 * Read the actual selected offscreen color attachment's native transfer. The caller has bound its destination, so explicit internal formats and SDK storage choices are observed rather than inferred from Texture.colorSpace. Byte-product emission supports linear or sRGB storage; an absent or unknown color attachment refuses before a source callback can replace the display. The selected face and mip must form a complete framebuffer: a native color encoding alone cannot prove that the selected image storage exists. The float quad requires unsigned-normalized RGBA channels of at least eight bits, or homogeneous RGBA16F/RGBA32F storage. Integer and signed components, missing channels and lower precision cannot certify the byte identities. Eight unsigned-normalized bits encode all 256 source values. RGBA16F's binary16 rounding changes a normalized byte value by less than 0.063 byte; RGBA32F is finer, so nearest-byte capture retains those same values. This query neither binds nor allocates a target and changes no native state. The installed renderer declaration also admits a WebGL1 context. Require the actual public WebGL2 attachment-query capability before reading its encoding constants; no guessed numeric enum or widened type substitutes.
 *
 * @evidence contracts/common.md#principled-implementation Queries the already-bound complete framebuffer through actual WebGL2 attachment capabilities and admits linear/sRGB unsigned-normalized RGBA at least8bits or homogeneous RGBA16F/32F.
 * @evidence contracts/common.md#clear-and-simple-design One native destination profile boundary precedes source callbacks; output texture metadata and guessed enum constants do not replace actual attachment queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incomplete framebuffer, unsupported capability/component/channels/precision or encoding refuse; admitted numeric precision is a byte-rounding premise, not independent observation of final device pixels.
 * @evidence contracts/common.md#meaningful-documentation Documents component and precision admission, float rounding bound, actual selected face/mip requirement and no bind/allocation/native-state mutation.
 * @evidence contracts/performance.md#efficient-algorithms Four channel precision queries plus fixed status/component/encoding queries use constant coordinator storage and no per-pixel scan; native queries retain their driver synchronization cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The current bound destination must be reobserved because target/face/mip can change; no colorSpace-only cache substitutes for actual native encoding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary scalar/query arrays retain no texture or framebuffer handle; the caller keeps its selected borrowed destination alive and owns eventual release.
 */
export const readAutoMovieDisplayDestinationEncoding: (renderer: Pick<THREE.WebGLRenderer,"getContext">) => "linear"|"srgb"=(renderer:Pick<THREE.WebGLRenderer,"getContext">):"linear"|"srgb"=>{
  const gl: ReturnType<THREE.WebGLRenderer["getContext"]>=renderer.getContext();
  if(!("FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING" in gl))
    throw new Error("Display destination encoding requires the public WebGL2 attachment-query profile.");
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)
    throw new Error("The selected display destination framebuffer is incomplete.");
  const componentParameter:unknown=Reflect.get(gl,"FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE");
  const normalizedType:unknown=Reflect.get(gl,"UNSIGNED_NORMALIZED");
  const sizeParameters: unknown[]=["FRAMEBUFFER_ATTACHMENT_RED_SIZE","FRAMEBUFFER_ATTACHMENT_GREEN_SIZE","FRAMEBUFFER_ATTACHMENT_BLUE_SIZE","FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE"].map((name: string):unknown=>Reflect.get(gl,name));
  if(typeof componentParameter!=="number"||typeof normalizedType!=="number"||!sizeParameters.every((value: unknown):value is number=>typeof value==="number"))
    throw new Error("Display destination requires public native component and RGBA precision queries.");
  const component: unknown=gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,componentParameter);
  const sizes: unknown[]=sizeParameters.map((parameter: number): unknown =>gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,parameter));
  if(!sizes.every((size: unknown):size is number=>typeof size==="number"&&Number.isInteger(size)))
    throw new Error("The selected display destination has no native RGBA precision profile.");
  if(component===normalizedType){
    if(sizes.some((size: number): boolean =>size<8))throw new Error("Display destination requires at least eight unsigned-normalized bits in every RGBA channel.");
  }else if(component===gl.FLOAT){
    if(!sizes.every((size: number): boolean =>size===16)&&!sizes.every((size: number): boolean =>size===32))
      throw new Error("Display destination supports homogeneous RGBA16F or RGBA32F floating storage.");
  }else throw new Error("Display destination components are incompatible with the float byte-product quad.");
  const encoding: unknown=gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING);
  if(encoding===gl.LINEAR)return "linear";
  if(encoding===gl.SRGB)return "srgb";
  throw new Error("The selected display destination has no supported linear or sRGB color attachment.");
};
