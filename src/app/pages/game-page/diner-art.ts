// Each cell is one pixel. The ready card and falling items share these sprites.
const sprites = {
  pizza: [
    '...kkkkkkkkkk...',
    '..kcccchhhccck..',
    '.kchhhhhhhhhcck.',
    '.kcccccccccccck.',
    '..kyyyyyyyyrkk..',
    '..kyrryyrryyk...',
    '...krryyrrykk...',
    '...kyyyyyykk....',
    '....kyrryyk.....',
    '....kyrrykk.....',
    '.....kyyyk......',
    '.....kyykk......',
    '......kyk.......',
    '......kkk.......',
  ],
  taco: [
    '......kkk.......',
    '...kkkggrkkk....',
    '..kgggrrgggrkk..',
    '.kcrrgggrrgghhk.',
    '.kchhhhhhhyhyhk.',
    'kchyyyyyyyyyyhck',
    'kcyyycyyyyycyyck',
    'kcyyyyyycyyyyyck',
    '.kcycyyyyyycyck.',
    '.kccyyyyyyyycck.',
    '..kkcccccccckk..',
    '....kkkkkkkk....',
  ],
  burger: [
    '.....kkkkkk.....',
    '...kkccchhckk...',
    '..kcchhhhhhcck..',
    '.kchhyhhhyhhcck.',
    '.kchhhhyhhhhhck.',
    'kcccccccccccccck',
    'kggGGggGGGggGGgk',
    '.krrrrrrrrrrrrk.',
    'kkbbbbyyyybbbbkk',
    'kbbbbbbbyybbbbbk',
    '.kcccccccccccck.',
    '.kchhhhhhhhhcck.',
    '..kkcccccccckk..',
    '....kkkkkkkk....',
  ],
  strawberry: [
    '.......kgk......',
    '...kggkgGkkgk...',
    '....kGGgGGgk....',
    '..kkrrgGggrrkk..',
    '.krrRrrgrrrRrrk.',
    '.krhyrrRrryrrrk.',
    '.krRrryrrrryrrk.',
    '..kryrrrryrrrk..',
    '..krrryrrrrrrk..',
    '...krrrryrrrk...',
    '....kryrrrrk....',
    '.....krrrrk.....',
    '......krrk......',
    '.......kk.......',
  ],
  egg: [
    '......kkkk......',
    '....kkwwwwk.....',
    '...kwwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '..kwwwccccwwwk..',
    '.kwwwcyyyycwwwk.',
    'kwwwcyyhyyycwwwk',
    'kwwwcyyyyyycwwwk',
    'kwwwwcyyyycwwwk.',
    '.kwwwwccccwwwk..',
    '..kkwwwwwwwwk...',
    '....kkwwwwkk....',
    '......kkkk......',
  ],
  moldy: [
    '....k....kk.....',
    '..kkGk..kGGk....',
    '...kGGkkGkk..kk.',
    '.kkkGssssGkkkGk.',
    '..kGssqqssGGGk..',
    '.kGssqqqkksssGk.',
    'kkGssqqkwwkssGkk',
    '.kGsssskwwksqGk.',
    '.kGsqsskwwksqqk.',
    'kkGqqssskksssGkk',
    '..kGssskswkssGk.',
    '.kkGGsskwwkGGkk.',
    '.kGkkGGGkkGGkGk.',
    '..k..kkGGkk..k..',
    '.......kk.......',
  ],
  burnt: [
    '..kk....k.......',
    '..kbk..kbk..kk..',
    '...kbbkbbkkkbk..',
    '.kkkbbbbbccbk...',
    '..kbbccbbbcbbkk.',
    '.kbbccbbkkbbbbk.',
    'kkbbbbbkwwkbbkkk',
    '.kbbbbbkwwkbbbk.',
    '.kbbccbkwwkbbbk.',
    'kkbbbcbbkkbbbkk.',
    '..kbbbbkwwkbbbk.',
    '.kkbbbbkwwkbbkk.',
    '..kbbkbbkkbbkbk.',
    '...kk.kbbkkk.k..',
    '.......kk.......',
  ],
} as const;

export type Food = keyof typeof sprites;

const palette: Record<string, string> = {
  k: '#302727',
  c: '#b56538',
  h: '#ffd899',
  y: '#ffbd38',
  r: '#b93738',
  R: '#ed6552',
  g: '#32634d',
  G: '#75a265',
  w: '#fff6db',
  b: '#533b3a',
  s: '#767b59',
  q: '#aaa67c',
};

