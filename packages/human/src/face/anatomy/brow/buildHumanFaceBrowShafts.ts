import type {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import type { IHumanFaceSkinChartCoordinate } from "../skin/IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceBrowCourse } from "./IHumanFaceBrowCourse";
import type { IHumanFaceBrowReferenceGuide } from "./IHumanFaceBrowReferenceGuide";
import type { IHumanFaceBrowShaftsProps } from "./IHumanFaceBrowShaftsProps";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
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
 *
 * @evidence contracts/common.md#principled-implementation Native reference guides are registered once on the source chart and lifted through retained incidence; positive current course spans define actual metric sampling and the emergence frame.
 * @evidence contracts/common.md#clear-and-simple-design Shared guide/course owners supply source population and native arc readings while this function constructs the tube/ribbon lattice and stable original ordinal IDs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The finite lattice approximates the analytic centreline; no nearest performed-state reseating, changed source profile or independent exact first-chord angle proof is used.
 * @evidence contracts/common.md#meaningful-documentation The prose gives reference guide semantics, smooth taper/normal/arch laws, metre conversion, supported degeneracies and contact-admission responsibility.
 * @evidence contracts/performance.md#efficient-algorithms For N surviving shafts and S segments, emission is O(N*S) vertices with fixed cross-section width; chart registration/walks and course frame span scans add their actual support-dependent cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied chart serves all guides and each shaft's compiled metric course is reused for its ring stations; source/reference/topology changes invalidate it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned model parts survive; per-shaft courses, centres, normals and frames expire after emission while the caller owns the shared chart and source profile.
 */
export function buildHumanFaceBrowShafts(
  props: IHumanFaceBrowShaftsProps,
): IAutoMovieModelPart[] {
  const { chart, binding, count }: IHumanFaceBrowShaftsProps = props;
  const shape: IPortraitEyebrowProfile = structuredClone(props.profile);
  const guides: IHumanFaceBrowReferenceGuide[] =
    createHumanFaceBrowReferenceGuides({
      positions: props.referencePositions,
      binding,
      count,
      profile: shape,
    });
  const millimetre: number = 0.001 as const;
  const emergence: number = ((shape.emergenceDegrees ?? 0) * Math.PI) / 180;
  const rise: number = Math.sin(emergence),
    advance: number = Math.cos(emergence);
  const rings: number = shape.segments + 1;
  const parts: IAutoMovieModelPart[] = [];
  for (const guide of guides) {
    const i: number = guide.index;
    const metric: IHumanFaceBrowCourse = createHumanFaceBrowCourse(
      chart.compile(
        guide.points.map(
          (point: readonly number[]): IHumanFaceSkinChartCoordinate =>
            chart.register(point),
        ),
      ),
    );
    const length: number = metric.lengthMetres;
    const progress: (t: number) => number = (t: number): number =>
      t * t * (3 - 2 * t);
    const radius: (t: number) => number = (t: number): number =>
      (shape.radius + (i % 3) * shape.radiusStep) *
      (1 - shape.taper * progress(t)) *
      millimetre;
    const centres: number[][] = [],
      normals: number[][] = [];
    for (let ring: number = 0; ring < rings; ring++) {
      const t: number = ring / shape.segments;
      const foot: IHumanFaceSkinFrame = metric.frameAt(length * t * advance);
      const weight: number = progress(t);
      const normal: number[] = unit(
        foot.normal.map(
          (value: number, axis: number): number =>
            metric.rootNormal[axis] * (1 - weight) + value * weight,
        ),
      );
      const height: number =
        radius(t) +
        (shape.clearance + shape.arch * Math.sin(Math.PI * t) ** 2) *
          millimetre +
        length * t * rise;
      centres.push(
        foot.point.map(
          (value: number, axis: number): number =>
            value + normal[axis] * height,
        ),
      );
      normals.push(normal);
    }
    const frames: { at: number[]; right: number[]; up: number[] }[] =
      centres.map(
        (
          at: number[],
          ring: number,
        ): { at: number[]; right: number[]; up: number[] } => {
          const next: number[] = centres[Math.min(rings - 1, ring + 1)],
            previous: number[] = centres[Math.max(0, ring - 1)];
          const tangent: number[] =
            ring === 0
              ? unit(
                  metric.rootTangent.map(
                    (value: number, axis: number): number =>
                      value * advance + metric.rootNormal[axis] * rise,
                  ),
                )
              : unit(
                  next.map(
                    (value: number, axis: number): number =>
                      value - previous[axis],
                  ),
                );
          const right: number[] = unit(cross(normals[ring], tangent));
          return { at, right, up: cross(tangent, right) };
        },
      );
    const mesh: IAutoMovieMesh =
      shape.representation === undefined
        ? triangulateSurfaceLattice(
            (around: number, v: number): IAutoMovieVector3 => {
              const ring: number = Math.round(v * shape.segments);
              const {
                  at,
                  right,
                  up,
                }: { at: number[]; right: number[]; up: number[] } =
                  frames[ring],
                r: number = radius(ring / shape.segments),
                c: number = Math.cos(2 * Math.PI * around),
                s: number = Math.sin(2 * Math.PI * around);
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
            (across: number, v: number): IAutoMovieVector3 => {
              const ring: number = Math.round(v * shape.segments);
              const {
                  at,
                  right,
                }: { at: number[]; right: number[]; up: number[] } =
                  frames[ring],
                r: number = radius(ring / shape.segments) * (2 * across - 1);
              return {
                x: at[0] + r * right[0],
                y: at[1] + r * right[1],
                z: at[2] + r * right[2],
              };
            },
            1,
            shape.segments,
          );
    const id: string = binding.side + "-brow-hair-" + i;
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

const cross: (a: readonly number[], b: readonly number[]) => number[] = (
  a: readonly number[],
  b: readonly number[],
): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const unit: (vector: readonly number[]) => number[] = (
  vector: readonly number[],
): number[] => {
  const length: number = Math.hypot(...vector);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("An eyebrow shaft needs a finite nonzero direction.");
  return vector.map((value: number): number => value / length);
};
