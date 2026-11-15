import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A shopping trolley, from its maker's page and a reseller's listing. */
const TROLLEY: string =
  "Wanzl EL series shopping trolleys (https://www.wanzl.com/en_DE/products/trolleys/shopping-trolleys/various-shopping-trolleys/el-series~p390); the EL 185's 610 x 1150 x 1030 mm from a reseller listing seen only in search results";

/** A wheelbarrow read at its maker's data sheet. */
const BARROW: string =
  "Matador M-130-L4 wheelbarrow data sheet (https://bati-avenue.com/media/akeneo_connector/media_files/1/0/10868_M_130_L4_EN_Data_sheet_final_1_f9d6.pdf)";

/**
 * A pushed load carrier: a shopping trolley or a wheelbarrow.
 *
 * The carrier stands on the floor with its front toward `+Z` and the person behind it at `-Z`. A trolley is pushed by the one `handle` bar across its back; a wheelbarrow is lifted and pushed by its two handles, `leftHandle` on `+X`. `load` is the floor of the basket or the tray, where things are put. `ArchetypeRide.along` moves either along a course.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The carrier.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the carrier stands, where it is pushed from and where it is loaded.
 * @evidence contracts/development/implementation.md#principled-implementation A basket or tray box on wheels with handle bars at the drawn height; a trolley's basket stands over its chassis on two rear uprights and carries the push bar on two arms from its rear rim; each handle's frame lies on its bar's axis with the bar's diameter as its `aperture`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wheelbarrow is modelled resting on its legs, handles at rest height; lifting it is the pushing act's to pose. A trolley's basket is one solid box held at its rear, its wire mesh, child seat and front supports not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eleven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCart(
  params: createCart.IParams,
  seed?: number | string,
): Archetype<createCart.Affordance, createCart.Dimension> {
  const kind: createCart.Kind = ArchetypeDraw.choice(
    "cart",
    "kind",
    params.kind,
    createCart.KINDS,
  );
  const d: Record<createCart.Dimension, number> = ArchetypeDraw.dimensions(
    "cart",
    createCart.BANDS[kind],
    seed,
    params,
    createCart.BANDS,
  );
  const builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension> =
    new ArchetypeBuilder({
      archetype: "cart",
      id: params.id,
      name: kind === "trolley" ? "shopping trolley" : "wheelbarrow",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  const grip: number = d.gripDiameter / 2;
  const wheel: number = d.wheelDiameter / 2;

  if (kind === "trolley") {
    const floor: number = d.wheelDiameter + 0.3;
    builder.box(
      "basket",
      v(d.width, d.handleHeight - 0.08 - floor, d.length - 0.15),
      v(0, (d.handleHeight - 0.08 + floor) / 2, 0.075),
      { color: "#b9bcc0", density: 0.1 },
    );
    builder.box(
      "chassis",
      v(d.width, 0.03, d.length - 0.15),
      v(0, d.wheelDiameter + 0.015, 0.075),
      { color: "#8a8d91" },
    );
    for (const [name, x, z] of [
      ["castor-front-left", 1, 1],
      ["castor-front-right", -1, 1],
      ["castor-rear-left", 1, -1],
      ["castor-rear-right", -1, -1],
    ] as const)
      builder.rod(
        name,
        wheel,
        v(
          x * (d.width / 2 - 0.05) - 0.015,
          wheel,
          z * (d.length / 2 - 0.2) + 0.075,
        ),
        v(
          x * (d.width / 2 - 0.05) + 0.015,
          wheel,
          z * (d.length / 2 - 0.2) + 0.075,
        ),
        { color: "#22262b" },
      );
    const bar: number = -d.length / 2 + grip;

    // What joins the three: an upright under each rear corner of the basket, and an arm from the basket's rear rim to each end of the bar.
    const back: number = -d.length / 2 + 0.15;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = sign * (d.width / 2 - grip);
      builder.rod(
        `upright-${side}`,
        grip,
        v(x, d.wheelDiameter + 0.03, back + grip),
        v(x, floor, back + grip),
        { color: "#8a8d91" },
      );
      builder.rod(
        `arm-${side}`,
        grip,
        v(x, d.handleHeight - 0.08, back),
        v(x, d.handleHeight, bar),
        { color: "#8a8d91" },
      );
    }
    builder.rod(
      "handle",
      grip,
      v(-d.width / 2, d.handleHeight, bar),
      v(d.width / 2, d.handleHeight, bar),
      { color: "#c0392b" },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.upright(v(0, d.handleHeight, bar)),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: d.width,
    });
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, floor, 0.075)),
      extent: null,
      width: d.width,
      depth: d.length - 0.15,
    });
    return builder.build(d.mass);
  }

  // A wheelbarrow: a tray over one front wheel, two legs behind, and two handles reaching back.
  const tray: number = 0.88;
  const rear: number = -d.length / 2 + createCart.GRIP;
  builder.box(
    "tray",
    v(d.width, 0.3, tray),
    v(
      0,
      d.handleHeight - 0.05,
      d.length / 2 - d.wheelDiameter - tray / 2 + 0.2,
    ),
    { color: "#4f7f5a", density: 0.2 },
  );
  builder.rod(
    "wheel",
    wheel,
    v(-0.04, wheel, d.length / 2 - wheel),
    v(0.04, wheel, d.length / 2 - wheel),
    { color: "#22262b" },
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = (sign * d.handleSpacing) / 2;
    builder.rod(
      `shaft-${side}`,
      grip,
      v(x, d.handleHeight, rear),
      v(sign * 0.08, wheel, d.length / 2 - wheel),
      { color: "#8a8d91" },
    );
    builder.rod(
      `grip-${side}`,
      grip,
      v(x, d.handleHeight, -d.length / 2),
      v(x, d.handleHeight, rear),
      { color: "#22262b" },
    );
    builder.rod(
      `leg-${side}`,
      0.015,
      v(x * 0.8, 0, -0.1),
      v(x * 0.8, d.handleHeight - 0.2, -0.1),
      { color: "#8a8d91" },
    );
    builder.affordance({
      id: `${side}Handle`,
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        v(x, d.handleHeight, -d.length / 2 + createCart.GRIP / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: createCart.GRIP,
    });
  }
  builder.affordance({
    id: "load",
    kind: "surface",
    frame: ArchetypeFrame.upright(
      v(
        0,
        d.handleHeight - 0.2,
        d.length / 2 - d.wheelDiameter - tray / 2 + 0.2,
      ),
    ),
    extent: null,
    width: d.width,
    depth: tray,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createCart}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle's height, width and diameter a pushing act reads (#3372, #3351).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A wheelbarrow's handle spacing has no trolley counterpart, so the trolley's band fixes it to its width.
 */
