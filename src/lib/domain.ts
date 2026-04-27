export function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    return stripWww(url.hostname);
  } catch {
    const cleaned = raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();

    if (!/^[a-z0-9.-]+$/.test(cleaned) || !cleaned.includes(".")) {
      return null;
    }

    return stripWww(cleaned);
  }
}

export function domainFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return stripWww(parsed.hostname.toLowerCase());
  } catch {
    return null;
  }
}

export function uniqueDomains(domains: string[]): string[] {
  return Array.from(new Set(domains.map(normalizeDomain).filter(Boolean) as string[])).sort();
}

export function stripWww(hostname: string): string {
  return hostname.replace(/^www\./, "");
}
