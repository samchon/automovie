# Image generators

An image generator's route decides whose key it runs under, where its files land and whether a seed repeats an image; any route the user prefers can serve. Read the chosen generator's current documentation for sizes, input-image count, seed, license and price.

| Generator | Reached through | Note |
| --- | --- | --- |
| [Codex image generation](https://learn.chatgpt.com/codex/image-generation) | The `$imagegen` skill or a plain request in Codex, under the ChatGPT plan with no API key | It saves into Codex's own home directory, so copy each accepted image into the production; it edits only images visible in the conversation, so view a saved file before editing it |
| [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation) | A script with the user's key | No seed that repeats an image; [OpenAI's guide](https://developers.openai.com/api/docs/guides/image-generation) names exact placement in a layout as a weakness |
| Open weights, such as [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter) in diffusers, or [Qwen-Image-Edit-2509](https://huggingface.co/Qwen/Qwen-Image-Edit-2509), which takes depth, edge and pose | diffusers or ComfyUI | Can train a small LoRA on a recurring character's canon references; each checkpoint has its own license, and some identity adapters, such as InstantID, are non-commercial |
