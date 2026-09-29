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
 */
export const test_website_tour_addresses = (): void => {
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
      throwsError(() => buildingFromQuery(query)),
    );
  const data = tourData();
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
      throwsError(() => readTourData(value, "ancient")),
    );
  TestValidator.equals(
    "readable label",
    viewLabel("main-room.center_x-minus"),
    "Main Room Center X Minus",
  );
};
