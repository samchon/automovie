/**
 * Pure inspection choices for the browser face review harness. The capture
 * page and unit scenarios call these functions with explicitly supplied IDs,
 * pixels, camera values or export records. `resetPortraitWebSubject` alone
 * mutates the supplied scene object's matrix before a bounds read; the other
 * inputs remain caller-owned, and the page owns WebGL resources. The hair ID
 * mask relies on emitted part identity and texture alpha, so its silhouette
 * reflects visible fibres at the capture camera without inferring hair from
 * a rendered colour.
 */
export const portraitWebModes = ["colour", "clay", "wireframe"];

/** Identify numerical hair independently of a subject or material colour. */
export function portraitWebHairMaskPart(id) {
  return id.startsWith("numerical-hair:");
}

/** Keep fibre alpha while making even a black hair texture a white ID mask. */
export function portraitWebHairMaskPixels(rgba) {
  if (rgba.length % 4 !== 0)
    throw new Error("Hair mask needs complete RGBA pixels.");
  const white = new Uint8ClampedArray(rgba.length);
  for (let offset = 0; offset < rgba.length; offset += 4) {
    white[offset] = white[offset + 1] = white[offset + 2] = 255;
    white[offset + 3] = rgba[offset + 3];
  }
  return white;
}

/** Use an externally measured view without silently inventing a missing pose. */
export function portraitWebCapturePose(poses, id, hairMask) {
  const pose = poses?.[id];
  if (
    pose === undefined ||
    pose === null ||
    !Number.isFinite(pose.yaw) ||
    !Number.isFinite(pose.pitch) ||
    Math.abs(pose.yaw) > 180 ||
    Math.abs(pose.pitch) >= 90 ||
    (pose.distance !== undefined &&
      (!Number.isFinite(pose.distance) || pose.distance <= 0)) ||
    (pose.target !== undefined &&
      (pose.target.length !== 3 ||
        pose.target.some((value) => !Number.isFinite(value)))) ||
    (pose.fov !== undefined &&
      (!Number.isFinite(pose.fov) || pose.fov <= 0 || pose.fov >= 180))
  )
    throw new Error(
      "A matched face view needs a finite measured camera pose and frame.",
    );
  return {
    yaw: pose.yaw,
    pitch: pose.pitch,
    hairMask,
    ...(pose.distance === undefined ? {} : { distance: pose.distance }),
    ...(pose.target === undefined ? {} : { target: [...pose.target] }),
    ...(pose.fov === undefined ? {} : { fov: pose.fov }),
  };
}

/** Reset the subject frame before a close camera reads child world bounds. */
export function resetPortraitWebSubject(subject) {
  subject.matrixAutoUpdate = false;
  subject.matrix.identity();
  // Box3.expandByObject updates the child without recomputing its parent.
  // A reference-pose matrix must therefore be propagated away before focus.
  subject.updateMatrixWorld(true);
}

/** Refuse a mixed export rather than labeling old geometry with a new basis. */
export function verifyPortraitWebBasis(expected, actual) {
  for (const key of ["model", "gltf", "profile", "configuration", "input"])
    if (!expected[key] || expected[key] !== actual[key])
      throw new Error(
        `Export is incomplete or changed: ${key}. Reload after export completes.`,
      );
}

/** Camera positions use the export's Y-up metre frame and positive-Z front. */
export function portraitWebCamera(target, distance, yaw, pitch) {
  const azimuth = (yaw * Math.PI) / 180;
  const elevation = (pitch * Math.PI) / 180;
  return [
    target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
    target[1] + distance * Math.sin(elevation),
    target[2] + distance * Math.cos(elevation) * Math.cos(azimuth),
  ];
}

/** Select anatomical camera targets by resident part ids without changing meshes. */
export function portraitWebFocusIds(ids, focus) {
  const patterns = {
    eyes: /eyelids$/,
    nose: /^(nose$|nose-|nasal-|nostril-)/,
    mouth: /^(lips$|oral-cavity$|tooth-)/,
  };
  const pattern = patterns[focus];
  if (pattern === undefined) throw new Error(`Unknown close view: ${focus}`);
  const selected = ids.filter((id) => pattern.test(id));
  if (selected.length === 0)
    throw new Error(`No resident parts for close view: ${focus}`);
  return selected;
}

/** Identify software rasterizers explicitly; an unmasked device name is required. */
export function portraitWebHardwareRenderer(renderer) {
  return (
    renderer.trim().length > 0 &&
    !/swiftshader|llvmpipe|softpipe|software|microsoft basic|warp|unknown/i.test(
      renderer,
    )
  );
}

