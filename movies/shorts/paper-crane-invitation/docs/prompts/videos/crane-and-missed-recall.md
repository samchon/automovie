# Crane and missed recall

## Request and status {#request}

Planned English semantic motion-reference request for BytePlus ModelArk Seedance 2.5. Not submitted; no job, billed generation, generated take or account activation is claimed. The exact text lives in the text field of the payload below. The URL is an unresolved upload field, not a local path masquerading as a public URL.

## Source decisions {#sources}

[Current construction screenplay](../../body/screenplay/give-it-back-potter.md#invitation), raw SHA256 `b27e003a009bfd64ab791b8a166896df69e2c21558b7a805a8009fb7a8a239c7`, timed spans 00:00–00:09 — Sent; 00:09–00:19 — Wrong note. Literal source: “Her fingertip pushes it into the air; it glides out past the bench's right end toward him, leaving her open hand behind.” The quoted push/glide plus the following missed fingers and left-palm catch own the send/recall/catch instructions. The next interval owns blank-backed opening, Carina’s right-end approach and the three English lines. The two identity settings own age, house and uniform layers. The finite bay and cups settings own their retained spatial forms. The independently unapproved expression working edition is not this request’s source.

[Carina](../../body/settings/carina-malfoy.md#identity), raw SHA256 `c924c9b8183382ebb2993806283cc5d075098ff7e8a57d0594a841f5ccf3f538`, says “fifteen-year-old Hogwarts student”; [Harry](../../body/settings/harry-potter.md#identity), raw SHA256 `e1b3f5ceb6da4c96b5dbfcfa95e34e508ef2cc91b60584e525e85c650658bf63`, supplies the corresponding Gryffindor identity. [Space](../../body/settings/corridor.md#space), raw SHA256 `3184a41ccba54a37a9b22e36f97238fb39969cab7d8e778aae0a465a20350237`, owns the finite bay, fixed bench and route. [Paper](../../body/settings/paper-crane.md#paper), raw SHA256 `a788e1ddcb6e9ee6162f907850827f8bb56558425b66ad7cc08725aee7ce19a0`, says “approximately 16 centimetres across when open” and “Contact ends the charm”. These own the one paper, its scale, fixed inscription and single-use flight. [Cups](../../body/settings/tea-cups.md#cups), raw SHA256 `aceedf8d5e1e0a51c39e108731261484f11da546bf6f195148745fd18967bacf`, says “about nine centimetres tall and eight centimetres across” and “Both cups remain upright and supported on the window sill until their intended pickup”. These own the handled open forms, starting support and upright carrying. Cinematic surface refinement and silent delivery are delegated production choices; they change no canonical action or fact.

## Reference roles and clip binding {#inputs}

Planned whole-hint range [0, 19) seconds, global frames 0–455 inclusive at 24 fps. Local frames 0–455. This is a planned causal boundary, not an existing encoded segment. Actual clip locator, SHA256, byte size, decoded profile and camera execution are pending the complete motion implementation and encode; no current failed 0–9-second candidate is supplied as this clip.

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
      "text": "Use reference video 1 as the motion, staging, camera and timing guide for this nineteen-second vertical scene. Preserve the two actors' paths, feet and hand contacts, the single paper's flight and palm catch, anticipation, missed recall and reaction pauses. Replace the coarse polygon appearance with a restrained cinematic magical-school scene, while preserving the same quiet finite window bay, four-legged backless wooden bench, two small tea cups on the right sill and clear route around the bench's right end.\n\nCarina is the pale-blond fifteen-year-old girl in the Slytherin school uniform: white collar, green-and-silver tie, charcoal knit, open black robe, charcoal knee-length pleated skirt, black tights and flat black school shoes. Harry is the dark-haired fifteen-year-old boy with round glasses, white collar, red-and-gold tie, charcoal knit, open black robe, charcoal trousers and black school shoes. Keep both identities and these layers continuous across all three clips. Carina's small haughty smirk gives way to alarm; Harry is curious and considerate.\n\nCarina holds one cream paper crane between her right thumb and forefinger beside two waiting upright cups. She follows Harry with its beak, pushes it into one brief charm-guided glide, withdraws her open hand and then takes a short missed step after it. Her fingers close on air. Harry approaches with empty swinging hands, stops and catches the crane in his left palm; the charm ends at contact. He opens it with his right hand below chest height. Keep its blank back toward the audience: the invitation is not readable yet. Carina comes around the right bench end, palm out. English dialogue beats are Carina: 'Potter.' Harry: 'Is this yours?' Carina: 'Wrong note. Give it back.' These are silent performance and timing cues in this planned audio-disabled request. Do not add visible captions. Preserve the cup positions, paper custody and the unforced, slightly embarrassed tone. Late afternoon window light and a simple stone background support the action."
    }
  ],
  "omni_reference_task_type": "reference",
  "ratio": "9:16",
  "duration": 19,
  "resolution": "720p",
  "generate_audio": false,
  "watermark": false
}
```

## Compatibility and retention {#handoff}

The planned semantic-reference mode requests performance, composition and timing resemblance; it guarantees no frame-identical pose, camera or identity. Do not combine this template with forced first/last frames. Under the [official Seedance 2.5 prompt guide](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5-prompt-guide), [model page](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-5) and [generation tutorial](https://ai.byteplus.com/ark/region:ap-southeast-1/docs/video-generation-tutorial), the planned 19-second single video uses one of at most ten reference videos and remains below the 30-second aggregate input allowance. No overlap or second continuity clip is included. Any additional video consumes that same allowance. The final input must independently meet the documented file/raster/codec/rate limits; the intended 720×1280, 24fps H264 MP4 is not yet a measured segment. Seedance 2.0’s 15-second aggregate does not admit this same request unchanged.

Whole and segment bytes will be locally retained in the project’s ignored output store, with tracked small receipts/digests and no claimed verified external archive. Regeneration is not restoration. This planned template is retained in Git; a future actual submitted attempt must preserve its exact nonsecret resolved payload separately.
