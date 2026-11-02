import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Geometry diagnostics retain all independent cases after an unexpected error.
 *
 * Scenarios:
 * 1. A finite correct measurement completes without a diagnostic failure.
 * 2. A real parser exception in the first case cannot suppress two defective
 *    coordinates in a later case or a final successful case.
 * 3. The final failure retains source addresses, error category/reason/stack,
 *    expected coordinates, units and explicit nonfinite values.
 * 4. Infinite, NaN and negative allowances cannot turn equality or a made
 *    defect into a successful observation.
 * 5. Strict and inclusive bounds retain their numeric error and physical unit,
 *    including equality boundaries and a nonfinite observation or limit.
 * 6. A structured native exception retains its actual endpoint cause,
 *    including coordinates, stage, range and an explicit nonfinite value.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual collector through run, vector and finish. Observes its public thrown diagnostic and completed callback count rather than private state. An unexpected first-case error and two later numeric failures must coexist; a structured native error must retain its full measurement cause.
 * @evidence contracts/testing.md#independent-expectations Synchronous callbacks after a caught error must execute in order, and supplied arrays differ by NaN and three millimetres. Malformed JSON independently supplies a SyntaxError. Allowances must be finite and nonnegative; strict inequalities exclude equality while inclusive ones admit it. Supplied source context and native cause fields, including endpoint stage, extremal range, coordinates and units, must survive the public failure. The parser's platform-dependent message text is not fixed.
 * @evidence contracts/testing.md#distinguishing-cases Covers a wholly correct collector, an unexpected production-like exception, a later vector with multiple distinct defects including a nonfinite value, successful work after both failures, invalid allowances in both comparison directions, and all four strict/inclusive bounds with finite and nonfinite boundaries. Exact callback counts and diagnostic categories use zero tolerance; geometry samplers and anatomical verdicts remain owned by their component tests.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU entry test_human_fixture_audit creates only local collectors and invokes resident JSON parsing. It starts no process, generator, renderer or native artifact and collects all of its own findings before one finish.
 */
