import type { fitCurve } from "../fit/fitCurve.ts";
import type { MouthNetwork } from "../nosemouth/MouthNetwork.ts";
import type { MouthRibbonObservations } from "../nosemouth/MouthRibbonObservations.ts";
import { buildMouthNetwork } from "../nosemouth/buildMouthNetwork.ts";
import { faceTypes } from "./faceTypes.ts";

type Point = faceTypes.Point;
type Fit = ReturnType<typeof fitCurve>;
interface Ribbon {
  id: string;
  xMm: number;
  sourcePoints: Point[];
  upperOuter: Fit;
  lowerOuter: Fit;
  sourceCollision: {
    upperFraction: number;
    lowerFraction: number;
    p: Point;
  } | null;
  regularChartSplit?: { fraction: number; p: Point; definition: string };
}
interface Input {
  schema: string;
  ribbons: Ribbon[];
  events: {
    side: string;
    present: Ribbon;
    absent: Ribbon;
    limitingPocketArcMm: number;
  }[];
  generationPolicy: string[];
}

/**
 * Adapts the mouth owner's separate exterior cubics into upper and lower section families.
 * Event-limit ribbons retain physical X and finite pocket observations; the colliding pocket subarc
 * is omitted from this explicit exterior candidate. Source intersections and cheek splits are geometric
 * chart boundaries, not clinically identified neutral lip contact. Both sheets keep independent topology.
 *
 * @evidence contracts/common.md#principled-implementation The producer's explicit upper/lower decomposition and event limits define which source subarcs survive; no zero-point pocket collapse is assumed.
 * @evidence contracts/common.md#clear-and-simple-design This adapter alone maps the mouth schema, while the shared compiler evaluates the supplied cubic fits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source collision is not presented as anatomical truth, and sheet vertices remain separately owned even at coincident contacts.
 * @evidence contracts/common.md#meaningful-documentation Explains exterior trimming, physical event sections, finite-pocket limits and unresolved clinical interpretation.
 * @evidence contracts/performance.md#efficient-algorithms R ribbons are deduplicated and sorted in O(R log R); trimming scans source paths linearly. Canonical event-limit fitting processes only the measured present/absent event ribbons, using the producer's split/fitting policy.
 * @evidence contracts/performance.md#reuse-equivalent-work Published main-ribbon cubics are retained without refitting. Canonical event limits are fitted once for this invocation; source arclength is local and no cross-call cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result retains exterior points and supplied fit objects for this compilation only; no external handles or unbounded registry are acquired.
 */
export function mouthFamilies(
  document: Input | MouthNetwork,
): faceTypes.Family[] {
  const input: Input =
    "observations" in document ? canonical(document) : document;
  if (
    !input.schema.startsWith("mouth-sagittal-ribbon-network") ||
    !input.ribbons.every((ribbon: Ribbon): boolean =>
      Boolean(ribbon.upperOuter && ribbon.lowerOuter),
    )
  )
    throw new Error("Exterior ribbon decomposition required");
  const unique: Map<number, Ribbon> = new Map(
    input.ribbons.map((ribbon: Ribbon): [number, Ribbon] => [
      ribbon.xMm,
      ribbon,
    ]),
  );
  for (const event of input.events) {
    unique.set(event.present.xMm, event.present);
    unique.set(event.absent.xMm, event.absent);
  }
  const ribbons: Ribbon[] = [...unique.values()].sort(
    (a: Ribbon, b: Ribbon): number => a.xMm - b.xMm,
  );
  const length = (a: Point, b: Point): number =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const trim = (points: Point[], a: number, b: number): Point[] => {
    const arcs: number[] = [0];
    for (let i: number = 1; i < points.length; i++)
      arcs.push(arcs[i - 1] + length(points[i], points[i - 1]));
    const total: number = arcs.at(-1)!;
    const at = (fraction: number): Point => {
      const target: number = fraction * total;
      const index: number = arcs.findIndex(
        (arc: number): boolean => arc >= target,
      );
      if (index < 1) return points[0];
      const t: number =
        (target - arcs[index - 1]) / (arcs[index] - arcs[index - 1]);
      return points[index - 1].map(
        (v: number, d: number): number => v + (points[index][d] - v) * t,
      ) as Point;
    };
    return [
      at(a),
      ...points.filter(
        (_: Point, i: number): boolean =>
          arcs[i] > a * total + 1e-9 && arcs[i] < b * total - 1e-9,
      ),
      at(b),
    ];
  };
  return ["upper", "lower"].map(
    (side: string): faceTypes.Family => ({
      id: `face.mouth.${side}`,
      owner: "nosemouth",
      periodic: false,
      sections: ribbons.map((ribbon: Ribbon): faceTypes.Section => {
        const split: number | undefined = ribbon.regularChartSplit?.fraction;
        const a: number =
          side === "upper"
            ? 0
            : (ribbon.sourceCollision?.lowerFraction ?? split ?? NaN);
        const b: number =
          side === "upper"
            ? (ribbon.sourceCollision?.upperFraction ?? split ?? NaN)
            : 1;
        if (!Number.isFinite(a) || !Number.isFinite(b) || !(a < b))
          throw new Error(
            `Explicit exterior chart split required: ${ribbon.id}`,
          );
        return {
          id: `${ribbon.id}.${side}`,
          station: ribbon.xMm,
          points: trim(ribbon.sourcePoints, a, b),
          fitted: side === "upper" ? ribbon.upperOuter : ribbon.lowerOuter,
        };
      }),
      knots: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
      knotLabels: [
        "start",
        "eighth",
        "quarter",
        "three-eighths",
        "half",
        "five-eighths",
        "three-quarters",
        "seven-eighths",
        "end",
      ],
      boundaryMeaning:
        "Upper exterior ends and lower exterior begins at one source-supported geometric intersection or explicit cheek chart split. Coincident upper and lower boundary coordinates retain separate sheet topology. The contact curve is a geometric correction boundary, not a clinically identified neutral stomion.",
      limits: [
        ...input.generationPolicy,
        "This exterior candidate discards the colliding source oral-pocket subarc. Its geometric contact and onset transition require collision and visual qualification; it is not a certified anatomical correction.",
        ...input.events.map(
          (event: Input["events"][number]): string =>
            `The ${event.side} event has ${event.limitingPocketArcMm} mm limiting source pocket arc; no zero-point pocket collapse is assumed.`,
        ),
      ],
    }),
  );
}