/** A label is a single directory name, never an arbitrary capture destination. */
export function portraitWebCaptureLabel(label) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(label))
    throw new Error(
      "Capture label must be 1-80 letters, digits, hyphens or underscores.",
    );
  return label;
}

/**
 * Enclose the complete subject box in camera-space depth with a 5% diagonal
 * margin. Recompute after orbit/pan/zoom; a close target must not clip nearby
 * context. The near floor scales with this subject, never with a world unit.
 */
export function portraitWebClip(min, max, eye, forward) {
  if (
    [min, max, eye, forward].some(
      (v) => v.length !== 3 || v.some((n) => !Number.isFinite(n)),
    ) ||
    min.some((n, i) => n > max[i])
  )
    throw new Error(
      "Clip input requires finite ordered XYZ bounds and camera vectors.",
    );
  const length = Math.hypot(...forward);
  if (length === 0 || !Number.isFinite(length))
    throw new Error("Clip camera direction must be finite and nonzero.");
  const extent = Math.max(Math.hypot(...max.map((n, i) => n - min[i])), 1e-6);
  let closest = Infinity;
  let furthest = -Infinity;
  for (let corner = 0; corner < 8; corner++) {
    let depth = 0;
    for (let axis = 0; axis < 3; axis++)
      depth +=
        (((corner & (1 << axis)) === 0 ? min[axis] : max[axis]) - eye[axis]) *
        (forward[axis] / length);
    closest = Math.min(closest, depth);
    furthest = Math.max(furthest, depth);
  }
  const near = Math.max(closest - extent * 0.05, extent / 100000);
  const far = Math.max(furthest + extent * 0.05, near + extent / 1000);
  if (!Number.isFinite(near) || !Number.isFinite(far) || far <= near)
    throw new Error("Clip range must remain representable.");
  return { near, far };
}

/** Coalesce source writes while ensuring at most one exporter can be active. */
export function createPortraitWebBuildGate() {
  let running = false;
  let pending = false;
  return {
    request: () => {
      pending = true;
    },
    start: () => {
      if (running || !pending) return false;
      running = true;
      pending = false;
      return true;
    },
    finish: () => {
      running = false;
      return pending;
    },
  };
}

/** Reproduce render-blender.py's recorded image pose and orthographic crop. */
export function portraitWebReferenceFrame(profile) {
  const { rotation, origin, millimetersPerPixel } = profile.measurement;
  const crop = profile.reference.crop;
  if (
    rotation.length !== 9 ||
    origin.length !== 3 ||
    ![
      ...rotation,
      ...origin,
      millimetersPerPixel,
      crop.x,
      crop.y,
      crop.size,
    ].every(Number.isFinite) ||
    millimetersPerPixel <= 0 ||
    crop.size <= 0
  )
    throw new Error(
      "Reference view requires a finite recorded rotation, origin, scale and crop.",
    );
  const scale = millimetersPerPixel / 1000;
  const x =
    (crop.x + crop.size / 2 - origin[0]) * scale +
    rotation[1] * 0.028 +
    rotation[2] * 0.06;
  const y =
    (-crop.y - crop.size / 2 - origin[1]) * scale +
    rotation[4] * 0.028 +
    rotation[5] * 0.06;
  return {
    target: [x, y, 0],
    position: [x, y, 1],
    span: crop.size * scale,
    matrix: [
      rotation[0],
      rotation[1],
      rotation[2],
      0,
      rotation[3],
      rotation[4],
      rotation[5],
      0,
      rotation[6],
      rotation[7],
      rotation[8],
      0,
      0,
      0,
      0,
      1,
    ],
  };
}

/**
 * Alpha test of an exported material, following the product viewer's
 * `buildMaterial`: `mask` cuts at the material's own `alphaCutoff` (0.5
 * when absent), `blend` and `opaque` do not cut. A record exported before
 * alpha fields were carried (no `alphaMode` key at all) keeps the historical
 * 0.45 so an old census renders as it did.
 */
export function portraitWebAlphaTest(material) {
  if (!Object.hasOwn(material, "alphaMode")) return 0.45;
  const mode =
    material.alphaMode ?? ((material.opacity ?? 1) < 1 ? "blend" : "opaque");
  return mode === "mask" ? (material.alphaCutoff ?? 0.5) : 0;
}
