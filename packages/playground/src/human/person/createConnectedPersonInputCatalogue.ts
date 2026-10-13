import { humanFaceLowerLashParameters } from "@automovie/human/face/anatomy/lash/humanFaceLowerLashParameters";
import { portraitEyelashParameters } from "@automovie/human/face/anatomy/lash/portraitEyelashParameters";

import type { IConnectedPersonInputCatalogueProps } from "./IConnectedPersonInputCatalogueProps";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";
import type { IConnectedPersonParameterSource } from "./IConnectedPersonParameterSource";
import { createConnectedPersonBodyAppearanceInputs } from "./createConnectedPersonBodyAppearanceInputs";
import { createConnectedPersonFacialHairInputs } from "./createConnectedPersonFacialHairInputs";
import { createConnectedPersonHairInputs } from "./createConnectedPersonHairInputs";
import { createConnectedPersonMaterialInputs } from "./createConnectedPersonMaterialInputs";
import { createConnectedPersonOwnerDefaultInputs } from "./createConnectedPersonOwnerDefaultInputs";
import { createConnectedPersonSkinAppearanceInputs } from "./createConnectedPersonSkinAppearanceInputs";

/**
 * List the neutral numerical inputs of the person document whose owners
 * publish a descriptor:
 *
 * - the head view's own face shape channels, with the channel's authoring
 *   envelope (expression channels are motion and are not listed);
 * - the generation's registered head traits, with the registration's unit,
 *   source envelope and qualification;
 * - the upper and lower lash profile parameters of each eye, with the lash
 *   owner's envelopes;
 * - the lid tissue shells and brow shaft populations, from the owners'
 *   published defaults (`createConnectedPersonOwnerDefaultInputs`);
 * - explicitly authored facial terminal sites, from their profile owner's
 *   numerical domains, without inferring a missing population.
 *
 * Every unit, bound, step and qualification is the owner's. An input whose
 * owner publishes no descriptor is not listed here with invented bounds;
 * `CONNECTED_PERSON_UNDESCRIBED_INPUTS` names those. The lash count carries
 * no descriptor of its own, so its bounds are null.
 *
 * @evidence contracts/common.md#principled-implementation Face shape/registered head/lash/default/material/hair/skin descriptors come from their actual owning tables and current document populations, preserving source qualification, literal path keys and other-owner exclusions.
 * @evidence contracts/common.md#clear-and-simple-design This catalogue composes existing metadata producers while the original owners retain geometric support/validation and the panel owns authored transactions/history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Expression and excluded aliased channels are not offered as independent neutral identity, unpublished count bounds stay null and authoring envelopes do not become observed population anatomy.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies owner descriptor families, source envelopes, population-dependent rows, unlisted metadata gaps and numerical admission ownership.
 * @evidence contracts/performance.md#efficient-algorithms Local passes visit c face channels, h head fields and upper/lower parameter tables once with constant expected excluded Set lookup; composing downstream default/material/hair/skin producers adds their actual metadata, validation and source-domain lookup costs, and concatenation copies O(d) final descriptor references.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One call composes a current source/document catalogue without retaining older rows or their seeds; owner constants are read directly but document-dependent numerical metadata is not treated as a reusable geometry cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary family arrays leave with the call and no cache/native resource is acquired; returned descriptors retain ordinary owner seeds/current population metadata until the mounted catalogue refreshes or closes.
 *
 * @author Samchon
 */
export function createConnectedPersonInputCatalogue(
  props: IConnectedPersonInputCatalogueProps,
): IConnectedPersonInputDescriptor[] {
  const spaced: (name: string) => string = (name: string): string =>
    name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const shape: IConnectedPersonInputDescriptor[] = props.face.channels
    .filter(
      (channel: IConnectedPersonInputCatalogueProps["face"]["channels"][number]): boolean => channel.kind === "shape" && !props.excluded.has(channel.id),
    )
    .map(
      (channel: IConnectedPersonInputCatalogueProps["face"]["channels"][number]): IConnectedPersonInputDescriptor => ({
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
      }),
    );
  const head: IConnectedPersonInputDescriptor[] = (props.headShape?.fields ?? []).map(
    (field: NonNullable<IConnectedPersonInputCatalogueProps["headShape"]>["fields"][number]): IConnectedPersonInputDescriptor => {
      const parts: string[] = field.id.split(".");
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
    },
  );
  const lashRow: (row: "upper" | "lower", parameters: readonly IConnectedPersonParameterSource[]) => IConnectedPersonInputDescriptor[] = (
    row: "upper" | "lower",
    parameters: readonly IConnectedPersonParameterSource[],
  ): IConnectedPersonInputDescriptor[] =>
    (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IConnectedPersonInputDescriptor[] => {
        const group: string = "Lashes · " + row + " " + side;
        const omission: string =
          "the whole row is absent together and then keeps the basis's lash cards";
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
            qualification:
              "Explicit shaft count; the lash owner publishes no descriptor for it and admits it by its own check.",
          },
          ...parameters.map(
            (parameter: IConnectedPersonParameterSource): IConnectedPersonInputDescriptor => ({
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
              qualification:
                parameter.meaning +
                ". " +
                parameter.effect +
                " An authoring envelope, not a measured population range.",
            }),
          ),
        ];
      },
    );
  const lashes: IConnectedPersonInputDescriptor[] = [
    ...lashRow("upper", portraitEyelashParameters),
    ...lashRow("lower", humanFaceLowerLashParameters),
  ];
  const materials: IConnectedPersonInputDescriptor[] = [
    ...createConnectedPersonMaterialInputs(props.face.materials, "face"),
    ...(props.body === undefined
      ? []
      : createConnectedPersonMaterialInputs(props.body.materials, "body")),
  ];
  const hair: IConnectedPersonInputDescriptor[] =
    props.person === undefined
      ? []
      : createConnectedPersonHairInputs(props.face, props.person);
  const facialHair: IConnectedPersonInputDescriptor[] =
    props.person === undefined
      ? []
      : createConnectedPersonFacialHairInputs(props.person);
  return [
    ...head,
    ...lashes,
    ...createConnectedPersonOwnerDefaultInputs(),
    ...createConnectedPersonBodyAppearanceInputs(),
    ...materials,
    ...hair,
    ...facialHair,
    ...createConnectedPersonSkinAppearanceInputs(props.face),
    ...shape,
  ];
}
