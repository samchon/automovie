import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { anchorAutoMovieHumanHead } from "./anchorAutoMovieHumanHead";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { relaxAutoMovieHumanHeadCage } from "./relaxAutoMovieHumanHeadCage";

/**
 * Generates the head: the cranial vault and the one continuous face surface, open at the neck top and at both ear attachments.
 *
 * Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  public readonly part = "head" as const;

  public generate(props: IAutoMovieHumanPartGenerator.IProps<"head">): IAutoMovieHumanCage {
    const frame: frameAutoMovieHumanHead.IFrame = frameAutoMovieHumanHead(props.skeleton);
    const field: AutoMovieHumanHeadField = new AutoMovieHumanHeadField(frame, props.measurements);
    const topology: buildAutoMovieHumanHeadTopology.ITopology = buildAutoMovieHumanHeadTopology();
    const layout = (site: "neckTop" | "ear", side: "left" | "right" | null): IAutoMovieHumanRingLayout =>
      layoutAutoMovieHumanRing({ skeleton: props.skeleton, site, side, part: "head" });
    const neck: IAutoMovieHumanRingLayout = layout("neckTop", null);
    const ears: Record<"left" | "right", IAutoMovieHumanRingLayout> = {
      left: layout("ear", "left"),
      right: layout("ear", "right"),
    };
    const direction = (d: IAutoMovieVector3): IAutoMovieVector3 =>
      frameAutoMovieHumanHead.toLocal({ ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) }, d);
    const anchors: Map<number, IAutoMovieVector3> = anchorAutoMovieHumanHead({
      topology,
      field,
      frame,
      measurements: props.measurements,
      neck: {
        origin: frameAutoMovieHumanHead.toLocal(frame, neck.frame.origin),
        directions: AutoMovieHumanCageBuilder.buildDirections(neck).map(direction),
      },
    });
    const head = props.measurements.identity.head;
    const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0.1 * head.headHeight, 0);
    const box: IAutoMovieVector3 = AutoMovieHumanVector.of(
      props.measurements.headBreadth / 2,
      frame.vertex.y - centre.y,
      (frame.glabella.z - frame.opisthocranion.z) / 2,
    );
    const initial: IAutoMovieVector3[] = topology.vertices.map((v) =>
      field.project(
        centre,
        AutoMovieHumanVector.of(v.canonical.x * box.x, v.canonical.y * box.y, v.canonical.z * box.z),
      ),
    );
    const local: IAutoMovieVector3[] = relaxAutoMovieHumanHeadCage({
      positions: initial,
      faces: topology.faces,
      anchors,
      mirror: mirrorOf(topology),
      field,
      centre,
      sweeps: SWEEPS,
    });

    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder("head", null);
    local.forEach((p: IAutoMovieVector3): void => {
      builder.vertex(frameAutoMovieHumanHead.toModel(frame, p));
    });
    const chart: AutoMovieHumanCageBuilder.IChart[] = topology.vertices.map((v) => chartOf(v.canonical));
    for (const f of topology.faces) {
      const charts: AutoMovieHumanCageBuilder.IChart[] = f.map((i: number) => chart[i]!);
      const known: number[] = charts.filter((c) => !Number.isNaN(c.v)).map((c) => c.v);
      const spread: boolean = Math.max(...known) - Math.min(...known) > 0.5;
      const mean: number =
        known.map((v: number) => (spread && v < 0.5 ? v + 1 : v)).reduce((a, b) => a + b, 0) / known.length;
      builder.face(
        f,
        charts.map((c) => (Number.isNaN(c.v) ? { u: c.u, v: mean % 1 } : c)) as [
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
        ],
      );
    }
    builder.record(neck, {
      vertices: topology.neck,
      coordinates: topology.neck.map((i: number) => chart[i]!),
    });
    for (const side of ["left", "right"] as const) {
      const ring: IAutoMovieHumanRingLayout = ears[side];
      const order: number[] = AutoMovieHumanCageBuilder.buildDirections(ring).map((d: IAutoMovieVector3): number => {
        const l: IAutoMovieVector3 = direction(d);
        let best: number = -1;
        let score: number = -Infinity;
        for (const e of topology.ears[side]) {
          const s: number = (l.y * e.up + l.z * e.forward) / Math.hypot(e.up, e.forward);
          if (s > score) {
            score = s;
            best = e.vertex;
          }
        }
        return best;
      });
      builder.record(ring, { vertices: order, coordinates: order.map((i: number) => chart[i]!) });
    }
    return builder.build();
  }
}

/** Relaxation sweeps, enough for the grid to stop moving by more than a tenth of a millimetre. */
const SWEEPS: number = 150;

/** Chart address of a canonical direction: `u` the elevation from the bottom pole to the top, `v` the turn from the front toward the left. */
const chartOf = (c: IAutoMovieVector3): AutoMovieHumanCageBuilder.IChart => ({
  u: (Math.asin(Math.max(-1, Math.min(1, c.y))) + Math.PI / 2) / Math.PI,
  v:
    Math.abs(c.x) < 1e-9 && Math.abs(c.z) < 1e-9
      ? Number.NaN
      : ((Math.atan2(c.x, c.z) / (2 * Math.PI)) % 1 + 1) % 1,
});

/** Mirror image of each vertex across the midline, by canonical direction. */
const mirrorOf = (topology: buildAutoMovieHumanHeadTopology.ITopology): number[] => {
  const key = (c: IAutoMovieVector3): string =>
    `${Math.round(c.x * 1e6)},${Math.round(c.y * 1e6)},${Math.round(c.z * 1e6)}`;
  const index: Map<string, number> = new Map();
  topology.vertices.forEach((v, i: number): void => {
    index.set(key(v.canonical), i);
  });
  return topology.vertices.map((v, i: number): number => {
    const m: number | undefined = index.get(key(AutoMovieHumanVector.of(-v.canonical.x, v.canonical.y, v.canonical.z)));
    if (m === undefined) throw new Error(`head vertex ${i} has no mirror`);
    return m;
  });
};
