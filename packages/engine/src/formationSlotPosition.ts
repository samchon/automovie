import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieFormationPlacement } from "./IAutoMovieFormationPlacement";
import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";
import { formationGroundRelief } from "./formationGroundRelief";
import { lerp } from "./lerp";

/**
 * Where one slot of a formation stands at rest, in world space.
 *
 * The position half of {@link formationSlot}, taken on its own because a
 * consumer that only asks where a member is should not have to hold the hero
 * overrides and model recipe that name it. The compiled formation carries
 * exactly this much, so the builder can ask about a member without reaching
 * back for the design record beside it.
 *
 * A second implementation of this arithmetic is how a gate and a renderer come
 * to disagree about where a unit is standing, so there is one.
 *
 * Height comes from {@link formationGroundRelief}: the ground under the member,
 * not the ground under the group. A crowd on a rise stands on the rise.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-local-frame Derives the slot in unit-local coordinates before applying formation facing, anchor, and world terrain relief.
 * @evidence requirements/formations/reform-and-group-motion.md#formation-reform-local-blend Interpolates source and target slot points in formation-local axes before applying heading and terrain.
 * @evidence requirements/formations/reform-and-group-motion.md#formation-reform-slot-assignment Resolves both layouts with the same stable slot number throughout the reform.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Implements compact line, column, wedge, arc, and scatter slot placement without expanded member nodes.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Produces the bounded local reform state for the assigned member before world-frame composition.
 */
export const formationSlotPosition = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  reform: IAutoMovieFormationReform | null = null,
): IAutoMovieVector3 => {
  if (
    Number.isSafeInteger(slot) === false ||
    slot < 0 ||
    slot >= formation.count
  )
    throw new RangeError(
      `Formation "${formation.id}" slot ${slot} is outside 0..${formation.count - 1}.`,
    );
  // Blended in the unit's OWN frame, before its heading and its terrain are
  // applied. A member re-forming travels to its new place inside the unit; if
  // the two world points were blended instead, a unit that is also turning
  // would fold its heading into the arrangement and members would swing along
  // arcs their layout never describes.
  const designed = localFormationPoint(formation, slot);
  const point =
    reform === null
      ? designed
      : (() => {
          const target = localFormationPoint(formation, slot, reform.layout);
          return {
            x: lerp(designed.x, target.x, reform.progress),
            z: lerp(designed.z, target.z, reform.progress),
          };
        })();
  const radians = (formation.facingDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const x = formation.anchor.x + point.x * cosine + point.z * sine;
  const z = formation.anchor.z - point.x * sine + point.z * cosine;
  return {
    x,
    y: formation.anchor.y + formationGroundRelief(formation, { x, z }),
    z,
  };
};
