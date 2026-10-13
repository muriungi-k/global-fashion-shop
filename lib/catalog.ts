export type Product = {
    id: string;
    name: string;
    category: string;
    type: string;
    price: number;
    old: number;
    image: string;
    color: string;
    stock: number;
    fresh: boolean;
    audience?: "Boys" | "Girls" | "All";
};
export const photoAssets: Record<string, string> = {
    "photo-1617137968427-85924c800a22": "/images/ai/men-hero.webp",
    "photo-1598033129183-c4f50c736f10": "/images/ai/classic-shirt.webp",
    "photo-1515372039744-b8f02a3ae446": "/images/ai/summer-dress.webp",
    "photo-1556821840-3a63f95609a7": "/images/ai/everyday-hoodie.webp",
    "photo-1506629082955-511b1aa562c8": "/images/ai/linen-trousers.webp",
    "photo-1518611012118-696072aa579a": "/images/ai/activewear.webp",
    "photo-1543076447-215ad9ba6923": "/images/ai/denim-jacket.webp",
    "photo-1598554747436-c9293d6a588f": "/images/ai/linen-shirt.webp",
    "photo-1521572163474-6864f9cf17ab": "/images/ai/essential-tee.webp",
    "photo-1549298916-b41d501d3772": "/images/ai/sneakers.webp",
    "photo-1544816155-12df9643f363": "/images/ai/tote.webp",
    "photo-1511499767150-a48a237f0083": "/images/ai/sunglasses.webp",
    "photo-1473966968600-fa801b869a1a": "/images/ai/chino.webp",
    "photo-1539533018447-63fcce2678e3": "/images/ai/coat.webp",
    "photo-1588850561407-ed78c282e89b": "/images/ai/cap.webp",
    "photo-1434389677669-e08b4cac3105": "/images/ai/knit.webp",
    "photo-1483985988355-763728e1935b": "/images/ai/main-hero.webp",
    "photo-1516257984-b1b4d707412e": "/images/ai/men-style.webp",
    "photo-1441986300917-64674bd600d8": "/images/ai/boutique.webp",
    "photo-1471286174890-9c112ffca5b4": "/images/ai/kids-knit.webp"
};
export const localizeImage = (url: string) => { const id = url.match(/photo-[0-9a-z-]+/)?.[0]; return id && photoAssets[id] ? photoAssets[id] : url; };
export const photo = (id: string, _width = 800) => photoAssets[id] || `/images/ai/boutique.webp`;
export const hero = photo('photo-1483985988355-763728e1935b', 1600);
export const catalog: Product[] = [
    ['classic-shirt', 'Classic Fit Shirt', 'Men', 'Shirts', 42, 60, 'photo-1598033129183-c4f50c736f10', 'Black'],
    ['summer-dress', 'Floral Summer Dress', 'Women', 'Dresses', 68, 89, 'photo-1515372039744-b8f02a3ae446', 'Cream'],
    ['everyday-hoodie', 'Everyday Hoodie', 'Men', 'Hoodies', 55, 70, 'photo-1556821840-3a63f95609a7', 'Sage'],
    ['linen-trousers', 'Wide Leg Trousers', 'Women', 'Pants', 64, 80, 'photo-1506629082955-511b1aa562c8', 'Beige'],
    ['denim-jacket', 'Classic Denim Jacket', 'Men', 'Jackets', 89, 110, 'photo-1543076447-215ad9ba6923', 'Blue'],
    ['activewear', 'Everyday Activewear Set', 'Women', 'Activewear', 59, 75, 'photo-1518611012118-696072aa579a', 'Black'],
    ['linen-shirt', 'Linen Blend Shirt', 'Women', 'Shirts', 49, 49, 'photo-1598554747436-c9293d6a588f', 'Cream'],
    ['essential-tee', 'Essential Cotton Tee', 'Men', 'T-Shirts', 25, 25, 'photo-1521572163474-6864f9cf17ab', 'White'],
    ['sneakers', 'Clean White Sneakers', 'Unisex', 'Shoes', 79, 95, 'photo-1549298916-b41d501d3772', 'White'],
    ['tote', 'Everyday Canvas Tote', 'Unisex', 'Accessories', 32, 32, 'photo-1544816155-12df9643f363', 'Beige'],
    ['sunglasses', 'Weekend Sunglasses', 'Unisex', 'Accessories', 29, 40, 'photo-1511499767150-a48a237f0083', 'Black'],
    ['kids-knit', 'Little Explorer Tee', 'Kids', 'T-Shirts', 35, 45, 'photo-1471286174890-9c112ffca5b4', 'Red'],
    ['chino', 'Easy Chino Pants', 'Men', 'Pants', 59, 59, 'photo-1473966968600-fa801b869a1a', 'Beige'],
    ['coat', 'Tailored Wool Coat', 'Women', 'Jackets', 129, 160, 'photo-1539533018447-63fcce2678e3', 'Beige'],
    ['cap', 'Everyday Cap', 'Unisex', 'Accessories', 22, 22, 'photo-1588850561407-ed78c282e89b', 'Black'],
    ['knit', 'Soft Knit Sweater', 'Women', 'Knitwear', 65, 85, 'photo-1434389677669-e08b4cac3105', 'Cream']
].map((p, i) => ({ id: p[0] as string, name: p[1] as string, category: p[2] as string, type: p[3] as string, price: p[4] as number, old: p[5] as number, image: photo(p[6] as string), color: p[7] as string, stock: 20, fresh: i < 7 }));
const mensClothingTypes = new Set(['shirts', 't-shirts', 'hoodies', 'jackets', 'pants', 'polos', 'knitwear', 'suits', 'shorts', 'blazers']);
export const isMensClothing = (p: Product) => p.category.trim().toLowerCase() === 'men' && mensClothingTypes.has(p.type.trim().toLowerCase());
export function matchesCollection(p: Product, collection: string) {
    const key = collection.trim().toLowerCase();
    if (!key)
        return true;
    if (key === 'men')
        return isMensClothing(p);
    if (key === 'women')
        return isWomensClothing(p);
    if (key === 'kids')
        return isKidsClothing(p);
    if (key === 'unisex')
        return isUnisexClothing(p);
    if (key === 'boys' || key === 'girls')
        return isKidsClothing(p) && (!p.audience || p.audience === 'All' || p.audience.toLowerCase() === key);
    if (key === 'denim')
        return /\bdenim\b/i.test(p.name + ' ' + p.type);
    return p.type.trim().toLowerCase() === key;
}
const womensClothingTypes = new Set(['shirts', 't-shirts', 'hoodies', 'jackets', 'pants', 'polos', 'knitwear', 'suits', 'shorts', 'blazers', 'dresses', 'skirts', 'tops', 'leggings', 'activewear']);
export const isWomensClothing = (p: Product) => p.category.trim().toLowerCase() === 'women' && womensClothingTypes.has(p.type.trim().toLowerCase());
const clothingTypes = new Set([...mensClothingTypes, ...womensClothingTypes]);
export const isKidsClothing = (p: Product) => p.category.trim().toLowerCase() === 'kids' && clothingTypes.has(p.type.trim().toLowerCase());
export const isUnisexClothing = (p: Product) => p.category.trim().toLowerCase() === 'unisex' && clothingTypes.has(p.type.trim().toLowerCase());
export const getProductSizes = (p: Product) => p.category === 'Kids' ? ['2–3Y', '4–5Y', '6–7Y', '8–9Y', '10–11Y'] : p.type === 'Accessories' ? ['One size'] : ['XS', 'S', 'M', 'L', 'XL'];
export const getDefaultSize = (p: Product) => p.category === 'Kids' ? '4–5Y' : p.type === 'Accessories' ? 'One size' : 'M';
catalog.push({ id: 'boys-hoodie', name: 'Boys’ Everyday Hoodie', category: 'Kids', type: 'Hoodies', price: 32, old: 40, image: '/images/ai/boys-hoodie.webp', color: 'Sage', stock: 20, fresh: true, audience: 'Boys' }, { id: 'boys-shorts', name: 'Boys’ Easy Cotton Shorts', category: 'Kids', type: 'Shorts', price: 24, old: 24, image: '/images/ai/boys-shorts.webp', color: 'Blue', stock: 20, fresh: true, audience: 'Boys' }, { id: 'girls-dress', name: 'Girls’ Floral Day Dress', category: 'Kids', type: 'Dresses', price: 38, old: 48, image: '/images/ai/girls-dress.webp', color: 'Cream', stock: 20, fresh: true, audience: 'Girls' }, { id: 'girls-cardigan', name: 'Girls’ Soft Knit Cardigan', category: 'Kids', type: 'Knitwear', price: 34, old: 42, image: '/images/ai/girls-cardigan.webp', color: 'Cream', stock: 20, fresh: true, audience: 'Girls' }, { id: 'unisex-tee', name: 'Unisex Essential Cotton Tee', category: 'Unisex', type: 'T-Shirts', price: 25, old: 25, image: '/images/ai/essential-tee.webp', color: 'White', stock: 20, fresh: true }, { id: 'unisex-hoodie', name: 'Unisex Relaxed Hoodie', category: 'Unisex', type: 'Hoodies', price: 55, old: 70, image: '/images/ai/everyday-hoodie.webp', color: 'Sage', stock: 20, fresh: true }, { id: 'unisex-trousers', name: 'Unisex Relaxed Cotton Trousers', category: 'Unisex', type: 'Pants', price: 59, old: 59, image: '/images/ai/linen-trousers.webp', color: 'Beige', stock: 20, fresh: true });
