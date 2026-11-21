import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { StageCarrierConstruction } from "./StageCarrierConstruction";
import type { createHolster } from "./createHolster";

/**
 * Worn belt holster silhouette.
 *
 * A separate little carrier with a raised or lowered socket and a wearer-facing belt hook.
 *
 * @param params The scene id, optional display dimensions and this carrier's own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the wearable model origin and the model-space stage contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original silhouette geometry and the costume contact required by this form.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves a model through shared carrier admission, then builds only this shape and its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageHolster(
  params: createStageHolster.IParams = {},
  seed?: number | string,
): Archetype<createStageHolster.Affordance, createStageHolster.Dimension> {
  return StageCarrierConstruction("holster", params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    builder.box("loop", v(0.01, 0.06, 0.06), v(0, 0, 0), {
      color: "#2c2f33",
    });
    builder.box(
      "pouch",
      v(0.04, d.depth!, 0.07),
      v(0.025, d.ride! - d.depth! / 2, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "socket",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0.025, d.ride!, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: StageCarrierConstruction.facingWearer(v(0, 0, 0)),
      extent: null,
    });
  });
}

/**
 * Authoring options for {@link createStageHolster}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageHolster {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "mass" | "ride";

  /**
   * The createHolster contact set its shared construction types. This producer builds belt, socket.
   */
  export type Affordance = createHolster.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "depth" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: createHolster.Ride;
  }
}
