/**
 * Small in-memory tour documents and independently specified camera/mesh inputs
 * for website logic tests. JSDOM supplies events without network or layout;
 * three.js geometry, materials and cameras operate without a WebGL renderer.
 */
import type { ModernPayload } from "@automovie/website/modern-scene";
import type { TourData, TourView } from "@automovie/website/tour-data";
import { JSDOM } from "jsdom";

export const tourView = (id = "outside"): TourView => ({
  id,
  label: id,
  group: "Outside",
  position: [0, 2, 10],
  target: [0, 2, 0],
  fov: 45,
  near: 0.1,
  far: 100,
});
export const tourData = (): TourData => ({
  building: "ancient",
  title: "Place",
  era: "Era",
  initial: "outside",
  source: "https://example.org/source",
  native: {},
  views: [
    tourView(),
    { ...tourView("room"), label: "Reading room", group: "Inside" },
  ],
});
export const tourFixture = () => {
  const dom = new JSDOM(
    `<h1 id="tour-title"></h1><p id="tour-era"></p><a id="tour-source"></a>
    <button id="panel-toggle"></button><aside id="tour-panel"><input id="view-search"><p id="view-count"></p><div id="view-list"></div></aside>
    <p id="current-view"></p><canvas id="view" tabindex="0"></canvas><button id="reset"></button>`,
    { url: "https://example.org/mounted/tour/" },
  );
  const document = dom.window.document;
  const element = <T extends HTMLElement>(selector: string): T =>
    document.querySelector<T>(selector)!;
  return { dom, document, element, data: tourData() };
};
export const modernItem = (): ModernPayload["items"][number] => ({
  id: "part",
  role: "model",
  color: 0x803020,
  position: [2, 3, 4],
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
  indices: [0, 1, 2],
  castShadow: true,
  receiveShadow: false,
});

export const modernPayload = (): ModernPayload => ({
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
});
