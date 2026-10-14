import { IAutoMovieServiceNetwork, IAutoMovieServiceSystem, IAutoMovieServiceNode, IAutoMovieServicePort, AutoMovieServiceDiscipline, AutoMovieServiceMedium, AutoMovieServiceUnit } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
const DISCIPLINES: readonly AutoMovieServiceDiscipline[] = [
  "plumbing",
  "drainage",
  "electrical",
  "data",
  "hvac",
  "fire",
  "control",
];
const FLOWS: readonly ["from-root", "to-root", "undirected"] = ["from-root", "to-root", "undirected"] as const;
/**
 * Which media each discipline is allowed to carry.
 *
 * `other` sits in every row on purpose: it is the escape a production carrying
 * medical gas, vacuum or compressed air takes, and it opts out of the unit
 * check with it rather than forcing this table to grow before the production
 * can be authored at all.
 */
const DISCIPLINE_MEDIA: Record<
  AutoMovieServiceDiscipline,
  readonly AutoMovieServiceMedium[]
> = {
  plumbing: ["cold-water", "hot-water", "other"],
  drainage: ["waste-water", "vent-air", "other"],
  electrical: ["electric-power", "other"],
  data: ["data-signal", "other"],
  hvac: ["supply-air", "return-air", "exhaust-air", "other"],
  fire: ["fire-water", "control-signal", "other"],
  control: ["control-signal", "other"],
};

/** Which units each medium may be measured in; `other` accepts any of them. */
const MEDIUM_UNITS: Record<
  AutoMovieServiceMedium,
  readonly AutoMovieServiceUnit[]
> = {
  "cold-water": ["cubic-meter-per-second"],
  "hot-water": ["cubic-meter-per-second"],
  "waste-water": ["cubic-meter-per-second"],
  "fire-water": ["cubic-meter-per-second"],
  "vent-air": ["cubic-meter-per-second"],
  "supply-air": ["cubic-meter-per-second"],
  "return-air": ["cubic-meter-per-second"],
  "exhaust-air": ["cubic-meter-per-second"],
  "electric-power": ["watt", "ampere"],
  "data-signal": ["bit-per-second"],
  "control-signal": ["dimensionless"],
  other: [
    "cubic-meter-per-second",
    "watt",
    "ampere",
    "bit-per-second",
    "dimensionless",
  ],
};


/** Check system vocabulary, declared units and root port direction in source order.
 *
 * @evidence contracts/common.md#principled-implementation Closed discipline/media/unit tables and root-port directions enforce the service vocabulary before later graph reach checks; other medium retains the declared open-unit exception.
 * @evidence contracts/common.md#clear-and-simple-design The main service gate invokes this phase in original system order; its positive-number callback preserves the gate's existing capacity message owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown vocabulary reports authored values rather than coercing them, and a missing root prevents additional root-port accusations at that unresolved address.
 * @evidence contracts/common.md#meaningful-documentation States vocabulary, units and root direction obligations, with source-ordered findings appended to the caller's collector.
 * @evidence contracts/performance.md#efficient-algorithms Each system scans nodes for its root and that root's ports, so worst-case work is systems times nodes plus selected ports, with fixed vocabulary tables.
 * @evidence contracts/performance.md#reuse-equivalent-work Module vocabulary arrays are shared constants while each validation supplies its current graph; no root result is retained across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only findings transfer into the caller-owned collector; tables hold primitive schema policy and this phase retains no current network reference.
 */
export function appendServiceNetworkSystems(network: IAutoMovieServiceNetwork, root: string, out: ViolationCollector, positive: (value: number, path: string, label: string, out: ViolationCollector) => void): void {
  network.systems.forEach((system: IAutoMovieServiceSystem, index: number): void => {
    const path: string = `${root}.systems[${index}]`;
    if (!DISCIPLINES.includes(system.discipline))
      out.push(
        "type",
        `${path}.discipline`,
        `unknown service discipline "${String(system.discipline)}"`,
        system.discipline,
      );
    else if (!DISCIPLINE_MEDIA[system.discipline].includes(system.medium))
      out.push(
        "type",
        `${path}.medium`,
        `discipline "${system.discipline}" carries one of ${DISCIPLINE_MEDIA[
          system.discipline
        ].join(", ")}, but the system declared "${String(system.medium)}"`,
        system.medium,
      );
    const units: readonly AutoMovieServiceUnit[] = MEDIUM_UNITS[system.medium];
    if (units === undefined)
      out.push(
        "type",
        `${path}.medium`,
        `unknown service medium "${String(system.medium)}"`,
        system.medium,
      );
    else if (!units.includes(system.unit))
      out.push(
        "type",
        `${path}.unit`,
        `medium "${system.medium}" is measured in ${units.join(
          " or ",
        )}, but the system declared "${String(system.unit)}"`,
        system.unit,
      );
    if (!FLOWS.includes(system.flow))
      out.push(
        "type",
        `${path}.flow`,
        `unknown service flow "${String(system.flow)}"`,
        system.flow,
      );
    positive(system.capacity, `${path}.capacity`, "system capacity", out);

    const rootNode: IAutoMovieServiceNode | undefined = network.nodes.find((node: IAutoMovieServiceNode): boolean => node.id === system.root);
    if (rootNode === undefined) {
      out.push(
        "type",
        `${path}.root`,
        `system root node "${system.root}" does not resolve`,
        system.root,
      );
      return;
    }
    const rootPorts: IAutoMovieServicePort[] = rootNode.ports.filter(
      (port: IAutoMovieServicePort): boolean => port.system === system.id,
    );
    if (rootPorts.length === 0)
      out.push(
        "type",
        `${path}.root`,
        `system root node "${system.root}" carries no port on system "${system.id}"`,
        system.root,
      );
    else if (
      system.flow === "from-root" &&
      !rootPorts.some((port: IAutoMovieServicePort): boolean => port.direction !== "in")
    )
      out.push(
        "type",
        `${path}.root`,
        `a "from-root" system must be rooted where the medium leaves, but "${system.root}" only receives on this system`,
        system.root,
      );
    else if (
      system.flow === "to-root" &&
      !rootPorts.some((port: IAutoMovieServicePort): boolean => port.direction !== "out")
    )
      out.push(
        "type",
        `${path}.root`,
        `a "to-root" system must be rooted where the medium arrives, but "${system.root}" only emits on this system`,
        system.root,
      );
  });


}
