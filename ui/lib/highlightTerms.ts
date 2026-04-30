export function highlightTerms(text: string, query: string): string {
  if (!query.trim()) return text;

  const stopWords = new Set(['a', 'an', 'the', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'with', 'no', 'is', 'are', 'was']);
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  if (terms.length === 0) return text;

  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return text.replace(regex, '<mark>$1</mark>');
}
