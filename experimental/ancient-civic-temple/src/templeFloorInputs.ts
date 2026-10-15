import { templeAdministrationFloor } from "./spaces/rooms/templeAdministrationFloor";
import { templeColonnadeFloor } from "./spaces/rooms/templeColonnadeFloor";
import { templeCourtyardFloor } from "./spaces/rooms/templeCourtyardFloor";
import { templeEntranceFloor } from "./spaces/rooms/templeEntranceFloor";
import { templeOfferingFloor } from "./spaces/rooms/templeOfferingFloor";
import { templeRecordsFloor } from "./spaces/rooms/templeRecordsFloor";
import { templeSanctuaryFloor } from "./spaces/rooms/templeSanctuaryFloor";
import { templeServiceYardFloor } from "./spaces/rooms/templeServiceYardFloor";
import { templeStorageFloor } from "./spaces/rooms/templeStorageFloor";

/**
 * Per-room floor ownership input. exteriorBottom is the common bottom;
 * the structure in front of the entrance steps that meets the site ground goes down to that height.
 * Null uses the ordinary thickness only (a read-only finished face used to derive the common bottom).
 */

export const templeFloorInputs = (exteriorBottom: number | null) => [
  templeEntranceFloor(exteriorBottom), templeCourtyardFloor(), templeColonnadeFloor(),
  templeSanctuaryFloor(), templeOfferingFloor(), templeAdministrationFloor(),
  templeRecordsFloor(), templeStorageFloor(), templeServiceYardFloor(),
];
