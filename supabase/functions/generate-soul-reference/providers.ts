export type SoulProvider = "flux" | "seedream" | "wan";

export function getProviderConfig(provider: SoulProvider) {
  switch (provider) {
    case "seedream":
      return {
        name: "Seedream",
        endpoint: Deno.env.get("SEEDREAM_REFERENCE_ENDPOINT") ?? "",
        keyName: "SEEDREAM_API_KEY",
      };
    case "wan":
      return {
        name: "Wan",
        endpoint: Deno.env.get("WAN_REFERENCE_ENDPOINT") ?? "",
        keyName: "WAN_API_KEY",
      };
    default:
      return {
        name: "FLUX",
        endpoint: Deno.env.get("FLUX_REFERENCE_ENDPOINT") ?? "https://fal.run/fal-ai/flux-2/image-to-image",
        keyName: "FAL_KEY",
      };
  }
}

export function getApiKey(keyName: string) {
  const value = Deno.env.get(keyName);
  if (!value) throw new Error(`${keyName} is not configured`);
  return value;
}

export function buildReferencePayload(provider: SoulProvider, prompt: string, imageUrl: string, aspectRatio: string, numImages: number) {
  const imageSize = aspectRatio === "16:9" ? "landscape_16_9" : aspectRatio === "9:16" ? "portrait_16_9" : "square_hd";
  if (provider === "seedream") {
    return { prompt, image_urls: [imageUrl], image_size: imageSize, num_images: numImages };
  }
  if (provider === "wan") {
    return { prompt, image_url: imageUrl, size: imageSize, n: numImages };
  }
  return { prompt, image_url: imageUrl, image_size: imageSize, num_images: numImages, strength: 0.18 };
}
