import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/** A halter strap's width and thickness, metres: authored, the halter listings read give strap lengths only. */
const STRAP: Readonly<{ width: number; thickness: number }> = {
  width: 0.025,
  thickness: 0.006,
};

/** The noseband's place along the head from the poll, a fraction of the head's length: authored. */
const NOSEBAND: number = 0.7;

/** A halter's mass, kilograms: authored, no listing read gives it. */
const MASS: number = 0.4;

/**
 * A halter fitted to one equid's head: a crown loop behind the poll, a noseband loop round the nose and a cheek strap down each side between them.
 *
 * The halter is built in its head's own frame, the frame its `seat` names: the origin at the poll, `+Y` along the head from the poll to the nose, `+X` to the animal's left. Each loop is four flat straps round a square that just clears the head's radius, so the halter sits on the head it was fitted to without passing into it; a halter is sized to its horse (Schockemöhle's Fremont lists an 11.5 in noseband and 27 in crown for a full horse, a cob's smaller), and the fit here is that sizing made exact. `grip` is the crown's top, where a hand carries the halter. Strap width and thickness, the noseband's place and the mass are authored.
 *
 * @param head The head it is fitted to: the head capsule's length from poll to nose and its radius, metres.
 * @param params The model's id.
 * @returns The halter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the straps, the fit, the two contacts and which values are authored.
 * @evidence contracts/development/implementation.md#principled-implementation Two square loops of half-side the head radius plus half a strap's thickness, in the planes across the head at the poll and at the noseband, joined by a cheek strap each side.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the head, lay ten straps, declare two contacts, build.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Strap size, noseband place and mass are named authored values; a nonpositive head refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ten parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared builder.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHalter(
  head: createHalter.IHead,
  params: createHalter.IParams = {},
): Archetype<createHalter.Affordance, never> {
  if (
    !(Number.isFinite(head.length) && head.length > 0) ||
    !(Number.isFinite(head.radius) && head.radius > 0)
  )
    throw new RangeError("A halter fits a head of positive length and radius");
  const draw: ArchetypeDrawSession<never> = new ArchetypeDrawSession<never>(
    "halter",
    {},
    undefined,
    {},
  );
  const builder: ArchetypeBuilder<createHalter.Affordance, never> =
    new ArchetypeBuilder({
      material: "leather",
      id: params.id,
      name: "halter",
      draw,
    });
  const a: number = head.radius + STRAP.thickness / 2;
  const side: number = 2 * a + STRAP.thickness;
  const loop = (name: string, y: number): void => {
    for (const sign of [1, -1]) {
      builder.box(
        `${name}-${sign > 0 ? "ventral" : "dorsal"}`,
        Vector3.create(side, STRAP.width, STRAP.thickness),
        Vector3.create(0, y, sign * a),
        { color: "#5a3a22" },
      );
      builder.box(
        `${name}-${sign > 0 ? "left" : "right"}`,
        Vector3.create(STRAP.thickness, STRAP.width, 2 * a),
        Vector3.create(sign * a, y, 0),
        { color: "#5a3a22" },
      );
    }
  };
  const nose: number = NOSEBAND * head.length;
  loop("crown", 0);
  loop("noseband", nose);
  for (const sign of [1, -1])
    builder.box(
      `cheek-${sign > 0 ? "left" : "right"}`,
      Vector3.create(STRAP.thickness, nose, STRAP.width),
      Vector3.create(sign * a, nose / 2, 0),
      { color: "#5a3a22" },
    );
  const top: IAutoMovieVector3 = Vector3.create(0, 0, -a - STRAP.thickness / 2);
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      top,
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: STRAP.thickness,
  });
  builder.affordance({
    id: "seat",
    kind: "socket",
    frame: ArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
  });
  return builder.build(MASS);
}

/**
 * Companion types of {@link createHalter}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states what it is and its units.
 * @evidence contracts/development/design.md#principled-representation The head a halter fits, in metres, and its contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the producer and a scene read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace createHalter {
  /** The contacts: `grip`, the crown's top a hand carries it by; `seat`, the halter's own head frame, laid on the horse's `headgear`. */
  export type Affordance = "grip" | "seat";

  /**
   * The head a halter is fitted to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres.
   * @evidence contracts/development/design.md#principled-representation The head capsule's length and radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the fit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHead {
    /** The head capsule's length from poll to nose, metres. */
    length: number;

    /** The head capsule's radius, metres. */
    radius: number;
  }

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `halter` when absent. */
    id?: string;
  }
}
