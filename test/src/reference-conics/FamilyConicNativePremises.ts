import {
  AutoMovieConstructionContinuation,
  AutoMovieConstructionPortCurve,
  AutoMovieConstructionSeeds,
  AutoMovieConstructionSplitBand as Band,
  AutoMovieConstructionSplitSeam as Seam,
  AutoMovieNaturalSpline,
  AutoMovieSolidChain,
  AutoMovieSolidRibbon,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import { AutoMovieHumanPeriodicRailRange } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieBlendCrossJet,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSeedTrace,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/** One prepared actual relieved source; no bare adapter stands in for it. */
interface Source {
  chain: IAutoMovieLoftChain;
  surface: IAutoMovieSolidSurface;
}

/**
 * Read actual native-tree source and band premises without drawing the whole skin.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Calls the same seam, port-strip, split/fan, continuation and seed owners as realization, on original full-source surfaces including reliefs. Every published band column and backward list is retained independently of diagnostics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One postorder tree walk prepares shared seams once and registers actual band surfaces for dependent seeds; each node retains its own result or actual failure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not replace unavailable source2 with zero, tune a band, trace/trim a whole skin or label finite source samples an anatomical certificate. Seed convergence is separate from full closed intersection and trim/topology acceptance.
 * @evidence contracts/development/common.md#meaningful-documentation Source coordinates and jets use mm/radians; declaration station/depth values convert from metres once.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded tree pass plus the existing operator costs and all actual columns; source factories are supplied already prepared once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both sibling split bands read one actual seam, and downstream seeds read registered original band surfaces.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Invocation-local source and kept-domain maps live only for this inspection; the return contains plain evidence rather than executable readers.
 */
export function FamilyConicNativePremises(
  root: IAutoMovieConstructionNode,
  input: ReadonlyMap<string, Source>,
  observe?: {
    band?: (
      name: string,
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ) => void;
    seam?: (
      name: string,
      index: number,
      definition: IAutoMovieConstructionSplit.ISeam,
      host: IAutoMovieSolidSurface,
      station: number,
      normal: AutoMovieVector3Tuple,
    ) => void;
    seed?: (name: string, event: IAutoMovieConstructionSeedTrace.IEvent) => void;
    seedSurface?: (
      name: string,
      role: "part" | "host",
      surface: IAutoMovieSolidSurface,
    ) => IAutoMovieSolidSurface;
  },
): {
  rows: unknown[];
  failures: { owner: string; detail: string }[];
  backward: { owner: string; columns: number[] }[];
  keptDomains: Record<string, readonly [number, number]>;
} {
  const sources = new Map(input),
    rows: unknown[] = [],
    failures: { owner: string; detail: string }[] = [],
    backward: { owner: string; columns: number[] }[] = [];
  const keptDomains: Record<string, readonly [number, number]> = {};
  const take = (name: string): Source => {
    const source = sources.get(name);
    if (source === undefined)
      throw new Error("actual full source absent: " + name);
    return source;
  };
  const end = (source: Source, side: "bottom" | "top"): number =>
    source.chain.layers[side === "bottom" ? 0 : source.chain.layers.length - 1]!
      .y;
  const domain = (source: Source): readonly [number, number] =>
    source.surface.domain ?? [
      source.chain.layers[0]!.y,
      source.chain.layers.at(-1)!.y,
    ];
  const read = (
    surface: IAutoMovieSolidSurface,
    s: number,
    t: number,
  ): IAutoMovieSolidSurface.IJet | { unavailable: string } => {
    try {
      const jet = surface.jet(s, t);
      if (
        ![jet.p, jet.u, jet.v, jet.uu, jet.uv, jet.vv].every((v): boolean =>
          v.every(Number.isFinite),
        )
      )
        throw new Error("actual full source2 is nonfinite");
      return jet;
    } catch (error: unknown) {
      return {
        unavailable: error instanceof Error ? error.message : String(error),
      };
    }
  };
  const normal = (source: Source, side: "bottom" | "top"): AutoMovieVector3Tuple => {
    const frame =
      source.chain.layers[
        side === "bottom" ? 0 : source.chain.layers.length - 1
      ]!.frame;
    if (frame === undefined) throw new Error("actual end frame is absent");
    const made = V.unit(
      V.scale(V.cross(frame.v, frame.u), side === "bottom" ? -1 : 1),
    );
    if (made === null) throw new Error("actual end plane is degenerate");
    return made;
  };
  const child = (
    name: string,
    side: "bottom" | "top",
    distance: number,
  ): IAutoMovieConstructionSplitBand.ISide => {
    const source = take(name),
      into: 1 | -1 = side === "bottom" ? 1 : -1;
    const station: number = end(source, side) + into * distance * 1000,
      [first, last] = domain(source);
    if (!(station > first && station < last))
      throw new Error(
        name +
          " rail " +
          station +
          " leaves actual open domain [" +
          first +
          "," +
          last +
          "]",
      );
    keptDomains[name] = side === "bottom" ? [station, last] : [first, station];
    return { surface: source.surface, station, into };
  };
  const publish = (
    name: string,
    made: IAutoMovieConstructionSplitBand.IStrip | string,
    host: (column: number) => unknown,
    rail: IAutoMovieConstructionSplitBand.ISide,
  ): void => {
    if (typeof made === "string") throw new Error(made);
    sources.set(name, { chain: made.chain, surface: made.surface });
    backward.push({ owner: name, columns: [...made.scale.backward] });
    rows.push({
      owner: name,
      kind: "actual-band",
      scale: made.scale,
      length: made.length,
      loop: made.loop,
      childPhases: made.childPhases,
      columns: made.loop.map((_, k: number) => {
        const t: number = (2 * Math.PI * k) / made.loop.length,
          phase: number = made.childPhases[k]!,
          s: number = rail.along?.(phase) ?? rail.station;
        return {
          column: k,
          host: host(k),
          child: { station: s, phase, full2: read(rail.surface, s, phase) },
          band: [0, made.length / 2, made.length].map((station: number) => ({
            station,
            clock: t,
            full2: read(made.surface, station, t),
          })),
        };
      }),
    });
  };
  const trace: (
    name: string,
  ) => IAutoMovieConstructionSplitBandTrace.Sink | undefined = (
    name: string,
  ): IAutoMovieConstructionSplitBandTrace.Sink | undefined =>
    observe?.band === undefined
      ? undefined
      : (event: IAutoMovieConstructionSplitBandTrace.Event): void => {
          observe.band!(name, event);
        };
  const createSeam = (
    source: Source,
    node: IAutoMovieConstructionSplit,
    seam: IAutoMovieConstructionSplit.ISeam,
    index: number,
  ): IAutoMovieConstructionSplitSeam.ISeam => {
    const host = {
      host: source.surface,
      station: end(source, node.hostEnd),
      seam: seam.seam,
      normal: normal(source, node.hostEnd),
    };
    observe?.seam?.(
      node.name,
      index,
      seam,
      host.host,
      host.station,
      host.normal,
    );
    const made: IAutoMovieConstructionSplitSeam.ISeam | string =
      seam.profile === undefined
        ? Seam.straight(host)
        : Seam.create({
            ...host,
            into: node.hostEnd === "bottom" ? -1 : 1,
            knots: seam.profile.knots.map(([a, d]): [number, number] => [
              a * 1000,
              d * 1000,
            ]),
            ...(seam.profile.heading === undefined
              ? {}
              : { heading: seam.profile.heading }),
          });
    if (typeof made === "string") throw new Error(made);
    return made;
  };
  const walk = (node: IAutoMovieConstructionNode): void => {
    if ("host" in node) walk(node.host);
    if ("part" in node) walk(node.part);
    if (node.type === "split") for (const c of node.children) walk(c.part);
    try {
      if (node.type === "port") {
        const host = take(node.hostFace),
          part = take(node.partFace),
          side = child(node.partFace, node.partEnd, node.rail);
        if (node.rails !== undefined) {
          const stop = end(part, node.partEnd),
            distances = node.rails.map(
              (x: number): number => stop + side.into * x * 1000,
            );
          const bounds = AutoMovieHumanPeriodicRailRange.of(distances),
            limits = domain(part);
          if (!(bounds[0] > limits[0] && bounds[1] < limits[1]))
            throw new Error(
              "proved complete curved rail bound leaves its actual source domain",
            );
          side.along = AutoMovieNaturalSpline.periodic(distances);
          keptDomains[node.partFace] =
            side.into === 1 ? [bounds[1], limits[1]] : [limits[0], bounds[0]];
          rows.push({
            owner: node.name,
            kind: "curved-rail-domain",
            controls: distances,
            bounds,
            sourceDomain: limits,
          });
        }
        const n: number = node.count;
        const {
          addresses: charts,
          inward,
        }: ReturnType<typeof AutoMovieConstructionPortCurve.chart> =
          AutoMovieConstructionPortCurve.chart(node.loop, n);
        const jets = charts.map(([s, t]) => host.surface.jet(s, t));
        const loop = jets.map((jet): AutoMovieVector3Tuple => [...jet.p]);
        const outward = V.unit(
          V.scale(V.cross(jets[0]!.u, jets[0]!.v), host.surface.orientation),
        );
        if (outward === null)
          throw new Error("actual host tangent plane is degenerate");
        const near = (
          k: number,
          length: number,
        ): IAutoMovieBlendCrossJet | string => {
          const [du, dv]: [number, number] = inward[k]!,
            jet: IAutoMovieSolidSurface.IJet = jets[k]!;
          const speed: number = V.norm(
            V.combine([
              [du, jet.u],
              [dv, jet.v],
            ]),
          );
          return speed > 0
            ? AutoMovieSolidRibbon.of(
                host.surface,
                charts[k]![0],
                charts[k]![1],
                du,
                dv,
                length / speed,
              )
            : "actual host inward direction has zero speed";
        };
        const made = Band.strip(
          node.band,
          loop,
          near,
          outward,
          side,
          undefined,
          node.correspondence ?? "angle",
          node.ribbons ?? "common",
          (node.profiles ?? []).map((p) => ({
            ...p,
            knots: p.knots.map(([t, d]): [number, number] => [t, d * 1000]),
          })),
          trace(node.band),
        );
        publish(
          node.band,
          made,
          (k: number) => ({
            chart: charts[k],
            full2: read(host.surface, charts[k]![0], charts[k]![1]),
          }),
          side,
        );
      } else if (node.type === "split") {
        const source = take(node.hostFace),
          station: number = end(source, node.hostEnd),
          into: 1 | -1 = node.hostEnd === "bottom" ? -1 : 1;
        if (
          source.chain.pole?.end === node.hostEnd ||
          source.chain.opposite?.end === node.hostEnd
        )
          throw new Error("split host end closes in a pole");
        const seams: IAutoMovieConstructionSplit.ISeam[] = [
          {
            seam: node.seam,
            ...(node.profile === undefined ? {} : { profile: node.profile }),
          },
          ...(node.outer ?? []),
        ];
        const curves = seams.map((s, index: number): IAutoMovieConstructionSplitSeam.ISeam | null => {
          try {
            return createSeam(source, node, s, index);
          } catch (error: unknown) {
            const detail =
              error instanceof Error ? error.message : String(error);
            failures.push({
              owner: node.name + ".seam[" + index + "]",
              detail,
            });
            rows.push({
              owner: node.name + ".seam[" + index + "]",
              kind: "shared-seam",
              unavailable: detail,
            });
            return null;
          }
        });
        rows.push({
          owner: node.name,
          kind: "shared-seams",
          station,
          sourceDomain: domain(source),
          definitions: seams,
          scope:
            "actual full relieved host; each curve generated once for both siblings",
        });
        if (node.outer === undefined) {
          node.children.forEach((c, index: number): void => {
            try {
              const side = child(c.partFace, c.partEnd, c.rail);
              const shared = curves[0];
              if (
                node.profile !== undefined &&
                (shared === null || shared === undefined)
              )
                throw new Error(
                  "blocked by unavailable shared seam[0]; actual child rail/domain was independently read",
                );
              const made = Band.create(
                {
                  name: c.band,
                  host: { surface: source.surface, station, into },
                  arc:
                    index === 0
                      ? node.seam
                      : [node.seam[1], node.seam[0] + 2 * Math.PI],
                  normal: normal(source, node.hostEnd),
                  child: side,
                  count: node.count,
                  ...(c.crease === undefined ? {} : { crease: c.crease }),
                  ...(c.correspondence === undefined
                    ? {}
                    : { correspondence: c.correspondence }),
                  ...(node.profile === undefined ||
                  shared === null ||
                  shared === undefined
                    ? {}
                    : { seam: { curve: shared, corner: node.profile.corner } }),
                },
                trace(c.band),
              );
              publish(
                c.band,
                made,
                (k: number) => ({
                  station,
                  full2:
                    typeof made === "string"
                      ? { unavailable: made }
                      : k < made.hostPhases.length
                        ? read(source.surface, station, made.hostPhases[k]!)
                        : {
                            scope: "shared seam ribbon",
                            definition: node.profile,
                          },
                }),
                side,
              );
            } catch (error: unknown) {
              const detail =
                error instanceof Error ? error.message : String(error);
              failures.push({ owner: c.band, detail });
              rows.push({
                owner: c.band,
                kind: "actual-band",
                unavailable: detail,
              });
            }
          });
        } else {
          const count: number = seams.length,
            q: number = node.count / 4,
            a = (j: number): number => seams[j]!.seam[0],
            b = (j: number): number => seams[j]!.seam[1];
          const p = seams.find(
            (s): boolean => s.profile !== undefined,
          )?.profile;
          node.children.forEach((c, index: number): void => {
            try {
              const side = child(c.partFace, c.partEnd, c.rail);
              const arc = (
                from: number,
                to: number,
                columns: number,
              ): IAutoMovieConstructionSplitBand.IStretch => ({ kind: "arc", from, to, columns });
              const seam = (j: number, forward: boolean): IAutoMovieConstructionSplitBand.IStretch => {
                const curve = curves[j];
                if (curve === null || curve === undefined)
                  throw new Error(
                    "blocked by unavailable shared seam[" +
                      j +
                      "]; actual child rail/domain was independently read",
                  );
                return { kind: "seam", curve, forward, columns: q };
              };
              const stretches: IAutoMovieConstructionSplitBand.IStretch[] =
                index === 0
                  ? [arc(a(0), b(0), 3 * q), seam(0, false)]
                  : index === count
                    ? [
                        arc(b(count - 1), a(count - 1) + 2 * Math.PI, 3 * q),
                        seam(count - 1, true),
                      ]
                    : [
                        arc(a(index), a(index - 1), q),
                        seam(index - 1, true),
                        arc(b(index - 1), b(index), q),
                        seam(index, false),
                      ];
              const made = Band.fan(
                {
                  name: c.band,
                  host: { surface: source.surface, station, into },
                  child: side,
                  stretches,
                  corner: p?.corner ?? 0,
                  ...(p?.reach === undefined ? {} : { reach: p.reach }),
                  ...(p?.square === true ? { square: true } : {}),
                  ...(c.crease === undefined ? {} : { crease: c.crease }),
                  ...(c.correspondence === undefined
                    ? {}
                    : { correspondence: c.correspondence }),
                },
                node.count,
                trace(c.band),
              );
              publish(
                c.band,
                made,
                (k: number) => {
                  const phase: number | undefined =
                    typeof made === "string" ? undefined : made.phases[k];
                  if (phase !== undefined && Number.isFinite(phase))
                    return {
                      kind: "actual-parent-source",
                      station,
                      phase,
                      full2: read(source.surface, station, phase),
                    };
                  let start: number = 0;
                  for (const stretch of stretches) {
                    if (k < start + stretch.columns) {
                      const share: number =
                        stretch.kind === "seam"
                          ? stretch.forward
                            ? (k - start) / stretch.columns
                            : 1 - (k - start) / stretch.columns
                          : 0;
                      return stretch.kind === "seam"
                        ? {
                            kind: "shared-seam",
                            share,
                            reading: stretch.curve.at(share),
                            ends: stretch.curve.ends,
                            normal: stretch.curve.normal,
                            physicalSource2: {
                              unavailable:
                                "the shared seam owns point/unit tangent and transverse ribbon; it is not a parent surface chart",
                            },
                          }
                        : { unavailable: "fan arc phase absent" };
                    }
                    start += stretch.columns;
                  }
                  return { unavailable: "fan column has no declared stretch" };
                },
                side,
              );
            } catch (error: unknown) {
              const detail =
                error instanceof Error ? error.message : String(error);
              failures.push({ owner: c.band, detail });
              rows.push({
                owner: c.band,
                kind: "actual-band",
                unavailable: detail,
              });
            }
          });
        }
      } else if (node.type === "continue") {
        const host = take(node.hostFace),
          part = take(node.partFace);
        if (node.band !== undefined) {
          const side = child(node.partFace, node.partEnd, node.band.rail),
            station: number = end(host, node.hostEnd);
          publish(
            node.name,
            Band.fan(
              {
                name: node.name,
                host: {
                  surface: host.surface,
                  station,
                  into: node.hostEnd === "bottom" ? -1 : 1,
                },
                child: side,
                stretches: [
                  {
                    kind: "arc",
                    from: 0,
                    to: 2 * Math.PI,
                    columns: node.band.count,
                  },
                ],
                corner: 0,
                correspondence: node.band.correspondence ?? "length",
              },
              node.band.count,
              trace(node.name),
            ),
            (k: number) => ({
              station,
              full2: read(
                host.surface,
                station,
                (2 * Math.PI * k) / node.band!.count,
              ),
            }),
            side,
          );
        } else {
          const made = AutoMovieConstructionContinuation.apply(
            host.chain,
            node.hostEnd,
            part.chain,
            node.partEnd,
          );
          if (typeof made === "string") throw new Error(made);
          const surface = AutoMovieSolidChain.surface(made);
          if (surface === null)
            throw new Error("continued actual surface2 unavailable");
          sources.set(node.partFace, { chain: made, surface });
          rows.push({
            owner: node.name,
            kind: "actual-continuation-override",
            part: node.partFace,
            domain: surface.domain,
            wholeEndpointOwner: "existing Continuation.apply",
            boundary: Array.from(
              { length: part.chain.samples },
              (_, k: number) =>
                read(
                  surface,
                  end({ chain: made, surface }, node.partEnd),
                  (2 * Math.PI * k) / part.chain.samples,
                ),
            ),
          });
        }
      } else if (node.type === "join") {
        const part = take(node.seed.partFace),
          host = take(node.seed.hostFace);
        const partSurface =
            observe?.seedSurface?.(node.name, "part", part.surface) ??
            part.surface,
          hostSurface =
            observe?.seedSurface?.(node.name, "host", host.surface) ??
            host.surface;
        const seed = AutoMovieConstructionSeeds.create(
          node.seed,
          partSurface,
          part.chain.layers.map((layer) => layer.y),
          hostSurface,
          0,
          node.tolerance * 1000,
          observe?.seed === undefined
            ? undefined
            : (event): void => {
                observe.seed!(node.name, event);
              },
        );
        if (typeof seed === "string") throw new Error(seed);
        rows.push({
          owner: node.name,
          kind: node.kind + "-seed",
          definition: node.seed,
          actual: seed,
          part2: read(part.surface, seed.s, seed.phi),
          host2: read(host.surface, seed.y, seed.theta),
          pending: [
            "closed intersection trace",
            "kept-side rail admission",
            "blend columns",
            "trim cycles/topology",
            "final mesh/fill",
          ],
        });
      } else if (node.type === "trim")
        rows.push({
          owner: node.name,
          kind: "trim",
          status: "not evaluated",
          reason:
            "through-cut trace and final cycles belong to the gated full realization",
          definition: node,
        });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      failures.push({ owner: node.name, detail });
      if (node.type === "split")
        for (const c of node.children) {
          try {
            const side = child(c.partFace, c.partEnd, c.rail);
            rows.push({
              owner: c.band,
              kind: "blocked-band",
              unavailable: "shared host/seam premise: " + detail,
              independentChild: {
                station: side.station,
                into: side.into,
                domain: side.surface.domain,
                full2: Array.from({ length: node.count }, (_, k: number) =>
                  read(
                    side.surface,
                    side.station,
                    (2 * Math.PI * k) / node.count,
                  ),
                ),
              },
            });
          } catch (childError: unknown) {
            const childDetail =
              childError instanceof Error
                ? childError.message
                : String(childError);
            failures.push({ owner: c.band, detail: childDetail });
            rows.push({
              owner: c.band,
              kind: "blocked-band",
              unavailable: childDetail,
              sharedHostFailure: detail,
            });
          }
        }
    }
  };
  walk(root);
  return { rows, failures, backward, keptDomains };
}
