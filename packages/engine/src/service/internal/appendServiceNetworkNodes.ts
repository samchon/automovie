import {
  type IAutoMovieAppendServiceNetworkNodes,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
} from "@automovie/interface";

import { appendServiceInsideSpace } from "./appendServiceInsideSpace";

/**
 * Check node placement and ports while retaining first declaration paths for
 * later connectivity diagnostics.
 */
export function appendServiceNetworkNodes(
  props: IAutoMovieAppendServiceNetworkNodes.IProps,
): void {
  const {
    network,
    environment,
    spaceIds,
    elementIds,
    systems,
    portPaths,
    seenPorts,
    root,
    out,
    positive,
    nonNegative,
  }: typeof props = props;
  network.nodes.forEach((node: IAutoMovieServiceNode, index: number): void => {
    const path: string = `${root}.nodes[${index}]`;
    if (!NODE_KINDS.includes(node.kind))
      out.push(
        "type",
        `${path}.kind`,
        `unknown service node kind "${String(node.kind)}"`,
        node.kind,
      );
    if (!spaceIds.has(node.space))
      out.push(
        "type",
        `${path}.space`,
        `service node space "${node.space}" does not resolve in built environment "${environment.id}"`,
        node.space,
      );
    appendServiceInsideSpace({
      environment,
      spaceIds,
      space: node.space,
      point: node.position,
      path: `${path}.position`,
      subject: `service node "${node.id}"`,
      out,
    });
    if (node.element !== null && !elementIds.has(node.element))
      out.push(
        "type",
        `${path}.element`,
        `service node element "${node.element}" does not resolve in built environment "${environment.id}"`,
        node.element,
      );
    if (node.state !== null) {
      out.nonEmpty(`${path}.state.name`, node.state.name, "service state name");
      out.range(
        `${path}.state.opening`,
        node.state.opening,
        0,
        1,
        "service state opening",
      );
    }
    if (node.maintenance !== null)
      for (const axis of ["x", "y", "z"] as const)
        if (!(node.maintenance.max[axis] > node.maintenance.min[axis]))
          out.push(
            "range",
            `${path}.maintenance.max.${axis}`,
            `maintenance envelope must be positive on ${axis}, but spanned [${node.maintenance.min[axis]}, ${node.maintenance.max[axis]}]`,
            node.maintenance.max[axis],
          );

    node.ports.forEach((port: IAutoMovieServicePort, at: number): void => {
      const portPath: string = `${path}.ports[${at}]`;
      if (seenPorts.has(port.id))
        out.push(
          "type",
          `${portPath}.id`,
          `service port id "${port.id}" must be unique across the network`,
          port.id,
        );
      seenPorts.add(port.id);
      // First declaration wins, exactly as `portRecords` resolves it, so a
      // stub is reported at the port a run would actually have joined rather
      // than at whichever copy of a duplicated id came last.
      if (!portPaths.has(port.id)) portPaths.set(port.id, portPath);
      const system: IAutoMovieServiceSystem | undefined = systems.get(
        port.system,
      );
      if (system === undefined)
        out.push(
          "type",
          `${portPath}.system`,
          `service port system "${port.system}" does not resolve`,
          port.system,
        );
      else {
        if (port.medium !== system.medium)
          out.push(
            "type",
            `${portPath}.medium`,
            `a port on system "${system.id}" must carry "${system.medium}", but declared "${String(port.medium)}"`,
            port.medium,
          );
        if (port.unit !== system.unit)
          out.push(
            "type",
            `${portPath}.unit`,
            `a port on system "${system.id}" must be measured in "${system.unit}", but declared "${String(port.unit)}"`,
            port.unit,
          );
      }
      if (!DIRECTIONS.includes(port.direction))
        out.push(
          "type",
          `${portPath}.direction`,
          `unknown service port direction "${String(port.direction)}"`,
          port.direction,
        );
      nonNegative(port.demand, `${portPath}.demand`, "port demand", out);
      if (port.section !== null)
        positive(port.section, `${portPath}.section`, "port section", out);
      appendServiceInsideSpace({
        environment,
        spaceIds,
        space: node.space,
        point: port.position,
        path: `${portPath}.position`,
        subject: `service port "${port.id}" of node "${node.id}"`,
        out,
      });
    });
  });
}
const DIRECTIONS: readonly ["in", "out", "bidirectional"] = [
  "in",
  "out",
  "bidirectional",
] as const;

const NODE_KINDS: readonly [
  "source",
  "fixture",
  "equipment",
  "terminal",
  "junction",
  "valve",
] = [
  "source",
  "fixture",
  "equipment",
  "terminal",
  "junction",
  "valve",
] as const;
