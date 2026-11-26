import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { AutoMovieArchetypeStageHammerProp } from "./AutoMovieArchetypeStageHammerProp";
import { AutoMovieArchetypeStageLinkedProp } from "./AutoMovieArchetypeStageLinkedProp";
import { AutoMovieArchetypeStageMaceProp } from "./AutoMovieArchetypeStageMaceProp";
import { AutoMovieArchetypeStagePoleBladeProp } from "./AutoMovieArchetypeStagePoleBladeProp";
import { AutoMovieArchetypeStageShaftProp } from "./AutoMovieArchetypeStageShaftProp";
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
    mace: { build: AutoMovieArchetypeStageMaceProp.create },
    pike: { build: AutoMovieArchetypeStageShaftProp.create },
    shuo: { build: AutoMovieArchetypeStageShaftProp.create },
    halberd: { build: AutoMovieArchetypeStageShaftProp.create },
    longBlade: { build: AutoMovieArchetypeStagePoleBladeProp.create },
    crescentBlade: { build: AutoMovieArchetypeStagePoleBladeProp.create },
    sideBlade: { build: AutoMovieArchetypeStagePoleBladeProp.create },
    serpentBlade: { build: AutoMovieArchetypeStagePoleBladeProp.create },
    offsetHammer: { build: AutoMovieArchetypeStageHammerProp.create },
    linked: { build: AutoMovieArchetypeStageLinkedProp.create },
  };
  return variants[kind].build(params, seed);
}

/** Authoring controls and affordance ids for the stage silhouettes. */
export namespace createStageWeaponProp {
  /** The canonical factories for saved kinds, read after the catalogue loads. */
  export const PRODUCERS = {
    get mace(): typeof AutoMovieArchetypeStageMaceProp.create {
      return AutoMovieArchetypeStageMaceProp.create;
    },
    get pike(): typeof AutoMovieArchetypeStageShaftProp.create {
      return AutoMovieArchetypeStageShaftProp.create;
    },
    get shuo(): typeof AutoMovieArchetypeStageShaftProp.create {
      return AutoMovieArchetypeStageShaftProp.create;
    },
    get halberd(): typeof AutoMovieArchetypeStageShaftProp.create {
      return AutoMovieArchetypeStageShaftProp.create;
    },
    get longBlade(): typeof AutoMovieArchetypeStagePoleBladeProp.create {
      return AutoMovieArchetypeStagePoleBladeProp.create;
    },
    get crescentBlade(): typeof AutoMovieArchetypeStagePoleBladeProp.create {
      return AutoMovieArchetypeStagePoleBladeProp.create;
    },
    get sideBlade(): typeof AutoMovieArchetypeStagePoleBladeProp.create {
      return AutoMovieArchetypeStagePoleBladeProp.create;
    },
    get serpentBlade(): typeof AutoMovieArchetypeStagePoleBladeProp.create {
      return AutoMovieArchetypeStagePoleBladeProp.create;
    },
    get offsetHammer(): typeof AutoMovieArchetypeStageHammerProp.create {
      return AutoMovieArchetypeStageHammerProp.create;
    },
    get linked(): typeof AutoMovieArchetypeStageLinkedProp.create {
      return AutoMovieArchetypeStageLinkedProp.create;
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
