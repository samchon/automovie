import {
  AutoMovieServiceDiscipline,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieServiceNetwork,
  IAutoMovieServicePenetration,
} from "@automovie/interface";

import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { IAutoMovieServiceCheckReport } from "./IAutoMovieServiceCheckReport";

/**
 * State plainly which analyses this network and this building can answer.
 *
 * A record existing is not an analysis, and the honest way to say so is to say
 * so. The structural rules below are the ones the engine really performs; the
 * per-discipline entries are the quantitative questions nothing here solves,
 * listed once for each discipline the network actually declares so a report
 * names the missing solver rather than implying a pass.
 *
 * The building is required rather than optional because two of these answers
 * depend on it. A crossing is read off logical space volumes, so a building
 * whose partitions are names with no cells cannot be asked where a run left a
 * room; a sleeve is placed on its boundary's own face, so a boundary written
 * before faces existed cannot be asked where its holes are. Saying `supported`
 * in either case would be the dressing-up this report exists to prevent.
 * This is capability metadata, not a record that validation ran. No current
 * production report consumes these rows; topology tests exercise their wording.
 *
 * @evidence contracts/common.md#principled-implementation Located space volumes and declared sleeve faces decide whether spatial checks have geometry to inspect; each declared discipline gets an explicit unsupported numerical-performance row instead of a structural pass masquerading as capacity modeling.
 * @evidence contracts/common.md#clear-and-simple-design Capability description is separated from validator execution, and currently has no product reporting consumer despite sharing the service contract's rule identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported names mean capability rather than executed success; missing geometry and absent discipline solvers remain explicit instead of being filled with estimates.
 * @evidence contracts/common.md#meaningful-documentation Explains structural versus numerical scope, geometry-dependent support, metadata rather than execution semantics and the missing production consumer.
 * @evidence contracts/performance.md#efficient-algorithms Discipline deduplication is bounded by the closed discipline count; checking located spaces and sleeve faces scans spaces plus worst-case penetration-times-boundary lookup work, with a bounded rule population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The report describes the supplied network and building now; no capability cache assumes those mutable geometry declarations stay equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh string/status rows transfer to the caller, retaining neither network nor building objects and acquiring no solver task.
 */
export const serviceAnalysisSupport: (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
}) => IAutoMovieServiceCheckReport[] = (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieServiceCheckReport[] => {
  const disciplines: AutoMovieServiceDiscipline[] = [];
  for (const system of props.network.systems)
    if (!disciplines.includes(system.discipline))
      disciplines.push(system.discipline);
  const located: boolean = props.environment.spaces.some(
    builtSpaceStatesVolume,
  );
  // A boundary that does not resolve is faceless too, and naming the boundary
  // the sleeve claimed is more use than naming nothing; the validator reports
  // the dangling reference itself, on its own path.
  const faceless: string | undefined = props.network.penetrations.find(
    (sleeve: IAutoMovieServicePenetration): boolean =>
      props.environment.boundaries.find(
        (boundary: IAutoMovieBuiltBoundary): boolean =>
          boundary.id === sleeve.boundary,
      )?.face === undefined,
  )?.boundary;
  return [
    {
      check: "port-connectivity",
      status: "supported",
      reason:
        "every port is required to carry a run and every node to be reached from its system root",
    },
    {
      check: "medium-direction-unit",
      status: "supported",
      reason:
        "a port must repeat its system's medium and unit, and a run must leave an out port and enter an in port",
    },
    {
      check: "segment-clash",
      status: "supported",
      reason:
        "runs are compared as axis-aligned swept volumes, exempt only where they meet at a shared node",
    },
    {
      check: "maintenance-envelope",
      status: "supported",
      reason:
        "a node's access volume is checked against every run that does not terminate on it",
    },
    located
      ? {
          check: "node-placement",
          status: "supported",
          reason:
            "every node whose logical space declares a volume, and every port that node offers a run, is held inside it",
        }
      : {
          check: "node-placement",
          status: "unsupported",
          reason:
            "no logical space of this building declares a volume, so nothing can be shown to stand inside or outside one",
        },
    located
      ? {
          check: "boundary-penetration",
          status: "supported",
          reason:
            "a run leaving the logical space it was in must cite a sleeve on a boundary of one of those spaces",
        }
      : {
          check: "boundary-penetration",
          status: "unsupported",
          reason:
            "no logical space of this building declares a volume, so there is nothing a run can be seen to leave",
        },
    faceless === undefined
      ? {
          check: "penetration-on-boundary-face",
          status: "supported",
          reason:
            "every boundary a sleeve pierces carries a face, so each sleeve is held inside that face's outline and thickness",
        }
      : {
          check: "penetration-on-boundary-face",
          status: "unsupported",
          reason: `boundary "${faceless}" declares no face, so the sleeves through it can only be placed on the runs that cite them`,
        },
    {
      check: "waterproof-coverage",
      status: "supported",
      reason:
        "a wet zone must cover every boundary of its space and declare every handover to a drier one",
    },
    ...disciplines.map(
      (
        discipline: string,
      ): { check: string; status: "unsupported"; reason: string } => ({
        check: `${discipline}-performance`,
        status: "unsupported" as const,
        reason: `no ${discipline} solver runs here; capacity is compared against declared demand only, and pressure, head, voltage drop and throw are not computed`,
      }),
    ),
  ];
};
