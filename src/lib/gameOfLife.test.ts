import { describe, expect, it } from 'vitest';
import {
  countLiveCells,
  createEmptyGrid,
  deserializeGrid,
  nextGeneration,
  PATTERNS,
  placePattern,
  serializeGrid,
} from './gameOfLife';

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

  it('supports wrapping edges mode', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][0] = true;
    grid[0][2] = true;
    grid[2][0] = true;

    const next = nextGeneration(grid, { wrappingEdges: true });

    expect(next[2][2]).toBe(true);
  });
});

describe('helpers', () => {
  it('counts live cells', () => {
    const grid = createEmptyGrid(3, 3);
    grid[0][1] = true;
    grid[1][2] = true;

    expect(countLiveCells(grid)).toBe(2);
  });

  it('places a pattern centered by coordinates and clips out-of-bounds cells', () => {
    const grid = createEmptyGrid(5, 5);
    const next = placePattern(grid, PATTERNS.glider, 0, 0);

    expect(countLiveCells(next)).toBeGreaterThan(0);
    expect(next[2][0]).toBe(true);
  });

  it('serializes and deserializes a grid', () => {
    const grid = createEmptyGrid(4, 4);
    grid[0][2] = true;
    grid[3][1] = true;

    const serialized = serializeGrid(grid);
    const rehydrated = deserializeGrid(serialized);

    expect(serialized.rows).toBe(4);
    expect(serialized.cols).toBe(4);
    expect(serialized.cells).toEqual([
      [0, 2],
      [3, 1],
    ]);
    expect(rehydrated).toEqual(grid);
  });
});
