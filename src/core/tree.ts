// src/core/tree.ts

export type NodeType = 'MAX' | 'MIN' | 'LEAF';

export interface TreeNode {
    id: string;             // Un identificador único (ej: "A", "B", "D-left")
    type: NodeType;
    value: number | null;   // null si aún no se ha evaluado (Infinity/-Infinity se manejarán como números)
    alpha: number;          // Usualmente inicia en -Infinity
    beta: number;           // Usualmente inicia en Infinity
    children: TreeNode[];
    isPruned?: boolean;     // Indica si esta rama fue podada (no evaluada)
    isEvaluated?: boolean;  // Indica si ya se obtuvo el valor final de este nodo
    isCurrent?: boolean;    // Para resaltar visualmente el nodo actual en la simulación
}

// Función auxiliar para clonar profundamente el árbol y guardar el historial
export const cloneTree = (node: TreeNode): TreeNode => {
    return {
        ...node,
        children: node.children.map(cloneTree),
    };
};

// Árbol pre-construido basado en la imagen de referencia
export const generateDefaultTree = (): TreeNode => {
    return {
        id: 'A',
        type: 'MAX',
        value: null,
        alpha: -Infinity,
        beta: Infinity,
        children: [
            {
                id: 'B',
                type: 'MIN',
                value: null,
                alpha: -Infinity,
                beta: Infinity,
                children: [
                    {
                        id: 'D',
                        type: 'MAX',
                        value: null,
                        alpha: -Infinity,
                        beta: Infinity,
                        children: [
                            { id: 'L1', type: 'LEAF', value: 4, alpha: -Infinity, beta: Infinity, children: [] },
                            { id: 'L2', type: 'LEAF', value: 5, alpha: -Infinity, beta: Infinity, children: [] }
                        ]
                    },
                    {
                        id: 'E',
                        type: 'MAX',
                        value: null,
                        alpha: -Infinity,
                        beta: Infinity,
                        children: [
                            { id: 'L3', type: 'LEAF', value: 8, alpha: -Infinity, beta: Infinity, children: [] },
                            { id: 'L4', type: 'LEAF', value: 50, alpha: -Infinity, beta: Infinity, children: [] }
                        ]
                    }
                ]
            },
            {
                id: 'C',
                type: 'MIN',
                value: null,
                alpha: -Infinity,
                beta: Infinity,
                children: [
                    {
                        id: 'F',
                        type: 'MAX',
                        value: null,
                        alpha: -Infinity,
                        beta: Infinity,
                        children: [
                            { id: 'L5', type: 'LEAF', value: 3, alpha: -Infinity, beta: Infinity, children: [] },
                            { id: 'L6', type: 'LEAF', value: 2, alpha: -Infinity, beta: Infinity, children: [] }
                        ]
                    },
                    {
                        id: 'G',
                        type: 'MAX',
                        value: null,
                        alpha: -Infinity,
                        beta: Infinity,
                        children: [
                            { id: 'L7', type: 'LEAF', value: 0, alpha: -Infinity, beta: Infinity, children: [] },
                            { id: 'L8', type: 'LEAF', value: 10, alpha: -Infinity, beta: Infinity, children: [] }
                        ]
                    }
                ]
            }
        ]
    };
};

// Helper para obtener nombres de nodo secuenciales: A, B, C... Z, AA, AB...
const getLetterId = (index: number): string => {
    let letStr = '';
    let temp = index;
    while (temp >= 0) {
        letStr = String.fromCharCode((temp % 26) + 65) + letStr;
        temp = Math.floor(temp / 26) - 1;
    }
    return letStr;
};

// Utilidad para construir árboles desde JSON anidado, ej: [4, 5, [8, 50], [[3, 2], [0, 10]]]
export const parseTreeFromJSON = (data: any): TreeNode => {
    let nodeCounter = 0;
    let leafCounter = 1;

    const parseNode = (nodeData: any, currentType: NodeType): TreeNode => {
        // Si es un número o string que representa número, es una HOJA
        if (typeof nodeData === 'number' || (typeof nodeData === 'string' && !isNaN(parseFloat(nodeData)))) {
            return {
                id: `L${leafCounter++}`,
                type: 'LEAF',
                value: Number(nodeData),
                alpha: -Infinity,
                beta: Infinity,
                children: []
            };
        }

        // Si es un arreglo, es un Nodo MAX o MIN
        if (Array.isArray(nodeData)) {
            const nodeId = getLetterId(nodeCounter++);
            const nextType: NodeType = currentType === 'MAX' ? 'MIN' : 'MAX';
            const children = nodeData.map((childData) => parseNode(childData, nextType));

            return {
                id: nodeId,
                type: currentType,
                value: null,
                alpha: -Infinity,
                beta: Infinity,
                children: children
            };
        }

        // Fallback de seguridad
        throw new Error('Estructura de árbol inválida: debe ser un número o arreglo.');
    };

    return parseNode(data, 'MAX');
};

// Utilidad para invertir los tipos de nodos del árbol (MAX <-> MIN)
export const toggleTreeType = (node: TreeNode): TreeNode => {
    if (node.type === 'LEAF') {
        return { ...node }; // Clonamos el nodo hoja
    }
    const newType: NodeType = node.type === 'MAX' ? 'MIN' : 'MAX';
    return {
        ...node,
        type: newType,
        children: node.children.map(toggleTreeType),
    };
};