export namespace createCart {
  /** The kinds of carrier. */
  export type Kind = "trolley" | "wheelbarrow";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["trolley", "wheelbarrow"];

  /** A wheelbarrow handgrip's length, metres: the 130 mm of the Matador M-130-L4 data sheet. */
  export const GRIP: number = 0.13;

  /**
   * The affordance ids:
   *
   * - `handle`: a trolley's push bar.
   * - `leftHandle`, `rightHandle`: a wheelbarrow's handgrips on `+X` and `-X`.
   * - `load`: the floor of the basket or the tray.
   */
  export type Affordance = "handle" | "leftHandle" | "rightHandle" | "load";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`, `width`: overall, along `+Z` and `+X`.
   * - `handleHeight`: the handle's axis above the floor, a wheelbarrow's at rest.
   * - `handleSpacing`: between a wheelbarrow's two handles.
   * - `gripDiameter`: the handle where the hands hold it.
   * - `wheelDiameter`: a castor or the wheel.
   * - `mass`: the empty carrier, kilograms.
   */
  export type Dimension =
    | "length"
    | "width"
    | "handleHeight"
    | "handleSpacing"
    | "gripDiameter"
    | "wheelDiameter"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /** The model's id, unique in a scene; `cart` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    trolley: {
      length: ArchetypeBand.metres(1.15, 1.15, TROLLEY, true),
      width: ArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
      handleHeight: ArchetypeBand.metres(
        0.89,
        1.03,
        `the 35 and 37 in middle push hand heights of the Liberty Mutual tables after Snook and Ciriello 1991 (https://www.gorbel.com/resources/blog/LibertyMutualTables manual materials handling guidelines.pdf) up to the trolley's 1030 mm height (${TROLLEY})`,
        true,
      ),
      handleSpacing: ArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
      gripDiameter: ArchetypeBand.metres(
        0.025,
        0.032,
        "the trolley's handle is a round tube whose diameter its maker does not state; an estimate",
        true,
      ),
      wheelDiameter: ArchetypeBand.metres(
        0.1,
        0.125,
        `${TROLLEY}: castors of 100 or 125 mm`,
      ),
      mass: ArchetypeBand.of("kg", 18, 28, ArchetypeBand.TYPICAL_MASS, true),
    },
    wheelbarrow: {
      length: ArchetypeBand.metres(1.45, 1.45, BARROW),
      width: ArchetypeBand.metres(0.59, 0.59, BARROW),
      handleHeight: ArchetypeBand.metres(
        0.62,
        0.645,
        `${BARROW}: 620 mm overall height; 645 mm handle height of another model, seen only in search results`,
        true,
      ),
      handleSpacing: ArchetypeBand.metres(
        0.59,
        0.595,
        `${BARROW}: 590 mm overall width; 595 mm handle spacing of another model, seen only in search results`,
        true,
      ),
      gripDiameter: ArchetypeBand.metres(
        0.038,
        0.038,
        `${BARROW}: handgrip 38 mm, the column's label being ambiguous`,
        true,
      ),
      wheelDiameter: ArchetypeBand.metres(0.4, 0.4, BARROW),
      mass: ArchetypeBand.of("kg", 18.6, 18.6, BARROW),
    },
  };
}
