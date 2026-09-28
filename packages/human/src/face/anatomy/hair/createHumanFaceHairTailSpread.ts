import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Derive one lock's radial velocity after a scalp tie. The tie entry fixes its
 * transverse side around the authored tail axis; the root supplies that side
 * if entry lies on the axis, and a stable frame resolves the final collinear
 * case. The target is a deterministic sample inside the authored tube: phase
 * chooses angle and sqrt of a second uniform sequence value chooses radius,
 * because disk area grows with radius squared. Cubic smoothstep moves from
 * entry offset to target offset over a positive metric reach. Its derivative
 * adds radial motion to the axial tail field without moving a station after
 * contact or changing its metric length.
 *
 * A numerical radius describes rendered bundle volume, not physical fibre
 * thickness. The integrator still limits turning and checks skin contact;
 * this derivative alone promises neither a collision-free tube nor a complete
 * ponytail. Inputs stay caller-owned, and the returned field has no state.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Expands a tied bundle through one reusable numerical cross-section rule.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Derives tail volume from radius and reach instead of storing individual strand offsets.
 */
export function createHumanFaceHairTailSpread(props: {
  axis: IAutoMovieVector3;
  anchor: IAutoMovieVector3;
  entry: IAutoMovieVector3;
  root: IAutoMovieVector3;
  phase: number;
  radialFraction: number;
  radius: number;
  reach: number;
}): (distance: number) => IAutoMovieVector3 {
  const axis = humanFaceHairFrame.direction(props.axis);
  const transverse = (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const offset = Vector3.subtract(point, props.anchor);
    return Vector3.subtract(
      offset,
      Vector3.scale(axis, Vector3.dot(offset, axis)),
    );
  };
  const entry = transverse(props.entry);
  const entryRadius = Vector3.length(entry);
  let radial = entryRadius > 0 ? entry : transverse(props.root);
  if (Vector3.length(radial) === 0) {
    radial = humanFaceHairFrame.perpendicular(axis, Vector3.create(0, 1, 0));
  }
  const unit = humanFaceHairFrame.direction(radial);
  const across = Vector3.cross(axis, unit);
  const target = Vector3.scale(
    Vector3.add(
      Vector3.scale(unit, Math.cos(props.phase)),
      Vector3.scale(across, Math.sin(props.phase)),
    ),
    props.radius * props.radialFraction,
  );
  const change = Vector3.subtract(target, entry);
  return (distance) => {
    const u = Math.max(0, Math.min(1, distance / props.reach));
    return Vector3.scale(change, (6 * u * (1 - u)) / props.reach);
  };
}
