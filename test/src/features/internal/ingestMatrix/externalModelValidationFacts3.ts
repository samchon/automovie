import { rejects } from "./rejects";
import { humanoidChanged } from "./humanoidChanged";
import { humanoidShapeFailures } from "./humanoidShapeFailures";
import { rejectsHumanoidPayload } from "./rejectsHumanoidPayload";
import { acceptsHumanoid } from "./acceptsHumanoid";
import { unsignedShortHumanoid } from "./unsignedShortHumanoid";
import { floatWeightHumanoid } from "./floatWeightHumanoid";
import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { normalizedFloatWeightHumanoid } from "./normalizedFloatWeightHumanoid";
import { offsetHumanoid } from "./offsetHumanoid";
import { aliasHumanoid } from "./aliasHumanoid";
import { throwsError } from "../predicates";
import { type IAutoMovieExternalModelInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { baseDocument } from "./baseDocument";
import { vrmFacts } from "./vrmFacts";

/**
 * Register original humanoid/VRM cases plus negative FLOAT influence cancellation refusal.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export function externalModelValidationFacts3(): [string, () => boolean][] {
  return [
[
      "humanoidNeedsHips",
      () : boolean =>
        rejects(
          humanoidChanged(["nodes", 1, "name"], "Spine"),
          "requires a skin and a normalized hips",
          "gltf-humanoid-v1",
        ),
    ],
[
      "skinBindingNeedsMesh",
      () : boolean =>
        rejects(
          humanoidChanged(["nodes", 0, "mesh"], undefined),
          "binds a skin without a render mesh",
          "gltf-humanoid-v1",
        ),
    ],
[
      "humanoidNeedsBoundPrimitive",
      () : boolean =>
        rejects(
          humanoidChanged(["nodes", 0, "skin"], undefined),
          "complete skin binding",
          "gltf-humanoid-v1",
        ),
    ],
[
      "humanoidNeedsJointAttribute",
      () : boolean =>
        rejects(
          humanoidChanged(
            ["meshes", 0, "primitives", 0, "attributes", "JOINTS_0"],
            undefined,
          ),
          "attributes.JOINTS_0",
          "gltf-humanoid-v1",
        ),
    ],
[
      "humanoidNeedsWeightAttribute",
      () : boolean =>
        rejects(
          humanoidChanged(
            ["meshes", 0, "primitives", 0, "attributes", "WEIGHTS_0"],
            undefined,
          ),
          "attributes.WEIGHTS_0",
          "gltf-humanoid-v1",
        ),
    ],
...humanoidShapeFailures(),
[
      "humanoidJointMustStayInsideSkin",
      () : boolean =>
        rejectsHumanoidPayload((payload: Buffer) : void => {
          payload[36] = 1;
        }, "cites joint 1 outside skin"),
    ],
[
      "humanoidNeedsPositiveWeight",
      () : boolean =>
        rejectsHumanoidPayload(
          (payload: Buffer) : Buffer => payload.fill(0, 48, 60),
          "has no positive skin weight",
        ),
    ],
[
      "skinAccessorCannotBeSparse",
      () : boolean =>
        rejects(
          humanoidChanged(["accessors", 1, "sparse"], {
            count: 1,
            indices: { bufferView: 1, componentType: 5121 },
            values: { bufferView: 1 },
          }),
          "Skin accessor 1 may not use sparse overrides",
          "gltf-humanoid-v1",
        ),
    ],
["humanoidU16Accessors", () : boolean => acceptsHumanoid(unsignedShortHumanoid())],
["humanoidFloatWeights", () : boolean => acceptsHumanoid(floatWeightHumanoid())],
[
      "humanoidNegativeFloatWeightCannotBeCancelled",
      (): boolean => {
        const fixture: { document: ExternalModelMatrixObject; payload: Buffer } =
          floatWeightHumanoid();
        // The sum is exactly one; it cannot certify each component's sign.
        fixture.payload.writeFloatLE(-0.25, 48);
        fixture.payload.writeFloatLE(1.25, 52);
        return rejects(
          fixture.document,
          "vertex 0 component 0 has negative skin weight -0.25",
          "gltf-humanoid-v1",
          (uri: string): Uint8Array | null =>
            uri === "human.bin" ? fixture.payload : null,
        );
      },
    ],
[
      "humanoidNormalizedFloatWeights",
      () : boolean => acceptsHumanoid(normalizedFloatWeightHumanoid()),
    ],
["humanoidOffsetDefaults", () : boolean => acceptsHumanoid(offsetHumanoid())],
["humanoidIgnoresUnmappedAliases", () : boolean => acceptsHumanoid(aliasHumanoid())],
[
      "pathWithoutExtension",
      () : boolean =>
        throwsError(
          () : IAutoMovieExternalModelInspection =>
            inspectAutoMovieExternalModelBytes({
              path: "public/models/matrix",
              bytes: Buffer.from(JSON.stringify(baseDocument()), "utf8"),
              profile: "gltf-static-v1",
            }),
          "must end in .gltf, .glb, or .vrm",
        ),
    ],
...vrmFacts()
  ];
}

