/**
 * Common cafe drink catalog.
 * Used as a reference/autocomplete list when users add drinks to a cafe.
 * Each entry is a template — actual drinks in the DB are tied to specific cafes with prices.
 */

export interface DrinkTemplate {
  name: string;
  category: string;
  description: string;
}

export const DRINK_CATEGORIES = [
  'Coffee',
  'Espresso',
  'Latte',
  'Matcha',
  'Tea',
  'Boba',
  'Smoothie',
  'Specialty',
  'Other',
] as const;

export type DrinkCategory = typeof DRINK_CATEGORIES[number];

export const DRINK_CATALOG: DrinkTemplate[] = [
  // ─── Coffee ───────────────────────────────────────────
  { name: 'Drip Coffee', category: 'Coffee', description: 'Classic brewed coffee' },
  { name: 'Cold Brew', category: 'Coffee', description: 'Slow-steeped cold coffee, smooth and bold' },
  { name: 'Nitro Cold Brew', category: 'Coffee', description: 'Cold brew infused with nitrogen for a creamy pour' },
  { name: 'Iced Coffee', category: 'Coffee', description: 'Brewed coffee served over ice' },
  { name: 'Pour Over', category: 'Coffee', description: 'Hand-poured single-origin coffee' },
  { name: 'French Press', category: 'Coffee', description: 'Full-bodied immersion brewed coffee' },
  { name: 'Vietnamese Coffee', category: 'Coffee', description: 'Strong coffee with sweetened condensed milk' },

  // ─── Espresso ─────────────────────────────────────────
  { name: 'Espresso', category: 'Espresso', description: 'Single or double shot of espresso' },
  { name: 'Americano', category: 'Espresso', description: 'Espresso diluted with hot water' },
  { name: 'Iced Americano', category: 'Espresso', description: 'Espresso with cold water over ice' },
  { name: 'Cortado', category: 'Espresso', description: 'Espresso with an equal part of steamed milk' },
  { name: 'Macchiato', category: 'Espresso', description: 'Espresso with a dollop of foamed milk' },
  { name: 'Flat White', category: 'Espresso', description: 'Double espresso with velvety steamed milk' },
  { name: 'Cappuccino', category: 'Espresso', description: 'Espresso with steamed milk and thick foam' },
  { name: 'Red Eye', category: 'Espresso', description: 'Drip coffee with a shot of espresso' },
  { name: 'Espresso Tonic', category: 'Espresso', description: 'Espresso poured over tonic water and ice' },
  { name: 'Affogato', category: 'Espresso', description: 'Espresso poured over a scoop of gelato or ice cream' },

  // ─── Lattes ───────────────────────────────────────────
  { name: 'Latte', category: 'Latte', description: 'Espresso with steamed milk' },
  { name: 'Iced Latte', category: 'Latte', description: 'Espresso with cold milk over ice' },
  { name: 'Vanilla Latte', category: 'Latte', description: 'Latte with vanilla syrup' },
  { name: 'Caramel Latte', category: 'Latte', description: 'Latte with caramel syrup' },
  { name: 'Mocha', category: 'Latte', description: 'Espresso with chocolate and steamed milk' },
  { name: 'Iced Mocha', category: 'Latte', description: 'Mocha served cold over ice' },
  { name: 'White Mocha', category: 'Latte', description: 'Espresso with white chocolate and steamed milk' },
  { name: 'Lavender Latte', category: 'Latte', description: 'Latte with lavender syrup' },
  { name: 'Honey Latte', category: 'Latte', description: 'Latte sweetened with honey' },
  { name: 'Brown Sugar Oat Latte', category: 'Latte', description: 'Espresso with oat milk and brown sugar syrup' },
  { name: 'Pumpkin Spice Latte', category: 'Latte', description: 'Latte with pumpkin spice syrup' },
  { name: 'Dirty Chai Latte', category: 'Latte', description: 'Chai latte with a shot of espresso' },
  { name: 'Rose Latte', category: 'Latte', description: 'Latte with rose syrup' },
  { name: 'Pistachio Latte', category: 'Latte', description: 'Latte with pistachio flavor' },

  // ─── Matcha ───────────────────────────────────────────
  { name: 'Matcha Latte', category: 'Matcha', description: 'Ceremonial matcha with steamed milk' },
  { name: 'Iced Matcha Latte', category: 'Matcha', description: 'Matcha with cold milk over ice' },
  { name: 'Matcha Oat Latte', category: 'Matcha', description: 'Matcha with oat milk' },
  { name: 'Matcha Lemonade', category: 'Matcha', description: 'Matcha blended with fresh lemonade' },
  { name: 'Strawberry Matcha', category: 'Matcha', description: 'Matcha layered with strawberry milk' },
  { name: 'Dirty Matcha', category: 'Matcha', description: 'Matcha latte with a shot of espresso' },
  { name: 'Vanilla Matcha', category: 'Matcha', description: 'Matcha latte with vanilla syrup' },
  { name: 'Blueberry Matcha', category: 'Matcha', description: 'Matcha blended with blueberry' },

  // ─── Tea ──────────────────────────────────────────────
  { name: 'Chai Latte', category: 'Tea', description: 'Spiced black tea with steamed milk' },
  { name: 'Iced Chai Latte', category: 'Tea', description: 'Chai with cold milk over ice' },
  { name: 'London Fog', category: 'Tea', description: 'Earl Grey with vanilla and steamed milk' },
  { name: 'Green Tea', category: 'Tea', description: 'Classic brewed green tea' },
  { name: 'Black Tea', category: 'Tea', description: 'Classic brewed black tea' },
  { name: 'Earl Grey', category: 'Tea', description: 'Black tea with bergamot' },
  { name: 'Jasmine Tea', category: 'Tea', description: 'Green tea scented with jasmine' },
  { name: 'Oolong Tea', category: 'Tea', description: 'Semi-oxidized traditional tea' },
  { name: 'Thai Tea', category: 'Tea', description: 'Strong black tea with condensed milk and spices' },
  { name: 'Hibiscus Tea', category: 'Tea', description: 'Tart and floral herbal tea' },
  { name: 'Mint Tea', category: 'Tea', description: 'Refreshing brewed mint herbal tea' },

  // ─── Boba / Bubble Tea ────────────────────────────────
  { name: 'Classic Milk Tea', category: 'Boba', description: 'Black tea with milk and tapioca pearls' },
  { name: 'Taro Milk Tea', category: 'Boba', description: 'Taro-flavored milk tea with boba' },
  { name: 'Brown Sugar Boba', category: 'Boba', description: 'Fresh milk with brown sugar tapioca pearls' },
  { name: 'Mango Green Tea', category: 'Boba', description: 'Green tea with mango and boba' },
  { name: 'Passion Fruit Tea', category: 'Boba', description: 'Fruit tea with passion fruit and boba' },
  { name: 'Strawberry Milk Tea', category: 'Boba', description: 'Strawberry-flavored milk tea with boba' },
  { name: 'Oolong Milk Tea', category: 'Boba', description: 'Oolong tea with milk and tapioca' },
  { name: 'Matcha Boba', category: 'Boba', description: 'Matcha milk tea with tapioca pearls' },
  { name: 'Thai Tea Boba', category: 'Boba', description: 'Thai tea with boba pearls' },
  { name: 'Lychee Tea', category: 'Boba', description: 'Fruit tea with lychee and boba' },
  { name: 'Honeydew Milk Tea', category: 'Boba', description: 'Honeydew melon milk tea with boba' },

  // ─── Smoothies & Blended ──────────────────────────────
  { name: 'Mango Smoothie', category: 'Smoothie', description: 'Blended mango with yogurt or milk' },
  { name: 'Strawberry Banana Smoothie', category: 'Smoothie', description: 'Blended strawberry and banana' },
  { name: 'Açaí Smoothie', category: 'Smoothie', description: 'Blended açaí with mixed berries' },
  { name: 'Green Smoothie', category: 'Smoothie', description: 'Spinach, banana, and fruit blend' },
  { name: 'Peanut Butter Smoothie', category: 'Smoothie', description: 'Peanut butter, banana, and milk blend' },
  { name: 'Java Chip Frappé', category: 'Smoothie', description: 'Blended coffee with chocolate chips' },
  { name: 'Mocha Frappé', category: 'Smoothie', description: 'Blended mocha with ice and cream' },

  // ─── Specialty ────────────────────────────────────────
  { name: 'Horchata Latte', category: 'Specialty', description: 'Espresso with horchata (rice milk and cinnamon)' },
  { name: 'Golden Milk Latte', category: 'Specialty', description: 'Turmeric and spices with steamed milk' },
  { name: 'Ube Latte', category: 'Specialty', description: 'Purple yam latte with steamed milk' },
  { name: 'Charcoal Latte', category: 'Specialty', description: 'Activated charcoal with steamed milk' },
  { name: 'Beetroot Latte', category: 'Specialty', description: 'Beetroot powder with steamed milk' },
  { name: 'Blue Spirulina Latte', category: 'Specialty', description: 'Blue spirulina with coconut milk' },
  { name: 'Hojicha Latte', category: 'Specialty', description: 'Roasted Japanese green tea with steamed milk' },
  { name: 'Lemon Ginger Shot', category: 'Specialty', description: 'Fresh-pressed lemon and ginger wellness shot' },
  { name: 'Hot Chocolate', category: 'Specialty', description: 'Rich melted chocolate with steamed milk' },
];
