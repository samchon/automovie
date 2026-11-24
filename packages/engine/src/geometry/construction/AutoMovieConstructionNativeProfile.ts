import type {
  IAutoMovieConstructionNativeProfile,
  IAutoMovieConstructionProfile,
  IAutoMovieConstructionProfileGuide,
  IAutoMovieConstructionProfileSource,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";

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

  const reader: ReturnType<typeof AutoMovieLoftViewRead.prepare> =
    AutoMovieLoftViewRead.prepare(source);
  /** Read the value fields only where this immutable profile owns the station. */
  const valuesAt = (station: number): IAutoMovieLoftViewRead.IValues => {
    if (
      !Number.isFinite(station) ||
      station < source.domain[0] ||
      station > source.domain[1]
    )
      throw new AutoMovieLoftAdmissionError(
        "Native profile query is outside its actual source domain.",
      );
    const values: IAutoMovieLoftViewRead.IValues | string =
      reader.values(station);
    if (typeof values === "string")
      throw new AutoMovieLoftAdmissionError(values);
    return values;
  };
  /** Point0 remains available at a collapsed original station. */
  const pointAt: NonNullable<
    IAutoMovieConstructionProfileSource.ICurve["pointAt"]
  > = (station) => {
    const values: IAutoMovieLoftViewRead.IValues = valuesAt(station);
    return collapsed(values)
      ? () => [0, 0]
      : AutoMovieLoftSectionNative.point(values);
  };
  /** Prepare physical2 independently, with no invented derivatives at a pole. */
  const jetAt: NonNullable<
    IAutoMovieConstructionProfileSource.ICurve["jetAt"]
  > = (station) => {
    if (collapsed(valuesAt(station))) return () => null;
    const inputs: IAutoMovieLoftViewRead.IJets | string = reader.jets(station);
    if (typeof inputs === "string") return () => null;
    const jet: (phase: number) => IAutoMovieLoftSectionJet =
      AutoMovieLoftSectionNative.jet(inputs);
    return jet;
  };
  const curve: IAutoMovieConstructionProfileSource.ICurve = {
    domain: source.domain,
    clock: [0, 2 * Math.PI],
    period: 2 * Math.PI,
    point: (station: number, phase: number): [number, number] =>
      pointAt(station)(phase),
    pointAt,
    phase: (
      station: number,
      phase: number,
    ): IAutoMovieConstructionProfileSource.IPhase => {
      const values: IAutoMovieLoftViewRead.IValues = valuesAt(station);
      return collapsed(values)
        ? { p: [0, 0], t: [0, 0], tt: [0, 0] }
        : AutoMovieLoftSectionNative.phase(values)(phase);
    },
    jet: (
      station: number,
      phase: number,
    ): IAutoMovieConstructionProfileSource.IJet | null => jetAt(station)(phase),
    jetAt,
  };
  return {
    definition,
    plane: { id: definition.plane, axis: part.axis },
    curves: new Map([[curveId, curve]]),
  };
}

/** A full collapse leaves a finite Point0 and no regular physical2. */
function collapsed(values: IAutoMovieLoftViewRead.IValues): boolean {
  return values.extents.every((extent: number): boolean => extent === 0);
}