export function test_human_fixture_audit(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("diagnostic-collection", "HumanFixtureAudit");
  audit.run({ scenario: "normal observation" }, (): void => {
    const normal: HumanFixtureAudit = new HumanFixtureAudit("normal", "fixture");
    normal.run({ chain: "diagnostic.normal", coordinates: [1, 2, 3] }, (): void => {
      normal.vector("coordinates", [1, 2, 3], [1, 2, 3], 0, "mm");
    });
    normal.finish();
  });
  audit.run({ scenario: "unexpected error followed by all observations" }, (): void => {
    const nested: HumanFixtureAudit = new HumanFixtureAudit("made-defects", "fixture");
    let attempts: number = 0;
    nested.run({ chain: "diagnostic.parser", interval: [0, 1], station: 0.25, coordinates: [1, 2, 3] }, (): void => {
      attempts++;
      JSON.parse("{");
    });
    nested.run({ chain: "diagnostic.coordinates", interval: [0, 1], station: 0.75, coordinates: [NaN, 5] }, (): void => {
      attempts++;
      nested.vector("actual coordinates", [NaN, 5], [1, 2], 0, "mm");
    });
    nested.run({ chain: "diagnostic.after" }, (): void => {
      attempts++;
      nested.measure("valid final result", 4, 4, 0, "mm");
    });
    let diagnostic: string | undefined;
    try { nested.finish(); }
    catch (error) { diagnostic = error instanceof Error ? error.message : String(error); }
    audit.scope({ scenario: "unexpected error followed by all observations", attempts, diagnostic });
    audit.measure("all callbacks executed", attempts, 3, 0, "count");
    audit.check("one final failure exists", diagnostic !== undefined);
    for (const fragment of ["diagnostic.parser", "SyntaxError", '"reason":', '"stack":', "diagnostic.coordinates", "actual coordinates.coordinate[0]", "actual coordinates.coordinate[1]", '"observed":"NaN"', '"expected":2', '"deviation":3', '"units":"mm"'])
      audit.check("retained diagnostic " + fragment, diagnostic?.includes(fragment) === true);
  });
  for (const tolerance of [Infinity, NaN, -Number.EPSILON])
    audit.run({ scenario: "invalid allowance", tolerance }, (): void => {
      const nested: HumanFixtureAudit = new HumanFixtureAudit("invalid-allowance", "fixture");
      nested.measure("equality", 1, 1, tolerance, "mm");
      nested.reject("separation", 1, 0, tolerance, "mm");
      let diagnostic: string | undefined;
      try { nested.finish(); }
      catch (error) { diagnostic = error instanceof Error ? error.message : String(error); }
      audit.scope({ scenario: "invalid allowance", tolerance, diagnostic });
      audit.check("equality did not accept invalid allowance", diagnostic?.includes('"observation":"equality"') === true);
      audit.check("separation did not accept invalid allowance", diagnostic?.includes('"observation":"separation"') === true);
      audit.check("allowance refusal explains its cause", diagnostic?.includes("Tolerance must be finite and nonnegative.") === true);
    });
  audit.run({ scenario: "physical bounds" }, (): void => {
    const normal: HumanFixtureAudit = new HumanFixtureAudit("normal-bounds", "fixture");
    normal.bound("strict lower", 2, 1, ">", "mm");
    normal.bound("strict upper", 1, 2, "<", "mm");
    normal.bound("inclusive lower", 1, 1, ">=", "mm");
    normal.bound("inclusive upper", 1, 1, "<=", "mm");
    normal.finish();
    const defective: HumanFixtureAudit = new HumanFixtureAudit("defective-bounds", "fixture");
    defective.bound("strict lower equality", 1, 1, ">", "mm");
    defective.bound("strict upper equality", 1, 1, "<", "mm");
    defective.bound("inclusive lower defect", 0, 1, ">=", "mm");
    defective.bound("inclusive upper defect", 2, 1, "<=", "mm");
    defective.bound("nonfinite observed bound", NaN, 1, "<=", "mm");
    defective.bound("nonfinite expected bound", 1, Infinity, "<=", "mm");
    let diagnostic: string | undefined;
    try { defective.finish(); }
    catch (error) { diagnostic = error instanceof Error ? error.message : String(error); }
    audit.scope({ scenario: "physical bounds", diagnostic });
    for (const fragment of ["strict lower equality", "strict upper equality", "inclusive lower defect", "inclusive upper defect", "nonfinite observed bound", "nonfinite expected bound", '"deviation":1', '"units":"mm"', '"observed":"NaN"', '"expected":"Infinity"'])
      audit.check("retained physical bound " + fragment, diagnostic?.includes(fragment) === true);
  });
  audit.run({ scenario: "structured native measurement cause" }, (): void => {
    /** This tests diagnostic transport, not a substituted geometry verdict. */
    const nested: HumanFixtureAudit = new HumanFixtureAudit("cause-transport", "fixture");
    nested.run({ person: "fixture", part: "diagnostic.endpoint" }, (): void => {
      throw new Error("Endpoint unavailable", { cause: { stage: "start", chain: "diagnostic.endpoint", station: 10, phase: 0.4, coordinates: [1, NaN, 3], targetCoordinate: 8, admissibleRange: [-7, 7], units: "mm" } });
    });
    /** The public failure must retain the original structured native witness. */
    let diagnostic: string | undefined;
    try { nested.finish(); } catch (error) { diagnostic = error instanceof Error ? error.message : String(error); }
    audit.scope({ scenario: "structured native measurement cause", diagnostic });
    for (const fragment of ['"cause":{', '"stage":"start"', '"chain":"diagnostic.endpoint"', '"station":10', '"phase":0.4', '"coordinates":[1,"NaN",3]', '"targetCoordinate":8', '"admissibleRange":[-7,7]', '"units":"mm"']) audit.check("retained native cause " + fragment, diagnostic?.includes(fragment) === true);
  });
  audit.finish();
}
