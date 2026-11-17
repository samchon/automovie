import {
  ArchetypeBuilder,
  ArchetypeDrawSession,
  QuadrupedEars,
  createHorse,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import { nclose } from "./nclose";

/**
 * Real builder admission and no-partial-emission observation for ear plates.
 *
 * Synthetic dimensions are explicitly authored positive/negative geometry,
 * never animal reference values. A genuine head rig and untouched builder
 * expose the public seam's behavior without method replacement or simulation.
 */
export namespace EquineEarAdmission {
  /** A genuine builder is observed before and after malformed profile admission. */
  export function verify(findings: string[]): void {
    const head: createHorse.IRig = createHorse.rig({
      withersHeight: 1.6,
      girth: (1.6 * 2.04) / 1.72,
      mass: 400,
      tempo: 0,
    });
    const good: QuadrupedEars.IProfile = {
      length: 0.2,
      width: 0.08,
      plateThickness: 0.008,
      direction: { x: 1, y: 1, z: 0 },
    };
    const bad: readonly QuadrupedEars.IProfile[] = [
      { ...good, length: 0 },
      { ...good, width: -1 },
      { ...good, plateThickness: Number.NaN },
      { ...good, length: Number.POSITIVE_INFINITY },
      { ...good, width: 1 },
      { ...good, direction: { x: 0, y: 0, z: 0 } },
      { ...good, direction: { x: 1, y: Number.NaN, z: 0 } },
    ];
    for (const profile of bad) {
      const builder: ArchetypeBuilder<never, "mass"> = fixture();
      const before: string = JSON.stringify(builder.build(1));
      try {
        QuadrupedEars.lay(builder, head, 1.6, profile, "#8a5a3a");
        findings.push("Malformed actual ear profile was admitted");
      } catch (error) {
        if (!(error instanceof RangeError))
          findings.push(
            `Ear admission lost geometric refusal: ${String(error)}`,
          );
      }
      if (JSON.stringify(builder.build(1)) !== before)
        findings.push(
          "Failed ear admission partially changed the actual builder",
        );
    }
    for (const weight of [
      0,
      -1,
      Number.MIN_VALUE,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      const weighted: ArchetypeBuilder<never, "mass"> = fixture();
      const before: string = JSON.stringify(weighted.build(1));
      try {
        QuadrupedEars.lay(weighted, head, 1.6, good, "#8a5a3a", weight);
        findings.push(
          "A nonpositive or unrepresentable actual ear weight was admitted",
        );
      } catch (error) {
        if (!(error instanceof RangeError))
          findings.push(`Ear weight refusal changed: ${String(error)}`);
      }
      if (JSON.stringify(weighted.build(1)) !== before)
        findings.push(
          "Failed ear weight admission changed actual builder parts",
        );
    }
    const builder: ArchetypeBuilder<never, "mass"> = fixture();
    QuadrupedEars.lay(builder, head, 1.6, good, "#8a5a3a");
    if (
      !validateModel({ model: builder.build(1) }).success ||
      builder.build(1).parts.length !== 3
    )
      findings.push(
        "Positive actual ear profile did not emit both valid parts",
      );
    const requested: QuadrupedEars.IProfile = {
      ...good,
      direction: { ...good.direction },
    };
    const prepared: QuadrupedEars.IPrepared = QuadrupedEars.prepare(
      head,
      1.6,
      requested,
    );
    if (
      !nclose(
        prepared.volume,
        2 * (0.2 * 1.6) * (0.08 * 1.6) * (0.008 * 1.6),
        1e-12,
      )
    )
      findings.push(
        "Prepared ear volume differs from the authored actual boxes",
      );
    requested.length += 1;
    requested.direction.y += 1;
    const first: ArchetypeBuilder<never, "mass"> = fixture();
    prepared.emit(first, "#8a5a3a");
    const original: string = JSON.stringify(first.build(1));
    const firstEar: IAutoMovieModelPart | undefined = first
      .build(1)
      .parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === "leftEar",
      );
    if (firstEar === undefined)
      throw new Error("The prepared actual ear is missing");
    firstEar.transform!.translation.y += 1;
    const second: ArchetypeBuilder<never, "mass"> = fixture();
    prepared.emit(second, "#8a5a3a");
    if (
      JSON.stringify(second.build(1)) !== original ||
      original !== JSON.stringify(builder.build(1))
    )
      findings.push(
        "Prepared emission retained mutable caller input or a prior model's actual frame",
      );
  }

  /** One ordinary actual marker part makes mutation visible without patching the builder. */
  function fixture(): ArchetypeBuilder<never, "mass"> {
    const draw: ArchetypeDrawSession<"mass"> = new ArchetypeDrawSession(
      "ear-admission",
      { mass: "kg" },
      7,
    );
    draw.derive("mass", 1);
    const builder: ArchetypeBuilder<never, "mass"> = new ArchetypeBuilder<
      never,
      "mass"
    >({ name: "ear-admission", draw, material: "skin" });
    builder.box("marker", { x: 0.1, y: 0.1, z: 0.1 }, { x: 0, y: 0.05, z: 0 });
    return builder;
  }
}
