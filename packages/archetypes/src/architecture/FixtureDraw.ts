import type { IAutoMovieAffordance } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createAppliance } from "./createAppliance";
import type { createMachine } from "./createMachine";
import type { createObstacle } from "./createObstacle";
import type { createSanitary } from "./createSanitary";
import type { createStreetFixture } from "./createStreetFixture";

/**
 * The units of saved architectural recipes and the dimension-only draw used by wall-backed fixtures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the saved measurement tables and shared installed-fixture draw.
 * @evidence contracts/development/design.md#principled-representation Each family keeps the units and draw key recorded in its saved recipes; its construction receives the same measured values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares one draw and material setup for wall-backed appliances and bathroom fixtures and publishes each old unit table from one owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The selected producer supplies a fixed row and validates its own dimensions against the original bands.
 */
export namespace FixtureDraw {
  /**
   * The part of a fixture builder that writes a particular set of contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the builder action available to shared contact construction.
   * @evidence contracts/development/design.md#principled-representation A contact ID union restricts each helper to the subset of contacts it writes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains only the writer method, independent of the caller's other contacts and shapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the canonical affordance fields with their existing frames and parameter meanings.
   */
  export interface IContactWriter<Id extends string> {
    /**
     * Record an affordance with one of this helper's contact identifiers.
     *
     * @param contact The frame and fields produced for the stated identifier.
     * @evidence contracts/development/common.md#meaningful-documentation Names the argument and the write to the caller's builder.
     * @evidence contracts/development/implementation.md#principled-implementation The builder receives the existing affordance and retains ownership of its validation and storage.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Gives each shared constructor one operation for writing a contact.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The helper must supply an identifier in its declared subset.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The interface declares a single call to the existing builder.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared contacts use the same writer for each shape that offers them.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The given builder owns the recorded contact.
     */
    affordance(contact: IAutoMovieAffordance & { id: Id }): void;
  }

  /** Units of the recorded appliance dimensions. */
  export const appliance: Readonly<
    Record<createAppliance.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    depth: "m",
    pullHeight: "m",
    cavityHeight: "m",
    cavityWidth: "m",
    cavityDepth: "m",
    door: "m",
    mass: "kg",
  };

  /** Units of the recorded machine dimensions. */
  export const machine: Readonly<
    Record<createMachine.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /** Units of the recorded sanitary dimensions. */
  export const sanitary: Readonly<
    Record<createSanitary.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    rim: "m",
    basinDepth: "m",
    width: "m",
    depth: "m",
    length: "m",
    bowlWidth: "m",
    bowlDepth: "m",
    tapHeight: "m",
    tapReach: "m",
    tapOutlet: "m",
    seat: "m",
    seatDepth: "m",
    tankWidth: "m",
    tankDepth: "m",
    tankTop: "m",
    wellLength: "m",
    wellWidth: "m",
    waterDepth: "m",
    interior: "m",
    wallHeight: "m",
    threshold: "m",
    control: "m",
    mass: "kg",
  };

  /** Units of the recorded streetFixture dimensions. */
  export const streetFixture: Readonly<
    Record<createStreetFixture.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    nozzleHeight: "m",
    pumperReach: "m",
    hoseReach: "m",
    base: "m",
    baseHeight: "m",
    head: "m",
    headHeight: "m",
    mass: "kg",
  };

  /** Units of the recorded obstacle dimensions. */
  export const obstacle: Readonly<
    Record<createObstacle.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    height: "m",
    width: "m",
    top: "m",
    curb: "m",
    lowerFace: "m",
    tube: "m",
    spacing: "m",
    post: "m",
    base: "m",
    ropeDiameter: "m",
    mass: "kg",
    massPerMetre: "kg",
  };

  /**
   * The values {@link installed} accepts at this place in its signature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the admitted values of one place in the signature of installed.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal values the construction handles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only installed and its callers read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It admits no value the construction does not handle.
   */
  export type InstalledFamily = "appliance" | "sanitary";

  /**
   * Draw the measured bands and build one composite appliance or plumbing fixture.
   *
   * @param family The existing seed namespace.
   * @param name The displayed model name.
   * @param units The original unit record.
   * @param bands The selected producer's bands.
   * @param familyBands The original bands used to refuse fields belonging to a different variant.
   * @param params The fixed dimensions and optional id.
   * @param seed The seed for unfixed dimensions.
   * @param construct The selected producer's construction.
   * @returns The fixture and its contact frames.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside the selected fixture's bands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the shared input setup and the selected construction.
   * @evidence contracts/development/implementation.md#principled-implementation Validate the selected bands with the original draw namespace before building its parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw dimensions, build the given construction and apply the drawn mass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep family-dependent refusal and physical material.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The selected fixture draws a bounded number of bands.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the draw and builder setup across the fixed installations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains only the built fixture's records.
   */
  export function installed<Id extends string, D extends string>(
    family: InstalledFamily,
    name: string,
    units: Readonly<Record<D, AutoMovieArchetypeDrawSession.Unit>>,
    bands: Readonly<Partial<Record<D, IAutoMovieArchetypeBand>>>,
    familyBands: Readonly<
      Record<string, Readonly<Partial<Record<D, IAutoMovieArchetypeBand>>>>
    >,
    params: Partial<Record<D, number>> & { id?: string },
    seed: number | string | undefined,
    construct: (
      builder: AutoMovieArchetypeBuilder<Id, D>,
      dimensions: Partial<Record<D, number>>,
    ) => void,
  ): AutoMovieArchetype<Id, D> {
    const draw: AutoMovieArchetypeDrawSession<D> =
      new AutoMovieArchetypeDrawSession(family, units, seed, params);
    const measured: Partial<Record<D, number>> & { mass?: number } =
      draw.dimensions(bands, familyBands);
    const builder: AutoMovieArchetypeBuilder<Id, D> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name,
        draw,
      });
    construct(builder, measured);
    return builder.build(measured.mass!);
  }
}
