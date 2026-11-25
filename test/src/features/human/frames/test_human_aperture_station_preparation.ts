import { AutoMovieLoftChain, AutoMovieViewLoft } from "@automovie/engine";
import {
  AutoMovieHumanApertureSpan,
  AutoMovieHumanBodyApertures,
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanApertureSpan,
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";

/**
 * Fit a made oval opening to a circular loft and recover a known point on its
 * interior ring. Exercise both genuine native sections and legacy spline rows
 * on the same authored axis.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production aperture projector and nearest-phase reader and counts original axis requests for the fixed-station search. Every dense phase agrees bit for bit with the public one-point read.
 * @evidence contracts/development/testing.md#independent-expectations The margin has known world heights and each target comes from a specified admissible phase of the same ring. The independent axis counter distinguishes one preparation from hundreds of repeated reads.
 * @evidence contracts/development/testing.md#distinguishing-cases A native circle and the spline compatibility rows cover the dense preparation and the sparse standalone spline path on both an exact end and interior stations.
 * @evidence contracts/development/testing.md#execution-ownership The fixture uses made lofts and CPU math with optional local timing output. It needs no reference asset, renderer or external state.
 * @evidence contracts/development/common.md#meaningful-documentation States the authored fixture, read scope and exact coordinate comparison.
 */
export function test_human_aperture_station_preparation(): void {
  const stations: number[] = [0, 2, 4];
  const shoulder: number = Math.SQRT2 - 1;
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "aperture.circle",
    centres: [
      [0, 0, 0],
      [0, 4, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: stations,
    values: [
      2,
      0,
      0,
      2,
      -2,
      0,
      0,
      -2,
      shoulder,
      shoulder,
      shoulder,
      shoulder,
    ].map((value: number): number[] => [value, value, value]),
  };
  const part: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(
    family,
    stations,
  );
  let reads: number = 0;
  const loft = AutoMovieViewLoft.create({
    ...part,
    axis: {
      ...part.axis,
      at(station: number): IAutoMovieLoftSectionFrame {
        if (!(station >= 0 && station <= 4))
          throw new Error("Aperture read outside its native station domain");
        reads++;
        return part.axis.at(station);
      },
    },
  });
  const native: IAutoMovieLoftChain | null = loft.chain;
  if (
    native === null ||
    native.nativeSource === undefined ||
    native.basis !== "spline"
  )
    throw new Error(
      "The fixture needs the actual native loft and compatibility rows",
    );
  const legacy: IAutoMovieLoftChain = {
    ...native,
    nativeSource: undefined,
    originalSection: undefined,
    sectionSpans: undefined,
    layers: native.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...layer,
        sectionSource: undefined,
      }),
    ),
  };
  const [aperture] = AutoMovieHumanBodyApertures.prepare(
    [
      {
        name: "test.aperture",
        order: 1,
        coefficients: [2, 0, 0, 2, 0.45, 0, 0, 0, 0.45],
        forward: [1, 0, 0],
        depth: 0.2,
      },
    ],
    [],
  );
  const failures: string[] = [];
  for (const [label, chain] of [
    ["native", native],
    ["legacy", legacy],
  ] as const) {
    for (const s of [0, 1.3, 4]) {
      const read = AutoMovieLoftChain.sampler(chain, s);
      for (let k: number = 0; k < 512; k++) {
        const phase: number = (Math.PI * (k - 256)) / 256;
        const direct: AutoMovieVector3Tuple = AutoMovieLoftChain.point(
          chain,
          s,
          phase,
        );
        if (
          read(phase).some(
            (value: number, i: number): boolean => !Object.is(value, direct[i]),
          )
        )
          failures.push(
            label + " preparation changed the point at " + s + "/" + phase,
          );
      }
    }

    const station: number = 1.3;
    reads = 0;
    const target: AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(
      chain,
      station,
    )(0.37);
    const one: number = reads;
    const started: number = performance.now();
    reads = 0;
    const phase: number = AutoMovieHumanApertureSpan.phaseOf(
      chain,
      station,
      target,
      0,
    );
    const phaseReads: number = reads;
    const phaseMilliseconds: number = performance.now() - started;
    if (one === 0 || phaseReads !== one || Math.abs(phase - 0.37) > 1e-8)
      failures.push(
        label +
          " nearest used " +
          phaseReads +
          " axis reads, one preparation uses " +
          one +
          ", phase " +
          phase,
      );

    reads = 0;
    const projectionStart: number = performance.now();
    const span: IAutoMovieHumanApertureSpan.ISpan | string =
      AutoMovieHumanApertureSpan.of(aperture!, [chain], []);
    const projectionMilliseconds: number = performance.now() - projectionStart;
    if (typeof span === "string")
      throw new Error(label + " aperture fixture refused " + span);
    const loop = span.loops.get(chain.name);
    if (
      span.chains.length !== 1 ||
      loop?.length !== aperture!.edge.length ||
      span.points.some(
        (point, i): boolean => Math.abs(point.s - aperture!.edge[i]![1]) > 1e-6,
      )
    )
      failures.push(label + " changed the known aperture chart");
    if (process.env["AUTOMOVIE_APERTURE_SCOPE_PROFILE"] === "1")
      console.log(
        JSON.stringify({
          label,
          phase,
          phaseReads,
          phaseMilliseconds,
          projectionAxisReads: reads,
          projectionMilliseconds,
          chartSha256: createHash("sha256")
            .update(JSON.stringify([span.points, loop]))
            .digest("hex"),
        }),
      );
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
