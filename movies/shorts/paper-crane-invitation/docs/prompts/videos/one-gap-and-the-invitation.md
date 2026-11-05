# One gap and the invitation

## Request and status {#request}

Planned English semantic motion-reference request for BytePlus ModelArk Seedance 2.5. Not submitted; no job, billed generation, generated take or account activation is claimed. The exact text lives in the text field of the payload below. The URL is an unresolved upload field, not a local path masquerading as a public URL.

## Source decisions {#sources}

[Current construction screenplay](../../body/screenplay/give-it-back-potter.md#invitation), raw SHA256 `b27e003a009bfd64ab791b8a166896df69e2c21558b7a805a8009fb7a8a239c7`, timed spans 00:19–00:32 — Both this way; 00:32–00:43 — Already read. Literal source: “Carina takes the base in her right hand. Harry releases the sheet.” The quoted two-sentence transfer owns receiver-before-release and right-hand custody. The same timed unit owns buckle/Wait/shared-gap/yield/supported sit. The next timed unit owns I read it, first readable inscription, one fold, cup observation and Then forget it. Physical timing comes from the eventual actual reference clip, not a claim that these planned ranges were encoded. The independently unapproved expression working edition is not this request’s source.

[Carina](../../body/settings/carina-malfoy.md#identity), raw SHA256 `c924c9b8183382ebb2993806283cc5d075098ff7e8a57d0594a841f5ccf3f538`, says “fifteen-year-old Hogwarts student”; [Harry](../../body/settings/harry-potter.md#identity), raw SHA256 `e1b3f5ceb6da4c96b5dbfcfa95e34e508ef2cc91b60584e525e85c650658bf63`, supplies the corresponding Gryffindor identity. [Space](../../body/settings/corridor.md#space), raw SHA256 `3184a41ccba54a37a9b22e36f97238fb39969cab7d8e778aae0a465a20350237`, owns the finite bay, fixed bench and route. [Paper](../../body/settings/paper-crane.md#paper), raw SHA256 `a788e1ddcb6e9ee6162f907850827f8bb56558425b66ad7cc08725aee7ce19a0`, says “approximately 16 centimetres across when open” and “Contact ends the charm”. These own the one paper, its scale, fixed inscription and single-use flight. [Cups](../../body/settings/tea-cups.md#cups), raw SHA256 `aceedf8d5e1e0a51c39e108731261484f11da546bf6f195148745fd18967bacf`, says “about nine centimetres tall and eight centimetres across” and “Both cups remain upright and supported on the window sill until their intended pickup”. These own the handled open forms, starting support and upright carrying. Cinematic surface refinement and silent delivery are delegated production choices; they change no canonical action or fact.

## Reference roles and clip binding {#inputs}

Planned whole-hint range [19, 43) seconds, global frames 456–1031 inclusive at 24 fps. Local frames 0–575. This is a planned causal boundary, not an existing encoded segment. Actual clip locator, SHA256, byte size, decoded profile and camera execution are pending the complete motion implementation and encode; no current failed 0–9-second candidate is supplied as this clip.

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
      "text": "Use reference video 1 as the motion, contact, camera and timing guide for this twenty-four-second continuation. Retain the same fifteen-year-old pale-blond Slytherin girl Carina and dark-haired, round-glasses Gryffindor boy Harry, the same layered Hogwarts school uniforms and the same quiet late-afternoon window bay. Preserve the fixed four-legged backless bench, the clear front floor/right-end route, two waiting cups and the one cream paper sheet. Transform polygon surfaces and simple stone lighting into a coherent cinematic magical-school appearance without changing the observed exchange.\n\nHarry answers 'Of course.' and starts lowering the open sheet to Carina's offered hand. Her reaching fingers brush its loose upper flap and it buckles. Harry says 'Wait.' to protect it. Her hand stops; he turns the sheet inward across his chest with the folded base toward her and steps toward the right end to give her room. She follows the paper into the same gap. Their shoulders stop short; this is brief mutual awkwardness, not taunting or prolonged keepaway. They glance down. His free right palm offers the front floor, she yields half a step, and he turns and backs onto the right half of the bench with supported knees and feet. Preserve the actual seat contact. He offers the base at his waist. Carina receives it in her right hand before he releases; her left steadies its open edge and his empty hands settle on his knees.\n\nAfter ownership returns, Harry looks up and says 'I read it.' Only now give the audience its first readable view of the sheet: exactly 'Would you have tea with me?' Hold the writing long enough to read. Carina folds it shut once. Harry turns at the waist to notice the two existing cups behind her, then returns his attention to her note. Carina says 'Then forget it.' Keep the glances, withheld information, interrupted reaches, voluntary yielding and eventual return continuous with the motion reference. The four spoken lines are English silent performance cues; audio generation is disabled. Add no other captions, speech, object, magic or participant."
    }
  ],
  "omni_reference_task_type": "reference",
  "ratio": "9:16",
  "duration": 24,
  "resolution": "720p",
  "generate_audio": false,
  "watermark": false
}
```

## Compatibility and retention {#handoff}

The planned semantic-reference mode requests performance, composition and timing resemblance; it guarantees no frame-identical pose, camera or identity. Do not combine this template with forced first/last frames. Under the [official Seedance 2.5 prompt guide](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5-prompt-guide), [model page](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5) and [generation tutorial](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/video-generation-tutorial), the planned 24-second single video uses one of at most ten reference videos and remains below the 30-second aggregate input allowance. No overlap or second continuity clip is included. Any additional video consumes that same allowance. The final input must independently meet the documented file/raster/codec/rate limits; the intended 720×1280, 24fps H264 MP4 is not yet a measured segment. Seedance 2.0’s 15-second aggregate does not admit this same request unchanged.

Whole and segment bytes will be locally retained in the project’s ignored output store, with tracked small receipts/digests and no claimed verified external archive. Regeneration is not restoration. This planned template is retained in Git; a future actual submitted attempt must preserve its exact nonsecret resolved payload separately.
