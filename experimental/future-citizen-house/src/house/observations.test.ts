/** Reference interiors use a real room arrival, with no second coordinate map.
 * The old max-bounds camera is a negative witness inside the closed Murphy
 * cabinet. Missing rooms and unplaceable thresholds must stay unavailable. */
import assert from "node:assert/strict";
import { builtEnvironmentPlacementBounds, builtSpaceContainsPoint } from "@automovie/engine";
import { buildHouse } from "./build";
import { observations } from "./observations";

export function verifyReferenceArrivals(): void {
  const environment = buildHouse();
  const stations = observations(environment);
  const references = stations.filter((station) => station.role === "reference" && station.cameraSpace);
  assert.equal(references.length, 3);
  for (const station of references) {
    const room = environment.spaces.find((space) => space.id === station.cameraSpace)!;
    assert.ok(station.pose);
    assert.ok(builtSpaceContainsPoint(room, station.pose.position));
    assert.equal(station.section, undefined);
    const connector = environment.connectors.find((candidate) => candidate.to === room.id)!;
    assert.ok(connector);
    const endpoint = connector.route.at(-1)!;
    // The room arrival is within 0.50m horizontally of its built connector end.
    // The rejected cabinet camera is several metres from this arrival.
    assert.ok(Math.hypot(station.pose.position.x - endpoint.x, station.pose.position.z - endpoint.z) < 0.5);
  }
  // A model-less assembly root has no placement bound; measure its real leaves.
  const parts = environment.elements.filter((element) => element.parent === "flex-murphy-frame")
    .map((element) => builtEnvironmentPlacementBounds({ environment, target: { kind: "element", id: element.id } })!);
  assert.ok(parts.length > 0);
  const cabinet = {
    min: { x: Math.min(...parts.map((part) => part.min.x)), y: Math.min(...parts.map((part) => part.min.y)), z: Math.min(...parts.map((part) => part.min.z)) },
    max: { x: Math.max(...parts.map((part) => part.max.x)), y: Math.max(...parts.map((part) => part.max.y)), z: Math.max(...parts.map((part) => part.max.z)) },
  };
  const withinCabinet = (p: { x: number; y: number; z: number }) =>
    p.x >= cabinet.min.x && p.x <= cabinet.max.x &&
    p.y >= cabinet.min.y && p.y <= cabinet.max.y &&
    p.z >= cabinet.min.z && p.z <= cabinet.max.z;
  assert.ok(withinCabinet({ x: 4.86, y: 1.6, z: -0.72 }));
  assert.equal(withinCabinet(references.find((station) => station.cameraSpace === "flex-workroom")!.pose!.position), false);

  const unavailable = structuredClone(environment);
  unavailable.spaces = unavailable.spaces.filter((space) => space.id !== "common-room");
  unavailable.spaces.find((space) => space.id === "flex-workroom")!.cells = [];
  const failed = observations(unavailable);
  for (const id of ["03-common-room", "04-flex-room"])
    assert.equal(failed.find((station) => station.space === "references" && station.id === id)!.pose, null);
  assert.ok(failed.find((station) => station.id === "05-upper-private-floor")!.pose);
}
