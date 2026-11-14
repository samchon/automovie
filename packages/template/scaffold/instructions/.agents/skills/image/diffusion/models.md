# Image generators

These examples show the routes to an image generator; they are not a complete or required list. Read the chosen generator's current documentation for sizes, input-image count, seed, license and price.

| Generator | Reached through | Note |
| --- | --- | --- |
| [Codex image generation](https://learn.chatgpt.com/codex/image-generation) | The `$imagegen` skill or a plain request in Codex, under the ChatGPT plan with no API key | It saves into Codex's own home directory, so copy each accepted image into the production; it edits only images visible in the conversation, so view a saved file before editing it |
| [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation) | A script with the user's key | No seed that repeats an image; [OpenAI's prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide) names exact placement in a layout as a weakness, so check shot frames by overlay |
| Open weights, such as [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter) in diffusers, or [Qwen-Image-Edit-2509](https://huggingface.co/Qwen/Qwen-Image-Edit-2509), which takes depth, edge and pose | diffusers or ComfyUI | The route that conditions on a rendered form and repeats from a fixed seed; each checkpoint has its own license |
