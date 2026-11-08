import assert from "node:assert/strict";
import { invitationDialogueAt } from "../../../src/invitationDialogueAt";

/**
 * Preserve spoken intent, reveal ordering and silent boundaries on the film clock.
 * @evidence contracts/testing.md#observable-behavior Executes the actual cue lookup through every24fps instant and explicit interval boundaries. Distinct encountered cues must equal the nine protected screenplay lines in order. The admission ends before the33.3second inscription reveal; final cup response follows the52.3second receive event. Empty opening/held ending and invalid clocks are checked. This cannot establish actual sprite readability or heard speech.
 * @evidence contracts/testing.md#independent-cases Expected words are literal source dialogue rather than copied output. Source knowledge requires I read it before invitation readability; the source final action holds without extra words. Exact cue start12.6/end14 are independently checked as inclusive/exclusive, and negative, overrun and nonfinite clocks must reject.
 */
export function test_invitation_dialogue():void {
  const words:string[]=[];for(let frame:number=0;frame<1440;frame++){const line:string=invitationDialogueAt(frame/24);if(line&&!words.includes(line))words.push(line);}
  assert.deepEqual(words,["CARINA: Potter.","HARRY: Is this yours?","CARINA: Wrong note. Give it back.","HARRY: Of course.","HARRY: Wait.","HARRY: I read it.","CARINA: Then forget it.","HARRY: Your tea's getting cold.","CARINA: That one's yours."]);
  assert.equal(invitationDialogueAt(12.6),words[0]);assert.equal(invitationDialogueAt(14),"");assert.equal(invitationDialogueAt(32.5),"HARRY: I read it.");assert.equal(invitationDialogueAt(33.3),"");assert.equal(invitationDialogueAt(52.2),"");assert.equal(invitationDialogueAt(52.3),words[8]);
  assert.equal(invitationDialogueAt(0),"");assert.equal(invitationDialogueAt(60),"");for(const value of [-1,60.01,NaN,Infinity])assert.throws(()=>invitationDialogueAt(value));
}
