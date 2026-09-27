// @ts-check
/**
 * Neutral GPU board for the production's current model source. Each selected
 * variant is uploaded from /model-board/scene; no proxy is reconstructed in
 * browser code. The grey floor, walk envelope and light are inspection aids.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas=/** @type {HTMLCanvasElement} */(document.querySelector("canvas"));
const modelSelect=/** @type {HTMLSelectElement} */(document.querySelector(
  "#model",
));
const viewSelect=/** @type {HTMLSelectElement} */(document.querySelector(
  "#view",
));
const status=/** @type {HTMLElement} */(document.querySelector("#status"));
const error=/** @type {HTMLElement} */(document.querySelector("#error"));
const reset=/** @type {HTMLButtonElement} */(document.querySelector("#reset"));
const renderer=new THREE.WebGLRenderer({
  canvas,
  antialias:true,
  preserveDrawingBuffer:true,
});
renderer.setSize(1600,1000,false);
renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=false;
const gl=renderer.getContext();
const debug=gl.getExtension("WEBGL_debug_renderer_info");
const runtime=debug
  ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
  : "unverified GPU renderer";
console.info("RENDERER",runtime);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x888888);
const camera=new THREE.PerspectiveCamera(50,1.6,0.01,500);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=false;
const hemi=new THREE.HemisphereLight(0xffffff,0x777777,1.4);
const sun=new THREE.DirectionalLight(0xffffff,3.0);
sun.position.set(-10,14,10);
scene.add(hemi,sun,sun.target);
const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color:0x808080, roughness:1 }),
);
floor.rotation.x=-Math.PI/2;
floor.position.y=-0.005;
floor.receiveShadow=true;
scene.add(floor);
/** @type {{ basis:string;payload:{ models:Array<{ key:string;design:string;model:import("@automovie/interface").IAutoMovieModel }> } } | null} */
let source=null;
/** @type {THREE.Group | null} */
let shown=null;
/** @type {THREE.Box3 | null} */
let subjectBounds=null;
let displayOffset=0;
let selectedKey="";

const directions={
  front:[0, 0, 1],
  right:[1, 0, 0],
  rear:[0, 0, -1],
  top:[0, 1, 0],
  diagonal:[1, Math.SQRT2*Math.tan(Math.PI/6), 1],
  opposite:[-1, Math.SQRT2*Math.tan(Math.PI/6), -1],
};

/** @param {THREE.Object3D} root */
function dispose(root){
  root.traverse((node)=>{
  if(!(node instanceof THREE.Mesh))return;
  node.geometry.dispose();
  for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();
});
}

/** @param {string} key */
function setModel(key){
  const entry=source?.payload.models.find((item)=>item.key===key);
  if(entry===undefined)throw new Error(`${key}: current model variant missing`);
  if(shown!==null){
    scene.remove(shown);
    dispose(shown);
  }
  shown=new THREE.Group();
  shown.name=key;
  const clay=new THREE.MeshStandardMaterial({
    color:0xd4cfc5,
    roughness:0.93,
    metalness:0,
  });
  for(const part of entry.model.parts){
    if(part.geometry.type!=="mesh")throw new Error(
      `${key}/${part.id}: mesh required`,
    );
    const data=part.geometry.mesh;
    if(data.uvs===null||data.uvs.length!==data.positions.length/3*2)
      throw new Error(`${key}/${part.id}: finite UV0 required`);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3),
    );
    if(data.normals!==null)geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(data.normals, 3),
    );
    else geometry.computeVertexNormals();
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(data.uvs,2));
    if(data.indices!==null)geometry.setIndex(data.indices);
    const mesh=new THREE.Mesh(geometry,clay);
    mesh.name=part.id;
    shown.add(mesh);
  }
  const local=new THREE.Box3().setFromObject(shown);
  displayOffset=-local.min.y;
  shown.position.y=displayOffset;
  subjectBounds=new THREE.Box3().setFromObject(shown);
  const size=new THREE.Vector3();
  subjectBounds.getSize(size);
  const walk=new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(
      subjectBounds.max.x+0.8,
      0.95,
      subjectBounds.getCenter(new THREE.Vector3()).z,
    ),
    new THREE.Vector3(0.6, 1.9, 0.4),
  );
  const walkMesh=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 1.9, 0.4)),
    new THREE.LineBasicMaterial({ color:0x464646 }),
  );
  walkMesh.position.copy(walk.getCenter(new THREE.Vector3()));
  shown.add(walkMesh);
  scene.add(shown);
  selectedKey=key;
  modelSelect.value=key;
  status.textContent=`${entry.design} · ${key}\nsource ${source?.basis}\n`+
    `local bounds ${size.x.toFixed(4)} × ${size.y.toFixed(4)} × ${size.z.toFixed(4)} m; `+
    `display lift ${displayOffset.toFixed(4)} m\n${runtime}`;
  setView(viewSelect.value);
}

