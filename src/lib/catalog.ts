export type Product = {
  id: string;
  name: string;
  category: "Kitchen" | "Travel" | "Home" | "Textile";
  price: number;
  blurb: string;
  details: string;
  stock: number;
  image: string;
};

export const POLICIES = {
  shipping:
    "Orders ship in 1–2 business days from Portland. Standard delivery is 3–6 business days inside the US. Free shipping on orders over $75. Alaska and Hawaii add 4–7 days.",
  returns:
    "Unused items can be returned within 30 days of delivery. Start a return with your order number (format FF-1042). Refunds go back to the original payment within 5 business days of the warehouse scan. Sale textiles are final sale.",
  orders:
    "Demo orders you can look up: FF-1042 (shipped, tracking 1Z9FF204), FF-1108 (processing, not yet scanned), FF-0981 (delivered last Tuesday).",
  care: "Stoneware is dishwasher safe. The merino throw should be cold-washed and laid flat. The lamp shade is linen — dust only, do not wash.",
};

export const PRODUCTS: Product[] = [
  {
    id: "carafe",
    name: "Walnut pour-over carafe",
    category: "Kitchen",
    price: 68,
    blurb: "Matte charcoal stoneware with a walnut collar. Holds 600 ml.",
    details: "Hand-thrown stoneware, food-safe matte glaze, walnut collar that unscrews for cleaning. Not for stovetop.",
    stock: 14,
    image: "/products/carafe.jpg",
  },
  {
    id: "duffel",
    name: "Olive weekender",
    category: "Travel",
    price: 148,
    blurb: "Waxed canvas duffel with vegetable-tanned straps. 32 liters.",
    details: "Fits a weekend of clothes plus shoes in the end pocket. Shoulder strap included. Wipe clean; do not machine wash.",
    stock: 7,
    image: "/products/duffel.jpg",
  },
  {
    id: "slippers",
    name: "Cream wool slippers",
    category: "Home",
    price: 54,
    blurb: "Boiled wool uppers, leather sole. Unisex sizes 5–12.",
    details: "Indoor use. Spot clean. Sizes run true; if between sizes, size up.",
    stock: 22,
    image: "/products/slippers.jpg",
  },
  {
    id: "lamp",
    name: "Brass desk lamp",
    category: "Home",
    price: 186,
    blurb: "Adjustable brass arm and a linen shade. Takes an E26 bulb.",
    details: "Cord is 1.8 m, inline switch. Bulb not included. Shade is not washable.",
    stock: 5,
    image: "/products/lamp.jpg",
  },
  {
    id: "plates",
    name: "Sand & moss plates",
    category: "Kitchen",
    price: 72,
    blurb: "Set of four stoneware dinner plates, mixed sand and moss glaze.",
    details: "26 cm. Dishwasher and microwave safe. Slight variation is intentional.",
    stock: 18,
    image: "/products/plates.jpg",
  },
  {
    id: "throw",
    name: "Merino throw",
    category: "Textile",
    price: 128,
    blurb: "Moss merino with a loose fringe. 130 × 180 cm.",
    details: "Cold wash, lay flat. Final sale if marked down. Made in a small mill in Vermont.",
    stock: 9,
    image: "/products/throw.jpg",
  },
];

export function formatCatalog(): string {
  return PRODUCTS.map(
    (p) =>
      `${p.name} (id ${p.id}) — $${p.price}, ${p.category}, stock ${p.stock}. ${p.blurb} ${p.details}`,
  ).join("\n");
}

export function localReply(question: string): string {
  const q = question.toLowerCase();

  const order = q.match(/ff-?\d{3,}/i);
  if (order || q.includes("order") || q.includes("tracking") || q.includes("where is")) {
    if (q.includes("1042")) {
      return "Order FF-1042 is shipped. Tracking number 1Z9FF204. Standard delivery is 3–6 business days inside the US.";
    }
    if (q.includes("1108")) {
      return "Order FF-1108 is still processing and has not been scanned by the carrier yet. It should ship within 1–2 business days.";
    }
    if (q.includes("0981")) {
      return "Order FF-0981 was delivered last Tuesday. If something is missing, start a return within 30 days of delivery.";
    }
    return POLICIES.orders;
  }

  if (q.includes("return") || q.includes("refund") || q.includes("exchange")) return POLICIES.returns;
  if (q.includes("ship") || q.includes("deliver")) return POLICIES.shipping;
  if (q.includes("care") || q.includes("wash") || q.includes("clean")) return POLICIES.care;

  const under = q.match(/under\s*\$?\s*(\d+)/);
  let pool = PRODUCTS;
  if (under) {
    const max = Number(under[1]);
    pool = PRODUCTS.filter((p) => p.price < max);
  } else {
    const hits = PRODUCTS.filter((p) => q.includes(p.name.toLowerCase()) || q.includes(p.id) || q.includes(p.category.toLowerCase()));
    if (hits.length) pool = hits;
  }

  if (q.includes("compare") || pool.length === 2 && q.includes("and")) {
    return pool
      .slice(0, 3)
      .map((p) => `${p.name}: $${p.price}. ${p.blurb} ${p.stock} in stock.`)
      .join("\n");
  }

  if (!pool.length) {
    return "Nothing in the catalog matches that budget. The slippers are $54, the carafe is $68, and plates are $72.";
  }

  const lines = pool.map((p) => `• ${p.name} — $${p.price}. ${p.blurb} (${p.stock} in stock)`);
  return `${under ? `Under $${under[1]}:\n` : "From the catalog:\n"}${lines.join("\n")}\n\n${POLICIES.shipping}`;
}