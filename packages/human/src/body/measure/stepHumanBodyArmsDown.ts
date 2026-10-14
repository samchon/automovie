import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMesh,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { createHumanBodySegmenter } from "./createHumanBodySegmenter";

const SIDES: readonly ["left", "right"] = ["left", "right"];

/**
 * Search lateral-plane arms-down goals with zero axial rotation and lower-arm flexion, leaving lower-arm abduction/twist unspecified. The reference build uses each shoulder's neutral elevation under those same preset conventions; it need not equal the complete native neutral orientation. Each whole-degree candidate from zero toward those elevations is built and measured rather than assuming a monotone contact response.
 *
 * One build reads both arms, deferring cross-arm pairs while independently choosing the first candidate whose per-part-pair crossing counts do not exceed reference counts. A chosen arm holds its candidate while the other continues. The combined result restores cross-arm checks and refuses increased counts. Equal counts do not prove unchanged crossing witnesses or absence of newly relocated intersections; this is a sampled geometric preset, without continuous-path, force, balance or clinical-contact certification. Builder range/admission failures propagate unchanged.
 *
 * The worker supplies its immutable-basis skin segmenter and yields its thread between generator steps so superseded requests can stop iteration. This generator itself schedules no task or timer. A standalone caller compiles one partition for the solve. Existing lower-arm rows are replaced with flexion-zero/null-axis rows and both TT goals are replaced; other document fields remain in the trial build.
 *
 * @evidence contracts/common.md#principled-implementation Parent-chain skin segments and actual engine crossing counts define a lateral-preset reference, then ascending whole-degree shared builds select nonincreasing per-pair counts and a final combined check restores cross-arm pairs.
 * @evidence contracts/common.md#clear-and-simple-design Goal construction, paired crossing readings and reference comparison remain local to one stepped search, reusing the caller's compiled partition and authoritative builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No monotone bisection skips contact islands or clamps builder failures; count equality cannot certify witness identity, a clear continuous path or physiological contact validity.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies preset/reference conventions, replaced lower-arm rows, sampled count criterion, generator suspension and host-owned cancellation.
 * @evidence contracts/performance.md#efficient-algorithms Each sampled elevation pays one body build and skin partition plus relevant self/outside part crossing queries; mesh-pair bounds reject disjoint pairs, while worst-case crossing work retains the engine's triangle-pair costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Parent/chain maps, source partition, reference counts and an arm's first selected elevation are reused across the search rather than rebuilding topology or rereading its reference at every degree.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The suspended generator retains document/basis/build/partition and scalar/count search state until exhausted or released; trial geometry expires after each reading and no timer, external handle or persistent cache is acquired.
 */
export function* stepHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
  segment: ReturnType<
    typeof createHumanBodySegmenter
  > = createHumanBodySegmenter(basis),
): Generator<
  undefined,
  Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">,
  undefined
