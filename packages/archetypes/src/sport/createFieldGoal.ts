import { Vector3 } from "@automovie/engine";

import type { Archetype, ArchetypeBuilder } from "../core";
import { ArchetypeDraw, ArchetypeFrame } from "../core";
import { GoalBuild } from "./GoalBuild";
import type { createGoal } from "./createGoal";

/** The builder for this field or court apparatus. */
type Builder = ArchetypeBuilder<
  createFieldGoal.Affordance,
  createGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<createGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * A rectangular field, court or ice goal with a scoring opening.
 *
 * Two posts and a crossbar stand in the XY plane. The field faces +Z, and mouth marks the scoring aperture.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build the post and crossbar sections from the sport's goal-mouth measurements.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use round profiles for ice hockey and lacrosse and square profiles for the other goals. This frame has no net.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createFieldGoal(
  params: createFieldGoal.IParams = {},
  seed?: number | string,
): Archetype<createFieldGoal.Affordance, createGoal.Dimension> {
  const kind: createFieldGoal.Kind = ArchetypeDraw.choice(
    "goal",
    "kind",
    params.kind === undefined ? "footballGoal" : params.kind,
    createFieldGoal.KINDS,
  );

  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<createFieldGoal.Affordance>> =
    GoalBuild.draw(kind, params, seed);
  rectangularGoal(
    builder,
    d,
    kind === "iceHockeyGoal" || kind === "lacrosseGoal",
  );
  return builder.build(d.mass!);
}

/**
 * Build two posts and a crossbar around the scoring opening. Field goals and handball use square sections, while ice hockey and lacrosse use pipes. The mouth lies in the goal plane.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 * @param round Whether the frame uses pipes.
 */
function rectangularGoal(builder: Builder, d: Drawn, round: boolean): void {
  const half: number = d.width! / 2;
  const height: number = d.height!;
  const bar: number = d.bar!;
  const x: number = half + bar / 2;
  const color: string = round ? "#d53635" : "#f7f7f7";
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const) {
    if (round)
      builder.rod(
        id,
        bar / 2,
        v(sign * x, 0, 0),
        v(sign * x, height + bar / 2, 0),
        { color },
      );
    else
      builder.box(
        id,
        v(bar, height + bar, bar),
        v(sign * x, (height + bar) / 2, 0),
        { color },
      );
  }
  if (round)
    builder.rod(
      "crossbar",
      bar / 2,
      v(-x, height + bar / 2, 0),
      v(x, height + bar / 2, 0),
      { color },
    );
  else
    builder.box(
      "crossbar",
      v(d.width! + 2 * bar, bar, bar),
      v(0, height + bar / 2, 0),
      { color },
    );
  builder.affordance({
    id: "crossbar",
    kind: "bar",
    symmetry: round ? "round" : "half",
    frame: ArchetypeFrame.facing(
      v(0, height + bar / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: bar,
    length: d.width! + 2 * bar,
  });
  GoalBuild.posts(builder, x, height, bar);
  builder.affordance({
    id: "mouth",
    kind: "aperture",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.width!,
    height,
  });
}

/**
 * The authored parameters and contact names for {@link createFieldGoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each affordance belongs to the constructed goal or net. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createFieldGoal {
  /** The contact identifiers for the apparatus. */
  export type Affordance = "crossbar" | "mouth" | "leftPost" | "rightPost";

  /** Goals of the same rectangular frame family, in catalogue order. */
  export const KINDS: readonly Kind[] = [
    "footballGoal",
    "fieldHockeyGoal",
    "iceHockeyGoal",
    "lacrosseGoal",
    "handballGoal",
  ];

  /** The sport that supplies the geometry and bands. */
  export type Kind =
    | "footballGoal"
    | "fieldHockeyGoal"
    | "iceHockeyGoal"
    | "lacrosseGoal"
    | "handballGoal";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    "id" | "width" | "height" | "bar" | "mass"
  > & {
    /** The sport profile. Omission selects the football goal. */
    kind?: Kind;
  };
}
