import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { GOAL_BANDS } from "./GOAL_BANDS";
import type { createGoal } from "./createGoal";

/** Model coordinates in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * The recorded profiles, draw and shared post contacts for goal and net producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the original goal draw namespace and the model record it preserves.
 * @evidence contracts/development/design.md#principled-representation Keeps dimensions in metres and mass in kilograms with the original per-kind bands and provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One draw and its tables serve the public producers and the saved-recipe dispatcher.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The same draw records bands, fixed figures and model choices.
 */
export namespace GoalBuild {
  /** The recorded dimension units, metres for lengths and kilograms for mass. */
  export const UNITS: Readonly<
    Record<createGoal.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    bar: "m",
    board: "m",
    thickness: "m",
    ring: "m",
    offset: "m",
    post: "m",
    mass: "kg",
  };

  /** The display names retained from the saved goal dispatcher. */
  export const NAMES: Readonly<Record<createGoal.Kind, string>> = {
    footballGoal: "football goal",
    fieldHockeyGoal: "field hockey goal",
    iceHockeyGoal: "ice hockey goal",
    lacrosseGoal: "lacrosse goal",
    handballGoal: "handball goal",
    basketballHoop: "basketball hoop",
    volleyballNet: "volleyball net",
    tennisNet: "tennis net",
  };

  /** The fixed FIVB top heights for the men's and women's volleyball nets. */
  export const NETS: Readonly<
    Partial<
      Record<
        createGoal.Kind,
        Readonly<
          Record<
            createGoal.Net,
            Readonly<Partial<Record<createGoal.Dimension, number>>>
          >
        >
      >
    >
  > = {
    volleyballNet: { men: { height: 2.43 }, women: { height: 2.24 } },
  };
  /** The bands declared for the original goal and net kinds. */
  export const BANDS: typeof GOAL_BANDS = GOAL_BANDS;

  /**
   * What {@link draw} prepares for its caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the builder and the drawn dimensions draw returns, in the family's recorded units.
   * @evidence contracts/development/design.md#principled-representation The builder typed by the caller's contact ids and the draw's own dimension record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the named producers read after draw.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is optional where every call sets it.
   */
  export interface IDrawResult<Id extends createGoal.Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, createGoal.Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<createGoal.Dimension, number>>;
  }

  /**
   * Draw the supplied profile with its original goal seed and prepare a builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the compatibility draw and the local model it fills.
   * @evidence contracts/development/implementation.md#principled-implementation Admit the model class before dimensions. Overlay the class figures after the band draws and preserve the name for that class.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keep draw and model assembly together, separate from shape construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserve the published parameter checks and contact conventions.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw pass over the profile's bands and one construction pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the bands, volleyball class, and namespace across each goal and net.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function draw<Id extends createGoal.Affordance>(
    kind: createGoal.Kind,
    params: Readonly<Omit<createGoal.IParams, "kind">>,
    seed: number | string | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<createGoal.Dimension> =
      new AutoMovieArchetypeDrawSession("goal", UNITS, seed, params);
    const net: AutoMovieArchetypeDrawSession.IModel<
      createGoal.Net,
      createGoal.Dimension
    > = draw.model("net", params.net, NETS[kind]);
    const d: Partial<Record<createGoal.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...net.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, createGoal.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name:
          net.name === undefined ? NAMES[kind] : `${net.name}'s ${NAMES[kind]}`,
        draw,
      });
    return { builder, d };
  }

  /**
   * Declare both post contacts at the drawn height and original lateral positions.
   *
   * @param builder The goal or net builder that receives both bar contacts.
   * @param x The lateral distance to each post centre, in metres.
   * @param height The graspable height of each post measured from the floor, in metres.
   * @param aperture The post section in metres for a square bar. Omit it for a round post.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the contact's section and where each bar is centred in the goal plane.
   * @evidence contracts/development/implementation.md#principled-implementation Attach bar frames to the post centrelines with each post section determining its symmetry and aperture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Declare the two symmetric posts with one loop and a shared frame constructor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the given height and section for the post rather than deriving a contact from the net.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The fixed pair requires two bar records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Field goals, volleyball nets and tennis nets share the post frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function posts(
    builder: AutoMovieArchetypeBuilder<
      createGoal.Affordance,
      createGoal.Dimension
    >,
    x: number,
    height: number,
    aperture?: number,
  ): void {
    for (const [id, sign] of [
      ["leftPost", 1],
      ["rightPost", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "bar",
        symmetry: aperture === undefined ? "round" : "half",
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * x, height / 2, 0),
          v(0, 0, 1),
          v(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        ...(aperture === undefined ? {} : { aperture }),
        length: height,
      });
  }
}
