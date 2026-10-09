import { useState, useEffect, useMemo } from 'react';
import type { TreeNode } from './core/tree';
import { generateDefaultTree, toggleTreeType } from './core/tree';
import { runAlphaBetaSimulation } from './core/simulator';
import { TreeVisualizer } from './components/TreeVisualizer';
import { TreeBuilderModal } from './components/TreeBuilderModal';
import { DraggableStatePanel } from './components/DraggableStatePanel';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1000);

  // Estado para manejar el árbol base que alimenta el simulador
  const [baseTree, setBaseTree] = useState<TreeNode>(generateDefaultTree());
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Recalcular los pasos cada vez que el baseTree cambia
  const steps = useMemo(() => {
    return runAlphaBetaSimulation(baseTree);
  }, [baseTree]);

  const totalSteps = steps.length;

  useEffect(() => {
    let timer: number;
    if (isPlaying && currentStep < totalSteps - 1) {
      timer = window.setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStep, speed, totalSteps]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleLoadNewTree = (newTree: TreeNode) => {
    setBaseTree(newTree);
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleToggleType = () => {
    setBaseTree(prev => toggleTreeType(prev));
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const currentSimulationState = steps[currentStep];

  return (
    <div className="w-full h-screen bg-slate-950 font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none"></div>

      {/* Header Unificado al Tope de la Pantalla */}
      <header className="w-full bg-slate-900/80 backdrop-blur border-b border-slate-800 p-4 px-6 flex items-center justify-between shadow-xl relative z-20 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 leading-tight">
            Simulador Poda Alfa-Beta
          </h1>
          <p className="text-slate-400 text-xs mt-1">Visualización interactiva paso a paso del algoritmo Minimax</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleToggleType}
            className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg text-sm font-semibold transition-colors border border-purple-500/30 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
            {baseTree.type === 'MAX' ? 'Raíz: MAX' : 'Raíz: MIN'}
          </button>
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-semibold transition-colors border border-blue-500/30 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Árbol
          </button>
        </div>
      </header>

      {/* Contenedor Principal Izquierda/Derecha */}
      <div className="flex-1 flex flex-row gap-6 p-6 h-full min-h-0 relative z-10 w-full items-start">

        {/* Panel Izquierdo: Controles (30%) */}
        <div className="w-[30%] min-w-[320px] max-w-[400px] flex flex-col gap-6 shrink-0 h-full overflow-y-auto pr-2 custom-scrollbar">

          {/* Controles de Reproducción y Línea de Tiempo */}
          <div className="w-full flex flex-col items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex flex-wrap justify-between gap-2 mb-6 w-full">
              <button
                onClick={handleReset}
                title="Reiniciar Simulación"
                className="py-3 flex-[0.5] sm:flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center border border-slate-700 hover:border-slate-500 shadow-sm"
              >
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                title="Paso Anterior"
                className="py-3 flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center border border-slate-700 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1}
                title="Siguiente Paso"
                className="py-3 flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center border border-slate-700 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`py-3 w-full rounded-xl transition-all font-bold flex items-center justify-center shadow-lg text-sm mt-3 ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'}`}
              >
                {isPlaying ? (
                  <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Pausar Simulación</>
                ) : (
                  <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Auto-Play</>
                )}
              </button>
            </div>

            <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mb-3 px-1 font-mono uppercase tracking-wider">
              <span>Paso 0</span>
              <span className="font-semibold text-blue-400 bg-blue-950/50 px-2 py-1 rounded-md">{currentStep}/{totalSteps - 1}</span>
              <span>Fin</span>
            </div>

            <input
              type="range"
              min="0"
              max={totalSteps - 1}
              value={currentStep}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStep(parseInt(e.target.value));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 outline-none hover:bg-slate-700 transition-colors"
            />

            <div className="mt-8 flex flex-col w-full text-sm text-slate-400 border-t border-slate-800/50 pt-6 gap-5">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-xs">Velocidad de reproducción:</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="bg-slate-950 text-slate-200 rounded-lg px-2 py-1.5 border border-slate-700 hover:border-slate-500 outline-none cursor-pointer font-medium text-xs focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                >
                  <option value={2000}>2.0s</option>
                  <option value={1000}>1.0s</option>
                  <option value={500}>0.5s</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 text-xs font-mono font-medium bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <span className="flex items-center text-slate-300">
                  <span className="min-w-[12px] h-[12px] bg-blue-500 rounded-full mr-3 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                  Nodo bajo Inspección Activa
                </span>
                <span className="flex items-center text-slate-300">
                  <span className="min-w-[12px] h-[12px] bg-red-800 rounded-full mr-3 shadow-[0_0_8px_rgba(153,27,27,0.6)]"></span>
                  Ramas Descartadas (Poda)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Visor SVG (70%) */}
        <div className="flex-1 h-full bg-slate-900 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800/80 relative flex items-center justify-center overflow-hidden z-10 p-2">
          <TreeVisualizer root={currentSimulationState.tree} activeNodeId={currentSimulationState.activeNodeId} />
        </div>
      </div>

      {/* Elementos Flotantes (Renderizados al nivel raíz para dominar el z-index de toda la app) */}
      <DraggableStatePanel message={currentSimulationState.message} />

      <TreeBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onLoadTree={handleLoadNewTree}
      />
    </div>
  );
}

export default App;
