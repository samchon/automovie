import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";




import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import type { IHumanFaceBrowShaftsProps } from "./IHumanFaceBrowShaftsProps";

import { createHumanFaceBrowCourse } from "./createHumanFaceBrowCourse";
import { createHumanFaceBrowReferenceGuides } from "./createHumanFaceBrowReferenceGuides";

/**
 * Build one eyebrow's shafts on the skin they grow from.
 *
 * Attachment follows fixed source material coordinates; physical arc and normal
 * readings belong to the current skin host:
 *
 * - **Root.** The band between the registered lower and upper boundary is
 *   parameterized in the actual shape-only reference: `u` along the brow
 *   (uniform Catmull-Rom through the native boundary positions) and across it.
 *   Shaft `i` of `n` takes `u = (i + 0.5) / n`
 *   and a root fraction from the golden-ratio sequence inside `rootBand`.
 *   The shared reference-guide owner defines its 3D point before any material
 *   disk is selected. Native reference registration transports it to current skin.
 * - **Growth direction.** The shaft's course runs from its root fraction to
 *   its tip fraction across the band (`span`, or the flow profile's `tip`),
 *   displaced toward the lateral end of the brow by `outwardBend * t^2`. The
 *   lateral direction is the source-reference band's tangent along `u`.
 *   Its finite metre displacement registers on that reference skin once;
 *   requested resolution supplies material-guide chords lifted by actual
 *   native triangle adjacency. No performed-state projection selects support.
 *   These millimetre bend values describe the reference guide; a deformed
 *   chart's final surface-tip displacement is a separate measured quantity.
 * - **Course length.** `L` is that native course's current accumulated length,
 *   derived from the band and bend. It is not an authored shaft length or
 *   the final offset centreline's total arc length.
 * - **Emergence.** With `emergenceDegrees = e`, ring fraction `t` reads actual
 *   course distance `L t cos(e)` and adds outward rise `L t sin(e)`. The first
 *   positive course span supplies unit tangent `T` and supporting facet normal
 *   `N0`. This frame retains source support without another nearest query.
 * - **Height and thickness.** Let `q(t)=t²(3-2t)`. Radius is
 *   `(radius + (i mod 3) radiusStep) (1 - taper q(t))`; the centreline height
 *   is that radius plus clearance, `arch sin²(pi t)` and the emergence rise.
 *   Radius retains both endpoint dimensions and arch retains its peak height.
 * - **Normal field.** `q(t)` blends `N0` toward the current host's smooth
 *   normal before normalization. Its root derivative is zero, as are the
 *   taper and arch derivatives. Thus the complete analytic centreline has
 *   `C'(0)=L(T cos(e)+N0 sin(e))`, so its initial tangent has angle `e` even
 *   with nonzero arch/taper and varying host normals.
 *
 * A tube is eight sides around the centreline, oriented by its construction
 * normal field at each ring. A ribbon uses the same centreline and transverse
 * frame; the root ring uses the analytic emergence tangent. Thinning removes
 * whole shafts by the end-fade envelope and a
 * survivor keeps its sequence index in its id `<side>-brow-hair-<i>`. The
 * medial end of the brow is the boundary end nearer the midsagittal plane,
 * read from the band itself.
 *
 * Positions are head-frame metres; the profile's millimetres are converted
 * once on entry. Zero shafts produce no part. An invalid profile, a boundary
 * with fewer than two resident vertices and a shaft whose course has no
 * length refuse. Nothing here keeps a shaft out of the skin: the brow contact
 * admission reads the emitted geometry.
 * The finite lattice approximates that analytic centreline; its first chord
 * is not an independent exact measurement of the initial tangent. This
 * replaces the previous parameter-driven course and linear-taper/sine-arch
 * representation and global-nearest course assumption. Affected brow meshes, contact reports, Face/Person results,
 * static exports and rendered observations require the new basis.
 */
export function buildHumanFaceBrowShafts(
  props: IHumanFaceBrowShaftsProps,
): IAutoMovieModelPart[] {
  const { chart, binding, count } = props;
  const shape = structuredClone(props.profile);
  const guides = createHumanFaceBrowReferenceGuides({
    positions: props.referencePositions,
    binding,
    count,
    profile: shape,
  });
  const millimetre = 0.001;
  const emergence = ((shape.emergenceDegrees ?? 0) * Math.PI) / 180;
  const rise = Math.sin(emergence), advance = Math.cos(emergence);
  const rings = shape.segments + 1;
  const parts: IAutoMovieModelPart[] = [];
  for (const guide of guides) {
    const i = guide.index;
    const metric = createHumanFaceBrowCourse(
      chart.compile(guide.points.map((point) => chart.register(point))),
    );
    const length = metric.lengthMetres;
    const progress = (t: number): number => t * t * (3 - 2 * t);
    const radius = (t: number): number =>
      (shape.radius + (i % 3) * shape.radiusStep) *
      (1 - shape.taper * progress(t)) *
      millimetre;
    const centres: number[][] = [],
      normals: number[][] = [];
    for (let ring = 0; ring < rings; ring++) {
      const t = ring / shape.segments;
      const foot = metric.frameAt(length * t * advance);
      const weight = progress(t);
      const normal = unit(
        foot.normal.map(
          (value, axis) =>
            metric.rootNormal[axis] * (1 - weight) + value * weight,
        ),
      );
      const height =
        radius(t) +
        (shape.clearance + shape.arch * Math.sin(Math.PI * t) ** 2) *
          millimetre +
        length * t * rise;
      centres.push(
        foot.point.map((value, axis) => value + normal[axis] * height),
      );
      normals.push(normal);
    }
    const frames = centres.map((at, ring) => {
      const next = centres[Math.min(rings - 1, ring + 1)],
        previous = centres[Math.max(0, ring - 1)];
      const tangent =
        ring === 0
          ? unit(
              metric.rootTangent.map(
                (value, axis) =>
                  value * advance + metric.rootNormal[axis] * rise,
              ),
            )
          : unit(next.map((value, axis) => value - previous[axis]));
      const right = unit(cross(normals[ring], tangent));
      return { at, right, up: cross(tangent, right) };
    });
    const mesh: IAutoMovieMesh =
      shape.representation === undefined
        ? triangulateSurfaceLattice(
            (around, v) => {
              const ring = Math.round(v * shape.segments);
              const { at, right, up } = frames[ring],
                r = radius(ring / shape.segments),
                c = Math.cos(2 * Math.PI * around),
                s = Math.sin(2 * Math.PI * around);
              return {
                x: at[0] + r * (right[0] * c + up[0] * s),
                y: at[1] + r * (right[1] * c + up[1] * s),
                z: at[2] + r * (right[2] * c + up[2] * s),
              };
            },
            8,
            shape.segments,
          )
        : triangulateSurfaceLattice(
            (across, v) => {
              const ring = Math.round(v * shape.segments);
              const { at, right } = frames[ring],
                r = radius(ring / shape.segments) * (2 * across - 1);
              return {
                x: at[0] + r * right[0],
                y: at[1] + r * right[1],
                z: at[2] + r * right[2],
              };
            },
            1,
            shape.segments,
          );
    const id = binding.side + "-brow-hair-" + i;
    parts.push({
      id,
      name: id,
      material: "brows",
      attachedBone: null,
      transform: null,
      geometry: { type: "mesh", mesh },
    });
  }
  return parts;
}

const cross = (a: readonly number[], b: readonly number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const unit = (vector: readonly number[]): number[] => {
  const length = Math.hypot(...vector);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("An eyebrow shaft needs a finite nonzero direction.");
  return vector.map((value) => value / length);
};
