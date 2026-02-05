import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  createEmptyGrid,
  createRandomGrid,
  countLiveCells,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  deserializeGrid,
  nextGeneration,
  PATTERNS,
  placePattern,
  serializeGrid,
  setCell,
  type Grid,
  type SerializedGrid,
} from './lib/gameOfLife';

const CELL_SIZE = 16;
const MIN_SPEED = 1;
const MAX_SPEED = 20;

const GRID_SIZE_OPTIONS = [
  { label: 'Small (30 x 50)', rows: 30, cols: 50 },
  { label: 'Medium (40 x 70)', rows: 40, cols: 70 },
  { label: 'Large (50 x 90)', rows: 50, cols: 90 },
] as const;

type GridSizeLabel = (typeof GRID_SIZE_OPTIONS)[number]['label'];
type Theme = 'dark' | 'light';

export default function App() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [gridSize, setGridSize] = useState<GridSizeLabel>(GRID_SIZE_OPTIONS[0].label);
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [isRunning, setIsRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawValue, setDrawValue] = useState(true);
  const [speed, setSpeed] = useState(8);
  const [generation, setGeneration] = useState(0);
  const [wrappingEdges, setWrappingEdges] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [serializedPattern, setSerializedPattern] = useState('');
  const [saveLoadMessage, setSaveLoadMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const liveCells = useMemo(() => countLiveCells(grid), [grid]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const tickRateMs = Math.max(20, Math.floor(1000 / speed));
    const interval = window.setInterval(() => {
      setGrid((current) => nextGeneration(current, { wrappingEdges }));
      setGeneration((current) => current + 1);
    }, tickRateMs);

    return () => window.clearInterval(interval);
  }, [isRunning, speed, wrappingEdges]);

  const dimensions = useMemo(() => ({ width: cols * CELL_SIZE, height: rows * CELL_SIZE }), [cols, rows]);

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

    const deadColor = theme === 'dark' ? '#111827' : '#f3f4f6';
    const strokeColor = theme === 'dark' ? '#1f2937' : '#d1d5db';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = grid[row][col] ? '#22c55e' : deadColor;
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [cols, dimensions.height, dimensions.width, grid, rows, theme]);

  function getCellFromEvent(event: MouseEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
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

  function resetBoard(nextRows: number, nextCols: number) {
    setIsRunning(false);
    setGeneration(0);
    setGrid(createEmptyGrid(nextRows, nextCols));
  }

  function handleGridSizeChange(nextSize: GridSizeLabel) {
    setGridSize(nextSize);
    const sizeOption = GRID_SIZE_OPTIONS.find((option) => option.label === nextSize);
    if (!sizeOption) {
      return;
    }

    setRows(sizeOption.rows);
    setCols(sizeOption.cols);
    resetBoard(sizeOption.rows, sizeOption.cols);
  }

  function handleStep() {
    setGrid((current) => nextGeneration(current, { wrappingEdges }));
    setGeneration((current) => current + 1);
  }

  function handleRandomize() {
    setIsRunning(false);
    setGeneration(0);
    setGrid(createRandomGrid(rows, cols));
  }

  function handleClear() {
    resetBoard(rows, cols);
  }

  function insertPattern(patternKey: keyof typeof PATTERNS) {
    setIsRunning(false);
    setGeneration(0);

    const pattern = PATTERNS[patternKey];
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    setGrid(createEmptyGrid(rows, cols));
    setGrid((current) => placePattern(current, pattern, centerRow, centerCol));
  }

  function handleSavePattern() {
    const payload = serializeGrid(grid);
    const text = JSON.stringify(payload);
    setSerializedPattern(text);
    void navigator.clipboard?.writeText(text);
    setSaveLoadMessage('Saved current grid as JSON (copied if clipboard is available).');
  }

  function handleLoadPattern() {
    try {
      const parsed = JSON.parse(serializedPattern) as SerializedGrid;
      if (
        typeof parsed.rows !== 'number' ||
        typeof parsed.cols !== 'number' ||
        !Array.isArray(parsed.cells)
      ) {
        throw new Error('Invalid shape');
      }

      const nextGrid = deserializeGrid(parsed);
      setRows(parsed.rows);
      setCols(parsed.cols);
      const matched = GRID_SIZE_OPTIONS.find(
        (option) => option.rows === parsed.rows && option.cols === parsed.cols,
      );
      if (matched) {
        setGridSize(matched.label);
      }

      setIsRunning(false);
      setGeneration(0);
      setGrid(nextGrid);
      setSaveLoadMessage('Pattern loaded successfully.');
    } catch {
      setSaveLoadMessage('Could not parse JSON pattern.');
    }
  }

  return (
    <main className="app">
      <h1>Conway&apos;s Game of Life</h1>
      <p className="hint">Click/drag to draw. Tune speed, board size, and try presets.</p>

      <section className="controls" aria-label="Top controls">
        <button onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
          Theme: {theme}
        </button>
        <label className="inline-toggle">
          <input
            type="checkbox"
            checked={wrappingEdges}
            onChange={(event) => setWrappingEdges(event.target.checked)}
          />
          Wrapping edges
        </label>
      </section>

      <section className="stats" aria-label="Game statistics">
        <div>
          <span className="label">Generation</span>
          <strong>{generation}</strong>
        </div>
        <div>
          <span className="label">Live cells</span>
          <strong>{liveCells}</strong>
        </div>
      </section>

      <section className="controls" aria-label="Simulation controls">
        <button onClick={() => setIsRunning((value) => !value)}>{isRunning ? 'Pause' : 'Play'}</button>
        <button onClick={handleStep} disabled={isRunning}>
          Step
        </button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleRandomize}>Randomize</button>
      </section>

      <section className="panel" aria-label="Settings">
        <label>
          Speed: <strong>{speed}</strong> ticks/sec
          <input
            type="range"
            min={MIN_SPEED}
            max={MAX_SPEED}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>

        <label>
          Grid size
          <select value={gridSize} onChange={(event) => handleGridSizeChange(event.target.value as GridSizeLabel)}>
            {GRID_SIZE_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="controls" aria-label="Preset patterns">
        <button onClick={() => insertPattern('glider')}>Glider</button>
        <button onClick={() => insertPattern('pulsar')}>Pulsar</button>
        <button onClick={() => insertPattern('gosperGun')}>Gosper Gun</button>
      </section>

      <section className="panel save-load" aria-label="Save and load pattern JSON">
        <label>
          Save/Load JSON
          <textarea
            rows={4}
            value={serializedPattern}
            onChange={(event) => setSerializedPattern(event.target.value)}
            placeholder='{"rows":30,"cols":50,"cells":[[1,2],[2,3]]}'
          />
        </label>
        <div className="controls">
          <button onClick={handleSavePattern}>Save current</button>
          <button onClick={handleLoadPattern}>Load JSON</button>
        </div>
        {saveLoadMessage && <p className="hint">{saveLoadMessage}</p>}
      </section>

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
