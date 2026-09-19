import {
  Bird,
  Bug,
  Droplets,
  Flower2,
  Recycle,
  Salad,
  Sprout,
  TreeDeciduous,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { db } from "./db";

export type ActionTheme = "pollinators" | "water" | "food" | "soil" | "habitat" | "community";

export const ACTION_THEME_LABELS: Record<ActionTheme, string> = {
  pollinators: "Pollinators",
  water: "Water",
  food: "Food",
  soil: "Soil",
  habitat: "Habitat",
  community: "Community",
};

export interface GreenAction {
  id: string;
  title: string;
  tagline: string;
  theme: ActionTheme;
  icon: LucideIcon;
  effort: string;
  cost: "Free" | "Low cost";
  steps: string[];
  why: string;
  /** Catalog slugs that suit this action. */
  plants: string[];
}

export const GREEN_ACTIONS: GreenAction[] = [
  {
    id: "pollinator-patch",
    title: "Plant a pollinator patch",
    tagline: "A corner of flowers that feeds bees and butterflies from spring to autumn.",
    theme: "pollinators",
    icon: Flower2,
    effort: "A weekend",
    cost: "Low cost",
    steps: [
      "Pick a sunny spot, even a few pots or a window box will do.",
      "Choose flowers that bloom at different times so something is always open.",
      "Mix flower shapes: flat daisies, tubes, and clusters suit different insects.",
      "Skip pesticides on and around the patch, and leave a shallow dish of water with stones.",
    ],
    why: "Many bees and hoverflies struggle to find flowers in built-up areas. Even a small patch is a useful stopover, and the pollinators help nearby food plants too.",
    plants: ["lavender", "borage", "zinnia", "echinacea", "sunflower", "marigold"],
  },
  {
    id: "windowsill-herbs",
    title: "Start a windowsill herb garden",
    tagline: "Fresh herbs a step from the kitchen, with no packaging.",
    theme: "food",
    icon: Salad,
    effort: "20 minutes",
    cost: "Low cost",
    steps: [
      "Use pots with drainage holes, or reuse tins and jars with holes punched in the bottom.",
      "Start with basil, chives, parsley and mint, and give them your brightest window.",
      "Pick little and often; regular picking keeps herbs bushy.",
      "Keep mint in its own pot so it doesn't crowd out the others.",
    ],
    why: "Growing what you cook with cuts packaging and the waste from bunches that wilt before you use them, and it costs very little.",
    plants: ["basil", "chives", "parsley", "mint"],
  },
  {
    id: "start-compost",
    title: "Start composting kitchen scraps",
    tagline: "Turn peelings and leaves into free plant food.",
    theme: "soil",
    icon: Recycle,
    effort: "An afternoon",
    cost: "Free",
    steps: [
      "Choose a bin, a heap in a corner, or a lidded bucket for a balcony.",
      "Layer 'greens' (fruit and vegetable scraps, coffee grounds) with 'browns' (dry leaves, torn cardboard).",
      "Keep it damp like a wrung-out sponge and turn it every couple of weeks.",
      "Leave out meat, dairy and cooked food, which attract pests.",
    ],
    why: "Food scraps that rot in landfill release methane, a potent greenhouse gas. Composting keeps them out and returns nutrients to your soil.",
    plants: ["tomato", "kale", "green-bean"],
  },
  {
    id: "mulch-beds",
    title: "Mulch your beds and pots",
    tagline: "A layer of cover that saves water and suppresses weeds.",
    theme: "water",
    icon: Droplets,
    effort: "30 minutes",
    cost: "Free",
    steps: [
      "Water the soil first, then spread 5 to 8 cm of mulch over it.",
      "Use what you have: dry leaves, straw, grass clippings, or wood chips.",
      "Keep mulch a few centimetres from stems to prevent rot.",
      "Top it up once or twice a year.",
    ],
    why: "Bare soil loses water fast. Mulch slows evaporation, keeps roots cooler in heat, and feeds the soil as it breaks down.",
    plants: ["tomato", "strawberry", "rosemary"],
  },
  {
    id: "catch-rain",
    title: "Catch rainwater",
    tagline: "Free, soft water that plants prefer to tap water.",
    theme: "water",
    icon: Waves,
    effort: "An hour",
    cost: "Low cost",
    steps: [
      "Put a bucket or barrel under a downpipe, with a lid to keep out mosquitoes and debris.",
      "Use a fine mesh over the opening to catch leaves.",
      "Water from a can rather than a hose, straight at the roots.",
      "Check any local rules on rainwater collection first.",
    ],
    why: "Every can of rainwater is one less drawn from the mains, and plants often do better on it, especially houseplants sensitive to tap water salts.",
    plants: ["spider-plant", "peace-lily", "tomato"],
  },
  {
    id: "clover-lawn",
    title: "Swap some lawn for clover or wildflowers",
    tagline: "Less mowing, less watering, more bees.",
    theme: "pollinators",
    icon: Sprout,
    effort: "A weekend",
    cost: "Low cost",
    steps: [
      "Pick a patch of lawn and stop mowing it as often, or scratch the surface and sow clover seed.",
      "Sow in spring or autumn and keep it damp until it establishes.",
      "Mow high, and let some flowers open before you cut.",
      "Leave the clippings where they fall to feed the soil.",
    ],
    why: "Clover fixes nitrogen from the air, so it needs little fertiliser, stays green in dry spells, and its flowers are a reliable food source for bees.",
    plants: ["white-clover"],
  },
  {
    id: "grow-nitrogen-fixers",
    title: "Grow beans or peas to feed your soil",
    tagline: "Crops that leave the bed better than they found it.",
    theme: "soil",
    icon: Sprout,
    effort: "A weekend",
    cost: "Low cost",
    steps: [
      "Sow beans or peas where hungry crops like tomatoes or leafy greens grew last year.",
      "Give them a trellis or canes to climb.",
      "After harvest, cut plants at the base and leave the roots in the soil.",
      "Follow with a leafy crop that will use the nitrogen they leave behind.",
    ],
    why: "Legumes work with soil bacteria to capture nitrogen from the air. Rotating them through your beds reduces the need for bought fertiliser.",
    plants: ["green-bean", "pea"],
  },
  {
    id: "wild-corner",
    title: "Leave a wild corner",
    tagline: "A little untidiness is a lot of habitat.",
    theme: "habitat",
    icon: Bird,
    effort: "Nothing to do",
    cost: "Free",
    steps: [
      "Pick a corner and let leaves, twigs and long grass build up.",
      "Stack a few logs or stones, or bundle hollow stems for solitary bees.",
      "Delay cutting back seed heads until spring so birds can eat from them.",
      "Add a shallow water dish with a stone for insects to land on.",
    ],
    why: "Insects, hedgehogs and birds shelter and overwinter in leaf litter and hollow stems. Tidy gardens take away those homes.",
    plants: ["echinacea", "white-clover"],
  },
  {
    id: "gentle-pest-control",
    title: "Try gentle pest control first",
    tagline: "Soap spray, neem oil and companion plants before harsh chemicals.",
    theme: "habitat",
    icon: Bug,
    effort: "10 minutes",
    cost: "Low cost",
    steps: [
      "Knock aphids off with a jet of water, and hand-pick larger pests.",
      "Spray with diluted neem oil or a mild soap solution in the evening, not in strong sun.",
      "Plant marigolds, nasturtiums and herbs to draw in predatory insects.",
      "Spray only affected plants so you don't harm bees and other beneficial insects.",
    ],
    why: "Broad-spectrum pesticides kill pollinators and predators along with pests. Starting gentle protects the insects that do the work for you.",
    plants: ["marigold", "nasturtium", "basil"],
  },
  {
    id: "seed-swap",
    title: "Save seeds and swap with neighbours",
    tagline: "Free plants, and a more varied local garden.",
    theme: "community",
    icon: Users,
    effort: "An hour",
    cost: "Free",
    steps: [
      "Let a few of your healthiest beans, peas, sunflowers or marigolds go to seed.",
      "Dry the seeds fully, then store them in labelled paper envelopes.",
      "Trade with neighbours, friends, or a local seed library.",
      "Share cuttings too: pothos, mint and spider plant babies root easily.",
    ],
    why: "Sharing keeps plants in use instead of bought new, and locally adapted seed tends to do well in local conditions.",
    plants: ["green-bean", "sunflower", "marigold", "pothos"],
  },
  {
    id: "peat-free",
    title: "Switch to peat-free potting mix",
    tagline: "Protect peatlands, which lock away huge stores of carbon.",
    theme: "soil",
    icon: Recycle,
    effort: "Next time you pot up",
    cost: "Low cost",
    steps: [
      "Look for 'peat-free' on the bag, or make your own from compost, coir and sand or grit.",
      "Mix in a handful of compost for nutrients.",
      "Reuse old potting mix by refreshing it with compost.",
      "Ask your local nursery what they stock.",
    ],
    why: "Peatlands are among the planet's biggest stores of carbon. Digging peat for potting mix releases it, and peat-free alternatives now work well.",
    plants: ["aloe-vera", "tomato", "monstera"],
  },
  {
    id: "plant-a-tree",
    title: "Plant a tree that suits your place",
    tagline: "Shade, habitat, and carbon storage for decades.",
    theme: "habitat",
    icon: TreeDeciduous,
    effort: "A day",
    cost: "Low cost",
    steps: [
      "Choose a species that grows naturally in your area and fits the space at full size.",
      "Plant in the cool season when there's rain, and dig a wide hole rather than a deep one.",
      "Water deeply while it's young and mulch around the base.",
      "Can't plant your own? Join a community planting day or support a local group.",
    ],
    why: "A well-chosen tree shades buildings, cools streets, shelters wildlife, and stores carbon as it grows. Fit matters more than the number planted.",
    plants: ["moringa", "spekboom"],
  },
];

export async function toggleActionDone(actionId: string): Promise<boolean> {
  const existing = await db.actionLog.where("actionId").equals(actionId).toArray();
  if (existing.length > 0) {
    await db.actionLog.bulkDelete(existing.map((entry) => entry.id));
    return false;
  }
  await db.actionLog.add({ id: crypto.randomUUID(), actionId, doneAt: Date.now() });
  return true;
}

export interface ImpactLevel {
  name: string;
  next?: { name: string; at: number };
}

/** A playful ladder based on how many green actions are ticked off. */
export function impactLevel(done: number): ImpactLevel {
  const ladder = [
    { name: "Seedling", at: 0 },
    { name: "Sprout", at: 2 },
    { name: "Gardener", at: 5 },
    { name: "Green thumb", at: 8 },
    { name: "Planet guardian", at: 11 },
  ];
  let index = 0;
  ladder.forEach((rung, i) => {
    if (done >= rung.at) index = i;
  });
  const next = ladder[index + 1];
  return { name: ladder[index].name, next: next ? { name: next.name, at: next.at } : undefined };
}
