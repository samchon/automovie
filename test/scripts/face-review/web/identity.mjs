/** Describe exactly the rendered inspection state, without accepting its quality.
 * The caller supplies live scene references at capture time. Values are copied
 * into a serializable receipt: metre camera/model coordinates, pixel dimensions,
 * artifact/runtime identities and the current source-build state. No field here
 * is a photograph registration or a certificate of anatomy or likeness.
 */
import * as THREE from "three";

export function portraitWebIdentity({
  snapshot,
  meshes,
  runtimeIdentity,
  device,
  hardware,
  renderer,
  gl,
  view,
  camera,
  controls,
  subject,
  mode,
  calibration,
  buildStatus,
}) {
  return {
    schema: "automovie-face-web-capture-v1",
    artifact: snapshot.artifact,
    basisSha256: snapshot.basisSha256,
    model: {
      id: snapshot.model.id,
      source: snapshot.source,
      parts: meshes.size,
    },
    runtime: {
      three: THREE.REVISION,
      files: runtimeIdentity,
      renderer: device,
      hardware,
      colourSpace: renderer.outputColorSpace,
      toneMapping: "ACESFilmic",
      exposure: renderer.toneMappingExposure,
      depth: {
        bits: gl.getParameter(gl.DEPTH_BITS),
        projection: "standard",
        clipRule: "complete subject bounds in camera space, 5% diagonal margin",
      },
    },
    lighting: {
      kind: "WebGL inspection",
      ambient: 0.6,
      directional: snapshot.profile.cycles.lights.map((light) => ({
        position: light.position,
        colour: light.color,
        intensity: light.power / 10,
      })),
      castsShadows: false,
    },
    camera: {
      view,
      projection: camera.isOrthographicCamera ? "orthographic" : "perspective",
      position: camera.position.toArray(),
      quaternion: camera.quaternion.toArray(),
      target: controls.target.toArray(),
      verticalFov: camera.isPerspectiveCamera ? camera.fov : null,
      orthographic: camera.isOrthographicCamera
        ? {
            left: camera.left,
            right: camera.right,
            top: camera.top,
            bottom: camera.bottom,
            zoom: camera.zoom,
          }
        : null,
      near: camera.near,
      far: camera.far,
      aspect: renderer.domElement.width / renderer.domElement.height,
    },
    modelTransform: {
      matrix: subject.matrix.toArray(),
      storage: "column-major",
      units: "metres",
    },
    image: {
      width: renderer.domElement.width,
      height: renderer.domElement.height,
    },
    mode,
    visibleParts: [...meshes]
      .filter(([, mesh]) => mesh.visible)
      .map(([id]) => id),
    calibration: calibration.visible
      ? {
          cubeSizeMetres: 0.015,
          cubePosition: [0.115, 0.035, 0.08],
          axesOrigin: [0.095, 0.01, 0.08],
          axesLengthMetres: 0.025,
          colours: { x: "red", y: "green", z: "blue" },
          geometry: "independent native Three.js primitives",
        }
      : null,
    review: "diagnostic capture; no automatic visual acceptance",
    sourceBuild: buildStatus,
  };
}
