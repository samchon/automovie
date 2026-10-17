import type { Plane } from "../geometry/Plane.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { selfCrossings } from "../geometry/selfCrossings.ts";
import { sub } from "../geometry/sub.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import type { FootObservations } from "./FootObservations.ts";
import { clipFootArcs } from "./clipFootArcs.ts";
import { footLoopRecord } from "./footLoopRecord.ts";
import { isolateFootSkin } from "./isolateFootSkin.ts";

/**
 * Extracts native reference foot sections in physical frames and reserves independent stations.
 * The longitudinal axis follows the horizontal ankle-to-second-toe rig direction.
 * Axis, level and sagittal families alternate fitting and reserved stations; every
 * 45-degree oblique plane is reserved. Station spacing is an observation setting,
 * not an anatomical coefficient or a claim about between-station surface error.
 *
 * The ankle boundary is supplied by its limb owner. Its stored plane clips source
 * arcs, while a later surface consumer must use the exact saved boundary ring and
 * reconcile the small inconsistency from independently rounded points and axes.
 * Closed sections are counterclockwise measurement records; outward winding remains
 * unqualified. Planar crossing counts describe source arcs rather than silhouettes.
 *
 * @evidence contracts/common.md#principled-implementation Physical cutting planes preserve exact source segments; independent odd stations and obliques distinguish observation quality from fitting and surface interpolation loss.
 * @evidence contracts/common.md#clear-and-simple-design One regional producer composes shared cutting and orientation with the foot's single supplied ankle boundary; input provenance and publication belong to its CLI.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity catalogue, baked mesh or expected anatomy is used; the source rig defines frames, missing nail geometry stays unsupported and clipped intervals stay open.
 * @evidence contracts/common.md#meaningful-documentation Documents frame, station roles, source order, rounded shared-boundary limits, source crossings, unsupported orientation and the distinction from anatomical reconstruction.
 * @evidence contracts/performance.md#efficient-algorithms A compact foot scope is reused across s stations; plane intersection costs O(s times (v plus t)), and per-section crossing scans use the shared spatial binning operation; output storage follows emitted intersection points.
 * @evidence contracts/performance.md#reuse-equivalent-work Source isolation, rig axes and the supplied ankle plane are computed once per foot; the four section families reuse them without a cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each family is limited to 4096 stations before allocation; arrays belong to the invocation and returned observations, and no file, process or retained cache is acquired.
 */
