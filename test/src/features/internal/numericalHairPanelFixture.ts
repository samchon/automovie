import { parseHumanFaceBasisDocument } from "@automovie/human";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "./connectedPanelFixture";
import { numericalHairBasisFixture } from "./numericalHairBasisFixture";

/**
 * Exercise hair controls through the real panel and history, with a typed
 * numerical admission port. Geometry has separate analytic builder scenarios;
 * this DOM fixture makes no render or export-geometry assertion.
 */
export function numericalHairPanelFixture(
  prepare?: (source: ReturnType<typeof numericalHairBasisFixture>) => void,
) {
  const source = numericalHairBasisFixture();
  source.document.hair!.layers[0].count = 0;
  source.basis.surfaces[0].hairDomains!.push({
    id: "secondary",
    origin: [0, 0, 0],
    triangles: [0, 1],
  });
  prepare?.(source);
  const fixture = connectedPanelFixture({
    source,
    build: async (document) => {
      parseHumanFaceBasisDocument(JSON.stringify(document));
      return connectedPanelModel(document);
    },
  });
  return {
    ...fixture,
    check: async (id: string, checked: boolean): Promise<void> => {
      const input = fixture.element<HTMLInputElement>(id);
      input.checked = checked;
      await input.onchange!.call(input, new fixture.dom.window.Event("change"));
    },
  };
}
