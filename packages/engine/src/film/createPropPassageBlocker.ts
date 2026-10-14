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
 * Prepare world passage bounds once and return a read-only intrusion query.
 *
 * Openings use the fill model's rest-pose part boxes; absent models or unresolved placement chains are omitted. A held model without vertices inherits builtPlacedPartBoxes' zero-size fallback at the staged fill element's world origin. Connector route segments widen to their greatest section width and clearance height at endpoints and internal section stations, giving an outer axis-aligned corridor bound. Strict interior overlap preserves touching as nonblocking. Results list openings then connectors in declaration order.
 *
 * The environment must remain unchanged while the query is retained. The prop registry validator creates one query per environment only for its current synchronous call; a one-off caller uses propBlockedPassages instead.
 *
 * @evidence contracts/common.md#principled-implementation Measures rest-pose opening fill vertices through shared world matrices and bounds each connector segment by its maximal piecewise-linear section dimensions; endpoint and interior station extrema give an outer bound, while propBoundsOverlap uses strict interiors so contact alone never blocks. Missing or cyclic fill placement and unspecified connector sections remain unmeasurable rather than guessed.
 * @evidence contracts/common.md#clear-and-simple-design Separates invariant environment measurement from prop-dependent overlap because validatePropPlacementGeometry checks many props against one environment; propBlockedPassages delegates the same preparation for a single query, preserving one measurement owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every measurable passage uses the same bounds and overlap law; no prop or fixture changes geometry, and declaration order and first-match element/model lookup semantics remain explicit when malformed duplicate ids reach this query.
 * @evidence contracts/common.md#meaningful-documentation States opening and connector measurement, conservative corridor bounds, strict-contact behavior, result order, omitted unmeasurable cases and the unchanged-environment lifetime premise of the retained query.
 * @evidence contracts/performance.md#efficient-algorithms Preparation indexes elements/models and delegates rest-matrix composition and opening-vertex measurement. Each connector segment filters section stations; each endpoint/station section lookup scans the section table. Each prop query scans all prepared opening/segment boxes plus its output, avoiding repeated preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure shares prepared bounds across queries over the exact same immutable-for-the-call environment; the validator keys queries by environment object identity and drops its map after validation. Changes require new preparation; there is no global cache or identity-only invalidation assumption.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation's element/model/rest indexes are released before returning; the query retains one bound per measurable opening and connector route segment until its caller drops the closure. Blockage arrays are fresh caller-owned results; no handles or tasks are acquired.
 */
export function createPropPassageBlocker(environment: IAutoMovieBuiltEnvironment): (bounds: IAutoMoviePropBox) => IAutoMoviePassageBlockage[] {
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
  const passages: { kind: "opening" | "connector"; id: string; bounds: readonly IAutoMoviePropBox[] }[] = [];
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
    passages.push({ kind: "opening", id: opening.id, bounds: [reveal] });
  }
  for (const connector of environment.connectors)
    passages.push({ kind: "connector", id: connector.id, bounds: connectorCorridors(connector) });
  return (bounds: IAutoMoviePropBox): IAutoMoviePassageBlockage[] => {
    const blocked: IAutoMoviePassageBlockage[] = [];
    for (const passage of passages)
      if (passage.bounds.some((corridor: IAutoMoviePropBox): boolean => propBoundsOverlap(bounds, corridor)))
        blocked.push({ kind: passage.kind, id: passage.id });
    return blocked;
  };
}

/** Axis-aligned volumes a connector's route sweeps at its usable size. */
function connectorCorridors (
  connector: IAutoMovieBuiltConnector,
): IAutoMoviePropBox[] {
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
}
