import {
  Vector3,
  type createAutoMovieMeshSeparationQuery,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import { fitHumanFaceHairRibbonRows } from "./fitHumanFaceHairRibbonRows";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairFreeDistanceBound } from "./humanFaceHairFreeDistanceBound";
import { selectHumanFaceHairStations } from "./selectHumanFaceHairStations";

const { perpendicular, direction: requireDirection } = humanFaceHairFrame;

/**
 * Mesh the actual stem and free stations with transported ribbon frames.
 * All rooted transition stations through freeFrom are retained. Only the free
 * remainder is simplified by the existing width/clearance chord tolerance.
 * Root tangent and finite stem curvature therefore survive as actual rows.
 * UV v and taper use cumulative metric over every original station.
 *
 * Width is the density owner's coverage proxy, not an authored shaft diameter.
 * The old zero-width root fan is represented explicitly by positive stem rows:
 * a stem row's half width is capped by its own positive signed skin gap. The
 * 1-Lipschitz distance ball keeps that whole transverse row nonpenetrating.
 * Free rows retain the existing requested-clearance corner fit. This is an
 * explicit surface-boundary profile, not a buried follicle model or a reduction
 * of the requested free-path clearance. Zero-width stem rows refuse.
 *
 * Preliminary corner fits do not qualify complete ribbon interiors. The shared
 * fitHumanFaceHairRibbonRows owner subsequently verifies whole rows and swept
 * convex cells against source and Float32 hosts under the remaining root budget.
 * Root contact uses canonical original-support registration with bounded caps;
 * non-root stem cells remain strictly separated and free cells keep requested
 * clearance. Hair-to-hair and assembled neighbor observation remain the builder's
 * responsibility;
 * numerical input metadata is required and legacy omission refuses by name.
 *
 * The first nonparallel tangent fixes the binormal of the emergence/combing
 * plane. Starting from skin normal cross root tangent would be singular for
 * normal emergence and would select a world axis even when the curve specifies
 * a combing plane. A completely straight curve instead uses the supplied normal
 * and the shared frame's least-aligned-axis convention when both are parallel.
 * Successive averaged tangents use Rodrigues' minimal rotation. Antiparallel
 * tangents have no unique minimal transport and refuse. Projection removes
 * accumulated floating-point drift from the transverse frame before normalizing.
 * The root frame's sign is chosen so the ribbon's triangles face along the
 * root's outward normal: a ribbon over the scalp faces away from it.
 * Generated triangles must remain finite and nondegenerate. This does not
 * establish root-fan clearance, self-intersection freedom or hair-to-hair contact.
 *
 * Each curve carries its own width, the scalp its root stands for
 * (`humanFaceHairDensity`), and the fibre path it was integrated on keeps only
 * the fibre's clearance, so this owner is where the ribbon's own corners are
 * kept out of the skin. A corner no farther from its station than the station's
 * own free distance less the requested clearance cannot reach the surface,
 * since the nearest surface point is that far away; such a half width is taken
 * without a query. A wider one is measured, and where it would enter, the half
 * width is solved back by a safeguarded Newton step on the corner's own signed
 * distance, falling back on that provable bound. This requested-gap fit applies
 * to free rows. Earlier stem rows use their own positive signed-gap ball rather
 * than a half-step/full-clearance premise; a nonpositive row width refuses.
 * Both sides take the tighter of the two half widths, so a ribbon stays
 * centred on the fibre it stands for instead of sliding off it. A ribbon
 * therefore narrows where the scalp is close and opens to its full covering
 * width as it leaves, instead of the whole path being lifted by half a ribbon.
 * Nothing here keeps two ribbons apart from each other.
 * The signed distance of a closed set is 1-Lipschitz: a sampled station at
 * distance d bounds any later station's free distance below by d minus the
 * Euclidean separation. When that bound still exceeds the full half width
 * plus requested clearance, the exact ribbon is already certified and no
 * further skin query or width fit is needed. A conservative floating-point
 * margin retains the ordinary query at the boundary. This only skips work; every
 * kept station and every emitted triangle stays the same.
 * Positions are already metres; no portrait millimetre conversion applies.
 * Neither input curves nor layer fields mutate; the mesh owns all its buffers.
 * Original pairs/topology/centres remain; actual widths may decrease under whole
 * geometry constraints and are reported separately from nominal coverage.
 *
 * @evidence contracts/common.md#principled-implementation Each curve becomes a
 *   ribbon centred on its own polyline: the transverse frame starts from the
 *   first non-parallel tangent and is carried along the kept stations by the
 *   minimal rotation between successive averaged tangents (Rodrigues), then
 *   re-projected off the tangent to remove drift, so the ribbon does not twist
 *   except where the curve does. Antiparallel tangents have no unique minimal
 *   rotation and refuse. The half width is the taper's radius, and where a
 *   corner would enter the skin it is solved back by a safeguarded Newton step
 *   on the corner's own signed distance, falling back on the provable bound free
 *   distance minus clearance, and both sides take the tighter width so the
 *   ribbon stays centred. Stem rows retain a radius no larger than their measured skin gap, while free rows retain the existing requested gap. Skipping a query when the 1-Lipschitz bound already
 *   certifies the full width changes no vertex. Ribbon-to-ribbon contact and
 *   self-intersection are not established, as the comment says.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the
 *   ribbon, taking the station choice from selectHumanFaceHairStations and the
 *   shared contact proof from humanFaceHairFreeDistanceBound; frame transport,
 *   width fit and triangle assembly stay together because they share the running
 *   frame and the witness sample.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: widths, taper and clearance come from the
 *   density, the layer and the same query the integrator used, and a station
 *   that cannot be fitted refuses instead of being patched.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the frame construction, facing, fitting rule, the certified skip, ownership
 *   of the buffers and what is not established.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function builds one mesh for all the curves of a layer; the hair builder
 *   names the part and its material.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidence contracts/modeling.md#emitted-geometry A curve with k retained stations emits 2k-1 vertices and 2k-3 triangles. All stem stations through freeFrom are retained; only the free remainder follows the existing tolerance. Source rows preserve the initial chord and finite stem curvature without resampling.
 * @evidence contracts/modeling.md#spatial-conventions Curve stations and query
 *   are metres in the head frame; tangents and frames are unit vectors; UV u is
 *   the ribbon side and v the cumulative arc length over the measured total,
 *   which the taper shares. No portrait millimetre conversion is applied.
 * @evidence contracts/modeling.md#shared-boundaries The same current skin query defines each row's fit. Stem half widths are bounded by their own positive signed gap and free corners retain the requested gap. The root vertex remains the surface attachment. Those preliminary row/corner facts only bound the initial profile. fitHumanFaceHairRibbonRows then certifies the complete source and actual Float32 rows/convex cells under the remaining root budget, with bounded canonical root-support contact and strict separation from every other host face. Nominal density coverage stays fixed while actual fitted width may decrease. Hair-to-hair nonintersection remains unproved and the assembled builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function buildHumanFaceHairMesh(
  curves: IAutoMovieHumanFaceHairCurve[],
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "taper" | "clearance">,
  props: {
    widths: readonly number[];
    query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
    separation: {
      source: ReturnType<typeof createAutoMovieMeshSeparationQuery>;
      represented: ReturnType<typeof createAutoMovieMeshSeparationQuery>;
    };
    budgets: readonly { remaining: number }[];
    attachments: readonly {
      triangle: number;
      weights: readonly number[];
      supports: readonly number[];
    }[];
  },
): IAutoMovieMesh {
  if (
    props.separation === undefined ||
    props.separation === null ||
    typeof props.separation.source !== "function" ||
    typeof props.separation.represented !== "function" ||
    !Array.isArray(props.budgets) ||
    !Array.isArray(props.attachments) ||
    props.budgets.length !== curves.length ||
    props.attachments.length !== curves.length
  )
    throw new Error(
      "Numerical hair mesh requires same-source separation readers, remaining budgets and canonical attachments for every curve.",
    );
  if (props.widths.length !== curves.length)
    throw new Error("Every numerical hair curve needs its own ribbon width.");
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  const outward = (
    point: IAutoMovieVector3,
    hit: ReturnType<typeof props.query>,
  ): IAutoMovieVector3 =>
    hit.distance === 0
      ? Vector3.create(hit.normal[0], hit.normal[1], hit.normal[2])
      : requireDirection(
          Vector3.scale(
            Vector3.subtract(
              point,
              Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
            ),
            hit.signedDistance < 0 ? -1 : 1,
          ),
        );
  const fit = (
    station: IAutoMovieVector3,
    across: IAutoMovieVector3,
    radius: number,
    free: number,
  ): number => {
    const bound = free - layer.clearance;
    if (radius <= bound) return radius;
    if (!(bound > 0))
      throw new Error(
        "A numerical hair station stands too close to the surface for its own ribbon.",
      );
    let fitted = radius;
    for (let attempt = 0; attempt < 8; attempt++) {
      const corner = Vector3.add(station, Vector3.scale(across, fitted));
      const hit = props.query([corner.x, corner.y, corner.z]);
      if (hit.signedDistance >= layer.clearance) return fitted;
      const step =
        fitted -
        (layer.clearance - hit.signedDistance) /
          Math.abs(Vector3.dot(across, outward(corner, hit)));
      fitted =
        Number.isFinite(step) && step > bound && step < fitted
          ? step
          : (bound + fitted) / 2;
    }
    return bound;
  };
  curves.forEach((curve, ordinal) => {
    const width = props.widths[ordinal];
    if (!Number.isFinite(width) || width <= 0)
      throw new Error("A numerical hair ribbon needs a positive width.");
    const offset = positions.length / 3;
    const points = curve.points;
    if (
      !Number.isInteger(curve.freeFrom) ||
      curve.freeFrom < 1 ||
      curve.freeFrom >= points.length
    )
      throw new Error(
        "Hair curve requires valid freeFrom rooted boundary metadata.",
      );
    const tangents = points.map((_, at) =>
      requireDirection(
        Vector3.subtract(
          points[Math.min(at + 1, points.length - 1)],
          points[Math.max(at - 1, 0)],
        ),
      ),
    );
    const distances = [0];
    let sampled: { point: IAutoMovieVector3; free: number } | undefined;
    for (let at = 1; at < points.length; at++)
      distances.push(
        distances[at - 1] +
          Vector3.length(Vector3.subtract(points[at], points[at - 1])),
      );
    const total = distances[distances.length - 1];
    const radiusAt = (t: number): number =>
      (width / 2) *
      (1 -
        ((1 - layer.taper.tipWidth) * Math.max(0, t - layer.taper.start)) /
          (1 - layer.taper.start));
    // A ribbon needs only the stations that carry its bends: a dropped one lies
    // within a tenth of the ribbon's half width there, and within a quarter of
    // the requested clearance, of the straight run that replaces it.
    // Keep the canonical launch as the first free row. Simplification only
    // starts there, so the emitted fan cannot replace the emergence chord.
    const kept = [
      ...Array.from({ length: curve.freeFrom }, (_, at) => at),
      ...selectHumanFaceHairStations({
        points: points.slice(curve.freeFrom),
        tolerance: (_, to) =>
          Math.min(
            0.1 * radiusAt(distances[to + curve.freeFrom] / total),
            0.25 * layer.clearance,
          ),
      }).map((at) => at + curve.freeFrom),
    ];
    const reference =
      tangents.find(
        (tangent) =>
          Vector3.length(Vector3.cross(tangents[0], tangent)) >
          64 * Number.EPSILON,
      ) ?? curve.normal;
    // The frame's sign is free, and with this winding it sets which way the
    // ribbon's triangles face (tangent cross frame). A ribbon lies over the
    // scalp, so it faces away from it: the renderer offsets a shadow lookup
    // along the stored normal, and a ribbon facing into the head reads its
    // own shadow on the lit side. A root emerging along the normal faces
    // nowhere yet, so the bend it combs into decides with it.
    let frame = perpendicular(tangents[0], reference);
    const facing = [tangents[0], reference].reduce(
      (sum, tangent) =>
        sum + Vector3.dot(Vector3.cross(tangent, frame), curve.normal),
      0,
    );
    if (facing < 0) frame = Vector3.scale(frame, -1);
    const rows: Parameters<typeof fitHumanFaceHairRibbonRows>[0][number][] = [
      {
        point: points[0],
        across: frame,
        radius: 0,
        nominal: radiusAt(0),
        v: 0,
        region: "root",
      },
    ];
    for (let order = 1; order < kept.length; order++) {
      const at = kept[order];
      const before = tangents[kept[order - 1]],
        after = tangents[at];
      const cosine = Math.max(-1, Math.min(1, Vector3.dot(before, after)));
      if (1 + cosine <= 64 * Number.EPSILON)
        throw new Error(
          "Antiparallel hair tangents have no unique transverse transport.",
        );
      const axis = Vector3.cross(before, after);
      frame = Vector3.add(
        Vector3.add(frame, Vector3.cross(axis, frame)),
        Vector3.scale(
          Vector3.cross(axis, Vector3.cross(axis, frame)),
          1 / (1 + cosine),
        ),
      );
      frame = requireDirection(
        Vector3.subtract(
          frame,
          Vector3.scale(after, Vector3.dot(frame, after)),
        ),
      );
      const t = distances[at] / total;
      const radius = radiusAt(t);
      let fitted = radius;
      if (
        at < curve.freeFrom ||
        sampled === undefined ||
        !humanFaceHairFreeDistanceBound({
          sampled: sampled.point,
          distance: sampled.free,
          candidate: points[at],
          required: radius + layer.clearance,
          allowance: 0,
        })
      ) {
        const free = props.query([
          points[at].x,
          points[at].y,
          points[at].z,
        ]).signedDistance;
        sampled = { point: points[at], free };
        fitted =
          at < curve.freeFrom
            ? Math.min(radius, free)
            : Math.min(
                ...[-1, 1].map((side) =>
                  fit(points[at], Vector3.scale(frame, side), radius, free),
                ),
              );
      }
      if (!(fitted > 0))
        throw new Error(
          "A rooted hair ribbon needs a positive exterior row width.",
        );
      rows.push({
        point: points[at],
        across: frame,
        radius: fitted,
        nominal: radius,
        v: t,
        region: at < curve.freeFrom ? "stem" : "free",
      });
    }
    const fittedRows = fitHumanFaceHairRibbonRows(rows, {
      clearance: layer.clearance,
      ...props.separation,
      budget: props.budgets[ordinal],
      attachment: props.attachments[ordinal],
    });
    positions.push(points[0].x, points[0].y, points[0].z);
    uvs.push(0.5, 0);
    for (let order = 1; order < fittedRows.length; order++) {
      const rowData = fittedRows[order];
      for (const side of [-1, 1]) {
        const p = Vector3.add(
          rowData.point,
          Vector3.scale(rowData.across, side * rowData.radius),
        );
        positions.push(p.x, p.y, p.z);
        uvs.push((side + 1) / 2, rowData.v);
      }
      const row = offset + 2 * order - 1;
      if (order === 1) indices.push(offset, row, row + 1);
      else indices.push(row - 2, row, row - 1, row - 1, row, row + 1);
    }
  });
  const point = (id: number) =>
    Vector3.create(
      positions[3 * id],
      positions[3 * id + 1],
      positions[3 * id + 2],
    );
  for (let at = 0; at < indices.length; at += 3) {
    const a = point(indices[at]),
      b = point(indices[at + 1]),
      c = point(indices[at + 2]);
    const area = Vector3.length(
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
    if (!Number.isFinite(area) || area === 0)
      throw new Error(
        "Numerical hair generated an unrepresentable ribbon triangle.",
      );
  }
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs,
    skin: null,
  };
}
