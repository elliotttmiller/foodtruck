// Customer-facing items and charged prices from website/UffDa Eats Menu Updated.pdf.
// Costs remain blank because the published menu does not provide a cost basis.
export const CUSTOMER_MENU_SEED_VERSION = 1;

export const CUSTOMER_MENU = [
  ['The Uff-Da', 'Entree', '14', 'Double smash, American, sauce, pickle, onion'],
  ['Single Smash', 'Entree', '11', 'Single patty, American, pickle, onion, sauce'],
  ['Beef Bacon Smash', 'Entree', '17', 'Double smash, beef bacon, American, house sauce'],
  ['The Northside', 'Entree', '15', 'Double smash, pepper jack, jalapeno, hot honey'],
  ['Classic Loaded Fries', 'Side', '12', 'Cheese sauce, beef bacon, sour cream, scallion'],
  ['Smash-Style Loaded Fries', 'Side', '15', 'Burger crumble, cheese, pickle, onion, sauce'],
  ['Buffalo Chicken Loaded Fries', 'Side', '14', 'Crispy chicken, buffalo, ranch, scallion; tots substitution +$1'],
  ['Hand-Cut Fries', 'Side', '6', ''],
  ['Tots', 'Side', '6', ''],
  ['Extra Sauce', 'Side', '1', ''],
  ['Wings — 8 pc', 'Entree', '14', 'Jumbo bone-in, fried crisp, hand-tossed; boneless available'],
  ['Wings — 12 pc', 'Entree', '20', 'Jumbo bone-in, fried crisp, hand-tossed; boneless available'],
  ['Wings — 18 pc', 'Entree', '28', 'Jumbo bone-in, fried crisp, hand-tossed; boneless available'],
  ['Wings — 24 pc', 'Entree', '35', 'Jumbo bone-in, fried crisp, hand-tossed; boneless available'],
  ['Meal Deal — Any Smash + Fries + Drink', 'Combo', '19', ''],
  ['Meal Deal — 8 Wings + Fries', 'Combo', '19', ''],
].map(([name, category, price, notes], index) => ({ id:`customer-menu-${index + 1}`, name, category, price, cost:'', active:'Yes', notes }));
