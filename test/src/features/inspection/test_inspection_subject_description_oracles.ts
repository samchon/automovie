import {
  describeAutoMovieSubject,
  describeAutoMovieSubjects,
} from "@automovie/engine";
import type { IAutoMovieSubjectDescription } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { subjectInspectionArtifact } from "../internal/subjectInspectionFixtures";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Compiled subject descriptions reproduce the #1902 coordinates and keep reusable, placed, and declared-space facts separate.
 *
 * Scenarios:
 *
 * 1. The guard-rack pole, solar oriel, and south half-timber brace reproduce their reported world boxes directly from compiled mesh data without a render.
 * 2. A prototype, prototype part, element, and placed part retain distinct stable ids, ownership, placement, material, and revision.
 * 3. A room reports its authored volume separately from the smaller bounds of its actual assigned content.
 * 4. Enumeration is stable and omits on-demand placed parts, while a missing id fails instead of returning invented data.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls direct subject description and enumeration, observing bounds, stable addresses, ownership, material and revision; conflated prototype/placement or invented missing subjects fail.
 * @evidence contracts/testing.md#independent-expectations Resident authored mesh extrema and half-space room dimensions supply expected boxes independently of the describer; these fixtures pin numerical propagation of previously reported coordinates, not reproduced visual production content.
 * @evidence contracts/testing.md#distinguishing-cases Three mesh-coordinate cases, prototype/part/element/placed-part identities, declared versus content room bounds, sorted inventory, omitted on-demand parts and missing-address refusal are retained; transformed edge forms and building units are covered separately.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspection_subject_description_oracles entry owns these synchronous portable compiled-record cases and local fact callbacks; resident synthetic records require no production installation, process, browser or GPU.
 */
export function test_inspection_subject_description_oracles(): void {
  const artifact: import("@automovie/interface").IAutoMovieSubjectArtifact =
    subjectInspectionArtifact();
  const descriptions: IAutoMovieSubjectDescription[] = [
    "guard-rack-west-pole-0",
    "solar-oriel",
    "south-half-timber-brace-0",
  ].map(
    (id: string): import("@automovie/interface").IAutoMovieSubjectDescription =>
      describeAutoMovieSubject(artifact, `element:castle/${id}`),
  );
  TestValidator.predicate(
    "the three #1902 coordinate oracles are reproduced from compiled geometry",
    test12ValuesClose(
      descriptions.map(
        (
          description: import("@automovie/interface").IAutoMovieSubjectDescription,
        ): {
          id: string;
          bounds: import("@automovie/interface").IAutoMovieSubjectBox | null;
        } => ({
          id: description.id,
          bounds: description.bounds.content,
        }),
      ),
      [
        {
          id: "element:castle/guard-rack-west-pole-0",
          bounds: {
            min: { x: -13.92, y: 0, z: 5.32 },
            max: { x: -13.87, y: 2.7, z: 5.38 },
          },
        },
        {
          id: "element:castle/solar-oriel",
          bounds: {
            min: { x: 14.75, y: 4.6, z: -1.71 },
            max: { x: 15.65, y: 7.4, z: 1.71 },
          },
        },
        {
          id: "element:castle/south-half-timber-brace-0",
          bounds: {
            min: { x: -14.27, y: 6.89, z: 11.99 },
            max: { x: -3.73, y: 7.73, z: 12.17 },
          },
        },
      ],
    ),
  );

  const prototype: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(
      artifact,
      "prototype:guard-rack-west-pole-0-model",
    );
  const prototypePart: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(
      artifact,
      "prototype-part:guard-rack-west-pole-0-model/body",
    );
  const element: import("@automovie/interface").IAutoMovieSubjectDescription =
    descriptions[0]!;
  const placedPart: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(
      artifact,
      "element-part:castle/guard-rack-west-pole-0/body",
    );
  TestValidator.predicate(
    "prototype and placement identities remain distinct and linked",
    test12ValuesClose(
      {
        prototype: {
          revision: prototype.revision,
          kind: prototype.kind,
          placement: prototype.placement,
          owner: prototype.owner,
          members: prototype.members,
        },
        prototypePart: {
          kind: prototypePart.kind,
          owner: prototypePart.owner,
          prototype: prototypePart.prototype,
        },
        element: {
          kind: element.kind,
          semanticKind: element.semanticKind,
          prototype: element.prototype,
          placement: element.placement,
          space: element.space,
          materials: element.materials,
        },
        placedPart: {
          kind: placedPart.kind,
          prototype: placedPart.prototype,
          placement: placedPart.placement,
          owner: placedPart.owner,
        },
      },
      {
        prototype: {
          revision: "sha256:inspection-a",
          kind: "prototype",
          placement: null,
          owner: null,
          members: {
            total: 1,
            offset: 0,
            items: ["prototype-part:guard-rack-west-pole-0-model/body"],
            omitted: 0,
          },
        },
        prototypePart: {
          kind: "part",
          owner: "prototype:guard-rack-west-pole-0-model",
          prototype: null,
        },
        element: {
          kind: "element",
          semanticKind: "pole",
          prototype: "prototype:guard-rack-west-pole-0-model",
          placement: "element:castle/guard-rack-west-pole-0",
          space: "space:castle/hall",
          materials: [{ id: "stone", name: "inspection stone" }],
        },
        placedPart: {
          kind: "part",
          prototype: "prototype-part:guard-rack-west-pole-0-model/body",
          placement: "element-part:castle/guard-rack-west-pole-0/body",
          owner: "element:castle/guard-rack-west-pole-0",
        },
      },
    ),
  );

  const room: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "space:castle/hall");
  TestValidator.predicate(
    "the declared room box is not confused with actual assigned content",
    test12ValuesClose(room.bounds, {
      declared: {
        min: { x: -20, y: 0, z: -20 },
        max: { x: 20, y: 10, z: 20 },
      },
      content: {
        min: { x: -14.27, y: 0, z: -1.71 },
        max: { x: 15.65, y: 7.73, z: 12.17 },
      },
      coordinateSpace: "world",
    }),
  );

  const listed: string[] = describeAutoMovieSubjects(artifact).map(
    (
      description: import("@automovie/interface").IAutoMovieSubjectDescription,
    ): string => description.id,
  );
  TestValidator.predicate(
    "enumeration is sorted and keeps on-demand placed parts out of the inventory",
    test12ValuesClose(
      {
        sorted:
          [...listed]
            .sort((left: string, right: string): 0 | 1 | -1 =>
              left < right ? -1 : left > right ? 1 : 0,
            )
            .join("\n") === listed.join("\n"),
        prototypes: listed.filter((id: string): boolean =>
          id.startsWith("prototype:"),
        ).length,
        prototypeParts: listed.filter((id: string): boolean =>
          id.startsWith("prototype-part:"),
        ).length,
        elements: listed.filter((id: string): boolean =>
          id.startsWith("element:"),
        ).length,
        spaces: listed.filter((id: string): boolean => id.startsWith("space:"))
          .length,
        placedParts: listed.filter((id: string): boolean =>
          id.startsWith("element-part:"),
        ).length,
      },
      {
        sorted: true,
        prototypes: 3,
        prototypeParts: 3,
        elements: 3,
        spaces: 1,
        placedParts: 0,
      },
    ),
  );
  TestValidator.predicate(
    "a missing subject fails instead of fabricating a record",
    test12ValuesClose(
      throwsError(
        (): import("@automovie/interface").IAutoMovieSubjectDescription =>
          describeAutoMovieSubject(artifact, "element:castle/missing"),
        "does not exist",
      ),
      true,
    ),
  );
}
