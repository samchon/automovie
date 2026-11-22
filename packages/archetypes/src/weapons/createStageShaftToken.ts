import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import { createProjectile } from "./createProjectile";

/**
 * Slender shaft stage token.
 *
 * The arrow and bolt silhouettes share a model-space handle, seat and tip mark along the shaft.
 *
 * @param params The scene id and this digital form's catalogue or sizing options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the inert display form and its actor contact.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the existing stage form's actual visible silhouette and model-space contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the selected mesh and contact once with the shared draw.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createStageShaftToken(
  params: createStageShaftToken.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createStageShaftToken.Affordance,
  createStageShaftToken.Dimension
> {
  const kind: createStageShaftToken.Kind = ArchetypeDraw.choice(
    "projectile",
    "kind",
    params.kind,
    createStageShaftToken.KINDS,
  );
  return StageTokenConstruction(kind, params, seed, (builder, d, model) => {
    const v: typeof Vector3.create = Vector3.create;
    const length: number = d.length!;
    const head: number = kind === "bolt" ? d.head! : 0;
    const r: number = d.diameter! / 2;
    builder.rod("shaft", r, v(0, 0, 0), v(0, length - head, 0), {
      color: "#b98d5b",
      surface: "wood",
    });
    if (kind === "bolt")
      builder.rod(
        "head",
        d.headWidth! / 2,
        v(0, length - head, 0),
        v(0, length, 0),
        {
          color: "#55595f",
          density: createProjectile.STEEL_OVER_ASH,
          surface: "steel",
        },
      );
    builder.affordance({
      id: "shaft",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, (length - head) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * r,
      length: length - head,
    });
    // Where the fingers pinch the shaft to set the nock on a string: just
    // ahead of the nock, a pinch's width along it.
    builder.affordance({
      id: "nockGrip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, PINCH, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * r,
      length: PINCH,
    });
    builder.affordance({
      id: "nock",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!, {
      rests: "wood",
      ...createProjectile.flight(kind, model, r),
    });
  });
}

/** How far ahead of the nock the fingers pinch the shaft to nock it, metres: a fingertip pad's width (provisional). */
const PINCH: number = 0.03;

/**
 * Authoring options for {@link createStageShaftToken}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form and names only the profiles sharing its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createStageShaftToken {
  /** The `model` choices this producer admits. */
  export type Model = "westminster" | "az472" | "nmm11461" | "met33754";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "head" | "headWidth" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This producer builds nock, nockGrip, shaft, tip.
   */
  export type Affordance = createProjectile.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["arrow", "bolt"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createProjectile.IParams,
    "id" | "length" | "diameter"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?: Model;
  }
}
