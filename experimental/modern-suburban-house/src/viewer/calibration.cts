/**
 * Hand-typed calibration scene for the first GPU inspection.
 *
 * Responsibility: settings `renderer-boundary` requires a manual calibration
 * shape to be viewed in inspection mode before any building frame, so axes,
 * scale, depth, lighting and shadow direction are confirmed on the real
 * WebGL path first. This module is that shape. It is not a house and not a
 * stand-in for one; it carries no spatial decision of the production.
 *
 * Entry point: `buildCalibrationScene(sourceDigest)`, called by `server.cts`
 * for `GET /scene`. Output: one `IViewerScene` value, built fresh per request.
 *
 * Every mesh comes from the engine's public `tessellateToMesh`, loaded through
 * the CommonJS boundary settings `execution-boundary` fixes, so this scene
 * also proves that the server can read `@automovie/engine` as the house
 * source will later need. Engine boxes are centred on their origin; each item
 * is lifted by half its height so it rests on Y = 0.
 *
 * Fixtures and their basis:
 * - three axis bars 3 m long with caps and 1 m / 2 m ticks: +X right when
 *   seen from the front, +Y up, +Z toward the front walk (settings
 *   `coordinate-units`);
 * - a 1 m reference cube behind and left of the origin;
 * - the settings `use-profile` person occupancy box, 0.60 m wide, 0.45 m deep
 *   and 1.90 m tall, as a human-scale reference;
 * - a thin ground slab that receives shadows.
 *
 * Lighting follows settings `lighting-state`: the key light comes from the
 * front-left above, so shadows must fall toward the back-right (+X, -Z). The
 * camera follows settings `frame-condition` for an exterior view: eye height
 * 1.6 m, vertical field of view 45°, raster 1536 × 1024 at pixel ratio 1.
 */
import { tessellateToMesh } from "@automovie/engine";
import type { AutoMoviePrimitiveShape } from "@automovie/interface";

import type { IViewerScene, IViewerSceneItem } from "./scenePayload";

/** Axis colors: X red, Y green, Z blue, the usual inspection convention. */
const AXIS_COLORS = { x: 0xd23c32, y: 0x3aa655, z: 0x3a6fd9 } as const;

/** Axis bar length and cross-section, meters. */
const AXIS_LENGTH = 3;
const AXIS_THICKNESS = 0.06;

/** Place one engine primitive as a scene item. */
const item = (
  id: string,
  role: IViewerSceneItem["role"],
  color: number,
  shape: AutoMoviePrimitiveShape,
  position: [number, number, number],
  castShadow: boolean,
): IViewerSceneItem => {
  const mesh = tessellateToMesh(shape);
  if (mesh.normals === null || mesh.indices === null)
    throw new Error(
      `calibration item ${id}: engine mesh lacks normals or indices`,
    );
  return {
    id,
    role,
    color,
    position,
    positions: mesh.positions,
    normals: mesh.normals,
    indices: mesh.indices,
    castShadow,
    receiveShadow: true,
  };
};

/** An axis-aligned box resting on Y = 0 at the given plan centre. */
const restingBox = (
  id: string,
  role: IViewerSceneItem["role"],
  color: number,
  size: { width: number; height: number; depth: number },
  x: number,
  z: number,
): IViewerSceneItem =>
  item(
    id,
    role,
    color,
    { type: "box", ...size },
    [x, size.height / 2, z],
    true,
  );

/** Bars, caps and ticks for the three positive axes. */
const axisItems = (): IViewerSceneItem[] => {
  const t = AXIS_THICKNESS;
  const half = AXIS_LENGTH / 2;
  const cap = 0.2;
  const tick = 0.12;
  const result: IViewerSceneItem[] = [
    item("axis-x", "axis", AXIS_COLORS.x, { type: "box", width: AXIS_LENGTH, height: t, depth: t }, [half, t / 2, 0], true),
    item("axis-y", "axis", AXIS_COLORS.y, { type: "box", width: t, height: AXIS_LENGTH, depth: t }, [0, half, 0], true),
    item("axis-z", "axis", AXIS_COLORS.z, { type: "box", width: t, height: t, depth: AXIS_LENGTH }, [0, t / 2, half], true),
    item("axis-x-cap", "axis", AXIS_COLORS.x, { type: "box", width: cap, height: cap, depth: cap }, [AXIS_LENGTH, cap / 2, 0], true),
    item("axis-y-cap", "axis", AXIS_COLORS.y, { type: "box", width: cap, height: cap, depth: cap }, [0, AXIS_LENGTH, 0], true),
    item("axis-z-cap", "axis", AXIS_COLORS.z, { type: "box", width: cap, height: cap, depth: cap }, [0, cap / 2, AXIS_LENGTH], true),
  ];
  for (const meter of [1, 2]) {
    const cube = { type: "box", width: tick, height: tick, depth: tick } as const;
    result.push(
      item(`tick-x-${meter}`, "tick", AXIS_COLORS.x, cube, [meter, tick / 2, 0], true),
      item(`tick-y-${meter}`, "tick", AXIS_COLORS.y, cube, [0, meter, 0], true),
      item(`tick-z-${meter}`, "tick", AXIS_COLORS.z, cube, [0, tick / 2, meter], true),
    );
  }
  return result;
};

/**
 * Build the calibration scene.
 *
 * @param sourceDigest Digest of the production source the server read; the
 *   client shows it in inspection mode so a capture names its basis.
 */
export function buildCalibrationScene(sourceDigest: string): IViewerScene {
  return {
    subject: "calibration",
    inspection: true,
    sourceDigest,
    raster: { width: 1536, height: 1024, pixelRatio: 1 },
    camera: {
      position: [5.5, 1.6, 7.5],
      target: [0, 1, 0],
      fovDeg: 45,
      near: 0.05,
      far: 200,
    },
    lighting: {
      keyFrom: [-4, 6, 5],
      keyIntensity: 3,
      skyColor: 0xdfe8f2,
      groundColor: 0x8a7f6e,
      fillIntensity: 0.8,
      exposure: 1,
    },
    items: [
      item("ground", "ground", 0xb8b8b0, { type: "box", width: 10, height: 0.02, depth: 10 }, [0, -0.01, 0], false),
      ...axisItems(),
      restingBox("reference-cube", "reference", 0xeeeeee, { width: 1, height: 1, depth: 1 }, -2, -2),
      restingBox("person-occupancy", "reference", 0xc9b89a, { width: 0.6, height: 1.9, depth: 0.45 }, 2, -2),
    ],
  };
}
