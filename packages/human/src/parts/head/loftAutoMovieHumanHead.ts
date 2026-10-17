import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSkinDomain } from "../../junction/IAutoMovieHumanSkinDomain";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { boundAutoMovieHumanEye } from "../../junction/boundAutoMovieHumanEye";
import { planAutoMovieHumanEye } from "../../junction/planAutoMovieHumanEye";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_HEAD_FORM } from "./AUTOMOVIE_HUMAN_HEAD_FORM";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { layoutAutoMovieHumanHead } from "./layoutAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";
import { reliefAutoMovieHumanHead } from "./reliefAutoMovieHumanHead";
import { sweepAutoMovieHumanHead } from "./sweepAutoMovieHumanHead";

/**
 * Loft the head: one sweep of sections from under the vertex to the neck-top ring, laid out as a network of quads with the face's loops, sampled into the head's cage.
 *
 * The steps, all in the head's own frame ({@link frameAutoMovieHumanHead}): guide curves from the landmarks and measurements ({@link profileAutoMovieHumanHead}); sections lofted through them ({@link sweepAutoMovieHumanHead}); the quads laid over the sweep's domain with the eyes', mouth's and ears' openings and loops ({@link layoutAutoMovieHumanHead}); a shared head-frame anterior source evaluated by the facial courses; and sampling into the coarse cage with its independent source targets and control pins. The joined mesher refines the eye and mouth regions through the public physical fitting domain, retaining both limit equations and pinned junction controls.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline, each corner's address the direction of its control point from a centre a tenth of head height above tragion. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @param measurements Resolved measurements of the person
 * @param skeleton The person's skeleton
 * @param form The head's form coefficients, {@link AUTOMOVIE_HUMAN_HEAD_FORM} unless a fit to a reference passes others
 * @returns The head cage, model frame, millimetres
 */
export function loftAutoMovieHumanHead(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  form: IAutoMovieHumanHeadForm = AUTOMOVIE_HUMAN_HEAD_FORM,
): IAutoMovieHumanCage {
  const built: INetwork = networkOf(measurements, skeleton, form);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: built.network,
    tier: TIER,
  });
  return {
    ...emit(
      sampled,
      built.frame,
      measurements.identity.head.headHeight,
      built.rings,
      built.skinRoles,
    ),
    construction: {
      ...IAutoMovieHumanCage.inModel(built.network),
      relief: built.guides,
    },
  };
}

interface INetwork {
  skinRoles: IAutoMovieHumanSkinDomain.Role[];
  network: IAutoMovieSurfaceNetwork;
  frame: frameAutoMovieHumanHead.IFrame;
  guides: IAutoMovieHumanCage.IRelief[];
  rings: Array<[string, IAutoMovieHumanRingShape]>;
}

