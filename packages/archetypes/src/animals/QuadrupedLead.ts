import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";

/**
 * Lay an authored collar and straight lead on an actual quadruped neck.
 *
 * @param builder The actual animal under construction.
 * @param rig Its actual rest landmarks.
 * @param id The producer's declared lead contact identity.
 * @param tack Positive authored lengths in metres, including the whole straight lead.
 * @param archetype Producer identity used in refusals.
 * @throws {ArchetypeRefusal} For invalid lengths or a collar longer than the actual neck.
 * @evidence contracts/development/common.md#meaningful-documentation States actual construction ownership, authored SI dimensions, contact identity and geometric admission.
 * @evidence contracts/development/implementation.md#principled-implementation A cylinder spans the authored collar width along the actual neck axis. Its outward attachment starts the straight lead, whose real midpoint and diameter define the grasp frame and aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the four lengths against the actual neck, lay collar/lead and declare the contact on the same physical lead.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species default, invented maker dimension, floating grip, substituted anatomy or patched builder supplies the contact; all four dimensions remain authored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/vector work and two actual primitive parts, with one contact record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every species uses the same neck landmarks and the same geometry/contact owner; the existing dog wrapper delegates without changing its arithmetic or output.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns the returned geometry/contact data; the helper retains no input, cache or external resource.
 */
export function QuadrupedLead<Id extends string, Dimension extends string>(
  builder: ArchetypeBuilder<Id, Dimension>,
  rig: QuadrupedBody.IRig,
  id: Id,
  tack: QuadrupedLead.IParams,
  archetype: string,
): void {
  const axis: IAutoMovieVector3 = Vector3.subtract(rig.poll, rig.neck);
  const length: number = Vector3.length(axis);
  for (const key of ["width", "thickness", "leadLength", "leadRadius"] as const)
    if (
      !(
        Number.isFinite(tack[key]) &&
        tack[key] > 0 &&
        (key !== "width" || tack[key] <= length)
      )
    )
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `collar.${key}`,
        value: tack[key],
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: key === "width" ? length : null,
          unit: "m",
        },
        reason:
          "authored tack lengths must be positive and the collar must fit the actual neck",
        fix: "supply positive lengths and shorten the collar to fit its neck",
      });
  const centre: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(rig.neck, rig.poll),
    0.5,
  );
  const half: IAutoMovieVector3 = Vector3.scale(
    axis,
    tack.width / (2 * length),
  );
  builder.rod(
    "collar",
    rig.neckRadius + tack.thickness,
    Vector3.subtract(centre, half),
    Vector3.add(centre, half),
    { color: "#645139" },
  );
  const attached: IAutoMovieVector3 = {
    ...centre,
    x: rig.neckRadius + tack.thickness,
  };
  const end: IAutoMovieVector3 = {
    ...attached,
    x: attached.x + tack.leadLength,
  };
  builder.rod("lead", tack.leadRadius, attached, end, { color: "#645139" });
  builder.affordance({
    id,
    kind: "rein",
    symmetry: "round",
    grip: "power",
    frame: ArchetypeFrame.facing(
      Vector3.scale(Vector3.add(attached, end), 0.5),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    aperture: 2 * tack.leadRadius,
    length: tack.leadLength,
  });
}

/**
 * Authored shared collar/lead dimensions, without species or maker defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every length names its physical meaning and metre unit.
 * @evidence contracts/development/design.md#principled-representation Four independently authored positive lengths define the actual collar and straight lead.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One dimension contract serves the existing dog and new quadruped producers; the builder and anatomical rig retain their own owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No undocumented default or inferred species size substitutes for a supplied physical dimension.
 */
export namespace QuadrupedLead {
  /** All four lengths are positive finite metres; width also fits the actual neck. */
  export interface IParams {
    /** Collar length along the neck. */
    width: number;
    /** Collar radial thickness. */
    thickness: number;
    /** Complete straight lead length. */
    leadLength: number;
    /** Circular lead radius. */
    leadRadius: number;
  }
}
