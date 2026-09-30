import { TestValidator } from "@nestia/e2e";

import { parseViewerRecord } from "../../../scripts/viewer/parseViewerRecord";

/**
 * A corrupt record must never become a process id to kill.
 *
 * Scenarios:
 * 1. A complete record parses to its pid and time.
 * 2. Absent text, malformed JSON, a JSON scalar, null and an array without
 *    the fields all give null.
 * 3. Negative twins that are complete except for one field: a zero pid, a
 *    negative pid, a fractional pid, a string pid, a missing pid, and a
 *    missing or non-text time.
 */
export const test_viewer_record_parse = (): void => {
  TestValidator.equals(
    "complete",
    parseViewerRecord('{"pid":123,"startedAt":"2026-09-30T00:00:00Z"}'),
    { pid: 123, startedAt: "2026-09-30T00:00:00Z" },
  );
  for (const [name, text] of [
    ["absent", null],
    ["malformed", "{not json"],
    ["scalar", "7"],
    ["null", "null"],
    ["array", "[1,2]"],
    ["zero pid", '{"pid":0,"startedAt":"t"}'],
    ["negative pid", '{"pid":-4,"startedAt":"t"}'],
    ["fractional pid", '{"pid":1.5,"startedAt":"t"}'],
    ["string pid", '{"pid":"12","startedAt":"t"}'],
    ["no pid", '{"startedAt":"t"}'],
    ["no time", '{"pid":12}'],
    ["numeric time", '{"pid":12,"startedAt":5}'],
  ] as const)
    TestValidator.equals(name, parseViewerRecord(text), null);
};
