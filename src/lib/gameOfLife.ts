export type Grid = boolean[][];

export const DEFAULT_ROWS = 30;
export const DEFAULT_COLS = 50;

export function createEmptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function createRandomGrid(rows: number, cols: number, aliveProbability = 0.3): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() < aliveProbability),
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
