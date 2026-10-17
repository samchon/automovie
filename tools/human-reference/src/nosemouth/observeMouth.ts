import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import { P } from "../headneck/P.ts";
import { arcLen } from "../headneck/arcLen.ts";
import { polyLen } from "../headneck/polyLen.ts";
import { subArc } from "../headneck/subArc.ts";
import type { MouthObservationScope } from "./MouthObservationScope.ts";
import type { MouthRibbonObservations } from "./MouthRibbonObservations.ts";

type Ribbon = MouthRibbonObservations["ribbons"][number];
interface Position {
  p: V3;
  at: number;
}

/**
 * Observes complete sagittal skin arcs, retaining oral recess order and both
 * source-contact occurrences. A source mesh is read only here; reconstructed
 * skin consumers receive saved curves without triangle connectivity.
 *
 * @evidence contracts/common.md#principled-implementation Exact plane/source-edge intersections retain cavity sheets; proper nonadjacent segment crossings identify source collisions and binary cuts bracket their changes.
 * @evidence contracts/common.md#clear-and-simple-design One supplied physical scope owns collar cuts, sheet-collision windows and event precision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There are no landmark-index tables, source identities, source-path constants or inferred clinical commissures.
 * @evidence contracts/common.md#meaningful-documentation States source-only mesh access, oral sheet ordering, conventional scope and downstream curve-only consumption.
 * @evidence contracts/performance.md#efficient-algorithms R regular cuts plus logarithmic event refinement scan T source triangles; each selected P-point ribbon checks O(P squared) segment pairs to retain complete oral intersections.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The operation owns one supplied immutable context and coordinates no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source context is caller-owned; returned observations grow with cuts and source edges, while each temporary cut is released after its selected ribbon is retained.
 */
export function observeMouth(
  context: HeadContext,
  scope: MouthObservationScope,
): MouthRibbonObservations {
  const values: number[] = [
    scope.xMinimum,
    scope.xMaximum,
    scope.topY,
    scope.bottomY,
    scope.clipY,
    scope.collisionMinimumY,
    scope.collisionMaximumY,
    scope.collisionMinimumZ,
    scope.spacingMm,
    scope.eventToleranceMm,
  ];
  if (
    !values.every(Number.isFinite) ||
    scope.xMinimum >= scope.xMaximum ||
    scope.bottomY >= scope.topY ||
    scope.spacingMm <= 0 ||
    scope.eventToleranceMm <= 0
  )
    throw new Error(
      "Finite ordered mouth cut bounds and positive physical resolutions are required",
    );
  const intervals: number = Math.ceil(
    (scope.xMaximum - scope.xMinimum) / scope.spacingMm,
  );
  const ribbons: Ribbon[] = [],
    missing: number[] = [];
  for (let i: number = 0; i <= intervals; i++) {
    const x: number =
      scope.xMinimum + (i * (scope.xMaximum - scope.xMinimum)) / intervals;
    const value: Ribbon | null = extract(
      context,
      scope,
      x,
      `mouth.ribbon.${i}`,
    );
    if (value) ribbons.push(value);
    else missing.push(x);
  }
  const events: NonNullable<MouthRibbonObservations["events"]> = [];
  for (let i: number = 1; i < ribbons.length; i++) {
    if (
      (ribbons[i - 1].sourceCollision === null) ===
      (ribbons[i].sourceCollision === null)
    )
      continue;
    if (ribbons[i].xMm - ribbons[i - 1].xMm > scope.spacingMm * 1.001) continue;
    const presentIndex: number = ribbons[i].sourceCollision ? i : i - 1;
    const absentIndex: number = presentIndex === i ? i - 1 : i;
    const side: string =
      (ribbons[i].xMm + ribbons[i - 1].xMm) / 2 < 0 ? "r" : "l";
    let present: Ribbon = ribbons[presentIndex],
      absent: Ribbon = ribbons[absentIndex];
    while (Math.abs(present.xMm - absent.xMm) > scope.eventToleranceMm) {
      const x: number = (present.xMm + absent.xMm) / 2;
      if (x === present.xMm || x === absent.xMm) break;
      const middle: Ribbon | null = extract(
        context,
        scope,
        x,
        `mouth.event.${events.length}`,
      );
      if (!middle) break;
      if (middle.sourceCollision) present = middle;
      else absent = middle;
    }
    events.push({
      side,
      bracketX: [
        Math.min(present.xMm, absent.xMm),
        Math.max(present.xMm, absent.xMm),
      ],
      uncertaintyMm: Math.abs(present.xMm - absent.xMm),
      limitingPocketArcMm:
        (present.sourceCollision!.lowerFraction -
          present.sourceCollision!.upperFraction) *
        polyLen(present.sourcePoints),
      present,
      absent,
    });
  }
  return {
    gate: context.gate,
    units: "mm",
    frame: context.manifest.frame,
    pose: "native-A",
    sources: ["body", "head"].map(
      (id: string): MouthRibbonObservations["sources"][number] => ({
        file: context.manifest.files[id].path,
        sha256: context.manifest.files[id].sha256,
        pose: "native-A",
      }),
    ),
    scope: {
      xMinimum: scope.xMinimum,
      xMaximum: scope.xMaximum,
      topY: scope.topY,
      bottomY: scope.bottomY,
      boundaryDefinition: scope.definition,
    },
    ribbons,
    missing,
    events,
  };
}

