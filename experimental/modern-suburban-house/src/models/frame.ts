/** Fixed model inspection views from docs/models/00-model-frame.md; metres, Y up. */
import {
  type IViewerModelInputs,
  lowerViewerModels,
} from "../viewer/modelScene.cjs";
import type { IViewerScene } from "../viewer/scenePayload";
import { sectionCaps } from "../viewer/sectionCaps";
import { FittingParts } from "./furnishings/geometry";

/** View poses preserve source geometry, metric UVs and physical size. */
export class Frame {
  public build(
    input: IViewerModelInputs,
    id: string,
    view: "front" | "side" | "diagonal",
    overlay: boolean,
    sourceDigest: string,
    boundsInput?: IViewerModelInputs,
  ): IViewerScene {
    const prototype = input.prototypes.find((p) => p.model.id === id);
    if (prototype === undefined) throw Error(`unknown review model: ${id}`);
    const yaw = prototype.reviewYaw ?? 0;
    const items = lowerViewerModels({
      batchRepetitions: false,
      prototypes: [prototype],
      instances: [
        {
          id: "review",
          modelId: id,
          transform: {
            rotation: {
              x: 0,
              y: Math.sin(yaw / 2),
              z: 0,
              w: Math.cos(yaw / 2),
            },
          },
        },
      ],
      finishes: input.finishes,
    });
    const boundPrototype = boundsInput?.prototypes.find(
      (p) => p.model.id === id,
    );
    const boundItems =
      boundPrototype === undefined
        ? []
        : lowerViewerModels({
            batchRepetitions: false,
            prototypes: [boundPrototype],
            instances: [
              {
                id: "bounds",
                modelId: id,
                transform: {
                  rotation: {
                    x: 0,
                    y: Math.sin(yaw / 2),
                    z: 0,
                    w: Math.cos(yaw / 2),
                  },
                },
              },
            ],
            finishes: boundsInput!.finishes,
          });
    const allBounds = [...items, ...boundItems];
    const low = [Infinity, Infinity, Infinity],
      high = [-Infinity, -Infinity, -Infinity];
    for (const item of allBounds)
      for (let k = 0; k < item.positions.length; k++) {
        const axis = k % 3;
        low[axis] = Math.min(low[axis]!, item.positions[k]!);
        high[axis] = Math.max(high[axis]!, item.positions[k]!);
      }
    if (!low.every(Number.isFinite)) throw Error(`empty review model: ${id}`);
    const width = high[0]! - low[0]!,
      height = high[1]! - low[1]!,
      depth = high[2]! - low[2]!;
    const centre = [
      (high[0]! + low[0]!) / 2,
      low[1]!,
      (high[2]! + low[2]!) / 2,
    ];
    const faces = [...new Set(items.map((i) => i.faceId!))].sort((a, b) =>
      a.localeCompare(b, "en"),
    );
    for (const item of items) {
      item.positions = item.positions.map((n, k) => n - centre[k % 3]!);
      if (overlay) {
        item.inspectionFace = true;
        item.color =
          Math.imul(faces.indexOf(item.faceId!) + 1, 0x9e3779) & 0xffffff;
        item.texture = undefined;
        item.metalness = 0;
        item.roughness = 1;
        item.transmission = 0;
        item.opacity = 1;
      }
    }
    for (const item of boundItems)
      item.positions = item.positions.map((n, k) => n - centre[k % 3]!);
    if (view === "side") items.push(...sectionCaps(items));
    const scale = new FittingParts();
    const x = view === "side" ? -width / 2 - 0.65 : width / 2 + 0.65,
      z = view === "side" ? depth / 2 + 0.7 : 0;
    scale.box("person-occupancy", "occupancy", [
      x - 0.3,
      x + 0.3,
      0,
      1.9,
      z - 0.225,
      z + 0.225,
    ]);
    const built = scale.finish("review-person-occupancy");
    const scaleItems = lowerViewerModels({
      prototypes: [built],
      instances: [{ id: "reference", modelId: built.model.id, transform: {} }],
      finishes: { occupancy: { color: 0x9a9a9a, roughness: 1, metalness: 0 } },
    });
    for (const item of scaleItems) item.role = "reference";
    items.push(...scaleItems);
    let span =
      Math.max(
        height,
        1.9,
        (view === "side" ? depth + 1.2 : width + 1.2) / (1536 / 1024),
      ) * 1.2;
    const targetY = Math.max(height, 1.9) / 2;
    if (view !== "diagonal") {
      // Orthographic framing must include the real scale reference as well
      // as both articulation bounds, not an estimated padding on the model.
      for (const item of [...items, ...boundItems])
        for (let k = 0; k < item.positions.length; k += 3)
          span = Math.max(
            span,
            (2 * Math.abs(item.positions[k + (view === "front" ? 0 : 2)]!)) /
              ((1536 / 1024) * 0.9),
            (2 * Math.abs(item.positions[k + 1]! - targetY)) / 0.9,
          );
    }
    let distance =
      Math.max(span / (2 * Math.tan(Math.PI / 8)), depth + width) * 1.25;
    if (view === "diagonal") {
      // The near occupancy reference can project larger than the model. Fit
      // both actual meshes while retaining the declared 1.6 m eye height.
      const fits = (d: number): boolean => {
        const dy = targetY - 1.6,
          length = Math.hypot(d, dy),
          s = Math.SQRT1_2,
          t = Math.tan(Math.PI / 8);
        for (const item of [...items, ...boundItems])
          for (let k = 0; k < item.positions.length; k += 3) {
            const x = item.positions[k]! - d * s,
              y = item.positions[k + 1]! - 1.6,
              z = item.positions[k + 2]! - d * s;
            const forward = (-d * s * x + dy * y - d * s * z) / length;
            const right = (x - z) * s,
              up = (dy * s * (x + z) + d * y) / length;
            if (
              forward <= 0.05 ||
              Math.abs(right) > forward * t * (1536 / 1024) * 0.9 ||
              Math.abs(up) > forward * t * 0.9
            )
              return false;
          }
        return true;
      };
      while (!fits(distance)) distance *= 1.1;
    }
    return {
      subject: "model-review",
      inspection: true,
      sourceDigest,
      raster: { width: 1536, height: 1024, pixelRatio: 1 },
      camera: {
        position:
          view === "front"
            ? [0, targetY, distance]
            : view === "side"
              ? [distance, targetY, 0]
              : [distance / Math.SQRT2, 1.6, distance / Math.SQRT2],
        target: [0, targetY, 0],
        fovDeg: 45,
        near: 0.05,
        far: Math.max(300, distance + span * 5),
        orthographicSpan: view === "diagonal" ? undefined : span,
      },
      lighting: {
        keyFrom: [-4, 6, 5],
        keyTarget: [0, 0, 0],
        keyIntensity: 2,
        skyColor: 0xffffff,
        groundColor: 0xffffff,
        fillIntensity: 1,
        exposure: 1,
        shadowHalfExtent: 12,
      },
      items,
      modelReview: {
        id,
        view,
        overlay,
        faces,
        models: input.prototypes.map((p) => p.model.id),
      },
      sectionX: view === "side" ? 0 : undefined,
    };
  }
}
