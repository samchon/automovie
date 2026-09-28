/**
 * Browser client of the production's live 3D view.
 *
 * Responsibility: draw the scene that `server.cts` builds at `GET /scene`
 * with a real WebGL renderer, perspective camera, lights, shadow maps,
 * materials and depth (settings `renderer-boundary`). The page loads this
 * module from `public/index.html`; three.js arrives through the page's
 * import map from the installed package, so no bundler is involved.
 *
 * Inputs: the JSON scene (`IViewerScene` in `scenePayload.ts`). Outputs: the
 * frame on `#viewport`, the `RENDERER` string on the console, and
 * `window.automovieViewer` = `{ renderer, ready, subject, sourceDigest,
 * error }` for a capture script, which waits for `ready`.
 *
 * Order matters: the renderer is created first so its GPU string is known,
 * then the scene is fetched; the first frame is drawn only after every mesh
 * exists, and only then is `ready` set. When the fetch fails (server gone,
 * 409 stale source) the canvas is cleared and the error shown, so an old
 * picture is never presented as current (live-viewing rule).
 *
 * Operator keys (settings `operator-access`): drag to orbit, right-drag or
 * arrow keys to pan, wheel to zoom, `R` returns to the default view, `I`
 * toggles the inspection panel. Labels stay hidden until `I` is pressed.
 *
 * Page query: `subject=calibration` asks the server for the calibration shape
 * instead of the house; `eye=x,y,z` and `at=x,y,z` (meters) replace the
 * starting camera for an inspection view, and `R` returns to that view;
 * `only=<part-id>` isolates an existing payload mesh for a supplemental
 * inspection without changing geometry, material, transform, or lighting.
 * `cut=y` (meters) clips everything above world height y, a horizontal
 * section for reading plans and interiors from above; `observe=<id>` starts
 * at a derived observation pose with the settings interior frame (vertical
 * FOV 60°, near 0.05 m).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Reflector } from "three/addons/objects/Reflector.js";

/** @typedef {import("./scenePayload").IViewerScene} IViewerScene */
/** @typedef {import("./scenePayload").IViewerSceneItem} IViewerSceneItem */

const canvas = document.getElementById("viewport");
const panel = document.getElementById("inspection");
if (!(canvas instanceof HTMLCanvasElement) || panel === null)
  throw new Error("viewer page lacks #viewport canvas or #inspection panel");

const query = new URLSearchParams(window.location.search);

/**
 * Read an `x,y,z` query value, or null when absent or malformed.
 *
 * @param {string} name
 * @returns {[number, number, number] | null}
 */
const queryPoint = (name) => {
  const values = (query.get(name) ?? "").split(",").map(Number);
  return values.length === 3 && values.every(Number.isFinite)
    ? /** @type {[number, number, number]} */ (values)
    : null;
};

/** State a capture script reads; written only by this module. */
const state = {
  renderer: "unknown",
  ready: false,
  subject: "",
  sourceDigest: "",
  error: "",
  texturesLoaded: 0,
  texturesFailed: /** @type {string[]} */ ([]),
};
Reflect.set(window, "automovieViewer", state);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/** Read the GPU renderer string of the context that draws the building. */
const readRendererString = () => {
  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  return String(
    debug === null
      ? gl.getParameter(gl.RENDERER)
      : gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
  );
};
state.renderer = readRendererString();
console.info("RENDERER", state.renderer);

/**
 * Turn one engine mesh item into a lit, shadowed three.js mesh.
 *
 * @param {IViewerSceneItem} item
 * @param {Map<string, THREE.Texture>} textures
 */
