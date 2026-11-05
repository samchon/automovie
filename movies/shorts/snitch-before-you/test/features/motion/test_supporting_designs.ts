import assert from "node:assert/strict";
import { supportingPlayerDesign } from "../../../src/supportingPlayerDesign";

/**
 * Test the recognition distinctions that the old role-index selector erased.
 *
 * @evidence contracts/testing.md#observable-behavior Resolves the real scene design function and checks independent hair colour/style, relative body silhouettes, equivalent-family cache inputs and owned returned data. Tests malformed/unlisted IDs including an inherited Object property. Actual generated shapes and contacts are separately inspected through the frozen Viewer.
 * @evidence contracts/testing.md#independent-cases Settings require green receiver short pale versus red receiver dark tied, green western Beater short pale versus red western Beater cropped dark, dark/brown tied return players and a brown stocky Keeper. Tall/compact/broad distinctions supply inequality oracles rather than copied implementation dimensions. Repeated calls must not inherit mutation from another role.
 */
export function test_supporting_designs(): void {
  const green = supportingPlayerDesign("G-C2");
  const red = supportingPlayerDesign("R-C2");
  assert.notEqual(green.hairColour, red.hairColour);
  assert.equal(green.hairTied, false); assert.equal(red.hairTied, true);
  assert.equal(supportingPlayerDesign("G-B2").hairTied, false);
  assert.notEqual(supportingPlayerDesign("G-B2").hairColour, supportingPlayerDesign("R-B2").hairColour);
  assert.equal(supportingPlayerDesign("R-B2").hairTied, false);
  assert.equal(supportingPlayerDesign("G-C3").hairTied, true);
  assert.equal(supportingPlayerDesign("R-B1").hairTied, true);
  assert.equal(supportingPlayerDesign("R-C3").hairColour, green.hairColour);
  assert.equal(supportingPlayerDesign("G-K").hairColour, supportingPlayerDesign("R-C1").hairColour);
  const tall = supportingPlayerDesign("G-C1").parameters.body.anatomy;
  const broad = supportingPlayerDesign("G-C3").parameters.body.anatomy;
  const stocky = supportingPlayerDesign("G-K").parameters.body.anatomy;
  assert.ok(tall.stature! > green.parameters.body.anatomy.stature!);
  assert.ok(broad.chestBreadth! > tall.chestBreadth!);
  assert.ok(stocky.stature! < broad.stature! && stocky.waistCircumference! > broad.waistCircumference!);
  assert.deepEqual(green.parameters, red.parameters, "Equivalent family cannot safely share a prepared evaluator");
  green.parameters.body.anatomy.stature = 999;
  assert.notEqual(supportingPlayerDesign("G-C2").parameters.body.anatomy.stature, 999);
  assert.throws((): void => { supportingPlayerDesign("G-C4"); });
  assert.throws((): void => { supportingPlayerDesign("constructor"); });
}
