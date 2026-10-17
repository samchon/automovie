import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { V2 } from "../geometry/V2.ts";
import { cut } from "../geometry/cut.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { Section } from "../schema/Section.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import type { HeadContext } from "./HeadContext.ts";

/**
 * Records source-plane intersections and an author's explicit selection rule.
 *
 * Coordinates retain source calculation precision. A closed selected loop
 * establishes the section status, while clipped and absent observations remain
 * distinguishable; none of these statuses certify anatomical identity.
 *
 * @evidence contracts/common.md#principled-implementation Source-edge plane cuts establish the physical observations; the explicit author selection rule and optional status rule retain anatomical uncertainty.
 * @evidence contracts/common.md#clear-and-simple-design Cut, orientation, selection and status assembly have one owner while caller-defined region scope remains visible.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All retained arcs come from the actual source-plane intersection; missing sections remain absent rather than receiving invented closure points.
 * @evidence contracts/common.md#meaningful-documentation States coordinate precision, status meaning and selection responsibility; the signature keeps scope, plane and physical station distinct.
 * @evidence contracts/performance.md#efficient-algorithms One source cut visits its triangle workload; each retained polyline is oriented once and L retained loops are sorted in O(L log L).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure regional section operation coordinates no requests or caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary cut polylines survive only through the returned observation arrays; no external resources are acquired.
 */
export function createSection(
  context: HeadContext,
  id: string,
  family: string,
  station: Section["station"],
  plane: Plane,
  scope: ((triangle: number) => boolean) | undefined,
  select: (polyline: Polyline, record: LoopRecord) => LoopRecord["role"] | null,
  centre?: V2,
  statusOf?: (loops: LoopRecord[]) => [Section["status"], string?],
): Section {
  const polylines: Polyline[] = cut(context.s, plane, scope);
  const loops: LoopRecord[] = [];
  for (const polyline of polylines) {
    if (polyline.pts.length < 2) continue;
    const record: LoopRecord = orientLoop(plane, polyline, "other", centre);
    const role: LoopRecord["role"] | null = select(polyline, record);
    if (!role) continue;
    record.role = role;
    loops.push(record);
  }
  loops.sort(
    (a: LoopRecord, b: LoopRecord): number =>
      Number(b.role === "selected") - Number(a.role === "selected"),
  );
  let status: Section["status"] = loops.some(
    (loop: LoopRecord): boolean => loop.role === "selected" && loop.closed,
  )
    ? "closed"
    : loops.length
      ? "clipped"
      : "absent";
  let note: string | undefined;
  if (statusOf) [status, note] = statusOf(loops);
  return {
    id,
    family,
    station,
    pose: "native-A",
    plane: { origin: plane.origin, normal: plane.n, u: plane.u, v: plane.v },
    status,
    ...(note ? { statusNote: note } : {}),
    loops,
  };
}