const buildMesh = (item, textures) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(item.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(item.normals, 3),
  );
  geometry.setIndex(item.indices);
  if (item.uvs !== undefined)
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(item.uvs, 2));
  if(item.faceId==="mirror"&&!item.inspectionFace&&!item.inspectionSection){
    // Reflector's local plane is +Z through its origin. Rebase the actual
    // engine vertices onto the first front-face plane without changing a
    // single world vertex; the closed silver plate keeps its original depth.
    const origin=new THREE.Vector3(...item.positions.slice(0,3));
    const normal=new THREE.Vector3(...item.normals.slice(0,3)).normalize();
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
    const inverse=rotation.clone().invert();
    geometry.translate(-origin.x,-origin.y,-origin.z).applyQuaternion(inverse);
    const mirror=new Reflector(geometry,{textureWidth:512,textureHeight:512,color:item.color,clipBias:.0001});
    mirror.name=item.id;mirror.position.copy(origin).add(new THREE.Vector3(...item.position));mirror.quaternion.copy(rotation);
    mirror.castShadow=item.castShadow;mirror.receiveShadow=item.receiveShadow;
    return mirror;
  }
  const map = item.texture === undefined
    ? undefined
    : textures.get(item.texture);
  const options = {
    color: map === undefined || item.textureTint ? item.color : 0xffffff,
    map: map ?? null,
    roughness: item.roughness ?? 0.8,
    metalness: item.metalness ?? 0,
    opacity: item.opacity ?? 1,
    transparent: item.opacity !== undefined && item.opacity < 1,
    depthWrite: item.opacity === undefined || item.opacity >= 1,
    side: item.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  };
  const material = item.transmission !== undefined && item.transmission > 0
    ? new THREE.MeshPhysicalMaterial({
        ...options,
        transmission: item.transmission,
        ior: item.ior ?? 1.5,
        thickness: item.thickness ?? 0,
      })
    : new THREE.MeshStandardMaterial(options);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = item.id;
  mesh.position.set(...item.position);
  mesh.castShadow = item.castShadow;
  mesh.receiveShadow = item.receiveShadow;
  return mesh;
};

/**
 * Build lights and meshes for one scene payload.
 *
 * @param {IViewerScene} payload
 * @param {Map<string, THREE.Texture>} textures
 */
const buildScene = (payload, textures) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9dde2);
  const light = payload.lighting;
  if(payload.physicalLighting){
    const physical=payload.physicalLighting;
    const background=physical.environment.background;
    scene.background=background?new THREE.Color().setRGB(background.r,background.g,background.b):null;
    for(const source of physical.lights){
      const c=new THREE.Color().setRGB(source.color.r,source.color.g,source.color.b);
      if(source.type!=="point"&&source.type!=="directional")throw Error(`unsupported house light ${source.id}`);
      const light=source.type==="point"?new THREE.PointLight(c,source.intensity,source.range,2):new THREE.DirectionalLight(c,source.intensity);
      const p=source.transform.translation;
      if(light instanceof THREE.DirectionalLight){
        const q=source.transform.rotation,d=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion(q.x,q.y,q.z,q.w));
        light.target.position.set(3,0,-5);light.position.copy(light.target.position).addScaledVector(d,-52);
        scene.add(light.target);
      }else light.position.set(p.x,p.y,p.z);
      light.castShadow=source.castShadow??false;
      if(source.shadow){
        const s=source.shadow;light.shadow.mapSize.set(s.mapSize,s.mapSize);light.shadow.bias=s.bias;light.shadow.normalBias=s.normalBias;
        light.shadow.camera.near=s.near;light.shadow.camera.far=s.far;
        if(light instanceof THREE.DirectionalLight){light.shadow.camera.left=-24;light.shadow.camera.right=24;light.shadow.camera.bottom=-24;light.shadow.camera.top=24;}
      }
      scene.add(light);
    }
    for(const item of payload.items)scene.add(buildMesh(item,textures));
    renderer.toneMappingExposure=physical.environment.exposure;
    return scene;
  }
  scene.add(
    new THREE.HemisphereLight(
      light.skyColor,
      light.groundColor,
      light.fillIntensity,
    ),
  );
  const key = new THREE.DirectionalLight(0xffffff, light.keyIntensity);
  key.position.set(...light.keyFrom).normalize().multiplyScalar(
    2 * (light.shadowHalfExtent ?? 8) + 4,
  );
  if (light.keyTarget) {
    key.target.position.set(...light.keyTarget);
    key.position.add(key.target.position);
  }
  key.castShadow = true;
  // The shadow box must cover the subject: the calibration shape or the whole house and site.
  const reach = light.shadowHalfExtent ?? 8;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = -reach;
  key.shadow.camera.right = reach;
  key.shadow.camera.top = reach;
  key.shadow.camera.bottom = -reach;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 4 * reach + 40;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(key.target);
  for (const item of payload.items) scene.add(buildMesh(item, textures));
  renderer.toneMappingExposure = light.exposure;
  return scene;
};

/**
 * Show the scene with its starting camera and wire the operator controls.
 *
 * @param {IViewerScene} payload
 */
