import {
  AutoMovieHumanChainTopology,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type { IAutoMovieHumanSegmentJoint } from "@automovie/interface";

/**
 * A topology-bound handoff accepts changed offsets/rotations but refuses a
 * different logical graph before an assembly can use stored course owners.
 *
 * Scenarios:
 * 1. A made three-joint graph retains its candidate by identity after offsets change.
 * 2. Missing, additional, duplicate and reparented joints are refused against that same made graph.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual boundary owner and observes returned identity and refusals for every malformed graph, without building a person.
 * @evidence contracts/development/testing.md#independent-expectations Three literal name/parent pairs define the graph; changing membership or one parent is a graph mismatch by definition.
 * @evidence contracts/development/common.md#meaningful-documentation Changing offsets retains the supplied topology object. Missing, extra, duplicate and reparented joints fail against the same three-joint reference graph.
 */
export function test_human_chain_topology(): void {
  const reference: IAutoMovieHumanSegmentJoint[] = [
    { name: "root", parent: null, offset: [0, 0, 0], rotation: F.IDENTITY },
    { name: "parent", parent: "root", offset: [1, 0, 0], rotation: F.IDENTITY },
    {
      name: "child",
      parent: "parent",
      offset: [1, 0, 0],
      rotation: F.IDENTITY,
    },
  ];
  const candidate: IAutoMovieHumanSegmentJoint[] = reference.map(
    (joint: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => ({ ...joint, offset: [2, 3, 4] }),
  );
  const failures: string[] = [];
  if (AutoMovieHumanChainTopology.admit(reference, candidate) !== candidate)
    failures.push("valid graph did not retain its candidate");
  const cases: { name: string; chain: IAutoMovieHumanSegmentJoint[]; message: string }[] = [
    { name: "missing", chain: candidate.slice(0, 2), message: "missing child" },
    {
      name: "additional",
      chain: [...candidate, { ...candidate[2]!, name: "extra" }],
      message: "unexpected extra",
    },
    {
      name: "duplicate",
      chain: [...candidate, candidate[2]!],
      message: "duplicate child",
    },
    {
      name: "reparent",
      chain: [
        candidate[0]!,
        candidate[1]!,
        { ...candidate[2]!, parent: "root" },
      ],
      message: "parent child: expected parent, received root",
    },
  ];
  for (const input of cases) {
    let message: string | undefined;
    try {
      AutoMovieHumanChainTopology.admit(reference, input.chain);
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    if (message?.includes(input.message) !== true)
      failures.push(
        input.name +
          ": expected " +
          input.message +
          ", received " +
          (message ?? "accepted"),
      );
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