/** The head's network and the rings it reports, before sampling. */
const networkOf: (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  form: IAutoMovieHumanHeadForm,
) => INetwork = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  form: IAutoMovieHumanHeadForm,
): INetwork => {
  const frame: frameAutoMovieHumanHead.IFrame =
    frameAutoMovieHumanHead(skeleton);
  const shape: (
    site: "neckTop" | "ear",
    side: "left" | "right" | null,
  ) => IAutoMovieHumanRingShape = (
    site: "neckTop" | "ear",
    side: "left" | "right" | null,
  ): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({
      skeleton,
      measurements,
      site,
      side,
      part: "head",
    });
  const neck: IAutoMovieHumanRingShape = shape("neckTop", null);
  const ears: Record<"left" | "right", IAutoMovieHumanRingShape> = {
    left: shape("ear", "left"),
    right: shape("ear", "right"),
  };
  const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => frameAutoMovieHumanHead.toLocal(frame, p);
  const direction: (d: IAutoMovieVector3) => IAutoMovieVector3 = (
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    frameAutoMovieHumanHead.toLocal(
      { ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) },
      d,
    );
  // the ring's limit points along itself, which the sections end on
  const controls: IAutoMovieVector3[] = neck.positions.map(local);
  const n: number = controls.length;
  const limit: IAutoMovieVector3[] = controls.map(
    (p: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [controls[(k + n - 1) % n]!, 1 / 6],
        [p, 4 / 6],
        [controls[(k + 1) % n]!, 1 / 6],
      ),
  );
  const profile: profileAutoMovieHumanHead.IProfile = profileAutoMovieHumanHead(
    {
      frame,
      head: measurements.identity.head,
      ring: {
        posterior: limit[n / 2]!,
        posterolateral: alongRing(limit, (2 * n) / 3),
      },
      form,
    },
  );
  const eyePlan: planAutoMovieHumanEye.IPlan = planAutoMovieHumanEye({
    measurements,
    skeleton,
    side: "left",
  });
  const eyeRadius: number = boundAutoMovieHumanEye(eyePlan);
  const relief: reliefAutoMovieHumanHead.IOutput = reliefAutoMovieHumanHead({
    frame,
    head: measurements.identity.head,
    composition: measurements.identity.composition,
    profile,
    form: form.relief,
    lips: form.lips,
    eye: {
      radius: eyeRadius,
      margin: form.eyelids.marginThickness,
      form: form.eyelids,
    },
  });
  const loft: sweepAutoMovieHumanHead.IOutput = sweepAutoMovieHumanHead({
    frame,
    profile,
    ring: {
      origin: local(neck.frame.origin),
      normal: direction(neck.frame.normal),
      limit,
    },
    tilt: frame.eye.y,
    blend: frame.stomion.y,
    relief: relief.radial,
  });
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(loft.sweep);
  const domain: AutoMovieHumanHeadDomain = new AutoMovieHumanHeadDomain(
    surface,
    loft,
    frame,
    profile,
    { anterior: relief.anterior, eyeRadius },
  );
  const network: AutoMovieHumanHeadNetwork = new AutoMovieHumanHeadNetwork(
    SWEEP,
    domain,
  );
  const mouthGuides: IAutoMovieHumanCage.IRelief[] = layoutAutoMovieHumanHead({
    domain,
    network,
    head: measurements.identity.head,
    form,
    neck,
    ears,
  });
  return {
    network: network.build(loft.sweep),
    skinRoles: network.skinRoles(),
    frame,
    guides: [
      ...relief.guides.map(
        (
          guide: reliefAutoMovieHumanHead.IGuide,
        ): IAutoMovieHumanCage.IRelief => ({
          name: guide.name,
          closed: guide.closed,
          points: Array.from(
            { length: 33 },
            (_: unknown, index: number): IAutoMovieVector3 => {
              const xy: { x: number; y: number } = guide.at(index / 32);
              const at: { u: number; v: number } = domain.onFace(xy.x, xy.y);
              return frameAutoMovieHumanHead.toModel(
                frame,
                domain.point(at.u, at.v),
              );
            },
          ),
        }),
      ),
      ...mouthGuides,
    ],
    rings: [
      ["neckTop", neck],
      ["ear.left", ears.left],
      ["ear.right", ears.right],
    ],
  };
};

/** The point at a fractional index round a closed ring of points, between its neighbours. */
const alongRing: (ring: IAutoMovieVector3[], x: number) => IAutoMovieVector3 = (
  ring: IAutoMovieVector3[],
  x: number,
): IAutoMovieVector3 => {
  const i: number = Math.floor(x);
  const f: number = x - i;
  return AutoMovieHumanVector.offset(
    AutoMovieHumanVector.of(0, 0, 0),
    [ring[i % ring.length]!, 1 - f],
    [ring[(i + 1) % ring.length]!, f],
  );
};

/** The sweep's name in the network. */
const SWEEP: string = "head";

/** The tier the human profile samples. */
const TIER: "medium" = "medium" as const;

/** Height of the chart's centre above tragion, over head height. */
const CHART_CENTRE: number = 0.1;

