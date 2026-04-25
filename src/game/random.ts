export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
}

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seedInput: string): Rng {
  let seed = hashSeed(seedInput) || 1;

  const next = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    pick(items) {
      return items[this.int(items.length)];
    },
    shuffle(items) {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const other = this.int(index + 1);
        [copy[index], copy[other]] = [copy[other], copy[index]];
      }
      return copy;
    },
  };
}
