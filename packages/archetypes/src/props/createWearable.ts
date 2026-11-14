import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's size reads as, not read at a source. */
const MAKER: string = "a common maker's size, not read at a source";

/**
 * A small thing worn on the body and put on or taken off by hand: a wristwatch, a hat or a pair of spectacles.
 *
 * Each rests at the origin as it would lie on a table, its front toward `+Z`. A watch lies dial up with its strap straight along `Z`; a hat sits on its brim, crown up; spectacles stand open on the lenses' bottom edge with the temples back along `-Z`. `hold` is where the fingers take it: the watch's case, the hat's brim at its front, the spectacles' bridge. `wear` is the socket the body part goes into or onto, `+Y` out toward it: the strap's inside under the case for the wrist, the crown's inside for the head, the bridge's back for the nose. `face` is a watch's dial, facing up, read by a glance.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The thing.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind rests, where it is held and where it is worn.
 * @evidence contracts/development/implementation.md#principled-implementation A case and a strap; a brim disc and a crown; a front and two temples, each sized by the drawn width, depth and height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one branch per kind with its parts and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The strap does not curl, the hat does not flex and the temples do not fold; the strap's, brim's and frame's thickness are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createWearable(
  params: createWearable.IParams,
  seed?: number | string,
): Archetype<createWearable.Affordance, createWearable.Dimension> {
  const kind: createWearable.Kind = ArchetypeDraw.choice(
    "wearable",
    "kind",
    params.kind,
    createWearable.KINDS,
  );
  const d: Record<createWearable.Dimension, number> = ArchetypeDraw.dimensions(
    "wearable",
    createWearable.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createWearable.Affordance,
    createWearable.Dimension
  > = new ArchetypeBuilder({
    archetype: "wearable",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const thin: number = createWearable.THIN;
  if (kind === "watch") {
    // The strap flat along Z, the case on its middle.
    builder.box(
      "strap",
      v(createWearable.STRAP, thin, d.depth),
      v(0, thin / 2, 0),
      { color: "#2c2f33" },
    );
    builder.box(
      "case",
      v(d.width, d.height, d.width),
      v(0, thin + d.height / 2, 0),
      { color: "#b9bcc0" },
    );
    builder.affordance({
      id: "hold",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        v(0, thin + d.height / 2, 0),
        v(1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "precision",
      aperture: d.width,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, thin + d.height, 0)),
      extent: null,
      width: d.width,
      depth: d.width,
    });
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(0, 0, 1)),
      extent: null,
    });
  } else if (kind === "hat") {
    // The brim on the table, the crown up from it.
    builder.rod("brim", d.width / 2, v(0, 0, 0), v(0, thin, 0), {
      color: "#3a3d42",
    });
    builder.rod("crown", d.depth / 2, v(0, thin, 0), v(0, d.height, 0), {
      color: "#3a3d42",
    });
    builder.affordance({
      id: "hold",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        v(0, thin / 2, d.width / 2 - 0.02),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: thin,
    });
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(0, 0, 1)),
      extent: null,
    });
  } else {
    // The front standing on its lenses' bottom edge, the temples back from its ends.
    builder.box("front", v(d.width, d.height, thin), v(0, d.height / 2, 0), {
      color: "#1d1f22",
    });
    for (const [id, sign] of [
      ["leftTemple", 1],
      ["rightTemple", -1],
    ] as const)
      builder.rod(
        id,
        thin / 2,
        v((sign * (d.width - thin)) / 2, d.height * 0.7, -thin / 2),
        v((sign * (d.width - thin)) / 2, d.height * 0.7, -d.depth),
        { color: "#1d1f22" },
      );
    builder.affordance({
      id: "hold",
      kind: "handle",
      frame: ArchetypeFrame.facing(
        v(0, d.height / 2, 0),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: thin,
    });
    builder.affordance({
      id: "wear",
      kind: "socket",
      frame: ArchetypeFrame.facing(
        v(0, d.height * 0.4, -thin / 2),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createWearable}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the three things and one band per dimension each; the dimensions' meanings per kind are listed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hold a hand takes, the socket a body part goes into and a watch's dial.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read, so every band is provisional; the strap's width and every thickness are named estimates.
 */
export namespace createWearable {
  /** The kinds. */
  export type Kind = "watch" | "hat" | "spectacles";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["watch", "hat", "spectacles"];

  /** A strap's, a brim's and a spectacle frame's thickness, metres: an estimate. */
  export const THIN: number = 0.004;

  /** A watch strap's width, metres: an estimate. */
  export const STRAP: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `hold`: where the fingers take it.
   * - `wear`: the socket the wrist, the head or the nose goes into, `+Y` toward it.
   * - `face`: a watch's dial, facing up.
   */
  export type Affordance = "hold" | "wear" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: a watch case's across, a brim's diameter, the spectacles' front across.
   * - `depth`: a strap's length, a crown's diameter, a temple's length.
   * - `height`: a case's thickness, a hat's height, the front's height.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `wearable` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    watch: {
      width: ArchetypeBand.metres(0.036, 0.045, MAKER, true),
      depth: ArchetypeBand.metres(0.2, 0.24, MAKER, true),
      height: ArchetypeBand.metres(0.009, 0.014, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.05, 0.18, MAKER, true),
    },
    hat: {
      width: ArchetypeBand.metres(0.3, 0.4, MAKER, true),
      depth: ArchetypeBand.metres(
        0.17,
        0.2,
        "a head's breadth and length inside the crown, an estimate",
        true,
      ),
      height: ArchetypeBand.metres(0.1, 0.15, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.08, 0.2, MAKER, true),
    },
    spectacles: {
      width: ArchetypeBand.metres(0.13, 0.145, MAKER, true),
      depth: ArchetypeBand.metres(0.135, 0.15, MAKER, true),
      height: ArchetypeBand.metres(0.035, 0.05, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.02, 0.04, MAKER, true),
    },
  };
}
