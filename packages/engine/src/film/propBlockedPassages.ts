import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieConnectorSection,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieConnectorSectionAt } from "../architecture/IAutoMovieConnectorSectionAt";
import { builtConnectorSection } from "../architecture/builtConnectorSection";
import { builtElementRestMatrices } from "../architecture/builtElementRestMatrices";
import { builtPlacedPartBoxes } from "../architecture/builtPlacedPartBoxes";
import { IAutoMoviePassageBlockage } from "./IAutoMoviePassageBlockage";
import { propBoundsOverlap } from "./propBoundsOverlap";
import { unionSubjectBoxes } from "./unionSubjectBoxes";

/**
 * Every opening and connector a world volume intrudes on, openings first, each
 * group in declaration order.
 *
 * An opening is measured through the element that fills it, at its rest pose:
 * the fill's model parts, placed under its rest world matrix, bound the hole. An
 * open cut (`fill: null`), a fill that draws no model or whose model lives
 * outside the record, and a fill whose parent chain is missing or cyclic are
 * reported by neither this query nor the validator, because a passage nothing
 * measures cannot be proven blocked and guessing where the hole is would be
 * worse than saying nothing.
 *
 * A connector is swept from its own route: each segment's box widens by half
 * the usable width horizontally and rises by the clear height, which is the
 * volume a body traversing it needs. A varying section is read at the segment's
 * ends and at every section station inside it, and the segment takes the widest
 * width and tallest clearance among them, so the box stays an outer bound of the
 * tapering corridor. A connector that states no section, or whose route has no
 * length, sweeps nothing: an unstated width is not a width of zero, and
 * `validateBuiltEnvironment` refuses that record on its own path.
 *
 * Intrusion is {@link propBoundsOverlap}, so a volume that only touches a
 * passage does not block it.
 *
 * @param props.environment The building whose passages are checked.
 * @param props.bounds The intruding world volume, in metres.
 * @returns One blockage per intruded passage.
 *
 * @evidence contracts/common.md#principled-implementation Openings are bounded by the union of the fill's exact per-part vertex boxes under its rest world matrix, and each connector segment by the axis-aligned box of the segment widened by its widest stated section, an outer bound of the swept corridor; intrusion is the strict open-interval overlap, so contact never blocks.
 * @evidence contracts/common.md#clear-and-simple-design Element placement is the shared `builtElementRestMatrices`, part measurement `builtPlacedPartBoxes`, and the section rule `builtConnectorSection`, so this query keeps only the passage-specific volumes and the overlap sweep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening, connector or prop is special-cased; every unmeasurable passage is skipped by the same stated rule and left to the validator that owns its refusal.
 * @evidence contracts/common.md#meaningful-documentation States the order of the result, how an opening is measured and at which pose, every skipped case and why, how a connector is swept including varying sections, and the contact rule.
 * @evidence contracts/performance.md#efficient-algorithms Linear in openings times fill vertices plus connector route points times their section stations: element and model lookups go through maps built once, and each element's rest matrix is composed at most once, replacing an element index rebuilt per opening.
 * @evidence contracts/performance.md#reuse-equivalent-work One rest-matrix lookup, one element index and one model index are built per call and shared by every opening, so a fill's ancestors are composed once however many openings they carry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lookups and indexes are dropped on return; the caller owns the returned blockages, at most one per opening and connector.
 */
export const propBlockedPassages = (props: {
  environment: IAutoMovieBuiltEnvironment;
  bounds: IAutoMoviePropBox;
}): IAutoMoviePassageBlockage[] => {
  const environment: IAutoMovieBuiltEnvironment = props.environment;
  const restMatrix: (id: string) => number[] | null =
    builtElementRestMatrices(environment);
  // First declaration wins, as a lookup by `find` would: duplicate ids are a
  // contradiction `validateBuiltEnvironment` refuses, not one to re-decide here.
  const elements: Map<string, IAutoMovieBuiltElement> = new Map();
  for (const element of environment.elements)
    if (!elements.has(element.id)) elements.set(element.id, element);
  const models: Map<string, IAutoMovieModel> = new Map();
  for (const model of environment.models)
    if (!models.has(model.id)) models.set(model.id, model);
  const blocked: IAutoMoviePassageBlockage[] = [];
  for (const opening of environment.openings) {
    if (opening.fill === null) continue;
    const element: IAutoMovieBuiltElement | undefined = elements.get(
      opening.fill,
    );
    const model: IAutoMovieModel | undefined =
      element === undefined || element.model === null
        ? undefined
        : models.get(element.model);
    const matrix: number[] | null = restMatrix(opening.fill);
    if (model === undefined || matrix === null) continue;
    const reveal: IAutoMoviePropBox = unionSubjectBoxes(
      builtPlacedPartBoxes(model, matrix),
    )!;
    if (propBoundsOverlap(props.bounds, reveal))
      blocked.push({ kind: "opening", id: opening.id });
  }
  for (const connector of environment.connectors)
    if (
      connectorCorridors(connector).some((corridor: IAutoMoviePropBox) =>
        propBoundsOverlap(props.bounds, corridor),
      )
    )
      blocked.push({ kind: "connector", id: connector.id });
  return blocked;
};

/** Axis-aligned volumes a connector's route sweeps at its usable size. */
const connectorCorridors = (
  connector: IAutoMovieBuiltConnector,
): IAutoMoviePropBox[] => {
  const route: readonly IAutoMovieVector3[] = connector.route;
  const cumulative: number[] = [0];
  for (let index: number = 0; index + 1 < route.length; ++index) {
    const from: IAutoMovieVector3 = route[index]!;
    const to: IAutoMovieVector3 = route[index + 1]!;
    cumulative.push(
      cumulative[index]! +
        Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z),
    );
  }
  const total: number = cumulative[cumulative.length - 1]!;
  // Whether a section is stated is a property of the record alone, so one probe
  // settles it for every station read below.
  if (total <= 0 || builtConnectorSection(connector, 0) === null) return [];
  const stations: readonly IAutoMovieConnectorSection[] =
    connector.sections ?? [];
  const boxes: IAutoMoviePropBox[] = [];
  for (let index: number = 0; index + 1 < route.length; ++index) {
    const from: IAutoMovieVector3 = route[index]!;
    const to: IAutoMovieVector3 = route[index + 1]!;
    const start: number = cumulative[index]! / total;
    const end: number = cumulative[index + 1]! / total;
    let half: number = -Infinity;
    let clearHeight: number = -Infinity;
    for (const at of [
      start,
      end,
      ...stations
        .filter(
          (station: IAutoMovieConnectorSection): boolean =>
            station.at > start && station.at < end,
        )
        .map((station: IAutoMovieConnectorSection): number => station.at),
    ]) {
      const section: IAutoMovieConnectorSectionAt = builtConnectorSection(
        connector,
        at,
      )!;
      half = Math.max(half, section.width / 2);
      clearHeight = Math.max(clearHeight, section.clearHeight);
    }
    boxes.push({
      min: {
        x: Math.min(from.x, to.x) - half,
        y: Math.min(from.y, to.y),
        z: Math.min(from.z, to.z) - half,
      },
      max: {
        x: Math.max(from.x, to.x) + half,
        y: Math.max(from.y, to.y) + clearHeight,
        z: Math.max(from.z, to.z) + half,
      },
    });
  }
  return boxes;
};
