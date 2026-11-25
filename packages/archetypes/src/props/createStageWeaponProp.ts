import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { createStageHammerProp } from "./createStageHammerProp";
import { createStageLinkedProp } from "./createStageLinkedProp";
import { createStageMaceProp } from "./createStageMaceProp";
import { createStagePoleBladeProp } from "./createStagePoleBladeProp";
import { createStageShaftProp } from "./createStageShaftProp";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

/**
 * A digital stage prop with a padded silhouette. The mace has a round ornament,
 * the pike a narrow upright capsule, the shuo a wider elongated oval, and the
 * halberd a side ornament. Additional profiles provide blade marks, an offset
 * ornament, and a linked ornament with an authored hinge. The model stands from
 * the origin along +Y at rest. The round shaft's grip is approached from -Z.
 *
 * @param params The outline, scene id and optional overall display height in
 *   metres.
 * @param seed A seed for the builder's draw session.
 * @returns A foam model with a named grip for kinematic staging.
 * @throws {AutoMovieArchetypeRefusal} When the outline or height is out of
 *   range.
 */
export function createStageWeaponProp(
  params: createStageWeaponProp.IParams,
  seed?: number,
): AutoMovieArchetype<
  createStageWeaponProp.Affordance,
  createStageWeaponProp.Dimension
> {
  const kind: createStageWeaponProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    createStageWeaponProp.KINDS,
  );
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      createStageWeaponProp.Kind,
      IArchetypeDispatch<
        Omit<createStageWeaponProp.IParams, "kind">,
        AutoMovieArchetype<createStageWeaponProp.Affordance, createStageWeaponProp.Dimension>
      >
    >
  > = {
    mace: { build: createStageMaceProp },
    pike: { build: createStageShaftProp },
    shuo: { build: createStageShaftProp },
    halberd: { build: createStageShaftProp },
    longBlade: { build: createStagePoleBladeProp },
    crescentBlade: { build: createStagePoleBladeProp },
    sideBlade: { build: createStagePoleBladeProp },
    serpentBlade: { build: createStagePoleBladeProp },
    offsetHammer: { build: createStageHammerProp },
    linked: { build: createStageLinkedProp },
  };
  return variants[kind].build(params, seed);
}

/** Authoring controls and affordance ids for the stage silhouettes. */
export namespace createStageWeaponProp {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get mace(): typeof createStageMaceProp {
      return createStageMaceProp;
    },
    get pike(): typeof createStageShaftProp {
      return createStageShaftProp;
    },
    get shuo(): typeof createStageShaftProp {
      return createStageShaftProp;
    },
    get halberd(): typeof createStageShaftProp {
      return createStageShaftProp;
    },
    get longBlade(): typeof createStagePoleBladeProp {
      return createStagePoleBladeProp;
    },
    get crescentBlade(): typeof createStagePoleBladeProp {
      return createStagePoleBladeProp;
    },
    get sideBlade(): typeof createStagePoleBladeProp {
      return createStagePoleBladeProp;
    },
    get serpentBlade(): typeof createStagePoleBladeProp {
      return createStagePoleBladeProp;
    },
    get offsetHammer(): typeof createStageHammerProp {
      return createStageHammerProp;
    },
    get linked(): typeof createStageLinkedProp {
      return createStageLinkedProp;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /**
   * The padded silhouette variants admitted by the factory and listed in the
   * catalogue.
   */
  export const KINDS = [
    "mace",
    "pike",
    "shuo",
    "halberd",
    "longBlade",
    "crescentBlade",
    "sideBlade",
    "serpentBlade",
    "offsetHammer",
    "linked",
  ] as const;

  /** The authored display silhouettes. */
  export type Kind = (typeof KINDS)[number];

  /**
   * The common hand grip, shaft bar and two discrete support sites on the blade
   * profiles, and outline-dependent tip, edge, rear, face, hinge and end: a
   * pole blade's `rear` is the back of its marked edge cell, facing away from
   * the edge.
   */
  export type Affordance =
    | "grip"
    | "grip-lower"
    | "grip-upper"
    | "shaft"
    | "tip"
    | "edge"
    | "side-edge"
    | "rear"
    | "face"
    | "link"
    | "end";

  /** The overall display height in metres. */
  export type Dimension = "height";

  /** Stage outline, optional scale override, and scene identity. */
  export interface IParams {
    /** The padded outline. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /**
     * Overall display height in metres. Defaults to the outline's display
     * height.
     */
    height?: number;
  }
}
