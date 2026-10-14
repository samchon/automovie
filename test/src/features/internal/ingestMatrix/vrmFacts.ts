import type { ExternalModelMatrixObject } from "./ExternalModelMatrixObject";
import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { glb } from "./glb";
import { humanoidResolver } from "./humanoidResolver";
import { humanoidDocument } from "./humanoidDocument";
import { throwsError } from "../predicates";
import { set } from "./set";

/**
 * Register VRM 0.x/1.0 valid mappings, malformed metadata and thumb-name migration cases.
 */
export const vrmFacts: () => [string, () => boolean][] = (): [string, () => boolean][] => {
  const inspectVrm: (document: ExternalModelMatrixObject) => unknown = (document: ExternalModelMatrixObject): unknown =>
    inspectAutoMovieExternalModelBytes({
      path: "public/models/human.vrm",
      bytes: glb(document, null),
      profile: "vrm-humanoid-v1",
      resolveResource: humanoidResolver,
    });
  const vrm1: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => {
    const document: ExternalModelMatrixObject = humanoidDocument();
    document.extensions = {
      VRMC_vrm: { humanoid: { humanBones: { hips: { node: 1 } } } },
    };
    return document;
  };
  const vrm0: () => ExternalModelMatrixObject = (): ExternalModelMatrixObject => {
    const document: ExternalModelMatrixObject = humanoidDocument();
    document.extensions = {
      VRM: { humanoid: { humanBones: [{ bone: "hips", node: 1 }] } },
    };
    return document;
  };
  return [
    ["vrmOne", () : boolean => Boolean(inspectVrm(vrm1()))],
    ["vrmZero", () : boolean => Boolean(inspectVrm(vrm0()))],
    [
      "vrmOneUnknownBone",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm1(),
                ["extensions", "VRMC_vrm", "humanoid", "humanBones", "tail"],
                { node: 1 },
              ),
            ),
          "unknown humanoid bone",
        ),
    ],
    [
      "vrmOneBoneMustBeObject",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm1(),
                ["extensions", "VRMC_vrm", "humanoid", "humanBones", "hips"],
                null,
              ),
            ),
          "humanBones.hips must be an object",
        ),
    ],
    [
      "vrmOneNodeMustResolve",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm1(),
                [
                  "extensions",
                  "VRMC_vrm",
                  "humanoid",
                  "humanBones",
                  "hips",
                  "node",
                ],
                9,
              ),
            ),
          "does not resolve to a node",
        ),
    ],
    ...[
      ["vrmOneNodeMustBeNumber", "1"],
      ["vrmOneNodeMustBeSafeInteger", 1.5],
      ["vrmOneNodeMustBeNonnegative", -1],
    ].map(([name, node]: unknown[]): [string, () => boolean] => [
      name as string,
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm1(),
                [
                  "extensions",
                  "VRMC_vrm",
                  "humanoid",
                  "humanBones",
                  "hips",
                  "node",
                ],
                node,
              ),
            ),
          "does not resolve to a node",
        ),
    ]),
    [
      "vrmZeroBoneMustBeString",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm0(),
                ["extensions", "VRM", "humanoid", "humanBones", 0, "bone"],
                1,
              ),
            ),
          "unknown, duplicate or dangling",
        ),
    ],
    [
      "vrmZeroBoneMustBeKnown",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm0(),
                ["extensions", "VRM", "humanoid", "humanBones", 0, "bone"],
                "tail",
              ),
            ),
          "unknown, duplicate or dangling",
        ),
    ],
    [
      "vrmZeroNodeMustResolve",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm0(),
                ["extensions", "VRM", "humanoid", "humanBones", 0, "node"],
                9,
              ),
            ),
          "unknown, duplicate or dangling",
        ),
    ],
    [
      "vrmZeroBoneMustBeUnique",
      () : boolean =>
        throwsError(
          () : unknown =>
            inspectVrm(
              set(
                vrm0(),
                ["extensions", "VRM", "humanoid", "humanBones"],
                [
                  { bone: "hips", node: 1 },
                  { bone: "hips", node: 1 },
                ],
              ),
            ),
          "unknown, duplicate or dangling",
        ),
    ],
    [
      "vrmZeroThumbNamesMigrateToVrmOne",
      () : boolean => {
        const document: ExternalModelMatrixObject = vrm0();
        document.nodes = [
          { mesh: 0, skin: 0 },
          { name: "Hips" },
          { name: "ThumbBase" },
          { name: "ThumbMiddle" },
          { name: "ThumbTip" },
        ];
        set(
          document,
          ["extensions", "VRM", "humanoid", "humanBones"],
          [
            { bone: "hips", node: 1 },
            { bone: "leftThumbProximal", node: 2 },
            { bone: "leftThumbIntermediate", node: 3 },
            { bone: "leftThumbDistal", node: 4 },
          ],
        );
        const inspected: {
          humanoidBones: { bone: string; node: number }[];
        } = inspectVrm(document) as {
          humanoidBones: { bone: string; node: number }[];
        };
        return (
          JSON.stringify(
            inspected.humanoidBones.map(({ bone, node }: { bone: string; node: number }) : [string, number] => [bone, node]),
          ) ===
          JSON.stringify([
            ["hips", 1],
            ["leftThumbMetacarpal", 2],
            ["leftThumbProximal", 3],
            ["leftThumbDistal", 4],
          ])
        );
      },
    ],
    [
      "vrmMetadataIsRequired",
      () : boolean =>
        throwsError(
          () : unknown => inspectVrm(humanoidDocument()),
          "requires a GLB/VRM container with VRM",
        ),
    ],
  ];
};
