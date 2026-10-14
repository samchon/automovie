import type { IHumanFaceProjectedSkinCourseReading as IHumanFaceProjectedSkinCourseReadingImported } from "./IHumanFaceProjectedSkinCourseReading";
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
 * This kernel writes the caller-supplied accumulation array in place. A late
 * coordinate refusal can leave earlier output entries changed; orchestration
 * callers supply an uncommitted copy and discard it on failure. Source and
 * host correspondence must remain unchanged throughout the call.
 *
 * @evidence contracts/common.md#principled-implementation Extrinsic course distance and normalized arc station drive the authored compact quartic/squared-sine displacement along welded vertex normals; held vertices, the opposite half and endpoints remain unchanged, with no claim of tissue mechanics.
 * @evidence contracts/common.md#clear-and-simple-design One kernel owns width/offset/fade while the caller owns dimensional admission, native course compilation and the separate output accumulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Distance is compared before division to support positive subnormal widths; close second sheets can also move and require caller-held support. Non-Float32 coordinates refuse instead of clamping, with possible partial mutation of the owned output copy.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the exact kernel, metre and station meaning, extrinsic second-sheet limitation, boundary preservation, return meaning, invalidation and failure effects on source versus output.
 * @evidence contracts/performance.md#efficient-algorithms The kernel visits V source vertices once and each eligible course read scans S spans, giving O(VS) time with fixed XYZ work and transient point/reading arrays; a full vertex scan finds support without a separate topology-dependent spatial cache.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-compiled course metrics and host normals are reused for every vertex; width affects only weights, and changed source geometry requires new metrics/normals rather than reuse by matching width alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns changed positions, source, host, course and held identities; the kernel retains none after return/refusal and allocates no external handle, task or global cache.
 *
 * @author Samchon
 */
export function applyHumanFaceSkinCourseRelief(
  props: IHumanFaceSkinCourseRelief,
): boolean {
  const {
    host,
    source,
    changed,
    course,
    held,
    side,
  }: IHumanFaceSkinCourseRelief = props;
  const width: number = props.widthMetres,
    offset: number = props.offsetMetres;
  if (!(course.totalLengthMetres > 0)) return false;
  let supported: boolean = false;
  for (let vertex: number = 0; vertex < source.length / 3; vertex++) {
    if (held.has(vertex) || (side !== 0 && side * source[3 * vertex] <= 0))
      continue;
    const reading: IHumanFaceProjectedSkinCourseReadingImported = course.read(
      source.slice(3 * vertex, 3 * vertex + 3),
    );
    const station: number = reading.station;
    // Comparing distances before dividing preserves every positive width,
    // including subnormal metres; squared widths need not be representable.
    if (reading.distanceMetres >= width) continue;
    const radius: number = reading.distanceMetres / width;
    if (radius >= 1 || station <= 0 || station >= 1) continue;
    const support: number =
      (1 - radius * radius) ** 2 * Math.sin(Math.PI * station) ** 2;
    supported ||= support > 0;
    for (let axis: number = 0; axis < 3; axis++) {
      const next: number =
        changed[3 * vertex + axis] +
        offset * support * host.normals[3 * vertex + axis];
      if (!Number.isFinite(Math.fround(next)))
        throw new Error("Skin relief exceeds Float32 coordinates.");
      changed[3 * vertex + axis] = next;
    }
  }
  return supported;
}
