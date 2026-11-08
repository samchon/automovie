import {
  AutoMovieConstructionViews,
  AutoMovieLoftChain,
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { IHumanDebugDocument } from "../../../../../packages/human/debug/contracts/IHumanDebugDocument";
import { HumanDebugChainLoft } from "../../../../../packages/human/debug/pieces/HumanDebugChainLoft";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A raw chain selection draws its operands independently of the full body's
 * trimmed-face inventory, without changing the caller's calibration.
 *
 * Scenarios:
 * 1. Two closed ellipsoids are published together. Selecting one draws its
 *    raw skin and curves without needing the other body's chain.
 * 2. Selecting both draws both, and a missing name reports the inventory.
 * 3. Repeating the selection leaves the original body and diagnostics intact.
 * 4. Both declared pole points and both positive principal endpoint rings
 *    survive the raw consumer; a regular-end axis is not a second pole.
 * 5. Retained cap interiors replay the actual public Point0 field; no
 *    duplicate collapsed ring or straight regular-end fan replaces them.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual chain-piece builder with a published two-face body and inspects its returned skin and construction. A whole-body solid record leaking into a subset makes the selected skin disappear and fails this test.
 * @evidence contracts/testing.md#independent-expectations A raw selection must contain exactly the requested operands; the selected ellipsoid is centred at the origin and its neighbour ten metres away, so a leaked neighbour cannot meet the selected bounds. Original pole points and positive principal guides must appear within the existing micrometre serialization precision. Each affine-fixture cap vertex is projected onto its owned physical axis clock and compared with public Point0 at its local polar phase; each exact zero tip appears once. This checks consumer replay, not the independent correctness of the native cap formula, which belongs to engine tests. No generated-person snapshot or reference fit supplies an answer.
 * @evidence contracts/testing.md#distinguishing-cases Covers a singleton, a two-chain group, an empty match, repeated reads and original-record preservation. Joined-skin topology belongs to construction tests; this piece intentionally shows the raw operands.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit under --include human_debug_chain_loft; it creates analytic parts in process without generating a person or starting a host.
 */
export function test_human_debug_chain_loft(): void {
  const chains: IAutoMovieLoftChain[] = [0, 10].map(
    (offset: number, index: number): IAutoMovieLoftChain => {
      const part: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
        ConstructionShapes.ellipsoid(
          index === 0 ? "selected" : "neighbour",
          { ...ConstructionShapes.DOWN, origin: { x: offset, y: 0, z: 0 } },
          0.01,
          0.008,
          0.02,
        ),
      );
      if (typeof part === "string") throw new Error(part);
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
      if (loft.chain === null)
        throw new Error("The analytic ellipsoid was not lofted");
      return loft.chain;
    },
  );
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    "both",
    chains.map((chain: IAutoMovieLoftChain): AutoMovieSolidBody.IFaceInput => {
      const surface: IAutoMovieSolidSurface | null =
        AutoMovieSolidChain.surface(chain);
      if (surface === null)
        throw new Error("The analytic ellipsoid has no surface");
      return {
        surface,
        stations: chain.layers.map(
          (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
        ),
        phases: ConstructionShapes.uniform(0, 2 * Math.PI, 17).slice(0, -1),
      };
    }),
  );
  const calibration: IAutoMovieHumanBodyCalibration = {
    stature: 100,
    chains,
    events: [],
    poles: [],
    apertures: [],
    eyes: [],
    bodies: [AutoMovieSolidBody.publish(body)],
    diagnostics: [],
  };
  const original: string = JSON.stringify(calibration.bodies);
  for (const names of [["selected"], ["selected", "neighbour"], ["selected"]]) {
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      calibration,
      names,
    );
    const found: Set<string> = new Set(
      document.parts.map((part: IHumanDebugDocument.IPart): string =>
        part.id.slice("human.skin.".length, part.id.lastIndexOf("/")),
      ),
    );
    if (
      found.size !== names.length ||
      names.some((name: string): boolean => !found.has(name))
    )
      throw new Error("Raw selection lost or added a requested skin");
    if (
      document.parts.some(
        (part: IHumanDebugDocument.IPart): boolean =>
          part.indices.length === 0 ||
          part.points.some((point: IHumanDebugDocument.Point): boolean =>
            point.some((value: number): boolean => !Number.isFinite(value)),
          ),
      )
    )
      throw new Error("A raw skin has no triangles or a non-finite point");
    for (const name of names)
      if (
        !document.parts.some((part: IHumanDebugDocument.IPart): boolean =>
          part.curves.some((curve: IHumanDebugDocument.ICurve): boolean =>
            curve.id.startsWith("human.construction." + name + "/"),
          ),
        )
      )
        throw new Error("A raw chain has no construction curves");
    for (const chain of chains.filter((chain: IAutoMovieLoftChain): boolean =>
      names.includes(chain.name),
    )) {
      const points: IHumanDebugDocument.Point[] = document.parts
        .filter((part: IHumanDebugDocument.IPart): boolean =>
          part.id.startsWith(`human.skin.${chain.name}/`),
        )
        .flatMap(
          (part: IHumanDebugDocument.IPart): IHumanDebugDocument.Point[] =>
            part.points,
        );
      const expected: [number, number, number][] = [
        chain.pole!.point,
        chain.opposite!.point,
        ...[chain.layers[0]!.y, chain.layers.at(-1)!.y].flatMap(
          (station: number): [number, number, number][] =>
            [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(
              (phase: number): [number, number, number] =>
                AutoMovieLoftChain.point(chain, station, phase),
            ),
        ),
      ];
      for (const tip of [chain.pole!, chain.opposite!]) {
        if (tip.source === undefined)
          throw new Error("The analytic cap lacks explicit source ownership");
        const source: NonNullable<typeof tip.source> = tip.source;
        const origin: [number, number, number] = source.axis.at(
          source.station,
        ).origin;
        const adjacent: [number, number, number] = source.axis.at(
          source.adjacent,
        ).origin;
        const direction: number[] = adjacent.map(
          (value: number, axis: number): number => value - origin[axis]!,
        );
        const length2: number = direction.reduce(
          (sum: number, value: number): number => sum + value * value,
          0,
        );
        let interior: number = 0;
        for (const point of points) {
          const station: number =
            source.station +
            ((source.adjacent - source.station) *
              point.reduce(
                (sum: number, value: number, axis: number): number =>
                  sum + (value - origin[axis]!) * direction[axis]!,
                0,
              )) /
              length2;
          if (
            !(
              station > Math.min(source.station, source.adjacent) &&
              station < Math.max(source.station, source.adjacent)
            )
          )
            continue;
          const frame: ReturnType<typeof source.axis.at> =
            source.axis.at(station);
          const delta: number[] = point.map(
            (value: number, axis: number): number =>
              value - frame.origin[axis]!,
          );
          const phase: number = Math.atan2(
            delta.reduce(
              (sum: number, value: number, axis: number): number =>
                sum + value * frame.v[axis]!,
              0,
            ),
            delta.reduce(
              (sum: number, value: number, axis: number): number =>
                sum + value * frame.u[axis]!,
              0,
            ),
          );
          const actual: [number, number, number] = AutoMovieLoftChain.point(
            chain,
            station,
            phase,
          );
          if (
            Math.hypot(
              ...actual.map(
                (value: number, axis: number): number => value - point[axis]!,
              ),
            ) > 1e-6
          )
            throw new Error(
              "A raw retained cap vertex does not replay its public original Point0",
            );
          interior++;
        }
        if (interior === 0)
          throw new Error(
            "A raw retained cap has no original interior vertices",
          );
        if (
          points.filter(
            (point: IHumanDebugDocument.Point): boolean =>
              Math.hypot(
                ...point.map(
                  (value: number, axis: number): number =>
                    value - tip.point[axis]!,
                ),
              ) <= 1e-9,
          ).length !== 1
        )
          throw new Error("A true zero tip has a duplicated collapsed ring");
      }
      for (const point of expected)
        if (
          !points.some(
            (actual: IHumanDebugDocument.Point): boolean =>
              Math.hypot(
                ...actual.map(
                  (value: number, axis: number): number => value - point[axis]!,
                ),
              ) <= 1e-6,
          )
        )
          throw new Error(
            `${chain.name}: raw consumer omitted an actual pole or positive principal ring`,
          );
    }
    if (
      names.length === 1 &&
      document.parts.some((part: IHumanDebugDocument.IPart): boolean =>
        part.points.some(
          (point: IHumanDebugDocument.Point): boolean =>
            Math.abs(point[0]) > 10.000001,
        ),
      )
    )
      throw new Error("A raw singleton contains its distant neighbour");
  }
  let refused: boolean = false;
  try {
    HumanDebugChainLoft.build(calibration, ["missing"]);
  } catch (error: unknown) {
    refused =
      error instanceof Error &&
      error.message.includes("No chain matches") &&
      error.message.includes("selected") &&
      error.message.includes("neighbour");
  }
  if (!refused)
    throw new Error("An empty raw selection did not name its available chains");
  if (
    JSON.stringify(calibration.bodies) !== original ||
    calibration.diagnostics!.length !== 0
  )
    throw new Error("Raw inspection changed the original body's records");
}
