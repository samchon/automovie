import * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";

/**
 * Capture the public framebuffer selection and raster rectangle state.
 * A target bind changes effective viewport/scissor. Preserve both configured
 * logical renderer fields and the effective framebuffer's physical rectangle.
 * A temporary target rectangle supplies the captured physical values to the
 * supported bind operation, then its authored fields are restored immediately.
 * Every independent restoration is attempted after a native resource operation.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-state-isolation Preserves public framebuffer and raster state across native shadow attachment ownership operations.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Restores all observed caller selection fields independently.
 */
export const captureAutoMovieFramebufferRestore=(renderer:THREE.WebGLRenderer):()=>void=>{
  const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
  const viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),test=renderer.getScissorTest();
  const effectiveViewport=renderer.getCurrentViewport(new THREE.Vector4());
  const gl=renderer.getContext();
  const effectiveScissor=new THREE.Vector4().fromArray(gl.getParameter(gl.SCISSOR_BOX) as Int32Array);
  const effectiveTest=gl.isEnabled(gl.SCISSOR_TEST);
  return ()=>restoreAutoMovieRenderModeState([
    ()=>{renderer.setViewport(viewport);},
    ()=>{renderer.setScissor(scissor);},
    ()=>{renderer.setScissorTest(test);},
    ()=>{
      if(target===null){renderer.setRenderTarget(null,face,mip);return;}
      const priorViewport=target.viewport.clone(),priorScissor=target.scissor.clone(),priorTest=target.scissorTest;
      target.viewport.copy(effectiveViewport);target.scissor.copy(effectiveScissor);target.scissorTest=effectiveTest;
      let failure:{error:unknown}|undefined;
      try{renderer.setRenderTarget(target,face,mip);}catch(error){failure={error};}
      const restore=[()=>{target.viewport.copy(priorViewport);},()=>{target.scissor.copy(priorScissor);},()=>{target.scissorTest=priorTest;}];
      if(failure===undefined)restoreAutoMovieRenderModeState(restore);
      else restoreAutoMovieRenderModeState(restore,failure);
    },
  ]);
};
