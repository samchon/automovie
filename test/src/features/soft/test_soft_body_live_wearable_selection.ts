import { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { productionSoftBodyUsesMovingBoundary } from "../../../../packages/engine/src/soft/productionSoftBodyUsesMovingBoundary";
import { readProductionLiveWearableSoftBodies } from "../../../../packages/engine/src/soft/readProductionLiveWearableSoftBodies";
import { selectProductionLiveWearableSoftBodies } from "../../../../packages/engine/src/soft/selectProductionLiveWearableSoftBodies";
import { throwsError } from "../internal/predicates";

type Boundary = Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">;

const staticAnchor: IAutoMovieSoftBodyDomain["anchors"][number] = {
  id: "rail",
  particle: 0,
  position: { x: 0, y: 1, z: 0 },
};

const bound: (id: string) => Boundary = (id: string): Boundary => ({
  id,
  anchors: [
    {
      id: "shoulder",
      particle: 0,
      position: null,
      binding: {
        kind: "actor-bone",
        actor: "actor",
        bone: "leftShoulder",
        offset: { x: 0, y: 0, z: 0 },
      },
    },
  ],
  colliders: [],
});

const capsule: (id: string) => Boundary = (id: string): Boundary => ({
  id,
  anchors: [staticAnchor],
  colliders: [
    {
      kind: "body-capsule",
      id: "torso",
      actor: "actor",
      capsule: { from: "hips", to: "head", radius: 0.25 },
    },
  ],
});

const still: (id: string) => Boundary = (id: string): Boundary => ({
  id,
  anchors: [staticAnchor],
  colliders: [],
});

/**
 * Portable selection admission preserves authored live-soft slots without
 * inventing an installed browser or Node-builder solve host.
 *
 * Scenarios:
 *
 * 1. A bound anchor and a body capsule are moving boundaries; a static anchor
 *    with no collider is not.
 * 2. The authored list is returned in its own order, and an empty list is
 *    accepted; a non-array, a non-string, blank, or untrimmed entry, and a
 *    repeated id are refused with their exact messages.
 * 3. A shot receives its selected moving domains with their authored slot and
 *    the production ceiling, skipping a selected id the shot does not carry;
 *    an empty selection over static domains yields nothing.
 * 4. A blank, untrimmed, or repeated domain id, an unselected moving domain,
 *    and a selected static domain are refused.
 * 5. An all-hole list and a trailing hole refuse their missing slot instead
 *    of enlarging the live-subject ceiling with an unselected phantom row.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual list admission, moving-boundary declaration and shot selection outputs catch lost order, ambiguous identities, sparse-slot acceptance and static/live contradictions; no cloth solve or host installation is inferred.
 * @evidence contracts/testing.md#independent-expectations Authored list order gives slots 0 and 2 with ceiling3 when ghost is absent from the shot; every selected slot must contain a trimmed string, so holes must refuse at their own index. Expected messages and ids come from declared admission rules.
 * @evidence contracts/testing.md#distinguishing-cases Bound/capsule/static domains, ordered/empty lists, malformed/duplicate ids, absent shot selections, contradictory live declarations and whole/trailing holes distinguish declaration admission from ordinary selected slots.
 * @evidence contracts/testing.md#execution-ownership The normal runner discovers test_soft_body_live_wearable_selection as a portable CPU unit; authored metadata and actual selector functions own all assertions. Browser adoption, GPU behavior and cross-OS execution remain unproven here.
 */
export function test_soft_body_live_wearable_selection(): void {
  TestValidator.equals(
    "bound anchors and body capsules are moving boundaries",
    [
      bound("cape"),
      capsule("coat"),
      still("flag"),
      {
        ...still("ball"),
        colliders: [
          {
            kind: "sphere" as const,
            id: "ball",
            center: { x: 0, y: 0, z: 0 },
            radius: 0.5,
          },
        ],
      },
    ].map(productionSoftBodyUsesMovingBoundary),
    [true, true, false, false],
  );

  TestValidator.equals(
    "the authored list is read in order and refused when malformed",
    {
      ordered: readProductionLiveWearableSoftBodies(["coat", "cape"]),
      empty: readProductionLiveWearableSoftBodies([]),
      notArray: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies("coat"),
        "simulation.liveWearableSoftBodies must be an array of domain ids.",
      ),
      notString: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies(["coat", 1]),
        "simulation.liveWearableSoftBodies[1] must be a non-blank trimmed string.",
      ),
      blank: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies([" "]),
        "simulation.liveWearableSoftBodies[0] must be a non-blank trimmed string.",
      ),
      untrimmed: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies([" coat"]),
        "simulation.liveWearableSoftBodies[0] must be a non-blank trimmed string.",
      ),
      repeated: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies(["coat", "coat"]),
        'simulation.liveWearableSoftBodies repeats domain id "coat".',
      ),
    },
    {
      ordered: ["coat", "cape"],
      empty: [],
      notArray: true,
      notString: true,
      blank: true,
      untrimmed: true,
      repeated: true,
    },
  );

  const emptySlots: string[] = new Array<string>(2);
  const trailingSlot: string[] = new Array<string>(2);
  trailingSlot[0] = "coat";
  TestValidator.equals(
    "missing list slots cannot become phantom budget entries",
    {
      empty: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies(emptySlots),
        "simulation.liveWearableSoftBodies[0] must be a non-blank trimmed string.",
      ),
      trailing: throwsError(
        (): string[] => readProductionLiveWearableSoftBodies(trailingSlot),
        "simulation.liveWearableSoftBodies[1] must be a non-blank trimmed string.",
      ),
    },
    { empty: true, trailing: true },
  );

  const domains: Boundary[] = [bound("cape"), capsule("coat"), still("flag")];
  TestValidator.equals(
    "a shot receives its selected moving domains with authored slots",
    {
      selected: selectProductionLiveWearableSoftBodies(domains, [
        "coat",
        "ghost",
        "cape",
      ]).map(
        (item: {
          domain: Boundary;
          subjectIndex: number;
          maxSubjects: number;
        }): (string | number)[] => [
          item.domain.id,
          item.subjectIndex,
          item.maxSubjects,
        ],
      ),
      none: selectProductionLiveWearableSoftBodies([still("flag")], []),
    },
    {
      selected: [
        ["coat", 0, 3],
        ["cape", 2, 3],
      ],
      none: [],
    },
  );
  TestValidator.equals(
    "ambiguous domains and live or static contradictions are refused",
    {
      blank: throwsError(
        (): { domain: Boundary; subjectIndex: number; maxSubjects: number }[] =>
          selectProductionLiveWearableSoftBodies([still(" ")], []),
        "Compiled soft-body domain ids must be non-blank, trimmed, and unique.",
      ),
      untrimmed: throwsError(
        (): { domain: Boundary; subjectIndex: number; maxSubjects: number }[] =>
          selectProductionLiveWearableSoftBodies([still("flag ")], []),
        "Compiled soft-body domain ids must be non-blank, trimmed, and unique.",
      ),
      repeated: throwsError(
        (): { domain: Boundary; subjectIndex: number; maxSubjects: number }[] =>
          selectProductionLiveWearableSoftBodies(
            [still("flag"), still("flag")],
            [],
          ),
        "Compiled soft-body domain ids must be non-blank, trimmed, and unique.",
      ),
      unselectedMoving: throwsError(
        (): { domain: Boundary; subjectIndex: number; maxSubjects: number }[] =>
          selectProductionLiveWearableSoftBodies(domains, ["coat"]),
        'Live wearable soft body "cape" declares a moving boundary but simulation.liveWearableSoftBodies does not select it.',
      ),
      selectedStatic: throwsError(
        (): { domain: Boundary; subjectIndex: number; maxSubjects: number }[] =>
          selectProductionLiveWearableSoftBodies(domains, [
            "coat",
            "cape",
            "flag",
          ]),
        'Live wearable soft body "flag" is selected for a live solve but declares no moving boundary.',
      ),
    },
    {
      blank: true,
      untrimmed: true,
      repeated: true,
      unselectedMoving: true,
      selectedStatic: true,
    },
  );
}
