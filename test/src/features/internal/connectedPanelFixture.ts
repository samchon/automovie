import type { IAutoMovieModelCrossing } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { mountConnectedFacePanel } from "@automovie/playground/src/human/connectedPanel";
import { JSDOM } from "jsdom";

import { humanFaceBasisFixture } from "./humanFaceBasisFixture";

/**
 * Pure DOM/transaction fixture for the connected editor. The tiny analytic basis
 * owns numerical admission; opaque bytes independently identify committed models.
 * Injected promises control ordering without timers, files, workers or a GPU.
 */
export function connectedPanelFixture(
  props: {
    studies?: readonly IAutoMovieHumanFaceBasisDocument[];
    /** Crossing readings by document id, standing in for the worker's measure. */
    crossings?: (
      document: IAutoMovieHumanFaceBasisDocument,
    ) => IAutoMovieModelCrossing[] | null;
    build?: (
      document: IAutoMovieHumanFaceBasisDocument,
    ) => Promise<ReturnType<typeof connectedPanelModel>>;
    /** File encoding is independently delayed or refused without changing edits. */
    export?: (
      document: IAutoMovieHumanFaceBasisDocument,
    ) => Promise<Uint8Array<ArrayBuffer>>;
  } = {},
) {
  const source = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(source.basis);
  const dom = new JSDOM("<!doctype html><main id='app'></main>");
  const app = dom.window.document.querySelector<HTMLElement>("#app")!;
  const published: string[] = [],
    disposed: string[] = [],
    views: number[] = [],
    clays: boolean[] = [],
    shadows: boolean[] = [];
  const downloads: { name: string; bytes: BlobPart; mime: string }[] = [];
  let fits = 0,
    cancellations = 0;
  const measurements: boolean[] = [];
  const panel = mountConnectedFacePanel(app, {
    basis: source.basis,
    initial: source.document,
    studies: props.studies,
    presets: [
      { name: "Lift", expression: { lift: 0.5 } },
      { name: "Neutral", expression: {} },
    ],
    viewport: () => ({
      export:
        props.export ?? (async (document) => connectedPanelModel(document).glb),
      build:
        props.build ??
        (async (document, measure) => {
          build(document);
          measurements.push(measure === true);
          return {
            ...connectedPanelModel(document),
            crossings:
              measure === true && props.crossings !== undefined
                ? props.crossings(document)
                : null,
          };
        }),
      cancel: () => {
        ++cancellations;
      },
      publish: (model) => {
        published.push(model.id);
      },
      dispose: (model) => {
        disposed.push(model.id);
      },
      fitView: () => {
        ++fits;
      },
      cameraView: (degrees) => {
        views.push(degrees);
      },
      setClay: (enabled) => {
        clays.push(enabled);
      },
      setShadows: (enabled) => {
        shadows.push(enabled);
      },
    }),
    download: (name, bytes, mime) => {
      downloads.push({ name, bytes, mime });
    },
  });
  const element = <T extends HTMLElement = HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const click = async (id: string): Promise<void> => {
    const node = element(id);
    await node.onclick!.call(
      node,
      new dom.window.MouseEvent("click") as PointerEvent,
    );
  };
  const change = async (id: string, value: string): Promise<void> => {
    const node = element<HTMLInputElement>(id);
    node.value = value;
    await node.onchange!.call(node, new dom.window.Event("change"));
  };
  const file = async (read?: () => Promise<string>): Promise<void> => {
    const node = element<HTMLInputElement>("face-file");
    Object.defineProperty(node, "files", {
      configurable: true,
      value: read === undefined ? [] : [{ text: read }],
    });
    await node.onchange!.call(node, new dom.window.Event("change"));
  };
  return {
    ...source,
    dom,
    app,
    panel,
    element,
    click,
    change,
    file,
    published,
    disposed,
    views,
    clays,
    shadows,
    downloads,
    fits: () => fits,
    cancellations: () => cancellations,
    measurements,
  };
}

/** Unique state receipt for publication/download routing; geometry is tested separately. */
export const connectedPanelModel = (
  document: IAutoMovieHumanFaceBasisDocument,
) => ({
  id: JSON.stringify(document),
  parts: 3,
  glb: new Uint8Array([1, 3, 5]),
});
