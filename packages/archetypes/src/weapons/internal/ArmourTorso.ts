import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArmourCell } from "./ArmourCell";
import { ArmourProfile } from "./ArmourProfile";

/*
 * Open torso walls and, for mail, a coarse shirt's hollow sleeves.
 *
 * Neck/arm openings and the sleeve course use thirds and sixths as explicit
 * coarse authoring topology, not measurements of a historical neckline or body.
 * The record's spread, height and depth remain independent extrema.
 */
export function ArmourTorso(
  profile: ArmourProfile.IProfile,
): readonly ArmourProfile.ICell[] {
  const cells: ArmourProfile.ICell[] = [];
  const t: number = profile.wall;
  const width: number =
    profile.kind === "mail" && !profile.fitted
      ? profile.record.x * ArmourProfile.TORSO.breadthShare
      : profile.outer.x;
  const height: number = profile.outer.y;
  const depth: number = profile.outer.z;
  const x: number = width / 2;
  const y: number = height / 2;
  const z: number = depth / 2;
  const neck: number = (width * ArmourProfile.TORSO.neckBreadthShare) / 2;
  const shoulder: number = y - height * ArmourProfile.TORSO.neckHeightShare;
  const armpit: number = y - height * ArmourProfile.TORSO.sleeveHeightShare;
  for (const side of [-1, 1] as const) {
    const lowZ: number = side === -1 ? -z : z - t;
    const highZ: number = side === -1 ? -z + t : z;
    panel(
      `${side === -1 ? "back" : "front"}-body`,
      -x,
      x,
      -y,
      shoulder,
      lowZ,
      highZ,
    );
    for (const shoulderSide of [-1, 1] as const)
      panel(
        `${side === -1 ? "back" : "front"}-shoulder-${shoulderSide}`,
        shoulderSide === -1 ? -x : neck,
        shoulderSide === -1 ? -neck : x,
        shoulder,
        y,
        lowZ,
        highZ,
      );
    panel(
      `side-${side}`,
      side === -1 ? -x : x - t,
      side === -1 ? -x + t : x,
      -y,
      armpit,
      -z + t,
      z - t,
    );
  }
  if (profile.kind === "mail") {
    const spread: number = profile.record.x / 2;
    for (const side of [-1, 1] as const) {
      const lowX: number = side === -1 ? -spread : x;
      const highX: number = side === -1 ? -x : spread;
      panel(`sleeve-${side}-front`, lowX, highX, armpit, y, z - t, z);
      panel(`sleeve-${side}-back`, lowX, highX, armpit, y, -z, -z + t);
      panel(`sleeve-${side}-top`, lowX, highX, y - t, y, -z + t, z - t);
      panel(
        `sleeve-${side}-bottom`,
        lowX,
        highX,
        armpit,
        armpit + t,
        -z + t,
        z - t,
      );
    }
  }
  return cells;

  /*
   * Interval bounds are the shared definition of rendered and physical walls.
   */
  function panel(
    id: string,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
  ): void {
    const low: IAutoMovieVector3 = { x: x0, y: y0, z: z0 };
    const high: IAutoMovieVector3 = { x: x1, y: y1, z: z1 };
    cells.push(ArmourCell.box(id, low, high));
  }
}
