import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieOpeningSweep } from "./IAutoMovieOpeningSweep";

/**
 * The world volume each panel of an opening sweeps across its whole travel.
 *
 * The envelope is solved rather than sampled. Every corner of a turning leaf
 * traces `A + B cos(t) + D sin(t)` under the panel's own placement, and an
 * affine world matrix keeps that form, so each axis is a single cosine whose
 * extremes are its endpoints and the critical angles the travel actually
 * crosses. A sliding leaf is linear and reaches its extremes at its limits.
 * Nothing here judges whether a person can pass the leaf: this is the volume a
 * later clearance or collision analysis reads, not its verdict.
 *
 * The answer is **per panel, and only that panel's own travel**. Ancestors
 * stand where the environment's current state puts them, so an inner folding
 * leaf is measured against the outer leaf as it currently stands. That is the
 * volume this leaf sweeps from where the design has it, not the union over
 * every configuration a chain of leaves could reach between its named states. A
 * caller wanting that union asks for each state in turn and takes the hull
 * itself; inventing it here would quietly report a chain's envelope under one
 * panel's name.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtOpeningSweepEnvelope` produces the world volume each panel of an opening sweeps across its whole travel. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtOpeningSweepEnvelope` derives the world-space volume swept by each panel across the opening's full travel.
 * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-operable-state `builtOpeningSweepEnvelope` evaluates every declared panel across the opening's named travel states and returns its complete world-space sweep volume.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation `builtOpeningSweepEnvelope` turns the host opening's declared panel operation into a measurable travel envelope.
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state `builtOpeningSweepEnvelope` computes each exterior opening panel's named-state travel as a world-space sweep rather than treating operability as metadata.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant `builtOpeningSweepEnvelope` measures the validated panel travel and sweep invariant for an operable facade opening.
 * @evidence requirements/interior/clearance-anthropometrics-and-accessibility.md#interior-static-dynamic-clearance `builtOpeningSweepEnvelope` returns the world-space volume occupied across each panel's declared travel for downstream dynamic-clearance checks.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-anthropometric-accessibility-clearance The sweep implements the moving-opening envelope subset without claiming route, reach, jurisdiction, or accessibility compliance.
 */
export const builtOpeningSweepEnvelope = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieOpeningSweep[] => {
  const opening = requireOpening(environment, openingId);
  const operation = opening.operation;
  if (operation === undefined) return [];
  const staged = operationDeltas(environment);
  return operation.panels.map((panel) => {
    requireEnumerableTravel(environment, panel);
    // The panel's own travel is what is being measured, so it is the one joint
    // left at rest; every other joint, its ancestors included, stands where the
    // environment's current state puts it.
    const held = new Map(staged);
    held.delete(panel.element);
    const base = requireTravellerMatrix(
      environment,
      worldMatricesOf(environment, held),
      panel,
      "panel",
    );
    const corners: IAutoMovieVector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: panel.width, y: 0, z: 0 },
      { x: panel.width, y: panel.height, z: 0 },
      { x: 0, y: panel.height, z: 0 },
    ];
    const swept = corners.map((corner) =>
      sweptCornerBounds(base, panel.motion, corner),
    );
    return {
      panel: panel.id,
      element: panel.element,
      min: {
        x: Math.min(...swept.map((bound) => bound.min.x)),
        y: Math.min(...swept.map((bound) => bound.min.y)),
        z: Math.min(...swept.map((bound) => bound.min.z)),
      },
      max: {
        x: Math.max(...swept.map((bound) => bound.max.x)),
        y: Math.max(...swept.map((bound) => bound.max.y)),
        z: Math.max(...swept.map((bound) => bound.max.z)),
      },
    };
  });
};
