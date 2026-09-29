/**
 * Pure build-time camera handoff from the three native transport shapes to the
 * public navigator. The exporter supplies actual producer results, including
 * all geometry in `native`. This module only selects usable perspective poses
 * and adds readable labels. Native diagnostics requiring clipping or section
 * cameras stay in their production inspector; their geometry is never removed.
 * Source defaults, world metres and lens degrees remain production-owned.
 */
import {
  type Building,
  type TourData,
  type TourView,
  readTourData,
  viewLabel,
} from "./tourData";

type Vector = { x: number; y: number; z: number };
export interface AncientSource {
  lens: { verticalDegrees: number; near: number; far: number };
  observations: {
    id: string;
    group: string;
    space?: string;
    position: Vector | null;
    target: Vector | null;
    view?: unknown;
  }[];
}
export interface ModernSource {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fovDeg: number;
    near: number;
    far: number;
  };
  observations: {
    id: string;
    position: [number, number, number];
    target: [number, number, number];
    fovDeg: number;
    near: number;
  }[];
}
export interface FutureSource {
  stations: {
    id: string;
    space: string;
    pose: { position: Vector; target: Vector } | null;
    fov: number;
    section?: unknown;
  }[];
}
export type ExportInput =
  | { building: "ancient"; native: AncientSource }
  | { building: "modern"; native: ModernSource }
  | { building: "future"; native: FutureSource };
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
const point = (p: Vector): [number, number, number] => [p.x, p.y, p.z];

export const exportTourData = (input: ExportInput): TourData => {
  const { building, native } = input;
  let views: TourView[];
  if (input.building === "ancient") {
    const source = input.native;
    views = source.observations.flatMap((o) =>
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
    const source = input.native;
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
      ...source.observations.map((o) => ({
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
    const source = input.native;
    views = source.stations.flatMap((o) =>
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
  const { directory, ...copy } = metadata[building];
  const data = readTourData(
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
    data.views.find((view) => view.id === data.initial)!,
    ...data.views.filter((view) => view.id !== data.initial),
  ];
  return data;
};
