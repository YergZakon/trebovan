export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
}

export function stemRu(word: string): string {
  word = word.toLowerCase().trim();
  const suffixes = ['ению', 'ости', 'ного', 'тель', 'ных', 'ого', 'ому',
    'ой', 'ая', 'ую', 'ый', 'ий', 'ов', 'ей', 'ых',
    'ью', 'ья', 'ие', 'ые', 'ам', 'ом',
    'и', 'ы', 'а', 'я', 'у', 'о', 'е', 'ь'];
  for (const suffix of suffixes) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}
