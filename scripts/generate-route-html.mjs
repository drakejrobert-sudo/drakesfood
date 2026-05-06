import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = 'https://drakesfood.com';
const defaultImageUrl = `${siteUrl}/assets/images/margaritaOoniPizza.jpeg`;
const defaultImageAlt = 'Margherita pizza fresh from the Ooni oven with melted mozzarella and basil';
const outputRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'drakesfood-app', 'browser');

const pageMetadata = {
  '/gallery': {
    title: "Food Gallery | Drake's Food",
    description: "Browse Drake's Food photos, including smoked meats, backyard pizza, family meals, and home-cooking experiments.",
    canonicalPath: '/gallery',
  },
  '/recipes': {
    title: "Recipes & Stories | Drake's Food",
    description: "Follow future Drake's Food recipes, kitchen notes, food experiments, family favorites, and cooking stories.",
    canonicalPath: '/recipes',
  },
  '/submit': {
    title: "Submit a Recipe Idea | Drake's Food",
    description: "Send Drake a recipe idea, family dish, cooking challenge, or food link for possible future Drake's Food inspiration.",
    canonicalPath: '/submit',
  },
  '/submit-idea': {
    title: "Submit a Recipe Idea | Drake's Food",
    description: "Send Drake a recipe idea, family dish, cooking challenge, or food link for possible future Drake's Food inspiration.",
    canonicalPath: '/submit',
  },
  '/recipesensei': {
    title: "RecipeSensei | Drake's Food",
    description: "RecipeSensei is Drake's recipe-saving and cooking companion app, available for iPhone and iPad on the App Store.",
    canonicalPath: '/recipesensei',
  },
  '/about': {
    title: "About | Drake's Food",
    description: "Learn about Drake's Food, a personal, photo-forward home for cooking, food photography, Instagram updates, and recipe ideas.",
    canonicalPath: '/about',
  },
  '/recipesensei/support': {
    title: "RecipeSensei Support | Drake's Food",
    description: "Get support information for RecipeSensei, Drake's recipe-saving and cooking companion app.",
    canonicalPath: '/recipesensei/support',
  },
  '/recipesensei/privacy': {
    title: "RecipeSensei Privacy Policy | Drake's Food",
    description: "Review the privacy policy for RecipeSensei, Drake's recipe-saving and cooking companion app.",
    canonicalPath: '/recipesensei/privacy',
  },
};

const indexHtml = await readFile(join(outputRoot, 'index.html'), 'utf8');

await Promise.all(
  Object.entries(pageMetadata).map(async ([routePath, metadata]) => {
    const routeHtml = applyMetadata(indexHtml, metadata);
    const routeIndexPath = join(outputRoot, routePath.slice(1), 'index.html');

    await mkdir(dirname(routeIndexPath), { recursive: true });
    await writeFile(routeIndexPath, routeHtml);
  }),
);

console.log(`Generated route metadata HTML for ${Object.keys(pageMetadata).length} routes.`);

function applyMetadata(html, metadata) {
  const canonicalUrl = `${siteUrl}${metadata.canonicalPath}`;

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, metaName('description', metadata.description))
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, metaProperty('og:title', metadata.title))
    .replace(/<meta property="og:description" content="[^"]*">/, metaProperty('og:description', metadata.description))
    .replace(/<meta property="og:url" content="[^"]*">/, metaProperty('og:url', canonicalUrl))
    .replace(/<meta property="og:image" content="[^"]*">/, metaProperty('og:image', defaultImageUrl))
    .replace(/<meta property="og:image:alt" content="[^"]*">/, metaProperty('og:image:alt', defaultImageAlt))
    .replace(/<meta name="twitter:title" content="[^"]*">/, metaName('twitter:title', metadata.title))
    .replace(/<meta name="twitter:description" content="[^"]*">/, metaName('twitter:description', metadata.description))
    .replace(/<meta name="twitter:image" content="[^"]*">/, metaName('twitter:image', defaultImageUrl))
    .replace(/<meta name="twitter:image:alt" content="[^"]*">/, metaName('twitter:image:alt', defaultImageAlt));
}

function metaName(name, content) {
  return `<meta name="${name}" content="${escapeHtml(content)}">`;
}

function metaProperty(property, content) {
  return `<meta property="${property}" content="${escapeHtml(content)}">`;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