export function extractFootObservations(
  skin: Skin,
  side: "l" | "r",
  shared: Section,
  stationStepMm: number = 1,
): FootObservations {
  if (
    skin.pose !== "native-A" ||
    shared.pose !== "native-A" ||
    !shared.loops.some((loop: LoopRecord): boolean => loop.closed)
  )
    throw new Error(
      "Native source and a closed shared ankle boundary required",
    );
  if (!Number.isFinite(stationStepMm) || stationStepMm <= 0)
    throw new Error("Positive finite foot observation spacing required");
  const ankle: V3 | undefined = skin.bones.get(`foot_${side}`)?.pos;
  const calf: V3 | undefined = skin.bones.get(`calf_${side}`)?.pos;
  const toe: V3 | undefined = skin.bones.get(`indextoe_02_${side}`)?.pos;
  if (!ankle || !calf || !toe || dist(ankle, toe) === 0)
    throw new Error(
      "Qualified ankle, calf and second-toe rig markers required",
    );
  const axis: V3 = norm([toe[0] - ankle[0], 0, toe[2] - ankle[2]]);
  if (Math.hypot(...axis) === 0)
    throw new Error("Foot rig has no horizontal longitudinal direction");
  const medial: V3 = mul(norm(cross([0, 1, 0], axis)), side === "l" ? -1 : 1);
  const distal: V3 = norm(sub(ankle, calf));
  const boundaryOrigin: V3 = shared.plane.origin;
  const boundaryNormal: V3 = norm(shared.plane.normal);
  if (dot(boundaryNormal, distal) < 0.9)
    throw new Error(
      "Shared ankle plane does not point distally along the shank",
    );
  // This proximal observation bound only limits source work; it never becomes a cap.
  const scope: Skin = isolateFootSkin(
    skin,
    side,
    ankle[1] + (2 / 3) * dist(ankle, toe),
  );
  const vertices: V3[] = scope.vertices.filter(
    (point: V3): boolean =>
      dot(sub(point, boundaryOrigin), boundaryNormal) >= 0,
  );
  if (!vertices.length) throw new Error("Foot observation scope is empty");
  const region: string = `foot-${side}`;
  const result: FootObservations = {
    region,
    families: [],
    sections: [],
    reservedSectionIds: [],
    sourceCrossings: [],
    limits: [
      "Physical source-plane observations, not a fitted anatomical family or accepted regenerated skin.",
      "The rig ankle plane partitions ownership; the exact saved boundary ring remains the single surface join definition.",
      "Stored ring points and axes are independently rounded. The surface consumer must reconcile endpoint correspondence rather than claim an exact plane join.",
      "Even indexed stations are fitting observations; odd stations and every oblique plane are reserved and must not be fitted.",
      "Proper planar crossings describe observed source arcs; they are distinct from projected silhouette jumps and do not certify absence of unobserved intersections.",
      "Counterclockwise section order removes cavity winding. An outward orientation witness is still required by a surface consumer.",
      "Separate nail geometry is unsupported, and source-native toe flexion does not qualify a T-pose foot.",
      "Neutral foot flesh crossing the body midplane is outside the hemisphere isolation protocol.",
    ],
  };
  for (const [name, normal, reference, reserved] of [
    ["axis-dense", axis, [0, -1, 0], false],
    ["level-dense", [0, 1, 0], mul(axis, -1), false],
    ["sagittal-dense", medial, [0, -1, 0], false],
    ["oblique-reserved", norm(add(axis, medial)), [0, -1, 0], true],
  ] as [string, V3, V3, boolean][]) {
    const family: string = `${region}.${name}`;
    let low: number = Infinity;
    let high: number = -Infinity;
    for (const point of vertices) {
      const value: number = dot(sub(point, ankle), normal);
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    const first: number = Math.ceil(low / stationStepMm);
    const last: number = Math.floor(high / stationStepMm);
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(last) ||
      last - first + 1 > 4096
    )
      throw new Error(
        "Foot family exceeds the finite 4096-station observation budget",
      );
    result.families.push({
      id: family,
      kind: name,
      axis: `native-A plane normal ${JSON.stringify(normal)}; physical signed millimetres from rig ankle`,
      fraction0: `${first * stationStepMm} mm from ankle`,
      fraction1: `${last * stationStepMm} mm from ankle`,
      reference: JSON.stringify(reference),
      phaseLabels: {},
    });
    for (let index: number = first; index <= last; index++) {
      const mm: number = index * stationStepMm;
      const plane: Plane = planeFrame(
        add(ankle, mul(normal, mm)),
        normal,
        reference,
      );
      const loops: LoopRecord[] = [];
      for (const polyline of cut(scope, plane)) {
        const raw: LoopRecord = orientLoop(plane, polyline, "selected");
        if (raw.points.length < (raw.closed ? 3 : 2)) continue;
        for (const arc of clipFootArcs(raw, boundaryOrigin, boundaryNormal))
          loops.push(footLoopRecord(arc, plane));
      }
      const id: string = `${family}.${index < 0 ? "m" : "p"}${Math.abs(index).toString().padStart(4, "0")}`;
      result.sections.push({
        id,
        family,
        station: {
          fraction: (index - first) / Math.max(1, last - first),
          mm,
          definition:
            "signed physical millimetres from native rig ankle; no stature or floor normalization",
        },
        pose: "native-A",
        plane: {
          origin: plane.origin,
          normal: plane.n,
          u: plane.u,
          v: plane.v,
        },
        status:
          loops.length === 0
            ? "absent"
            : loops.every((loop: LoopRecord): boolean => loop.closed)
              ? "closed"
              : "clipped",
        loops,
      });
      if (reserved || Math.abs(index) % 2 === 1)
        result.reservedSectionIds.push(id);
      loops.forEach((loop: LoopRecord, i: number): void => {
        const count: number = selfCrossings(loop.uv, loop.closed);
        if (count) result.sourceCrossings.push({ section: id, loop: i, count });
      });
    }
  }
  return result;
}
