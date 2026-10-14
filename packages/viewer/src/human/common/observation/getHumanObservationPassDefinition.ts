import type { HumanObservationPass } from "./HumanObservationPass.js";
import type { IHumanObservationPassDefinition } from "./IHumanObservationPassDefinition.js";

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
 * @evidence contracts/common.md#principled-implementation Own-property admission selects one canonical supported pass and returns a copied definition/parameter record; inherited or unknown names refuse instead of becoming a default diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design The table co-locates reading, illumination scope and actual settings; the accessor protects shared data while material installation remains with observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed diagnostic settings are declared product conventions, not fixture appearance adjustments. Albedo refuses unsupported shaders through its owner rather than presenting a guessed base color.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes historically lit flat shading from unlit albedo, and table readings document alpha-card and beauty limits.
 * @evidence contracts/performance.md#efficient-algorithms One dictionary lookup and copies of fixed-size records require constant work and output storage; no scene or image traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical records are shared internally, but copied parameters isolate caller mutation; current pass requests do not share mutable native material instances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The table persists as bounded module data and each return transfers a scalar record copy. No shader program, renderer or task is retained here.
 */
export function getHumanObservationPassDefinition(
  pass: HumanObservationPass,
): IHumanObservationPassDefinition {
  if (!Object.hasOwn(DEFINITIONS, pass))
    throw new Error(`Unknown observation pass "${String(pass)}".`);
  const definition: IHumanObservationPassDefinition = DEFINITIONS[pass];
  return { ...definition, parameters: { ...definition.parameters } };
}
