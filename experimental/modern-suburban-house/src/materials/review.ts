/** Seven source-bound sphere/plate rows per page from the active building catalogue. */
import {
  linearColorToSrgbHex,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { FittingParts } from "../models/furnishings/geometry";
import { HouseLighting } from "../systems/lighting";
import type { IViewerScene, IViewerSceneItem } from "../viewer/scenePayload";
import type { HouseFinish } from "./finish";
import { buildingFinishes } from "./model-bindings";

/** Each pair uses the exact authored optical fields and texture module. */
export class MaterialReview {
  public build(
    page: number,
    mode: "neutral" | "baseline",
    sourceDigest: string,
  ): IViewerScene {
    const rows = buildingFinishes.slice(page * 7, page * 7 + 7);
    if (!Number.isInteger(page) || page < 0 || rows.length === 0)
      throw Error(`unknown material page: ${page}`);
    const items: IViewerSceneItem[] = [];
    const add = (
      finish: HouseFinish,
      shape: "sphere" | "plate",
      y: number,
    ): void => {
      const planarMirror = shape === "plate" && finish.faces.includes("mirror");
      const source = (() => {
        if (planarMirror) {
          // The authored mirror's producer emits its actual front plane first.
          // Keep that semantic face so the same native planar reflection path
          // consumes both the building mirror and its inspection plate.
          const parts = new FittingParts();
          parts.box(
            "sample",
            "mirror",
            [-0.25, 0.25, -0.25, 0.25, -0.0075, 0.0075],
          );
          const geometry =
            parts.finish("material-sample").model.parts[0]!.geometry;
          if (geometry.type !== "mesh")
            throw Error("material plate producer is not a mesh");
          return geometry.mesh;
        }
        return shape === "sphere"
          ? tessellateToMesh({ type: "sphere", radius: 0.25 })
          : tessellateToMesh({
              type: "box",
              width: 0.5,
              height: 0.5,
              depth: 0.015,
            });
      })();
      const mesh: IAutoMovieMesh = transformAutoMovieMesh(source, {
        translation: { x: shape === "sphere" ? -0.35 : 0.35, y, z: 0 },
      });
      const material = finish.material,
        tile = finish.texture?.metres;
      // Native primitive tessellation intentionally has no UVs. The sample
      // owner supplies metre coordinates without altering the finish module.
      const uv: number[] = [];
      for (let k = 0; k < source.positions.length; k += 3) {
        const x = source.positions[k]!,
          sy = source.positions[k + 1]!,
          z = source.positions[k + 2]!;
        let u: number, v: number;
        if (shape === "sphere") {
          const angle = Math.atan2(z, x);
          u = (angle < 0 ? angle + 2 * Math.PI : angle) * 0.25;
          v = Math.acos(Math.max(-1, Math.min(1, sy / 0.25))) * 0.25;
        } else {
          const n = source.normals!.slice(k, k + 3).map(Math.abs);
          [u, v] =
            n[0]! > n[1]! && n[0]! > n[2]!
              ? [z, sy]
              : n[1]! > n[2]!
                ? [x, z]
                : [x, sy];
        }
        uv.push(u / (tile?.[0] ?? 1), v / (tile?.[1] ?? 1));
      }
      items.push({
        id: `${material.id}/${shape}`,
        role: "model",
        faceId: planarMirror ? "mirror" : `sample:${material.id}`,
        color:
          finish.texture === undefined
            ? Number.parseInt(
                linearColorToSrgbHex(material.baseColor).slice(1),
                16,
              )
            : 0xffffff,
        roughness: material.roughness,
        metalness: material.metallic,
        opacity: material.opacity,
        transmission: material.transmission,
        ior: material.ior,
        thickness: material.thickness,
        doubleSided: material.doubleSided,
        texture:
          finish.texture === undefined
            ? undefined
            : `/textures/${finish.texture.file}`,
        uvs: uv,
        positions: mesh.positions,
        normals: mesh.normals!,
        indices: mesh.indices!,
        position: [0, 0, 0],
        castShadow: false,
        receiveShadow: false,
      });
    };
    for (const [i, finish] of rows.entries()) {
      const y = (rows.length - 1 - i) * 0.7;
      add(finish, "sphere", y);
      add(finish, "plate", y);
    }
    const centre = ((rows.length - 1) * 0.7) / 2;
    return {
      subject: "material-review",
      inspection: true,
      sourceDigest,
      raster: { width: 1536, height: 1024, pixelRatio: 1 },
      camera: {
        position: [0, centre, 8],
        target: [0, centre, 0],
        fovDeg: 45,
        near: 0.05,
        far: 100,
        orthographicSpan: Math.max(1, (rows.length - 1) * 0.7 + 0.5) * 1.2,
      },
      lighting: {
        keyFrom: [-4, 6, 5],
        keyTarget: [0, centre, 0],
        keyIntensity: 2,
        skyColor: 0xffffff,
        groundColor: 0xffffff,
        fillIntensity: 1,
        exposure: 1,
      },
      physicalLighting:
        mode === "baseline" ? new HouseLighting().build() : undefined,
      items,
      materialReview: {
        page,
        mode,
        total: buildingFinishes.length,
        rows: rows.map((f) => f.material.id),
      },
    };
  }
}
