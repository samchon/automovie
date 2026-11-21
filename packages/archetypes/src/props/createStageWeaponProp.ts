import { type Archetype, ArchetypeDraw } from "../core";
import { createStageHammerProp } from "./createStageHammerProp";
import { createStageLinkedProp } from "./createStageLinkedProp";
import { createStageMaceProp } from "./createStageMaceProp";
import { createStagePoleBladeProp } from "./createStagePoleBladeProp";
import { createStageShaftProp } from "./createStageShaftProp";

/**
 * A digital stage prop with a padded silhouette. The mace has a round
 * ornament, the pike a narrow upright capsule, the shuo a wider elongated
 * oval, and the halberd a side ornament. Additional profiles provide blade
 * marks, an offset ornament, and a linked ornament with an authored hinge.
 * The model stands from the origin along +Y at rest. The round shaft's
 * grip is approached from -Z.
 *
 * @param params The outline, scene id and optional overall display height in metres.
 * @param seed A seed for the builder's draw session.
 * @returns A foam model with a named grip for kinematic staging.
 * @throws {ArchetypeRefusal} When the outline or height is out of range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each catalogue outline, the fixed scale assigned by the outline, the optional height override, and the common grip approach.
 * @evidence contracts/development/implementation.md#principled-implementation The saved kind selects its canonical producer and retains its original profile data and actor contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates the legacy selector and calls the selected profile once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses authored digital silhouettes and a nominal mass. Articulation is scene-authored with no inferred reaction.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each silhouette records a fixed number of primitives, convex strips and affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared builder records each primitive for both its model and geometry consumers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each model owns its data and the producer retains no state.
 */
export function createStageWeaponProp(
  params: createStageWeaponProp.IParams,
  seed?: number | string,
): Archetype<
  createStageWeaponProp.Affordance,
  createStageWeaponProp.Dimension
> {
  const kind: createStageWeaponProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    createStageWeaponProp.KINDS,
  );
  /** The legacy surface accepts a broad selector before runtime admission. */
  type Producer = {
    build(
      params: createStageWeaponProp.IParams,
      seed?: number | string,
    ): Archetype<
      createStageWeaponProp.Affordance,
      createStageWeaponProp.Dimension
    >;
  }["build"];
  // The selected producer validates its options from the saved parameter union.
  const produce: Producer = createStageWeaponProp.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/**
 * Authoring controls and affordance ids for the stage silhouettes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the forms, metre scale, named hand sites, motion marks and link pivot.
 * @evidence contracts/development/design.md#principled-representation The outline is a closed literal union with one scale parameter independent of scene identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Provides the named outline and display height used by the producer and the hold name used by the scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported outlines and inadmissible heights are refused by the shared draw owners.
 */
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

  /** The padded silhouette variants admitted by the factory and listed in the catalogue. */
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

  /**
   * The authored display silhouettes.
   */
  export type Kind = (typeof KINDS)[number];

  /**
   * The common hand grip, shaft bar and two discrete support sites on the
   * blade profiles, and outline-dependent tip, edge, rear, face, hinge and end:
   * a pole blade's `rear` is the back of its marked edge cell, facing away from the edge.
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

  /**
   * The overall display height in metres.
   */
  export type Dimension = "height";

  /**
   * Stage outline, optional scale override, and scene identity.
   */
  export interface IParams {
    /** The padded outline. */
    kind: Kind;

    /** Scene-unique model id. */
    id?: string;

    /** Overall display height in metres. Defaults to the outline's display height. */
    height?: number;
  }
}
