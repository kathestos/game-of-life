import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  createEmptyGrid,
  createRandomGrid,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  nextGeneration,
  setCell,
  type Grid,
} from './lib/gameOfLife';

const CELL_SIZE = 16;
const TICK_RATE_MS = 100;

export default function App() {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [isRunning, setIsRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawValue, setDrawValue] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setGrid((current) => nextGeneration(current));
    }, TICK_RATE_MS);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const dimensions = useMemo(
    () => ({ width: DEFAULT_COLS * CELL_SIZE, height: DEFAULT_ROWS * CELL_SIZE }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    for (let row = 0; row < DEFAULT_ROWS; row++) {
      for (let col = 0; col < DEFAULT_COLS; col++) {
        ctx.fillStyle = grid[row][col] ? '#22c55e' : '#111827';
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#1f2937';
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [dimensions.height, dimensions.width, grid]);

  function getCellFromEvent(event: MouseEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row >= DEFAULT_ROWS || col < 0 || col >= DEFAULT_COLS) {
      return null;
    }

    return { row, col };
  }

  function paintCell(row: number, col: number, alive: boolean) {
    setGrid((current) => setCell(current, row, col, alive));
  }

  function handleMouseDown(event: MouseEvent<HTMLCanvasElement>) {
    const cell = getCellFromEvent(event);
    if (!cell) {
      return;
    }

    const newValue = !grid[cell.row][cell.col];
    setDrawValue(newValue);
    setIsDrawing(true);
    paintCell(cell.row, cell.col, newValue);
  }

  function handleMouseMove(event: MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const cell = getCellFromEvent(event);
    if (!cell) {
      return;
    }

    paintCell(cell.row, cell.col, drawValue);
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  return (
    <main className="app">
      <h1>Conway&apos;s Game of Life</h1>
      <p className="hint">Click or drag to draw. Use controls to run the simulation.</p>

      <div className="controls">
        <button onClick={() => setIsRunning((value) => !value)}>{isRunning ? 'Pause' : 'Play'}</button>
        <button onClick={() => setGrid((current) => nextGeneration(current))} disabled={isRunning}>
          Step
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setGrid(createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
          }}
        >
          Clear
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setGrid(createRandomGrid(DEFAULT_ROWS, DEFAULT_COLS));
          }}
        >
          Randomize
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </main>
  );
}
