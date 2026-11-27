import {
  chiSau
} from "../../../../../packages/motions/src/sport/internal/chiSau";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `chiSau` law's timetable (`chiSau.timetable`): four 1.2 s cycles by
 * default, or the duration given, joined and parted over 0.5 s or a quarter of
 * the whole, whichever is shorter.
 *
 * Scenarios:
 *
 * 1. By default 4.8 s, joined at 0.5 s and parted at 4.3 s.
 * 2. Two cycles are 2.4 s.
 * 3. One second blends over a quarter: joined at 0.25 s, parted at 0.75 s.
 */
export function test_motions_sport_chi_sau(): void {
  TestValidator.predicate(
    "the rolls",
    nclose(chiSau.timetable({}).duration, 4.8, 1e-12) &&
      nclose(chiSau.timetable({}).at("joined"), 0.5, 1e-12) &&
      nclose(chiSau.timetable({}).at("parted"), 4.3, 1e-12) &&
      nclose(chiSau.timetable({ count: 2 }).duration, 2.4, 1e-12) &&
      nclose(chiSau.timetable({ duration: 1 }).at("joined"), 0.25, 1e-12) &&
      nclose(chiSau.timetable({ duration: 1 }).at("parted"), 0.75, 1e-12),
  );
}
