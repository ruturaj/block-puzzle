// The 12-piece wooden block puzzle photographed by the user.
// 10x15 board (the spec.md was wrong about dimensions / cell counts).

export const WOODEN12_COLORS = [
  { id: 'light_blue', name: 'Light Blue', color: '#5BC0DE' },
  { id: 'purple',     name: 'Purple',     color: '#7E57C2' },
  { id: 'white',      name: 'White',      color: '#FFFFFF' },
  { id: 'orange',     name: 'Orange',     color: '#F39C2B' },
  { id: 'lime',       name: 'Lime Green', color: '#A6CE39' },
  { id: 'dark_green', name: 'Dark Green', color: '#2E7D32' },
  { id: 'pink',       name: 'Pink',       color: '#E94B7B' },
  { id: 'dark_blue',  name: 'Dark Blue',  color: '#1F3A93' },
  { id: 'yellow',     name: 'Yellow',     color: '#F1C40F' },
  { id: 'red',        name: 'Red',        color: '#D7263D' },
  { id: 'black',      name: 'Black',      color: '#2B2B2B' },
  { id: 'brown',      name: 'Brown',      color: '#5D3A1A' },
];

export const WOODEN12_SHAPES = {
  light_blue: [[1,0,0,0],[1,1,1,1],[1,1,1,1],[0,1,1,1]],
  purple:     [[0,1,1,0],[1,1,1,0],[1,1,1,1],[0,1,1,1]],
  white:      [[1,1,1],[1,1,1],[1,1,1],[1,1,1]],
  orange:     [[0,1,1,0],[1,1,1,1],[1,1,1,1],[0,1,1,0]],
  lime:       [[1,1,1,0],[1,1,1,1],[0,1,1,1],[0,0,1,1]],
  dark_green: [[1,1,0],[1,1,0],[1,1,1],[1,1,1],[0,1,1]],
  pink:       [[1,1,0,0],[1,1,1,0],[1,1,1,0],[1,1,0,0],[1,1,0,0]],
  dark_blue:  [[1,1,1,1],[1,1,1,1],[0,1,1,0],[0,1,1,0]],
  yellow:     [[1,1,1],[1,1,1],[1,1,0],[1,1,0],[1,1,0]],
  red:        [[1,1,0,0],[1,1,1,1],[1,1,1,1],[0,0,1,1]],
  black:      [[1,1,1,1,1,1],[1,1,1,1,1,1]],
  brown:      [[1,1,1,1],[1,1,1,1],[0,0,1,1],[0,0,1,1]],
};

export const WOODEN12_PIECES = WOODEN12_COLORS.map((c) => ({
  ...c,
  shape: WOODEN12_SHAPES[c.id],
}));
