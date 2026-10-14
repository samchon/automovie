import type { IAutoMovieScene } from "@automovie/interface";
import { renderFixtureNode } from "./renderFixtureNode";
import { renderFixtureIdentity } from "./renderFixtureIdentity";

/**
 * Five model-referencing nodes and two authored lights, optionally reversed or extended by one unrelated prop.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing semantic-mask and render-budget tests consume these staged nodes and assert order stability, unrelated-node behavior and costs; this helper does not measure them.
 * @evidence contracts/testing.md#independent-expectations Four tower elements and one lantern have explicitly authored model ids; the sun casts one 1024 shadow map and the fill has no shadow declaration, providing independently countable input populations.
 * @evidence contracts/testing.md#distinguishing-cases Default order, reversed order, an extra crate and their combination are caller choices. Each call creates its arrays/nodes/lights while their transforms retain the original shared identity object.
 * @evidence contracts/testing.md#execution-ownership Pure in-memory scene records reached by existing unit entries, with no Three renderer, GPU, native artifact or scenario discovery changes.
 */
export const sceneFixture: (props?: { reversed?: boolean; extra?: boolean; }) => IAutoMovieScene = (props?: {
  /** Stage the nodes in reverse order, to prove order independence. */
  reversed?: boolean;
  /** Add one unrelated prop, to prove an irrelevant edit changes no colour. */
  extra?: boolean;
}): IAutoMovieScene => {
  const nodes: IAutoMovieScene["nodes"] = [
    renderFixtureNode("tower/hall-wall", "wall-model"),
    renderFixtureNode("tower/vault-wall", "wall-model"),
    renderFixtureNode("tower/hall-door-leaf", "door-model"),
    renderFixtureNode("tower/loft-slab", "slab-model"),
    renderFixtureNode("lantern", "prop-model"),
  ];
  if (props?.extra === true) nodes.push(renderFixtureNode("crate", "prop-model"));
  return {
    id: "tower-scene",
    name: null,
    nodes: props?.reversed === true ? [...nodes].reverse() : nodes,
    cameras: [],
    lights: [
      {
        id: "sun",
        type: "directional",
        transform: renderFixtureIdentity,
        color: { r: 1, g: 1, b: 1, a: 1, hex: null },
        intensity: 3,
        castShadow: true,
        shadow: { mapSize: 1024, bias: 0, normalBias: 0, near: 0.1, far: 50 },
      },
      {
        id: "fill",
        type: "point",
        transform: renderFixtureIdentity,
        color: { r: 1, g: 1, b: 1, a: 1, hex: null },
        intensity: 1,
        range: 0,
      },
    ],
  };
};
