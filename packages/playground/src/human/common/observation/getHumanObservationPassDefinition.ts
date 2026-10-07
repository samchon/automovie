import type { HumanObservationPass } from "./HumanObservationPass";
import type { IHumanObservationPassDefinition } from "./IHumanObservationPassDefinition";

/** The material and reading belong together so display clients cannot rename a diagnostic. */
const DEFINITIONS: Record<
  HumanObservationPass,
  IHumanObservationPassDefinition
> = {
  beauty: {
    reading:
      "lit product frame: judges shape and material under the authored lights",
    lightScope: "authored",
    parameters: {},
  },
  clay: {
    reading:
      "lit single-material frame: judges shape without material colour; alpha cards are opaque structural surfaces, not tissue",
    lightScope: "authored",
    parameters: {},
  },
  normal: {
    reading:
      "surface normals as colour: judges orientation and smoothness, not light or material; alpha cards are opaque structural surfaces, not tissue",
    lightScope: "none",
    parameters: { side: 2 },
  },
  depth: {
    reading:
      "depth as grey: judges relief order over the subject bounding sphere, not material; alpha cards are opaque structural surfaces, not tissue",
    lightScope: "none",
    parameters: { side: 2 },
  },
  flat: {
    reading:
      "lit grey faceted surface: judges triangle orientation and tessellation under the authored lights, not material colour; alpha cards are opaque structural surfaces, not tissue",
    lightScope: "authored",
    parameters: {
      color: 0x999999,
      roughness: 0.75,
      flatShading: true,
      side: 2,
    },
  },
  albedo: {
    reading:
      "unlit authored base colour, texture, vertex colour and alpha: judges material regions, not shape, lighting, roughness, specular, emissive or transmission; unsupported shaders refuse",
    lightScope: "none",
    parameters: { toneMapped: false },
  },
  wire: {
    reading:
      "all triangle edges; empty triangle interiors let rear edges show through: judges mesh density and topology, not silhouette or surface order",
    lightScope: "none",
    parameters: { color: 0xdddddd, wireframe: true, side: 2 },
  },
  outline: {
    reading:
      "white surface with a dark silhouette and occlusion rim: judges contour boundaries, not interior shape or material; alpha cards are opaque structural surfaces, not tissue",
    lightScope: "none",
    parameters: { color: 0xffffff, side: 2 },
  },
};

/**
 * Resolve the shared diagnostic meaning and actual Three material parameters.
 * `flat` retains its historical lit grey faceted rendering; `albedo` explicitly
 * asks for authored base colour without illumination or tone mapping.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Distinguishes material readings from geometric observations in face review.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps the material parameters and their observation limits on one current-source owner.
 */
export function getHumanObservationPassDefinition(
  pass: HumanObservationPass,
): IHumanObservationPassDefinition {
  if (!Object.hasOwn(DEFINITIONS, pass))
    throw new Error(`Unknown observation pass "${String(pass)}".`);
  const definition = DEFINITIONS[pass];
  return { ...definition, parameters: { ...definition.parameters } };
}
