import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ICreateHumanFaceHairTailSpreadProps } from "./ICreateHumanFaceHairTailSpreadProps";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Derive one lock's radial velocity after a scalp tie. The tie entry fixes its transverse side around the authored tail axis; the root supplies that side if entry lies on the axis, and a stable frame resolves the final collinear case. The target is a deterministic sample inside the authored tube: phase chooses angle and sqrt of a second uniform sequence value chooses radius, because disk area grows with radius squared. Cubic smoothstep moves from entry offset to target offset over a positive metric reach. Its derivative adds radial motion to the axial tail field without moving a station after contact or changing its metric length.
 *
 * A numerical radius describes rendered bundle volume, not physical fibre thickness. The integrator still limits turning and checks skin contact; this derivative alone promises neither a collision-free tube nor a complete ponytail. Inputs stay caller-owned, and the returned field has no state.
 *
 * @evidence contracts/common.md#principled-implementation Cubic smoothstep's derivative moves one deterministic entry offset toward a sampled disk target after a tie.
 * @evidence contracts/common.md#clear-and-simple-design Radial velocity augments the tail field without moving already admitted stations or changing metric length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radius is rendered bundle volume, not fibre calibre; this field alone guarantees neither a collision-free tube nor completed ponytail.
 * @evidence contracts/common.md#meaningful-documentation Distances/radius/reach are metres and phase plus radialFraction choose the deterministic transverse sample.
 * @evidence contracts/performance.md#efficient-algorithms Compilation and each derivative evaluation use fixed vector arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Axis, entry and target difference are computed once and reused at each tail station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stateless closure retains derived axis/change values rather than a history; caller vectors remain borrowed during preparation.
 */
export function createHumanFaceHairTailSpread(
  props: ICreateHumanFaceHairTailSpreadProps,
): (distance: number) => IAutoMovieVector3 {
  const axis: IAutoMovieVector3 = humanFaceHairFrame.direction(props.axis);
  const transverse: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const offset: IAutoMovieVector3 = Vector3.subtract(point, props.anchor);
    return Vector3.subtract(
      offset,
      Vector3.scale(axis, Vector3.dot(offset, axis)),
    );
  };
  const entry: IAutoMovieVector3 = transverse(props.entry);
  const entryRadius: number = Vector3.length(entry);
  let radial: IAutoMovieVector3 =
    entryRadius > 0 ? entry : transverse(props.root);
  if (Vector3.length(radial) === 0) {
    radial = humanFaceHairFrame.perpendicular(axis, Vector3.create(0, 1, 0));
  }
  const unit: IAutoMovieVector3 = humanFaceHairFrame.direction(radial);
  const across: IAutoMovieVector3 = Vector3.cross(axis, unit);
  const target: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      Vector3.scale(unit, Math.cos(props.phase)),
      Vector3.scale(across, Math.sin(props.phase)),
    ),
    props.radius * props.radialFraction,
  );
  const change: IAutoMovieVector3 = Vector3.subtract(target, entry);
  return (distance: number): IAutoMovieVector3 => {
    const u: number = Math.max(0, Math.min(1, distance / props.reach));
    return Vector3.scale(change, (6 * u * (1 - u)) / props.reach);
  };
}
