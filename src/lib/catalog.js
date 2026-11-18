// Coopy demo catalogue — ONE example store.
// All prices, stock levels and aisle locations are ILLUSTRATIVE DEMO DATA,
// not real Coop Norway data. Every screen (chat, voice, recipe, list, guide,
// scanner) reads aisle info from here, so they always agree.

export const STORE = {
  id: 'demo-oslo',
  name: 'Coop Demo Store',
  area: 'Grünerløkka, Oslo',
  hours: 'Open today 07–23',
  note: 'Demo store · illustrative data',
};

// Walking order through the store = aisle number order.
export const AISLES = [
  { n: 1, name: 'Fruit & vegetables', hint: 'Right by the entrance' },
  { n: 2, name: 'Bakery', hint: 'Behind the fruit, on the left' },
  { n: 3, name: 'Tinned food & beans', hint: 'First long aisle' },
  { n: 4, name: 'Pasta, rice & world food', hint: 'Second long aisle' },
  { n: 5, name: 'Spices, oils & stock', hint: 'Third long aisle' },
  { n: 6, name: 'Dairy, cheese & eggs', hint: 'Cold wall at the back' },
  { n: 7, name: 'Meat, fish & plant-based', hint: 'Cold counter, back right' },
  { n: 8, name: 'Frozen food', hint: 'Freezers near the checkout' },
];

// pack: size in `unit` (g, ml or pc). price: NOK per pack.
// stock: 'in' | 'low'. veg: vegetarian, vegan: vegan.
const P = (id, name, size, unit, packLabel, price, aisle, spot, emoji, opts = {}) => ({
  id, name, size, unit, packLabel, price, aisle, spot, emoji,
  veg: opts.veg ?? true,
  vegan: opts.vegan ?? (opts.veg ?? true),
  stock: opts.stock ?? 'in',
  keywords: opts.keywords ?? [],
  ean: opts.ean,
  hue: opts.hue ?? 200,
});

