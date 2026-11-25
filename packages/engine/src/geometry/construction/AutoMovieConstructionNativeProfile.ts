import type {
  IAutoMovieConstructionNativeProfile,
  IAutoMovieConstructionProfile,
  IAutoMovieConstructionProfileGuide,
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";

/** One caller-owned actual station preparation, independent of output density. */
interface Station {
  /** Physical station, kernel millimetres. */
  at: number;
  /** Existing numeric Point0 closure; a collapsed original has no regular curve. */
  point: ((phase: number) => [number, number]) | null;
  /**
   * Same immutable original values for the independently requested phase
   * capability.
   */
  values: IAutoMovieLoftViewRead.IValues;
  /** Lazy original phase2 does not require physical station2. */
  phase: ((phi: number) => IAutoMovieLoftSectionPhase) | undefined;
  /** Lazily prepared actual physical2; failures are never cached as success. */
  jet: ((phi: number) => IAutoMovieLoftSectionJet) | undefined;
}

/**
 * Exact native-source adapter to the original piecewise-profile reader.
 *
 * No raw loft or compatibility coefficients are constructed. Existing scalar,
 * cap, conic and physical2 owners remain authoritative; the actual axis is
 * borrowed. The source has one full-period piece with its original polar clock,
 * without imposing that representation on composed profile families.
 */
export function AutoMovieConstructionNativeProfile(
  part: IAutoMovieViewPart,
  identity: IAutoMovieConstructionNativeProfile.IIdentity,
): IAutoMovieConstructionProfileSource {
  if (
    !identity.material ||
    !identity.binding ||
    !identity.revisions.source ||
    !identity.revisions.constraints ||
    !identity.revisions.topology
  )
    throw new AutoMovieLoftAdmissionError(
      "Native profile requires actual material/binding owners and source dependency identities.",
    );
  const prepared: IAutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (prepared === null || prepared.source === null)
    throw new AutoMovieLoftAdmissionError(
      `Native profile needs its actual direct scalar source: ${JSON.stringify(prepared?.diagnostics ?? [])}`,
    );
  const source: IAutoMovieLoftViewSource.ISource = prepared.source;
  const curveId: string = `${part.name}.native`;
  const domain: [number, number] = [
    source.domain[0] / 1000,
    source.domain[1] / 1000,
  ];
  const definition: IAutoMovieConstructionProfile = {
    name: part.name,
    domain,
    plane: `${part.name}.plane`,
    loops: [
      {
        id: `${part.name}.loop`,
        kind: "outer",
        orientation: 1,
        domain: [...domain],
        pole: part.pole,
        pieces: [
          {
            id: curveId,
            source: curveId,
            clock: [0, 2 * Math.PI],
            direction: 1,
            branch: part.name,
          },
        ],
      },
    ],
    guides: [0, 1, 2, 3].map(
      (q: number): IAutoMovieConstructionProfileGuide => ({
        id: `${part.name}.guide.${q}`,
        piece: curveId,
        clock: (q * Math.PI) / 2,
      }),
    ),
    regions: [
      {
        id: part.name,
        logicalParts: [part.name],
        pieces: [curveId],
        material: identity.material,
        binding: identity.binding,
      },
    ],
    revisions: { ...identity.revisions },
  };

  /** Caller lifetime bounds reuse to the latest immutable station only. */
  let latest: Station | undefined;
  const at: (station: number) => Station = (station: number): Station => {
    if (station < source.domain[0] || station > source.domain[1])
      throw new AutoMovieLoftAdmissionError(
        "Native profile query is outside its actual source domain.",
      );
    if (latest?.at === station) return latest;
    const values: IAutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(source, station);
    if (typeof values === "string")
      throw new AutoMovieLoftAdmissionError(values);
    const value: Station = {
      at: station,
      point: values.extents.every((extent: number): boolean => extent === 0)
        ? null
        : AutoMovieLoftSectionNative.point(values),
      values,
      phase: undefined,
      jet: undefined,
    };
    latest = value;
    return value;
  };
  const curve: IAutoMovieConstructionProfileSource.ICurve = {
    domain: source.domain,
    clock: [0, 2 * Math.PI],
    period: 2 * Math.PI,
    point: (station: number, phase: number): [number, number] =>
      at(station).point?.(phase) ?? [0, 0],
    phase: (
      station: number,
      phase: number,
    ): IAutoMovieConstructionProfileSource.IPhase => {
      const current: Station = at(station);
      if (current.point === null) return { p: [0, 0], t: [0, 0], tt: [0, 0] };
      current.phase ??= AutoMovieLoftSectionNative.phase(current.values);
      return current.phase(phase);
    },
    jet: (
      station: number,
      phase: number,
    ): IAutoMovieConstructionProfileSource.IJet | null => {
      const current: Station = at(station);
      if (current.point === null) return null;
      if (current.jet === undefined) {
        const inputs: IAutoMovieLoftViewRead.IJets | string =
          AutoMovieLoftViewRead.jets(source, station);
        if (typeof inputs === "string") return null;
        current.jet = AutoMovieLoftSectionNative.jet(inputs);
      }
      return current.jet(phase);
    },
  };
  return {
    definition,
    plane: { id: definition.plane, axis: part.axis },
    curves: new Map([[curveId, curve]]),
  };
}
