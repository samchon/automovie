import {
  type IAutoMovieAppendServiceNetworkSegments,
  IAutoMovieServicePenetration,
  IAutoMovieServicePort,
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { SERVICE_EPSILON } from "./SERVICE_EPSILON";
import { appendServiceCrossings } from "./appendServiceCrossings";
import { routeDistanceSquared } from "./routeDistanceSquared";

/**
 * Check segment connectivity, admitted routes and cited sleeve fit, collecting
 * used penetration ids without changing diagnostic order.
 */
export function appendServiceNetworkSegments(
  props: IAutoMovieAppendServiceNetworkSegments.IProps,
): Set<string> {
  const {
    network,
    environment,
    systems,
    ports,
    penetrationIds,
    root,
    out,
    positive,
    coincident,
    distance,
  }: typeof props = props;
  const citedPenetrations: Set<string> = new Set<string>();
  network.segments.forEach(
    (segment: IAutoMovieServiceSegment, index: number): void => {
      const path: string = `${root}.segments[${index}]`;
      if (!systems.has(segment.system))
        out.push(
          "type",
          `${path}.system`,
          `service segment system "${segment.system}" does not resolve`,
          segment.system,
        );
      positive(segment.radius, `${path}.radius`, "segment radius", out);
      positive(segment.section, `${path}.section`, "segment section", out);

      const from: IAutoMovieServicePort | undefined = ports.get(segment.from);
      const to: IAutoMovieServicePort | undefined = ports.get(segment.to);
      for (const end of ["from", "to"] as const)
        if (!ports.has(segment[end]))
          out.push(
            "type",
            `${path}.${end}`,
            `service segment ${end} port "${segment[end]}" does not resolve`,
            segment[end],
          );
      if (segment.from === segment.to)
        out.push(
          "type",
          `${path}.to`,
          "a service segment must join two different ports",
          segment.to,
        );
      if (from !== undefined && from.system !== segment.system)
        out.push(
          "type",
          `${path}.from`,
          `a run on system "${segment.system}" cites a from port on system "${from.system}"`,
          segment.from,
        );
      if (to !== undefined && to.system !== segment.system)
        out.push(
          "type",
          `${path}.to`,
          `a run on system "${segment.system}" cites a to port on system "${to.system}"`,
          segment.to,
        );
      if (from !== undefined && from.direction === "in")
        out.push(
          "type",
          `${path}.from`,
          `a run must leave an emitting port, but "${from.id}" faces "in"`,
          from.direction,
        );
      if (to !== undefined && to.direction === "out")
        out.push(
          "type",
          `${path}.to`,
          `a run must arrive at a consuming port, but "${to.id}" faces "out"`,
          to.direction,
        );
      for (const port of [from, to])
        if (
          port !== undefined &&
          port.section !== null &&
          Math.abs(port.section - segment.section) > SERVICE_EPSILON
        )
          out.push(
            "range",
            `${path}.section`,
            `a run must match the ${port.section} square-metre section of port "${port.id}", but was ${segment.section}`,
            segment.section,
            segment.section - port.section,
          );

      if (segment.route.length < 2)
        out.push(
          "range",
          `${path}.route`,
          `a run needs at least 2 route points, but had ${segment.route.length}`,
          segment.route.length,
        );
      for (let at: number = 0; at + 1 < segment.route.length; ++at)
        if (
          distance(segment.route[at]!, segment.route[at + 1]!) <=
          SERVICE_EPSILON
        )
          out.push(
            "range",
            `${path}.route[${at + 1}]`,
            "consecutive route points must be distinct",
            segment.route[at + 1],
          );
      const head: IAutoMovieVector3 = segment.route[0];
      const tail: IAutoMovieVector3 = segment.route[segment.route.length - 1];
      if (from !== undefined && head !== undefined)
        coincident(head, from.position, `${path}.route[0]`, from.id, out);
      if (to !== undefined && tail !== undefined)
        coincident(
          tail,
          to.position,
          `${path}.route[${segment.route.length - 1}]`,
          to.id,
          out,
        );

      const seen: Set<string> = new Set<string>();
      segment.penetrations.forEach((id: string, at: number): void => {
        const sleevePath: string = `${path}.penetrations[${at}]`;
        if (!penetrationIds.has(id)) {
          out.push(
            "type",
            sleevePath,
            `service penetration "${id}" does not resolve`,
            id,
          );
          return;
        }
        if (seen.has(id))
          out.push(
            "type",
            sleevePath,
            `service penetration "${id}" is cited twice by the same run`,
            id,
          );
        seen.add(id);
        citedPenetrations.add(id);
        const sleeve: IAutoMovieServicePenetration = network.penetrations.find(
          (candidate: IAutoMovieServicePenetration): boolean =>
            candidate.id === id,
        )!;
        if (segment.radius > sleeve.radius + SERVICE_EPSILON)
          out.push(
            "range",
            `${path}.radius`,
            `a run of ${segment.radius} m does not pass through the ${sleeve.radius} m sleeve "${id}"`,
            segment.radius,
            segment.radius - sleeve.radius,
          );
        if (segment.route.length >= 2) {
          const reach: number = sleeve.radius + segment.radius;
          if (routeDistanceSquared(segment, sleeve.position) > reach * reach)
            out.push(
              "range",
              sleevePath,
              `service penetration "${id}" does not sit on the run that cites it`,
              sleeve.position,
            );
        }
      });

      appendServiceCrossings(network, environment, segment, path, out);
    },
  );

  return citedPenetrations;
}
