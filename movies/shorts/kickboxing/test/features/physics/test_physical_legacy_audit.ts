import {
  AutoMovieMotionAudit as Audit,
  preparePhysicalGeometry,
} from "@automovie/engine";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PhysicalLegacyAuditFixtures as Legacy } from "../../internal/PhysicalLegacyAuditFixtures";

/** Shared audit and exact convex queries reproduce every original whole-film motion measurement from its recorded displayed inputs. */
export async function test_physical_legacy_audit(): Promise<void> {
  const record: Legacy.IRecord = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-audit-effects.json",
      ),
      "utf8",
    ),
  );
  const bodies: Audit.IBody[] = Object.entries(record.frames[0]!.bodies).map(
    ([id, state]: [string, Legacy.IState]): Audit.IBody => ({
      id,
      geometry: Legacy.geometry(state),
      supports: [],
      speeds: Object.fromEntries(
        state.joints
          .filter(([bone]: (typeof state.joints)[number]): boolean =>
            /^(hips|spine|chest|neck|head)$|Hand$|Foot$/u.test(bone),
          )
          .map(([bone]: [string, Legacy.Point]): [string, number] => [bone, 0]),
      ),
      floorTolerance: 1e-8,
      overlapTolerance: 0,
      jointTolerance: 0,
      constraints: [],
    }),
  );
  for (const row of record.frames)
    for (const body of bodies) {
      const state: Legacy.IState = row.bodies[body.id]!;
      const lift: number =
        state.root.position[1] - state.request.root.position[1];
      for (const side of ["left", "right"] as const) {
        const leg: Legacy.IGoal | undefined = state.request.legs?.[side];
        const arm: Legacy.IGoal | undefined = state.request.arms?.[side];
        const placement: boolean = state.frame.legs[side].kind === "place";
        if (leg)
          goal(
            placement
              ? body.id === "referee"
                ? "refereeFoot"
                : "plantedFoot"
              : "freeLimb",
            { bone: `${side}Foot` },
            leg,
          );
        if (arm)
          goal(
            "freeLimb",
            {
              bone: `${side}Hand`,
              ray: { from: `${side}LowerArm`, distance: 0.065 },
            },
            arm,
          );
        if (placement && !(body.id === "b" && row.seconds > 150)) {
          body.constraints!.push({
            kind: "distance",
            label: "footSpread",
            start: row.seconds,
            end: row.seconds,
            maximum: 0,
            from: {
              bone: `${side}HalluxProximal`,
              blend: { other: `${side}Toe5Proximal`, weight: 0.5 },
            },
            to: { bone: "@actor-origin" },
            horizontal: true,
          });
          if (body.id !== "referee" && state.frame.turn !== 0)
            body.constraints!.push({
              kind: "angle",
              label: "straightKnee",
              start: row.seconds,
              end: row.seconds,
              minimum: Math.PI,
              from: { bone: `${side}UpperLeg` },
              pivot: { bone: `${side}LowerLeg` },
              to: { bone: `${side}Foot` },
            });
        }
      }

      /** Match the old comparison's pre-floor-lift target frame without altering displayed positions. */
      function goal(
        label: string,
        point: Audit.IAnchor,
        value: Legacy.IGoal,
      ): void {
        body.constraints!.push({
          kind: "goal",
          label,
          point,
          start: row.seconds,
          end: row.seconds,
          maximum: 0,
          target: (): { x: number; y: number; z: number } => ({
            x: value.point[0],
            y: value.point[1] + lift,
            z: value.point[2],
          }),
        });
      }
    }
  const run: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
    bodies,
    start: 0,
    end: 180,
    rate: 2,
    floor: 0,
    sample: (seconds: number): ReturnType<typeof Legacy.frame> =>
      Legacy.frame(record.frames[Math.round(seconds * 2)]!),
    allowed: (): boolean => true,
  });
  const maximum: Record<string, number> = {
    plantedFoot: 0,
    refereeFoot: 0,
    freeLimb: 0,
    footSpread: 0,
    trunkSpeed: 0,
    limbSpeed: 0,
  };
  let knee: number = Infinity;
  const findings: string[] = [];
  for (const row of run.findings) {
    if (row.kind === "floor")
      findings.push(
        `unexpected original floor violation ${JSON.stringify(row)}`,
      );
    else if (row.kind === "angle")
      knee = Math.min(knee, (row.actual * 180) / Math.PI);
    else if (row.kind === "speed") {
      const key: string = /^(hips|spine|chest|neck|head)$/u.test(row.label)
        ? "trunkSpeed"
        : "limbSpeed";
      maximum[key] = Math.max(maximum[key]!, row.actual);
    } else maximum[row.label] = Math.max(maximum[row.label] ?? 0, row.actual);
  }
  for (const [key, value] of Object.entries({ ...maximum, straightKnee: knee }))
    if (Math.abs(value - record.audit[key]!.value!) > 1e-8)
      findings.push(
        `${key}: shared=${value}, original=${record.audit[key]!.value}`,
      );
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  for (const row of record.frames) {
    const engaged: boolean = record.overlapWindows.some(
      ([start, end]: (typeof record.overlapWindows)[number]): boolean =>
        row.seconds >= start && row.seconds <= end,
    );
    for (const a of Legacy.capsules("a", row.bodies.a!))
      for (const b of Legacy.capsules("b", row.bodies.b!)) {
        if (!(a.trunk && b.trunk) && (engaged || row.seconds >= 150)) continue;
        const contact: ReturnType<typeof geometry.contact> = geometry.contact(
          a.collider,
          b.collider,
          row.seconds,
        );
        if (contact && contact.separation < -1e-8)
          findings.push(
            `unexpected original capsule overlap at ${row.seconds}: ${a.collider.bone}/${b.collider.bone}/${contact.separation}`,
          );
      }
  }
  assert.deepEqual(
    findings,
    [],
    "all original audit maxima, floor and capsule results at 361 samples",
  );
}
