import { humanFaceLowerLashParameters } from "@automovie/human/face/anatomy/lash/humanFaceLowerLashParameters";
import { portraitEyelashParameters } from "@automovie/human/face/anatomy/lash/portraitEyelashParameters";

import { createConnectedPersonOwnerDefaultInputs } from "./createConnectedPersonOwnerDefaultInputs";
import { createConnectedPersonBodyAppearanceInputs } from "./createConnectedPersonBodyAppearanceInputs";
import { createConnectedPersonMaterialInputs } from "./createConnectedPersonMaterialInputs";
import { createConnectedPersonHairInputs } from "./createConnectedPersonHairInputs";
import { createConnectedPersonSkinAppearanceInputs } from "./createConnectedPersonSkinAppearanceInputs";
import type { IConnectedPersonInputCatalogueProps } from "./IConnectedPersonInputCatalogueProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import type { IConnectedPersonParameterSource } from "./IConnectedPersonParameterSource";

/**
 * List the neutral numerical inputs of the person document whose owners
 * publish a descriptor, in the owners' order:
 *
 * - the head view's own face shape channels, with the channel's authoring
 *   envelope (expression channels are motion and are not listed);
 * - the generation's registered head traits, with the registration's unit,
 *   source envelope and qualification;
 * - the upper and lower lash profile parameters of each eye, with the lash
 *   owner's envelopes;
 * - the lid tissue shells and brow shaft populations, from the owners'
 *   published defaults (`createConnectedPersonOwnerDefaultInputs`).
 *
 * Every unit, bound, step and qualification is the owner's. An input whose
 * owner publishes no descriptor is not listed here with invented bounds;
 * `CONNECTED_PERSON_UNDESCRIBED_INPUTS` names those. The lash count carries
 * no descriptor of its own, so its bounds are null.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Lists face shape channels, registered head traits and lash parameters from their owners' descriptors.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Derives the listed controls from the head view and the owners' parameter tables instead of a hand-kept list.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lists the head traits whose one endpoint owner is a body channel.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Gives every listed input the document path the person transaction edits.
 * @author Samchon
 */
export function createConnectedPersonInputCatalogue(props: IConnectedPersonInputCatalogueProps): IConnectedPersonInputDescriptor[] {
  const spaced = (name: string): string => name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const shape = props.face.channels
    .filter((channel) => channel.kind === "shape" && !props.excluded.has(channel.id))
    .map((channel): IConnectedPersonInputDescriptor => ({
      path: ["face", "shape", channel.id],
      group: "Face shape channels",
      label: spaced(channel.id),
      unit: "weight",
      minimum: channel.minimum,
      maximum: channel.maximum,
      step: null,
      ownerDefault: null,
      seed: null,
      omission: "zero, the source neutral",
      removable: true,
      qualification:
        channel.description ??
        "Weight on the basis's authored endpoints; the envelope bounds interpolation of those endpoints, not population anatomy.",
    }));
  const head = (props.headShape?.fields ?? []).map((field): IConnectedPersonInputDescriptor => {
    const parts = field.id.split(".");
    return {
      path: ["headShape", field.id],
      group: "Head traits · " + parts.slice(0, -1).map(spaced).join(" "),
      label: spaced(parts[parts.length - 1]),
      unit: field.unit === "degree" ? "degrees" : "mm",
      minimum: field.minimum,
      maximum: field.maximum,
      step: null,
      ownerDefault: null,
      seed: null,
      omission: "the source neutral",
      removable: true,
      qualification: field.qualification,
    };
  });
  const lashRow = (row: "upper" | "lower", parameters: readonly IConnectedPersonParameterSource[]) =>
    (["left", "right"] as const).flatMap((side): IConnectedPersonInputDescriptor[] => {
      const group = "Lashes · " + row + " " + side;
      const omission = "the whole row is absent together and then keeps the basis's lash cards";
      return [
        {
          path: ["face", "lashes", row, side, "strandCount"],
          group,
          label: "strand count",
          unit: "count",
          minimum: null,
          maximum: null,
          step: 1,
          ownerDefault: null,
          seed: null,
          omission,
          removable: false,
          qualification: "Explicit shaft count; the lash owner publishes no descriptor for it and admits it by its own check.",
        },
        ...parameters.map((parameter): IConnectedPersonInputDescriptor => ({
          path: ["face", "lashes", row, side, parameter.id],
          group,
          label: spaced(parameter.id),
          unit: parameter.unit,
          minimum: parameter.minimum,
          maximum: parameter.maximum,
          step: parameter.step,
          ownerDefault: null,
          seed: null,
          omission,
          removable: false,
          qualification: parameter.meaning + ". " + parameter.effect + " An authoring envelope, not a measured population range.",
        })),
      ];
    });
  const lashes = [...lashRow("upper", portraitEyelashParameters), ...lashRow("lower", humanFaceLowerLashParameters)];
  const materials = [...createConnectedPersonMaterialInputs(props.face.materials, "face"),
    ...(props.body === undefined ? [] : createConnectedPersonMaterialInputs(props.body.materials, "body"))];
  const hair = props.person === undefined ? [] : createConnectedPersonHairInputs(props.face, props.person);
  return [...head, ...lashes, ...createConnectedPersonOwnerDefaultInputs(), ...createConnectedPersonBodyAppearanceInputs(),
    ...materials, ...hair, ...createConnectedPersonSkinAppearanceInputs(props.face), ...shape];
}
