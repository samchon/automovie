import * as THREE from "three";
import { invitationDialogueAt } from "./invitationDialogueAt";

/**
 * Put exact English dialogue timing cues on the silent motion reference.
 * @evidence contracts/common.md#implementation-and-ownership One camera-bound sprite keeps the nine unchanged screenplay utterances on the same absolute clock. Only its small owned CanvasTexture updates when the active cue changes; perspective scaling keeps the text in a consistent lower screen band as actual shots change lens. These visible cues carry speech intent and ordering without presenting historical unheard adult speech probes as an accepted teen soundtrack. The physical invitation remains a separate actual paper texture.
 * @evidence contracts/common.md#authoring-interface Supply the owned camera and update with finite0–60seconds after its current lens is fitted. No audio is generated or played. Dispose removes only this sprite and its owned material/texture; Three supplies its shared Sprite geometry. Cues are reference annotations, to be removed from a later diffusion output; their presence does not establish lip synchronization or speech intelligibility.
 */
export function createDialogueCues(camera:THREE.PerspectiveCamera):{update:(time:number)=>void;dispose:()=>void} {
  const canvas:HTMLCanvasElement=document.createElement("canvas");canvas.width=1536;canvas.height=160;
  const context:CanvasRenderingContext2D|null=canvas.getContext("2d");if(!context)throw new Error("Dialogue cues need Canvas2D");
  const texture:THREE.CanvasTexture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material:THREE.SpriteMaterial=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false});
  const sprite:THREE.Sprite=new THREE.Sprite(material);sprite.renderOrder=1000;sprite.visible=false;camera.add(sprite);
  let previous:string="";
  return {update(time:number):void {
    if(!Number.isFinite(time)||time<0||time>60)throw new Error("Dialogue cue time is outside0–60seconds");
    const text:string=invitationDialogueAt(time);
    if(text!==previous){context.clearRect(0,0,canvas.width,canvas.height);if(text){context.fillStyle="rgba(18,23,29,0.86)";context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle="#ffffff";context.textAlign="center";context.textBaseline="middle";context.font="52px sans-serif";context.fillText(text,canvas.width/2,canvas.height/2,canvas.width-80);}texture.needsUpdate=true;previous=text;}
    const half:number=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));const width:number=1.88*half*camera.aspect;sprite.position.set(0,-.87*half,-1);sprite.scale.set(width,width/(canvas.width/canvas.height),1);sprite.visible=text.length>0;
  },dispose():void{sprite.removeFromParent();material.dispose();texture.dispose();}};
}
