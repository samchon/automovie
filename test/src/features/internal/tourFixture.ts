import type { TourData } from "@automovie/website/tour-data";
import { JSDOM } from "jsdom";
import { tourData } from "./tourData";

/** Supplies the existing tour controls through JSDOM for event and text assertions. The caller owns the window; this fixture provides no browser layout, pointer lock or WebGL observations. */
export function tourFixture(): {
  dom: JSDOM;
  document: Document;
  element: <T extends HTMLElement>(selector: string) => T;
  data: TourData;
} {
  const dom: JSDOM = new JSDOM(
    `<h1 id="tour-title"></h1><p id="tour-era"></p><a id="tour-source"></a>
    <button id="panel-toggle"></button><aside id="tour-panel"><input id="view-search"><p id="view-count"></p><div id="view-list"></div></aside>
    <p id="current-view"></p><canvas id="view" tabindex="0"></canvas><button id="reset"></button>`,
    { url: "https://example.org/mounted/tour/" },
  );
  const document: Document = dom.window.document;
  const element: <T extends HTMLElement>(selector: string) => T =
    <T extends HTMLElement>(selector: string): T =>
      document.querySelector<T>(selector)!;
  return { dom, document, element, data: tourData() };
}
