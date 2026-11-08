/**
 * Resolve unchanged screenplay words on the silent reference's absolute clock.
 * @evidence contracts/common.md#implementation-and-ownership Nine nonoverlapping authored intervals preserve source utterance order. The admission precedes the33.3second first inscription reveal; the cup invitation precedes pickup and the possessive answer follows weight transfer. These are visual timing annotations rather than accepted measured speech. No retained playback state or external media enters this lookup.
 * @evidence contracts/common.md#authoring-interface Supply finite0–60seconds. Returns the exact speaker-labelled English cue or an empty string outside spoken intervals. End boundaries are exclusive, including the silent held ending; invalid time throws.
 */
export function invitationDialogueAt(time:number):string {
  if(!Number.isFinite(time)||time<0||time>60)throw new Error("Dialogue cue time is outside0–60seconds");
  const cues:readonly[number,number,string][]=[[12.6,14,"CARINA: Potter."],[14.5,16.2,"HARRY: Is this yours?"],[16.5,18.9,"CARINA: Wrong note. Give it back."],[19.1,20.5,"HARRY: Of course."],[21.2,22,"HARRY: Wait."],[32.2,33.2,"HARRY: I read it."],[41.1,42.8,"CARINA: Then forget it."],[46.5,48.3,"HARRY: Your tea's getting cold."],[52.3,53.8,"CARINA: That one's yours."]];
  return cues.find(([begin,end]):boolean=>time>=begin&&time<end)?.[2]??"";
}
