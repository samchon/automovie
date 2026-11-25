import {
  ViolationCollector,
  resolvePerformShotTarget,
} from "@automovie/engine";
import type {
  IAutoMovieActionTarget,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../../../internal/createSkeleton";

/**
 * Positional target admission checks every referenced subject before a live
 * lookup and uses a staged placement when the live lookup returns no point.
 *
 * Scenarios:
 *
 * 1. A camera id and a group containing that camera use staged placements. A live
 *    bone on a staged actor receives its requested shot second.
 * 2. Missing nodes and bones, incomplete groups, and relative directions never
 *    invoke the live lookup.
 * 3. A formation-only group requires a framing request and a staged formation.
 */
export function test_unit_engine_film_resolve_perform_shot_target(): void {
  const out: ViolationCollector = new ViolationCollector();
  const liveReads: [IAutoMovieActionTarget["kind"], number][] = [];
  const context: Parameters<typeof resolvePerformShotTarget>[0] = {
    out,
    nodeIds: new Set<string>(["performer"]),
    nodePositions: new Map<string, IAutoMovieVector3>([
      ["performer", { x: 0, y: 0, z: 0 }],
      ["lens", { x: 2, y: 4, z: 6 }],
    ]),
    formationById: new Map(),
    formationPoints: new Map(),
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    hasActorContext: (node: string): boolean => node === "performer",
    targetAt: (
      target: IAutoMovieActionTarget,
      seconds: number,
    ): IAutoMovieVector3 | null => {
      liveReads.push([target.kind, seconds]);
      return target.kind === "bone" ? { x: 1, y: 3, z: 5 } : null;
    },
  };
  const address: string = "$input.draft[0].to";
  const resolve = (
    target: IAutoMovieActionTarget,
    formationsFramed: boolean = false,
  ): IAutoMovieVector3 | null =>
    resolvePerformShotTarget(context, {
      target,
      path: address,
      label: "look target",
      subject: "a look target",
      seconds: 0.625,
      formationsFramed,
    });
  TestValidator.equals(
    "live bone placement, static camera placement and a dyadic group centroid",
    [
      resolve({ kind: "bone", node: "performer", bone: "leftHand" }),
      resolve({ kind: "node", node: "lens" }),
      resolve({ kind: "group", nodes: ["performer", "lens"] }),
    ],
    [
      { x: 1, y: 3, z: 5 },
      { x: 2, y: 4, z: 6 },
      { x: 1, y: 2, z: 3 },
    ],
  );
  const invalid: IAutoMovieActionTarget[] = [
    { kind: "node", node: "missing" },
    { kind: "bone", node: "lens", bone: "leftHand" },
    { kind: "bone", node: "performer", bone: "rightHand" },
    { kind: "group", nodes: ["performer", "missing"] },
    { kind: "group", nodes: [] },
    { kind: "direction", headingDeg: 90 },
    { kind: "offscreen", edge: "right" },
    { kind: "group", nodes: [], formations: ["ensemble"] },
  ];
  TestValidator.predicate(
    "structurally typed but unresolved targets fail before live sampling",
    invalid.every(
      (target: IAutoMovieActionTarget): boolean => resolve(target) === null,
    ) &&
      resolve({ kind: "group", nodes: [], formations: ["ensemble"] }, true) ===
        null,
  );
  TestValidator.equals(
    "live lookup reads only admitted targets at the requested second",
    liveReads,
    [
      ["bone", 0.625],
      ["node", 0.625],
      ["group", 0.625],
    ],
  );
  TestValidator.equals(
    "refusals point to their exact source fields",
    out.items.map(({ path }) => path),
    [
      address,
      `${address}.node`,
      `${address}.bone`,
      `${address}.nodes[1]`,
      address,
      address,
      address,
      address,
      `${address}.formations[0]`,
    ],
  );
}
