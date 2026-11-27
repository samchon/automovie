import { AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeQuadrupedBody, type AutoMovieArchetypeQuadrupedEquipment, type AutoMovieArchetypeQuadrupedLead, type AutoMovieArchetypeOx } from "@automovie/archetypes";
import {
  buildOxBody
} from "../../../../packages/archetypes/src/animals/ox/buildOxBody";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieCylinderShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { nclose } from "./nclose";

/**
 * Genuine quadruped builders and independent analytic equipment observations.
 *
 * The equipment unit owns the scenarios and authored dimensions. This helper
 * creates the actual body through the public builder, reads its real primitives
 * and accumulates geometric findings without reproducing a producer's plan or
 * replacing any method. No renderer, compiler, process or hidden fixture state
 * is involved; every call owns its returned builder or observes its input
 * model.
 */
export namespace AnimalEquipmentFixture {
  /** Actual public non-equid output shared by the three species producers. */
  export type Animal = ReturnType<typeof AutoMovieArchetypeOx.create>;

  /** One real laid body and the canonical landmarks used to fit equipment. */
  export interface IFixture {
    /** Genuine builder observed through its ordinary complete build output. */
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeQuadrupedEquipment.Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    >;
    /** Actual landmarks of that same already laid quadruped body. */
    rig: AutoMovieArchetypeQuadrupedBody.IRig;
  }

