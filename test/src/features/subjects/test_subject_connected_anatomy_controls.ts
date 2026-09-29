import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";
import { mountConnectedFaceControls } from "@automovie/playground/src/human/connectedControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * The anatomical display locates both kinds of channel without changing the
 * connected document's canonical flat coordinates.
 */
export const test_subject_connected_anatomy_controls =
  async (): Promise<void> => {
    const source = humanFaceBasisFixture();
    const tree: IAutoMovieHumanFaceComponentTree = {
      basis: source.basis.id,
      root: {
        id: "face",
        label: "Face",
        description: "Connected skin and its owned analytic controls.",
        channels: ["width"],
        surfaces: ["square"],
        documentFields: ["materials", "skin"],
        children: [
          {
            id: "eye",
            label: "Eye",
            description: "Attached performance.",
            channels: ["lift"],
            surfaces: ["attachment"],
            documentFields: ["iris"],
            children: [],
          },
          {
            id: "hair",
            label: "Hair",
            description: "Procedural appearance field.",
            channels: [],
            surfaces: [],
            documentFields: ["hair"],
            children: [],
          },
        ],
      },
    };
    const dom = new JSDOM(
      "<main><select id='control-kind'><option value='shape'>Shape</option><option value='expression'>Expression</option></select><p id='control-help'></p><div id='basis-controls'></div></main>",
    );
    const app = dom.window.document.querySelector<HTMLElement>("main")!;
    let document = structuredClone(source.document);
    const controls = mountConnectedFaceControls(app, {
      basis: source.basis,
      components: tree,
      document: () => document,
      change: async (next) => {
        document = next;
        controls.refresh();
      },
      refuse: (error) => {
        throw error;
      },
    });
    controls.refresh();
    TestValidator.predicate(
      "shape is inside whole face",
      app.querySelector('[data-component="face"] #control-width') !== null,
    );
    TestValidator.equals(
      "appearance-only group stays out of fine controls",
      app.querySelector('[data-component="hair"]'),
      null,
    );
    const search = app.querySelector<HTMLInputElement>("#control-search")!;
    search.value = "eye";
    search.oninput!.call(search, new dom.window.InputEvent("input"));
    TestValidator.equals(
      "shape search hides unrelated group",
      app.querySelectorAll(".row").length,
      0,
    );
    const kind = app.querySelector<HTMLSelectElement>("#control-kind")!;
    kind.value = "expression";
    kind.onchange!.call(kind, new dom.window.Event("change"));
    TestValidator.predicate(
      "expression is nested under eye",
      app.querySelector('[data-component="eye"] #control-lift') !== null,
    );
    TestValidator.equals(
      "group label search finds lift",
      app.querySelectorAll(".row").length,
      1,
    );
    TestValidator.equals(
      "navigation preserves document",
      document,
      source.document,
    );
    const number = app.querySelector<HTMLInputElement>("#control-lift")!;
    number.value = "0.2";
    await number.onchange!.call(number, new dom.window.Event("change"));
    TestValidator.equals(
      "flat expression survives nested edit",
      document.expression,
      {
        lift: 0.2,
      },
    );
    TestValidator.equals("shape remains untouched", document.shape, {});
    dom.window.close();
  };
