---
name: image-diffusion
description: Lists the routes to an image generator and how to prompt one. Use when choosing an image generator or writing an image prompt; image owns what each image is for.
---

# Image diffusion

## Choose a generator

These are representative examples, not a complete or required list; read the chosen model's current documentation for sizes, input-image count, license and price, and record the choice in [project context](../../production/project-context.md).

| Generator | Reached through | Note |
| --- | --- | --- |
| Codex built-in image generation | The `$imagegen` skill or a plain request, under the ChatGPT plan with no API key | It saves into Codex's own home directory, so copy each accepted image into the production; its edits work only on images visible in the conversation, so view a saved file before editing it |
| A hosted image API, such as [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation) | A script with the user's key | |
| Open weights, such as the Stable Diffusion family with [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter), or an editing model that takes depth, edge and pose, such as [Qwen-Image-Edit](https://huggingface.co/Qwen/Qwen-Image-Edit-2509) | diffusers or ComfyUI | The route that conditions on a rendered form and repeats from a fixed seed |

## Prompts

Follow the selected model's prompting guide, such as [OpenAI's](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide). Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role in the prompt, never as text in the image, such as "Image 1: identity of Mara; Image 2: the kitchen plate". For an edit, state what changes and repeat what stays the same.

Camera and lens words steer the image only loosely, so an exact camera comes from a reference or a control image.