export function makeSprites(): Record<Food, HTMLCanvasElement> {
  const result = {} as Record<Food, HTMLCanvasElement>;
  for (const food of Object.keys(sprites) as Food[]) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const rows = sprites[food];
    const top = Math.floor((16 - rows.length) / 2);
    rows.forEach((row, y) =>
      Array.from(row).forEach((color, x) => {
        if (color !== '.') {
          ctx.fillStyle = palette[color];
          ctx.fillRect(x, y + top, 1, 1);
        }
      }),
    );
    result[food] = canvas;
  }
  return result;
}

export function paintKitchen(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Work in chunky pixels so the fixtures share the food's pixel scale.
  ctx.save();
  ctx.scale(2, 2);
  w = Math.ceil(w / 2);
  h = Math.ceil(h / 2);
  const rect = (x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
  };
  rect(0, 0, w, h, '#e2d3b6');
  for (let y = 0; y < h; y += 16) {
    for (let x = y % 32 ? -18 : 0; x < w; x += 36) {
      rect(x + 1, y + 1, 35, 15, '#f5ead1');
      rect(x + 2, y + 2, 32, 1, '#fff4dd');
    }
  }
  // Service window, distant city blocks and a striped café awning.
  const win = Math.min(95, Math.floor(w * 0.28));
  rect(0, 19, win + 3, 57, '#ada693');
  rect(0, 20, win, 53, '#a6c7b8');
  rect(0, 37, win, 33, '#c2d5bb');
  for (let x = 0; x < win - 7; x += 13) {
    const roof = 44 + (x % 9);
    rect(x, roof, 10, 70 - roof, '#9eb7a4');
    rect(x + 3, roof + 4, 2, 3, '#cad9bb');
  }
  rect(Math.floor(win / 2), 22, 3, 49, '#eae0c6');
  rect(0, 50, win, 2, '#eae0c6');
  rect(0, 72, win + 5, 3, '#ab9581');
  for (let x = 0; x < win; x += 9) {
    const color = x % 18 ? '#f8e9cb' : '#c88979';
    rect(x, 17, 9, 8, color);
    rect(x + 1, 25, 7, 2, color);
  }
  // A shelf of nested plates and pantry jars along the opposite wall.
  const shelf = Math.min(76, Math.floor(w * 0.24));
  const left = w - shelf;
  rect(left, 52, shelf, 3, '#ab9980');
  rect(left + 4, 55, 3, 4, '#b7a991');
  for (let i = 0; i < 3; i++) {
    rect(left + 3, 49 - i * 3, 16, 2, '#9fae9c');
    rect(left + 5, 48 - i * 3, 12, 1, '#f8f2db');
  }
  for (let i = 24; i < shelf - 7; i += 14) {
    rect(left + i, 39, 9, 13, '#c7a58c');
    rect(left + i, 37, 9, 2, '#9b9581');
    rect(left + i + 1, 43, 7, 5, '#eee1bc');
  }
  rect(0, h - 34, w, 5, '#95aa99');
  rect(0, h - 31, w, 2, '#dde2c8');
  rect(0, h - 29, w, 11, '#b6c9b4');
  rect(0, h - 18, w, 3, '#7e9689');
  rect(0, h - 15, w, 15, '#9bb1a1');
  for (let x = 0; x < w; x += 43) {
    rect(x, h - 13, 1, 13, '#8ba393');
    rect(x + 17, h - 10, 10, 2, '#738c80');
  }
  ctx.restore();
}

export function paintPan(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  ctx.save();
  ctx.translate(Math.round(x - width / 2), Math.round(y - 14));
  const strip = (left: number, top: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(left, top, w, h);
  };
  strip(width - 2, 9, 28, 8, '#322c2d');
  strip(width + 5, 8, 19, 3, '#a66949');
  strip(0, 0, width, 6, '#343335');
  strip(3, 1, width - 6, 2, '#c6c8b6');
  strip(3, 6, width - 6, 8, '#42464a');
  strip(8, 14, width - 16, 6, '#3a3b40');
  strip(15, 20, width - 30, 5, '#303135');
  strip(23, 25, width - 46, 3, '#29292d');
  strip(10, 7, 20, 3, '#727b79');
  ctx.restore();
}
