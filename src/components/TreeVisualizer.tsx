import { useMemo, useState, MouseEvent, WheelEvent } from 'react';
import type { TreeNode } from '../core/tree';

interface LayoutNode extends TreeNode {
    x: number;
    y: number;
    children: LayoutNode[];
}

interface TreeVisualizerProps {
    root: TreeNode;
    activeNodeId: string | null;
}

const TREE_WIDTH = 900;
const TREE_HEIGHT = 420;
const NODE_SIZE = 50;
const VERTICAL_SPACING = 100;

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ root, activeNodeId }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
        const zoomSensitivity = 0.002;
        const delta = -e.deltaY * zoomSensitivity;
        setScale(s => Math.min(Math.max(0.2, s + delta), 4));
    };

    const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const layoutRoot = useMemo(() => {
        const calculateLayout = (node: TreeNode, left: number, right: number, y: number): LayoutNode => {
            const x = (left + right) / 2;
            const numChildren = node.children.length;

            const childrenLayout = node.children.map((child, index) => {
                const sectionWidth = (right - left) / numChildren;
                const childLeft = left + index * sectionWidth;
                const childRight = childLeft + sectionWidth;
                return calculateLayout(child, childLeft, childRight, y + VERTICAL_SPACING);
            });

            return {
                ...node,
                x,
                y,
                children: childrenLayout,
            };
        };

        // Reducimos el margen superior inicial (y: 60 -> 40)
        return calculateLayout(root, 0, TREE_WIDTH, 40);
    }, [root]);

    const renderConnections = (node: LayoutNode): React.ReactNode[] => {
        let lines: React.ReactNode[] = [];
        node.children.forEach(child => {
            const isPruned = child.isPruned;
            const strokeColor = isPruned ? '#7f1d1d' : '#94a3b8';
            const strokeWidth = isPruned ? 2 : 3;
            const dashArray = isPruned ? '5,5' : 'none';

            lines.push(
                <line
                    key={`line-${node.id}-${child.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={child.x}
                    y2={child.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    className="transition-all duration-300"
                />
            );
            lines = lines.concat(renderConnections(child));
        });
        return lines;
    };

    const renderNodes = (node: LayoutNode): React.ReactNode[] => {
        let elements: React.ReactNode[] = [];
        const isActive = activeNodeId === node.id || node.isCurrent;
        const isPruned = node.isPruned;

        let fill = '#1e293b';
        if (isActive) fill = '#2563eb';
        if (isPruned) fill = '#450a0a';

        let stroke = isActive ? '#93c5fd' : '#cbd5e1';
        if (isPruned) stroke = '#7f1d1d';

        const formatValue = (val: number | null) => {
            if (val === null) return ' ';
            if (val === Infinity) return '∞';
            if (val === -Infinity) return '-∞';
            return val.toString();
        };

        const renderShape = () => {
            if (node.type === 'MAX') {
                const points = `${node.x},${node.y - NODE_SIZE / 2} ${node.x - NODE_SIZE / 2},${node.y + NODE_SIZE / 2} ${node.x + NODE_SIZE / 2},${node.y + NODE_SIZE / 2}`;
                return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={2} className="transition-all duration-300 drop-shadow-lg" />;
            } else if (node.type === 'MIN') {
                const points = `${node.x - NODE_SIZE / 2},${node.y - NODE_SIZE / 2} ${node.x + NODE_SIZE / 2},${node.y - NODE_SIZE / 2} ${node.x},${node.y + NODE_SIZE / 2}`;
                return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={2} className="transition-all duration-300 drop-shadow-lg" />;
            } else {
                return <rect x={node.x - NODE_SIZE / 2 + 5} y={node.y - NODE_SIZE / 2 + 5} width={NODE_SIZE - 10} height={NODE_SIZE - 10} rx={6} fill={fill} stroke={stroke} strokeWidth={2} className="transition-all duration-300 drop-shadow-lg" />;
            }
        };

        let textYOffset = 5;
        if (node.type === 'MAX') textYOffset = 18;
        if (node.type === 'MIN') textYOffset = -8;
        if (node.type === 'LEAF') textYOffset = 5;

        elements.push(
            <g key={`node-${node.id}`}>
                {renderShape()}
                <text
                    x={node.x}
                    y={node.y + textYOffset}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="16"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {node.type === 'LEAF' ? formatValue(node.value) : node.id}
                </text>

                {node.type !== 'LEAF' && !isPruned && (
                    <g transform={`translate(${node.x + 30}, ${node.y - 25})`} className="opacity-90">
                        <rect x="0" y="0" width="55" height="46" rx="6" fill="#0f172a" stroke="#334155" strokeWidth={1} />
                        <text x="5" y="14" fill="#cbd5e1" fontSize="11" fontFamily="monospace">v:{formatValue(node.value)}</text>
                        <text x="5" y="27" fill="#93c5fd" fontSize="11" fontFamily="monospace">α:{formatValue(node.alpha)}</text>
                        <text x="5" y="40" fill="#fca5a5" fontSize="11" fontFamily="monospace">β:{formatValue(node.beta)}</text>
                    </g>
                )}
            </g>
        );

        node.children.forEach(child => {
            elements = elements.concat(renderNodes(child));
        });

        return elements;
    };

    return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center rounded-2xl">
            {/* Controles de Zoom */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700/50 shadow-lg backdrop-blur-md">
                <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-blue-400 rounded-lg text-slate-300 transition-colors border border-slate-700" title="Acercar">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
                <button onClick={resetView} className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-blue-400 rounded-lg text-slate-300 transition-colors font-mono text-[10px] font-extrabold border border-slate-700" title="Restablecer">
                    1:1
                </button>
                <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-blue-400 rounded-lg text-slate-300 transition-colors border border-slate-700" title="Alejar">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
            </div>

            <svg 
                width="100%" 
                height="100%" 
                className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Definir patrones o filtros si es necesario, pero este es el contenedor arrastrable */}
                <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
                    {/* Centramos el árbol de forma inicial basándonos en el tamaño predefinido */}
                    <g transform={`translate(200, 50)`}>
                        {renderConnections(layoutRoot)}
                        {renderNodes(layoutRoot)}
                    </g>
                </g>
            </svg>
        </div>
    );
};
