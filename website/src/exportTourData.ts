/**
 * Pure build-time camera handoff from the three native transport shapes to the public navigator. The exporter supplies actual producer results, including all geometry in `native`. This module only selects usable perspective poses and adds readable labels. Native diagnostics requiring clipping or section cameras stay in their production inspector; their geometry is never removed. Source defaults, world metres and lens degrees remain production-owned.
 */
import { type Building, type TourData, type TourView, readTourData, viewLabel } from "./tourData";
import type { ExportInput } from "./ExportInput";
import type { AncientSource } from "./AncientSource";
import type { Vector } from "./Vector";
import type { ModernSource } from "./ModernSource";
import type { FutureSource } from "./FutureSource";

const metadata: Record<
  Building,
  { directory: string; title: string; era: string; initial: string }
> = {
  ancient: {
    directory: "ancient-civic-temple",
    title: "Civic temple",
    era: "Ancient world",
    initial: "exterior.setting",
  },
  modern: {
    directory: "modern-suburban-house",
    title: "Suburban house",
    era: "Modern world",
    initial: "exterior",
  },
  future: {
    directory: "future-citizen-house",
    title: "Citizen house",
    era: "Future world",
    initial: "references/01-exterior",
  },
};

/** Copy named source XYZ coordinates into the camera tuple without changing units. */
const point: (p: Vector) => [number, number, number] = (p: Vector): [number, number, number] => [p.x, p.y, p.z];

/**
 * Copy usable authored perspective poses into the public navigator, retain the native payload identity, then place the authored initial view first. Temple/future diagnostic views stay with their native inspector; future clip distances use this public tour's fixed 0.02 to 300 meter lens range.
 *
 * @evidence contracts/common.md#principled-implementation Discriminator narrowing projects each production's actual camera representation into TourView; for the producer's unique source ids, source order is retained after moving the known initial id first, and readTourData refuses its absence.
 * @evidence contracts/common.md#clear-and-simple-design Native geometry remains opaque and unchanged while this one exporter owns camera labels, supported route metadata and navigation ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Production directory/default-view metadata and future clipping distances are supported website presentation contracts; absent poses and specialized cameras are omitted instead of synthesized, and duplicate source ids are not admitted independently here.
 * @evidence contracts/common.md#meaningful-documentation The comments state producer ownership, coordinate and lens units, filtered camera categories, initial ordering and the future clip policy.
 * @evidence contracts/performance.md#efficient-algorithms Projection, label processing and initial-view reordering cost O(V + L) time and O(V + L) output storage for source views and label characters; the final scans preserve authored order without sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work The native object is shared by identity and modern coordinate tuples are borrowed; labels and navigation arrays are rebuilt for each source handoff without a retained cross-production cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned envelope, native payload and view arrays; this pure exporter acquires no image tasks, renderer or listeners, and imposes no transport-byte cap.
 */
export const exportTourData: (input: ExportInput) => TourData = (input: ExportInput): TourData => {
  const { building, native }: ExportInput = input;
  let views: TourView[];
  if (input.building === "ancient") {
    const source: AncientSource = input.native;
    views = source.observations.flatMap((o: { id: string; group: string; space?: string; position: Vector | null; target: Vector | null; view?: unknown; }) : { id: string; label: string; group: string; position: [number, number, number]; target: [number, number, number]; fov: number; near: number; far: number; }[] =>
      o.position && o.target && !o.view
        ? [
            {
              id: o.id,
              label: viewLabel(o.id),
              group: viewLabel(o.space || o.group),
              position: point(o.position),
              target: point(o.target),
              fov: source.lens.verticalDegrees,
              near: source.lens.near,
              far: source.lens.far,
            },
          ]
        : [],
    );
  } else if (input.building === "modern") {
    const source: ModernSource = input.native;
    views = [
      {
        id: "exterior",
        label: "Whole house",
        group: "Exterior",
        position: source.camera.position,
        target: source.camera.target,
        fov: source.camera.fovDeg,
        near: source.camera.near,
        far: source.camera.far,
      },
      ...source.observations.map((o: { id: string; position: [number, number, number]; target: [number, number, number]; fovDeg: number; near: number; }) : { id: string; label: string; group: string; position: [number, number, number]; target: [number, number, number]; fov: number; near: number; far: number; } => ({
        id: o.id,
        label: viewLabel(o.id.split(/[/.]/).at(-1)!),
        group: viewLabel(o.id.split(/[/.]/)[0]!),
        position: o.position,
        target: o.target,
        fov: o.fovDeg,
        near: o.near,
        far: source.camera.far,
      })),
    ];
  } else {
    const source: FutureSource = input.native;
    views = source.stations.flatMap((o: { id: string; space: string; pose: { position: Vector; target: Vector; } | null; fov: number; section?: unknown; }) : { id: string; label: string; group: string; position: [number, number, number]; target: [number, number, number]; fov: number; near: number; far: number; }[] =>
      o.pose && !o.section
        ? [
            {
              id: `${o.space}/${o.id}`,
              label: viewLabel(o.id),
              group: viewLabel(o.space),
              position: point(o.pose.position),
              target: point(o.pose.target),
              fov: o.fov,
              near: 0.02,
              far: 300,
            },
          ]
        : [],
    );
  }
  const { directory, ...copy }: { directory: string; title: string; era: string; initial: string; } = metadata[building];
  const data: TourData = readTourData(
    {
      building,
      native,
      views,
      ...copy,
      source: `https://github.com/samchon/automovie/tree/master/experimental/${directory}`,
    },
    building,
  );
  data.views = [
    data.views.find((view: TourView) : boolean => view.id === data.initial)!,
    ...data.views.filter((view: TourView) : boolean => view.id !== data.initial),
  ];
  return data;
};
