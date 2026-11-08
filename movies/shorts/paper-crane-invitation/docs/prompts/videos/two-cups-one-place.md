# Two cups and one place beside him

## Request and status {#request}

Planned English semantic motion-reference request for BytePlus ModelArk Seedance 2.5. Not submitted; no job, billed generation, generated take or account activation is claimed. The exact text lives in the text field of the payload below. The URL is an unresolved upload field, not a local path masquerading as a public URL.

## Source decisions {#sources}

[Current construction screenplay](../../body/screenplay/give-it-back-potter.md#invitation), raw SHA256 `b27e003a009bfd64ab791b8a166896df69e2c21558b7a805a8009fb7a8a239c7`, timed spans 00:43–01:00 — A place beside him. Literal source: “He lifts his empty right hand under its body and takes its weight. Only then does she let go.” The quoted support-before-release owns the cup handoff. The complete final timed unit owns note-before-cups, supported left shift, open place, arrested hands, two upright carries, the two English lines, supported voluntary sit and reciprocal raise. Earlier identity/location/cup settings remain continuous. The independently unapproved expression working edition is not this request’s source.

[Carina](../../body/settings/carina-malfoy.md#identity), raw SHA256 `c924c9b8183382ebb2993806283cc5d075098ff7e8a57d0594a841f5ccf3f538`, says “fifteen-year-old Hogwarts student”; [Harry](../../body/settings/harry-potter.md#identity), raw SHA256 `e1b3f5ceb6da4c96b5dbfcfa95e34e508ef2cc91b60584e525e85c650658bf63`, supplies the corresponding Gryffindor identity. [Space](../../body/settings/corridor.md#space), raw SHA256 `3184a41ccba54a37a9b22e36f97238fb39969cab7d8e778aae0a465a20350237`, owns the finite bay, fixed bench and route. [Paper](../../body/settings/paper-crane.md#paper), raw SHA256 `a788e1ddcb6e9ee6162f907850827f8bb56558425b66ad7cc08725aee7ce19a0`, says “approximately 16 centimetres across when open” and “Contact ends the charm”. These own the one paper, its scale, fixed inscription and single-use flight. [Cups](../../body/settings/tea-cups.md#cups), raw SHA256 `aceedf8d5e1e0a51c39e108731261484f11da546bf6f195148745fd18967bacf`, says “about nine centimetres tall and eight centimetres across” and “Both cups remain upright and supported on the window sill until their intended pickup”. These own the handled open forms, starting support and upright carrying. Cinematic surface refinement and silent delivery are delegated production choices; they change no canonical action or fact.

## Reference roles and clip binding {#inputs}

Planned whole-hint range [43, 60) seconds, global frames 1032–1439 inclusive at 24 fps. Local frames 0–407. This is a planned causal boundary, not an existing encoded segment. Actual clip locator, SHA256, byte size, decoded profile and camera execution are pending the complete motion implementation and encode; no current failed 0–9-second candidate is supplied as this clip.

Reference video 1 will carry the actual actor/object motion, contact, camera and temporal progression. Carina is the pale-haired green/silver-uniform figure; Harry the dark-haired red/gold-uniform figure with round glasses. [Shared portraits](../images/shared-character-references.md) remain optional identity/costume aids and are not included in this default payload: service acceptance of those external generated human-face images is unverified. Historical adult-designed WAVs are not supplied; words, acting and teenage timbre are not accepted merely by ASR or measurement.

## Planned payload {#payload}

```json
{
  "model": "dreamina-seedance-2-5-260628",
  "content": [
    {
      "type": "video_url",
      "video_url": {
        "url": "{{SOURCE_CLIP_PUBLIC_URL}}"
      },
      "role": "reference_video"
    },
    {
      "type": "text",
      "text": "Use reference video 1 as the motion, hand support, camera and timing guide for this seventeen-second ending. Continue the same pale-blond fifteen-year-old Slytherin girl Carina and dark-haired fifteen-year-old Gryffindor boy Harry with round glasses. Their white collars, house-striped ties, charcoal knits, open black school robes and black school shoes remain consistent; Carina has a charcoal knee-length pleated skirt and black tights, Harry charcoal trousers. Keep the same late-afternoon stone window bay, fixed four-legged backless wooden bench, one folded cream invitation and two small handled cups of warm amber tea.\n\nCarina turns away and follows the clear route around the bench's right end to the sill. She puts the once-folded note flat on the free patch to the cups' right before using either hand for cups. Harry plants his feet, lifts just enough to shift left on the fixed seat and settles, leaving the right half open. He says 'Your tea's getting cold.' Her hands stop by the cups; she turns her head toward the place beside him. Give that pause room. She hooks a finger through each handle and carries both cups upright, one per hand, back around the same end along the clear front floor.\n\nShe offers the left-hand cup to Harry. His empty right hand supports the actual cup body and takes its weight before her hand releases. She says 'That one's yours.' Keep this a chosen response to his invitation. He brings his cup near his chest. She keeps her own cup upright in her right hand while turning and backing to the open right seat, meeting the edge with her calves and lowering through bent knees over planted feet. Only once seated does her free left hand join her cup. End with both figures, one cup each, her feet drawn beside his, his cup raise answered by hers, and the folded note still on the ledge behind. Preserve the exact ownership and support through the final frame. The two English lines are silent performance cues in this audio-disabled planned request. No extra subtitle, declaration, kiss, crowd or new prop. Cinematic surface/light refinement must preserve the quiet voluntary acceptance carried by the movement."
    }
  ],
  "omni_reference_task_type": "reference",
  "ratio": "9:16",
  "duration": 17,
  "resolution": "720p",
  "generate_audio": false,
  "watermark": false
}
```

## Compatibility and retention {#handoff}

The planned semantic-reference mode requests performance, composition and timing resemblance; it guarantees no frame-identical pose, camera or identity. Do not combine this template with forced first/last frames. Under the [official Seedance 2.5 prompt guide](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5-prompt-guide), [model page](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5) and [generation tutorial](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/video-generation-tutorial), the planned 17-second single video uses one of at most ten reference videos and remains below the 30-second aggregate input allowance. No overlap or second continuity clip is included. Any additional video consumes that same allowance. The final input must independently meet the documented file/raster/codec/rate limits; the intended 720×1280, 24fps H264 MP4 is not yet a measured segment. Seedance 2.0’s 15-second aggregate does not admit this same request unchanged.

Whole and segment bytes will be locally retained in the project’s ignored output store, with tracked small receipts/digests and no claimed verified external archive. Regeneration is not restoration. This planned template is retained in Git; a future actual submitted attempt must preserve its exact nonsecret resolved payload separately.
