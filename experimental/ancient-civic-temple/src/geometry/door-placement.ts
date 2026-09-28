/**
 * Static open-door placement for the temple's reviewed passage table. Models
 * retain closed local geometry; this helper rotates that geometry around its
 * actual hinge and translates the hinge onto the wall midpoint. Coordinates
 * are Y-up metres and rotations are radians about +Y. The selected room and
 * passage axis determine the inward vector; swing selects the single hinge.
 * The building instance producer consumes the returned rigid transform. A
 * changed hinge datum invalidates opening contact tests and threshold views.
 */
import type { DoorPassage } from "./spatial-cells";

export const templeOpenDoorPlacement = (door: DoorPassage, side: -1 | 1) => {
  const across = (door.wallLow + door.wallHigh) / 2;
  const double = door.axis === "x";
  const angle = double
    ? door.room === "entrance"
      ? -Math.PI / 2
      : Math.PI / 2
    : door.room === "offering" || door.adjacent === "exterior"
      ? Math.PI
      : 0;
  const localHinge = double ? { x: 0.021, z: 0 } : { x: 0, z: 0.031 };
  const hinge = double
    ? { x: door.center + side * door.width / 2, z: across }
    : { x: across, z: door.center + side * door.width / 2 };
  return {
    x: hinge.x - localHinge.x * Math.cos(angle) - localHinge.z * Math.sin(angle),
    z: hinge.z + localHinge.x * Math.sin(angle) - localHinge.z * Math.cos(angle),
    angle,
  };
};