function canonical(input: MouthNetwork): Input {
  for (const event of input.observations.events ?? []) {
    if (!event.present || !event.absent)
      throw new Error("Canonical event requires both measured limit ribbons");
  }
  const eventObservations: MouthRibbonObservations["ribbons"] = [
    ...new Map(
      (input.observations.events ?? []).flatMap(
        (
          event: NonNullable<MouthRibbonObservations["events"]>[number],
        ): [number, MouthRibbonObservations["ribbons"][number]][] => [
          [event.present!.xMm, event.present!],
          [event.absent!.xMm, event.absent!],
        ],
      ),
    ).values(),
  ];
  const expanded: MouthNetwork | undefined = eventObservations.length
    ? buildMouthNetwork(
        {
          ...input.observations,
          ribbons: eventObservations.sort(
            (
              a: MouthRibbonObservations["ribbons"][number],
              b: MouthRibbonObservations["ribbons"][number],
            ): number => a.xMm - b.xMm,
          ),
        },
        input.toleranceMm,
      )
    : undefined;
  const fits: Map<number, MouthNetwork["ribbons"][number]> = new Map(
    (expanded?.ribbons ?? []).map(
      (
        ribbon: MouthNetwork["ribbons"][number],
      ): [number, MouthNetwork["ribbons"][number]] => [ribbon.xMm, ribbon],
    ),
  );
  for (const ribbon of input.ribbons) fits.set(ribbon.xMm, ribbon);
  const convert: (
    observation: MouthRibbonObservations["ribbons"][number],
  ) => Ribbon = (
    observation: MouthRibbonObservations["ribbons"][number],
  ): Ribbon => {
    const fit: MouthNetwork["ribbons"][number] | undefined = fits.get(
      observation.xMm,
    );
    if (!fit)
      throw new Error("Canonical mouth observation has no corresponding fit");
    return {
      ...observation,
      upperOuter: fit.upperOuter,
      lowerOuter: fit.lowerOuter,
      ...(observation.sourceCollision
        ? {}
        : {
            regularChartSplit: {
              fraction: fit.split.upperFraction,
              p: fit.upperOuter.segments.at(-1)!.p3,
              definition: "Producer explicit regular cheek split",
            },
          }),
    };
  };
  return {
    schema: "mouth-sagittal-ribbon-network-canonical-adapter",
    ribbons: input.observations.ribbons.map(convert),
    events: (input.observations.events ?? []).map(
      (
        event: NonNullable<MouthRibbonObservations["events"]>[number],
      ): Input["events"][number] => ({
        side: event.side,
        present: convert(event.present!),
        absent: convert(event.absent!),
        limitingPocketArcMm: event.limitingPocketArcMm,
      }),
    ),
    generationPolicy: input.limits,
  };
}
