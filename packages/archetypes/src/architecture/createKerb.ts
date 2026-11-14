import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A single raised step a foot goes up or over: a road kerb or a free-standing step.
 *
 * It stands on the ground centred on `X` with its back face at the origin's `Z` and its front face toward `+Z`, the side it is approached from, its top at the drawn height. `top` is the top face, facing up, where a foot lands; `edge` the top's front edge, along `+X` with `+Y` up and `+Z` out of the face below, which a foot clears going up or a stepping-over act clears going across.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The kerb or step.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands, which side is approached and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the drawn length along `X`, depth along `Z` and height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kerb's top is level and square, with no batter or bullnose.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createKerb(
  params: createKerb.IParams,
  seed?: number | string,
): Archetype<createKerb.Affordance, createKerb.Dimension> {
  const kind: createKerb.Kind = ArchetypeDraw.choice(
    "kerb",
    "kind",
    params.kind,
    createKerb.KINDS,
  );
  const d: Record<createKerb.Dimension, number> = ArchetypeDraw.dimensions(
    "kerb",
    createKerb.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createKerb.Affordance, createKerb.Dimension> =
    new ArchetypeBuilder({
      archetype: "kerb",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  builder.box(
    kind,
    Vector3.create(d.length, d.height, d.depth),
    Vector3.create(0, d.height / 2, d.depth / 2),
    { color: kind === "kerb" ? "#9a9a96" : "#b8b2a7" },
  );
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.height, d.depth / 2)),
    extent: null,
    width: d.length,
    depth: d.depth,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, d.height, d.depth),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createKerb}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two and one band per dimension each; the height is the one a stepping act reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top a foot lands on and the edge it clears.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The kerb's unit and upstand and the step's riser and tread are the sources as read, a code's limit where it gives one; a step's width and mass are given by none, so they are provisional.
 */
export namespace createKerb {
  /** The kinds: a road kerb unit and a single free-standing step. */
  export type Kind = "kerb" | "step";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["kerb", "step"];

  /**
   * The affordance ids:
   *
   * - `top`: the top face, facing up.
   * - `edge`: the top's front edge along `+X`, `+Z` out of the face below.
   */
  export type Affordance = "top" | "edge";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the ground, a kerb's upstand or a step's riser.
   * - `depth`: the top front to back, a kerb's width or a step's tread.
   * - `length`: along `X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "depth" | "length" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which one. */
    kind: Kind;

    /** The model's id, unique in a scene; `kerb` when absent. */
    id?: string;
  }

  /** A kerb unit, read. */
  const HB2: string =
    "Marshalls half battered kerb HB2 to BS EN 1340, 125 x 255 x 915 mm work size (https://media.marshalls.co.uk/image/upload/v1523957771/125_x_255_Half_Battered_Kerb_Datasheet.pdf), 72 kg (https://the-landscape-centre.co.uk/125x255-915mm-hb-straight-kerb-g05080040)";

  /** A kerb's upstand above the road, read. */
  const UPSTAND: string =
    "Wheels for Wellbeing, Common kerb profiles: kerbs of 100 to 150 mm, bus stop kerbs 125 to 140 mm (https://wheelsforwellbeing.org.uk/common-kerb-profiles/)";

  /** The residential stair code, read. */
  const IRC: string =
    "2021 International Residential Code, R311.7.5.1 risers not more than 7 3/4 in (196 mm) and R311.7.5.2 treads not less than 10 in (254 mm) (https://codes.iccsafe.org/s/IRC2021P3/chapter-3-building-planning/IRC2021P3-Pt03-Ch03-SecR311.7.5.1)";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    kerb: {
      height: ArchetypeBand.metres(0.1, 0.15, UPSTAND),
      depth: ArchetypeBand.metres(0.125, 0.125, HB2),
      length: ArchetypeBand.metres(0.915, 0.915, HB2),
      mass: ArchetypeBand.of("kg", 72, 72, `${HB2}: the whole unit, its bedded part below the road not modelled`),
    },
    step: {
      height: ArchetypeBand.metres(0.196, 0.196, `${IRC}: the riser's limit, which the model takes`),
      depth: ArchetypeBand.metres(0.254, 0.254, `${IRC}: the tread's limit, which the model takes`),
      length: ArchetypeBand.metres(
        0.9,
        1.2,
        "a step's width; the code read sets the riser and the tread only",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        40,
        150,
        "a concrete or timber step; no source read gives a weight",
        true,
      ),
    },
  };
}