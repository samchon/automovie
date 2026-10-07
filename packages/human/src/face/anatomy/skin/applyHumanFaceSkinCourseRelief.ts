import type { IHumanFaceSkinCourseRelief } from "./IHumanFaceSkinCourseRelief";

/**
 * Displace the skin along its own normal around one course lying on it.
 *
 * The caller supplies a continuous course on the host's actual triangles,
 * independently of width. Its native source-chart owner admits support
 * rather than choosing a nearest sheet independently along a free chord. For
 * each skin vertex its extrinsic distance `d` and normalized arc station `s`
 * come from that one compiled course. The vertex moves by
 * `offset * (1 - (d / width)^2)^2 * sin(pi s)^2` along the host's smooth
 * vertex normal. The transverse kernel reaches zero with zero slope at the
 * width and the longitudinal factor at both ends, so the relief joins the
 * untouched skin without a step. Both factors are authored smooth conventions
 * and not tissue mechanics.
 *
 * Distance is Euclidean in space to a curve on the surface, so a second sheet
 * of skin that passes within the width of the course (the inner face of a
 * thin fold) also moves; the caller holds the vertices that must not. A
 * vertex outside the course's anatomical half, a held vertex and a vertex at
 * or beyond an end station are untouched. The function returns whether any
 * vertex received a nonzero weight, and refuses a coordinate Float32 cannot
 * represent. Width affects only this kernel. The course compiler owns native
 * feature partitioning and arithmetic refusal; a changed skin needs a new host
 * and invalidates affected relief fields, normals and contact references.
 *
 * @evidence contracts/common.md#principled-implementation Seating the course and displacing along the surface normal define the relief relative to the skin, so its depth is the authored offset wherever the skin faces; a displacement along a head axis delivers only the cosine of the skin's inclination and shears the surface where it turns. `(1 - r^2)^2` is C1 at `r = 1` and `sin^2` is C1 at the ends.
 * @evidence contracts/common.md#clear-and-simple-design One kernel for every relief owner; owners supply their native courses, widths and offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No region name or landmark is known here; nothing is clamped and an unrepresentable result refuses.
 * @evidence contracts/common.md#meaningful-documentation States the formula, both conventions, the second-sheet limit and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres in and out; displacement is along the host's outward smooth normal.
 * @evidence contracts/modeling.md#shared-boundaries Zero value and zero slope at the kernel's edge keep the relieved skin continuous in position and normal with the skin around it, and held vertices keep the lip margin and landmarks exactly.
 * @evidence contracts/modeling.md#parameter-channels Width sets the transverse extent and offset the central displacement; neither changes the other.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function displaces vertices of an existing part and defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief owners that call this observe their result.
 * @evidence contracts/anatomy.md#anatomical-source The kernel shapes are authored conventions; no crease profile was read from a measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The calling relief owners admit their inputs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The calling relief owners define the public inputs.
 * @author Samchon
 */
export function applyHumanFaceSkinCourseRelief(
  props: IHumanFaceSkinCourseRelief,
): boolean {
  const { host, source, changed, course, held, side } = props;
  const width = props.widthMetres,
    offset = props.offsetMetres;
  if (!(course.totalLengthMetres > 0)) return false;
  let supported = false;
  for (let vertex = 0; vertex < source.length / 3; vertex++) {
    if (held.has(vertex) || (side !== 0 && side * source[3 * vertex] <= 0))
      continue;
    const reading = course.read(source.slice(3 * vertex, 3 * vertex + 3));
    const station = reading.station;
    // Comparing distances before dividing preserves every positive width,
    // including subnormal metres; squared widths need not be representable.
    if (reading.distanceMetres >= width) continue;
    const radius = reading.distanceMetres / width;
    if (radius >= 1 || station <= 0 || station >= 1) continue;
    const support =
      (1 - radius * radius) ** 2 * Math.sin(Math.PI * station) ** 2;
    supported ||= support > 0;
    for (let axis = 0; axis < 3; axis++) {
      const next =
        changed[3 * vertex + axis] +
        offset * support * host.normals[3 * vertex + axis];
      if (!Number.isFinite(Math.fround(next)))
        throw new Error("Skin relief exceeds Float32 coordinates.");
      changed[3 * vertex + axis] = next;
    }
  }
  return supported;
}
