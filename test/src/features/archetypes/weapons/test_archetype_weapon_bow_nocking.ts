import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  createBow,
  createProjectile,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** Easton's starting nocking point for a recurve shot with the fingers, "about 1/2" (1.3 cm) above square" to the rest, metres. */
const NOCK_HEIGHT: number = 0.5 * 0.0254;

/** The hand-drawn bows, each nocked on its string. */
const BOWS: readonly ("longbow" | "recurve" | "horseBow")[] = [
  "longbow",
  "recurve",
  "horseBow",
];

/**
 * A hand-drawn bow is nocked where a tuned bow nocks it, and an arrow's nock seats on that point, so taking an arrow, nocking it and drawing it compose.
 *
 * Scenarios:
 * 1. For each hand-drawn bow at three seeds, its `nock` is a socket on the string's nocking point, riding the `string` slider, its `+Y` along `+Z` toward the archer.
 * 2. The `rest` lies Easton's half inch below the nocking point, square to the string: the nock stands `NOCK_HEIGHT` above the rest and the rest lies in the stave's plane at the grip. The recurve's nocking height is Easton's own and not provisional; the longbow's and the horse bow's are borrowed from it and marked provisional.
 * 3. Drawn to the string's full travel, the nock goes back with the string by that travel along `+Z`, at the same height.
 * 4. For three seeds, an arrow's `nock` is a socket at its shaft's rear end, its `+Y` back along the shaft away from the `tip`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each bow and the arrow, reads the nock, rest and tip frames and the shaft's collider, and draws the string; a nock off the string, not riding it, facing away from the archer, a rest off the tuned height, a nock left behind by the draw, or an arrow's nock off its rear is caught.
 * @evidence contracts/development/testing.md#independent-expectations The nocking height is Easton's Arrow Tuning and Maintenance Guide's half inch above square, restated here; the arrow's rear is measured on its own collider.
 * @evidence contracts/development/testing.md#distinguishing-cases Three bows at three seeds each, a braced and a drawn string, and the arrow.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_weapon_bow_nocking(): void {
  const findings: string[] = [];
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  for (const kind of BOWS)
    for (const seed of [0, 1, 2]) {
      const bow: AutoMovieArchetype<createBow.Affordance, createBow.Dimension> =
        createBow({ kind }, seed);
      const label: string = `${kind}@${seed}`;
      const nock: ReturnType<typeof bow.affordance> = bow.affordance("nock");
      const string: ReturnType<typeof bow.affordance> =
        bow.affordance("string");
      const at: IAutoMovieVector3 = nock.frame.translation;
      const out: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        nock.frame,
        "y",
      );
      if (
        nock.kind !== "socket" ||
        nock.rides !== "string" ||
        !close(out.z, 1) ||
        !close(at.y, string.frame.translation.y) ||
        !close(at.z, string.frame.translation.z)
      )
        findings.push(
          `${label}: the nock at ${JSON.stringify(at)} is not a socket riding the string toward the archer`,
        );
      const rest: IAutoMovieVector3 = bow.affordance("rest").frame.translation;
      if (!close(at.y - rest.y, NOCK_HEIGHT) || !close(rest.z, 0))
        findings.push(
          `${label}: the nock stands ${at.y - rest.y} m above the rest, not Easton's ${NOCK_HEIGHT} m`,
        );
      // Easton's figure is a recurve's; a longbow and a horse bow borrow it, so theirs is provisional.
      const marked: boolean =
        bow.provenance.bands.nockHeight?.provisional === true;
      if (marked !== (kind !== "recurve"))
        findings.push(
          `${label}: its nocking height is ${marked ? "" : "not "}marked provisional`,
        );
      const travel: number = string.travel!;
      const drawn: IAutoMovieVector3 = bow
        .articulate({ string: travel })
        .affordance("nock").frame.translation;
      if (!close(drawn.z - at.z, travel) || !close(drawn.y, at.y))
        findings.push(
          `${label}: drawn by ${travel} m the nock moves to ${JSON.stringify(drawn)}`,
        );
    }
  for (const seed of [0, 1, 2]) {
    const arrow: AutoMovieArchetype<
      createProjectile.Affordance,
      createProjectile.Dimension
    > = createProjectile({ kind: "arrow" }, seed);
    const nock: ReturnType<typeof arrow.affordance> = arrow.affordance("nock");
    const tip: IAutoMovieVector3 = arrow.affordance("tip").frame.translation;
    const rear: number = archetypeExtent(arrow, "y", ["shaft"]).low;
    const back: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      nock.frame,
      "y",
    );
    if (
      nock.kind !== "socket" ||
      !close(nock.frame.translation.y, rear) ||
      !(tip.y > nock.frame.translation.y) ||
      !close(back.y, -1)
    )
      findings.push(
        `arrow@${seed}: its nock at ${JSON.stringify(nock.frame.translation)} is not the shaft's rear facing back along it`,
      );
  }
  TestValidator.equals("a bow and an arrow nock together", findings, []);
}