/** @param {string} view @param {[number,number,number] | null} [focus]
 * @param {number | null} [extent] */
function setView(view,focus=null,extent=null){
  if(subjectBounds===null)throw new Error("model not selected");
  const bounds=subjectBounds;
  const raw=directions[/** @type {keyof typeof directions} */(view)];
  if(raw===undefined)throw new Error(`${view}: unknown reviewed view`);
  const dir=new THREE.Vector3(...raw).normalize();
  camera.up.set(0,view==="top"?0:1,view==="top"?-1:0);
  const target=focus===null
    ? bounds.getCenter(new THREE.Vector3())
    : new THREE.Vector3(focus[0], focus[1]+displayOffset, focus[2]);
  const forward=dir.clone().negate();
  const right=new THREE.Vector3().crossVectors(forward,camera.up).normalize();
  const up=new THREE.Vector3().crossVectors(right,forward).normalize();
  const corners=Array.from(
    { length:8 },
    (_,i)=>new THREE.Vector3(
      i&1 ? bounds.max.x : bounds.min.x,
      i&2 ? bounds.max.y : bounds.min.y,
      i&4 ? bounds.max.z : bounds.min.z,
    ),
  );
  const xSpan=extent??Math.max(...corners.map((q)=>Math.abs(q.clone().sub(target).dot(right))))*2;
  const ySpan=extent??Math.max(...corners.map((q)=>Math.abs(q.clone().sub(target).dot(up))))*2;
  const depth=extent??Math.max(...corners.map((q)=>Math.abs(q.clone().sub(target).dot(dir))));
  const fill=extent===null?0.70:0.90;
  const tan=Math.tan(50*Math.PI/360);
  const distance=Math.max(xSpan/(2*tan*1.6*fill),ySpan/(2*tan*fill))+depth;
  camera.position.copy(target).addScaledVector(dir,Math.max(distance,0.1));
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.update();
  viewSelect.value=view;
  return { camera:camera.position.toArray(),target:target.toArray(),view,fill };
}

function frame(){
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
modelSelect.addEventListener("change",()=>setModel(modelSelect.value));
viewSelect.addEventListener("change",()=>setView(viewSelect.value));
reset.addEventListener("click",()=>setView(viewSelect.value));
window.addEventListener("error", (event)=>{
  error.textContent=String(event.message);
});
window.addEventListener("unhandledrejection", (event)=>{
  error.textContent=String(event.reason);
});
const ready=(async()=>{
  const response=await fetch("/model-board/scene",{ cache:"no-store" });
  if(!response.ok)throw new Error(await response.text());
  source=await response.json();
  if(source===null)throw new Error("model board source empty");
  modelSelect.replaceChildren(...source.payload.models.map((entry)=>new Option(entry.key,entry.key)));
  const params=new URL(location.href).searchParams;
  viewSelect.value=params.get("view")??"front";
  setModel(params.get("model")??source.payload.models[0]?.key??"");
  return { basis:source.basis,count:source.payload.models.length,runtime };
})().catch((cause)=>{error.textContent=cause instanceof Error?(cause.stack??cause.message):String(cause);throw cause;});
Object.assign(window, {
  templeModelBoard:{
    renderer,
    camera,
    setModel,
    setView,
    ready,
    get key(){
      return selectedKey;
    },
    get basis(){
      return source?.basis??null;
    },
    get runtime(){
      return runtime;
    },
  },
});
