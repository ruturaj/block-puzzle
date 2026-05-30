// The 12 standard pentominoes (each = 5 cells). Conway letter names.
// Board options that pack exactly: 6x10, 5x12, 4x15, 3x20.
// Default board for this app: 6 rows x 10 cols (60 cells = 12 * 5).

export const PENTOMINOES = [
  { id: 'F', name: 'F', color: '#E67E22', shape: [[0,1,1],[1,1,0],[0,1,0]] },
  { id: 'I', name: 'I', color: '#3498DB', shape: [[1],[1],[1],[1],[1]] },
  { id: 'L', name: 'L', color: '#F1C40F', shape: [[1,0],[1,0],[1,0],[1,1]] },
  { id: 'N', name: 'N', color: '#9B59B6', shape: [[0,1],[0,1],[1,1],[1,0]] },
  { id: 'P', name: 'P', color: '#E91E63', shape: [[1,1],[1,1],[1,0]] },
  { id: 'T', name: 'T', color: '#1ABC9C', shape: [[1,1,1],[0,1,0],[0,1,0]] },
  { id: 'U', name: 'U', color: '#34495E', shape: [[1,0,1],[1,1,1]] },
  { id: 'V', name: 'V', color: '#16A085', shape: [[1,0,0],[1,0,0],[1,1,1]] },
  { id: 'W', name: 'W', color: '#8E44AD', shape: [[1,0,0],[1,1,0],[0,1,1]] },
  { id: 'X', name: 'X', color: '#E74C3C', shape: [[0,1,0],[1,1,1],[0,1,0]] },
  { id: 'Y', name: 'Y', color: '#2ECC71', shape: [[0,1],[1,1],[0,1],[0,1]] },
  { id: 'Z', name: 'Z', color: '#D35400', shape: [[1,1,0],[0,1,0],[0,1,1]] },
];
