import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * The shared stock, barrel and handling contacts of an inert period long-arm
 * silhouette, built from one museum record's overall and barrel lengths.
 *
 * The gun lies along `+Z` from its butt plate at the origin to its muzzle,
 * the barrel's line at `y = 0`, as `createLongGun` lays its guns. The firing
 * hand takes the `grip` at the wrist, the other hand the `foreEnd` from below
 * and the `butt` goes to the shoulder. `slingFront` and `slingRear` are the
 * swivel places a sling or a carrier hangs the gun from. The lock is the
 * caller's: `lay` builds the shared parts and returns the builder for it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the frame, the shared parts and contacts, and which values are read and which are authored.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres from a cited record, the unread proportions as named estimates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the two period silhouettes, which add their own locks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No lock is shared: each producer builds its own.
 */
export namespace StagePeriodGunConstruction {
  /**
   * The read record of one silhouette and its authored proportions, metres and kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the record, its read lengths and the provisional stock and barrel proportions.
   * @evidence contracts/development/design.md#principled-representation Lengths in metres and mass in kilograms; the record string states each figure's source.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the figures the construction lays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required; a value the record lacks is an authored estimate named as such in `record`.
   */
  export interface IProfile {
    /** The draw namespace and the model's name. */
    name: string;

    /** The cited record: institution, accession, date and the read figures. */
    record: string;

    /** Butt plate to muzzle, read. */
    overall: number;

    /** Breech to muzzle, read. */
    barrel: number;

    /** The stock's greatest depth, read or estimated as `record` states. */
    depth: number;

    /** The stock's width, read or estimated as `record` states. */
    width: number;

    /** The barrel's outer radius, estimated. */
    radius: number;

    /** The butt plate to the trigger's face, estimated. */
    pull: number;

    /** The whole gun's mass, read or estimated as `record` states. */
    mass: number;
  }

  /**
   * The shared contact ids of a period long-arm silhouette.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the handling, aiming and sling contacts every silhouette builds.
   * @evidence contracts/development/design.md#principled-representation A closed union of the contact ids `lay` builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The holds, the muzzle and the two sling swivels the choreography reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no lock contact; each producer adds its own.
   */
  export type Contact =
    | "grip"
    | "trigger"
    | "foreEnd"
    | "butt"
    | "muzzle"
    | "slingFront"
    | "slingRear";

  /**
   * The dimensions every silhouette records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the recorded lengths and mass.
   * @evidence contracts/development/design.md#principled-representation Metres for the lengths, kilograms for the mass.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The read figures a comparison checks.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No estimated proportion is recorded as a dimension.
   */
  export type Dimension = "length" | "barrel" | "mass";

  /**
   * Lay the stock, wrist, fore-stock, barrel and trigger with the shared contacts.
   *
   * @param profile The silhouette's record and proportions.
   * @param id The model's scene id.
   * @returns The builder, for the caller's lock and its contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the parts and contacts laid and their frame.
   * @evidence contracts/development/implementation.md#principled-implementation Boxes and rods along the barrel's line from the read overall and barrel lengths; the trigger stands at the length of pull, as `createLongGun` places it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Record the dimensions, lay butt to muzzle, then the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unread proportions come from the profile's named estimates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six parts and seven contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both period silhouettes share this stock and its contacts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the builder to its caller and keeps nothing.
   */
  export function lay<Id extends string>(
    profile: IProfile,
    id: string,
  ): AutoMovieArchetypeBuilder<Contact | Id, Dimension> {
    const v: typeof Vector3.create = Vector3.create;
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession(
        profile.name,
        { length: "m", barrel: "m", mass: "kg" },
        undefined,
      );
    draw.derive("length", profile.overall);
    draw.derive("barrel", profile.barrel);
    draw.derive("mass", profile.mass);
    const builder: AutoMovieArchetypeBuilder<Contact | Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        id,
        name: profile.name,
        material: "wood",
        draw,
      });

    const breech: number = profile.overall - profile.barrel;
    const wrist: number = profile.pull - 0.12;
    const fore: number = breech + profile.barrel * 0.4;
    builder.box(
      "stock",
      v(profile.width, profile.depth, wrist),
      v(0, -profile.depth / 2 + 0.02, wrist / 2),
      { color: "#6b4a2f", density: 0.6 },
    );
    builder.rod("wrist", 0.018, v(0, -0.02, wrist), v(0, -0.01, breech), {
      color: "#6b4a2f",
    });
    builder.box(
      "fore-stock",
      v(profile.width * 0.6, 0.035, profile.barrel - 0.08),
      v(0, -0.02, breech + (profile.barrel - 0.08) / 2),
      { color: "#6b4a2f", density: 0.6 },
    );
    builder.rod(
      "barrel",
      profile.radius,
      v(0, 0, breech),
      v(0, 0, profile.overall),
      {
        color: "#55595f",
      },
    );
    builder.box("trigger", v(0.008, 0.02, 0.006), v(0, -0.045, profile.pull), {
      color: "#55595f",
    });

    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -0.03, (wrist + breech) / 2),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 0.036,
      length: 0.09,
    });
    builder.affordance({
      id: "trigger",
      kind: "trigger",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -0.045, profile.pull - 0.003),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "foreEnd",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -0.02, fore),
        v(0, -1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: 0.04,
      length: 0.12,
    });
    builder.affordance({
      id: "butt",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -profile.depth / 2 + 0.02, 0),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "muzzle",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, profile.overall),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });

    // The swivels hang under the fore-stock's front and the butt's toe line.
    for (const [contact, z, y] of [
      ["slingFront", profile.overall - 0.15, -0.04],
      ["slingRear", wrist * 0.5, -profile.depth + 0.02],
    ] as const)
      builder.affordance({
        id: contact,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.facing(
          v(0, y, z),
          v(0, -1, 0),
          v(0, 0, 1),
        ),
        extent: null,
      });
    return builder;
  }

  /**
   * Finish a silhouette at its profile's mass.
   *
   * @param builder The silhouette with its lock laid.
   * @param profile The silhouette's record and proportions.
   * @returns The inert model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the mass the model is built at.
   * @evidence contracts/development/implementation.md#principled-implementation Builds at the profile's read or estimated mass.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One build call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the build.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build<Id extends string>(
    builder: AutoMovieArchetypeBuilder<Contact | Id, Dimension>,
    profile: IProfile,
  ): AutoMovieArchetype<Contact | Id, Dimension> {
    return builder.build(profile.mass);
  }
}
