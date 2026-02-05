import { describe, expect, it } from 'vitest';
import { createEmptyGrid, nextGeneration } from './gameOfLife';

describe('nextGeneration', () => {
  it('keeps a block still life unchanged', () => {
    const grid = createEmptyGrid(4, 4);
    grid[1][1] = true;
    grid[1][2] = true;
    grid[2][1] = true;
    grid[2][2] = true;

    const next = nextGeneration(grid);

    expect(next).toEqual(grid);
  });

  it('oscillates a blinker', () => {
    const grid = createEmptyGrid(5, 5);
    grid[2][1] = true;
    grid[2][2] = true;
    grid[2][3] = true;

    const next = nextGeneration(grid);

    expect(next[1][2]).toBe(true);
    expect(next[2][2]).toBe(true);
    expect(next[3][2]).toBe(true);
    expect(next[2][1]).toBe(false);
    expect(next[2][3]).toBe(false);
  });
});
