import { BlogPost } from './blog-post.model';

const mothersDayImagePath = '/assets/blog/mothers-day-baking';
const sweetTurkeyBowlImagePath = '/assets/blog/chef-eds-sweet-turkey-bowl';
const mexicanStreetCornImagePath = '/assets/blog/drews-mexican-street-corn';
const mediterraneanChickenPastaImagePath = '/assets/blog/mediterranean-chicken-pasta';
const recipeSenseiDownloadUrl = 'https://apps.apple.com/us/app/recipesensei/id6759845210';

export const blogPosts: BlogPost[] = [
  {
    title: 'Mediterranean Chicken Pasta',
    slug: 'mediterranean-chicken-pasta',
    eyebrow: 'Recipe submissions',
    date: 'August 2, 2026',
    summary:
      'Savory penne tossed with a bright tomato-spinach sauce, grilled Italian chicken, feta, and fresh parsley.',
    heroImage: {
      src: `${mediterraneanChickenPastaImagePath}/hero-finished-pasta.jpeg`,
      alt: 'Mediterranean chicken pasta with sliced chicken, tomato sauce, feta, and parsley in a wide bowl',
    },
    recipeTitle: 'Mediterranean Chicken Pasta',
    body: [
      "Finally, another non-dessert submission! Don't get me wrong, I appreciate any submission, and the desserts have really been challenging my less-used cooking skills, but I have been itching to get back to something savory. This is also the first submitter who asked to remain anonymous. Ooooo, mysterious...",
      "The recipe is a Mediterranean pasta with chicken. The chicken was technically optional, but of course I took that option. I'm a big meat guy. This is one of those dishes I have seen in many a picture, always looking gorgeous, tasty, and extremely photogenic. I did not have much confidence mine would match those standards, but I am more of a flavor-over-photo kind of home cook.",
      "I started with olive oil in the pan and began sauteing a diced onion. That was not in the original recipe, but for some reason, if I am making a red sauce, I always start with diced onion in olive oil. Once it had softened, I added the minced garlic and sauteed everything until fragrant. Then I dumped in a whole 28-ounce can of San Marzano-style tomatoes and crushed them in the pan. I stirred in the basil and oregano, turned the heat to low, and let the sauce simmer for a good 15 to 20 minutes.",
      'Meanwhile, I had a little prep to do for the smoker grill. I seasoned two chicken breasts with garlic salt, black pepper, and Italian seasoning, then threw them on the grill. I cooked them to a nice medium-rare temperature... kidding. I am a stickler about properly cooking chicken, especially with a pregnant wife in the house. I used a thermometer to make sure the thickest part reached 165°F, then gave the chicken about five minutes to rest so the juices could settle back in.',
      'Sometime during all of that, I dropped the penne into boiling, salted water. Once the sauce had simmered for about 15 minutes, I nestled the rested chicken breasts into it, spooned some sauce over the top, and let them warm through briefly. Then I pulled the chicken back out, tossed in the spinach, and cranked the heat up to medium for 30 to 60 seconds. I added a splash of pasta water to help the sauce come together and thin out a bit, stirred in the penne until it was coated, and killed the heat.',
      'That final push, when everything is coming together, is one of the most stressful and most satisfying feelings in the world, assuming everything goes well. You have four, five, six things going, all with their own timelines and perfect moments to pull, and lining them up efficiently is an art learned the hard way. Then, after all that, you still have to try to pull together a pretty plate.',
      'I reached for my handy wide salad-and-pasta bowl and piled in the penne and sauce. On top went the sliced Italian chicken, plenty of crumbled feta, and parsley for that last bit of color. What a meal!',
    ],
    recipeNotes: [
      'This cooked version uses a 28-ounce can of San Marzano-style tomatoes, a diced onion, and grilled chicken as part of the main dish.',
      'Let the sauce simmer for 15 to 20 minutes, wilt the spinach for only 30 to 60 seconds, and use a splash of pasta water to bring everything together.',
      'Cook the chicken to 165°F, rest it for about five minutes, then briefly finish the whole breasts in the tomato sauce before slicing them over the pasta and adding feta and parsley.',
    ],
    recipeDownload: {
      label: 'Download Recipe',
      href: '/recipes/mediterranean-chicken-pasta-recipe.pdf',
      download: 'mediterranean-chicken-pasta-recipe.pdf',
      ariaLabel: 'Download the Mediterranean Chicken Pasta recipe',
    },
    recipeSenseiImport: {
      label: 'Import into RecipeSensei',
      href: '/recipesensei/imports/mediterranean-chicken-pasta.recipesensei',
      download: 'mediterranean-chicken-pasta.recipesensei',
      ariaLabel: 'Download the Mediterranean Chicken Pasta RecipeSensei import file',
    },
    recipeSenseiApp: {
      label: 'Download RecipeSensei',
      href: recipeSenseiDownloadUrl,
      external: true,
      ariaLabel: 'Download RecipeSensei on the App Store, opens in a new tab',
    },
    importNote:
      'Tap the RecipeSensei import file, then use the share arrow and choose Open in RecipeSensei. Or save it and import it from Settings.',
    galleryTitle: 'From the skillet to the finished bowl.',
    gallery: [
      {
        src: `${mediterraneanChickenPastaImagePath}/1-sauteeing-onions.jpeg`,
        alt: 'Diced onion sauteing in olive oil in a large cast-iron skillet',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/2-seasoned-chicken.jpeg`,
        alt: 'Two cooked chicken breasts coated with garlic salt, pepper, and Italian seasoning',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/3-chicken-in-tomato-sauce.jpeg`,
        alt: 'Seasoned chicken breasts set into bright tomato sauce in a cast-iron skillet',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/4-simmered-chicken-and-sauce.jpeg`,
        alt: 'Thick tomato and onion sauce simmered around seasoned chicken breasts',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/5-plated-pasta-with-chicken.jpeg`,
        alt: 'Whole chicken breasts and tomato sauce plated over penne with parsley',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/6-pasta-bowl-with-parsley.jpeg`,
        alt: 'Mediterranean chicken and tomato sauce arranged over penne in a wide bowl',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/7-sliced-chicken-with-feta.jpeg`,
        alt: 'Sliced chicken over penne and tomato sauce with crumbled feta and parsley',
      },
      {
        src: `${mediterraneanChickenPastaImagePath}/hero-finished-pasta.jpeg`,
        alt: 'Finished Mediterranean chicken pasta topped with feta and fresh parsley',
      },
    ],
  },
  {
    title: "Drew's Mexican Street Corn",
    slug: 'drews-mexican-street-corn',
    eyebrow: 'Family recipes',
    date: 'May 29, 2026',
    summary: 'A smoky, creamy, slightly charred spin on Mexican street corn for taco night.',
    heroImage: {
      src: `${mexicanStreetCornImagePath}/5-taquitos-on-corn-with-tajin.JPG`,
      alt: 'Homemade taquitos served over creamy Mexican street corn and topped with Tajín',
    },
    recipeTitle: 'Mexican Street Corn',
    submittedBy: 'Drew',
    recipeCredit: 'Recipe inspiration credit goes to Drew.',
    body: [
      "Drew made this in bulk for our Mother's Day celebration at our mom's house. It was a delicious, creamy topping for the taco bar we had, and then he tasked me with \"enhancing\" and \"fancying up\" the recipe, which I gladly attempted.",
      'Now, what I know about Mexican street corn is mostly from movies and the massive amount of Food Network content I have seen. What I always think of is corn on the cob roasted over fire, coated in some creamy sauce, usually sprinkled with a red spice like chili powder or paprika, and potentially some cheese.',
      'With all of that in mind, I wanted to maintain the essence of the recipe as more of a creamy corn dish than the traditional corn-on-the-cob situation, while still pulling in some of those same street corn notes of flavor.',
      'I started by brushing the corn with mayo to get that flavor incorporated, then threw the ears on my smoker grill along with some kielbasa I most definitely charred due flare-ups while I was asleep at the grill. I cooked the corn around 15 to 20 minutes at roughly 350°F while rotating it, those flare-ups helping add some extra char.',
      'I sliced the corn off the cob and started with a couple knobs of melted butter in a pot. I tossed in all six ears of kernels and seasoned them with pepper, garlic powder, chili powder, paprika, and cayenne.',
      'Once everything smelled fragrant, I added some mayonnaise and a bit of sour cream until I got the texture I wanted. I also did a squirt of hot sauce for good measure. I basically cooked the mixture, stirring occasionally, until it was hot and creamy, then served it as a bed for my homemade taquitos and topped the whole lot with a bit of Tajín.',
      'Now, do I expect you to go buy fresh corn, bust out the grill, char it, try to figure out what completely random amounts of seasonings and ingredients I used, and throw together my version of Mexican street corn for your next family taco party? Yeah, I think I do.',
      'The smoky, slightly charred flavor played so nicely with the spices, and the Tajín topping gave a little zingy freshness to cut through some of that decadent fat from the mayo and sour cream. The extra effort added more layers of flavor, where the sum of its parts had their own individual jobs and came together in a bite that just felt right.',
      "Don't get me wrong, the original recipe Drew shared had good taste and was most definitely Mexican street corn, in the way that a Taco Bell taco is a taco. I'll knock down some Taco Bell. It is delicious. But would I say there were many layers of flavor there? Not unless we are talking about that Crunchwrap Supreme; that thing is a stroke of genius.",
    ],
    recipeNotes: [
      "Drew's original version was a creamy Mexican street corn-style topping for a Mother's Day taco bar.",
      'I brushed the corn with mayo before grilling, then charred it on the smoker grill at about 350°F for 15 to 20 minutes.',
      'The finished version uses butter, mayo, sour cream, warm spices, hot sauce, and optional Tajín.',
    ],
    recipeDownload: {
      label: 'Download Recipe',
      href: '/recipes/drews-mexican-street-corn-recipe.pdf',
      download: 'drews-mexican-street-corn-recipe.pdf',
      ariaLabel: "Download Drew's Mexican Street Corn recipe",
    },
    recipeSenseiImport: {
      label: 'Import into RecipeSensei',
      href: '/recipesensei/imports/drews-mexican-street-corn.recipesensei',
      download: 'drews-mexican-street-corn.recipesensei',
      ariaLabel: "Download Drew's Mexican Street Corn RecipeSensei import file",
    },
    recipeSenseiApp: {
      label: 'Download RecipeSensei',
      href: recipeSenseiDownloadUrl,
      external: true,
      ariaLabel: 'Download RecipeSensei on the App Store, opens in a new tab',
    },
    importNote:
      'Tap the RecipeSensei import file, then use the share arrow and choose Open in RecipeSensei. Or save it and import it from Settings.',
    galleryTitle: 'A few scenes from the corn upgrade.',
    gallery: [
      {
        src: `${mexicanStreetCornImagePath}/1-charred-corn-and-kielbasa.JPG`,
        alt: 'Charred corn on the grill next to kielbasa after a smoky cook',
      },
      {
        src: `${mexicanStreetCornImagePath}/2-ingredients-picture.JPG`,
        alt: 'Ingredients gathered for creamy Mexican street corn, including corn, mayo, sour cream, spices, and hot sauce',
      },
      {
        src: `${mexicanStreetCornImagePath}/3-street-corn-in-pot.JPG`,
        alt: 'Creamy Mexican street corn cooking in a pot with spices',
      },
      {
        src: `${mexicanStreetCornImagePath}/4-taquitos-on-corn.jpeg`,
        alt: 'Homemade taquitos served on a bed of creamy Mexican street corn',
      },
      {
        src: `${mexicanStreetCornImagePath}/5-taquitos-on-corn-with-tajin.JPG`,
        alt: 'Finished taquitos over creamy Mexican street corn with a final sprinkle of Tajín',
      },
    ],
  },
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
      href: '/recipesensei/imports/chef-eds-sweet-turkey-bowl.recipesensei',
      download: 'chef-eds-sweet-turkey-bowl.recipesensei',
      ariaLabel: "Download Chef Ed's Sweet Turkey Bowl RecipeSensei import file",
    },
    recipeSenseiApp: {
      label: 'Download RecipeSensei',
      href: recipeSenseiDownloadUrl,
      external: true,
      ariaLabel: 'Download RecipeSensei on the App Store, opens in a new tab',
    },
    importNote:
      'Tap the RecipeSensei import file, then use the share arrow and choose Open in RecipeSensei. Or save it and import it from Settings.',
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
      href: '/recipesensei/imports/mothers-day-cheese-danish.recipesensei',
    },
    importNote:
      'Tap the RecipeSensei import file, then use the share arrow and choose Open in RecipeSensei. Or save it and import it from Settings.',
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