/** Turn the sampled network into the head cage: millimetres, chart addresses and rings. */
const emit: (
  sampled: IAutoMovieSurfaceCage,
  frame: frameAutoMovieHumanHead.IFrame,
  headHeight: number,
  rings: Array<[string, IAutoMovieHumanRingShape]>,
  skinRoles: IAutoMovieHumanSkinDomain.Role[],
) => IAutoMovieHumanCage = (
  sampled: IAutoMovieSurfaceCage,
  frame: frameAutoMovieHumanHead.IFrame,
  headHeight: number,
  rings: Array<[string, IAutoMovieHumanRingShape]>,
  skinRoles: IAutoMovieHumanSkinDomain.Role[],
): IAutoMovieHumanCage => {
  const skinByFace: IAutoMovieHumanSkinDomain.Role[] = Array.from(
    { length: sampled.cage.faces.length },
    (): IAutoMovieHumanSkinDomain.Role => "ordinary",
  );
  sampled.patches.forEach(
    (patch: IAutoMovieSurfaceCage.IPatch, index: number): void => {
      for (const face of patch.faces)
        skinByFace[face] = skinRoles[index] ?? "unknown";
    },
  );
  const positions: number[] = sampled.cage.positions;
  const fittedFaces: Set<number> = new Set(
    sampled.patches
      .filter(
        (patch: IAutoMovieSurfaceCage.IPatch): boolean =>
          patch.name.startsWith("eye.") || patch.name.startsWith("mouth."),
      )
      .flatMap((patch: IAutoMovieSurfaceCage.IPatch): number[] => patch.faces),
  );
  const fittedVertices: Set<number> = new Set(
    [...fittedFaces].flatMap(
      (face: number): number[] => sampled.cage.faces[face]!,
    ),
  );
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: AutoMovieHumanVector.of(
        positions[k]! * 1000,
        positions[k + 1]! * 1000,
        positions[k + 2]! * 1000,
      ),
      ...(fittedVertices.has(k / 3)
        ? {
            fitting: {
              sample: AutoMovieHumanVector.of(
                sampled.targets[k]! * 1000,
                sampled.targets[k + 1]! * 1000,
                sampled.targets[k + 2]! * 1000,
              ),
              target: sampled.limitTargetMask[k / 3]
                ? AutoMovieHumanVector.of(
                    sampled.targets[k]! * 1000,
                    sampled.targets[k + 1]! * 1000,
                    sampled.targets[k + 2]! * 1000,
                  )
                : null,
              anchor: sampled.pinned[k / 3]!,
            },
          }
        : {}),
    });
  const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(
    0,
    CHART_CENTRE * headHeight,
    0,
  );
  const chart: IAutoMovieHumanSurfaceCoordinate.IOn<"head">[] = vertices.map(
    (
      v: IAutoMovieHumanCage.IVertex,
    ): IAutoMovieHumanSurfaceCoordinate.IOn<"head"> => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(
          frameAutoMovieHumanHead.toLocal(frame, v.position),
          [centre, -1],
        ),
      );
      return {
        part: "head",
        side: null,
        u: (Math.asin(Math.max(-1, Math.min(1, d.y))) + Math.PI / 2) / Math.PI,
        v: (((Math.atan2(d.x, d.z) / (2 * Math.PI)) % 1) + 1) % 1,
      };
    },
  );
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], index: number): IAutoMovieHumanCage.IFace => ({
      skin: skinByFace[index],
      ...(fittedFaces.has(index) ? { fitting: "head.facialFeatures" } : {}),
      vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
      coordinates: face.map(
        (i: number): IAutoMovieHumanSurfaceCoordinate.IOn<"head"> => chart[i]!,
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    }),
  );
  return {
    vertices,
    faces,
    creases: [],
    rings: rings.map(
      ([name, shape]: [
        string,
        IAutoMovieHumanRingShape,
      ]): IAutoMovieHumanCage["rings"][number] => ({
        site: shape.site,
        side: shape.side,
        vertices: sampled.rings[name]!,
        start: shape.start,
        frame: shape.frame,
      }),
    ),
  };
};