  /** Lay the actual ox body through the genuine public builder. */
  export function create(): IFixture {
    const body: AutoMovieArchetypeQuadrupedBody.IBody = buildOxBody();
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeQuadrupedBody.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "equipment-fixture",
        { withersHeight: "m", girth: "m", mass: "kg", tempo: "" },
        7,
      );
    draw.derive("withersHeight", 1.1932);
    draw.derive("girth", 1.5061);
    draw.derive("mass", 300);
    draw.derive("tempo", 0);
    const builder: IFixture["builder"] = new AutoMovieArchetypeBuilder({
      name: "actual ox body fixture",
      draw,
      material: "skin",
    });
    const rig: AutoMovieArchetypeQuadrupedBody.IRig =
      AutoMovieArchetypeQuadrupedBody.rig(body, draw.values);
    AutoMovieArchetypeQuadrupedBody.lay(body, builder, 1.1932, rig);
    return { builder, rig };
  }

  /** Inspect the actual three bars and analytic cylindrical bearing surface. */
  export function inspectHook(
    animal: Animal,
    name: string,
    id: AutoMovieArchetypeQuadrupedEquipment.Affordance,
    authored: AutoMovieArchetypeQuadrupedEquipment.IHook,
    findings: string[],
  ): void {
    const base: IAutoMovieModelPart = part(animal, `${name}-base`);
    const left: IAutoMovieModelPart = part(animal, `${name}-upright--1`);
    const right: IAutoMovieModelPart = part(animal, `${name}-upright-1`);
    const contact: IAutoMovieAffordance = animal.affordance(id);
    const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      contact.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const at: IAutoMovieVector3 = base.transform!.translation;
    const bearing: IAutoMovieVector3 = contact.frame.translation;
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(base.transform!.rotation),
      { x: bearing.x - at.x, y: bearing.y - at.y, z: bearing.z - at.z },
    );
    if (
      contact.kind !== "hook" ||
      contact.extent !== null ||
      !same(normal, { x: 0, y: 1, z: 0 }) ||
      !same(bearing, { x: at.x, y: at.y + authored.radius, z: at.z }) ||
      !nclose(Math.hypot(local.x, local.z), cylinder(base).radius, 1e-9) ||
      !nclose(local.y, 0, 1e-9)
    )
      findings.push(
        `${id}: contact is not on the actual upper cylinder bearing surface`,
      );
    if (
      !nclose(
        cylinder(base).height,
        authored.opening + 2 * authored.radius,
        1e-9,
      ) ||
      !nclose(cylinder(base).radius, authored.radius, 1e-9) ||
      !nclose(cylinder(left).radius, authored.radius, 1e-9) ||
      !nclose(cylinder(right).radius, authored.radius, 1e-9) ||
      !nclose(
        Math.abs(
          right.transform!.translation.z - left.transform!.translation.z,
        ) -
          cylinder(left).radius -
          cylinder(right).radius,
        authored.opening,
        1e-9,
      )
    )
      findings.push(
        `${id}: physical U bars do not preserve the authored clear opening`,
      );
    for (const [upright, sign] of [
      [left, -1],
      [right, 1],
    ] as const) {
      const bottom: IAutoMovieVector3 = end(upright, -1);
      if (
        !same(bottom, end(base, sign)) ||
        !same(end(upright, 1), { ...bottom, y: bearing.y + authored.depth })
      )
        findings.push(
          `${id}: physical upright does not preserve its joined root or clear depth`,
        );
    }
    const link: IAutoMovieModelPart = part(animal, `${name}-link`);
    const support: IAutoMovieModelPart = part(
      animal,
      id === "hitch"
        ? "yoke-beam"
        : id === "leftLoad"
          ? "pack-left-rail"
          : "pack-right-rail",
    );
    if (
      !same(end(link, 1), at) ||
      !same(end(link, -1), support.transform!.translation)
    )
      findings.push(
        `${id}: the physical hook is disconnected from its real support link`,
      );
  }

  /** A lead's line contact is the midpoint of its real straight graspable bar. */
  export function inspectLead(
    animal: Animal,
    authored: AutoMovieArchetypeQuadrupedLead.IParams,
    findings: string[],
  ): void {
    const lead: IAutoMovieModelPart = part(animal, "lead");
    const collar: IAutoMovieModelPart = part(animal, "collar");
    const contact: IAutoMovieAffordance = animal.affordance("lead");
    if (
      contact.kind !== "rein" ||
      !same(contact.frame.translation, lead.transform!.translation) ||
      !same(
        AutoMovieEngineQuaternion.rotateVector(contact.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 1, z: 0 },
      ) ||
      !nclose(cylinder(lead).height, authored.leadLength, 1e-9) ||
      !nclose(cylinder(lead).radius, authored.leadRadius, 1e-9) ||
      !nclose(contact.aperture!, 2 * authored.leadRadius, 1e-9) ||
      !nclose(contact.length!, authored.leadLength, 1e-9) ||
      !nclose(cylinder(collar).height, authored.width, 1e-9) ||
      !nclose(
        cylinder(collar).radius - cylinder(part(animal, "neck")).radius,
        authored.thickness,
        1e-9,
      )
    )
      findings.push(
        `${animal.archetype}: lead contact disagrees with actual bar or authored collar`,
      );
  }

  /**
   * Read one genuine transformed part; a missing part is an actual construction
   * defect.
   */
  export function part(animal: Animal, id: string): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = animal.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (found === undefined || found.transform === null)
      throw new Error(`Missing real ${id}`);
    return found;
  }

  /**
   * Require an actual cylindrical support rather than accepting a contact-only
   * substitute.
   */
  export function cylinder(part: IAutoMovieModelPart): IAutoMovieCylinderShape {
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder"
    )
      throw new Error(`${part.id} must be an actual cylinder`);
    return part.geometry.shape;
  }

  /**
   * Read actual spherical/capsule/cylinder radius without importing a
   * producer's formulas.
   */
  export function radius(part: IAutoMovieModelPart): number {
    if (
      part.geometry.type !== "primitive" ||
      !("radius" in part.geometry.shape)
    )
      throw new Error(`${part.id} must have an actual circular section`);
    return part.geometry.shape.radius;
  }

  /** Apply a real cylinder's transform to its local axis endpoint. */
  export function end(
    part: IAutoMovieModelPart,
    sign: 1 | -1,
  ): IAutoMovieVector3 {
    const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: (sign * cylinder(part).height) / 2, z: 0 },
    );
    return {
      x: part.transform!.translation.x + offset.x,
      y: part.transform!.translation.y + offset.y,
      z: part.transform!.translation.z + offset.z,
    };
  }

  /**
   * Perpendicular distance to an actual bar axis, derived from a vector
   * projection.
   */
  export function lineDistance(
    point: IAutoMovieVector3,
    bar: IAutoMovieModelPart,
  ): number {
    const origin: IAutoMovieVector3 = end(bar, -1);
    const top: IAutoMovieVector3 = end(bar, 1);
    const dx: number = top.x - origin.x;
    const dy: number = top.y - origin.y;
    const dz: number = top.z - origin.z;
    const t: number =
      ((point.x - origin.x) * dx +
        (point.y - origin.y) * dy +
        (point.z - origin.z) * dz) /
      (dx * dx + dy * dy + dz * dz);
    return Math.hypot(
      point.x - origin.x - t * dx,
      point.y - origin.y - t * dy,
      point.z - origin.z - t * dz,
    );
  }

  /** Finite coordinate comparison with an absolute metre tolerance. */
  function same(left: IAutoMovieVector3, right: IAutoMovieVector3): boolean {
    return (
      nclose(left.x, right.x, 1e-9) &&
      nclose(left.y, right.y, 1e-9) &&
      nclose(left.z, right.z, 1e-9)
    );
  }
}