function levels(points: V3[], closed: boolean, y: number): Position[] {
  const result: Position[] = [];
  for (let i: number = 0; i < points.length - (closed ? 0 : 1); i++) {
    const a: V3 = points[i],
      b: V3 = points[(i + 1) % points.length];
    if (a[1] > y === b[1] > y || Math.abs(a[1] - b[1]) < 1e-10) continue;
    const t: number = (y - a[1]) / (b[1] - a[1]);
    result.push({
      at: i + t,
      p: a.map((v: number, k: number): number => v + t * (b[k] - v)) as V3,
    });
  }
  return result.sort((a: Position, b: Position): number => b.p[2] - a.p[2]);
}

function extract(
  context: HeadContext,
  scope: MouthObservationScope,
  x: number,
  id: string,
): Ribbon | null {
  let selected: V3[] | null = null,
    score: number = -Infinity;
  const plane: ReturnType<typeof planeFrame> = planeFrame(
    [x, 0, 0],
    [1, 0, 0],
    [0, 0, -1],
  );
  for (const polyline of cut(context.s, plane, (i: number): boolean =>
    context.s.triangles[i].every(
      (v: number): boolean => context.s.vertices[v][1] > scope.clipY,
    ),
  )) {
    const points: V3[] = P(polyline);
    const top: Position | undefined = levels(
        points,
        polyline.closed,
        scope.topY,
      )[0],
      bottom: Position | undefined = levels(
        points,
        polyline.closed,
        scope.bottomY,
      )[0];
    if (!top || !bottom) continue;
    const forward: V3[] =
      polyline.closed || top.at <= bottom.at
        ? subArc(points, polyline.closed, top.at, bottom.at)
        : [];
    const backward: V3[] =
      polyline.closed || bottom.at <= top.at
        ? subArc(points, polyline.closed, bottom.at, top.at).reverse()
        : [];
    const candidates: V3[][] = [forward, backward].filter(
      (p: V3[]): boolean =>
        p.length > 1 &&
        dist(p[0], top.p) < 0.01 &&
        dist(p[p.length - 1], bottom.p) < 0.01,
    );
    candidates.sort((a: V3[], b: V3[]): number => polyLen(a) - polyLen(b));
    if (candidates[0] && top.p[2] + bottom.p[2] > score) {
      selected = candidates[0];
      score = top.p[2] + bottom.p[2];
    }
  }
  return selected
    ? {
        id,
        xMm: x,
        sourcePoints: selected,
        sourceCollision: contact(selected, scope),
      }
    : null;
}

function contact(
  points: V3[],
  scope: MouthObservationScope,
): Ribbon["sourceCollision"] {
  const cumulative: number[] = arcLen(points),
    total: number = cumulative[cumulative.length - 1];
  const orient: (a: V3, b: V3, c: V3) => number = (
    a: V3,
    b: V3,
    c: V3,
  ): number => (b[2] - a[2]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[2] - a[2]);
  let best: Ribbon["sourceCollision"] = null;
  for (let i: number = 0; i < points.length - 1; i++)
    for (let j: number = i + 2; j < points.length - 1; j++) {
      const a: V3 = points[i],
        b: V3 = points[i + 1],
        c: V3 = points[j],
        d: V3 = points[j + 1];
      const d1: number = orient(c, d, a),
        d2: number = orient(c, d, b),
        d3: number = orient(a, b, c),
        d4: number = orient(a, b, d);
      if (d1 * d2 >= -1e-12 || d3 * d4 >= -1e-12) continue;
      const t: number = d1 / (d1 - d2),
        u: number = d3 / (d3 - d4);
      const p: V3 = a.map(
        (value: number, k: number): number => value + t * (b[k] - value),
      ) as V3;
      if (
        p[1] < scope.collisionMinimumY ||
        p[1] > scope.collisionMaximumY ||
        p[2] < scope.collisionMinimumZ
      )
        continue;
      if (!best || p[2] > best.p[2])
        best = {
          upperFraction: (cumulative[i] + t * dist(a, b)) / total,
          lowerFraction: (cumulative[j] + u * dist(c, d)) / total,
          p,
        };
    }
  return best;
}
