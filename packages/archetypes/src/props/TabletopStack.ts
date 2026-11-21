import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";

/**
 * The shared contacts of a small flat tabletop prop that rests on, and
 * stacks on, another: a playing card, a gaming chip, a banknote or a die.
 *
 * The prop's origin is the centre of its underside, `+Y` up. Its `base`
 * socket is that origin, laid on another prop's `top` or a board square to
 * place it; its `top` socket is the centre of its upper face, where the next
 * prop of a stack mounts; its `grip` is a precision pinch from above at the
 * upper face, the fingertips closing across the given aperture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the frame and the three shared contacts and how a stack mounts.
 * @evidence contracts/development/design.md#principled-representation Model-local frames in metres from the prop's own height and pinch aperture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the card, chip, banknote and die producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No geometry is laid here; each producer builds its own part.
 */
export namespace TabletopStack {
  /**
   * The contact ids every stackable tabletop prop builds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the pinch, the underside socket and the upper socket.
   * @evidence contracts/development/design.md#principled-representation A closed union of the three contact ids `contacts` builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The grip a hand takes and the two sockets placing and stacking read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no producer-specific contact.
   */
  export type Contact = "grip" | "base" | "top";

  /**
   * Lay the pinch and the two stacking sockets.
   *
   * @param builder The prop under construction.
   * @param height The prop's height from its underside to its upper face, metres.
   * @param aperture The width the fingertips close across, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each contact's place and frame.
   * @evidence contracts/development/implementation.md#principled-implementation The sockets share the upright attitude at the underside and upper face, so a prop's base laid on another's top stacks it squarely.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three affordance calls.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every stackable tabletop prop shares these contacts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function contacts<Id extends string, D extends string>(
    builder: ArchetypeBuilder<Contact | Id, D>,
    height: number,
    aperture: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, height, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "precision",
      aperture,
      length: aperture,
    });
    builder.affordance({
      id: "base",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    builder.affordance({
      id: "top",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
    });
  }
}
