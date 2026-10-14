import {
  buildingFromQuery,
  readTourData,
  viewLabel,
} from "@automovie/website/tour-data";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { tourData } from "../internal/websiteTourFixture";

/**
 * A tour address preserves its requested building and rejects missing identity.
 * Scenarios:
 * 1. Three valid names survive parsing with unrelated parameters.
 * 2. Missing and unknown names refuse navigation; malformed transports refuse loading.
 * 3. Labels change presentation while the original source id remains available.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls route selection, transport admission and label projection, observing exact supported building identity, unchanged admitted object identity and explicit refusal of invalid destinations/envelopes; silently opening another building or synthesizing missing views fails.
 * @evidence contracts/testing.md#independent-expectations The public three-building vocabulary and authored transport with a known initial id define valid inputs, while null/primitive/mismatched/empty transports supply independent negative cases; the readable label follows separator replacement and ASCII word capitalization.
 * @evidence contracts/testing.md#distinguishing-cases Covers all supported routes with unrelated parameters, absent/empty/unknown/case-mismatched routes, malformed view inventories and a missing initial id; deep lens/native payload admission and duplicate query parameters are not exercised here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_addresses entry owns direct URLSearchParams, record admission and string projection calls with resident data, without a browser, fetch, source parser or renderer.
 */
export function test_website_tour_addresses(): void {
  for (const building of ["ancient", "modern", "future"] as const)
    TestValidator.equals(
      "requested building",
      buildingFromQuery(`?view=room&building=${building}`),
      building,
    );
  for (const query of [
    "",
    "?building=medieval",
    "?building=",
    "?building=MODERN",
  ])
    TestValidator.predicate(
      "invalid destination",
      throwsError((): ReturnType<typeof buildingFromQuery> => buildingFromQuery(query), "Choose a building from the collection"),
    );
  const data: ReturnType<typeof tourData> = tourData();
  TestValidator.predicate(
    "transport preserves native source",
    readTourData(data, "ancient") === data,
  );
  for (const value of [
    null,
    5,
    { ...data, building: "future" },
    { ...data, views: null },
    { ...data, views: [] },
    { ...data, initial: "missing" },
  ])
    TestValidator.predicate(
      "incomplete transport",
      throwsError((): ReturnType<typeof readTourData> => readTourData(value, "ancient"), "The building's 3D data is incomplete"),
    );
  TestValidator.equals(
    "readable label",
    viewLabel("main-room.center_x-minus"),
    "Main Room Center X Minus",
  );
}
