import {
  type IPortraitComponent,
  type IPortraitInterior,
  buildPortraitHead,
  createPortraitInteriorFinisher,
  portraitPart,
  preparePortraitHead,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { nclose } from "../internal/predicates";

/**
 * Native interior preparation precedes model packing and retains the established
 * component order. A centimetre triangle supplies independent metric values;
 * observable producer/mesh reads distinguish staging from duplicate generation.
 *
 * Scenarios:
 * 1. Preparing skin alone invokes no interior. The final consumer stages every
 *    selected provider once before packing, reading a final surface proposal.
 * 2. An absent provider uses the legacy finisher; an empty provider suppresses
 *    that fallback. Mixed components retain their original model-part order.
 * 3. Native and compatibility consumers both convert 10 mm to 0.01 m, retain
 *    connectivity/material, own output buffers and admit an empty interior.
 */
export const test_subject_native_interiors = (): void => {
  const { host } = humanFaceFixture().basis;
  const before = structuredClone(host);
  const events: string[] = [];
  const native: IPortraitInterior[] = [];
  let depth = NaN;
  const triangle = () => ({
    positions: [0, 0, 0, 10, 0, 0, 0, 10, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  });
  const components = ["legacy", "first", "empty", "last"].map(
    (id): IPortraitComponent => ({
      id,
      fit: () => ({
        constraints: [],
        cutFaces: [],
        attach: () => ({
          openings: [],
          finalSurface:
            id === "first"
              ? (surface) => [
                  {
                    vertex: 4,
                    target: [
                      surface.positions[4][0],
                      surface.positions[4][1],
                      surface.positions[4][2] + 1,
                    ],
                  },
                ]
              : undefined,
          prepareInteriors:
            id === "legacy"
              ? undefined
              : (surface) => {
                  events.push(`prepare:${id}`);
                  depth = surface.positions[4][2];
                  if (id === "empty") return [];
                  const mesh = triangle();
                  const part: IPortraitInterior = {
                    id,
                    material: "teeth",
                    mesh: {
                      ...mesh,
                      get positions() {
                        events.push(`pack:${id}`);
                        return mesh.positions;
                      },
                    },
                  };
                  native.push(part);
                  return [part];
                },
          finish: () => {
            events.push(`finish:${id}`);
            return [portraitPart(id, triangle(), "teeth")];
          },
        }),
      }),
    }),
  );
  preparePortraitHead(host, components, 0);
  TestValidator.equals("skin preparation defers providers", events, []);
  const result = buildPortraitHead(host, components, 0);
  TestValidator.equals(
    "all native preparation precedes packing",
    events.slice(0, 3),
    ["prepare:first", "prepare:empty", "prepare:last"],
  );
  TestValidator.equals(
    "one generation per component",
    events.filter((event) => !event.startsWith("pack:")),
    ["prepare:first", "prepare:empty", "prepare:last", "finish:legacy"],
  );
  TestValidator.predicate(
    "providers read final skin",
    nclose(depth, host.positions[4][2] + 1),
  );
  const parts = result.parts.slice(-3);
  TestValidator.equals(
    "mixed output order and empty omission",
    parts.map((part) => part.id),
    ["legacy", "first", "last"],
  );
  for (const part of parts) {
    if (part.geometry.type !== "mesh")
      throw new Error("Expected prepared mesh.");
    TestValidator.predicate(
      "native millimetres become model metres",
      part.geometry.mesh.positions.every((v, i) =>
        nclose(v, [0, 0, 0, 0.01, 0, 0, 0, 0.01, 0][i]),
      ),
    );
    TestValidator.equals(
      "native indices retained",
      part.geometry.mesh.indices,
      [0, 1, 2],
    );
    TestValidator.equals("native material retained", part.material, "teeth");
  }
  const first = native[0].mesh;
  TestValidator.equals(
    "packing retains source units",
    first.positions,
    triangle().positions,
  );
  parts[1].id = "changed-output";
  if (parts[1].geometry.type !== "mesh")
    throw new Error("Expected owned mesh.");
  parts[1].geometry.mesh.positions[3] = 99;
  TestValidator.equals(
    "packing owns output positions",
    first.positions,
    triangle().positions,
  );
  TestValidator.equals("native identity retained", native[0].id, "first");
  TestValidator.equals("source host retained", host, before);

  let calls = 0;
  const adapter = createPortraitInteriorFinisher(() => {
    ++calls;
    return [{ id: "direct", mesh: triangle(), material: "teeth" }];
  });
  const prepared = adapter.prepareInteriors(result.refined)[0];
  const finished = adapter.finish(result.refined)[0];
  TestValidator.equals("one producer call per requested mode", calls, 2);
  TestValidator.predicate(
    "direct native units",
    nclose(prepared.mesh.positions[3], 10),
  );
  if (finished.geometry.type !== "mesh")
    throw new Error("Expected direct mesh.");
  TestValidator.predicate(
    "direct compatibility units",
    nclose(finished.geometry.mesh.positions[3], 0.01),
  );
  TestValidator.equals(
    "empty compatibility result",
    createPortraitInteriorFinisher(() => []).finish(result.refined),
    [],
  );
};
