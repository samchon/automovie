import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitReliefCurve } from "./structures/IPortraitReliefCurve";

/**
 * Bind narrow anatomical section curves to one final skin. Each segment samples
 * its start and two interior thirds; the final endpoint is sampled once. The
 * interpolation is deliberately linear in the live attachment frame: the
 * engine's compact radial kernel supplies the smooth overlap, while the
 * authored controls retain the curve's measured end points and tangent scale.
 * Empty curves are identity; zero displacement controls are retained only as
 * interpolation anchors, so a curve can fade into an unchanged host.
 *
 * @evidence contracts/common.md#principled-implementation Each curve segment is sampled at its start and two interior thirds by linear interpolation of centre, radius and displacement in the live attachment frame, and the final control is sampled once, so the engine's compact kernel supplies the smooth overlap of a continuous path; zero-displacement controls are kept as anchors so a curve can fade into unchanged skin.
 * @evidence contracts/common.md#clear-and-simple-design A sampler over control pairs that emits engine fields; the kernel is the engine's.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; malformed curves refuse.
 * @evidence contracts/common.md#meaningful-documentation States the sampling rule and the identity for empty curves.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in, engine metres out through the /1000 conversions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A layer is a displacement field set, not a part or a group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits at most three fields per segment plus one, bounded by 32 controls per curve.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no measurement of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range It bounds no anatomical quantity.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitReliefCurveLayer defines and consumes no parameter channel of a form.
 */
export function createPortraitReliefCurveLayer(
  id: string,
  input: readonly IPortraitReliefCurve[],
): IPortraitSurfaceLayer {
  const curves = structuredClone(input);
  if (
    id.trim().length === 0 ||
    new Set(curves.map((curve) => curve.name)).size !== curves.length ||
    curves.some(
      (curve) =>
        curve.name.trim().length === 0 ||
        curve.points.length < 2 ||
        curve.points.length > 32 ||
        curve.points.some(
          (point) =>
            !Number.isInteger(point.anchor) ||
            point.anchor < 0 ||
            [point.offset, point.radius, point.displacement].some(
              (v) => v.length !== 3 || !v.every(Number.isFinite),
            ) ||
            point.radius.some((v) => v <= 0),
        ),
    )
  )
    throw new Error(
      "Anatomical relief curves need named controls, finite dimensions and positive radii.",
    );
  return {
    id,
    fields: (host) =>
      curves.flatMap((curve) => {
        const controls = curve.points.map((point) => {
          const attachment = host.positions[point.anchor];
          if (
            attachment === undefined ||
            attachment.length !== 3 ||
            !attachment.every(Number.isFinite)
          )
            throw new Error(
              "Anatomical relief curves need resident finite skin attachments.",
            );
          const centre = point.offset.map(
            (value, axis) => attachment[axis] + value,
          );
          if (!centre.every(Number.isFinite))
            throw new Error(
              "Anatomical relief curve centre exceeds its representable range.",
            );
          return { ...point, centre };
        });
        const result: IAutoMovieMeshDeformationField[] = [];
        for (let i = 0; i < controls.length - 1; i++) {
          const a = controls[i],
            b = controls[i + 1];
          for (let sample = 0; sample < 3; sample++) {
            const t = sample / 3,
              interpolate = (
                axis: 0 | 1 | 2,
                values: "radius" | "displacement",
              ) => a[values][axis] * (1 - t) + b[values][axis] * t;
            result.push({
              center: {
                x: (a.centre[0] * (1 - t) + b.centre[0] * t) / 1000,
                y: (a.centre[1] * (1 - t) + b.centre[1] * t) / 1000,
                z: (a.centre[2] * (1 - t) + b.centre[2] * t) / 1000,
              },
              radius: {
                x: interpolate(0, "radius") / 1000,
                y: interpolate(1, "radius") / 1000,
                z: interpolate(2, "radius") / 1000,
              },
              displacement: {
                x: interpolate(0, "displacement") / 1000,
                y: interpolate(1, "displacement") / 1000,
                z: interpolate(2, "displacement") / 1000,
              },
              stretch: { x: 0, y: 0, z: 0 },
            });
          }
        }
        const last = controls.at(-1)!;
        if (last.displacement.some((value) => value !== 0))
          result.push({
            center: {
              x: last.centre[0] / 1000,
              y: last.centre[1] / 1000,
              z: last.centre[2] / 1000,
            },
            radius: {
              x: last.radius[0] / 1000,
              y: last.radius[1] / 1000,
              z: last.radius[2] / 1000,
            },
            displacement: {
              x: last.displacement[0] / 1000,
              y: last.displacement[1] / 1000,
              z: last.displacement[2] / 1000,
            },
            stretch: { x: 0, y: 0, z: 0 },
          });
        return result;
      }),
  };
}
