import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  appendFlamesArtifact
} from "../../../../../packages/engine/src/validation/internal/appendFlamesArtifact";
import type { IAutoMovieFlameCue } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A flame resolves its own emitter, physical size and emission contract.
 *
 * Scenarios:
 *
 * 1. A bound flame points to the emitter and interval of its staged binding.
 * 2. Duplicated identity, unknown node, missing emitter, inadmissible sizes and
 *    competing emission produce located findings in cue order.
 * 3. At the compiled boundary, the bound id must name a retained light clip.
 */
export function test_engine_validation_flames_artifact(): void {
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const cue: IAutoMovieFlameCue = {
    id: "wick",
    node: "lamp",
    emitter: "wick",
    seed: 7,
    size: { kind: "small", height: 0.125, radius: 0.03125 },
    on: { start: 0.5, end: 1 },
    light: "glow",
  };
  const nodes: Parameters<typeof appendFlamesArtifact>[1] = [
    { id: "lamp", model: "candle" },
  ];
  const context: NonNullable<Parameters<typeof appendFlamesArtifact>[4]> = {
    models: [
      {
        id: "candle",
        affordances: [
          {
            id: "wick",
            kind: "socket",
            extent: null,
            frame: {
              translation: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
      },
    ],
    bindings: [
      {
        id: "glow",
        light: "point",
        prop: "lamp",
        emitter: "wick",
        on: { start: 0.5, end: 1 },
      },
    ],
  };
  appendFlamesArtifact([cue], nodes, 1, collector, context);
  TestValidator.equals("known binding matches the flame", collector.items, []);
  appendFlamesArtifact(
    [
      cue,
      {
        ...cue,
        node: "missing",
        light: "ghost",
        size: { kind: "small", height: 0, radius: 0.03125 },
        emission: {
          luminance: 1,
          color: { r: 1, g: 1, b: 1, a: null, hex: null },
        },
      },
      {
        ...cue,
        id: "wide",
        emitter: "missing",
        light: undefined,
        size: { kind: "open", diameter: 0.5, heatRelease: 1 },
      },
      {
        ...cue,
        id: "fast",
        light: undefined,
        size: { kind: "open", diameter: 0.03125, heatRelease: 1 },
        emission: {
          luminance: 1,
          color: { r: 1, g: 1, b: 1, a: null, hex: null },
        },
      },
    ],
    nodes,
    1,
    collector,
    context,
  );
  TestValidator.equals(
    "author faults are located independently",
    collector.items.map(({ path }) => path),
    [
      "$input.flames[1].id",
      "$input.flames[1].node",
      "$input.flames[1].size.height",
      "$input.flames[1].light",
      "$input.flames[1].emission",
      "$input.flames[2].emitter",
      "$input.flames[2].size.heatRelease",
      "$input.flames[2].emission",
      "$input.flames[3].size.diameter",
    ],
  );
  const artifact: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  appendFlamesArtifact([cue], nodes, 1, artifact, {
    lights: new Set<string>(),
  });
  TestValidator.equals(
    "a missing bound clip is located at light",
    artifact.items.map(({ path }) => path),
    ["$input.flames[0].light"],
  );
}