export const PRODUCTS = [
  // Aisle 1 — fruit & veg
  P('onion', 'Yellow onion', 1, 'pc', '1 piece', 4.9, 1, 'Loose vegetables, left wall', '🧅', { keywords: ['onion', 'onions'], hue: 40 }),
  P('garlic', 'Garlic', 1, 'pc', '1 bulb', 6.9, 1, 'Next to the onions', '🧄', { keywords: ['garlic'], hue: 45 }),
  P('spinach', 'Baby spinach', 200, 'g', '200 g bag', 29.9, 1, 'Salad fridge, top shelf', '🥬', { keywords: ['spinach', 'baby spinach'], hue: 110 }),
  P('cherry-tomatoes', 'Cherry tomatoes', 250, 'g', '250 g tray', 24.9, 1, 'Tomato stand, middle', '🍅', { keywords: ['cherry tomatoes', 'cherry tomato', 'fresh tomatoes', 'tomatoes'], hue: 5 }),
  P('bell-pepper', 'Red bell pepper', 1, 'pc', '1 piece', 12.9, 1, 'Pepper box, next to the tomatoes', '🫑', { keywords: ['pepper', 'bell pepper', 'paprika pepper', 'red pepper'], hue: 0 }),
  P('broccoli', 'Broccoli', 1, 'pc', '1 head', 22.9, 1, 'Green vegetables, right wall', '🥦', { keywords: ['broccoli'], hue: 120 }),
  P('potatoes', 'Baby potatoes', 1000, 'g', '1 kg bag', 24.9, 1, 'Potato bins, by the entrance', '🥔', { keywords: ['potato', 'potatoes', 'baby potatoes'], hue: 35 }),
  P('carrots', 'Carrots', 1000, 'g', '1 kg bag', 17.9, 1, 'Root vegetables, next to the potatoes', '🥕', { keywords: ['carrot', 'carrots'], hue: 25 }),
  P('lemon', 'Lemon', 1, 'pc', '1 piece', 6.9, 1, 'Citrus stand, front', '🍋', { keywords: ['lemon', 'lemons'], hue: 55 }),
  P('cucumber', 'Cucumber', 1, 'pc', '1 piece', 14.9, 1, 'Salad section, bottom shelf', '🥒', { keywords: ['cucumber'], hue: 100 }),
  P('iceberg', 'Iceberg lettuce', 1, 'pc', '1 head', 19.9, 1, 'Salad section, middle shelf', '🥬', { keywords: ['lettuce', 'iceberg', 'salad'], hue: 95 }),
  P('basil', 'Fresh basil', 1, 'pc', '1 pot', 24.9, 1, 'Herb shelf, next to the salad', '🌿', { keywords: ['basil', 'herbs'], hue: 130 }),

  // Aisle 2 — bakery
  P('pita', 'Pita bread, 6 pack', 6, 'pc', '6 pack', 21.9, 2, 'Bread shelf, bottom', '🫓', { keywords: ['pita', 'pita bread', 'flatbread'], hue: 35 }),
  P('sourdough', 'Sourdough bread', 1, 'pc', '1 loaf', 39.9, 2, 'Fresh bread wall, middle', '🍞', { keywords: ['bread', 'sourdough', 'loaf'], hue: 30 }),

  // Aisle 3 — tinned food & beans
  P('chickpeas', 'Chickpeas', 410, 'g', '410 g tin', 14.9, 3, 'Middle shelf, next to the beans', '🥫', { keywords: ['chickpea', 'chickpeas', 'garbanzo', 'kikerter'], ean: '7035620001010', hue: 40 }),
  P('kidney-beans', 'Red kidney beans', 410, 'g', '410 g tin', 12.9, 3, 'Middle shelf, beans section', '🥫', { keywords: ['kidney beans', 'red beans', 'kidney bean'], hue: 355 }),
  P('black-beans', 'Black beans', 410, 'g', '410 g tin', 14.9, 3, 'Middle shelf, beans section', '🥫', { keywords: ['black beans', 'black bean'], hue: 260 }),
  P('butter-beans', 'Butter beans', 410, 'g', '410 g tin', 15.9, 3, 'Middle shelf, next to the chickpeas', '🥫', { keywords: ['butter beans', 'white beans', 'butter bean'], hue: 50 }),
  P('chopped-tomatoes', 'Chopped tomatoes', 400, 'g', '400 g tin', 11.9, 3, 'Bottom shelf, tomato section', '🥫', { keywords: ['chopped tomatoes', 'tinned tomatoes', 'canned tomatoes', 'tomato tin', 'crushed tomatoes'], ean: '7035620001027', hue: 5 }),
  P('coconut-milk', 'Coconut milk', 400, 'ml', '400 ml tin', 19.9, 3, 'Top shelf, above the tinned tomatoes', '🥥', { keywords: ['coconut milk', 'coconut'], ean: '7035620001034', hue: 30 }),

  // Aisle 4 — pasta, rice & world food
  P('jasmine-rice', 'Jasmine rice', 1000, 'g', '1 kg bag', 27.9, 4, 'Rice shelf, middle', '🍚', { keywords: ['rice', 'jasmine rice'], ean: '7035620001041', hue: 45 }),
  P('quick-rice', '10-minute rice, boil-in-bag', 500, 'g', '4 × 125 g', 24.9, 4, 'Rice shelf, next to the jasmine rice', '🍚', { keywords: ['quick rice', 'boil in bag rice', '10-minute rice'], hue: 50 }),
  P('penne', 'Penne pasta', 500, 'g', '500 g pack', 17.9, 4, 'Pasta shelf, middle', '🍝', { keywords: ['pasta', 'penne'], ean: '7035620001058', hue: 40 }),
  P('spaghetti', 'Spaghetti', 500, 'g', '500 g pack', 16.9, 4, 'Pasta shelf, next to the penne', '🍝', { keywords: ['spaghetti'], hue: 42 }),
  P('egg-noodles', 'Egg noodles', 250, 'g', '250 g pack', 22.9, 4, 'Asian food section, top shelf', '🍜', { keywords: ['noodles', 'egg noodles'], vegan: false, hue: 45 }),
  P('rice-noodles', 'Rice noodles', 200, 'g', '200 g pack', 24.9, 4, 'Asian food section, next to the egg noodles', '🍜', { keywords: ['rice noodles'], hue: 50 }),
  P('curry-paste', 'Red curry paste', 110, 'g', '110 g jar', 24.9, 4, 'Asian food section, middle shelf', '🌶️', { keywords: ['curry paste', 'red curry', 'curry'], hue: 10 }),
  P('soy-sauce', 'Soy sauce', 150, 'ml', '150 ml bottle', 24.9, 4, 'Asian food section, bottom shelf', '🍶', { keywords: ['soy sauce', 'soya sauce', 'soy'], hue: 20 }),
  P('tortillas', 'Tortilla wraps, 8 pack', 8, 'pc', '8 pack', 26.9, 4, 'Tex-Mex section, top shelf', '🌮', { keywords: ['tortilla', 'tortillas', 'wraps', 'taco shells'], hue: 40 }),
  P('taco-spice', 'Taco spice mix', 28, 'g', '28 g bag', 9.9, 4, 'Tex-Mex section, middle shelf', '🌶️', { keywords: ['taco spice', 'taco seasoning', 'taco mix'], hue: 15 }),
  P('salsa', 'Taco salsa, mild', 230, 'g', '230 g jar', 24.9, 4, 'Tex-Mex section, next to the taco spice', '🫙', { keywords: ['salsa', 'taco sauce'], hue: 8 }),

  // Aisle 5 — spices, oils & stock
  P('cumin', 'Ground cumin', 40, 'g', '40 g jar', 19.9, 5, 'Spice rack, row C', '🧂', { keywords: ['cumin', 'spice', 'spices'], hue: 30 }),
  P('smoked-paprika', 'Smoked paprika', 40, 'g', '40 g jar', 19.9, 5, 'Spice rack, row D', '🧂', { keywords: ['paprika', 'smoked paprika', 'chili powder', 'chilli'], hue: 12 }),
  P('veg-stock', 'Vegetable stock cubes', 6, 'pc', '6 cubes', 19.9, 5, 'Stock and sauces, bottom shelf', '🧊', { keywords: ['stock', 'stock cubes', 'bouillon', 'broth'], hue: 60 }),

  // Aisle 6 — dairy, cheese & eggs
  P('eggs', 'Eggs, 6 pack', 6, 'pc', '6 pack', 27.9, 6, 'Egg shelf, end of the dairy wall', '🥚', { keywords: ['egg', 'eggs'], vegan: false, ean: '7035620001065', hue: 40 }),
  P('feta', 'Feta cheese', 200, 'g', '200 g pack', 32.9, 6, 'Cheese fridge, middle shelf', '🧀', { keywords: ['feta', 'feta cheese'], vegan: false, hue: 50 }),
  P('mozzarella', 'Mozzarella', 125, 'g', '125 g ball', 21.9, 6, 'Cheese fridge, next to the feta', '🧀', { keywords: ['mozzarella'], vegan: false, hue: 55 }),
  P('grated-cheese', 'Grated cheese', 150, 'g', '150 g bag', 34.9, 6, 'Cheese fridge, top shelf', '🧀', { keywords: ['cheese', 'grated cheese'], vegan: false, hue: 48 }),
  P('sour-cream', 'Sour cream, light', 300, 'g', '300 g tub', 21.9, 6, 'Dairy wall, next to the yoghurt', '🥛', { keywords: ['sour cream', 'creme fraiche', 'rømme'], vegan: false, hue: 210 }),
  P('cooking-cream', 'Cooking cream', 300, 'ml', '3 dl carton', 22.9, 6, 'Dairy wall, cream section', '🥛', { keywords: ['cream', 'cooking cream'], vegan: false, hue: 210 }),
  P('tofu', 'Organic tofu', 400, 'g', '400 g pack', 34.9, 7, 'Plant-based fridge, top shelf', '⬜', { keywords: ['tofu'], hue: 60 }),

  // Aisle 7 — meat, fish & plant-based
  P('plant-mince', 'Plant-based mince', 300, 'g', '300 g pack', 44.9, 7, 'Plant-based fridge, next to the beef mince', '🌱', { keywords: ['plant mince', 'vegetarian mince', 'veggie mince', 'soy mince'], hue: 120 }),
  P('beef-mince', 'Beef mince 14%', 400, 'g', '400 g pack', 54.9, 7, 'Meat fridge, mince section', '🥩', { keywords: ['mince', 'minced beef', 'beef', 'ground beef', 'kjøttdeig'], veg: false, hue: 350 }),
  P('chicken', 'Chicken breast fillets', 400, 'g', '400 g pack', 69.9, 7, 'Meat fridge, chicken section', '🍗', { keywords: ['chicken', 'chicken breast', 'kylling'], veg: false, hue: 25 }),
  P('salmon', 'Salmon fillets, 2 pack', 2, 'pc', '2 × 125 g', 79.9, 7, 'Fish counter, left side', '🐟', { keywords: ['salmon', 'laks'], veg: false, ean: '7035620001072', hue: 15 }),
  P('cod', 'Cod loins, 2 pack', 2, 'pc', '2 × 125 g', 69.9, 7, 'Fish counter, next to the salmon', '🐟', { keywords: ['cod', 'torsk', 'white fish'], veg: false, hue: 200 }),
  P('fish-cakes', 'Fish cakes (fiskekaker)', 6, 'pc', '6 pack', 54.9, 7, 'Fish counter, right side', '🐟', { keywords: ['fish cakes', 'fiskekaker', 'fishcakes'], veg: false, stock: 'low', hue: 40 }),

  // Aisle 8 — frozen
  P('frozen-spinach', 'Chopped spinach, frozen', 450, 'g', '450 g bag', 19.9, 8, 'Freezer 2, vegetables', '🥬', { keywords: ['frozen spinach'], hue: 140 }),
  P('wok-veg', 'Wok vegetables, frozen', 750, 'g', '750 g bag', 29.9, 8, 'Freezer 2, next to the frozen spinach', '🥡', { keywords: ['wok vegetables', 'stir fry vegetables', 'frozen vegetables', 'mixed vegetables'], hue: 100 }),
  P('peas', 'Green peas, frozen', 600, 'g', '600 g bag', 24.9, 8, 'Freezer 2, bottom', '🫛', { keywords: ['peas', 'green peas'], hue: 110 }),
];

