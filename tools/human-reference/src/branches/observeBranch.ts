import type { CutPoint } from "../geometry/CutPoint.ts";
import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cut } from "../geometry/cut.ts";
import { mul } from "../geometry/mul.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { sourceOrientation } from "../observations/sourceOrientation.ts";
import { clipSurfaceSegments } from "../trunk/clipSurfaceSegments.ts";
import type { BranchDefinition } from "./BranchDefinition.ts";
import type { BranchObservation } from "./BranchObservation.ts";
import type { BranchSection } from "./BranchSection.ts";
import { observeBranchEvents } from "./observeBranchEvents.ts";

/**
 * Measures a physical source section family and its local branch-event brackets.
 * Two-millimetre stations are an observation sampling interval, not a shape coefficient.
 * Source-triangle intersections are cropped segment by segment without closure chords.
 *
 * @evidence contracts/common.md#principled-implementation Intersects the source with parallel physical planes, retains every region-supported piece through exact linear box inequalities, and adds the shared local saddle observations independently of station spacing.
 * @evidence contracts/common.md#clear-and-simple-design Ordinary sections and critical-event brackets consume one branch definition; the shared cropper owns segment clipping and the event producer owns local topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no polygon caps, source topology transplantation, named clinical crease or case-specific coordinate. The output is explicitly observational and does not claim generated-surface quality.
 * @evidence contracts/common.md#meaningful-documentation Explains millimetres, fixed physical station spacing, source-segment containment and the separation between measured observations and a completed loft.
 * @evidence contracts/performance.md#efficient-algorithms For S stations and T source triangles, ordinary cuts cost O(S*T); cropping is linear in cut segments. Critical-event cost is owned and documented by observeBranchEvents, and results retain the emitted observation points.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses one loaded source mesh and branch definition for ordinary and event sections; the two independently located families are not assumed equivalent and no results are cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local cuts are consumed per station and the returned arrays retain only observations; no files, handles or global state are acquired.
 */
export function observeBranch(
  skin: Skin,
  definition: BranchDefinition,
): BranchObservation {
  const sections: BranchSection[] = [];
  const orientation: (frame: Plane, polyline: Polyline) => number =
    sourceOrientation(skin);
  const spacing: number = 2;
  const count: number = Math.ceil(
    (definition.intervalMm[1] - definition.intervalMm[0]) / spacing,
  );
  for (let i: number = 0; i <= count; i++) {
    const station: number = Math.min(
      definition.intervalMm[1],
      definition.intervalMm[0] + i * spacing,
    );
    const frame: Plane = planeFrame(
      add(definition.frame.origin, mul(definition.frame.n, station)),
      definition.frame.n,
      definition.frame.v,
    );
    const pieces: BranchSection["pieces"] = [];
    for (const polyline of cut(skin, frame)) {
      const points: V3[] = polyline.pts.map((point: CutPoint): V3 => point.p);
      const channels: number[][] = [];
      for (let axis: number = 0; axis < 3; axis++) {
        channels.push(
          points.map(
            (point: V3): number => point[axis] - definition.bounds.low[axis],
          ),
        );
        channels.push(
          points.map(
            (point: V3): number => definition.bounds.high[axis] - point[axis],
          ),
        );
      }
      const winding: number | null = polyline.closed
        ? orientation(frame, polyline)
        : null;
      pieces.push(
        ...clipSurfaceSegments(points, polyline.closed, channels).map(
          (piece: {
            closed: boolean;
            points: V3[];
          }): BranchSection["pieces"][number] => ({
            ...piece,
            sourceClosed: polyline.closed,
            winding,
          }),
        ),
      );
    }
    sections.push({
      id: `${definition.name}.station.${i}`,
      stationMm: station,
      frame,
      scope: "cropped-region",
      pieces,
    });
  }
  const critical: ReturnType<typeof observeBranchEvents> = observeBranchEvents(
    skin,
    definition,
    orientation,
  );
  return {
    schema: "reference-branch-observation-v1",
    definition,
    sections: [...sections, ...critical.sections],
    events: critical.events,
    limits: [
      ...definition.limits,
      ...critical.limits,
      "Ordered source sections are observations, not fitted Bezier spans or validated skin-generating patches.",
      "Local critical events do not alone identify a unique clinical axilla or crotch attachment. Native source genital geometry is retained only for private comparison and is excluded from product anatomy.",
    ],
  };
}
