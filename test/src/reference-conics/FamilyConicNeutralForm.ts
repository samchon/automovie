import {
  AutoMovieHumanArmSources,
  AutoMovieHumanFootToeSources,
  AutoMovieHumanEmptyProbes as Probes,
} from "@automovie/human";
import type { buildHumanNeutralCapture } from "@automovie/human/capture";
import type { IAutoMovieLoftChain } from "@automovie/interface";

import { FamilyConicFormMeasurements as Form } from "./FamilyConicFormMeasurements";

/** Whole-figure measurements on one neutral case already drawn by Human. */
export namespace FamilyConicNeutralForm {
  /**
   * Maximum shared-chart discrepancy at the campaign's 0.01 mm geometric
   * resolution (`rule-basis.md`). HumanBodyLane's section representation has
   * the same precision. The source's trace solves use their tighter tolerance.
   */
  const MAX_CONTACT_GAP_MM: number = 0.01;

  /** Retained per-case data required by the neutral form inspection. */
  type Capture = Pick<
    ReturnType<typeof buildHumanNeutralCapture.inspect>,
    "mesh" | "pieces" | "solidSurfaces" | "triangleGroups" | "nailClipping"
  > & {
    /** Original loft chains and published face chart boundaries. */
    calibration: Pick<
      ReturnType<typeof buildHumanNeutralCapture.inspect>["calibration"],
      "chains" | "bodies"
    >;
  };

  /** Present shape measurements and any required data the case could not supply. */
  export interface IReport {
    /** Original skin inspection, when the necessary retained inputs exist. */
    measurements: Form.IReport | null;
    /** Missing measurement inputs and failed reads, in run order. */
    unavailable: string[];
  }

  /**
   * Register the actual trunk's middle course point, the published cutter
   * courses and the neighbouring digit pairs with the master shape readers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the same indexed skin, topology, contact charts and generating courses as the neutral capture. Digit identities come from the actual attachment owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing retained owner, failed probe or absent nail clipping receipt is an unavailable measurement. Only the actual case may supply its observations.
   */
  export function measure(
    capture: Capture,
    onPhase?: (phase: Form.Phase) => void,
  ): IReport {
    const {
      calibration,
      mesh,
      solidSurfaces: surfaces,
      triangleGroups,
      nailClipping,
      pieces,
    } = capture;
    const unavailable: string[] = [];
    const hands: string[][] = [];
    const digits: string[] = [];
    const pairs: [string, string][] = [];
    for (const side of ["left", "right"] as const) {
      const hand = AutoMovieHumanArmSources.names(side);
      const fingers = [hand.at(-1)!, ...hand.slice(0, -1)];
      const toes = AutoMovieHumanFootToeSources.names(side);
      hands.push(fingers);
      digits.push(...fingers, ...toes);
      pairs.push(...neighbours(fingers), ...neighbours(toes));
    }
    verifyClipping(digits, nailClipping, unavailable);

    const bodies = calibration.bodies ?? [];
    if (bodies.length !== 1)
      unavailable.push(
        `skin retains ${bodies.length} solid bodies, expected one for contact measurement`,
      );
    if (mesh.indices === null || mesh.indices.length === 0)
      unavailable.push(
        "skin has no retained triangle buffer for form measurement",
      );
    if (
      bodies.length !== 1 ||
      mesh.indices === null ||
      mesh.indices.length === 0
    )
      return { measurements: null, unavailable };

    const body = bodies[0]!;
    const owners = new Map(
      body.faces.map(({ chain, inverted }) => [chain, { inverted }]),
    );
    const chains = new Map(
      calibration.chains.map((chain) => [chain.name, chain]),
    );
    const retained = (name: string): IAutoMovieLoftChain => {
      const chain = chains.get(name);
      if (chain === undefined || !owners.has(name) || !surfaces.has(name))
        throw new Error(`${name} has no retained source and solid face`);
      return chain;
    };
    let interior: Probes.IPlaced;
    try {
      interior = Probes.middleRetained(retained("trunk"));
      if (!interior.point.every(Number.isFinite))
        throw new Error("trunk course midpoint is nonfinite");
    } catch (error: unknown) {
      unavailable.push(`interior probe: ${detail(error)}`);
      return { measurements: null, unavailable };
    }

    const probes: Probes.IProbe[] = [];
    const cutters = new Set([
      "nose.nostril.left",
      "nose.nostril.right",
      ...body.faces
        .filter(({ inverted }) => inverted)
        .map(({ chain }) => chain),
    ]);
    for (const name of cutters)
      probes.push(
        place(name, "middle of the retained cutter course", () => {
          if (owners.get(name)?.inverted !== true)
            throw new Error(`${name} has no retained cutter face`);
          return Probes.middleRetained(retained(name));
        }),
      );

    const wallNames = ["leg.left", "leg.right", ...hands.flat()];
    const walls = new Map(
      wallNames.map((name): [string, Probes.IPreparedSide | string] => {
        try {
          return [
            name,
            Probes.prepareRetained(retained(name), surfaces.get(name)!),
          ];
        } catch (error: unknown) {
          return [name, detail(error)];
        }
      }),
    );
    const prepared = (name: string): Probes.IPreparedSide => {
      const wall = walls.get(name)!;
      if (typeof wall === "string") throw new Error(wall);
      return wall;
    };
    probes.push(
      place("legs", "first qualifying gap below the crotch", () =>
        Probes.splitPrepared(
          "legs",
          prepared("leg.left"),
          prepared("leg.right"),
          "last",
        ),
      ),
    );
    for (const hand of hands)
      for (const [a, b] of neighbours(hand)) {
        const name = `${a} / ${b}`;
        probes.push(
          place(name, "between the retained walls of adjacent digits", () =>
            Probes.betweenPrepared(name, prepared(a), prepared(b)),
          ),
        );
      }

    try {
      const measurements = Form.measure(
        {
          mesh: { ...mesh, indices: mesh.indices },
          body,
          surfaces,
          triangleGroups,
          pieces,
        },
        probes,
        interior.point.map((mm): number => mm / 1000),
        pairs,
        nailClipping,
        onPhase,
      );
      if (measurements.contacts.length === 0)
        unavailable.push("skin has no measured shared-boundary chart pairs");
      for (const { first, second, maxMm, pointMm } of measurements.contacts)
        if (maxMm > MAX_CONTACT_GAP_MM)
          measurements.findings.push(
            `shared contact ${first} / ${second} gaps ${maxMm} mm at [${pointMm.join(", ")}] mm, above the ${MAX_CONTACT_GAP_MM} mm limit`,
          );
      return { measurements, unavailable };
    } catch (error: unknown) {
      unavailable.push(`retained skin measurement failed: ${detail(error)}`);
      return { measurements: null, unavailable };
    }
  }

