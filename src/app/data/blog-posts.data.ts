import { BlogPost } from './blog-post.model';

const mothersDayImagePath = '/assets/blog/mothers-day-baking';
const sweetTurkeyBowlImagePath = '/assets/blog/chef-eds-sweet-turkey-bowl';
const recipeSenseiDownloadUrl = 'https://apps.apple.com/us/app/recipesensei/id6759845210';

export const blogPosts: BlogPost[] = [
  {
    title: "Chef Ed's Sweet Turkey Bowl",
    slug: 'chef-eds-sweet-turkey-bowl',
    eyebrow: 'Recipe submissions',
    date: 'May 15, 2026',
    summary: 'A simple, healthy, in one bowl meal; my first shot at a submitted recipe!',
    heroImage: {
      src: `${sweetTurkeyBowlImagePath}/hero-assembled-in-sun.jpeg`,
      alt: 'Finished sweet turkey bowl with sweet potato, avocado, cottage cheese, Tajín, and lime',
    },
    recipeTitle: 'Sweet Turkey Bowl',
    submittedBy: 'Chef Ed',
    recipeCredit: 'Recipe credit goes to Edgar Sandoval.',
    body: [
      'When I first saw "Chef Ed" as the author of the first recipe submission to me, I thought I was going to have to eat sardines for sure. Luckily, he spared me his unappetizing snack of choice and submitted something that I was not sure really all went together.',
      'He gave me quite a bit of creative freedom, which I appreciate, as the "recipe" was:',
      'A bowl of: ground turkey, sweet potato, avocado, cottage cheese, and Tajín.',
      'Not much for direction in this one, but I gave it a shot.',
      'First off, I diced an onion and started sauteing it to add flavor and another texture. I was absolutely not taking a trip to the store just for ground turkey, so we used ground pork instead.',
      'Knowing the Tajín needed to be added eventually, I went for chili powder, garlic powder or garlic salt, a bit of cayenne pepper, and black pepper on the meat as I browned it. With pork, it is more like "greyed" than browned, but we made it work.',
      'After microwaving the sweet potato for a few minutes, I cubed it, tossed it in oil, garlic salt, and pepper, and threw it in the oven at 450°F to roast for around 20 minutes.',
      'I went for a rough chop on the avocado and added it cold, along with a dollop of cottage cheese. I topped it all off with a generous dash of Tajín and a little squeeze of lime.',
      'Now, I was told I took a bit of liberties with ingredients and seasoning. I do warn about this in the submission section. But this was a hit with the whole family! It felt light but filling, with a mild spice and a fresh zing from the lime and Tajín.',
      "Overall, in its final form, I'd give it a 9/10 for us!",
      'Below is a recipe you can download, or you can download RecipeSensei for iOS and use the other button to import the recipe.',
    ],
    recipeNotes: [
      "Chef Ed's original submission was ground turkey, sweet potato, avocado, cottage cheese, and Tajín.",
      'I used ground pork, added onion and extra seasoning, roasted the sweet potato, and finished the bowl with lime.',
      'My final rating: 9/10.',
    ],
    recipeDownload: {
      label: 'Download Recipe',
      href: '/recipes/chef-eds-sweet-turkey-bowl-recipe.pdf',
      download: 'chef-eds-sweet-turkey-bowl-recipe.pdf',
      ariaLabel: "Download Chef Ed's Sweet Turkey Bowl recipe",
    },
    recipeSenseiImport: {
      label: 'Import into RecipeSensei',
      href: '/recipesensei/imports/chef-eds-sweet-turkey-bowl.recipesensei.json',
      download: 'chef-eds-sweet-turkey-bowl.recipesensei.json',
      ariaLabel: "Download Chef Ed's Sweet Turkey Bowl RecipeSensei import file",
    },
    recipeSenseiApp: {
      label: 'Download RecipeSensei',
      href: recipeSenseiDownloadUrl,
      external: true,
      ariaLabel: 'Download RecipeSensei on the App Store, opens in a new tab',
    },
    importNote:
      'For now, the RecipeSensei import button downloads a JSON file that can become the app import format.',
    galleryTitle: 'A few scenes from the cook.',
    gallery: [
      {
        src: `${sweetTurkeyBowlImagePath}/1-oiled-sweet-potatoes.jpeg`,
        alt: 'Sweet potato pieces tossed with oil and seasoning before roasting',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/2-sauteeing-onions.jpeg`,
        alt: 'Diced onion sauteing in a pan for the bowl',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/seasonings-used.jpeg`,
        alt: 'Seasonings used for the sweet turkey bowl',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/3-browning-pork.jpeg`,
        alt: 'Ground pork cooking with onion and spices',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/4-roasted-sweet-potatoes.jpeg`,
        alt: 'Roasted sweet potato pieces for the bowl',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/5-assembled-without-cheese.jpeg`,
        alt: 'Sweet turkey bowl assembled with meat, sweet potato, avocado, and lime before cottage cheese',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/6-assembled-with-cheese.jpeg`,
        alt: 'Sweet turkey bowl topped with cottage cheese before the final Tajín',
      },
      {
        src: `${sweetTurkeyBowlImagePath}/7-finished-bowl.jpeg`,
        alt: 'Finished sweet turkey bowl with sweet potato, avocado, cottage cheese, Tajín, and lime',
      },
    ],
  },
  {
    title: 'The One Day a Year I Bake',
    slug: 'mothers-day-baking',
    eyebrow: 'Food stories',
    date: 'May 10, 2026',
    summary: 'A family tradition that continues to challenge me year after year.',
    heroImage: {
      src: `${mothersDayImagePath}/mothers_day_11.jpeg`,
      alt: "Finished cheese danishes cooling after a Mother's Day bake",
    },
    recipeTitle: 'Cheese Danish',
    body: [
      "If you've followed my cooking for a while, you will have noticed there is one area of cooking I don't feature a whole lot: baking.",
      "I'm asked every now and then if I was the one who made the desserts we brought to a party, to which the answer is almost always, \"Oh no, I don't bake; that is all Clarissa.\" I just don't enjoy baking! It's too precise. If you tweak or substitute one little thing, your cake doesn't rise. If you want to add some fruit for flavor, your filling is too runny.",
      "It probably doesn't help that my wife is an AMAZING baker/dessert artist. I'm not a sweets guy (savory fan here), but I still get sick from eating too much of her desserts.",
      "One of the few exceptions to the rule is Mother's Day. Our tradition is a tea party brunch for Clarissa and the girls! It's become more fun every year as they grow up, and each year I end up baking in some capacity.",
      "This year is one of my favorite breakfast desserts (because come on, this isn't a healthy breakfast): the cheese danish! I will link the recipe I used as a base below, but the hardest part in the recipe is finding puff pastry at the store. At Hy-Vee it is in the frozen desserts section... wild.",
      "Me being me, I couldn't just execute the recipe as instructed. We had an excess of fruit from Manna's first birthday party, so I made a quick blackberry jam and mixed that with half of the cream cheese filling.",
      'Results were sort of mixed and needed a little post-bake prettifying, probably due to my lack of a delicate hand, but hey, I only practice these skills once a year; give me a break.',
    ],
    recipeNotes: [
      "Started with Sugar Spun Run's cheese danish recipe as the base.",
      'Added a quick blackberry jam to half of the cream cheese filling.',
      'Puff pastry was hiding in the frozen desserts section at Hy-Vee.',
    ],
    sourceRecipe: {
      label: 'Cheese Danish - Sugar Spun Run',
      href: 'https://sugarspunrun.com/cheese-danish/',
    },
    recipeSenseiImport: {
      label: 'Import the cheese danish notes to RecipeSensei',
      href: '/recipesensei/imports/mothers-day-cheese-danish.json',
    },
    importNote: 'Tap the RecipeSensei import link, then open it with RecipeSensei when prompted.',
    galleryTitle: 'A few scenes from the bake.',
    gallery: [
      {
        src: `${mothersDayImagePath}/mothers_day_1.jpeg`,
        alt: 'Puff pastry and baking ingredients laid out for cheese danishes',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_2.jpeg`,
        alt: 'Cheese danish filling being prepared in a mixing bowl',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_3.jpeg`,
        alt: 'Blackberries cooking down into a quick jam',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_4.jpeg`,
        alt: 'Cream cheese filling mixed with blackberry jam',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_5.jpeg`,
        alt: 'Puff pastry pieces arranged before baking',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_6.jpeg`,
        alt: 'Cheese danishes assembled on a baking sheet',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_7.jpeg`,
        alt: 'Baked cheese danishes fresh from the oven',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_8.jpeg`,
        alt: 'Cheese danishes after post-bake finishing touches',
      },
      {
        src: `${mothersDayImagePath}/mothers_day_9.jpeg`,
        alt: "Mother's Day cheese danishes plated for brunch",
      },
      {
        src: `${mothersDayImagePath}/mothers_day_10.jpeg`,
        alt: "Finished cheese danishes ready for the Mother's Day tea party brunch",
      },
    ],
  },
];

export const currentBlogPost = blogPosts[0] as BlogPost;
