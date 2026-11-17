# Image models

These examples show different ways to generate, edit and condition images; the user may choose another. Verify the chosen checkpoint and endpoint in its own documentation, including its terms and input roles.

## Reference generation and instruction edits

[OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) generates from text and reference images, with instruction edits, masks and markup. Its [prompting guide](https://developers.openai.com/api/docs/guides/image-prompting) explains input roles; supported output formats and transparency depend on the chosen model.

[Gemini image generation](https://aistudio.google.com/docs/image-generation), also called Nano Banana, combines references and edits over conversational turns. Check the chosen model's reference and output controls; generated images carry SynthID.

[FLUX 3 Image](https://docs.bfl.ml/flux_3/flux3_image_overview.md) combines references, instruction edits and bounding boxes for layout. [Klein](https://docs.bfl.ml/flux_3/flux3_image_klein.md) provides open weights under the FLUX Kommunity License.

[Seedream](https://docs.byteplus.com/en/docs/modelark/image-generation-api) supports reference generation and instruction edits, with related-image sets on selected endpoints. An endpoint that accepts several references need not return a related set; check its output mode.

[Midjourney](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) binds subjects through Omni Reference or the Edit Model, depending on version. Its [style references](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) control medium, color and texture rather than a person's identity.

[Qwen-Image-Edit-2511](https://huggingface.co/Qwen/Qwen-Image-Edit-2511) edits and combines reference subjects with Apache-2.0 weights. [Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1) adds native RGBA generation and editing under a research license; the family's licenses are not interchangeable.

## Stable Diffusion

[Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) provides an open checkpoint family for generation and adaptation, including compatible structural and image-reference adapters. SDXL 1.0 uses CreativeML Open RAIL++-M; check a fine-tune's additional terms separately.

[Stable Diffusion 3.5](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) is a separate family under the Stability Community License. Its official [ControlNets](https://huggingface.co/stabilityai/stable-diffusion-3.5-controlnets) provide Canny, depth and blur conditioning for 3.5 Large; that does not establish compatibility with SDXL or every 3.5 variant.

## Structure and identity adapters

[ControlNet](https://huggingface.co/docs/diffusers/en/using-diffusers/controlnet) conditions a compatible generator on structural signals, while [IP-Adapter](https://huggingface.co/docs/diffusers/en/using-diffusers/ip_adapter) supplies image appearance or identity. They are adapters, not standalone image generators; match their weights to the base checkpoint under [conditioning](conditioning.md#routes).

A character LoRA is another identity route. Check the chosen base, adapter, face encoder and annotator's terms independently; an open code license does not establish the rights of every weight file.

## Multi-view and finishing

[MV-Adapter](https://github.com/huanngzh/MV-Adapter) generates related views with compatible SDXL or SD2.1 bases, including image- and geometry-conditioned variants. Choose the variant that suits the [turnaround views](../turnaround-views.md).

[Magnific](https://docs.magnific.com/llms.txt) exposes separate precision and creative upscalers. [Finishing](finishing.md#upscaling) sets which one an accepted image takes.
