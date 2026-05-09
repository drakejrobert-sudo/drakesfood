import { BlogPost } from './blog-post.model';

const mothersDayImagePath = '/assets/blog/mothers-day-baking';

export const blogPosts: BlogPost[] = [
  {
    title: 'The One Day a Year I Bake',
    slug: 'mothers-day-baking',
    eyebrow: 'Food stories',
    date: 'May 2026',
    summary: 'A family tradition that continues to challenge me year after year.',
    heroImage: {
      src: `${mothersDayImagePath}/mothers_day_11.jpeg`,
      alt: "Finished cheese danishes cooling after a Mother's Day bake",
    },
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
      'This is more of a story and kitchen note than a fully original recipe.',
    ],
    sourceRecipe: {
      label: 'Cheese Danish - Sugar Spun Run',
      href: 'https://sugarspunrun.com/cheese-danish/',
    },
    recipeSenseiImport: {
      label: 'Import the cheese danish notes to RecipeSensei',
      href: '/recipesensei/imports/mothers-day-cheese-danish.json',
    },
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
