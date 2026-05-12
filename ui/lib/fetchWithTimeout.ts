export function fetchWithTimeout(
  url: string,
  opts: RequestInit & { signal?: AbortSignal } = {},
  ms = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const signal = opts.signal
    ? (typeof AbortSignal.any === 'function'
        ? AbortSignal.any([opts.signal, controller.signal])
        : controller.signal)
    : controller.signal;
  return fetch(url, { ...opts, signal }).finally(() => clearTimeout(timer));
}