const show = async (payload) => {
  const { width, height, pixelRatio } = payload.raster;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const urls = query.get("textures") === "off"
    ? []
    : [
        ...new Set(payload.items.flatMap((item) => item.texture === undefined ? [] : [item.texture])),
      ];
  await Promise.all(urls.map(async (url) => {
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.set(url, texture);
    } catch {
      state.texturesFailed.push(url);
    }
  }));
  state.texturesLoaded = textures.size;
  const scene = buildScene(payload, textures);
  /** @param {string|null} part */
  const isolate=(part)=>{
    const meshes=scene.children.filter(item=>item instanceof THREE.Mesh);
    const selected=part===null?meshes:meshes.filter(item=>item.name===part||item.name.startsWith(part+"/"));
    if(selected.length===0)throw Error(`isolated inspection has no existing meshes: ${part}`);
    for(const item of meshes)item.visible=selected.includes(item);
    const record={part,visible:selected.map(item=>item.name),hidden:meshes.filter(item=>!item.visible).map(item=>item.name),sourceDigest:payload.sourceDigest};
    Reflect.set(window,"automovieIsolatedInspection",record);
    return record;
  };
  const only=query.get("only");
  if(only!==null)isolate(only);
  const cut = Number(query.get("cut") ?? "NaN");
  renderer.clippingPlanes = Number.isFinite(cut)
    ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), cut)]
    : payload.sectionX===undefined?[]:[new THREE.Plane(new THREE.Vector3(-1,0,0),payload.sectionX)];
  const observed = (payload.observations ?? []).find(
    (o) => o.id === query.get("observe"),
  );
  const start =
    observed === undefined
      ? {
          ...payload.camera,
          position: queryPoint("eye") ?? payload.camera.position,
          target: queryPoint("at") ?? payload.camera.target,
        }
      : {
          ...payload.camera,
          position: observed.position,
          target: observed.target,
          fovDeg: 60,
          near: 0.05,
        };
  const camera = start.orthographicSpan===undefined?new THREE.PerspectiveCamera(
    start.fovDeg,
    width / height,
    start.near,
    start.far,
  ):new THREE.OrthographicCamera(-start.orthographicSpan*width/height/2,start.orthographicSpan*width/height/2,start.orthographicSpan/2,-start.orthographicSpan/2,start.near,start.far);
  const controls = new OrbitControls(camera, canvas);
  controls.listenToKeyEvents(window);
  const reset = () => {
    camera.position.set(...start.position);
    controls.target.set(...start.target);
    controls.update();
  };
  const render = () => {
    renderer.render(scene, camera);
  };
  controls.addEventListener("change", render);
  reset();
  render();
  Reflect.set(window,"automovieObservation",{
    ids:(payload.observations??[]).map(o=>o.id),
    /** @param {string|null} part */
    isolate(part){const result=isolate(part);render();return result;},
    /** @param {string} id */
    select(id){
      const view=payload.observations?.find(o=>o.id===id);
      if(!view)throw Error(`unknown compiled observation ${id}`);
      camera.position.set(...view.position);controls.target.set(...view.target);
      if(!(camera instanceof THREE.PerspectiveCamera))throw Error("house observation requires its perspective camera");
      camera.fov=view.fovDeg??60;camera.near=view.near??.05;camera.updateProjectionMatrix();controls.update();render();
      return {id,position:camera.position.toArray(),target:controls.target.toArray(),fovDeg:camera.fov,near:camera.near,sourceDigest:payload.sourceDigest};
    },
    probe(){
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);
      const hit=ray.intersectObjects(scene.children,false)[0];
      return {position:camera.position.toArray(),target:controls.target.toArray(),firstHit:hit?{id:hit.object.name,distance:hit.distance,point:hit.point.toArray()}:null};
    },
  });
  state.subject = payload.subject;
  state.sourceDigest = payload.sourceDigest;
  panel.textContent = [
    payload.inspection ? "검사 모드" : "전달 보기",
    payload.subject,
    `소스 ${payload.sourceDigest}`,
    `RENDERER ${state.renderer}`,
    `${width}×${height} @${pixelRatio}`,
    "R 기본 시점 · I 검사 표시",
  ].join(" · ");
  window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") reset();
    else if (event.key === "i" || event.key === "I") panel.hidden = !panel.hidden;
  });
  window.addEventListener("pagehide", () => {
    controls.dispose();
    renderer.dispose();
  });
  state.ready = true;
};

/**
 * Clear the canvas and show why no current scene exists.
 *
 * @param {unknown} error
 */
const fail = (error) => {
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  state.error = error instanceof Error ? error.message : String(error);
  panel.textContent = `장면을 불러오지 못했다: ${state.error}`;
  panel.hidden = false;
};

/** Fetch the current scene; a non-200 answer carries its reason. */
const load = async () => {
  const subject = query.get("subject");
  const response = await fetch(
    subject === null
      ? "/scene"
      : `/scene?${query.toString()}`,
    { cache: "no-store" },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${String(body.error ?? "unknown")}`);
  return /** @type {IViewerScene} */ (body);
};

void load().then(show).catch(fail);