> {
  const parent: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map(
      basis.joints.map(
        (
          joint: (typeof basis.joints)[number],
        ): [AutoMovieHumanoidBone, AutoMovieHumanoidBone | null] => [
          joint.bone,
          joint.parent,
        ],
      ),
    );
  const chainOf: (side: (typeof SIDES)[number]) => Set<string> = (
    side: (typeof SIDES)[number],
  ): Set<string> => {
    const root: AutoMovieHumanoidBone = `${side}UpperArm`;
    return new Set(
      basis.joints
        .map(
          (joint: (typeof basis.joints)[number]): AutoMovieHumanoidBone =>
            joint.bone,
        )
        .filter((bone: AutoMovieHumanoidBone): boolean => {
          let at: AutoMovieHumanoidBone | null | undefined = bone;
          while (at !== null && at !== undefined && at !== root)
            at = parent.get(at);
          return at === root;
        }),
    );
  };
  const chains: Set<string>[] = SIDES.map(chainOf);
  const rest: number[] = SIDES.map((side: (typeof SIDES)[number]): number => {
    const shoulder: (typeof basis.joints)[number]["shoulder"] =
      basis.joints.find(
        (joint: (typeof basis.joints)[number]): boolean =>
          joint.bone === `${side}UpperArm`,
      )?.shoulder;
    if (shoulder === undefined)
      throw new Error("Arms down needs thorax-tt shoulder coordinates.");
    return shoulder.neutral.elevation;
  });
  const pose: IAutoMovieJointPose[] = [
    ...(document.pose ?? []).filter(
      (joint: IAutoMovieJointPose): boolean =>
        joint.bone !== "leftLowerArm" && joint.bone !== "rightLowerArm",
    ),
    ...SIDES.map(
      (side: (typeof SIDES)[number]): IAutoMovieJointPose => ({
        bone: `${side}LowerArm`,
        flexion: 0,
        abduction: null,
        twist: null,
      }),
    ),
  ];
  const goals: (elevations: number[]) => IAutoMovieHumanBodyShoulderPose[] = (
    elevations: number[],
  ): IAutoMovieHumanBodyShoulderPose[] =>
    SIDES.map(
      (
        side: (typeof SIDES)[number],
        k: number,
      ): IAutoMovieHumanBodyShoulderPose => ({
        bone: `${side}UpperArm` as const,
        plane: 0,
        elevation: elevations[k],
        axialRotation: 0,
      }),
    );
  /** Each chain's self and outside crossings, optionally deferring cross-arm pairs. */
  const contacts: (
    elevations: number[],
    omitOppositeArm?: boolean,
  ) => Map<string, number>[] = (
    elevations: number[],
    omitOppositeArm: boolean = false,
  ): Map<string, number>[] => {
    const parts: { bone: string; id: string; mesh: IAutoMovieMesh }[] = segment(
      build({ ...document, pose, shoulders: goals(elevations) }),
    ).model.parts.map(
      (
        part: ReturnType<typeof segment>["model"]["parts"][number],
      ): (typeof parts)[number] => {
        if (part.geometry.type !== "mesh")
          throw new Error(
            "Arms-down contact requires the segmenter's resident skin meshes.",
          );
        return {
          bone: part.id.split("/")[0],
          id: part.id,
          mesh: part.geometry.mesh,
        };
      },
    );
    return chains.map((chain: Set<string>, k: number): Map<string, number> => {
      const found: Map<string, number> = new Map<string, number>();
      for (const own of parts.filter((part: (typeof parts)[number]): boolean =>
        chain.has(part.bone),
      )) {
        // the chain's own segment folding through itself (the armpit skin
        // the upper arm carries) is contact too
        const folded: number = measureAutoMovieMeshCrossings(
          own.mesh,
          own.mesh,
        ).length;
        if (folded > 0) found.set(`${own.id}|${own.id}`, folded);
        for (const other of parts.filter(
          (part: (typeof parts)[number]): boolean =>
            !chain.has(part.bone) &&
            (!omitOppositeArm || !chains[1 - k].has(part.bone)),
        )) {
          const crossed: number = crossings(own.mesh, other.mesh);
          if (crossed > 0) found.set(`${own.id}|${other.id}`, crossed);
        }
      }
      return found;
    });
  };
  const baseline: Map<string, number>[] = contacts(rest);
  yield;
  const clean: (reading: Map<string, number>, k: number) => boolean = (
    reading: Map<string, number>,
    k: number,
  ): boolean =>
    [...reading].every(
      ([pair, count]: [string, number]): boolean =>
        count <= (baseline[k].get(pair) ?? 0),
    );
  const solved: (number | null)[] = [null, null];
  for (let elevation: number = 0; elevation < Math.max(...rest); elevation++) {
    const trial: number[] = SIDES.map(
      (_: (typeof SIDES)[number], k: number): number =>
        solved[k] ?? Math.min(elevation, rest[k]),
    );
    const reading: Map<string, number>[] = contacts(trial, true);
    yield;
    for (const k of [0, 1])
      if (solved[k] === null && clean(reading[k], k)) solved[k] = trial[k];
    if (solved.every((value: number | null): boolean => value !== null)) break;
  }
  const goalsAt: number[] = SIDES.map(
    (_: (typeof SIDES)[number], k: number): number => solved[k] ?? rest[k],
  );
  const combined: Map<string, number>[] = contacts(goalsAt);
  yield;
  if (
    SIDES.some(
      (_: (typeof SIDES)[number], k: number): boolean => !clean(combined[k], k),
    )
  )
    throw new Error(
      "Arms down cannot combine both selected goals without increasing sampled per-pair skin crossing counts.",
    );
  return { pose, shoulders: goals(goalsAt) };
}

/** Triangles of either mesh the other crosses, after a bounds rejection. */
function crossings(a: IAutoMovieMesh, b: IAutoMovieMesh): number {
  const bounds: (mesh: IAutoMovieMesh) => { low: number[]; high: number[] } = (
    mesh: IAutoMovieMesh,
  ): { low: number[]; high: number[] } => {
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (let at: number = 0; at < mesh.positions.length; at += 3)
      for (let axis: number = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], mesh.positions[at + axis]);
        high[axis] = Math.max(high[axis], mesh.positions[at + axis]);
      }
    return { low, high };
  };
  const p: ReturnType<typeof bounds> = bounds(a);
  const q: ReturnType<typeof bounds> = bounds(b);
  if (
    [0, 1, 2].some(
      (axis: number): boolean =>
        p.high[axis] < q.low[axis] || p.low[axis] > q.high[axis],
    )
  )
    return 0;
  return (
    measureAutoMovieMeshCrossings(a, b).length +
    measureAutoMovieMeshCrossings(b, a).length
  );
}
