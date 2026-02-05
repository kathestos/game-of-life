export type Grid = boolean[][];

export type Pattern = {
  name: string;
  cells: Array<[rowOffset: number, colOffset: number]>;
};

export const DEFAULT_ROWS = 30;
export const DEFAULT_COLS = 50;

export const PATTERNS: Record<'glider' | 'pulsar' | 'gosperGun', Pattern> = {
  glider: {
    name: 'Glider',
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  pulsar: {
    name: 'Pulsar',
    cells: [
      [-6, -4],
      [-6, -3],
      [-6, -2],
      [-6, 2],
      [-6, 3],
      [-6, 4],
      [-4, -6],
      [-3, -6],
      [-2, -6],
      [-4, -1],
      [-3, -1],
      [-2, -1],
      [-4, 1],
      [-3, 1],
      [-2, 1],
      [-4, 6],
      [-3, 6],
      [-2, 6],
      [2, -6],
      [3, -6],
      [4, -6],
      [2, -1],
      [3, -1],
      [4, -1],
      [2, 1],
      [3, 1],
      [4, 1],
      [2, 6],
      [3, 6],
      [4, 6],
      [6, -4],
      [6, -3],
      [6, -2],
      [6, 2],
      [6, 3],
      [6, 4],
      [-4, -4],
      [-4, -3],
      [-4, -2],
      [-4, 2],
      [-4, 3],
      [-4, 4],
      [4, -4],
      [4, -3],
      [4, -2],
      [4, 2],
      [4, 3],
      [4, 4],
      [-2, -4],
      [-2, -3],
      [-2, -2],
      [-2, 2],
      [-2, 3],
      [-2, 4],
      [2, -4],
      [2, -3],
      [2, -2],
      [2, 2],
      [2, 3],
      [2, 4],
    ],
  },
  gosperGun: {
    name: 'Gosper Gun',
    cells: [
      [0, 24],
      [1, 22],
      [1, 24],
      [2, 12],
      [2, 13],
      [2, 20],
      [2, 21],
      [2, 34],
      [2, 35],
      [3, 11],
      [3, 15],
      [3, 20],
      [3, 21],
      [3, 34],
      [3, 35],
      [4, 0],
      [4, 1],
      [4, 10],
      [4, 16],
      [4, 20],
      [4, 21],
      [5, 0],
      [5, 1],
      [5, 10],
      [5, 14],
      [5, 16],
      [5, 17],
      [5, 22],
      [5, 24],
      [6, 10],
      [6, 16],
      [6, 24],
      [7, 11],
      [7, 15],
      [8, 12],
      [8, 13],
    ],
  },
};

export function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function createRandomGrid(rows: number, cols: number, aliveProbability = 0.3): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() < aliveProbability),
  );
}

export function countLiveCells(grid: Grid): number {
  return grid.reduce(
    (total, row) => total + row.reduce((rowTotal, cell) => rowTotal + Number(cell), 0),
    0,
  );
}

export function countLiveNeighbors(grid: Grid, row: number, col: number): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let liveNeighbors = 0;

  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      if (r === 0 && c === 0) {
        continue;
      }
      const nextRow = row + r;
      const nextCol = col + c;
      const inBounds = nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;
      if (inBounds && grid[nextRow][nextCol]) {
        liveNeighbors += 1;
      }
    }
  }

  return liveNeighbors;
}

export function nextGeneration(grid: Grid): Grid {
  return grid.map((row, rowIndex) =>
    row.map((isAlive, colIndex) => {
      const liveNeighbors = countLiveNeighbors(grid, rowIndex, colIndex);

      if (isAlive) {
        return liveNeighbors === 2 || liveNeighbors === 3;
      }

      return liveNeighbors === 3;
    }),
  );
}

export function setCell(grid: Grid, row: number, col: number, alive: boolean): Grid {
  return grid.map((currentRow, rowIndex) => {
    if (rowIndex !== row) {
      return currentRow;
    }

    return currentRow.map((currentCell, colIndex) => (colIndex === col ? alive : currentCell));
  });
}

export function placePattern(grid: Grid, pattern: Pattern, startRow: number, startCol: number): Grid {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = grid.map((row) => [...row]);

  for (const [rowOffset, colOffset] of pattern.cells) {
    const row = startRow + rowOffset;
    const col = startCol + colOffset;

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      next[row][col] = true;
    }
  }

  return next;
}