// Ingredient: product + amount PER SERVING in the product's unit.
// swaps: alternative product ids the shopper can pick instead.
const I = (product, perServing, swaps = []) => ({ product, perServing, swaps });

export const RECIPES = [
  {
    id: 'chickpea-curry',
    name: 'Chickpea & spinach coconut curry',
    short: 'Creamy, mild curry with rice',
    minutes: 20,
    baseServings: 2,
    image: '/img/chickpea-curry.jpg',
    hue: 35,
    tags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      I('chickpeas', 205, ['butter-beans', 'kidney-beans']),
      I('coconut-milk', 200, ['cooking-cream']),
      I('chopped-tomatoes', 200),
      I('spinach', 50, ['frozen-spinach']),
      I('onion', 0.5),
      I('garlic', 0.25),
      I('curry-paste', 25),
      I('jasmine-rice', 75, ['quick-rice']),
    ],
    pantry: ['Cooking oil', 'Salt'],
    steps: [
      'Rinse the rice and cook it in 300 ml water with a pinch of salt for 12 minutes.',
      'Chop the onion and garlic. Fry them in a little oil for 3 minutes.',
      'Stir in the curry paste and cook for 1 minute until it smells great.',
      'Add the chopped tomatoes, coconut milk and drained chickpeas. Simmer for 8 minutes.',
      'Stir in the spinach until it wilts. Season with salt and serve with the rice.',
    ],
  },
  {
    id: 'tomato-mozzarella-pasta',
    name: 'Tomato, basil & mozzarella pasta',
    short: 'Fresh, fast and family-friendly',
    minutes: 15,
    baseServings: 2,
    image: '/img/tomato-mozzarella-pasta.jpg',
    hue: 10,
    tags: ['vegetarian'],
    ingredients: [
      I('penne', 100, ['spaghetti']),
      I('cherry-tomatoes', 125, ['chopped-tomatoes']),
      I('mozzarella', 62.5, ['feta']),
      I('basil', 0.25),
      I('garlic', 0.25),
    ],
    pantry: ['Olive oil', 'Salt & pepper'],
    steps: [
      'Boil the pasta in salted water for about 10 minutes.',
      'Halve the cherry tomatoes and slice the garlic.',
      'Warm olive oil in a pan, add garlic and tomatoes and cook for 4 minutes.',
      'Drain the pasta and toss it with the tomatoes.',
      'Tear over the mozzarella and basil. Season and serve.',
    ],
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka with feta & warm pita',
    short: 'Eggs in a spiced tomato sauce',
    minutes: 20,
    baseServings: 2,
    image: '/img/shakshuka.jpg',
    hue: 15,
    tags: ['vegetarian'],
    ingredients: [
      I('eggs', 2),
      I('chopped-tomatoes', 200),
      I('bell-pepper', 0.5),
      I('onion', 0.5),
      I('garlic', 0.25),
      I('cumin', 2, ['smoked-paprika']),
      I('feta', 50),
      I('pita', 1.5, ['sourdough']),
    ],
    pantry: ['Olive oil', 'Salt'],
    steps: [
      'Slice the onion and pepper. Fry in oil for 5 minutes until soft.',
      'Add garlic and cumin and cook for 1 minute.',
      'Pour in the chopped tomatoes and simmer for 5 minutes.',
      'Make 4 small wells and crack in the eggs. Cover and cook for 6 minutes.',
      'Crumble over the feta. Warm the pita and serve straight from the pan.',
    ],
  },
  {
    id: 'noodle-stir-fry',
    name: 'Chicken & vegetable noodle stir-fry',
    short: 'Quick wok dinner with soy and garlic',
    minutes: 20,
    baseServings: 2,
    image: '/img/noodle-stir-fry.jpg',
    hue: 30,
    tags: [],
    ingredients: [
      I('chicken', 150, ['tofu']),
      I('egg-noodles', 100, ['rice-noodles']),
      I('wok-veg', 200),
      I('soy-sauce', 20),
      I('garlic', 0.25),
    ],
    pantry: ['Cooking oil'],
    steps: [
      'Cook the noodles for 4 minutes, then drain.',
      'Slice the chicken into strips and fry in a hot wok for 5 minutes.',
      'Add garlic and the frozen vegetables. Stir-fry for 4 minutes.',
      'Add the noodles and soy sauce. Toss for 2 minutes and serve.',
    ],
  },
  {
    id: 'salmon-potatoes',
    name: 'Salmon with baby potatoes & broccoli',
    short: 'A Norwegian weeknight classic',
    minutes: 25,
    baseServings: 2,
    image: '/img/salmon-potatoes.jpg',
    hue: 15,
    tags: ['pescetarian', 'gluten-free'],
    ingredients: [
      I('salmon', 1, ['cod']),
      I('potatoes', 250, ['carrots']),
      I('broccoli', 0.5, ['peas']),
      I('lemon', 0.5),
    ],
    pantry: ['Butter or oil', 'Salt & pepper'],
    steps: [
      'Boil the potatoes in salted water for 18 minutes.',
      'Cut the broccoli into florets. Add to the potatoes for the last 4 minutes.',
      'Season the salmon and fry skin-side down for 5 minutes, then 2 minutes on the other side.',
      'Serve with lemon wedges and a little butter on the potatoes.',
    ],
  },
  {
    id: 'taco-friday',
    name: 'Taco Friday with all the toppings',
    short: 'The Norwegian family favourite',
    minutes: 25,
    baseServings: 4,
    image: '/img/taco-friday.jpg',
    hue: 30,
    tags: [],
    ingredients: [
      I('beef-mince', 100, ['plant-mince']),
      I('tortillas', 2),
      I('taco-spice', 7),
      I('salsa', 57.5),
      I('grated-cheese', 37.5),
      I('iceberg', 0.25),
      I('cucumber', 0.25),
      I('cherry-tomatoes', 62.5),
      I('sour-cream', 75),
    ],
    pantry: ['Cooking oil'],
    steps: [
      'Brown the mince in a hot pan for 6 minutes.',
      'Add the taco spice and 1 dl water. Simmer for 5 minutes.',
      'Chop the lettuce, cucumber and tomatoes.',
      'Warm the tortillas in a dry pan or the oven.',
      'Put everything on the table and let everyone build their own tacos.',
    ],
  },
  {
    id: 'bean-chili',
    name: 'Smoky three-bean chili with rice',
    short: 'Hearty, cheap and fully plant-based',
    minutes: 30,
    baseServings: 2,
    image: '/img/bean-chili.jpg',
    hue: 5,
    tags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      I('kidney-beans', 205, ['butter-beans']),
      I('black-beans', 205, ['chickpeas']),
      I('chopped-tomatoes', 200),
      I('onion', 0.5),
      I('garlic', 0.25),
      I('bell-pepper', 0.5),
      I('smoked-paprika', 3, ['cumin']),
      I('jasmine-rice', 75, ['quick-rice']),
    ],
    pantry: ['Cooking oil', 'Salt'],
    steps: [
      'Start the rice: 300 ml water, 12 minutes.',
      'Fry chopped onion, garlic and pepper for 5 minutes.',
      'Add smoked paprika, then the tomatoes and drained beans.',
      'Simmer for 15 minutes until thick. Season and serve with rice.',
    ],
  },
  {
    id: 'fish-cakes',
    name: 'Fish cakes with potatoes & carrots',
    short: 'Classic Norwegian fiskekaker',
    minutes: 25,
    baseServings: 2,
    image: '/img/fish-cakes.jpg',
    hue: 40,
    tags: ['pescetarian'],
    ingredients: [
      I('fish-cakes', 3),
      I('potatoes', 250),
      I('carrots', 150, ['peas', 'broccoli']),
    ],
    pantry: ['Butter', 'Salt'],
    steps: [
      'Boil the potatoes for 18 minutes.',
      'Peel and slice the carrots. Boil for 8 minutes.',
      'Fry the fish cakes in butter for 3 minutes on each side.',
      'Serve with the potatoes, carrots and a little melted butter.',
    ],
  },
];

export const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
export const recipeById = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const aisleByN = Object.fromEntries(AISLES.map((a) => [a.n, a]));

// One function for aisle text, used everywhere.
export function aisleShort(product) {
  const a = aisleByN[product.aisle];
  return `Aisle ${a.n} · ${a.name}`;
}
export function aisleLabel(product) {
  return `${aisleShort(product)} · ${lowerFirst(product.spot)}`;
}
function lowerFirst(s) {
  if (/^(Asian|Tex-Mex)\b/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export const SAMPLE_SCANS = ['chickpeas', 'coconut-milk', 'salmon', 'penne', 'eggs', 'jasmine-rice', 'chopped-tomatoes'];