  /** Account for every required case-owned digit receipt exactly once. */
  function verifyClipping(
    digits: readonly string[],
    clipping: Capture["nailClipping"],
    unavailable: string[],
  ): void {
    if (clipping === undefined || clipping.length === 0) {
      unavailable.push(
        `skin has no nail clipping receipts for ${digits.join(", ")}`,
      );
      return;
    }
    const expected = new Map(
      digits.map((digit): [string, number] => [digit, 0]),
    );
    if (expected.size !== 20)
      unavailable.push(
        `skin has ${expected.size} canonical nail sites, expected 20`,
      );
    for (const { digit, maximumMm } of clipping) {
      const count = expected.get(digit);
      if (count === undefined) {
        unavailable.push(
          `skin reports nail clipping for unknown digit ${digit}`,
        );
        continue;
      }
      expected.set(digit, count + 1);
      if (!(Number.isFinite(maximumMm) && maximumMm >= 0))
        unavailable.push(
          `${digit} nail clipping receipt must be a finite nonnegative distance`,
        );
    }
    for (const [digit, count] of expected)
      if (count !== 1)
        unavailable.push(
          `${digit} has ${count} nail clipping receipts, expected one`,
        );
  }

  /** Use consecutive anatomical neighbours without a parallel name table. */
  function neighbours(names: readonly string[]): [string, string][] {
    return names
      .slice(1)
      .map((name, index): [string, string] => [names[index]!, name]);
  }

  /** Keep the name and reason for a void site that could not be read. */
  function place(
    name: string,
    derivation: string,
    read: () => Probes.IProbe,
  ): Probes.IProbe {
    try {
      const probe = read();
      if ("point" in probe && !probe.point.every(Number.isFinite))
        throw new Error("probe point is nonfinite");
      return probe;
    } catch (error: unknown) {
      return { name, derivation, reason: detail(error) };
    }
  }

  /** Convert a failed owned geometric query into its receipt text. */
  function detail(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
