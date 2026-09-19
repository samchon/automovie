import { createPortraitEyebrowFlow } from "./createPortraitEyebrowFlow";
import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * Refuse invalid fibre dimensions before fitting an eye or allocating brow meshes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Refuses impossible strand dimensions and populations before brow mesh construction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Checks finite radii, taper, bounded segments and roots/spans inside the supporting brow, including optional endpoint fades.
 */
export function assertPortraitEyebrowProfile(
  shape: IPortraitEyebrowProfile,
  fibres: number,
): void {
  if (shape.representation !== undefined && shape.representation !== "ribbon")
    throw new Error(
      "Eyebrow representation must be ribbon or omitted for tubes.",
    );
  if (shape.flow !== undefined) createPortraitEyebrowFlow(shape.flow);
  if (
    shape.densitySeed !== undefined &&
    (!Number.isInteger(shape.densitySeed) ||
      shape.densitySeed < 0 ||
      shape.densitySeed > 0xffffffff)
  )
    throw new Error("Eyebrow density seed must be an unsigned 32-bit integer.");
  const roots = shape.rootBand ?? [0.1, 0.22];
  const maximumSpan = shape.span ?? 0.34;
  const ends = shape.endFade ?? [0, 0];
  if (
    ends.length !== 2 ||
    ends.some((value) => !Number.isFinite(value) || value < 0 || value > 0.5)
  )
    throw new Error("Eyebrow endpoint fades must be two fractions in [0,0.5].");
  if (
    roots.length !== 2 ||
    !roots.every(Number.isFinite) ||
    roots[0] < 0 ||
    roots[1] < roots[0] ||
    roots[1] > 1 ||
    !Number.isFinite(maximumSpan) ||
    maximumSpan < 0 ||
    maximumSpan > 1 ||
    (shape.flow === undefined && roots[1] + maximumSpan > 1)
  )
    throw new Error(
      "Eyebrow root band and fibre span must remain inside the supporting brow.",
    );
  if (
    !Number.isInteger(fibres) ||
    fibres < 0 ||
    fibres > 4096 ||
    ![
      shape.radius,
      shape.radiusStep,
      shape.taper,
      shape.clearance,
      shape.arch,
      shape.outwardBend,
    ].every(Number.isFinite) ||
    shape.radius <= 0 ||
    shape.radiusStep < 0 ||
    shape.taper < 0 ||
    shape.taper >= 1 ||
    shape.clearance < 0 ||
    shape.arch < 0 ||
    !Number.isFinite(
      shape.radius + 2 * shape.radiusStep + shape.clearance + shape.arch,
    ) ||
    !Number.isInteger(shape.segments) ||
    shape.segments < 1 ||
    shape.segments > 32
  )
    throw new Error(
      "Eyebrow fibres need finite dimensions, valid taper and bounded integral sampling.",
    );
}
