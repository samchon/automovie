import type { ModernPayload } from "@automovie/website/modern-scene";
import { modernItem } from "./modernItem";

/** Supplies fixed transport camera, lighting and triangle facts for CPU website adaptation. Its memory digest is a fixture identifier and provides no source-byte provenance or native visual certification. */
export function modernPayload(): ModernPayload {
  return {
    subject: "house",
    inspection: false,
    sourceDigest: "memory",
    raster: { width: 800, height: 500, pixelRatio: 1 },
    camera: {
      position: [0, 2, 10],
      target: [0, 2, 0],
      fovDeg: 45,
      near: 0.1,
      far: 100,
    },
    lighting: {
      keyFrom: [0, 1, 1],
      keyIntensity: 3,
      skyColor: 0xffffff,
      groundColor: 0x666666,
      fillIntensity: 1,
      exposure: 1,
    },
    physicalLighting: {
      lights: [],
      environment: {
        background: { r: 0.2, g: 0.3, b: 0.4, a: null, hex: null },
        image: null,
        intensity: 1,
        rotationDeg: 0,
        exposure: 1,
        toneMapping: "acesFilmic",
        shadows: { enabled: true, type: "pcf" },
      },
    },
    items: [modernItem()],
  };
}
