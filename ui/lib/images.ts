const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function resolveImageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (!IMAGE_BASE) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${IMAGE_BASE}${normalizedPath}`;
}
